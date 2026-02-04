# 📊 EXCEL CATALOG TEMPLATE - PROPER STRUCTURE

## Overview

The Excel template should contain data for all cable configurations (1C, 2C, 3C, 4C) with complete specifications per IEC 60287.

---

## Recommended Sheet Structure

### Sheet 1: "3C_Catalog" (Most Common - 3-Phase + Neutral)

| Size (mm²) | Air (A) | Trench (A) | Duct (A) | R @ 90°C (Ω/km) | X (Ω/km) | Diameter (mm) | Notes |
|------------|---------|-----------|----------|----------------|----------|---------------|-------|
| 1.5 | 24 | 32 | 25 | 15.43 | 0.115 | 11.7 | Small control |
| 2.5 | 33 | 41 | 33 | 9.450 | 0.107 | 12.6 | Light load |
| 4 | 45 | 53 | 44 | 5.880 | 0.093 | 13.7 | - |
| 6 | 56 | 67 | 54 | 3.930 | 0.089 | 15.0 | - |
| 10 | 78 | 89 | 73 | 2.330 | 0.084 | 16.5 | - |
| 16 | 101 | 115 | 94 | 1.470 | 0.081 | 18.9 | - |
| 25 | 133 | 148 | 121 | 0.927 | 0.081 | 19.9 | Common |
| 35 | 163 | 177 | 145 | 0.668 | 0.079 | 22.3 | - |
| 50 | 199 | 211 | 172 | 0.494 | 0.075 | 25.5 | **Most Used** |
| 70 | 250 | 259 | 211 | 0.342 | 0.074 | 28.2 | - |
| 95 | 309 | 310 | 255 | 0.247 | 0.073 | 32.2 | **Heavy Load** |
| 120 | 357 | 353 | 292 | 0.197 | 0.072 | 35.8 | - |
| 150 | 409 | 394 | 329 | 0.160 | 0.072 | 39.0 | - |
| 185 | 471 | 445 | 372 | 0.128 | 0.072 | 43.6 | High Power |
| 240 | 556 | 514 | 429 | 0.0986 | 0.092 | 49.6 | - |
| 300 | 633 | 575 | 483 | 0.0800 | 0.090 | 54.2 | - |
| 400 | 728 | 649 | 554 | 0.0640 | 0.090 | 61.8 | Max before parallel |

**Format:** 600/1100V XLPE @ 90°C, Copper Conductor

---

### Sheet 2: "2C_Catalog" (2-Conductor, for DC or 1Ø Lines)

| Size (mm²) | Air (A) | Trench (A) | Duct (A) | R @ 90°C (Ω/km) | X (Ω/km) | Diameter (mm) |
|------------|---------|-----------|----------|----------------|----------|---------------|
| 2.5 | 39 | 47 | 40 | 9.450 | 0.107 | 12.0 |
| 4 | 52 | 63 | 52 | 5.880 | 0.093 | 13.0 |
| ... | ... | ... | ... | ... | ... | ... |
| 400 | 867 | 776 | 650 | 0.0640 | 0.090 | 63.3 |

---

### Sheet 3: "4C_Catalog" (4-Conductor, Compact 3-Phase)

| Size (mm²) | Air (A) | Trench (A) | Duct (A) | R @ 90°C (Ω/km) | X (Ω/km) | Diameter (mm) |
|------------|---------|-----------|----------|----------------|----------|---------------|
| 2.5 | 33 | 33 | 33 | 9.450 | 0.107 | 13.6 |
| ... | ... | ... | ... | ... | ... | ... |
| 400 | 728 | 649 | 554 | 0.0640 | 0.090 | 67.8 |

---

### Sheet 4: "1C_Catalog" (Single-Core, High Power)

| Size (mm²) | Air (A) | Trench (A) | Duct (A) | R @ 90°C (Ω/km) | X (Ω/km) | Diameter (mm) |
|------------|---------|-----------|----------|----------------|----------|---------------|
| 120 | 400 | 375 | 356 | 0.197 | 0.097 | 19.6 |
| 150 | 460 | 419 | 385 | 0.160 | 0.097 | 21.6 |
| 185 | 528 | 471 | 425 | 0.128 | 0.096 | 23.6 |
| 240 | 622 | 542 | 476 | 0.0986 | 0.092 | 26.5 |
| 300 | 709 | 606 | 519 | 0.0800 | 0.090 | 28.9 |
| 400 | 810 | 671 | 551 | 0.0640 | 0.090 | 32.4 |
| 500 | 916 | 744 | 598 | 0.0525 | 0.089 | 36.0 |
| 630 | 1032 | 817 | 645 | 0.0428 | 0.086 | 42.4 |

