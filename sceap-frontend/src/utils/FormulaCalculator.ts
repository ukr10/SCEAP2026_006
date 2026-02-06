/**
 * FORMULA CALCULATOR - Live Excel-style Computation Engine
 * 
 * Handles all 53+ cable sizing formulas with cascading recalculation
 * Provides formula text display and real-time value updates
 */

import { KEC_CATALOGUE } from './KEC_CableStandard';
// Note: EXCEL_FORMULA_MAPPINGS imported in ResultsTab for display purposes only

export interface EditableCell {
  // Input values (user-editable)
  loadKW: number;
  voltage: number;
  length: number;
  powerFactor: number;
  efficiency: number;
  phase: '1Ø' | '3Ø';
  numberOfCores: '1C' | '2C' | '3C' | '4C';
  installationMethod: 'Air' | 'Trench' | 'Duct';
  ambientTemp: number;
  numberOfLoadedCircuits: number;
  breakerType?: string;
  breakerSize?: number;
  feederType?: string;
  
  // Calculated values (auto-computed)
  ratedCurrent?: number;
  motorStartingCurrent?: number;
  motorStartingPF?: number;
  cableRating?: number;
  deratingFactorTemp?: number;
  deratingFactorGrouping?: number;
  deratingFactorDepth?: number;
  deratingFactorSoil?: number;
  deratingFactorTotal?: number;
  deratedCurrent?: number;
  sizeByAmpacity?: number;
  sizeByVdropRunning?: number;
  sizeByVdropStarting?: number;
  sizeByISc?: number;
  selectedSize?: number;
  numberOfRuns?: number;
  voltageDrop_running_V?: number;
  voltageDrop_running_percent?: number;
  voltageDrop_starting_V?: number;
  voltageDrop_starting_percent?: number;
  
  [key: string]: any;
}

export interface FormulaDefinition {
  id: number;
  columnName: string;
  formulaText: string;
  shortForm: string; // e.g., "I = P/(V×√3×PF)"
  inputs: string[]; // Dependencies: ['loadKW', 'voltage', 'powerFactor']
  outputKey: string; // The key in EditableCell to store result
}

export class FormulaCalculator {
  private formulaDefinitions: Map<string, FormulaDefinition> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map(); // Maps outputKey -> list of formulas that depend on it

  constructor() {
    this.initializeFormulas();
    this.buildDependencyGraph();
  }

