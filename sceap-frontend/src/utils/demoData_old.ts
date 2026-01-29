/**
 * Demo Data Generator - Creates sample feeder data for testing
 * This data structure is guaranteed to work with pathDiscoveryService
 */

export const generateDemoData = () => {
  return [
    // ============ TRANSFORMER (Level 0 - Top) ============
    {
      'Serial No': 1,
      'Cable Number': 'CBL-001',
      'Feeder Description': 'Main Transformer',
      'From Bus': 'MAIN-PANEL',
      'To Bus': 'TRF-MAIN',
      'Voltage (V)': 415,
      'Power Factor': 0.95,
      'Efficiency (%)': 98,
      'Derating Factor': 1.0,
      'Breaker Type': 'ISOLATOR',
      'Load KW': 0,
      'Load KVA': 0,
      'Cable Type': 'XLPE',
      'Installation Method': 'Cable Tray',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 5.0
    },

    // ============ MAIN PANEL (Level 1) ============
    {
      'Serial No': 2,
      'Cable Number': 'CBL-002',
      'Feeder Description': 'To PMCC-1',
      'From Bus': 'PMCC-1',
      'To Bus': 'MAIN-PANEL',
      'Voltage (V)': 415,
      'Power Factor': 0.85,
      'Efficiency (%)': 95,
      'Derating Factor': 0.87,
      'Breaker Type': 'ACB',
      'Load KW': 80.0,
      'Load KVA': 94.1,
      'Cable Type': 'XLPE',
      'Installation Method': 'Cable Tray',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 30.0
    },

    {
      'Serial No': 3,
      'Cable Number': 'CBL-003',
      'Feeder Description': 'To PMCC-2',
      'From Bus': 'PMCC-2',
      'To Bus': 'MAIN-PANEL',
      'Voltage (V)': 415,
      'Power Factor': 0.86,
      'Efficiency (%)': 94,
      'Derating Factor': 0.88,
      'Breaker Type': 'ACB',
      'Load KW': 60.0,
      'Load KVA': 69.8,
      'Cable Type': 'XLPE',
      'Installation Method': 'Cable Tray',
      'Ambient Temp (°C)': 38,
      'Ground Temp (°C)': 28,
      'Length (m)': 25.0
    },

    // ============ PMCC-1 PANEL (Level 2) ============
    {
      'Serial No': 4,
      'Cable Number': 'CBL-004',
      'Feeder Description': 'Motor M1 (50kW)',
      'From Bus': 'PMCC-1',
      'To Bus': 'MOTOR-M1',
      'Voltage (V)': 415,
      'Power Factor': 0.82,
      'Efficiency (%)': 89,
      'Derating Factor': 0.90,
      'Breaker Type': 'MCCB',
      'Load KW': 50.0,
      'Load KVA': 61.0,
      'Cable Type': 'XLPE',
      'Installation Method': 'Conduit',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 20.0
    },

    {
      'Serial No': 5,
      'Cable Number': 'CBL-005',
      'Feeder Description': 'Motor M2 (30kW)',
      'From Bus': 'PMCC-1',
      'To Bus': 'MOTOR-M2',
      'Voltage (V)': 415,
      'Power Factor': 0.82,
      'Efficiency (%)': 88,
      'Derating Factor': 0.89,
      'Breaker Type': 'MCCB',
      'Load KW': 30.0,
      'Load KVA': 36.6,
      'Cable Type': 'PVC',
      'Installation Method': 'Conduit',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 15.0
    },

    // ============ PMCC-2 PANEL (Level 2) ============
    {
      'Serial No': 6,
      'Cable Number': 'CBL-006',
      'Feeder Description': 'Pump P1 (25kW)',
      'From Bus': 'PMCC-2',
      'To Bus': 'PUMP-P1',
      'Voltage (V)': 415,
      'Power Factor': 0.85,
      'Efficiency (%)': 91,
      'Derating Factor': 0.89,
      'Breaker Type': 'MCCB',
      'Load KW': 25.0,
      'Load KVA': 29.4,
      'Cable Type': 'PVC',
      'Installation Method': 'Conduit',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 18.0
    },

    {
      'Serial No': 7,
      'Cable Number': 'CBL-007',
      'Feeder Description': 'Lighting Panel L1 (15kW)',
      'From Bus': 'PMCC-2',
      'To Bus': 'LIGHT-L1',
      'Voltage (V)': 415,
      'Power Factor': 0.95,
      'Efficiency (%)': 98,
      'Derating Factor': 0.92,
      'Breaker Type': 'MCB',
      'Load KW': 15.0,
      'Load KVA': 15.8,
      'Cable Type': 'PVC',
      'Installation Method': 'Cable Tray',
      'Ambient Temp (°C)': 35,
      'Ground Temp (°C)': 25,
      'Length (m)': 12.0
    }
  ];
};

