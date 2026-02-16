#!/usr/bin/env node
/**
 * Test: Verify 37kW pump cable sizing is now reasonable
 */

import CableSizingEngine_V2 from './src/utils/CableSizingEngine_V2.js';
import { LoadTypeSpecs, AmpacityTables } from './src/utils/CableEngineeringData.js';

const engine = new CableSizingEngine_V2(AmpacityTables);

// Test input for 37kW Fire Pump Motor with UPDATED clearing time
const pumpInput = {
  loadType: 'Pump',
  ratedPowerKW: 37,
  voltage: 415,
  phase: '3Ø',
  efficiency: 0.92,
  powerFactor: 0.85,
  conductorMaterial: 'Cu',
  insulation: 'XLPE',
  numberOfCores: '3C',
  installationMethod: 'Air',
  cableLength: 25,
  ambientTemp: 40,
  numberOfLoadedCircuits: 1,
  startingMethod: 'DOL',
  protectionType: 'ACB',
  maxShortCircuitCurrent: 12,
  protectionClearingTime: 1.0  // FIXED: Was 0.1, now 1.0 for ACB
};

console.log('\n=== 37kW FIRE PUMP MOTOR CABLE SIZING ===\n');
console.log('Input:', JSON.stringify(pumpInput, null, 2));

const result = engine.sizeCable(pumpInput);

console.log('\n=== SIZING RESULTS ===\n');
console.log(`Full Load Current: ${result.fullLoadCurrent.toFixed(2)} A`);
console.log(`Starting Current: ${result.startingCurrent.toFixed(2)} A`);
console.log(`Derated Current: ${result.deratedCurrent.toFixed(2)} A`);
console.log(`Derating Factor: ${result.deratingFactor.toFixed(3)}`);

console.log('\n=== CONSTRAINT ANALYSIS ===\n');
console.log(`Size by Ampacity: ${result.sizeByAmpacity}mm²`);
console.log(`Size by Running Vdrop: ${result.sizeByRunningVdrop}mm²`);
console.log(`Size by Starting Vdrop: ${result.sizeByStartingVdrop || 'N/A'}mm²`);
console.log(`Size by ISc: ${result.sizeByISc || 'N/A'}mm²`);

console.log('\n=== FINAL SELECTION ===\n');
console.log(`✓ Selected Cable Size: ${result.selectedConductorArea}mm²`);
console.log(`✓ Driving Constraint: ${result.drivingConstraint}`);
console.log(`✓ Number of Runs: ${result.numberOfRuns}`);
console.log(`✓ Size per Run: ${result.sizePerRun}mm²`);
console.log(`✓ Cable Rating: ${result.cableRating}A (${result.installationMethod})`);
console.log(`✓ Installed Rating: ${result.installedRatingTotal}A (after derating)`);

console.log('\n=== VOLTAGE DROP ===\n');
console.log(`Running VD: ${result.voltageDrop_running_volt.toFixed(3)}V (${(result.voltageDrop_running_percent*100).toFixed(2)}%)`);
console.log(`Starting VD: ${result.voltageDrop_starting_volt.toFixed(3)}V (${(result.voltageDrop_starting_percent*100).toFixed(2)}%)`);

if (result.selectedConductorArea === 300) {
  console.log('\n❌ PROBLEM: Still selecting 300mm² - ISc constraint still dominating!\n');
} else if (result.selectedConductorArea > 150) {
  console.log('\n⚠️  WARNING: Large cable selected for 37kW motor - check constraints\n');
} else {
  console.log('\n✅ SUCCESS: Reasonable cable size for 37kW motor!\n');
}