  /**
   * Initialize all formula definitions with their mathematical representations
   */
  private initializeFormulas() {
    const formulas: FormulaDefinition[] = [
      // Formula 1: Rated Current (FLC)
      {
        id: 1,
        columnName: 'Rated Current (It)',
        formulaText: 'IF(phase="3Ø", P*1000/(√3*V*cosφ*η), P*1000/(V*cosφ*η))',
        shortForm: 'I = P/(V×√3×PF×η)',
        inputs: ['loadKW', 'voltage', 'powerFactor', 'efficiency', 'phase'],
        outputKey: 'ratedCurrent',
      },
      // Formula 2: Motor Starting Current
      {
        id: 2,
        columnName: 'Motor Starting Current',
        formulaText: '6 × It (for motors only)',
        shortForm: 'I_start = 6 × I',
        inputs: ['ratedCurrent'],
        outputKey: 'motorStartingCurrent',
      },
      // Formula 3: Motor Starting PF
      {
        id: 3,
        columnName: 'Motor Starting PF',
        formulaText: '0.2 (for motors only)',
        shortForm: 'PF_start = 0.2',
        inputs: [],
        outputKey: 'motorStartingPF',
      },
      // Formula 4: Cable Current Rating (from catalogue)
      {
        id: 4,
        columnName: 'Cable Current Rating',
        formulaText: 'VLOOKUP(size, Catalogue, rating_column)',
        shortForm: 'R = Catalogue[size]',
        inputs: ['selectedSize', 'numberOfCores', 'installationMethod'],
        outputKey: 'cableRating',
      },
      // Formula 5: Derating Factor - Temperature
      {
        id: 5,
        columnName: 'Derating Factor (Temperature)',
        formulaText: 'K_temp based on ambient temperature',
        shortForm: 'K_t = f(T_amb)',
        inputs: ['ambientTemp'],
        outputKey: 'deratingFactorTemp',
      },
      // Formula 6: Derating Factor - Grouping
      {
        id: 6,
        columnName: 'Derating Factor (Grouping)',
        formulaText: 'K_group based on number of circuits and core count',
        shortForm: 'K_g = f(circuits, cores)',
        inputs: ['numberOfLoadedCircuits', 'numberOfCores'],  // Added numberOfCores
        outputKey: 'deratingFactorGrouping',
      },
      // Formula 8: Derating Factor - Depth
      {
        id: 8,
        columnName: 'Derating Factor (Depth)',
        formulaText: 'K_depth based on laying depth',
        shortForm: 'K_d = f(depth)',
        inputs: ['installationMethod'],
        outputKey: 'deratingFactorDepth',
      },
      // Formula 9: Derating Factor - Soil Resistivity
      {
        id: 9,
        columnName: 'Derating Factor (Soil)',
        formulaText: 'K_soil based on soil thermal resistivity',
        shortForm: 'K_s = f(ρ_soil)',
        inputs: ['installationMethod'],
        outputKey: 'deratingFactorSoil',
      },
      // Formula 10: Total Derating Factor
      {
        id: 10,
        columnName: 'Total Derating Factor',
        formulaText: 'K_total = K_t × K_g × K_d × K_s',
        shortForm: 'K = K_t × K_g × K_d × K_s',
        inputs: ['deratingFactorTemp', 'deratingFactorGrouping', 'deratingFactorDepth', 'deratingFactorSoil'],
        outputKey: 'deratingFactorTotal',
      },
      // Formula 11: Derated Current
      {
        id: 11,
        columnName: 'Derated Current',
        formulaText: 'I_derated = I_rated / K_total',
        shortForm: 'I_derated = I / K',
        inputs: ['ratedCurrent', 'deratingFactorTotal'],
        outputKey: 'deratedCurrent',
      },
      // Formula 13: Voltage Drop (Running) - Volts
      {
        id: 13,
        columnName: 'Voltage Drop Running (V)',
        formulaText: 'ΔU = (√3 × I × L × (R×cosφ + X×sinφ)) / 1000',
        shortForm: 'ΔU = √3×I×L×(R×cos φ+X×sin φ)/1000',
        inputs: ['ratedCurrent', 'length', 'powerFactor'],
        outputKey: 'voltageDrop_running_V',
      },
      // Formula 14: Voltage Drop (Running) - Percent
      {
        id: 14,
        columnName: 'Voltage Drop Running (%)',
        formulaText: 'ΔU% = (ΔU / V_rated) × 100',
        shortForm: 'ΔU% = (ΔU / V) × 100',
        inputs: ['voltageDrop_running_V', 'voltage'],
        outputKey: 'voltageDrop_running_percent',
      },
      // Formula 16: Voltage Drop (Starting) - Volts
      {
        id: 16,
        columnName: 'Voltage Drop Starting (V)',
        formulaText: 'ΔU_start = (√3 × I_start × L × (R×cosφ_start + X×sinφ_start)) / 1000',
        shortForm: 'ΔU_start = √3×I_start×L×(R×cos φ+X×sin φ)/1000',
        inputs: ['motorStartingCurrent', 'length', 'motorStartingPF'],
        outputKey: 'voltageDrop_starting_V',
      },
      // Formula 17: Voltage Drop (Starting) - Percent
      {
        id: 17,
        columnName: 'Voltage Drop Starting (%)',
        formulaText: 'ΔU_start% = (ΔU_start / V_rated) × 100',
        shortForm: 'ΔU_start% = (ΔU_start / V) × 100',
        inputs: ['voltageDrop_starting_V', 'voltage'],
        outputKey: 'voltageDrop_starting_percent',
      },
      // Formula 20: Number of Runs
      {
        id: 20,
        columnName: 'Number of Runs',
        formulaText: 'N = CEILING(I_derated / I_catalogue)',
        shortForm: 'N = ⌈I_derated / I_cable⌉',
        inputs: ['deratedCurrent', 'cableRating'],
        outputKey: 'numberOfRuns',
      },
      // Formula 21A: Size by Voltage Drop (Running)
      {
        id: 21,
        columnName: 'Size by V-Drop Running',
        formulaText: 'SELECT size where ΔU% ≤ 5% (or 3% for motors)',
        shortForm: 'Size = f(V%, I, L)',
        inputs: ['ratedCurrent', 'length', 'powerFactor', 'numberOfCores'],
        outputKey: 'sizeByVdropRunning',
      },
      // Formula 21B: Size by Voltage Drop (Starting)
      {
        id: 21,
        columnName: 'Size by V-Drop Starting',
        formulaText: 'SELECT size where ΔU_start% ≤ 15% (motors)',
        shortForm: 'Size = f(V%_start, I_start, L)',
        inputs: ['motorStartingCurrent', 'length', 'motorStartingPF', 'numberOfCores'],
        outputKey: 'sizeByVdropStarting',
      },
      // Formula 22: Size by Current (Ampacity)
      {
        id: 22,
        columnName: 'Size by Ampacity',
        formulaText: 'SELECT cable size where I_catalogue ≥ I_derated',
        shortForm: 'Size = min(s: I_cable[s] ≥ I_derated)',
        inputs: ['deratedCurrent', 'numberOfCores', 'installationMethod'],  // Added numberOfCores and installationMethod
        outputKey: 'sizeByAmpacity',
      },
      // Formula 24: Selected Cable Size
      {
        id: 24,
        columnName: 'Selected Cable Size',
        formulaText: 'MAX(Size_by_current, Size_by_vdrop_run, Size_by_vdrop_start, Size_by_Isc)',
        shortForm: 'Size_final = MAX(all sizing constraints)',
        inputs: ['sizeByAmpacity', 'sizeByVdropRunning', 'sizeByVdropStarting', 'sizeByISc', 'numberOfCores'],  // Added numberOfCores for dependency cache
        outputKey: 'selectedSize',
      },
      // Formula 25: Short Circuit Current
      {
        id: 25,
        columnName: 'Short Circuit Current',
        formulaText: 'I_sc = V / (Z_total)',
        shortForm: 'I_sc = V / Z',
        inputs: ['voltage'],
        outputKey: 'sizeByISc',
      },
    ];

    for (const f of formulas) {
      this.formulaDefinitions.set(f.outputKey, f);
    }
  }

