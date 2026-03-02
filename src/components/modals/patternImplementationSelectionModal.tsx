import { useEffect, useState } from "react";
import Modal from "./Modal";

interface PatternSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    patternId: string,
    patternName: string,
    solutionJson: any
  ) => void;
}

export const PatternImplementationSelectionModal = ({
  open,
  onClose,
  onConfirm,
}: PatternSelectionModalProps) => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const [selectedPattern, setSelectedPattern] = useState<any>(null);
  const [selectedSolution, setSelectedSolution] = useState<any>(null);

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

  // ---------- FETCH PATTERNS WITH LOW-CODE ----------
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch patterns
        const patternRes = await fetch(
          "http://localhost:1977/patternatlas/patternLanguages/af7780d5-1f97-4536-8da7-4194b093ab1d/patterns"
        );
        const patternData = await patternRes.json();
        const allPatterns = patternData._embedded?.patternModels || [];

        // Fetch implementations
        let allImpl: any[] = [];
        let page = 0;
        let last = false;

        while (!last) {
          const res = await fetch(
            `${qcAtlasEndpoint}/atlas/implementations?page=${page}&size=20`
          );
          const data = await res.json();
          allImpl = allImpl.concat(data.content);
          last = data.last;
          page++;
        }

        const patternSolutionMap = new Map<string, any[]>();

        for (const impl of allImpl) {
          const pkgRes = await fetch(
            `${qcAtlasEndpoint}/atlas/algorithms/${impl.implementedAlgorithmId}/implementations/${impl.id}/implementation-packages/`
          );
          const pkgData = await pkgRes.json();

          const codePackages = pkgData.content?.filter((pkg: any) =>
            pkg.name?.toLowerCase().includes("code")
          );

          if (!codePackages?.length) continue;

          for (const patternRef of impl.patterns || []) {
            const patternId = patternRef.split("/").pop();

            if (!patternSolutionMap.has(patternId)) {
              patternSolutionMap.set(patternId, []);
            }

            for (const pkg of codePackages) {
              patternSolutionMap.get(patternId)?.push({
                implementationId: impl.id,
                implementedAlgorithmId: impl.implementedAlgorithmId,
                solutionId: pkg.id,
                name: impl.name,
              });
            }
          }
        }

        // Filter patterns
        const filtered = allPatterns
          .filter((pattern: any) => patternSolutionMap.has(pattern.id))
          .map((pattern: any) => ({
            ...pattern,
            solutions: patternSolutionMap.get(pattern.id),
          }));

        setPatterns(filtered);
      } catch (err) {
        console.error("Error fetching patterns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // ---------- GROUP & SORT ----------
  const groupedPatterns = patterns.reduce((acc: Record<string, any[]>, pattern) => {
    const category = getCategoryFromPattern(pattern);
    if (!acc[category]) acc[category] = [];
    acc[category].push(pattern);
    return acc;
  }, {});

  Object.keys(groupedPatterns).forEach((category) => {
    groupedPatterns[category].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  });

  const sortedCategories = Object.keys(groupedPatterns).sort((a, b) =>
    formatCategoryName(a).localeCompare(formatCategoryName(b))
  );

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // ---------- CONFIRM ----------
  const handleConfirm = async () => {
    if (!selectedPattern || !selectedSolution) return;

    const { implementationId, implementedAlgorithmId, solutionId } =
      selectedSolution;

    const res = await fetch(
      `${qcAtlasEndpoint}/atlas/algorithms/${implementedAlgorithmId}/implementations/${implementationId}/implementation-packages/${solutionId}/file/content`
    );

    const json = await res.json();

    onConfirm(selectedPattern.id, selectedPattern.name, json);
  };

  // ---------- RENDER ----------
  return (
    <Modal
      title="Select Existing Low-Code Solution"
      open={open}
      onClose={onClose}
      footer={
  <div className="flex justify-end space-x-2">
    <button
      onClick={handleConfirm}
      disabled={!selectedSolution}
      className={`px-4 py-2 rounded text-white transition
        ${
          selectedSolution
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
    >
      Open Solution
    </button>

    <button
      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
      onClick={onClose}
    >
      Cancel
    </button>
  </div>
}

    >
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {loading && <p>Loading patterns...</p>}

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

            {!collapsedCategories[category] && (
              <div className="space-y-2 mt-2">
                {groupedPatterns[category].map((pattern) => {
                  const isSelected = selectedPattern?.id === pattern.id;

                  return (
                    <div key={pattern.id}>
                      <div
                        onClick={() => {
                          setSelectedPattern(pattern);
                          setSelectedSolution(null);
                        }}
                        className={`flex items-center space-x-3 border rounded px-3 py-2 cursor-pointer transition
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pattern.iconUrl && (
                          <img
                            src={pattern.iconUrl}
                            alt={pattern.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="font-medium">
                          {pattern.name}
                        </span>
                      </div>

                      {/* Solutions */}
                      {isSelected && (
                        <div className="ml-10 mt-2 space-y-2">
                          {pattern.solutions.map((solution: any) => (
                            <div
                              key={solution.solutionId}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => setSelectedSolution(solution)}
                            >
                              <input
                                type="radio"
                                checked={
                                  selectedSolution?.solutionId ===
                                  solution.solutionId
                                }
                                onChange={() =>
                                  setSelectedSolution(solution)
                                }
                              />
                              <span>{solution.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {!loading && patterns.length === 0 && (
          <p className="text-gray-500">
            No patterns with low-code solutions found.
          </p>
        )}
      </div>
    </Modal>
  );
};
