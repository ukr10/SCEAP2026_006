# 📖 GUIDE TO KEY FILES - CABLE SIZING IMPLEMENTATION

## Quick Navigation

If you want to understand the implementation, read these files in order:

### 1. START HERE → Overview Documents

| File | Purpose | Read Time |
|------|---------|-----------|
| [COMPLETE_RECONSTRUCTION_REPORT.md](COMPLETE_RECONSTRUCTION_REPORT.md) | Full technical breakdown with examples | 20 min |
| [CABLE_SIZING_QUICK_FIX.md](CABLE_SIZING_QUICK_FIX.md) | Quick reference of what was fixed | 5 min |
| [CABLE_SIZING_FIXES_V3.md](CABLE_SIZING_FIXES_V3.md) | Detailed changes and features | 15 min |

### 2. IMPLEMENTATION → Core Code Files

| File | Purpose | Key Content |
|------|---------|-------------|
| [sceap-frontend/src/utils/CableSizingEngine_V2.ts](sceap-frontend/src/utils/CableSizingEngine_V2.ts) | Main sizing engine with 10-step algorithm | Calculation methods, formulas |
| [sceap-frontend/src/components/ResultsTab.tsx](sceap-frontend/src/components/ResultsTab.tsx) | Results page showing cable sizing outputs | Display logic, field mapping |
| [sceap-frontend/src/utils/CableEngineeringData.ts](sceap-frontend/src/utils/CableEngineeringData.ts) | Catalog tables and derating factors | All ampacity data |
| [sceap-frontend/src/utils/pathDiscoveryService.ts](sceap-frontend/src/utils/pathDiscoveryService.ts) | Cable segment interface definitions | Input data structure |

### 3. REFERENCE → Standards & Templates

| File | Purpose | Read When |
|------|---------|-----------|
| [EXCEL_TEMPLATE_SPECIFICATION.md](EXCEL_TEMPLATE_SPECIFICATION.md) | Excel input format | Setting up data |
| [sceap-frontend/test-engine-v3.js](sceap-frontend/test-engine-v3.js) | Test case definitions | Testing the engine |

---

## 🎯 By Use Case

### "I want to understand how cables are sized"
**Read in order:**
1. CABLE_SIZING_QUICK_FIX.md (overview)
2. COMPLETE_RECONSTRUCTION_REPORT.md (full details with examples)
3. CableSizingEngine_V2.ts (actual code)

### "I need to debug wrong cable sizes"
**Check:**
1. Was derating factor calculated? (K_total = K_temp × K_group × K_soil × K_depth)
2. Was voltage drop checked properly? (both running and starting)
3. Was ISc constraint applied? (if ACB protection)
4. What driving constraint is shown? (Ampacity/RunningVdrop/StartingVdrop/ISc)

**Code reference:**
- `calculateDeratingComponents()` in CableSizingEngine_V2.ts
- `findSizeByRunningVdrop()` and `findSizeByStartingVdrop()`
- `findSizeByISc()`

### "I need to add custom derating factors"
**Modify:**
1. CableEngineeringData.ts → DeratingTables section
2. Or upload custom Excel with derating sheets

**Code reference:**
- `calculateDeratingComponents()` method
- DeratingTables.temperature_factor, grouping_factor, etc.

### "I need to change voltage drop limits"
**Modify:**
1. CableSizingEngine_V2.ts → `getVoltageLimits()` method
2. Or adjust per load type

**Current limits:**
- Motors: 3% running, 10-15% starting
- Heaters: 5% (no starting)
- Others: 5%

### "I need to add more cable sizes to catalog"
**Modify:**
1. CableEngineeringData.ts → AmpacityTables
2. Add new size entry with Air/Trench/Duct ratings

**Format:**
```typescript
'95': {
  air: 309,
  trench: 310,
  duct: 255,
  resistance_90C: 0.247,
  reactance: 0.073,
  cableDia: 32.2
}
```

### "I need to verify calculations manually"
**Use the example in:**
- COMPLETE_RECONSTRUCTION_REPORT.md → "Calculation Example" section
- Shows full 10-step calculation with actual numbers