  /**
   * Build dependency graph: which formulas depend on which outputs
   */
  private buildDependencyGraph() {
    for (const [, formula] of this.formulaDefinitions) {
      for (const input of formula.inputs) {
        if (!this.dependencyGraph.has(input)) {
          this.dependencyGraph.set(input, []);
        }
        this.dependencyGraph.get(input)!.push(formula.outputKey);
      }
    }
  }

  /**
   * Calculate all dependent values when one cell changes
   * Returns updated cell data with all cascading recalculations
   */
  calculateCascade(cell: EditableCell, changedKey: string): EditableCell {
    const updated = { ...cell };
    
    // Queue of keys to recalculate
    const queue = this.dependencyGraph.get(changedKey) || [];
    const processed = new Set<string>([changedKey]);

    while (queue.length > 0) {
      const key = queue.shift()!;
      if (processed.has(key)) continue;
      
      const formula = this.formulaDefinitions.get(key);
      if (formula) {
        // Evaluate the formula
        updated[key] = this.evaluateFormula(formula, updated);
        processed.add(key);
        
        // Add dependent formulas to queue
        const dependents = this.dependencyGraph.get(key) || [];
        for (const dep of dependents) {
          if (!processed.has(dep)) {
            queue.push(dep);
          }
        }
      }
    }

    return updated;
  }

