import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { cn } from "@/lib/utils";
import { classicalConstructColor, quantumConstructColor } from "@/constants";
import { awareness } from "@/yjs";

const selector = (state: any) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

// header icons of the built-in custom nodes, used unless an icon was uploaded
const HEADER_ICONS = {
  dataType: "customDataTypeIcon.svg",
  quantum: "algorithmIcon.png",
  classical: "classicalAlgorithmIcon.png",
};

const headerIcon = (icon: unknown, fallback: string) => {
  const src = Array.isArray(icon) ? icon[0] : icon;
  // the palette icons are previews of the whole node, only uploads fit here
  return typeof src === "string" && src.startsWith("data:") ? src : fallback;
};

interface Port {
  name: string;
  type: string;
  kind: "quantum" | "classical";
  optional: boolean;
}

export const EditableNode = memo((node: Node) => {
  const { data, selected } = node;
  const { nodes, edges, updateNodeValue, setSelectedNode } = useStore(
    selector,
    shallow,
  );

  const updateNodeInternals = useUpdateNodeInternals();
  const isDataType = data.isDataType;
  const isQuantumOperator = data.operatorKind === "quantum";
  const label = data.label || "Editable Node";
  const id = node.id;

  // Nodes created before inputs could be declared used their properties as
  // classical inputs. Keep that layout so existing connections stay valid.
  const isLegacyOperator = !isDataType && !Array.isArray(data.inputPorts);

  const inputs: Port[] = isLegacyOperator
    ? (data.properties || []).map((prop: any) => ({
        name: prop.name,
        type: prop.type,
        kind: "classical",
        optional: false,
      }))
    : data.inputPorts || [];

  const outputPorts: Port[] =
    Array.isArray(data.outputPorts) && data.outputPorts.length > 0
      ? data.outputPorts
      : [{ name: "", type: "", kind: "classical", optional: false }];

  const properties = isLegacyOperator ? [] : data.properties || [];
  const constraints = data.constraints || [];

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, []);

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [inputs.length, outputPorts.length]);

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

  // --------------------- VALIDATION ---------------------
  const validateSingleConstraint = (
    val: string,
    constraintObj: any,
    allValues: string[],
    properties: any[],
  ) => {
    const { constraint, value } = constraintObj;

    // Check if the value refers to another property
    let compareValue = value;
    const otherIndex = properties.findIndex((p: any) => p.name === value);
    if (otherIndex !== -1) compareValue = allValues[otherIndex];

    if (!val || !compareValue) return "";

    // Numeric comparison
    const numVal = parseFloat(val);
    const numCompare = parseFloat(compareValue);
    const dateVal = Date.parse(val);
    const dateCompare = Date.parse(compareValue);
    const isDate = !isNaN(dateVal) && !isNaN(dateCompare);
    if (!isDate) {
      if (!isNaN(numVal) && !isNaN(numCompare)) {
        switch (constraint) {
          case "!=":
            return numVal != numCompare ? "" : `Must be != ${value}`;
          case "==":
            return numVal == numCompare ? "" : `Must be == ${value}`;
          case ">":
            return numVal > numCompare ? "" : `Must be > ${value}`;
          case "<":
            return numVal < numCompare ? "" : `Must be < ${value}`;
          case ">=":
            return numVal >= numCompare ? "" : `Must be >= ${value}`;
          case "<=":
            return numVal <= numCompare ? "" : `Must be <= ${value}`;
        }
      }
    }

    // Date comparison

    if (!isNaN(dateVal) && !isNaN(dateCompare)) {
      switch (constraint) {
        case "!=":
          return dateVal != dateCompare ? "" : `Must be != ${value}`;
        case "==":
          return dateVal == dateCompare ? "" : `Must be == ${value}`;
        case ">":
          return dateVal > dateCompare ? "" : `Must be after ${value}`;
        case "<":
          return dateVal < dateCompare ? "" : `Must be before ${value}`;
        case ">=":
          return dateVal >= dateCompare ? "" : `Must be on/after ${value}`;
        case "<=":
          return dateVal <= dateCompare ? "" : `Must be on/before ${value}`;
      }
    }

    return "";
  };

  const validateAllFields = (
    values: string[],
    properties: any[],
    constraints: any[],
  ) => {
    return values.map((val, index) => {
      const prop = properties[index];
      const propConstraints =
        constraints?.filter((c: any) => c.propertyName === prop.name) || [];
      if (prop.required && String(val ?? "").trim() === "") {
        return "This field is required";
      }
      let error = "";
      propConstraints.forEach((c) => {
        const msg = validateSingleConstraint(val, c, values, properties);
        if (msg) error = msg;
      });
      return error;
    });
  };

  const initialValues = properties.map(
    (prop: any) => data.propertyValues?.[prop.name] || "",
  );
  const [propertyValues, setPropertyValues] = useState<string[]>(initialValues);
  const [propertyErrors, setPropertyErrors] = useState<string[]>(
    validateAllFields(initialValues, properties, constraints),
  );

  const borderColor = remoteHighlightColor
    ? remoteHighlightColor
    : selected
      ? "#3B82F6"
      : "#374151";
  const boxShadow = remoteHighlightColor
    ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
    : undefined;

  const accentBorder = isDataType
    ? "border-orange-300"
    : isQuantumOperator
      ? "border-blue-300"
      : "border-orange-300";

  const renderProperties = (inputWidth: string) =>
    properties.map((prop: any, index: number) => {
      const errorMessage = propertyErrors[index];

      return (
        <div key={index} className="flex flex-col items-center">
          <label className="text-sm mb-1">
            {prop.name}
            {prop.required ? (
              <span className="text-red-600"> *</span>
            ) : (
              <span className="text-gray-500 text-xs"> (optional)</span>
            )}
          </label>

          <input
            type={
              prop.type === "date"
                ? "date"
                : prop.type === "number"
                  ? "number"
                  : "text"
            }
            value={propertyValues[index] ?? ""}
            onChange={(e) => {
              const newValues = [...propertyValues];
              newValues[index] = e.target.value;

              setPropertyValues(newValues);

              const newErrors = validateAllFields(
                newValues,
                properties,
                constraints,
              );
              setPropertyErrors(newErrors);

              node.data.propertyValues = node.data.propertyValues || {};
              node.data.propertyValues[prop.name] = e.target.value;
              updateNodeValue(
                node.id,
                "propertyValues",
                node.data.propertyValues,
              );
            }}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-center",
              inputWidth,
              errorMessage ? "border-red-500 bg-red-100" : accentBorder,
              !prop.required && "border-dashed",
            )}
          />

          {errorMessage && (
            <span className="text-xs text-red-600 mt-1">{errorMessage}</span>
          )}
        </div>
      );
    });

  const renderOutputPort = (port: Port, index: number) => (
    <OutputPort
      node={node}
      index={index}
      type={port.kind === "quantum" ? "quantum" : "classical"}
      nodes={nodes}
      outputs={outputs}
      setOutputs={setOutputs}
      edges={edges}
      sizeError={sizeError}
      outputIdentifierError={outputIdentifierError}
      updateNodeValue={updateNodeValue}
      setOutputIdentifierError={setOutputIdentifierError}
      setSizeError={setSizeError}
      setSelectedNode={setSelectedNode}
      active={!port.optional}
      optional={port.optional}
    />
  );

  // --------------------- DATA TYPE NODE ---------------------
  if (isDataType) {
    return (
      <div className="relative w-[450px]">
        <div
          className={
            "relative w-full min-h-[300px] rounded-[80px] bg-white shadow-md border"
          }
          style={{ borderColor, boxShadow }}
        >
          {/* Header, clipped by a node-sized wrapper so it follows the node's
              corner radius (a 60px high box cannot hold an 80px radius) */}
          <div className="absolute inset-0 rounded-[79px] overflow-hidden pointer-events-none">
            <div className="w-full h-[60px] bg-orange-300 flex items-center px-8">
              <img
                src={headerIcon(data.icon, HEADER_ICONS.dataType)}
                alt="icon"
                style={{ width: 45, height: 45 }}
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold">{label}</span>
            </div>
          </div>

          {/* Properties */}
          <div className="pt-[70px] px-4 pb-4 flex flex-col gap-3">
            {renderProperties("w-[380px]")}
          </div>

          {/* Outputs, kept above the rounded bottom corners */}
          <div className="flex flex-col pb-[80px]">
            {outputPorts.map((port, index) => (
              <div key={`output-${index}`} className="w-full">
                {renderOutputPort(port, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------- OPERATOR NODE ---------------------
  const radius = isQuantumOperator ? 0 : 40;
  const icon = headerIcon(
    data.icon,
    isQuantumOperator ? HEADER_ICONS.quantum : HEADER_ICONS.classical,
  );

  return (
    <div className="relative w-[320px]">
      <div
        className="w-full bg-white border border-solid shadow-md"
        style={{
          borderColor,
          boxShadow,
          borderRadius: radius,
          // keep the last output above the rounded bottom corners
          paddingBottom: Math.max(16, radius),
        }}
      >
        {/* Header */}
        <div
          className={cn(
            "w-full h-[52px] flex items-center px-4",
            isQuantumOperator ? "bg-blue-300" : "bg-orange-300",
          )}
          style={{
            borderTopLeftRadius: Math.max(radius - 1, 0),
            borderTopRightRadius: Math.max(radius - 1, 0),
            paddingLeft: isQuantumOperator ? undefined : 25,
          }}
        >
          <img
            src={icon}
            alt="icon"
            className="w-[42px] h-[42px] object-contain flex-shrink-0"
          />
          <div className="h-full w-[1px] bg-black mx-2" />
          <span className="font-semibold leading-none pl-4">{label}</span>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <div className="px-4 pt-3 flex flex-col gap-2">
            {renderProperties("w-[280px]")}
          </div>
        )}

        {/* Inputs */}
        {inputs.length > 0 && (
          <div className="mt-3 flex flex-col overflow-visible">
            {inputs.map((input, index) => {
              const isClassical = input.kind !== "quantum";
              const handleId = isClassical
                ? `classicalHandleInput${index}${node.id}`
                : `quantumHandleInput${index}${node.id}`;
              const isConnected = edges.some(
                (edge: any) =>
                  edge.target === node.id && edge.targetHandle === handleId,
              );

              return (
                <div
                  key={`input-${index}`}
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: isClassical
                      ? classicalConstructColor
                      : quantumConstructColor,
                    width: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    borderTopRightRadius: isClassical ? "20px" : "0px",
                    borderBottomRightRadius: isClassical ? "20px" : "0px",
                    ...(input.optional && {
                      border: "1px dashed #6b7280",
                      borderLeft: "none",
                    }),
                  }}
                >
                  <Handle
                    type="target"
                    id={handleId}
                    position={Position.Left}
                    className={cn(
                      "z-10 -left-[8px]",
                      !input.optional || isConnected
                        ? isClassical
                          ? "classical-circle-port-operation !bg-orange-300 !border-black"
                          : "circle-port-op !bg-blue-300 !border-black"
                        : isClassical
                          ? "classical-circle-port-operation !bg-gray-200 !border-dashed !border-gray-500"
                          : "circle-port-op !bg-gray-200 !border-dashed !border-gray-500",
                    )}
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  />
                  <div className="flex flex-col items-center w-full leading-tight">
                    <span className="text-black text-sm">
                      {node.data.inputs?.[index]?.outputIdentifier ||
                        input.name ||
                        `Input ${index + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      type: {input.type || "any"}
                      {input.optional && " (optional)"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Outputs */}
        <div className="mt-2 flex flex-col">
          {outputPorts.map((port, index) => (
            <div key={`output-${index}`} className="w-full">
              {renderOutputPort(port, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
