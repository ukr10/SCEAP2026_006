// Analyze the demo data structure to understand the data format

const demoFirstFew = [
  { Cable: 'INC-MAIN-001', FromBus: 'TRF-MAIN', ToBus: 'MAIN-DISTRIBUTION', LoadKW: 400 },
  { Cable: 'FDR-MAIN-002', FromBus: 'MAIN-DISTRIBUTION', ToBus: 'UPS-PANEL', LoadKW: 85 },
  { Cable: 'FDR-MAIN-003', FromBus: 'MAIN-DISTRIBUTION', ToBus: 'HVAC-PANEL', LoadKW: 120 },
  { Cable: 'HVAC-001', FromBus: 'HVAC-PANEL', ToBus: 'CHILLER-1', LoadKW: 45 },
  { Cable: 'MTR-001', FromBus: 'GEN-PANEL', ToBus: 'FIRE-PUMP-MOTOR', LoadKW: 37 }
];

console.log('DEMO DATA ANALYSIS');
console.log('='.repeat(80));
console.log('Cable Structure:');
demoFirstFew.forEach(c => {
  console.log(`  ${c.Cable}: ${c.FromBus} → ${c.ToBus} (${c.LoadKW}kW)`);
});

console.log('\n' + '='.repeat(80));
console.log('Data Format Analysis:');
console.log('');
console.log('Current Structure:');
console.log('  TRF-MAIN (Transformer) is the FROM bus of first cable');
console.log('  FIRE-PUMP-MOTOR (Equipment) is the TO bus of final cable');
console.log('');
console.log('This means:');
console.log('  - FROM Bus = Source/Parent (where power comes FROM)');
console.log('  - TO Bus = Destination/Load (where power goes TO)');
console.log('');
console.log('Expected by Algorithm:');
console.log('  - fromBus = Load location (equipment starting point)');
console.log('  - toBus = Parent panel (where power comes from)');
console.log('');
console.log('='.repeat(80));

// Find all buses
const fromBuses = new Set(demoFirstFew.map(c => c.FromBus));
const toBuses = new Set(demoFirstFew.map(c => c.ToBus));

console.log('\nBus Analysis:');
console.log(`FROM buses (sources): ${Array.from(fromBuses).join(', ')}`);
console.log(`TO buses (destinations): ${Array.from(toBuses).join(', ')}`);

// Algorithm logic
const topLevelBuses = new Set([...toBuses].filter(b => !fromBuses.has(b)));
const endLoadBuses = new Set([...fromBuses].filter(b => !toBuses.has(b)));

console.log(`\nAlgorithm would find:`);
console.log(`  Top-level buses (toBus only): ${Array.from(topLevelBuses).join(', ') || 'NONE'}`);
console.log(`  End-load buses (fromBus only): ${Array.from(endLoadBuses).join(', ') || 'NONE'}`);

console.log(`\n⚠️ PROBLEM:  
Algorithm expects:
  - Transformer appears ONLY as toBus (parent)
  - Loads appear ONLY as fromBus (children)
  
But demo data has:
  - Transformer (TRF-MAIN) appears ONLY as fromBus (source)
  - Loads (CHILLER-1, etc) appear ONLY as toBus (destinations)

SOLUTION: INVERT the demo data (swap fromBus ↔ toBus)
`);
