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
  const [classicalHandles, setClassicalHandles] = useState([0]);
  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);
  const [quantumOutputHandlesElse, setQuantumOutputHandlesElse] = useState([0]);
  const [classicalOutputHandles, setClassicalOutputHandles] = useState([0]);
  const [classicalOutputHandlesElse, setClassicalOutputHandlesElse] = useState([0]);

  useEffect(() => {
    // [Handle update logic remains unchanged]
  }, [
    edges,
    node.id,
    classicalHandles,
    quantumHandles,
    classicalOutputHandles,
    quantumOutputHandles,
    quantumOutputHandlesElse,
    classicalOutputHandlesElse
  ]);

  const dynamicHeight = 500 + Math.max(0, quantumHandles.length - 1 + (classicalHandles.length - 1)) * 30;
  const totalHandles = Math.max(classicalHandles.length + quantumHandles.length, 0);
  const hexagonHeight = Math.max(250, 180 + totalHandles * 30);
  const hexagonTopOffset = -(hexagonHeight / 2) + 20;

  return (
    <div className="grand-parent overflow-visible"
         style={{ minWidth: "1100px", height: `${dynamicHeight}px`, position: "relative" }}>
      <div className="rounded-none border border-solid border-gray-700 shadow-md w-full h-full flex items-center justify-center relative overflow-visible">
        <div className="rounded-md border border-solid border-gray-700 shadow-md w-full h-full flex flex-col items-center relative z-10 overflow-visible">
          <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
            <span className="text-sm">Repeat</span>
          </div>

          {/* Repeat Start (Left Side) */}
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
              <div className="hexagon-left" style={{
                position: "absolute",
                left: "-50px",
                width: "250px",
                height: `${hexagonHeight}px`,
                backgroundColor: "white",
                top: `${hexagonTopOffset}px`,
                clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)"
              }}>
                <div className="w-full flex items-center" style={{ height: '52px' }}>
                  <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
                    <img src="repeatIcon.png" alt="icon" className="w-[60px] h-[60px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
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
                      style={{ top: `${hexagonTopOffset + 100 + classicalHandles.length * 30 + i * 30}px`, overflow: "visible" }}
                      isConnectable={true}
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
              <div className="hexagon-right" style={{
                position: "absolute",
                width: "250px",
                height: `${hexagonHeight}px`,
                backgroundColor: "white",
                top: `${hexagonTopOffset}px`,
                clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)"
              }}>
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">Repeat End</span>
                </div>
              </div>

              {/* Handles - Right */}
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
            </div>
          </div>

          {/* Button to Toggle Children */}
          <Button
            onClick={() => setShowingChildren(!showingChildren)}
            icon={showingChildren ? "-" : "+"}
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
          <NodeResizer minWidth={700} minHeight={500} />
        </div>
      </div>
    </div>
  );
});
