import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import AncillaPort from "../utils/ancillaPort";
import UncomputePort from "../utils/uncomputePort";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ancillaConstructColor, dirtyConstructColor, quantumConstructColor } from "@/constants";

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

export const AlgorithmNode = memo((node: Node) => {
  const { data, selected } = node;
  console.log(data.numberInputs)
  const numberInputs = data.numberInputs || 0;
  const numberOutputs = data.numberOutputs || 0;

  const handleCount = Math.max(numberInputs, numberOutputs);
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 15;

  const nodeHeight = Math.max(handleOffset * 2 + (handleCount) * handleGap, 100);
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
  }, []);

  const baseHeight = 390;
  const extraHeightPerVariable = 100;
  const dynamicHeight =
    baseHeight + (numberInputs * 20) + numberOutputs * extraHeightPerVariable;

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
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
            selected && "border-blue-500"
          )}
          style={{ height: `${dynamicHeight}px` }}
        >
          <div className="w-full flex items-center" style={{ height: "52px" }}>
            <div
              className="w-full bg-blue-300 py-1 px-2 flex items-center"
              style={{ height: "inherit" }}
            >
              <img
                src="arithmeticIcon.png"
                alt="icon"
                className="w-[50px] h-[50px] object-contain flex-shrink-0"
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
                  className="truncate font-semibold leading-none cursor-pointer"
                  style={{ paddingLeft: "25px" }}
                  onClick={() => setIsEditingLabel(true)}
                >
                  {editableLabel}
                </span>
              )}
            </div>
          </div>

          <div className="custom-node-port-in mb-3 mt-[5px]">
            <div className="relative flex flex-col overflow-visible">
              <div className="custom-node-port-in">
                <div className="relative flex flex-col overflow-visible">
                  {Array.from({ length: numberInputs }).map((_, index) => (
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
                      <span className="text-black text-sm text-center w-full">
                        {node.data.inputs?.[index]?.outputIdentifier || `Input ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {ancillaMode && (<div>
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
                  className="z-10 ancilla-port-in !bg-gray-200 !border-dashed !border-black w-4 transform rotate-45 -left-[8px]"
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
                  id={`ancillaHandleOperationInput3${node.id}`}
                  position={Position.Left}
                  className="z-10 ancilla-port-in !bg-gray-200 !border-dashed !border-black w-4 transform rotate-45 -left-[8px]"
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
            </div>)}
          </div>
          </div>


          <div className="custom-node-port-out">
            {Array.from({ length: numberOutputs }).map((_, index) => (
              <OutputPort
                key={`output-port-${index}`}
                node={node}
                index={index - 1}
                type={"quantum"}
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
            ))}
          </div>

          {ancillaMode && (
            <div>
              <AncillaPort node={node} edges={edges} dirty={false} index={numberOutputs} />
              <AncillaPort node={node} edges={edges} dirty={true} index={numberOutputs + 1} />
              <UncomputePort node={node} edges={edges} index={numberOutputs + 2} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});