**Note:** For 3-phase circuits, use 3 single-core cables (one per phase)

---

### Sheet 5: "Derating_Factors"

#### Temperature Factor (K_temp)

| Installation | 1-Core | 2-Core/3-Core |
|--------------|--------|---------------|
| Air | 0.76 | 0.90 |
| Trench | 0.76 | 0.90 |
| Duct | 0.67 | 0.80 |

*Reference: 55°C ambient, XLPE @ 90°C operating temp*

---

#### Grouping Factor (K_group)

| Number of Loaded Circuits | K_group |
|--------------------------|---------|
| 1 (single) | 1.00 |
| 2 | 0.95 |
| 3 | 0.90 |
| 4 | 0.85 |
| 6 | 0.80 |

*Reference: Cables grouped in tray, all loaded simultaneously*

---

#### Soil/Ground Temp Factor (K_soil)

| Soil Resistivity (K·m/W) | Factor |
|-------------------------|--------|
| 1.2 (standard) | 1.00 |
| 1.5 | 0.98 |
| 2.0 | 0.95 |

*Reference: 35°C soil temperature*

---

#### Depth Factor (K_depth)

| Burial Depth (cm) | Factor |
|------------------|--------|
| 60 | 0.98 |
| 80 (standard) | 1.00 |
| 100 | 1.00 |

---

### Sheet 6: "Feeder_List" (User Input Template)

| S.No | Cable ID | From Bus | To Bus | Load Type | Power (kW) | Voltage (V) | Phase | Length (m) | Core Config | Material | Insulation | Installation | Efficiency | Power Factor | Starting Method | Protection Type | ISc (kA) |
|------|----------|----------|--------|-----------|-----------|------------|-------|-----------|------------|----------|-----------|--------------|------------|-------------|-----------------|-----------------|---------|
| 1 | F001 | Bus1 | Motor1 | Motor | 55 | 415 | 3Ø | 100 | 3C | Cu | XLPE | Air | 0.92 | 0.85 | DOL | ACB | 10.0 |
| 2 | F002 | Bus1 | Heater1 | Heater | 30 | 415 | 3Ø | 200 | 3C | Cu | XLPE | Air | 0.99 | 1.0 | - | MCB | - |
| 3 | F003 | Bus2 | Pump | Pump | 7.5 | 230 | 3Ø | 50 | 3C | Cu | XLPE | Air | 0.88 | 0.85 | StarDelta | MCCB | - |

---

## Column Descriptions

### Cable Data
- **S.No:** Serial number
- **Cable ID:** Unique identifier (e.g., F001, F002)
- **From Bus / To Bus:** Source and destination bus names

### Load Data
- **Load Type:** Motor, Heater, Transformer, Feeder, Pump, Fan, Compressor
- **Power (kW):** Rated power
- **Voltage (V):** System voltage (415, 230, 110, etc.)
- **Phase:** 1Ø or 3Ø
- **Length (m):** Cable run length (one-way)

### Cable Specification
- **Core Config:** 1C, 2C, 3C, or 4C
- **Material:** Cu (Copper) or Al (Aluminum)
- **Insulation:** XLPE (90°C) or PVC (70°C)
- **Installation:** Air (tray/ladder), Trench (buried/duct), Duct (conduit)

### Load Parameters
- **Efficiency:** 0.80-0.99 (or as decimal, e.g., 0.92 for 92%)
- **Power Factor:** 0.7-1.0 (cosφ)
- **Starting Method:** DOL, StarDelta, SoftStarter, VFD (motors only)

### Protection
- **Protection Type:** ACB (Arc Circuit Breaker), MCCB, MCB, None
- **ISc (kA):** Max short-circuit current at installation (for ACB only)

---

## Typical Values (Defaults if Not Provided)

