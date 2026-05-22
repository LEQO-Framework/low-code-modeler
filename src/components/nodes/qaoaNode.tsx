import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals, Edge } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import { AlertCircle } from "lucide-react";
import { findDuplicateOutputIdentifiers } from "../utils/utils";
import { classicalConstructColor } from "@/constants";

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  nodes: state.nodes,
  edges: state.edges,
});

export const QAOANode = memo((node: Node) => {
  const { id, data, selected } = node;
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeValue, setSelectedNode, nodes, edges } = useStore(selector, shallow);

  const [p, setP] = useState(data.p || 1);
  const [problem, setProblem] = useState(data.problem || "MaxCut");
  const [optimizer, setOptimizer] = useState(data.optimizer || "COBYLA");
  
  // Gamma and Beta state
  const [gamma, setGamma] = useState(data.gamma || "");
  const [beta, setBeta] = useState(data.beta || "");
  
  // Output Port State
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);
  const [paramError, setParamError] = useState(false);

  // Validate Output Identifier & Parameter Lengths
  useEffect(() => {
    const identifier = data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, id);
    const isDuplicate = duplicates.has(identifier);
    const startsWithDigit = /^\d/.test(identifier);

    setOutputIdentifierError(isDuplicate && identifier !== "");
    setStartsWithDigitError(startsWithDigit);
    
    // Validate comma-separated length matching circuit layer count p
    const parsedGammas = gamma.split(",").map(x => x.trim()).filter(Boolean);
    const parsedBetas = beta.split(",").map(x => x.trim()).filter(Boolean);
    
    const gammaMismatch = gamma.trim() !== "" && parsedGammas.length !== p;
    const betaMismatch = beta.trim() !== "" && parsedBetas.length !== p;
    setParamError(gammaMismatch || betaMismatch);
    
    updateNodeInternals(id);
  }, [nodes, data.outputIdentifier, id, updateNodeInternals, gamma, beta, p]);

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  const dynamicHeight = 570; 

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
          {/* Error Alerts Multi-Panel */}
          {(outputIdentifierError || startsWithDigitError || paramError) && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-2 rounded shadow min-w-[200px] flex flex-col gap-1">
                {startsWithDigitError && <div>• Identifier starts with a number.</div>}
                {outputIdentifierError && <div>• Identifier is not unique.</div>}
                {paramError && <div>• Parameter count mismatch with layers (p).</div>}
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="PaletteIcon_QAOA.svg"
                alt="QAOA icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none text-black" style={{ paddingLeft: '80px' }}>
                QAOA
              </span>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-2 mt-1 flex flex-col gap-3">
            
            {/* Problem Dropdown */}
            <div className="mt-1 flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Problem:</label>
              <select
                className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  handleChange("problem", e.target.value);
                }}
              >
                <option value="MaxCut">MaxCut</option>
                <option value="Max2SAT">Max-2-SAT</option>
                <option value="GraphColoring">Graph Coloring</option>
              </select>
            </div>

            {/* Optimizer Dropdown */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Optimizer:</label>
              <select
                className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={optimizer}
                onChange={(e) => {
                  setOptimizer(e.target.value);
                  handleChange("optimizer", e.target.value);
                }}
              >
                <option value="COBYLA">COBYLA</option>
                <option value="SPSA">SPSA</option>
                <option value="NELDER_MEAD">Nelder-Mead</option>
              </select>
            </div>

            {/* Layers (p) Input */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Layers (p):</label>
              <input
                type="number"
                min="1"
                className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={p}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setP(val);
                  handleChange("p", val);
                }}
              />
            </div>

            {/* Gamma Input */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Gamma (γ):</label>
              <input
                type="text"
                placeholder="e.g. 0.5, 1.2"
                className={cn(
                  "w-full p-1 text-sm text-center text-black border-2 rounded-full outline-none transition-colors",
                  gamma.trim() !== "" && gamma.split(",").map(x => x.trim()).filter(Boolean).length !== p
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-blue-200 focus:border-blue-400"
                )}
                value={gamma}
                onChange={(e) => {
                  setGamma(e.target.value);
                  handleChange("gamma", e.target.value);
                }}
              />
            </div>

            {/* Beta Input */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Beta (β):</label>
              <input
                type="text"
                placeholder="e.g. 0.2, 0.8"
                className={cn(
                  "w-full p-1 text-sm text-center text-black border-2 rounded-full outline-none transition-colors",
                  beta.trim() !== "" && beta.split(",").map(x => x.trim()).filter(Boolean).length !== p
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-blue-200 focus:border-blue-400"
                )}
                value={beta}
                onChange={(e) => {
                  setBeta(e.target.value);
                  handleChange("beta", e.target.value);
                }}
              />
            </div>

            {/* CLASSICAL REGISTER INPUT PORT (Moved below configuration blocks) */}
            <div className="relative left-0 w-full flex justify-start mt-2">
              <div
                className="relative p-2"
                style={{
                  backgroundColor: classicalConstructColor || "#fed7aa", 
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                  marginLeft: '-16px' // counteracts parent wrapper's px-4 alignment
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleQAOAInput0${id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-400 !border-black -left-[6px]"
                  style={{ width: 12, height: 12 }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-[12px] font-medium">Edges</span>
                  <span className="text-gray-600 text-[9px]">type: array</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PORT: Quantum Output Register */}
          <div className="custom-node-port-out absolute bottom-4 right-0">
            <OutputPort
              node={node}
              index={0}
              type={"quantum"}
              sizeRequired={false}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              sizeError={sizeError}
              outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
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