---

## 📊 Data Flow

```
User Input (Excel)
         ↓
     [pathDiscoveryService.ts]
     CableSegment interface
         ↓
ResultsTab.tsx
  ├─ Calls CableSizingEngine_V2
  └─ Maps outputs to display
         ↓
CableSizingEngine_V2.ts
  ├─ calculateFLC()
  ├─ calculateStartingCurrent()
  ├─ calculateDeratingComponents()
  ├─ findSizeByAmpacity()
  ├─ findSizeByRunningVdrop()
  ├─ findSizeByStartingVdrop()
  ├─ findSizeByISc()
  └─ Result object
         ↓
CableEngineeringData.ts
  ├─ AmpacityTables (1C, 2C, 3C, 4C)
  ├─ DeratingTables
  ├─ MotorStartingMultipliers
  ├─ VoltageLimits
  ├─ ShortCircuitData
  └─ LoadTypeSpecs
         ↓
Results Page Display
  ├─ FLC, Starting Current
  ├─ K_total and components
  ├─ Size by each constraint
  ├─ Final cable size
  └─ Driving constraint
```

---

## 🔍 Method-by-Method Guide

### CableSizingEngine_V2.ts Methods

#### `calculateFLC()`
```typescript
// Calculates running full load current
// Input: Power (kW), Voltage (V), Efficiency, Power Factor
// Output: Current (A)

// 3-Phase: I = (P × 1000) / (√3 × V × cosφ × η)
// 1-Phase: I = (P × 1000) / (V × cosφ × η)
```

#### `calculateStartingCurrent(flc, method)`
```typescript
// Calculates starting inrush current (motors only)
// Method: 'DOL'|'StarDelta'|'SoftStarter'|'VFD'

// Returns: flc × multiplier
//  DOL:        6.5× (worst case)
//  StarDelta:  2.5× (better)
//  SoftStarter: 3×
//  VFD:        1.1× (minimal)
```

#### `calculateDeratingComponents()`
```typescript
// Returns K_total = K_temp × K_group × K_soil × K_depth
// Each factor from lookup tables based on:
// - Installation method (Air/Trench/Duct)
// - Number of loaded circuits (grouping)
// - Soil properties (buried cables)
// - Depth of laying
```

#### `findSizeByAmpacity(requiredCurrent)`
```typescript
// Finds smallest cable size where:
// I_catalog × K_total ≥ I_FL
//
// Input: requiredCurrent = I_FL / K_total
// Output: Conductor area (mm²)
//
// Searches catalog until rating ≥ required
```

#### `findSizeByRunningVdrop(flc)`
```typescript
// Finds smallest size where running V-drop ≤ limit
// 
// Limit: 3% (motors), 5% (others)
//
// Formula:
//   VD = (√3 × I × L × R) / 1000  (3-phase)
//   VD = (I × L × R) / 1000        (1-phase)
//
// VD% = (VD / V) × 100
```

#### `findSizeByStartingVdrop(iStart)`
```typescript
// Finds smallest size where starting V-drop ≤ limit
// (Motors only)
//
// Limit: 15% (DOL), 10% (StarDelta), 5% (VFD)
//
// Same formula as running, but with I_start
```

#### `findSizeByISc(isc_kA)`
```typescript
// Finds smallest size where short-circuit
// withstand Isc ≤ k × A × √t
//
// Rearranged: A ≥ Isc / (k × √t)
//
// k constants (at 90°C):
//   Cu XLPE: 143
//   Cu PVC:  115
//   Al XLPE: 94
//   Al PVC:  76
//
// t: protection clearing time (default 0.1s)
```

---

## 📋 CableEngineeringData.ts Structure

### Section 1: ConductorDatabase
- Copper resistance @ 20°C (1-630 mm²)
- Aluminum resistance @ 20°C
- Reactance single-core (air touching, spaced, buried)
- Temperature coefficients

### Section 2: AmpacityTables
- 4 configurations: 1C, 2C, 3C, 4C
- Each size includes: air/trench/duct ratings, R, X, diameter
- Standard: IEC 60287, per manufacturer 600/1100V XLPE @ 90°C

