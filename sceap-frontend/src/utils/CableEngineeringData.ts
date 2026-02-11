/**
 * INDUSTRIAL-GRADE CABLE SIZING DATA TABLES
 * Based on IEC 60287 / IEC 60364 / IS 732
 * For thermal power plants, EPCs, and consultancies
 * 
 * VOLTAGE SUPPORT:
 * - HT (High Tension): 6.6kV, 11kV, 22kV, 33kV systems (per project: 11kV primary)
 * - LV (Low Voltage): 230V/400V, 3-phase and single-phase systems
 * 
 * The sizing algorithm applies the same IEC standards and derating logic for both HT and LV.
 * Only the cable tables, voltage limits, and protection standards differ.
 * 
 * These tables are the source of truth for all cable calculations
 * Never hardcode or assume values from outside these tables
 */

/**
 * SECTION 1: CONDUCTOR DATA
 * All conductors at 90°C (XLPE) / 70°C (PVC) per IEC 60228
 */

export const ConductorDatabase = {
  // Copper single-core cable resistance @ 20°C (Ω/km)
  // Will be temperature-corrected to operating temp
  copperResistance_20C: {
    1: 18.51,
    1.5: 12.1,
    2.5: 7.41,
    4: 4.61,
    6: 3.08,
    10: 1.83,
    16: 1.15,
    25: 0.727,
    35: 0.524,
    50: 0.387,
    70: 0.268,
    95: 0.193,
    120: 0.153,
    150: 0.124,
    185: 0.0991,
    240: 0.0754,
    300: 0.0601,
    400: 0.047,
    500: 0.0366,
    630: 0.0283
  },

  // Aluminum single-core cable resistance @ 20°C (Ω/km)
  aluminumResistance_20C: {
    6: 5.15,
    10: 3.08,
    16: 1.91,
    25: 1.2,
    35: 0.868,
    50: 0.64,
    70: 0.443,
    95: 0.32,
    120: 0.253,
    150: 0.206,
    185: 0.164,
    240: 0.125,
    300: 0.1,
    400: 0.077,
    500: 0.0606,
    630: 0.0469
  },

  // Reactance for single-core cables (Ω/km) @ 50Hz
  // Varies by installation method and spacing
  reactance_single_core: {
    // Cables in air, touching
    air_touching: {
      1: 0.095,
      1.5: 0.094,
      2.5: 0.093,
      4: 0.092,
      6: 0.091,
      10: 0.088,
      16: 0.085,
      25: 0.081,
      35: 0.079,
      50: 0.077,
      70: 0.075,
      95: 0.073,
      120: 0.072,
      150: 0.071,
      185: 0.070,
      240: 0.069,
      300: 0.068,
      400: 0.067,
      500: 0.066,
      630: 0.065
    },
    // Cables in air, spaced 400mm
    air_spaced_400mm: {
      1: 0.105,
      1.5: 0.104,
      2.5: 0.103,
      4: 0.102,
      6: 0.101,
      10: 0.098,
      16: 0.095,
      25: 0.091,
      35: 0.089,
      50: 0.087,
      70: 0.085,
      95: 0.083,
      120: 0.082,
      150: 0.081,
      185: 0.080,
      240: 0.079,
      300: 0.078,
      400: 0.077,
      500: 0.076,
      630: 0.075
    },
    // Cables buried, direct in ground
    buried: {
      1: 0.083,
      1.5: 0.082,
      2.5: 0.081,
      4: 0.080,
      6: 0.079,
      10: 0.076,
      16: 0.073,
      25: 0.069,
      35: 0.067,
      50: 0.065,
      70: 0.063,
      95: 0.061,
      120: 0.060,
      150: 0.059,
      185: 0.058,
      240: 0.057,
      300: 0.056,
      400: 0.055,
      500: 0.054,
      630: 0.053
    }
  },

  // 3-core cable resistance adjustment (multiply single-core by factor)
  // 3-core cables have proximity effect increasing resistance
  threeCore_resistance_factor: 1.05, // 5% increase due to proximity

  // Temperature coefficient for resistance
  // R(T) = R(20) × [1 + α × (T - 20)]
  temperature_coefficient_copper: 0.00393, // /°C
  temperature_coefficient_aluminum: 0.00403 // /C
};

