import { awareness } from "@/yjs";
import React, { memo, useEffect, useState } from "react";
import { Handle, Node, Position } from "reactflow";

export const DynamicNode = memo((node: Node) => {
  const { data, selected } = node;
  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [yError, _setYError] = useState(false);

  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([
      ...inputs,
      { id: newInputId, label: `Variable ${inputs.length + 1}` },
    ]);
    setOutputs([
      ...outputs,
      { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" },
    ]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(
      outputs.map((output) =>
        output.id === id ? { ...output, value: newValue } : output,
      ),
    );
  };

  const baseHeight = 180;
  const extraHeightPerVariable = 40;
  const dynamicHeight =
    baseHeight + (inputs.length + outputs.length) * extraHeightPerVariable;

  const id = node.id;

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any) => {
        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
        }
      });

      setRemoteHighlightColor(foundColor);
      console.log("COLOR", foundColor);
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
        className={
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md"
        }
        style={{
          height: `${dynamicHeight}px`,
          borderColor: remoteHighlightColor
            ? remoteHighlightColor
            : selected
              ? "#3B82F6"
              : "#374151",
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
            : undefined,
        }}
      >
        <div className="w-full bg-green-300 text-black text-center font-semibold py-1 truncate">
          {data.label}
        </div>

        <div className="custom-node-port-in space-y-2 px-3">
          {inputs.map((input, _index) => (
            <div
              className="relative flex items-center space-x-2 overflow-visible"
              key={input.id}
            >
              <div>
                <Handle
                  type="target"
                  id={input.id}
                  position={Position.Left}
                  className="z-10 circle-port !bg-green-300 !border-green-300"
                  style={{ top: "12px" }}
                />

                <span className="text-black text-sm">{input.label}</span>
              </div>
            </div>
          ))}
          <button
            onClick={addVariable}
            className="add-variable-button mt-2 w-full bg-gray-300 py-1 rounded text-sm text-black"
          >
            + Add More Variables
          </button>
        </div>

        <div className="custom-node-port-out">
          {outputs.map((output, _index) => (
            <div
              className="relative flex items-center justify-end space-x-0 overflow-visible"
              key={output.id}
            >
              <div
                className="flex items-center space-x-2 relative"
                style={{
                  backgroundColor: "rgba(124, 202, 154, 0.2)",
                  width: "150px",
                }}
              >
                <label htmlFor="y" className="text-sm text-black mr-2">
                  {output.label}
                </label>
                <input
                  id="y"
                  className={`p-1 text-sm text-black opacity-75 w-10 text-center rounded-none border ${yError ? "bg-red-500 border-red-500" : "bg-white border-gray-500"}`}
                  placeholder="a"
                  onChange={(e) =>
                    handleOutputChange(output.id, e.target.value)
                  }
                />
                <Handle
                  type="target"
                  id={output.id}
                  position={Position.Right}
                  className="z-10 circle-port-out !bg-green-300 !border-green-300 !border-black"
                  isValidConnection={() => true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
