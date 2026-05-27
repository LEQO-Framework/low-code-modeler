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

export const VQENode = memo((node: Node) => {
  const { id, data, selected } = node;
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeValue, setSelectedNode, nodes, edges } = useStore(selector, shallow);

  const [numQubits, setNumQubits] = useState(data.numQubits || 2);
  const [layers, setLayers] = useState(data.layers || 1);
  const [ansatz, setAnsatz] = useState(data.ansatz || "HardwareEfficient");
  const [optimizer, setOptimizer] = useState(data.optimizer || "ParameterShift");
  
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);

  useEffect(() => {
    const identifier = data.outputIdentifier || "";
    const duplicates = findDuplicateOutputIdentifiers(nodes, id);
    const isDuplicate = duplicates.has(identifier);
    const startsWithDigit = /^\d/.test(identifier);

    setOutputIdentifierError(isDuplicate && identifier !== "");
    setStartsWithDigitError(startsWithDigit);
  }, [nodes, id, data.outputIdentifier]);

  // Sync classical incoming edge values into node state
  useEffect(() => {
    const getConnectedValue = (handleId: string) => {
      const edge = edges.find((e: Edge) => e.target === id && e.targetHandle === handleId);
      if (!edge) return null;
      const sourceNode = nodes.find((n: Node) => n.id === edge.source);
      return sourceNode ? sourceNode.data.value : null;
    };

    const rawParams = getConnectedValue(`classicalHandleVQEInput0${id}`);
    const rawObservable = getConnectedValue(`classicalHandleVQEInput1${id}`);

    const strParams = rawParams != null ? (Array.isArray(rawParams) ? rawParams.join(",") : String(rawParams)) : "";
    const strObservable = rawObservable != null ? (Array.isArray(rawObservable) ? rawObservable.join(",") : String(rawObservable)) : "";

    if (data.parameters !== strParams) updateNodeValue(id, "parameters", strParams);
    if (data.observable !== strObservable) updateNodeValue(id, "observable", strObservable);
  }, [edges, nodes, id, updateNodeValue]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, layers, numQubits, updateNodeInternals]);

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  const dynamicHeight = 490; 

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
          {/* Error Alerts */}
          {(outputIdentifierError || startsWithDigitError) && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-2 rounded shadow min-w-[200px] flex flex-col gap-1">
                {startsWithDigitError && <div>• Identifier starts with a number.</div>}
                {outputIdentifierError && <div>• Identifier is not unique.</div>}
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="PaletteIcon_VQE.svg"
                alt="VQE icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
                />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none text-black" style={{ paddingLeft: '80px' }}>
                VQE
              </span>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-2 mt-1 flex flex-col gap-3">
            
            {/* Ansatz Dropdown */}
            <div className="mt-1 flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Ansatz:</label>
              <select
                className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400"
                value={ansatz}
                onChange={(e) => { setAnsatz(e.target.value); handleChange("ansatz", e.target.value); }}
              >
                <option value="HardwareEfficient">Hardware-Efficient (Ry/Cx)</option>
                <option value="RyRz">RyRz</option>
              </select>
            </div>

            {/* Optimizer Dropdown */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="text-xs font-semibold text-gray-700 text-center mb-1">Optimizer:</label>
              <select
                className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400"
                value={optimizer}
                onChange={(e) => { setOptimizer(e.target.value); handleChange("optimizer", e.target.value); }}
              >
                <option value="ParameterShift">Parameter-Shift Rule (QPU gradient)</option>
                <option value="COBYLA">COBYLA (Derivative-free)</option>
                <option value="SPSA">SPSA (Stochastic approximation)</option>
              </select>
            </div>

            {/* Qubits & Layers */}
            <div className="flex flex-row items-center justify-center w-full gap-2">
                <div className="flex flex-col items-center justify-center w-full">
                <label className="text-xs font-semibold text-gray-700 text-center mb-1">Qubits (n):</label>
                <input
                    type="number" min="1"
                    className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={numQubits}
                    onChange={(e) => { const val = parseInt(e.target.value, 10) || 1; setNumQubits(val); handleChange("numQubits", val); }}
                />
                </div>
                <div className="flex flex-col items-center justify-center w-full">
                <label className="text-xs font-semibold text-gray-700 text-center mb-1">Layers (p):</label>
                <input
                    type="number" min="1"
                    className="w-full p-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={layers}
                    onChange={(e) => { const val = parseInt(e.target.value, 10) || 1; setLayers(val); handleChange("layers", val); }}
                />
                </div>
            </div>

            {/* CLASSICAL PORTS */}
            <div className="relative left-0 w-full flex flex-col gap-2 justify-start mt-2">
              <div className="relative p-2" style={{ backgroundColor: classicalConstructColor, width: '130px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', marginLeft: '-16px' }}>
                <Handle
                  type="target" id={`classicalHandleVQEInput0${id}`} position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[6px]"
                  style={{ width: 12, height: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-[12px] font-medium">Parameters (θ)</span>
                  <span className="text-gray-600 text-[9px]">type: array</span>
                </div>
              </div>

              <div className="relative p-2" style={{ backgroundColor: classicalConstructColor, width: '130px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', marginLeft: '-16px' }}>
                <Handle
                  type="target" id={`classicalHandleVQEInput1${id}`} position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[6px]"
                  style={{ width: 12, height: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <div className="flex flex-col items-start w-full leading-tight pl-2">
                  <span className="text-black text-[12px] font-medium">Observable</span>
                  <span className="text-gray-600 text-[9px]">type: string</span>
                </div>
              </div>
            </div>
          </div>

          {/* QUANTUM OUTPUT PORT */}
          <div className="custom-node-port-out absolute bottom-4 right-0">
            <OutputPort
              node={node} index={0} type={"quantum"} sizeRequired={false}
              nodes={nodes} outputs={outputs} setOutputs={setOutputs} edges={edges}
              sizeError={sizeError} outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
              updateNodeValue={updateNodeValue} setOutputIdentifierError={setOutputIdentifierError}
              setSizeError={setSizeError} setSelectedNode={setSelectedNode} active={true}
            />
          </div>

        </div>
      </div>
    </motion.div>
  );
});