/**
 * SECTION 2: CURRENT CARRYING CAPACITY TABLES (CATALOG-BASED)
 * Multi-core cables: 2C, 3C, 3.5C, 4C configurations
 * Each size includes: Air, Trench, Duct ratings (A)
 * Format: "2C X 25" means 2-core cable with 25mm² conductor
 * Based on 600/1100V XLPE @ 90°C per manufacturer catalog
 */

export const AmpacityTables = {
  // 2-core cables (600/1100V XLPE @ 90°C)
  '2C': {
    '2.5': { air: 39, trench: 47, duct: 40, resistance_90C: 9.450, reactance: 0.1070, cableDia: 12 },
    '4': { air: 52, trench: 63, duct: 52, resistance_90C: 5.880, reactance: 0.0930, cableDia: 13 },
    '6': { air: 67, trench: 79, duct: 66, resistance_90C: 3.930, reactance: 0.0890, cableDia: 14.2 },
    '10': { air: 90, trench: 106, duct: 87, resistance_90C: 2.330, reactance: 0.0840, cableDia: 15.6 },
    '16': { air: 120, trench: 137, duct: 112, resistance_90C: 1.470, reactance: 0.0810, cableDia: 17.8 },
    '25': { air: 156, trench: 177, duct: 144, resistance_90C: 0.927, reactance: 0.0810, cableDia: 21 },
    '35': { air: 193, trench: 212, duct: 173, resistance_90C: 0.668, reactance: 0.0790, cableDia: 23.2 },
    '50': { air: 232, trench: 252, duct: 205, resistance_90C: 0.494, reactance: 0.0750, cableDia: 26.3 },
    '70': { air: 292, trench: 308, duct: 253, resistance_90C: 0.342, reactance: 0.0740, cableDia: 29.9 },
    '95': { air: 360, trench: 371, duct: 304, resistance_90C: 0.247, reactance: 0.0730, cableDia: 33.9 },
    '120': { air: 416, trench: 420, duct: 347, resistance_90C: 0.197, reactance: 0.0720, cableDia: 37.5 },
    '150': { air: 353, trench: 471, duct: 390, resistance_90C: 0.160, reactance: 0.0720, cableDia: 41.5 },
    '185': { air: 548, trench: 531, duct: 442, resistance_90C: 0.128, reactance: 0.0720, cableDia: 45.7 },
    '240': { air: 658, trench: 615, duct: 512, resistance_90C: 0.0986, reactance: 0.0920, cableDia: 51.5 },
    '300': { air: 745, trench: 688, duct: 575, resistance_90C: 0.0800, reactance: 0.0900, cableDia: 56.1 },
    '400': { air: 867, trench: 776, duct: 650, resistance_90C: 0.0640, reactance: 0.0900, cableDia: 63.3 }
  },

  // 3-core cables (600/1100V XLPE @ 90°C)
  '3C': {
    '1.5': { air: 24, trench: 32, duct: 25, resistance_90C: 15.43, reactance: 0.115, cableDia: 11.7 },
    '2.5': { air: 33, trench: 41, duct: 33, resistance_90C: 9.450, reactance: 0.1070, cableDia: 12.6 },
    '4': { air: 45, trench: 53, duct: 44, resistance_90C: 5.880, reactance: 0.0930, cableDia: 13.7 },
    '6': { air: 56, trench: 67, duct: 54, resistance_90C: 3.930, reactance: 0.0890, cableDia: 15.0 },
    '10': { air: 78, trench: 89, duct: 73, resistance_90C: 2.330, reactance: 0.0840, cableDia: 16.5 },
    '16': { air: 101, trench: 115, duct: 94, resistance_90C: 1.470, reactance: 0.0810, cableDia: 18.9 },
    '25': { air: 133, trench: 148, duct: 121, resistance_90C: 0.927, reactance: 0.0810, cableDia: 19.9 },
    '35': { air: 163, trench: 177, duct: 145, resistance_90C: 0.668, reactance: 0.0790, cableDia: 22.3 },
    '50': { air: 199, trench: 211, duct: 172, resistance_90C: 0.494, reactance: 0.0750, cableDia: 25.5 },
    '70': { air: 250, trench: 259, duct: 211, resistance_90C: 0.342, reactance: 0.0740, cableDia: 28.2 },
    '95': { air: 309, trench: 310, duct: 255, resistance_90C: 0.247, reactance: 0.0730, cableDia: 32.2 },
    '120': { air: 357, trench: 353, duct: 292, resistance_90C: 0.197, reactance: 0.0720, cableDia: 35.8 },
    '150': { air: 409, trench: 394, duct: 329, resistance_90C: 0.160, reactance: 0.0720, cableDia: 39.0 },
    '185': { air: 471, trench: 445, duct: 372, resistance_90C: 0.128, reactance: 0.0720, cableDia: 43.6 },
    '240': { air: 556, trench: 514, duct: 429, resistance_90C: 0.162, reactance: 0.088, cableDia: 49.6 },
    '300': { air: 633, trench: 575, duct: 483, resistance_90C: 0.13, reactance: 0.086, cableDia: 54.2 },
    '400': { air: 728, trench: 649, duct: 554, resistance_90C: 0.1018, reactance: 0.0937, cableDia: 61.8 }
  },

  // 4-core cables (600/1100V XLPE @ 90°C)
  '4C': {
    '2.5': { air: 33, trench: 33, duct: 33, resistance_90C: 9.450, reactance: 0.1070, cableDia: 13.6 },
    '4': { air: 45, trench: 45, duct: 44, resistance_90C: 5.880, reactance: 0.0930, cableDia: 14.8 },
    '6': { air: 56, trench: 56, duct: 54, resistance_90C: 3.930, reactance: 0.0890, cableDia: 16.2 },
    '10': { air: 78, trench: 78, duct: 73, resistance_90C: 2.330, reactance: 0.0840, cableDia: 17.9 },
    '16': { air: 101, trench: 101, duct: 94, resistance_90C: 1.470, reactance: 0.0810, cableDia: 20.6 },
    '25': { air: 133, trench: 148, duct: 121, resistance_90C: 0.927, reactance: 0.0810, cableDia: 22.0 },
    '35': { air: 163, trench: 177, duct: 145, resistance_90C: 0.668, reactance: 0.0790, cableDia: 25.4 },
    '50': { air: 199, trench: 211, duct: 172, resistance_90C: 0.494, reactance: 0.0750, cableDia: 28.3 },
    '70': { air: 250, trench: 259, duct: 211, resistance_90C: 0.342, reactance: 0.0740, cableDia: 32.1 },
    '95': { air: 309, trench: 310, duct: 255, resistance_90C: 0.247, reactance: 0.0730, cableDia: 36.3 },
    '120': { air: 357, trench: 353, duct: 292, resistance_90C: 0.197, reactance: 0.0720, cableDia: 39.7 },
    '150': { air: 409, trench: 394, duct: 329, resistance_90C: 0.160, reactance: 0.0720, cableDia: 44.8 },
    '185': { air: 471, trench: 445, duct: 372, resistance_90C: 0.128, reactance: 0.0720, cableDia: 49.7 },
    '240': { air: 556, trench: 514, duct: 429, resistance_90C: 0.0986, reactance: 0.0920, cableDia: 54.8 },
    '300': { air: 633, trench: 575, duct: 483, resistance_90C: 0.0800, reactance: 0.0900, cableDia: 60.6 },
    '400': { air: 728, trench: 649, duct: 554, resistance_90C: 0.0640, reactance: 0.0900, cableDia: 67.8 }
  },

  // Single-core cables (600/1100V XLPE @ 90°C) - for higher power
  '1C': {
    '120': { air: 400, trench: 375, duct: 356, resistance_90C: 0.1970, reactance: 0.0970, cableDia: 19.6 },
    '150': { air: 460, trench: 419, duct: 385, resistance_90C: 0.1600, reactance: 0.0970, cableDia: 21.6 },
    '185': { air: 528, trench: 471, duct: 425, resistance_90C: 0.1280, reactance: 0.0960, cableDia: 23.6 },
    '240': { air: 622, trench: 542, duct: 476, resistance_90C: 0.162, reactance: 0.088, cableDia: 26.5 },
    '300': { air: 709, trench: 606, duct: 519, resistance_90C: 0.162, reactance: 0.088, cableDia: 28.9 },
    '400': { air: 810, trench: 671, duct: 551, resistance_90C: 0.1018, reactance: 0.0937, cableDia: 32.4 },
    '500': { air: 916, trench: 744, duct: 598, resistance_90C: 0.0525, reactance: 0.0890, cableDia: 36.0 },
    '630': { air: 1032, trench: 817, duct: 645, resistance_90C: 0.0428, reactance: 0.0860, cableDia: 42.4 }
  }
};

