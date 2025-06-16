import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import UncomputePort from "../utils/uncomputePort";
import AncillaPort from "../utils/ancillaPort";
import { ancillaConstructColor, dirtyConstructColor } from "@/constants";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  ancillaMode: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  ancillaMode: state.ancillaMode,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const StatePreparationNode = memo((node: Node) => {
  const [size, setSize] = useState("");
  const [bound, setBound] = useState("");
  const [quantumStateName, setQuantumStateName] = useState("Bell State ϕ+");
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [encodingType, setEncodingType] = useState("Amplitude Encoding");
  const [mounted, setMounted] = useState(false);


  const { updateNodeValue, setSelectedNode, setNodes, edges, nodes, ancillaMode } = useStore(selector, shallow);
  const isConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `ancillaHandlePrepareState0${node.id}`
  );

  const handleStateChange = (e, field) => {
    const value = e.target.value;

    if (field === "quantumStateName") {
      setQuantumStateName(value);
    }

    if (field === "encodingType") {
      setEncodingType(value);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
  };
  const handleYChange = (e, field) => {
    const value = e.target.value;
    const number = Number(value);

    if (!/^[a-zA-Z_]/.test(value) && value !== "") {
      setSizeError(true);
    } else {
      setSizeError(false);
    }
    if (field === "size") {
      setSize(value);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, number);
    setSelectedNode(node);
  };

  useEffect(() => {
    if (node.data.label === "Encode Value") {
      updateNodeValue(node.id, "encodingType", encodingType);
    } else {
      updateNodeValue(node.id, "quantumStateName", quantumStateName);
    }
    updateNodeInternals(node.id);
    setMounted(true);
  }, []);
  const { data, selected } = node;

  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);

  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");

  const [operation, setOperation] = useState("+");
  const updateNodeInternals = useUpdateNodeInternals();

  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([...inputs, { id: newInputId, label: `Variable ${inputs.length + 1}` }]);
    setOutputs([...outputs, { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" }]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(outputs.map((output) => (output.id === id ? { ...output, value: newValue } : output)));
  };

  const handleOutputIdentifierChange = (e, field) => {
    const value = e.target.value;

    // Check if the first character is a number
    if (/^\d/.test(value)) {
      setOutputIdentifierError(true);
    } else {
      setOutputIdentifierError(false);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    //setSelectedNode(node);
  };

  const baseHeight = data.label === "Prepare State" ? 440 : 560;

  const extraHeightPerVariable = 20;
  const dynamicHeight = baseHeight + (inputs.length + outputs.length) * extraHeightPerVariable;

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: showingChildren ? 360 : 320, height: showingChildren ? 400 : 373 }}
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
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img src="arithmeticIcon.png" alt="icon" className="w-[50px] h-[50px] object-contain flex-shrink-0" />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none" style={{ paddingLeft: '25px' }}>{data.label}</span>
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
                    style={{ visibility: showingChildren ? "hidden" : "visible" }}
                    onChange={(e) => handleStateChange(e, "encodingType")}
                  >
                    <option value="Amplitude Encoding">Amplitude Encoding</option>
                    <option value="Angle Encoding">Angle Encoding</option>
                    <option value="Basis Encoding">Basis Encoding</option>
                    <option value="Custom Encoding">Custom Encoding</option>
                    <option value="Matrix Encoding">Matrix Encoding</option>
                    <option value="Schmidt Decomposition">Schmidt Decomposition</option>
                  </select>
                  {node.data.encodingType === "Basis Encoding" && (
                    <>
                      <label className="text-sm text-black">Size:</label>
                      <input
                        className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                        type="text"
                        id="size"
                        value={node.data.size || size}
                        onChange={(e) => handleYChange(e, "size")}
                        placeholder="Enter size"
                      />
                    </>
                  )}
                  {node.data.encodingType !== "Basis Encoding" && node.data.encodingType !== "Angle Encoding" && (
                    <>
                      <label className="text-sm text-black">Bound:</label>
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

                </>
              )}

              {node.data.label === "Prepare State" && (
                <>

                  <label className="text-sm text-black" style={{ visibility: showingChildren ? "hidden" : "visible" }}>Quantum State Name:</label>
                  <select
                    style={{ visibility: showingChildren ? "hidden" : "visible" }}
                    className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
                    value={node.data.quantumStateName || quantumStateName}
                    onChange={(e) => handleStateChange(e, "quantumStateName")}
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
                </>
              )}
            </div>
          )}
          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col overflow-visible">
              {node.data.label === "Encode Value" && (
                <div
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: 'rgba(255, 165, 0, 0.3)',
                    width: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    borderTopRightRadius: '20px',
                    borderBottomRightRadius: '20px',
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 "

                  />

                  <Handle
                    type="target"
                    id={`classicalHandleStatePreparationInput0${node.id}`}
                    position={Position.Left}
                    className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <span className="text-black text-sm text-center w-full">{node.data.inputs[0]?.outputIdentifier || "Value"}</span>
                </div>)}

              {ancillaMode && (<div>
              <div
                className="relative p-2 mb-1"
                style={{
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  className="absolute inset-0 custom-shape-mirrored"
                  style={{
                    backgroundColor: ancillaConstructColor,
                  }}
                />
                <Handle
                  type="target"
                  id={`ancillaHandleOperationInput2${node.id}`}
                  position={Position.Left}
                  className="z-10 ancilla-port-in !bg-gray-200 !border-dashed !border-black w-4 transform rotate-45 -left-[8px]"
                  style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
                />
                <span className="text-black text-sm text-center w-full" style={{ zIndex: 1 }}>Ancilla</span>
              </div>
              <div
                className="relative p-2"
                style={{
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  className="absolute inset-0 custom-shape-mirrored"
                  style={{
                    backgroundColor: dirtyConstructColor,
                  }}
                />
                <Handle
                  type="target"
                  id={`ancillaHandleOperationInput3${node.id}`}
                  position={Position.Left}
                  className="z-10 ancilla-port-in !bg-gray-200 !border-dashed !border-black w-4 transform rotate-45 -left-[8px]"
                  style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
                />
                <span className="text-black text-sm text-center w-full" style={{ zIndex: 1 }}> Dirty Ancilla</span>
              </div>
              </div>)}
            </div>
          </div>

          <div className="custom-node-port-out">

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
                outputIdentifierError={outputIdentifierError}
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={setOutputIdentifierError}
                setSizeError={setSizeError}
                setSelectedNode={setSelectedNode}
                active={true}
              />
            </>
          </div>

          {ancillaMode && (
            <div>
              <AncillaPort
                node={node}
                edges={edges}
                dirty={false}
                index={1}
              />
              <AncillaPort
                node={node}
                edges={edges}
                dirty={true}
                index={2}
              />
              <UncomputePort
                node={node}
                edges={edges}
                index={3}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});