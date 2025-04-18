import useStore from "@/config/store";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
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
      if (field === "outputIdentifier" || field === "quantumStateName" || field === "encodingType" || field === "implementationType" || field === "size"
        || field === "operator" || field === "minMaxOperator" || field === "uncomputeImplementationType" || field === "implementation" || field === "fileName" ||
        field === "uncomputeImplementation") {
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

            {selectedNode.data.encodingType === "Basis Encoding" && (<><label
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
        {selectedNode?.type === "arithmeticOperatorNode" && (
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
      </aside>
    </>
  );
};
