import { useEffect, useState } from "react";
import Modal from "./Modal";

interface PatternSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    patternId: string,
    patternName: string,
    selectedImplementationId?: string,
    solutionId?: string
  ) => void;
}

export const PatternSelectionModal = ({
  open,
  onClose,
  onConfirm,
}: PatternSelectionModalProps) => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [selectedPatternName, setSelectedPatternName] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const [implementations, setImplementations] = useState<any[]>([]);
  const [selectedImplementationId, setSelectedImplementationId] = useState<string | null>(null);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [loadingImpl, setLoadingImpl] = useState(false);

  const qcAtlasEndpoint = "http://localhost:6626";

  // ---------- CATEGORY CONFIG ----------
  const manualCategoryMap: Record<string, string> = {
    "Initialization": "dataencodings",
    "Quantum Phase Estimation (QPE)": "programflow",
    "Warm Start": "warmstart",
    "Biased Initial State": "warmstart",
    "Pre-Trained Feature Extractor": "warmstart",
    "Variational Parameter Transfer": "warmstart",
    "Chained Optimization": "warmstart",
    "Grover": "programflow",
  };

  const getCategoryFromPattern = (pattern: any) => {
    const name = pattern.name?.trim();
    if (manualCategoryMap[name]) return manualCategoryMap[name];
    const tags = pattern.tags;
    if (!tags) return "uncategorized";
    const match = tags.match(/cat:([^\s]+)/);
    return match ? match[1] : "uncategorized";
  };

  const formatCategoryName = (cat: string) => {
    const prettyNames: Record<string, string> = {
      circuitcutting: "Circuit Cutting",
      dataencodings: "Data Encodings",
      errorhandling: "Error Handling",
      programflow: "Program Flow",
      warmstart: "Warm Start",
      uncategorized: "Uncategorized",
      qml: "Quantum Machine Learning",
      quantumstates: "Quantum States",
      unitarytransformations: "Unitary Transformations",
    };
    return prettyNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // ---------- FETCH PATTERNS ----------
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("http://localhost:1977/patternatlas/patternLanguages/af7780d5-1f97-4536-8da7-4194b093ab1d/patterns")
      .then((res) => res.json())
      .then((data) => {
        setPatterns(data._embedded?.patternModels || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  // ---------- FETCH IMPLEMENTATIONS ----------
  const fetchImplementations = async (patternId: string) => {
    setLoadingImpl(true);
    setImplementations([]);
    setSelectedImplementationId(null);
    setSelectedSolutionId(null);

    try {
      // Fetch all implementations
      let allImpl: any[] = [];
      let page = 0;
      let last = false;
      while (!last) {
        const res = await fetch(`${qcAtlasEndpoint}/atlas/implementations?page=${page}&size=20`);
        const data = await res.json();
        allImpl = allImpl.concat(data.content);
        last = data.last;
        page++;
      }

      // Filter implementations that contain this pattern and have low-code solution
      const implWithLowCode: any[] = [];
      for (const impl of allImpl) {
        if (!impl.patterns.some((p: string) => p.endsWith(patternId))) continue;
        if (!impl.name?.toLowerCase().includes("low")) continue;

        // Check implementation packages
        const pkgRes = await fetch(
          `${qcAtlasEndpoint}/atlas/algorithms/${impl.implementedAlgorithmId}/implementations/${impl.id}/implementation-packages/`
        );
        const pkgData = await pkgRes.json();
        if (pkgData.content?.length > 0) {
          // Filter packages that contain "code" in their type or name
          const codePackages = pkgData.content.filter(
            (pkg: any) =>
              pkg.name?.toLowerCase().includes("code")
          );
          console.log(codePackages)

          if (codePackages.length > 0) {
            // Store all matching package ids
            impl.solutionIds = codePackages.map((pkg: any) => pkg.id);
            implWithLowCode.push(impl);
          }
        }
      }

      setImplementations(implWithLowCode);
      console.log(implWithLowCode.length>0)
      if(implWithLowCode.length>0){
        console.log(implWithLowCode)
        setSelectedImplementationId(implWithLowCode[0].solutionIds[0]);
        console.log(selectedImplementationId)
      }
    } catch (err) {
      console.error("Error fetching implementations:", err);
    } finally {
      setLoadingImpl(false);
    }
  };

  // ---------- GROUP & SORT ----------
  const groupedPatterns = patterns.reduce((acc: Record<string, any[]>, pattern) => {
    const category = getCategoryFromPattern(pattern);
    if (!acc[category]) acc[category] = [];
    acc[category].push(pattern);
    return acc;
  }, {});

  Object.keys(groupedPatterns).forEach((category) => {
    groupedPatterns[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  const sortedCategories = Object.keys(groupedPatterns).sort((a, b) =>
    formatCategoryName(a).localeCompare(formatCategoryName(b))
  );

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // ---------- RENDER ----------
  return (
    <Modal
      title="Select Pattern"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button
            className={`btn ${selectedPatternId ? "btn-primary" : "btn-secondary"}`}
            disabled={!selectedPatternId}
            onClick={() =>
              selectedPatternId &&
              selectedPatternName &&
              onConfirm(selectedPatternId, selectedPatternName, selectedImplementationId || undefined, selectedSolutionId || undefined)
            }
          >
            Select Pattern
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p>Select the pattern to which the current solution should be uploaded.</p>

        {loading && <p>Loading patterns...</p>}
        {!loading && patterns.length === 0 && <p className="text-gray-500">No patterns available.</p>}

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {sortedCategories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category)}
                className="flex justify-between items-center cursor-pointer bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 transition"
              >
                <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                  {formatCategoryName(category)}
                </h3>
                <span className="text-xs">
                  {collapsedCategories[category] ? "▶" : "▼"}
                </span>
              </div>

              {/* Category Content */}
              {!collapsedCategories[category] && (
                <div className="space-y-2 mt-2">
                  {groupedPatterns[category].map((pattern) => {
                    const isSelected = selectedPatternId === pattern.id;
                    return (
                      <div
                        key={pattern.id}
                        onClick={() => {
                          setSelectedPatternId(pattern.id);
                          setSelectedPatternName(pattern.name);
                          fetchImplementations(pattern.id);
                        }}
                        className={`flex items-center space-x-3 border rounded px-3 py-2 cursor-pointer transition
                          ${isSelected ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedPatternId(pattern.id);
                            setSelectedPatternName(pattern.name);
                            fetchImplementations(pattern.id);
                          }}
                        />
                        {pattern.iconUrl && (
                          <img src={pattern.iconUrl} alt={pattern.name} className="w-8 h-8 object-contain" />
                        )}
                        <span className="font-medium">{pattern.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ---------- EXISTING IMPLEMENTATIONS ---------- */}
        {selectedPatternId && implementations.length > 0 && (
          <div className="mt-4 p-3 border rounded bg-yellow-50">
            <p className="font-semibold text-yellow-800 mb-2">
              ⚠️ This pattern already has low-code implementations. Select one to overwrite or leave empty to add new:
            </p>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {implementations.map((impl) => (
                <div
                  key={impl.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-yellow-100 rounded p-1"
                  onClick={() => {
                    setSelectedImplementationId(impl.id);
                    console.log(impl.id)
                      console.log(impl.solutionIds)
                    setSelectedSolutionId(impl.solutionIds[0]);
                  }}
                >
                  <input
                    type="radio"
                    checked={selectedImplementationId === impl.id}
                    onChange={() => {
                      setSelectedImplementationId(impl.id);
                      console.log(impl.id)
                      console.log(impl.solutionIds)
                      setSelectedSolutionId(impl.solutionId[0]);
                    }}
                  />
                  <span>{impl.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingImpl && <p>Loading existing implementations...</p>}
      </div>
    </Modal>
  );
};
