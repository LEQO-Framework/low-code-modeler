import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import {
  findDuplicateOutputIdentifiersInsideNode,
  isUniqueIdentifier,
} from "../utils/utils";
import { Node } from "reactflow";
import { classicalConstructColor } from "@/constants";

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
  propertyValues: any[];
  setPropertyValues: (propertyValues: any[]) => void;
  value: string;
  setValue: (value: string) => void;
  propertyValueError: string;
  setPropertyValueError: (error: string) => void;
}

export default function InputPort({
  node,
  index = 0,
  type,
  edges,
  updateNodeValue,
  active,
  propertyName,
  propertyType,
  hasInputHandles,
  propertyValues,
  setPropertyValues,
  setValue,
  propertyValueError,
  setPropertyValueError,
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

  const isConnected = edges.some((edge) => edge.sourceHandle === handleId);

  const changeValue = (e) => {
    let value = e.target.value.trim();
    const updatedPropertyValues = propertyValues.slice();
    updatedPropertyValues[index] = value;
    const updatedValue = updatedPropertyValues.join(",");
    setPropertyValues(updatedPropertyValues);
    setValue(updatedValue);
    updateNodeValue(node.id, "propertyValues", updatedPropertyValues);
    updateNodeValue(node.id, "value", updatedValue);

    // Clear error by default
    setPropertyValueError("");

    // Array validation
    if (propertyType.toLowerCase() === "array") {
      const trimmedValue = value.trim();
      if (trimmedValue === "") return; // optional empty
      const arrayRegex = /^-?\d+(?:,-?\d+)*$/;
      if (!arrayRegex.test(trimmedValue)) {
        setPropertyValueError(
          `${propertyName} must be comma-separated integers (e.g., 1,2,3)`,
        );
        return;
      }
    }

    // Integer validation
    if (propertyType.toLowerCase() === "int") {
      if (!/^-?\d+$/.test(value) && value !== "") {
        setPropertyValueError(`${propertyName} must be an integer`);
        return;
      }
    }

    // Float and number validation
    if (
      propertyType.toLowerCase() === "float" ||
      propertyType.toLowerCase() === "number"
    ) {
      if (!/^-?\d+(\.\d+)?$/.test(value) && value !== "") {
        const fillerWord =
          propertyType.toLowerCase() === "float" ? "float" : "";
        setPropertyValueError(`${propertyName} must be a ${fillerWord} number`);
        return;
      }
    }

    // Angle validation
    if (propertyType === "angle") {
      if (parseToNormalizedAngle(value) === null && value !== "") {
        setPropertyValueError(
          `${propertyName} must be a valid angle (number or multiple of pi)`,
        );
        return;
      }
    }
  };

  function parseToNormalizedAngle(angle) {
    const trimmed = angle.trim().toLowerCase();
    const piMatch = /^([0-9]*\.?[0-9]*)\s*\*?\s*pi$/.exec(trimmed);

    if (piMatch) {
      const multiplier = piMatch[1] === "" ? 1 : parseFloat(piMatch[1]);
      return (multiplier * Math.PI) % (2 * Math.PI);
    }

    if (/^[+-]?[0-9]*\.?[0-9]+$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      return ((num % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }
    return null;
  }

  return (
    <div className="relative flex items-center justify-start space-x-0 mt-1">
      {hasInputHandles && (
        <div
          style={{ position: "absolute", left: "-4px", overflow: "visible" }}
        >
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
              active || isConnected
                ? `border-solid ${
                    isClassical
                      ? "!bg-orange-300 !border-black"
                      : isAncilla
                        ? "!bg-green-100 !border-black rotate-45"
                        : "!bg-blue-300 !border-black"
                  }`
                : "!bg-gray-200 !border-dashed !border-gray-500",
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
              ? "rgba(137, 218, 131, 0.2)"
              : "rgba(105, 145, 210, 0.2)",
          width: "120px",
          borderRadius: isClassical ? "16px" : "0px",
        }}
      >
        <div className="w-full flex justify-between items-center">
          <span className="text-left text-sm text-black font-semibold">
            {propertyName}
          </span>
          <span className="text-[10px] text-gray-600">
            type: {propertyType}
          </span>
        </div>

        <div className="flex items-center justify-between w-full space-x-2">
          <input
            type="text"
            className={`p-1 text-sm text-black opacity-75 w-20 text-center rounded-full border ${
              propertyValueError
                ? "bg-red-500 border-red-500"
                : isClassical
                  ? "bg-white border-orange-500"
                  : isAncilla
                    ? "bg-white border-green-500"
                    : "bg-white border-blue-500"
            }`}
            value={propertyValues[index]}
            onChange={changeValue}
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
  const selectedNode = nodes.find((n) => n.id === node.id);

  if (
    /^\d/.test(value) ||
    !isUniqueIdentifier(nodes, value, node.id) ||
    findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, value)
  ) {
    setInputIdentifierError(true);
  } else {
    setInputIdentifierError(false);
  }

  setSelectedNode(node);
}
