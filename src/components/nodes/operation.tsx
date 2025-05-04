import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";
import { Button } from "antd";
import { motion } from "framer-motion";


const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[],
  nodes: Node[],
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const OperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [encodingType, setEncodingType] = useState("Basis Encoding");
  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [operation, setOperation] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);

  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([...inputs, { id: newInputId, label: `Variable ${inputs.length + 1}` }]);
    setOutputs([...outputs, { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" }]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(outputs.map(output => output.id === id ? { ...output, value: newValue } : output));
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

  const baseHeight = 360;
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
        <div className="w-full bg-blue-300 text-black text-center font-semibold py-1 truncate">
          {data.label}
        </div>
        <div className="px-3 py-1 mb-1">
          <label className="text-sm text-black">Operator:</label>
          <select
            className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
            value={node.data.operator || operation}
            onChange={(e) => handleYChange(e, "operator")}
          >
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="/">/</option>
            <option value="*">*</option>
            <option value="**">**</option>
          </select>
        </div>
        
        <div className="custom-node-port-in mb-3 mt-2">
          <div className="relative flex flex-col space-y-4 overflow-visible">
            <div className="relative flex items-center" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '60px' }}>
              <Handle
                type="target"
                id={`quantumHandleOperationInput0${node.id}`}
                position={Position.Left}
                className="z-10 circle-port-op !bg-blue-300 !border-black"
              />
              <span className="ml-4 text-black text-sm">{node.data.inputs[0]?.outputIdentifier || "Input 1"}</span>
            </div>
            <div className="relative flex items-center" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '60px' }}>
              <Handle
                type="target"
                id={`quantumHandleOperationInput1${node.id}`}
                position={Position.Left}
                className="z-10 circle-port-op !bg-blue-300 !border-black"
              />
              <span className="ml-4 text-black text-sm">{node.data.inputs[1]?.outputIdentifier || "Input 2"}</span>
            </div>
            <div className="relative flex items-center" style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)', width: '60px' }}>
              <Handle
                type="target"
                id={`ancillaHandleOperationInput0${node.id}`}
                position={Position.Left}
                className="z-10 classical-circle-port-op !bg-gray-500 !border-black w-4 transform rotate-45"
              />
              <span className="ml-4 text-black text-sm">ancilla</span>
            </div>
          </div>
        </div>
        
        <button onClick={addVariable} className="add-variable-button mt-2 w-full bg-gray-300 py-1 rounded text-sm text-black">
          + Add More Variables
        </button>
        
        <div className="custom-node-port-out">
          <div className="relative flex items-center justify-end space-x-0 overflow-visible">
            <div
              className="flex items-center space-x-2 relative"
              style={{
                backgroundColor:'rgba(105, 145, 210, 0.2)',
                width: '150px',
              }}
            >
              <label htmlFor="outputIdentifier" className="text-sm text-black mr-2">Output</label>
              <input
                id="outputIdentifier"
                className={`p-1 text-sm text-black opacity-75 w-10 text-center rounded-none border 
    ${outputIdentifierError ? 'bg-red-500 border-red-500' : 'bg-white border-gray-500'}`}
                value={node.data.outputIdentifier || outputIdentifier}
                placeholder="a"
                onChange={e => handleOutputIdentifierChange(e, "outputIdentifier")}
              />

              <Handle
                type="source"
                id={`quantumHandleOperationOutput0${node.id}`}
                position={Position.Right}
                className="z-10 circle-port-out !bg-blue-300 !border-black"
                isValidConnection={(connection) => true}
              />
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-end space-x-0 overflow-visible mt-2">
          <div className="flex items-center space-x-2 relative" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '150px' }}>
            <span className="text-sm text-black mr-2">Uncompute</span>

            <Handle
              type="source"
              id={`quantumHandleOperationUncomputeOutput1${node.id}`}
              position={Position.Right}
              className="z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );

});