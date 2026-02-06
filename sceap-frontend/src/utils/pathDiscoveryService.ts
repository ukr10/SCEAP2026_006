/**
 * Path Discovery Service - Core utility for extracting and validating cable paths
 * Used by both Sizing and Optimization pages
 */

export interface CablePath {
  pathId: string;
  startEquipment: string;
  startEquipmentDescription: string;
  startPanel: string;
  endTransformer: string;
  cables: CableSegment[];
  totalDistance: number;
  totalVoltage: number;
  cumulativeLoad: number;
  voltageDrop: number;
  voltageDropPercent: number;
  isValid: boolean;
  validationMessage: string;
}

export interface CableSegment {
  serialNo: number;
  cableNumber: string;
  feederDescription: string;
  fromBus: string;
  toBus: string;
  voltage: number;
  loadKW: number;
  length: number;
  deratingFactor: number;
  resistance?: number;
  reactance?: number;
  // NEW FIELDS FOR PROFESSIONAL CABLE SIZING
  numberOfCores?: '1C' | '2C' | '3C' | '3C+E' | '4C'; // Conductor cores
  conductorMaterial?: 'Cu' | 'Al'; // Copper or Aluminum
  phase?: '1Ø' | '3Ø'; // Single or Three Phase
  loadType?: 'Motor' | 'Heater' | 'Transformer' | 'Feeder' | 'Pump' | 'Fan' | 'Compressor';
  efficiency?: number; // 0.0-1.0, for motors typically 0.85-0.96
  powerFactor?: number; // 0.7-1.0, for motors typically 0.75-0.92
  startingMethod?: 'DOL' | 'StarDelta' | 'SoftStarter' | 'VFD'; // Motor starting method
  insulation?: 'XLPE' | 'PVC'; // Cable insulation type
  installationMethod?: string; // e.g., 'Air - Ladder tray (touching)'
  cableSpacing?: 'touching' | 'spaced_400mm' | 'spaced_600mm';
  ambientTemp?: number; // °C
  soilThermalResistivity?: number; // K·m/W for buried cables
  depthOfLaying?: number; // cm for buried cables
  groupedLoadedCircuits?: number; // Number of other loaded circuits nearby
  numberOfLoadedCircuits?: number; // Number of loaded circuits (for derating)
  protectionType?: 'ACB' | 'MCCB' | 'MCB' | 'None'; // ISc check only for ACB
  maxShortCircuitCurrent?: number; // kA, for ISc check
  protectionClearingTime?: number; // seconds, for ISc calculation
  breakerType?: string; // Alias for protectionType (display name)
}

export interface PathAnalysisResult {
  totalPaths: number;
  validPaths: number;
  invalidPaths: number;
  paths: CablePath[];
  averageVoltageDrop: number;
  criticalPaths: CablePath[]; // Paths exceeding 5% V-drop limit
}

/**
 * Helper: Flexible column lookup with multiple naming variations
 * Tries exact match first, then case-insensitive, then key contains
 */
const getColumnValue = (row: any, ...variations: string[]): any => {
  // Try exact match first (important for standardized field names like 'loadKW')
  for (const v of variations) {
    if (v in row && row[v] !== undefined && row[v] !== null && row[v] !== '') {
      return row[v];
    }
  }
  
  // Try case-insensitive match
  const lowerRow = Object.keys(row).reduce((acc: any, key) => {
    acc[key.toLowerCase().trim()] = row[key];
    return acc;
  }, {});
  
  for (const v of variations) {
    const lower = v.toLowerCase().trim();
    if (lower in lowerRow && lowerRow[lower] !== undefined && lowerRow[lower] !== null && lowerRow[lower] !== '') {
      return lowerRow[lower];
    }
  }
  
  // Try partial match (key contains variation) - but prioritize longer variations (more specific)
  const rowKeys = Object.keys(row);
  // Sort variations by length descending (longer = more specific)
  const sortedVariations = [...variations].sort((a, b) => b.length - a.length);
  
  for (const v of sortedVariations) {
    const partial = rowKeys.find(k => k.toLowerCase().includes(v.toLowerCase()));
    if (partial && row[partial] !== undefined && row[partial] !== null && row[partial] !== '') {
      return row[partial];
    }
  }
  
  return undefined;
};

