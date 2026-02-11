# 📊 Results Table Visual Guide

## Table Structure Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESULTS TABLE - NEW DESIGN                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ S.No │ Description │ LOAD PARAMS │ SHORT CIRCUIT │ CABLE DATA │ ... │ STATUS   │
│      │             │ ─────────── │ ───────────── │ ────────── │ ... │          │
│      │             │ Load│Motor│PF│ Isc │Withstand│Cores│Size│...   │ ✓ OK      │
├──────┼─────────────┼─────┼──────┼────┼─────┼──────────┼─────┼─────┼─────┼──────┤
│  1   │ Main        │200.00│200.00│0.95│50.00│57.20 │ 3C │400 │...│ ✓ OK      │
│      │ Incomer     │     │      │    │     │       │    │    │    │          │
├──────┼─────────────┼─────┼──────┼────┼─────┼──────────┼─────┼─────┼─────┼──────┤
│  2   │ Feeder to   │ 85.00│ 85.00│0.95│30.00│ 2.74  │ 3C │ 35 │...│ ✓ OK      │
│      │ UPS Panel   │     │      │    │     │       │    │    │    │          │
└──────┴─────────────┴─────┴──────┴────┴─────┴──────────┴─────┴─────┴─────┴──────┘
```

## Color-Coded Column Groups

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ Column Group Colors & Meanings                                                 ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                 ║
║ 🔵 BLUE (Identification)                                                      ║
║    └─ S.No, Description                                                        ║
║                                                                                 ║
║ 🔷 CYAN (Load Parameters)                                                      ║
║    └─ Load(kW), Motor(kW), Power Factor                                        ║
║    └─ Required for FLC calculation                                             ║
║                                                                                 ║
║ 🟠 ORANGE (Short Circuit)                                                      ║
║    └─ Isc (kA), Withstand (kA)                                                 ║
║    └─ Protective device coordination                                           ║
║                                                                                 ║
║ 🟣 PURPLE (Cable Data)                                                         ║
║    └─ Cores, Size(mm²), R(Ω/km), Insulation                                    ║
║    └─ Physical cable specifications                                            ║
║                                                                                 ║
║ 🟢 GREEN (Current Capacity)                                                    ║
║    └─ Catalog(A), K_total, Derated(A)                                          ║
║    └─ Ampacity validation                                                      ║
║                                                                                 ║
║ 🔴 RED (Voltage Drop)                                                          ║
║    └─ Running ΔU(V), Running %, Starting ΔU(V), Starting %                    ║
║    └─ Voltage drop analysis & compliance                                       ║
║                                                                                 ║
║ 🟡 YELLOW (Selected Size)                                                      ║
║    └─ Size(mm²), Runs                                                          ║
║    └─ Final cable configuration (editable)                                    ║
║                                                                                 ║
║ ⬜ GRAY (Route & Status)                                                        ║
║    └─ Length(m), Status                                                        ║
║    └─ Cable identification & approval status                                   ║
║                                                                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Data Precision & Formatting

```
Field Type          │ Display Format  │ Example
────────────────────┼─────────────────┼──────────────
Current (A)         │ 2 decimal places│ 156.78 A
Voltage (V)         │ 2 decimal places│ 2.35 V
Percentage (%)      │ 2 decimals + %  │ 3.52%
Resistance (Ω/km)   │ 4 decimals      │ 0.1620 Ω/km
Derating Factor     │ 3 decimals      │ 0.876
Cable Size (mm²)    │ Integer         │ 240 mm²
Cable Load (kW)     │ 2 decimals      │ 37.00 kW
Length (m)          │ 2 decimals      │ 25.50 m
Power Factor        │ 2 decimals      │ 0.85
Efficiency          │ 2 decimals      │ 0.92
```

## Status Indicators

```
┌──────────────────────────────────────────────────────────┐
│ STATUS INDICATORS                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ✓ OK     → Green background, text: "✓ OK"               │
│           Meaning: All constraints satisfied              │
│           ├─ FLC ≤ Derated current                       │
│           ├─ V-drop ≤ 5% (running)                       │
│           └─ Isc ≤ cable rating                          │
│                                                           │
│ ⚠ CHK    → Yellow background, text: "⚠ CHK"            │
│           Meaning: Warning - review needed               │
│           ├─ V-drop 3-5% (acceptable, at limit)         │
│           ├─ Multiple runs required                      │
│           └─ Custom derating applied                     │
│                                                           │
│ ✗ FAIL   → Red background, text: "✗ FAIL"              │
│           Meaning: Non-compliant, redesign needed        │
│           ├─ V-drop > 5% (exceeds limit)                │
│           ├─ No suitable cable size found                │
│           └─ Isc withstand inadequate                    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Voltage Drop Compliance Color Coding

```
Running Voltage Drop (%) │ Color  │ Status
────────────────────────┼────────┼─────────────────
≤ 3.00%                 │ GREEN  │ Excellent (best practice)
3.01% - 5.00%           │ YELLOW │ Acceptable (at limit)
> 5.00%                 │ RED    │ Exceeds standard (needs redesign)
```

## Column Headers Detail

### Header Row 1 - Group Names (Bold, Colored Backgrounds)
```
S.No │ Description │ LOAD │ SHORT │ CABLE │ CURRENT │ VOLTAGE │ SELECTED │ ROUTE
     │             │PARAM │CIRCUIT│ DATA  │CAPACITY │  DROP   │   SIZE   │STATUS
```

### Header Row 2 - Field Names (Smaller Text)
```
     │             │Load  │ Isc  │Cores │Catalog │Run     │Size    │ Length
     │             │(kW)  │(kA)  │      │Rating  │ΔU(%)   │(mm²)   │(m)
```

