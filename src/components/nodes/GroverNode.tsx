import { memo, useState, useEffect } from "react";
import { Node } from "reactflow";
import { useStore } from "@/config/store"; 
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort"; 
import { awareness } from "@/yjs"; // Imported the room awareness configuration

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
});

export const GroverNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode } = useStore(selector, shallow);

  const [numQubitsStr, setNumQubitsStr] = useState(String(data.numQubits || 3));
  const [targetStates, setTargetStates] = useState(data.targetStates || "");
  const [iterationsStr, setIterationsStr] = useState(data.numIterations ? String(data.numIterations) : "");
  
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Dynamic context state tracking for room collaborative view states
  const [mixedView, setMixedView] = useState(false);
  const [hasPioneerUser, setHasPioneerUser] = useState(false);
  const [hasExplorerUser, setHasExplorerUser] = useState(false);

  // Monitor awareness states for active users and their selected roles
  useEffect(() => {
    const checkUserRoles = () => {
      const states = awareness.getStates();
      let hasPioneer = false;
      let hasExplorer = false;

      states.forEach((state: any) => {
        if (state.cursor && state.cursor.role) {
          if (state.cursor.role === "pioneer") hasPioneer = true;
          if (state.cursor.role === "explorer") hasExplorer = true;
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
      animate={{ width: 320, height: 420 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500",
            mixedView && "border-purple-400"
          )}
          style={{ height: "420px" }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="groverIcon.png"
                alt="Grover icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <div className="flex flex-col justify-center pl-2 leading-tight select-none w-full">
                {mixedView ? (
                  <span className="font-semibold text-xs text-blue-900 block">
                    P: Grover's Algorithm / E: Search Element(s)
                  </span>
                ) : !hasPioneerUser && hasExplorerUser ? (
                  <span className="font-semibold text-sm">
                    Search Element(s)
                  </span>
                ) : (
                  <span className="font-semibold text-sm">
                    Grover's Algorithm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-3">
            
            {/* QUBITS / ELEMENTS FIELD */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                {mixedView ? (
                  "Number of Qubits / Number of Elements:"
                ) : !hasPioneerUser && hasExplorerUser ? (
                  "Number of Elements:"
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

            {/* TARGET STATES / ELEMENTS TO SEARCH FIELD */}
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">
                {mixedView ? (
                  "Marked States / Element(s) to Search:"
                ) : !hasPioneerUser && hasExplorerUser ? (
                  "Element(s) to Search:"
                ) : (
                  "Marked States (Comma-separated indices):"
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. 0, 3, 7"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={targetStates}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,\s]/g, "");
                  setTargetStates(val);
                  handleChange("targetStates", val);
                }}
              />
              <p className="text-[10px] text-gray-500 mt-1 text-center">
                Max index: {(1 << (parseInt(numQubitsStr, 10) || 1)) - 1}
              </p>
            </div>

            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">Iterations (Oracle + Diffusion):</label>
              <input
                type="text"
                placeholder="Auto"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={iterationsStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setIterationsStr(val);
                  handleChange("numIterations", val === "" ? "" : parseInt(val, 10));
                }}
              />
            </div>
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