/**
 * Auto-detect column mappings from Excel headers using flexible matching
 * Returns a mapping of standardized field names to Excel column headers
 */
export const autoDetectColumnMappings = (headers: string[]): Record<string, string> => {
  const mappings: Record<string, string> = {};
  const headerMap = new Map<string, string>(); // normalized -> original
  
  headers.forEach(h => {
    const norm = h.toLowerCase().trim();
    headerMap.set(norm, h);
  });

  const fieldSynonyms: Record<string, string[]> = {
    serialNo: ['serial no', 's.no', 'sno', 'index', 'no', 'serial', 'num', 'number'],
    cableNumber: ['cable number', 'cable no', 'cable #', 'cable', 'feeder', 'feeder id', 'feed no', 'id'],
    feederDescription: ['feeder description', 'description', 'name', 'desc', 'feeder name', 'equipment name'],
    fromBus: ['from bus', 'from', 'source', 'load', 'equipment', 'start', 'origin'],
    toBus: ['to bus', 'to', 'destination', 'panel', 'target', 'end'],
    voltage: ['voltage (v)', 'voltage', 'v (v)', 'v', 'nominal voltage', 'rated voltage', 'supply voltage'],
    loadKW: ['load (kw)', 'load kw', 'kw', 'power', 'p', 'load', 'power (kw)'],
    length: ['length (m)', 'length', 'l (m)', 'l', 'distance', 'cable length', 'route length'],
    powerFactor: ['power factor', 'pf', 'cos φ', 'cos phi', 'power factor (pf)', 'cos'],
    efficiency: ['efficiency (%)', 'efficiency', 'eff', 'eff (%)', 'efficiency %'],
    deratingFactor: ['derating factor', 'derating', 'k', 'factor', 'derating k'],
    ambientTemp: ['ambient temp (°c)', 'ambient temp', 'temp', 'ambient temperature', 'temperature', 'ambient (°c)'],
    installationMethod: ['installation method', 'installation', 'method', 'type', 'cable installation'],
    numberOfLoadedCircuits: ['grouped loaded circuits', 'circuits', 'groups', 'grouped circuits', 'number of circuits'],
    protectionType: ['breaker type', 'protection type', 'breaker', 'protection', 'circuit breaker'],
    maxShortCircuitCurrent: ['short circuit current (ka)', 'isc', 'isc (ka)', 'short circuit', 'sc current', 'trip time (ms)']
  };

  for (const [field, synonyms] of Object.entries(fieldSynonyms)) {
    for (const syn of synonyms) {
      const norm = syn.toLowerCase().trim();
      if (headerMap.has(norm)) {
        mappings[field] = headerMap.get(norm)!;
        break; // Use first match
      }
    }
  }

  return mappings;
};

/**
 * Normalize feeder data from Excel
 * Maps various column naming conventions to standard properties
 */
