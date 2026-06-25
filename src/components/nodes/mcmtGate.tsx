import { memo, useEffect } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { quantumConstructColor } from "@/constants";

export type MCMTGateNodeData = {
  label: string;
  baseGate: string;
  numControls: number | string;
  numTargets: number | string;
  parameter: number | string;
};

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
});

const isPositiveInt = (val: string) => /^[1-9]\d*$/.test(val);

export const MCMTGateNode = memo((node: Node<MCMTGateNodeData>) => {
  const { id, data, selected } = node;
  const updateNodeInternals = useUpdateNodeInternals();

  const { updateNodeValue } = useStore(selector, shallow);

  const numControls = isPositiveInt(String(data.numControls))
    ? parseInt(String(data.numControls), 10)
    : 1;

  const numTargets = isPositiveInt(String(data.numTargets))
    ? parseInt(String(data.numTargets), 10)
    : 1;

  const baseGate = (data.baseGate || "X").toUpperCase();
  const parameter = data.parameter !== undefined ? data.parameter : 0;

  const totalHandles = numControls + numTargets;

  const parameterizedGates = ["RX(θ)", "RY(θ)", "RZ(θ)", "RX", "RY", "RZ"];
  const hasParameter = parameterizedGates.includes(baseGate);

  const headerHeight = 52;
  const formHeight = hasParameter ? 130 : 60;
  const handlesHeight = totalHandles * 44;
  const dynamicHeight = headerHeight + formHeight + Math.max(numControls, numTargets, 3) * handlesHeight + 50;

  useEffect(() => {
    updateNodeInternals(id);
  }, [numControls, numTargets, id, updateNodeInternals]);

  const gateOptions = [
    "X",
    "Y",
    "Z",
    "H",
    "RX(θ)",
    "RY(θ)",
    "RZ(θ)",
    "S",
    "SDG",
    "T",
    "TDG",
  ];

  const handleChange = (field: string, value: any) => {
    let finalValue = value;

    if (field === "baseGate") {
      finalValue = value.replace(/\(θ\)/g, "").toLowerCase();

      const willHaveParam = ["rx(θ)", "ry(θ)", "rz(θ)", "rx", "ry", "rz"].includes(
        value.toLowerCase()
      );

      if (!willHaveParam) {
        updateNodeValue(id, "parameter", 0);
      }
    }

    updateNodeValue(id, field, finalValue);
  };

  return (
    <div
      className="grand-parent"
      style={{ width: 320, height: dynamicHeight }}
    >
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative flex flex-col",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
      >
        {/* HEADER */}
        <div className="w-full flex items-center" style={{ height: "52px" }}>
          <div
            className="w-full bg-blue-300 py-1 px-2 flex items-center"
            style={{ height: "inherit" }}
          >
            <img
              src="PaletteIcon_MCMT.svg"
              alt="MCMT icon"
              className="w-[40px] h-[40px] object-contain flex-shrink-0"
            />
            <div className="h-full w-[1px] bg-black mx-2" />
            <span className="font-semibold leading-none" style={{ paddingLeft: "65px" }}>
              {data.label || "MCMT Gate"}
            </span>
          </div>
        </div>

        {/* CONFIGURATION BODY */}
        <div className="px-4 py-1 mt-2">
          {/* U selector */}
          <div>
            <label className="text-xs font-semibold text-gray-700">U:</label>
            <select
              className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
              value={
                baseGate.includes("R") && !baseGate.includes("(")
                  ? `${baseGate}(θ)`
                  : baseGate
              }
              onChange={(e) => handleChange("baseGate", e.target.value)}
            >
              {gateOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* NEW: Controls + Targets */}
          <div className="mt-3 space-y-3">
            {/* Controls */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Number of Controls
              </label>
              <input
                type="text"
                value={String(data.numControls ?? "")}
                onChange={(e) => {
                  const val = e.target.value;

                  if (val === "" || isPositiveInt(val)) {
                    updateNodeValue(id, "numControls", val);
                  }
                }}
                onBlur={() => {
                  if (!isPositiveInt(String(data.numControls))) {
                    updateNodeValue(id, "numControls", "1");
                  }
                }}
                className="w-full p-1 mt-1 text-sm text-center border-2 border-blue-200 rounded-full outline-none focus:border-blue-400"
                placeholder="e.g. 2"
              />

              {data.numControls &&
                !isPositiveInt(String(data.numControls)) && (
                  <p className="text-red-500 text-[10px] mt-1">
                    Must be a number &gt; 0
                  </p>
                )}
            </div>

            {/* Targets */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Number of Targets
              </label>
              <input
                type="text"
                value={String(data.numTargets ?? "")}
                onChange={(e) => {
                  const val = e.target.value;

                  if (val === "" || isPositiveInt(val)) {
                    updateNodeValue(id, "numTargets", val);
                  }
                }}
                onBlur={() => {
                  if (!isPositiveInt(String(data.numTargets))) {
                    updateNodeValue(id, "numTargets", "1");
                  }
                }}
                className="w-full p-1 mt-1 text-sm text-center border-2 border-blue-200 rounded-full outline-none focus:border-blue-400"
                placeholder="e.g. 1"
              />

              {data.numTargets &&
                !isPositiveInt(String(data.numTargets)) && (
                  <p className="text-red-500 text-[10px] mt-1">
                    Must be a number &gt; 0
                  </p>
                )}
            </div>
          </div>

          {/* Parameter */}
          {hasParameter && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-700">
                Angle (θ):
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={parameter}
                onChange={(e) =>
                  handleChange(
                    "parameter",
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
              />
            </div>
          )}
        </div>

        {/* HANDLES */}
        <div className="w-full mt-3 flex flex-col space-y-2 flex-grow pb-4">
          {Array.from({ length: totalHandles }).map((_, i) => {
            const isControl = i < numControls;
            const bgColor = quantumConstructColor;
            const handleColor = "!bg-blue-300";
            const labelText = isControl
              ? `Control ${i}`
              : `Target ${i - numControls}`;

            return (
              <div
                key={`handle-row-${i}`}
                className="w-full flex justify-between items-center relative"
                style={{ height: "36px" }}
              >
                <div
                  className="relative p-1 flex items-center h-full"
                  style={{ backgroundColor: bgColor, width: "140px" }}
                >
                  <Handle
                    type="target"
                    id={`quantumHandleInput${i}${id}`}
                    position={Position.Left}
                    className={cn(
                      "z-10 !border-black -left-[6px] !rounded-none",
                      handleColor
                    )}
                    style={{ width: 12, height: 12 }}
                  />
                  <div className="flex flex-col items-start w-full leading-tight pl-3">
                    <span className="text-black text-[11px] font-medium">
                      {labelText}
                    </span>
                    <span className="text-gray-500 text-[9px]">
                      type: quantum register
                    </span>
                  </div>
                </div>

                <div
                  className="relative p-1 flex items-center h-full justify-end"
                  style={{ backgroundColor: bgColor, width: "140px" }}
                >
                  <div className="flex flex-col items-end w-full leading-tight pr-3">
                    <span className="text-black text-[11px] font-medium">
                      {labelText}
                    </span>
                    <span className="text-gray-500 text-[9px]">
                      type: quantum register
                    </span>
                  </div>
                  <Handle
                    type="source"
                    id={`quantumHandleOutput${i}${id}`}
                    position={Position.Right}
                    className={cn(
                      "z-10 !border-black -right-[6px] !rounded-none",
                      handleColor
                    )}
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});