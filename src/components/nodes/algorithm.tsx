import { memo, useEffect, useState } from "react";
import {
  Handle,
  Position,
  Node,
  Edge,
  useUpdateNodeInternals,
} from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import AncillaPort from "../utils/ancillaPort";
import UncomputePort from "../utils/uncomputePort";
import OutputPort, { isPositiveIntegerSize } from "../utils/outputPort";
import { cn } from "@/lib/utils";
import {
  ancillaConstructColor,
  classicalConstructColor,
  dirtyAncillaHandle,
  dirtyConstructColor,
  quantumConstructColor,
} from "@/constants";
import {
  findDuplicateOutputIdentifier,
  findDuplicateOutputIdentifiersInsideNode,
} from "../utils/utils";
import { AlertCircle } from "lucide-react";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  ancillaMode: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setEdges: (edge: Edge) => void;
  setNewEdges: (newEdges: Edge[]) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  ancillaMode: state.ancillaMode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges,
});

export const AlgorithmNode = memo((node: Node) => {
  const { data, selected } = node;
  const id = node.id;
  console.log(selected);
  console.log(data.numberQuantumInputs);
  const numberQuantumInputs = data.numberQuantumInputs || 0;
  const numberQuantumOutputs = data.numberQuantumOutputs || 0;
  const numberClassicalInputs = data.numberClassicalInputs || 0;
  const numberClassicalOutputs = data.numberClassicalOutputs || 0;

  const inputHandleCount = numberQuantumInputs + numberClassicalInputs;
  const outputHandleCount = numberQuantumOutputs + numberClassicalOutputs;

  const {
    edges,
    nodes,
    updateNodeValue,
    setSelectedNode,
    setNewEdges,
    ancillaMode,
  } = useStore(selector, shallow);

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
  const [classicalSizeErrors] = useState<{
    [key: number]: boolean;
  }>({});
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "");
  const updateNodeInternals = useUpdateNodeInternals();
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState({});

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [ancillaMode]);

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [
    node.data.numberQuantumInputs,
    node.data.numberClassicalInputs,
    node.data.numberQuantumOutputs,
    node.data.numberClassicalOutputs,
  ]);

  const isAncillaConnected = edges.some(
    (edge) =>
      edge.target === node.id &&
      edge.targetHandle === `ancillaHandleOperationInput2${node.id}`,
  );

  const isDirtyAncillaConnected = edges.some(
    (edge) =>
      edge.target === node.id &&
      edge.targetHandle === `${dirtyAncillaHandle}OperationInput3${node.id}`,
  );
  const getInputType = (handleId: any) => {
    const edge = edges.find((e) => e.targetHandle === handleId);
    if (!edge) return "any";

    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return "any";

    if (sourceNode.type === "dataTypeNode") {
      return sourceNode.data?.dataType?.toLowerCase() ?? "any";
    }

    return "any";
  };

  useEffect(() => {
    console.log("nodes", nodes);
    console.log("edges", edges);
    let selectedNode = node;
    let newErrors = {};
    console.log("ALGORITHM", outputs);

    // quantum outputs
    outputs.forEach((output, index) => {
      const outputIdentifier = output?.identifier?.trim();
      console.log("Outputidentifier", outputIdentifier);
      const size = String(output?.size ?? "").trim();
      sizeErrors[index] = size !== "" && !isPositiveIntegerSize(size);
      if (!outputIdentifier) return;
      const duplicates = findDuplicateOutputIdentifier(
        nodes,
        selectedNode.id,
        selectedNode,
        outputIdentifier,
      );
      let isDuplicate = false;
      for (const [key] of duplicates.entries()) {
        if (
          Array.isArray(key) &&
          key.some((item) => item.identifier === outputIdentifier)
        ) {
          isDuplicate = true;
          break;
        }
      }
      console.log(isDuplicate);
      isDuplicate =
        isDuplicate ||
        findDuplicateOutputIdentifiersInsideNode(
          nodes,
          selectedNode,
          outputIdentifier,
        );
      console.log(
        findDuplicateOutputIdentifiersInsideNode(
          nodes,
          selectedNode,
          outputIdentifier,
        ),
      );
      const startsWithDigit = /^\d/.test(outputIdentifier);
      console.log(isDuplicate);
      console.log(output);

      console.log("set for identifier error");
      console.log(outputIdentifier);
      // Flag error if identifier is invalid or duplicated
      newErrors[index] = startsWithDigit || isDuplicate;
      console.log(newErrors);
      console.log(newErrors[index]);
    });

    setOutputIdentifierErrors(newErrors);
    setSizeErrors(sizeErrors);
  }, [nodes, outputs, node.id]);

  const baseHeight = !ancillaMode ? 50 : 200;
  const extraHeightPerVariable = 130;
  const dynamicHeight =
    baseHeight +
    2 * 40 +
    3 * 50 +
    inputHandleCount * 50 +
    outputHandleCount * extraHeightPerVariable;

  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < outputHandleCount) {
    data.identifiers.push(
      "q" + Math.floor(100000 + Math.random() * 900000).toString(),
    );
  }

  // Remove extra identifiers
  if (data.identifiers.length > outputHandleCount) {
    const removedIdentifiers = data.identifiers.slice(outputHandleCount);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToRemove = edges.filter(
      (edge) =>
        !removedIdentifiers.some(
          (id, index) =>
            edge.sourceHandle ===
            `quantumHandleGateOutput${numberQuantumOutputs + index + 1}${node.id}`,
        ),
    );
    console.log("EDGES");
    console.log(edgesToRemove);

    if (edgesToRemove.length > 0) {
      console.log("remove edges");
      setNewEdges(edgesToRemove);
    }

    data.identifiers = data.identifiers.slice(0, outputHandleCount);
  }

  //console.log(nodeHeight)
  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any) => {
        // Skip your own client ID so you don't highlight it with your own color

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
        width: 360,
        height: 400,
      }}
    >
      <div className="grand-parent">
        <div
          className={
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md"
          }
          style={{
            height: `${dynamicHeight}px`,
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
          {(Object.values(outputIdentifierErrors).some(Boolean) ||
            Object.values(sizeErrors).some(Boolean)) && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                One or more outputs have errors (duplicate ID or size is not a
                number).
              </div>
            </div>
          )}

          <div
              className="relative w-full flex items-center"
              style={{ height: "52px" }}
            >
              {node.data.implementation && (
                <img
                  src="/implementation-icon.png"
                  alt="Custom Icon"
                  className="absolute -top-4 -right-4 z-50 w-8 h-8 object-contain"
                />
              )}

              <div
                className="w-full bg-blue-300 py-1 px-2 flex items-center"
                style={{ height: "inherit" }}
              >
              <img
                src="algorithmIcon.png"
                alt="icon"
                className="w-[42px] h-[42px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              {isEditingLabel ? (
                <input
                  autoFocus
                  type="text"
                  value={editableLabel}
                  onChange={(e) => setEditableLabel(e.target.value)}
                  onBlur={handleLabelChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLabelChange();
                  }}
                  className="font-semibold leading-none bg-white border border-gray-400 px-2 py-1 rounded"
                  style={{ paddingLeft: "25px", width: "100%" }}
                />
              ) : (
                <span
                  className="font-semibold leading-none cursor-pointer"
                  style={{ paddingLeft: "25px" }}
                  onClick={() => setIsEditingLabel(true)}
                >
                  {editableLabel}
                </span>
              )}
            </div>
          </div>

          {/*           <div className="custom-node-port-in mb-3 mt-[5px]">
            <div className="relative flex flex-col overflow-visible"> */}
          {/* <div className="custom-node-port-in"> */}
          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col overflow-visible">
              {Array.from({ length: numberClassicalInputs }).map((_, index) => (
                <div
                  key={`classical-input-${index}`}
                  className="relative p-2 mb-1 flex items-center"
                  style={{
                    backgroundColor: classicalConstructColor,
                    width: "120px",
                    borderTopRightRadius: "20px",
                    borderBottomRightRadius: "20px",
                  }}
                >
                  <Handle
                    type="target"
                    id={`classicalHandleOperationInput${index}${node.id}`}
                    position={Position.Left}
                    className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  />
                  <div className="flex flex-col text-center w-full leading-tight">
                    <span className="text-black text-sm">
                      {node.data.inputs?.[index]?.outputIdentifier ||
                        `Input ${index + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      type:{" "}
                      {getInputType(
                        `classicalHandleOperationInput${index}${node.id}`,
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {Array.from({ length: numberQuantumInputs }).map((_, index) => (
                <div
                  key={`quantum-input-${index}`}
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: quantumConstructColor,
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Handle
                    type="target"
                    id={`quantumHandleOperationInput${index}${node.id}`}
                    position={Position.Left}
                    className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  />
                  <div className="flex flex-col text-center w-full leading-tight">
                    <span className="text-black text-sm">
                      {node.data.inputs?.[index]?.outputIdentifier ||
                        `Input ${index + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      type: quantum register
                    </span>
                  </div>
                </div>
              ))}

              {ancillaMode && (
                <div>
                  <div
                    className="relative p-2 mb-1"
                    style={{
                      width: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <div
                      className="absolute inset-0 custom-shape-mirrored"
                      style={{ backgroundColor: ancillaConstructColor }}
                    />
                    <Handle
                      type="target"
                      id={`ancillaHandleOperationInput2${node.id}`}
                      position={Position.Left}
                      className={cn(
                        "z-10 ancilla-port-in w-4 transform rotate-45 -left-[8px]",
                        isAncillaConnected
                          ? "!bg-green-100 !border-solid !border-black"
                          : "!bg-gray-200 !border-dashed !border-black",
                      )}
                      style={{
                        zIndex: 1,
                        top: "50% !important",
                        transform: "translateY(-50%) rotate(45deg)",
                      }}
                    />
                    <span
                      className="text-black text-sm text-center w-full"
                      style={{ zIndex: 1 }}
                    >
                      Ancilla
                    </span>
                  </div>
                  <div
                    className="relative p-2"
                    style={{
                      width: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <div
                      className="absolute inset-0 custom-shape-mirrored"
                      style={{ backgroundColor: dirtyConstructColor }}
                    />
                    <Handle
                      type="target"
                      id={`${dirtyAncillaHandle}OperationInput3${node.id}`}
                      position={Position.Left}
                      className={cn(
                        "z-10 ancilla-port-in w-4 transform rotate-45 -left-[8px]",
                        isDirtyAncillaConnected
                          ? "!bg-green-100 !border-solid !border-black"
                          : "!bg-gray-200 !border-dashed !border-black",
                      )}
                      style={{
                        zIndex: 1,
                        top: "50% !important",
                        transform: "translateY(-50%) rotate(45deg)",
                      }}
                    />
                    <span
                      className="text-black text-sm text-center w-full"
                      style={{ zIndex: 1 }}
                    >
                      Dirty Ancilla
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="custom-node-port-out">
            {Array.from({ length: numberClassicalOutputs }).map((_, index) => (
              <OutputPort
                key={`output-port-${index}`} // Wie benennen? classical-output-port-? Oder output ports durchzählen?
                node={node}
                index={index}
                type={"classical"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                sizeError={classicalSizeErrors[index]}
                outputIdentifierError={outputIdentifierErrors[index]}
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={(error) =>
                  setOutputIdentifierErrors((prev) => ({
                    ...prev,
                    [index]: error,
                  }))
                }
                setSizeError={(error) =>
                  setSizeErrors((prev) => ({ ...prev, [index]: error }))
                }
                setSelectedNode={setSelectedNode}
                active={true}
              />
            ))}
            {/*           </div>
          <div className="custom-node-port-out"> */}
            {Array.from({ length: numberQuantumOutputs }).map((_, index) => (
              <OutputPort
                key={`output-port-${numberClassicalOutputs + index}`}
                node={node}
                index={numberClassicalOutputs + index}
                type={"quantum"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                outputIdentifierError={
                  outputIdentifierErrors[numberClassicalOutputs + index]
                }
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={(error) =>
                  setOutputIdentifierErrors((prev) => ({
                    ...prev,
                    [numberClassicalOutputs + index]: error,
                  }))
                }
                sizeError={sizeErrors[numberClassicalOutputs + index]}
                setSizeError={(error) =>
                  setSizeErrors((prev) => ({
                    ...prev,
                    [numberClassicalOutputs + index]: error,
                  }))
                }
                setSelectedNode={setSelectedNode}
                active={true}
              />
            ))}
          </div>

          {ancillaMode && (
            <div>
              <AncillaPort
                node={node}
                edges={edges}
                dirty={false}
                index={outputHandleCount}
              />
              <AncillaPort
                node={node}
                edges={edges}
                dirty={true}
                index={outputHandleCount + 1}
              />
              <UncomputePort
                node={node}
                edges={edges}
                index={outputHandleCount + 2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
