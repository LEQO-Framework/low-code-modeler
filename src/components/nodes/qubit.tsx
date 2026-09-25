import { memo, useState, useEffect, useMemo } from "react";
import { Node, Edge } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { awareness } from "@/yjs";
import { computeQubitIndices } from "@/lib/qubitIndexing";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  experienceLevel: string;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  experienceLevel: state.experienceLevel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const QubitNode = memo((node: Node) => {
  const [outputs, setOutputs] = useState(node.data.outputs || []);

  const { data, selected } = node;

  const {
    nodes,
    updateNodeValue,
    setSelectedNode,
    edges,
    experienceLevel,
  } = useStore(selector, shallow);

  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const id = node.id;

  const qubitIndexLabel = useMemo(() => {
    const indices = computeQubitIndices(nodes, edges);
    const start = indices.get(id);
    if (start === undefined) return null;

    const rawSize = parseInt(String(data?.size), 10);
    const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 1;

    return size > 1
      ? `${start}\u2013${start + size - 1}`
      : `${start}`;
  }, [nodes, edges, id, data?.size]);

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      awareness.getStates().forEach((state: any) => {
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      console.log("COLOR", foundColor, foundName);
    };

    checkRemoteSelection();
    awareness.on("change", checkRemoteSelection);

    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]);

  const isExplorer = experienceLevel === "explorer";

  const nodeLabel = isExplorer
    ? "Qubit Array"
    : "Quantum Register";

  const nodeImage = isExplorer
    ? "qubitArray.png"
    : "quantumregister.png";

  return (
    <div className="grand-parent">
      <div
        className="w-[350px] h-[170px] rounded-none bg-white border border-solid border-gray-700 shadow-md relative"
        style={{
          borderColor: remoteHighlightColor
            ? remoteHighlightColor
            : selected
              ? "#3B82F6"
              : "#374151",
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}`
            : undefined,
        }}
      >
        {qubitIndexLabel !== null && (
          <div
            className="absolute bottom-1 right-1.5 text-xs font-mono font-semibold text-gray-500 bg-white/80 rounded px-1 leading-tight pointer-events-none select-none"
            title={`Register-Index: q${qubitIndexLabel}`}
          >
            q{qubitIndexLabel}
          </div>
        )}

        <div
          className="w-full flex items-center"
          style={{ height: "52px" }}
        >
          <div
            className="w-full bg-blue-300 py-1 px-2 flex items-center"
            style={{ height: "inherit" }}
          >
            <img
              src={nodeImage}
              alt={nodeLabel}
              className="w-[40px] h-[40px] object-contain flex-shrink-0"
            />

            <div className="h-full w-[1px] bg-black mx-2" />

            <span
              className="font-semibold leading-none"
              style={{ paddingLeft: "75px" }}
            >
              {nodeLabel}
            </span>
          </div>
        </div>

        <div className="custom-node-port-out">
          <OutputPort
            node={node}
            index={0}
            type={"quantum"}
            nodes={nodes}
            outputs={outputs}
            setOutputs={setOutputs}
            edges={edges}
            sizeError={sizeError}
            sizeRequired={true}
            outputIdentifierError={outputIdentifierError}
            updateNodeValue={updateNodeValue}
            setOutputIdentifierError={setOutputIdentifierError}
            setSizeError={setSizeError}
            setSelectedNode={setSelectedNode}
            active={true}
          />
        </div>
      </div>
    </div>
  );
});