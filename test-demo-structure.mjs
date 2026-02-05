/**
 * Test the demo data structure
 */

import { CLEAN_DEMO_FEEDERS } from '/workspaces/SCEAP2026_003/sceap-frontend/src/utils/cleanDemoData.ts';

const demoFeeders = CLEAN_DEMO_FEEDERS;

console.log('DEMO DATA STRUCTURE ANALYSIS');
console.log('='.repeat(80));

const fromBuses = new Set();
const toBuses = new Set();

demoFeeders.forEach((f, idx) => {
  fromBuses.add(f['From Bus']);
  toBuses.add(f['To Bus']);
  console.log(`${idx + 1}. ${f['Cable Number']}: ${f['From Bus']} → ${f['To Bus']} (${f['Load KW']}kW)`);
});

console.log('\n' + '='.repeat(80));
console.log('BUS ANALYSIS');
console.log('='.repeat(80));

console.log('\nFrom Buses (sources/load locations):', Array.from(fromBuses).sort());
console.log('\nTo Buses (destinations/parents):', Array.from(toBuses).sort());

// Find top-level buses (buses that appear only as toBus, never as fromBus)
const topLevelBuses = new Set(
  Array.from(toBuses).filter(bus => !fromBuses.has(bus))
);

// Find end-load buses (buses that appear only as fromBus, never as toBus)
const endLoadBuses = new Set(
  Array.from(fromBuses).filter(bus => !toBuses.has(bus))
);

console.log('\n' + '='.repeat(80));
console.log('HIERARCHY ANALYSIS');
console.log('='.repeat(80));

console.log('\nTop-level buses (roots - appear only as toBus):', Array.from(topLevelBuses).sort());
console.log('Expected: Should be the Transformer');

console.log('\nEnd-load buses (leaves - appear only as fromBus):', Array.from(endLoadBuses).sort());
console.log('Expected: Motors, Chillers, and other equipment');

if (topLevelBuses.size === 0) {
  console.log('\n⚠️ WARNING: No top-level buses found!');
  console.log('The data structure may be inverted.');
  console.log('\nData structure seems to be: TRANSFORMER → Equipment');
  console.log('But algorithm expects: Equipment → TRANSFORMER');
}
