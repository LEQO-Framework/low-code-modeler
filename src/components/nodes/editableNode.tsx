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

  // --------------------- VALIDATION ---------------------
  const validateSingleConstraint = (
    val: string,
    constraintObj: any,
    allValues: string[],
    properties: any[]
  ) => {
    const { constraint, value } = constraintObj;

    if (constraint === "is required") {
      return val.trim() === "" ? "This field is required" : "";
    }

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
    if(!isDate){
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
    }}

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
    constraints: any[]
  ) => {
    return values.map((val, index) => {
      const prop = properties[index];
      const propConstraints =
        constraints?.filter((c: any) => c.propertyName === prop.name) || [];
      let error = "";
      propConstraints.forEach((c) => {
        const msg = validateSingleConstraint(val, c, values, properties);
        if (msg) error = msg;
      });
      return error;
    });
  };

  // --------------------- DATA TYPE NODE ---------------------
  if (isDataType) {
    const properties = data.properties || [];
    const constraints = data.constraints || [];
    const initialValues =
      properties.map((prop: any) => data.propertyValues?.[prop.name] || "") ||
      [];
    const [propertyValues, setPropertyValues] = useState<string[]>(initialValues);
    const [propertyErrors, setPropertyErrors] = useState<string[]>(
      validateAllFields(initialValues, properties, constraints)
    );

    const dynamicHeight = 100 + properties.length * 60 + 200;

    return (
      <motion.div
        className="relative w-[450px]"
        initial={false}
        animate={{ height: dynamicHeight }}
      >
        <div
          className={cn(
            "relative w-full h-full rounded-[80px] bg-white shadow-md border border-gray-700",
            selected && "border-blue-500"
          )}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full h-[60px] rounded-t-[80px] overflow-hidden">
            <div className="w-full h-full bg-orange-300 flex items-center px-8">
              <img
                src={data.icon}
                alt="icon"
                style={{ width: 45, height: 45 }}
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold">{label}</span>
            </div>
          </div>

          {/* Properties */}
          <div className="pt-[70px] px-4 pb-4 flex flex-col gap-3">
            {properties.map((prop: any, index: number) => {
              const errorMessage = propertyErrors[index];

              return (
                <div key={index} className="flex flex-col items-center">
                  <label className="text-sm mb-1">{prop.name}</label>

                  <input
                    type={
                      prop.type === "date"
                        ? "date"
                        : prop.type === "number"
                        ? "number"
                        : "text"
                    }
                    value={propertyValues[index]}
                    onChange={(e) => {
                      const newValues = [...propertyValues];
                      newValues[index] = e.target.value;

                      setPropertyValues(newValues);

                      const newErrors = validateAllFields(
                        newValues,
                        properties,
                        constraints
                      );
                      setPropertyErrors(newErrors);

                      node.data.propertyValues = node.data.propertyValues || {};
                      node.data.propertyValues[prop.name] = e.target.value;
                      updateNodeValue(
                        node.id,
                        "propertyValues",
                        node.data.propertyValues
                      );
                    }}
                    className={cn(
                      "rounded-full border-2 px-3 py-1 w-[380px] text-center",
                      errorMessage
                        ? "border-red-500 bg-red-100"
                        : "border-orange-300"
                    )}
                  />

                  {errorMessage && (
                    <span className="text-xs text-red-600 mt-1">
                      {errorMessage}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Output Port */}
          <div className="absolute bottom-10 right-0 w-[200px]">
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

  // --------------------- STANDARD NODE ---------------------
  const numberInputs = data.properties?.length || 0;
  const numberOutputs = 1;
  const headerHeight = 52;
  const inputHeight = 80;
  const inputsTotalHeight = numberInputs * inputHeight;
  const outputHeight = 120;
  const outputsStartTop = headerHeight + inputsTotalHeight + 10;
  const dynamicHeight = 200 + numberInputs * 50 + numberOutputs * 130 + 100;

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{ width: 320, height: dynamicHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
      >
        {/* Header */}
        {/* Header */}
<div className="absolute top-[0px] left-0 w-full h-[60px] overflow-hidden z-10">
  <div className="w-full h-full bg-blue-300 flex items-center px-2">
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
        <div className="mt-[70px] flex flex-col relative z-0">
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
