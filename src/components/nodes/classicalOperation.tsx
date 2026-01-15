import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { shallow } from "zustand/shallow";
import { Button } from "antd";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import * as consts from "@/constants";

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

export const ClassicalOperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode, ancillaMode } = useStore(selector, shallow);
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

  useEffect(() => {
    updateNodeInternals(node.id);
    if (node.data.operator === undefined) {
      if (node.data.label === consts.classicalLabel + consts.arithmeticOperatorLabel) {
        updateNodeValue(node.id, "operator", "+");
      }
      else if (node.data.label === consts.classicalLabel + consts.bitwiseOperatorLabel) {
        updateNodeValue(node.id, "operator", "OR");
      }
      if (node.data.label === consts.classicalLabel + consts.comparisonOperatorLabel) {
        updateNodeValue(node.id, "operator", "<");
      }
      else { updateNodeValue(node.id, "operator", "min"); }
    } else {
      updateNodeValue(node.id, "operator", node.data.operator);
    }
  }, []);

  const baseHeight = 350;
  const extraHeightPerVariable = 20;
  const dynamicHeight = baseHeight + (inputs.length + outputs.length) * extraHeightPerVariable;

  const iconMap = {
    "Classical Arithmetic Operator": 'classicalArithmeticIcon.png',
    "Classical Bitwise Operator": 'classicalBitwiseIcon.png',
    "Classical Min & Max Operator": 'classicalMinMaxIcon.png',
    "Classical Comparison Operator": 'classicalComparisonIcon.png',
  };
  const label = data.label;
  const iconSrc = iconMap[label];
    const iconSizeMap = {
    "Classical Arithmetic Operator": { width: 45, height: 45 },
    "Classical Bitwise Operator": { width: 45, height: 45 },
    "Classical Min & Max Operator": { width: 45, height: 45 },
    "Classical Comparison Operator": { width: 56, height: 56 },
  };

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
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md overflow-hidden",
            selected && "border-blue-500"
          )}
          style={{ height: `${dynamicHeight}px`, borderRadius: "40px" }}
        >
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-orange-300 py-1 px-2 flex items-center" style={{ height: "inherit", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", overflow: "hidden", paddingLeft: '25px',}}
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
              <span className="font-semibold leading-none" style={{ paddingLeft: '15px' }}>{data.label.split(consts.classicalLabel)[1]}</span>
            </div>
          </div>

          <div className="px-3 py-1 mb-1">
            <label className="text-sm text-black">Operator:</label>
            <select
              className="w-full p-1 mt-1 bg-white text-center text-lg text-black border-2 border-orange-300 rounded-full"
              value={node.data.operator || operation}
              onChange={(e) => handleYChange(e, "operator")}
            >
              {(node.data.label === "Classical Arithmetic Operator") && (
                <>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="/">/</option>
                  <option value="*">*</option>
                  <option value="**">**</option>
                </>
              )}

              {(node.data.label === "Classical Bitwise Operator") && (
                <>
                  <option value="|">OR</option>
                  <option value="&">AND</option>
                  <option value="~">INVERT</option>
                  <option value="^">XOR</option>
                </>
              )}

              {(node.data.label === "Classical Comparison Operator") && (
                <>
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                </>
              )}

              {(node.data.label === "Classical Min & Max Operator") && (
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
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderTopRightRadius: '20px',
                    borderBottomRightRadius: '20px',
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleOperationInput0${node.id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">{node.data.inputs.find(
                    (input) => input.targetHandle === `classicalHandleOperationInput0${node.id}`)?.outputIdentifier || "Input 1"}</span>
              </div>
               {node.data.label !== consts.classicalLabel + consts.minMaxOperatorLabel && (
              <div
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: consts.classicalConstructColor,
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleOperationInput1${node.id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">{node.data.inputs.find(
                    (input) => input.targetHandle === `classicalHandleOperationInput1${node.id}`)?.outputIdentifier || "Input 2"}</span>
              </div>)}
              <div
                className="relative p-2 mb-1 overflow-visible"
                style={{
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  left: "132px"
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
                  active={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});