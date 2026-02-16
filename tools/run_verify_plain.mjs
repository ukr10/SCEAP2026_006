#!/usr/bin/env node
/**
 * LIGHTWEIGHT VERIFICATION (no TypeScript imports)
 * Re-implements critical checks from `verify_formula_mappings.mjs`
 */

const testCases = [
  {
    rowNum: 8,
    description: 'FD FAN-3A (Motor, 3C, 240mm²)',
    excelValues: { loadKW: 2450, voltage: 11, phase: '3Ø', powerFactor: 0.85, efficiency: 0.92, numberOfCores: '3C', length: 475, installationMethod: 'Air' },
    expectedExcel: { I_flc: 164.44, I_starting: 1183.99, size: 240, vdrop_running_V: 24.90, vdrop_running_pct: 0.2264 }
  },
  {
    rowNum: 9,
    description: 'PA Fan 3A (Motor, 3C, 300mm²)',
    excelValues: { loadKW: 3900, voltage: 11, phase: '3Ø', powerFactor: 0.88, efficiency: 0.95, numberOfCores: '3C', length: 500, installationMethod: 'Air' },
    expectedExcel: { I_flc: 244.86, I_starting: 1762.99, size: 300, vdrop_running_V: 32.92, vdrop_running_pct: 0.2993 }
  },
  {
    rowNum: 10,
    description: 'CW Pump #1 (Motor, 1C parallel 2x300mm²)',
    excelValues: { loadKW: 4325, voltage: 11, phase: '3Ø', powerFactor: 0.77, efficiency: 0.945, numberOfCores: '1C', length: 750, installationMethod: 'Air' },
    expectedExcel: { I_flc: 311.98, I_starting: 2246.24, size: 300, runs: 2, vdrop_running_V: 36.65, vdrop_running_pct: 0.3332 }
  },
  {
    rowNum: 12,
    description: 'MDBFP (Motor, 1C 3x400mm² parallel)',
    excelValues: { loadKW: 13000, voltage: 11, phase: '3Ø', powerFactor: 0.85, efficiency: 0.92, numberOfCores: '1C', length: 85, installationMethod: 'Air' },
    expectedExcel: { I_flc: 872.56, I_starting: 6282.44, size: 400, runs: 3, vdrop_running_V: 5.82, vdrop_running_pct: 0.0529 }
  },
  {
    rowNum: 13,
    description: 'HVAC Transformer Feeder (Fixed load, 3C, 240mm²)',
    excelValues: { ratedPower: 3000, voltage: 11, phase: '3Ø', powerFactor: 0.85, efficiency: 0.92, numberOfCores: '3C', length: 460, installationMethod: 'Air', loadType: 'Transformer' },
    expectedExcel: { I_flc: 157.46, I_starting: 0, size: 240, vdrop_running_V: 23.09, vdrop_running_pct: 0.2099 }
  }
];

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('        LIGHTWEIGHT VERIFICATION: FORMULAS vs EXCEL EXPECTED');
console.log('═══════════════════════════════════════════════════════════════════\n');

let passCount = 0, failCount = 0;

for (const tc of testCases) {
  console.log(`\n───────────────────────────────────────────────────────────────────`);
  console.log(`ROW ${tc.rowNum}: ${tc.description}`);
  console.log(`───────────────────────────────────────────────────────────────────`);

  const input = tc.excelValues;
  const P = input.loadKW || input.ratedPower;
  const V = input.voltage;
  const V_actual = (V < 1000) ? V * 1000 : V;
  const eta = input.efficiency || 0.92;
  const cosphi = input.powerFactor || 0.85;
  const sqrt3 = Math.sqrt(3);

  let I_flc;
  if (input.loadType === 'Transformer') {
    // For transformers or fixed MVA loads use direct MVA/current conversion (no PF/eff)
    I_flc = (P * 1000) / (sqrt3 * V_actual);
  } else {
    I_flc = (P * 1000) / (sqrt3 * V_actual * cosphi * eta);
  }
  const I_starting = I_flc * 7.2; // Excel DOL multiplier

  console.log(`  Calculated FLC: ${I_flc.toFixed(2)}A`);
  console.log(`  Expected (Excel): ${tc.expectedExcel.I_flc}A`);
  const flcMatch = Math.abs(I_flc - tc.expectedExcel.I_flc) < 1.0;
  console.log(`  ✓ FLC MATCH: ${flcMatch ? 'YES ✓' : 'MISMATCH ✗'}`);

  // Voltage drop using example catalog values (approx R/X per size)
  // Use sample R/X for 240mm² where applicable, otherwise scale approximately
  const sizeRef = tc.expectedExcel.size || 240;
  const sampleRX = {
    240: { R: 0.0754, X: 0.092 },
    300: { R: 0.0601, X: 0.09 },
    400: { R: 0.047, X: 0.085 }
  };
  const rx = sampleRX[sizeRef] || sampleRX[240];
  const L_km = input.length / 1000;
  const vdrop_V = sqrt3 * I_flc * L_km * (rx.R * cosphi + rx.X * Math.sin(Math.acos(cosphi)));
  const vdrop_pct = (vdrop_V / V_actual);

  console.log(`  Voltage Drop Running: ${vdrop_V.toFixed(2)}V (${vdrop_pct.toFixed(4)}%)`);
  console.log(`  Expected (Excel): ${tc.expectedExcel.vdrop_running_V}V / ${tc.expectedExcel.vdrop_running_pct}%`);

  if (flcMatch) {
    passCount++;
    console.log('\n  ✅ TEST PASSED');
  } else {
    failCount++;
    console.log('\n  ❌ TEST FAILED - FLC mismatch');
  }
}

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                         SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Rows Tested: ${testCases.length}`);
console.log(`Passed: ${passCount} ✓`);
console.log(`Failed: ${failCount} ✗`);
console.log('═══════════════════════════════════════════════════════════════════\n');

process.exit(failCount === 0 ? 0 : 2);