/**
 * LV (LOW VOLTAGE) AMPACITY TABLES - 230V / 400V Systems
 * For use in 3-phase and single-phase 400V distribution
 * Can use the same sizing engine with these tables for LV feeders and motors
 * 
 * These are typical EU/IEC standard multicore cables (600/1000V XLPE @ 70°C / 90°C)
 * Sizes range from 1.5mm² to 400mm² (common in industrial LV systems)
 * 
 * To use LV tables: Pass them to CableSizingEngine_V2 constructor or replace AmpacityTables
 * The sizing algorithm works identically for HT and LV - only tables and limits differ
 */
export const AmpacityTables_LV = {
  // 3-core cables (400V, 600/1000V XLPE @ 70°C installation temp)
  '3C': {
    '1.5': { air: 20, trench: 24, duct: 19, resistance_90C: 12.1, reactance: 0.11, cableDia: 9.8 },
    '2.5': { air: 27, trench: 32, duct: 26, resistance_90C: 7.41, reactance: 0.10, cableDia: 10.8 },
    '4': { air: 36, trench: 42, duct: 35, resistance_90C: 4.61, reactance: 0.09, cableDia: 11.8 },
    '6': { air: 46, trench: 54, duct: 45, resistance_90C: 3.08, reactance: 0.088, cableDia: 13.2 },
    '10': { air: 64, trench: 74, duct: 61, resistance_90C: 1.83, reactance: 0.082, cableDia: 14.8 },
    '16': { air: 85, trench: 97, duct: 79, resistance_90C: 1.15, reactance: 0.081, cableDia: 16.9 },
    '25': { air: 111, trench: 124, duct: 102, resistance_90C: 0.727, reactance: 0.08, cableDia: 19.6 },
    '35': { air: 137, trench: 150, duct: 122, resistance_90C: 0.524, reactance: 0.078, cableDia: 21.9 },
    '50': { air: 166, trench: 179, duct: 146, resistance_90C: 0.387, reactance: 0.074, cableDia: 24.9 },
    '70': { air: 210, trench: 223, duct: 182, resistance_90C: 0.268, reactance: 0.073, cableDia: 28.0 },
    '95': { air: 259, trench: 272, duct: 222, resistance_90C: 0.193, reactance: 0.072, cableDia: 32.0 },
    '120': { air: 299, trench: 312, duct: 254, resistance_90C: 0.153, reactance: 0.071, cableDia: 35.3 },
    '150': { air: 343, trench: 356, duct: 290, resistance_90C: 0.124, reactance: 0.071, cableDia: 38.6 },
    '185': { air: 396, trench: 407, duct: 332, resistance_90C: 0.0991, reactance: 0.07, cableDia: 42.8 },
    '240': { air: 467, trench: 474, duct: 388, resistance_90C: 0.0754, reactance: 0.069, cableDia: 48.6 },
    '300': { air: 533, trench: 538, duct: 440, resistance_90C: 0.0601, reactance: 0.068, cableDia: 53.0 }
  },
  // Add 1C and 4C if needed for single-phase or 4-pole systems
  // Can be extended with more standard LV sizes as required
};

