import { Handle, Position } from 'reactflow';
import { cn } from "@/lib/utils";
import { isUniqueIdentifier } from "../utils/utils";
import { Node } from "reactflow";

export default function OutputPort({
  node,
  index = 0,
  nodes,
  outputs,
  setOutputs,
  edges,
  outputIdentifierError,
  updateNodeValue,
  setSelectedNode,
  setOutputIdentifierError,
  sizeError,
  setSizeError,
  active
}) {
  const isClassical = index === 0;
  const handleId = isClassical
    ? `classicalHandle${node.id}`
    : `quantumHandle${node.type}Output${index}${node.id}`;

  const handleClass = isClassical
    ? "classical-circle-port-out"
    : "circle-port-out";

  const outputIdentifier = outputs[index]?.identifier || "";
  const outputSize = outputs[index]?.size || "";
  const isConnected = edges.some(edge => edge.sourceHandle === handleId);

  const handleYChange = (value, field) => {
    const number = Number(value);
    console.log(value)

    if (/^[a-zA-Z_]/.test(value) || number < 0) {
      console.log(sizeError)
      setSizeError(true);
      console.log(sizeError)
    } else {
      setSizeError(false);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, number);
    setSelectedNode(node);
  };

  return (
    <div className="relative flex items-center justify-end space-x-0 overflow-visible mt-1">
      <div
        className="flex flex-col items-end space-y-1 relative p-2"
        style={{
          backgroundColor: isClassical
            ? 'rgba(210, 159, 105, 0.2)'
            : 'rgba(105, 145, 210, 0.2)',
          width: '180px',
          borderRadius: isClassical ? '16px' : '0px',
        }}
      >
        <div className="w-full text-left text-sm text-black font-semibold">Output:</div>

        <div className="flex items-center justify-between w-full space-x-2">
          <label className="text-sm text-black">Identifier</label>
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${outputIdentifierError ? 'bg-red-500 border-red-500' : 'bg-white border-blue-300'}`}
            value={outputIdentifier}
            onChange={(e) => {
              const updatedOutputs = [...outputs];
              if (!updatedOutputs[index]) {
                updatedOutputs[index] = { identifier: "", size: "" };
              }
              updatedOutputs[index] = {
                ...updatedOutputs[index],
                identifier: e.target.value,
              };

              handleOutputIdentifierChange({
                e,
                node,
                nodes,
                updateNodeValue,
                setSelectedNode,
                setOutputIdentifierError,
              });

              // Ensure immutability by creating a new array
              setOutputs(updatedOutputs);
              node.data.outputs = updatedOutputs;
              updateNodeValue(node.id, "outputs", updatedOutputs);
              setSelectedNode(node);
            }}
          />
        </div>

        <div className="flex items-center justify-between w-full space-x-2">
          <label className="text-sm text-black">Size</label>
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${sizeError ? 'bg-red-500 border-red-500 border-dashed' : 'bg-white border-blue-300 border-dashed'}`}
            value={node.data.quantumStateName?.includes("Bell State") ? "2" : outputSize}
            readOnly={node.data.quantumStateName?.includes("Bell State")}
            onChange={(e) => {
              const updatedOutputs = [...outputs];
              if (!updatedOutputs[index]) {
                updatedOutputs[index] = { identifier: "", size: "" };
              }
              updatedOutputs[index] = {
                ...updatedOutputs[index],
                size: e.target.value,
              };

              // Call handleYChange for size validation and state update
              handleYChange(e.target.value, "size");

              // Again, create a new array to maintain immutability
              setOutputs(updatedOutputs);
              node.data.outputs = updatedOutputs;
              updateNodeValue(node.id, "outputs", updatedOutputs);
              setSelectedNode(node);
            }}
          />
        </div>

        <Handle
          type="source"
          id={handleId}
          position={Position.Right}
          className={cn(
            "z-10",
            handleClass,
            isClassical
              ? "!bg-orange-300 !border-black"
              : "!bg-blue-300 !border-black",
              (active || isConnected)
              ? "border-solid !bg-blue-300 !border-black"
              : "!bg-gray-200 border-dashed !border-gray-500"
          )}
          style={{
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          isConnectable={true}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
}

export function handleOutputIdentifierChange({
  e,
  node,
  nodes,
  updateNodeValue,
  setSelectedNode,
  setOutputIdentifierError,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
  node: Node;
  nodes: Node[];
  updateNodeValue: (nodeId: string, field: string, value: string) => void;
  setSelectedNode: (node: Node) => void;
  setOutputIdentifierError: (error: boolean) => void;
}) {
  const value = e.target.value;
  node.data["outputIdentifier"] = value;
  updateNodeValue(node.id, "outputIdentifier", value);

  if (/^\d/.test(value) || !isUniqueIdentifier(nodes, value, node.id)) {
    setOutputIdentifierError(true);
  } else {
    setOutputIdentifierError(false);
  }

  setSelectedNode(node);
}
