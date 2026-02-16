import { CLEAN_DEMO_FEEDERS } from './sceap-frontend/src/utils/cleanDemoData.js';
import { normalizeFeeders } from './sceap-frontend/src/utils/pathDiscoveryService.js';
import CableSizingEngine_V2 from './sceap-frontend/src/utils/CableSizingEngine_V2.js';
import { AmpacityTables } from './sceap-frontend/src/utils/CableEngineeringData.js';

const feeders = normalizeFeeders(CLEAN_DEMO_FEEDERS);

const engine = new CableSizingEngine_V2(AmpacityTables);

console.log('\nRunning headless sizing for demo feeders...\n');
let failed=0, warn=0, ok=0;
for (const f of feeders) {
  const input = {
    loadType: f.loadType,
    ratedPowerKW: f.loadKW,
    voltage: f.voltage,
    phase: f.phase || '3Ø',
    efficiency: f.efficiency,
    powerFactor: f.powerFactor,
    conductorMaterial: f.conductorMaterial || 'Cu',
    insulation: f.insulation || 'XLPE',
    numberOfCores: f.numberOfCores || '3C',
    installationMethod: f.installationMethod?.includes('Trench') ? 'Trench' : 'Air',
    cableLength: f.length,
    ambientTemp: f.ambientTemp,
    numberOfLoadedCircuits: f.numberOfLoadedCircuits,
    startingMethod: f.startingMethod || 'DOL',
    protectionType: f.protectionType,
    maxShortCircuitCurrent: f.maxShortCircuitCurrent,
    protectionClearingTime: f.protectionClearingTime || 0.1
  };
  const res = engine.sizeCable(input);
  const status = res.status;
  console.log(`${f.cableNumber} => Size: ${res.selectedConductorArea}mm2, Vdrop%: ${(res.voltageDropRunning_percent*100).toFixed(2)}%, Status: ${status}`);
  if (status==='FAILED') failed++; else if (status==='WARNING') warn++; else ok++;
}
console.log(`\nSummary: OK=${ok}, WARN=${warn}, FAILED=${failed}`);