/**
 * SECTION 3: DERATING FACTORS (Catalog-based from real project data)
 * Format: K = K1(temp) × K2(grouping) × K3(ground temp) × K4(depth) × K5(thermal)
 * Reference: XLPE cable at 55°C ambient, buried 1200mm, soil resistivity 1.2 °C.m/W
 * 
 * NOTE: Derating factors apply EQUALLY to HT and LV systems
 * The ambient temperature, grouping, soil conditions affect cable life regardless of voltage
 */

export const DeratingTables = {
  // Temperature derating factor K1 (55°C ambient reference)
  temperature_factor: {
    air: { multi: 0.90, single: 0.76 },
    trench: { multi: 0.90, single: 0.76 },
    duct: { multi: 0.80, single: 0.67 }
  },

  // Grouping factor K2 (for multiple cables - default 1 for single feeder)
  grouping_factor: {
    1: 1.00, // Single cable
    2: 0.95,
    3: 0.90,
    4: 0.85,
    6: 0.80
  },

  // Ground temperature factor K3 (35°C reference)
  ground_temp_factor: {
    single: 0.96,
    multi: 0.91
  },

  // Depth of laying factor K4 (1200mm reference)
  depth_factor: {
    single: 1.00,
    multi: 1.00
  },

  // Thermal resistivity factor K5 (1.2 °C.m/W reference)
  thermal_resistivity_factor: {
    single: 1.00,
    multi: 1.00
  }
};

