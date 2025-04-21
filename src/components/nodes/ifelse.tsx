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

export const ControlStructureNode = memo((node: Node) => {
  const [showingChildren, setShowingChildren] = useState(false);
  const { setNodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();
  const [quantumHandles, setQuantumHandles] = useState([0]);
  const [classicalHandles, setClassicalHandles] = useState([0]);

  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);
  const [quantumOutputHandlesElse, setQuantumOutputHandlesElse] = useState([0]);
  const [classicalOutputHandles, setClassicalOutputHandles] = useState([0]);
  const [classicalOutputHandlesElse, setClassicalOutputHandlesElse] = useState([0]);



  useEffect(() => {
    const connectedQuantumHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);
    const connectedClassicalHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const expectedHandles = quantumHandles.map(index => `quantumHandleInputInitialization${node.id}-${index}`);

    const expectedClassicalHandles = classicalHandles.map(index => `classicalHandleInputInitialization${node.id}-${index}`);
    const lastHandle = expectedHandles[expectedHandles.length - 1];
    const lastClassicalHandle = expectedClassicalHandles[expectedClassicalHandles.length - 1];

    if (connectedQuantumHandles.includes(lastHandle)) {
      setQuantumHandles(prev => [...prev, prev.length]);
    }
    if (connectedClassicalHandles.includes(lastClassicalHandle)) {
      setClassicalHandles(prev => [...prev, prev.length]);
    }
    const connectedOutputHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleDynamicOutput${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandles)

    const expected = classicalOutputHandles.map(index => `classicalHandleDynamicOutput${node.id}-${index}`);
    const lastHandleId = expected[expected.length - 1];

    if (connectedOutputHandles.includes(lastHandleId)) {
      setClassicalOutputHandles(prev => [...prev, prev.length]);
    }
    const connectedOutputHandlesElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesElse)

    const expectedElse = classicalOutputHandlesElse.map(index => `classicalHandleDynamicOutputElse${node.id}-${index}`);
    const lastHandleIdElse = expectedElse[expectedElse.length - 1];

    if (connectedOutputHandlesElse.includes(lastHandleIdElse)) {
      setClassicalOutputHandlesElse(prev => [...prev, prev.length]);
    }

    const connectedQuantumOutputHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleDynamicOutput${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandles)

    const quantumExpected = quantumOutputHandles.map(index => `quantumHandleDynamicOutput${node.id}-${index}`);
    const lastQuantumHandleId = quantumExpected[quantumExpected.length - 1];

    if (connectedQuantumOutputHandles.includes(lastQuantumHandleId)) {
      setQuantumOutputHandles(prev => [...prev, prev.length]);
    }
    const connectedOutputHandlesQuantumElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesQuantumElse)

    const expectedQuantumElse = quantumOutputHandlesElse.map(index => `quantumHandleDynamicOutputElse${node.id}-${index}`);
    const lastHandleIdQuantumElse = expectedQuantumElse[expectedQuantumElse.length - 1];

    if (connectedOutputHandlesQuantumElse.includes(lastHandleIdQuantumElse)) {
      setQuantumOutputHandlesElse(prev => [...prev, prev.length]);
    }
  }, [edges, node.id, classicalHandles, quantumHandles, classicalOutputHandles, quantumOutputHandles, quantumOutputHandlesElse, classicalOutputHandlesElse]);

  const dynamicHeight = 900 + Math.max(0, quantumHandles.length - 1 + (classicalHandles.length - 1)) * 30;
  const totalHandles = classicalHandles.length + quantumHandles.length + classicalOutputHandles.length + classicalOutputHandlesElse.length + quantumOutputHandles.length+ quantumOutputHandlesElse.length;
  const hexagonHeight = Math.max(250, 280 + totalHandles * 30);
  const hexagonTopOffset = -(hexagonHeight / 2) + 20;


  return (
    <div
      className="grand-parent overflow-visible"
      style={{ overflow: "visible", minWidth: "1100px", height: `${dynamicHeight}px`, position: "relative" }}

    >
      <div
        className="absolute z-20 text-black text-center font-bold bg-purple-300 py-1 rounded"
        style={{
          top: "50%",
          left: "0",
          width: "100%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          zIndex: 9
        }}
      >
        End
      </div>

      <div className="rounded-none border border-solid border-gray-700 shadow-md relative w-full h-full relative flex items-center justify-center overflow-visible">
        <div className="rounded-md border border-solid border-gray-700 shadow-md w-full h-full flex flex-col items-center relative z-10 overflow-visible">
          <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
            <span className="text-sm">Then</span>
          </div>
          <div
            className="absolute"
            style={{
              top: "0",
              bottom: "0",
              left: "200px",
              width: "2px",
              backgroundColor: "#000",
              zIndex: 9,
            }}
          >
            {classicalHandles.map((index, i) => (
              <Handle
                key={`classical-${index}`}
                type="source"
                id={`classicalHandleInputInitialization8${node.id}-${index}`}
                position={Position.Right}
                className="z-10 classical-circle-port-out !bg-orange-300 !border-black"
                style={{ top: `${100 + i * 30}px`, overflow: "visible", zIndex: 3000, left: "-6px" }}
                isConnectable={true}
              />
            ))}
            {quantumHandles.map((index, i) => (
              <Handle
                key={`quantum-${index}`}
                type="source"
                id={`quantumHandleInputInitialization8${node.id}-${index}`}
                position={Position.Right}
                className="z-10 circle-port-out !bg-blue-300 !border-black"
                style={{ top: `${100 + classicalHandles.length * 30 + i * 30}px`, overflow: "visible", zIndex: 3000, left: "-6px" }}
                isConnectable={true}
              />
            ))}

            {classicalHandles.map((index, i) => (
              <Handle
                key={`side-classical-${index}`}
                type="source"
                id={`sideClassicalHandle-${node.id}-${index}`}
                position={Position.Right}
                className="z-10 classical-circle-port-hex-out !bg-orange-300 !border-black"
                style={{
                  top: `calc(70% + ${30 + i * 30}px)`, // Start below the side handle
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                  zIndex: 3000,
                }}
                isConnectable={true}
              />
            ))}
            {quantumHandles.map((index, i) => (
              <Handle
                key={`side-quantum-${index}`}
                type="source"
                id={`sideQuantumHandle-${node.id}-${index}`}
                position={Position.Right}
                className="z-10 circle-port-hex-out !bg-blue-300 !border-black"
                style={{
                  top: `calc(70% + ${30 * (classicalHandles.length + 1 + i)}px)`, // offset by classical height
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                  zIndex: 3000,
                }}
                isConnectable={true}
              />
            ))}
          </div>

          {/* Repeat Start (left polygon) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div
                className="hexagon-left"
                style={{
                  position: "absolute",
                  left: "-50px",
                  width: "250px",
                  height: `${hexagonHeight}px`,
                  backgroundColor: "white",
                  top: `${hexagonTopOffset}px`,
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
              >
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">If</span>
                </div>

                <span className="text-sm block mt-3">Condition:</span>
                <Input
                  size="small"
                  placeholder="Enter condition"
                  className="mt-1 w-[80%] text-center"
                  style={{ fontSize: "12px", height: "22px" }}
                  value={node.data.condition || ""}
                  onChange={(e) => updateNodeValue(node.id, "condition", e.target.value)}
                />
              </div>

              {/* Left handles */}
              <div style={{ position: "absolute", left: "-75px", overflow: "visible" }}>

                {classicalHandles.map((index, i) => (
                  <Handle
                    key={`classical-${index}`}
                    type="target"
                    id={`classicalHandleInputInitialization${node.id}-${index}`}
                    position={Position.Left}
                    className="z-10 classical-circle-port-hex-in !bg-orange-300 !border-black"
                    style={{ top: `${hexagonTopOffset + 70 + i * 30}px`, overflow: "visible", zIndex: 3000, }}
                    isConnectable={true}
                  />
                ))}
                {quantumHandles.map((index, i) => (
                  <Handle
                    key={`quantum-${index}`}
                    type="target"
                    id={`quantumHandleInputInitialization${node.id}-${index}`}
                    position={Position.Left}
                    className="z-10 circle-port-hex-in !bg-blue-300 !border-black"
                    style={{ top: `${hexagonTopOffset + 100 + classicalHandles.length * 30 + i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ))}

              </div>


            </div>
          </div>
          <div
            className="absolute"
            style={{
              top: "0",
              bottom: "0",
              right: "150px",
              width: "2px",
              backgroundColor: "#000",
              zIndex: 9,
            }}
          >
            {classicalOutputHandles.map((index, i) => {
              const handleId = `classicalHandleDynamicOutput${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(isConnected)

              return (
                <Handle
                  key={handleId}
                  type="target"
                  id={handleId}
                  position={Position.Left}
                  className={cn(
                    "z-10 classical-circle-port-out",
                    isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `${100 + i * 30}px`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px",
                  }}
                  isConnectable={true}
                />
              );
            })}

            {quantumOutputHandles.map((index, i) => {
              const handleId = `quantumHandleDynamicOutput${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(isConnected)

              return (
                <Handle
                  key={handleId}
                  type="target"
                  id={handleId}
                  position={Position.Left}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `${100 + classicalOutputHandles.length * 30 + i * 30}px`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px",
                  }}
                  isConnectable={true}
                />
              );
            })}

            {classicalOutputHandlesElse.map((index, i) => {
              const handleId = `classicalHandleDynamicOutputElse${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(isConnected)

              return (
                <Handle
                  key={handleId}
                  type="target"
                  id={handleId}
                  position={Position.Left}
                  className={cn(
                    "z-10 classical-circle-port-out",
                    isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `calc(70% + ${30 + i * 30}px)`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px",
                  }}
                  isConnectable={true}
                />
              );
            })}

            {quantumOutputHandlesElse.map((index, i) => {
              const handleId = `quantumHandleDynamicOutputElse${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(isConnected)

              return (
                <Handle
                  key={handleId}
                  type="target"
                  id={handleId}
                  position={Position.Left}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `calc(70% + ${30 * (classicalOutputHandlesElse.length + 1 + i)}px)`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px",
                  }}
                  isConnectable={true}
                />
              );
            })}

          </div>

          {/* Repeat End (right polygon) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div
                className="hexagon-right"
                style={{
                  position: "absolute",
                  width: "250px",
                  height: `${hexagonHeight}px`,
                  backgroundColor: "white",
                  top: `${hexagonTopOffset}px`,
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
              >
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">End If</span>
                </div>
              </div>

              {/* Handles on right polygon */}
              {classicalOutputHandles.map((index, i) => {
                const handleId = `classicalHandleDynamicOutput${node.id}-${index}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                return isConnected ? (
                  <Handle
                    key={handleId}
                    type="source"
                    id={`classicalHandleOutputFinal-${index}`}
                    position={Position.Right}
                    className="absolute z-10 classical-circle-port-hex-out !bg-orange-300 !border-black"
                    style={{ top: `${i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ) : null;
              })}

              {classicalOutputHandlesElse.map((index, i) => {
                const handleId = `classicalHandleDynamicOutputElse${node.id}-${index}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                return isConnected ? (
                  <Handle
                    key={handleId}
                    type="source"
                    id={`classicalHandleOutputElseFinal-${index}`}
                    position={Position.Right}
                    className="absolute z-10 classical-circle-port-hex-out !bg-orange-300 !border-black"
                    style={{ top: `${100 + i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ) : null;
              })}

              {quantumOutputHandles.map((index, i) => {
                const handleId = `quantumHandleDynamicOutput${node.id}-${index}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                return isConnected ? (
                  <Handle
                    key={handleId}
                    type="source"
                    id={`quantumHandleOutputFinal-${index}`}
                    position={Position.Right}
                    className="absolute z-10 circle-port-hex-out !bg-blue-300 !border-black"
                    style={{ top: `${160 + i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ) : null;
              })}

              {quantumOutputHandlesElse.map((index, i) => {
                const handleId = `quantumHandleDynamicOutputElse${node.id}-${index}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                return isConnected ? (
                  <Handle
                    key={handleId}
                    type="source"
                    id={`quantumHandleOutputElseFinal-${index}`}
                    position={Position.Right}
                    className="absolute z-10 circle-port-hex-out !bg-blue-300 !border-black"
                    style={{ top: `${220 + i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ) : null;
              })}

            </div>
          </div>
        </div>
      </div>
      <NodeResizer minWidth={700} minHeight={500} />
    </div>
  );
});