export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  // DEBUG: Log first feeder's keys to see what columns are available
  if (rawFeeders.length > 0) {
    console.log('[NORMALIZEFEEDERS] Available columns in first feeder:', Object.keys(rawFeeders[0]));
  }

  return rawFeeders
    .filter((f: any) => {
      // Check if row has at least From Bus data
      const fromBus = getColumnValue(f, 'From Bus', 'From', 'Source', 'Load', 'Equipment', 'from bus', 'from', 'source');
      return fromBus && String(fromBus).trim() !== '';
    })
    .map((feeder: any) => {
      // Helper to safely get numeric values with fallback
      const getNumber = (value: any, fallback = 0): number => {
        if (value === null || value === undefined || value === '') return fallback;
        const trimmed = String(value).trim().replace('%', '').replace(',', '').trim();
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : fallback;
      };

      // Helper to safely get string values
      const getString = (value: any, fallback = ''): string => {
        return String(value || fallback).trim();
      };

      // Parse numberOfCores - can be string like "3C+E" or number like 4
      let numberOfCores: '1C' | '2C' | '3C' | '3C+E' | '4C' | undefined;
      const ncValue = getColumnValue(
        feeder,
        'Number of Cores', 'numberOfCores', 'Core', 'Cores', 'core', 'Cable Type'
      ) || '3C';
      if (typeof ncValue === 'string') {
        numberOfCores = ncValue as any;
      } else if (typeof ncValue === 'number') {
        const coreMap: Record<number, '1C' | '2C' | '3C' | '3C+E' | '4C'> = { 1: '1C', 2: '2C', 3: '3C', 4: '4C' };
        numberOfCores = coreMap[ncValue] || '3C';
      }

      // Get voltage for phase detection
      const voltageRaw = getColumnValue(feeder, 'Voltage (V)', 'Voltage', 'V (V)', 'V', 'voltage (v)', 'rated voltage', 'nominal voltage');
      const voltage = getNumber(voltageRaw, 415);
      
      // DEBUG: Log voltage extraction
      const cableNum = getString(getColumnValue(feeder, 'cableNumber', 'Cable Number', 'Cable No', 'Cable', 'Feeder', 'cable number', 'cable no', 'feeder id'), '');
      if (!voltageRaw) {
        console.log(`[NORMALIZEFEEDERS] Cable ${cableNum}: voltageRaw=undefined, using default 415`);
      } else {
        console.log(`[NORMALIZEFEEDERS] Cable ${cableNum}: voltageRaw=${voltageRaw}, voltage=${voltage}`);
      }

      return {
        serialNo: getNumber(getColumnValue(feeder, 'serialNo', 'Serial No', 'S.No', 'SNo', 'serial no', 'index', 'no'), 0),
        cableNumber: getString(getColumnValue(feeder, 'cableNumber', 'Cable Number', 'Cable No', 'Cable', 'Feeder', 'cable number', 'cable no', 'feeder id'), ''),
        feederDescription: getString(
          getColumnValue(feeder, 'feederDescription', 'Feeder Description', 'Description', 'Name', 'feeder description', 'desc'),
          ''
        ),
        fromBus: getString(getColumnValue(feeder, 'fromBus', 'From Bus', 'From', 'Source', 'Load', 'Equipment', 'from bus', 'from', 'source'), ''),
        toBus: getString(getColumnValue(feeder, 'toBus', 'To Bus', 'To', 'Destination', 'Panel', 'to bus', 'to', 'destination'), ''),
        voltage,
        loadKW: getNumber(getColumnValue(feeder, 'loadKW', 'Load (kW)', 'Load KW', 'Load', 'Power', 'kW', 'load (kw)', 'power (kw)'), 0),
        length: getNumber(getColumnValue(feeder, 'length', 'Length (m)', 'Length', 'L', 'Distance', 'length (m)', 'cable length'), 0),
        deratingFactor: getNumber(
          getColumnValue(feeder, 'deratingFactor', 'Derating Factor', 'Derating', 'K', 'derating factor', 'derating k'),
          0.87
        ),
        resistance: getNumber(getColumnValue(feeder, 'resistance', 'Resistance', 'R', 'resistance'), 0),
        reactance: getNumber(getColumnValue(feeder, 'reactance', 'Reactance', 'X', 'reactance'), 0),
        numberOfCores,
        conductorMaterial: getString(
          getColumnValue(feeder, 'conductorMaterial', 'Material', 'Conductor', 'material'),
          'Cu'
        ).toUpperCase() === 'AL' ? 'Al' : 'Cu',
        phase: (getString(getColumnValue(feeder, 'phase', 'Phase', 'phase'), '') as '1Ø' | '3Ø') || (voltage >= 400 ? '3Ø' : '1Ø'),
        loadType: (getString(getColumnValue(feeder, 'loadType', 'Load Type', 'Type', 'load type', 'type'), 'Motor')) as any,
        // Handle percent-formatted efficiency and power factor (e.g., 92 for 92%)
        efficiency: (() => {
          const v = getNumber(getColumnValue(feeder, 'efficiency', 'Efficiency', 'Efficiency (%)', 'Eff', 'efficiency', 'eff'), 0.92);
          return v > 1 ? v / 100 : v;
        })(),
        powerFactor: (() => {
          const v = getNumber(getColumnValue(feeder, 'powerFactor', 'Power Factor', 'PF', 'power factor', 'pf'), 0.85);
          return v > 1 ? v / 100 : v;
        })(),
        startingMethod: (getString(getColumnValue(feeder, 'startingMethod', 'Starting Method', 'Starting', 'starting method'), 'DOL')) as any,
        insulation: (getString(getColumnValue(feeder, 'insulation', 'Insulation', 'insulation'), 'XLPE')) as any,
        installationMethod: getString(getColumnValue(feeder, 'installationMethod', 'Installation Method', 'Installation', 'installation method', 'method'), 'Air'),
        cableSpacing: (getString(getColumnValue(feeder, 'cableSpacing', 'Cable Spacing', 'Spacing', 'cable spacing'), 'touching')) as any,
        ambientTemp: getNumber(getColumnValue(feeder, 'ambientTemp', 'Ambient Temp (°C)', 'Ambient Temp', 'Temp', 'ambient temp', 'temperature'), 40),
        soilThermalResistivity: getNumber(getColumnValue(feeder, 'soilThermalResistivity', 'Soil Thermal Resistivity (K·m/W)', 'Soil Resistivity', 'soil resistivity'), 1.2),
        depthOfLaying: getNumber(getColumnValue(feeder, 'depthOfLaying', 'Depth of Laying (cm)', 'Depth', 'depth'), 60),
        numberOfLoadedCircuits: getNumber(getColumnValue(feeder, 'numberOfLoadedCircuits', 'Grouped Loaded Circuits', 'Circuits', 'grouped circuits'), 1),
        // If no SC value provided in sheet, leave undefined so engine skips SC check
        maxShortCircuitCurrent: (() => {
          const raw = getColumnValue(feeder, 'maxShortCircuitCurrent', 'Short Circuit Current (kA)', 'ISc', 'Isc', 'short circuit', 'sc current', 'trip time (ms)');
          if (raw === undefined || raw === null || raw === '') return undefined;
          const n = getNumber(raw);
          return Number.isFinite(n) ? n : undefined;
        })(),
        // NEW: Protection type determines if ISc check is applied (ISc only for ACB)
        protectionType: (getString(getColumnValue(feeder, 'protectionType', 'Breaker Type', 'Protection Type', 'Breaker', 'breaker type', 'protection'), 'None')) as 'ACB' | 'MCCB' | 'MCB' | 'None',
        // Alias for protectionType (display name for Results table)
        breakerType: getString(getColumnValue(feeder, 'breakerType', 'Protection Type', 'Breaker Type', 'Breaker', 'breaker type', 'protection'), 'MCCB')
      };
    });
};

