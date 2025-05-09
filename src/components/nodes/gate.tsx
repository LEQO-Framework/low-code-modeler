import { memo } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
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
  const isQubit = data.label === "Qubit";
  const isTwoQubit = data.label === "CNOT";
  const isThreeQubit = data.label === "Toffoli";
  const { edges } = useStore(selector, shallow);

  return (
    <div className="grand-parent overflow-visible">
      <div className="w-[100px] h-[100px] border border-solid border-gray-700 shadow-md bg-blue-100 relative overflow-visible">
        {/* Label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-bold z-0">
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

        {!isQubit && !isTwoQubit && !isThreeQubit &&(
          <Handle
          type="target"
          id={`quantumHandleGateInput1${node.id}`}
          position={Position.Left}
          className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
          isValidConnection={() => true}
        />
        )}

        {isTwoQubit && (
          <>
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[25%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
              
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput2${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
          </>
        )}

        {isThreeQubit && (
          <>
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[25%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput2${node.id}`}
              position={Position.Left}
              className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput3${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
          </>
        )}

        {!isTwoQubit && !isThreeQubit && (
          <Handle
            type="source"
            id={`quantumHandleGateOutput1${node.id}`}
            position={Position.Right}
            className="!absolute !top-[50%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
            isValidConnection={() => true}
            isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput1" + node.id).length < 1}
            isConnectableEnd={false}
          />
        )}

        {isTwoQubit && (
          <>
            <Handle
              type="source"
              id={`quantumHandleGateOutput1${node.id}`}
              position={Position.Right}
              className="!absolute !top-[25%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput1" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput2${node.id}`}
              position={Position.Right}
              className="!absolute !top-[75%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput2" + node.id).length < 1}
            />
          </>
        )}

        {isThreeQubit && (
          <>
            <Handle
              type="source"
              id={`quantumHandleGateOutput1${node.id}`}
              position={Position.Right}
              className="!absolute !top-[25%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput1" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput2${node.id}`}
              position={Position.Right}
              className="!absolute !top-[50%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput2" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput3${node.id}`}
              position={Position.Right}
              className="!absolute !top-[75%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput3" + node.id).length < 1}
            />
          </>
        )}
      </div>
    </div>
  );
});

