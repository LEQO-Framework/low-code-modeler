import { useStore } from "@/config/store";
import {
  AlgorithmNode,
  AncillaNode,
  ClassicalAlgorithmNode,
  ClassicalOperatorNode,
  ClassicalOutputOperationNode,
  ControlStructureNode,
  DataTypeNode,
  DeutschJozsaNode,
  EditableNode,
  GateNode,
  GroverDiffuserNode,
  GroverNode,
  GroupNode,
  IfElseNode,
  InverseQFTNode,
  MCMTGateNode,
  MeasurementNode,
  MergerNode,
  OperatorNode,
  PluginNode,
  QAOANode,
  QFTNode,
  QubitNode,
  SplitterNode,
  StatePreparationNode,
  UniversalOracleNode,
  parameterized_one_qubit,
  parameterized_two_qubit,
  multi_parameterized_two_qubit,
  minMaxOperatorLabel,
  comparisonOperatorLabel,
  bitwiseOperatorLabel,
  controlStructureNodes,
  multi_qubit_gates,
  non_parameterized_one_qubit,
  non_parameterized_two_qubit,
  NodeTypes,
  qubitLabel,
} from "@/constants";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";

const NODE_EXPLANATIONS: Record<string, string> = {
  [QFTNode]:
    "Applies the Quantum Fourier Transform (QFT), which converts a quantum state into its frequency representation. It is commonly used in algorithms such as phase estimation and factoring.",

  [InverseQFTNode]:
    "Applies the inverse Quantum Fourier Transform (QFT), converting a state back from its frequency representation.",

  [MCMTGateNode]:
    "Applies a gate to one or more target qubits only if all control qubits are in the |1⟩ state. Configure the number of control and target qubits and select the gate matrix.",

  [AlgorithmNode]:
    "Runs a custom quantum algorithm defined in a QASM file.",

  [ClassicalAlgorithmNode]:
    "Runs a custom classical algorithm defined in a QASM file.",

  [DeutschJozsaNode]:
    "Implements the Deutsch-Jozsa algorithm, which determines whether a function always returns the same value or returns different values for half of its inputs. Select the input size and the function type.",

  [UniversalOracleNode]:
    "Marks selected quantum states for use in quantum algorithms such as Grover's search. Choose whether to flip qubits or apply phase flips, then select the states to mark.",

  [GroverDiffuserNode]:
    "Applies Grover's diffusion operator, increasing the probability of measuring the marked states during Grover's search algorithm.",

  [GroverNode]:
    "Implements Grover's search algorithm, which searches an unsorted set of elements faster than a classical algorithm. Select the number of qubits and the elements to search for.",

  [QAOANode]:
    "Implements the Quantum Approximate Optimization Algorithm (QAOA), which finds approximate solutions to optimization problems. Select the problem, provide the input data, choose an optimizer, and set the number of layers.",

  [MeasurementNode]:
    "Measures a quantum register, converting its quantum state into classical measurement results. Select the measurement basis if required.",

  [AncillaNode]:
    "Creates one or more ancilla qubits. Ancilla qubits are temporary helper qubits used during quantum computations.",

  [QubitNode]:
    "Creates a quantum register. Set the number of qubits in the register.",

  [SplitterNode]:
    "Splits a quantum register into separate registers according to a QASM definition.",

  [MergerNode]:
    "Merges quantum registers into a single register according to a QASM definition.",

  [OperatorNode]:
    "Applies one or more quantum gates to the selected qubits.",

  [ClassicalOutputOperationNode]:
    "Performs an operation on classical measurement results before passing them to the next node.",

  [IfElseNode]:
    "Executes different branches depending on whether a specified condition is true or false.",

  [ControlStructureNode]:
    "Controls the execution flow of the workflow, such as repeating or conditionally executing nodes.",

  [ClassicalOperatorNode]:
    "Performs classical operations on the input and returns classical output.",

  [PluginNode]:
    "Executes functionality provided by the plugin.",

  [EditableNode]:
    "A customizable node that can be configured to perform user-defined operations.",
};

