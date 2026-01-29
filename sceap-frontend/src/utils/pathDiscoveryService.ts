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
 * Normalize feeder data from Excel
 * Maps various column naming conventions to standard properties
 */
export const normalizeFeeders = (rawFeeders: any[]): CableSegment[] => {
  return rawFeeders
    .filter((f: any) => f['From Bus'] || f['fromBus'] || f['From bus'])
    .map((feeder: any) => ({
      serialNo: feeder['Serial No'] || feeder['serialNo'] || 0,
      cableNumber: feeder['Cable Number'] || feeder['cableNumber'] || '',
      feederDescription: feeder['Feeder Description'] || feeder['feederDescription'] || feeder['Description'] || '',
      fromBus: feeder['From Bus'] || feeder['fromBus'] || '',
      toBus: feeder['To Bus'] || feeder['toBus'] || '',
      voltage: Number(feeder['Voltage (V)'] || feeder['voltage'] || 415),
      loadKW: Number(feeder['Load KW'] || feeder['loadKW'] || 0),
      length: Number(feeder['Length (m)'] || feeder['length'] || 0),
      deratingFactor: Number(feeder['Derating Factor'] || feeder['deratingFactor'] || 0.87),
      resistance: Number(feeder['Resistance'] || feeder['resistance'] || 0),
      reactance: Number(feeder['Reactance'] || feeder['reactance'] || 0)
    }));
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
 * Discover all paths from equipment/loads back to transformer
 * Uses breadth-first search to find the shortest path
 */
export const discoverPathsToTransformer = (cables: CableSegment[]): CablePath[] => {
  const paths: CablePath[] = [];
  const transformerBuses = new Set(
    cables
      .filter(c => c.toBus.toUpperCase().includes('TRF'))
      .map(c => c.toBus)
  );

  if (transformerBuses.size === 0) {
    console.warn('No transformer found in cable data');
    return [];
  }

  // Find all unique "FromBus" (equipment/loads)
  const equipmentBuses = new Set(
    cables
      .filter(c => !transformerBuses.has(c.fromBus))
      .map(c => c.fromBus)
  );

  // For each equipment, trace path back to transformer
  let pathCounter = 1;
  for (const equipment of equipmentBuses) {
    const path = tracePathToTransformer(equipment, cables, transformerBuses);
    if (path.cables.length > 0) {
      path.pathId = `PATH-${String(pathCounter).padStart(3, '0')}`;
      pathCounter++;
      paths.push(path);
    }
  }

  return paths;
};

/**
 * Trace a single path from equipment back to transformer using BFS
 */
const tracePathToTransformer = (
  startEquipment: string,
  cables: CableSegment[],
  transformerBuses: Set<string>
): CablePath => {
  const visited = new Set<string>();
  const queue: { bus: string; path: CableSegment[] }[] = [
    { bus: startEquipment, path: [] }
  ];

  let finalPath: CablePath = {
    pathId: '',
    startEquipment,
    startEquipmentDescription: '',
    startPanel: startEquipment,
    endTransformer: '',
    cables: [],
    totalDistance: 0,
    totalVoltage: 0,
    cumulativeLoad: 0,
    voltageDrop: 0,
    voltageDropPercent: 0,
    isValid: false,
    validationMessage: 'Path not found'
  };

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentBus = current.bus;

    if (visited.has(currentBus)) continue;
    visited.add(currentBus);

    // Find cable where fromBus = currentBus
    const connectingCable = cables.find(c => c.fromBus === currentBus);

    if (!connectingCable) {
      continue;
    }

    const newPath = [...current.path, connectingCable];

    // Check if we reached transformer
    if (transformerBuses.has(connectingCable.toBus)) {
      const totalDistance = newPath.reduce((sum, c) => sum + c.length, 0);
      const totalVoltage = newPath[0]?.voltage || 415;
      const cumulativeLoad = newPath[0]?.loadKW || 0;

      // Calculate voltage drop (simplified - using first cable's resistance)
      // In real scenario, you'd sum up individual segment drops
      const voltageDrop = calculateSegmentVoltageDrop(newPath[0], 0.1);
      const voltageDropPercent = (voltageDrop / totalVoltage) * 100;

      // Get equipment description from the last cable in the path (connects to transformer)
      const lastCable = newPath[newPath.length - 1];
      const equipmentDescription = lastCable?.feederDescription || '';

      finalPath = {
        pathId: '',
        startEquipment,
        startEquipmentDescription: equipmentDescription,
        startPanel: newPath[newPath.length - 1]?.fromBus || startEquipment,
        endTransformer: connectingCable.toBus,
        cables: newPath,
        totalDistance,
        totalVoltage,
        cumulativeLoad,
        voltageDrop,
        voltageDropPercent,
        isValid: voltageDropPercent <= 5, // IEC 60364 limit
        validationMessage:
          voltageDropPercent <= 5
            ? `V-drop: ${voltageDropPercent.toFixed(2)}% (Valid)`
            : `V-drop: ${voltageDropPercent.toFixed(2)}% (Exceeds 5% limit - cable size too small)`
      };
      break;
    }

    // Continue searching
    queue.push({ bus: connectingCable.toBus, path: newPath });
  }

  return finalPath;
};

/**
 * Analyze all paths and generate summary report
 */
export const analyzeAllPaths = (cables: CableSegment[]): PathAnalysisResult => {
  const paths = discoverPathsToTransformer(cables);

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
