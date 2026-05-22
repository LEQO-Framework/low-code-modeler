import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor } from "@/constants";
import { findDuplicateOutputIdentifier, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import { awareness } from "@/yjs";

const selector = (state: any) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  ancillaMode: state.ancillaMode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges
});

export const ClassicalAlgorithmNode = memo((node: Node) => {
  const { data, selected } = node;
  const numberInputs = data.numberClassicalInputs || 0;
  const numberOutputs = data.numberClassicalOutputs || 0;

  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges, ancillaMode } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState<{ [key: number]: boolean }>({});
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "");

  const headerHeight = 52;
  const inputHeight = 30;
  const inputsTotalHeight = numberInputs * inputHeight;
  const outputHeight = 120;
  const outputsStartTop = headerHeight + inputsTotalHeight + 10;



  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
    console.log("update classical algorithm handles")
  }, [ancillaMode]);


  const getInputType = (inputIndex: number) => {
    const handleId = `classicalHandleOperationInput${inputIndex}${node.id}`;

    const edge = edges.find(e => e.targetHandle === handleId);
    if (!edge) return "any";

    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return "any";

    if (sourceNode.type === "dataTypeNode") {
      return sourceNode.data?.dataType ?? "any";
    }

    return "any";
  };


  useEffect(() => {
    //const selectedNode = nodes.find(n => n.id === node.id);
    let selectedNode = node;
    const newErrors: { [key: number]: boolean } = {};
    const newSizeErrors: { [key: number]: boolean } = {};

    outputs.forEach((output: any, index: number) => {
      const outputIdentifier = output?.identifier?.trim();
      const size = output?.size?.trim();
      if (!outputIdentifier) return;

      const duplicates = findDuplicateOutputIdentifier(nodes, selectedNode.id, selectedNode, outputIdentifier);
      let isDuplicate = false;
      for (const [key] of duplicates.entries()) {
        if (Array.isArray(key) && key.some((item: any) => item.identifier === outputIdentifier)) {
          isDuplicate = true;
          break;
        }
      }
      isDuplicate = isDuplicate || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, outputIdentifier);
      const startsWithDigit = /^\d/.test(outputIdentifier);

      newErrors[index] = startsWithDigit || isDuplicate;

      if (size) {
        newSizeErrors[index] = !/^\d/.test(size);
      }
    });

    setOutputIdentifierErrors(newErrors);
    setSizeErrors(newSizeErrors);
  }, [nodes, outputs, node.id]);

  const baseHeight = !ancillaMode ? 50 : 200;
  const extraHeightPerVariable = 130;
  const dynamicHeight = baseHeight + 2 * 40 + 3 * 50 + numberInputs * 50 + numberOutputs * extraHeightPerVariable;

  const id = node.id;

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<string | null>(null);
  const [selectingUserName, setSelectingUserName] = useState<string | null>(null); // technically not needed, could extend functionality to also show user name next to highlighted node

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any, clientId: number) => {
        // Skip your own client ID so you don't highlight it with your own color
        // if (clientId === awareness.clientID) return;

        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.selectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      setSelectingUserName(foundName);
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
    <motion.div
      className="relative"
      initial={false}
      animate={{
        width: 320,
        height: dynamicHeight,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
          selected && "border-blue-500"
        )}
        style={{
          height: `${dynamicHeight}px`,
          borderRadius: "28px",
        }}
      >

        {(Object.values(outputIdentifierErrors).some(Boolean) ||
          Object.values(sizeErrors).some(Boolean)) && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                One or more outputs have errors (duplicate ID or size is not a number).
              </div>
            </div>
          )}

        <div
          className="relative w-full h-[52px] overflow-hidden rounded-t-[28px]"
        >
          <div className="w-full h-full bg-orange-300 flex items-center py-1 px-2">
            <img
              src="classicalAlgorithmIcon.png"
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
                onKeyDown={(e) => { if (e.key === "Enter") handleLabelChange(); }}
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

        <div className="mt-[5px] flex flex-col relative z-0">
          {Array.from({ length: numberInputs }).map((_, index) => (
            <div
              key={`classical-input-${index}`}
              className="relative p-2 mb-1 flex items-center"
              style={{
                backgroundColor: classicalConstructColor,
                width: "120px",
                borderTopRightRadius: '20px',
                borderBottomRightRadius: '20px',
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
                  {node.data.inputs?.[index]?.outputIdentifier || `Input ${index + 1}`}
                </span>
                <span className="text-[10px] text-gray-600">
                  type: {getInputType(index)?.toLowerCase()}
                </span>
              </div>

            </div>
          ))}
        </div>
        <div className="custom-node-port-out">
        {Array.from({ length: numberOutputs }).map((_, index) => (
          <div
            key={`output-wrapper-${index}`}
            className="absolute left-0 w-full z-10"
            style={{ top: `${outputsStartTop + index * outputHeight}px` }}
          >
            <OutputPort
              key={`output-port-${index}`}
              node={node}
              index={index}
              type={"classical"}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              outputIdentifierError={outputIdentifierErrors[index]}
              updateNodeValue={updateNodeValue}
              setOutputIdentifierError={(error) =>
                setOutputIdentifierErrors(prev => ({ ...prev, [index]: error }))
              }
              sizeError={sizeErrors[index]}
              setSizeError={(error) =>
                setSizeErrors((prev) => ({ ...prev, [index]: error }))
              }
              setSelectedNode={setSelectedNode}
              active={true}
            />
          </div>
        ))}
        </div>

      </div>
    </motion.div>
  );
});
