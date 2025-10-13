import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
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

export const SplitterNode = memo((node: Node) => {
  const { data } = node;
  const { edges, setEdges, setNewEdges } = useStore(selector, shallow);
  const [edgesGraph, setEdgesGraph] = useState(edges);

  const numberInputs = 1;
  const numberOutputs = data.numberOutputs || 2;

  const handleCount = Math.max(2, numberOutputs);
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 85;

  const nodeHeight = Math.max(handleOffset * 1 + (handleCount) * handleGap, 100);

  const inputHandles = Array.from({ length: numberInputs }, (_, i) => (
    <Handle
      key={`input-${i}`}
      type="target"
      id={`quantumHandleSplitterInput${i}${node.id}`}
      position={Position.Left}
      style={{
        top: `${handleOffset + i * handleGap}px`,
      }}
      className="!z-10 circle-port-splitter !bg-blue-300 !border-black overflow-visible"
      isValidConnection={() => true}
      isConnectable={edges.filter(edge => edge.targetHandle === `quantumHandleSplitterInput${i}${node.id}`).length < 1}
      isConnectableStart={false}
    />
  ));

  const outputHandles = Array.from({ length: numberOutputs }, (_, i) => (
    <Handle
      key={`output-${i}`}
      type="source"
      id={`quantumHandleSplitterOutput${i}${node.id}`}
      position={Position.Right}
      style={{
        top: `${handleOffset + i * handleGap}px`,
      }}
      className="!absolute z-10 circle-port-merger !bg-blue-300 !border-black overflow-visible"
      isValidConnection={() => true}
      isConnectable={edges.filter(edge => edge.sourceHandle === `quantumHandleSplitterOutput${i}${node.id}`).length < 1}
      isConnectableEnd={false}
    />
  ));
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(node.id);

    const edgesToRemove = edges.filter((edge) => {
      const match = edge.sourceHandle?.match(
        new RegExp(`quantumHandleSplitterOutput(\\d+)${node.id}`)
      );

      if (match === null) {
        return true;
      }

      if (match && match[1]) {

        const index = parseInt(match[1], 10);
        if(index >= 1){
          return false
        }
        console.log(index)
        console.log(numberOutputs)
        return index > numberOutputs - 1;
      }

      return false;
    });
    console.log(edges)
    console.log(edgesToRemove)
    console.log(edgesGraph)
    console.log(data.identifiers)

    if (edgesToRemove.length > 0 && data.identifiers.length > numberOutputs) {
      // Compare old vs new, only update if different to avoid infinite loop
      if (edgesToRemove.length !== edges.length) {
        setNewEdges(edgesToRemove);
        setEdgesGraph(edgesToRemove);
      }

    }
  }, [handleCount, node.id, edgesGraph]);


  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < numberOutputs) {
    data.identifiers.push("q" + Math.floor(100000 + Math.random() * 900000).toString());
  }

  // Remove extra identifiers
  console.log(data.identifiers.length);
  console.log(numberOutputs)
  if (data.identifiers.length > numberOutputs) {
    const removedIdentifiers = data.identifiers.slice(numberOutputs);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToRemove = edges.filter((edge) =>
      !removedIdentifiers.some((id, index) =>
        edge.sourceHandle === `quantumHandleSplitterOutput${numberOutputs + index}${node.id}`
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
        className="w-[170px] bg-white rounded-none overflow-hidden border border-solid border-gray-700 shadow-md"
        style={{ height: `${nodeHeight}px` }}
      >
        <div className="w-full flex items-center" style={{ height: '52px' }}>
          <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
            <img src="splitterIcon.png" alt="icon" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
            <div className="h-full w-[1px] bg-black mx-2" />
            <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>{data.label}</span>
          </div>
        </div>

        <div className="px-2 py-3 flex justify-center">
          <div className="flex items-center">
            <>
              <div className="flex flex-col items-start text-black text-center overflow-visible">
                <div className="flex items-center mt-2">
                  {inputHandles}
                </div>
              </div>
            </>

            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center">
              {outputHandles}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
