const XLSX = require('xlsx');
const path = require('path');

const file = path.join(__dirname, 'test_demo_feeders.xlsx');
const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws);

console.log(`Loaded ${raw.length} rows from ${file}`);

const normalize = (v, def) => (v === undefined || v === null || v === '') ? def : v;
const toNum = v => {
  if (v === undefined || v === null || v === '') return 0;
  const s = String(v).replace('%','').replace(',','').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const feeders = raw.map(r => ({
  serialNo: toNum(r['Serial No'] || r['SL #'] || r['SL#']|| r['SL']),
  cableNumber: String(normalize(r['Cable Number'] || r['Cable Number'] || r['Cable No'] || r['Cable'], '')),
  feederDescription: String(normalize(r['Feeder Description'] || r['Feeder'], '')),
  fromBus: String(normalize(r['From Bus'] || r['FromBus'] || r['From'] || r['From_Bus'], '')).trim(),
  toBus: String(normalize(r['To Bus'] || r['ToBus'] || r['To'] || r['To_Bus'], '')).trim(),
  voltage: toNum(r['Voltage (V)'] || r['Voltage'] || r['Voltage (V)'] || 415),
  loadKW: toNum(r['Load KW'] || r['Load (kW)'] || r['Rated Power (kW)'] || r['LoadKW'] || 0),
  length: toNum(r['Length (m)'] || r['Length'] || r['Length (m)'] || 0),
  deratingFactor: toNum(r['Derating Factor'] || r['deratingFactor'] || r['Derating'] || 0.87) || 0.87,
  powerFactor: (()=>{const v = toNum(r['Power Factor']||r['PF']||r['powerFactor']||r['PowerFactor']); return v>1? v/100: (v||0.85)})(),
  efficiency: (()=>{const v = toNum(r['Efficiency (%)']||r['Efficiency']||r['efficiency']); return v>1? v/100: (v||0.95)})(),
}));

console.log('Normalized feeders:');
feeders.forEach(f => console.log(`  ${f.cableNumber}: ${f.fromBus} → ${f.toBus} | ${f.loadKW}kW | ${f.length}m | V=${f.voltage}`));

// discovery
const normalizeBus = b => String(b||'').trim().toUpperCase();
const cableFromBuses = new Set(feeders.map(f => normalizeBus(f.fromBus)));
const cableToBuses = new Set(feeders.map(f => normalizeBus(f.toBus)));
const topLevelBuses = Array.from(cableToBuses).filter(b => !cableFromBuses.has(b));

console.log('\nTop-level buses (toBus only):', topLevelBuses);

if (topLevelBuses.length === 0) console.warn('No top-level bus found — hierarchy may be inverted');

// find transformer segment
const transformerToBusNorm = topLevelBuses[0];
const transformer = feeders.find(f => normalizeBus(f.toBus) === transformerToBusNorm);
console.log('Transformer candidate:', transformer ? transformer.toBus : 'NONE');

// find end-load cables: those whose fromBus is not present as toBus (leaf)
const endLoadCables = feeders.filter(f => !cableToBuses.has(normalizeBus(f.fromBus)));
console.log(`\nFound ${endLoadCables.length} end-load cables`);

function traceBack(startCable) {
  const path = [startCable];
  let current = startCable;
  const visited = new Set();
  for (let i=0;i<100;i++){
    if (transformer && normalizeBus(current.toBus) === normalizeBus(transformer.toBus)) return path;
    const nextFromBusNorm = normalizeBus(current.toBus);
    if (visited.has(nextFromBusNorm)) break;
    visited.add(nextFromBusNorm);
    const parent = feeders.find(c => normalizeBus(c.fromBus) === nextFromBusNorm);
    if (!parent) break;
    path.push(parent);
    current = parent;
  }
  return path;
}

const sqrt3 = Math.sqrt(3);
const calcSegVdrop = (seg, r) => {
  if (!seg.loadKW || !seg.length || !r) return 0;
  const pf = seg.powerFactor || 0.85;
  const eff = seg.efficiency || 0.95;
  const I = (seg.loadKW * 1000) / (sqrt3 * seg.voltage * pf * eff);
  const deratedI = I / (seg.deratingFactor || 0.87);
  const vdrop = (sqrt3 * deratedI * r * seg.length) / 1000;
  return vdrop;
}

const paths = [];
let idx = 1;
for (const start of endLoadCables) {
  const p = traceBack(start);
  if (p.length===0) continue;
  const totalDist = p.reduce((s,c)=>s+c.length,0);
  const totalVolt = p[0].voltage||415;
  const cumLoad = p.reduce((s,c)=>s+(c.loadKW||0),0);
  const totalVdrop = p.reduce((s,c)=>s+calcSegVdrop(c, 0.1),0);
  const vdropPercent = totalVolt>0 ? (totalVdrop/totalVolt)*100 : 0;
  paths.push({id: 'PATH-'+String(idx).padStart(3,'0'), startEquipment: start.fromBus, cables: p, totalDist, totalVolt, cumLoad, totalVdrop, vdropPercent});
  idx++;
}

console.log('\nDiscovered Paths:');
paths.forEach(p=>{
  console.log(`\n${p.id}: ${p.startEquipment} -> ${p.cables.map(c=>c.toBus).join(' -> ')} (Distance ${p.totalDist} m)`);
  console.log(`  Cumulative Load: ${p.cumLoad} kW`);
  console.log(`  V-drop: ${p.totalVdrop.toFixed(3)} V (${p.vdropPercent.toFixed(2)}%)`);
});

if (paths.length===0) console.warn('\nNo complete paths discovered; data may be inverted.');

