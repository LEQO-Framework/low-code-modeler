import { Handle, Position } from 'reactflow';
import { cn } from "@/lib/utils";
import { findDuplicateOutputIdentifiersInsideNode, isUniqueIdentifier } from "../utils/utils";
import { Node } from "reactflow";
import { useEffect, useMemo, useRef } from 'react';
import { AlgorithmNode, ClassicalAlgorithmNode, classicalConstructColor } from '@/constants';

interface OutputPortProps {
  node: Node;
  index?: number;
  type: string;
  nodes: Node[];
  outputs: any[];
  setOutputs: (outputs: any[]) => void;
  edges: any[];
  outputIdentifierError: boolean;
  updateNodeValue: (nodeId: string, field: string, value: any) => void;
  setSelectedNode: (node: Node) => void;
  setOutputIdentifierError: (error: boolean) => void;
  sizeError: boolean;
  sizeRequired?: boolean;
  setSizeError: (error: boolean) => void;
  active: boolean;
}

export default function OutputPort({
  node,
  index = 0,
  type,
  nodes,
  outputs,
  setOutputs,
  edges,
  outputIdentifierError,
  updateNodeValue,
  setSelectedNode,
  setOutputIdentifierError,
  sizeError,
  sizeRequired = false,
  setSizeError,
  active
}: OutputPortProps) {
  const isClassical = type === "classical";
  const isAncilla = type === "ancilla";
  const handleId = isClassical
    ? `classicalHandle${node.type}Output${index}${node.id}`
    : isAncilla
      ? `ancillaHandleOutput${index}${node.id}`
      : `quantumHandle${node.type}Output${index}${node.id}`;

  const handleClass = isClassical
    ? "classical-circle-port-out"
    : "circle-port-out";

  const wasBellState = useRef(false);
  const outputIdentifier = outputs[index]?.identifier || "";
  const outputSize = outputs[index]?.size || "";
  const isConnected = edges.some(edge => edge.sourceHandle === handleId);

  // Handle numeric size change and validation
  const handleYChange = (value: string, field: string) => {
    const num = Number(value);
    const hasError = value !== "" && (!/^\d+$/.test(value) || num <= 0);
    setSizeError(hasError);

    node.data[field] = value;
    updateNodeValue(node.id, field, num);
    setSelectedNode(node);
  };

  // Get input type for classical arithmetic operator
  const getInputType = (inputIndex: number) => {
    const handleId = `classicalHandleOperationInput${inputIndex}${node.id}`;
    const edge = edges.find(e => e.target === node.id && e.targetHandle === handleId);
    if (!edge) return "any";

    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return "any";

    if (sourceNode.type === "measurementNode") return "array";
    if (sourceNode.data?.outputs?.[0]?.value !== undefined) return typeof sourceNode.data.outputs[0].value;
    if (sourceNode.type === "dataTypeNode") return sourceNode.data?.dataType ?? "any";

    return "any";
  };

  // Determine displayed output type dynamically
  const displayedOutputType = useMemo(() => {
    let outputType = "unknown";

    // Classical Data Type
    if(type === "classical" && node.type === "dataTypeNode") {
      outputType = node.data?.dataType ?? "array";
    }
    // Classical Arithmetic Operator: infer from inputs
    else if (type === "classical" && node.data.label?.includes("Arithmetic Operator")) {
      const t0 = getInputType(0);
      const t1 = getInputType(1);

      if (t0 !== "any" && t1 !== "any" && t0 === t1) outputType = t0;
      else if (t0 !== "any") outputType = t0;
      else if (t1 !== "any") outputType = t1;
      else outputType = "any";
    }
    // Other classical operators
    else if (type === "classical" && node.data.label?.includes("Bitwise Operator")) {
      outputType = "bit";
    }
    else if (node.data.label?.includes("Comparison Operator")) {
      outputType = "boolean";
    }
    else if (node.data.label?.includes("Min & Max Operator")) {
      outputType = "number";
    }
    // Quantum or fallback
    else if (type === "quantum" || type === "ancilla") {
      outputType = "quantum register";
    }
    else if (type === "classical" && (node.type === "algorithmNode" || node.type === "classicalAlgorithmNode")) {
      outputType = node.data.outputTypes[index] ?? "any";
    }
    else if (type === "classical") {
      outputType = "array";
    }


    console.log("OUTPUT PORT displayedOutputType", node.id, outputType)

    return outputType;
  }, [node.id, node.data.label, type, edges, nodes]);

  // update outputType if it changes
  useEffect(() => {
    if (node.data.outputTypes[index] !== displayedOutputType) {
      const updatedOutputTypes = {... node.data.outputTypes}
      updatedOutputTypes[index] = displayedOutputType
      updateNodeValue(node.id, "outputTypes", updatedOutputTypes);
      console.log("Updated node outputType in store:", node.id, displayedOutputType);
    }
  }, [displayedOutputType, node.id, node.data.outputTypes, updateNodeValue]);

  useEffect(() => {
    const isNowBellState = node.data.quantumStateName?.includes("Bell State");
    const updatedOutputs = [...outputs];
    if (!updatedOutputs[index]) updatedOutputs[index] = { identifier: "", size: "" };

    if (isNowBellState) {
      updatedOutputs[index] = { ...updatedOutputs[index], size: "2" };
      setOutputs(updatedOutputs);
      node.data.outputs = updatedOutputs;
      updateNodeValue(node.id, "size", "2");
      updateNodeValue(node.id, "outputs", updatedOutputs);
      setSelectedNode(node);
      wasBellState.current = true;
    } else if (wasBellState.current && node.data.label === "Prepare State") {
      updatedOutputs[index] = { ...updatedOutputs[index], size: "" };
      setOutputs(updatedOutputs);
      node.data.outputs = updatedOutputs;
      updateNodeValue(node.id, "size", "");
      updateNodeValue(node.id, "outputs", updatedOutputs);
      setSelectedNode(node);
      wasBellState.current = false;
    }
  }, [node.data.quantumStateName]);

  return (
    <div className="relative flex items-center justify-end space-x-0 mt-1">
      <div
        className="flex flex-col items-end space-y-1 relative p-2"
        style={{
          backgroundColor: isClassical
            ? classicalConstructColor
            : isAncilla
              ? 'rgba(137, 218, 131, 0.2)'
              : 'rgba(105, 145, 210, 0.2)',
          width: "180px",
          borderRadius: isClassical ? '16px' : '0px',
        }}
      >
        <div className="w-full flex justify-between items-center">
          <span className="text-left text-sm text-black font-semibold">Output:</span>
          <span className="text-[10px] text-gray-600">
            type: {displayedOutputType.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center justify-between w-full space-x-2">
          <label className="text-sm text-black" style={{ paddingLeft: '15px' }}>Identifier</label>
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${outputIdentifierError
                ? 'bg-red-500 border-red-500'
                : isClassical
                  ? 'bg-white border-orange-500'
                  : isAncilla
                    ? 'bg-white border-green-500'
                    : 'bg-white border-blue-500'
              }`}
            value={outputIdentifier}
            onChange={(e) => {
              const updatedOutputs = [...outputs];
              if (!updatedOutputs[index]) updatedOutputs[index] = { identifier: "", size: "" };
              updatedOutputs[index] = {
                ...updatedOutputs[index],
                identifier: e.target.value,
                type: isClassical ? "classical" : "quantum",
              };

              // Ensure immutability by creating a new array
              setOutputs(updatedOutputs);
              node.data.outputs = updatedOutputs;
              updateNodeValue(node.id, "outputs", updatedOutputs);
              setSelectedNode(node);
              handleOutputIdentifierChange({
                e,
                node,
                nodes,
                updateNodeValue,
                setSelectedNode,
                setOutputIdentifierError,
              });

              setOutputs(updatedOutputs);
              node.data.outputs = updatedOutputs;
              updateNodeValue(node.id, "outputs", updatedOutputs);
              setSelectedNode(node);
            }}
          />
        </div>

        <div className="flex items-center justify-between w-full space-x-2">
          <label className="text-sm text-black" style={{ paddingLeft: '15px' }}>Size</label>
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${sizeError
                ? 'bg-red-500 border-red-500'
                : isClassical
                  ? `bg-white border-orange-500 ${sizeRequired ? '' : 'border-dashed'}`
                  : isAncilla
                    ? `bg-white border-green-500 ${sizeRequired ? '' : 'border-dashed'}`
                    : `bg-white border-blue-500 ${sizeRequired ? '' : 'border-dashed'}`
              }`}
            value={node.data.quantumStateName?.includes("Bell State") ? "2" : outputSize}
            readOnly={node.data.quantumStateName?.includes("Bell State")}
            onChange={(e) => {
              const updatedOutputs = [...outputs];
              if (!updatedOutputs[index]) updatedOutputs[index] = { identifier: "", size: "" };
              updatedOutputs[index] = { ...updatedOutputs[index], size: e.target.value };

              handleYChange(e.target.value, "size");

              setOutputs(updatedOutputs);
              node.data.outputs = updatedOutputs;
              updateNodeValue(node.id, "outputs", updatedOutputs);
              setSelectedNode(node);
            }}
          />
        </div>
      </div>

      {node.type !== "dataTypeNode" && (
        <Handle
          type="source"
          id={handleId}
          position={Position.Right}
          className={cn(
            "z-10",
            handleClass,
            "top-1/2 -translate-y-1/2",
            isClassical
              ? "!bg-orange-300 !border-black"
              : isAncilla
                ? "!bg-green-100 !border-black rotate-45"
                : "!bg-blue-300 !border-black",
            (active || isConnected)
              ? `border-solid ${isClassical
                ? "!bg-orange-300 !border-black"
                : isAncilla
                  ? "!bg-green-100 !border-black rotate-45"
                  : "!bg-blue-300 !border-black"}`
              : "!bg-gray-200 !border-dashed !border-gray-500"
          )}
          isConnectable={edges.filter(edge => edge.sourceHandle === handleId).length < 1}
          isConnectableEnd={false}
        />
      )}
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
  const selectedNode = nodes.find(n => n.id === node.id);

  if (/^\d/.test(value) || (!isUniqueIdentifier(nodes, value, node.id) || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, value))) {
    setOutputIdentifierError(true);
  } else {
    setOutputIdentifierError(false);
  }

  setSelectedNode(node);
}
