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
  
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);
  const [paramError, setParamError] = useState(false);

  useEffect(() => {
    const identifier = data.outputIdentifier || "";
    const duplicates = findDuplicateOutputIdentifiers(nodes, id);
    const isDuplicate = duplicates.has(identifier);
    const startsWithDigit = /^\d/.test(identifier);

    setOutputIdentifierError(isDuplicate && identifier !== "");
    setStartsWithDigitError(startsWithDigit);
  }, [nodes, id, data.outputIdentifier]);

  useEffect(() => {
    const getConnectedValue = (handleId: string) => {
      const edge = edges.find((e: Edge) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      return sourceNode ? sourceNode.data.value : null;
    };

    const rawGamma = getConnectedValue(`classicalHandleQAOAInput1${id}`);
    const rawBeta = getConnectedValue(`classicalHandleQAOAInput2${id}`);

    const strGamma = rawGamma != null ? (Array.isArray(rawGamma) ? rawGamma.join(",") : String(rawGamma)) : "";
    const strBeta = rawBeta != null ? (Array.isArray(rawBeta) ? rawBeta.join(",") : String(rawBeta)) : "";

    if (data.gamma !== strGamma) {
      updateNodeValue(id, "gamma", strGamma);
    }
    if (data.beta !== strBeta) {
      updateNodeValue(id, "beta", strBeta);
    }

    const parseLength = (val: any) => {
      if (val == null || val === "") return 0;
      if (Array.isArray(val)) return val.length;
      return String(val).split(",").filter((x: string) => x.trim() !== "").length;
    };

    const gammaLen = parseLength(rawGamma);
    const betaLen = parseLength(rawBeta);

    const gammaMismatch = rawGamma != null && strGamma !== "" && gammaLen !== p;
    const betaMismatch = rawBeta != null && strBeta !== "" && betaLen !== p;

    setParamError(gammaMismatch || betaMismatch);
  }, [edges, nodes, id, p, data.gamma, data.beta, updateNodeValue]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, p, updateNodeInternals]);

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  const dynamicHeight = 550; 
  const classicalInputLabel =
  problem === "Max2SAT" ? "Clauses" : "Edges";

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: dynamicHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onAnimationComplete={() => updateNodeInternals(id)}
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
                {paramError && <div>• Parameter array length does not match layer count (p).</div>}
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="patterns/qaoa_icon.png"
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

            {/* CLASSICAL REGISTER INPUT PORTS */}
            <div className="relative left-0 w-full flex flex-col gap-2 justify-start mt-2">

              {/* Edges Port */}
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
                  marginLeft: '-16px'
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleQAOAInput0${id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[6px]"
                  style={{ width: 12, height: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-sm">{classicalInputLabel}</span>
                  <span className="text-[10px] text-gray-600">type: array</span>
                </div>
              </div>

              {/* Gamma Port */}
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
                  marginLeft: '-16px'
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleQAOAInput1${id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[6px]"
                  style={{ width: 12, height: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-sm">Gamma (γ)</span>
                  <span className="text-[10px] text-gray-600">type: array</span>
                </div>
              </div>

              {/* Beta Port */}
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
                  marginLeft: '-16px'
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandleQAOAInput2${id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[6px]"
                  style={{ width: 12, height: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-sm">Beta (β)</span>
                  <span className="text-gray-600 text-[9px]">type: array</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT PORT: Quantum Output Register */}
          <div className="custom-node-port-out absolute bottom-16 right-0 top-[400px]">
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
