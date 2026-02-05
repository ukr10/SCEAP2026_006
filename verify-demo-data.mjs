/**
 * Verify CLEAN_DEMO_FEEDERS after inversion
 */

import fs from 'fs';

// Read the file content directly to check the data
const content = fs.readFileSync('/workspaces/SCEAP2026_003/sceap-frontend/src/utils/cleanDemoData.ts', 'utf-8');

// Extract just the data portion
const match = content.match(/export const CLEAN_DEMO_FEEDERS = \[([\s\S]*?)\];/);
if (!match) {
  console.log('Could not find CLEAN_DEMO_FEEDERS');
  process.exit(1);
}

// Count cables and check data
const dataStr = match[1];
const cables = dataStr.split('},\n  {').length + 1; // Rough count

console.log('CLEAN_DEMO_FEEDERS Analysis:');
console.log('='.repeat(80));
console.log(`Total cables: ~${cables}`);

// Check for zeros or invalid data
const lines = dataStr.split('\n');
let zeroCounts = 0;
let currentCable = '';

for (const line of lines) {
  if (line.includes("'Cable Number'")) {
    const match = line.match(/'([^']+)'/);
    if (match) currentCable = match[1];
  }
  
  // Check for zero Load KW
  if (line.includes("'Load KW':") || line.includes("'Load KW':")) {
    const match = line.match(/:\s*(\d+(?:\.\d+)?)/);
    if (match && parseFloat(match[1]) === 0) {
      console.log(`⚠️  ZERO LOAD: ${currentCable}`);
      zeroCounts++;
    }
  }
}

console.log(`\nZero-load cables found: ${zeroCounts}`);

// Also check structure validity
console.log('\n' + '='.repeat(80));
console.log('Data Structure Check:');

const fromBusMatches = dataStr.match(/'From Bus':\s*'([^']+)'/g) || [];
const toBusMatches = dataStr.match(/'To Bus':\s*'([^']+)'/g) || [];
const loadKWMatches = dataStr.match(/'Load KW':\s*(\d+(?:\.\d+)?)/g) || [];

console.log(`From Bus entries: ${fromBusMatches.length}`);
console.log(`To Bus entries: ${toBusMatches.length}`);  
console.log(`Load KW entries: ${loadKWMatches.length}`);

if (fromBusMatches.length === toBusMatches.length && fromBusMatches.length === loadKWMatches.length) {
  console.log('✓ Data structure is balanced');
} else {
  console.log('✗ Data structure mismatch!');
}
