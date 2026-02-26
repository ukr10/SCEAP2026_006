import { useState } from 'react';
import { Search, ArrowRight, Network, AlertCircle, CheckCircle } from 'lucide-react';
import { usePathContext } from '../context/PathContext';

const OptimizationTab = () => {
  const { pathAnalysis } = usePathContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedCable, setExpandedCable] = useState<{ pathId: string; idx: number } | null>(null);

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

            {/* Path Chain Visualization - COMPLETE HIERARCHICAL SEQUENCE */}
            <div className="mb-4 p-4 bg-slate-900/50 rounded overflow-x-auto">
              <div className="flex items-center gap-1 whitespace-nowrap text-xs">
                {/* Start Equipment / Load */}
                <div className="px-3 py-2 bg-green-900/60 border-2 border-green-400 rounded-lg text-white font-bold min-w-max shadow-lg">
                  <div className="text-sm">🔌 {path.startEquipment}</div>
                  <div className="text-slate-200 text-xs mt-0.5">{path.startEquipmentDescription || 'Load'}</div>
                </div>
                
                {/* Complete cable chain with all intermediate stops */}
                {path.cables && path.cables.length > 0 ? (
                  <>
                    {path.cables.map((cable, idx) => {
                      const detail = path.voltageDropDetails?.[idx];
                      const isExpanded = expandedCable && expandedCable.pathId === path.pathId && expandedCable.idx === idx;
                      return (
                        <div key={idx} className="flex items-start gap-3 w-full">
                          {/* Arrow + Bus card */}
                          <div className="flex items-center gap-1 flex-1">
                            <div className="flex flex-col items-center justify-center px-2">
                              <ArrowRight className="text-cyan-400 flex-shrink-0" size={18} />
                              <span className="text-cyan-300 text-xs font-bold mt-1 whitespace-nowrap">
                                {cable.parallelCount && cable.parallelCount > 1
                                  ? `${cable.originalCables?.join(', ')} (${cable.parallelCount} runs)`
                                  : cable.cableNumber}
                              </span>
                              <span className="text-slate-400 text-xs">({cable.length.toFixed(1)}m)</span>
                            </div>

                            <div onClick={() => setExpandedCable(isExpanded ? null : { pathId: path.pathId, idx })} className={`px-3 py-2 rounded-lg text-white min-w-max border-2 font-semibold shadow-lg cursor-pointer ${
                              idx === path.cables.length - 1 
                                ? 'bg-purple-900/60 border-purple-400' 
                                : 'bg-blue-900/60 border-blue-400'
                            }`}>
                              <div className="text-sm">{cable.toBus}</div>
                              {cable.feederDescription && (
                                <div className="text-slate-200 text-xs mt-0.5">{cable.feederDescription}</div>
                              )}
                            </div>
                          </div>

                          {/* Adjacent white calculation box (shows to the right of the cable card) */}
                          <div className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-60'} min-w-[320px] max-w-md`}> 
                            {detail ? (
                              <div className="bg-white/7 border border-white/20 rounded p-3 text-sm text-slate-200">
                                <div className="flex justify-between items-center">
                                  <div className="font-semibold text-cyan-200">Step {idx + 1}: {cable.cableNumber}</div>
                                  <div className="text-xs text-slate-400">#{cable.serialNo}</div>
                                </div>
                                <div className="mt-2 text-xs grid grid-cols-2 gap-2 text-slate-300">
                                  <div>Size: <span className="text-green-300 font-bold">{detail.size} mm²</span></div>
                                  <div>R (90°C): <span className="text-green-300">{detail.resistance.toFixed(4)} Ω/km</span></div>
                                  <div>Running I: <span className="text-green-300">{detail.current.toFixed(2)} A</span></div>
                                  <div>Derated I: <span className="text-green-300">{detail.deratedCurrent.toFixed(2)} A</span></div>
                                  <div>Length: <span className="text-green-300">{cable.length} m</span></div>
                                  <div>Runs: <span className="text-green-300">{detail.numberOfRuns ?? 1}</span></div>
                                </div>
                                <div className="mt-2 border-t border-white/10 pt-2 text-xs text-yellow-300 font-mono">{detail.formula}</div>
                                <div className="mt-2 border-t border-white/10 pt-2 text-sm text-green-300 font-semibold">Individual Drop: {detail.drop.toFixed(3)} V <span className="text-slate-400 text-xs ml-2">(Limit 5%)</span></div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic">No calculation available</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Transformer endpoint */}
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col items-center justify-center px-2">
                        <ArrowRight className="text-red-400 flex-shrink-0" size={18} />
                        <span className="text-red-300 text-xs font-bold mt-1">FINAL</span>
                      </div>
                      <div className="px-3 py-2 bg-red-900/60 border-2 border-red-400 rounded-lg text-white font-bold min-w-max shadow-lg">
                        <div className="text-sm">⚡ {path.endTransformer}</div>
                        <div className="text-slate-200 text-xs mt-0.5">Power Source</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 italic">No cable path found</div>
                )}
              </div>
              
              {/* COMPLETE PATH SUMMARY - Show order of hierarchy */}
              {path.cables && path.cables.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-300">
                  <span className="font-bold text-cyan-300">Complete Sequence: </span>
                  {path.startEquipment} 
                  {path.cables.map(c => ` → ${c.toBus}`).join('')}
                  {` → ${path.endTransformer}`}
                </div>
              )}
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
              path.voltageDropPercent > 5
                ? 'bg-red-900/20 border border-red-600'
                : 'bg-green-900/20 border border-green-600'
            }`}>
              <p className={`font-semibold text-sm ${path.voltageDropPercent > 5 ? 'text-red-300' : 'text-green-300'}`}>
                Voltage Drop: {path.voltageDrop.toFixed(3)} V ({path.voltageDropPercent.toFixed(2)}%) {path.voltageDropPercent > 5 ? '✗' : '✓'}
              </p>
              <p className={`text-xs mt-1 ${path.voltageDropPercent > 5 ? 'text-red-300/80' : 'text-green-300/80'}`}>
                {path.voltageDropPercent > 5
                  ? `⚠ Exceeds 5% limit — Voltage drop is ${path.voltageDropPercent.toFixed(2)}%, optimize cable sizing`
                  : `✓ V-drop ${path.voltageDropPercent.toFixed(2)}% (IEC 60364 Compliant)`}
              </p>
            </div>

            {/* Expanded Cable Details with calculation boxes */}
            {selectedPath === path.pathId && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h5 className="text-white font-medium mb-3">Cable Voltage Drop Calculations</h5>
                <div className="space-y-3">
                  {path.cables.map((cable, idx) => {
                    const detail = path.voltageDropDetails?.[idx];
                    return (
                      <div key={idx} className="bg-slate-700/50 rounded p-4 text-sm border-l-4 border-cyan-500 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-bold text-base">Step {idx + 1}: </span>
                            <span className="text-cyan-300 font-medium">{cable.cableNumber}</span>
                          </div>
                          <span className="text-slate-400 text-xs">#{cable.serialNo}</span>
                        </div>
                        {cable.feederDescription && (
                          <p className="text-yellow-300 text-xs italic">📋 {cable.feederDescription}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2">
                          <p>From: <span className="text-cyan-300 font-medium">{cable.fromBus}</span></p>
                          <p>To: <span className="text-cyan-300 font-medium">{cable.toBus}</span></p>
                          <p>Length: <span className="text-green-300">{cable.length}m</span></p>
                          <p>Load: <span className="text-green-300">{cable.loadKW}kW</span></p>
                          <p>Voltage: <span className="text-green-300">{cable.voltage}V</span></p>
                          <p>PF: <span className="text-green-300">{(cable.powerFactor || 0.85).toFixed(2)}</span></p>
                        </div>
                        {/* White calculation box */}
                        {detail && (
                          <div className="bg-white/10 border border-white/20 rounded p-3 mt-2 space-y-1">
                            <div className="text-cyan-200 font-semibold mb-2">Voltage Drop Calculation</div>
                            <div className="text-slate-200 text-xs space-y-1">
                              <div><strong>Cable Size:</strong> {detail.size}mm²</div>
                              <div><strong>Resistance (90°C):</strong> {detail.resistance.toFixed(3)}Ω/km</div>
                              <div><strong>Current (Running):</strong> {detail.current.toFixed(2)}A</div>
                              <div><strong>Derated Current:</strong> {detail.deratedCurrent.toFixed(2)}A</div>
                              <div><strong>Length:</strong> {cable.length}m</div>
                              <div className="pt-1 border-t border-white/20 mt-1">
                                <div className="italic text-yellow-300">{detail.formula}</div>
                              </div>
                              <div className="pt-1 border-t border-white/20 mt-1">
                                <strong className="text-green-300">Individual Drop: {detail.drop.toFixed(3)}V</strong>
                              </div>
                              {(detail.numberOfRuns ?? 1) > 1 && (
                                <div className="text-orange-300 text-xs pt-1">
                                  <strong>Parallel Runs:</strong> {detail.numberOfRuns} × {detail.sizePerRun}mm² (since {detail.size}mm² exceeds single cable limit)
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="bg-slate-700/70 rounded p-3 mt-2 border border-cyan-400/40">
                    <div className="text-white font-semibold">Path Total</div>
                    <div className="text-cyan-300 text-sm mt-1">Total Voltage Drop = Sum of all cable drops = <strong>{path.voltageDrop.toFixed(3)}V ({path.voltageDropPercent.toFixed(2)}%)</strong></div>
                  </div>
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