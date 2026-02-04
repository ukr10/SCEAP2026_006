# 🌐 FRONTEND ACCESS GUIDE

**Frontend is NOW RUNNING and READY TO TEST**

---

## ✅ How to Access

### **URL**
```
http://localhost:5173
```

### **Status**
```
✅ Server running on port 5173
✅ Ready for browser access
✅ No authentication required
✅ Hot reload enabled
```

---

## 📱 Open in Browser

### **Desktop**
1. Click this link: http://localhost:5173
2. Or copy/paste URL into address bar
3. Should load immediately

### **Mobile/Remote**
Use your device's IP if accessing from another machine:
```
http://[YOUR_IP]:5173
```

---

## 🎨 What You'll See

### **When Page Loads**
```
SCEAP - Cable Sizing Platform
├─ Sizing Tab (You are here)
├─ Results Tab
├─ Optimization Tab
└─ Reports Tab
```

### **On Sizing Tab**
```
┌──────────────────────────────────┐
│ Load Demo Data Section           │
│                                  │
│ [Load Demo Feeders Button]  ← Click this
└──────────────────────────────────┘

Below: Feeder table (empty until you load data)
Bottom: Cable Catalogue tabs (1C, 2C, 3C, 4C)
```

---

## 🎯 Quick Test (3 clicks, 1 minute)

### **Click 1: "Load Demo Feeders"**
- Location: Sizing tab, "Load Demo Data" section
- What happens: 17 feeders load instantly
- You see: Table with cables, loads, voltages, etc.

### **Click 2: "Results" Tab**
- Location: Top navigation bar
- What happens: Switches to results view
- You see: Cable sizing calculations

### **Click 3: Check Results**
- Look for: FLC column (should show 556A, 118A, 21A, etc.)
- NOT zero: ✅ Success
- All zero: ❌ Issue

---

## 📊 What to Verify

### **1. Feeder Table (after clicking "Load Demo Feeders")**
```
Expected Columns:
✓ Serial No (1-17)
✓ Cable Number (INC-MAIN-001, etc.)
✓ Feeder Description
✓ From Bus
✓ To Bus
✓ Voltage (V) - should be 415
✓ Load KW - should be 15-400
✓ Length (m)
✓ Other fields...

Expected Rows: 17 feeders
```

### **2. Results Table (after clicking "Results" tab)**
```
Expected Columns:
✓ Serial No (1-17)
✓ Cable Number
✓ FLC (A) - SHOULD NOT BE ZERO
✓ Size by Current
✓ V-Drop (%)
✓ Status
✓ Cable Designation

Expected FLC Values:
Cable 1 (400kW): ~556 A ✓
Cable 2 (85kW): ~118 A ✓
Cable 12 (15kW): ~21 A ✓
All motors: 20-100 A range ✓
```

### **3. Catalogue Section**
```
Location: Bottom of Sizing tab
Tabs: 1C | 2C | 3C | 4C

Click each tab and note 240mm² ampacity:
1C: 622 A ✓
2C: 658 A ✓
3C: 556 A ✓
4C: 556 A ✓

Should be DIFFERENT per core ✓
```

---

## 🛠️ Developer Tools (Optional)

### **Open Console**
```
Press: F12
Go to: Console tab
You should see:
✓ Demo feeders loaded: 17
✓ Paths discovered: X
[No red error messages]
```

### **Check Network**
```
Press: F12
Go to: Network tab
No failed requests (all should be 200 OK)
```

---

## ✅ Success Checklist

After loading demo feeders and viewing results:

- [ ] Feeder table shows 17 rows
- [ ] Cable numbers visible (INC-MAIN-001, etc.)
- [ ] Load values visible (400, 85, 75, 50, 45, 37, 22, 11...)
- [ ] Results tab populates with data
- [ ] FLC column shows non-zero values
- [ ] Cable sizes calculated (95mm², 50mm², etc.)
- [ ] V-Drop % shows values (1-5% range)
- [ ] Status shows APPROVED/WARNING
- [ ] No red errors in console
- [ ] Catalogue tabs switch data when clicked

**If all checked:** ✅ System working correctly!

---

## ❌ If Something Doesn't Work

### **Page Doesn't Load**
```
1. Check URL: http://localhost:5173 (exact)
2. Check terminal: "VITE v5.4.21 ready" message
3. Try refresh: Ctrl+R or Cmd+R
4. Clear cache: Ctrl+Shift+Delete
```

### **No Data After Clicking Button**
```
1. Open DevTools Console (F12)
2. Look for red error text
3. Check that demo feeders actually loaded
4. Reload page and try again
```

### **FLC Shows Zero**
```
1. Check browser console (F12 → Console)
2. Look for [ENGINE INPUT] and [ENGINE OUTPUT] logs
3. Verify loadKW value in input
4. Restart dev server if needed
```

### **Can't See Catalogue Tabs**
```
1. Scroll down on Sizing tab
2. Look for "Cable Catalogue" section
3. Should see tabs: 1C | 2C | 3C | 4C
4. Click each tab to verify different data
```

---

## 📞 Testing Guides

For more detailed testing:

- **Quick 5-minute test:** See `QUICK_TEST.md`
- **Detailed procedures:** See `MANUAL_TEST_GUIDE.md`
- **Comprehensive checklist:** See `MANUAL_TEST_CHECKLIST.md`
- **System overview:** See `SYSTEM_STATUS.md`

---

## 🔄 If You Need to Restart

```bash
# Stop current server
Press Ctrl+C in terminal

# Restart
npm run dev

# Wait for: "VITE v5.4.21 ready in XXX ms"
# Then reload browser: Ctrl+R
```

---

## 🎬 Ready to Start?

**Frontend is running.**  
**Everything is loaded.**  
**Just open:** http://localhost:5173

**Then follow the quick test in QUICK_TEST.md (5 minutes)**

---

**Frontend Status:** ✅ READY  
**URL:** http://localhost:5173  
**Expected Result:** Working system with 17 cables calculated  
**Time to Complete:** 5-10 minutes  

**Go test it now!** 🚀
