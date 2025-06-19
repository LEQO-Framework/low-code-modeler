import { memo, useState, useEffect } from "react";
import { Handle, Position, Node, Edge, useUpdateNodeInternals, NodeResizer } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { Input } from "antd";
import { cn } from "@/lib/utils";
import { Button } from "antd";


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
  const { nodes, setNodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();
  const [quantumHandles, setQuantumHandles] = useState([0]);
  const [classicalHandles, setClassicalHandles] = useState([0]);

  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);
  const [quantumOutputHandlesElse, setQuantumOutputHandlesElse] = useState([0]);
  const [classicalOutputHandles, setClassicalOutputHandles] = useState([{ index: 0, branch: "then" }]);

  const [classicalOutputHandlesElse, setClassicalOutputHandlesElse] = useState([0]);
  const [collapsed, setColllapsed] = useState(false);

  const collapseParent = () => {
    setColllapsed(!collapsed);
    updateNodeValue(node.id, "collapsed", collapsed);
    console.log("collap")
    // Get the main node
    let mainNodes = document.querySelectorAll<HTMLDivElement>(
      'div.react-flow__node-ifElseNode'
    );
    let keys = mainNodes.keys();

    // extract key and see if it matches data-id this is then the mainNode
    let mainNode: HTMLDivElement | undefined;
    mainNodes.forEach((nodeElement) => {
      const dataId = nodeElement.getAttribute('data-id');
      console.log('Checking node with data-id:', dataId);
      if (dataId === node.id) {   // assuming node.id is available in scope
        mainNode = nodeElement;
      }
    });

    console.log('Main node:', mainNode);
    if (mainNode) {
      // Get the first child div (grand-parent where you set width)
      const firstChild = mainNode.querySelector<HTMLDivElement>(
        'div.grand-parent'
      );

      console.log('Main node:', mainNode);

      console.log('First child (grand-parent):', firstChild);
      if (firstChild) {
        for (let i = 0; i < nodes.length; i++) {
          console.log(node.data)
          console.log(nodes[i]);
          if (nodes[i].parentNode === node.id && node.data.collapsed === "true") {
            updateNodeValue(nodes[i].id, "hidden", "true");
          } else if (nodes[i].parentNode === node.id && node.data.collapsed === "false") {
            updateNodeValue(nodes[i].id, "hidden", "false");
          }
        }

        // Get the current minWidth from computed styles
        const currentMinWidth = window.getComputedStyle(firstChild).minWidth;
        // Parse it into a number
        const currentMinWidthValue = parseFloat(currentMinWidth);
        // Add 100 to it
        const newMinWidth = 400;
        // Set it back with "px"
        firstChild.style.minWidth = `${newMinWidth}px`;
        firstChild.style.height = `${newMinWidth}px`;
        console.log(`Updated minWidth to ${newMinWidth}px`);
        updateNodeValue(node.id, "collapsed", collapsed);
      }
    } else {
      console.error('Main node not found');
    }

  }


  useEffect(() => {
    const connectedQuantumHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const connectedClassicalHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const expectedHandles = quantumHandles.map(index => `quantumHandleInputInitialization${index}${node.id}`);
    const lastHandle = expectedHandles[expectedHandles.length - 1];

    const expectedClassicalHandles = classicalHandles.map(index => `classicalHandleInputInitialization${index}${node.id}`);
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

    const quantumExpected = quantumOutputHandles.map(index => `quantumHandleDynamicOutput${index}${node.id}`);
    const lastQuantumHandleId = quantumExpected[quantumExpected.length - 1];

    if (connectedQuantumOutputHandles.includes(lastQuantumHandleId)) {
      setQuantumOutputHandles(prev => [...prev, prev.length]);
    }

    const connectedOutputHandlesQuantumElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesQuantumElse)

    const expectedQuantumElse = quantumOutputHandlesElse.map(index => `quantumHandleDynamicOutputElse${index}${node.id}`);
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





  return !collapsed ? (
    <div
      className="grand-parent overflow-visible"
      style={{ overflow: "visible", minWidth: "1100px", height: `${dynamicHeight}px`, position: "relative" }}
    >
      <div
        className="absolute z-20 text-black text-center font-semibold bg-purple-300 py-1 rounded"
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

      <div className="rounded-none border border-solid border-gray-700 relative w-full h-full relative flex items-center justify-center overflow-visible">
        <div className="rounded-md border border-solid border-gray-700 w-full h-full flex flex-col items-center relative z-10 overflow-visible">
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
              const handleId = `classicalHandleInputInitialization${index}${node.id}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);

              return (
                isConnected && (
                  <Handle
                    key={`classical-${index}`}
                    type="source"
                    id={`sideClassicalHandleThen${index}${node.id}`}
                    position={Position.Right}
                    className={cn(
                      "z-10 classical-circle-port-out",
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200  !border-black"
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
              const handleId = `quantumHandleInputInitialization${index}${node.id}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);

              return (isConnected &&
                <Handle
                  key={`quantum-${index}`}
                  type="source"
                  id={`sideQuantumHandleThen${index}${node.id}`}
                  position={Position.Right}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
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
              const handleId = `classicalHandleInputInitialization${handle}${node.id}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              return (isConnected &&
                <Handle
                  key={`side-classical-${handle}`}
                  type="source"
                  id={`sideClassicalHandleElse${handle}${node.id}`}
                  position={Position.Right}
                  className={cn(
                    "z-10 classical-circle-port-hex-out",
                    isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200  !border-black"
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
              const handleId = `quantumHandleInputInitialization${index}${node.id}`;
              const isConnected = edges.some(edge => edge.targetHandle === handleId);
              console.log(edges)

              return (isConnected &&
                <Handle
                  key={`side-quantum-${index}`}
                  type="source"
                  id={`sideQuantumHandleElse${index}${node.id}`}
                  position={Position.Right}
                  className={cn(
                    "z-10 circle-port-out",
                    isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
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

          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", overflow: "visible" }}>
              {/* Feiner schwarzer Rand */}
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
                    <img src="ifelseIcon.png" alt="icon" className="w-[60px] h-[60px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
                    <div className="h-full w-[1px] bg-black mx-2" />
                    <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>If</span>
                  </div>
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
                  const handleId = `classicalHandleInputInitialization${index}${node.id}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);

                  return (
                    <Handle
                      key={`classical-${index}`}
                      type="target"
                      id={handleId} // check if this makes problem
                      position={Position.Left}
                      className={cn(
                        "z-10 classical-circle-port-hex-in",
                        isConnected ? "!bg-orange-300 !border-black" : "!bg-orange-300  !border-black"
                      )}
                      style={{
                        top: `${hexagonTopOffset + 70 + i * 30}px`,
                        overflow: "visible",
                        zIndex: 3000,
                        left: "-6px"
                      }}
                      isConnectable={true}
                      isConnectableStart={false}
                    />
                  );
                })}

                {quantumHandles.map((index, i) => {
                  const handleId = `quantumHandleInputInitialization${index}${node.id}`;
                  const isConnected = edges.some(edge => edge.targetHandle === handleId);

                  return (
                    <Handle
                      key={`quantum-${index}`}
                      type="target"
                      id={handleId}
                      position={Position.Left}
                      className={cn(
                        "z-10 circle-port-hex-in",
                        isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                      )}

                      style={{
                        top: `${hexagonTopOffset + 100 + classicalHandles.length * 30 + i * 30}px`,
                        overflow: "visible",
                      }}
                      isConnectable={true}
                      isConnectableStart={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          {!collapsed && (
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
                const handleId = `classicalHandleInputInitialization${index}${node.id}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                return (
                  isConnected && (
                    <Handle
                      key={`classicalHandleDynamicOutput${index}${node.id}`}
                      type="target"
                      id={`classicalHandleDynamicOutput${index}${node.id}`}
                      position={Position.Left}
                      className={cn(
                        "z-10 classical-circle-port-out",
                        isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-black"
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
                let handleId = `quantumHandleInputInitialization${index}${node.id}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);
                handleId = `quantumHandleDynamicOutput${index}${node.id}`;

                console.log(isConnected)

                return (isConnected &&
                  <Handle
                    key={handleId}
                    type="target"
                    id={handleId}
                    position={Position.Left}
                    className={cn(
                      "z-10 circle-port-out",
                      isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
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
                let handleId = `classicalHandleInputInitialization${index}${node.id}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);
                handleId = `classicalHandleDynamicOutputElse${index}${node.id}`;


                return (isConnected &&
                  <Handle
                    key={handleId}
                    type="target"
                    id={handleId}
                    position={Position.Left}
                    className={cn(
                      "z-10 classical-circle-port-out",
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200  !border-black"
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
                let handleId = `quantumHandleInputInitialization${index}${node.id}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);
                handleId = `quantumHandleDynamicOutputElse${index}${node.id}`;
                console.log(isConnected)
                return (isConnected &&
                  <Handle
                    key={handleId}
                    type="target"
                    id={handleId}
                    position={Position.Left}
                    className={cn(
                      "z-10 circle-port-out",
                      isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
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
          )}

          {/* Repeat End (right polygon) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>

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
              >
                <div className="w-full flex items-center" style={{ height: '52px' }}>
                  <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
                    <img src="ifelseIcon.png" alt="icon" className="w-[65px] h-[65px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
                    <div className="h-full w-[1px] bg-black mx-2" />
                    <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>End If</span>
                  </div>
                </div>
              </div>



              {classicalOutputHandles.map(({ index, branch }, i) => {
                console.log(classicalOutputHandles)
                console.log(classicalOutputHandles[i])
                console.log(index)

                const handleId = `classicalHandleDynamicOutput${index}${node.id}`;
                const isConnected = edges.some(edge => edge.targetHandle === handleId);

                const elseHandleId = `classicalHandleDynamicOutputElse${index}${node.id}`;
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
                      isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                    )}
                    style={{ top: `${i * 30}px`, overflow: "visible" }}
                    isConnectable={true}
                  />
                ) : null;
              })}

              {quantumOutputHandles.map((index, i) => {
                const handleId = `quantumHandleDynamicOutput${index}${node.id}`;
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
                const handleId = `quantumHandleDynamicOutputElse${index}${node.id}`;
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
      <Button
        onClick={() => { collapseParent(); }}
        icon={collapsed ? "-" : "+"}
        style={{
          position: "absolute",
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          border: "1px solid black",
          borderRadius: 0,
          zIndex: 30,
        }}
      />
    </div>
  ) : (
    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
      <div style={{ position: "relative", width: "225px", overflow: "visible" }}>

        <div
          className="hexagon-left"
          style={{
            position: "absolute",
            left: "-50px",
            width: "250px",
            height: `${hexagonHeight}px`,
            backgroundColor: "black",
            top: `${hexagonTopOffset}px`,
            clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
          }}
        ></div>
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
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img src="ifelseIcon.png" alt="icon" className="w-[65px] h-[65px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>If</span>
            </div>
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
          <Button
            onClick={() => { collapseParent(); setColllapsed(!collapsed) }}
            icon={collapsed ? "-" : "+"}
            style={{
              position: "absolute",
              bottom: "0px",
              left: "50%",
              transform: "translateX(-50%)",
              border: "1px solid black",
              borderRadius: 0,
              zIndex: 30,
            }}
          />
        </div>

        <div style={{ position: "absolute", left: "-75px", overflow: "visible" }}>

          {classicalHandles.map((index, i) => {
            const handleId = `classicalHandleInputInitialization${index}${node.id}`;
            const isConnected = edges.some(edge => edge.targetHandle === handleId);

            return (
              <Handle
                key={`classical-${index}`}
                type="target"
                id={handleId} // check if this makes problem
                position={Position.Left}
                className={cn(
                  "z-10 classical-circle-port-hex-in",
                  isConnected ? "!bg-orange-300 !border-black" : "!bg-orange-300  !border-black"
                )}
                style={{
                  top: `${hexagonTopOffset + 70 + i * 30}px`,
                  overflow: "visible",
                  zIndex: 3000,
                  left: "-6px"
                }}
                isConnectable={true}
                isConnectableStart={false}
              />
            );
          })}

          {quantumHandles.map((index, i) => {
            const handleId = `quantumHandleInputInitialization${index}${node.id}`;
            const isConnected = edges.some(edge => edge.targetHandle === handleId);

            return (
              <Handle
                key={`quantum-${index}`}
                type="target"
                id={handleId}
                position={Position.Left}
                className={cn(
                  "z-10 circle-port-hex-in",
                  isConnected ? "!bg-blue-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                )}

                style={{
                  top: `${hexagonTopOffset + 100 + classicalHandles.length * 30 + i * 30}px`,
                  overflow: "visible",
                }}
                isConnectable={true}
                isConnectableStart={false}
              />
            );
          })}
          {classicalOutputHandles.map(({ index, branch }, i) => {
            console.log(classicalOutputHandles)
            console.log(classicalOutputHandles[i])
            console.log(index)

            const handleId = `classicalHandleDynamicOutput${index}${node.id}`;
            const isConnected = edges.some(edge => edge.targetHandle === handleId);

            const elseHandleId = `classicalHandleDynamicOutputElse${index}${node.id}`;
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
                  isConnected ? "!bg-orange-300 !border-black" : "!bg-gray-200 !border-dashed !border-black"
                )}
                style={{ top: `${i * 30}px`, overflow: "visible" }}
                isConnectable={true}
              />
            ) : null;
          })}

          {quantumOutputHandles.map((index, i) => {
            const handleId = `quantumHandleDynamicOutput${index}${node.id}`;
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
            const handleId = `quantumHandleDynamicOutputElse${index}${node.id}`;
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
  );

});