/**
 * SECTION 4: STARTING CURRENT MULTIPLIERS
 * For motor starting calculations
 */

export const MotorStartingMultipliers = {
  // Starting current as multiple of Full Load Current
  // Updated to match project Excel workbook (11kV HT Cable sizing) which uses 7.2×FLC for motors
  DOL: { min: 6.0, max: 7.2, typical: 7.2 }, // Direct-on-line (use workbook value)
  StarDelta: { min: 2.0, max: 3.0, typical: 2.5 }, // Star-Delta
  SoftStarter: { min: 2.0, max: 4.0, typical: 3.0 }, // Electronic soft starter
  VFD: { min: 1.0, max: 1.2, typical: 1.1 } // Variable frequency drive
};

/**
 * SECTION 5: VOLTAGE DROP LIMITS (IEC 60364)
 * 
 * Per IEC 60364 and project standards, the PERCENTAGE LIMITS apply regardless of system voltage:
 * - 3% running for motors (at motor terminals)
 * - 5% running for resistive loads
 * - 10% starting for DOL motors (at motor terminals)
 * 
 * These limits work for both HT (6.6-33kV) and LV (230/400V) systems
 * The absolute voltage drop (V) will differ by voltage ratio, but % limits remain the same
 */

export const VoltageLimits = {
  // Running voltage drop
  running: {
    motor_branch: 0.03, // 3%
    motor_feeder: 0.03,
    resistive_load: 0.05, // 5%
    lighting: 0.03,
    general: 0.05
  },

  // Starting voltage drop (motors only)
  starting: {
    DOL: 0.10, // 10% max (aligned with project workbook checks)
    StarDelta: 0.10, // 10% max
    SoftStarter: 0.10,
    VFD: 0.05 // VFD limits it
  },

  // Total from source to load
  total: {
    transformer_to_furthest: 0.08 // 8% limit
  }
};

/**
 * SECTION 6: SHORT-CIRCUIT WITHSTAND
 * Cable must withstand Isc for clearing time t
 * Isc ≤ k × A × √t
 */

export const ShortCircuitData = {
  // Constant k for different materials and insulation
  // At 90°C initial, 250°C final temp (XLPE)
  material_constant: {
    'Cu_XLPE_90C': 143,
    'Cu_PVC_70C': 115,
    'Al_XLPE_90C': 94,
    'Al_PVC_70C': 76,
    // Legacy keys for compatibility
    copper_XLPE_90C: 143,
    copper_PVC_70C: 115,
    aluminum_XLPE_90C: 94,
    aluminum_PVC_70C: 76
  } as Record<string, number>,

  // Typical protection clearing times (seconds)
  protection_clearing_time: {
    instantaneous_breaker: 0.02, // 20ms
    fast_breaker: 0.04, // 40ms
    standard_breaker: 0.1, // 100ms
    delayed_breaker: 0.5, // 500ms
    fuse: 0.02 // 20ms
  }
};

/**
 * SECTION 7: LOAD TYPE SPECIFICATIONS
 */

