import { memo, useState, useEffect } from "react";
import { Node } from "reactflow";
import { useStore } from "@/config/store"; 
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort"; 
import { awareness } from "@/yjs";

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
  experienceLevel: state.experienceLevel
});

export const DeutschJozsaNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode, experienceLevel } = useStore(selector, shallow);

  const [numQubitsStr, setNumQubitsStr] = useState(String(data.numQubits || 3));
  const [oracleType, setOracleType] = useState(data.oracleType || "balanced");
  const [balancedMaskStr, setBalancedMaskStr] = useState(String(data.balancedMask || 5));
  const [constantValue, setConstantValue] = useState(data.constantValue ?? 0);
  
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Dynamic context state tracking for room collaborative view states
  const [mixedView, setMixedView] = useState(false);
  const [hasPioneerUser, setHasPioneerUser] = useState(false);
  const [hasExplorerUser, setHasExplorerUser] = useState(false);

  // Monitor awareness states for active users and their selected roles/experience levels
  useEffect(() => {
    const checkUserRoles = () => {
      const states = awareness.getStates();
      let hasPioneer = false;
      let hasExplorer = false;

      states.forEach((state: any) => {
        if (state.cursor) {
          const role = state.cursor.role?.toLowerCase();
          const expLevel = state.cursor.experienceLevel?.toLowerCase();

          if (role === "pioneer" || expLevel === "pioneer") {
            hasPioneer = true;
          }
          if (role === "explorer" || expLevel === "explorer") {
            hasExplorer = true;
          }
        }
      });

      setHasPioneerUser(hasPioneer);
      setHasExplorerUser(hasExplorer);
      setMixedView(hasPioneer && hasExplorer);
    };

    checkUserRoles();
    awareness.on("change", checkUserRoles);

    return () => {
      awareness.off("change", checkUserRoles);
    };
  }, []);

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
            selected && "border-blue-500",
            mixedView && "border-purple-400"
          )}
          style={{ height: "400px" }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="deutschJozsaIcon.png" 
                alt="DJ icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <div className="flex flex-col justify-center pl-2 leading-tight select-none w-full">
                {mixedView ? (
                  <span className="font-semibold text-xs text-blue-900 block">
                    P: Deutsch-Jozsa / E: Function Checker
                  </span>
                ) : experienceLevel === "explorer" ? (
                  <span className="font-semibold text-sm">
                    Function Checker (Balanced/Constant)
                  </span>
                ) : (
                  <span className="font-semibold text-sm">
                    Deutsch-Jozsa Algorithm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-2">
            
            {/* NUMBER OF QUBITS / INPUT SIZE */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                {mixedView ? (
                  "Number of Qubits / Input Size (Bits):"
                ) : experienceLevel === "explorer" ? (
                  "Input Size (Bits):"
                ) : (
                  "Number of Qubits:"
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={numQubitsStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setNumQubitsStr(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    handleChange("numQubits", parsed);
                  }
                }}
              />
            </div>

            {/* ORACLE TYPE / BEHAVIOR TYPE */}
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">
                {mixedView ? (
                  "Oracle Type / Behavior Type:"
                ) : experienceLevel === "explorer" ? (
                  "Behavior Type:"
                ) : (
                  "Oracle Type:"
                )}
              </label>
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
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 5"
                  className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                  value={balancedMaskStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setBalancedMaskStr(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      handleChange("balancedMask", parsed);
                    }
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