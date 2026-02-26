import { createContext, useContext, useState, ReactNode } from 'react';
import { PathAnalysisResult, CableSegment, analyzeAllPaths } from '../utils/pathDiscoveryService';

interface PathContextType {
  pathAnalysis: PathAnalysisResult | null;
  setPathAnalysis: (analysis: PathAnalysisResult | null) => void;
  normalizedFeeders: CableSegment[] | null;
  setNormalizedFeeders: (feeders: CableSegment[] | null) => void;
  originalFeeders: CableSegment[] | null; // Store original for revert
  setOriginalFeeders: (feeders: CableSegment[] | null) => void;
  selectedPaths: Set<string>;
  togglePathSelection: (pathId: string) => void;
  clearSelection: () => void;
  updateFeeder: (cableNumber: string, updates: Partial<CableSegment>) => void;
  revertToOriginal: () => void;
  catalogueData: any;
  setCatalogueData: (data: any) => void;
}

const PathContext = createContext<PathContextType | undefined>(undefined);

export const PathProvider = ({ children }: { children: ReactNode }) => {
  const [pathAnalysis, setPathAnalysis] = useState<PathAnalysisResult | null>(null);
  const [normalizedFeeders, setNormalizedFeeders] = useState<CableSegment[] | null>(null);
  const [originalFeeders, setOriginalFeeders] = useState<CableSegment[] | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [catalogueData, setCatalogueData] = useState<any>(null);

  const togglePathSelection = (pathId: string) => {
    const newSelection = new Set(selectedPaths);
    if (newSelection.has(pathId)) {
      newSelection.delete(pathId);
    } else {
      newSelection.add(pathId);
    }
    setSelectedPaths(newSelection);
  };

  const clearSelection = () => {
    setSelectedPaths(new Set());
  };

  // Update a single feeder's fields and recompute path analysis
  const updateFeeder = (cableNumber: string, updates: Partial<CableSegment>) => {
    if (!normalizedFeeders) return;
    const updated = normalizedFeeders.map((f) =>
      f.cableNumber === cableNumber ? { ...f, ...updates } : f
    );
    setNormalizedFeeders(updated);

    try {
      // Re-run path discovery/voltage-drop analysis using the updated feeders and existing catalogue
      const analysis = analyzeAllPaths(updated, catalogueData);
      setPathAnalysis(analysis);
    } catch (err) {
      console.error('Failed to recompute path analysis after feeder update', err);
    }
  };

  // Revert to original uploaded feeders
  const revertToOriginal = () => {
    if (originalFeeders) {
      setNormalizedFeeders([...originalFeeders]);
    }
  };

  return (
    <PathContext.Provider
      value={{
        pathAnalysis,
        setPathAnalysis,
        normalizedFeeders,
        setNormalizedFeeders,
        originalFeeders,
        setOriginalFeeders,
        selectedPaths,
        togglePathSelection,
        clearSelection,
        updateFeeder,
        revertToOriginal,
        catalogueData,
        setCatalogueData
      }}
    >
      {children}
    </PathContext.Provider>
  );
};

export const usePathContext = () => {
  const context = useContext(PathContext);
  if (!context) {
    throw new Error('usePathContext must be used within PathProvider');
  }
  return context;
};
