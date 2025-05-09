import { memo, useState, useEffect } from "react";
import { Handle, Position, Node, Edge, useUpdateNodeInternals, NodeResizer } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { Input } from "antd";
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

export const IfElseNode = memo((node: Node) => {
  const { setNodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();
  const [quantumHandles, setQuantumHandles] = useState([0]);
  const [classicalHandles, setClassicalHandles] = useState([0]);

  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);
  const [quantumOutputHandlesElse, setQuantumOutputHandlesElse] = useState([0]);
  const [classicalOutputHandles, setClassicalOutputHandles] = useState([{ index: 0, branch: "then" }]);

  const [classicalOutputHandlesElse, setClassicalOutputHandlesElse] = useState([0]);


  useEffect(() => {
    const connectedQuantumHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const connectedClassicalHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const expectedHandles = quantumHandles.map(index => `quantumHandleInputInitialization${node.id}-${index}`);
    const lastHandle = expectedHandles[expectedHandles.length - 1];
    
    const expectedClassicalHandles = classicalHandles.map(index => `classicalHandleInputInitialization${node.id}-${index}`);
    const lastClassicalHandle = expectedClassicalHandles[expectedClassicalHandles.length - 1];

    if (connectedQuantumHandles.includes(lastHandle)) {
      setQuantumHandles(prev => [...prev, prev.length]);
    }
    console.log(classicalHandles)
    console.log(connectedClassicalHandles)
    console.log(lastClassicalHandle)

    if (connectedClassicalHandles.includes(lastClassicalHandle)) {
      setClassicalHandles(prev => [...prev, prev.length]);
      console.log(classicalHandles)
    } else {
      console.log(connectedClassicalHandles)
      const expectedClassicalIndices = connectedClassicalHandles.map(handleId => {
        const parts = handleId.split("-");
        return parseInt(parts[parts.length - 1], 10);
      });
      const nextClassicalIndex = Math.max(...expectedClassicalIndices, -1) + 1;
      console.log(expectedClassicalIndices)
      setClassicalHandles([...expectedClassicalIndices, nextClassicalIndex]);

    }
    const connectedOutputHandles = edges
      .filter(edge => edge.target === node.id && (edge.targetHandle?.startsWith(`classicalHandleDynamicOutput${node.id}`) || edge.targetHandle?.startsWith(`classicalHandleDynamicOutputElse${node.id}`)))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandles)

    const expected = classicalOutputHandles.map(({ index, branch }) => {
      console.log(index);
      return `classicalHandleDynamicOutput${branch === "else" ? "Else" : ""}${node.id}-${index}`
    }
    );
    const lastHandleId = expected[expected.length - 1];

    // Extract last branch from the last handleId
    const lastBranch = lastHandleId.includes("Else") ? "else" : "then";

    if (connectedOutputHandles.includes(lastHandleId)) {
      const nextIndex = classicalOutputHandles.length;
      setClassicalOutputHandles(prev => [...prev, { index: nextIndex, branch: lastBranch }]);
    }

    const connectedOutputHandlesElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesElse)

    const expectedElse = connectedClassicalHandles.map(index => `classicalHandleDynamicOutputElse${node.id}-${index}`);
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

    updateNodeInternals(node.id); // `nodeId` is the ID of the updated node
  }, [edges, node.id, quantumHandles, classicalOutputHandles, quantumOutputHandles, quantumOutputHandlesElse, classicalOutputHandlesElse]);

  const dynamicHeight = 900 + Math.max(0, quantumHandles.length - 1 + (classicalHandles.length - 1)) * 30;
  const totalHandles = Math.max(classicalHandles.length + quantumHandles.length, classicalOutputHandles.length + classicalOutputHandlesElse.length + quantumOutputHandles.length + quantumOutputHandlesElse.length);
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
        Else
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

            {classicalHandles.map((index, i) => {
              console.log(classicalHandles)
              const handleId = `classicalHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);

              return (
                isConnected && (
                  <Handle
                    key={`classical-${index}`}
                    type="source"
                    id={`sideClassicalHandleThen-${node.id}-${index}`}
                    position={Position.Right}
                    className={cn(
                      "z-10 classical-circle-port-out",
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                    )}
                    style={{
                      top: `${100 + i * 30}px`,
                      overflow: "visible",
                      zIndex: 3000,
                      left: "-6px"
                    }}
                    isConnectable={true}
                  />
                )
              );

            })}

            {quantumHandles.map((index, i) => {
              const handleId = `quantumHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);

              return (isConnected &&
                <Handle
                  key={`quantum-${index}`}
                  type="source"
                  id={`sideQuantumHandleThen-${node.id}-${index}`} // check if this makes problem
                  position={Position.Right}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `${100 + classicalHandles.length * 30 + i * 30}px`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px"
                  }}
                  isConnectable={true}
                />
              );
            })}

            {classicalHandles.map((handle, i) => {
              const handleId = `classicalHandleInputInitialization${node.id}-${handle}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              return (isConnected &&
                <Handle
                  key={`side-classical-${handle}`}
                  type="source"
                  id={`sideClassicalHandleElse-${node.id}-${handle}`}
                  position={Position.Right}
                  className={cn(
                    "z-10 classical-circle-port-hex-out",
                    isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `calc(70% + ${30 + i * 30}px)`,
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    position: "absolute",
                    zIndex: 3000,
                  }}
                  isConnectable={true}
                />
              );
            })}

            {quantumHandles.map((index, i) => {
              const handleId = `quantumHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(edges)

              return (isConnected &&
                <Handle
                  key={`side-quantum-${index}`}
                  type="source"
                  id={`sideQuantumHandleElse-${node.id}-${index}`}
                  position={Position.Right}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                  )}
                  style={{
                    top: `calc(70% + ${30 * (classicalHandles.length + 1 + i)}px)`,
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    position: "absolute",
                    zIndex: 3000,
                  }}
                  isConnectable={true}
                />
              );
            })}

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

                {classicalHandles.map((index, i) => {
                  const handleId = `classicalHandleInputInitialization${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);

                  return (
                    <Handle
                      key={`classical-${index}`}
                      type="source"
                      id={handleId} // check if this makes problem
                      position={Position.Left}
                      className={cn(
                        "z-10 classical-circle-port-hex-in",
                        isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                      )}
                      style={{
                        top: `${hexagonTopOffset + 70 + i * 30}px`,
                        overflow: "visible",
                        zIndex: 3000,
                        left: "-6px"
                      }}
                      isConnectable={true}
                    />
                  );
                })}

                {quantumHandles.map((index, i) => {
                  const handleId = `quantumHandleInputInitialization${node.id}-${index}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);

                  return (
                    <Handle
                      key={`quantum-${index}`}
                      type="target"
                      id={handleId}
                      position={Position.Left}
                      className={cn(
                        "z-10 circle-port-hex-in",
                        isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                      )}

                      style={{
                        top: `${hexagonTopOffset + 100 + classicalHandles.length * 30 + i * 30}px`,
                        overflow: "visible",
                      }}
                      isConnectable={true}
                    />
                  );
                })}
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
            {classicalHandles.map((index, i) => {
              console.log(classicalHandles)
              const handleId = `classicalHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);

              return (
                isConnected && (
                  <Handle
                    key={`classicalHandleDynamicOutput${node.id}-${index}`}
                    type="target"
                    id={`classicalHandleDynamicOutput${node.id}-${index}`}
                    position={Position.Left}
                    className={cn(
                      "z-10 classical-circle-port-out",
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                    )}
                    style={{
                      top: `${100 + i * 30}px`,
                      overflow: "visible",
                      zIndex: 3000,
                      left: "-6px"
                    }}
                    isConnectable={true}
                  />
                )
              );
            })}
            

            {quantumHandles.map((index, i) => {
              let handleId = `quantumHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              handleId = `quantumHandleDynamicOutput${node.id}-${index}`;

              console.log(isConnected)

              return (isConnected &&
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
                    top: `${100 + classicalHandles.length * 30 + i * 30}px`,
                    overflow: "visible",
                    zIndex: 3000,
                    left: "-6px",
                  }}
                  isConnectable={true}
                />
              );
            })}

          

            {classicalHandles.map((index, i) => {
              let handleId = `classicalHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              handleId = `classicalHandleDynamicOutputElse${node.id}-${index}`;


              return (isConnected &&
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


            {quantumHandles.map((index, i) => {
              let handleId = `quantumHandleInputInitialization${node.id}-${index}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              handleId = `quantumHandleDynamicOutputElse${node.id}-${index}`;
              console.log(isConnected)
              return (isConnected &&
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
                    top: `calc(70% + ${30 * (classicalHandles.length + 1 + i)}px)`,
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
              {classicalOutputHandles.map(({ index, branch }, i) => {
                console.log(classicalOutputHandles)
                console.log(classicalOutputHandles[i])
                console.log(index)

                const handleId = `classicalHandleDynamicOutput${node.id}-${index}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                const elseHandleId = `classicalHandleDynamicOutputElse${node.id}-${index}`;
                const isElseConnected = edges.some(edge => edge.targetHandle === elseHandleId);
                const actualHandleId = isElseConnected ? elseHandleId : handleId;
                console.log(actualHandleId)


                return (isConnected || isElseConnected) ? (
                  <Handle
                    key={actualHandleId}
                    type="source"
                    id={`classicalHandleOutputFinal-${index}`}
                    position={Position.Right}
                    className={cn(
                      "absolute z-10 classical-circle-port-hex-out",
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-gray-500"
                    )}
                    style={{ top: `${i * 30}px`, overflow: "visible" }}
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
