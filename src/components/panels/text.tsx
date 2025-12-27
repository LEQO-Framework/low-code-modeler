import { useStore } from "@/config/store";
import { AlgorithmNode, ClassicalAlgorithmNode, parameterized_one_qubit, parameterized_two_qubit, multi_parameterized_two_qubit, OperatorNode, minMaxOperatorLabel, comparisonOperatorLabel, ClassicalOperatorNode, bitwiseOperatorLabel, controlStructureNodes, ControlStructureNode, IfElseNode } from "@/constants";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  completionGuaranteed: boolean;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (nodeId: string, identifier: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  completionGuaranteed: state.completionGuaranteed,
  updateNodeLabel: state.updateNodeLabel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});


export const TextPanel = () => {
  const { selectedNode, updateNodeLabel, updateNodeValue, setSelectedNode, completionGuaranteed } = useStore(
    selector,
    shallow,
  );

  useEffect(() => {
    if (selectedNode && !selectedNode.data.parameterType && (parameterized_one_qubit.includes(selectedNode.data.label) || parameterized_two_qubit.includes(selectedNode.data.label))) {
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
    "condition"
  ];


  const normalizeDegrees = (deg) => {
    const normalized = deg % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  const normalizeRadians = (rad) => {
    const normalized = rad % (2 * Math.PI);
    return normalized < 0 ? normalized + 2 * Math.PI : normalized;
  };

  const degToRad = (deg) => (normalizeDegrees(parseFloat(deg)) * Math.PI) / 180;

  const radToDeg = (rad) => normalizeDegrees((parseFloat(rad) * 180) / Math.PI);


  const safeEval = (expr) => {
    try {
      console.log(expr)
      const sanitized = expr
        .replace(/π|pi/gi, `${Math.PI}`);
      return sanitized;
    } catch (e) {
      return NaN;
    }
  };


  const handleParameterChange = (value) => {
    const evaluated = safeEval(value);
    console.log(evaluated)
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


  // Handle other changes based on node type
  function handleNumberChange(field: string, value: string) {
    if (selectedNode) {
      if (field === "parameterType") {
        updateNodeValue(selectedNode.id, field, value);
        handleParameterChange(selectedNode.data.parameter)
      }
      if (field === "implementation") {
        setImplementationContent(value);
      }
      console.log(value);
      console.log(field)
      if (validFields.includes(field)) {
        selectedNode.data[field] = value;
        updateNodeValue(selectedNode.id, field, value);
      }
      else if (!isNaN(Number(value))) {
        selectedNode.data[field] = Number(value);
        updateNodeValue(selectedNode.id, field, value);
      }

    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, field: string) {
    if (event.target.files && selectedNode) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = function (e) {
        const fileContent = e.target?.result as string;
        if (field === "uncomputeImplementation") {
          selectedNode.data.uncomputeImplementation = fileContent;
          updateNodeValue(selectedNode.id, field, fileContent);
          updateNodeValue(selectedNode.id, "uncomputeFileName", file.name);
          setUncomputeFileName(file.name);
        } else {
          selectedNode.data.implementation = fileContent;
          updateNodeValue(selectedNode.id, "implementation", fileContent);
          updateNodeValue(selectedNode.id, "fileName", file.name);
          setFileName(file.name);
        }

      };

      reader.readAsText(file);
    }
  }



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
          <h2 className="flex-grow text-center">Properties Panel</h2>
        </div>
        <hr />

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
                onChange={(e) => handleNumberChange("value", e.target.value)}
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
                value={selectedNode.data.encodingType || "Amplitude Encoding"}
                onChange={(e) =>
                  handleNumberChange("encodingType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              >
                {!completionGuaranteed && (<option value="Amplitude Encoding">Amplitude Encoding</option>)}
                <option value="Angle Encoding">Angle Encoding</option>
                <option value="Basis Encoding">Basis Encoding</option>
                <option value="Custom Encoding">Custom Encoding</option>
                {!completionGuaranteed && (<option value="Matrix Encoding">Matrix Encoding</option>)}
                {!completionGuaranteed && (<option value="Schmidt Decomposition">Schmidt Decomposition</option>)}
              </select>
            </div>

            {selectedNode.data.encodingType !== "Basis Encoding" && selectedNode.data.encodingType !== "Angle Encoding" && (<><label
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
                  onChange={(e) => handleNumberChange("bound", e.target.value)}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  placeholder="Enter bound"
                />
              </div></>)}
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
                value={selectedNode.data.quantumStateName || "Bell State φ+"}
                onChange={(e) => handleNumberChange("quantumStateName", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              >
                <option value="Bell State φ+">Bell State ϕ+</option>
                <option value="Bell State φ-">Bell State ϕ-</option>
                <option value="Bell State ψ+">Bell State ψ+</option>
                <option value="Bell State ψ-">Bell State ψ-</option>
                <option value="Custom State">Custom State</option>
                <option value="GHZ">GHZ State</option>
                <option value="Uniform Superposition">Uniform Superposition</option>
                <option value="W-State">W-State</option>
              </select>
            </div>
          </div>
        )}
        {(selectedNode?.type === OperatorNode || selectedNode?.type === ClassicalOperatorNode) && (
          <div className="p-2 mt-3">
            {selectedNode.data.label.includes("Arithmetic Operator") && (
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
                    value={selectedNode.data.operator || "+"}
                    onChange={(e) => handleNumberChange("operator", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="+">+</option>
                    {/* <option value="-">-</option>
                    <option value="/">/</option>
                    <option value="*">*</option>
                    <option value="**">**</option> */}
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(comparisonOperatorLabel) && (
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
                    value={selectedNode.data.operator || "≤"}
                    onChange={(e) => handleNumberChange("operator", e.target.value)}
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

            {selectedNode.data.label.includes(minMaxOperatorLabel) && (
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
                    value={selectedNode.data.operator || "min"}
                    onChange={(e) => handleNumberChange("operator", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="min">Min</option>
                    <option value="max">Max</option>

                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(bitwiseOperatorLabel) && (
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
                    value={selectedNode.data.operator || "min"}
                    onChange={(e) => handleNumberChange("operator", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <>
                      <option value="|">OR</option>
                      <option value="&">AND</option>
                      <option value="~">INVERT</option>
                      <option value="^">XOR</option>
                    </>

                  </select>
                </div>
              </>
            )}

            {selectedNode?.type === OperatorNode && (<ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
            )}
          </div>
        )}

        {selectedNode?.type === "measurementNode" && (
          <div className="p-2 mt-3">
            {selectedNode.data.hasRegisterInput && (
              <>
                <label className="block text-sm font-medium text-start text-gray-700" htmlFor="registerName">
                  Register Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="registerName"
                    name="registerName"
                    value={selectedNode.data.registerName || ""}
                    onChange={(e) => handleNumberChange("registerName", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter register name"
                  />
                </div>
              </>
            )}

            {!completionGuaranteed && (
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
                      const value = e.target.value.toUpperCase();

                      if (/^[XYZ]*$/.test(value)) {
                        handleNumberChange("basis", value);
                      }
                    }}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="e.g. XYZ"
                  />
                </div>
                {selectedNode.data.basis &&
                  !/^[XYZ]+$/.test(selectedNode.data.basis.toUpperCase()) && (
                    <p className="text-red-500 text-xs mt-1">
                      Basis may only contain X, Y, or Z.
                    </p>
                  )}
              </>)}

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
            {/* Single-parameter gates */}
            {(parameterized_one_qubit.includes(selectedNode.data.label) || parameterized_two_qubit.includes(selectedNode.data.label)) && (
              <div className="p-2 mt-3">
                <label className="block text-sm font-medium text-start text-gray-700" htmlFor="parameter">
                  Parameter
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="parameter"
                    name="parameter"
                    value={
                      selectedNode.data.parameterType === "degree"
                        ? selectedNode.data.parameter
                        : selectedNode.data.parameter || ""
                    }
                    onChange={(e) => handleNumberChange("parameter", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter parameter"
                  />
                </div>

                <label className="block text-sm font-medium text-start text-gray-700 mt-4" htmlFor="parameterType">
                  Parameter Type
                </label>
                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={selectedNode.data.parameterType || ""}
                    onChange={(e) => handleNumberChange("parameterType", e.target.value)}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="degree">Degree</option>
                    <option value="radian">Radian</option>
                  </select>
                </div>
              </div>
            )}


            {multi_parameterized_two_qubit.includes(selectedNode.data.label) && (
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
                    <label className="block text-xs font-medium text-gray-600" htmlFor={`param-${key}`}>
                      {label}
                    </label>
                    <input
                      type="text"
                      id={`param-${key}`}
                      name={`param-${key}`}
                      value={
                        selectedNode.data.parameterType === "degree"
                          ? radToDeg(selectedNode.data[key] || 0)
                          : selectedNode.data[key] || ""
                      }
                      onChange={(e) => handleNumberChange(key, e.target.value)}
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                      placeholder={`Enter ${label}`}
                    />
                  </div>
                ))}

                <label className="block text-sm font-medium text-start text-gray-700 mt-4" htmlFor="parameterType">
                  Parameter Type
                </label>
                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={selectedNode.data.parameterType || ""}
                    onChange={(e) => handleNumberChange("parameterType", e.target.value)}
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

        {(selectedNode?.type === AlgorithmNode || selectedNode?.type === ClassicalAlgorithmNode) && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberQuantumInputs"
            >
              Number of Quantum Inputs
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="numberQuantumInputs"
                name="numberQuantumInputs"
                value={selectedNode.data.numberQuantumInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberQuantumInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberQuantumInputs"
              />
            </div>

            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberClassicalInputs"
            >
              Number of Classical Inputs
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="numberClassicalInputs"
                name="numberClassicalInputs"
                value={selectedNode.data.numberClassicalInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberClassicalInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberClassicalInputs"
              />
            </div>

            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberQuantumOutputs"
            >
              Number of Quantum Outputs
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="numberQuantumOutputs"
                name="numberQuantumOutputs"
                value={selectedNode.data.numberQuantumOutputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberQuantumOutputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberQuantumOutputs"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberClassicalOutputs"
            >
              Number of Classical Outputs
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="numberClassicalOutputs"
                name="numberClassicalOutputs"
                value={selectedNode.data.numberClassicalOutputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberClassicalOutputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberClassicalOutputs"
              />
            </div>
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
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberOutputs"
            >
              Number of Outputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberOutputs"
                name="numberOutputs"
                value={selectedNode.data.numberOutputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberOutputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberOutputs"
              />
            </div>
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
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberInputs"
            >
              Number of Inputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberInputs"
                name="numberInputs"
                value={selectedNode.data.numberInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberInputs"
              />
            </div>

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
                value={selectedNode.data.condition || ""
                }
                onChange={(e) =>
                  handleNumberChange("condition", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberClassicalInputs"
            >
              Number of Classical Inputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberClassicalInputs"
                name="numberClassicalInputs"
                value={selectedNode.data.numberClassicalInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberClassicalInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberClassicalInputs"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberQuantumInputs"
            >
              Number of Quantum Inputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberQuantumInputs"
                name="numberQuantumInputs"
                value={selectedNode.data.numberQuantumInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberQuantumInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberQuantumInputs"
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
                value={selectedNode.data.condition || ""
                }
                onChange={(e) =>
                  handleNumberChange("condition", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberClassicalInputs"
            >
              Number of Classical Inputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberClassicalInputs"
                name="numberClassicalInputs"
                value={selectedNode.data.numberClassicalInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberClassicalInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberClassicalInputs"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="numberQuantumInputs"
            >
              Number of Quantum Inputs
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="numberQuantumInputs"
                name="numberQuantumInputs"
                value={selectedNode.data.numberQuantumInputs || ""
                }
                onChange={(e) =>
                  handleNumberChange("numberQuantumInputs", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter numberQuantumInputs"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

interface ImplementationFieldsProps {
  selectedNode: any;
  handleNumberChange: (field: string, value: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  implementationContent: string;
  type?: "" | "uncompute";
}

export const ImplementationFields: React.FC<ImplementationFieldsProps> = ({
  selectedNode,
  handleNumberChange,
  handleFileUpload,
  implementationContent,
  type = "",
}) => {
  const isUncompute = type === "uncompute";

  const prefix = isUncompute ? "uncompute" : "";
  const implementationKey = `${prefix}${isUncompute ? "Implementation" : "implementation"}`;
  const fileNameKey = `${prefix}${isUncompute ? "FileName" : "fileName"}`;
  const implementationTypeKey = `${prefix}${isUncompute ? "ImplementationType" : "implementationType"}`;

  // const implementationTypeOptions = ["QASM"];
  return (
    <>

      { // Currently we only support one file type

      /** <label
        className="block text-sm font-medium text-start text-gray-700 mt-2"
        htmlFor={`${implementationTypeKey}`}
      >
        {isUncompute ? "Uncompute Implementation Type" : "Implementation Type"}
      </label>
      <div className="mt-1">
        <div className="mt-1">
          <select
            id={implementationTypeKey}
            name={implementationTypeKey}
            value={selectedNode.data[implementationTypeKey] || ""}
            onChange={(e) => handleNumberChange(implementationTypeKey, e.target.value)}
            className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 bg-white"
          >
            <option value="">Select implementation type</option>
            {implementationTypeOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>
      </div>**/}
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
          onChange={(e) => handleFileUpload(e, implementationKey)}
          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
        />
      </div>
      <span className="text-sm text-gray-500">{selectedNode.data[fileNameKey]}</span>

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
        value={selectedNode.data[implementationKey] || implementationContent}
        onChange={(e) =>
          handleNumberChange(implementationKey, e.target.value)
        }
        className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
        placeholder="File content will appear here or enter manually"
      />
    </>
  );
};
