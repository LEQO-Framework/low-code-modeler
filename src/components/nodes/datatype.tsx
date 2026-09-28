import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { findDuplicateOutputIdentifiers } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import OutputPort from "../utils/outputPort";
import { awareness } from "@/yjs";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setContainsPlaceholder: (containsPlaceholder) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setContainsPlaceholder: state.setContainsPlaceholder,
});

export const DataTypeNode = memo((node: Node) => {
  const [value, setValue] = useState("");
  const [outputs, setOutputs] = useState(node.data.outputs || []);

  const [valueError, setValueError] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const {
    nodes,
    edges,
    updateNodeValue,
    setSelectedNode,
    setContainsPlaceholder,
  } = useStore(selector, shallow);
  const [durationUnit, setDurationUnit] = useState(
    node.data.durationUnit || "s",
  );
  const { data, selected } = node;

  const changeValue = (e) => {
    const newValue = e.target.value;

    setValue(newValue);
    node.data["value"] = newValue;
    updateNodeValue(node.id, "value", newValue);

    setValueError("");

    const containsLetters = (val) => /[a-zA-Z]/.test(val);
    const startsWithNumber = (val) => /^[+-]?\d/.test(val.trim());

    const updatedNodes = nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, value: newValue } } : n,
    );

    const hasAnyPlaceholder = updatedNodes.some((n) =>
      containsLetters(n.data?.value || ""),
    );
    if (data.dataType === "boolean") {
      setContainsPlaceholder(false);
      return;
    }

    if (data.dataType === "Number") {
      if (startsWithNumber(newValue)) {
        if (!/^-?\d+(\.\d+)?$/.test(newValue.trim())) {
          setValueError("Value must be a number");
          setContainsPlaceholder(false);
          return;
        }
      }
    }

    setContainsPlaceholder(hasAnyPlaceholder);

    if (containsLetters(newValue)) {
      return;
    }

    if (data.dataType === "Array") {
      const trimmed = newValue.trim();
      if (trimmed === "") return;

      const commaSeparatedRegex = /^-?\d+(\.\d+)?(?:,-?\d+(\.\d+)?)*$/;
      const isCommaSeparated = commaSeparatedRegex.test(trimmed);

      let is2DArray = false;
      try {
        const parsed = JSON.parse(
          trimmed.startsWith("[") ? trimmed : `[${trimmed}]`,
        );
        if (Array.isArray(parsed)) is2DArray = true;
      } catch {}

      if (!isCommaSeparated && !is2DArray) {
        setValueError(
          "Array must be comma-separated numbers or a 2D array (e.g., [[0,1], [1,2]])",
        );
        return;
      }
    }

    if (data.label === "complex") {
      if (!isComplexNumber(newValue)) {
        setValueError(
          "Value must be a valid complex number (e.g., 1+2i, 3, -i)",
        );
        return;
      }
    }

    if (data.label === "duration") {
      if (!isPositiveValue(newValue)) {
        setValueError("Value must be a positive number");
        return;
      }
      updateNodeValue(node.id, "durationUnit", durationUnit);
    }

    if (data.dataType === "angle") {
      if (parseToNormalizedAngle(newValue) === null && newValue !== "") {
        setValueError("Value must be a valid angle (number or multiple of pi)");
        return;
      }
    }
  };

  function isComplexNumber(inputValue) {
    const trimmed = inputValue.trim().toLowerCase().replace(/\s+/g, "");

    // Full complex number: real +/- imaginary
    const fullComplex = /^([+-]?\d+(\.\d+)?)([+-](\d+(\.\d+)?|)i)$/;

    // Imaginary only: i, -i, +i, 2i, -3.5i
    const imaginaryOnly = /^([+-]?(\d+(\.\d+)?|))i$/;

    // Real only: 1, -3.14
    const realOnly = /^[+-]?\d+(\.\d+)?$/;

    return (
      fullComplex.test(trimmed) ||
      imaginaryOnly.test(trimmed) ||
      realOnly.test(trimmed)
    );
  }

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

  function isPositiveValue(inputValue) {
    const trimmed = inputValue.trim().toLowerCase();

    if (/^[+]?[0-9]*\.?[0-9]+$/.test(trimmed)) {
      return true;
    }
    return false;
  }

  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    const isDuplicate = duplicates.has(identifier);
    if (node.data.label === "bit" && !node.data.value) {
      updateNodeValue(node.id, "value", "0");
    }
    if (node.data.label === "boolean" && !node.data.value) {
      updateNodeValue(node.id, "value", "true");
    }
    setOutputIdentifierError(isDuplicate && identifier !== "");
    // }, [nodes, node.id]);
  }, [node.id]); // temp fix: white screen during coillaboration mode when dropping datatype node

  const iconMap = {
    int: "intIcon.png",
    Number: "floatIcon.png",
    bit: "bitIcon.png",
    duration: "durationIcon.png",
    boolean: "booleanIcon.png",
    angle: "angleIcon.png",
    complex: "complexIcon.png",
    String: "stringIcon.png",
    Array: "arrayIcon.png",
    File: "fileIcon.png",
  };
  const label = data.label;
  const iconSrc =
    iconMap[label] ?? iconMap[label?.charAt(0).toUpperCase() + label?.slice(1)];
  const iconSizeMap = {
    int: { width: 60, height: 60 },
    Number: { width: 55, height: 55 },
    bit: { width: 50, height: 50 },
    duration: { width: 45, height: 45 },
    boolean: { width: 45, height: 45 },
    angle: { width: 45, height: 45 },
    complex: { width: 55, height: 55 },
    String: { width: 50, height: 50 },
    Array: { width: 55, height: 60 },
    File: { width: 45, height: 45 },
  };

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
    <div className="relative w-[450px] h-[270px] classical-node">
      {outputIdentifierError && (
        <div className="absolute top-2 right-2 group z-20">
          <AlertCircle className="text-red-600 w-5 h-5" />
          <div className="absolute top-5 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
            Identifier not unique
          </div>
        </div>
      )}
      {valueError && (
        <div className="absolute top-2 right-2 group z-20">
          <AlertCircle className="text-red-600 w-5 h-5" />
          <div className="absolute top-12 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
            {valueError}
          </div>
        </div>
      )}
      {sizeError && (
        <div className="absolute top-2 right-2 group z-20">
          <AlertCircle className="text-red-600 w-5 h-5" />
          <div className="absolute top-12 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
            Size must be a positive integer
          </div>
        </div>
      )}
      <div
        className={
          "w-full h-full rounded-full bg-white  overflow-hidden border border-solid shadow-md"
        }
        style={{
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
        <div className="w-full bg-orange-300 text-black text-center font-semibold py-1 truncate relative">
          <div
            className="w-full flex items-center"
            style={{ height: "52px", paddingLeft: "100px" }}
          >
            <div
              className="w-full bg-orange-300 py-1 px-2 flex items-center"
              style={{ height: "inherit" }}
            >
              {(() => {
                const iconSize = iconSizeMap[node.data.label] ??
                  iconSizeMap[
                    node.data.label?.charAt(0).toUpperCase() +
                      node.data.label?.slice(1)
                  ] ?? { width: 50, height: 50 };
                const { width, height } = iconSize;

                return (
                  <img
                    src={iconSrc}
                    alt="icon"
                    style={{ width: `${width}px`, height: `${height}px` }}
                    className="object-contain flex-shrink-0"
                  />
                );
              })()}

              <div className="h-full w-[1px] bg-black mx-2" />
              <span
                className="font-semibold leading-none"
                style={{
                  paddingLeft:
                    data.label === "bit"
                      ? "32px"
                      : data.label === "int"
                        ? "28px"
                        : data.label === "duration"
                          ? "25px"
                          : data.label === "float"
                            ? "23px"
                            : data.label === "angle"
                              ? "29px"
                              : data.label === "File"
                                ? "22px"
                                : data.label === "string"
                                  ? "22px"
                                  : "10px",
                }}
              >
                {data.label}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col items-center space-y-3">
          <div className="flex flex-col items-center">
            <label htmlFor="value" className="text-black text-sm mr-2">
              Value
            </label>

            {data.dataType === "boolean" ? (
              <select
                id="value"
                className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                value={node.data.value || value}
                onChange={changeValue}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : data.dataType === "bit" ? (
              <select
                id="value"
                className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                value={node.data.value || value}
                onChange={changeValue}
              >
                <option value="0">0</option>
                <option value="1">1</option>
              </select>
            ) : data.dataType === "Array" ? (
              <input
                id="value"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 transition-all duration-200 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                value={node.data.value || value}
                placeholder="1,2,3"
                onChange={changeValue}
              />
            ) : data.dataType === "angle" ? (
              <input
                id="value"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 transition-all duration-200 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                value={node.data.value || value}
                placeholder="2pi"
                onChange={changeValue}
              />
            ) : data.label === "duration" ? (
              <div className="flex items-center space-x-2">
                <input
                  id="value"
                  type="text"
                  className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                  value={node.data.value || value}
                  placeholder="0"
                  onChange={changeValue}
                />
                <select
                  className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full border-2 bg-white border-orange-300 focus:border-orange-500"
                  value={durationUnit}
                  onChange={(e) => {
                    const unit = e.target.value;
                    setDurationUnit(unit);
                    node.data["durationUnit"] = unit;
                    updateNodeValue(node.id, "durationUnit", unit);
                  }}
                >
                  <option value="s">s</option>
                  <option value="ms">ms</option>
                  <option value="min">min</option>
                  <option value="h">h</option>
                </select>
              </div>
            ) : data.label === "File" ? (
              <input
                id="value"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-full text-center border-2 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                value={node.data.value || value}
                placeholder="http://example.com/data.json"
                onChange={changeValue}
                style={{ minWidth: "200px" }}
              />
            ) : data.label === "String" ? (
              <input
                id="value"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-32 text-center border-2 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                value={node.data.value || value}
                placeholder="text"
                onChange={changeValue}
              />
            ) : (
              <input
                id="value"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${valueError ? "bg-red-500 border-red-500" : "bg-white border-orange-300"}`}
                value={node.data.value || value}
                placeholder="0"
                onChange={changeValue}
              />
            )}
          </div>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10 w-[200px] h-full">
            <OutputPort
              node={node}
              index={0}
              type={"classical"}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              sizeError={sizeError}
              showSizeErrorAlert={false}
              outputIdentifierError={outputIdentifierError}
              updateNodeValue={updateNodeValue}
              setOutputIdentifierError={setOutputIdentifierError}
              setSizeError={setSizeError}
              setSelectedNode={setSelectedNode}
              active={true}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-0">
        <Handle
          type="source"
          id={`classicalHandleDataTypeOutput0${node.id}`}
          position={Position.Right}
          className="!absolute !top-[67%] z-10 classical-circle-port-round-out !bg-orange-300 !border-black overflow-visible"
          isValidConnection={() => true}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
});