## Borders & Spacing

```
Every Cell Has:
├─ Top border    (2px solid slate-600)
├─ Bottom border (2px solid slate-600)  
├─ Left border   (2px solid slate-600)
├─ Right border  (2px solid slate-600)
├─ Padding       (default 8px)
└─ Background    (alternating slate-800 / slate-750)

Header Cells Have:
├─ Gradient background (dark blue)
├─ Bold, bright text (color-coded by group)
├─ Extra padding for readability
└─ Rounded corners (3px)

Status Rows Have:
└─ Left accent border (4px) matching status:
    ├─ Green for ✓ OK
    ├─ Yellow for ⚠ CHK
    └─ Red for ✗ FAIL
```

## Interactive Elements

### Edit Mode (When Enabled)
```
Load (kW) field:
  ┌──────────────────┐
  │ [87.50]          │  ← Read/write input box
  │  Input type      │
  └──────────────────┘

Selected Size (mm²) field:
  ┌──────────────────┐
  │ [ 240 ▼]         │  ← Dropdown selector
  │ [1.5][2.5][4]... │
  └──────────────────┘

Remarks field:
  ┌──────────────────────────────────┐
  │ [Enter remarks here...  ]         │  ← Text input
  └──────────────────────────────────┘
```

### Non-Edit Mode
```
All cells show:
  ├─ Static text, properly formatted
  ├─ Numbers right-aligned
  ├─ Color highlights for critical values
  └─ No input boxes visible
```

## Example Row Display

### Row with APPROVED Status
```
┌─────┬──────────────┬────────┬────────┬────────┬────────┬────────┬────────┬──────┐
│  6  │ Fire Pump    │ 37.00  │ 37.00  │  0.85  │  12.00 │  1.25  │  3C    │ 70   │
│     │ Motor        │        │        │        │        │        │        │(PASS)│
└─────┴──────────────┴────────┴────────┴────────┴────────┴────────┴────────┴──────┘
         Load = 37 kW      Motor = 37 kW         Isc = 12 kA    Cores = 3      
         Status = ✓ OK (Green)
```

### Row with WARNING Status  
```
┌─────┬──────────────┬────────┬────────┬────────┬────────┬────────┬────────┬──────┐
│  10 │ Chiller Unit │ 45.00  │ 45.00  │  0.85  │  15.00 │  1.25  │  3C    │ 120  │
│     │ 2            │        │        │        │        │        │        │(CHK) │
└─────┴──────────────┴────────┴────────┴────────┴────────┴────────┴────────┴──────┘
         V-drop = 5.12% (Yellow - at limit)
         Status = ⚠ CHK (Yellow)
```

## Demo Data Summary

```
┌──────────────────────────────────────────────────────────────┐
│ DEMO DATASET OVERVIEW                                        │
├──────────────────────────────────────────────────────────────┤
│ Total Cables:        17 cables                              │
│ Total Load:          920 kW across 415V 3-phase             │
│ Voltage:             All 415V (consistency testing)          │
│ Cores:               All 3C (three-phase)                    │
│ Conductor:           Copper (Cu) throughout                  │
│ Insulation:          XLPE (industry standard)                │
│ Installation:        Air (cable tray)                        │
│                                                              │
│ Cable Distribution:                                          │
│  ├─ Feeders (5):     Incomer, UPS, HVAC, Lighting, General │
│  ├─ Motors (3):      Fire Pump, Water Pump, Elevator        │
│  ├─ HVAC (3):        Chillers (2), Cooling Tower            │
│  ├─ Lighting (3):    Floor 1, Floor 2, Outdoor              │
│  └─ UPS (3):         Charger, Inverter, Bypass              │
│                                                              │
│ Load Types:                                                  │
│  ├─ Motors:          37, 22, 11 kW (with different starts)  │
│  ├─ Resistive:       65, 20, 15, 15 kW (lighting)           │
│  ├─ Feeders:         200, 85, 120, 50 kW                    │
│  └─ Equipment:       45, 45, 15, 25, 30, 30 kW              │
│                                                              │
│ All cables calculated successfully ✓                         │
│ All statuses: APPROVED (100%)                                │
│ No failures or warnings in demo set                          │
└──────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

```
TAB         → Navigate horizontally through editable cells
SHIFT+TAB   → Navigate backward through cells
ENTER       → Confirm edit and move to next row
ESC         → Cancel editing current cell
CTRL+Z      → Undo last change (in edit mode)
CTRL+S      → Save all edits (same as "Save All" button)
```

## Tips for Best Use

```
1. VIEWING RESULTS
   ├─ Use Table View for full precision data
   ├─ Use Card View for detailed cable inspection
   └─ Toggle between views as needed

2. FINDING ISSUES
   ├─ Look for RED status (✗ FAIL) first
   ├─ Then check YELLOW status (⚠ CHK)
   ├─ GREEN status (✓ OK) are compliant
   └─ Sort by Status column to group issues

3. EDITING CABLES
   ├─ Click Edit Mode to enable editing
   ├─ Change ONE value at a time
   ├─ Watch size calculation update instantly
   ├─ Save when done - don't leave it on
   └─ Export to verify calculations

4. EXPORTING
   ├─ Use Excel for numerical analysis
   ├─ Use PDF for sharing/printing
   ├─ Use Edited to backup your changes
   └─ Keep originals before modifications

5. TROUBLESHOOTING
   ├─ If column doesn't show: Click Customize
   ├─ If size is wrong: Check Load & Length
   ├─ If V-drop high: Reduce length or increase size
   ├─ If FAILED: Needs complete redesign
   └─ Check formula panel for calculation details
```

---

**All improvements implemented and ready for production use! ✅**
