import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileText, Calculator, Edit, Trash2, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { normalizeFeeders, analyzeAllPaths, autoDetectColumnMappings } from '../utils/pathDiscoveryService';
import { AmpacityTables } from '../utils/CableEngineeringData';
import { usePathContext } from '../context/PathContext';
import { CLEAN_DEMO_FEEDERS } from '../utils/cleanDemoData';
import ColumnMappingModal from './ColumnMappingModal';

// Template generation function – now mirrors the official workbook layout
const generateFeederTemplate = () => {
  // Start from a skeleton object containing all input fields used in the "HT Cable" workbook
  const templateData = [
    {
      'SL No': '',
      'Description': '',
      'Type of feeder': '',
      'Rated power (kVA)': '',
      'Rated power (kW)': '',
      'Rated Voltage (kV)': '',
      'Power factor': '',
      'Efficiency (%)': '',
      //'Cable Type (Cu/Al)': '', // removed – selected later on results page
      'Motor starting current (A)': '',
      'Motor starting PF': '',
      'Short circuit current (kA)': '',
      'SC withstand duration (sec)': '',
      'Installation Method': '',
      'Cable Length (m)': '',
      'No. of Cores': '',
      'Ambient Temp (°C)': '',
      'Ground Temp (°C)': '',
      'Depth of Laying (cm)': '',
      'Derating Factor': '',
      'Load KW': '',
      'From Bus': '',
      'To Bus': ''
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData, { skipHeader: false });

  // Set column widths for readability
  const colWidths = [
    { wch: 6 },  // SL No
    { wch: 30 }, // Description
    { wch: 18 }, // Type of feeder
    { wch: 12 }, // Rated power (kVA)
    { wch: 12 }, // Rated power (kW)
    { wch: 12 }, // Rated Voltage (kV)
    { wch: 12 }, // Power factor
    { wch: 12 }, // Efficiency
    { wch: 18 }, // Motor starting current
    { wch: 18 }, // Motor starting PF
    { wch: 18 }, // Short circuit current
    { wch: 22 }, // SC withstand duration
    { wch: 18 }, // Installation Method
    { wch: 12 }, // Cable Length
    { wch: 12 }, // No. of Cores
    { wch: 16 }, // Ambient Temp
    { wch: 16 }, // Ground Temp
    { wch: 16 }, // Depth of Laying
    { wch: 14 }, // Derating Factor
    { wch: 10 }, // Load KW
    { wch: 14 }, // From Bus
    { wch: 14 }  // To Bus
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Feeders');

  // Create instructions sheet describing every input field in the template
  const instructionsData = [
    { FIELD: 'SL No', REQUIRED: 'Optional', Description: 'Serial number / reference' },
    { FIELD: 'Description', REQUIRED: 'Optional', Description: 'Load or equipment description' },
    { FIELD: 'Type of feeder', REQUIRED: 'YES', Description: 'e.g., MOTOR, PUMP, TRANSFORMER, FEEDER' },
    { FIELD: 'Rated power (kVA)', REQUIRED: 'Conditional', Description: 'Apparent power for transformer or motor' },
    { FIELD: 'Rated power (kW)', REQUIRED: 'Conditional', Description: 'Real power for resistive loads' },
    { FIELD: 'Rated Voltage (kV)', REQUIRED: 'YES', Description: 'Supply voltage; kV values are accepted (e.g., 0.415, 11)' },
    { FIELD: 'Power factor', REQUIRED: 'Optional', Description: '0.7–0.99 for motors; default 0.85' },
    { FIELD: 'Efficiency (%)', REQUIRED: 'Optional', Description: 'Equipment efficiency (default 95% for motors)' },
    { FIELD: 'Motor starting current (A)', REQUIRED: 'Optional', Description: 'If known; otherwise calculated using 7.2×FLC for DOL motors' },
    { FIELD: 'Motor starting PF', REQUIRED: 'Optional', Description: 'Power factor during motor starting' },
    { FIELD: 'Short circuit current (kA)', REQUIRED: 'Optional', Description: 'Short‑circuit current at the switchboard for fault checks' },
    { FIELD: 'SC withstand duration (sec)', REQUIRED: 'Optional', Description: 'Breaker clearing time for SC calculation' },
    { FIELD: 'Installation Method', REQUIRED: 'YES', Description: 'Air, Trench, Duct, Ground etc.' },
    { FIELD: 'Cable Length (m)', REQUIRED: 'YES', Description: 'Run length from parent to load' },
    { FIELD: 'No. of Cores', REQUIRED: 'Optional', Description: '2C, 3C, 4C etc. (default assigned by engine if missing)' },
    { FIELD: 'Ambient Temp (°C)', REQUIRED: 'Optional', Description: 'Ambient temperature for derating (default 40)' },
    { FIELD: 'Ground Temp (°C)', REQUIRED: 'Optional', Description: 'Ground temperature for buried cables' },
    { FIELD: 'Depth of Laying (cm)', REQUIRED: 'Optional', Description: 'Depth for buried cables' },
    { FIELD: 'Derating Factor', REQUIRED: 'Optional', Description: 'Overall derating (K1×K2×K3×K4×K5) - leave blank to auto‑calculate' },
    { FIELD: 'Load KW', REQUIRED: 'Optional', Description: 'Alternate power input field (used if kVA not provided)' },
    { FIELD: 'From Bus', REQUIRED: 'YES', Description: 'Origin bus name (e.g., MAIN-PANEL)' },
    { FIELD: 'To Bus', REQUIRED: 'YES', Description: 'Destination bus or equipment' }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  const instructionWidths = [
    { wch: 18 },
    { wch: 12 },
    { wch: 70 }
  ];
  wsInstructions['!cols'] = instructionWidths;
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'INSTRUCTIONS - Read First');

  // Download the file
  XLSX.writeFile(wb, 'SCEAP_Demo_Template.xlsx');
};

// Generate Catalog Template with combined core configurations and derating info
const generateCatalogTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Build a single "Catalogue Aluminium" sheet containing all cores
  const catalogRows: any[] = [];
  const coreConfigs = ['1C','2C','3C','4C'];

  coreConfigs.forEach(coreConfig => {
    const table = (AmpacityTables as any)[coreConfig];
    if (table && typeof table === 'object') {
      Object.keys(table).forEach(size => {
        const entry = table[size];
        catalogRows.push({
          'Core Config': coreConfig,
          'Size (mm²)': Number(size),
          'Air Rating (A)': entry.air,
          'Ground Rating (A)': entry.trench,
          'Duct Rating (A)': entry.duct,
          'Resistance @ 90°C (Ω/km)': entry.resistance_90C || entry.resistance || 0,
          'Reactance (Ω/km)': entry.reactance || 0,
          'Cable Diameter (mm)': entry.cableDia || '',
          'Material': 'Al', // default material for catalogue
          'Derating K1 (Temp)': '',
          'Derating K2 (Grouping)': '',
          'Derating K3 (Ground Temp)': '',
          'Derating K4 (Depth)': '',
          'Derating K5 (Soil)':''
        });
      });
    }
  });

  // Sort by cores then size
  catalogRows.sort((a,b) => {
    if (a['Core Config'] !== b['Core Config']) return coreConfigs.indexOf(a['Core Config']) - coreConfigs.indexOf(b['Core Config']);
    return a['Size (mm²)'] - b['Size (mm²)'];
  });

  const ws = XLSX.utils.json_to_sheet(catalogRows, { header: [
    'Core Config','Size (mm²)','Air Rating (A)','Ground Rating (A)','Duct Rating (A)',
    'Resistance @ 90°C (Ω/km)','Reactance (Ω/km)','Cable Diameter (mm)','Material',
    'Derating K1 (Temp)','Derating K2 (Grouping)','Derating K3 (Ground Temp)',
    'Derating K4 (Depth)','Derating K5 (Soil)'
  ]});

  ws['!cols'] = [
    { wch: 12 },{ wch: 12 },{ wch: 15 },{ wch: 15 },{ wch: 15 },
    { wch: 20 },{ wch: 18 },{ wch: 20 },{ wch: 12 },
    { wch: 15 },{ wch: 18 },{ wch: 18 },{ wch: 18 },{ wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Aluminium');

  // Add derating factors sheet (more descriptive than before)
  const deratingData = [
    { Factor: 'Temperature (K1)', Description: 'Ambient temperature factor', 'Air': 0.90, 'Trench': 0.90, 'Duct': 0.80 },
    { Factor: 'Grouping (K2)', Description: 'Number of circuits', '1': 1.00, '2': 0.95, '3': 0.90, '4': 0.85, '6': 0.80 },
    { Factor: 'Ground Temp (K3)', Description: 'Ground temperature factor', 'Single': 0.96, 'Multi': 0.91 },
    { Factor: 'Depth (K4)', Description: 'Depth of laying factor (cm)', '300': 1.0, '600': 0.95, '900': 0.90 },
    { Factor: 'Soil Resistivity (K5)', Description: 'Thermal resistivity (K·m/W)', '1.2': 1.0, '2.0': 0.95 }
  ];
  const wsDerat = XLSX.utils.json_to_sheet(deratingData);
  wsDerat['!cols'] = [{ wch: 20 },{ wch: 50 },{ wch: 10 },{ wch: 10 },{ wch: 10 },{ wch: 10 },{ wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsDerat, 'Derating Factors');

  XLSX.writeFile(wb, 'CATALOG_TEMPLATE.xlsx');
};

interface FeederData {
  id: number;
  [key: string]: any; // Allow any additional columns from Excel
}

interface CableCatalogue {
  size: number;
  cores?: '1C' | '2C' | '3C' | '4C';
  current: number;                         // usually air rating
  resistance: number;
  reactance: number;
  material?: 'Al' | 'Cu';                 // conductor material, default from sheet name
  cableDia?: number;
  airRating?: number;
  trenchRating?: number;
  ductRating?: number;
  // Optional derating factors provided with catalogue rows
  deratingK1?: number;
  deratingK2?: number;
  deratingK3?: number;
  deratingK4?: number;
  deratingK5?: number;
  [key: string]: any;                     // allow other properties for flexibility
}

// Professional Loading Component
const LoadingOverlay = ({ message, progress }: { message: string; progress?: number }) => {
  const loadingMessages = [
    "Analyzing electrical parameters...",
    "Processing feeder configurations...",
    "Validating cable specifications...",
    "Calculating load distributions...",
    "Optimizing cable routing paths...",
    "Ensuring electrical safety standards...",
    "Finalizing engineering calculations..."
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* SCEAP Logo/Brand */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h3 className="text-white font-semibold text-lg">SCEAP</h3>
            <p className="text-slate-400 text-sm">Smart Cable Engineering & Analysis Platform</p>
          </div>

          {/* Circular Progress */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (progress || 0) / 100)}`}
                  className="text-cyan-500 transition-all duration-300 ease-in-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            </div>
          </div>

          {/* Loading Message */}
          <div className="space-y-2">
            <p className="text-white font-medium">{message}</p>
            <p className="text-slate-400 text-sm animate-pulse">
              {loadingMessages[Math.floor(Math.random() * loadingMessages.length)]}
            </p>
            {progress && (
              <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SizingTab = () => {
  const { setPathAnalysis: setContextPathAnalysis, setNormalizedFeeders: setContextNormalizedFeeders, setOriginalFeeders, catalogueData, setCatalogueData } = usePathContext();
  const [feederData, setFeederData] = useState<FeederData[]>([]);
  const [feederHeaders, setFeederHeaders] = useState<string[]>([]);
  const [activeCatalogueTab, setActiveCatalogueTab] = useState<string>('3C');
  const [isCalculating, setIsCalculating] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [isLoadingFeeder, setIsLoadingFeeder] = useState(false);
  const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pathAnalysis, setPathAnalysis] = useState<any>(null);
  
  // Column mapping modal state
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [rawExcelHeaders, setRawExcelHeaders] = useState<string[]>([]);
  const [rawExcelRows, setRawExcelRows] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string | null>>({});

  // Load demo data directly - use CLEAN demo data with proper values
  const handleLoadDemoFeeders = useCallback(() => {
    const demoFeeders = CLEAN_DEMO_FEEDERS;
    const headers = Object.keys(demoFeeders[0]);
    
    // Create feeder data with id field
    const feedersWithId = demoFeeders.map((f: any, index: number) => ({ ...f, id: index + 1 }));
    
    // Normalize through pathDiscoveryService
    const normalizedFeeders = normalizeFeeders(feedersWithId);
    const analysis = analyzeAllPaths(normalizedFeeders);
    
    console.log('✓ Demo feeders loaded:', normalizedFeeders.length);
    console.log('✓ Paths discovered:', analysis.totalPaths);
    
    // Store in state
    setFeederData(feedersWithId);
    setFeederHeaders(headers);
    setPathAnalysis(analysis);
    setContextPathAnalysis(analysis);
    setContextNormalizedFeeders(normalizedFeeders);
    setOriginalFeeders([...normalizedFeeders]); // Store original for revert
  }, [setContextPathAnalysis, setContextNormalizedFeeders]);

  const onFeederDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setIsLoadingFeeder(true);
    setLoadingMessage('Reading Excel file...');

    const reader = new FileReader();

    reader.onloadstart = () => {
      setLoadingMessage('Initializing file reader...');
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 30);
        setLoadingMessage(`Reading file... ${progress}%`);
      }
    };

    reader.onload = (e) => {
      try {
        setLoadingMessage('Parsing Excel data...');

        setTimeout(() => setLoadingMessage('Analyzing worksheet structure...'), 200);
        setTimeout(() => setLoadingMessage('Extracting column headers...'), 400);
        setTimeout(() => setLoadingMessage('Processing data rows...'), 600);

        setTimeout(() => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });

          if (jsonData.length === 0) {
            alert('No data found in the Excel file');
            setIsLoadingFeeder(false);
            return;
          }

          // First row is headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          const validRows = rows.filter(row =>
            row.some(cell => cell !== null && cell !== undefined && cell !== '')
          );

          // Convert to feeder data format with original headers
          const feeders: FeederData[] = validRows.map((row, index) => {
            const feeder: any = { id: index + 1 };
            headers.forEach((header, colIndex) => {
              const originalHeader = header || `Column_${colIndex + 1}`;
              feeder[originalHeader] = row[colIndex] || '';
            });
            return feeder as FeederData;
          });

          // Auto-detect column mappings
          const detectedMappings = autoDetectColumnMappings(headers);

          // Store data and show mapping modal
          setRawExcelHeaders(headers);
          setRawExcelRows(feeders);
          setColumnMappings(detectedMappings);
          setShowMappingModal(true);
          setIsLoadingFeeder(false);

          console.log(`Loaded ${feeders.length} feeders with ${headers.length} columns`);
          console.log('Auto-detected mappings:', detectedMappings);
        }, 800);

      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please check the file format and try again.');
        setIsLoadingFeeder(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const onCatalogueDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setIsLoadingCatalogue(true);
    setLoadingMessage('Reading cable catalogue...');

    const reader = new FileReader();

    reader.onloadstart = () => {
      setLoadingMessage('Initializing catalogue reader...');
    };

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 30);
        setLoadingMessage(`Reading catalogue... ${progress}%`);
      }
    };

    reader.onload = (e) => {
      try {
        setLoadingMessage('Parsing catalogue data...');

        setTimeout(() => setLoadingMessage('Analyzing cable specifications...'), 200);
        setTimeout(() => setLoadingMessage('Validating electrical parameters...'), 400);
        setTimeout(() => setLoadingMessage('Processing cable sizes...'), 600);

        setTimeout(() => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });

          setLoadingMessage('Extracting cable data from all sheets...');

          // Helper to get column value with flexible naming
          const getColValue = (row: any, ...variations: string[]): any => {
            for (const v of variations) {
              if (v in row && row[v] !== '' && row[v] !== null) return row[v];
            }
            const lowerKeys = Object.keys(row).reduce((acc: any, k) => {
              acc[k.toLowerCase().trim()] = row[k];
              return acc;
            }, {});
            for (const v of variations) {
              const lower = v.toLowerCase().trim();
              if (lower in lowerKeys && lowerKeys[lower] !== '' && lowerKeys[lower] !== null) return lowerKeys[lower];
            }
            return undefined;
          };

          // Read ALL sheets from the workbook
          const allSheetsData: Record<string, any> = {};
          let firstSheetName = '3C'; // Default if nothing else found

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              defval: '',
              blankrows: false
            });

            // Map raw Excel data to CableCatalogue format
            const mappedData = jsonData
              .map((row: any): CableCatalogue | null => {
                const size = getColValue(row, 'Size (mm²)', 'size', 'Size', 'Area', 'area');
                const current = getColValue(row, 'Current (A)', 'current', 'Current', 'Air Rating (A)', 'air', 'rating');
                const resistance = getColValue(row, 'Resistance (Ω/km)', 'Resistance (Ohm/km)', 'resistance', 'Resistance @ 90°C (Ω/km)', 'R', 'resistance (ohm/km)');
                const reactance = getColValue(row, 'Reactance (Ω/km)', 'Reactance (Ohm/km)', 'reactance', 'Reactance', 'X', 'reactance (ohm/km)');

                // additional fields
                const coresRaw = getColValue(row, 'Core Config', 'Cores', 'No. of Cores', 'Core Configuration', 'Configuration', 'core config');
                const materialRaw = getColValue(row, 'Material', 'Mat', 'Conductor Material');
                const deratingK1 = getColValue(row, 'Derating K1 (Temp)', 'K1 (Temp)', 'Derating K1', 'K1');
                const deratingK2 = getColValue(row, 'Derating K2 (Grouping)', 'K2', 'Derating K2');
                const deratingK3 = getColValue(row, 'Derating K3 (Ground Temp)', 'K3', 'Derating K3');
                const deratingK4 = getColValue(row, 'Derating K4 (Depth)', 'K4', 'Derating K4');
                const deratingK5 = getColValue(row, 'Derating K5 (Soil)', 'K5', 'Derating K5');

                // Only include if has size (required field)
                if (size === undefined || size === '' || size === null) return null;

                // Safe number parsing
                const parseNum = (val: any): number => {
                  if (val === undefined || val === null || val === '') return 0;
                  const trimmed = String(val).trim().replace('%', '').replace(',', '');
                  const n = Number(trimmed);
                  return Number.isFinite(n) ? n : 0;
                };

                // determine default material from sheet name if not provided
                let material: 'Al' | 'Cu' | undefined = undefined;
                if (materialRaw && typeof materialRaw === 'string') {
                  const m = materialRaw.toString().toLowerCase();
                  if (m.includes('cu')) material = 'Cu';
                  else if (m.includes('al')) material = 'Al';
                }
                if (!material) {
                  const lowerSheet = sheetName.toLowerCase();
                  if (lowerSheet.includes('cu')) material = 'Cu';
                  else if (lowerSheet.includes('al')) material = 'Al';
                }

                return {
                  size: parseNum(size),
                  current: parseNum(current),
                  resistance: parseNum(resistance),
                  reactance: parseNum(reactance),
                  cores: (coresRaw || sheetName) as any,
                  material,
                  deratingK1: parseNum(deratingK1),
                  deratingK2: parseNum(deratingK2),
                  deratingK3: parseNum(deratingK3),
                  deratingK4: parseNum(deratingK4),
                  deratingK5: parseNum(deratingK5)
                };
              })
              .filter((item): item is CableCatalogue => item !== null && item.size > 0);

            if (mappedData.length > 0) {
              // Normalize to engine-expected structure: { '<size>': { air, trench, duct, resistance_90C, reactance, cableDia } }
              const sizesMap: Record<string, any> = {};
              mappedData.forEach((entry) => {
                const air = entry.current || entry.airRating || entry['Air Rating (A)'] || 0;
                const trench = entry.trench || entry.trenchRating || entry['Trench Rating (A)'] || air;
                const duct = entry.duct || entry.ductRating || entry['Duct Rating (A)'] || air;
                const resistance90 = entry.resistance_90C || entry.resistance || entry['Resistance @ 90°C (Ω/km)'] || entry.R || 0;
                const reactance = entry.reactance || entry.X || entry['Reactance (Ω/km)'] || 0;
                const cableDia = entry.dia || entry['Cable Diameter (mm)'] || entry.cableDia || 0;

                // propagate extra metadata as-is so downstream components can access them
                sizesMap[String(entry.size)] = {
                  air,
                  trench,
                  duct,
                  resistance_90C: resistance90,
                  reactance,
                  cableDia,
                  material: entry.material,
                  cores: entry.cores,
                  deratingK1: entry.deratingK1,
                  deratingK2: entry.deratingK2,
                  deratingK3: entry.deratingK3,
                  deratingK4: entry.deratingK4,
                  deratingK5: entry.deratingK5
                };
              });

              allSheetsData[sheetName] = sizesMap;

              // Set first non-empty sheet as active
              if (Object.keys(allSheetsData).length === 1) {
                firstSheetName = sheetName;
              }

              console.log(`[CATALOGUE] Sheet "${sheetName}": ${Object.keys(sizesMap).length} sizes loaded`);
              console.log(`[CATALOGUE] Sample: ${JSON.stringify(Object.values(sizesMap)[0])}`);
            }
          });

          setLoadingMessage('Catalogue processing complete!');

          setTimeout(() => {
            // Store catalogue in context so other components (ResultsTab / engine) can access it
            try {
              setCatalogueData(allSheetsData);
              // Also set a temporary global hook used by ResultsTab until context wiring is fully used
              (window as any).__USER_AMPACITY_TABLES__ = allSheetsData;
            } catch (e) {
              console.warn('Failed to set catalogue in context/global:', e);
            }

            setActiveCatalogueTab(firstSheetName);
            setIsLoadingCatalogue(false);

            console.log(`Loaded catalogue with sheets: ${Object.keys(allSheetsData).join(', ')}`);
          }, 500);

        }, 800);

      } catch (error) {
        console.error('Error parsing catalogue Excel file:', error);
        alert('Error parsing catalogue Excel file. Please check the file format and try again.');
        setIsLoadingCatalogue(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const feederDropzone = useDropzone({
    onDrop: onFeederDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const catalogueDropzone = useDropzone({
    onDrop: onCatalogueDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const handleRunSizing = async () => {
    setIsCalculating(true);
    // force a recalculation even if feed data hasn't changed
    if (feederData.length > 0) {
      recomputeAnalysis(feederData);
    }
    // simulate a moment for UI
    setTimeout(() => setIsCalculating(false), 500);
  };

  // helper used whenever feederData is modified to recalc paths & normalized data
  const recomputeAnalysis = (feeders: FeederData[]) => {
    const normalized = normalizeFeeders(feeders);
    const analysis = analyzeAllPaths(normalized);
    setPathAnalysis(analysis);
    setContextPathAnalysis(analysis);
    setContextNormalizedFeeders(normalized);
    setOriginalFeeders([...normalized]);
    console.log('[RECOMPUTE] Analysis updated after feeder change');
    console.log(`  • ${feeders.length} feeders processed`);
    console.log(`  • ${analysis.totalPaths} paths discovered (${analysis.validPaths} valid)`);
  };

  const handleColumnMappingConfirm = (mappings: Record<string, string | null>) => {
    setShowMappingModal(false);
    
    // Re-map raw feeder rows using the confirmed mappings
    const remappedFeeders: FeederData[] = rawExcelRows.map((row, index) => {
      const feeder: any = { id: index + 1 };
      
      // Preserve all original columns first
      Object.keys(row).forEach(originalHeader => {
        feeder[originalHeader] = row[originalHeader];
      });
      
      // Add standardized field columns based on mappings
      Object.entries(mappings).forEach(([fieldName, excelHeader]) => {
        if (excelHeader) {
          feeder[fieldName] = row[excelHeader] || '';
        }
      });
      
      return feeder as FeederData;
    });

    console.log('[COLUMN MAPPING] Remapped feeders (first row):', remappedFeeders[0]);

    // store remapped rows and headers for display/editing
    setFeederData(remappedFeeders);
    setFeederHeaders(rawExcelHeaders);

    // perform initial analysis
    recomputeAnalysis(remappedFeeders);

    // sanity validation
    const normalizedFeeders = normalizeFeeders(remappedFeeders);
    const bad = normalizedFeeders.filter(f => !f.fromBus || !f.toBus || f.loadKW === 0);
    if (bad.length > 0) {
      console.warn('[VALIDATION] Some feeders appear incomplete:', bad.slice(0,3));
      alert(`Warning: ${bad.length} feeders missing from‑bus/to‑bus or load.\nCheck your mapping or feeder list.`);
    }
  };

  const handleColumnMappingCancel = () => {
    setShowMappingModal(false);
    setRawExcelHeaders([]);
    setRawExcelRows([]);
    setColumnMappings({});
  };

  const handleEdit = (id: number) => {
    setEditingRow(id);
  };

  const handleSave = (id: number, updatedData: FeederData) => {
    setFeederData(prev => prev.map(item =>
      item.id === id ? updatedData : item
    ));
    setEditingRow(null);
  };

  const handleDelete = (id: number) => {
    setFeederData(prev => prev.filter(item => item.id !== id));
  };

  // add a blank row at the end for user to quickly append feeders
  const addEmptyRow = () => {
    const nextId = feederData.length > 0 ? Math.max(...feederData.map(f => f.id)) + 1 : 1;
    const empty: any = { id: nextId };
    feederHeaders.forEach(h => {
      empty[h] = '';
    });
    setFeederData(prev => [...prev, empty]);
    setEditingRow(nextId);
  };

  // whenever feederData changes (edit/delete/add), update the analysis automatically
  useEffect(() => {
    if (feederData.length > 0) {
      recomputeAnalysis(feederData);
    }
  }, [feederData]);

  // Build catalogue: use KEC standard as default with proper per-core data
  // Import KEC at top of file for different ampacity ratings per core config
  const getKECCatalogue = () => {
    const KEC = {
      '1C': [
        { size: 120, current: 280, resistance: 0.153, reactance: 0.08, cores: '1C' as const },
        { size: 150, current: 330, resistance: 0.124, reactance: 0.08, cores: '1C' as const },
        { size: 185, current: 380, resistance: 0.0991, reactance: 0.07, cores: '1C' as const },
        { size: 240, current: 460, resistance: 0.0754, reactance: 0.07, cores: '1C' as const },
        { size: 300, current: 550, resistance: 0.0601, reactance: 0.06, cores: '1C' as const },
        { size: 400, current: 660, resistance: 0.047, reactance: 0.06, cores: '1C' as const },
        { size: 500, current: 780, resistance: 0.0366, reactance: 0.05, cores: '1C' as const },
        { size: 630, current: 920, resistance: 0.0283, reactance: 0.05, cores: '1C' as const }
      ],
      '2C': [
        { size: 2.5, current: 27, resistance: 7.41, reactance: 0.08, cores: '2C' as const },
        { size: 4, current: 36, resistance: 4.61, reactance: 0.08, cores: '2C' as const },
        { size: 6, current: 46, resistance: 3.08, reactance: 0.07, cores: '2C' as const },
        { size: 10, current: 63, resistance: 1.83, reactance: 0.07, cores: '2C' as const },
        { size: 16, current: 85, resistance: 1.15, reactance: 0.06, cores: '2C' as const },
        { size: 25, current: 115, resistance: 0.727, reactance: 0.06, cores: '2C' as const },
        { size: 35, current: 145, resistance: 0.524, reactance: 0.05, cores: '2C' as const },
        { size: 50, current: 180, resistance: 0.387, reactance: 0.05, cores: '2C' as const },
        { size: 70, current: 225, resistance: 0.268, reactance: 0.05, cores: '2C' as const },
        { size: 95, current: 275, resistance: 0.193, reactance: 0.04, cores: '2C' as const },
        { size: 120, current: 320, resistance: 0.153, reactance: 0.04, cores: '2C' as const },
        { size: 150, current: 370, resistance: 0.124, reactance: 0.04, cores: '2C' as const },
        { size: 185, current: 425, resistance: 0.0991, reactance: 0.03, cores: '2C' as const },
        { size: 240, current: 510, resistance: 0.0754, reactance: 0.03, cores: '2C' as const },
        { size: 300, current: 605, resistance: 0.0601, reactance: 0.03, cores: '2C' as const },
        { size: 400, current: 730, resistance: 0.047, reactance: 0.02, cores: '2C' as const }
      ],
      '3C': [
        { size: 1.5, current: 20, resistance: 12.1, reactance: 0.08, cores: '3C' as const },
        { size: 2.5, current: 27, resistance: 7.41, reactance: 0.08, cores: '3C' as const },
        { size: 4, current: 36, resistance: 4.61, reactance: 0.07, cores: '3C' as const },
        { size: 6, current: 46, resistance: 3.08, reactance: 0.07, cores: '3C' as const },
        { size: 10, current: 63, resistance: 1.83, reactance: 0.06, cores: '3C' as const },
        { size: 16, current: 85, resistance: 1.15, reactance: 0.06, cores: '3C' as const },
        { size: 25, current: 115, resistance: 0.727, reactance: 0.05, cores: '3C' as const },
        { size: 35, current: 145, resistance: 0.524, reactance: 0.05, cores: '3C' as const },
        { size: 50, current: 180, resistance: 0.387, reactance: 0.04, cores: '3C' as const },
        { size: 70, current: 225, resistance: 0.268, reactance: 0.04, cores: '3C' as const },
        { size: 95, current: 275, resistance: 0.193, reactance: 0.04, cores: '3C' as const },
        { size: 120, current: 320, resistance: 0.153, reactance: 0.03, cores: '3C' as const },
        { size: 150, current: 370, resistance: 0.124, reactance: 0.03, cores: '3C' as const },
        { size: 185, current: 430, resistance: 0.0991, reactance: 0.03, cores: '3C' as const },
        { size: 240, current: 530, resistance: 0.0754, reactance: 0.03, cores: '3C' as const },
        { size: 300, current: 640, resistance: 0.0601, reactance: 0.02, cores: '3C' as const },
        { size: 400, current: 780, resistance: 0.047, reactance: 0.02, cores: '3C' as const },
        { size: 500, current: 920, resistance: 0.0366, reactance: 0.02, cores: '3C' as const }
      ],
      '4C': [
        { size: 2.5, current: 20, resistance: 7.41, reactance: 0.08, cores: '4C' as const },
        { size: 4, current: 27, resistance: 4.61, reactance: 0.08, cores: '4C' as const },
        { size: 6, current: 36, resistance: 3.08, reactance: 0.07, cores: '4C' as const },
        { size: 10, current: 50, resistance: 1.83, reactance: 0.07, cores: '4C' as const },
        { size: 16, current: 68, resistance: 1.15, reactance: 0.06, cores: '4C' as const },
        { size: 25, current: 92, resistance: 0.727, reactance: 0.06, cores: '4C' as const },
        { size: 35, current: 116, resistance: 0.524, reactance: 0.05, cores: '4C' as const },
        { size: 50, current: 145, resistance: 0.387, reactance: 0.05, cores: '4C' as const },
        { size: 70, current: 180, resistance: 0.268, reactance: 0.04, cores: '4C' as const },
        { size: 95, current: 220, resistance: 0.193, reactance: 0.04, cores: '4C' as const },
        { size: 120, current: 256, resistance: 0.153, reactance: 0.04, cores: '4C' as const },
        { size: 150, current: 296, resistance: 0.124, reactance: 0.03, cores: '4C' as const },
        { size: 185, current: 344, resistance: 0.0991, reactance: 0.03, cores: '4C' as const },
        { size: 240, current: 424, resistance: 0.0754, reactance: 0.03, cores: '4C' as const },
        { size: 300, current: 512, resistance: 0.0601, reactance: 0.02, cores: '4C' as const },
        { size: 400, current: 624, resistance: 0.047, reactance: 0.02, cores: '4C' as const }
      ]
    };
    return KEC;
  };
  
  const defaultCatalogueAllCores = getKECCatalogue();
  const catalogueSheets: Record<string, CableCatalogue[]> = (catalogueData && Object.keys(catalogueData).length > 0) ? catalogueData : defaultCatalogueAllCores;
  const catalogueTabs = Object.keys(catalogueSheets || {});
  const activeCatalogue = (catalogueSheets && (catalogueSheets[activeCatalogueTab] as CableCatalogue[])) || defaultCatalogueAllCores['3C'];
  const catalogueName = (catalogueData && Object.keys(catalogueData).length > 0) ? 'User Uploaded Catalogue' : 'KEC Standard (IEC 60287)';

  return (
    <div className="space-y-6">
      {/* Column Mapping Modal */}
      {showMappingModal && (
        <ColumnMappingModal
          excelHeaders={rawExcelHeaders}
          parsedRows={rawExcelRows}
          detectedMappings={columnMappings}
          onConfirm={handleColumnMappingConfirm}
          onCancel={handleColumnMappingCancel}
        />
      )}

      {/* Loading Overlay */}
      {(isLoadingFeeder || isLoadingCatalogue) && (
        <LoadingOverlay message={loadingMessage} />
      )}

      {/* Template Download Section */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg p-6 border border-cyan-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <FileText className="mr-2" size={20} />
              SCEAP Feeder List Template
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Download our pre-formatted Excel template with all required columns for accurate cable sizing calculations.
              Fill in your data and upload it back for instant analysis.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="bg-slate-700 px-2 py-1 rounded">17 Required Columns</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Sample Data Included</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Instructions Sheet</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Ready for Calculations</span>
            </div>
          </div>
          <button
            onClick={generateFeederTemplate}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Download size={20} />
            Download Template
          </button>
        </div>
      </div>

      {/* Quick Load Demo Data Section */}
      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg p-6 border border-amber-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Calculator className="mr-2" size={20} />
              Quick Start with Demo Data
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Load pre-configured demo feeders with realistic cable data across multiple panels. Perfect for testing the cable sizing engine and understanding the workflow.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="bg-slate-700 px-2 py-1 rounded">44 Pre-configured Feeders</span>
              <span className="bg-slate-700 px-2 py-1 rounded">4 Distribution Panels</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Auto Path Discovery</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Ready to Calculate</span>
            </div>
          </div>
          <button
            onClick={handleLoadDemoFeeders}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Loader2 className="mr-2" size={20} />
            Load Demo Feeders
          </button>
        </div>
      </div>

      {/* Catalog Template Download Section */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-6 border border-green-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <FileText className="mr-2" size={20} />
              Cable Catalog Template
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Download the cable catalog template organized by core configurations (1C, 2C, 3C, 4C). 
              Customize it with your own cable sizes and ratings, then upload it for sizing calculations.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="bg-slate-700 px-2 py-1 rounded">4 Core Config Sheets</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Derating Factors Sheet</span>
              <span className="bg-slate-700 px-2 py-1 rounded">Air/Trench/Duct Ratings</span>
              <span className="bg-slate-700 px-2 py-1 rounded">User-Editable</span>
            </div>
          </div>
          <button
            onClick={generateCatalogTemplate}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Download size={20} />
            Download Catalog Template
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feeder List Upload */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Upload Feeder List
          </h3>
          <div
            {...feederDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              feederDropzone.isDragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-600 hover:border-slate-500'
            } ${isLoadingFeeder ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...feederDropzone.getInputProps()} />
            {isLoadingFeeder ? (
              <>
                <Loader2 size={48} className="mx-auto mb-4 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 mb-2 font-medium">Processing feeder data...</p>
                <p className="text-sm text-slate-500">Please wait while we analyze your file</p>
              </>
            ) : (
              <>
                <FileText size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 mb-2">
                  {feederDropzone.isDragActive
                    ? 'Drop the Excel file here...'
                    : 'Drag & drop feeder list Excel file, or click to select'}
                </p>
                <p className="text-sm text-slate-500">
                  Supports .xlsx and .xls files
                </p>
              </>
            )}
          </div>
          {feederData.length > 0 && (
            <p className="mt-4 text-green-400 text-sm">
              ✓ {feederData.length} feeders loaded
            </p>
          )}
        </div>

        {/* Cable Catalogue Upload */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            Upload Cable Catalogue (Optional)
          </h3>
          <div
            {...catalogueDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              catalogueDropzone.isDragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-600 hover:border-slate-500'
            } ${isLoadingCatalogue ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...catalogueDropzone.getInputProps()} />
            {isLoadingCatalogue ? (
              <>
                <Loader2 size={48} className="mx-auto mb-4 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 mb-2 font-medium">Processing cable catalogue...</p>
                <p className="text-sm text-slate-500">Please wait while we validate specifications</p>
              </>
            ) : (
              <>
                <FileText size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 mb-2">
                  {catalogueDropzone.isDragActive
                    ? 'Drop the catalogue file here...'
                    : 'Drag & drop cable catalogue Excel file, or click to select'}
                </p>
                <p className="text-sm text-slate-500">
                  Optional - Default IEC catalogue will be used if not provided
                </p>
              </>
            )}
          </div>
          {catalogueTabs.length > 0 && (
            <p className="mt-4 text-green-400 text-sm">
              ✓ Custom catalogue loaded ({catalogueTabs.length} core configs)
            </p>
          )}
        </div>
      </div>

      {/* Feeder Data Table */}
      {feederData.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Feeder Data</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {feederData.length} rows × {feederHeaders.length} columns
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">
                  Edits update automatically – paths and voltage drop recalc in real time.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addEmptyRow}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm"
                >
                  + Add Row
                </button>
                <button
                  onClick={handleRunSizing}
                  disabled={isCalculating}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
                >
                  <Calculator size={20} />
                  {isCalculating ? 'Calculating...' : 'Run Cable Sizing Engine'}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable container with both horizontal and vertical scrolling */}
          <div className="max-h-96 overflow-auto">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700 sticky top-0 z-10">
                  <tr>
                    {feederHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap bg-slate-700"
                        style={{ minWidth: '120px' }}
                      >
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                    {/* computed value column */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap bg-slate-700" style={{ minWidth: '120px' }}>
                      Load kW
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap bg-slate-700 sticky right-0">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {feederData.map((feeder) => (
                    <tr key={feeder.id} className="hover:bg-slate-700">
                      {feederHeaders.map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap"
                          style={{ minWidth: '120px' }}
                        >
                          {editingRow === feeder.id ? (
                            <input
                              type="text"
                              defaultValue={feeder[header] || ''}
                              className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white w-full min-w-0"
                              onBlur={(e) => {
                                const updated = { ...feeder, [header]: e.target.value };
                                handleSave(feeder.id, updated);
                              }}
                            />
                          ) : (
                            <div className="truncate max-w-xs" title={String(feeder[header] || '')}>
                              {feeder[header] || ''}
                            </div>
                          )}
                        </td>
                      ))}
                      {/* computed loadKW cell */}
                      <td className="px-4 py-4 text-sm text-slate-300 whitespace-nowrap" style={{ minWidth: '120px' }}>
                        {(() => {
                          const rowNorm = normalizeFeeders([feeder]);
                          return rowNorm[0]?.loadKW?.toFixed(2) || '';
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium whitespace-nowrap sticky right-0 bg-slate-800">
                        <button
                          onClick={() => handleEdit(feeder.id)}
                          className="text-cyan-400 hover:text-cyan-300 mr-3"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(feeder.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Path Discovery Summary */}
      {pathAnalysis && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertCircle className="mr-2" size={20} />
            Cable Path Analysis (For Sizing & Optimization)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded p-4">
              <p className="text-slate-400 text-sm">Total Paths</p>
              <p className="text-2xl font-bold text-cyan-400">{pathAnalysis.totalPaths}</p>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <p className="text-slate-400 text-sm">Valid Paths</p>
              <p className="text-2xl font-bold text-green-400">{pathAnalysis.validPaths}</p>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <p className="text-slate-400 text-sm">Invalid Paths</p>
              <p className="text-2xl font-bold text-red-400">{pathAnalysis.invalidPaths}</p>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <p className="text-slate-400 text-sm">Avg V-Drop</p>
              <p className="text-2xl font-bold text-yellow-400">{pathAnalysis.averageVoltageDrop.toFixed(2)}%</p>
            </div>
          </div>

          {pathAnalysis.invalidPaths > 0 && (
            <div className="bg-red-900/20 border border-red-600 rounded p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-red-300">
                  <p className="font-semibold mb-1">⚠️ {pathAnalysis.invalidPaths} path(s) exceed voltage drop limits</p>
                  <p className="text-xs opacity-90">These will need larger cable sizes for compliance with IEC 60364 (≤5% limit)</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-600 rounded p-4">
            <div className="flex gap-3">
              <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">✓ Paths discovered & ready for optimization</p>
                <p className="text-xs opacity-90">Switch to the <strong>Optimization</strong> tab to view detailed path chains, select optimal cable sizes, and run the sizing engine</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalogue Preview */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Cable Catalogue</h3>
            <p className="text-xs text-slate-400 mt-1">Source: {catalogueName}</p>
          </div>
          <span className="text-sm text-slate-400">
            {activeCatalogue.length} cable sizes available
          </span>
        </div>

        {/* Catalogue Tabs */}
        {catalogueTabs.length > 0 && (
          <div className="flex gap-2 mb-4 border-b border-slate-600 pb-3 overflow-x-auto">
            {catalogueTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCatalogueTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                  activeCatalogueTab === tab
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-64 overflow-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Size (mm²)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Current (A)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Resistance (Ω/km)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  Reactance (Ω/km)
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {activeCatalogue.map((item: CableCatalogue, index: number) => (
                <tr key={index} className="hover:bg-slate-700">
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{item.size}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{item.current}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{item.resistance}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{item.reactance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DERATING FACTORS SECTION */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="text-yellow-400 text-2xl mr-2">⚡</span>
            Derating Factors (IEC 60287)
          </h3>
          <p className="text-xs text-slate-400 mt-1">Ampacity correction factors for installation method, ambient conditions, and cable grouping</p>
        </div>

        {/* Derating Factors Grid - by Installation Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Installation Method */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center">
              <span className="text-base mr-2">📍</span>Installation Method
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-green-400">
                <span className="text-slate-300">Air (Tray/Cleat)</span>
                <span className="text-green-400 font-bold">1.00</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-blue-400">
                <span className="text-slate-300">Duct (Conduit)</span>
                <span className="text-blue-400 font-bold">0.95</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-orange-400">
                <span className="text-slate-300">Trench (Ground)</span>
                <span className="text-orange-400 font-bold">0.90</span>
              </div>
            </div>
          </div>

          {/* Cable Grouping */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center">
              <span className="text-base mr-2">📦</span>Cable Grouping
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-green-400">
                <span className="text-slate-300">1 Circuit (Single)</span>
                <span className="text-green-400 font-bold">1.00</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-yellow-400">
                <span className="text-slate-300">2 Circuits</span>
                <span className="text-yellow-400 font-bold">0.90</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-orange-400">
                <span className="text-slate-300">3-4 Circuits</span>
                <span className="text-orange-400 font-bold">0.75-0.80</span>
              </div>
            </div>
          </div>

          {/* Soil Thermal Resistivity */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-bold text-teal-300 mb-3 flex items-center">
              <span className="text-base mr-2">🌍</span>Soil Thermal
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-green-400">
                <span className="text-slate-300">&lt;1 K·m/W</span>
                <span className="text-green-400 font-bold">1.00</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-yellow-400">
                <span className="text-slate-300">1-2 K·m/W</span>
                <span className="text-yellow-400 font-bold">0.90</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-red-400">
                <span className="text-slate-300">&gt;2 K·m/W</span>
                <span className="text-red-400 font-bold">0.80</span>
              </div>
            </div>
          </div>

          {/* Depth of Laying */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-bold text-indigo-300 mb-3 flex items-center">
              <span className="text-base mr-2">📐</span>Depth of Laying
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-green-400">
                <span className="text-slate-300">0.5 m</span>
                <span className="text-green-400 font-bold">1.00</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-yellow-400">
                <span className="text-slate-300">1.0 m</span>
                <span className="text-yellow-400 font-bold">0.96</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-800 rounded border-l-2 border-orange-400">
                <span className="text-slate-300">1.5 m</span>
                <span className="text-orange-400 font-bold">0.93</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Derating Example */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-600/50">
          <h4 className="text-sm font-bold text-yellow-300 mb-3">Combined Derating Factor Calculation</h4>
          <p className="text-xs text-slate-300 mb-3">
            Total derating factor (K_tot) = K_installation × K_grouping × K_soil_thermal × K_depth
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800 rounded p-3 border-l-2 border-green-400">
              <p className="text-slate-300 mb-1"><strong>Example 1: Air Installation</strong></p>
              <p className="text-slate-400">1.0 (Air) × 1.0 (Single) × 1.0 (Good soil) × 1.0 (0.5m) = <span className="text-green-400 font-bold">1.00</span></p>
            </div>
            <div className="bg-slate-800 rounded p-3 border-l-2 border-orange-400">
              <p className="text-slate-300 mb-1"><strong>Example 2: Underground Trench</strong></p>
              <p className="text-slate-400">0.9 (Trench) × 0.75 (4 cables) × 0.9 (Medium) × 0.93 (1.5m) = <span className="text-orange-400 font-bold">0.567</span></p>
            </div>
          </div>
        </div>

        {/* Reference Note */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded text-xs text-blue-300">
          <strong>📖 Standard Reference:</strong> These factors are as per IEC 60287 and are applied in the cable sizing engine to calculate derated ampacity for your specific installation conditions.
        </div>
      </div>
    </div>
  );
};

export default SizingTab;