const GATE_EXPLANATIONS: Record<string, string> = {
  [parameterized_one_qubit[0]]: "X-axis rotation by an angle (rad or deg).",
  [parameterized_one_qubit[1]]: "Y-axis rotation by an angle (rad or deg).",
  [parameterized_one_qubit[2]]: "Z-axis rotation by an angle (rad or deg).",

  [parameterized_one_qubit[3]]:
    "Applies a phase shift of an angle (rad or deg) to the |1⟩ state.",

  [parameterized_two_qubit[0]]:
    "If control qubit is in state |1⟩, applies a phase shift of an angle (rad or deg) to the |1⟩ state.",

  [parameterized_two_qubit[1]]:
    "If control qubit is in state |1⟩, apply X-axis rotation by an angle (rad or deg).",

  [parameterized_two_qubit[2]]:
    "If control qubit is in state |1⟩, apply Y-axis rotation by an angle (rad or deg).",

  [parameterized_two_qubit[3]]:
    "If control qubit is in state |1⟩, apply Z-axis rotation by an angle (rad or deg).",

  ["CU"]:
    "If control qubit is in state |1⟩, apply the U-gate. Set the matrix for the U-gate in the 'Matrix' field.",

  [non_parameterized_one_qubit[0]]:
    "Creates superposition by applying a Hadamard transform.",

  [non_parameterized_one_qubit[1]]:
    "Applies a π/4 phase shift.",

  [non_parameterized_one_qubit[2]]:
    "Flips |0⟩ and |1⟩ states.",

  [non_parameterized_one_qubit[3]]:
    "Applies a π rotation around the Y-axis.",

  [non_parameterized_one_qubit[4]]:
    "Applies a π phase flip to the |1⟩ state.",

  [non_parameterized_one_qubit[5]]:
    "Applies a π/2 phase shift to the |1⟩ state.",

  [non_parameterized_one_qubit[6]]:
    "Creates superposition by applying a π/2 rotation around the X-axis.",

  [non_parameterized_one_qubit[7]]:
    "Inverse S gate; removes a π/2 phase shift.",

  [non_parameterized_one_qubit[8]]:
    "Inverse T gate; removes a π/4 phase shift.",

  [non_parameterized_two_qubit[0]]:
    "If control qubit is in state |1⟩, flips |0⟩ and |1⟩ states of the target qubit.",

  [non_parameterized_two_qubit[1]]:
    "Swaps the states of two qubits.",

  [non_parameterized_two_qubit[2]]:
    "If control qubit is in state |1⟩, applies a π rotation around the Y-axis to the target qubit.",

  [non_parameterized_two_qubit[3]]:
    "If control qubit is in state |1⟩, applies a π phase flip to the |1⟩ state of the target qubit.",

  [non_parameterized_two_qubit[4]]:
    "If control qubit is in state |1⟩, applies the H gate to the target qubit.",

  [multi_qubit_gates[0]]:
    "If both control qubits are in state |1⟩, flips |0⟩ and |1⟩ states of the target qubit.",

  [multi_qubit_gates[1]]:
    "If control qubit is in state |1⟩, swaps the states of the two target qubits.",

  [qubitLabel]: "Represents an individual qubit in the circuit.",
};

const DATA_TYPE_EXPLANATIONS: Record<string, string> = {
  ["bit"]: "Binary value (0 or 1).",
  ["boolean"]: "True or false value.",
  ["Number"]: "Numeric value.",
  ["Array"]: "List of values, separated by a comma.",
  ["File"]: "Data loaded from a file. Specify the file path in the 'Value' field.",
  ["String"]: "Text data.",
};

const STATE_PREPERATION_EXPLANATIONS: Record<string, string> = {
  ["Basis Encoding"]:
    "Encodes classical data into computational basis states by mapping binary values to qubit basis states. Numeric values can be converted to binary using the selected precision.",

  ["Custom Encoding"]:
    "Maps classical values to quantum states using a user-defined implementation.",

  ["Angle Encoding"]:
    "Encodes an array of classical values into a quantum state using rotation gates. For each input value xi, the corresponding qubit is rotated by RY(2xi).",

  ["Amplitude Encoding"]:
    "Encodes an array of numbers using less qubits than basis encoding but requires more depth.",

  ["Matrix Encoding"]:
    "Encodes a non-unitary matrix into a unitary matrix.",

  ["Prepare State"]:
    "Initializes the quantum register in a predefined quantum state, such as a basis state, Bell state, GHZ state or W state. Specify size if the state is not a Bell state.",
};

