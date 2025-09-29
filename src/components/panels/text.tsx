import { useStore } from "@/config/store";
import { AlgorithmNode, ClassicalAlgorithmNode, parameterized_one_qubit, parameterized_two_qubit, multi_parameterized_two_qubit, OperatorNode } from "@/constants";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (nodeId: string, identifier: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  updateNodeLabel: state.updateNodeLabel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});


export const TextPanel = () => {
  const { selectedNode, updateNodeLabel, updateNodeValue, setSelectedNode } = useStore(
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
  const [uncomputeImplementationContent, setUncomputeImplementationContent] = useState("");
  const [encodingType, setEncodingType] = useState("");
  console.log(selectedNode);

  // Handle text change for label
  function handleChange(value: string) {
    console.log(selectedNode && updateNodeLabel(selectedNode.id, value));
    selectedNode && updateNodeLabel(selectedNode.id, value);
  }

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
      // Replace "pi" or "π" with Math.PI
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
          ? degToRad(evaluated)
          : evaluated;

    }
    handleNumberChange("parameter", evaluated);
  };


  // Handle other changes based on node type
  function handleNumberChange(field: string, value: string) {
    if (selectedNode) {
      if (field === "encodingType") {
        setEncodingType(value);

      }
      if (field === "implementation") {
        setImplementationContent(value);
      }
      if (field === "uncomputeImplementation") {
        setUncomputeImplementationContent(value);
      }
      console.log(value);
      console.log(field)
      if (field === "gamma" || field === "lambda"|| field === "theta"|| field === "phi" ||field === "parameterType" || field === "outputIdentifier" || field === "quantumStateName" || field === "encodingType" || field === "implementationType" || field === "size"
        || field === "operator" || field === "minMaxOperator" || field === "uncomputeImplementationType" || field === "implementation" || field === "fileName" ||
        field === "uncomputeImplementation" || field === "parameter" || field === "nodeType" || field === "basis") {
        selectedNode.data[field] = value;
        updateNodeValue(selectedNode.id, field, value);
      }
      else if (!isNaN(Number(value))) {
        selectedNode.data[field] = value;
        updateNodeValue(selectedNode.id, field, value);
      }

    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, field: string) {
    if (event.target.files && selectedNode) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = function (e) {
        /**
         *  const base64String = e.target?.result as string;
        selectedNode.data.file = base64String;
        updateNodeValue(selectedNode.id, "implementation", base64String); // Store base64 string
         */
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

      reader.readAsText(file); // Read file as text
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

            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="outputIdentifier"
            >
              Output Identifier
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="outputIdentifier"
                name="outputIdentifier"
                value={selectedNode.data.outputIdentifier || ""}
                onChange={(e) =>
                  handleNumberChange("outputIdentifier", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter output identifier"
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
                <option value="Amplitude Encoding">Amplitude Encoding</option>
                <option value="Angle Encoding">Angle Encoding</option>
                <option value="Basis Encoding">Basis Encoding</option>
                <option value="Custom Encoding">Custom Encoding</option>
                <option value="Matrix Encoding">Matrix Encoding</option>
                <option value="Schmidt Decomposition">Schmidt Decomposition</option>
              </select>
            </div>

            {(<><label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="size"
            >
              Size
            </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="size"
                  name="size"
                  value={selectedNode.data.size || ""}
                  onChange={(e) => handleNumberChange("size", e.target.value)}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  placeholder="Enter size"
                />
              </div></>)}
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
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Upload Implementation File
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />

            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
          </div>
        )}
        {selectedNode?.data.label === "Prepare State" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="size"
            >
              Size (e.g., 10)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="size"
                name="size"
                value={selectedNode.data.size || ""}
                onChange={(e) => handleNumberChange("size", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter size"
              />
            </div>

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
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="implementationType"
            >
              Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="implementationType"
                name="implementationType"
                value={selectedNode.data.implementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("implementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="fileUpload"
            >
              Upload Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
          </div>
        )}
        {selectedNode?.type === OperatorNode && (
          <div className="p-2 mt-3">

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
                <option value="-">-</option>
                <option value="/">/</option>
                <option value="*">*</option>
                <option value="**">**</option>
              </select>
            </div>

            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="outputIdentifier"
            >
              Output Identifier
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="outputIdentifier"
                name="outputIdentifier"
                value={selectedNode.data.outputIdentifier || ""}
                onChange={(e) => handleNumberChange("outputIdentifier", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter output identifier"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="implementationType"
            >
              Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="implementationType"
                name="implementationType"
                value={selectedNode.data.implementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("implementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="fileUpload"
            >
              Upload Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
          </div>
        )}

        {selectedNode?.type === "comparisonOperatorNode" && (
          <div className="p-2 mt-3">
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

            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="outputIdentifier"
            >
              Output Identifier
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="outputIdentifier"
                name="outputIdentifier"
                value={selectedNode.data.outputIdentifier || ""}
                onChange={(e) => handleNumberChange("outputIdentifier", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter output identifier"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="implementationType"
            >
              Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="implementationType"
                name="implementationType"
                value={selectedNode.data.implementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("implementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="fileUpload"
            >
              Upload Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
          </div>
        )}
        {selectedNode?.type === "minMaxNode" && (
          <div className="p-2 mt-3">

            <label className="block text-sm font-medium text-start text-gray-700 mt-2" htmlFor="minMaxOperator">
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

            <label className="block text-sm font-medium text-start text-gray-700 mt-2" htmlFor="outputIdentifier">
              Output Identifier
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="outputIdentifier"
                name="outputIdentifier"
                value={selectedNode.data.outputIdentifier || ""}
                onChange={(e) => handleNumberChange("outputIdentifier", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter output identifier"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="implementationType"
            >
              Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="implementationType"
                name="implementationType"
                value={selectedNode.data.implementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("implementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="fileUpload"
            >
              Upload Implementation File
            </label>

            <div className="mt-1">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
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

            <label className="block text-sm font-medium text-start text-gray-700 mt-2" htmlFor="indices">
              Indices
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="indices"
                name="indices"
                value={selectedNode.data.indices || ""}
                onChange={(e) => handleNumberChange("indices", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter indices"
              />
            </div>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2" htmlFor="indices">
              Basis
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="basis"
                name="basis"
                value={selectedNode.data.basis || ""}
                onChange={(e) => handleNumberChange("basis", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Z"
              />
            </div>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2" htmlFor="outputIdentifier">
              Output Identifier
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="outputIdentifier"
                name="outputIdentifier"
                value={selectedNode.data.outputIdentifier || ""}
                onChange={(e) => handleNumberChange("outputIdentifier", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter output identifier"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="implementationType"
            >
              Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="implementationType"
                name="implementationType"
                value={selectedNode.data.implementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("implementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="fileUpload"
            >
              Upload Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="fileUpload"
                name="fileUpload"
                onChange={e => handleFileUpload(e, "implementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Implementation Content
            </label>
            <textarea
              id="implementationContent"
              name="implementationContent"
              value={selectedNode.data.implementation || implementationContent}
              onChange={(e) => handleNumberChange("implementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
            />
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="uncomputeImplementationType"
            >
              Uncompute Implementation Type
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="uncomputeImplementationType"
                name="uncomputeImplementationType"
                value={selectedNode.data.uncomputeImplementationType || ""
                }
                onChange={(e) =>
                  handleNumberChange("uncomputeImplementationType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter uncompute implementation type"
              />
            </div>
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="uncomputeFileUpload"
            >
              Upload Uncompute Implementation File
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="uncomputeFileUpload"
                name="uncomputeFileUpload"
                onChange={e => handleFileUpload(e, "uncomputeImplementation")}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              />
            </div>
            <span className="text-sm text-gray-500">{selectedNode.data.uncomputeFileName}</span>
            <label className="block text-sm font-medium text-start text-gray-700 mt-2">
              Uncompute Implementation Content
            </label>
            <textarea
              id="uncomputeImplementationContent"
              name="uncomputeImplementationContent"
              value={selectedNode.data.uncomputeImplementation || uncomputeImplementationContent}
              onChange={(e) => handleNumberChange("uncomputeImplementation", e.target.value)}
              className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
              placeholder="File content will appear here or enter manually"
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
                    type="text"
                    id="parameter"
                    name="parameter"
                    value={
                      selectedNode.data.parameterType === "degree"
                        ? radToDeg(selectedNode.data.parameter || 0)
                        : selectedNode.data.parameter || ""
                    }
                    onChange={(e) => handleParameterChange(e.target.value)}
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
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="implementationType"
                >
                  Implementation Type
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="implementationType"
                    name="implementationType"
                    value={selectedNode.data.implementationType || ""
                    }
                    onChange={(e) =>
                      handleNumberChange("implementationType", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter implementation type"
                  />
                </div>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="fileUpload"
                >
                  Upload Implementation File
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="fileUpload"
                    name="fileUpload"
                    onChange={e => handleFileUpload(e, "implementation")}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  />
                </div>
                <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

                <label className="block text-sm font-medium text-start text-gray-700 mt-2">
                  Implementation Content
                </label>
                <textarea
                  id="implementationContent"
                  name="implementationContent"
                  value={selectedNode.data.implementation || implementationContent}
                  onChange={(e) => handleNumberChange("implementation", e.target.value)}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
                  placeholder="File content will appear here or enter manually"
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
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="implementationType"
                >
                  Implementation Type
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="implementationType"
                    name="implementationType"
                    value={selectedNode.data.implementationType || ""
                    }
                    onChange={(e) =>
                      handleNumberChange("implementationType", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter implementation type"
                  />
                </div>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="fileUpload"
                >
                  Upload Implementation File
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="fileUpload"
                    name="fileUpload"
                    onChange={e => handleFileUpload(e, "implementation")}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  />
                </div>
                <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

                <label className="block text-sm font-medium text-start text-gray-700 mt-2">
                  Implementation Content
                </label>
                <textarea
                  id="implementationContent"
                  name="implementationContent"
                  value={selectedNode.data.implementation || implementationContent}
                  onChange={(e) => handleNumberChange("implementation", e.target.value)}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
                  placeholder="File content will appear here or enter manually"
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

                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="implementationType"
                >
                  Implementation Type
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="implementationType"
                    name="implementationType"
                    value={selectedNode.data.implementationType || ""
                    }
                    onChange={(e) =>
                      handleNumberChange("implementationType", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter implementation type"
                  />
                </div>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="fileUpload"
                >
                  Upload Implementation File
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="fileUpload"
                    name="fileUpload"
                    onChange={e => handleFileUpload(e, "implementation")}
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  />
                </div>
                <span className="text-sm text-gray-500">{selectedNode.data.fileName}</span>

                <label className="block text-sm font-medium text-start text-gray-700 mt-2">
                  Implementation Content
                </label>
                <textarea
                  id="implementationContent"
                  name="implementationContent"
                  value={selectedNode.data.implementation || implementationContent}
                  onChange={(e) => handleNumberChange("implementation", e.target.value)}
                  className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
                  placeholder="File content will appear here or enter manually"
                />

              </div>
            )}
          </aside>
      </>
      );
};
