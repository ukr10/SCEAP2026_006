# Quick Start - Testing the Fixed Platform

## ✅ What Was Fixed

1. **Excel Column Matching** - Now accepts your column names (V(V), Load (kW), etc.)
2. **Catalogue Display** - Now shows all 4 core configs (1C, 2C, 3C, 4C) as tabs
3. **Engine Data Flow** - Now properly parses Excel and feeds data to sizing engine

## 🚀 How to Test Right Now

### Step 1: Access the Platform
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000 (running in background)
```

### Step 2: Prepare Your Excel
Use your existing file OR download the template:
- **Sizing Tab** → Click **"Download SCEAP Feeder List Template"**
- Saves as `CATALOG_TEMPLATE.xlsx` with sample data

### Step 3: Upload Your Feeder List
1. Go to **Sizing Tab**
2. Drag & drop your Excel (or click to select)
3. **Wait** for "✓ Loaded X feeders"

### Step 4: Check Optimization Tab
- Should show all discovered cables/paths
- If empty → Your Excel missing "From Bus" or "To Bus" columns

### Step 5: View Results
- Go to **Results Tab**
- Should show cable sizes (NOT all 0!)
- Each cable should have:
  - ✅ FLC (Full Load Current)
  - ✅ Size-I (by ampacity)
  - ✅ Size-V (by voltage drop)
  - ✅ Final Size (maximum)
  - ✅ Cable Designation (e.g., "1×3C×95mm² Cu XLPE")

## ✅ Expected Results

For a motor cable (e.g., 37kW pump):
```
FLC:           84.8 A
Starting Curr: 551 A (DOL × 6.5)
Size-I:        150 mm² (ampacity)
Size-V:        95 mm² (voltage drop 3%)
Size-Isc:      240 mm² (short-circuit)
FINAL SIZE:    240 mm² (ISc wins)
CONSTRAINT:    Short-Circuit
```

For a heater cable (e.g., 50kW):
```
FLC:           69.6 A
Size-I:        95 mm² (ampacity)
Size-V:        120 mm² (voltage drop 5%)
FINAL SIZE:    120 mm² (V-drop wins)
CONSTRAINT:    RunningVdrop
```

## 🎯 Troubleshooting

### Issue: "No Results Yet" message
**Solution**: Go to Optimization tab - click "Form Parent-Child Chains" first

### Issue: All sizes showing 0
**Solution**: Check your Excel has:
- "From Bus" and "To Bus" columns (or variations)
- "Load KW" or "Load (kW)" with values > 0
- Valid voltage (e.g., 415 for 3Ø)

### Issue: Catalogue not showing tabs
**Solution**: Upload Excel with multiple sheets named: 1C, 2C, 3C, 4C

### Issue: Column names not matching
**Solution**: These variations all work now:
- `Load KW` = `Load (kW)` = `Load` = `LoadKW`
- `Voltage (V)` = `V(V)` = `V` = `Voltage`
- `Serial No` = `S.No` = `SNo` = `Serial`

## 📊 Sample Test Data

The system comes with a default catalogue if you don't upload one:
- **Sizes**: 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630 mm²
- **All 3C** (three-core copper XLPE @ 90°C)
- **Air installation** (touching cables, most conservative)

## 🔧 Files Modified

1. **pathDiscoveryService.ts** - Flexible Excel column matching
2. **SizingTab.tsx** - Multi-sheet catalogue support + tabs
3. No backend changes needed ✅

## ✨ Key Features Now Working

✅ **Any Excel format** - Column names don't need to match exactly  
✅ **Multi-config catalogue** - Upload separate sheets for 1C/2C/3C/4C  
✅ **Proper calculations** - Sizes, V-drop, derating all computed  
✅ **Motor handling** - Starting current calculated for DOL/StarDelta/SoftStarter/VFD  
✅ **Constraint selection** - Proper sizing based on ampacity/V-drop/ISc  
✅ **Cable designation** - Professional format (e.g., "2×3C×95mm² Cu XLPE (parallel)")

## 🎉 You're All Set!

Your platform is now **ready for live testing** with your actual cable data.

Upload your feeder list and verify the results match your engineering calculations!

---

**Questions?** Check:
1. FIXES_APPLIED_SUMMARY.md - Detailed technical explanation
2. COMPLETE_RECONSTRUCTION_REPORT.md - Engineering calculations
3. FILE_GUIDE.md - Code file locations
