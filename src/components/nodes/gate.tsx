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
      <div className="w-[100px] h-[100px] rounded-none overflow-hidden border border-solid border-gray-700 shadow-md bg-blue-100">
        <div className="px-2 py-3 flex justify-center bg-blue-100">
          <div className="flex items-center bg-blue-100">
            {!isTwoQubit && !isThreeQubit && !isQubit && (
              <Handle
                type="target"
                id={`quantumHandleGateInput1${node.id}`}
                position={Position.Left}
                className="!absolute !top-[50%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                isValidConnection={(connection) => true}

              />
            )}

            {isTwoQubit && (
              <>
                <div className="flex flex-col items-start text-black text-center overflow-visible">
                  <div className="flex items-center space-x-2 mt-2">
                    <Handle
                      type="target"
                      id={`quantumHandleGateInput1${node.id}`}
                      position={Position.Left}
                      className="!top-[25%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                      isValidConnection={() => true}
                    />

                  </div>

                  <div className="flex items-center mt-7">

                    <Handle
                      type="target"
                      id={`quantumHandleGateInput2${node.id}`}
                      position={Position.Left}
                      className="!top-[75%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                      isValidConnection={() => true}
                    />

                  </div>
                </div>
              </>
            )}
            {isThreeQubit && (
              <>
                <Handle
                  type="target"
                  id={`quantumHandleGateInput1${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[25%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
                <Handle
                  type="target"
                  id={`quantumHandleGateInput2${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[50%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
                <Handle
                  type="target"
                  id={`quantumHandleGateInput3${node.id}`}
                  position={Position.Left}
                  className="!absolute !top-[75%] z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                />
              </>
            )}


            <div
              className={`absolute ${data.label === "Qubit" ? "top-[48%]" : "top-[50%]"
                } -translate-x-1/2 -translate-y-1/2 text-center font-bold`}
            >
              {data.label === "Qubit" ? (
                "|0⟩"
              ) : data.label === "CNOT" ? (
                <img src="/cnot.png" alt="CNOT gate" className="w-5 h-15" />
              ) : data.label === "Toffoli" ? (
                <img src="/toffoli.png" alt="Toffoli gate" className="w-6 h-16" />
              ) : (
                data.label
              )}
            </div>



            {!isTwoQubit && !isThreeQubit && (
              <Handle
                type="source"
                id={`quantumHandleGateOutput1${node.id}`}
                position={Position.Right}
                className="!absolute !top-[50%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
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
                  className="!absolute !top-[25%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
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
                  className="!absolute !top-[25%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput2${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[50%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleStatePreparationOutput" + node.id).length < 1}
                />
                <Handle
                  type="source"
                  id={`quantumHandleGateOutput3${node.id}`}
                  position={Position.Right}
                  className="!absolute !top-[75%] z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
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
