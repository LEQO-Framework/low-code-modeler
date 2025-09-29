import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor, dirtyAncillaHandle, dirtyConstructColor } from "@/constants";
import { findDuplicateOutputIdentifier, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";
import { AlertCircle } from "lucide-react";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setEdges: (edge: Edge) => void;
  setNewEdges: (newEdges: Edge[]) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges
});

export const ClassicalAlgorithmNode = memo((node: Node) => {
  const { data, selected } = node;
  console.log(data.numberInputs)
  const numberInputs = data.numberInputs || 0;
  const numberOutputs = data.numberOutputs || 0;

  const handleCount = numberInputs + 2 + numberOutputs + 3;
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 15;

  const nodeHeight = 60 + Math.max(handleOffset * 2 + (handleCount) * handleGap, 100);
  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges, setEdges } = useStore(
    selector,
    shallow
  );
  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "");
  const updateNodeInternals = useUpdateNodeInternals();
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState({});
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
   const isAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `ancillaHandleOperationInput2${node.id}`
  );

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [edges]);

    useEffect(() => {
    const identifier = node.data.outputIdentifier;
    console.log(nodes)
    let selectedNode = nodes.find(n => n.id === node.id);
    const newErrors = {};

    outputs.forEach((output, index) => {
      const outputIdentifier = output?.identifier?.trim();
      const size = output?.identifier?.trim();
      if (!outputIdentifier) return;
      const duplicates = findDuplicateOutputIdentifier(nodes, selectedNode.id, selectedNode, identifier);
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
      isDuplicate = isDuplicate || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, outputIdentifier)
      const startsWithDigit = /^\d/.test(outputIdentifier);
      console.log(isDuplicate)
      console.log(output)

      console.log("set for identifier error");
      console.log(outputIdentifier)
      // Flag error if identifier is invalid or duplicated
      newErrors[index] = startsWithDigit || isDuplicate;
      if (!size) return;
      const startsWithDigitSize = /^\d/.test(size);
      sizeErrors[index] = startsWithDigitSize;
    })

    setOutputIdentifierErrors(newErrors);
  }, [nodes, outputs, node.id]);


  const baseHeight = 50;
  const extraHeightPerVariable = 130;
  const dynamicHeight =
    baseHeight + 2 * 40 + 3 * 50 + (numberInputs * 50) + numberOutputs * extraHeightPerVariable;

  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < numberOutputs) {
    data.identifiers.push("q" + Math.floor(100000 + Math.random() * 900000).toString());
  }

  // Remove extra identifiers
  if (data.identifiers.length > numberOutputs) {
    const removedIdentifiers = data.identifiers.slice(numberOutputs);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToRemove = edges.filter((edge) =>
      !removedIdentifiers.some((id, index) =>
        edge.sourceHandle === `quantumHandleGateOutput${numberOutputs + index + 1}${node.id}`
      )
    );
    console.log("EDGES")
    console.log(edgesToRemove)

    if (edgesToRemove.length > 0) {
      console.log("remove edges")
      setNewEdges(edgesToRemove);
    }

    data.identifiers = data.identifiers.slice(0, numberOutputs);
  }

  console.log(nodeHeight)

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{
        width: showingChildren ? 360 : 320,
        height: showingChildren ? 400 : 373,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md overflow-hidden",
            selected && "border-blue-500"
          )}
          style={{ height: `${dynamicHeight}px`, borderRadius: "40px" }}
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

          <div className="w-full flex items-center" style={{ height: "52px" }}>
             {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-2 -right-4 w-8 h-8"
              />
            )}
            <div
              className="w-full bg-orange-300 py-1 px-2 flex items-center overflow-hidden"
              style={{ height: "inherit", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", overflow: "hidden",paddingLeft: '25px', }}
            >
              <img
                src="classicalAlgorithmIcon.png"
                alt="icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
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
                  style={{ paddingLeft: "15px" }}
                  onClick={() => setIsEditingLabel(true)}
                >
                  {editableLabel}
                </span>
              )}
            </div>
          </div>

          <div className="custom-node-port-in mb-3 mt-[5px]">
            <div className="absolute flex flex-col overflow-visible">
              <div className="custom-node-port-in">
                <div className="relative flex flex-col overflow-visible">

                  {Array.from({ length: numberInputs }).map((_, index) => (
                    <div
                      key={`classical-input-${index}`}
                      className="relative p-2 mb-1"
                      style={{
                        backgroundColor: classicalConstructColor,
                        width: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        borderTopRightRadius: '20px',
                        borderBottomRightRadius: '20px',
                      }}
                    >
                      <Handle
                        type="target"
                        id={`classicalHandleOperationInput${index}${node.id}`}
                        position={Position.Left}
                        className="z-10 circle-port-op !bg-orange-300 !border-black -left-[8px]"
                        style={{ top: "50%", transform: "translateY(-50%)" }}
                      />
                      <span className="text-black text-sm text-center w-full">
                        {node.data.inputs?.[index]?.outputIdentifier || `Input ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>


              <div
                className="absolute flex flex-col"
                style={{
                  top: `${numberInputs * 40 + 110}px`,
                  right: "-198px",
                  gap: "10px",
                  zIndex: 5,
                }}
              >
                {Array.from({ length: numberOutputs }).map((_, index) => (
                  <div key={`output-port-${index}`}>
                    <OutputPort
                      node={node}
                      index={index}
                      type={"classical"}
                      nodes={nodes}
                      outputs={outputs}
                      setOutputs={setOutputs}
                      edges={edges}
                      sizeError={sizeErrors[index]}
                setSizeError={(error) =>
                  setSizeErrors((prev) => ({ ...prev, [index]: error }))
                }
                      outputIdentifierError={outputIdentifierErrors[index]}
                      updateNodeValue={updateNodeValue}
                      setOutputIdentifierError={(error) =>
                        setOutputIdentifierErrors(prev => ({ ...prev, [index]: error }))
                      }
                 
                      setSelectedNode={setSelectedNode}
                      active={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
