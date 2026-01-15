import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { shallow } from "zustand/shallow";
import { Button } from "antd";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import UncomputePort from "../utils/uncomputePort";
import AncillaPort from "../utils/ancillaPort";
import * as consts from "@/constants";
import { findDuplicateOutputIdentifiers } from "../utils/utils";
import { AlertCircle } from "lucide-react";

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

export const OperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode, ancillaMode, completionGuaranteed } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [operation, setOperation] = useState("+");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);

  const isAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `ancillaHandleOperationInput2${node.id}`
  );

  const isDirtyAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `${consts.dirtyAncillaHandle}OperationInput3${node.id}`
  );


  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([...inputs, { id: newInputId, label: `Variable ${inputs.length + 1}` }]);
    setOutputs([...outputs, { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" }]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(outputs.map((output) => (output.id === id ? { ...output, value: newValue } : output)));
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
  

  // 1. Validate output identifier on change
  const [operatorInitialized, setOperatorInitialized] = useState(false);

  // Only run operator initialization once
  useEffect(() => {
    if (!operatorInitialized && node.data.operator === undefined) {
      let defaultOperator = "+";
      if (node.data.label === consts.quantumLabel +consts.bitwiseOperatorLabel) defaultOperator = "OR";
      else if (node.data.label === consts.quantumLabel +consts.comparisonOperatorLabel) defaultOperator = "<";
      else if (node.data.label !== consts.quantumLabel +consts.arithmeticOperatorLabel) defaultOperator = "min";

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
    }else{
      setStartsWithDigitError(false);
    }

  }, [nodes, node.data.outputIdentifier, node.id, ancillaMode]);

  const baseHeight = 550;
  const dynamicHeight = baseHeight ;

  const iconMap = {
    "Quantum Arithmetic Operator": 'arithmeticIcon.png',
    "Quantum Bitwise Operator": 'bitwiseIcon.png',
    "Quantum Min & Max Operator": 'minMaxIcon.png',
    "Quantum Comparison Operator": 'comparisonIcon.png',
  };
  
  const label = data.label;
  const iconSrc = iconMap[label];
  const iconSizeMap = {
    "Quantum Arithmetic Operator": { width: 45, height: 45 },
    "Quantum Bitwise Operator": { width: 45, height: 45 },
    "Quantum Min & Max Operator": { width: 45, height: 45 },
    "Quantum Comparison Operator": { width: 56, height: 56 },
  };

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: showingChildren ? 360 : 320, height: showingChildren ? 400 : 373 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        {outputIdentifierError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[25px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                Identifier is not unique.
              </div>
            </div>
          )}

          {startsWithDigitError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[25px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
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
                className="absolute left-[25px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(outputIdentifierError || startsWithDigitError) ? '35px' : '80px',
                }}
              >
                Size is not an integer.
              </div>
            </div>
          )}
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
            selected && "border-blue-500"
          )}
          style={{ height: !ancillaMode ? '355px' : `${dynamicHeight}px` }}
        >
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-4 -right-4 w-8 h-8"
              />
            )}
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
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
              <span className="font-semibold leading-none" style={{ paddingLeft: '25px' }}>{data.label.split(consts.quantumLabel)[1]}</span>
            </div>
          </div>

          <div className="px-3 py-1 mb-1">
            <label className="text-sm text-black">Operator:</label>
            <select
              className="w-full p-1 mt-1 bg-white text-center text-lg text-black border-2 border-blue-300 rounded-full"
              value={node.data.operator || operation}
              onChange={(e) => handleYChange(e, "operator")}
            >
              {(node.data.label === consts.quantumLabel + "Arithmetic Operator") && (
                <>
                  <option value="+">+</option>
                  {!completionGuaranteed &&(<option value="-">-</option>)}
                  {!completionGuaranteed &&( <option value="/">/</option>)}
                  {!completionGuaranteed &&(<option value="*">*</option>)}
                  {!completionGuaranteed &&(<option value="**">**</option>)}
                </>
              )}

              {(node.data.label === consts.quantumLabel +"Bitwise Operator") && (
                <>
                  <option value="|">OR</option>
                  <option value="&">AND</option>
                  <option value="~">INVERT</option>
                  <option value="^">XOR</option>
                </>
              )}

              {(node.data.label === consts.quantumLabel +"Comparison Operator") && (
                <>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                </>
              )}

              {(node.data.label === consts.quantumLabel +"Min & Max Operator") && (
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
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <Handle
                  type="target"
                  id={`quantumHandleOperationInput0${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">{node.data.inputs[0]?.outputIdentifier || "Input 1"}</span>
              </div>
              {node.data.label !== consts.quantumLabel + consts.minMaxOperatorLabel && (
              <div
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: consts.quantumConstructColor,
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <Handle
                  type="target"
                  id={`quantumHandleOperationInput1${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">{node.data.inputs[1]?.outputIdentifier || "Input 2"}</span>
              </div>
              )}
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
                      backgroundColor: consts.ancillaConstructColor,
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
                      backgroundColor: consts.dirtyConstructColor,
                    }}
                  />
                  <Handle
                    type="target"
                    id={`${consts.dirtyAncillaHandle}OperationInput3${node.id}`}
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
            {(node.data.label === consts.quantumLabel +"Arithmetic Operator" || node.data.label === consts.quantumLabel + "Bitwise Operator") && (
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
                  outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />
              </>
            )}
            {(node.data.label === consts.quantumLabel +"Comparison Operator" || node.data.label === consts.quantumLabel + "Min & Max Operator") && (
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
                  outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
                  updateNodeValue={updateNodeValue}
                  setOutputIdentifierError={setOutputIdentifierError}
                  setSizeError={setSizeError}
                  setSelectedNode={setSelectedNode}
                  active={true}
                />
              </>
            )}

          </div>
          {ancillaMode && (<div>
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
          </div>)}
        </div>
      </div>
    </motion.div>
  );
});