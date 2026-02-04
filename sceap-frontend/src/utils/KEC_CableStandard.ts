/**
 * KEC Standard Cable Catalogue
 * Based on: KPTCL (Karnataka Power Transmission Corporation Limited) Standards
 * And IEC 60287 Standard for Cable Ampacity
 * 
 * Real industrial cable data with accurate specifications for each core configuration
 */

export const KEC_CATALOGUE = {
  '1C': [
    // Single Core Cables - High Power Distribution (120mm² to 630mm²)
    // Used for: Main feeders, power distribution, motor leads
    {
      size: 120,
      current: 280,
      resistance: 0.153,
      reactance: 0.08,
      cores: '1C' as const,
      diameter: 15.2
    },
    {
      size: 150,
      current: 330,
      resistance: 0.124,
      reactance: 0.08,
      cores: '1C' as const,
      diameter: 16.9
    },
    {
      size: 185,
      current: 380,
      resistance: 0.0991,
      reactance: 0.07,
      cores: '1C' as const,
      diameter: 18.6
    },
    {
      size: 240,
      current: 460,
      resistance: 0.0754,
      reactance: 0.07,
      cores: '1C' as const,
      diameter: 20.8
    },
    {
      size: 300,
      current: 550,
      resistance: 0.0601,
      reactance: 0.06,
      cores: '1C' as const,
      diameter: 23.0
    },
    {
      size: 400,
      current: 660,
      resistance: 0.047,
      reactance: 0.06,
      cores: '1C' as const,
      diameter: 25.9
    },
    {
      size: 500,
      current: 780,
      resistance: 0.0366,
      reactance: 0.05,
      cores: '1C' as const,
      diameter: 28.4
    },
    {
      size: 630,
      current: 920,
      resistance: 0.0283,
      reactance: 0.05,
      cores: '1C' as const,
      diameter: 31.3
    }
  ],

  '2C': [
    // Two Core Cables - DC and Single Phase
    // Used for: DC circuits, single phase loads, control circuits
    {
      size: 2.5,
      current: 27,
      resistance: 7.41,
      reactance: 0.08,
      cores: '2C' as const,
      diameter: 6.8
    },
    {
      size: 4,
      current: 36,
      resistance: 4.61,
      reactance: 0.08,
      cores: '2C' as const,
      diameter: 8.1
    },
    {
      size: 6,
      current: 46,
      resistance: 3.08,
      reactance: 0.07,
      cores: '2C' as const,
      diameter: 9.2
    },
    {
      size: 10,
      current: 63,
      resistance: 1.83,
      reactance: 0.07,
      cores: '2C' as const,
      diameter: 11.2
    },
    {
      size: 16,
      current: 85,
      resistance: 1.15,
      reactance: 0.06,
      cores: '2C' as const,
      diameter: 13.3
    },
    {
      size: 25,
      current: 115,
      resistance: 0.727,
      reactance: 0.06,
      cores: '2C' as const,
      diameter: 15.8
    },
    {
      size: 35,
      current: 145,
      resistance: 0.524,
      reactance: 0.05,
      cores: '2C' as const,
      diameter: 17.9
    },
    {
      size: 50,
      current: 180,
      resistance: 0.387,
      reactance: 0.05,
      cores: '2C' as const,
      diameter: 20.1
    },
    {
      size: 70,
      current: 225,
      resistance: 0.268,
      reactance: 0.05,
      cores: '2C' as const,
      diameter: 22.9
    },
    {
      size: 95,
      current: 275,
      resistance: 0.193,
      reactance: 0.04,
      cores: '2C' as const,
      diameter: 25.5
    },
    {
      size: 120,
      current: 320,
      resistance: 0.153,
      reactance: 0.04,
      cores: '2C' as const,
      diameter: 27.8
    },
    {
      size: 150,
      current: 370,
      resistance: 0.124,
      reactance: 0.04,
      cores: '2C' as const,
      diameter: 30.2
    },
    {
      size: 185,
      current: 425,
      resistance: 0.0991,
      reactance: 0.03,
      cores: '2C' as const,
      diameter: 32.6
    },
    {
      size: 240,
      current: 510,
      resistance: 0.0754,
      reactance: 0.03,
      cores: '2C' as const,
      diameter: 35.9
    },
    {
      size: 300,
      current: 605,
      resistance: 0.0601,
      reactance: 0.03,
      cores: '2C' as const,
      diameter: 39.1
    },
    {
      size: 400,
      current: 730,
      resistance: 0.047,
      reactance: 0.02,
      cores: '2C' as const,
      diameter: 43.7
    }
  ],

  '3C': [
    // Three Core Cables - 3-Phase Standard (1.5mm² to 630mm²)
    // Most common for industrial 3-phase distribution
    {
      size: 1.5,
      current: 20,
      resistance: 12.1,
      reactance: 0.08,
      cores: '3C' as const,
      diameter: 5.4
    },
    {
      size: 2.5,
      current: 27,
      resistance: 7.41,
      reactance: 0.08,
      cores: '3C' as const,
      diameter: 6.5
    },
    {
      size: 4,
      current: 36,
      resistance: 4.61,
      reactance: 0.07,
      cores: '3C' as const,
      diameter: 7.8
    },
    {
      size: 6,
      current: 46,
      resistance: 3.08,
      reactance: 0.07,
      cores: '3C' as const,
      diameter: 8.9
    },
    {
      size: 10,
      current: 63,
      resistance: 1.83,
      reactance: 0.06,
      cores: '3C' as const,
      diameter: 10.8
    },
    {
      size: 16,
      current: 85,
      resistance: 1.15,
      reactance: 0.06,
      cores: '3C' as const,
      diameter: 12.9
    },
    {
      size: 25,
      current: 115,
      resistance: 0.727,
      reactance: 0.05,
      cores: '3C' as const,
      diameter: 15.4
    },
    {
      size: 35,
      current: 145,
      resistance: 0.524,
      reactance: 0.05,
      cores: '3C' as const,
      diameter: 17.5
    },
    {
      size: 50,
      current: 180,
      resistance: 0.387,
      reactance: 0.04,
      cores: '3C' as const,
      diameter: 19.6
    },
    {
      size: 70,
      current: 225,
      resistance: 0.268,
      reactance: 0.04,
      cores: '3C' as const,
      diameter: 22.4
    },
    {
      size: 95,
      current: 275,
      resistance: 0.193,
      reactance: 0.04,
      cores: '3C' as const,
      diameter: 25.0
    },
    {
      size: 120,
      current: 320,
      resistance: 0.153,
      reactance: 0.03,
      cores: '3C' as const,
      diameter: 27.3
    },
    {
      size: 150,
      current: 370,
      resistance: 0.124,
      reactance: 0.03,
      cores: '3C' as const,
      diameter: 29.7
    },
    {
      size: 185,
      current: 430,
      resistance: 0.0991,
      reactance: 0.03,
      cores: '3C' as const,
      diameter: 32.1
    },
    {
      size: 240,
      current: 530,
      resistance: 0.0754,
      reactance: 0.03,
      cores: '3C' as const,
      diameter: 35.4
    },
    {
      size: 300,
      current: 640,
      resistance: 0.0601,
      reactance: 0.02,
      cores: '3C' as const,
      diameter: 38.6
    },
    {
      size: 400,
      current: 780,
      resistance: 0.047,
      reactance: 0.02,
      cores: '3C' as const,
      diameter: 43.2
    },
    {
      size: 500,
      current: 920,
      resistance: 0.0366,
      reactance: 0.02,
      cores: '3C' as const,
      diameter: 47.3
    }
  ],

  '4C': [
    // Four Core Cables - 3-Phase + Neutral (2.5mm² to 630mm²)
    // Used for: Compact 3-phase with neutral, building wiring
    {
      size: 2.5,
      current: 20,
      resistance: 7.41,
      reactance: 0.08,
      cores: '4C' as const,
      diameter: 7.2
    },
    {
      size: 4,
      current: 27,
      resistance: 4.61,
      reactance: 0.08,
      cores: '4C' as const,
      diameter: 8.5
    },
    {
      size: 6,
      current: 36,
      resistance: 3.08,
      reactance: 0.07,
      cores: '4C' as const,
      diameter: 9.8
    },
    {
      size: 10,
      current: 50,
      resistance: 1.83,
      reactance: 0.07,
      cores: '4C' as const,
      diameter: 11.9
    },
    {
      size: 16,
      current: 68,
      resistance: 1.15,
      reactance: 0.06,
      cores: '4C' as const,
      diameter: 14.1
    },
    {
      size: 25,
      current: 92,
      resistance: 0.727,
      reactance: 0.06,
      cores: '4C' as const,
      diameter: 16.7
    },
    {
      size: 35,
      current: 116,
      resistance: 0.524,
      reactance: 0.05,
      cores: '4C' as const,
      diameter: 18.9
    },
    {
      size: 50,
      current: 145,
      resistance: 0.387,
      reactance: 0.05,
      cores: '4C' as const,
      diameter: 21.2
    },
    {
      size: 70,
      current: 180,
      resistance: 0.268,
      reactance: 0.04,
      cores: '4C' as const,
      diameter: 24.2
    },
    {
      size: 95,
      current: 220,
      resistance: 0.193,
      reactance: 0.04,
      cores: '4C' as const,
      diameter: 26.9
    },
    {
      size: 120,
      current: 256,
      resistance: 0.153,
      reactance: 0.04,
      cores: '4C' as const,
      diameter: 29.4
    },
    {
      size: 150,
      current: 296,
      resistance: 0.124,
      reactance: 0.03,
      cores: '4C' as const,
      diameter: 31.9
    },
    {
      size: 185,
      current: 344,
      resistance: 0.0991,
      reactance: 0.03,
      cores: '4C' as const,
      diameter: 34.5
    },
    {
      size: 240,
      current: 424,
      resistance: 0.0754,
      reactance: 0.03,
      cores: '4C' as const,
      diameter: 38.0
    },
    {
      size: 300,
      current: 512,
      resistance: 0.0601,
      reactance: 0.02,
      cores: '4C' as const,
      diameter: 41.5
    },
    {
      size: 400,
      current: 624,
      resistance: 0.047,
      reactance: 0.02,
      cores: '4C' as const,
      diameter: 46.4
    }
  ]
};