### Section 3: DeratingTables
- Temperature factor (K_temp)
- Grouping factor (K_group)
- Soil temperature factor (K_soil)
- Depth factor (K_depth)

### Section 4: MotorStartingMultipliers
- DOL: 6.5×
- StarDelta: 2.5×
- SoftStarter: 3.0×
- VFD: 1.1×

### Section 5: VoltageLimits
- Running: 3% (motors), 5% (others)
- Starting: 15% (DOL), 10% (StarDelta/SoftStarter), 5% (VFD)

### Section 6: ShortCircuitData
- Material constants k (Cu, Al, XLPE, PVC)
- Protection clearing times

### Section 7: LoadTypeSpecs
- Efficiency ranges (Motor, Heater, Pump, Fan, etc.)
- Power factor ranges
- Starting method defaults

---

## 🧪 Test Cases

See test-engine-v3.js for 3 example scenarios:
1. Motor 55kW, 3-phase, 100m → Started V-drop driving
2. Heater 30kW, 3-phase, 200m → Running V-drop driving
3. Pump Motor 7.5kW, 3-phase, 50m → Ampacity driving

Each shows expected inputs and constraints.

---

## ⚙️ Configuration

### User-Configurable (per cable)
- Power, Voltage, Length
- Core config (1C/2C/3C/4C)
- Material (Cu/Al), Insulation (XLPE/PVC)
- Installation (Air/Trench/Duct)
- Efficiency, Power Factor
- Starting method (motors)
- Protection type, ISc, clearing time

### Defaults (in LoadTypeSpecs)
- Efficiency per load type
- Power factor per load type
- Starting method per load type

### Fixed (per standard)
- Ampacity ratings (from tables)
- Resistance/Reactance (from tables)
- Derating factors (from tables)
- V-drop limits (IEC 60364)
- ISc constants (IEC 60287)

---

## 🚀 Typical Workflow

1. **Create Excel** with feeder list (see EXCEL_TEMPLATE_SPECIFICATION.md)
2. **Upload to SCEAP** → Platform reads Excel
3. **Engine processes** each cable:
   - Selects catalog (1C/2C/3C/4C)
   - Calculates all sizes
   - Picks maximum
   - Checks parallel runs
4. **Results page** shows:
   - All constraint sizes
   - Final cable
   - Driving constraint
   - Full designation
5. **Verify** each cable (check V-drop, ISc, cores)
6. **Export** results (Excel/PDF)

---

## ❓ FAQs

**Q: Why is my motor cable so large?**
A: Probably driven by starting voltage drop. Check `voltageDropStarting_percent` field.

**Q: What's this "Driving Constraint" field?**
A: Shows which constraint gave the largest cable: Ampacity/RunningVdrop/StartingVdrop/ISc.

**Q: Can I change V-drop limits?**
A: Yes, modify `getVoltageLimits()` in CableSizingEngine_V2.ts per IEC or local standard.

**Q: What if I need aluminum cables?**
A: Set Material='Al' in Excel. ISc constant will auto-change to Al XLPE=94.

**Q: How do parallel runs work?**
A: If single cable > 300mm² Cu, engine suggests 2 parallel smaller cables. Same length/size required.

**Q: Is this really per IEC standard?**
A: Yes, all formulas from IEC 60287/60364/IS 732. See references in documents.

---

## 📞 Technical Support

**For calculation questions:**
1. Check COMPLETE_RECONSTRUCTION_REPORT.md example
2. Compare your input/output with worked example
3. Verify derating components K_temp, K_group, K_soil, K_depth

**For code questions:**
1. Check method signatures in CableSizingEngine_V2.ts
2. Trace through data flow diagram
3. Look at actual formula vs expected

**For catalog questions:**
1. Check AmpacityTables in CableEngineeringData.ts
2. Verify Air/Trench/Duct ratings exist
3. If missing, add new size entry with proper R/X values

---

**Version:** 3.0 (EPC-Grade)  
**Last Updated:** Feb 3, 2026  
**Status:** ✅ Production Ready
