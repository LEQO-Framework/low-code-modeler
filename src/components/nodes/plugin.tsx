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
  Focus, Split, Network, Cpu, File
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
  setNewEdges: (newEdges: any[]) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setNewEdges: state.setNewEdges,
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
  const { nodes, edges, updateNodeValue, setSelectedNode, setNewEdges } = useStore(selector, shallow);
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

  //display data_type
  const displayType = (dataType?: string) => {
    const dt = (dataType ?? "").toLowerCase().trim();
    if (dt === "int" || dt === "float") {
      return "number";
    } else if (dt === "string") {
      return "String";
    } else if (dt === "file" || dt.startsWith("entity/")) {
      return "File";
    } else {
      return dataType?.trim() ? dataType.trim() : "undefined";
    }
  }


  // Calculate dynamic height
  const baseHeight = 200;
  const inputHeight = 40;
  const outputHeight = 130;
  const dropdownHeight = isClusteringNode ? 60 : 0;
  const dynamicHeight = baseHeight + (dataInputs.length * inputHeight) + (dataOutputs.length > 0 ? outputHeight : 0) + dropdownHeight;

  // Render lucide icon based on plugin name
  const renderIcon = () => {
    const iconProps = {
      size: 32,
      className: "flex-shrink-0 text-gray-700",
      style: {
	background: "white",
	border: "1px solid black",
	borderRadius: isQuantumPlugin ? "0" : "25%",
      },
    };
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

                // Full input/output specs per algorithm
                const isQuantum = data.pluginName === 'quantum-k-means';
                const algorithmInputs: Record<string, PluginInputMetadata[]> = {
                  'k-means': [
                    { parameter: 'entityPointsUrl', data_type: 'entity/vector', content_type: ['application/json', 'text/csv'], required: true },
                    { parameter: 'numberOfClusters', data_type: 'int', content_type: ['text/plain'], required: true },
                    { parameter: 'variant', data_type: 'string', content_type: ['text/plain'], required: isQuantum },
                    { parameter: 'tolerance', data_type: 'float', content_type: ['text/plain'], required: false },
                    { parameter: 'maxIterations', data_type: 'int', content_type: ['text/plain'], required: false },
                  ],
                  'k-median': [
                    { parameter: 'entityPointsUrl', data_type: 'entity/vector', content_type: ['application/json', 'text/csv'], required: true },
                    { parameter: 'numberOfClusters', data_type: 'int', content_type: ['text/plain'], required: true },
                    { parameter: 'tolerance', data_type: 'float', content_type: ['text/plain'], required: false },
                    { parameter: 'maxIterations', data_type: 'int', content_type: ['text/plain'], required: false },
                  ],
                  'k-medoids': [
                    { parameter: 'entityPointsUrl', data_type: 'entity/vector', content_type: ['application/json', 'text/csv'], required: true },
                    { parameter: 'numberOfClusters', data_type: 'int', content_type: ['text/plain'], required: true },
                    { parameter: 'tolerance', data_type: 'float', content_type: ['text/plain'], required: false },
                    { parameter: 'maxIterations', data_type: 'int', content_type: ['text/plain'], required: false },
                  ],
                };
                const algorithmOutputs: Record<string, PluginOutputMetadata[]> = {
                  'k-means': [
                    { name: 'Cluster Labels', data_type: 'entity/label', content_type: ['application/json'], required: true },
                    { name: 'Visualization', data_type: 'plot', content_type: ['text/html'], required: false },
                  ],
                  'k-median': [
                    { name: 'Cluster Labels', data_type: 'entity/label', content_type: ['application/json'], required: true },
                  ],
                  'k-medoids': [
                    { name: 'Cluster Labels', data_type: 'entity/label', content_type: ['application/json'], required: true },
                  ],
                };

                const oldInputs: PluginInputMetadata[] = node.data.dataInputs || [];
                const oldOutputs: PluginOutputMetadata[] = node.data.dataOutputs || [];
                const newInputs = algorithmInputs[newAlgorithm] || oldInputs;
                const newOutputs = algorithmOutputs[newAlgorithm] || oldOutputs;

                // Build parameter-name to old/new index maps
                const oldParamToIndex: Record<string, number> = {};
                oldInputs.forEach((inp, i) => { oldParamToIndex[inp.parameter] = i; });
                const newParamToIndex: Record<string, number> = {};
                newInputs.forEach((inp, i) => { newParamToIndex[inp.parameter] = i; });

                // Helper: extract handle index from handle id
                const extractIndex = (handleId: string): number | null => {
                  const prefix = handleId.split(node.id)[0];
                  if (!prefix) return null;
                  const m = prefix.match(/\d+$/);
                  return m ? parseInt(m[0], 10) : 0;
                };

                // Remap edges
                const removedEdgeIds = new Set<string>();
                const updatedEdges = edges.map(edge => {
                  // Remap input edges (edges targeting this node)
                  if (edge.target === node.id && edge.targetHandle) {
                    const oldIdx = extractIndex(edge.targetHandle);
                    if (oldIdx === null) return edge;
                    const oldParam = oldInputs[oldIdx]?.parameter;
                    if (oldParam && newParamToIndex[oldParam] !== undefined) {
                      const newIdx = newParamToIndex[oldParam];
                      return { ...edge, targetHandle: `classicalHandlePluginInput${newIdx}${node.id}` };
                    } else {
                      removedEdgeIds.add(edge.id);
                      return edge;
                    }
                  }
                  // Remap output edges (edges originating from this node)
                  if (edge.source === node.id && edge.sourceHandle) {
                    const oldIdx = extractIndex(edge.sourceHandle);
                    if (oldIdx === null) return edge;
                    if (oldIdx >= newOutputs.length) {
                      removedEdgeIds.add(edge.id);
                      return edge;
                    }
                    return edge;
                  }
                  return edge;
                }).filter(edge => !removedEdgeIds.has(edge.id));

                // Clean node.data.inputs: remove entries for deleted edges
                const cleanedInputs = (node.data.inputs || []).filter(
                  (inp: any) => !removedEdgeIds.has(inp.edgeId)
                );

                // Apply all updates
                node.data.clusteringAlgorithm = newAlgorithm;
                node.data.dataInputs = newInputs;
                node.data.dataOutputs = newOutputs;
                node.data.inputs = cleanedInputs;

                updateNodeValue(node.id, 'clusteringAlgorithm', newAlgorithm);
                updateNodeValue(node.id, 'dataInputs', newInputs);
                updateNodeValue(node.id, 'dataOutputs', newOutputs);
                updateNodeValue(node.id, 'inputs', cleanedInputs);
                setNewEdges(updatedEdges);
                updateNodeInternals(node.id);
              }}
            >
              <option value="k-means">K-Means</option>
              <option value="k-median">K-Median</option>
              {data.pluginName === 'classical-k-means' && (
                <option value="k-medoids">K-Medoids</option>
              )}
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
                      type: {displayType(input.data_type)}
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