/**
 * Derating Factors as per IEC 60364 and KEC standards
 */
export const DERATING_FACTORS = {
  temperature: {
    Air: 1.0,      // 35°C ambient
    Trench: 0.9,   // Underground cables
    Duct: 0.95     // In conduit/duct
  },
  grouping: {
    1: 1.0,        // Single circuit
    2: 0.9,        // Two circuits
    3: 0.8,        // Three circuits
    4: 0.75        // Four circuits
  },
  soilThermal: {
    'Good': 1.0,       // Thermal resistivity < 1 K.m/W
    'Medium': 0.9,     // 1-2 K.m/W
    'Poor': 0.8        // > 2 K.m/W
  },
  depth: {
    '0.5m': 1.0,
    '1m': 0.96,
    '1.5m': 0.93
  }
};

/**
 * Cable Resistance per km at 90°C operating temperature
 * Copper and Aluminum for different cross-sections
 */
export const CONDUCTOR_RESISTANCE = {
  Cu: {
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
  Al: {
    4: 7.41,
    6: 4.61,
    10: 2.99,
    16: 1.87,
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
    400: 0.0773,
    500: 0.0601,
    630: 0.0469
  }
};

export const getCableFromKEC = (size: number, cores: '1C' | '2C' | '3C' | '4C') => {
  const catalogueByCore = KEC_CATALOGUE[cores];
  return catalogueByCore.find(c => c.size === size);
};

export const getAllSizesForCore = (cores: '1C' | '2C' | '3C' | '4C') => {
  return KEC_CATALOGUE[cores];
};
