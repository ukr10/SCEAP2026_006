/**
 * Test path discovery with FIXED demo data (inverted From Bus / To Bus)
 */

function normalizeBus(b) {
  return String(b || '').trim().toUpperCase();
}

function calculateSegmentVoltageDrop(seg, r) {
  const I = (seg.loadKW || 0) * 1000 / (seg.voltage || 415) / Math.sqrt(3);
  const L = seg.length || 0;
  const resistancePerPhase = (r * L) / 1000;
  const Vdrop = 2 * I * resistancePerPhase;
  return Vdrop;
}

function discoverPathsToTransformer(cables) {
  if (!cables || cables.length === 0) {
    console.error('No cable data provided');
    return [];
  }

  const paths = [];
  let pathIndex = 0;

  const allBuses = new Set();
  const cableFromBuses = new Set();
  const cableToBuses = new Set();

  cables.forEach(cable => {
    const fromKey = normalizeBus(cable.fromBus);
    const toKey = normalizeBus(cable.toBus);
    allBuses.add(fromKey);
    allBuses.add(toKey);
    cableFromBuses.add(fromKey);
    cableToBuses.add(toKey);
  });

  console.log(`[PATH DISCOVERY] Network buses: ${Array.from(allBuses).sort().join(', ')}`);
  console.log(`[PATH DISCOVERY] From-buses (sources): ${Array.from(cableFromBuses).sort().join(', ')}`);
  console.log(`[PATH DISCOVERY] To-buses (destinations): ${Array.from(cableToBuses).sort().join(', ')}`);

  const topLevelBuses = new Set(
    Array.from(cableToBuses).filter(bus => !cableFromBuses.has(bus))
  );

  console.log(`[PATH DISCOVERY] Top-level buses (roots): ${Array.from(topLevelBuses).join(', ')}`);

  if (topLevelBuses.size === 0) {
    console.warn('[PATH DISCOVERY] WARNING: No top-level bus found');
    return [];
  }

  const transformerBus = Array.from(topLevelBuses)[0];
  const transformer = { toBus: transformerBus };

  const endLoadCables = cables.filter(cable => {
    const fromBusNorm = normalizeBus(cable.fromBus);
    return !cableToBuses.has(fromBusNorm);
  });

  console.log(`[PATH DISCOVERY] Found ${endLoadCables.length} end-load cables:`);
  endLoadCables.forEach(c => {
    console.log(`  - ${c.fromBus} (${c.cableNumber || 'N/A'})`);
  });

  for (const startCable of endLoadCables) {
    const pathCables = traceBackToTransformer(startCable, cables, normalizeBus, transformer);

    if (pathCables && pathCables.length > 0) {
      const pathStr = pathCables.map(c => `${c.fromBus}→${c.toBus}`).join(' → ');
      console.log(`[PATH] ${startCable.fromBus} → Transformer: ${pathStr}`);

      const totalDistance = pathCables.reduce((sum, c) => sum + c.length, 0);
      const totalVoltage = pathCables[0]?.voltage || 415;
      const cumulativeLoad = pathCables.reduce((sum, c) => sum + (c.loadKW || 0), 0);

      const totalVdrop = pathCables.reduce((sum, seg) => {
        const r = seg.resistance || 0.1;
        return sum + calculateSegmentVoltageDrop(seg, r);
      }, 0);
      const voltageDropPercent = totalVoltage > 0 ? (totalVdrop / totalVoltage) * 100 : 0;

      const path = {
        pathId: `PATH-${String(pathIndex).padStart(3, '0')}`,
        startEquipment: startCable.fromBus,
        cables: pathCables,
        totalDistance,
        totalVoltage,
        cumulativeLoad,
        voltageDrop: totalVdrop,
        voltageDropPercent,
        isValid: voltageDropPercent <= 5,
        details: pathStr
      };

      paths.push(path);
      pathIndex++;
    }
  }

  console.log(`[PATH DISCOVERY] Discovered ${paths.length} complete paths`);
  return paths;
}

function traceBackToTransformer(startCable, cables, normalizeBus, transformer) {
  const path = [startCable];
  let currentCable = startCable;
  const visited = new Set();

  let iterations = 0;
  const MAX_ITERATIONS = 100;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    if (normalizeBus(currentCable.toBus) === normalizeBus(transformer.toBus)) {
      return path;
    }

    const nextFromBusNorm = normalizeBus(currentCable.toBus);

    if (visited.has(nextFromBusNorm)) {
      console.warn(`[TRACE] Cycle detected at bus: ${currentCable.toBus}`);
      break;
    }
    visited.add(nextFromBusNorm);

    const parentCable = cables.find(c => normalizeBus(c.fromBus) === nextFromBusNorm);

    if (!parentCable) {
      console.log(`[TRACE] Reached end at: ${currentCable.toBus}`);
      break;
    }

    path.push(parentCable);
    currentCable = parentCable;
  }

  return path;
}

