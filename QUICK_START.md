# 🚀 SCEAP2026 - Quick Start Guide

## ⚠️ Current Issue
The Codespaces port forwarding may have temporary issues. Here's how to properly restart the servers:

## 🔧 Manual Server Startup (Recommended)

### Step 1: Open TWO Separate Terminals in VS Code

**Terminal 1 - Frontend:**
```bash
cd /workspaces/SCEAP2026_2/sceap-frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd /workspaces/SCEAP2026_2/sceap-backend
dotnet run
```

### Step 2: Wait for Servers to Start

**You should see:**

Frontend Terminal:
```
  VITE v5.4.21  ready in XXX ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
```

Backend Terminal:
```
Now listening on: http://localhost:5000
Application started.
```

### Step 3: Access the Application

**Frontend URL (from Codespaces):**
- Copy the port forwarded URL from VS Code
- Or use: http://localhost:5173 if running locally

**Backend API:**
- Health: http://localhost:5000/

## 🎯 What the System Does

1. **Upload Excel file** with feeder data
2. **Path discovery** finds routes from loads to transformers
3. **Cable sizing engine** calculates:
   - FLC from kW, V, PF, Efficiency
   - Derating factors (temp, grouping, soil, depth)
   - Cable size by: Ampacity → V-Drop → SC Withstand
   - Parallel run optimization for >300mm² cables
   - IEC 60228 cable designation

4. **Results shown in table:**
   - Cable size (mm²)
   - Designation (1×95mm² (Cu XLPE))
   - FLC and derated current
   - Voltage drop %
   - Breaker size
   - Status (APPROVED/WARNING/FAILED)

## ✅ Features Verified

- ✅ All 10 critical cable sizing errors fixed
- ✅ IEC 60287/60364 compliance
- ✅ 7 load types supported (Motor, Fan, Pump, Compressor, Heater, Transformer, Lighting)
- ✅ 4 starting methods (DOL, StarDelta, SoftStarter, VFD)
- ✅ Motor starting current checks
- ✅ Voltage drop formulas (running + starting)
- ✅ Short-circuit withstand validation
- ✅ Parallel run optimization
- ✅ Environmental derating (temp, burial, grouping)
- ✅ Backend data persistence

## 🧪 Test Data Available

5 demo feeders included for testing:
1. **Pump** (500kW, 6600V, SoftStarter) - long distance 150m
2. **Fan** (45kW, 415V, StarDelta) - medium load
3. **Heater** (120kW, 415V, DOL) - resistive 200m
4. **Compressor** (22kW, 415V, VFD) - small motor
5. **Transformer** (1200kW, 6600V, Buried) - high power

To use these:
- Create Excel file with same column headers
- Or use test data from `INTEGRATION_TEST_REPORT.md`

## 📊 Integration Architecture

```
Excel File
    ↓
Frontend (Vite 5173)
    ├─ Sizing Tab: Upload & parse Excel
    ├─ Optimization Tab: Path analysis  
    └─ Results Tab: Cable sizing calculations
    ↓
CableSizingEngine (New Industrial Engine)
    ├─ CableEngineeringData (IEC tables)
    ├─ 9-step algorithm
    ├─ Parallel run optimization
    └─ IEC 60228 designation
    ↓
Results Display
    ├─ Interactive table
    ├─ Export to Excel/PDF
    └─ Status indicators
    ↓
Backend (ASP.NET 5000)
    └─ Data persistence
```

## 🔍 Troubleshooting

### Port 5173 showing 504 Error
- Frontend took too long to start
- **Solution:** Let it run for 10-15 seconds, then refresh

### Port 5000 showing 404 Error
- Backend not responding or not started
- **Solution:** Check backend terminal is showing "Now listening on: http://localhost:5000"

### Build errors in TypeScript
- Run: `npm install` in sceap-frontend directory
- Then: `npm run dev`

### Backend errors
- Ensure SQLite database exists at `/workspaces/SCEAP2026_2/sceap-backend/sceap.db`
- Or delete and backend will recreate on startup

## 📞 Server Status Check

Run this to verify both servers are accessible:

```bash
# Check frontend
curl -I http://localhost:5173

# Check backend  
curl -I http://localhost:5000
```

Both should return HTTP response (200, 404, etc.) - NOT connection refused or timeout.

## 🎓 Next Steps

1. ✅ Start both servers (follow steps above)
2. ✅ Access frontend at http://localhost:5173
3. ✅ Upload test Excel file with feeder data
4. ✅ Review Results tab for calculated cable sizes
5. ✅ Verify designations in IEC format (1×95mm²)
6. ✅ Check voltage drops are realistic (<5%)
7. ✅ Export results if needed

---

**Last Updated:** 2026-02-02  
**System:** Industrial Cable Sizing Engine - Phase 6 Integration & Testing  
**Status:** ✅ Ready for Manual Testing
