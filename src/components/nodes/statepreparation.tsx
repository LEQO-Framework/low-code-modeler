import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import UncomputePort from "../utils/uncomputePort";
import AncillaPort from "../utils/ancillaPort";
import { ancillaConstructColor, dirtyConstructColor, dirtyAncillaHandle, classicalConstructColor } from "@/constants";
import { AlertCircle } from "lucide-react";
import { findDuplicateOutputIdentifiers } from "../utils/utils";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  ancillaMode: boolean;
  completionGuaranteed: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  ancillaMode: state.ancillaMode,
  completionGuaranteed: state.completionGuaranteed,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const StatePreparationNode = memo((node: Node) => {
  const [size, setSize] = useState("");
  const [bound, setBound] = useState("");
  const [quantumStateName, setQuantumStateName] = useState("Bell State φ+");
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [encodingType, setEncodingType] = useState("Basis Encoding");
  const [mounted, setMounted] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);
  const [boundError, setBoundError] = useState(false);



  const { updateNodeValue, setSelectedNode, setNodes, edges, nodes, ancillaMode, completionGuaranteed } = useStore(selector, shallow);
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

    if (field === "bound") {
      // must be between 0 and 1 (inclusive)
      const num = parseFloat(value);
      const isValid = value === "" || (!isNaN(num) && num >= 0 && num <= 1);
      setBoundError(!isValid);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
  };

  console.log(node)
  useEffect(() => {
    if (node.data.label === "Encode Value") {
      console.log(node.data.encodingType)
      if (node.data.encodingType !== null && !mounted) {
        updateNodeValue(node.id, "encodingType", node.data.encodingType);
      } else {
        console.log("test")
        if (node.data.label === "Basis Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        }
        else if (node.data.label === "Angle Encoding") {
          updateNodeValue(node.id, "encodingType", node.data.label);
        }
        else if (node.data.label === "Amplitude Encoding") {
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
  }, [ancillaMode]);

  const isAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `ancillaHandleOperationInput2${node.id}`
  );

  const isDirtyAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `${dirtyAncillaHandle}OperationInput3${node.id}`
  );

  useEffect(() => {
    if (quantumStateName === "GHZ" || quantumStateName === "Uniform Superposition" || quantumStateName === "Custom State") {
      const numSize = parseInt(node.data.size);
      if (isNaN(numSize) || numSize < 3) {
        setSizeError(true);
      } else {
        setSizeError(false);
      }
    } else {
      setSizeError(false);
    }
  }, [quantumStateName, size]);



  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    console.log(duplicates)
    const isDuplicate = duplicates.has(identifier);

    const startsWithDigit = /^\d/.test(identifier);
    // Only update state if error state is actually changing
    if (((isDuplicate) && identifier !== "") !== outputIdentifierError) {
      setOutputIdentifierError((isDuplicate) && identifier !== "");
    }
    if (startsWithDigit) {
      setStartsWithDigitError(true);
    } else {
      setStartsWithDigitError(false);
    }
    if (!node.data.encodingType && node.data.label === "Basis Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Angle Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Amplitude Encoding") {
      updateNodeValue(node.id, "encodingType", node.data.label);
    }
    if (!node.data.encodingType && node.data.label === "Encode Value") {
      updateNodeValue(node.id, "encodingType", encodingType);
    }
    if (!node.data.quantumStateName && node.data.label === "Prepare State") {
      updateNodeValue(node.id, "quantumStateName", quantumStateName);
    }
    console.log(encodingType)
    if ((node.data.encodingType === "Basis Encoding" || node.data.encodingType === "Angle Encoding") && (encodingType !== "Angle Encoding" && encodingType !== "Basis Encoding")) {
      updateNodeInternals(node.id);
      setEncodingType(node.data.encodingType);
    }
    console.log(node.data.quantumStateName)
    if (node.data.quantumStateName !== quantumStateName) {
      updateNodeInternals(node.id);
      setQuantumStateName(node.data.quantumStateName)
    }
  }, [nodes, node.data.outputIdentifier, node.id]);

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

  const baseHeight = data.label === "Prepare State" ? 460 : 560;

  const extraHeightPerVariable = 20;
  const dynamicHeight = baseHeight;

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
          style={{
            height:
              ["Basis Encoding", "Angle Encoding", "Amplitude Encoding"].includes(data.label)
                ? !ancillaMode
                  ? "300px"
                  : `${Math.max(dynamicHeight - 70, 200)}px`
                : !ancillaMode
                  ? "370px"
                  : `${dynamicHeight}px`,
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
                  top: !outputIdentifierError ? '35px' : '50px',
                }}
              >
                Identifier starts with a number.
              </div>
            </div>
          )}

          {sizeError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(outputIdentifierError || startsWithDigitError) ? '35px' : '80px',
                }}
              >
                Size is not an integer.
              </div>
            </div>
          )}

          {boundError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(outputIdentifierError || startsWithDigitError || sizeError)
                    ? '35px'
                    : '110px',
                }}
              >
                Bound must be a number between 0 and 1.
              </div>
            </div>
          )}


          <div className="w-full flex items-center" style={{ height: '52px' }}>
            {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-4 -right-4 w-8 h-8"
              />
            )}
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              {[
                "Prepare State",
                "Encode Value",
                "Basis Encoding",
                "Angle Encoding",
                "Amplitude Encoding",
              ].includes(data.label) && (
                  <img
                    src={
                      data.label === "Prepare State"
                        ? "prepareStateIcon.png"
                        : data.label === "Encode Value"
                          ? "encodeValueIcon.png"
                          : data.label === "Basis Encoding"
                            ? "basisEncodingIcon.png"
                            : data.label === "Angle Encoding"
                              ? "angleEncodingIcon.png"
                              : "amplitudeEncodingIcon.png"
                    }
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

              <span className="font-semibold leading-none" style={{ paddingLeft: '45px' }}>
                {data.label}
              </span>
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
                    {!completionGuaranteed && (<option value="Amplitude Encoding">Amplitude Encoding</option>)}
                    <option value="Angle Encoding">Angle Encoding</option>
                    <option value="Basis Encoding">Basis Encoding</option>
                    <option value="Custom Encoding">Custom Encoding</option>
                    {!completionGuaranteed && (<option value="Matrix Encoding">Matrix Encoding</option>)}
                    {!completionGuaranteed && (<option value="Schmidt Decomposition">Schmidt Decomposition</option>)}

                  </select>

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
              {node.data.label === "Amplitude Encoding" && (
                <>

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
                  <label
                    className="text-sm text-black"
                    style={{ visibility: showingChildren ? "hidden" : "visible" }}
                  >
                    Quantum State Name:
                  </label>
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
                    {!completionGuaranteed && (
                      <option value="W-State">W-State</option>
                    )}
                  </select>
                </>
              )}

            </div>
          )}
          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col overflow-visible">
              {(node.data.label === "Encode Value" || node.data.label === "Basis Encoding" || node.data.label === "Angle Encoding" || node.data.label === "Amplitude Encoding") && (
                <div
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: classicalConstructColor,
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
                    className={cn(
                      "z-10 ancilla-port-in w-4 transform rotate-45 -left-[8px]",
                      isAncillaConnected
                        ? "!bg-green-100 !border-solid !border-black"
                        : "!bg-gray-200 !border-dashed !border-black"
                    )}
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
                  <span className="text-black text-sm text-center w-full" style={{ zIndex: 1 }}> Dirty Ancilla</span>
                </div>
              </div>)}
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
                  sizeError={sizeError}
                  outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />)}
              {(node.data.label === "Encode Value" || node.data.label === "Basis Encoding" || node.data.label === "Amplitude Encoding" || node.data.label === "Angle Encoding") && (
                <OutputPort
                  node={node}
                  index={0}
                  type={"quantum"}
                  nodes={nodes}
                  outputs={outputs}
                  setOutputs={setOutputs}
                  edges={edges}
                  sizeError={sizeError}
                  outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />)}
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