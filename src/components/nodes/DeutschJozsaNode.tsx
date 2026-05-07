import { memo, useState } from "react";
import { Node } from "reactflow";
import { useStore } from "@/config/store"; 
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort"; 

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
});

export const DeutschJozsaNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode } = useStore(selector, shallow);

  const [numQubits, setNumQubits] = useState(data.numQubits || 3);
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

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: 400 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500"
          )}
          style={{ height: "400px" }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="PaletteIcon_DJ.png" 
                alt="DJ icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none" style={{ paddingLeft: '60px' }}>
                Deutsch-Jozsa
              </span>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-2">
            
            <div>
              <label className="text-xs font-semibold text-gray-700">Query Qubits (n):</label>
              <input
                type="number"
                min="1"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={numQubits}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setNumQubits(val);
                  handleChange("numQubits", val);
                }}
              />
            </div>

            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">Oracle Type:</label>
              <select
                className="w-full p-1 mt-1 bg-white rounded-full text-center text-sm text-black border-2 border-blue-200 outline-none focus:border-blue-400 transition-colors"
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
              <div className="mt-2">
                <label className="text-xs font-semibold text-gray-700">Balanced Mask:</label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                  value={balancedMask}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setBalancedMask(val);
                    handleChange("balancedMask", val);
                  }}
                />
              </div>
            ) : (
              <div className="mt-2">
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

          {/* NATIVE OUTPUT PORT */}
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