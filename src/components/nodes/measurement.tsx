import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useState, useRef } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";
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

export const MeasurementNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);
  const [y, setY] = useState("");
    const [outputIdentifierError, setOutputIdentifierError] = useState(false);
    const [outputIdentifier, setOutputIdentifier] = useState("");
    const [operation, setOperation] = useState("");
    const [showingChildren, setShowingChildren] = useState(false);
    const [sizeError, setSizeError] = useState(false);


  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);
  const [indices, setIndices] = useState("");

  const xRef = useRef(null);
  const yRef = useRef(null);


  const baseHeight = 380;
  const extraHeightPerVariable = 40;
  const dynamicHeight = baseHeight + (inputs.length) * extraHeightPerVariable;
  console.log(dynamicHeight)

  const handleYChange = (e, field) => {
    const value = e.target.value;
    if (field === "indices") {
      setIndices(value);
      node.data[field] = value;
      updateNodeValue(node.id, field, value);
      setSelectedNode(node);
      return;
    }
    // Check if the first character is a letter or underscore
    if (!/^[a-zA-Z_]/.test(value) || value == "") {
      setYError(true);
    } else {
      setYError(false);
    }

    setY(value);
    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    setSelectedNode(node);
  };

  return (
    <div className="grand-parent">
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
      >
        <div className="w-full bg-blue-300 text-black text-center font-semibold py-1 truncate">
          Measurement
        </div>

        <div className="px-2 py-3 flex justify-center">
          <div className="flex items-center mb-2">
            <label htmlFor="x" className="text-black text-sm mr-2">Indices</label>
            <input
              ref={xRef}
              id="x"
              type="text"
              className={`p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 ${error ? 'bg-red-500 border-red-500' : 'bg-white border-blue-300'}`}
              value={node.data.indices || indices}
              placeholder="1,2,3"
              onChange={e => handleYChange(e, "indices")}
            />
          </div>

        </div>
        <div className="custom-node-port-in mb-3 mt-2">

          <div className="relative flex flex-col items-start text-black text-center overflow-visible">
            <div style={{ padding: "4px", backgroundColor: "rgba(105, 145, 210, 0.2)", width: "45%" }}>

              <div className="flex items-center space-x-2 mt-2">
                <Handle
                  type="target"
                  id={`quantumHandleMeasurement0${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black"
                  style={{ top: "20px" }}
                  isValidConnection={(connection) => true}
                />
                <span className="text-black text-sm" >{node.data.inputs[0]?.outputIdentifier || "Register"}</span>
              </div>
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
          <OutputPort
            node={node}
            index={1}
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
        </div>



      </div>
    </div>
  );
});
