/**
 * CLEAN DEMO FEEDER LIST - Production Quality
 * 
 * Format: Standard 17-column Excel layout
 * Data: Realistic industrial building electrical distribution
 * Use: Template testing and platform validation
 * 
 * ALL NON-ZERO LOADS - Proper calculations guaranteed
 */

export const CLEAN_DEMO_FEEDERS = [
  // ===== PANEL 1: MAIN DISTRIBUTION (5 cables) =====
  {
    'Serial No': 1,
    'Cable Number': 'INC-MAIN-001',
    'Feeder Description': 'Main Incomer from Transformer',
    'From Bus': 'MAIN-DISTRIBUTION',
    'To Bus': 'TRF-MAIN',
    'Voltage (V)': 415,
    'Load KW': 400,          // Main feeder - large load
    'Length (m)': 10,
    'Power Factor': 0.95,
    'Efficiency (%)': 98,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 50
  },
  {
    'Serial No': 2,
    'Cable Number': 'FDR-MAIN-002',
    'Feeder Description': 'Feeder to UPS Panel - 85kW',
    'From Bus': 'UPS-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 85,
    'Length (m)': 45,
    'Power Factor': 0.95,
    'Efficiency (%)': 97,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 30
  },
  {
    'Serial No': 3,
    'Cable Number': 'FDR-MAIN-003',
    'Feeder Description': 'Feeder to HVAC Panel - 120kW',
    'From Bus': 'HVAC-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 120,
    'Length (m)': 55,
    'Power Factor': 0.85,
    'Efficiency (%)': 94,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 28
  },
  {
    'Serial No': 4,
    'Cable Number': 'FDR-MAIN-004',
    'Feeder Description': 'Feeder to Lighting Panel - 65kW',
    'From Bus': 'LIGHTING-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 65,
    'Length (m)': 35,
    'Power Factor': 1.0,
    'Efficiency (%)': 100,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 25
  },
  {
    'Serial No': 5,
    'Cable Number': 'FDR-MAIN-005',
    'Feeder Description': 'Feeder to General Distribution - 50kW',
    'From Bus': 'GEN-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 50,
    'Length (m)': 30,
    'Power Factor': 0.9,
    'Efficiency (%)': 96,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 20
  },

  // ===== MOTOR LOADS (with proper starting calculations) =====
  {
    'Serial No': 6,
    'Cable Number': 'MTR-001',
    'Feeder Description': 'Fire Pump Motor - 37kW',
    'From Bus': 'FIRE-PUMP-MOTOR',
    'To Bus': 'GEN-PANEL',
    'Voltage (V)': 415,
    'Load KW': 37,
    'Length (m)': 25,
    'Power Factor': 0.85,
    'Efficiency (%)': 92,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',          // Direct On Line - important!
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 12
  },
  {
    'Serial No': 7,
    'Cable Number': 'MTR-002',
    'Feeder Description': 'Water Pump Motor - 22kW',
    'From Bus': 'WATER-PUMP-MOTOR',
    'To Bus': 'GEN-PANEL',
    'Voltage (V)': 415,
    'Load KW': 22,
    'Length (m)': 30,
    'Power Factor': 0.85,
    'Efficiency (%)': 91,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'StarDelta',   // Star-Delta reduced starting
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 10
  },
  {
    'Serial No': 8,
    'Cable Number': 'MTR-003',
    'Feeder Description': 'Elevator Motor - 11kW',
    'From Bus': 'ELEVATOR-MOTOR',
    'To Bus': 'GEN-PANEL',
    'Voltage (V)': 415,
    'Load KW': 11,
    'Length (m)': 32,
    'Power Factor': 0.85,
    'Efficiency (%)': 90,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'SoftStarter', // Soft start
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 8
  },

  // ===== HVAC LOADS =====
  {
    'Serial No': 9,
    'Cable Number': 'HVAC-001',
    'Feeder Description': 'Chiller Unit 1 - 45kW',
    'From Bus': 'CHILLER-1',
    'To Bus': 'HVAC-PANEL',
    'Voltage (V)': 415,
    'Load KW': 45,
    'Length (m)': 20,
    'Power Factor': 0.85,
    'Efficiency (%)': 92,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 15
  },
  {
    'Serial No': 10,
    'Cable Number': 'HVAC-002',
    'Feeder Description': 'Chiller Unit 2 - 45kW',
    'From Bus': 'CHILLER-2',
    'To Bus': 'HVAC-PANEL',
    'Voltage (V)': 415,
    'Load KW': 45,
    'Length (m)': 25,
    'Power Factor': 0.85,
    'Efficiency (%)': 92,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 15
  },
  {
    'Serial No': 11,
    'Cable Number': 'HVAC-003',
    'Feeder Description': 'Cooling Tower Fan - 15kW',
    'From Bus': 'COOLING-TOWER',
    'To Bus': 'HVAC-PANEL',
    'Voltage (V)': 415,
    'Load KW': 15,
    'Length (m)': 15,
    'Power Factor': 0.85,
    'Efficiency (%)': 91,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 8
  },

  // ===== LIGHTING LOADS (Pure resistive, PF=1.0) =====
  {
    'Serial No': 12,
    'Cable Number': 'LTG-001',
    'Feeder Description': 'Floor 1 Lighting - 15kW',
    'From Bus': 'LIGHTING-FLOOR-1',
    'To Bus': 'LIGHTING-PANEL',
    'Voltage (V)': 415,
    'Load KW': 15,
    'Length (m)': 20,
    'Power Factor': 1.0,
    'Efficiency (%)': 100,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Max SC Current (kA)': 6
  },
  {
    'Serial No': 13,
    'Cable Number': 'LTG-002',
    'Feeder Description': 'Floor 2 Lighting - 15kW',
    'From Bus': 'LIGHTING-FLOOR-2',
    'To Bus': 'LIGHTING-PANEL',
    'Voltage (V)': 415,
    'Load KW': 15,
    'Length (m)': 25,
    'Power Factor': 1.0,
    'Efficiency (%)': 100,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Max SC Current (kA)': 6
  },
  {
    'Serial No': 14,
    'Cable Number': 'LTG-003',
    'Feeder Description': 'Outdoor Lighting - 20kW',
    'From Bus': 'OUTDOOR-LIGHTING',
    'To Bus': 'LIGHTING-PANEL',
    'Voltage (V)': 415,
    'Load KW': 20,
    'Length (m)': 40,
    'Power Factor': 1.0,
    'Efficiency (%)': 100,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Max SC Current (kA)': 8
  },

  // ===== UPS SYSTEM =====
  {
    'Serial No': 15,
    'Cable Number': 'UPS-001',
    'Feeder Description': 'UPS Charger - 25kW',
    'From Bus': 'UPS-CHARGER',
    'To Bus': 'UPS-PANEL',
    'Voltage (V)': 415,
    'Load KW': 25,
    'Length (m)': 15,
    'Power Factor': 0.95,
    'Efficiency (%)': 96,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 10
  },
  {
    'Serial No': 16,
    'Cable Number': 'UPS-002',
    'Feeder Description': 'UPS Inverter - 30kW',
    'From Bus': 'UPS-INVERTER',
    'To Bus': 'UPS-PANEL',
    'Voltage (V)': 415,
    'Load KW': 30,
    'Length (m)': 12,
    'Power Factor': 0.95,
    'Efficiency (%)': 96,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCCB',
    'Max SC Current (kA)': 12
  },
  {
    'Serial No': 17,
    'Cable Number': 'UPS-003',
    'Feeder Description': 'UPS Bypass Switch - 30kW',
    'From Bus': 'UPS-BYPASS',
    'To Bus': 'UPS-PANEL',
    'Voltage (V)': 415,
    'Load KW': 30,
    'Length (m)': 8,
    'Power Factor': 0.95,
    'Efficiency (%)': 98,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 12
  }
];

/**
 * Validation: All loads > 0, all lengths > 0, all voltages valid
 */
export const validateCleanDemo = () => {
  const issues: string[] = [];
  
  CLEAN_DEMO_FEEDERS.forEach((feeder: any, idx: number) => {
    if (!feeder['Load KW'] || feeder['Load KW'] <= 0) {
      issues.push(`Row ${idx + 1}: Load KW must be > 0`);
    }
    if (!feeder['Length (m)'] || feeder['Length (m)'] <= 0) {
      issues.push(`Row ${idx + 1}: Length must be > 0`);
    }
    if (!feeder['Voltage (V)'] || feeder['Voltage (V)'] <= 0) {
      issues.push(`Row ${idx + 1}: Voltage must be > 0`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
    totalFeeders: CLEAN_DEMO_FEEDERS.length,
    totalLoad: CLEAN_DEMO_FEEDERS.reduce((sum, f) => sum + (f['Load KW'] || 0), 0)
  };
};
