import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { cn } from "@/lib/utils";
import { classicalConstructColor } from "@/constants";
import { motion } from "framer-motion";

const selector = (state: any) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  ancillaMode: state.ancillaMode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges,
  setContainsPlaceholder: state.setContainsPlaceholder,
});

export const EditableNode = memo((node: Node) => {
  const { data, selected } = node;
  const { nodes, edges, updateNodeValue, setSelectedNode, ancillaMode } =
    useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const isDataType = data.isDataType;
  const label = data.label || "Editable Node";

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [ancillaMode]);

  console.log(data.constraints)
  console.log(data.icon)

  const isCrossProperty = (constraintObj: any, properties: any[]) => {
  return properties.some(p => p.name === constraintObj.value);
};
const validateSingleConstraint = (
  val: string,
  constraintObj: any,
  allValues: string[]
) => {
  const { constraint, value } = constraintObj;

  if (constraint === "is required") {
    return val.trim() === "" ? "This field is required" : "";
  }

  // Is value another property?
  const otherIndex = data.properties.findIndex(
    (p: any) => p.name === value
  );

  let compareValue = value;

  if (otherIndex !== -1) {
    compareValue = allValues[otherIndex];
  }

  const numVal = parseFloat(val);
  const numCompare = parseFloat(compareValue);

  const dateVal = Date.parse(val);
  const dateCompare = Date.parse(compareValue);

  switch (constraint) {
    case ">":
      if (!isNaN(numVal) && !isNaN(numCompare))
        return numVal > numCompare ? "" : `Must be > ${value}`;
      if (!isNaN(dateVal) && !isNaN(dateCompare))
        return dateVal > dateCompare ? "" : `Must be after ${value}`;
      break;

    case "<":
      if (!isNaN(numVal) && !isNaN(numCompare))
        return numVal < numCompare ? "" : `Must be < ${value}`;
      if (!isNaN(dateVal) && !isNaN(dateCompare))
        return dateVal < dateCompare ? "" : `Must be before ${value}`;
      break;
  }

  return "";
};

const validateAllFields = (values: string[]) => {
  return values.map((val, index) => {
    const prop = data.properties[index];

    const constraints =
      data.constraints?.filter(
        (c: any) => c.propertyName === prop.name
      ) || [];

    let error = "";

    constraints.forEach((c: any) => {
      const msg = validateSingleConstraint(val, c, values);
      if (msg) error = msg;
    });

    return error;
  });
};


  const validateConstraint = (
  val: string,
  constraintObj: any,
  allValues: string[],
  properties: any[]
) => {
  const { constraint, value } = constraintObj;

  // Required
  if (constraint === "is required") {
    return val.trim() === "" ? "This field is required" : "";
  }

  // Check if value references another property
  const otherPropertyIndex = properties.findIndex(
    (p: any) => p.name === value
  );

  let compareValue: any = value;

  if (otherPropertyIndex !== -1) {
    compareValue = allValues[otherPropertyIndex];
  }

  // Try numeric comparison
  const numVal = parseFloat(val);
  const numCompare = parseFloat(compareValue);

  const bothNumbers = !isNaN(numVal) && !isNaN(numCompare);

  // Try date comparison
  const dateVal = Date.parse(val);
  const dateCompare = Date.parse(compareValue);

  const bothDates = !isNaN(dateVal) && !isNaN(dateCompare);

  switch (constraint) {
    case ">":
      if (bothNumbers) return numVal > numCompare ? "" : `Must be > ${value}`;
      if (bothDates) return dateVal > dateCompare ? "" : `Must be after ${value}`;
      break;

    case "<":
      if (bothNumbers) return numVal < numCompare ? "" : `Must be < ${value}`;
      if (bothDates) return dateVal < dateCompare ? "" : `Must be before ${value}`;
      break;

    case ">=":
      if (bothNumbers) return numVal >= numCompare ? "" : `Must be >= ${value}`;
      if (bothDates) return dateVal >= dateCompare ? "" : `Must be on/after ${value}`;
      break;

    case "<=":
      if (bothNumbers) return numVal <= numCompare ? "" : `Must be <= ${value}`;
      if (bothDates) return dateVal <= dateCompare ? "" : `Must be on/before ${value}`;
      break;
  }

  return "";
};


  // ---------------------------
  // DataType Node Layout
  // ---------------------------
  if (isDataType) {
    const propertyCount = data.properties?.length || 0;
    const initialPropertyValues =
      data.properties?.map(
        (prop: any) => data.propertyValues?.[prop.name] || ""
      ) || [];
    const [propertyValues, setPropertyValues] = useState<string[]>(
      initialPropertyValues
    );
    const [propertyErrors, setPropertyErrors] = useState<string[]>(
      initialPropertyValues.map(() => "")
    );

    const validateConstraint = (val: string, constraintObj: any) => {
      const { constraint, value } = constraintObj;

      if (constraint === "is required") {
        return val.trim() === "" ? "This field is required" : "";
      }

      // For numeric comparisons
      const numericVal = parseFloat(val);
      const numericConstraint = parseFloat(value);

      if (!isNaN(numericVal)) {
        switch (constraint) {
          case ">":
            return numericVal > numericConstraint ? "" : `Must be > ${value}`;
          case ">=":
            return numericVal >= numericConstraint ? "" : `Must be >= ${value}`;
          case "<":
            return numericVal < numericConstraint ? "" : `Must be < ${value}`;
          case "<=":
            return numericVal <= numericConstraint ? "" : `Must be <= ${value}`;
          case "==":
            return numericVal === numericConstraint ? "" : `Must be equal to ${value}`;
          case "!=":
            return numericVal !== numericConstraint ? "" : `Must not be ${value}`;
        }
      }

      // fallback: no error
      return "";
    };


    // Dynamic height based on properties
    const baseHeight = 80; // header + padding
    const propertyRowHeight = 60;
    const bottomSpace = 80; // space for output port
    const dynamicHeight = baseHeight + propertyCount * propertyRowHeight + bottomSpace + 120;

    return (
      <motion.div
        className="relative w-[450px]"
        initial={false}
        animate={{ height: dynamicHeight }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Node background */}
        <div
          className={cn(
            "relative w-full h-full rounded-[80px] bg-white shadow-md border border-gray-700",
            selected && "border-blue-500"
          )}
        >
          {/* Orange header pinned above node */}
          <div className="absolute -top-0 left-0 w-full h-[60px] rounded-t-[120px] overflow-hidden z-10">
            <div className="w-full h-full bg-orange-300 flex items-center px-8">
              <img
                src={data.icon}
                alt="icon"
                style={{ width: 45, height: 45 }}
                className="flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold">{label}</span>
            </div>
          </div>

          {/* Properties */}
          {/* Properties */}
          <div className="pt-[60px] px-4 pb-4 flex flex-col gap-3">
            {data.properties?.map((prop: any, index: number) => {
              // Find constraints for this property
              const constraints = data.constraints?.filter(
                (c: any) => c.propertyName === prop.name
              ) || [];

              // Compute error for current value
              let errorMessage = "";
              constraints.forEach((c: any) => {
                const msg = validateConstraint(propertyValues[index], c);
                if (msg) errorMessage = msg; // override if any constraint fails
              });

              return (
                <div key={index} className="flex flex-col items-center w-full">
                  <label className="text-sm text-black mb-1">{prop.name}</label>
                  <input
                    type="text"
                    value={propertyValues[index]}
                    onChange={(e) => {
  const newValues = [...propertyValues];
  newValues[index] = e.target.value;

  setPropertyValues(newValues);

  const newErrors = validateAllFields(newValues);
  setPropertyErrors(newErrors);

  node.data.propertyValues = node.data.propertyValues || {};
  node.data.propertyValues[prop.name] = e.target.value;
  updateNodeValue(node.id, "propertyValues", node.data.propertyValues);
}}

                    placeholder={prop.type === "string" ? "Text" : prop.type === "number" ? "0" : ""}
                    className={cn(
                      "rounded-full border-2 px-2 py-1 text-center w-[380px]",
                      errorMessage ? "border-red-500 bg-red-100" : "border-orange-300 bg-white"
                    )}
                  />
                  {errorMessage && (
                    <span className="text-xs text-red-600 mt-1">{errorMessage}</span>
                  )}
                </div>
              );
            })}

          </div>



          {/* OutputPort bottom-right */}
          <div className="absolute bottom-10 right-0 z-10 w-[200px] h-auto">
            <OutputPort
              node={node}
              index={0}
              type="classical"
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
              active={true}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------------------------
  // Standard EditableNode layout
  // ---------------------------
  const numberInputs = data.properties?.length || 0;
  const numberOutputs = 1;
  const headerHeight = 52;
  const inputHeight = 80;
  const inputsTotalHeight = numberInputs * inputHeight;
  const outputHeight = 120;
  const outputsStartTop = headerHeight + inputsTotalHeight + 10;
  const dynamicHeight = 200 + numberInputs * 50 + numberOutputs * 130 + 250;

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{ width: 320, height: dynamicHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Node background */}
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative rounded-[28px]",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full h-[60px] -translate-y-4 rounded-t-[28px] overflow-hidden z-10">
          <div className="w-full h-full bg-orange-300 flex items-center px-2">
            <img
              src="classicalAlgorithmIcon.png"
              alt="icon"
              className="w-[42px] h-[42px] object-contain flex-shrink-0"
            />
            <div className="h-full w-[1px] bg-black mx-2" />
            <span className="font-semibold leading-none cursor-pointer pl-6">
              {label}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-[5px] flex flex-col relative z-0">
          {data.properties?.map((prop: any, index: number) => (
            <div
              key={`input-${index}`}
              className="relative p-2 mb-1"
              style={{
                backgroundColor: classicalConstructColor,
                width: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                borderTopRightRadius: "20px",
                borderBottomRightRadius: "20px",
              }}
            >
              <Handle
                type="target"
                id={`classicalHandleInput${index}${node.id}`}
                position={Position.Left}
                className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              />
              <div className="flex flex-col items-center w-full leading-tight">
                <span className="text-black text-sm">
                  {prop.name || `Input ${index + 1}`}
                </span>
                <span className="text-[10px] text-gray-600">
                  type: {prop.type || "undefined"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Outputs */}
        <div className="custom-node-port-out">
          {Array.from({ length: numberOutputs }).map((_, index) => (
            <div
              key={`output-wrapper-${index}`}
              className="absolute left-0 w-full z-10"
              style={{ top: `${outputsStartTop + index * outputHeight}px` }}
            >
              <OutputPort
                node={node}
                index={index}
                type="classical"
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
                active={true}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