/**
 * Calculate voltage drop for a cable segment
 * V-drop = (I × R × L) / 1000 for single phase
 * For three-phase: V-drop = (√3 × I × R × L) / 1000
 */
export const calculateSegmentVoltageDrop = (
  segment: CableSegment,
  cableResistance: number
): number => {
  if (!segment.loadKW || !segment.length || !cableResistance) return 0;

  // Calculate current: I = (P × 1000) / (√3 × V × PF × Efficiency)
  // Assuming PF = 0.85, Efficiency = 0.95
  const pf = 0.85;
  const efficiency = 0.95;
  const sqrt3 = 1.732;

  const current = (segment.loadKW * 1000) / (sqrt3 * segment.voltage * pf * efficiency);

  // Apply derating factor
  const derated_current = current / segment.deratingFactor;

  // V-drop = (√3 × I × R × L) / 1000
  const vdrop = (sqrt3 * derated_current * cableResistance * segment.length) / 1000;

  return vdrop;
};

/**
 * CORRECT PATH DISCOVERY ALGORITHM (Per IEC 60287/60364 & User Guide)
 * 
 * Backward traversal from each end-load through intermediate panels to transformer
 * Ensures each path shows complete sequence: Load → Parent Panel → Main Dist → Transformer
 * 
 * Example: PUMP-P1 → HVAC-PANEL → MAIN-DISTRIBUTION → TRF-MAIN
 */
