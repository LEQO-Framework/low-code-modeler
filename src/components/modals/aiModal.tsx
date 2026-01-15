import { useState } from "react";
import Modal from "./Modal";
import { testDiagram } from "@/config/site";

const ALGORITHM_PATTERNS = {
  "Quantum Approximate Optimization Algorithm (QAOA)": [
    { name: "Quantum Approximate Optimization Algorithm (QAOA)", url: "patterns/qaoaPattern.png" },
    { name: "Variational Quantum Algorithm (VQA)", url: "patterns/vqa.png" },
    { name: "Uniform Superposition", url: "patterns/uniformSuperposition.png" },
    { name: "Alternating Operator Ansatz (AOA)", url: "patterns/aoa.png" },
    { name: "Phase Shift", url: "patterns/phaseshift.png" }
  ],

  "Variational Quantum Eigensolver (VQE)": [
    { name: "VQE", url: "patterns/vqe.png" },
    { name: "Ansatz Pattern", url: "patterns/vqe_ansatz.png" },
    { name: "Measurement Pattern", url: "patterns/vqe_measure.png" }
  ],

  "SWAP Test": [
    { name: "SWAP Test Pattern", url: "patterns/swap_test.png" },
    { name: "Entanglement Pattern", url: "patterns/entanglement.png" },
    { name: "Measurement Pattern", url: "patterns/swap_measure.png" }
  ],

  "Hadamard Test": [
    { name: "Hadamard Test Pattern", url: "patterns/hadamard_test.png" },
    { name: "Controlled Operation Pattern", url: "patterns/controlled_unitary.png" },
    { name: "Measurement Pattern", url: "patterns/hadamard_measure.png" }
  ],

  "Grover's Algorithm": [
    { name: "Grover Pattern", url: "patterns/grover.png" },
    { name: "Oracle Pattern", url: "patterns/oracle.png" },
    { name: "Amplitude Amplification", url: "patterns/amplitude_amplification.png" },
    { name: "Uniform Superposition", url: "patterns/uniformSuperposition.png" }
  ],

  "Quantum Phase Estimation (QPE)": [
    { name: "QPE Pattern", url: "patterns/qpe.png" },
    { name: "Quantum Fourier Transform (QFT)", url: "patterns/qft.png" },
    { name: "Controlled Unitary", url: "patterns/controlled_unitary.png" },
    { name: "Measurement Pattern", url: "patterns/qpe_measure.png" }
  ],

  "Quantum Fourier Transform (QFT)": [
    { name: "QFT Pattern", url: "patterns/qft.png" },
    { name: "Phase Rotation", url: "patterns/phase_rotation.png" },
    { name: "SWAP Network", url: "patterns/swap_network.png" }
  ],

  "Quantum Classification": [
    { name: "Quantum Classification Pattern", url: "patterns/quantum_classification.png" },
    { name: "Feature Map Encoding", url: "patterns/feature_map.png" },
    { name: "Variational Ansatz", url: "patterns/variational_ansatz.png" },
    { name: "Measurement Pattern", url: "patterns/measurement.png" }
  ],

  "Quantum Clustering": [
    { name: "Quantum Clustering Pattern", url: "patterns/quantum_clustering.png" },
    { name: "Distance Estimation", url: "patterns/distance_estimation.png" },
    { name: "SWAP Test", url: "patterns/swap_test.png" }
  ],

  "Data Encoding": [
    { name: "Amplitude Encoding", url: "patterns/amplitude_encoding.png" },
    { name: "Angle Encoding", url: "patterns/angle_encoding.png" },
    { name: "Basis Encoding", url: "patterns/basis_encoding.png" },
    { name: "Matrix Encoding", url: "patterns/matrix_encoding.png" }
  ],

  "Initialization": [
    { name: "Initialization", url: "patterns/initialization.png" },
    { name: "Uniform Superposition", url: "patterns/uniformSuperposition.png" },
    { name: "Creating Entanglement", url: "patterns/entanglement.png" }
  ],
  "Creating Entanglement": [
    { name: "Initialization", url: "patterns/initialization.png" },
    { name: "Uniform Superposition", url: "patterns/uniformSuperposition.png" },
    { name: "Creating Entanglement", url: "patterns/entanglement.png" }
  ],

  "Dynamic Circuits": [
    { name: "Mid-circuit Measurement", url: "patterns/mid_circuit_measurement.png" },
    { name: "Dynamic Circuit Pattern", url: "patterns/dynamic_circuit.png" }
  ]
};


export default function AiModal({
  quantumAlgorithmModalStep,
  quantumAlgorithms,
  isDetectingAlgorithms,
  detectQuantumAlgorithms,
  handleQuantumAlgorithmModalClose,
  setQuantumAlgorithmModalStep,
  loadFlow,
}) {
  const [patternGraph, setPatternGraph] = useState(null);
  const [selectedAlgoName, setSelectedAlgoName] = useState("");
  const [userInput, setUserInput] = useState("");

  const patterns =
    selectedAlgoName && patternGraph
      ? (ALGORITHM_PATTERNS[selectedAlgoName] || [])
      : [];

  return (
    <>
      {quantumAlgorithmModalStep === 1 && (
        <Modal
          title="Determine Algorithm (1/4)"
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className="btn btn-primary"
                onClick={() => setQuantumAlgorithmModalStep(2)}
              >
                Next
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleQuantumAlgorithmModalClose}
              >
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p>
              In this step, you describe the problem you'd like to solve using a quantum computer.
            </p>
            <p>
              The system uses semantic search powered by OpenAPI to match your problem with
              relevant quantum algorithms, which may incur usage costs.
            </p>
          </div>
        </Modal>
      )}

      {quantumAlgorithmModalStep === 2 && (
        <Modal
          title="Describe Your Problem"
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await detectQuantumAlgorithms(userInput);
                  setQuantumAlgorithmModalStep(3);
                }}

              >
                Find Algorithms and Close
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setQuantumAlgorithmModalStep(1)}
              >
                Back
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <label className="font-medium block">
              Describe your problem:
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Type your problem description here..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {quantumAlgorithmModalStep === 3 && (
        <Modal
          title="Determine Algorithm (3/4)"
          open={true}
          onClose={handleQuantumAlgorithmModalClose}
          className="max-w-4xl"
          footer={
            <div className="flex justify-end">
              <button
                className="btn btn-secondary"
                onClick={() => setQuantumAlgorithmModalStep(2)}
              >
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
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            handleQuantumAlgorithmModalClose();
                            loadFlow(testDiagram);
                          }}
                        >
                          Select
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setPatternGraph(algo.patternGraphPng);
                            setSelectedAlgoName(algo.name);
                            setQuantumAlgorithmModalStep(4);
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

      {quantumAlgorithmModalStep === 4 && (
        <Modal
          title={`Pattern Graph of ${selectedAlgoName} (4/4)`}
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
                  setQuantumAlgorithmModalStep(3);
                }}
              >
                Back
              </button>
            </div>
          }
        >
          <div className="overflow-auto max-h-[70vh] p-2">
            <div className="flex justify-center mb-4">
              <img
                src={patternGraph}
                alt={`Pattern graph of ${selectedAlgoName}`}
                className="w-1/2 rounded"
              />
            </div>

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
