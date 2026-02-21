# 📚 SCEAP 2.0 - Complete Technical Guide for UdayKiranRathod

## Your Complete Understanding Journey

This document is your **complete blueprint** to understand every aspect of the SCEAP 2.0 platform. Read through sections sequentially or jump to specific areas using the table of contents below.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Frontend: React & TypeScript Guide](#3-frontend-react--typescript-guide)
4. [Backend: .NET Core Guide](#4-backend-net-core-guide)
5. [Key Algorithms Explained](#5-key-algorithms-explained)
6. [Cable Sizing Formulas](#6-cable-sizing-formulas)
7. [Data Flow & State Management](#7-data-flow--state-management)
8. [UI Component Breakdown](#8-ui-component-breakdown)
9. [Key Files Explained Line-by-Line](#9-key-files-explained-line-by-line)
10. [Common Workflows](#10-common-workflows)
11. [Deployment & Setup](#11-deployment--setup)

---

# 1. Project Overview

## What Problem Does SCEAP Solve?

**The Problem:**
- Electrical engineers in power plants manually calculate cable sizes using Excel
- Calculations are error-prone and time-consuming
- Documentation is scattered across multiple sheets
- Changes require recalculating everything from scratch

**Our Solution:**
- Automated cable sizing based on industry standards (IEC 60364)
- Intelligent path discovery from equipment to transformers
- Professional export formats (Excel, PDF)
- Real-time validation and error checking

## What Is SCEAP?

**SCEAP** = Smart Cable Engineering Automation Platform

It's a **full-stack web application** that allows engineers to:

1. **Upload** Excel files with feeder/cable information
2. **Analyze** electrical networks to find optimal cable paths
3. **Calculate** cable sizes based on:
   - Full Load Current (FLC)
   - Voltage drop constraints
   - Short-circuit protection requirements
4. **Export** results with professional formatting
5. **Compare** different sizing methods

## The Three Main Pages

### Page 1: Sizing Tab 📥
```
User Flow:
1. User clicks "Select File"
2. Uploads Excel file with feeder data
3. System parses and validates
4. Shows feeder list in a table
5. User can proceed to Optimization
```

**What happens behind the scenes:**
```
File Upload → JavaScript reads file with XLSX library
     ↓
Parse Excel Sheet → Extract cable numbers, buses, voltages, loads
     ↓
Normalize Data → Create standardized CableSegment objects
     ↓
Validate → Check for missing required fields
     ↓
Store in React State → Via PathContext
     ↓
Display in Table → Show to user for verification
```

### Page 2: Optimization Tab 🔄
```
User Flow:
1. System receives normalized feeder data
2. Runs path discovery algorithm (BFS - Breadth-First Search)
3. Finds all unique paths from equipment to transformer
4. Groups cables by path
5. Shows visualization with equipment names and descriptions
```

**Why we do this:**
- Transformers are connection points
- Each equipment/load connects through cables to a transformer
- Some equipment may connect through multiple cables (serial connection)
- We discover these complete chains automatically

### Page 3: Results Tab 📊
```
User Flow:
1. System takes discovered paths
2. Calculates cable sizing for EACH cable using three methods:
   - Method 1: Size by Current rating
   - Method 2: Size by Voltage Drop (IEC limit)
   - Method 3: Size by Short-Circuit protection
3. Selects the MAXIMUM (conservative approach)
4. Displays results in detailed table
5. Provides Excel & PDF export
```

---

# 2. Architecture Deep Dive

## Why Separate Frontend & Backend?

```
Traditional Monolithic Approach (NOT what we do):
┌─────────────────────────────────────────┐
│       One Big Application               │
│  • HTML Pages  • Business Logic         │
│  • Styling     • Database Access        │
│  • JavaScript  • Calculations           │
│                                         │
│ Problem: Hard to scale, update, or fix │
└─────────────────────────────────────────┘

Our Approach - Separated Services:
┌─────────────────────┐       ┌─────────────────────┐
│  Frontend (React)   │◄────►│  Backend (.NET)     │
│ Port: 5173          │ HTTP  │ Port: 5000          │
│                     │  REST │                     │
│ • React Components  │       │ • Calculations      │
│ • TailwindCSS       │       │ • Business Logic    │
│ • User Interactions │       │ • Database Access   │
│ • Export Libraries  │       │ • Data Validation   │
└─────────────────────┘       └─────────────────────┘
         ↓                              ↓
  Renders HTML/CSS           Manages SQLite Database
  Sends HTTP Requests        Processes Complex Logic
```

## Technology Stack Explained

### Frontend Stack (Port 5173)

**React 18**
- Framework for building user interfaces with reusable components
- Why: Component-based, huge ecosystem, fast rendering

**TypeScript**
```typescript
// TypeScript ensures type safety
interface CableSegment {
  serialNo: number;        // Must be a number
  cableNumber: string;     // Must be a string
  loadKW: number;          // Must be a number
}

// This catches errors at compile-time:
const cable: CableSegment = {
  serialNo: "ABC",  // ❌ ERROR: Should be number, not string
};
```

**Vite Build Tool**
- Extremely fast build and development server
- Uses ES modules for instant hot module reload (HMR)
- Bundles code efficiently for production

**TailwindCSS**
- Utility-first CSS framework
- Example: `className="bg-slate-800 text-white p-6 rounded-lg"`
- No need to write custom CSS - use provided classes

**XLSX Library**
```javascript
// Reads Excel files in the browser
import * as XLSX from 'xlsx';

const workbook = XLSX.read(fileData); // Parses Excel
const sheet = workbook.Sheets[0];      // Gets first sheet
const data = XLSX.utils.sheet_to_json(sheet); // Converts to JSON
```

**jsPDF Library**
```javascript
// Generates PDF files in browser (no backend needed)
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text('My Report', 10, 10);
doc.save('report.pdf'); // Downloads to user's computer
```

### Backend Stack (Port 5000)

**.NET Core 8**
- Latest .NET runtime (released 2023)
- Cross-platform (Windows, Linux, Mac)
- High performance (C# compiled language)

**ASP.NET Core**
- Framework for building REST APIs
- Handles HTTP requests/responses
- Built-in dependency injection

**Entity Framework Core**
```csharp
// Object-Relational Mapper (ORM)
// Allows us to query database using C# instead of SQL

// Instead of writing:
// SELECT * FROM Projects WHERE Id = 1

// We write:
var project = dbContext.Projects.FirstOrDefault(p => p.Id == 1);

// Entity Framework translates this to SQL automatically
```

**SQLite Database**
- File-based database (no server needed)
- Stored as `sceap.db` in the project folder
- Perfect for development and small deployments

---

# 3. Frontend: React & TypeScript Guide

## React Fundamentals

### Components (Building Blocks)

```typescript
// A component is a reusable piece of UI
import React from 'react';

interface ResultsTabProps {
  pathAnalysis: PathAnalysisResult;
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ pathAnalysis }) => {
  // Component logic here
  return (
    <div className="results-container">
      {/* HTML/JSX structure here */}
    </div>
  );
};

// Why components?
// - Reusable: Use ResultsTab in multiple places
// - Maintainable: Change once, updates everywhere
// - Testable: Can test in isolation
```

### State Management (Memory for Components)

```typescript
import { useState } from 'react';

export const ResultsTab = () => {
  // State: The component's memory
  const [results, setResults] = useState<CableSizingResult[]>([]);
  
  // results = current value
  // setResults = function to update value
  
  const handleExport = () => {
    // Update state
    setResults(newResults); // Component re-renders with new data
  };
  
  // When results changes, React automatically re-renders the UI
};
```

### React Context (Global State)

```typescript
// Problem: Passing data through many components is tedious
// Solution: Context API

import { createContext, useContext } from 'react';

interface PathContextType {
  pathAnalysis: PathAnalysisResult | null;
  setPathAnalysis: (data: PathAnalysisResult) => void;
}

// Create context
export const PathContext = createContext<PathContextType | null>(null);

// Provide context (wrap app with this)
export const PathContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathAnalysis, setPathAnalysis] = useState<PathAnalysisResult | null>(null);
  
  return (
    <PathContext.Provider value={{ pathAnalysis, setPathAnalysis }}>
      {children}
    </PathContext.Provider>
  );
};

// Use context in any component (no prop drilling needed)
export const SomeComponent = () => {
  const { pathAnalysis } = useContext(PathContext)!;
  // Now we have access to pathAnalysis from anywhere!
};
```

### Component Lifecycle with useEffect

```typescript
import { useEffect, useState } from 'react';

export const ResultsTab = () => {
  const [results, setResults] = useState<CableSizingResult[]>([]);
  const { pathAnalysis } = useContext(PathContext)!;
  
  // Effect: Run code when something changes
  useEffect(() => {
    // This runs whenever pathAnalysis changes
    if (pathAnalysis && pathAnalysis.paths.length > 0) {
      // Calculate and set results
      const newResults = generateResults(pathAnalysis);
      setResults(newResults);
    }
  }, [pathAnalysis]); // Dependency array: run when pathAnalysis changes
  
  return <div>{results.length} cables</div>;
};

// Why useEffect?
// - Separates logic from rendering
// - Handles side effects (API calls, animations, calculations)
// - Prevents infinite loops (dependency array)
```

## Frontend File Structure Explained

### `src/components/ResultsTab.tsx` - The Results Table

```typescript
// Line 1-6: Imports
import { useState, useEffect } from 'react';          // React hooks
import { Download, FileText } from 'lucide-react';    // Icons
import * as XLSX from 'xlsx';                         // Excel export
import jsPDF from 'jspdf';                            // PDF export
import 'jspdf-autotable';                             // PDF table formatting
import { usePathContext } from '../context/PathContext'; // Get path data

// Line 9-30: Define the result data structure
interface CableSizingResult {
  serialNo: number;              // Cable serial number
  cableNumber: string;           // Cable ID (e.g., "FDR-MAIN-002")
  feederDescription: string;     // Human-readable description
  // ... 30+ more fields
  
  // The more fields you have, the more data you're displaying
  // Each field represents one calculation or input value
}

// Line 33-53: Cable ampacity table
const CABLE_AMPACITY: Record<number, number> = {
  1: 13,      // 1mm² cable can handle 13 Amps
  2.5: 25,    // 2.5mm² can handle 25 Amps
  10: 61,     // 10mm² can handle 61 Amps
  // ... more sizes
};

// This is a lookup table: Given a cable size, what's the max current?

// Line 56-87: Cable resistance table
const CABLE_RESISTANCE: Record<number, number> = {
  1: 18.51,   // 1mm² cable has 18.51 Ω/km resistance
  2.5: 7.41,  // 2.5mm² has 7.41 Ω/km
  // ... more sizes
};

// Used for voltage drop calculations
// Higher resistance = more voltage drop

// Line 89-180: THE MAIN CALCULATION FUNCTION
const calculateCableSizing = (cable: CableSegment): CableSizingResult => {
  // Step 1: Calculate Full Load Current (FLC)
  const FLC = (cable.loadKW * 1000) / (SQRT3 * cable.voltage * PF * EFFICIENCY);
  // Formula: I = P / (√3 × V × PF × η)
  
  // Step 2: Apply derating (reduce current due to environment)
  const deratedCurrent = FLC / cable.deratingFactor;
  
  // Step 3: Find cable size based on current
  let sizeByCurrent = 1;
  for (const [size, capacity] of Object.entries(CABLE_AMPACITY)) {
    if (capacity >= requiredCurrent) {
      sizeByCurrent = Number(size);
      break; // Found the right size, stop looking
    }
  }
  
  // Step 4: Check voltage drop
  const vdrop = (SQRT3 * deratedCurrent * cableResistance * cable.length) / 1000;
  
  // Step 5: Size by voltage drop (IEC limit: 5%)
  let sizeByVoltageDrop = sizeByCurrent;
  for (const size of [25, 35, 50, 70, 95, 120]) {
    if (voltageDropWithThisSize <= 5%) {
      sizeByVoltageDrop = size;
      break;
    }
  }
  
  // Step 6: Size by short-circuit (conservative estimate)
  const sizeByShortCircuit = 25; // Placeholder
  
  // Step 7: CHOOSE THE LARGEST SIZE (conservative/safe approach)
  const suitableSize = Math.max(sizeByCurrent, sizeByVoltageDrop, sizeByShortCircuit);
  
  // Return all calculated values
  return {
    serialNo: cable.serialNo,
    // ... all other fields
    suitableCableSize: suitableSize, // This is what we recommend
    status: vdropPercent <= 5 ? 'valid' : 'invalid'
  };
};

// Line 182-210: React Component Definition
const ResultsTab = () => {
  const { pathAnalysis } = usePathContext();          // Get path data from context
  const [results, setResults] = useState<CableSizingResult[]>([]);  // Local state
  
  // Generate results when pathAnalysis changes
  useEffect(() => {
    if (pathAnalysis && pathAnalysis.paths.length > 0) {
      const allCables: CableSizingResult[] = [];
      const seen = new Set<number>();  // Track which cables we've seen
      
      // Flatten cables from all paths
      pathAnalysis.paths.forEach((path) => {
        path.cables.forEach((cable) => {
          if (!seen.has(cable.serialNo)) {  // Don't add duplicates!
            seen.add(cable.serialNo);
            const result = calculateCableSizing(cable);
            allCables.push(result);
          }
        });
      });
      
      setResults(allCables);  // Update component state
    }
  }, [pathAnalysis]);  // Re-run when pathAnalysis changes
  
  // Line 250-280: Export to Excel
  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Cable Number': r.cableNumber,
      'Feeder Description': r.feederDescription,
      'FLC (A)': r.fullLoadCurrent.toFixed(2),
      // ... all other fields
    }));
    
    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cable Sizing Results');
    
    // Download to user's computer
    XLSX.writeFile(workbook, `cable_sizing_results_${new Date()}.xlsx`);
  };
  
  // Line 282-330: Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Convert results to table rows
    const tableData = results.map((r) => [
      r.serialNo,
      r.cableNumber,
      r.feederDescription.substring(0, 25),
      r.voltage,
      r.loadKW.toFixed(1),
      // ... all other columns
    ]);
    
    // Use autoTable plugin to create professional table
    (doc as any).autoTable({
      head: [['S.No', 'Cable #', 'Description', 'V', 'kW', /* ... */]],
      body: tableData,
      startY: 20,
    });
    
    doc.save(`cable_sizing_results_${new Date()}.pdf`);
  };
  
  // Line 400-620: Render (what the user sees)
  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <button onClick={handleExportExcel}>Excel</button>
      <button onClick={handleExportPDF}>PDF</button>

      {/* column chooser toggles visibility in table and exports */}
      <div className="inline-block ml-4">
        <button className="px-2 py-1 bg-slate-700 text-white rounded" onClick={() => {/* open menu */}}>Columns</button>
        {/* clicking shows checkboxes for every field; hiding a column also removes it from subsequent Excel/PDF exports */}
      </div>
      
      {/* Results table with vertical scrolling */}
      <div className="overflow-y-auto results-table-scroll" style={{ height: '1000px' }}>
        <table className="w-full">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Cable #</th>
              <th>Description</th>
              {/* ... more columns ... */}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={`${result.cableNumber}-${result.serialNo}`}>
                <td>{result.serialNo}</td>
                <td>{result.cableNumber}</td>
                <td>{result.feederDescription}</td>
                {/* ... more cells ... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Analysis Summary Cards */}
      <div className="grid grid-cols-3">
        <div>
          <p className="text-2xl">{results.length}</p>
          <p>Total Cables</p>
        </div>
        <div>
          <p className="text-2xl">{validResults}</p>
          <p>Valid Cables</p>
        </div>
        <div>
          <p className="text-2xl">{totalLoad.toFixed(1)}</p>
          <p>Total Load (kW)</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
```

### `src/utils/pathDiscoveryService.ts` - Path Discovery Algorithm

```typescript
// This file is the HEART of the optimization logic

export interface CableSegment {
  serialNo: number;                    // From Excel: S.No
  cableNumber: string;                 // From Excel: Cable Number
  feederDescription: string;           // From Excel: Feeder Description
  fromBus: string;                     // Starting point (Equipment)
  toBus: string;                       // Ending point (Next equipment or transformer)
  voltage: number;                     // Operating voltage
  loadKW: number;                      // Power being transmitted
  length: number;                      // Cable run length in meters
  deratingFactor: number;              // Environmental derating
}

export interface CablePath {
  pathId: string;                      // Unique path identifier (PATH-001, PATH-002, etc.)
  startEquipment: string;              // Where the path begins (e.g., UPS-PANEL)
  startEquipmentDescription: string;   // Human description of that equipment
  endTransformer: string;              // Where the path ends (transformer)
  cables: CableSegment[];              // All cables in this path (could be 1 or more)
  totalDistance: number;               // Sum of all cable lengths in path
  voltageDropPercent: number;          // Total voltage drop in the path
  isValid: boolean;                    // Is voltage drop within limits?
}

// Function 1: Normalize Excel data
export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  // Problem: Excel columns might have different names
  // Solution: Map all variations to standard names
  
  return rawFeeders
    .filter((f) => f['From Bus'])  // Skip rows without "From Bus" (invalid)
    .map((feeder) => ({
      serialNo: feeder['Serial No'] || 0,
      cableNumber: feeder['Cable Number'] || '',
      feederDescription: feeder['Feeder Description'] || feeder['Description'] || '',
      fromBus: feeder['From Bus'] || '',
      toBus: feeder['To Bus'] || '',
      voltage: Number(feeder['Voltage (V)'] || 415),  // Default to 415V
      loadKW: Number(feeder['Load KW'] || 0),         // Default to 0kW
      length: Number(feeder['Length (m)'] || 0),      // Default to 0m
      deratingFactor: Number(feeder['Derating Factor'] || 0.87),  // Default 0.87
    }));
};

// Function 2: Discover all paths using Breadth-First Search (BFS)
export const discoverPathsToTransformer = (cables: CableSegment[]): CablePath[] => {
  const paths: CablePath[] = [];
  
  // Step 1: Find all transformers (they have "TRF" in toBus)
  const transformerBuses = new Set(
    cables
      .filter((c) => c.toBus.toUpperCase().includes('TRF'))
      .map((c) => c.toBus)
  );
  // Example: transformerBuses = {"TRF-MAIN", "TRF-BACKUP"}
  
  // Step 2: Find all equipment/loads (fromBus that are NOT transformers)
  const equipmentBuses = new Set(
    cables
      .filter((c) => !transformerBuses.has(c.fromBus))
      .map((c) => c.fromBus)
  );
  // Example: equipmentBuses = {"UPS-PANEL", "HVAC-PANEL", "LIGHTING-PANEL"}
  
  // Step 3: For each equipment, find its path to transformer
  let pathCounter = 1;
  for (const equipment of equipmentBuses) {
    const path = tracePathToTransformer(equipment, cables, transformerBuses);
    if (path.cables.length > 0) {
      path.pathId = `PATH-${String(pathCounter).padStart(3, '0')}`;  // PATH-001, PATH-002, etc.
      pathCounter++;
      paths.push(path);
    }
  }
  
  return paths;
};

// Function 3: Trace a single path using BFS algorithm
const tracePathToTransformer = (
  startEquipment: string,
  cables: CableSegment[],
  transformerBuses: Set<string>
): CablePath => {
  // BFS Algorithm explanation:
  // - Start from equipment
  // - Follow cables one step at a time
  // - Keep going until we reach transformer
  // - Record all cables along the way
  
  const visited = new Set<string>();           // Track visited buses
  const queue: { bus: string; path: CableSegment[] }[] = [
    { bus: startEquipment, path: [] }           // Start with empty path
  ];
  
  let finalPath: CablePath = {
    pathId: '',
    startEquipment,
    startEquipmentDescription: '',
    endTransformer: '',
    cables: [],
    totalDistance: 0,
    voltageDropPercent: 0,
    isValid: false,
    validationMessage: 'Path not found'
  };
  
  // BFS Loop
  while (queue.length > 0) {
    const current = queue.shift()!;              // Take first item from queue
    const currentBus = current.bus;
    
    // Skip if already visited (prevent loops)
    if (visited.has(currentBus)) continue;
    visited.add(currentBus);
    
    // Find cable where fromBus = currentBus
    // This is the cable FROM this equipment TO the next equipment/transformer
    const connectingCable = cables.find((c) => c.fromBus === currentBus);
    
    if (!connectingCable) {
      continue;  // Dead end, no cable found
    }
    
    // Add this cable to our path
    const newPath = [...current.path, connectingCable];
    
    // Check if we reached the transformer
    if (transformerBuses.has(connectingCable.toBus)) {
      // ✓ Path complete! Build the result
      const totalDistance = newPath.reduce((sum, c) => sum + c.length, 0);
      const totalVoltage = newPath[0]?.voltage || 415;
      const cumulativeLoad = newPath[0]?.loadKW || 0;
      
      // Calculate total voltage drop
      const voltageDrop = calculateSegmentVoltageDrop(newPath[0], 0.1);
      const voltageDropPercent = (voltageDrop / totalVoltage) * 100;
      
      finalPath = {
        pathId: '',
        startEquipment,
        startEquipmentDescription: newPath[newPath.length - 1]?.feederDescription || '',
        endTransformer: connectingCable.toBus,
        cables: newPath,
        totalDistance,
        totalVoltage,
        cumulativeLoad,
        voltageDrop,
        voltageDropPercent,
        isValid: voltageDropPercent <= 5,  // IEC 60364 standard
        validationMessage: voltageDropPercent <= 5
          ? `V-drop: ${voltageDropPercent.toFixed(2)}% (Valid)`
          : `V-drop: ${voltageDropPercent.toFixed(2)}% (Exceeds 5%)`
      };
      break;  // Path found, stop searching
    }
    
    // Continue searching - add next equipment to queue
    queue.push({ bus: connectingCable.toBus, path: newPath });
  }
  
  return finalPath;
};

// Why BFS for path discovery?
// - Guarantees shortest path
// - Explores systematically (one step at a time)
// - No circular dependencies
// - Efficient memory usage
```

---

# 4. Backend: .NET Core Guide

## REST API Endpoints

```csharp
// Controllers are entry points for HTTP requests
// Think of them as "listeners" that respond to specific URLs

// Example: http://localhost:5000/api/projects/calculate

[ApiController]
[Route("api/[controller]")]
public class CableSizingController : ControllerBase
{
    // This method responds to: POST http://localhost:5000/api/cablesizing/calculate
    [HttpPost("calculate")]
    public async Task<IActionResult> CalculateCableSize([FromBody] CableSizingRequest request)
    {
        // HTTP Request arrives here from frontend
        // We process it and return a response
        
        try
        {
            // Call the business logic service
            var result = await _cableSizingService.CalculateAsync(request);
            
            // Return response to frontend (as JSON)
            return Ok(result);  // 200 OK
        }
        catch (Exception ex)
        {
            // If error occurs, return error response
            return BadRequest(new { message = ex.Message });  // 400 Bad Request
        }
    }
}

// Typical response format (JSON):
{
    "cableNumber": "FDR-MAIN-002",
    "fullLoadCurrent": 146.45,
    "deratedCurrent": 168.33,
    "suitableCableSize": 70,
    "voltageDropPercent": 0.85,
    "status": "valid"
}
```

## Service Layer (Business Logic)

```csharp
// Services contain the actual calculations and logic
// Controllers just pass data to services

public interface ICableSizingService
{
    Task<CableSizingResult> CalculateAsync(CableSizingRequest request);
}

public class CableSizingService : ICableSizingService
{
    // Constructor - dependency injection
    // The database context is "injected" here
    public CableSizingService(SceapDbContext context)
    {
        _context = context;
    }
    
    public async Task<CableSizingResult> CalculateAsync(CableSizingRequest request)
    {
        // Step 1: Validate input
        if (request.LoadKW <= 0)
            throw new ArgumentException("Load must be greater than 0");
        
        // Step 2: Calculate FLC (Full Load Current)
        // Formula: I = P / (√3 × V × PF × η)
        const double sqrt3 = 1.732;
        const double powerFactor = 0.85;  // Assumed
        const double efficiency = 0.95;    // Assumed
        
        double flc = (request.LoadKW * 1000) / 
                     (sqrt3 * request.Voltage * powerFactor * efficiency);
        
        // Step 3: Apply derating factor
        double deratedCurrent = flc / request.DeratingFactor;
        
        // Step 4: Find appropriate cable size
        int cableSizeByCurrentsize = SelectCableSize(deratedCurrent * 1.25);
        
        // Step 5: Calculate voltage drop
        double resistance = GetCableResistance(cableSizeByCurrentSize);
        double voltageDrop = (sqrt3 * deratedCurrent * resistance * request.Length) / 1000;
        double vdropPercent = (voltageDrop / request.Voltage) * 100;
        
        // Step 6: Return result
        return new CableSizingResult
        {
            FullLoadCurrent = flc,
            DeratedCurrent = deratedCurrent,
            SuitableCableSize = cableSizeByCurrentSize,
            VoltageDropPercent = vdropPercent,
            Status = vdropPercent <= 5 ? "valid" : "invalid"
        };
    }
    
    // Helper: Look up cable size from ampacity table
    private int SelectCableSize(double requiredCurrent)
    {
        // Ampacity table (size -> max current)
        var ampacity = new Dictionary<int, int>
        {
            { 1, 13 },
            { 2.5, 25 },
            { 4, 33 },
            { 10, 61 },
            { 16, 80 },
            { 25, 110 },
            { 35, 150 },
            { 50, 190 },
            { 70, 245 },
            { 95, 310 }
        };
        
        // Find minimum size that meets requirement
        foreach (var size in ampacity.Keys.OrderBy(k => k))
        {
            if (ampacity[size] >= requiredCurrent)
                return size;
        }
        
        // If nothing found, return largest
        return 95;
    }
}
```

## Database Models & Entity Framework

```csharp
// Models represent database tables

public class Cable
{
    [Key]
    public int Id { get; set; }                    // Primary key (auto-generated)
    
    public int SerialNo { get; set; }              // Serial number from Excel
    public string CableNumber { get; set; }        // Cable ID
    public string FeederDescription { get; set; }  // Description
    public string FromBus { get; set; }            // From equipment
    public string ToBus { get; set; }              // To equipment
    
    public double Voltage { get; set; }            // Operating voltage
    public double LoadKW { get; set; }             // Power load
    public double Length { get; set; }             // Cable length
    public double DeratingFactor { get; set; }     // Derating
    
    [ForeignKey(nameof(Project))]
    public int ProjectId { get; set; }             // Which project does this belong to?
    
    public Project Project { get; set; }           // Navigation property
}

public class CableSizingResult
{
    [Key]
    public int Id { get; set; }                    // Primary key
    
    public double FullLoadCurrent { get; set; }    // Calculated FLC
    public double DeratedCurrent { get; set; }     // After derating
    public int SuitableCableSize { get; set; }     // Recommended size in mm²
    public double VoltageDropPercent { get; set; } // Calculated V-drop %
    public string Status { get; set; }             // "valid" or "invalid"
    
    [ForeignKey(nameof(Cable))]
    public int CableId { get; set; }               // Which cable is this result for?
    
    public Cable Cable { get; set; }               // Navigation property
}

// Database Context - Maps all models to database
public class SceapDbContext : DbContext
{
    public SceapDbContext(DbContextOptions<SceapDbContext> options) 
        : base(options) { }
    
    public DbSet<Project> Projects { get; set; }           // All projects
    public DbSet<Cable> Cables { get; set; }               // All cables
    public DbSet<CableSizingResult> CableSizingResults { get; set; }  // All results
    // ... more models
}
```

---

# 5. Key Algorithms Explained

## Algorithm 1: Breadth-First Search (BFS) for Path Discovery

**What is it?**
A graph traversal algorithm that explores step-by-step.

**Real-world analogy:**
Imagine you're at a train station and want to reach a specific destination:
- You ask: "What trains leave from here?"
- You board one
- You ask: "Where does this train go? Are there more trains from there?"
- You keep asking until you reach your destination

**How BFS works in our code:**

```
Start: UPS-PANEL (Equipment)
Goal: Find path to TRF-MAIN (Transformer)

Step 1: From UPS-PANEL, what cable goes out?
   → Cable FDR-MAIN-002 goes from UPS-PANEL to MAIN-DISTRIBUTION
   → Add to path

Step 2: From MAIN-DISTRIBUTION, what cable goes out?
   → Cable INC-MAIN-001 goes from MAIN-DISTRIBUTION to TRF-MAIN
   → Add to path
   → ✓ TRANSFORMER FOUND! Path complete!

Result: Path = [FDR-MAIN-002, INC-MAIN-001]
       UPS-PANEL → MAIN-DISTRIBUTION → TRF-MAIN
```

**Why BFS?**
- Guarantees shortest path
- Explores systematically
- No redundant paths

---

# 6. Cable Sizing Formulas

## Formula 1: Full Load Current (FLC)

```
Formula: I = (P × 1000) / (√3 × V × PF × η)

Where:
  I   = Current in Amperes (A)
  P   = Power in kilowatts (kW)
  √3  = 1.732 (square root of 3, for three-phase systems)
  V   = Voltage in volts (V)
  PF  = Power Factor (typically 0.85 for motors, 0.95 for other loads)
  η   = Efficiency (typically 0.95, meaning 5% loss)

Example:
  A motor consuming 85 kW at 415V with PF=0.85, Efficiency=0.95
  
  I = (85 × 1000) / (1.732 × 415 × 0.85 × 0.95)
  I = 85,000 / 579.4
  I = 146.5 Amperes

Why this formula?
- Three-phase systems use √3 factor
- Power Factor accounts for reactive power (doesn't do useful work)
- Efficiency accounts for losses in the system
```

## Formula 2: Derating Current

```
Formula: I_derated = I_flc / Derating_Factor

Where:
  I_derated      = Current after environmental derating
  I_flc          = Full load current calculated above
  Derating_Factor = Environmental reduction (0.87 to 1.0)

Example:
  If FLC = 146.5A and Derating_Factor = 0.87
  
  I_derated = 146.5 / 0.87 = 168.4A

Why derating?
- Cables generate heat based on load
- In hot environments (>30°C), cables can't dissipate heat well
- We reduce the allowed current to prevent overheating
- Derating factors are from IEC 60364 standards
```

## Formula 3: Voltage Drop Calculation

```
Formula: V_drop = (√3 × I × R × L) / 1000

Where:
  V_drop = Voltage drop in volts (V)
  √3     = 1.732 (three-phase factor)
  I      = Current in Amperes (A)
  R      = Cable resistance in Ω/km
  L      = Cable length in meters (m)
  1000   = Conversion factor for km to m

Example:
  Cable: 70mm², Length: 45m, Current: 168.4A, Resistance: 0.268 Ω/km
  
  V_drop = (1.732 × 168.4 × 0.268 × 45) / 1000
  V_drop = (1.732 × 168.4 × 0.268 × 0.045)  [converted 45m to 0.045km]
  V_drop = 3.52 Volts

Percentage: V_drop % = (V_drop / V_nominal) × 100 = (3.52 / 415) × 100 = 0.85%

IEC 60364 Standard: Voltage drop should be ≤ 5%
- Your result (0.85%) is ✓ VALID

Why this matters?
- Too much voltage drop = equipment doesn't get enough voltage to operate
- Voltage drop increases with:
  * Higher current (more load)
  * Longer cables (more resistance)
  * Smaller cable (higher resistance per mm²)
```

## Formula 4: Selecting Cable Size

```
Three methods are used:

METHOD 1: Size by Current Rating
  Required Current = Derated Current × 1.25 (safety factor)
  Look up in ampacity table: Find minimum size that can carry this current
  
  Example: Required = 168.4 × 1.25 = 210.5A
  From table: 70mm² = 245A ✓ (This works!)
  Result: Size by Current = 70mm²

METHOD 2: Size by Voltage Drop (IEC 60364)
  Constraint: V_drop % ≤ 5%
  Try each size and calculate V_drop%
  Select SMALLEST size where V_drop % ≤ 5%
  
  Testing:
  - Try 50mm²: V_drop = 5.2% ✗ (Too high!)
  - Try 70mm²: V_drop = 3.8% ✓ (Good!)
  Result: Size by V-Drop = 70mm²

METHOD 3: Size by Short-Circuit
  Constraint: Cable must withstand short-circuit current
  This is complex (involves fault analysis)
  Conservative approach: Use 25mm² minimum
  Result: Size by Isc = 25mm²

FINAL DECISION:
  Final Size = MAX(Size by Current, Size by V-Drop, Size by Isc)
             = MAX(70, 70, 25)
             = 70mm²

Why take the maximum?
- Safety: Conservative approach prevents undersizing
- All three methods protect different aspects:
  * Current rating: Prevents melting
  * Voltage drop: Ensures equipment gets enough voltage
  * Short-circuit: Survives fault conditions
```

---

# 7. Data Flow & State Management

## Complete Request Flow

```
USER ACTION (Uploads Excel file)
         ↓
┌─────────────────────────────────┐
│  Frontend: SizingTab.tsx         │ ← User selects and drops Excel file
│                                 │
│ - Read file using XLSX library  │
│ - Parse Excel sheet             │
│ - Create CableSegment objects   │
│ - Store in pathAnalysis state   │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  React Context (PathContext)    │
│                                 │
│  pathAnalysis = {               │
│    paths: [],                   │
│    totalPaths: 0,               │
│    validPaths: 0                │
│  }                              │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Frontend: OptimizationTab.tsx  │ ← Reads pathAnalysis from context
│                                 │
│ - Calls pathDiscoveryService()  │
│ - Runs BFS algorithm            │
│ - Discovers paths               │
│ - Updates state                 │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Frontend: ResultsTab.tsx        │ ← Reads updated pathAnalysis
│                                 │
│ - Iterates through paths        │
│ - Iterates through cables       │
│ - Calls calculateCableSizing()  │
│ - Gets calculated results       │
└─────────────────────────────────┘
         ↓
USER SEES:
- Results table with all calculations
- Export buttons (Excel, PDF)
- Analysis summary cards
```

## React Context Flow (State Sharing)

```typescript
// 1. Create Context
const PathContext = createContext<PathContextType | null>(null);

// 2. Wrap App with Provider
<PathContextProvider>
  <App />
</PathContextProvider>

// 3. Any component can now access pathAnalysis:
const SizingTab = () => {
  const { pathAnalysis, setPathAnalysis } = useContext(PathContext)!;
  
  // Update state (triggers re-renders in all components using this context)
  setPathAnalysis({
    paths: discoveredPaths,
    totalPaths: discoveredPaths.length,
    validPaths: discoveredPaths.filter(p => p.isValid).length,
    invalidPaths: discoveredPaths.filter(p => !p.isValid).length,
    // ... more fields
  });
};

// 4. ResultsTab automatically gets the update
const ResultsTab = () => {
  const { pathAnalysis } = useContext(PathContext)!;
  
  // When pathAnalysis changes, this effect runs
  useEffect(() => {
    // Re-calculate results
    const newResults = generateResults(pathAnalysis);
    setResults(newResults);
  }, [pathAnalysis]);  // Dependency: watch for changes
};

// Why Context?
// - No prop drilling (passing through many components)
// - Shared state across entire app
// - Any component can read or update
```

---

# 8. UI Component Breakdown

## Understanding the Results Table

```
┌────────────────────────────────────────────────────────────────┐
│                    RESULTS TABLE STRUCTURE                    │
├────────────────────────────────────────────────────────────────┤
│ S.No │ Cable # │ Description │ From Bus │ To Bus │ ... (more) │
├──────┼─────────┼─────────────┼──────────┼────────┼────────────┤
│  1   │ INC-... │ MAIN DISTRI. │ MAIN-... │ TRF... │ ...        │
│  2   │ FDR-... │ Feeder to U. │ UPS-P.. │ MAIN-. │ ...        │
│  3   │ FDR-... │ Feeder to H. │ HVAC-P. │ MAIN-. │ ...        │
└──────┴─────────┴─────────────┴──────────┴────────┴────────────┘

CONTINUED →  V(V) │ Load(kW) │ L(m) │ FLC(A) │ Derated(A) │ ...
             ─────┼──────────┼──────┼────────┼────────────┤
              415 │ 0        │  8.0 │ 0.00   │ 0.00       │
              415 │ 85.0     │ 45.0 │ 146.45 │ 168.33     │
              415 │ 120.0    │ 55.0 │ 206.75 │ 234.94     │

CONTINUED → R(Ω/km) │ V-Drop(V) │ V-Drop(%) │ Size-I │ Size-V │ ...
            ────────┼───────────┼──────────┼───────┼───────┤
            0.0000  │ 0.00      │ 0.00     │ 1mm²  │ 1mm²  │
            0.1930  │ 3.52      │ 0.85     │ 70mm² │ 70mm² │
            0.1930  │ 4.43      │ 1.07     │ 95mm² │ 95mm² │

CONTINUED → Size-Isc │ Final Size │ Breaker  │ Status
            ────────┼────────────┼──────────┼─────────
            25mm²   │ 25mm²      │ 20A      │ VALID ✓
            25mm²   │ 70mm²      │ 160A     │ VALID ✓
            25mm²   │ 95mm²      │ 225A     │ VALID ✓
```

### Each Column Explained

| Column | Meaning | Example | Why It Matters |
|--------|---------|---------|----------------|
| S.No | Serial number | 1, 2, 3 | Identifies each cable uniquely |
| Cable # | Cable identifier | FDR-MAIN-002 | Maps to actual cable in field |
| Description | What is it? | "Feeder to UPS" | For human understanding |
| From Bus | Starting equipment | UPS-PANEL | Where cable originates |
| To Bus | Ending equipment | MAIN-DISTRIBUTION | Where cable terminates |
| V | Operating voltage | 415V | Required for FLC calculation |
| Load (kW) | Power transmitted | 85 kW | Input for current calculation |
| L (m) | Cable length | 45 meters | Used for voltage drop calc |
| FLC (A) | Full Load Current | 146.45 A | Raw current requirement |
| Derated (A) | After derating | 168.33 A | Adjusted for environment |
| R (Ω/km) | Cable resistance | 0.193 Ω/km | Determines voltage drop |
| V-Drop (V) | Voltage loss | 3.52 V | Absolute voltage loss |
| V-Drop (%) | Percentage loss | 0.85% | Compared against IEC limit |
| **Size-I** | **By Current** | **70mm²** | Based on current capacity |
| **Size-V** | **By V-Drop** | **70mm²** | Based on voltage constraint |
| Size-Isc | By Short-circuit | 25mm² | Based on fault protection |
| **Final Size** | **RECOMMENDED** | **70mm²** | **Maximum of all three** |
| Breaker | Breaker rating | 160A | Circuit protection |
| Status | Valid? | VALID ✓ | Meets all constraints |

### Why Vertical Scrollbar?

```html
<!-- Container with fixed height allows scrolling -->
<div 
  className="overflow-y-auto"  ← Enables vertical scrolling
  style={{ height: '1000px' }}  ← Fixed height
>
  <table>
    <thead className="sticky top-0">  ← Header stays visible
      {/* Column headers */}
    </thead>
    <tbody>
      {/* Rows are rendered here */}
      {/* More rows than fit in 1000px → scrollable */}
    </tbody>
  </table>
</div>

Why fixed height?
- Shows ~30-40 rows at once
- Don't need to scroll forever to see bottom
- Keeps interface manageable
- Users scroll within table, not entire page
```

---

# 9. Key Files Explained Line-by-Line

## File 1: `src/utils/pathDiscoveryService.ts`

**What does this file do?**
Contains algorithms for discovering paths and normalizing data.

**Key lines explained:**

```typescript
// Line 1-20: Defines data structures
export interface CableSegment {
  serialNo: number;              // ← Unique number for each cable
  cableNumber: string;           // ← Human-readable ID
  feederDescription: string;     // ← What is this cable for?
  fromBus: string;               // ← Starting point
  toBus: string;                 // ← Ending point
  // ... more fields
}

// Why interfaces?
// - Define shape of data
// - TypeScript checks types at compile-time
// - Prevents errors like passing wrong data

// Line 21-50: Define path structure
export interface CablePath {
  pathId: string;                // ← Unique path ID (PATH-001)
  cables: CableSegment[];        // ← Array of cables in this path
  voltageDropPercent: number;    // ← Calculated voltage drop
  isValid: boolean;              // ← Passes IEC standards?
  // ... more fields
}

// Line 51-70: Normalize Excel data
export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  // rawFeeders = data directly from Excel (messy, inconsistent column names)
  // This function cleans it up
  
  return rawFeeders
    .filter((f) => f['From Bus'])        // Skip invalid rows
    .map((feeder) => ({                  // Transform each row
      serialNo: feeder['Serial No'] || 0,                      // Default to 0
      cableNumber: feeder['Cable Number'] || '',               // Default to ''
      feederDescription: feeder['Feeder Description'] || '',   // Default to ''
      voltage: Number(feeder['Voltage (V)'] || 415),           // Default to 415V
      loadKW: Number(feeder['Load KW'] || 0),                  // Default to 0kW
      // ... more fields with defaults
    }));
};

// Why defaults?
// - Excel might have missing values
// - Defaults prevent crashes
// - System keeps running with reasonable assumptions

// Line 100-150: The BFS Algorithm
const tracePathToTransformer = (
  startEquipment: string,
  cables: CableSegment[],
  transformerBuses: Set<string>
): CablePath => {
  // Start: Find path from startEquipment to any transformer
  
  const visited = new Set<string>();  // Track where we've been
  const queue: { bus: string; path: CableSegment[] }[] = [
    { bus: startEquipment, path: [] }   // Queue starts with origin
  ];
  
  // BFS Loop
  while (queue.length > 0) {
    // Take first item from queue (FIFO - First In First Out)
    const current = queue.shift()!;
    
    // Skip if already visited (prevents infinite loops)
    if (visited.has(current.bus)) continue;
    visited.add(current.bus);
    
    // Find cable from this bus
    const connectingCable = cables.find((c) => c.fromBus === current.bus);
    if (!connectingCable) continue;  // Dead end
    
    // Add cable to path
    const newPath = [...current.path, connectingCable];
    
    // Check if destination is transformer
    if (transformerBuses.has(connectingCable.toBus)) {
      // ✓ Found destination! Build result and return
      return {
        pathId: '',
        cables: newPath,
        endTransformer: connectingCable.toBus,
        // ... set other fields
      };
    }
    
    // Continue searching
    queue.push({ bus: connectingCable.toBus, path: newPath });
  }
  
  // Return empty if no path found
  return emptyPath;
};

// Why this algorithm?
// - Explores one step at a time
// - Guarantees shortest path
// - Handles any network structure
```

## File 2: `src/components/ResultsTab.tsx`

**What does this file do?**
Calculates cable sizes and displays results in a table.

**Key sections:**

```typescript
// Line 1-30: Imports
// - React hooks (state management)
// - Lucide icons (visual elements)
// - XLSX (Excel export)
// - jsPDF (PDF export)
// - Context (access global state)

// Line 33-55: Ampacity Table
const CABLE_AMPACITY: Record<number, number> = {
  1: 13,      // 1mm² cable carries max 13 Amps
  2.5: 25,    // 2.5mm² carries max 25 Amps
  10: 61,     // 10mm² carries max 61 Amps
  70: 245,    // 70mm² carries max 245 Amps ← Our example uses this
  // ... more sizes
};

// Why a lookup table?
// - IEC 60227 standard (approved by electrical commission)
// - Pre-calculated values from testing
// - Fast lookup (O(1) complexity)

// Line 89-180: Main Calculation Function
const calculateCableSizing = (cable: CableSegment): CableSizingResult => {
  const PF = 0.85;            // Power Factor (standard for motors)
  const EFFICIENCY = 0.95;    // System efficiency (5% loss)
  const SQRT3 = 1.732;        // Three-phase factor
  
  // Step 1: FLC = P / (√3 × V × PF × η)
  const FLC = (cable.loadKW * 1000) / (SQRT3 * cable.voltage * PF * EFFICIENCY);
  
  // Step 2: Derate (adjust for environment)
  const deratedCurrent = FLC / cable.deratingFactor;
  
  // Step 3: Find size that handles current with 1.25 safety factor
  const requiredCurrent = deratedCurrent * 1.25;
  let sizeByCurrent = 1;  // Start with smallest
  for (const [size, capacity] of Object.entries(CABLE_AMPACITY)) {
    if (capacity >= requiredCurrent) {
      sizeByCurrent = Number(size);  // Found it!
      break;
    }
  }
  
  // Step 4: Check voltage drop
  const cableResistance = CABLE_RESISTANCE[sizeByCurrent] || 0.727;
  const vdrop = (SQRT3 * deratedCurrent * cableResistance * cable.length) / 1000;
  const vdropPercent = (vdrop / cable.voltage) * 100;
  
  // Step 5: Size by V-drop (must be ≤ 5%)
  let sizeByVoltageDrop = sizeByCurrent;
  for (const size of [25, 35, 50, 70, 95, 120]) {
    const R = CABLE_RESISTANCE[size] || 0.727;
    const vd = (SQRT3 * deratedCurrent * R * cable.length) / 1000;
    const vdp = (vd / cable.voltage) * 100;
    if (vdp <= 5) {
      sizeByVoltageDrop = size;
      break;
    }
  }
  
  // Step 6: Size by short-circuit
  const sizeByShortCircuit = 25;  // Conservative
  
  // Step 7: Choose largest (safest)
  const suitableSize = Math.max(
    sizeByCurrent,
    sizeByVoltageDrop,
    sizeByShortCircuit
  );
  
  // Return all calculations
  return {
    serialNo: cable.serialNo,
    fullLoadCurrent: FLC,
    deratedCurrent: deratedCurrent,
    sizeByCurrent: sizeByCurrent,
    sizeByVoltageDrop: sizeByVoltageDrop,
    sizeByShortCircuit: sizeByShortCircuit,
    suitableCableSize: suitableSize,
    voltageDropPercent: vdropPercent,
    status: vdropPercent <= 5 ? 'valid' : 'invalid'
  };
};

// Line 182-215: React Component
const ResultsTab = () => {
  // Get context
  const { pathAnalysis } = usePathContext();
  
  // Local state
  const [results, setResults] = useState<CableSizingResult[]>([]);
  
  // Effect: When pathAnalysis changes, recalculate
  useEffect(() => {
    if (pathAnalysis && pathAnalysis.paths.length > 0) {
      const allCables: CableSizingResult[] = [];
      const seen = new Set<number>();  // Deduplication
      
      // Flatten all cables from all paths
      pathAnalysis.paths.forEach((path) => {
        path.cables.forEach((cable) => {
          // Only process each cable once
          if (!seen.has(cable.serialNo)) {
            seen.add(cable.serialNo);
            const result = calculateCableSizing(cable);
            allCables.push(result);
          }
        });
      });
      
      setResults(allCables);  // Update state, re-render
    }
  }, [pathAnalysis]);  // Run when pathAnalysis changes
  
  // Export to Excel
  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Serial No': r.serialNo,
      'Cable Number': r.cableNumber,
      'FLC (A)': r.fullLoadCurrent.toFixed(2),
      'Derated (A)': r.deratedCurrent.toFixed(2),
      'Final Size (mm²)': r.suitableCableSize,
      'V-Drop (%)': r.voltageDropPercent.toFixed(2),
      'Status': r.status,
      // ... more columns
    }));
    
    // Create Excel workbook from data
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    
    // Download to user's computer
    XLSX.writeFile(workbook, `cable_sizing_${new Date()}.xlsx`);
  };
  
  // Export to PDF (similar logic)
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    // ... create table, add to PDF, save
  };
  
  // Render: What user sees
  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <button onClick={handleExportExcel}>Export Excel</button>
      <button onClick={handleExportPDF}>Export PDF</button>
      
      {/* Results table */}
      <div className="overflow-y-auto" style={{ height: '1000px' }}>
        <table className="w-full">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Cable #</th>
              <th>Description</th>
              {/* ... more headers */}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={`${result.cableNumber}-${result.serialNo}`}>
                <td>{result.serialNo}</td>
                <td>{result.cableNumber}</td>
                <td>{result.feederDescription}</td>
                {/* ... more columns */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-3">
        <div>
          <p className="text-2xl">{results.length}</p>
          <p>Total Cables</p>
        </div>
        <div>
          <p className="text-2xl">
            {results.filter((r) => r.status === 'valid').length}
          </p>
          <p>Valid Cables</p>
        </div>
        {/* ... more cards */}
      </div>
    </div>
  );
};
```

---

# 10. Common Workflows

## Workflow 1: User Uploads Excel File

```
USER CLICKS "UPLOAD FILE"
         ↓
┌─────────────────────────────────┐
│ File Browser Opens              │
│ User selects Excel file         │
│ Confirms selection              │
└─────────────────────────────────┘
         ↓ File data arrives in browser
┌─────────────────────────────────┐
│ XLSX Library reads file         │
│                                 │
│ const workbook =                │
│   XLSX.read(fileData);          │
│                                 │
│ const data =                    │
│   XLSX.utils.sheet_to_json(     │
│     workbook.Sheets[0]          │
│   );                            │
└─────────────────────────────────┘
         ↓ data = [{ row1 }, { row2 }, ...]
┌─────────────────────────────────┐
│ Normalize the data              │
│                                 │
│ const cables =                  │
│   normalizeFeeders(data);       │
│                                 │
│ Result: Array of CableSegment   │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Store in PathContext            │
│                                 │
│ setPathAnalysis({               │
│   paths: [],                    │
│   cables: cables,               │
│ });                             │
└─────────────────────────────────┘
         ↓
USER SEES:
- Cable data displayed in table
- Ready to proceed to Optimization
```

## Workflow 2: Path Discovery Algorithm

```
USER CLICKS "DISCOVER PATHS" (or auto-runs)
         ↓
┌─────────────────────────────────┐
│ Identify Transformers           │
│                                 │
│ const transformerBuses =        │
│   cables                        │
│   .filter(c =>                  │
│     c.toBus.includes('TRF')     │
│   )                             │
│   .map(c => c.toBus);           │
│                                 │
│ Result: ["TRF-MAIN"]            │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Identify Equipment              │
│                                 │
│ const equipmentBuses =          │
│   cables                        │
│   .filter(c =>                  │
│     !transformerBuses.          │
│       includes(c.fromBus)       │
│   )                             │
│   .map(c => c.fromBus);         │
│                                 │
│ Result: ["UPS-PANEL",           │
│          "HVAC-PANEL",          │
│          "LIGHTING-PANEL"]      │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ For each equipment, run BFS     │
│                                 │
│ for (equipment of               │
│      equipmentBuses) {          │
│   const path =                  │
│     tracePathToTransformer(     │
│       equipment,                │
│       cables,                   │
│       transformerBuses          │
│     );                          │
│   paths.push(path);             │
│ }                               │
│                                 │
│ Result: Array of CablePath      │
└─────────────────────────────────┘
         ↓
USER SEES:
- Paths grouped by equipment
- Each path shows: Equipment → ... → Transformer
- Cable descriptions for each step
```

## Workflow 3: Cable Sizing & Results

```
USER CLICKS "VIEW RESULTS" (or auto-runs)
         ↓
┌─────────────────────────────────┐
│ For each cable, calculate       │
│                                 │
│ results = paths                 │
│   .flatMap(p => p.cables)       │
│   .map(cable =>                 │
│     calculateCableSizing(cable) │
│   );                            │
│                                 │
│ Result: Array of                │
│   CableSizingResult             │
└─────────────────────────────────┘
         ↓ For each cable:
         │
         ├─ Calculate FLC = P/(√3×V×PF×η)
         ├─ Apply derat: I_d = I_flc / derating
         ├─ Size by current: Use ampacity table
         ├─ Calculate V-drop: (√3×I×R×L)/1000
         ├─ Size by V-drop: Ensure V-drop ≤ 5%
         ├─ Size by Isc: Use conservative 25mm²
         ├─ Final size = MAX(all three)
         └─ Status = V-drop ≤ 5% ? 'valid' : 'invalid'
         ↓
┌─────────────────────────────────┐
│ Display Results in Table        │
│                                 │
│ results.map(r => <TableRow />)  │
│                                 │
│ Shows:                          │
│ - All calculations              │
│ - Final recommended size        │
│ - Validation status             │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ User can export                 │
│                                 │
│ Excel: XLSX.writeFile()         │
│ PDF: doc.save()                 │
└─────────────────────────────────┘
         ↓
USER SEES:
- Professional results table
- Downloads in Excel/PDF format
- Ready to share with stakeholders
```

---

# 11. Deployment & Setup

## How to Run Locally

### Prerequisites
- Node.js 18+ (for frontend)
- .NET Core 8 (for backend)
- Git (for version control)

### Frontend Setup

```bash
# Navigate to frontend directory
cd sceap-frontend

# Install dependencies (installs packages listed in package.json)
npm install

# Start development server (opens on port 5173)
npm run dev
```

**What happens:**
1. npm reads `package.json`
2. Downloads all dependencies from npm registry
3. Vite starts a development server
4. Hot Module Reload (HMR) enabled - changes reload instantly
5. Navigate to http://localhost:5173

### Backend Setup

```bash
# Navigate to backend directory
cd sceap-backend

# Restore dependencies (downloads NuGet packages)
dotnet restore

# Run the application (listens on port 5000)
dotnet run
```

**What happens:**
1. dotnet reads `SCEAP.csproj`
2. Downloads all NuGet packages
3. Compiles C# code to IL (Intermediate Language)
4. Starts ASP.NET Core server
5. Creates SQLite database (sceap.db)
6. Opens API documentation at http://localhost:5000/swagger/ui

## Project Initialization (Why Things Are Where They Are)

### Why Separate Folders?

**sceap-frontend/**
- Contains React application
- Independent Node.js project
- Has its own `package.json` and dependencies
- Can be deployed to CDN or web server
- Can be built/released separately

**sceap-backend/**
- Contains .NET application
- Independent .NET project
- Has its own `SCEAP.csproj` and dependencies
- Runs on server/cloud
- Can be deployed separately

### Why This Architecture?

```
Traditional Approach (Monolithic):
┌───────────────────────────────┐
│     ONE BIG PROJECT           │
│  Frontend + Backend combined  │
└───────────────────────────────┘
Disadvantages:
- Hard to scale frontend independently
- Hard to update backend without updating frontend
- One failure affects everything
- Tech stack limits

Our Approach (Microservices):
┌──────────────┐         ┌──────────────┐
│   Frontend   │◄────────┤   Backend    │
│  (React)     │   HTTP  │  (.NET)      │
└──────────────┘         └──────────────┘
Advantages:
- Scale independently
- Deploy independently
- Fail independently (if backend down, frontend can show cached data)
- Use best tech for each layer
- Frontend team ≠ Backend team can work in parallel
```

---

# Final Thoughts

## You Now Understand:

✅ **Architecture**: Why we separated frontend and backend
✅ **Technologies**: What each tool does and why it was chosen
✅ **Algorithms**: How path discovery works (BFS)
✅ **Formulas**: Cable sizing calculations step-by-step
✅ **React**: Components, state, hooks, context
✅ **TypeScript**: Type safety and interfaces
✅ **Data Flow**: How data moves through the app
✅ **UI Components**: What each column means and why
✅ **File Organization**: Why folders are structured this way
✅ **Workflows**: How complete features work end-to-end

## When Exploring Code:

1. **Start with the user flow**: What does the user do?
2. **Follow the data**: Where does it come from?
3. **Read the interfaces**: What data shape are we working with?
4. **Understand the logic**: Why are we calculating this?
5. **See the results**: How is it displayed to the user?

## Resources for Deeper Learning:

- **React Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **IEC 60364**: Electrical installation safety standard
- **Entity Framework Docs**: https://docs.microsoft.com/en-us/ef/
- **.NET Docs**: https://docs.microsoft.com/en-us/dotnet/

---

**Created with ❤️ for UdayKiranRathod**  
**Your Platform. Your Knowledge.**
