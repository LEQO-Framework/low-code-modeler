import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor } from "@/constants";

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
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
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
}

export const PluginNode = memo((node: Node<PluginNodeData>) => {
  const { data, selected } = node;
  const { updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "Plugin");

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
  }, [dataInputs, dataOutputs]);

  const handleGap = 35;
  const handleOffset = 50;
  const maxHandles = Math.max(dataInputs.length, dataOutputs.length);
  const nodeHeight = Math.max(handleOffset * 2 + maxHandles * handleGap, 120);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => setSelectedNode(node)}
      className={cn(
        "rounded-lg border-2 shadow-md transition-all duration-200",
        selected ? "border-blue-500 shadow-lg" : "border-gray-300"
      )}
      style={{
        backgroundColor: classicalConstructColor,
        minWidth: "280px",
        minHeight: `${nodeHeight}px`,
        padding: "12px",
      }}
    >
      {/* Header */}
      <div className="mb-3 border-b border-gray-300 pb-2">
        {isEditingLabel ? (
          <input
            type="text"
            value={editableLabel}
            onChange={(e) => setEditableLabel(e.target.value)}
            onBlur={handleLabelChange}
            onKeyDown={(e) => e.key === "Enter" && handleLabelChange()}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditingLabel(true)}
            className="text-sm font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            {data.label}
          </div>
        )}
        {data.pluginType && (
          <div className="text-xs text-gray-500 mt-1 px-2">
            Type: {data.pluginType}
          </div>
        )}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 px-2">
            {data.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {data.pluginDescription && (
        <div className="text-xs text-gray-600 mb-3 px-2 line-clamp-2">
          {data.pluginDescription}
        </div>
      )}

      {/* Clustering Algorithm Dropdown for k-means nodes */}
      {(data.pluginName === 'classical-k-means' || data.pluginName === 'quantum-k-means') && (
        <div className="mb-3 px-2">
          <label className="text-xs text-gray-700 font-medium">Algorithm:</label>
          <select
            className="w-full p-1 mt-1 bg-white text-xs text-gray-800 border border-gray-300 rounded"
            value={data.clusteringAlgorithm || 'k-means'}
            onChange={(e) => {
              node.data.clusteringAlgorithm = e.target.value;
              updateNodeValue(node.id, 'clusteringAlgorithm', e.target.value);
            }}
          >
            <option value="k-means">K-Means (Default)</option>
            <option value="k-medoids">K-Medoids</option>
          </select>
        </div>
      )}

      {/* Input Handles */}
      {dataInputs.map((input, index) => (
        <div key={`input-${index}`}>
          <Handle
            type="target"
            position={Position.Left}
            id={`classicalHandle-plugin-input-${input.parameter}-${node.id}`}
            style={{
              top: handleOffset + index * handleGap,
              left: -6,
              width: 12,
              height: 12,
              backgroundColor: input.required ? "#ef4444" : "#3b82f6",
              border: "2px solid white",
            }}
          />
          <div
            className="text-xs absolute left-2 text-gray-700 font-medium"
            style={{ top: handleOffset + index * handleGap - 8 }}
          >
            {input.parameter}
            {input.required && <span className="text-red-500">*</span>}
          </div>
          <div
            className="text-xs absolute left-2 text-gray-500"
            style={{ top: handleOffset + index * handleGap + 6 }}
          >
            {input.data_type}
          </div>
        </div>
      ))}

      {/* Output Handles */}
      {dataOutputs.map((output, index) => (
        <div key={`output-${index}`}>
          <Handle
            type="source"
            position={Position.Right}
            id={`plugin-output-${index}-${node.id}`}
            style={{
              top: handleOffset + index * handleGap,
              right: -6,
              width: 12,
              height: 12,
              backgroundColor: output.required ? "#ef4444" : "#10b981",
              border: "2px solid white",
            }}
          />
          <div
            className="text-xs absolute right-2 text-gray-700 font-medium text-right"
            style={{ top: handleOffset + index * handleGap - 8 }}
          >
            {output.name || `Output ${index + 1}`}
            {output.required && <span className="text-red-500">*</span>}
          </div>
          <div
            className="text-xs absolute right-2 text-gray-500 text-right"
            style={{ top: handleOffset + index * handleGap + 6 }}
          >
            {output.data_type}
          </div>
        </div>
      ))}

      {/* Plugin Info Footer */}
      {data.pluginIdentifier && (
        <div className="mt-3 pt-2 border-t border-gray-300">
          <div className="text-xs text-gray-400 px-2 truncate">
            {data.pluginIdentifier}
          </div>
        </div>
      )}
    </motion.div>
  );
});

PluginNode.displayName = "PluginNode";