/**
 * Explanation of Demo Data Structure:
 * 
 * HIERARCHICAL STRUCTURE (Top to Bottom):
 * 
 * TRF-MAIN (Transformer)
 *   └─→ MAIN-PANEL (Main Distribution Panel)
 *       ├─→ PMCC-1 (Power Management & Control Center 1)
 *       │   ├─→ MOTOR-M1 (50kW Motor)
 *       │   └─→ MOTOR-M2 (30kW Motor)
 *       └─→ PMCC-2 (Power Management & Control Center 2)
 *           ├─→ PUMP-P1 (25kW Pump)
 *           └─→ LIGHT-L1 (Lighting Panel 15kW)
 * 
 * KEY RULES:
 * 1. "From Bus" = Source of the cable (child node)
 * 2. "To Bus" = Destination of the cable (parent node)
 * 3. Cable always goes FROM lower level TO higher level (towards transformer)
 * 4. Loads (motors, pumps, lights) are at the bottom
 * 5. Panels are in the middle
 * 6. Transformer is at the top
 * 
 * DISCOVERED PATHS (System will find these automatically):
 * 
 * PATH-1: MOTOR-M1 ← PMCC-1 ← MAIN-PANEL ← TRF-MAIN
 *         Load: 50kW, Distance: 20+30+5 = 55m
 * 
 * PATH-2: MOTOR-M2 ← PMCC-1 ← MAIN-PANEL ← TRF-MAIN
 *         Load: 30kW, Distance: 15+30+5 = 50m
 * 
 * PATH-3: PUMP-P1 ← PMCC-2 ← MAIN-PANEL ← TRF-MAIN
 *         Load: 25kW, Distance: 18+25+5 = 48m
 * 
 * PATH-4: LIGHT-L1 ← PMCC-2 ← MAIN-PANEL ← TRF-MAIN
 *         Load: 15kW, Distance: 12+25+5 = 42m
 * 
 * VOLTAGE DROP VALIDATION:
 * All paths should show voltage drop < 5% (IEC 60364 compliant)
 * Green checkmark ✓ = Valid path
 */

/**
 * Column Definitions - What each column means:
 * 
 * Serial No         - Row number (1, 2, 3, ...)
 * Cable Number      - Unique cable ID (CBL-001, CBL-002, ...)
 * Feeder Description- Human-readable description of the feeder
 * From Bus          - Source bus (where the load/equipment is)
 * To Bus            - Destination bus (where power comes from)
 * Voltage (V)       - System voltage (usually 415V for 3-phase)
 * Power Factor      - 0.8-0.95 (typical values)
 * Efficiency (%)    - Equipment efficiency (85-98%)
 * Derating Factor   - Cable derating (0.85-1.0)
 * Breaker Type      - Type of protective device
 * Load KW           - Active power (0 for panel headers, >0 for loads)
 * Load KVA          - Apparent power (≈ KW / Power Factor)
 * Cable Type        - XLPE, PVC, EPR
 * Installation Method - Cable Tray, Conduit, Direct Burial
 * Ambient Temp (°C) - Environmental temperature
 * Ground Temp (°C)  - Ground/cable temperature
 * Length (m)        - Cable run length in meters
 */
