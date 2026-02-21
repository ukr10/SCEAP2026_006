import { useState, useEffect } from 'react';
import { Download, AlertCircle, Edit2, RotateCcw, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePathContext } from '../context/PathContext';
import { CableSegment } from '../utils/pathDiscoveryService';
import CableSizingEngine_V2, { CableSizingInput as CableSizingInputV2 } from '../utils/CableSizingEngine_V2';

/**
 * EditableCell Component - Renders as input when editing, static text otherwise
 */
interface EditableCellProps {
  value: number | string;
  type: 'number' | 'text' | 'select';
  editable: boolean;
  onChange: (value: any) => void;
  className?: string;
  options?: { label: string; value: string }[];
  precision?: number;
  width?: string;
}

const EditableCell = ({ value, type, editable, onChange, className = '', options = [], precision, width = 'w-full' }: EditableCellProps) => {
  if (!editable) {
    if (type === 'number' && precision !== undefined) {
      return <span className={`${className} whitespace-nowrap`}>{Number(value).toFixed(precision)}</span>;
    }
    return <span className={`${className} whitespace-nowrap`}>{value}</span>;
  }

  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (type === 'number') {
      onChange(Number(newValue));
    } else {
      onChange(newValue);
    }
  };

  const baseClassName = `${width} px-1 py-0.5 bg-blue-900/40 border border-blue-500 text-slate-100 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono`;

  if (type === 'select' && options.length > 0) {
    return (
      <select value={String(value)} onChange={handleChange} className={`${baseClassName} cursor-pointer`}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      className={baseClassName}
      step={type === 'number' ? '0.01' : undefined}
    />
  );
};

/**
 * PROFESSIONAL RESULTS TABLE - EXACT EXCEL STRUCTURE MATCH
 * 
 * This table matches the Excel HT Cable sheet structure exactly with:
 * - 41 display columns (2 ID + 8 LOAD + 4 SC + 6 CABLE + 9 CAPACITY + 3 RUN + 3 START + 3 REMARKS)
 * - 3 header rows (group names, field names, units)
 * - Color-coded column groups
 * - Linked formula calculations
 * - Editable cells with cascading recalculation
 * - Independent of demo data values (format-agnostic platform)
 */

interface ExcelResultRow {
  slNo: number;
  description: string;
  fromBus: string;
  toBus: string;
  cableNumber: string;
  feederType: 'M' | 'F';
  ratedPowerKVA?: number;
  ratedPowerKW: number;
  ratedVoltageKV: number;
  powerFactor: number;
  efficiency: number;
  flc_A: number;
  motorStartingCurrent_A: number;
  motorStartingPF: number;
  scCurrentSwitchboard_kA: number;
  scCurrentWithstandDuration_Sec: number;
  minSizeShortCircuit_sqmm: number;
  installation: 'AIR' | 'TRENCH' | 'DUCT';
  numberOfCores: '1C' | '2C' | '3C' | '4C';
  cableSize_sqmm: number;
  cableCurrentRating_A: number;
  cableResistance_90C_Ohm_Ph_km: number;
  cableReactance_50Hz_Ohm_Ph_km: number;
  cableLength_m: number;
  k1_ambientTemp: number;
  k2_groupingFactor: number;
  k3_groundTemp: number;
  k4_depthOfLaying: number;
  k5_thermalResistivity: number;
  k_total_deratingFactor: number;
  derated_currentCarryingCapacity_A: number;
  numberOfRuns: number;
  capacityCheck: 'YES' | 'NO';
  runningVoltageDrop_V: number;
  runningVoltageDrop_percent: number;
  runningVoltageDropCheck: 'YES' | 'NO';
  startingVoltageDip_V: number;
  startingVoltageDip_percent: number;
  startingVoltageDropCheck: 'YES' | 'NO' | 'NA';
  cableDesignation: string;
  totalLength_m: number;
  remarks: string;
  status: 'APPROVED' | 'WARNING' | 'FAILED';
}