export const LoadTypeSpecs = {
  Motor: {
    efficiencyRange: { min: 0.85, max: 0.96 },
    typicalEfficiency: 0.92,
    powerFactorRange: { min: 0.75, max: 0.92 },
    typicalPowerFactor: 0.85,
    needsStartingCheck: true,
    typicalStartingMethod: 'DOL',
    icon: '⚙️'
  },

  Heater: {
    efficiencyRange: { min: 0.98, max: 1.0 },
    typicalEfficiency: 0.99,
    powerFactorRange: { min: 0.99, max: 1.0 },
    typicalPowerFactor: 1.0,
    needsStartingCheck: false,
    icon: '🔥'
  },

  Transformer: {
    efficiencyRange: { min: 0.95, max: 0.99 },
    typicalEfficiency: 0.97,
    powerFactorRange: { min: 0.95, max: 0.98 },
    typicalPowerFactor: 0.95,
    needsStartingCheck: false,
    icon: '🔌'
  },

  Feeder: {
    efficiencyRange: { min: 0.99, max: 1.0 },
    typicalEfficiency: 1.0,
    powerFactorRange: { min: 0.8, max: 1.0 },
    typicalPowerFactor: 0.90,
    needsStartingCheck: false,
    icon: '📡'
  },

  'Pump': {
    efficiencyRange: { min: 0.80, max: 0.92 },
    typicalEfficiency: 0.88,
    powerFactorRange: { min: 0.80, max: 0.90 },
    typicalPowerFactor: 0.85,
    needsStartingCheck: true,
    typicalStartingMethod: 'StarDelta',
    icon: '💧'
  },

  'Fan': {
    efficiencyRange: { min: 0.80, max: 0.92 },
    typicalEfficiency: 0.88,
    powerFactorRange: { min: 0.80, max: 0.90 },
    typicalPowerFactor: 0.85,
    needsStartingCheck: true,
    typicalStartingMethod: 'StarDelta',
    icon: '💨'
  },

  'Compressor': {
    efficiencyRange: { min: 0.75, max: 0.90 },
    typicalEfficiency: 0.85,
    powerFactorRange: { min: 0.75, max: 0.85 },
    typicalPowerFactor: 0.80,
    needsStartingCheck: true,
    typicalStartingMethod: 'VFD',
    icon: '🌪️'
  }
};

/**
 * SECTION 8: INSTALLATION METHOD FACTORS
 */

export const InstallationMethods = {
  'Air - Ladder tray (touching)': {
    grouping_table: 'grouping_factor_air',
    reactance_table: 'air_touching',
    code: 'A1',
    factor: 1.0
  },
  'Air - Ladder tray (spaced 400mm)': {
    grouping_table: 'grouping_factor_air',
    reactance_table: 'air_spaced_400mm',
    code: 'A2',
    factor: 1.05
  },
  'Air - Conduit (single)': {
    grouping_table: 'grouping_factor_air',
    reactance_table: 'air_touching',
    code: 'C',
    factor: 0.95
  },
  'Air - Conduit (multi)': {
    grouping_table: 'grouping_factor_air',
    reactance_table: 'air_touching',
    code: 'C3',
    factor: 0.85
  },
  'Buried - Direct in ground': {
    grouping_table: 'grouping_factor_buried',
    reactance_table: 'buried',
    code: 'D1',
    factor: 1.0
  },
  'Buried - In duct': {
    grouping_table: 'grouping_factor_buried',
    reactance_table: 'buried',
    code: 'D2',
    factor: 0.95
  }
};

/**
 * SECTION 9: CABLE DESIGNATION STANDARDS (IEC 60228/60811)
 * For generating proper cable part numbers
 */

export const CableStandards = {
  // Conductor material codes
  material: {
    Cu: 'Copper',
    Al: 'Aluminum'
  },

  // Insulation type codes
  insulation: {
    XLPE: 'Cross-linked polyethylene (90°C)',
    PVC: 'Polyvinyl chloride (70°C)',
    EPR: 'Ethylene propylene rubber (60°C)'
  },

  // Sheath codes
  sheath: {
    PVC: 'PVC sheath',
    LSZH: 'Low smoke zero halogen',
    None: 'No sheath'
  },

  // Standard color coding
  phase_colors: {
    R: 'Red (L1)',
    Y: 'Yellow (L2)',
    B: 'Blue (L3)',
    N: 'Black (Neutral)',
    E: 'Green/Yellow (Earth)'
  }
};

export default {
  ConductorDatabase,
  AmpacityTables,
  DeratingTables,
  MotorStartingMultipliers,
  VoltageLimits,
  ShortCircuitData,
  LoadTypeSpecs,
  InstallationMethods,
  CableStandards
};
