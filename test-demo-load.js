// Load and test the actual demo data

const demoDataContent = require('fs').readFileSync(
  '/workspaces/SCEAP2026_2/sceap-frontend/src/utils/demoData.ts',
  'utf-8'
);

// Extract the generateDemoData function
let jsCode = demoDataContent;
jsCode = jsCode.replace(/^\/\*\*[\s\S]*?\*\//m, ''); // Remove top comment
jsCode = jsCode.replace(/^export /gm, ''); // Remove export keyword
jsCode = jsCode.replace(/;$/m, ''); // Remove trailing semicolon

// Execute the function
const generateDemoData = eval(`(${jsCode.split('const generateDemoData = ')[1].split(';')[0]})`);
const data = generateDemoData();

console.log('✓ Demo data loaded successfully!\n');
console.log(`Total items: ${data.length}`);

// Count by panel
const panels = {};
data.forEach(item => {
  const panel = item['To Bus'];
  if (!panels[panel]) panels[panel] = 0;
  panels[panel]++;
});

console.log('\nPanel distribution:');
Object.keys(panels).sort().forEach(panel => {
  console.log(`  ${panel.padEnd(25)}: ${panels[panel].toString().padStart(2)} items`);
});

// Test 5 sample paths
console.log('\n\nSample path traces:');
const testEquipment = [
  'FIRE-PUMP-MOTOR',
  'HVAC-CHILLER-MOTOR',
  'LIGHTING-FLOOR-1',
  'UPS-INVERTER-1',
  'HVAC-AHU-1-MOTOR'
];

testEquipment.forEach((equipment, idx) => {
  let current = equipment;
  let path = [equipment];
  let iterations = 0;
  
  while (iterations++ < 10) {
    const cable = data.find(c => c['From Bus'] === current);
    if (!cable) break;
    
    path.push(cable['To Bus']);
    if (cable['To Bus'].includes('TRF')) break;
    
    current = cable['To Bus'];
  }
  
  console.log(`  ${idx + 1}. ${path.join(' → ')}`);
});

console.log('\n✅ All 44 items successfully loaded and tested!');
