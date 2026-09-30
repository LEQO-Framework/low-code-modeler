import { useStore } from "@/config/store";
import React, { memo, useEffect, useState } from "react";
import {
  Edge,
  Handle,
  Node,
  Position,
} from "reactflow";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import * as consts from "@/constants";
import { findDuplicateOutputIdentifiers } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  completionGuaranteed: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  completionGuaranteed: state.completionGuaranteed,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const OperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const {
    edges,
    nodes,
    updateNodeValue,
    setSelectedNode,
    completionGuaranteed,
  } = useStore(selector, shallow);

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [_y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [operation, _setOperation] = useState("+");
  const [sizeError, setSizeError] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);

  const handleYChange = (e, field) => {
    const value = e.target.value;
    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
    setY(value);
  };

  const isInvert =
    node.data.operator === "~" || node.data.operator === "INVERT";

  const isMinMax =
    node.data.label === consts.quantumLabel + consts.minMaxOperatorLabel;

  const showInput2 = !isMinMax && !isInvert;

  // 1. Validate output identifier on change
  const [operatorInitialized, setOperatorInitialized] = useState(false);

  // Only run operator initialization once
  useEffect(() => {
    if (!operatorInitialized && node.data.operator === undefined) {
      let defaultOperator = "+";
      if (node.data.label === consts.quantumLabel + consts.bitwiseOperatorLabel)
        defaultOperator = "~";
      else if (
        node.data.label ===
        consts.quantumLabel + consts.comparisonOperatorLabel
      )
        defaultOperator = "<";
      else if (
        node.data.label !==
        consts.quantumLabel + consts.arithmeticOperatorLabel
      )
        defaultOperator = "min";

      updateNodeValue(node.id, "operator", defaultOperator);
      setOperatorInitialized(true);
      //updateNodeInternals(node.id);
    }
  }, [node.id, node.data.label, node.data.operator, operatorInitialized]);

  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    const isDuplicate = duplicates.has(identifier);

    // Only update state if error state is actually changing
    if ((isDuplicate && identifier !== "") !== outputIdentifierError) {
      setOutputIdentifierError(isDuplicate && identifier !== "");
    }
    const startsWithDigit = /^\d/.test(identifier);
    if (startsWithDigit) {
      setStartsWithDigitError(true);
    } else {
      setStartsWithDigitError(false);
    }
  }, [nodes, node.data.outputIdentifier, node.id]);

  const iconMap = {
    "Quantum Arithmetic Operator": "arithmeticIcon.png",
    "Quantum Bitwise Operator": "bitwiseIcon.png",
    "Quantum Min & Max Operator": "minMaxIcon.png",
    "Quantum Comparison Operator": "comparisonIcon.png",
  };

  const label = data.label;
  const iconSrc = iconMap[label];
  const iconSizeMap = {
    "Quantum Arithmetic Operator": { width: 45, height: 45 },
    "Quantum Bitwise Operator": { width: 45, height: 45 },
    "Quantum Min & Max Operator": { width: 45, height: 45 },
    "Quantum Comparison Operator": { width: 56, height: 56 },
  };

  const id = node.id;

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any) => {
        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      console.log("COLOR", foundColor, foundName);
    };

    // Run once immediately on mount
    checkRemoteSelection();

    // 3. Listen to remote awareness updates
    awareness.on("change", checkRemoteSelection);

    // Clean up listener when the node unmounts
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]); // Re-run if node ID changes

  return (
    <div className="grand-parent">
      {outputIdentifierError && (
        <div className="absolute top-2 right-[-40px] group z-20">
          <AlertCircle className="text-red-600 w-5 h-5" />
          <div className="absolute top-5 left-[25px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
            Identifier is not unique
          </div>
        </div>
      )}

      {startsWithDigitError && (
        <div className="absolute top-2 right-[-40px] group z-20">
          <AlertCircle className="text-red-600 w-5 h-5" />
          <div
            className="absolute left-[25px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
            style={{
              top: !outputIdentifierError ? "35px" : "50px",
            }}
          >
            Identifier starts with a number
          </div>
        </div>
      )}

      <div
        className={"w-[320px] bg-white border border-solid shadow-md"}
        style={{
          height: "375px",
          borderColor: remoteHighlightColor
            ? remoteHighlightColor
            : selected
              ? "#3B82F6"
              : "#374151",
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
            : undefined,
        }}
      >
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
            {(() => {
              const { width, height } = iconSizeMap[node.data.label];
              return (
                <img
                  src={iconSrc}
                  alt="icon"
                  style={{ width: `${width}px`, height: `${height}px` }}
                  className="object-contain flex-shrink-0"
                />
              );
            })()}
            <div className="h-full w-[1px] bg-black mx-2" />
            <span
              className="font-semibold leading-none"
              style={{ paddingLeft: "25px" }}
            >
              {data.label.split(consts.quantumLabel)[1]}
            </span>
          </div>
        </div>

        <div className="px-3 py-1 mb-1">
          <label className="text-sm text-black">Operator:</label>
          <select
            className="w-full p-1 mt-1 bg-white text-center text-lg text-black border-2 border-blue-300 rounded-full"
            value={node.data.operator || operation}
            onChange={(e) => handleYChange(e, "operator")}
          >
            {node.data.label ===
              consts.quantumLabel + "Arithmetic Operator" && (
              <>
                <option value="+">+</option>
                {!completionGuaranteed && <option value="-">-</option>}
                {!completionGuaranteed && <option value="/">/</option>}
                {!completionGuaranteed && <option value="*">*</option>}
                {!completionGuaranteed && <option value="**">**</option>}
              </>
            )}

            {node.data.label === consts.quantumLabel + "Bitwise Operator" && (
              <>
                {!completionGuaranteed && <option value="|">OR</option>}
                {!completionGuaranteed && <option value="&">AND</option>}
                <option value="~">INVERT</option>
                {!completionGuaranteed && <option value="^">XOR</option>}
              </>
            )}

            {node.data.label ===
              consts.quantumLabel + "Comparison Operator" && (
              <>
                <option value="<">&lt;</option>
                <option value=">">&gt;</option>
                <option value="<=">&le;</option>
                <option value=">=">&ge;</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
              </>
            )}

            {node.data.label === consts.quantumLabel + "Min & Max Operator" && (
              <>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </>
            )}
          </select>
        </div>

        <div className="custom-node-port-in mb-3 mt-2">
          <div className="relative flex flex-col overflow-visible">
            <div
              className="relative p-2 mb-1"
              style={{
                backgroundColor: consts.quantumConstructColor,
                width: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Handle
                type="target"
                id={`quantumHandleOperationInput0${node.id}`}
                position={Position.Left}
                className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              />
              <div className="flex flex-col w-full text-center leading-tight">
                <span className="text-black text-sm">
                  {node.data.inputs[0]?.outputIdentifier || "Input 1"}
                </span>
                <span className="text-[10px] text-gray-600">
                  type: quantum register
                </span>
              </div>
            </div>
            {showInput2 && (
              <div
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: consts.quantumConstructColor,
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <Handle
                  type="target"
                  id={`quantumHandleOperationInput1${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />
                <div className="flex flex-col w-full text-center leading-tight">
                  <span className="text-black text-sm">
                    {node.data.inputs[1]?.outputIdentifier || "Input 2"}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    type: quantum register
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="custom-node-port-out">
          {(node.data.label === consts.quantumLabel + "Arithmetic Operator" ||
            node.data.label === consts.quantumLabel + "Bitwise Operator") && (
            <>
              <OutputPort
                node={node}
                index={0}
                type={"quantum"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                sizeError={sizeError}
                outputIdentifierError={
                  outputIdentifierError || startsWithDigitError
                }
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={setOutputIdentifierError}
                setSizeError={setSizeError}
                setSelectedNode={setSelectedNode}
                active={true}
              />
            </>
          )}
          {(node.data.label === consts.quantumLabel + "Comparison Operator" ||
            node.data.label === consts.quantumLabel + "Min & Max Operator") && (
            <>
              <OutputPort
                node={node}
                index={0}
                type={"classical"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                sizeError={sizeError}
                outputIdentifierError={
                  outputIdentifierError || startsWithDigitError
                }
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={setOutputIdentifierError}
                setSizeError={setSizeError}
                setSelectedNode={setSelectedNode}
                active={true}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
