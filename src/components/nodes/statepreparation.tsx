import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, Node, getConnectedEdges, Edge } from "reactflow";
import { motion } from "framer-motion";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { Button } from "antd";
import { useHandleConnections } from "@xyflow/react";
import { cn } from "@/lib/utils";

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

export const StatePreparationNode = memo((node: Node) => {
  const [size, setSize] = useState("");
  const [bound, setBound] = useState("");
  const [quantumStateName, setQuantumStateName] = useState("GHZ");
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [yError, setYError] = useState(false);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [encodingType, setEncodingType] = useState("");
  const [mounted, setMounted] = useState(false);

  const { updateNodeValue, setSelectedNode, setNodes, edges, nodes } = useStore(selector, shallow);
  const [valueLabel, setValueLabel] = useState("value(s)");
  const [ancillaLabel, setAncillaLabel] = useState("ancilla");

  const hasTestTargetHandle = edges.some(edge => edge.targetHandle === "ancillaHandleEncodeValue" + node.id);
  console.log(hasTestTargetHandle)
  console.log(encodingType)

  if (hasTestTargetHandle) {
    console.log("An edge exists with targetHandle === 'test'");
  } else {
    console.log("No edge with targetHandle === 'test' found");
  }


  const handleConnect = (connection, type) => {
    console.log("handleConnect")
    if (connection && connection.source) {
      if (type === "value") {
        setValueLabel(`Connected: ${connection.source}`);
      } else if (type === "ancilla") {
        setAncillaLabel(`Connected: ${connection.source}`);
      }
    }
  };


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
      setYError(true);
    } else {
      setYError(false);
    }
    if (field === "size") {
      setSize(value);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, number);
    setSelectedNode(node);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: showingChildren ? 360 : 320, height: showingChildren ? 400 : 373 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="rounded-none bg-white border border-solid border-gray-700 shadow-md relative w-full h-full">
        {node.data.implementation && (
          <img
            src="implementation-icon.png"
            alt="Custom Icon"
            className="absolute -top-4 -right-4 w-8 h-8"
          />
        )}

        <div className="w-full bg-blue-300 text-black text-center font-semibold py-1 truncate flex items-center justify-center space-x-2">
          <span className="text-sm">{node.data.label}</span>
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
                {node.data.encodingType  === "Basis Encoding" && (
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
                {node.data.encodingType !== "Basis Encoding" && node.data.encodingType  !== "Angle Encoding" && (
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
                <label className="text-sm text-black">Size:</label>
                <input
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-300 rounded-full"
                  type="text"
                  id="size"
                  value={node.data.size || size}
                  onChange={(e) => handleYChange(e, "size")}
                  placeholder="Enter size"
                />

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
        {node.data.label === "Encode Value" && (<div className="relative flex flex-col items-start text-black text-center overflow-visible">
          <div style={{ padding: "4px" }}>

            <div className="flex items-center space-x-2 mt-2" style={{ backgroundColor: 'rgba(255, 165, 0, 0.2)' }}>
              <Handle
                type="target"
                id={`classicalHandleStatePreparation${node.id}`}
                position={Position.Left}
                className="z-10 classical-circle-port-in !bg-orange-300 !border-black"
                style={{ top: "20px" }}
                isConnectable={edges.filter(edge => edge.target === node.id).length < 2}
                onConnect={(connection) => handleConnect(connection, "value")}
              />
              <span className="text-black text-sm" style={{ visibility: showingChildren ? "hidden" : "visible" }}>{node.data.inputs[0]?.outputIdentifier || "value(s)"}</span>

            </div>

            <div className="flex items-center space-x-2 mt-2" style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)' }}>
              <Handle
                type="target"
                id={`ancillaHandleEncodeValue${node.id}`}
                position={Position.Left}
                className={cn(
                  "z-10 !border-black w-4 transform rotate-45",
                  hasTestTargetHandle ? "classical-circle-port-st !bg-green-300" : "classical-circle-port-st !bg-gray-500"
                )}
                style={{ top: "40px" }}
                onConnect={connection => console.log(connection)}
                isValidConnection={(connection) => { console.log(5); return false }}
              // hier noch connection.source.type !== positionNode
              //isConnectable={nodes.filter(node=> edges.filter(edge=> {console.log(edge); return edge.target === node.id && edge.targetHandle === "ancilla"}).length < 1) }

              />
              <span className="ml-2 text-black text-sm" style={{ visibility: showingChildren ? "hidden" : "visible" }} >{node.data.inputs[1]?.outputIdentifier || "ancilla"}</span>
            </div>
          </div>
        </div>)}
        {node.data.label === "Prepare State" && (<div className="relative flex flex-col items-start text-black text-center overflow-visible">
          <div style={{ padding: "4px" }}>
            <div className="flex items-center space-x-2 mt-2" style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)' }}>
              <Handle
                type="source"
                id={`ancillaHandlePrepareState${node.id}`}
                position={Position.Left}
                className={cn(
                  "z-10 !border-black w-4 transform rotate-45",
                  hasTestTargetHandle ? "classical-circle-port-st !bg-green-300" : "classical-circle-port-st !bg-gray-500"
                )}
                style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)' }}
                isValidConnection={() => true}
              />

              <span className="ml-2 text-black text-sm" style={{ visibility: showingChildren ? "hidden" : "visible" }}>ancilla</span>
            </div>
          </div>
        </div>)}


        <div className="custom-node-port-out">
          <div className="relative flex items-center justify-end space-x-0 overflow-visible">
            <div
              className="flex items-center space-x-2 relative"
              style={{
                backgroundColor: 'rgba(105, 145, 210, 0.2)',
                width: '150px',
              }}
            >
              <label style={{ visibility: showingChildren ? "hidden" : "visible" }} htmlFor="outputIdentifier" className="text-sm text-black mr-2">Output</label>
              <input
                id="outputIdentifier"
                className={`p-1 text-sm text-black opacity-75 w-10 text-center rounded-none border 
    ${outputIdentifierError ? 'bg-red-500 border-red-500' : 'bg-white border-gray-500'}`}
                value={node.data.outputIdentifier || outputIdentifier}
                placeholder="a"
                style={{ visibility: showingChildren ? "hidden" : "visible" }}
                onChange={e => handleOutputIdentifierChange(e, "outputIdentifier")}
              />

              <Handle
                type="source"
                id={`quantumHandleStatePreparationOutput${node.id}`}
                position={Position.Right}
                className="z-10 circle-port-out !bg-blue-300 !border-black"
                isValidConnection={(connection) => true}
                isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
              />
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-end space-x-0 overflow-visible mt-2">
          <div className="flex items-center space-x-2 relative" style={{ backgroundColor: 'rgba(105, 145, 210, 0.2)', width: '150px' }}>
            <span className="text-sm text-black mr-2">Uncompute</span>

            <Handle
              type="source"
              id={`quantumHandleUncomputeStatePreparation${node.id}`}
              position={Position.Right}
              className="z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleUncomputeStatePreparation" + node.id).length < 1}
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
});
