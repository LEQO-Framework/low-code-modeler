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
      style={{ overflow: "visible", minWidth: "1100px", height: "500px", position: "relative" }}

    >
      <div
        className="absolute"
        style={{
          top: "0",
          bottom: "0",
          left: "150px",
          width: "2px",
          backgroundColor: "#000",
          zIndex: 9,
        }}
      >
        <Handle
          type="target"
          id={`sideLineHandle-${node.id}`}
          position={Position.Left}
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#00f",
            border: "2px solid black",
          }}
          isConnectable={true}
        />
         <Handle
          type="target"
          id={`sideLineHandle-${node.id}`}
          position={Position.Left}
          style={{
            position: "absolute",
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#00f",
            border: "2px solid black",
          }}
          isConnectable={true}
        />
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
        <Handle
          type="target"
          id={`sideLine2Handle-${node.id}`}
          position={Position.Left}
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#00f",
            border: "2px solid black",
          }}
          isConnectable={true}
        />
        <Handle
          type="target"
          id={`sideLine2Handle-${node.id}`}
          position={Position.Left}
          style={{
            position: "absolute",
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#00f",
            border: "2px solid black",
          }}
          isConnectable={true}
        />
      </div>
      
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

          {/* Repeat Start (left polygon) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
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
                <Handle
                  type="target"
                  id={`classicalHandleInputInitialization${node.id}`}
                  position={Position.Left}
                  className="absolute z-10 classical-circle-port-hex-in !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
                <Handle
                  type="target"
                  id={`quantumHandleInputInitialization${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-hex-in !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
              </div>

              {/* Right side of Repeat Start */}
              <div style={{ position: "absolute", left: "174px", overflow: "visible" }}>
                <Handle
                  type="source"
                  id="classicalHandleInitialization"
                  position={Position.Right}
                  className="absolute z-10 classical-circle-port-hex-in !bg-orange-300 !border-black"
                  style={{ top: "40px", overflow: "visible" }}
                  isConnectable={true}
                />
                <Handle
                  type="source"
                  id="quantumHandleInitialization"
                  position={Position.Right}
                  className="z-10 circle-port-hex-in !bg-blue-300 !border-black"
                  style={{ top: "70px", overflow: "visible" }}
                  isConnectable={edges.filter((edge) => edge.target === node.id).length < 2}
                />
              </div>
            </div>
          </div>

          {/* Repeat End (right polygon) */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 overflow-visible text-center" style={{ zIndex: 30 }}>
            <div style={{ position: "relative", width: "225px", overflow: "visible" }}>
              <div
                className="hexagon-right"
                style={{
                  position: "absolute",
                  width: "250px",
                  height: "200px",
                  backgroundColor: "white",
                  top: "-70px",
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
              >
                <div className="w-full bg-purple-300 text-black text-center font-semibold py-1">
                  <span className="text-sm block font-bold">End If</span>
                </div>
              </div>

              {/* Handles on right polygon */}
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
              </div>

              {/* Optional second right port */}
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <NodeResizer minWidth={700} minHeight={500} />
    </div>
  );
});