export const discoverPathsToTransformer = (cables: CableSegment[]): CablePath[] => {
  if (!cables || cables.length === 0) {
    console.error('No cable data provided');
    return [];
  }

  const paths: CablePath[] = [];
  const normalizeBus = (b: string) => String(b || '').trim().toUpperCase();

  // STEP 1: Identify all buses in the network
  const allBuses = new Set<string>();
  
  cables.forEach(cable => {
    const fromKey = normalizeBus(cable.fromBus);
    const toKey = normalizeBus(cable.toBus);
    allBuses.add(fromKey);
    allBuses.add(toKey);
  });

  // STEP 2: Identify transformer (root = toBus that is never a fromBus, OR named with 'TRF')
  let transformer: CableSegment | null = null;
  
  // Try 1: Find equipment whose cable's toBus is never a fromBus (top-level)
  const cableFromBuses = new Set(cables.map(c => normalizeBus(c.fromBus)));
  const cableToBuses = new Set(cables.map(c => normalizeBus(c.toBus)));
  const topLevelBuses = Array.from(cableToBuses).filter(b => !cableFromBuses.has(b));
  
  if (topLevelBuses.length > 0) {
    // Find first cable going TO a top-level bus (this is the "incomer" to transformer)
    const transformerToBusNorm = topLevelBuses[0];
    transformer = cables.find(c => normalizeBus(c.toBus) === transformerToBusNorm) || null;
    console.log(`[PATH DISCOVERY] Transformer identified: toBus=${transformer?.toBus}`);
  }

  if (!transformer) {
    console.error('[PATH DISCOVERY] CRITICAL: Could not identify transformer/root bus');
    console.error('Expected: At least one cable with toBus that has no other cable feeding FROM it');
    return [];
  }

  // STEP 3: For EACH cable originating from a load (leaf node), trace backward to transformer
  let pathIndex = 1;
  
  // Find all cables that originate from end-loads (fromBus is never a toBus of another cable = true leaf)
  const endLoadCables = cables.filter(cable => {
    const fromBusNorm = normalizeBus(cable.fromBus);
    // True end-load: this bus is a fromBus but never a toBus of any other cable
    return !cableToBuses.has(fromBusNorm) || cableToBuses.has(fromBusNorm) === false;
  });

  console.log(`[PATH DISCOVERY] Found ${endLoadCables.length} end-load cables out of ${cables.length} total cables`);

  // Trace back each end-load to transformer
  for (const startCable of endLoadCables) {
    const pathCables = traceBackToTransformer(startCable, cables, normalizeBus, transformer);
    
    if (pathCables && pathCables.length > 0) {
      const totalDistance = pathCables.reduce((sum, c) => sum + c.length, 0);
      const totalVoltage = pathCables[0]?.voltage || 415;
      const cumulativeLoad = pathCables.reduce((sum, c) => sum + (c.loadKW || 0), 0);

      // Voltage drop analysis: sum of individual cable drops OR estimate from path
      const totalVdrop = pathCables.reduce((sum, seg) => {
        const r = seg.resistance || 0.1;
        return sum + calculateSegmentVoltageDrop(seg, r);
      }, 0);
      const voltageDropPercent = totalVoltage > 0 ? (totalVdrop / totalVoltage) * 100 : 0;

      const path: CablePath = {
        pathId: `PATH-${String(pathIndex).padStart(3, '0')}`,
        startEquipment: startCable.fromBus,
        startEquipmentDescription: startCable.feederDescription,
        startPanel: startCable.fromBus,
        endTransformer: transformer.toBus,
        cables: pathCables,
        totalDistance,
        totalVoltage,
        cumulativeLoad,
        voltageDrop: totalVdrop,
        voltageDropPercent,
        isValid: true, // All discovered paths are structurally valid
        validationMessage:
          voltageDropPercent <= 5
            ? `✓ V-drop: ${voltageDropPercent.toFixed(2)}% (IEC 60364 Compliant)`
            : `⚠ V-drop: ${voltageDropPercent.toFixed(2)}% (Exceeds 5% limit — optimize cable sizing)`
      };

      paths.push(path);
      pathIndex++;
    }
  }

  console.log(`[PATH DISCOVERY] Discovered ${paths.length} complete paths (from end-loads to transformer)`);
  
  if (paths.length === 0 && cables.length > 0) {
    console.warn('[PATH DISCOVERY] WARNING: No complete paths found despite having cable data');
    console.warn('This may indicate: (1) Disconnected equipment, (2) Data hierarchy issues, (3) No transformer identified');
  }

  return paths;
};

