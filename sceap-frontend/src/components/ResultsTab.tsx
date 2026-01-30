import { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { usePathContext } from '../context/PathContext';
import { CableSegment } from '../utils/pathDiscoveryService';

interface CableSizingResult {
  serialNo: number;
  cableNumber: string;
  feederDescription: string;
  fromBus: string;
  toBus: string;
  voltage: number;
  loadKW: number;
  length: number;
  powerFactor: number;
  efficiency: number;
  deratingFactor: number;
  fullLoadCurrent: number;
  deratedCurrent: number;
  cableResistance: number;
  voltageDrop: number;
  voltageDropPercent: number;
  sizeByCurrent: number;
  sizeByVoltageDrop: number;
  sizeByShortCircuit: number;
  suitableCableSize: number;
  shortCircuitCurrent: number;
  breakerSize: string;
  status: 'valid' | 'invalid';
  // NEW FIELDS FOR PROFESSIONAL CABLE SIZING
  numberOfCores: number;
  conductorMaterial: 'Cu' | 'Al';
  numberOfRuns: number;
  cableSizeSQMM: number;
  cableDesignation: string;
  anomalies?: string[];
  isAnomaly?: boolean;
}

// Standard cable sizing table (mm² → max current capacity at 70°C)
const CABLE_AMPACITY: Record<number, number> = {
  1: 13,
  1.5: 18,
  2.5: 25,
  4: 33,
  6: 43,
  10: 61,
  16: 80,
  25: 110,
  35: 150,
  50: 190,
  70: 245,
  95: 310,
  120: 360,
  150: 415,
  185: 475,
  240: 550,
  300: 630,
};

// Simple data validation to flag suspicious inputs or results
const detectAnomalies = (
  cable: CableSegment,
  result: CableSizingResult
): string[] => {
  const issues: string[] = [];

  if (!cable.loadKW || cable.loadKW === 0) {
    issues.push('Zero load (check input Load kW)');
  }

  if (!cable.voltage || cable.voltage <= 0) {
    issues.push('Invalid system voltage');
  }

  if (!cable.length || cable.length <= 0) {
    issues.push('Zero or missing cable length');
  }

  if (!cable.deratingFactor || cable.deratingFactor <= 0) {
    issues.push('Invalid derating factor');
  }

  // if final size is unrealistically small for a loaded feeder
  if (result.cableSizeSQMM <= 2 && result.loadKW > 0) {
    issues.push('Selected conductor area too small for load');
  }

  // check voltage drop anomaly
  if (result.voltageDropPercent > 50) {
    issues.push('Very high voltage drop (>50%)');
  }

  return issues;
};

// Copper cable resistance at 70°C (Ω/km)
const CABLE_RESISTANCE: Record<number, number> = {
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
  185: 0.099,
  240: 0.0754,
  300: 0.0601,
};

/**
 * ENHANCED CABLE SIZING WITH RUNS CALCULATION
 * Implements IEC 60364 standards for professional cable designation
 * Format: Number_of_Runs X Number_of_Cores C X Cable_Size SQMM (Material)
 */
const calculateCableSizing = (cable: CableSegment): CableSizingResult => {
  const PF = 0.85; // Power factor
  const EFFICIENCY = 0.95;
  const SQRT3 = 1.732;
  const SHORT_CIRCUIT = 30000; // kA - assumed
  
  // Get number of cores and material from cable segment
  const numberOfCores = cable.numberOfCores || 4; // Default 4C for 3-phase
  const conductorMaterial = cable.conductorMaterial || 'Cu'; // Default Copper

  // 1. Calculate Full Load Current: I = (P × 1000) / (√3 × V × PF × Eff)
  const FLC = (cable.loadKW * 1000) / (SQRT3 * cable.voltage * PF * EFFICIENCY);

  // 2. Apply derating factor
  const deratedCurrent = FLC / cable.deratingFactor;

  // 3. Size by current requirement (with 1.25 safety factor)
  const requiredCurrent = deratedCurrent * 1.25;
  let sizeByCurrent = 1;
  for (const [size, capacity] of Object.entries(CABLE_AMPACITY)) {
    if (capacity >= requiredCurrent) {
      sizeByCurrent = Number(size);
      break;
    }
  }

  // 4. Calculate voltage drop
  const cableResistance = CABLE_RESISTANCE[sizeByCurrent as number] || 0.727;
  const vdrop =
    (SQRT3 * deratedCurrent * cableResistance * cable.length) / 1000;
  const vdropPercent = (vdrop / cable.voltage) * 100;

  // 5. Size by voltage drop (5% limit)
  let sizeByVoltageDrop = sizeByCurrent;
  for (const size of [25, 35, 50, 70, 95, 120, 150, 185, 240, 300]) {
    const R = CABLE_RESISTANCE[size] || 0.727;
    const vd = (SQRT3 * deratedCurrent * R * cable.length) / 1000;
    const vdp = (vd / cable.voltage) * 100;
    if (vdp <= 5) {
      sizeByVoltageDrop = size;
      break;
    }
  }

  // 6. Size by short circuit (assume worst case)
  const sizeByShortCircuit = 25; // Conservative estimate

  // 7. Select suitable size (maximum of all three methods)
  const suitableSize = Math.max(
    sizeByCurrent,
    sizeByVoltageDrop,
    sizeByShortCircuit
  );

  // ========== NEW: CALCULATE OPTIMAL NUMBER OF RUNS ==========
  // Algorithm: Find best number of runs that keeps cable size practical
  // Practical range: 16-240 SQMM (standard IEC sizes)
  
  let numberOfRuns = 1;
  let finalCableSize = suitableSize;
  
  const MAX_SINGLE_CABLE_CAPACITY = 550; // 240 SQMM at 70°C = 550A (conservative)
  
  // Check if current exceeds single cable capacity
  if (requiredCurrent > MAX_SINGLE_CABLE_CAPACITY) {
    numberOfRuns = Math.ceil(requiredCurrent / MAX_SINGLE_CABLE_CAPACITY);
  } else {
    // For smaller currents, keep 1 run if reasonable
    numberOfRuns = 1;
  }
  
  // Calculate current per run
  const currentPerRun = requiredCurrent / numberOfRuns;

  // If there's effectively no load (zero or negligible current),
  // avoid selecting unreasonably small conductor like 1 mm².
  // Use the suitable size or a practical minimum (25 mm²) as floor.
  if (!cable.loadKW || currentPerRun <= 1) {
    finalCableSize = Math.max(suitableSize, 25);
  } else {
    // Find cable size for the per-run current
    for (const [size, capacity] of Object.entries(CABLE_AMPACITY)) {
      if (capacity >= currentPerRun) {
        finalCableSize = Number(size);
        break;
      }
    }
  }
  
  // If size is still too large (>240), increase runs instead
  if (finalCableSize > 240 && numberOfRuns < 10) {
    numberOfRuns++;
    const newCurrentPerRun = requiredCurrent / numberOfRuns;
    if (!cable.loadKW || newCurrentPerRun <= 1) {
      finalCableSize = Math.max(suitableSize, 25);
    } else {
      for (const [size, capacity] of Object.entries(CABLE_AMPACITY)) {
        if (capacity >= newCurrentPerRun) {
          finalCableSize = Number(size);
          break;
        }
      }
    }
  }
  
  // Generate cable designation: e.g., "2 X 3 C X 120 SQMM (Cu)"
  const cableDesignation = `${numberOfRuns} X ${numberOfCores} C X ${finalCableSize} SQMM (${conductorMaterial})`;

  // 8. Determine breaker size
  const breakerSize = `${Math.ceil(deratedCurrent / 10) * 10}A`;

  return {
    serialNo: cable.serialNo,
    cableNumber: cable.cableNumber,
    feederDescription: cable.feederDescription,
    fromBus: cable.fromBus,
    toBus: cable.toBus,
    voltage: cable.voltage,
    loadKW: cable.loadKW,
    length: cable.length,
    powerFactor: PF,
    efficiency: EFFICIENCY,
    deratingFactor: cable.deratingFactor,
    fullLoadCurrent: FLC,
    deratedCurrent: deratedCurrent,
    cableResistance: cableResistance,
    voltageDrop: vdrop,
    voltageDropPercent: vdropPercent,
    sizeByCurrent: sizeByCurrent,
    sizeByVoltageDrop: sizeByVoltageDrop,
    sizeByShortCircuit: sizeByShortCircuit,
    suitableCableSize: suitableSize,
    shortCircuitCurrent: SHORT_CIRCUIT,
    breakerSize: breakerSize,
    // NEW FIELDS
    numberOfCores: numberOfCores,
    conductorMaterial: conductorMaterial,
    numberOfRuns: numberOfRuns,
    cableSizeSQMM: finalCableSize,
    cableDesignation: cableDesignation,
    status: vdropPercent <= 5 ? 'valid' : 'invalid',
  };
};

const ResultsTab = () => {
  const { pathAnalysis } = usePathContext();
  const [results, setResults] = useState<CableSizingResult[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('results_visible_columns');
      return raw ? JSON.parse(raw) : {
        sizeI: true,
        sizeV: true,
        sizeIsc: true,
        finalSize: true,
        runs: true,
        designation: true,
        breaker: true,
        status: true,
      };
    } catch {
      return {
        sizeI: true,
        sizeV: true,
        sizeIsc: true,
        finalSize: true,
        runs: true,
        designation: true,
        breaker: true,
        status: true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('results_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Generate results from paths on component mount
  const generateResults = () => {
    if (!pathAnalysis || !pathAnalysis.paths) return [];

    const allCables: CableSizingResult[] = [];
    const seen = new Set<number>();

    // Flatten all cables from all paths and calculate sizing
    // Deduplicate by serialNo while preserving first occurrence order
    pathAnalysis.paths.forEach((path) => {
      path.cables.forEach((cable) => {
        if (!seen.has(cable.serialNo)) {
          seen.add(cable.serialNo);
            const result = calculateCableSizing(cable);
            // detect anomalies based on inputs and sizing
            const issues = detectAnomalies(cable, result);
            result.anomalies = issues;
            result.isAnomaly = issues.length > 0;
            allCables.push(result);
        }
      });
    });

    return allCables;
  };

  // Initialize results from paths when pathAnalysis changes
  useEffect(() => {
    if (pathAnalysis && pathAnalysis.paths && pathAnalysis.paths.length > 0) {
      setResults(generateResults());
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathAnalysis]);

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={32} />
          <h3 className="text-yellow-200 font-semibold mb-2">
            No Results Yet
          </h3>
          <p className="text-yellow-300 text-sm mb-4">
            Perform path analysis in the <strong>Optimization</strong> tab first
            to generate cable sizing results.
          </p>
        </div>
      </div>
    );
  }

  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Serial No': r.serialNo,
      'Cable Number': r.cableNumber,
      'Feeder Description': r.feederDescription,
      'From Bus': r.fromBus,
      'To Bus': r.toBus,
      'Voltage (V)': r.voltage,
      'Load (kW)': r.loadKW.toFixed(2),
      'Length (m)': r.length.toFixed(2),
      'PF': r.powerFactor.toFixed(2),
      'Efficiency (%)': (r.efficiency * 100).toFixed(1),
      'Derating': r.deratingFactor.toFixed(2),
      'FLC (A)': r.fullLoadCurrent.toFixed(2),
      'Derated Current (A)': r.deratedCurrent.toFixed(2),
      'Cable Resistance (Ω/km)': r.cableResistance.toFixed(4),
      'V-Drop (V)': r.voltageDrop.toFixed(2),
      'V-Drop (%)': r.voltageDropPercent.toFixed(2),
      'Size by Current (mm²)': r.sizeByCurrent,
      'Size by V-Drop (mm²)': r.sizeByVoltageDrop,
      'Size by Isc (mm²)': r.sizeByShortCircuit,
      'Suitable Cable Size (mm²)': r.suitableCableSize,
      'Number of Cores': r.numberOfCores,
      'Conductor Material': r.conductorMaterial,
      'Number of Runs': r.numberOfRuns,
      'Final Cable Size (mm²)': r.cableSizeSQMM,
      'Cable Designation': r.cableDesignation,
      'Isc (kA)': (r.shortCircuitCurrent / 1000).toFixed(1),
      'Breaker': r.breakerSize,
      'Status': r.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Cable Sizing Results'
    );
    XLSX.writeFile(workbook, `cable_sizing_results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const tableData = results.map((r) => [
        String(r.serialNo),
        r.cableNumber,
        r.feederDescription.substring(0, 20),
        r.fromBus,
        r.toBus,
        String(r.voltage),
        r.loadKW.toFixed(1),
        r.length.toFixed(1),
        r.deratedCurrent.toFixed(1),
        r.voltageDropPercent.toFixed(2),
        String(r.sizeByCurrent),
        String(r.sizeByVoltageDrop),
        String(r.suitableCableSize),
        String(r.numberOfRuns),
        r.cableDesignation,
        r.breakerSize,
        r.status.toUpperCase(),
      ]);

      // Use dynamic import pattern for autoTable
      const jsPDFWithAutoTable = doc as any;
      
      if (jsPDFWithAutoTable.autoTable) {
        jsPDFWithAutoTable.autoTable({
          head: [
            [
              'S.No',
              'Cable #',
              'Description',
              'From',
              'To',
              'V',
              'kW',
              'L(m)',
              'I(A)',
              'V%',
              'I-Size',
              'V-Size',
              'Final',
              'Runs',
              'Designation',
              'Breaker',
              'Status',
            ],
          ],
          body: tableData,
          startY: 20,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [240, 248, 255] },
          margin: { top: 25 },
        });
      }

      doc.text(
        `Cable Sizing Results - ${new Date().toLocaleDateString()}`,
        14,
        10
      );
      
      const fileName = `cable_sizing_results_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Check browser console for details.');
    }
  };

  const validResults = results.filter((r) => r.status === 'valid').length;
  const invalidResults = results.filter((r) => r.status === 'invalid').length;
  const totalLoad = results.reduce((sum, r) => sum + r.loadKW, 0);

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText className="mr-2" size={20} />
            Cable Sizing Results & Analysis
          </h3>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={() => setShowCustomize((s) => !s)}
              className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              Customize
            </button>
          </div>
        </div>
        {showCustomize && (
          <div className="mt-3 p-3 bg-slate-700/40 rounded border border-slate-600">
            <div className="text-sm text-slate-200 font-medium mb-2">Customize Columns</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(visibleColumns).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={() => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-cyan-400">{results.length}</p>
            <p className="text-slate-400">Total Cables</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-green-400">{validResults}</p>
            <p className="text-slate-400">Valid (V%≤5)</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-red-400">{invalidResults}</p>
            <p className="text-slate-400">Invalid (V%&gt;5)</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-yellow-400">
              {totalLoad.toFixed(1)}
            </p>
            <p className="text-slate-400">Total Load (kW)</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-orange-400">
              {(
                results.reduce((sum, r) => sum + r.suitableCableSize, 0) /
                results.length
              ).toFixed(0)}
            </p>
            <p className="text-slate-400">Avg Cable Size (mm²)</p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {/* Scrollable Table Container with both scrollbars */}
        <div className="overflow-x-auto overflow-y-auto results-table-scroll" style={{ height: '1000px' }}>
          <table className="w-full min-w-[2000px] text-xs">
            <thead className="bg-slate-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-slate-300">S.No</th>
                <th className="px-3 py-2 text-left text-slate-300">Cable #</th>
                <th className="px-3 py-2 text-left text-slate-300">
                  Feeder Description
                </th>
                <th className="px-3 py-2 text-left text-slate-300">From Bus</th>
                <th className="px-3 py-2 text-left text-slate-300">To Bus</th>
                <th className="px-3 py-2 text-center text-slate-300">
                  V (V)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  Load (kW)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  L (m)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  FLC (A)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  Derated (A)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  R (Ω/km)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  V-Drop (V)
                </th>
                <th className="px-3 py-2 text-center text-slate-300">
                  V-Drop (%)
                </th>
                {visibleColumns.sizeI && (
                  <th className="px-3 py-2 text-center text-slate-300">Size-I (mm²)</th>
                )}
                {visibleColumns.sizeV && (
                  <th className="px-3 py-2 text-center text-slate-300">Size-V (mm²)</th>
                )}
                {visibleColumns.sizeIsc && (
                  <th className="px-3 py-2 text-center text-slate-300">Size-Isc (mm²)</th>
                )}
                {visibleColumns.finalSize && (
                  <th className="px-3 py-2 text-center font-bold text-cyan-400">Final Size (mm²)</th>
                )}
                {visibleColumns.runs && (
                  <th className="px-3 py-2 text-center font-bold text-green-400">No. of Runs</th>
                )}
                {visibleColumns.designation && (
                  <th className="px-3 py-2 text-center font-bold text-purple-400 min-w-[220px]">Cable Designation</th>
                )}
                {visibleColumns.breaker && (
                  <th className="px-3 py-2 text-left text-slate-300">Breaker</th>
                )}
                {visibleColumns.status && (
                  <th className="px-3 py-2 text-center text-slate-300">Status</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {results.map((result) => (
                <tr
                  key={`${result.cableNumber}-${result.serialNo}`}
                  className="hover:bg-slate-700 transition-colors"
                >
                  <td className="px-3 py-2 text-slate-300">{result.serialNo}</td>
                  <td className="px-3 py-2 text-slate-300">
                    {result.cableNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-300 max-w-xs">
                    {result.feederDescription}
                  </td>
                  <td className="px-3 py-2 text-cyan-300">{result.fromBus}</td>
                  <td className="px-3 py-2 text-cyan-300">{result.toBus}</td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.voltage}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.loadKW.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.length.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.fullLoadCurrent.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.deratedCurrent.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.cableResistance.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">
                    {result.voltageDrop.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-center font-bold ${
                      result.voltageDropPercent <= 5
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {result.voltageDropPercent.toFixed(2)}
                  </td>
                    {visibleColumns.sizeI && (
                      <td className="px-3 py-2 text-center text-slate-300">{result.sizeByCurrent}</td>
                    )}
                    {visibleColumns.sizeV && (
                      <td className="px-3 py-2 text-center text-slate-300">{result.sizeByVoltageDrop}</td>
                    )}
                    {visibleColumns.sizeIsc && (
                      <td className="px-3 py-2 text-center text-slate-300">{result.sizeByShortCircuit}</td>
                    )}
                    {visibleColumns.finalSize && (
                      <td className="px-3 py-2 text-center font-bold text-cyan-400 bg-slate-700/50 rounded">{result.suitableCableSize}</td>
                    )}
                    {visibleColumns.runs && (
                      <td className="px-3 py-2 text-center font-bold text-green-400 bg-slate-700/50 rounded">{result.numberOfRuns}</td>
                    )}
                    {visibleColumns.designation && (
                      <td className="px-3 py-2 text-center font-bold text-purple-300 bg-purple-900/30 rounded whitespace-nowrap min-w-[220px]">{result.cableDesignation}</td>
                    )}
                    {visibleColumns.breaker && (
                      <td className="px-3 py-2 text-slate-300">{result.breakerSize}</td>
                    )}
                  <td className="px-3 py-2 text-center align-middle">
                    {result.status === 'valid' ? (
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs font-medium">
                        ✓ VALID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-medium">
                        ✗ INVALID
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="text-white font-semibold mb-4">Size Distribution</h4>
          <div className="space-y-2">
            {Object.entries(
              results.reduce(
                (acc, r) => {
                  acc[r.suitableCableSize] = (acc[r.suitableCableSize] || 0) + 1;
                  return acc;
                },
                {} as Record<number, number>
              )
            )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([size, count]) => (
                <div key={size} className="flex justify-between text-sm">
                  <span className="text-slate-300">{size} mm²</span>
                  <span className="text-cyan-400 font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="text-white font-semibold mb-4">V-Drop Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">≤3% (Best)</span>
              <span className="text-green-400 font-medium">
                {results.filter((r) => r.voltageDropPercent <= 3).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">3-5% (Valid)</span>
              <span className="text-yellow-400 font-medium">
                {
                  results.filter(
                    (r) =>
                      r.voltageDropPercent > 3 && r.voltageDropPercent <= 5
                  ).length
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">&gt;5% (Invalid)</span>
              <span className="text-red-400 font-medium">
                {results.filter((r) => r.voltageDropPercent > 5).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="text-white font-semibold mb-4">Load Distribution</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Total Load</span>
              <span className="text-cyan-400 font-medium">
                {totalLoad.toFixed(1)} kW
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Average Load/Cable</span>
              <span className="text-cyan-400 font-medium">
                {(totalLoad / results.length).toFixed(2)} kW
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Max Load Cable</span>
              <span className="text-cyan-400 font-medium">
                {Math.max(...results.map((r) => r.loadKW)).toFixed(2)} kW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <div className="flex gap-3">
          <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-2">Cable Sizing Methodology:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>
                • Size by Current: FLC × 1.25 safety factor ÷ derating factor
              </li>
              <li>
                • Size by Voltage Drop: Ensures V-drop ≤ 5% per IEC 60364
              </li>
              <li>
                • Size by Short Circuit: Protective device coordination
              </li>
              <li>
                • Final Size: Maximum of all three methods (conservative approach)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
