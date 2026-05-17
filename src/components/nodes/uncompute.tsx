import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useState } from "react";
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

  return (
    <div className="grand-parent">
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
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
