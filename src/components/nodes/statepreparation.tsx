import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
import {
  Edge,
  Handle,
  Node,
  Position,
  useUpdateNodeInternals,
} from "reactflow";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { isPositiveIntegerSize } from "../utils/outputPort";
import { classicalConstructColor } from "@/constants";
import { AlertCircle } from "lucide-react";
import { findDuplicateOutputIdentifiers } from "../utils/utils";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  compact: boolean;
  completionGuaranteed: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
  setTypeError: (message: string) => void;
  experienceLevel: string;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  completionGuaranteed: state.completionGuaranteed,
  compact: state.compact,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setTypeError: state.setTypeError,
  experienceLevel: state.experienceLevel,
});

export const StatePreparationNode = memo((node: Node) => {
  console.log("StatePreparation Node Beginning to exist");

  const [bound] = useState("");
  const [quantumStateName, setQuantumStateName] = useState("Bell State φ+");
  const [showingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [missingSizeError, setMissingSizeError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [encodingType, setEncodingType] = useState("Basis Encoding");
  const [mounted, setMounted] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);
  const [boundError, setBoundError] = useState(false);

  const [mixedView, setMixedView] = useState(false);

  const explorerLabelMap: Record<string, string> = {
    "Prepare State": "Prepare State",
    "Encode Value": "Encode Value",
    "Basis Encoding": "Basis Encoding",
    "Angle Encoding": "Angle Encoding",
    "Custom Encoding": "Custom Encoding",
    "Matrix Encoding": "Matrix Encoding",
    "Schmidt Decomposition": "State Split",
    "Amplitude Encoding": "Amplitude Encoding",
  };

  // Mapping die einzelnen Quantum States im Prepare State Dropdown
  const quantumStateLabelMap: Record<string, string> = {
    "Bell State φ+": "Entangled Pair ϕ+",
    "Bell State φ-": "Entangled Pair ϕ-",
    "Bell State ψ+": "Entangled Pair ψ+",
    "Bell State ψ-": "Entangled Pair ψ-",
    "Custom State": "My Defined State",
    GHZ: "All Together",
    "Uniform Superposition": "All Options Equal",
    "W-State": "Shared One",
  };

  const encoding = node.data.encodingType
    ? node.data.encodingType.charAt(0).toUpperCase() +
      node.data.encodingType.slice(1)
    : "";

  const icon = encoding.includes("Basis")
    ? "basisEncodingIcon.png"
    : encoding.includes("Angle")
      ? "angleEncodingIcon.png"
      : encoding.includes("Amplitude")
        ? "amplitudeEncodingIcon.png"
        : encoding.includes("Custom")
          ? "customEncodingIcon.png"
          : encoding.includes("Matrix")
            ? "matrixEncodingIcon.png"
            : encoding.includes("Schmidt")
              ? "schmidtDecompositionIcon.png"
              : "encodeValueIcon.png";

  const {
    updateNodeValue,
    setSelectedNode,
    setTypeError,
    edges,
    nodes,
    compact,
    experienceLevel,
  } = useStore(selector, shallow);

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    const checkUserRoles = () => {
      const states = awareness.getStates();
      let hasPioneer = false;
      let hasExplorer = false;

      states.forEach((state: any) => {
        if (state.cursor && state.cursor.role) {
          if (state.cursor.role === "pioneer") hasPioneer = true;
          if (state.cursor.role === "explorer") hasExplorer = true;
        }
      });

      setMixedView(hasPioneer && hasExplorer);
    };

    checkUserRoles();
    awareness.on("change", checkUserRoles);

    return () => {
      awareness.off("change", checkUserRoles);
    };
  }, []);

  const handleStateChange = (e, field) => {
    const value = e.target.value;

    if (field === "quantumStateName") {
      setQuantumStateName(value);
    }

    if (field === "encodingType") {
      setEncodingType(value);
    }

    if (field === "bound") {
      const num = parseFloat(value);
      const isValid = value === "" || (!isNaN(num) && num >= 0 && num <= 1);
      setBoundError(!isValid);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
    updateNodeInternals(node.id);
  };

  useEffect(() => {
    if (node.data.label === "Encode Value") {
      if (node.data.encodingType !== null && !mounted) {
        updateNodeValue(node.id, "encodingType", node.data.encodingType);
      } else {
        if (node.data.label === "Basis Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else if (node.data.label === "Angle Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else if (node.data.label === "Amplitude Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else if (node.data.label === "Custom Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else if (node.data.label === "Schmidt Decomposition") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else if (node.data.label === "Matrix Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        } else {
          updateNodeValue(node.id, "encodingType", encodingType);
        }
      }
    } else {
      if (node.data.encodingType !== null && !mounted) {
      } else {
        updateNodeValue(node.id, "quantumStateName", quantumStateName);
      }
    }

    updateNodeInternals(node.id);
    setMounted(true);
  }, []);

  /*
   * Size validation.
   *
   * Generic rule:
   * - non-empty size must be a positive integer
   *
   * State-specific rules:
   * - GHZ / W-State: size >= 3
   * - Uniform Superposition / Custom State: size >= 1
   * - Prepare State without a size: required
   *
   * Bell State automatic sizing is intentionally preserved:
   * for Bell states no local size error is generated here.
   */
  useEffect(() => {
    const value = String(node.data.size ?? "");
    const trimmedValue = value.trim();
    const num = Number(value);

    const hasInvalidSize = trimmedValue !== "" && !isPositiveIntegerSize(value);

    if (node.data.label === "Prepare State" && trimmedValue === "") {
      setMissingSizeError(true);
      setSizeError(false);
      return;
    }

    if (quantumStateName === "GHZ" || quantumStateName === "W-State") {
      const isInvalid = trimmedValue === "" || hasInvalidSize || num < 3;

      setSizeError(isInvalid);
      setMissingSizeError(false);
      return;
    }

    if (
      quantumStateName === "Uniform Superposition" ||
      quantumStateName === "Custom State"
    ) {
      const isInvalid = trimmedValue === "" || hasInvalidSize || num < 1;

      setSizeError(isInvalid);
      setMissingSizeError(false);
      return;
    }

    // Bell State and other automatically determined sizes keep
    // their existing behavior. Only explicitly invalid values
    // should show the generic validation error.
    setSizeError(hasInvalidSize);
    setMissingSizeError(false);
  }, [quantumStateName, node.data.size, node.data.label]);

  useEffect(() => {
    const encoding = node.data.encodingType;

    const isArrayOnly =
      encoding !== "Basis Encoding" && encoding !== "Custom Encoding";

    if (!isArrayOnly) return;

    const edge = edges.find(
      (e) =>
        e.target === node.id &&
        e.targetHandle === `classicalHandleStatePreparationInput0${node.id}`,
    );

    if (!edge) return;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return;

    const outputIndex =
      sourceNode.data.outputs?.findIndex((o) => o.id === edge.sourceHandle) ??
      0;

    const sourceType =
      sourceNode.data.outputTypes?.[outputIndex]?.toLowerCase();

    if (sourceType !== "array") {
      useStore.getState().onEdgesChange([{ id: edge.id, type: "remove" }]);
      const errorMsg =
        sourceType == null
          ? "Source does not have a type, your diagram is probably broken, connection removed"
          : `Type mismatch: ${sourceType} -> array, connection removed`;
      console.error(errorMsg);
      setTypeError(errorMsg);
    }
  }, [node.data.encodingType]);

  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    const isDuplicate = duplicates.has(identifier);

    const startsWithDigit = /^\d/.test(identifier);
    if ((isDuplicate && identifier !== "") !== outputIdentifierError) {
      setOutputIdentifierError(isDuplicate && identifier !== "");
    }
    if (startsWithDigit) {
      setStartsWithDigitError(true);
    } else {
      setStartsWithDigitError(false);
    }
    if (!node.data.encodingType && node.data.label === "Basis Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Custom Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Angle Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Amplitude Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Matrix Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (
      !node.data.encodingType &&
      node.data.label === "Schmidt Decomposition"
    ) {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Encode Value") {
      updateNodeValue(node.id, "encodingType", encodingType);
    }
    if (!node.data.quantumStateName && node.data.label === "Prepare State") {
      updateNodeValue(node.id, "quantumStateName", quantumStateName);
    }
    if (
      (node.data.encodingType === "Basis Encoding" ||
        node.data.encodingType === "Angle Encoding") &&
      encodingType !== "Angle Encoding" &&
      encodingType !== "Basis Encoding"
    ) {
      setEncodingType(node.data.encodingType);
      updateNodeInternals(node.id);
    }
    if (node.data.quantumStateName !== quantumStateName) {
      setQuantumStateName(node.data.quantumStateName);
      updateNodeInternals(node.id);
    }
  }, [node.data.outputIdentifier, node.id]);

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [compact]);

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [node.data.encodingType]);

  const { data, selected } = node;
  const id = node.id;

  const baseHeight =
    data.label === "Prepare State"
      ? 460
      : data.label === "Encode Value"
        ? 450
        : 350;
  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;

      awareness.getStates().forEach((state: any) => {
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
        }
      });

      setRemoteHighlightColor(foundColor);
    };

    checkRemoteSelection();
    awareness.on("change", checkRemoteSelection);

    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]);

  const getDropdownLabel = (pioneerLabel: string) => {
    if (!mixedView) return pioneerLabel;
    const explorerLabel = quantumStateLabelMap[pioneerLabel] || pioneerLabel;
    return `P: ${pioneerLabel} / E: ${explorerLabel}`;
  };

  return (
    <div
      className="grand-parent"
      style={{
        width: showingChildren ? 360 : 320,
        height: baseHeight,
      }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid shadow-md",
            mixedView && "border-purple-400",
          )}
          style={{
            height: [
              "Encode Value",
              "Custom Encoding",
              "Basis Encoding",
              "Angle Encoding",
              "Amplitude Encoding",
              "Matrix Encoding",
              "Schmidt Decomposition",
            ].includes(data.label)
              ? `${baseHeight}px`
              : "370px",
            borderColor: remoteHighlightColor
              ? remoteHighlightColor
              : selected
                ? "#3B82F6"
                : "#374151",
            boxShadow: remoteHighlightColor
              ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}`
              : undefined,
          }}
        >
          {outputIdentifierError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                Identifier is not unique.
              </div>
            </div>
          )}

          {startsWithDigitError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !outputIdentifierError ? "35px" : "50px",
                }}
              >
                Identifier starts with a number.
              </div>
            </div>
          )}

          {node.data.size !== "" && sizeError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(outputIdentifierError || startsWithDigitError)
                    ? "35px"
                    : "80px",
                }}
              >
                {node.data.label === "Prepare State" &&
                (quantumStateName === "GHZ" || quantumStateName === "W-State")
                  ? "Size must be at least 3."
                  : node.data.label === "Prepare State" &&
                      (quantumStateName === "Uniform Superposition" ||
                        quantumStateName === "Custom State")
                    ? "Size must be at least 1."
                    : "Size must be a positive integer"}
              </div>
            </div>
          )}
          {(node.data.size === "" || missingSizeError) &&
            node.data.label === "Prepare State" && (
              <div className="absolute top-2 right-[-40px] group z-20">
                <AlertCircle className="text-red-600 w-5 h-5" />
                <div
                  className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                  style={{
                    top: !(outputIdentifierError || startsWithDigitError)
                      ? "35px"
                      : "80px",
                  }}
                >
                  Size is required.
                </div>
              </div>
            )}

          {boundError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(
                    outputIdentifierError ||
                    startsWithDigitError ||
                    sizeError
                  )
                    ? "35px"
                    : "110px",
                }}
              >
                Bound must be a number between 0 and 1.
              </div>
            </div>
          )}

          <div className="w-full flex items-center" style={{ height: "52px" }}>
            {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-4 -right-4 w-8 h-8"
              />
            )}
            <div
              className="w-full bg-blue-300 py-1 px-2 flex items-center"
              style={{ height: "inherit" }}
            >
              {[
                "Prepare State",
                "Encode Value",
                "Basis Encoding",
                "Custom Encoding",
                "Angle Encoding",
                "Amplitude Encoding",
                "Matrix Encoding",
                "Schmidt Decomposition",
              ].includes(data.label) && (
                <img
                  src={icon}
                  alt={`${data.label} icon`}
                  className={
                    data.label === "Prepare State"
                      ? "w-[45px] h-[45px] object-contain flex-shrink-0"
                      : data.label === "Amplitude Encoding"
                        ? "w-[42px] h-[42px] object-contain flex-shrink-0"
                        : "w-[40px] h-[40px] object-contain flex-shrink-0"
                  }
                />
              )}

              <div className="h-full w-[1px] bg-black mx-2" />

              <div className="flex flex-col justify-center pl-2 leading-tight select-none">
                <div className="flex flex-col justify-center pl-2 leading-tight select-none">
                  {mixedView ? (
                    <span className="font-semibold text-xs text-blue-900 block">
                      P: {data.label} / E:{" "}
                      {explorerLabelMap[data.label] || data.label}
                    </span>
                  ) : experienceLevel === "explorer" ? (
                    <span className="font-semibold text-sm">
                      {explorerLabelMap[data.label] || data.label}
                    </span>
                  ) : (
                    <span className="font-semibold text-sm">{data.label}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!showingChildren && (
            <div className="px-3 py-1 mb-1">
              {node.data.label === "Encode Value" && (
                <>
                  <label className="text-sm text-black">Encoding Type:</label>
                  <select
                    className="w-full p-1 mt-1 bg-white rounded-full text-center text-sm text-black border-2 border-blue-300 rounded"
                    value={node.data.encodingType || encodingType}
                    style={{
                      visibility: showingChildren ? "hidden" : "visible",
                    }}
                    onChange={(e) => handleStateChange(e, "encodingType")}
                  >
                    <option value="basis">Basis Encoding</option>
                    <option value="amplitude">Amplitude Encoding</option>
                    <option value="angle">Angle Encoding</option>
                    <option value="custom">Custom Encoding</option>
                    <option value="matrix">Matrix Encoding</option>
                  </select>

                  {!node.data.encodingType.includes("Basis") &&
                    !node.data.encodingType.includes("Angle") &&
                    !node.data.encodingType.includes("Custom") && (
                      <>
                        <label className="text-sm text-black block mt-2">
                          Error Bound:
                        </label>
                        <input
                          className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                          type="text"
                          id="bound"
                          value={node.data.bound || bound}
                          onChange={(e) => handleStateChange(e, "bound")}
                          placeholder="Enter bound"
                        />
                      </>
                    )}

                  {node.data.encodingType === "Basis Encoding" && (
                    <>
                      <label className="text-sm text-black block mt-2">
                        Decimal Precision:
                      </label>
                      <input
                        className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                        type="number"
                        min="0"
                        value={node.data.decimalPrecision ?? ""}
                        onChange={(e) =>
                          handleStateChange(e, "decimalPrecision")
                        }
                        placeholder="e.g. 1"
                      />
                    </>
                  )}
                </>
              )}

              {(node.data.label === "Amplitude Encoding" ||
                node.data.label === "Matrix Encoding" ||
                node.data.label === "Schmidt Decomposition") && (
                <>
                  <label className="text-sm text-black block mt-2">
                    Error Bound:
                  </label>
                  <input
                    className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                    type="text"
                    id="bound"
                    value={node.data.bound || bound}
                    onChange={(e) => handleStateChange(e, "bound")}
                    placeholder="Enter bound"
                  />
                </>
              )}

              {node.data.label === "Basis Encoding" && (
                <>
                  <label className="text-sm text-black block mt-2">
                    Decimal Precision:
                  </label>
                  <input
                    className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                    type="number"
                    min="0"
                    value={node.data.decimalPrecision ?? ""}
                    onChange={(e) => handleStateChange(e, "decimalPrecision")}
                    placeholder="e.g. 1"
                  />
                </>
              )}

              {node.data.label === "Prepare State" && (
                <>
                  <label
                    className="text-sm text-black"
                    style={{
                      visibility: showingChildren ? "hidden" : "visible",
                    }}
                  >
                    Quantum State Name:
                  </label>

                  <select
                    style={{
                      visibility: showingChildren ? "hidden" : "visible",
                    }}
                    className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-md"
                    value={node.data.quantumStateName || quantumStateName}
                    onChange={(e) => handleStateChange(e, "quantumStateName")}
                  >
                    <option value="Bell State φ+">
                      {getDropdownLabel("Bell State φ+")}
                    </option>
                    <option value="Bell State φ-">
                      {getDropdownLabel("Bell State φ-")}
                    </option>
                    <option value="Bell State ψ+">
                      {getDropdownLabel("Bell State ψ+")}
                    </option>
                    <option value="Bell State ψ-">
                      {getDropdownLabel("Bell State ψ-")}
                    </option>
                    <option value="Custom State">
                      {getDropdownLabel("Custom State")}
                    </option>
                    <option value="GHZ">{getDropdownLabel("GHZ")}</option>
                    <option value="Uniform Superposition">
                      {getDropdownLabel("Uniform Superposition")}
                    </option>
                    <option value="W-State">
                      {getDropdownLabel("W-State")}
                    </option>
                  </select>
                </>
              )}
            </div>
          )}

          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col overflow-visible">
              {(node.data.label === "Encode Value" ||
                node.data.label === "Basis Encoding" ||
                node.data.label === "Custom Encoding" ||
                node.data.label === "Angle Encoding" ||
                node.data.label === "Amplitude Encoding" ||
                node.data.label === "Matrix Encoding" ||
                node.data.label === "Schmidt Decomposition") && (
                <div
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: classicalConstructColor,
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    borderTopRightRadius: "20px",
                    borderBottomRightRadius: "20px",
                  }}
                >
                  <Handle
                    type="target"
                    id={`classicalHandleStatePreparationInput0${node.id}`}
                    position={Position.Left}
                    className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                    style={{
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <div className="flex flex-col items-center w-full leading-tight">
                    <span className="text-black text-sm">
                      {node.data.inputs[0]?.outputIdentifier || "Value"}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      type: {node.data.inputTypes[0]?.toLowerCase() ?? "number"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="custom-node-port-out">
            <>
              {node.data.label === "Prepare State" && (
                <OutputPort
                  node={node}
                  index={0}
                  type={"quantum"}
                  sizeRequired={true}
                  nodes={nodes}
                  outputs={outputs}
                  setOutputs={setOutputs}
                  edges={edges}
                  sizeError={sizeError || missingSizeError}
                  showSizeErrorAlert={false}
                  outputIdentifierError={
                    outputIdentifierError || startsWithDigitError
                  }
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />
              )}
              {(node.data.label === "Encode Value" ||
                node.data.label === "Custom Encoding" ||
                node.data.label === "Basis Encoding" ||
                node.data.label === "Amplitude Encoding" ||
                node.data.label === "Angle Encoding" ||
                node.data.label === "Matrix Encoding" ||
                node.data.label === "Schmidt Decomposition") && (
                <OutputPort
                  node={node}
                  index={0}
                  type={"quantum"}
                  nodes={nodes}
                  outputs={outputs}
                  setOutputs={setOutputs}
                  edges={edges}
                  sizeError={sizeError}
                  showSizeErrorAlert={false}
                  outputIdentifierError={
                    outputIdentifierError || startsWithDigitError
                  }
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />
              )}
            </>
          </div>
        </div>
      </div>
    </div>
  );
});
