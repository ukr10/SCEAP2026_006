const XLSX = require('xlsx');
const path = require('path');

// Create a comprehensive test feeder list
const feederData = [
  {
    'Serial No': 1,
    'Cable Number': 'INC-MAIN-001',
    'Feeder Description': 'MAIN DISTRIBUTION PANEL-MAIN SWITCHGEAR',
    'From Bus': 'MAIN-DISTRIBUTION',
    'To Bus': 'TRF-MAIN',
    'Voltage (V)': 415,
    'Load KW': 0,
    'Length (m)': 5,
    'Power Factor': 0.9,
    'Efficiency': 0.95,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCCB',
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 2,
    'Cable Number': 'FDR-MAIN-002',
    'Feeder Description': 'Feeder to UPS-PANEL',
    'From Bus': 'UPS-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 85.0,
    'Length (m)': 45.0,
    'Power Factor': 0.95,
    'Efficiency': 0.97,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 10,
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 3,
    'Cable Number': 'FDR-MAIN-003',
    'Feeder Description': 'Feeder to HVAC-PANEL',
    'From Bus': 'HVAC-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 120.0,
    'Length (m)': 55.0,
    'Power Factor': 0.9,
    'Efficiency': 0.95,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 10,
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 4,
    'Cable Number': 'FDR-MAIN-004',
    'Feeder Description': 'Feeder to LIGHTING-PANEL',
    'From Bus': 'LIGHTING-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 65.0,
    'Length (m)': 35.0,
    'Power Factor': 1.0,
    'Efficiency': 1.0,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 5,
    'Cable Number': 'LD-MAIN-005',
    'Feeder Description': 'Building Fire Pump Motor - 37kW',
    'From Bus': 'FIRE-PUMP-MOTOR',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 37.0,
    'Length (m)': 25.0,
    'Power Factor': 0.85,
    'Efficiency': 0.92,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 8,
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 6,
    'Cable Number': 'LD-MAIN-006',
    'Feeder Description': 'Domestic Water Pump Motor - 22kW',
    'From Bus': 'WATER-PUMP-MOTOR',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 22.0,
    'Length (m)': 30.0,
    'Power Factor': 0.85,
    'Efficiency': 0.92,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'StarDelta',
    'Protection Type': 'ACB',
    'Max SC Current (kA)': 6,
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 7,
    'Cable Number': 'LD-MAIN-007',
    'Feeder Description': 'Sewage Treatment Motor - 15kW',
    'From Bus': 'SEWAGE-MOTOR',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 15.0,
    'Length (m)': 28.0,
    'Power Factor': 0.85,
    'Efficiency': 0.91,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'DOL',
    'Protection Type': 'MCCB',
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 8,
    'Cable Number': 'LD-MAIN-008',
    'Feeder Description': 'Elevator Machine Room - 11kW',
    'From Bus': 'ELEVATOR-MOTOR',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 11.0,
    'Length (m)': 32.0,
    'Power Factor': 0.85,
    'Efficiency': 0.90,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'SoftStarter',
    'Protection Type': 'MCCB',
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 9,
    'Cable Number': 'LD-MAIN-009',
    'Feeder Description': 'Emergency Generator Charger - 5kW',
    'From Bus': 'GEN-CHARGER',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 5.0,
    'Length (m)': 22.0,
    'Power Factor': 0.95,
    'Efficiency': 0.97,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Ambient Temp (°C)': 40,
  },
  {
    'Serial No': 10,
    'Cable Number': 'LD-MAIN-010',
    'Feeder Description': 'Building Management System - 3kW',
    'From Bus': 'BMS-CONTROL-PANEL',
    'To Bus': 'MAIN-DISTRIBUTION',
    'Voltage (V)': 415,
    'Load KW': 3.0,
    'Length (m)': 18.0,
    'Power Factor': 1.0,
    'Efficiency': 1.0,
    'Number of Cores': '3C',
    'Material': 'Cu',
    'Insulation': 'XLPE',
    'Installation Method': 'Air',
    'Starting Method': 'None',
    'Protection Type': 'MCB',
    'Ambient Temp (°C)': 40,
  },
];

// Create the workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(feederData);

// Set column widths
ws['!cols'] = [
  { wch: 10 }, // Serial No
  { wch: 16 }, // Cable Number
  { wch: 35 }, // Feeder Description
  { wch: 20 }, // From Bus
  { wch: 20 }, // To Bus
  { wch: 12 }, // Voltage
  { wch: 10 }, // Load KW
  { wch: 10 }, // Length
  { wch: 13 }, // Power Factor
  { wch: 10 }, // Efficiency
  { wch: 15 }, // Number of Cores
  { wch: 10 }, // Material
  { wch: 12 }, // Insulation
  { wch: 18 }, // Installation Method
  { wch: 16 }, // Starting Method
  { wch: 15 }, // Protection Type
  { wch: 16 }, // Max SC Current
  { wch: 16 }, // Ambient Temp
];

XLSX.utils.book_append_sheet(wb, ws, 'Feederlist');

// Save the file
const filePath = path.join(__dirname, 'TEST_FEEDERLIST.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Test feeder list created: ${filePath}`);
console.log(`📊 Contains ${feederData.length} test cables with various motor types and loads`);
