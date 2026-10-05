import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useState } from "react";
import {
  Edge,
  Handle,
  Node,
  Position,
  useUpdateNodeInternals,
} from "reactflow";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import * as consts from "@/constants";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const ClassicalOperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode } = useStore(
    selector,
    shallow,
  );

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [_y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [operation, _setOperation] = useState("+");
  const [showingChildren, _setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();

  const handleYChange = (e, field) => {
    const value = e.target.value;
    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
    setY(value);
  };

  const inputTypesMatch = (): boolean => {
    if (
      node.data.label ===
      consts.classicalLabel + consts.bitwiseOperatorLabel
    ) {
      return true; // fixed type: bit
    }

    const t0 = getInputType(0);
    const t1 = getInputType(1);

    if (t0 === "any" || t1 === "any") return true;
    return t0 === t1;
  };

  const getInputType = (inputIndex: number): string => {
    if (label.includes("Bit")) return "bit";
    else if (label.includes("Min & Max")) return "array";
    else {
      const handleId =
        inputIndex === 0
          ? `classicalHandleOperationInput0${node.id}`
          : `classicalHandleOperationInput1${node.id}`;

      // Check if this input is connected
      const edge = edges.find(
        (e) => e.target === node.id && e.targetHandle === handleId,
      );

      if (edge) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === "dataTypeNode") {
            return sourceNode.data?.dataType ?? "any";
          }

          if (sourceNode.type === "measurementNode") {
            return "array";
          }
          // Optionally infer type from source node outputs
          if (sourceNode.data?.outputTypes[0]) {
            return sourceNode.data?.outputTypes[0];
          }
        }
      }

      // If not connected, check the **other input**
      const otherIndex = inputIndex === 0 ? 1 : 0;
      const otherHandleId = `classicalHandleOperationInput${otherIndex}${node.id}`;
      const otherEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === otherHandleId,
      );

      if (otherEdge) {
        const otherSourceNode = nodes.find((n) => n.id === otherEdge.source);
        if (otherSourceNode) {
          if (otherSourceNode.type === "dataTypeNode") {
            return otherSourceNode.data?.dataType ?? "any";
          }
          if (otherSourceNode.data?.outputTypes[0]) {
            return otherSourceNode.data?.outputTypes[0];
          }
        }
      }

      // Operator-based fallback
      if (
        node.data.label ===
        consts.classicalLabel + consts.bitwiseOperatorLabel
      ) {
        return "bit";
      }
      if (
        node.data.label ===
        consts.classicalLabel + consts.minMaxOperatorLabel
      ) {
        return "array";
      }
    }
    return "any"; // Default
  };

  useEffect(() => {
    updateNodeInternals(node.id);
    if (node.data.operator === undefined) {
      if (
        node.data.label ===
        consts.classicalLabel + consts.arithmeticOperatorLabel
      ) {
        updateNodeValue(node.id, "operator", "+");
      } else if (
        node.data.label ===
        consts.classicalLabel + consts.bitwiseOperatorLabel
      ) {
        updateNodeValue(node.id, "operator", "OR");
      }
      if (
        node.data.label ===
        consts.classicalLabel + consts.comparisonOperatorLabel
      ) {
        updateNodeValue(node.id, "operator", "<");
      } else {
        updateNodeValue(node.id, "operator", "min");
      }
    } else {
      updateNodeValue(node.id, "operator", node.data.operator);
    }
  }, []);

  const baseHeight = 400;
  const dynamicHeight = baseHeight;

  const iconMap = {
    "Classical Arithmetic Operator": "classicalArithmeticIcon.png",
    "Classical Bitwise Operator": "classicalBitwiseIcon.png",
    "Classical Min & Max Operator": "classicalMinMaxIcon.png",
    "Classical Comparison Operator": "classicalComparisonIcon.png",
  };
  const label = data.label;
  const iconSrc = iconMap[label];
  const iconSizeMap = {
    "Classical Arithmetic Operator": { width: 45, height: 45 },
    "Classical Bitwise Operator": { width: 45, height: 45 },
    "Classical Min & Max Operator": { width: 45, height: 45 },
    "Classical Comparison Operator": { width: 56, height: 56 },
  };

  const id = node.id;

  const [_remoteHighlightColor, setRemoteHighlightColor] = useState<
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
    <div
      className="grand-parent"
      style={{
        width: showingChildren ? 360 : 320,
        height: showingChildren ? 400 : 373,
      }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md overflow-hidden",
            selected && "border-blue-500",
          )}
          style={{ height: `${dynamicHeight}px`, borderRadius: "40px" }}
        >
          <div className="w-full flex items-center" style={{ height: "52px" }}>
            <div
              className="w-full bg-orange-300 py-1 px-2 flex items-center"
              style={{
                height: "inherit",
                borderTopLeftRadius: "28px",
                borderTopRightRadius: "28px",
                overflow: "hidden",
                paddingLeft: "25px",
              }}
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
                style={{ paddingLeft: "15px" }}
              >
                {data.label.split(consts.classicalLabel)[1]}
              </span>
            </div>
          </div>

          <div className="px-3 py-1 mb-1">
            <label className="text-sm text-black">Operator:</label>
            <select
              className="w-full p-1 mt-1 bg-white text-center text-lg text-black border-2 border-orange-300 rounded-full"
              value={node.data.operator || operation}
              onChange={(e) => handleYChange(e, "operator")}
            >
              {node.data.label === "Classical Arithmetic Operator" && (
                <>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="/">/</option>
                  <option value="*">*</option>
                  <option value="**">**</option>
                </>
              )}

              {node.data.label === "Classical Bitwise Operator" && (
                <>
                  <option value="|">OR</option>
                  <option value="&">AND</option>
                  <option value="~">INVERT</option>
                  <option value="^">XOR</option>
                </>
              )}

              {node.data.label === "Classical Comparison Operator" && (
                <>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                </>
              )}

              {node.data.label === "Classical Min & Max Operator" && (
                <>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                </>
              )}
            </select>
          </div>

          <div className="custom-node-port-in mb-3 mt-2">
            <div className="absolute flex flex-col overflow-visible">
              <div
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: consts.classicalConstructColor,
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
                  id={`classicalHandleOperationInput0${node.id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />
                <div className="flex flex-col items-center w-full leading-tight">
                  <span className="text-black text-sm">
                    {node.data.inputs[0]?.outputIdentifier || "Input 1"}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    type: {getInputType(0)?.toLowerCase() ?? "unknown"}
                  </span>
                </div>
              </div>
              {node.data.label !==
                consts.classicalLabel + consts.minMaxOperatorLabel && (
                <div
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: consts.classicalConstructColor,
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
                    id={`classicalHandleOperationInput1${node.id}`}
                    position={Position.Left}
                    className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  />
                  <div className="flex flex-col items-center w-full leading-tight">
                    <span className="text-black text-sm">
                      {node.data.inputs[1]?.outputIdentifier || "Input 2"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        inputTypesMatch() ? "text-gray-600" : "text-red-500",
                      )}
                    >
                      type: {getInputType(1)?.toLowerCase() ?? "unknown"}
                    </span>
                  </div>
                </div>
              )}
              <div
                className="relative p-2 mb-1 overflow-visible"
                style={{
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  left: "132px",
                }}
              >
                <OutputPort
                  node={node}
                  index={0}
                  type={"classical"}
                  nodes={nodes}
                  outputs={outputs}
                  setOutputs={setOutputs}
                  edges={edges}
                  sizeError={sizeError}
                  outputIdentifierError={outputIdentifierError}
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