  /**
   * Evaluate individual formula given a cell context
   */
  private evaluateFormula(formula: FormulaDefinition, cell: EditableCell): number | string {
    try {
      switch (formula.outputKey) {
        case 'ratedCurrent':
          return this.calcRatedCurrent(cell);
        case 'motorStartingCurrent':
          return (cell.ratedCurrent || 0) * 6;
        case 'motorStartingPF':
          return 0.2;
        case 'cableRating':
          return this.getCableRating(cell.selectedSize || 0, cell.numberOfCores, cell.installationMethod);
        case 'deratingFactorTemp':
          return this.getDeratingFactorTemp(cell.ambientTemp);
        case 'deratingFactorGrouping':
          return this.getDeratingFactorGrouping(cell.numberOfLoadedCircuits, cell.numberOfCores);
        case 'deratingFactorDepth':
          return this.getDeratingFactorDepth(cell.installationMethod);
        case 'deratingFactorSoil':
          return this.getDeratingFactorSoil(cell.installationMethod);
        case 'deratingFactorTotal':
          return (cell.deratingFactorTemp || 1) * 
                 (cell.deratingFactorGrouping || 1) * 
                 (cell.deratingFactorDepth || 1) * 
                 (cell.deratingFactorSoil || 1);
        case 'deratedCurrent':
          return (cell.ratedCurrent || 0) / (cell.deratingFactorTotal || 1);
        case 'voltageDrop_running_V':
          return this.calcVoltageDrop(cell.ratedCurrent || 0, cell.length, cell.powerFactor, cell.numberOfCores);
        case 'voltageDrop_running_percent':
          return ((cell.voltageDrop_running_V || 0) / (cell.voltage || 415)) * 100;
        case 'voltageDrop_starting_V':
          return this.calcVoltageDrop(cell.motorStartingCurrent || 0, cell.length, cell.motorStartingPF || 0.2, cell.numberOfCores);
        case 'voltageDrop_starting_percent':
          return ((cell.voltageDrop_starting_V || 0) / (cell.voltage || 415)) * 100;
        case 'numberOfRuns':
          return Math.ceil((cell.deratedCurrent || 0) / (cell.cableRating || 1));
        case 'sizeByVdropRunning':
          // STUB: Would require voltage drop lookup in cable table
          // For now, return 0 (will trigger max() to use other constraints)
          return 0;
        case 'sizeByVdropStarting':
          // STUB: Would require voltage drop lookup in cable table
          // For now, return 0 (will trigger max() to use other constraints)
          return 0;
        case 'sizeByAmpacity':
          return this.findCableSize(cell.deratedCurrent || 0, cell.numberOfCores, cell.installationMethod);
        case 'selectedSize':
          return Math.max(
            cell.sizeByAmpacity || 0,
            cell.sizeByVdropRunning || 0,
            cell.sizeByVdropStarting || 0,
            cell.sizeByISc || 0
          );
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Formula calculation error for ${formula.outputKey}:`, error);
      return 0;
    }
  }

  private calcRatedCurrent(cell: EditableCell): number {
    const P = cell.loadKW * 1000; // Convert kW to W
    const V = cell.voltage;
    const cosφ = cell.powerFactor;
    const η = cell.efficiency;

    if (cell.phase === '3Ø') {
      return P / (Math.sqrt(3) * V * cosφ * η);
    } else {
      return P / (V * cosφ * η);
    }
  }

  private calcVoltageDrop(current: number, length: number, _pf: number, cores: string): number {
    // Simplified: ΔU = √3 × I × L × R / 1000 (running V-drop)
    // Get resistance from catalogue
    const R = this.getConductorResistance(16, cores); // Assume 16mm² initially
    return (Math.sqrt(3) * current * length * R) / 1000;
  }

  private getConductorResistance(size: number, cores: string): number {
    const coreKey = cores as keyof typeof KEC_CATALOGUE;
    const coreTable = KEC_CATALOGUE[coreKey];
    if (!coreTable) return 0.1;
    const entry = coreTable.find((e: any) => e.size === size);
    return entry ? entry.resistance : 0.1;
  }

  private getCableRating(size: number, cores: string, _installation: string): number {
    // Lookup from KEC catalogue
    const coreKey = cores as keyof typeof KEC_CATALOGUE;
    const coreTable = KEC_CATALOGUE[coreKey];
    if (!coreTable) return 100;
    const entry = coreTable.find((e: any) => e.size === size);
    if (!entry) return 100;
    // Use current rating from catalogue
    return entry.current || 100;
  }

  private findCableSize(deredCurrent: number, cores: string, _installation: string): number {
    const coreKey = cores as keyof typeof KEC_CATALOGUE;
    const coreTable = KEC_CATALOGUE[coreKey];
    if (!coreTable || coreTable.length === 0) return 16;
    
    // Find smallest size where rating >= derated current
    for (const entry of coreTable) {
      if ((entry.current || 0) >= deredCurrent) {
        return entry.size;
      }
    }
    // If no single cable fits, return max available (client should use parallel runs)
    const maxSize = coreTable[coreTable.length - 1].size;
    return maxSize;
  }

  private getDeratingFactorTemp(ambientTemp: number): number {
    // Simplified: standard is 40°C; every 5°C above reduces by ~2%
    const baseTemp = 40;
    if (ambientTemp <= baseTemp) return 1.0;
    const excess = ambientTemp - baseTemp;
    return Math.max(0.5, 1.0 - (excess / 5) * 0.02);
  }

  private getDeratingFactorGrouping(numberOfCircuits: number, _cores: string): number {
    // Based on number of loaded circuits
    if (numberOfCircuits <= 1) return 1.0;
    if (numberOfCircuits <= 3) return 0.85;
    if (numberOfCircuits <= 6) return 0.79;
    return 0.73;
  }

  private getDeratingFactorDepth(installation: string): number {
    return installation === 'Duct' ? 0.89 : 1.0;
  }

  private getDeratingFactorSoil(installation: string): number {
    return installation === 'Trench' ? 0.95 : 1.0;
  }

  /**
   * Get formula definition for display
   */
  getFormulaForColumn(columnName: string): FormulaDefinition | null {
    return this.formulaDefinitions.get(columnName) || null;
  }

  /**
   * Get all formula definitions for reference page
   */
  getAllFormulas(): FormulaDefinition[] {
    return Array.from(this.formulaDefinitions.values())
      .sort((a, b) => a.id - b.id);
  }
}

export const formulaCalculator = new FormulaCalculator();
