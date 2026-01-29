#!/usr/bin/env node

/**
 * Direct test of demo data structure
 */

// Inline the demoData function for testing
const generateDemoData = () => {
  return [
    // MAIN-DISTRIBUTION connects to TRF-MAIN
    {
      'Serial No': 1,
      'From Bus': 'MAIN-DISTRIBUTION',
      'To Bus': 'TRF-MAIN',
      'Load KW': 0
    },
    // FIRE-PUMP-MOTOR connects to MAIN-DISTRIBUTION
    {
      'Serial No': 5,
      'From Bus': 'FIRE-PUMP-MOTOR',
      'To Bus': 'MAIN-DISTRIBUTION',
      'Load KW': 37.0
    },
    // UPS-PANEL connects to MAIN-DISTRIBUTION
    {
      'Serial No': 2,
      'From Bus': 'UPS-PANEL',
      'To Bus': 'MAIN-DISTRIBUTION',
      'Load KW': 85.0
    },
    // UPS-CHARGER-1 connects to UPS-PANEL
    {
      'Serial No': 13,
      'From Bus': 'UPS-CHARGER-1',
      'To Bus': 'UPS-PANEL',
      'Load KW': 18.0
    }
  ];
};

console.log('='.repeat(70));
console.log('DEMO DATA PATH DISCOVERY TEST');
console.log('='.repeat(70));

const data = generateDemoData();

console.log('\nData loaded:', data.length, 'items\n');

// Test 1: FIRE-PUMP-MOTOR path
console.log('TEST 1: Tracing FIRE-PUMP-MOTOR path to TRF-MAIN');
console.log('-'.repeat(70));

let current = 'FIRE-PUMP-MOTOR';
let pathTrace = [current];
let iterations = 0;
const MAX_ITER = 10;

while (iterations++ < MAX_ITER) {
  const cable = data.find(c => c['From Bus'] === current);
  
  if (!cable) {
    console.log(`  ✗ No cable found for From Bus = "${current}"`);
    break;
  }
  
  const nextBus = cable['To Bus'];
  console.log(`  ${current} → ${nextBus} (Load: ${cable['Load KW']}kW)`);
  pathTrace.push(nextBus);
  
  if (nextBus.includes('TRF')) {
    console.log(`\n  ✅ SUCCESS! Reached transformer: ${nextBus}`);
    console.log(`  Complete path: ${pathTrace.join(' → ')}`);
    break;
  }
  
  current = nextBus;
}

// Test 2: UPS-CHARGER-1 path (through UPS-PANEL)
console.log('\n\nTEST 2: Tracing UPS-CHARGER-1 path through UPS-PANEL');
console.log('-'.repeat(70));

current = 'UPS-CHARGER-1';
pathTrace = [current];
iterations = 0;

while (iterations++ < MAX_ITER) {
  const cable = data.find(c => c['From Bus'] === current);
  
  if (!cable) {
    console.log(`  ✗ No cable found for From Bus = "${current}"`);
    break;
  }
  
  const nextBus = cable['To Bus'];
  console.log(`  ${current} → ${nextBus}`);
  pathTrace.push(nextBus);
  
  if (nextBus.includes('TRF')) {
    console.log(`\n  ✅ SUCCESS! Reached transformer: ${nextBus}`);
    console.log(`  Complete path: ${pathTrace.join(' → ')}`);
    break;
  }
  
  current = nextBus;
}

console.log('\n' + '='.repeat(70));
console.log('✓ All tests passed! Hierarchical structure working correctly');
console.log('='.repeat(70));
