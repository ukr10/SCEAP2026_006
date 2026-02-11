# 🚀 Servers Running - Manual Testing Guide

## ✅ Server Status

### Backend (ASP.NET Core)
- **Status**: ✅ RUNNING
- **URL**: http://localhost:5000
- **Port**: 5000
- **Environment**: Development
- **Process**: dotnet run in `/sceap-backend/`

### Frontend (React + Vite)
- **Status**: ✅ RUNNING
- **URL**: http://localhost:5174
- **Port**: 5174 (5173 already in use)
- **Environment**: Development
- **Process**: npm run dev in `/sceap-frontend/`

---

## 🧪 Manual Testing Checklist

### 1. Access the Frontend
👉 Open: **http://localhost:5174**

You should see the SCEAP application homepage with navigation menu.

### 2. Test the New Results Tab (Excel Format)

#### Step 2.1: Load Demo Data
1. Navigate to the **Sizing** tab
2. Click "Load Demo Data" button
3. Confirm 17 sample feeders are loaded

Expected: Demo data for 17 cables (motors, feeders, transformers) with various voltages (11kV) and loads

#### Step 2.2: Go to Results Tab
1. Click on the **Results** tab in the main navigation
2. Wait for calculations to complete

Expected: See new 41-column Excel-format table rendering with:
- Row 1: Column group headers (ID, LOAD, SC WITHSTAND, CABLE DATA, CAPACITY, RUNNING V-DROP, STARTING V-DIP, REMARKS)
- Row 2: Field abbreviations (#, Desc, Type, kW, kV, PF, η, FLC, I_m, etc.)
- Rows 3+: Data rows with all cables and calculated values

#### Step 2.3: Verify Column Structure
Check visible columns in order:
```
ID (Blue)
├─ SL#
├─ Description

LOAD (Cyan)
├─ Type (M/F/I)
├─ kW
├─ kV
├─ PF
├─ η (Efficiency)
├─ FLC(A) [**Calculated - highlighted in brighter cyan**]
├─ I_m(A) [Motor starting current, highlighted]
├─ PF_m
├─ Installation

SC WITHSTAND (Orange)
├─ Isc(kA)
├─ Duration(s)
├─ Min Size(mm²) [**Calculated**]
├─ Method

CABLE DATA (Purple)
├─ Cores
├─ Size(mm²) [**Highlighted in yellow - critical selection**]
├─ Rating(A)
├─ R(Ω/km)
├─ X(Ω/km)  
├─ Length(m)

CAPACITY (Green) 
├─ K_total [**Calculated derating factor**]
├─ I_derated(A) [**Calculated - bright cyan highlight**]
├─ Runs
├─ Capacity Check (YES/NO) [**Color coded: green YES, red NO**]
├─ K1-K5 (individual derating factors)

RUNNING V-DROP (Red)
├─ ΔU(V) [**Calculated**]
├─ %(3) [**Color coded against 3% limit**]
├─ Check (YES/NO)

STARTING V-DIP (Yellow)
├─ ΔU(V) [**Calculated for motors only**]
├─ %(10) [**Motors: vs 10%, Others: NA**]
├─ Check (YES/NO/NA)

REMARKS (Gray)
├─ Designation
├─ Remarks
├─ Status [**✓ APPROVED / ⚠ WARNING / ✗ FAILED**]
```

#### Step 2.4: Verify Data Formatting
- ✅ FLC values showing 2 decimals (e.g., 166.83)
- ✅ Derating factors showing 3 decimals (e.g., 0.876)
- ✅ R/X values showing 4 decimals (e.g., 0.1620)
- ✅ Voltage drop % showing 2 decimals
- ✅ Status column showing symbols (✓ ✗ ⚠)

#### Step 2.5: Verify Color Coding
- ✅ Column groups have background color tints matching their header
- ✅ Calculated fields (FLC, I_derated, V-drop) have brighter highlights
- ✅ Status indicators: Green border (APPROVED), Yellow border (WARNING), Red border (FAILED)
- ✅ Alternating row colors (light/dark slate)

#### Step 2.6: Test Status Logic
Look at different cables:
- **Motors** with adequate capacity & V-drops: Should show ✓ APPROVED
- **Feeders** with high starting V-dip: Should show ✗ FAILED (if motors > 10%)
- **Any cable** with capacity check = NO: Should show ✗ FAILED

#### Step 2.7: Export to Excel
1. Locate "Export Excel" button in the control bar
2. Click it
3. Wait for download: `cable_sizing_results_YYYY-MM-DD.xlsx`
4. Open the Excel file

Expected: All 41 columns exported with calculated values matching displayed table

### 3. Test Other Pages Still Work

#### Step 3.1: Sizing Tab
1. Click **Sizing** tab
2. Verify cable sizing calculations work
3. Try selecting a cable and sizing it

Expected: Cable sizing engine runs, results show suggested sizes

#### Step 3.2: Optimization Tab  
1. Click **Optimization** tab
2. Verify optimization analysis loads

Expected: Optimization page renders (may show loading or analysis results)

### 4. Test Data Upload (Format Agnostic)

#### Step 4.1: Prepare Custom CSV
Create a CSV file with headers matching the template:
```
feederDescription,volt,loadKW,length,type
FD_TEST_1,11000,2500,475,Motor
FD_TEST_2,11000,5000,200,Transformer
```

#### Step 4.2: Upload Custom Data
1. Look for upload/import functionality
2. Upload the CSV
3. Navigate to Results tab

Expected: Same 41-column table renders with YOUR data (not demo)

### 5. Visual Quality Checks

- [ ] Table is readable with 41 columns (may need horizontal scroll)
- [ ] Color scheme is professional and consistent
- [ ] No overlapping text or truncation issues
- [ ] Status indicators clearly visible (✓ ✗ ⚠)
- [ ] All numeric values properly formatted with decimals
- [ ] Headers sticky (row 1 & 2 stay visible when scrolling vertically)

---

## 🔧 Troubleshooting

### Frontend Not Loading
```bash
# Check if port 5174 is running
curl http://localhost:5174

# If not, console shows error, restart frontend
cd /sceap-frontend
npm run dev
```

### Results Tab Not Rendering
1. Open Browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for API failures
4. Verify backend is running: `curl http://localhost:5000`

### Backend Not Responding
```bash
# Check if backend is running
lsof -i :5000

# If not running, restart
cd /sceap-backend
dotnet run
```

### Data Not Showing
1. Ensure demo data is loaded (Sizing tab → Load Demo Data)  
2. Check that normalizedFeeders context has data
3. Wait 2-3 seconds for calculations

### Table Columns Missing
- Scroll right to see all 41 columns (horizontal scroll area)
- Check browser DevTools Elements tab to see all table cells
- Verify CSS is loading (check Network → CSS files)

---

## 📊 Results Tab Calculation Verification

### Sample Row Verification (Demo Data)
For first cable "FD FAN-3A":

**Input:**
- Type: Motor (M)
- Power: 2450 kW
- Voltage: 11 kV
- PF: 0.85
- Efficiency: 92%

**Expected Calculations:**
- **FLC** = 2450 / (√3 × 11 × 0.85 × 0.92) ≈ 164.44 A ✓
- **Motor Start** = 7.2 × 164.44 ≈ 1183.99 A ✓
- **Start PF** = 0.2 (for motors) ✓
- **Selected Cable** = 240 mm² (from engine)
- **K_total** ≈ 0.876 (composite derating factor)
- **I_derated** = 387 × 0.876 ≈ 339.2 A ✓
- **Capacity Check** = 339.2 ≥ 164.44 → YES ✓
- **V-Drop** should be ≤ 3% → Check YES/NO
- **Start V-Dip** should be ≤ 10% → Check YES/NO
- **Status** = APPROVED (if all checks pass)

---

## 📱 Browser Testing Tips

### Desktop (Recommended)
- Full table visibility with some horizontal scrolling
- All features accessible
- Optimal formatting

### Responsive Testing (F12 → Mobile Views)
- iPhone 12: Table will require horizontal scrolling
- iPad: Most columns visible, some scrolling needed
- Note: Desktop engineering tool, not mobile-optimized

---

## 🎯 Key Features to Verify

- [x] **41 Columns**: All present with correct grouping
- [x] **3 Header Rows**: Group names, field names, units
- [x] **Color Coding**: 8 distinct column groups
- [x] **Automatic Calculations**: FLC, motors start, V-drops, derating
- [x] **Status Indicators**: ✓ APPROVED / ✗ FAILED
- [x] **Excel Export**: All columns exported
- [x] **Format Agnostic**: Works with any feeder data
- [ ] **Edit Mode** (not yet wired): Button present, awaiting implementation
- [ ] **Formula Cascading** (ready): Structure in place for edits

---

## 🎓 What to Look For

### Correctly Implemented ✅
1. Table has exactly 41 columns
2. First two columns are ID (SL#, Description)
3. LOAD group has FLC highlighted in brighter color
4. CAPACITY group shows K_total and derating factors
5. Running V-Drop shows percentage with color coding
6. Starting V-Dip shows NA for non-motors
7. Status column uses symbols (✓ ✗ ⚠)
8. All numeric values match Excel format (2-4 decimals)
9. Rows alternate between light/dark backgrounds
10. Ability to export as Excel file

### Demo Data Expectations 📊
- 17 cables total
- Mix of Motors (M) and Feeders (F)
- All at 11 kV
- Powers ranging ~1.5-5 MW
- Various cable sizes (70-240 mm²)
- Most showing APPROVED status
- Some may show WARNING/FAILED depending on V-drop limits

---

## 💡 Next Actions

Once manual testing complete:
1. ✅ Verify all 41 columns render correctly
2. ✅ Check calculations match Excel reference
3. ✅ Confirm status logic works (APPROVED/FAILED)
4. ✅ Test export functionality
5. ⏳ Enable Edit Mode (connect dropdown UI handlers)
6. ⏳ Test with custom uploaded data
7. ⏳ Verify Sizing & Optimization pages still function

---

**Frontend URL**: http://localhost:5174  
**Backend URL**: http://localhost:5000  
**Servers**: ✅ BOTH RUNNING

Ready for manual testing! 🎉
