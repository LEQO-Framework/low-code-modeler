import { memo, useState } from "react";
import { Node, Handle, Position } from "reactflow";
import { useStore } from "@/config/store"; 
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort"; 
import { classicalConstructColor } from "@/constants";

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
});

export const DeutschJozsaNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode } = useStore(selector, shallow);

  const [oracleType, setOracleType] = useState(data.oracleType || "balanced");
  const [balancedMask, setBalancedMask] = useState(data.balancedMask || 5);
  const [constantValue, setConstantValue] = useState(data.constantValue ?? 0);
  
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  const impliedQubits = oracleType === "balanced" 
    ? Math.max(1, balancedMask.toString(2).length) 
    : 1;

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: 440 }} 
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500"
          )}
          style={{ height: "440px" }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="PaletteIcon_DJ.png" // Change this if you have a specific DJ icon!
                alt="DJ icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none" style={{ paddingLeft: '65px' }}>
                Deutsch-Jozsa
              </span>
            </div>
          </div>

          {/* CLASSICAL INPUT PORT (Orange/Yellow) */}
          <div className="mt-4 flex flex-col space-y-2">
            <div
              className="relative p-2"
              style={{
                backgroundColor: classicalConstructColor,
                width: '140px',
                borderTopRightRadius: '20px',
                borderBottomRightRadius: '20px',
              }}
            >
              <Handle
                type="target"
                id={`classicalHandleAlgorithmInput0${id}`}
                position={Position.Left}
                className="z-10 !bg-orange-300 !border-black -left-[8px]"
                style={{ width: 12, height: 12 }}
              />
              <div className="flex flex-col items-center w-full leading-tight pl-2">
                <span className="text-black text-[11px] font-medium">Oracle Params</span>
                <span className="text-[9px] text-gray-600">type: number</span>
              </div>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-4">
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">Oracle Type:</label>
              <select
                className="w-full p-2 mt-1 bg-white rounded-full text-center text-sm text-black border-2 border-blue-200 outline-none focus:border-blue-400 transition-colors"
                value={oracleType}
                onChange={(e) => {
                  setOracleType(e.target.value);
                  handleChange("oracleType", e.target.value);
                }}
              >
                <option value="balanced">Balanced</option>
                <option value="constant">Constant</option>
              </select>
            </div>

            {oracleType === "balanced" ? (
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700">Balanced Mask:</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                  value={balancedMask}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setBalancedMask(val);
                    handleChange("balancedMask", val);
                  }}
                />
                <div className="text-[10px] text-blue-500 mt-2 font-medium italic text-center">
                  Uses {impliedQubits} query qubits
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700">Constant Value:</label>
                <select
                  className="w-full p-2 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                  value={constantValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setConstantValue(val);
                    handleChange("constantValue", val);
                  }}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
            )}
          </div>

          {/* NATIVE OUTPUT PORT - Locked to bottom */}
          <div className="custom-node-port-out absolute bottom-4 right-0">
            <OutputPort
              node={node}
              index={0}
              type={"quantum"}
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
      </div>
    </motion.div>
  );
});