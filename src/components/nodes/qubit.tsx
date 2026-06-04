import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { cn } from "@/lib/utils";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[],
  nodes: Node[],
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const QubitNode = memo((node: Node) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);

  const { data, selected } = node;
  const xRef = useRef(null);
  const yRef = useRef(null);

  const { selectedNode, nodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [operation, setOperation] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const handleXChange = (e) => {
    let value = e.target.value.trim();

    if (data.dataType === "int") {
      if (!/^-?\d+$/.test(value) && value !== "") {
        setError(true);
        setX(value);
        return;
      }
    }

    setError(false);
    setX(value);
    node.data["size"] = value;
    updateNodeValue(node.id, "size", value);
  };


  const handleYChange = (e) => {
    const value = e.target.value;
    if (!/^[a-zA-Z_]/.test(value) && value !== "") {
      setYError(true);
    } else {
      setYError(false);
    }
    setY(value);
    node.data["outputIdentifier"] = value;
    updateNodeValue(node.id, "outputIdentifier", value);
    setSelectedNode(node);
  };

  const id = node.id;

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
        if (state.cursor && state.cursor.selectedNodeId === id) {
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

  return (
    <div className="grand-parent">
      <div className={"w-[350px] h-[170px] rounded-none bg-white  border border-solid border-gray-700 shadow-md"}
            style={{borderColor: remoteHighlightColor ? remoteHighlightColor : (selected? "#3B82F6" : "#374151"),
                  boxShadow: remoteHighlightColor 
                      ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
                      : undefined, }}>
        <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img src="qubitIcon.png" alt="icon" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="truncate font-semibold leading-none" style={{ paddingLeft: '75px' }}>{data.label}</span>
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