/**
 * Returns all mappings from a node.
 *
 * EditableNode mappings can be represented either as:
 * - string[]
 * - string[][]
 *
 * Flattening here makes the implementation logic independent
 * of the exact mapping structure.
 */
const getNodeMappings = (selectedNode: Node | null): string[] => {
  if (!selectedNode?.data?.mapping) {
    return [];
  }

  const mapping = selectedNode.data.mapping;

  if (Array.isArray(mapping)) {
    return mapping
      .flat(Infinity)
      .filter(
        (value: unknown): value is string => typeof value === "string",
      );
  }

  return [];
};

/**
 * Determines which custom implementation, if any, an EditableNode needs.
 *
 * Custom Quantum Operator:
 *   - QASM or Python
 *
 * Custom Classical Operator:
 *   - Python only
 *
 * Any other mapping:
 *   - no implementation field
 */
const getEditableNodeImplementationType = (
  selectedNode: Node | null,
): "quantum" | "classical" | null => {
  if (!selectedNode || selectedNode.type !== EditableNode) {
    return null;
  }

  const mappings = getNodeMappings(selectedNode).map((mapping) =>
    mapping.trim().toLowerCase(),
  );

  const hasCustomQuantumOperator = mappings.some(
    (mapping) =>
      mapping === "custom quantum operator" ||
      mapping.includes("custom quantum operator"),
  );

  const hasCustomClassicalOperator = mappings.some(
    (mapping) =>
      mapping === "custom classical operator" ||
      mapping.includes("custom classical operator"),
  );

  if (hasCustomQuantumOperator) {
    return "quantum";
  }

  if (hasCustomClassicalOperator) {
    return "classical";
  }

  return null;
};

const getNodeExplanation = (selectedNode: Node | null) => {
  if (!selectedNode) {
    return "";
  }

  if (selectedNode.type === GateNode) {
    return (
      GATE_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for gate node: " +
        selectedNode.data.label
    );
  }

  if (selectedNode.type === DataTypeNode) {
    return (
      DATA_TYPE_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for data type node: " +
        selectedNode.data.label
    );
  }

  if (selectedNode.type === StatePreparationNode) {
    return (
      STATE_PREPERATION_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for state preperation node: " +
        selectedNode.data.label
    );
  }

  // For EditableNode the explanation may have been customized by the user.
  if (selectedNode.type === EditableNode) {
    return (
      selectedNode.data.explanation ??
      NODE_EXPLANATIONS[EditableNode] ??
      ""
    );
  }

  return (
    NODE_EXPLANATIONS[selectedNode.type] ??
    "Error: No explanation available for node type: " + selectedNode.type
  );
};

