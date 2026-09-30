import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
  Node,
  Edge,
  useUpdateNodeInternals,
} from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort, { isPositiveIntegerSize } from "../utils/outputPort";
import {
  hasCanonicalCustomOutputs,
  normalizeCustomOutputs,
} from "../utils/customOutputs";
import { cn } from "@/lib/utils";
import { classicalConstructColor, quantumConstructColor } from "@/constants";
import {
  findDuplicateOutputIdentifier,
  findDuplicateOutputIdentifiersInsideNode,
} from "../utils/utils";
import { AlertCircle } from "lucide-react";
import { awareness } from "@/yjs";

const selector = (state: {
  nodes: Node[];
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setSelectedNode: (node: Node | null) => void;
  setNewEdges: (newEdges: Edge[]) => void;
}) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
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

  const outputHandleCount = numberQuantumOutputs + numberClassicalOutputs;

  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges } =
    useStore(selector, shallow);

  const initialOutputs = hasCanonicalCustomOutputs(
    data.outputs,
    numberQuantumOutputs,
    numberClassicalOutputs,
  )
    ? data.outputs
    : normalizeCustomOutputs(
        data.outputs,
        numberQuantumOutputs,
        numberClassicalOutputs,
      );
  const [outputs, setOutputs] = useState(initialOutputs);
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "");
  const updateNodeInternals = useUpdateNodeInternals();
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState({});
  const inputs = data.inputs || [];
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>();

  const getInputValue = (type: "quantum" | "classical", index: number) =>
    inputs.find(
      (input: any) =>
        input.targetHandle === `${type}HandleOperationInput${index}${node.id}`,
    );

  useEffect(() => {
    if (
      hasCanonicalCustomOutputs(
        data.outputs,
        numberQuantumOutputs,
        numberClassicalOutputs,
      )
    ) {
      setOutputs(data.outputs);
      return;
    }

    const normalizedOutputs = normalizeCustomOutputs(
      data.outputs,
      numberQuantumOutputs,
      numberClassicalOutputs,
    );
    setOutputs(normalizedOutputs);
    updateNodeValue(node.id, "outputs", normalizedOutputs);
  }, [
    data.outputs,
    node.id,
    numberQuantumOutputs,
    numberClassicalOutputs,
    updateNodeValue,
  ]);

  const getOutputSlots = (type: "quantum" | "classical") => {
    const slots: { output: any; index: number }[] = [];
    outputs.forEach((output: any, index: number) => {
      if (output.type === type) slots.push({ output, index });
    });
    return slots;
  };

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, []);

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [
    node.data.numberQuantumInputs,
    node.data.numberClassicalInputs,
    node.data.numberQuantumOutputs,
    node.data.numberClassicalOutputs,
  ]);

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
    const newErrors = {};
    const newSizeErrors: { [key: number]: boolean } = {};
    console.log("ALGORITHM", outputs);

    // quantum outputs
    outputs.forEach((output, index) => {
      const outputIdentifier = output?.identifier?.trim();
      console.log("Outputidentifier", outputIdentifier);
      const size = String(output?.size ?? "").trim();
      newSizeErrors[index] = size !== "" && !isPositiveIntegerSize(size);
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
    setSizeErrors(newSizeErrors);
  }, [nodes, outputs, node.id]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateHeight = () => setContentHeight(content.scrollHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const dynamicHeight = contentHeight ?? 0;
  const baseHeightPadding = 36;

  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < numberQuantumOutputs) {
    data.identifiers.push(
      "q" + Math.floor(100000 + Math.random() * 900000).toString(),
    );
  }

  // Remove extra identifiers
  if (data.identifiers.length > numberQuantumOutputs) {
    const removedIdentifiers = data.identifiers.slice(numberQuantumOutputs);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToKeep = edges.filter(
      (edge) =>
        !removedIdentifiers.some(
          (_identifier, index) =>
            edge.sourceHandle ===
            `quantumHandle${node.type}Output${numberQuantumOutputs + index}${node.id}`,
        ),
    );

    if (edgesToKeep.length !== edges.length) {
      console.log("remove edges");
      setNewEdges(edgesToKeep);
    }

    data.identifiers = data.identifiers.slice(0, numberQuantumOutputs);
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
        height: dynamicHeight || undefined,
      }}
    >
      <div className="grand-parent">
        <div
          ref={contentRef}
          className={
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md"
          }
          style={{
            paddingBottom: `${baseHeightPadding}px`,
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
                positive integer)
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
                      {getInputValue("classical", index)?.outputIdentifier ||
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
                      {getInputValue("quantum", index)?.outputIdentifier ||
                        `Input ${index + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      type: quantum register
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="custom-node-port-out">
            {getOutputSlots("classical").map(({ index: dataIndex }, index) => (
              <OutputPort
                key={`classical-output-port-${index}`}
                node={node}
                index={dataIndex}
                handleIndex={index}
                type={"classical"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                sizeError={sizeErrors[dataIndex]}
                outputIdentifierError={outputIdentifierErrors[dataIndex]}
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={(error) =>
                  setOutputIdentifierErrors((prev) => ({
                    ...prev,
                    [dataIndex]: error,
                  }))
                }
                setSizeError={(error) =>
                  setSizeErrors((prev) => ({
                    ...prev,
                    [dataIndex]: error,
                  }))
                }
                setSelectedNode={setSelectedNode}
                active={true}
              />
            ))}
            {/*           </div>
          <div className="custom-node-port-out"> */}
            {getOutputSlots("quantum").map(({ index: dataIndex }, index) => (
              <OutputPort
                key={`quantum-output-port-${index}`}
                node={node}
                index={dataIndex}
                handleIndex={index}
                type={"quantum"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                outputIdentifierError={outputIdentifierErrors[dataIndex]}
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={(error) =>
                  setOutputIdentifierErrors((prev) => ({
                    ...prev,
                    [dataIndex]: error,
                  }))
                }
                sizeError={sizeErrors[dataIndex]}
                setSizeError={(error) =>
                  setSizeErrors((prev) => ({
                    ...prev,
                    [dataIndex]: error,
                  }))
                }
                setSelectedNode={setSelectedNode}
                active={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
