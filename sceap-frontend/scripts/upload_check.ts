import XLSX from 'xlsx';
import { normalizeFeeders, discoverPathsToTransformer } from '../src/utils/pathDiscoveryService.ts';
import path from 'path';
import fs from 'fs';

const testFile = path.join('/workspaces/SCEAP2026_005', 'TEST_150_FEEDERS_DIVERSE.xlsx');

if (!fs.existsSync(testFile)) {
  console.error('Test file not found:', testFile);
  process.exit(1);
}

const wb = XLSX.readFile(testFile);
const sheetName = wb.SheetNames[0];
const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

console.log(`Loaded ${data.length} rows from ${testFile}`);

const feeders = normalizeFeeders(data as any[]);
console.log(`Normalized to ${feeders.length} feeders`);

const paths = discoverPathsToTransformer(feeders as any[]);
console.log(`Discovered ${paths.length} paths`);
paths.slice(0, 10).forEach((p, i) => {
  console.log(`\n[PATH ${i + 1}] ${p.pathId} | From: ${p.startEquipment} → Root: ${p.endTransformer}`);
  console.log(`   Cables: ${p.cables.map(c => c.cableNumber).join(' -> ')}`);
  console.log(`   Total Length: ${p.totalDistance}m | Voltage: ${p.totalVoltage}V | V-drop%: ${p.voltageDropPercent.toFixed(2)}%`);
});

console.log('\nUpload-check completed (paths printed).');