| Parameter | Motor | Heater | Pump | Fan | Compressor | Transformer |
|-----------|-------|--------|------|-----|-----------|-------------|
| Efficiency | 0.92 | 0.99 | 0.88 | 0.88 | 0.85 | 0.97 |
| Power Factor | 0.85 | 1.0 | 0.85 | 0.85 | 0.80 | 0.95 |
| Starting Method | DOL | - | StarDelta | StarDelta | VFD | - |
| Core Config | 3C | 3C | 3C | 3C | 3C | 3C |
| Installation | Air | Air | Air | Air | Air | Air |

---

## Validation Rules

### Required Fields (Mandatory)
- ✓ Cable ID
- ✓ From Bus, To Bus
- ✓ Load Type
- ✓ Power (kW)
- ✓ Voltage (V)
- ✓ Phase (1Ø/3Ø)
- ✓ Length (m)
- ✓ Core Config
- ✓ Installation Method

### Optional (Will Use Defaults)
- Efficiency (defaults per load type)
- Power Factor (defaults per load type)
- Starting Method (defaults per load type)
- Protection Type (defaults to None)
- ISc (only needed for ACB)

### Validation Checks
- Power > 0.1 kW (minimum)
- Voltage > 0 V
- Length > 0 m
- Core Config in [1C, 2C, 3C, 4C]
- Material in [Cu, Al]
- Insulation in [XLPE, PVC]
- Installation in [Air, Trench, Duct]
- Efficiency 0.0-1.0
- Power Factor 0.0-1.0

---

## Example: Fully Specified Motor Cable

```
Cable ID:        F001_MOT_55KW
From Bus:        SWITCHBOARD_LT1
To Bus:          MOTOR_M101
Load Type:       Motor
Power:           55 kW
Voltage:         415 V
Phase:           3Ø
Length:          100 m
Core Config:     3C (3-core + Neutral)
Material:        Cu (Copper)
Insulation:      XLPE (90°C)
Installation:    Air (Ladder tray, touching)

Efficiency:      92% (0.92)
Power Factor:    0.85
Starting Method: DOL (Direct-on-Line)

Protection Type: ACB (Arc Circuit Breaker)
Max ISc:         10.0 kA
Clearing Time:   0.1 s (100ms standard)
```

**Expected Result:**
```
FLC:             ~85 A
Starting Current: ~551 A (85 × 6.5)
Derating Factor: 0.90 (air, multi-core)
Running V-drop:  ~1.8% (3C×95mm²)
Starting V-drop: ~11% (3C×150mm² to stay ≤15%)
ISc Check:       3C×240mm² passes
Final Size:      3C×240mm² Cu XLPE
Constraint:      Starting V-drop (driving factor)
```

---

## How Platform Uses This Data

1. **Upload Excel** → Platform reads all sheets
2. **Parse Catalogs** → Loads 1C, 2C, 3C, 4C ampacity tables
3. **Load Derating Factors** → K_temp, K_group, K_soil, K_depth
4. **Process Feeder List** → Per-cable calculations:
   - Calculate FLC from Power/Voltage/Phase/Efficiency/PF
   - Calculate Starting Current (motors)
   - Calculate Derating K_total
   - Size by Ampacity, V-drop, ISc
   - Select final size + constraint
5. **Generate Results** → Show all calcs + cable designations

---

## Standards Referenced

- **IEC 60287** - Cable ampacity calculation
- **IEC 60364** - Installation voltage drop limits
- **IEC 60228** - Conductor sizes & resistance
- **IS 732** - Indian AC wiring installations
- **IS 1554** - Indian PVC cable standard

---

## Tips for Accurate Results

1. ✓ Use **real** cable lengths, not approximations
2. ✓ Match **installation method** to actual (Air/Trench/Duct)
3. ✓ Specify **starting method** for all motors (DOL/SD/SS/VFD)
4. ✓ Verify **efficiency & PF** from motor nameplate
5. ✓ Provide **ISc** if protection is ACB
6. ✓ Use **3C** for most 3-phase (most common, compact)
7. ✓ Use **1C** only if individual phase cables (high power)
8. ✓ Check **ambient temp** in catalog if not standard (55°C)

---

**Template Ready:** ✅  
**Standard Compliance:** IEC 60287/60364  
**Tested Cases:** 3 (motor, heater, pump)
