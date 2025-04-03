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

  return (
    <div
      className="grand-parent overflow-visible"
      style={{ overflow: "visible", minWidth: "700px", height: "500px", position: "relative" }}
    >
      <div className="rounded-none bg-white border border-solid border-gray-700 shadow-md relative w-full h-full relative flex items-center justify-center overflow-visible" style={{ overflow: "visible" }}>
        <div className="rounded-md bg-white border border-solid border-gray-700 shadow-md w-full h-full flex flex-col items-center relative z-10 overflow-visible" style={{ overflow: "visible" }}>
          <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
            <span className="text-sm">{node.data.label}</span>
          </div>

          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center">

            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div
                className="hexagon-left"
                style={{
                  position: "absolute",
                  left: "-50px",
                  width: "250px",
                  height: "200px",
                  backgroundColor: "white",
                  top: "-70px",
                  //clipPath: "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)",
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
              >
              
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">Repeat Start</span>
                </div>

                <span className="text-sm block mt-3">Number:</span>
                <Input
                  size="small"
                  placeholder="Enter Number"
                  className="mt-1 w-[80%] text-center"
                  style={{ fontSize: "12px", height: "22px" }}
                  value={node.data.number || ""}
                  onChange={(e) => updateNodeValue(node.id, "number", e.target.value)}
                />
              </div>
              <div style={{ position: "absolute", left: "-75px", overflow: "visible" }}>

                <Handle
                  type="target"
                  id="classicalHandleInitialization"
                  position={Position.Left}
                  className="absolute z-10 classical-circle-port-hex-in !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                <Handle
                  type="target"
                  id="quantumHandleInitialization"
                  position={Position.Left}
                  className="z-10 circle-port-hex-in !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                {edges.map((edge, i) => (
                  <Handle
                    id={edge.targetHandle}
                    key={edge.id + edge.targetHandle}
                    type="target"
                    position={Position.Left}
                    style={{ top: i * 20, background: "#555" }}
                    isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                  />
                ))}

              </div>
              <div style={{ position: "absolute", left: "174px", overflow: "visible" }}>

                <Handle
                  type="target"
                  id="classicalHandleInitialization"
                  position={Position.Left}
                  className="absolute z-10 classical-circle-port-hex-in !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                <Handle
                  type="target"
                  id="quantumHandleInitialization"
                  position={Position.Left}
                  className="z-10 circle-port-hex-in !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                {edges.map((edge, i) => (
                  <Handle
                    id={edge.targetHandle}
                    key={edge.id + edge.targetHandle}
                    type="target"
                    position={Position.Left}
                    style={{ top: i * 20, background: "#555" }}
                    isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                  />
                ))}

              </div>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center">

            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div
                className="hexagon-right"
                style={{
                  position: "absolute",

                  width: "250px",
                  height: "200px",
                  backgroundColor: "white",
                  top: "-70px",
                  //clipPath: "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)",
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
              >
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">Repeat End</span>
                </div>
                

              </div>
              <div style={{ position: "absolute", right: "0px", overflow: "visible" }}>

                <Handle
                  type="target"
                  id="classicalHandleOutputInitialization"
                  position={Position.Right}
                  className="absolute z-10 classical-circle-port-hex-out !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                <Handle
                  type="target"
                  id="quantumHandleOutputInitialization"
                  position={Position.Right}
                  className="z-10 circle-port-hex-out !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                {edges.map((edge, i) => (
                  <Handle
                    id={edge.targetHandle}
                    key={edge.id + edge.targetHandle}
                    type="target"
                    position={Position.Right}
                    style={{ top: i * 20, background: "#555" }}
                    isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                  />
                ))}

              </div>
              <div style={{ position: "absolute", right: "249px", overflow: "visible" }}>

                <Handle
                  type="target"
                  id="classicalHandleOutputInitialization"
                  position={Position.Right}
                  className="absolute z-10 classical-circle-port-hex-out !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                <Handle
                  type="target"
                  id="quantumHandleOutputInitialization"
                  position={Position.Right}
                  className="z-10 circle-port-hex-out !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />

                {edges.map((edge, i) => (
                  <Handle
                    id={edge.targetHandle}
                    key={edge.id + edge.targetHandle}
                    type="target"
                    position={Position.Right}
                    style={{ top: i * 20, background: "#555" }}
                    isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                  />
                ))}

              </div>
            </div>
          </div>
        </div>
      </div>

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
  );
});