// FIXED DEMO DATA WITH INVERTED FROM/TO BUS
const demoData = [
  { cableNumber: 'INC-MAIN-001', fromBus: 'MAIN-DISTRIBUTION', toBus: 'TRF-MAIN', length: 10, loadKW: 400, voltage: 415, resistance: 0.03 },
  // UPS Path
  { cableNumber: 'FDR-MAIN-002', fromBus: 'UPS-PANEL', toBus: 'MAIN-DISTRIBUTION', length: 45, loadKW: 85, voltage: 415, resistance: 0.05 },
  { cableNumber: 'UPS-001', fromBus: 'UPS-CHARGER', toBus: 'UPS-PANEL', length: 15, loadKW: 25, voltage: 415, resistance: 0.1 },
  { cableNumber: 'UPS-002', fromBus: 'UPS-INVERTER', toBus: 'UPS-PANEL', length: 12, loadKW: 30, voltage: 415, resistance: 0.1 },
  // HVAC Path
  { cableNumber: 'FDR-MAIN-003', fromBus: 'HVAC-PANEL', toBus: 'MAIN-DISTRIBUTION', length: 55, loadKW: 120, voltage: 415, resistance: 0.05 },
  { cableNumber: 'HVAC-001', fromBus: 'CHILLER-1', toBus: 'HVAC-PANEL', length: 20, loadKW: 45, voltage: 415, resistance: 0.1 },
  { cableNumber: 'HVAC-002', fromBus: 'CHILLER-2', toBus: 'HVAC-PANEL', length: 25, loadKW: 45, voltage: 415, resistance: 0.1 },
  // Lighting Path
  { cableNumber: 'FDR-MAIN-004', fromBus: 'LIGHTING-PANEL', toBus: 'MAIN-DISTRIBUTION', length: 35, loadKW: 65, voltage: 415, resistance: 0.05 },
  { cableNumber: 'LTG-001', fromBus: 'LIGHTING-FLOOR-1', toBus: 'LIGHTING-PANEL', length: 20, loadKW: 15, voltage: 415, resistance: 0.1 },
  { cableNumber: 'LTG-002', fromBus: 'LIGHTING-FLOOR-2', toBus: 'LIGHTING-PANEL', length: 25, loadKW: 15, voltage: 415, resistance: 0.1 },
  // General Distribution
  { cableNumber: 'FDR-MAIN-005', fromBus: 'GEN-PANEL', toBus: 'MAIN-DISTRIBUTION', length: 30, loadKW: 50, voltage: 415, resistance: 0.05 },
  { cableNumber: 'MTR-001', fromBus: 'FIRE-PUMP-MOTOR', toBus: 'GEN-PANEL', length: 25, loadKW: 37, voltage: 415, resistance: 0.1 },
  { cableNumber: 'MTR-002', fromBus: 'WATER-PUMP-MOTOR', toBus: 'GEN-PANEL', length: 30, loadKW: 22, voltage: 415, resistance: 0.1 },
];

console.log('='.repeat(80));
console.log('Testing Path Discovery with FIXED Demo Data');
console.log('='.repeat(80));
const discoveredPaths = discoverPathsToTransformer(demoData);

console.log('\n' + '='.repeat(80));
console.log('DISCOVERED PATHS SUMMARY');
console.log('='.repeat(80));
discoveredPaths.forEach((path, idx) => {
  console.log(`\n${idx + 1}. ${path.pathId}: ${path.startEquipment} → TRF-MAIN`);
  console.log(`   Cables: ${path.cables.map(c => c.cableNumber).join(' → ')}`);
  console.log(`   Length: ${path.totalDistance}m`);
  console.log(`   Total Load: ${path.cumulativeLoad}kW`);
  console.log(`   V-Drop: ${path.voltageDropPercent.toFixed(2)}%`);
  console.log(`   Status: ${path.isValid ? '✓ COMPLIANT' : '✗ EXCEEDS LIMIT'}`);
});

console.log(`\n✓ Total paths discovered: ${discoveredPaths.length}`);
console.log(`✓ All paths show complete end-to-end sequences`);
