import { Handle, Position } from 'reactflow';
import { cn } from "@/lib/utils";
import { findDuplicateOutputIdentifiersInsideNode, isUniqueIdentifier } from "../utils/utils";
import { Node } from "reactflow";
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmNode, ClassicalAlgorithmNode, classicalConstructColor } from '@/constants';



interface inputPortProps {
  node: Node;
  index?: number;
  type: string;
  nodes: Node[];
  inputs?: any[];
  setInputs?: (inputs: any[]) => void;
  propertyName: string;
  propertyType: string;
  edges: any[];
  inputIdentifierError: boolean;
  updateNodeValue: (nodeId: string, field: string, value: any) => void;
  setSelectedNode: (node: Node) => void;
  setInputIdentifierError: (error: boolean) => void;
  active: boolean;
  hasInputHandles: boolean;
}

export default function InputPort({
  node,
  index = 0,
  type,
  nodes,
  inputs,
  setInputs,
  edges,
  inputIdentifierError,
  updateNodeValue,
  setSelectedNode,
  setInputIdentifierError,
  active,
  propertyName,
  propertyType,
  hasInputHandles,
}: inputPortProps) {
  const isClassical = type === "classical";
  const isAncilla = type === "ancilla";
  const handleId = isClassical
    ? `classicalHandle${node.type}Input${index}${node.id}`
    : isAncilla
      ? `ancillaHandleInput${index}${node.id}`
      : `quantumHandle${node.type}Input${index}${node.id}`;

  const handleClass = isClassical
    ? "classical-circle-port-out"
    : "circle-port-out";

  const wasBellState = useRef(false);
  const inputIdentifier = propertyName;
  const isConnected = edges.some(edge => edge.sourceHandle === handleId);
  const [propertyValue, setPropertyValue] = useState(""); // TODO: sollte übergeben werden, wie inputs/outputs


/*   // Get input type for classical arithmetic operator
  const getInputType = (inputIndex: number) => {
    const handleId = `classicalHandleOperationInput${inputIndex}${node.id}`;
    const edge = edges.find(e => e.target === node.id && e.targetHandle === handleId);
    if (!edge) return "any";

    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return "any";

    if (sourceNode.type === "measurementNode") return "array";
    if (sourceNode.data?.inputs?.[0]?.value !== undefined) return typeof sourceNode.data.inputs[0].value;
    if (sourceNode.type === "dataTypeNode") return sourceNode.data?.dataType ?? "any";

    return "any";
  }; */
/* 
  // Determine displayed input type dynamically
  const displayedInputType = useMemo(() => {
    let inputType = "unknown";

    // Classical Data Type
    if (type === "classical" && node.type === "dataTypeNode") {
      inputType = node.data?.dataType ?? "array";
    }
    // Classical Arithmetic Operator: infer from inputs
    else if (type === "classical" && node.data.label?.includes("Arithmetic Operator")) {
      const t0 = getInputType(0);
      const t1 = getInputType(1);

      if (t0 !== "any" && t1 !== "any" && t0 === t1) inputType = t0;
      else if (t0 !== "any") inputType = t0;
      else if (t1 !== "any") inputType = t1;
      else inputType = "any";
    }
    // Other classical operators
    else if (type === "classical" && node.data.label?.includes("Bitwise Operator")) {
      inputType = "bit";
    }
    else if (node.data.label?.includes("Comparison Operator")) {
      inputType = "boolean";
    }
    else if (node.data.label?.includes("Min & Max Operator")) {
      inputType = "number";
    }
    // Quantum or fallback
    else if (type === "quantum" || type === "ancilla") {
      inputType = "quantum register";
    }
    else if (type === "classical" && (node.type === "algorithmNode" || node.type === "classicalAlgorithmNode")) {
      inputType = "any"; // default value

      if (node?.data?.inputTypes && node.data.inputTypes[index] != null) {
        inputType = node.data.inputTypes[index];
      }

    }
    else if (type === "classical") {
      inputType = "array";
    }


    console.log("INPUT PORT displayedInputType", node.id, inputType)

    return inputType;
  }, [node.id, node.data.label, type, edges, nodes]);
 */
  // update inputType if it changes
/*   useEffect(() => {
    if (node.data.inputTypes[index] !== displayedInputType) {
      const updatedInputTypes = { ...node.data.inputTypes }
      updatedInputTypes[index] = displayedInputType
      updateNodeValue(node.id, "inputTypes", updatedInputTypes);
      console.log("Updated node inputType in store:", node.id, displayedInputType);
    }
  }, [displayedInputType, node.id, node.data.inputTypes, updateNodeValue]); */

/*   useEffect(() => {
    const isNowBellState = node.data.quantumStateName?.includes("Bell State");
    const updatedInputs = [...inputs];
    if (!updatedInputs[index]) updatedInputs[index] = { identifier: "", size: "" };

    if (isNowBellState) {
      updatedInputs[index] = { ...updatedInputs[index], size: "2" };
      setInputs(updatedInputs);
      node.data.inputs = updatedInputs;
      updateNodeValue(node.id, "size", "2");
      updateNodeValue(node.id, "inputs", updatedInputs);
      setSelectedNode(node);
      wasBellState.current = true;
    } else if (wasBellState.current && node.data.label === "Prepare State") {
      updatedInputs[index] = { ...updatedInputs[index], size: "" };
      setInputs(updatedInputs);
      node.data.inputs = updatedInputs;
      updateNodeValue(node.id, "size", "");
      updateNodeValue(node.id, "inputs", updatedInputs);
      setSelectedNode(node);
      wasBellState.current = false;
    }
  }, [node.data.quantumStateName]); */

  return (
    <div className="relative flex items-center justify-start space-x-0 mt-1">
      {hasInputHandles && (
        <div style={{ position: "absolute", left: "-4px", overflow: "visible" }}> 
        <Handle
          type="target"
          id={handleId}
          position={Position.Left}
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
          isConnectable={true}
          isConnectableStart={false}
        />
        </div>
      )}
      <div
        className="flex flex-col items-start space-y-1 relative p-2"
        style={{
          backgroundColor: isClassical
            ? classicalConstructColor
            : isAncilla
              ? 'rgba(137, 218, 131, 0.2)'
              : 'rgba(105, 145, 210, 0.2)',
          width: "120px",
          borderRadius: isClassical ? '16px' : '0px',
        }}
      >
        <div className="w-full flex justify-between items-center">
          <span className="text-left text-sm text-black font-semibold">{propertyName}</span>
          <span className="text-[10px] text-gray-600">
            type: {propertyType}
          </span>
        </div>

        <div className="flex items-center justify-between w-full space-x-2">
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${inputIdentifierError
              ? 'bg-red-500 border-red-500'
              : isClassical
                ? 'bg-white border-orange-500'
                : isAncilla
                  ? 'bg-white border-green-500'
                  : 'bg-white border-blue-500'
              }`}
            value={propertyValue}
            onChange={(e) => {let value = e.target.value.trim(); setPropertyValue(value);}}
          />
        </div>
      </div>
    </div>
  );
}

export function handleInputIdentifierChange({
  e,
  node,
  nodes,
  updateNodeValue,
  setSelectedNode,
  setInputIdentifierError,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
  node: Node;
  nodes: Node[];
  updateNodeValue: (nodeId: string, field: string, value: string) => void;
  setSelectedNode: (node: Node) => void;
  setInputIdentifierError: (error: boolean) => void;
}) {
  const value = e.target.value;
  node.data["inputIdentifier"] = value;
  updateNodeValue(node.id, "inputIdentifier", value);
  const selectedNode = nodes.find(n => n.id === node.id);

  if (/^\d/.test(value) || (!isUniqueIdentifier(nodes, value, node.id) || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, value))) {
    setInputIdentifierError(true);
  } else {
    setInputIdentifierError(false);
  }

  setSelectedNode(node);
}
