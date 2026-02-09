import { CLEAN_DEMO_FEEDERS } from './sceap-frontend/src/utils/cleanDemoData.ts';

console.log('\n📋 DEMO DATA COMPLIANCE VERIFICATION\n');
console.log('=' .repeat(100));

const issues = [];
const warnings = [];
const current = (kw, v=415, pf=0.95) => kw / (v * 1.732 * pf / 1000);

CLEAN_DEMO_FEEDERS.forEach((feeder, idx) => {
  const row = feeder['Serial No'];
  const load = feeder['Load KW'];
  const currentA = current(load);
  const pf = feeder['Power Factor'] || 0.95;
  const eff = feeder['Efficiency (%)'] || 95;

  // ✅ Breaker Type Compliance (IEC 60898 / IEC 60947-2)
  const breaker = feeder['Protection Type'];
  if (load <= 15 && breaker === 'ACB') {
    issues.push(`Row ${row}: ${load}kW using ACB (should use MCCB/MCB for small loads)`);
  }
  if (load > 100 && breaker !== 'ACB') {
    issues.push(`Row ${row}: ${load}kW using ${breaker} (should use ACB for >100kW)`);
  }

  // ✅ Power Factor Compliance
  if (pf < 0.70 || pf > 1.0) {
    issues.push(`Row ${row}: Power Factor ${pf} is out of standard range (0.70-1.0)`);
  }
  if (feeder['Load Type'] === 'Feeder' && pf < 0.95) {
    warnings.push(`Row ${row}: Feeder with PF ${pf} (typical PF ≥ 0.95)`);
  }
  if (feeder['Load Type'] === 'Motor' || feeder['Load Type'] === 'Pump' || feeder['Load Type'] === 'Compressor') {
    if (pf < 0.80 || pf > 0.90) {
      warnings.push(`Row ${row}: Motor-type load with PF ${pf} (typical range 0.80-0.90)`);
    }
  }

  // ✅ Efficiency Compliance
  if (eff < 50 || eff > 100) {
    issues.push(`Row ${row}: Efficiency ${eff}% is invalid (must be 50-100%)`);
  }
  if (feeder['Load Type'] === 'Transformer' && eff < 96) {
    warnings.push(`Row ${row}: Transformer with efficiency ${eff}% (typical ≥ 96%)`);
  }

  // ✅ Number of Cores
  const cores = feeder['Number of Cores'];
  if (!['1C', '2C', '3C', '4C'].includes(cores)) {
    issues.push(`Row ${row}: Invalid Number of Cores '${cores}' (must be 1C, 2C, 3C, or 4C)`);
  }

  // ✅ Material
  const material = feeder['Material'];
  if (!['Cu', 'Al'].includes(material)) {
    issues.push(`Row ${row}: Invalid Material '${material}' (must be Cu or Al)`);
  }

  // ✅ Insulation
  const insulation = feeder['Insulation'];
  if (!['PVC', 'XLPE', 'LSZH'].includes(insulation)) {
    warnings.push(`Row ${row}: Insulation type '${insulation}' (recommend XLPE for industrial)`);
  }

  // ✅ Installation Method
  const installation = feeder['Installation Method'];
  if (!['Air', 'Trench', 'Duct', 'Cable Tray', 'Conduit'].includes(installation)) {
    issues.push(`Row ${row}: Invalid Installation Method '${installation}'`);
  }

  // ✅ Voltage Standards
  const voltage = feeder['Voltage (V)'];
  if (![ 230, 415, 3300, 6600, 11000, 22000 ].includes(voltage)) {
    warnings.push(`Row ${row}: Non-standard voltage ${voltage}V`);
  }

  // ✅ Motor Starting Method
  if (['Motor', 'Pump', 'Compressor', 'Fan'].includes(feeder['Load Type'])) {
    const starting = feeder['Starting Method'];
    if (!['DOL', 'StarDelta', 'SoftStarter', 'VFD', 'Reduced'].includes(starting)) {
      issues.push(`Row ${row}: Invalid Starting Method '${starting}' for motor load`);
    }
    if (load > 15 && starting === 'DOL') {
      warnings.push(`Row ${row}: Large motor (${load}kW) with DOL (inrush may exceed ISc)`);
    }
  }

  // ✅ Load vs Current
  if (currentA > 630) {
    warnings.push(`Row ${row}: Current ${currentA.toFixed(1)}A exceeds 630A (ACB upper range)`);
  }
});

if (issues.length === 0 && warnings.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED - Demo data complies with electrical standards!\n');
} else {
  if (issues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(warn => console.log(`  ${warn}`));
  }
}

console.log('\n' + '=' .repeat(100));
console.log(`\nSummary: ${CLEAN_DEMO_FEEDERS.length} feeders, ${issues.length} critical issues, ${warnings.length} warnings\n`);
