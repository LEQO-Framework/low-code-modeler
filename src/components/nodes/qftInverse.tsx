import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { awareness } from "@/yjs";

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

export const InverseQFTNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { edges, setEdges, updateNodeValue, setNewEdges } = useStore(selector, shallow);
  const [edgesGraph, setEdgesGraph] = useState(edges);

  const numberInputs = data.numberOutputs || 1;
  const numberOutputs = data.numberOutputs || 1;

  const handleCount = Math.max(1, numberOutputs);
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 85;

  const nodeHeight = Math.max(handleOffset * 1 + (handleCount) * handleGap, 100);

  const inputHandles = Array.from({ length: numberInputs }, (_, i) => (
    <Handle
      key={`input-${i}`}
      type="target"
      id={`quantumHandleQFTInput${i}${node.id}`}
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
      id={`quantumHandleQFTOutput${i}${node.id}`}
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
    if (node.data.numberOutputs === undefined) {
      console.log("set outputs")
      updateNodeValue(node.id, "numberOutputs", "1");
      updateNodeValue(node.id, "inverse", "true");
    }

    const edgesToRemove = edges.filter((edge) => {
      const match = edge.sourceHandle?.match(
        new RegExp(`quantumHandleSplitterOutput(\\d+)${node.id}`)
      );

      if (match === null) {
        return true;
      }

      if (match && match[1]) {

        const index = parseInt(match[1], 10);
        if (index >= 1) {
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


  const [remoteHighlightColor, setRemoteHighlightColor] = useState<string | null>(null);
  const [selectingUserName, setSelectingUserName] = useState<string | null>(null); // technically not needed, could extend functionality to also show user name next to highlighted node

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any, clientId: number) => {
        // Skip your own client ID so you don't highlight it with your own color
        // if (clientId === awareness.clientID) return;

        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      setSelectingUserName(foundName);
      console.log("COLOR", foundColor, foundName);
    };

    // Run once immediately on mount
    checkRemoteSelection();

    // 3. Listen to remote awareness updates
    awareness.on("change", checkRemoteSelection);

    // Clean up listener when the node unmounts
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]); // Re-run if node ID changes


  console.log(nodeHeight)

  return (
    <div className="grand-parent">
      <div
        className="w-[170px] bg-white rounded-none overflow-hidden border border-solid border-gray-700 shadow-md"
        style={{
          borderColor: remoteHighlightColor ? remoteHighlightColor : (selected ? "#3B82F6" : "#374151"),
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
            : undefined,
          height: `${nodeHeight}px`
        }}
      >
        <div className="w-full flex items-center" style={{ height: '52px' }}>
          <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
            <img src="InverseQFTIcon.png" alt="icon" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
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
