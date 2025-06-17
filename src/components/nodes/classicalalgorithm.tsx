import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import AncillaPort from "../utils/ancillaPort";
import UncomputePort from "../utils/uncomputePort";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ancillaConstructColor, classicalConstructColor, dirtyAncillaHandle, dirtyConstructColor } from "@/constants";
import { findDuplicateOutputIdentifier, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";
import { AlertCircle } from "lucide-react";

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
  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges, setEdges, ancillaMode } = useStore(
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

  const isDirtyAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `${dirtyAncillaHandle}OperationInput3${node.id}`
  );


  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([
      ...inputs,
      { id: newInputId, label: `Variable ${inputs.length + 1}` },
    ]);
    setOutputs([
      ...outputs,
      {
        id: newOutputId,
        label: `Output ${outputs.length + 1}`,
        value: "",
      },
    ]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(
      outputs.map((output) =>
        output.id === id ? { ...output, value: newValue } : output
      )
    );
  };

  const handleYChange = (e, field) => {
    const value = e.target.value;
    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
    setY(value);
  };

  const handleOutputIdentifierChange = (e, field) => {
    const value = e.target.value;

    if (/^\d/.test(value)) {
      setOutputIdentifierError(true);
    } else {
      setOutputIdentifierError(false);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
  };

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [node]);

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


  const baseHeight = !ancillaMode ? 50 : 200;
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
              style={{ height: "inherit", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", overflow: "hidden", }}
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
                  style={{ paddingLeft: "25px" }}
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

              {ancillaMode && (<div>
                <div
                  className="relative p-2 mb-1 overflow-visible"
                  style={{
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    className="absolute inset-0 custom-shape-mirrored overflow-visible"
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
                        : "!bg-gray-200 !border-dashed !border-black"
                    )}
                    style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
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
                        : "!bg-gray-200 !border-dashed !border-black"
                    )}
                    style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
                  />
                  <span
                    className="text-black text-sm text-center w-full"
                    style={{ zIndex: 1 }}
                  >
                    Dirty Ancilla
                  </span>
                </div>
              </div>)}

              <div
                className="absolute flex flex-col"
                style={{
                  top: `${numberInputs * 40 + (ancillaMode ? 110 : 0)}px`,
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



                {ancillaMode && (
                  <div >
                    <AncillaPort node={node} edges={edges} dirty={false} index={numberOutputs} />
                    <AncillaPort node={node} edges={edges} dirty={true} index={numberOutputs + 1} />
                    <UncomputePort node={node} edges={edges} index={numberOutputs + 2} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
