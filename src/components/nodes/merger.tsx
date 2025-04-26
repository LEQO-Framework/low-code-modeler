import { memo } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setEdges: (edge: Edge) => void;
  setNewEdges: (newEdges: Edge[]) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges
});

export const MergerNode = memo((node: Node) => {
  const { data } = node;
  const { edges, setEdges, setNewEdges } = useStore(selector, shallow);

  const numberInputs = data.numberInputs || 1;
  const numberOutputs = data.numberOutputs || 1;

  const handleCount = Math.max(numberInputs, numberOutputs);
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 15;

  const nodeHeight = Math.max(handleOffset * 2 + (handleCount) * handleGap, 100);

  const inputHandles = Array.from({ length: numberInputs }, (_, i) => (
    <Handle
      key={`input-${i}`}
      type="target"
      id={`quantumHandleGateInput${i + 1}${node.id}`}
      position={Position.Left}
      style={{
        top: `${handleOffset + i * handleGap}px`,
      }}
      className="!z-10 circle-port-op !bg-blue-300 !border-black overflow-visible"
      isValidConnection={() => true}
    />
  ));

  const outputHandles = Array.from({ length: numberOutputs }, (_, i) => (
    <Handle
      key={`output-${i}`}
      type="source"
      id={`quantumHandleGateOutput${i + 1}${node.id}`}
      position={Position.Right}
      style={{
        top: `${handleOffset + i * handleGap}px`,
      }}
      className="!absolute z-10 circle-port-out !bg-blue-300 !border-black overflow-visible"
      isValidConnection={() => true}
      isConnectable={
        edges.filter(edge => edge.sourceHandle === `quantumHandleGateOutput${i + 1}${node.id}`).length < 1
      }
    />
  ));

  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < numberOutputs) {
    data.identifiers.push("q" + Math.floor(100000 + Math.random() * 900000).toString());
  }

  // Remove extra identifiers
  if (data.identifiers.length > numberOutputs) {
    const removedIdentifiers = data.identifiers.slice(numberOutputs);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToRemove = edges.filter((edge) =>
      !removedIdentifiers.some((id, index) =>
        edge.sourceHandle === `quantumHandleGateOutput${numberOutputs + index + 1}${node.id}`
      )
    );
    console.log("EDGES")
    console.log(edgesToRemove)
   
    if (edgesToRemove.length > 0) {
      console.log("remove edges")
      setNewEdges(edgesToRemove);
    }

    data.identifiers = data.identifiers.slice(0, numberOutputs);
  }

  console.log(nodeHeight)

  return (
    <div className="grand-parent">
      <div
        className="w-[100px] rounded-none overflow-hidden border border-solid border-gray-700 shadow-md bg-blue-100 "
        style={{ height: `${nodeHeight}px` }}
      >

        <div className="px-2 py-3 flex justify-center bg-blue-100">
          <div className="flex items-center bg-blue-100">
            <>
              <div className="flex flex-col items-start text-black text-center overflow-visible">
                <div className="flex items-center mt-2">

                  {inputHandles}
                </div>
              </div>
            </>
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
            {outputHandles}
          </div>
        </div>
      </div>
    </div>
  );
});
