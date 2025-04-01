import { memo, useState, useRef } from "react";
import { Handle, Position, Node, useUpdateNodeInternals, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const GateNode = memo((node: Node) => {
  const { data } = node;
  const isQubit = data.label === "Qubit"
  const isTwoQubit = data.label === "CNOT";
  const isThreeQubit = data.label === "Toffoli";
  const { edges } = useStore(selector, shallow);

  return (
    <div className="grand-parent">
      <div className="w-[120px] h-[120px] rounded-none bg-white overflow-hidden border border-solid border-gray-700 shadow-md">
        <div className="w-full bg-blue-300 text-black text-center font-semibold py-1 truncate">
          Gate
        </div>
        <div className="px-2 py-3 flex justify-center">
          <div className="flex items-center">
            {!isTwoQubit && !isThreeQubit && !isQubit && (
              <Handle
                type="target"
                id={`quantumHandleGateInput1${node.id}`}
                position={Position.Left}
                className="!absolute !top-[65%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                isValidConnection={(connection) => true}

              />
            )}

            {isTwoQubit && (
              <>
                <Handle
                  type="target"
                  id={`quantumHandleGateInput1${node.id}`}
                  position={Position.Left}
                  className=" !top-[55%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
                <Handle
                  type="target"
                  id={`quantumHandleGateInput2${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[75%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
              </>
            )}
            {isThreeQubit && (
              <>
                <Handle
                  type="target"
                  id={`quantumHandleGateInput1${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[45%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
                <Handle
                  type="target"
                  id={`quantumHandleGateInput2${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[65%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
                <Handle
                  type="target"
                  id={`quantumHandleGateInput3${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[85%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
              </>
            )}


            <div className="absolute top-[65%] -translate-x-1/2 -translate-y-1/2 text-center">
              {data.label === "Qubit" ? "|0>" : data.label}
            </div>


            {!isTwoQubit && !isThreeQubit && (
              <Handle
                type="source"
                id={`quantumHandleGateOutput1${node.id}`}
                position={Position.Right}
                className="!absolute !top-[65%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                isValidConnection={(connection) => true}
                isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
              />
            )}
            {isTwoQubit && (
              <>
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput1${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[55%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput2${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[75%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
              </>
            )}
            {isThreeQubit && (
              <>
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput1${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[45%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput2${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[65%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput3${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[85%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
