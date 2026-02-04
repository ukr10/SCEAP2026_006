# Debugging Cable Sizing Results

## What Was Fixed

### ✅ Catalogue Table Empty Issue
**Problem**: Uploaded catalogue showed tabs (1C, 2C, 3C, 4C) but table had no data rows

**Root Cause**: Excel parser wasn't mapping column names correctly
- Excel has `Size (mm²)`, `Air Rating (A)`, `Resistance @ 90°C (Ω/km)`
- Parser expected `size`, `current`, `resistance`

**Solution Applied**: 
Added flexible column name mapping in catalogue parser:
- `Size (mm²)` → `size`
- `Air Rating (A)`, `Current (A)`, `current` → `current`
- `Resistance (Ω/km)`, `Resistance @ 90°C (Ω/km)` → `resistance`
- `Reactance (Ω/km)`, `Reactance` → `reactance`

Now catalogue table should display data properly!

---

## Why Cable Sizes Still Show 0

The sizes are 0 because one of these is happening:

### Issue #1: Cable Load Data Not Flowing Through
**Check**: Open browser DevTools (F12) → Console tab
- Look for `[DEBUG] Cable` messages
- Check if `loadKW` value shows 0 or actual number
- If 0 → Excel column matching still failing for Load column

**Solution**: Verify Excel has one of these column names:
- `Load KW`
- `Load (kW)`  
- `Load`
- `LoadKW`

### Issue #2: Engine Not Calculating  
**Check**: In Console, look for `[DEBUG] Engine result` messages
- Check if `sizeByAmpacity` is 0
- Check if `selectedConductorArea` is 0
- If all 0 → Engine error or no catalog access

**What it should show**:
```
[DEBUG] Engine result for FDR-MAIN-002:
{
  fullLoadCurrent: 123.4,
  sizeByAmpacity: 70,
  sizeByRunningVdrop: 95,
  sizeByISc: 0,
  selectedConductorArea: 95,
  drivingConstraint: "RunningVdrop",
  status: "APPROVED"
}
```

### Issue #3: Excel Not Parsed at All
**Check**: Go to Optimization Tab
- Does it show cables discovered?
- Does it show path chain?
- If empty → Excel column matching needs fixing

**Solution**: Verify "From Bus" and "To Bus" columns exist with data

---

## How to Manually Test

### Step 1: Download Template
1. Go to **Sizing Tab**
2. Click **"Download Catalog Template"**
3. Excel file saves as `CATALOG_TEMPLATE.xlsx`

### Step 2: Edit Template (Add Feeders)
The template has example feeders. Replace with your data or keep examples.

**Required columns in feeder sheet (Sheet named "Feederlist" or similar)**:
```
Serial No | Cable Number | Feeder Description | From Bus | To Bus | Voltage (V) | Load KW | Length (m) | ...
1         | INC-MAIN-001 | MAIN PANEL         | TRANS    | MAIN   | 415         | 0       | 5          | ...
2         | FDR-002      | UPS Feeder         | UPS-PAN  | MAIN   | 415         | 85      | 45         | ...
```

### Step 3: Upload to SCEAP
1. Go to **Sizing Tab**
2. Drag feederlist Excel → Should say "✓ Loaded X feeders"
3. **Wait** for "✓ Path analysis complete!"
4. Go to **Optimization Tab** → Should see cables
5. Go to **Results Tab** → Should see sizes

### Step 4: Check Browser Console
1. Open DevTools: F12
2. Go to **Console** tab
3. Look for `[DEBUG]` messages
4. Check values in debug output

---

## Troubleshooting Checklist

```
[ ] 1. Excel has "From Bus" and "To Bus" columns with data
[ ] 2. Excel has "Load KW" (or "Load (kW)") with values > 0
[ ] 3. Excel has "Voltage (V)" (or "V", "V(V)") with values
[ ] 4. Excel has "Length (m)" (or "L (m)", "L") with values > 0
[ ] 5. Optimization Tab shows cables discovered
[ ] 6. Console shows [DEBUG] messages (no errors)
[ ] 7. Console shows engine results with non-zero sizes
[ ] 8. Results Tab shows cable designations
```

If any checkbox fails → That's the issue

---

## Expected Debug Output

### Good Output (Sizes Calculate):
```javascript
[DEBUG] Cable FDR-002:
{
  loadKW: 85,
  voltage: 415,
  length: 45,
  powerFactor: 0.95,
  efficiency: 0.97
}

[DEBUG] Engine result for FDR-002:
{
  fullLoadCurrent: 123.4,
  sizeByAmpacity: 70,
  sizeByRunningVdrop: 95,
  sizeByISc: 0,
  selectedConductorArea: 95,
  drivingConstraint: "RunningVdrop"
}
```

### Bad Output (Sizes = 0):
```javascript
[DEBUG] Cable FDR-002:
{
  loadKW: 0,  // ← PROBLEM! Should be 85
  voltage: 415,
  length: 45,
  ...
}

[DEBUG] Engine result for FDR-002:
{
  fullLoadCurrent: 0.0576,  // ← Too small, using fallback 0.1kW
  sizeByAmpacity: 1.5,       // ← Tiny size!
  ...
}
```

---

## Next Steps

1. **Test with Console Logging**:
   - Upload your Excel
   - Open DevTools (F12)
   - Look at Console messages
   - Share the output

2. **If Sizes Still 0**:
   - Check the debug output (which column is failing?)
   - Adjust Excel column names to match system expectations
   - Re-upload and check console again

3. **If Catalogue Empty**:
   - Download template again
   - Don't edit structure, just replace data values
   - Re-upload catalogue
   - Check if table now shows rows

---

## Code Changes Made This Session

### File: SizingTab.tsx
- Added flexible column mapping for catalogue Excel parsing
- Now accepts: `Size (mm²)`, `Current (A)`, `Air Rating (A)`, etc.
- Maps all variations to standard fields: `size`, `current`, `resistance`, `reactance`

### File: ResultsTab.tsx  
- Added console logging with `[DEBUG]` prefix
- Logs: incoming cable data (loadKW, voltage, etc.)
- Logs: engine output (sizes, constraints, status)
- Helps identify where data is lost or miscalculated

---

## Files to Check

1. **SizingTab.tsx** - Catalogue upload parsing (line ~440)
2. **ResultsTab.tsx** - Cable sizing calculation (line ~90)
3. **CableSizingEngine_V2.ts** - Sizing calculations
4. **CableEngineeringData.ts** - Catalog data definitions
5. **pathDiscoveryService.ts** - Excel normalization

---

## Questions to Ask

**If sizes are still 0**:
1. What does the Excel column headers look like? (Send screenshot)
2. What values are in the Load column? (Numeric or text?)
3. Do the debug messages show in browser console?
4. What do the debug messages show for loadKW value?

**Answer these and we can pinpoint the exact issue!**
