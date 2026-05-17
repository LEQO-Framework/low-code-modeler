import { useState } from "react";
import Modal from "./Modal";

import { qaoa_algorithm, swap_test_algorithm, hadamard_test_imaginary_part_algorithm, hadamard_test_real_part_algorithm, grover_algorithm, initialization, uniform_superposition } from "@/constants/templates";

const ALGORITHM_FLOW_MAP: Record<string, any> = {
  "Quantum Approximate Optimization Algorithm (QAOA)": qaoa_algorithm,

  "SWAP Test": swap_test_algorithm,

  "Hadamard Test": hadamard_test_imaginary_part_algorithm,

  "Grover's Algorithm": grover_algorithm,

  "Uniform Superposition": uniform_superposition,

  "Initialization": initialization,
};


// TODO: update once the ML-nodes are merged
const ALGORITHM_PATTERNS = {
  "Quantum Approximate Optimization Algorithm (QAOA)": [
    {
      name: "Quantum Approximate Optimization Algorithm (QAOA)",
      iconUrl: "patterns/qaoa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/da93f915-7f4c-49df-99d0-80d91f26a337"
    },
    {
      name: "Variational Quantum Algorithm (VQA)",
      iconUrl: "patterns/vqa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bc795a9b-7977-4e01-b513-f9f5aba38aa7"
    },
    {
      name: "Uniform Superposition",
      iconUrl: "patterns/uniform_superposition_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/2229a430-fe92-4411-9d72-d10dd1d8da14"
    },
    {
      name: "Alternating Operator Ansatz (AOA)",
      iconUrl: "patterns/aoa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/b657ea73-63c0-4800-a69d-a91925e19ac6"
    },
    {
      name: "Phase Shift",
      iconUrl: "patterns/phase_shift_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/c6560c51-d2e3-4595-b9c3-b609c75c0b82"
    }
  ],
  /**
  "Variational Quantum Eigensolver (VQE)": [
    {
      name: "Variational Quantum Eigensolver (VQE)",
      iconUrl: "patterns/vqe_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/27a5d147-a323-4c6a-84ef-45d80cae923d"
    },
    {
      name: "Variational Quantum Algorithm (VQA)",
      iconUrl: "patterns/vqa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bc795a9b-7977-4e01-b513-f9f5aba38aa7"
    }
  ],
  */
  "SWAP Test": [
    { name: "SWAP Test", iconUrl: "patterns/swap_test_icon.svg", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/fd2bb9f3-b04a-4645-a2d0-ffa4d986db83" },
  ],
  "Hadamard Test": [
    { name: "Hadamard Test", iconUrl: "patterns/hadamard_test_icon.svg", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/37e64e06-9c2a-4c54-aa18-ddcf67f48a6a" },
  ],
  "Grover's Algorithm": [
    { name: "Grover Pattern", iconUrl: "patterns/grover_icon.svg", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/b8c2dca0-563a-432d-adfd-8bd15ef0dfb8" },
    { name: "Oracle Pattern", iconUrl: "patterns/oracle_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/1cc7e9d6-ab37-412e-8afa-604a25de296e" },
    { name: "Amplitude Amplification", iconUrl: "patterns/amplitude_amplification_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/96b4d28a-a5ce-4c96-85df-d42587b13c57" },
    { name: "Uniform Superposition", iconUrl: "patterns/uniform_superposition_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/2229a430-fe92-4411-9d72-d10dd1d8da14" }
  ],
  /**
  "Quantum Phase Estimation (QPE)": [
    { name: "QPE Pattern", iconUrl: "patterns/qpe_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/a4ea9f6c-5b0a-4beb-a056-8b261d96ba80" },
     { name: "Quantum Fourier Transform (QFT)", iconUrl: "patterns/qft_icon.png",textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/12d260d0-08e3-483e-900e-fbe21db10cac" },
    { name: "Uniform Superposition", iconUrl: "patterns/uniform_superposition_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/2229a430-fe92-4411-9d72-d10dd1d8da14" },
    { name: "Basis Encoding", iconUrl: "patterns/controlled_unitary_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bcd4c7a1-3c92-4f8c-a530-72b8b95d3750" },
  ],
   */
  "Uniform Superposition": [
    {
      name: "Uniform Superposition",
      iconUrl: "patterns/uniform_superposition_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/2229a430-fe92-4411-9d72-d10dd1d8da14"
    },
  ],
  /** 
  "Quantum Fourier Transform (QFT)": [
    { name: "Quantum Fourier Transform (QFT)", iconUrl: "patterns/qft_icon.png",textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/12d260d0-08e3-483e-900e-fbe21db10cac" },
    { name: "Phase Shift", iconUrl: "patterns/phase_shift_icon.png",textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/c6560c51-d2e3-4595-b9c3-b609c75c0b82" },
     { name: "Dynamic Circuit", iconUrl: "patterns/qke_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/88d3e6f5-c75f-42aa-b665-2ba79746222e" },
  ],

  "Quantum Classification": [
    { name: "Quantum Classification", iconUrl: "patterns/quantum_classification_icon.png",textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/cc3731cf-ecbb-490f-b996-525c8f60d8a9" },
     {
      name: "Variational Quantum Algorithm (VQA)",
      iconUrl: "patterns/vqa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bc795a9b-7977-4e01-b513-f9f5aba38aa7"
    },
    { name: "Quantum Kernel Estimator (QKE)", iconUrl: "patterns/qke_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/5479acf4-0588-49af-a6a9-4956b7ee32af" },
  ],

  "Quantum Clustering": [
    { name: "Quantum Clustering",iconUrl: "patterns/quantum_clustering_icon.png", textUrl: "patterns/quantum_clustering.png" },
     {
      name: "Variational Quantum Algorithm (VQA)",
      iconUrl: "patterns/vqa_icon.png",
      textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bc795a9b-7977-4e01-b513-f9f5aba38aa7"
    },
    { name: "SWAP Test",iconUrl: "patterns/swap_test_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/fd2bb9f3-b04a-4645-a2d0-ffa4d986db83" }
  ],
  */
  "Initialization": [
    { name: "Initialization", iconUrl: "patterns/initialization_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/312bc9d3-26c0-40ae-b90b-56effd136c0d" },
    { name: "Uniform Superposition", iconUrl: "patterns/uniform_superposition_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/2229a430-fe92-4411-9d72-d10dd1d8da14" },
    { name: "Amplitude Encoding", iconUrl: "patterns/amplitude_encoding_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/502147ec-45fa-403f-8f52-e196b3359399" },
    { name: "Angle Encoding", iconUrl: "patterns/angle_encoding_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/e595558d-bfea-4b82-9f47-a38a2097b245" },
    { name: "Basis Encoding", iconUrl: "patterns/basis_encoding_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/bcd4c7a1-3c92-4f8c-a530-72b8b95d3750" },
    { name: "Matrix Encoding", iconUrl: "patterns/matrix_encoding_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/45d09c54-3f4a-453b-885d-2772443c8d72" }
  ],
  /** 
  "Dynamic Circuits": [
    { name: "Dynamic Circuit", iconUrl: "patterns/dynamic_circuit_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/88d3e6f5-c75f-42aa-b665-2ba79746222e" },
    { name: "Mid-circuit Measurement", iconUrl: "patterns/mid_circuit_icon.png", textUrl: "https://patterns.platform.planqk.de/pattern-languages/af7780d5-1f97-4536-8da7-4194b093ab1d/ae3d4ca7-9503-463a-b0fc-eabed85b83e0" },
  ]
  */

}
export default function AiModal({
  quantumAlgorithmModalStep,
  quantumAlgorithms,
  isDetectingAlgorithms,
  detectQuantumAlgorithms,
  handleQuantumAlgorithmModalClose,
  setQuantumAlgorithmModalStep,
  loadFlow,
}) {
  const [patternGraph, setPatternGraph] = useState<string | null>(null);
  const [selectedAlgoName, setSelectedAlgoName] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const patterns =
    selectedAlgoName
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
                  if (errorMessage) {
                    setQuantumAlgorithmModalStep(3); // offline processing
                  } else {
                    const error = await detectQuantumAlgorithms(userInput);
                    if (error) setErrorMessage(error);
                    else setQuantumAlgorithmModalStep(3);
                  }
                }}
              >
                {errorMessage ? "Use Offline Processing" : "Find Algorithms"}
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
            {errorMessage && (
              <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded mb-4">
                <p>Error: {errorMessage}</p>
                <p>Do you want to continue with offline processing?</p>
              </div>
            )}

            <label className="font-medium block">
              Describe your problem:
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Type your problem description here..."
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setErrorMessage(null);
              }}
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
                            const flow =
                              ALGORITHM_FLOW_MAP[algo.name];
                            handleQuantumAlgorithmModalClose();
                            loadFlow(flow);
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
            {patternGraph && (
              <div className="flex justify-center mb-4">
                <img
                  src={patternGraph}
                  alt={`Pattern graph of ${selectedAlgoName}`}
                  className="max-w-full max-h-[400px] object-contain rounded"
                />
              </div>
            )}


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
                          <img src={p.iconUrl} alt={p.name} className="w-12 h-12 object-contain" />
                        </td>
                        <td className="p-2 border">
                          <a
                            href={p.textUrl}
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
