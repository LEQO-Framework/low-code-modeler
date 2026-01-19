import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor } from "@/constants";
import OutputPort from "../utils/outputPort";

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

  // Calculate dynamic height
  const baseHeight = 200;
  const inputHeight = 40;
  const outputHeight = 130;
  const dropdownHeight = isClusteringNode ? 60 : 0;
  const dynamicHeight = baseHeight + (dataInputs.length * inputHeight) + (dataOutputs.length > 0 ? outputHeight : 0) + dropdownHeight;

  // Get icon based on plugin name
  const getIcon = () => {
    if (data.pluginName?.includes('k-means')) {
      return '/plugin-icons/kmeans_icon.png';
    }
    return '/plugin-icons/quantum_clustering-thin.svg';
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
        style={{ height: `${dynamicHeight}px`, borderRadius: "40px" }}
      >
        {/* Header */}
        <div className="w-full flex items-center" style={{ height: '52px' }}>
          <div
            className="w-full bg-orange-300 py-1 px-2 flex items-center"
            style={{
              height: "inherit",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              overflow: "hidden",
              paddingLeft: '25px',
            }}
          >
            <img
              src={getIcon()}
              alt="icon"
              style={{ width: '45px', height: '45px' }}
              className="object-contain flex-shrink-0"
            />
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
              className="w-full p-1 mt-1 bg-white text-center text-lg text-black border-2 border-orange-300 rounded-full"
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
            {dataInputs.map((input, index) => (
              <div
                key={`input-${index}`}
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: classicalConstructColor,
                  width: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                }}
              >
                <Handle
                  type="target"
                  id={`classicalHandlePluginInput${index}${node.id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">
                  {node.data.inputs?.[index]?.outputIdentifier || input.parameter}
                  {input.required && <span className="text-red-500">*</span>}
                </span>
              </div>
            ))}

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
