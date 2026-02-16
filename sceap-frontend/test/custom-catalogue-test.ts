import CableSizingEngine_V2 from '../src/utils/CableSizingEngine_V2.ts';
import { AmpacityTables } from '../src/utils/CableEngineeringData.ts';

(async () => {
  const engine = new CableSizingEngine_V2(AmpacityTables);

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
    protectionClearingTime: 1.0
  } as any;

  console.log('\nRunning integration test: 37kW pump sizing\n');
  try {
    const res = engine.sizeCable(pumpInput);
    console.log('Selected Conductor Area:', res.selectedConductorArea);
    console.log('Size by Ampacity:', res.sizeByAmpacity);
    console.log('Size by Running Vdrop:', res.sizeByRunningVdrop);
    console.log('Size by Starting Vdrop:', res.sizeByStartingVdrop);
    console.log('Size by ISc:', res.sizeByISc);
    console.log('Driving Constraint:', res.drivingConstraint);
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(2);
  }
})();
