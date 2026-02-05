/**
 * Test the new backward-traversal path discovery algorithm
 */

// Mock the path discovery algorithm logic directly here
function normalizeBus(b) {
  return String(b || '').trim().toUpperCase();
}

function calculateSegmentVoltageDrop(seg, r) {
  const I = (seg.loadKW || 0) * 1000 / (seg.voltage || 415) / Math.sqrt(3); // Phase current
  const L = seg.length || 0; // Length in meters
  const resistancePerPhase = (r * L) / 1000; // Total resistance
  const Vdrop = 2 * I * resistancePerPhase; // 2-phase drop (simplified)
  return Vdrop;
}

function discoverPathsToTransformer(cables) {
  if (!cables || cables.length === 0) {
    console.error('No cable data provided');
    return [];
  }

  const paths = [];
  let pathIndex = 0;

  // STEP 1: Identify all buses in the network
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

  console.log(`[PATH DISCOVERY] Network buses: ${Array.from(allBuses).join(', ')}`);
  console.log(`[PATH DISCOVERY] From-buses: ${Array.from(cableFromBuses).join(', ')}`);
  console.log(`[PATH DISCOVERY] To-buses: ${Array.from(cableToBuses).join(', ')}`);

  // STEP 2: Identify transformer (root: toBus that is never a fromBus)
  const topLevelBuses = new Set(
    Array.from(cableToBuses).filter(bus => !cableFromBuses.has(bus))
  );

  console.log(`[PATH DISCOVERY] Top-level buses (roots): ${Array.from(topLevelBuses).join(', ')}`);

  if (topLevelBuses.size === 0) {
    console.warn('[PATH DISCOVERY] WARNING: No top-level (root) bus found - possible circular network');
    return [];
  }

  // Use first top-level bus as transformer
  const transformerBus = Array.from(topLevelBuses)[0];
  const transformer = cables.find(c => normalizeBus(c.toBus) === transformerBus) || { toBus: transformerBus };

  console.log(`[PATH DISCOVERY] Identified transformer at: ${transformer.toBus}`);

  // STEP 3: Identify end-load cables (fromBus that is never a toBus)
  const endLoadCables = cables.filter(cable => {
    const fromBusNorm = normalizeBus(cable.fromBus);
    // True end-load: this bus is a fromBus but never a toBus of any other cable
    return !cableToBuses.has(fromBusNorm) || cableToBuses.has(fromBusNorm) === false;
  });

  console.log(`[PATH DISCOVERY] Found ${endLoadCables.length} end-load cables:`);
  endLoadCables.forEach(c => {
    console.log(`  - ${c.fromBus} (${c.cableNumber || 'N/A'})`);
  });

  // STEP 4: Trace back each end-load
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

    // Check if we've reached the transformer
    if (normalizeBus(currentCable.toBus) === normalizeBus(transformer.toBus)) {
      return path;
    }

    // Find the parent cable
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

// Test data similar to demo feeders
const testCables = [
  {
    cableNumber: 'CB-001',
    fromBus: 'PUMP-P1',
    toBus: 'HVAC-PANEL',
    length: 50,
    loadKW: 15,
    voltage: 415,
    resistance: 0.1
  },
  {
    cableNumber: 'CB-002',
    fromBus: 'HVAC-A1',
    toBus: 'HVAC-PANEL',
    length: 30,
    loadKW: 25,
    voltage: 415,
    resistance: 0.1
  },
  {
    cableNumber: 'CB-003',
    fromBus: 'HVAC-PANEL',
    toBus: 'MAIN-DISTRIBUTION',
    length: 100,
    loadKW: 40,
    voltage: 415,
    resistance: 0.05
  },
  {
    cableNumber: 'CB-004',
    fromBus: 'LIGHTING-L1',
    toBus: 'LIGHTING-PANEL',
    length: 20,
    loadKW: 10,
    voltage: 415,
    resistance: 0.1
  },
  {
    cableNumber: 'CB-005',
    fromBus: 'LIGHTING-PANEL',
    toBus: 'MAIN-DISTRIBUTION',
    length: 60,
    loadKW: 10,
    voltage: 415,
    resistance: 0.1
  },
  {
    cableNumber: 'CB-006',
    fromBus: 'MAIN-DISTRIBUTION',
    toBus: 'TRF-MAIN',
    length: 200,
    loadKW: 50,
    voltage: 415,
    resistance: 0.03
  }
];

console.log('='.repeat(80));
console.log('Testing Path Discovery Algorithm');
console.log('='.repeat(80));
const discoveredPaths = discoverPathsToTransformer(testCables);

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