const selector = (state: {
  selectedNode: Node | null;
  completionGuaranteed: boolean;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (
    nodeId: string,
    identifier: string,
    nodeVal: string,
  ) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  completionGuaranteed: state.completionGuaranteed,
  updateNodeLabel: state.updateNodeLabel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const TextPanel = () => {
  const {
    selectedNode,
    updateNodeLabel,
    updateNodeValue,
    setSelectedNode,
    completionGuaranteed,
  } = useStore(selector, shallow);

  useEffect(() => {
    if (
      selectedNode &&
      !selectedNode.data.parameterType &&
      (parameterized_one_qubit.includes(selectedNode.data.label) ||
        parameterized_two_qubit.includes(selectedNode.data.label))
    ) {
      handleNumberChange("parameterType", "degree");
    }
  }, [selectedNode]);

  const [fileName, setFileName] = useState("");
  const [uncomputeFileName, setUncomputeFileName] = useState("");
  const [implementationContent, setImplementationContent] = useState("");

  console.log(selectedNode);

  const validFields = [
    "gamma",
    "lambda",
    "theta",
    "phi",
    "parameterType",
    "quantumStateName",
    "encodingType",
    "implementationType",
    "operator",
    "minMaxOperator",
    "uncomputeImplementationType",
    "implementation",
    "fileName",
    "uncomputeImplementation",
    "parameter",
    "nodeType",
    "basis",
    "indices",
    "condition",
    "clusteringAlgorithm",
    "numControls",
    "numTargets",
    "matrix",
    "controlValue",
    "explanation",
    "implementationLanguage",
    "implementationFileName",
  ];

  const normalizeDegrees = (deg) => {
    const normalized = deg % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  const normalizeRadians = (rad) => {
    const normalized = rad % (2 * Math.PI);
    return normalized < 0 ? normalized + 2 * Math.PI : normalized;
  };

  const degToRad = (deg) =>
    (normalizeDegrees(parseFloat(deg)) * Math.PI) / 180;

  const radToDeg = (rad) =>
    normalizeDegrees((parseFloat(rad) * 180) / Math.PI);

  const safeEval = (expr) => {
    try {
      console.log(expr);

      const sanitized = expr.replace(/π|pi/gi, `${Math.PI}`);

      return sanitized;
    } catch (e) {
      return NaN;
    }
  };

  const handleParameterChange = (value) => {
    const evaluated = safeEval(value);

    console.log(evaluated);

    if (!isNaN(evaluated)) {
      const storedValue =
        selectedNode.data.parameterType === "degree"
          ? degToRad(value)
          : radToDeg(value);

      handleNumberChange("parameter", "" + storedValue);
    } else {
      handleNumberChange("parameter", evaluated);
    }
  };

  let validMinValue = 0;

  if (
    selectedNode?.type === "splitterNode" ||
    selectedNode?.type === "mergerNode"
  ) {
    validMinValue = 2;
  } else if (
    selectedNode?.type === "ifElseNode" ||
    selectedNode?.type === "controlStructureNode" ||
    selectedNode?.type === "mcmt-gate"
  ) {
    validMinValue = 1;
  }

  // Handle other changes based on node type
  function handleNumberChange(field: string, value: string) {
    if (selectedNode) {
      if (field === "parameterType") {
        updateNodeValue(selectedNode.id, field, value);
        handleParameterChange(selectedNode.data.parameter);
      }

      if (field === "implementation") {
        setImplementationContent(value);
      }

      console.log(value);
      console.log(field);

      if (validFields.includes(field)) {
        selectedNode.data[field] = value;
        updateNodeValue(selectedNode.id, field, value);
      } else if (!isNaN(Number(value))) {
        if (Number(value) < validMinValue) {
          selectedNode.data[field] = Number(validMinValue);
          updateNodeValue(
            selectedNode.id,
            field,
            String(validMinValue),
          );
        } else {
          selectedNode.data[field] = Number(value);
          updateNodeValue(selectedNode.id, field, value);
        }
      }
    }
  }

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) {
    if (event.target.files && selectedNode) {
      const file = event.target.files[0];

      const reader = new FileReader();

      reader.onload = function (e) {
        const fileContent = e.target?.result as string;

        if (field === "uncomputeImplementation") {
          selectedNode.data.uncomputeImplementation = fileContent;
          updateNodeValue(
            selectedNode.id,
            field,
            fileContent,
          );

          updateNodeValue(
            selectedNode.id,
            "uncomputeFileName",
            file.name,
          );

          setUncomputeFileName(file.name);
        } else {
          selectedNode.data.implementation = fileContent;

          updateNodeValue(
            selectedNode.id,
            "implementation",
            fileContent,
          );

          updateNodeValue(
            selectedNode.id,
            "fileName",
            file.name,
          );

          setFileName(file.name);

          // EditableNode-specific implementation metadata.
          if (selectedNode.type === EditableNode) {
            updateNodeValue(
              selectedNode.id,
              "implementationFileName",
              file.name,
            );

            const extension = file.name
              .split(".")
              .pop()
              ?.toLowerCase();

            if (extension === "qasm") {
              updateNodeValue(
                selectedNode.id,
                "implementationLanguage",
                "qasm",
              );
            } else if (extension === "py") {
              updateNodeValue(
                selectedNode.id,
                "implementationLanguage",
                "python",
              );
            }
          }
        }
      };

      reader.readAsText(file);
    }
  }

  const editableImplementationType =
    getEditableNodeImplementationType(selectedNode);

  return (
    <>
      <aside className="flex flex-col w-full h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-2 font-semibold flex">
          <button
            onClick={() => {
              setSelectedNode(null);
            }}
          >
            <ArrowLeft />
          </button>

          <h2 className="flex-grow text-center">
            Properties Panel
          </h2>
        </div>

        <hr />

        {selectedNode && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="nodeExplanation"
            >
              Explanation
            </label>

            {selectedNode.type === EditableNode ? (
              <textarea
                id="nodeExplanation"
                name="nodeExplanation"
                value={
                  selectedNode.data.explanation ??
                  NODE_EXPLANATIONS[EditableNode] ??
                  ""
                }
                onChange={(e) =>
                  handleNumberChange(
                    "explanation",
                    e.target.value,
                  )
                }
                className="mt-1 border border-gray-300 rounded-md sm:text-sm p-2 bg-white text-gray-700 w-full min-h-28 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter an explanation for this custom node..."
              />
            ) : (
              <div className="mt-1 min-h-28 border border-gray-300 rounded-md sm:text-sm p-2 bg-gray-50 text-gray-700">
                {getNodeExplanation(selectedNode)}
              </div>
            )}
          </div>
        )}

        {selectedNode?.type === EditableNode &&
          editableImplementationType && (
            <EditableNodeImplementationFields
              selectedNode={selectedNode}
              implementationType={editableImplementationType}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
            />
          )}

        {selectedNode?.type === "positionNode" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="value"
            >
              Value
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="value"
                name="value"
                value={selectedNode.data.value || ""}
                onChange={(e) =>
                  handleNumberChange("value", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter a number"
              />
            </div>
          </div>
        )}

        {selectedNode?.data.label === "Encode Value" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="encodingType"
            >
              Encoding Type
            </label>

            <div className="mt-1">
              <select
                id="encodingType"
                name="encodingType"
                value={
                  selectedNode.data.encodingType ||
                  "Amplitude Encoding"
                }
                onChange={(e) =>
                  handleNumberChange(
                    "encodingType",
                    e.target.value,
                  )
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              >
                {!completionGuaranteed && (
                  <option value="Amplitude Encoding">
                    Amplitude Encoding
                  </option>
                )}

                <option value="Angle Encoding">
                  Angle Encoding
                </option>

                <option value="Basis Encoding">
                  Basis Encoding
                </option>

                <option value="Custom Encoding">
                  Custom Encoding
                </option>

                {!completionGuaranteed && (
                  <option value="Matrix Encoding">
                    Matrix Encoding
                  </option>
                )}

                {!completionGuaranteed && (
                  <option value="Schmidt Decomposition">
                    Schmidt Decomposition
                  </option>
                )}
              </select>
            </div>

            {selectedNode.data.encodingType !==
              "Basis Encoding" &&
              selectedNode.data.encodingType !==
                "Angle Encoding" && (
                <>
                  <label
                    className="block text-sm font-medium text-start text-gray-700 mt-2"
                    htmlFor="bound"
                  >
                    Bound
                  </label>

                  <div className="mt-1">
                    <input
                      type="text"
                      id="bound"
                      name="bound"
                      value={selectedNode.data.bound || ""}
                      onChange={(e) =>
                        handleNumberChange(
                          "bound",
                          e.target.value,
                        )
                      }
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                      placeholder="Enter bound"
                    />
                  </div>
                </>
              )}
          </div>
        )}

        {selectedNode?.data.label === "Prepare State" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="quantumState"
            >
              Quantum State Name
            </label>

            <div className="mt-1">
              <select
                id="quantumStateName"
                name="quantumStateName"
                value={
                  selectedNode.data.quantumStateName ||
                  "Bell State φ+"
                }
                onChange={(e) =>
                  handleNumberChange(
                    "quantumStateName",
                    e.target.value,
                  )
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              >
                <option value="Bell State φ+">
                  Bell State ϕ+
                </option>

                <option value="Bell State φ-">
                  Bell State ϕ-
                </option>

                <option value="Bell State ψ+">
                  Bell State ψ+
                </option>

                <option value="Bell State ψ-">
                  Bell State ψ-
                </option>

                <option value="Custom State">
                  Custom State
                </option>

                <option value="GHZ">GHZ State</option>

                <option value="Uniform Superposition">
                  Uniform Superposition
                </option>

                <option value="W-State">W-State</option>
              </select>
            </div>
          </div>
        )}

        {(selectedNode?.type === OperatorNode ||
          selectedNode?.type === ClassicalOperatorNode) && (
          <div className="p-2 mt-3">
            {selectedNode.data.label.includes(
              "Arithmetic Operator",
            ) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="arithmeticOperator"
                >
                  Arithmetic Operator
                </label>

                <div className="mt-1">
                  <select
                    id="arithmeticOperator"
                    name="arithmeticOperator"
                    value={
                      selectedNode.data.operator || "+"
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "operator",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="+">+</option>

                    {!completionGuaranteed && (
                      <option value="-">-</option>
                    )}

                    {!completionGuaranteed && (
                      <option value="/">/</option>
                    )}

                    {!completionGuaranteed && (
                      <option value="*">*</option>
                    )}

                    {!completionGuaranteed && (
                      <option value="**">**</option>
                    )}
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(
              comparisonOperatorLabel,
            ) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="comparisonOperator"
                >
                  Comparison Operator
                </label>

                <div className="mt-1">
                  <select
                    id="comparisonOperator"
                    name="comparisonOperator"
                    value={
                      selectedNode.data.operator || "≤"
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "operator",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="<=">≤</option>
                    <option value="<">&lt;</option>
                    <option value="=">=</option>
                    <option value="!=">≠</option>
                    <option value=">">&gt;</option>
                    <option value=">=">≥</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(
              minMaxOperatorLabel,
            ) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="minMaxOperator"
                >
                  Min/Max Operator
                </label>

                <div className="mt-1">
                  <select
                    id="minMaxOperator"
                    name="minMaxOperator"
                    value={
                      selectedNode.data.operator || "min"
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "operator",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(
              bitwiseOperatorLabel,
            ) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="minMaxOperator"
                >
                  Bitwise Operator
                </label>

                <div className="mt-1">
                  <select
                    id="minMaxOperator"
                    name="minMaxOperator"
                    value={
                      selectedNode.data.operator || "min"
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "operator",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="|">OR</option>
                    <option value="&">AND</option>
                    <option value="~">INVERT</option>
                    <option value="^">XOR</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode?.type === OperatorNode && (
              <ImplementationFields
                selectedNode={selectedNode}
                handleNumberChange={handleNumberChange}
                handleFileUpload={handleFileUpload}
                implementationContent={
                  implementationContent
                }
                type=""
              />
            )}
          </div>
        )}

        {selectedNode?.type === "measurementNode" && (
          <div className="p-2 mt-3">
            {selectedNode.data.hasRegisterInput && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="registerName"
                >
                  Register Name
                </label>

                <div className="mt-1">
                  <input
                    type="text"
                    id="registerName"
                    name="registerName"
                    value={
                      selectedNode.data.registerName || ""
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "registerName",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter register name"
                  />
                </div>
              </>
            )}

            <>
              <label
                className="block text-sm font-medium text-start text-gray-700 mt-2"
                htmlFor="basis"
              >
                Basis
              </label>

              <div className="mt-1">
                <input
                  type="text"
                  id="basis"
                  name="basis"
                  value={selectedNode.data.basis || ""}
                  onChange={(e) => {
                    const value =
                      e.target.value.toUpperCase();

                    if (/^[XYZ]*$/.test(value)) {
                      handleNumberChange("basis", value);
                    }
                  }}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  placeholder="e.g. XYZ"
                />
              </div>

              {selectedNode.data.basis &&
                !/^[XYZ]+$/.test(
                  selectedNode.data.basis.toUpperCase(),
                ) && (
                  <p className="text-red-500 text-xs mt-1">
                    Basis may only contain X, Y, or Z.
                  </p>
                )}
            </>

            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === "gateNode" && (
          <>
            {(parameterized_one_qubit.includes(
              selectedNode.data.label,
            ) ||
              parameterized_two_qubit.includes(
                selectedNode.data.label,
              )) && (
              <div className="p-2 mt-3">
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="parameter"
                >
                  Parameter
                </label>

                <div className="mt-1">
                  <input
                    type="number"
                    id="parameter"
                    name="parameter"
                    value={
                      selectedNode.data.parameterType ===
                      "degree"
                        ? selectedNode.data.parameter
                        : selectedNode.data.parameter || ""
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "parameter",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter parameter"
                  />
                </div>

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="parameterType"
                >
                  Parameter Type
                </label>

                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={
                      selectedNode.data.parameterType || ""
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "parameterType",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="degree">Degree</option>
                    <option value="radian">Radian</option>
                  </select>
                </div>
              </div>
            )}

            {selectedNode.data.label === "CU" && (
              <div className="p-2 mt-3">
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="parameter"
                >
                  Control Value
                </label>

                <div className="mt-1">
                  <select
                    id="controlValue"
                    name="controlValue"
                    value={
                      selectedNode.data.controlValue || ""
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "controlValue",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </div>

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="matrix"
                >
                  Matrix
                </label>

                <div className="mt-1">
                  <input
                    id="matrix"
                    name="matrix"
                    value={selectedNode.data.matrix || ""}
                    onChange={(e) =>
                      handleNumberChange(
                        "matrix",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  />
                </div>
              </div>
            )}

            {multi_parameterized_two_qubit.includes(
              selectedNode.data.label,
            ) && (
              <div className="p-2 mt-3">
                <label className="block text-sm font-medium text-start text-gray-700 mb-2">
                  Parameters
                </label>

                {[
                  { key: "theta", label: "θ" },
                  { key: "phi", label: "φ" },
                  { key: "lambda", label: "λ" },
                  { key: "gamma", label: "γ" },
                ].map(({ key, label }) => (
                  <div key={key} className="mb-3">
                    <label
                      className="block text-xs font-medium text-gray-600"
                      htmlFor={`param-${key}`}
                    >
                      {label}
                    </label>

                    <input
                      type="text"
                      id={`param-${key}`}
                      name={`param-${key}`}
                      value={
                        selectedNode.data.parameterType ===
                        "degree"
                          ? radToDeg(
                              selectedNode.data[key] || 0,
                            )
                          : selectedNode.data[key] || ""
                      }
                      onChange={(e) =>
                        handleNumberChange(
                          key,
                          e.target.value,
                        )
                      }
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                      placeholder={`Enter ${label}`}
                    />
                  </div>
                ))}

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="parameterType"
                >
                  Parameter Type
                </label>

                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={
                      selectedNode.data.parameterType || ""
                    }
                    onChange={(e) =>
                      handleNumberChange(
                        "parameterType",
                        e.target.value,
                      )
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="degree">Degree</option>
                    <option value="radian">Radian</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {(selectedNode?.type === AlgorithmNode ||
          selectedNode?.type === ClassicalAlgorithmNode) && (
          <div className="p-2 mt-3">
            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === "splitterNode" && (
          <div className="p-2 mt-3">
            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === "mergerNode" && (
          <div className="p-2 mt-3">
            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === ControlStructureNode && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="condition"
            >
              Condition
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="condition"
                name="condition"
                value={selectedNode.data.condition || ""}
                onChange={(e) =>
                  handleNumberChange(
                    "condition",
                    e.target.value,
                  )
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
          </div>
        )}

        {selectedNode?.type === IfElseNode && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="condition"
            >
              Condition
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="condition"
                name="condition"
                value={selectedNode.data.condition || ""}
                onChange={(e) =>
                  handleNumberChange(
                    "condition",
                    e.target.value,
                  )
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

interface EditableNodeImplementationFieldsProps {
  selectedNode: Node;
  implementationType: "quantum" | "classical";
  handleNumberChange: (
    field: string,
    value: string,
  ) => void;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => void;
}

const EditableNodeImplementationFields: React.FC<
  EditableNodeImplementationFieldsProps
> = ({
  selectedNode,
  implementationType,
  handleNumberChange,
  handleFileUpload,
}) => {
  const isQuantum = implementationType === "quantum";

  const implementation = selectedNode.data.implementation || "";
  const fileName =
    selectedNode.data.implementationFileName ||
    selectedNode.data.fileName ||
    "";

  const language =
    selectedNode.data.implementationLanguage ||
    "";

  return (
    <div className="p-2 mt-3 border border-gray-200 rounded-md bg-gray-50">
      <label className="block text-sm font-medium text-start text-gray-700">
        Custom Implementation
      </label>

      <p className="text-xs text-gray-500 mt-1 mb-3">
        {isQuantum
          ? "Custom Quantum Operator: upload a QASM or Python implementation."
          : "Custom Classical Operator: upload a Python implementation."}
      </p>

      <label
        className="block text-sm font-medium text-start text-gray-700"
        htmlFor="editableNodeImplementationFile"
      >
        Upload Implementation
      </label>

      <div className="mt-1">
        <input
          type="file"
          id="editableNodeImplementationFile"
          name="editableNodeImplementationFile"
          accept={
            isQuantum
              ? ".qasm,.py,text/x-python,application/x-python"
              : ".py,text/x-python,application/x-python"
          }
          onChange={(e) =>
            handleFileUpload(
              e,
              "implementation",
            )
          }
          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 bg-white"
        />
      </div>

      {fileName && (
        <div className="mt-1 text-xs text-gray-500">
          File: {fileName}
        </div>
      )}

      {language && (
        <div className="mt-1 text-xs text-gray-500">
          Language: {language === "qasm" ? "QASM" : "Python"}
        </div>
      )}

      <label
        className="block text-sm font-medium text-start text-gray-700 mt-3"
        htmlFor="editableNodeImplementation"
      >
        Implementation
      </label>

      <textarea
        id="editableNodeImplementation"
        name="editableNodeImplementation"
        value={implementation}
        onChange={(e) =>
          handleNumberChange(
            "implementation",
            e.target.value,
          )
        }
        className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-48 overflow-auto bg-white font-mono text-xs"
        placeholder={
          isQuantum
            ? "Upload a .qasm or .py file, or enter the implementation manually..."
            : "Upload a .py file, or enter the Python implementation manually..."
        }
      />
    </div>
  );
};

interface ImplementationFieldsProps {
  selectedNode: any;
  handleNumberChange: (
    field: string,
    value: string,
  ) => void;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => void;
  implementationContent: string;
  type?: "" | "uncompute";
}

export const ImplementationFields: React.FC<
  ImplementationFieldsProps
> = ({
  selectedNode,
  handleNumberChange,
  handleFileUpload,
  implementationContent,
  type = "",
}) => {
  const isUncompute = type === "uncompute";

  const prefix = isUncompute ? "uncompute" : "";

  const implementationKey = `${prefix}${
    isUncompute ? "Implementation" : "implementation"
  }`;

  const fileNameKey = `${prefix}${
    isUncompute ? "FileName" : "fileName"
  }`;

  const implementationTypeKey = `${prefix}${
    isUncompute
      ? "ImplementationType"
      : "implementationType"
  }`;

  return (
    <>
      {/** Currently we only support one file type */}

      <label
        className="block text-sm font-medium text-start text-gray-700 mt-2"
        htmlFor={`${prefix}FileUpload`}
      >
        {isUncompute
          ? "Upload Uncompute Implementation File"
          : "Upload QASM File"}
      </label>

      <div className="mt-1">
        <input
          type="file"
          accept=".qasm"
          id={`${prefix}FileUpload`}
          name={`${prefix}FileUpload`}
          onChange={(e) =>
            handleFileUpload(e, implementationKey)
          }
          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
        />
      </div>

      <span className="text-sm text-gray-500">
        {selectedNode.data[fileNameKey]}
      </span>

      <label
        className="block text-sm font-medium text-start text-gray-700 mt-2"
        htmlFor={`${implementationKey}Content`}
      >
        {isUncompute
          ? "Uncompute Implementation Content"
          : "Implementation Content"}
      </label>

      <textarea
        id={`${implementationKey}Content`}
        name={`${implementationKey}Content`}
        value={
          selectedNode.data[implementationKey] ||
          implementationContent
        }
        onChange={(e) =>
          handleNumberChange(
            implementationKey,
            e.target.value,
          )
        }
        className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
        placeholder="File content will appear here or enter manually"
      />
    </>
  );
};