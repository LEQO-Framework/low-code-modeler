import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";
import { Button } from "antd";
import { motion } from "framer-motion";
import UncomputePort from "../utils/uncomputePort";
import OutputPort from "../utils/outputPort";


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

export const ClassicalOutputOperationNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
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
  const [sizeError, setSizeError] = useState(false);

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
    setSelectedNode(node);
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

          {data.label === "Bitwise Operator" && (
            <div className="px-3 py-1 mb-1">
              <label className="text-sm text-black">Operator:</label>
              <select
                className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
                value={node.data.operator || operation}
                onChange={(e) => handleYChange(e, "operator")}
              >
                <option value="|">OR</option>
                <option value="&">AND</option>
                <option value="~">INVERT</option>
                <option value="^">XOR</option>
              </select>
            </div>
          )}

          {data.label === "minMax" && (
            <div className="px-3 py-1 mb-1">
              <label className="text-sm text-black">Choose:</label>
              <select
                className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
                value={node.data.minmax || ""}
                onChange={(e) => handleYChange(e, "minmax")}
              >
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </div>
          )}

          {data.label === "Comparison Operator" && (
            <div className="px-3 py-1 mb-1">
              <label className="text-sm text-black">Operator:</label>
              <select
                className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
                value={node.data.operator || operation}
                onChange={(e) => handleYChange(e, "operator")}
              >
                <option value="<">&lt;</option>
                <option value=">">&gt;</option>
                <option value="<=">&le;</option>
                <option value=">=">&ge;</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
              </select>
            </div>
          )}

          {data.label === "search" && (
            <div className="px-3 py-1 mb-1">
              <label className="text-sm text-black">Search Index:</label>
              <input
                type="text"
                className="w-full p-1 mt-1 bg-white text-center text-sm text-black border-2 border-blue-300 rounded-full"
                value={node.data.searchIndex || ""}
                onChange={(e) => handleYChange(e, "searchIndex")}
                placeholder="Enter search index"
              />
            </div>
          )}



          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col space-y-4 overflow-visible">
              <div className="relative flex items-center" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '60px' }}>
                <Handle
                  type="target"
                  id="quantumHandleOperation1"
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black"
                />
                <span className="ml-4 text-black text-sm">{node.data.inputs[0]?.label || "Input 1"}</span>
              </div>
              <div className="relative flex items-center" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '60px' }}>
                <Handle
                  type="target"
                  id="quantumHandleOperation2"
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black"
                />
                <span className="ml-4 text-black text-sm">{node.data.inputs[1]?.label || "Input 2"}</span>
              </div>
              <div className="relative flex items-center" style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)', width: '60px' }}>
                <Handle
                  type="source"
                  id="ancilla"
                  position={Position.Left}
                  className="z-10 classical-circle-port-op !bg-gray-500 !border-black w-4 transform rotate-45"
                />
                <span className="ml-4 text-black text-sm">ancilla</span>
              </div>
            </div>
          </div>

          <div className="custom-node-port-out">
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
              active={true}
            />
          </div>
          <UncomputePort
            node={node}
            edges={edges}
          />
        </div>

      </div>
    </motion.div>
  );

});