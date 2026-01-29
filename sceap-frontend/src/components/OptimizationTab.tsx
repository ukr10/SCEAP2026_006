import { useState } from 'react';
import { Search, ArrowRight, Network, AlertCircle, CheckCircle } from 'lucide-react';
import { usePathContext } from '../context/PathContext';

const OptimizationTab = () => {
  const { pathAnalysis } = usePathContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Use real paths from analysis
  const paths = pathAnalysis?.paths || [];

  if (paths.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={32} />
          <h3 className="text-yellow-200 font-semibold mb-2">No Paths Discovered Yet</h3>
          <p className="text-yellow-300 text-sm mb-4">
            Upload your feeder list Excel file in the <strong>Sizing</strong> tab to discover cable paths.
          </p>
          <p className="text-yellow-300/70 text-xs">
            The system will automatically analyze the hierarchical structure (Transformer → Panels → Loads) and create path chains for cable sizing and voltage drop calculations.
          </p>
        </div>
      </div>
    );
  }

  const filteredPaths = paths.filter(path =>
    path.startEquipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.endTransformer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.cables.some(c => c.cableNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Network className="mr-2" size={20} />
            Cable Path Optimization & Sizing
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment, bus, or cable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-cyan-400">{paths.length}</p>
            <p className="text-slate-400">Total Paths</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-green-400">
              {paths.filter(p => p.isValid).length}
            </p>
            <p className="text-slate-400">Valid Paths</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-red-400">
              {paths.filter(p => !p.isValid).length}
            </p>
            <p className="text-slate-400">Invalid Paths</p>
          </div>
          <div className="text-center bg-slate-700/50 rounded p-3">
            <p className="text-2xl font-bold text-yellow-400">
              {pathAnalysis ? pathAnalysis.averageVoltageDrop.toFixed(2) : '0'}%
            </p>
            <p className="text-slate-400">Avg V-Drop</p>
          </div>
        </div>
      </div>

      {/* Paths List */}
      <div className="space-y-4">
        {filteredPaths.map((path) => (
          <div
            key={path.pathId}
            className={`bg-slate-800 rounded-lg border p-6 cursor-pointer transition-all ${
              selectedPath === path.pathId ? 'border-cyan-400 bg-slate-700' : 'border-slate-700 hover:border-slate-600'
            } ${!path.isValid ? 'opacity-75' : ''}`}
            onClick={() => setSelectedPath(selectedPath === path.pathId ? null : path.pathId)}
          >
            {/* Path Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-semibold">{path.pathId}</h4>
                <p className="text-slate-400 text-sm mb-1">
                  {path.startEquipment} → {path.endTransformer}
                </p>
                {path.startEquipmentDescription && (
                  <p className="text-cyan-300 text-xs">
                    📋 {path.startEquipmentDescription}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  path.isValid
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {path.isValid ? '✓ VALID' : '⚠️ INVALID'}
                </span>
              </div>
            </div>

            {/* Path Chain Visualization */}
            <div className="mb-4 p-4 bg-slate-900/50 rounded overflow-x-auto">
              <div className="flex items-center gap-2 whitespace-nowrap text-xs">
                {/* Start Equipment */}
                <div className="px-3 py-1 bg-green-900/50 border border-green-500 rounded text-white font-medium min-w-max">
                  <div>{path.startEquipment}</div>
                  <div className="text-slate-300 text-xs">{path.startEquipmentDescription}</div>
                </div>
                
                {/* Cable chain path */}
                {path.cables.map((cable, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <ArrowRight className="text-cyan-400 flex-shrink-0" size={16} />
                    <div className="px-3 py-1 bg-blue-900/50 border border-blue-500 rounded text-white min-w-max">
                      <div className="font-medium">{cable.toBus}</div>
                      <div className="text-slate-300 text-xs">{cable.cableNumber}</div>
                    </div>
                  </div>
                ))}
                
                {/* Transformer endpoint - only show once */}
                {path.cables.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ArrowRight className="text-cyan-400 flex-shrink-0" size={16} />
                    <div className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-white font-medium min-w-max">
                      {path.endTransformer}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Path Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-700/50 rounded p-3">
                <p className="text-slate-400 text-xs">Cables in Path</p>
                <p className="text-cyan-400 font-semibold">{path.cables.length}</p>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <p className="text-slate-400 text-xs">Total Distance</p>
                <p className="text-cyan-400 font-semibold">{path.totalDistance.toFixed(1)}m</p>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <p className="text-slate-400 text-xs">Voltage</p>
                <p className="text-cyan-400 font-semibold">{path.totalVoltage}V</p>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <p className="text-slate-400 text-xs">Load</p>
                <p className="text-cyan-400 font-semibold">{path.cumulativeLoad.toFixed(1)}kW</p>
              </div>
            </div>

            {/* Voltage Drop Info */}
            <div className={`p-3 rounded ${
              path.isValid
                ? 'bg-green-900/20 border border-green-600'
                : 'bg-red-900/20 border border-red-600'
            }`}>
              <p className={`font-semibold text-sm ${path.isValid ? 'text-green-300' : 'text-red-300'}`}>
                Voltage Drop: {path.voltageDropPercent.toFixed(2)}% {path.isValid ? '✓' : '✗'}
              </p>
              <p className={`text-xs mt-1 ${path.isValid ? 'text-green-300/80' : 'text-red-300/80'}`}>
                {path.validationMessage}
              </p>
            </div>

            {/* Expanded Cable Details */}
            {selectedPath === path.pathId && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h5 className="text-white font-medium mb-3">Cable Details (Step by Step)</h5>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {path.cables.map((cable, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded p-3 text-sm border-l-4 border-cyan-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-white font-bold text-base">Step {idx + 1}:</span>
                          <span className="text-cyan-300 font-medium ml-2">{cable.cableNumber}</span>
                        </div>
                        <span className="text-slate-400 text-xs">#{cable.serialNo}</span>
                      </div>
                      {cable.feederDescription && (
                        <p className="text-yellow-300 text-xs mb-2 italic">
                          📋 {cable.feederDescription}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <p>From Bus: <span className="text-cyan-300 font-medium">{cable.fromBus}</span></p>
                        <p>To Bus: <span className="text-cyan-300 font-medium">{cable.toBus}</span></p>
                        <p>Length: <span className="text-green-300">{cable.length}m</span></p>
                        <p>Load: <span className="text-green-300">{cable.loadKW}kW</span></p>
                        <p>Voltage: <span className="text-green-300">{cable.voltage}V</span></p>
                        <p>Derating: <span className="text-orange-300">{(cable.deratingFactor * 100).toFixed(0)}%</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <div className="flex gap-3">
          <CheckCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">How to use this page:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• Each path represents a complete cable chain from a load back to the transformer</li>
              <li>• Red ✗ paths exceed voltage drop limits (&gt;5%) - they need larger cable sizes</li>
              <li>• Green ✓ paths are within safe voltage drop limits</li>
              <li>• Use this information to select optimal cable sizes for your system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationTab;