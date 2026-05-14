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
  numControls: number;
  numTargets: number;
  parameter: number;
};

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const MCMTGateNode = memo((node: Node<MCMTGateNodeData>) => {
  const { id, data, selected } = node;
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeValue, setSelectedNode } = useStore(selector, shallow);

  const numControls = parseInt(data.numControls as any, 10) || 1;
  const numTargets = parseInt(data.numTargets as any, 10) || 1;
  const baseGate = data.baseGate || "X";
  const parameter = data.parameter || 0;

  const totalHandles = numControls + numTargets;
  const hasParameter = ["RX", "RY", "RZ"].includes(baseGate);

  // Dynamic Height Calculation
  const headerHeight = 52;
  const formHeight = hasParameter ? 230 : 160;
  const handlesHeight = totalHandles * 44; // 36px height + 8px gap per row
  const dynamicHeight = headerHeight + formHeight + handlesHeight + 20;

  useEffect(() => {
    updateNodeInternals(id);
  }, [numControls, numTargets, id, updateNodeInternals]);

  const gateOptions = ["X", "Y", "Z", "H", "RX", "RY", "RZ", "S", "SDG", "T", "TDG"];

  const handleChange = (field: string, value: any) => {
    (data as any)[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: dynamicHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative flex flex-col",
            selected && "border-blue-500"
          )}
          style={{ height: `${dynamicHeight}px` }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              
              <img
                src="PaletteIcon_MCMT.svg" 
                alt="Grover icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />

              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none" style={{ paddingLeft: '65px' }}>
                {data.label || "MCMT Gate"}
              </span>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-2">
            
            <div>
              <label className="text-xs font-semibold text-gray-700">Base Gate:</label>
              <select
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={baseGate}
                onChange={(e) => handleChange("baseGate", e.target.value)}
              >
                {gateOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {hasParameter && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-700">Angle (θ):</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={parameter}
                  onChange={(e) => handleChange("parameter", parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="flex gap-4 mt-3">
              <div className="w-1/2">
                <label className="text-xs font-semibold text-center text-gray-700">Controls:</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={numControls}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    handleChange("numControls", val);
                  }}
                />
              </div>
              <div className="w-1/2">
                <label className="text-xs font-semibold text-center text-gray-700">Targets:</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={numTargets}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    handleChange("numTargets", val);
                  }}
                />
              </div>
            </div>

          </div>

          {/* ORACLE-STYLE DYNAMIC HANDLES */}
          <div className="w-full mt-3 flex flex-col space-y-2 flex-grow pb-4">
            {Array.from({ length: totalHandles }).map((_, i) => {
              const isControl = i < numControls;
              const bgColor = isControl ? "rgba(156, 163, 175, 0.2)" : quantumConstructColor;
              const handleColor = isControl ? "!bg-gray-700" : "!bg-blue-300";
              const labelText = isControl ? `Ctrl ${i}` : `Target ${i - numControls}`;

              return (
                <div key={`handle-row-${i}`} className="w-full flex justify-between items-center relative" style={{ height: '36px' }}>
                  
                  {/* LEFT SIDE (Input Rectangle) */}
                  <div
                    className="relative p-1 flex items-center h-full"
                    style={{
                      backgroundColor: bgColor,
                      width: '140px',
                    }}
                  >
                    <Handle
                      type="target"
                      id={`quantumHandleInput${i}${id}`}
                      position={Position.Left}
                      // Added !rounded-none to make the handles perfect squares!
                      className={cn("z-10 !border-black -left-[6px] !rounded-none", handleColor)}
                      style={{ width: 12, height: 12 }}
                    />
                    <div className="flex flex-col items-start w-full leading-tight pl-3">
                      <span className="text-black text-[11px] font-medium">{labelText} In</span>
                      <span className="text-gray-500 text-[9px]">type: quantum register</span>
                    </div>
                  </div>

                  {/* RIGHT SIDE (Output Rectangle) */}
                  <div
                    className="relative p-1 flex items-center h-full justify-end"
                    style={{
                      backgroundColor: bgColor,
                      width: '140px',
                    }}
                  >
                    <div className="flex flex-col items-end w-full leading-tight pr-3">
                      <span className="text-black text-[11px] font-medium">{labelText} Out</span>
                      <span className="text-gray-500 text-[9px]">type: quantum register</span>
                    </div>
                    <Handle
                      type="source"
                      id={`quantumHandleOutput${i}${id}`}
                      position={Position.Right}
                      className={cn("z-10 !border-black -right-[6px] !rounded-none", handleColor)}
                      style={{ width: 12, height: 12 }}
                    />
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </motion.div>
  );
});
