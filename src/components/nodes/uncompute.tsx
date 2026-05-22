import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import { awareness } from "@/yjs";
import React, { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: { edges: Edge[] }) => ({
  edges: state.edges,
});

export const UncomputeNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [encodingType, setEncodingType] = useState("Basis Encoding");
  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");

  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([...inputs, { id: newInputId, label: `Variable ${inputs.length + 1}` }]);
    setOutputs([...outputs, { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" }]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(outputs.map(output => output.id === id ? { ...output, value: newValue } : output));
  };
  const handleYChange = (e) => {
    const value = e.target.value;
    if (!/^[a-zA-Z_]/.test(value) && value !== "") {
      setYError(true);
    } else {
      setYError(false);
    }
    setY(value);
  };

  const baseHeight = 160;
  const extraHeightPerVariable = 20;
  const dynamicHeight = baseHeight + (inputs.length + outputs.length) * extraHeightPerVariable;

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
      <div
        className={"w-[320px] bg-white border border-solid border-gray-700 shadow-md"}
        style={{ height: `${dynamicHeight}px`,
                  borderColor: remoteHighlightColor ? remoteHighlightColor : (selected? "#3B82F6" : "#374151"),
                  boxShadow: remoteHighlightColor 
                      ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
                      : undefined,  }}
      >
        <div className="w-full bg-green-300 text-black text-center font-semibold py-1 truncate">
          {data.label}
        </div>

        <div className="custom-node-port-in mb-3 mt-2">
          {inputs.map((input, index) => (
            <div className="relative flex items-center overflow-visible mb-1" key={input.id}>
              <div className="relative flex items-center justify-between text-sm text-black py-1 px-3 rounded-none w-full" style={{
                backgroundColor: 'rgba(124, 202, 154, 0.2)',
              }}>
                <Handle
                  type="target"
                  id={input.label}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-green-300 !border-black"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                />
                <span className="pl-3">{input.label}</span>
                <Handle
                  type="source"
                  id={input.label + "output"}
                  position={Position.Right}
                  className="z-10 circle-port-out !bg-green-300 !border-black"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                  isValidConnection={(connection) => true}
                />
              </div>
            </div>
          ))}

          <button onClick={addVariable} className="add-variable-button mt-2 w-full bg-gray-300 py-1 rounded text-sm text-black">
            + Add More Variables
          </button>
        </div>
      </div>
    </div>
  );
});