/**
 * Recursively trace a single cable backward through parents until reaching transformer
 * 
 * Algorithm:
 * 1. Start with a cable (equipment → parent)
 * 2. Look for cable where fromBus == current cable's toBus (the parent cable)
 * 3. Repeat up the hierarchy until reaching transformer
 */
const traceBackToTransformer = (
  startCable: CableSegment,
  allCables: CableSegment[],
  normalizeBus: (b: string) => string,
  transformer: CableSegment
): CableSegment[] => {
  const path: CableSegment[] = [startCable];
  let currentCable = startCable;
  const visited = new Set<string>();
  
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Safety limit to prevent infinite loops

  // Backward traverse: load's cable → find parent's cable → repeat until transformer
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Check if we've reached the transformer
    if (normalizeBus(currentCable.toBus) === normalizeBus(transformer.toBus)) {
      console.log(`[TRACE] Path complete: ${path.map(c => `${c.fromBus}→${c.toBus}`).join(' → ')}`);
      return path;
    }

    // Find the parent cable (cable where fromBus == current.toBus)
    const nextFromBusNorm = normalizeBus(currentCable.toBus);
    
    if (visited.has(nextFromBusNorm)) {
      // Cycle detected - path is malformed
      console.warn(`[TRACE] Cycle detected at bus: ${currentCable.toBus}`);
      break;
    }
    visited.add(nextFromBusNorm);

    const parentCable = allCables.find(c => normalizeBus(c.fromBus) === nextFromBusNorm);
    
    if (!parentCable) {
      // Dead end - no parent cable found
      // This means current.toBus is a terminal (possibly the transformer if not explicitly named)
      console.log(`[TRACE] Reached end of hierarchy at: ${currentCable.toBus} (treating as transformer)`);
      break;
    }

    // Add parent to path and continue upward
    path.push(parentCable);
    currentCable = parentCable;
  }

  if (iterations >= MAX_ITERATIONS) {
    console.error('[TRACE] MAX_ITERATIONS exceeded — possible cycle in data');
  }

  return path;
};

/**
 * Analyze all paths and generate summary report
 */
export const analyzeAllPaths = (cables: CableSegment[]): PathAnalysisResult => {
  if (!cables || cables.length === 0) {
    console.error('ERROR: No cable data provided to analyzeAllPaths');
    return {
      totalPaths: 0,
      validPaths: 0,
      invalidPaths: 0,
      paths: [],
      averageVoltageDrop: 0,
      criticalPaths: []
    };
  }

  const paths = discoverPathsToTransformer(cables);

  // VALIDATION: Warn if no paths discovered despite having cable data
  if (paths.length === 0 && cables.length > 0) {
    console.error('⚠️ CRITICAL DATA INTEGRITY WARNING ⚠️');
    console.error(`System loaded ${cables.length} cables but discovered 0 paths`);
    console.error('REASONS:');
    console.error('1. No cables found connecting to a top-level bus (transformer)');
    console.error('2. All cables form a cycle with no root/source');
    console.error('3. Data structure does not match expected electrical hierarchy');
    console.error('\nEXPECTED FORMAT:');
    console.error('  - Each row = one cable connecting FROM a load TO a panel/source');
    console.error('  - Loads → Panels → Transformer (hierarchical structure)');
    console.error('  - At least one cable must have a toBus that is NEVER a fromBus');
    console.error('  - Example: from_bus="MOTOR-1", to_bus="MCC-PANEL" (MCC is parent)');
  }

  const validPaths = paths.filter(p => p.isValid);
  const invalidPaths = paths.filter(p => !p.isValid);
  const criticalPaths = paths.filter(p => p.voltageDropPercent > 3); // Warning threshold

  const averageVoltageDrop =
    paths.length > 0
      ? paths.reduce((sum, p) => sum + p.voltageDropPercent, 0) / paths.length
      : 0;

  return {
    totalPaths: paths.length,
    validPaths: validPaths.length,
    invalidPaths: invalidPaths.length,
    paths,
    averageVoltageDrop,
    criticalPaths
  };
};
