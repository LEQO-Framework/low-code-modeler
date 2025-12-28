import { useState } from "react";
import Modal from "./Modal";
import { testDiagram } from "@/config/site";

const ALGORITHM_PATTERNS = {
  "Quantum Approximate Optimization Algorithm (QAOA)": [
    { name: "Pattern", url: "" },
    { name: "Variational Quantum Algorithm (VQA)", url: "patterns/qaoa_mixer.png" },
    { name: "Uniform Superposition", url: "patterns/qaoa_cost.png" },
    { name: "Alternating Operator Ansatz (AOA)", url: "patterns/qaoa_mixer.png" },
    { name: "Phase Shift", url: "patterns/qaoa_mixer.png" },
  ],
  "Variational Quantum Eigensolver (VQE)": [
    { name: "Pattern", url: "" },
    { name: "Ansatz Pattern", url: "patterns/vqe_ansatz.png" },
    { name: "Measurement Pattern", url: "patterns/vqe_measure.png" },
  ],
};

export default function AiModal({
  quantumAlgorithmModalStep,
  quantumAlgorithms,
  handleQuantumAlgorithmModalClose,
  setQuantumAlgorithmModalStep,
  loadFlow,
}) {
  const [patternGraph, setPatternGraph] = useState(null);
  const [selectedAlgoName, setSelectedAlgoName] = useState("");

  const patterns =
    selectedAlgoName && patternGraph
      ? (ALGORITHM_PATTERNS[selectedAlgoName] || []).map((p, i) =>
          i === 0 ? { ...p, url: patternGraph, name: "Pattern" } : p
        )
      : [];

  return (
    <>
      {/* STEP 1 */}
      {quantumAlgorithmModalStep === 1 && (
        <Modal
          title="Determine Algorithm (1/2)"
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button className="btn btn-primary" onClick={handleQuantumAlgorithmModalClose}>
                Find Algorithms
              </button>
              <button className="btn btn-secondary" onClick={() => setQuantumAlgorithmModalStep(0)}>
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p>In this step, you describe the problem you'd like to solve using a quantum computer.</p>
            <p>
              The system uses semantic search powered by OpenAPI to match your problem with relevant
              quantum algorithms, which may incur usage costs.
            </p>
          </div>
        </Modal>
      )}

      {/* STEP 2 — TABLE */}
      {quantumAlgorithmModalStep === 2 && (
        <Modal
          title="Determine Algorithm (2/2)"
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end">
              <button className="btn btn-secondary" onClick={() => setQuantumAlgorithmModalStep(0)}>
                Back
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="table-auto w-full border border-gray-300 rounded-md">
              <caption className="text-left p-2 font-semibold">Quantum Algorithms</caption>
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {quantumAlgorithms.map((algo) => (
                  <tr key={algo.name} className="hover:bg-gray-50">
                    <td className="p-2 border">{algo.name}</td>
                    <td className="p-2 border">
                      <div className="flex space-x-2">
                        <button className="btn btn-primary" onClick={() => {handleQuantumAlgorithmModalClose(); loadFlow(testDiagram)}}>
                          Select
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setPatternGraph(algo.patternGraphPng);
                            setSelectedAlgoName(algo.name);
                            setQuantumAlgorithmModalStep(3);
                          }}
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
        </Modal>
      )}

      {/* STEP 3 — scrollable pattern graph modal */}
      {quantumAlgorithmModalStep === 3 && (
        <Modal
          title={`Pattern Graph of ${selectedAlgoName}`}
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPatternGraph(null);
                  setSelectedAlgoName("");
                  setQuantumAlgorithmModalStep(2);
                }}
              >
                Back
              </button>
            </div>
          }
        >
          {/* Scrollable container for all content */}
          <div className="overflow-auto max-h-[70vh] p-2">
            {/* Centered main image */}
            <div className="flex justify-center mb-4">
              <img
                src={patternGraph}
                alt={`Pattern graph of ${selectedAlgoName}`}
                className="w-1/2 rounded"
              />
            </div>

            {/* Contained Patterns Table */}
            {patterns.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Contained Patterns:</h4>
                <table className="table-auto w-full border border-gray-300 rounded-md">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">Icon</th>
                      <th className="p-2 border">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((p) => (
                      <tr key={p.name} className="hover:bg-gray-50">
                        <td className="p-2 border w-16">
                          <img src={p.url} alt={p.name} className="w-12 h-12 object-contain" />
                        </td>
                        <td className="p-2 border">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {p.name}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
