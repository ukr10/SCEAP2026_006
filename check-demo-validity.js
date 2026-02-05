/**
 * Test which cables fail in the sizing calculation
 * Use the actual CLEAN_DEMO_FEEDERS and run through normalizeFeeders
 */

// Simulate the normalizeFeeders function to understand what's happening
const cleanDemoData = [
  {
    'Serial No': 1,
    'Cable Number': 'INC-MAIN-001',
    'Feeder Description': 'Main Incomer from Transformer',
    'From Bus': 'MAIN-DISTRIBUTION',
    'To Bus': 'TRF-MAIN',
    'Voltage (V)': 415,
    'Load KW': 400,
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
  }
];

console.log('='.repeat(80));
console.log('DATA VALIDATION CHECK');
console.log('='.repeat(80));

cleanDemoData.forEach((cable, idx) => {
  console.log(`\n${idx + 1}. ${cable['Cable Number']}:`);
  console.log(`   From Bus: ${cable['From Bus']}`);
  console.log(`   To Bus: ${cable['To Bus']}`);
  console.log(`   Load: ${cable['Load KW']}kW`);
  console.log(`   Length: ${cable['Length (m)']}m`);
  console.log(`   Voltage: ${cable['Voltage (V)']}V`);
  console.log(`   Power Factor: ${cable['Power Factor']}`);
  console.log(`   Efficiency: ${cable['Efficiency (%)']}%`);
  
  // Check for issues
  const issues = [];
  if (!cable['Load KW'] || cable['Load KW'] <= 0) issues.push('❌ Zero Load');
  if (!cable['Voltage (V)'] || cable['Voltage (V)'] <= 0) issues.push('❌ Invalid Voltage');
  if (!cable['Length (m)'] || cable['Length (m)'] <= 0) issues.push('❌ Zero/Negative Length');
  if (!cable['Power Factor'] || cable['Power Factor'] <= 0) issues.push('❌ Invalid Power Factor');
  if (!cable['Efficiency (%)'] || cable['Efficiency (%)'] <= 0) issues.push('❌ Invalid Efficiency');
  
  if (issues.length > 0) {
    console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`   ✓ All fields valid`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const hasIssues = cleanDemoData.some(c => !c['Load KW'] || !c['Voltage (V)'] || !c['Length (m)']);
if (hasIssues) {
  console.log('⚠️ Some cables have data issues that could cause FAILED status');
} else {
  console.log('✓ All cables have valid data');
}

console.log('\nNote: If 3 cables showed as FAILED yesterday, check if they were:');
console.log('  - Rows with zero/missing Load KW');
console.log('  - Rows with zero/missing Length');
console.log('  - Rows with unsupported core configurations');
console.log('  - Rows with invalid efficiency or power factor values');
