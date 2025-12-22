import { useState } from "react";
import Modal from "./Modal";
import { PatternGraphModal, PatternRef } from "./patternGraphModal";

export interface AlgorithmItem {
  id: string;
  name: string;
  description: string;
  patternGraphPng?: string;
  patterns?: PatternRef[];
}

interface DetectAlgorithmModalProps {
  open: boolean;
  onClose: () => void;

  classicalAlgorithms: AlgorithmItem[];
  quantumAlgorithms: AlgorithmItem[];

  onSelectAlgorithm: (algorithm: AlgorithmItem, type: "classical" | "quantum") => void;
  patternAtlasPluginEndpoint: string;
}


export const DetectAlgorithmModal = ({
  open,
  onClose,
  classicalAlgorithms,
  quantumAlgorithms,
  onSelectAlgorithm,
  patternAtlasPluginEndpoint,
}: DetectAlgorithmModalProps) => {
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmItem | null>(null);

  const handleViewPatternGraph = (algorithm: AlgorithmItem) => {
    setSelectedAlgorithm(algorithm);
    setGraphModalOpen(true);
  };

  return (
    <>
      <Modal
        title="Detect Algorithm"
        open={open}
        onClose={onClose}
        className="w-[950px] max-w-[95vw]"
        footer={
          <div className="flex justify-end">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-8">

          <div>
            <h3 className="text-lg font-semibold mb-2">Quantum Algorithms</h3>
            <table className="min-w-full table-auto border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quantumAlgorithms.map((algo) => (
                  <tr key={algo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{algo.name}</td>
                    <td className="px-4 py-2 border">{algo.description}</td>
                    <td className="px-4 py-2 border">
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => onSelectAlgorithm(algo, "quantum")}
                        >
                          Select
                        </button>

                        <button
                          className="btn btn-secondary"
                          onClick={() => handleViewPatternGraph(algo)}
                          disabled={!algo.patternGraphPng}
                        >
                          View Pattern Graph
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </Modal>

      <PatternGraphModal
        open={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        imageUrl={selectedAlgorithm?.patternGraphPng ?? null}
        title={selectedAlgorithm?.name}
        patterns={selectedAlgorithm?.patterns ?? []}
        patternAtlasPluginEndpoint={patternAtlasPluginEndpoint}
      />
    </>
  );
};
