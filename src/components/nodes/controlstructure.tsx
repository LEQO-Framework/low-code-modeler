import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, Node, Edge, useUpdateNodeInternals, NodeResizer } from "reactflow";
import { motion } from "framer-motion";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { Button, Input } from "antd";
import { cn } from "@/lib/utils";


const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});
// [Imports remain the same]

export const ControlStructureNode = memo((node: Node) => {
  const [showingChildren, setShowingChildren] = useState(false);
  const { setNodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const [quantumHandles, setQuantumHandles] = useState([0]);
  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);

  useEffect(() => {
    const connectedQuantumInputs = quantumHandles.filter((index) =>
      edges.some((edge) => edge.targetHandle === `quantumHandleInputInitialization${node.id}-${index}`)
    );

    const lastIndex = quantumHandles[quantumHandles.length - 1];
    const lastHandleId = `quantumHandleInputInitialization${node.id}-${lastIndex}`;
    const isLastConnected = edges.some(edge => edge.targetHandle === lastHandleId);

    // Add only if not already added
    if (isLastConnected && quantumHandles.length === connectedQuantumInputs.length) {
      setQuantumHandles((prev) => [...prev, prev.length]);
    }

    setQuantumOutputHandles(connectedQuantumInputs);
    updateNodeInternals(node.id);
  }, [edges, node.id]);



  const dynamicHeight = 600 + Math.max(0, quantumHandles.length - 1) * 30;
  const totalHandles = Math.max(quantumHandles.length, 0);
  const hexagonHeight = Math.max(250, 180 + totalHandles * 30);
  const hexagonTopOffset = -(hexagonHeight / 2) + 20;

  return (
    <div className="grand-parent overflow-visible"
      style={{ minWidth: "1100px", height: `${dynamicHeight}px`, position: "relative", zIndex: -4 }}>
      <div className="rounded-none border border-solid border-gray-700 shadow-md w-full h-full flex items-center justify-center relative overflow-visible">
        <div className="rounded-md border border-solid border-gray-700 shadow-md w-full h-full flex flex-col items-center relative z-10 overflow-visible">
          <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
            <span className="text-sm">Repeat</span>
          </div>

          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div style={{
                position: "absolute",
                height: `${hexagonHeight}px`,
                left: "-120px",
                top: `${hexagonTopOffset}px`,
                width: "250px",
                backgroundColor: "black",
                clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                zIndex: 0
              }} />
              <div
                className="hexagon-left"
                style={{
                  border: "none",
                  position: "absolute",
                  left: "-52px",
                  top: `${hexagonTopOffset - 2}px`,
                  width: "253px",
                  height: `${hexagonHeight + 3}px`,
                  backgroundColor: "black",
                  clipPath:
                    "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                  zIndex: 0,
                  transform: "translateX(-1.5px)",
                }}
              ></div>{/* Weißes Hexagon vorne */}
              <div
                className="hexagon-left"
                style={{
                  border: "none",
                  position: "absolute",
                  left: "-50px",
                  top: `${hexagonTopOffset}px`,
                  width: "250px",
                  height: `${hexagonHeight}px`,
                  backgroundColor: "white",
                  clipPath:
                    "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                  zIndex: 1,
                }}
              >
                <div className="w-full flex items-center" style={{ height: '52px' }}>
                  <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
                    <img src="repeatIcon.png" alt="icon" className="w-[65px] h-[65px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
                    <div className="h-full w-[1px] bg-black mx-2" />
                    <span className="font-semibold leading-none" style={{ paddingLeft: '25px' }}>Repeat Start</span>
                  </div>
                </div>
                <span className="text-sm block mt-3">Number:</span>
                <Input
                  size="small"
                  placeholder="Enter condition"
                  className="mt-1 w-[80%] text-center"
                  style={{ fontSize: "12px", height: "22px" }}
                  value={node.data.condition || ""}
                  onChange={(e) => updateNodeValue(node.id, "condition", e.target.value)}
                />
              </div>

              {/* Handles - Left */}
              <div style={{ position: "absolute", left: "-75px", overflow: "visible" }}>
                {quantumHandles.map((index, i) => {
                  const handleId = `quantumHandleInputInitialization${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);
                  return (
                    <Handle
                      key={handleId}
                      type="target"
                      id={handleId}
                      position={Position.Left}
                      className={cn("z-10 circle-port-hex-in", isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black")}
                      style={{ top: `${hexagonTopOffset + 100 + i * 30}px`, overflow: "visible" }}
                      isConnectable={true}
                      isConnectableStart={false}
                    />
                  );
                })}
              </div>
              {/* Output Handles - Right side of the left polygon */}
              <div style={{ position: "absolute", right: "215px", overflow: "visible" }}>
                {quantumHandles.map((index, i) => {
                  const handleInputId = `quantumHandleInputInitialization${node.id}-${index}`;
                  const isInputConnected = edges.some(edge => edge.targetHandle === handleInputId);
                  const handleId = `quantumHandleOutputInitialization${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.sourceHandle === handleId);
                  console.log(isConnected)
                  return isInputConnected && (
                    <Handle
                      key={handleId}
                      type="source"
                      id={handleId}
                      position={Position.Right}
                      className={cn("z-10 circle-port-hex-out", isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black")}
                      style={{
                        top: `${hexagonTopOffset + 100 + i * 30}px`,
                        overflow: "visible"
                      }}
                      isConnectable={true}
                      isConnectableEnd={false}
                    />
                  );
                })}
              </div>

            </div>
          </div>

          {/* Repeat End (Right Side) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div style={{
                position: "absolute",
                width: "250px",
                height: `${hexagonHeight}px`,
                left: "95px",
                backgroundColor: "black",
                top: `${hexagonTopOffset}px`,
                clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)"
              }} />
              <div
                className="hexagon-right"
                style={{
                  border: "none",
                  position: "absolute",
                  left: "95px",
                  top: `${hexagonTopOffset - 2}px`,
                  width: "253px",
                  height: `${hexagonHeight + 3}px`,
                  backgroundColor: "black",
                  clipPath:
                    "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                  zIndex: 0,
                  transform: "translateX(-1.5px)",
                }}
              ></div>{/* Weißes Hexagon vorne */}
              <div
                className="hexagon-right"
                style={{
                  border: "none",
                  position: "absolute",
                  left: "95px",
                  top: `${hexagonTopOffset}px`,
                  width: "250px",
                  height: `${hexagonHeight}px`,
                  backgroundColor: "white",
                  clipPath:
                    "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                  zIndex: 1,
                }}
              >  <div className="w-full flex items-center" style={{ height: '52px' }}>
                  <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
                    <img src="repeatIcon.png" alt="icon" className="w-[65px] h-[65px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
                    <div className="h-full w-[1px] bg-black mx-2" />
                    <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>Repeat End</span>
                  </div>
                </div>

              </div>

              {/* Handles - Left side of the right polygon */}
              <div style={{ position: "absolute", left: "140px", overflow: "visible" }}>
                {quantumHandles.map((index, i) => {
                  const handleInputId = `quantumHandleInputInitialization${node.id}-${index}`;
                  const isInputConnected = edges.some(edge => edge.targetHandle === handleInputId);
                  const handleId = `quantumHandleInputDynamic${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);
                  return isInputConnected && (
                    <Handle
                      key={handleId}
                      type="target"
                      id={handleId}
                      position={Position.Left}
                      className={cn(
                        "z-10 circle-port-hex-in",
                        isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                      )}
                      style={{ top: `${hexagonTopOffset + 100 + i * 30}px`, overflow: "visible" }}
                      isConnectable={true}
                      isConnectableStart={false}
                    />
                  );
                })}
              </div>

              {/* Handles - Right side of the right polygon */}
              <div style={{ position: "absolute", right: "0px", overflow: "visible" }}>
                {quantumHandles.map((index, i) => {
                  const handleInputId = `quantumHandleInputInitialization${node.id}-${index}`;
                  const isInputConnected = edges.some(edge => edge.targetHandle === handleInputId);
                  const handleId = `quantumHandleOutputDynamic${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.sourceHandle === handleId);
                  return isInputConnected && (
                    <Handle
                      key={handleId}
                      type="source"
                      id={handleId}
                      position={Position.Right}
                      className={cn(
                        "z-10 circle-port-hex-out",
                        isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                      )}
                      style={{ top: `${hexagonTopOffset + 100 + i * 30}px`, overflow: "visible" }}
                      isConnectable={true}
                      isConnectableEnd={false}
                    />
                  );
                })}
              </div>

            </div>
          </div>
    
        </div>
      </div>
    </div>
  );
});
