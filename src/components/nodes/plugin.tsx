import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor, quantumConstructColor } from "@/constants";
import OutputPort from "../utils/outputPort";
import {
  Atom, BrainCircuit, Layers, Activity, Share2,
  Grid, CircuitBoard, Combine, Boxes, BoxSelect,
  Focus, Split, Network, Cpu
} from "lucide-react";

// Plugin metadata types
interface PluginInputMetadata {
  parameter: string;
  data_type: string;
  content_type: string[];
  required: boolean;
}

interface PluginOutputMetadata {
  name?: string;
  data_type: string;
  content_type: string[];
  required: boolean;
}

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: any[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

interface PluginNodeData {
  label: string;
  pluginName?: string;
  pluginIdentifier?: string;
  pluginDescription?: string;
  pluginType?: string;
  pluginApiRoot?: string;
  dataInputs?: PluginInputMetadata[];
  dataOutputs?: PluginOutputMetadata[];
  tags?: string[];
  clusteringAlgorithm?: string;
  inputs?: any[];
  outputs?: any[];
}

export const PluginNode = memo((node: Node<PluginNodeData>) => {
  const { data, selected } = node;
  const { nodes, edges, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "Plugin");
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const dataInputs = data.dataInputs || [];
  const dataOutputs = data.dataOutputs || [];

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
  }, [dataInputs, dataOutputs, data.clusteringAlgorithm]);

  // Check if this is a clustering node (k-means)
  const isClusteringNode = data.pluginName === 'classical-k-means' || data.pluginName === 'quantum-k-means';

  // Check if this is a quantum plugin (for styling: blue + angular)
  const isQuantumPlugin = data.pluginName?.toLowerCase().includes('quantum') ||
                          data.label?.toLowerCase().includes('quantum') ||
                          ['qnn', 'vqc', 'hybrid-autoencoder'].includes(data.pluginName?.toLowerCase() || '');
  
  // Determine if an input is quantum or classical based on its parameter name                        
  const isQuantumIO = (param?: string) => {
    const p = (param ?? "").toLowerCase().trim();
    return p.startsWith("quantum");
  };

  const getIOKindForInput = (input: PluginInputMetadata) => {
    if (!isQuantumPlugin) return "classical";
    return isQuantumIO(input.parameter) ? "quantum" : "classical";
  };


  // Calculate dynamic height
  const baseHeight = 200;
  const inputHeight = 40;
  const outputHeight = 130;
  const dropdownHeight = isClusteringNode ? 60 : 0;
  const dynamicHeight = baseHeight + (dataInputs.length * inputHeight) + (dataOutputs.length > 0 ? outputHeight : 0) + dropdownHeight;

  // Render lucide icon based on plugin name
  const renderIcon = () => {
    const iconProps = { size: 32, className: "flex-shrink-0 text-gray-700" };
    const name = data.pluginName?.toLowerCase() || data.label?.toLowerCase() || '';

    // Quantum ML nodes
    if (name.includes('quantum') && name.includes('clustering') || name === 'quantum clustering') {
      return <Atom {...iconProps} />;
    }
    if (name === 'qnn') {
      return <BrainCircuit {...iconProps} />;
    }
    if (name === 'quantum-cnn' || name.includes('quantum-cnn')) {
      return <Layers {...iconProps} />;
    }
    if (name === 'vqc') {
      return <Activity {...iconProps} />;
    }
    if (name.includes('quantum-k-nearest') || name.includes('k-nearest-neighbour')) {
      return <Share2 {...iconProps} />;
    }
    if (name.includes('quantum-parzen') || name.includes('parzen-window')) {
      return <Grid {...iconProps} />;
    }
    if (name.includes('quantum-kernel') || name.includes('kernel-estimation')) {
      return <CircuitBoard {...iconProps} />;
    }
    if (name.includes('hybrid-autoencoder') || name.includes('autoencoder')) {
      return <Combine {...iconProps} />;
    }

    // Classical ML nodes
    if (name.includes('classical') && name.includes('clustering') || name === 'classical clustering') {
      return <Boxes {...iconProps} />;
    }
    if (name.includes('k-medoids') || name.includes('classical-k-medoids')) {
      return <BoxSelect {...iconProps} />;
    }
    if (name === 'optics') {
      return <Focus {...iconProps} />;
    }
    if (name === 'svm') {
      return <Split {...iconProps} />;
    }
    if (name === 'neural-network' || name.includes('neural-network')) {
      return <Network {...iconProps} />;
    }

    // Fallback
    return isQuantumPlugin ? <Atom {...iconProps} /> : <Cpu {...iconProps} />;
  };

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: dynamicHeight }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md overflow-hidden",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px`, borderRadius: isQuantumPlugin ? "0px" : "40px" }}
      >
        {/* Header */}
        <div className="w-full flex items-center" style={{ height: '52px' }}>
          <div
            className={cn(
              "w-full py-1 px-2 flex items-center",
              isQuantumPlugin ? "bg-blue-300" : "bg-orange-300"
            )}
            style={{
              height: "inherit",
              borderTopLeftRadius: isQuantumPlugin ? "0px" : "28px",
              borderTopRightRadius: isQuantumPlugin ? "0px" : "28px",
              overflow: "hidden",
              paddingLeft: '25px',
            }}
          >
            {renderIcon()}
            <div className="h-full w-[1px] bg-black mx-2" />
            {isEditingLabel ? (
              <input
                autoFocus
                type="text"
                value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                onBlur={handleLabelChange}
                onKeyDown={(e) => { if (e.key === "Enter") handleLabelChange(); }}
                className="font-semibold leading-none bg-white border border-gray-400 px-2 py-1 rounded"
                style={{ paddingLeft: "15px", width: "100%" }}
              />
            ) : (
              <span
                className="truncate font-semibold leading-none cursor-pointer"
                style={{ paddingLeft: '15px' }}
                onClick={() => setIsEditingLabel(true)}
              >
                {editableLabel}
              </span>
            )}
          </div>
        </div>

        {/* Algorithm Dropdown for clustering nodes */}
        {isClusteringNode && (
          <div className="px-3 py-1 mb-1">
            <label className="text-sm text-black">Algorithm:</label>
            <select
              className={cn(
                "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                isQuantumPlugin ? "border-blue-300 rounded-none" : "border-orange-300 rounded-full"
              )}
              value={data.clusteringAlgorithm || 'k-means'}
              onChange={(e) => {
                const newAlgorithm = e.target.value;
                node.data.clusteringAlgorithm = newAlgorithm;
                updateNodeValue(node.id, 'clusteringAlgorithm', newAlgorithm);

                // Update dataInputs based on selected algorithm
                const currentInputs = node.data.dataInputs || [];
                let newInputs;

                if (newAlgorithm === 'k-median') {
                  newInputs = currentInputs.filter((input: PluginInputMetadata) => input.parameter !== 'variant');
                } else {
                  const hasVariant = currentInputs.some((input: PluginInputMetadata) => input.parameter === 'variant');
                  if (!hasVariant) {
                    const variantInput = {
                      parameter: 'variant',
                      data_type: 'string',
                      content_type: ['text/plain'],
                      required: data.pluginName === 'quantum-k-means',
                    };
                    const clusterIdx = currentInputs.findIndex((input: PluginInputMetadata) => input.parameter === 'numberOfClusters');
                    newInputs = [...currentInputs];
                    newInputs.splice(clusterIdx + 1, 0, variantInput);
                  } else {
                    newInputs = currentInputs;
                  }
                }

                node.data.dataInputs = newInputs;
                updateNodeValue(node.id, 'dataInputs', newInputs);
                updateNodeInternals(node.id);
              }}
            >
              <option value="k-means">K-Means</option>
              <option value="k-median">K-Median</option>
            </select>
          </div>
        )}

        {/* Input Handles */}
        <div className="custom-node-port-in mb-3 mt-2">
          <div className="absolute flex flex-col overflow-visible">
            {dataInputs.map((input, index) => {
              const inputHandleId = `classicalHandlePluginInput${index}${node.id}`;
              const isInputConnected = edges.some(edge => edge.targetHandle === inputHandleId);
              const ioKind = getIOKindForInput(input);
              const ioIsClassical = ioKind === "classical";

              return (
                <div
                  key={`input-${index}`}
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: ioIsClassical ? classicalConstructColor : quantumConstructColor,
                    width: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    borderTopRightRadius: ioIsClassical ? '20px' : '0px',
                    borderBottomRightRadius: ioIsClassical ? '20px' : '0px',
                  }}
                >
                  <Handle
                    type="target"
                    id={inputHandleId}
                    position={Position.Left}
                    className={cn(
                      "z-10 -left-[8px]",
                      input.required || isInputConnected
                        ? ioIsClassical
                          ? "classical-circle-port-operation !bg-orange-300 !border-black"
                          : "circle-port-op !bg-blue-300 !border-black"            
                        : ioIsClassical
                          ? "classical-circle-port-operation !bg-gray-200 !border-dashed !border-gray-500"
                          : "circle-port-op !bg-gray-200 !border-dashed !border-gray-500"                          
                    )}
                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <div className="w-full flex flex-col items-center leading-tight">
                    <span className="text-black text-sm text-center w-full">
                      {node.data.inputs?.[index]?.outputIdentifier || input.parameter}
                    </span>
                    <span className="text-black text-xs opacity-80 text-center w-full">
                      type: {input.data_type}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Output Port */}
            {dataOutputs.length > 0 && (
              <div
                className="relative p-2 mb-1 overflow-visible"
                style={{
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  left: "132px"
                }}
              >
                <OutputPort
                  node={node}
                  index={0}
                  type={"classical"}
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
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PluginNode.displayName = "PluginNode";