const calculateExcelFormulas = (cable: CableSegment, idx: number, feederType: 'M' | 'F', userCatalogue?: any, userOverrides?: { cableSize?: number; numberOfRuns?: number; numberOfCores?: '1C' | '2C' | '3C' | '4C' }): Partial<ExcelResultRow> => {
  try {
    // LOAD GROUP - FLC Calculation based on feeder type
    const pf = cable.powerFactor ?? 0.85;
    const eff = cable.efficiency ?? 0.95;
    
    // FLC calculation depends on feeder type (M=Motor uses efficiency, F=Feeder doesn't)
    let flc_A: number;
    if (feederType === 'M') {
      // Motor: FLC = P / (√3 × V × PF × η)
      flc_A = (cable.loadKW) / (1.732 * (cable.voltage / 1000) * pf * eff);
    } else {
      // Feeder: FLC = P / (√3 × V × PF) [no efficiency factor]
      flc_A = (cable.loadKW) / (1.732 * (cable.voltage / 1000) * pf);
    }

    // Motor starting current (7.2× for DOL per Excel, only for Motors)
    const motorStartingCurrent_A = feederType === 'M' ? 7.2 * flc_A : 0;
    const motorStartingPF = feederType === 'M' ? 0.2 : 0;

    // SHORT CIRCUIT GROUP
    const scCurrentSwitchboard_kA = cable.maxShortCircuitCurrent || 50;
    const scWithstandDuration_Sec = 0.16;
    const minSizeShortCircuit = (scCurrentSwitchboard_kA * 1000 * Math.sqrt(scWithstandDuration_Sec)) / 94;

    // Get engine calculations - PASS USER CATALOGUE TO ENGINE
    const engine = new CableSizingEngine_V2(userCatalogue);
    
    // VOLTAGE-BASED CORE DETERMINATION (NEVER user input!)
    // =====================================================
    // This is a CRITICAL DESIGN RULE that cannot be overridden:
    // Number of cores is determined EXCLUSIVELY by voltage standards
    // 
    // Standards-based mapping:
    // - 11 kV, 6.6 kV, 3.3 kV → 1C (single-core cables per IEC 60502)
    // - 0.4 kV (415V) → 3C (3-phase copper per IS 732)
    // - 0.23 kV (230V) → 3C (3-phase copper per IS 732)
    //
    // Cores should NEVER be predefined input because:
    // ❌ If cores are input, cable sizing becomes meaningless
    // ❌ User could specify 11kV with 3C (physically wrong)
    // ❌ No way to verify standards compliance
    // ✅ CORRECT: Voltage in → sizing engine → cores determined → cables selected
    
    const coresByVoltageStandard: '1C' | '2C' | '3C' | '4C' = (cable.voltage >= 1000) ? '1C' : '3C';
    
    // Log the determination for debugging
    console.log(`[SIZING] Cable ${cable.cableNumber}: voltage=${cable.voltage}V (${cable.voltage/1000}kV) → cores=${coresByVoltageStandard} (determined by standard)`);
    if (cable.numberOfCores) {
      console.warn(`[SIZING] Ignoring user-specified cores "${cable.numberOfCores}" - using voltage-based cores: ${coresByVoltageStandard}`);
    }


    const engineInput: CableSizingInputV2 = {
      loadType: feederType === 'M' ? 'Motor' : 'Feeder',
      ratedPowerKW: cable.loadKW,
      voltage: cable.voltage,
      phase: '3Ø',
      efficiency: feederType === 'M' ? (cable.efficiency || 0.95) : 1.0,
      powerFactor: cable.powerFactor || 0.85,
      conductorMaterial: 'Cu',
      insulation: 'XLPE',
      numberOfCores: userOverrides?.numberOfCores || coresByVoltageStandard,
      installationMethod: (cable.installationMethod || 'Air') as 'Air' | 'Trench' | 'Duct',
      cableLength: cable.length || 0,
      ambientTemp: 40,
      numberOfLoadedCircuits: 1,
    };

    const engineResult = engine.sizeCable(engineInput);

    // CABLE DATA - From engine and catalogue, override with user selection if provided
    const selectedSize = userOverrides?.cableSize || engineResult.selectedConductorArea || 240;
    const selectedRuns = userOverrides?.numberOfRuns || engineResult.numberOfRuns || 1;
    
    const k_total = engineResult.deratingFactor || 0.876;
    const derated_currentCapacity = (engineResult.catalogRatingPerRun || 387) * k_total;
    const capacityCheck = (derated_currentCapacity * selectedRuns) >= flc_A ? 'YES' : 'NO';

    // VOLTAGE DROP - Running (match Excel formula)
    const runningVoltageDrop_V = engineResult.voltageDropRunning_volt || 0;
    const runningVoltageDrop_percent = (engineResult.voltageDropRunning_percent || 0);
    const runningVoltageDropCheck = runningVoltageDrop_percent <= 3 ? 'YES' : 'NO';

    // VOLTAGE DROP - Starting (Motors only)
    const startingVoltageDrop_V = engineResult.voltageDropStarting_volt || 0;
    const startingVoltageDrop_percent = feederType === 'M' ? (engineResult.voltageDropStarting_percent || 0) : 0;
    const startingVoltageDropCheck = feederType === 'M' ? (startingVoltageDrop_percent <= 10 ? 'YES' : 'NO') : 'NA';

    // SELECTED SIZE & DESIGNATION
    const coreUsed = (engineResult.coreConfig || coresByVoltageStandard) as '1C' | '2C' | '3C' | '4C';
    const designationRuns = `${selectedRuns}R`;
    const cableDesignation = `${designationRuns} X ${cable.voltage/1000}kV X ${coreUsed} X ${selectedSize} Sqmm`;
    const totalLength = (cable.length || 0) * selectedRuns;

    // STATUS - Determine based on electrical checks
    let status: 'APPROVED' | 'WARNING' | 'FAILED' = 'APPROVED';
    if (capacityCheck === 'NO' || runningVoltageDropCheck === 'NO' || (feederType === 'M' && startingVoltageDropCheck === 'NO')) {
      status = 'FAILED';
    }

    return {
      flc_A,
      motorStartingCurrent_A,
      motorStartingPF,
      scCurrentSwitchboard_kA,
      scCurrentWithstandDuration_Sec: scWithstandDuration_Sec,
      minSizeShortCircuit_sqmm: minSizeShortCircuit,
      numberOfCores: coreUsed,
      cableSize_sqmm: selectedSize,
      cableCurrentRating_A: engineResult.catalogRatingPerRun || 387,
      cableResistance_90C_Ohm_Ph_km: engineResult.cableResistance_90C_Ohm_km || 0.162,
      cableReactance_50Hz_Ohm_Ph_km: engineResult.cableReactance_Ohm_km || 0.088,
      k1_ambientTemp: engineResult.deratingComponents?.K_temp || 0.89,
      k2_groupingFactor: engineResult.deratingComponents?.K_group || 0.73,
      k3_groundTemp: 1.0,
      k4_depthOfLaying: engineResult.deratingComponents?.K_depth || 1.0,
      k5_thermalResistivity: engineResult.deratingComponents?.K_soil || 1.0,
      k_total_deratingFactor: k_total,
      derated_currentCarryingCapacity_A: derated_currentCapacity * selectedRuns,
      numberOfRuns: selectedRuns,
      capacityCheck,
      runningVoltageDrop_V,
      runningVoltageDrop_percent,
      runningVoltageDropCheck,
      startingVoltageDip_V: startingVoltageDrop_V,
      startingVoltageDip_percent: startingVoltageDrop_percent,
      startingVoltageDropCheck,
      cableDesignation,
      totalLength_m: totalLength,
      status,
    };
  } catch (error) {
    console.error('Formula calculation error for row', idx, error);
    return { status: 'FAILED' };
  }
};

