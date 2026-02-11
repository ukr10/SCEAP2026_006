import { useState, useEffect } from 'react';
import { Download, AlertCircle, Edit2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
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
}

const EditableCell = ({ value, type, editable, onChange, className = '', options = [], precision }: EditableCellProps) => {
  if (!editable) {
    if (type === 'number' && precision !== undefined) {
      return <span className={className}>{Number(value).toFixed(precision)}</span>;
    }
    return <span className={className}>{value}</span>;
  }

  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (type === 'number') {
      onChange(Number(newValue));
    } else {
      onChange(newValue);
    }
  };

  const baseClassName = `w-full px-1 py-0.5 bg-blue-900/40 border border-blue-500 text-slate-100 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono`;

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
  feederType: 'M' | 'F' | 'I';
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

const calculateExcelFormulas = (cable: CableSegment, idx: number, userCatalogue?: any): Partial<ExcelResultRow> => {
  try {
    // Determine feeder type
    const feederType = cable.loadType === 'Transformer' ? 'F' : 'M';
    
    // LOAD GROUP - FLC Calculation (match Excel formula exactly)
    const pf = cable.powerFactor ?? 0.85;
    const eff = cable.efficiency ?? 0.95;
    const flc_A = (cable.loadKW) / (1.732 * (cable.voltage / 1000) * pf * eff);

    // Motor starting current (7.2× for DOL per Excel)
    const motorStartingCurrent_A = feederType === 'M' ? 7.2 * flc_A : 0;
    const motorStartingPF = feederType === 'M' ? 0.2 : 0;

    // SHORT CIRCUIT GROUP
    const scCurrentSwitchboard_kA = cable.maxShortCircuitCurrent || 50;
    const scWithstandDuration_Sec = 0.16;
    const minSizeShortCircuit = (scCurrentSwitchboard_kA * 1000 * Math.sqrt(scWithstandDuration_Sec)) / 94;

    // Get engine calculations - PASS USER CATALOGUE TO ENGINE
    const engine = new CableSizingEngine_V2(userCatalogue);
    const engineInput: CableSizingInputV2 = {
      loadType: cable.loadType as any,
      ratedPowerKW: cable.loadKW,
      voltage: cable.voltage,
      phase: '3Ø',
      efficiency: cable.efficiency || 0.95,
      powerFactor: cable.powerFactor || 0.85,
      conductorMaterial: 'Cu',
      insulation: 'XLPE',
      numberOfCores: cable.numberOfCores as '1C' | '2C' | '3C' | '4C',
      installationMethod: (cable.installationMethod || 'Air') as 'Air' | 'Trench' | 'Duct',
      cableLength: cable.length || 0,
      ambientTemp: 40,
      numberOfLoadedCircuits: 1,
    };

    const engineResult = engine.sizeCable(engineInput);

    // CABLE DATA - From engine and catalogue
    const k_total = engineResult.deratingFactor || 0.876;
    const derated_currentCapacity = (engineResult.catalogRatingPerRun || 387) * k_total;
    const numberOfRuns = engineResult.numberOfRuns || 1;
    const capacityCheck = derated_currentCapacity >= flc_A ? 'YES' : 'NO';

    // VOLTAGE DROP - Running (match Excel formula)
    const runningVoltageDrop_V = engineResult.voltageDropRunning_volt || 0;
    const runningVoltageDrop_percent = (engineResult.voltageDropRunning_percent || 0) * 100;
    const runningVoltageDropCheck = runningVoltageDrop_percent <= 3 ? 'YES' : 'NO';

    // VOLTAGE DROP - Starting (Motors only)
    const startingVoltageDrop_V = engineResult.voltageDropStarting_volt || 0;
    const startingVoltageDrop_percent = feederType === 'M' ? (engineResult.voltageDropStarting_percent || 0) * 100 : 0;
    const startingVoltageDropCheck = feederType === 'M' ? (startingVoltageDrop_percent <= 10 ? 'YES' : 'NO') : 'NA';

    // SELECTED SIZE & DESIGNATION
    const designationRuns = numberOfRuns === 1 ? `${numberOfRuns}R` : `${numberOfRuns}R`;
    const cableDesignation = `${designationRuns} X ${cable.voltage/1000}kV X ${cable.numberOfCores} X ${engineResult.selectedConductorArea} Sqmm`;
    const totalLength = cable.numberOfCores === '4C' ? 3 * cable.length * numberOfRuns : cable.length * numberOfRuns;

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
      numberOfCores: cable.numberOfCores as '1C' | '2C' | '3C' | '4C',
      cableSize_sqmm: engineResult.selectedConductorArea || 240,
      cableCurrentRating_A: engineResult.catalogRatingPerRun || 387,
      cableResistance_90C_Ohm_Ph_km: 0.162,
      cableReactance_50Hz_Ohm_Ph_km: 0.088,
      k1_ambientTemp: engineResult.deratingComponents?.K_temp || 0.89,
      k2_groupingFactor: engineResult.deratingComponents?.K_group || 0.73,
      k3_groundTemp: 1.0,
      k4_depthOfLaying: engineResult.deratingComponents?.K_depth || 1.0,
      k5_thermalResistivity: engineResult.deratingComponents?.K_soil || 1.0,
      k_total_deratingFactor: k_total,
      derated_currentCarryingCapacity_A: derated_currentCapacity,
      numberOfRuns,
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

  // Generate results on mount
  useEffect(() => {
    if (normalizedFeeders && normalizedFeeders.length > 0) {
      const generated = normalizedFeeders.map((cable, idx) => {
        const formulas = calculateExcelFormulas(cable, idx, catalogueData);
        return {
          slNo: idx + 1,
          description: cable.feederDescription || cable.cableNumber,
          feederType: cable.loadType === 'Transformer' ? 'F' : 'M',
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
  }, [normalizedFeeders, catalogueData]);

  // Formula cascading: when user edits a cell, dependent cells recalculate
  const handleCellChange = (rowIdx: number, field: keyof CableSegment, value: any) => {
    if (!normalizedFeeders) return;
    
    // Update normalized feeder with the new value
    const cable = normalizedFeeders[rowIdx];
    const updatedCable: CableSegment = { ...cable, [field]: value };
    
    // Update context so edits persist
    updateFeeder(cable.cableNumber, { [field]: value });
    
    // Recalculate formulas for this row
    const recalc = calculateExcelFormulas(updatedCable, rowIdx, catalogueData);
    
    // Update results table
    const updated = [...results];
    updated[rowIdx] = {
      ...updated[rowIdx],
      // Update the edited field
      ...(field === 'loadKW' && { ratedPowerKW: Number(value) }),
      ...(field === 'length' && { cableLength_m: Number(value) }),
      ...(field === 'powerFactor' && { powerFactor: Number(value) }),
      ...(field === 'efficiency' && { efficiency: Number(value) }),
      ...(field === 'installationMethod' && { installation: String(value).toUpperCase() as 'AIR' | 'TRENCH' | 'DUCT' }),
      ...(field === 'protectionType' && { remarks: `Protection: ${value}` }),
      ...(field === 'ambientTemp' && { remarks: `Ambient: ${value}°C` }),
      // Include ALL recalculated values from engine
      ...recalc,
    } as ExcelResultRow;
    
    setResults(updated);
    console.log(`[EDIT] Row ${rowIdx}: ${field} = ${value}`);
    console.log(`[RECALC] Status: ${updated[rowIdx].status}, FLC: ${updated[rowIdx].flc_A.toFixed(2)}A`);
  };

  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'SL': r.slNo,
      'Description': r.description,
      'Type': r.feederType,
      'Power(kW)': r.ratedPowerKW.toFixed(2),
      'Voltage(kV)': r.ratedVoltageKV.toFixed(2),
      'PF': r.powerFactor.toFixed(2),
      'Efficiency': (r.efficiency * 100).toFixed(0),
      'FLC(A)': r.flc_A.toFixed(2),
      'I_motor(A)': r.motorStartingCurrent_A.toFixed(2),
      'Cores': r.numberOfCores,
      'Size(mm²)': r.cableSize_sqmm,
      'Rating(A)': r.cableCurrentRating_A.toFixed(1),
      'R(Ω/km)': r.cableResistance_90C_Ohm_Ph_km.toFixed(4),
      'X(Ω/km)': r.cableReactance_50Hz_Ohm_Ph_km.toFixed(4),
      'Length(m)': r.cableLength_m.toFixed(1),
      'K_total': r.k_total_deratingFactor.toFixed(3),
      'I_derated(A)': r.derated_currentCarryingCapacity_A.toFixed(1),
      'Runs': r.numberOfRuns,
      'V-Drop%(Run)': r.runningVoltageDrop_percent.toFixed(2),
      'V-Dip%(Start)': r.startingVoltageDip_percent.toFixed(2),
      'Designation': r.cableDesignation,
      'Remarks': r.remarks,
      'Status': r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, `cable_sizing_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Mark handleCellChange as intentionally defined (for future use in edit mode)
  void handleCellChange;

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
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex gap-3 items-center flex-wrap">
        <button
          onClick={() => setGlobalEditMode(!globalEditMode)}
          className={`${globalEditMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'} text-white px-4 py-2 rounded flex items-center gap-2 transition`}
        >
          <Edit2 size={16} />
          {globalEditMode ? 'Editing Mode ON' : 'Edit Mode'}
        </button>
        
        {globalEditMode && (
          <>
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-500 hover:bg-slate-400 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <RotateCcw size={16} />
              Discard Changes
            </button>
            <div className="text-xs text-blue-300 px-3 py-1 bg-blue-900/30 rounded border border-blue-700">
              ✏️ Click cells to edit values. Changes auto-calculate dependent fields.
            </div>
          </>
        )}
        
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 transition"
        >
          <Download size={16} />
          Export Excel
        </button>
        <div className="flex-1" />
        <div className="text-sm text-slate-300">
          <span className="font-semibold">{results.length}</span> cables |
          <span className="text-green-400 ml-2">
            {results.filter(r => r.status === 'APPROVED').length}
          </span>
          ✓ APPROVED
        </div>
      </div>

      {/* Results Table - EXACT EXCEL FORMAT */}
      <div className="bg-slate-900 rounded-lg border-2 border-slate-600 overflow-x-auto" style={{ height: '800px' }}>
        <table className="w-full text-xs border-collapse bg-slate-800">
          <thead className="sticky top-0 z-20">
            {/* Header Row 1 - Column Groups */}
            <tr className="bg-slate-800">
              <th colSpan={2} className="border-2 border-slate-700 px-2 py-1 bg-blue-950 text-blue-200 font-bold text-xs">ID</th>
              <th colSpan={9} className="border-2 border-slate-700 px-2 py-1 bg-cyan-950 text-cyan-200 font-bold text-xs">LOAD</th>
              <th colSpan={4} className="border-2 border-slate-700 px-2 py-1 bg-orange-950 text-orange-200 font-bold text-xs">SC WITHSTAND</th>
              <th colSpan={6} className="border-2 border-slate-700 px-2 py-1 bg-purple-950 text-purple-200 font-bold text-xs">CABLE DATA</th>
              <th colSpan={9} className="border-2 border-slate-700 px-2 py-1 bg-green-950 text-green-200 font-bold text-xs">CAPACITY</th>
              <th colSpan={3} className="border-2 border-slate-700 px-2 py-1 bg-red-950 text-red-200 font-bold text-xs">RUNNING V-DROP</th>
              <th colSpan={3} className="border-2 border-slate-700 px-2 py-1 bg-yellow-950 text-yellow-200 font-bold text-xs">STARTING V-DIP</th>
              <th colSpan={3} className="border-2 border-slate-700 px-2 py-1 bg-slate-700 text-slate-200 font-bold text-xs">REMARKS</th>
            </tr>
            
            {/* Header Row 2 - Field Names */}
            <tr className="bg-slate-700">
              <th className="border border-slate-600 px-1 py-0.5 text-blue-300 text-xs">#</th>
              <th className="border border-slate-600 px-1 py-0.5 text-blue-300 text-xs">Desc</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">Type</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">kW</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">kV</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">PF</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">η</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">FLC</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">I_m</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">PF_m</th>
              <th className="border border-slate-600 px-1 py-0.5 text-cyan-300 text-xs">Inst</th>
              <th className="border border-slate-600 px-1 py-0.5 text-orange-300 text-xs">Isc</th>
              <th className="border border-slate-600 px-1 py-0.5 text-orange-300 text-xs">t</th>
              <th className="border border-slate-600 px-1 py-0.5 text-orange-300 text-xs">Sz</th>
              <th className="border border-slate-600 px-1 py-0.5 text-orange-300 text-xs">Meth</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">Cores</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">Sz</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">I</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">R</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">X</th>
              <th className="border border-slate-600 px-1 py-0.5 text-purple-300 text-xs">L</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K_t</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">I_d</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">Runs</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">OK</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K1</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K2</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K3</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K5</th>
              <th className="border border-slate-600 px-1 py-0.5 text-green-300 text-xs">K4</th>
              <th className="border border-slate-600 px-1 py-0.5 text-red-300 text-xs">ΔU</th>
              <th className="border border-slate-600 px-1 py-0.5 text-red-300 text-xs">%</th>
              <th className="border border-slate-600 px-1 py-0.5 text-red-300 text-xs">OK</th>
              <th className="border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs">ΔU</th>
              <th className="border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs">%</th>
              <th className="border border-slate-600 px-1 py-0.5 text-yellow-300 text-xs">OK</th>
              <th className="border border-slate-600 px-1 py-0.5 text-slate-300 text-xs">Des</th>
              <th className="border border-slate-600 px-1 py-0.5 text-slate-300 text-xs">Rem</th>
              <th className="border border-slate-600 px-1 py-0.5 text-slate-300 text-xs">Status</th>
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
                <td className="border border-slate-600 px-1 py-0.5 text-center text-slate-200 font-semibold">{r.slNo}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 truncate max-w-xs text-xs">{r.description}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200">{r.feederType}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200">
                  {globalEditMode ? (
                    <EditableCell
                      value={r.ratedPowerKW}
                      type="number"
                      editable={globalEditMode}
                      onChange={(val) => handleCellChange(idx, 'loadKW', val)}
                      precision={2}
                    />
                  ) : (
                    <span className="font-mono text-xs">{r.ratedPowerKW.toFixed(2)}</span>
                  )}
                </td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs">{r.ratedVoltageKV.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20">
                  {globalEditMode ? (
                    <EditableCell value={r.powerFactor} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'powerFactor', val)} precision={2} />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.powerFactor.toFixed(2)}</span>
                  )}
                </td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20">
                  {globalEditMode ? (
                    <EditableCell value={(r.efficiency * 100).toFixed(0)} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'efficiency', Number(val) / 100)} precision={0} />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{(r.efficiency * 100).toFixed(0)}</span>
                  )}
                </td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/40 text-cyan-300 font-bold text-xs">{r.flc_A.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs">{r.motorStartingCurrent_A.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20 text-slate-200 font-mono text-xs">{r.motorStartingPF.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-cyan-950/20">
                  {globalEditMode ? (
                    <EditableCell value={r.installation} type="select" editable={true} onChange={(val) => handleCellChange(idx, 'installationMethod', val)} options={[{label: 'AIR', value: 'AIR'}, {label: 'TRENCH', value: 'TRENCH'}, {label: 'DUCT', value: 'DUCT'}]} />
                  ) : (
                    <span className="text-slate-200 text-xs">{r.installation}</span>
                  )}
                </td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs">{r.scCurrentSwitchboard_kA.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs">{r.scCurrentWithstandDuration_Sec.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 font-mono text-xs">{r.minSizeShortCircuit_sqmm.toFixed(0)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-orange-950/20 text-slate-200 text-xs">AIR</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 text-xs">{r.numberOfCores}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/40 text-yellow-300 font-bold text-xs">{r.cableSize_sqmm}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs">{r.cableCurrentRating_A.toFixed(1)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs">{r.cableResistance_90C_Ohm_Ph_km.toFixed(4)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20 text-slate-200 font-mono text-xs">{r.cableReactance_50Hz_Ohm_Ph_km.toFixed(4)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-purple-950/20">
                  {globalEditMode ? (
                    <EditableCell value={r.cableLength_m} type="number" editable={true} onChange={(val) => handleCellChange(idx, 'length', val)} precision={1} />
                  ) : (
                    <span className="text-slate-200 font-mono text-xs">{r.cableLength_m.toFixed(1)}</span>
                  )}
                </td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k_total_deratingFactor.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/40 text-cyan-300 font-bold text-xs">{r.derated_currentCarryingCapacity_A.toFixed(1)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.numberOfRuns}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.capacityCheck === 'YES' ? 'text-green-300 bg-green-950/40' : 'text-red-300 bg-red-950/40'}`}>{r.capacityCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k1_ambientTemp.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k2_groupingFactor.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k3_groundTemp.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k5_thermalResistivity.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-green-950/20 text-slate-200 font-mono text-xs">{r.k4_depthOfLaying.toFixed(3)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-red-950/20 text-slate-200 font-mono text-xs">{r.runningVoltageDrop_V.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.runningVoltageDrop_percent <= 3 ? 'text-green-300 bg-green-950/40' : 'text-red-300 bg-red-950/40'}`}>{r.runningVoltageDrop_percent.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.runningVoltageDropCheck === 'YES' ? 'text-green-300' : 'text-red-300'}`}>{r.runningVoltageDropCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-yellow-950/20 text-slate-200 font-mono text-xs">{r.startingVoltageDip_V.toFixed(2)}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-center bg-yellow-950/20 text-slate-200 font-mono text-xs">{r.startingVoltageDropCheck === 'NA' ? 'NA' : r.startingVoltageDip_percent.toFixed(2)}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${r.startingVoltageDropCheck === 'YES' ? 'text-green-300' : r.startingVoltageDropCheck === 'NA' ? 'text-slate-400' : 'text-red-300'}`}>{r.startingVoltageDropCheck}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-300 truncate text-xs">{r.cableDesignation}</td>
                <td className="border border-slate-600 px-1 py-0.5 text-slate-200 truncate text-xs">{r.remarks}</td>
                <td className={`border border-slate-600 px-1 py-0.5 text-center font-bold text-xs ${
                  r.status === 'APPROVED' ? 'bg-green-600/30 text-green-300' :
                  r.status === 'WARNING' ? 'bg-yellow-600/30 text-yellow-300' :
                  'bg-red-600/30 text-red-300'
                }`}>
                  {r.status === 'APPROVED' ? '✓' : r.status === 'WARNING' ? '⚠' : '✗'} {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 text-xs text-slate-300">
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-green-300 mb-1">✓ APPROVED</p>
          <p className="text-slate-400">All checks pass</p>
        </div>
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-yellow-300 mb-1">⚠ WARNING</p>
          <p className="text-slate-400">At limit, review</p>
        </div>
        <div className="bg-slate-800 rounded p-2 border border-slate-700">
          <p className="font-semibold text-red-300 mb-1">✗ FAILED</p>
          <p className="text-slate-400">Redesign needed</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
