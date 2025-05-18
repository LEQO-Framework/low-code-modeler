import { memo, useState, useEffect } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import { motion } from "framer-motion";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { isUniqueIdentifier } from "../utils/utils";
import OutputPort from "../utils/outputPort";
import UncomputePort from "../utils/uncomputePort";

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
  const [sizeError, setSizeError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [encodingType, setEncodingType] = useState("");
  const [mounted, setMounted] = useState(false);
 
  
  const { updateNodeValue, setSelectedNode, setNodes, edges, nodes } = useStore(selector, shallow);
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
    setMounted(true);
  }, []);

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{
        width: showingChildren ? 360 : 320, height:
          showingChildren
            ? 400
            : node.data.label === "Prepare State"
              ? 310
              : 400
      }}
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
        {node.data.label === "Encode Value" && (<div className="relative flex flex-col items-start text-black text-center overflow-visible">
          <div style={{ padding: "4px" }}>

            <div className="flex items-center space-x-2 mt-2" style={{ backgroundColor: 'rgba(255, 165, 0, 0.2)' }}>
              <Handle
                type="target"
                id={`classicalHandleStatePreparation0${node.id}`}
                position={Position.Left}
                className="z-10 classical-circle-port-in !bg-orange-300 !border-black"
                style={{ top: "20px" }}
                isConnectable={edges.filter(edge => edge.target === node.id).length < 2}

              />
              <span className="text-black text-sm" style={{ visibility: showingChildren ? "hidden" : "visible" }}>{node.data.inputs[0]?.outputIdentifier || "Value"}</span>

            </div>

            <div className="flex items-center space-x-2 mt-2" style={{ backgroundColor: 'rgba(137, 218, 131, 0.2)' }}>
              <Handle
                type="target"
                id={`ancillaHandleEncodeValue0${node.id}`}
                position={Position.Left}
                className={cn(
                  "z-10 !border-black w-4 transform rotate-45",
                  isConnected ? "classical-circle-port-st !bg-green-300" : "classical-circle-port-st !bg-gray-500"
                )}
                style={{ top: "40px" }}
                onConnect={connection => console.log(connection)}
                isValidConnection={(connection) => { console.log(5); return false }}
              // hier noch connection.source.type !== positionNode
              //isConnectable={nodes.filter(node=> edges.filter(edge=> {console.log(edge); return edge.target === node.id && edge.targetHandle === "ancilla"}).length < 1) }

              />
              <span className="ml-2 text-black text-sm" style={{ visibility: showingChildren ? "hidden" : "visible" }} >{node.data.inputs[1]?.outputIdentifier || "Ancilla"}</span>
            </div>
          </div>
        </div>)}
        {node.data.label === "Prepare State" && (<div className="relative flex items-center items-start space-x-0 overflow-visible mt-1">
          <div
            className="flex flex-col items-end space-y-1 relative p-2"
            style={{
              backgroundColor: 'rgba(137, 218, 131, 0.2)',
              width: '120px',
            }}
          >
            <div className="w-full text-right text-sm text-black">Ancilla</div>

            <div className="flex items-center justify-between w-full space-x-2">
              <Handle
                type="target"
                id={`ancillaHandlePrepareState0${node.id}`}
                position={Position.Left}
                className={cn(
                  "z-10 !border-black w-4 transform rotate-45",
                  "classical-circle-port-st",
                  isConnected ? "!bg-green-300" : "!bg-gray-200 border-dashed"
                )}
                isValidConnection={() => true}
                isConnectable={true}
                style={{
                  top: '50%',
                  transform: "rotate(45deg) translateY(-50%)",
                  backgroundColor: 'rgba(137, 218, 131, 0.2)',
                  position: "absolute"
                }}
                isConnectableEnd={true}
              />
            </div>
          </div>
        </div>)
        }


        <div className="custom-node-port-out">
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
        </div>
        <UncomputePort
          node={node}
          edges={edges}
        />
      </div>
    </motion.div>
  );
});