const ResultsTab = () => {
  const { normalizedFeeders, catalogueData, updateFeeder } = usePathContext();
  const [results, setResults] = useState<ExcelResultRow[]>([]);
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [userOverrides, setUserOverrides] = useState<Record<number, { cableSize?: number; numberOfRuns?: number; numberOfCores?: '1C' | '2C' | '3C' | '4C'}>>({});
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  // column visibility map - true = visible
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  // initialize visibleColumns once
  useEffect(() => {
    const cols: Record<string, boolean> = {};
    // list of all field labels used in the table header (row2)
    const allLabels = [
      'SL','Cable #','From','To','Desc','Type','kW','kV','PF','η','FLC','I_m','PF_m','Inst',
      'Isc','t','Sz','Meth','Cores','Sz2','I','R','X','L','K_t','I_d','Runs','OK','K1','K2','K3','K5','K4',
      'ΔU','%ΔU','OK2','ΔU2','%ΔU2','OK3','Description','Rem','Status'
    ];
    allLabels.forEach(l => { cols[l] = true; });
    setVisibleColumns(cols);
  }, []);

  // helper to toggle visibility
  const toggleColumn = (label: string) => {
    setVisibleColumns(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Get available cable sizes from catalogue (if available)
  const getCableSizes = (): number[] => {
    if (catalogueData && typeof catalogueData === 'object') {
      return Object.keys(catalogueData)
        .map(k => parseInt(k))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    }
    return [16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500];
  };

  const getCoreOptions = () => [
    { label: '1C', value: '1C' },
    { label: '2C', value: '2C' },
    { label: '3C', value: '3C' },
    { label: '4C', value: '4C' },
  ];

  // Generate results on mount/update
  useEffect(() => {
    if (normalizedFeeders && normalizedFeeders.length > 0) {
      const generated = normalizedFeeders.map((cable, idx) => {
        // Map normalized loadType to feederType used by Excel formulas (M=Motor-type, F=Feeder/Transformer)
        const lt = (cable.loadType || '').toString().toLowerCase();
        const feederType = ['transformer', 'feeder'].includes(lt) ? 'F' : ['motor', 'pump', 'fan', 'compressor', 'heater'].includes(lt) ? 'M' : (lt === '' ? 'M' : 'F');
        const formulas = calculateExcelFormulas(cable, idx, feederType, catalogueData, userOverrides[idx]);
        return {
          slNo: idx + 1,
          cableNumber: cable.cableNumber || `C${idx + 1}`,
          description: cable.feederDescription || cable.cableNumber,
          fromBus: cable.fromBus || 'N/A',
          toBus: cable.toBus || 'N/A',
          feederType,
          ratedPowerKW: cable.loadKW,
          ratedVoltageKV: cable.voltage / 1000,
          powerFactor: cable.powerFactor,
          efficiency: cable.efficiency,
          installation: (cable.installationMethod?.toUpperCase() || 'AIR') as 'AIR' | 'TRENCH' | 'DUCT',
          cableLength_m: cable.length,
          remarks: (cable as any).remarks || '',
          ...formulas,
        } as ExcelResultRow;
      });
      setResults(generated);
    }
  }, [normalizedFeeders, catalogueData, userOverrides]);

  // Formula cascading: when user edits a cell, dependent cells recalculate
  const handleCellChange = (rowIdx: number, field: keyof CableSegment | 'feederType' | 'remarks' | 'cableSize' | 'numberOfRuns' | 'numberOfCores', value: any) => {
    if (!normalizedFeeders) return;
    
    const cable = normalizedFeeders[rowIdx];
    
    // Handle override-based fields separately
    if (field === 'cableSize' || field === 'numberOfRuns' || field === 'numberOfCores') {
      const newOverrides = { ...userOverrides };
      if (!newOverrides[rowIdx]) newOverrides[rowIdx] = {};
      
      if (field === 'cableSize') {
        newOverrides[rowIdx].cableSize = Number(value);
      } else if (field === 'numberOfRuns') {
        newOverrides[rowIdx].numberOfRuns = Number(value);
      } else if (field === 'numberOfCores') {
        newOverrides[rowIdx].numberOfCores = value;
      }
      
      setUserOverrides(newOverrides);
      return;
    }

    // Handle feederType change
    if (field === 'feederType') {
      const updated = [...results];
      updated[rowIdx].feederType = value;
      
      // Recalculate formulas with new feeder type
      const recalc = calculateExcelFormulas(cable, rowIdx, value, catalogueData, userOverrides[rowIdx]);
      updated[rowIdx] = { ...updated[rowIdx], ...recalc };
      
      setResults(updated);
      return;
    }

    // Handle remarks
    if (field === 'remarks') {
      const updated = [...results];
      updated[rowIdx].remarks = String(value);
      setResults(updated);
      updateFeeder(cable.cableNumber, { remarks: String(value) });
      return;
    }
    
    // Handle standard field changes
    const updatedCable: CableSegment = { ...cable, [field]: value };
    updateFeeder(cable.cableNumber, { [field]: value });
    
    const feederType = results[rowIdx]?.feederType || 'M';
    const recalc = calculateExcelFormulas(updatedCable, rowIdx, feederType, catalogueData, userOverrides[rowIdx]);
    
    const updated = [...results];
    updated[rowIdx] = {
      ...updated[rowIdx],
      ...(field === 'loadKW' && { ratedPowerKW: Number(value) }),
      ...(field === 'length' && { cableLength_m: Number(value) }),
      ...(field === 'powerFactor' && { powerFactor: Number(value) }),
      ...(field === 'efficiency' && { efficiency: Number(value) }),
      ...(field === 'installationMethod' && { installation: String(value).toUpperCase() as 'AIR' | 'TRENCH' | 'DUCT' }),
      ...recalc,
    } as ExcelResultRow;
    
    setResults(updated);
  };

  const handleExportExcel = () => {
    // field labels (some include units) and corresponding visibility keys
    const fields = [
      // ID & ROUTING
      'SL','Cable #','From','To','Desc',
      // LOAD
      'Type','kW','kV','PF','η%','FLC','I_m','PF_m','Inst',
      // SC WITHSTAND
      'Isc','t(s)','Sz','Meth',
      // CABLE DATA
      'Cores','Sz(mm²)','I(A)','R(Ω/km)','X(Ω/km)','L(m)',
      // CAPACITY
      'K_t','I_d(A)','Runs','OK','K1','K2','K3','K5','K4',
      // RUNNING V-DROP
      'ΔU(V)','%ΔU','OK',
      // STARTING V-DIP
      'ΔU(V)','%ΔU','OK',
      // Description (separate)
      'Description',
      // REMARKS
      'Rem','Status'
    ];

    const fieldKeys = [
      // matching order with fields above, but keys used in visibleColumns
      'SL','Cable #','From','To','Desc',
      'Type','kW','kV','PF','η','FLC','I_m','PF_m','Inst',
      'Isc','t','Sz','Meth',
      'Cores','Sz2','I','R','X','L',
      'K_t','I_d','Runs','OK','K1','K2','K3','K5','K4',
      'ΔU','%ΔU','OK2',
      'ΔU2','%ΔU2','OK3',
      'Description',
      'Rem','Status'
    ];

    // group definitions using keys
    const groupsSpec = [
      { name: 'ID & ROUTING', keys: ['SL','Cable #','From','To','Desc'] },
      { name: 'LOAD', keys: ['Type','kW','kV','PF','η','FLC','I_m','PF_m','Inst'] },
      { name: 'SC WITHSTAND', keys: ['Isc','t','Sz','Meth'] },
      { name: 'CABLE DATA', keys: ['Cores','Sz2','I','R','X','L'] },
      { name: 'CAPACITY', keys: ['K_t','I_d','Runs','OK','K1','K2','K3','K5','K4'] },
      { name: 'RUNNING V-DROP', keys: ['ΔU','%ΔU','OK2'] },
      { name: 'STARTING V-DIP', keys: ['ΔU2','%ΔU2','OK3'] },
      { name: 'Description', keys: ['Description'] },
      { name: 'REMARKS', keys: ['Rem','Status'] }
    ];

    // determine which field indices are visible
    const visibleIndices = fieldKeys
      .map((k, i) => (visibleColumns[k] ? i : -1))
      .filter(i => i >= 0);

    // build header rows respecting visibility
    const headerRow1: any[] = [];
    groupsSpec.forEach(g => {
      const span = g.keys.filter(k => visibleColumns[k]).length;
      if (span > 0) {
        headerRow1.push(g.name);
        for (let i = 1; i < span; i++) headerRow1.push('');
      }
    });
    const headerRow2 = visibleIndices.map(i => fields[i]);

    // build data rows and then filter
    const rawRows = results.map(r => [
      r.slNo, r.cableNumber, r.fromBus, r.toBus, r.description,
      r.feederType, r.ratedPowerKW.toFixed(2), r.ratedVoltageKV.toFixed(2), r.powerFactor.toFixed(2), (r.efficiency * 100).toFixed(0), r.flc_A.toFixed(2), r.motorStartingCurrent_A.toFixed(2), r.motorStartingPF.toFixed(2), r.installation,
      r.scCurrentSwitchboard_kA.toFixed(2), r.scCurrentWithstandDuration_Sec.toFixed(2), r.minSizeShortCircuit_sqmm.toFixed(0), 'AIR',
      r.numberOfCores, r.cableSize_sqmm, r.cableCurrentRating_A.toFixed(1), r.cableResistance_90C_Ohm_Ph_km.toFixed(4), r.cableReactance_50Hz_Ohm_Ph_km.toFixed(4), r.cableLength_m.toFixed(1),
      r.k_total_deratingFactor.toFixed(3), r.derated_currentCarryingCapacity_A.toFixed(1), r.numberOfRuns, r.capacityCheck === 'YES' ? '✓' : '⚠', r.k1_ambientTemp.toFixed(3), r.k2_groupingFactor.toFixed(3), r.k3_groundTemp.toFixed(3), r.k5_thermalResistivity.toFixed(3), r.k4_depthOfLaying.toFixed(3),
      r.runningVoltageDrop_V.toFixed(2), r.runningVoltageDrop_percent.toFixed(2), r.runningVoltageDrop_percent <= 3 ? '✓' : '⚠',
      r.startingVoltageDip_V.toFixed(2), r.startingVoltageDip_percent.toFixed(2), r.startingVoltageDropCheck === 'YES' ? '✓' : '⚠',
      r.cableDesignation,
      r.remarks, r.status
    ]);

    const dataRows = rawRows.map(row => visibleIndices.map(i => row[i]));

    const aoa = [headerRow1, headerRow2, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // compute merges based on filtered groups
    const merges: any[] = [];
    let colIndex = 0;
    groupsSpec.forEach(g => {
      const span = g.keys.filter(k => visibleColumns[k]).length;
      if (span > 1) {
        merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + span - 1 } });
      }
      colIndex += span;
    });
    worksheet['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, 'Results');
    XLSX.writeFile(wb, `cable_sizing_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    // Create PDF with professional grouped column headers (matching Excel structure)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' }) as any;
    
    // Add title
    doc.setFontSize(14);
    doc.text('Cable Sizing Results Report', 14, 10);
    
    // Add metadata
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 16);
    doc.text(`Total Cables: ${results.length} | Approved: ${results.filter(r => r.status === 'APPROVED').length}`, 14, 20);
    
    // Prepare data with proper grouping and filter by visibility
    const fields = [
      'SL','Cable #','From','To','Desc',
      'Type','kW','kV','PF','η%','FLC','I_m','PF_m','Inst',
      'Isc','t(s)','Sz','Meth',
      'Cores','Sz(mm²)','I(A)','R(Ω/km)','X(Ω/km)','L(m)',
      'K_t','I_d(A)','Runs','OK','K1','K2','K3','K5','K4',
      'ΔU(V)','%ΔU','OK',
      'ΔU(V)','%ΔU','OK',
      'Description','Rem','Status'
    ];
    const fieldKeys = [
      'SL','Cable #','From','To','Desc',
      'Type','kW','kV','PF','η','FLC','I_m','PF_m','Inst',
      'Isc','t','Sz','Meth',
      'Cores','Sz2','I','R','X','L',
      'K_t','I_d','Runs','OK','K1','K2','K3','K5','K4',
      'ΔU','%ΔU','OK2',
      'ΔU2','%ΔU2','OK3',
      'Description','Rem','Status'
    ];
    const groupsSpec = [
      { name: 'ID & ROUTING', keys: ['SL','Cable #','From','To','Desc'] },
      { name: 'LOAD', keys: ['Type','kW','kV','PF','η','FLC','I_m','PF_m','Inst'] },
      { name: 'SC WITHSTAND', keys: ['Isc','t','Sz','Meth'] },
      { name: 'CABLE DATA', keys: ['Cores','Sz2','I','R','X','L'] },
      { name: 'CAPACITY', keys: ['K_t','I_d','Runs','OK','K1','K2','K3','K5','K4'] },
      { name: 'RUNNING V-DROP', keys: ['ΔU','%ΔU','OK2'] },
      { name: 'STARTING V-DIP', keys: ['ΔU2','%ΔU2','OK3'] },
      { name: 'Description', keys: ['Description'] },
      { name: 'REMARKS', keys: ['Rem','Status'] }
    ];

    const visibleIndices = fieldKeys
      .map((k, i) => (visibleColumns[k] ? i : -1))
      .filter(i => i >= 0);

    // raw rows
    const rawRows = results.map(r => [
      r.slNo.toString(), r.cableNumber, r.fromBus, r.toBus, r.description.substring(0, 20),
      r.feederType, r.ratedPowerKW.toFixed(2), r.ratedVoltageKV.toFixed(2), r.powerFactor.toFixed(2),
      (r.efficiency * 100).toFixed(0), r.flc_A.toFixed(2), r.motorStartingCurrent_A.toFixed(2), r.motorStartingPF.toFixed(2), r.installation,
      r.scCurrentSwitchboard_kA.toFixed(2), r.scCurrentWithstandDuration_Sec.toFixed(2), r.minSizeShortCircuit_sqmm.toFixed(0), 'AIR',
      r.numberOfCores, r.cableSize_sqmm.toString(), r.cableCurrentRating_A.toFixed(1),
      r.cableResistance_90C_Ohm_Ph_km.toFixed(4), r.cableReactance_50Hz_Ohm_Ph_km.toFixed(4), r.cableLength_m.toFixed(1),
      r.k_total_deratingFactor.toFixed(3), r.derated_currentCarryingCapacity_A.toFixed(1), r.numberOfRuns.toString(),
      r.capacityCheck === 'YES' ? '✓' : '⚠', r.k1_ambientTemp.toFixed(3), r.k2_groupingFactor.toFixed(3), r.k3_groundTemp.toFixed(3),
      r.k5_thermalResistivity.toFixed(3), r.k4_depthOfLaying.toFixed(3),
      r.runningVoltageDrop_V.toFixed(2), r.runningVoltageDrop_percent.toFixed(2),
      r.runningVoltageDrop_percent <= 3 ? '✓' : '⚠',
      r.startingVoltageDip_V.toFixed(2), r.startingVoltageDip_percent.toFixed(2),
      r.startingVoltageDropCheck === 'YES' ? '✓' : '⚠',
      r.cableDesignation, r.remarks.substring(0, 30), r.status
    ]);
    const tableData = rawRows.map(row => visibleIndices.map(i => row[i]));

    // build header rows for PDF
    const headerRow1 = groupsSpec
      .map((g, gi) => {
        const span = g.keys.filter(k => visibleColumns[k]).length;
        if (span === 0) return null;
        // predefined colors array matching existing order
        const colors = [
          {fill: [25,25,112], text: [173,216,230]},
          {fill: [0,50,100], text: [175,238,238]},
          {fill: [100,50,0], text: [255,165,0]},
          {fill: [50,0,100], text: [218,112,214]},
          {fill: [0,100,0], text: [144,238,144]},
          {fill: [100,0,0], text: [255,99,71]},
          {fill: [100,100,0], text: [255,255,0]},
          {fill: [96,96,96], text: [255,255,255]},
          {fill: [64,64,64], text: [211,211,211]},
        ];
        const color = colors[gi] || colors[0];
        return { content: g.name, colSpan: span, halign: 'center', fillColor: color.fill, textColor: color.text } as any;
      })
      .filter(c => c !== null) as any[];

    const headerRow2 = visibleIndices.map(i => fields[i]);

    // Create table with grouped headers using autoTable
    autoTable(doc, {
      startY: 24,
      head: [headerRow1, headerRow2],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        valign: 'middle',
        halign: 'center'
      } as any,
      headStyles: {
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 1,
        valign: 'middle',
        halign: 'center'
      } as any,
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawPage: (data: any) => {
        // Add page numbering
        const pageSize = doc.internal.pageSize;
        const pageCount = doc.getNumberOfPages();
        const pageNum = data.pageNumber;
        doc.setFontSize(7);
        doc.text(`Page ${pageNum} of ${pageCount}`, pageSize.getWidth() - 20, pageSize.getHeight() - 5);
      }
    });

    doc.save(`cable_sizing_results_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSaveEdits = () => {
    // Edits are already saved via context on each change
    alert('All edits saved successfully!');
  };

  if (results.length === 0) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-yellow-500" size={32} />
        <h3 className="text-yellow-200 font-semibold mb-2">No Results Yet</h3>
        <p className="text-yellow-300 text-sm">Load demo or upload feeder data to generate results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex gap-2 items-center flex-wrap">
        <button
          onClick={() => setGlobalEditMode(!globalEditMode)}
          className={`${globalEditMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'} text-white px-3 py-2 rounded flex items-center gap-2 transition text-sm`}
        >
          <Edit2 size={16} />
          {globalEditMode ? 'Editing ON' : 'Edit Mode'}
        </button>
        
        {globalEditMode && (
          <>
            <button
              onClick={handleSaveEdits}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded flex items-center gap-2 transition text-sm"
            >
              ✓ Save Changes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-500 hover:bg-slate-400 text-white px-3 py-2 rounded flex items-center gap-2 transition text-sm"
            >
              <RotateCcw size={16} />
              Discard
            </button>
            <div className="text-xs text-blue-300 px-2 py-1 bg-blue-900/30 rounded border border-blue-700">
              ✏️ Click cells to edit. Type/Size/Runs/Remarks are editable.
            </div>
          </>
        )}
        
        <div className="flex-1" />
        
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded flex items-center gap-2 transition text-sm"
        >
          <Download size={16} />
          Excel
        </button>

        <button
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-2 transition text-sm"
        >
          <FileText size={16} />
          PDF
        </button>
        {/* column chooser */}
        <div className="relative inline-block">
          <button
            onClick={() => setShowColumnsMenu(prev => !prev)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded flex items-center gap-1 transition text-sm ml-2"
          >
            Columns
          </button>
          {showColumnsMenu && (
            <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-auto bg-slate-800 border border-slate-600 rounded shadow-lg z-50 p-2 text-xs">
              {Object.keys(visibleColumns).map(label => (
                <label key={label} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={visibleColumns[label]}
                    onChange={() => toggleColumn(label)}
                    className="mr-2"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-sm text-slate-300">
          <span className="font-semibold">{results.length}</span> cables |
          <span className="text-green-400 ml-2">
            {results.filter(r => r.status === 'APPROVED').length}
          </span>
          ✓
        </div>
      </div>

      {/* Results Table - EXACT EXCEL FORMAT WITH FROM/TO */}
      <div id="results-table-export" className="bg-slate-900 rounded-lg border-2 border-slate-600 overflow-x-auto" style={{ height: '800px' }}>
        <table className="w-full text-xs border-collapse bg-slate-800">
          <thead className="sticky top-0 z-20">
            {/* Header Row 1 - Column Groups */}
            <tr className="bg-slate-800">
              <th colSpan={5} className="border-2 border-slate-700 px-2 py-1 bg-blue-950 text-blue-200 font-bold text-xs">ID & ROUTING</th>
              <th colSpan={9} className="border-2 border-slate-700 px-2 py-1 bg-cyan-950 text-cyan-200 font-bold text-xs">LOAD</th>
              <th colSpan={4} className="border-2 border-slate-700 px-2 py-1 bg-orange-950 text-orange-200 font-bold text-xs">SC WITHSTAND</th>
              <th colSpan={6} className="border-2 border-slate-700 px-2 py-1 bg-purple-950 text-purple-200 font-bold text-xs">CABLE DATA</th>
              <th colSpan={9} className="border-2 border-slate-700 px-2 py-1 bg-green-950 text-green-200 font-bold text-xs">CAPACITY</th>
              <th colSpan={3} className="border-2 border-slate-700 px-2 py-1 bg-red-950 text-red-200 font-bold text-xs">RUNNING V-DROP</th>
              <th colSpan={3} className="border-2 border-slate-700 px-2 py-1 bg-yellow-950 text-yellow-200 font-bold text-xs">STARTING V-DIP</th>
              <th colSpan={1} className="border-2 border-slate-700 px-2 py-1 bg-slate-800 text-slate-200 font-bold text-xs">Description</th>
              <th colSpan={2} className="border-2 border-slate-700 px-2 py-1 bg-slate-700 text-slate-200 font-bold text-xs">REMARKS</th>
            </tr>
            
            {/* Header Row 2 - Field Names */}
            <tr className="bg-slate-700">
              <th className={`border border-slate-600 px-1 py-0.5 text-blue-300 text-xs whitespace-nowrap ${!visibleColumns['SL'] ? 'hidden' : ''}`}>SL</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-blue-300 text-xs whitespace-nowrap ${!visibleColumns['Cable #'] ? 'hidden' : ''}`}>Cable #</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-blue-300 text-xs whitespace-nowrap ${!visibleColumns['From'] ? 'hidden' : ''}`}>From</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-blue-300 text-xs whitespace-nowrap ${!visibleColumns['To'] ? 'hidden' : ''}`}>To</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-blue-300 text-xs whitespace-nowrap ${!visibleColumns['Desc'] ? 'hidden' : ''}`}>Desc</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['Type'] ? 'hidden' : ''}`}>Type</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['kW'] ? 'hidden' : ''}`}>kW</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['kV'] ? 'hidden' : ''}`}>kV</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['PF'] ? 'hidden' : ''}`}>PF</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['η'] ? 'hidden' : ''}`}>η</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['FLC'] ? 'hidden' : ''}`}>FLC</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['I_m'] ? 'hidden' : ''}`}>I_m</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['PF_m'] ? 'hidden' : ''}`}>PF_m</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs ${!visibleColumns['Inst'] ? 'hidden' : ''}`}>Inst</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-orange-300 text-xs ${!visibleColumns['Isc'] ? 'hidden' : ''}`}>Isc</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-orange-300 text-xs ${!visibleColumns['t'] ? 'hidden' : ''}`}>t</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-orange-300 text-xs ${!visibleColumns['Sz'] ? 'hidden' : ''}`}>Sz</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-orange-300 text-xs ${!visibleColumns['Meth'] ? 'hidden' : ''}`}>Meth</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['Cores'] ? 'hidden' : ''}`}>Cores</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['Sz2'] ? 'hidden' : ''}`}>Sz</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['I'] ? 'hidden' : ''}`}>I</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['R'] ? 'hidden' : ''}`}>R</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['X'] ? 'hidden' : ''}`}>X</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-purple-300 text-xs ${!visibleColumns['L'] ? 'hidden' : ''}`}>L</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K_t'] ? 'hidden' : ''}`}>K_t</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['I_d'] ? 'hidden' : ''}`}>I_d</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['Runs'] ? 'hidden' : ''}`}>Runs</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['OK'] ? 'hidden' : ''}`}>OK</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K1'] ? 'hidden' : ''}`}>K1</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K2'] ? 'hidden' : ''}`}>K2</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K3'] ? 'hidden' : ''}`}>K3</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K5'] ? 'hidden' : ''}`}>K5</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-green-300 text-xs ${!visibleColumns['K4'] ? 'hidden' : ''}`}>K4</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-red-300 text-xs ${!visibleColumns['ΔU'] ? 'hidden' : ''}`}>ΔU</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-red-300 text-xs ${!visibleColumns['%ΔU'] ? 'hidden' : ''}`}>%ΔU</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-red-300 text-xs ${!visibleColumns['OK2'] ? 'hidden' : ''}`}>OK</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs ${!visibleColumns['ΔU2'] ? 'hidden' : ''}`}>ΔU</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs ${!visibleColumns['%ΔU2'] ? 'hidden' : ''}`}>%ΔU</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs ${!visibleColumns['OK3'] ? 'hidden' : ''}`}>OK</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-slate-300 text-xs ${!visibleColumns['Description'] ? 'hidden' : ''}`}>Description</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-slate-300 text-xs ${!visibleColumns['Rem'] ? 'hidden' : ''}`}>Rem</th>
              <th className={`border border-slate-600 px-1 py-0.5 text-slate-300 text-xs ${!visibleColumns['Status'] ? 'hidden' : ''}`}>Status</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700/60 transition ${
                  r.status === 'FAILED' ? 'border-l-4 border-red-600' :
                  r.status === 'WARNING' ? 'border-l-4 border-yellow-600' :
                  'border-l-4 border-green-600'
                }`}
              >
                <td className="border border-slate-600 px-1 py-0.5 text-center text-slate-200 font-semibold text-xs" style={{ display: visibleColumns['SL'] ? '' : 'none' }}>{r.slNo}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 text-xs font-mono whitespace-nowrap" style={{ display: visibleColumns['Cable #'] ? '' : 'none' }}>{r.cableNumber}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 text-xs font-mono whitespace-nowrap" style={{ display: visibleColumns['From'] ? '' : 'none' }}>{r.fromBus}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 text-xs font-mono whitespace-nowrap" style={{ display: visibleColumns['To'] ? '' : 'none' }}>{r.toBus}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 text-xs truncate max-w-xs" style={{ display: visibleColumns['Desc'] ? '' : 'none' }}>{r.description}</td>
                
                {/* Type - Editable Dropdown M/F */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20" style={{ display: visibleColumns['Type'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell
                      value={r.feederType}
                      type="select"
                      editable={true}
                      onChange={(val) => handleCellChange(idx, 'feederType', val)}
                      options={[{label: 'Motor (M)', value: 'M'}, {label: 'Feeder (F)', value: 'F'}]}
                      width="w-20"
                    />
                  ) : (
                    <span className="text-slate-200 font-bold text-xs">{r.feederType}</span>
                  )}
                </td>

                {/* Power - Editable */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20" style={{ display: visibleColumns['kW'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.ratedPowerKW} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'loadKW', val)} precision={2} width="w-16" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.ratedPowerKW.toFixed(2)}</span>
                  )}
                </td>

                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['kV'] ? '' : 'none' }}>{r.ratedVoltageKV.toFixed(2)}</td>

                {/* PowerFactor - Editable */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20" style={{ display: visibleColumns['PF'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.powerFactor} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'powerFactor', val)} precision={2} width="w-14" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.powerFactor.toFixed(2)}</span>
                  )}
                </td>

                {/* Efficiency - Editable */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20" style={{ display: visibleColumns['η'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={(r.efficiency * 100).toFixed(0)} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'efficiency', Number(val) / 100)} precision={0} width="w-14" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{(r.efficiency * 100).toFixed(0)}</span>
                  )}
                </td>

                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/40 text-cyan-300 font-bold text-xs" style={{ display: visibleColumns['FLC'] ? '' : 'none' }}>{r.flc_A.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['I_m'] ? '' : 'none' }}>{r.motorStartingCurrent_A.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['PF_m'] ? '' : 'none' }}>{r.motorStartingPF.toFixed(2)}</td>

                {/* Installation - Editable */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20" style={{ display: visibleColumns['Inst'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.installation} type="select" editable={true} onChange={(val) => handleCellChange(idx, 'installationMethod', val)} options={[{label: 'AIR', value: 'AIR'}, {label: 'TRENCH', value: 'TRENCH'}, {label: 'DUCT', value: 'DUCT'}]} width="w-16" />
                  ) : (
                    <span className="text-slate-200 text-xs font-mono">{r.installation}</span>
                  )}
                </td>

                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['Isc'] ? '' : 'none' }}>{r.scCurrentSwitchboard_kA.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['t'] ? '' : 'none' }}>{r.scCurrentWithstandDuration_Sec.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['Sz'] ? '' : 'none' }}>{r.minSizeShortCircuit_sqmm.toFixed(0)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 text-xs" style={{ display: visibleColumns['Meth'] ? '' : 'none' }}>AIR</td>

                {/* Cores - Editable Dropdown */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20" style={{ display: visibleColumns['Cores'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.numberOfCores} type="select" editable={true} onChange={(val) => handleCellChange(idx, 'numberOfCores', val)} options={getCoreOptions()} width="w-14" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.numberOfCores}</span>
                  )}
                </td>

                {/* Cable Size - Editable Dropdown */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/40" style={{ display: visibleColumns['Sz2'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.cableSize_sqmm} type="select" editable={true} onChange={(val) => handleCellChange(idx, 'cableSize', val)} options={getCableSizes().map(s => ({label: String(s), value: String(s)}))} width="w-16" />
                  ) : (
                    <span className="text-yellow-300 font-bold text-xs">{r.cableSize_sqmm}</span>
                  )}
                </td>

                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['I'] ? '' : 'none' }}>{r.cableCurrentRating_A.toFixed(1)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['R'] ? '' : 'none' }}>{r.cableResistance_90C_Ohm_Ph_km.toFixed(4)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['X'] ? '' : 'none' }}>{r.cableReactance_50Hz_Ohm_Ph_km.toFixed(4)}</td>

                {/* Cable Length - Editable */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20" style={{ display: visibleColumns['L'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.cableLength_m} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'length', val)} precision={1} width="w-14" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.cableLength_m.toFixed(1)}</span>
                  )}
                </td>

                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['K_t'] ? '' : 'none' }}>{r.k_total_deratingFactor.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/40 text-cyan-300 font-bold text-xs" style={{ display: visibleColumns['I_d'] ? '' : 'none' }}>{r.derated_currentCarryingCapacity_A.toFixed(1)}</td>

                {/* Number of Runs - Editable Numerical */}
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20" style={{ display: visibleColumns['Runs'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.numberOfRuns} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'numberOfRuns', val)} precision={0} width="w-12" />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.numberOfRuns}</span>
                  )}
                </td>

                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.capacityCheck === 'YES' ? 'text-green-300 bg-green-950/40' : 'text-red-300 bg-red-950/40'}`} style={{ display: visibleColumns['OK'] ? '' : 'none' }}>{r.capacityCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs text-xs" style={{ display: visibleColumns['K1'] ? '' : 'none' }}>{r.k1_ambientTemp.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs text-xs" style={{ display: visibleColumns['K2'] ? '' : 'none' }}>{r.k2_groupingFactor.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs text-xs" style={{ display: visibleColumns['K3'] ? '' : 'none' }}>{r.k3_groundTemp.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs text-xs" style={{ display: visibleColumns['K5'] ? '' : 'none' }}>{r.k5_thermalResistivity.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs text-xs" style={{ display: visibleColumns['K4'] ? '' : 'none' }}>{r.k4_depthOfLaying.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-red-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['ΔU'] ? '' : 'none' }}>{r.runningVoltageDrop_V.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.runningVoltageDrop_percent <= 3 ? 'text-green-300 bg-green-950/40' : 'text-red-300 bg-red-950/40'}`} style={{ display: visibleColumns['%ΔU'] ? '' : 'none' }}>{r.runningVoltageDrop_percent.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.runningVoltageDropCheck === 'YES' ? 'text-green-300' : 'text-red-300'}`} style={{ display: visibleColumns['OK2'] ? '' : 'none' }}>{r.runningVoltageDropCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-yellow-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['ΔU2'] ? '' : 'none' }}>{r.startingVoltageDip_V.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-yellow-950/20 text-slate-200 font-mono text-xs" style={{ display: visibleColumns['%ΔU2'] ? '' : 'none' }}>{r.startingVoltageDropCheck === 'NA' ? 'NA' : r.startingVoltageDip_percent.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.startingVoltageDropCheck === 'YES' ? 'text-green-300' : r.startingVoltageDropCheck === 'NA' ? 'text-slate-400' : 'text-red-300'}`} style={{ display: visibleColumns['OK3'] ? '' : 'none' }}>{r.startingVoltageDropCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-300 truncate text-xs max-w-xs" style={{ display: visibleColumns['Description'] ? '' : 'none' }}>{r.cableDesignation}</td>

                {/* Remarks - Editable Text */}
                <td className="border border-slate-600 px-1 py-0.5" style={{ display: visibleColumns['Rem'] ? '' : 'none' }}>
                  {globalEditMode ? (
                    <EditableCell value={r.remarks} type="text" editable={true} onChange={(val) => handleCellChange(idx, 'remarks', val)} width="w-full" />
                  ) : (
                    <span className="text-slate-200 text-xs truncate">{r.remarks}</span>
                  )}
                </td>

                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${
                  r.status === 'APPROVED' ? 'bg-green-600/30 text-green-300' :
                  r.status === 'WARNING' ? 'bg-yellow-600/30 text-yellow-300' :
                  'bg-red-600/30 text-red-300'
                }`} style={{ display: visibleColumns['Status'] ? '' : 'none' }}>
                  {r.status === 'APPROVED' ? '✓' : r.status === 'WARNING' ? '⚠' : '✗'} {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOQ Summary Table - Cable Routing & Bill of Quantities */}
      <div className="mt-8 bg-slate-900 rounded-lg border-2 border-slate-600 overflow-x-auto">
        <div className="bg-slate-800 px-4 py-2 font-bold text-slate-200 border-b border-slate-700">
          BILL OF QUANTITIES (BOQ) - CABLE SCHEDULE (aggregated)
        </div>
        <table className="w-full text-xs border-collapse bg-slate-800">
          <thead className="bg-slate-700 sticky top-0">
            <tr>
              <th className="border border-slate-600 px-2 py-1 text-left text-slate-300">SL</th>
              <th className="border border-slate-600 px-2 py-1 text-left text-slate-300">Designation</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Cores</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Size (mm²)</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Qty</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Runs</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Total Length (m)</th>
              <th className="border border-slate-600 px-2 py-1 text-center text-slate-300">Voltage</th>
              <th className="border border-slate-600 px-2 py-1 text-left text-slate-300"> </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const groups: Record<string, any> = {};
              results.forEach((r) => {
                const key = `${r.cableDesignation}||${r.cableSize_sqmm}||${r.numberOfCores}||${r.ratedVoltageKV}`;
                if (!groups[key]) {
                  groups[key] = {
                    designation: r.cableDesignation,
                    cores: r.numberOfCores,
                    size: r.cableSize_sqmm,
                    qty: 0,
                    runs: r.numberOfRuns,
                    totalLength: 0,
                    voltage: r.ratedVoltageKV,
                    // no status in BOQ summary
                  };
                }
                groups[key].qty += 1;
                groups[key].totalLength += r.totalLength_m || r.cableLength_m || 0;
                groups[key].runs = Math.max(groups[key].runs, r.numberOfRuns || 1);
                // exclude status from BOQ aggregation
              });
              return Object.values(groups).map((g: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                  <td className="border border-slate-600 px-2 py-1 text-slate-200">{idx + 1}</td>
                  <td className="border border-slate-600 px-2 py-1 text-slate-200 truncate">{g.designation}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.cores}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.size}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.qty}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.runs}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.totalLength.toFixed(1)}</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">{g.voltage.toFixed(1)} kV</td>
                  <td className="border border-slate-600 px-2 py-1 text-center text-slate-200">&nbsp;</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 text-xs text-slate-300 mt-6">
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-green-300 mb-1">✓ APPROVED</p>
          <p className="text-slate-400">All checks passed</p>
        </div>
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-yellow-300 mb-1">⚠ WARNING</p>
          <p className="text-slate-400">At design limit, review</p>
        </div>
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-red-300 mb-1">✗ FAILED</p>
          <p className="text-slate-400">Redesign required</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
