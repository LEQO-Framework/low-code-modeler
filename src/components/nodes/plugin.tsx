import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { classicalConstructColor, quantumConstructColor } from "@/constants";
import OutputPort from "../utils/outputPort";
import { awareness } from "@/yjs";

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
  dataInputs?: PluginInputMetadata[];
  dataOutputs?: PluginOutputMetadata[];
  tags?: string[];
  clusteringAlgorithm?: string;
  inputs?: any[];
  outputs?: any[];
  initializationMethod?: string;
  algorithm?: string;
  variant?: string;
  minkowskiPValue: string;
  method: string;
  metric: string;
}

export const PluginNode = memo((node: Node<PluginNodeData>) => {
  const { data, selected } = node;
  const { nodes, edges, updateNodeValue, setSelectedNode, setNewEdges } =
    useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();

  const [_isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, _setEditableLabel] = useState(data.label || "Plugin");
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  console.log(data);
  const dataInputs = data.dataInputs || [];
  const dataOutputs = data.dataOutputs || [];

  console.log(dataInputs);

  useEffect(() => {
    updateNodeInternals(node.id);

    if (
      node.data.clusteringAlgorithm === "k-medoids" &&
      (!node.data.initializationMethod || !node.data.algorithm)
    ) {
      if (!node.data.initializationMethod) {
        updateNodeValue(node.id, "initializationMethod", "random");
      }

      if (!node.data.algorithm) {
        updateNodeValue(node.id, "algorithm", "pam");
      }
    }

    if (
      (node.data.label === "Quantum Clustering" ||
        node.data.label === "Classical Clustering") &&
      !node.data.clusteringAlgorithm
    ) {
      updateNodeValue(node.id, "clusteringAlgorithm", "k-means");
    }
  }, [
    node.id,
    node.data.clusteringAlgorithm,
    node.data.initializationMethod,
    node.data.algorithm,
  ]);
  // Check if this is a clustering node (k-means)
  const isClusteringNode =
    data.pluginName === "Classical Clustering" ||
    data.pluginName === "Quantum Clustering";

  // Check if this is a quantum plugin (for styling: blue + angular)
  const isQuantumPlugin =
    data.pluginName?.toLowerCase().includes("quantum") ||
    data.label?.toLowerCase().includes("quantum") ||
    [
      "quantum neural network",
      "varational quantum classifier",
      "hybrid autoencoder",
    ].includes(data.pluginName?.toLowerCase() || "");

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
  };

  const isKMedoids = data.clusteringAlgorithm === "k-medoids";
  const isOptics = data.clusteringAlgorithm === "optics";
  const kMedoidsExtraHeight = isKMedoids ? 102 : 0;
  const opticsExtraHeight = isOptics ? 250 : 0;

  // Calculate dynamic height
  const baseHeight = 200;
  const inputHeight = 40;
  const outputHeight = 130;
  const dropdownHeight = isClusteringNode ? 60 : 0;
  const dynamicHeight =
    baseHeight +
    dataInputs.length * inputHeight +
    (dataOutputs.length > 0 ? outputHeight : 0) +
    dropdownHeight +
    kMedoidsExtraHeight +
    opticsExtraHeight;

  // Render lucide icon based on plugin name
  const renderIcon = () => {
    const name =
      data.pluginName?.toLowerCase() || data.label?.toLowerCase() || "";

    // Quantum ML nodes
    if (
      (name.includes("quantum") && name.includes("clustering")) ||
      name === "quantum clustering"
    ) {
      return (
        <img
          src="quantumClusteringIcon.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (name === "quantum neural network") {
      return (
        <img
          src="qnnIcon.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (
      name === "quantum convolutional neural network" ||
      name.includes("quantum-cnn")
    ) {
      return (
        <img
          src="qcnnIcon.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (name === "variational quantum classifier") {
      return (
        <img
          src="variationalQuantumClassifier.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (
      name.includes("quantum k-nearest") ||
      name.includes("k-nearest-neighbour")
    ) {
      return (
        <img
          src="quantumKNearestNeighbor.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (name.includes("quantum parzen") || name.includes("parzen-window")) {
      return (
        <img
          src="quantumParzenWindow.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (
      name.includes("quantum kernel estimator") ||
      name.includes("kernel-estimation")
    ) {
      return (
        <img
          src="quantumKernelEstimator.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (name.includes("hybrid autoencoder") || name.includes("autoencoder")) {
      return (
        <img
          src="autoencoder.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }

    // Classical ML nodes
    if (
      (name.includes("classical") && name.includes("clustering")) ||
      name === "classical clustering"
    ) {
      return (
        <img
          src="clusteringIcon.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }

    if (name === "support vector machine") {
      return (
        <img
          src="supportVectorMachine.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }
    if (name === "neural network" || name.includes("neural-network")) {
      return (
        <img
          src="neuralNetwork.png"
          alt="icon"
          style={{ width: `${45}px`, height: `${45}px` }}
          className="object-contain flex-shrink-0"
        />
      );
    }

    // Fallback
    return isQuantumPlugin ? (
      <img
        src="quantumClusteringIcon.png"
        alt="icon"
        style={{ width: `${45}px`, height: `${45}px` }}
        className="object-contain flex-shrink-0"
      />
    ) : (
      <img
        src="clusteringIcon.png"
        alt="icon"
        style={{ width: `${45}px`, height: `${45}px` }}
        className="object-contain flex-shrink-0"
      />
    );
  };

  const id = node.id;

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any) => {
        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
        }
      });

      setRemoteHighlightColor(foundColor);
    };

    // Run once immediately on mount
    checkRemoteSelection();

    // 3. Listen to remote awareness updates
    awareness.on("change", checkRemoteSelection);

    // Clean up listener when the node unmounts
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]); // Re-run if node ID changes

  return (
    <div className="grand-parent" style={{ width: 320, height: dynamicHeight }}>
      <div
        className={
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md overflow-hidden"
        }
        style={{
          height: `${dynamicHeight}px`,
          borderRadius: isQuantumPlugin ? "0px" : "40px",
          borderColor: remoteHighlightColor
            ? remoteHighlightColor
            : selected
              ? "#3B82F6"
              : "#374151",
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
            : undefined,
        }}
      >
        {/* Header */}
        <div className="w-full flex items-center" style={{ height: "52px" }}>
          <div
            className={cn(
              "w-full py-1 px-2 flex items-center",
              isQuantumPlugin ? "bg-blue-300" : "bg-orange-300",
            )}
            style={{
              height: "inherit",
              borderTopLeftRadius: isQuantumPlugin ? "0px" : "28px",
              borderTopRightRadius: isQuantumPlugin ? "0px" : "28px",
              overflow: "hidden",
              paddingLeft: "25px",
            }}
          >
            {renderIcon()}
            <div className="h-full w-[1px] bg-black mx-2" />

            <span
              className="font-semibold leading-none cursor-pointer"
              style={{ paddingLeft: "15px" }}
              onClick={() => setIsEditingLabel(true)}
            >
              {editableLabel}
            </span>
          </div>
        </div>

        {/* Algorithm Dropdown for clustering nodes */}
        {isClusteringNode && !node.data.label.includes("Quantum") && (
          <div className="px-3 py-1 mb-1">
            <label className="text-sm text-black">Algorithm:</label>
            <select
              className={cn(
                "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                isQuantumPlugin
                  ? "border-blue-300 rounded-none"
                  : "border-orange-300 rounded-full",
              )}
              value={data.clusteringAlgorithm || "k-means"}
              onChange={(e) => {
                const newAlgorithm = e.target.value;

                // Full input/output specs per algorithm
                const algorithmInputs: Record<string, PluginInputMetadata[]> = {
                  "k-means": [
                    {
                      parameter: "entityPointsUrl",
                      data_type: "entity/vector",
                      content_type: ["application/json", "text/csv"],
                      required: true,
                    },
                    {
                      parameter: "numberOfClusters",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "maxIterations",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "relativeResidual",
                      data_type: "float",
                      content_type: ["text/plain"],
                      required: true,
                    },
                  ],
                  "k-medoids": [
                    {
                      parameter: "entityPointsUrl",
                      data_type: "entity/vector",
                      content_type: ["application/json", "text/csv"],
                      required: true,
                    },
                    {
                      parameter: "numberOfClusters",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "maxIterations",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "initializationMethod",
                      data_type: "string",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "algorithm",
                      data_type: "string",
                      content_type: ["text/plain"],
                      required: true,
                    },
                  ],
                  optics: [
                    {
                      parameter: "entityPointsUrl",
                      data_type: "entity/vector",
                      content_type: ["application/json", "text/csv"],
                      required: true,
                    },
                    {
                      parameter: "minClusterSize",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "leafSize",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },

                    {
                      parameter: "minSteepness",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "minSamples",
                      data_type: "int",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "maxDistance",
                      data_type: "float",
                      content_type: ["text/plain"],
                      required: true,
                    },
                    {
                      parameter: "epsilon",
                      data_type: "float",
                      content_type: ["text/plain"],
                      required: false,
                    },
                  ],
                };
                const algorithmOutputs: Record<string, PluginOutputMetadata[]> =
                  {
                    "k-means": [
                      {
                        name: "Cluster Labels",
                        data_type: "entity/label",
                        content_type: ["application/json"],
                        required: true,
                      },
                      {
                        name: "Visualization",
                        data_type: "plot",
                        content_type: ["text/html"],
                        required: false,
                      },
                    ],
                    "k-medoids": [
                      {
                        name: "Cluster Labels",
                        data_type: "entity/label",
                        content_type: ["application/json"],
                        required: true,
                      },
                    ],
                    optics: [
                      {
                        name: "Cluster Labels",
                        data_type: "entity/label",
                        content_type: ["application/json"],
                        required: true,
                      },
                    ],
                  };

                const oldInputs: PluginInputMetadata[] =
                  node.data.dataInputs || [];
                const oldOutputs: PluginOutputMetadata[] =
                  node.data.dataOutputs || [];
                const newInputs = algorithmInputs[newAlgorithm] || oldInputs;
                const newOutputs = algorithmOutputs[newAlgorithm] || oldOutputs;

                // Build parameter-name to old/new index maps
                const oldParamToIndex: Record<string, number> = {};
                oldInputs.forEach((inp, i) => {
                  oldParamToIndex[inp.parameter] = i;
                });
                const newParamToIndex: Record<string, number> = {};
                newInputs.forEach((inp, i) => {
                  newParamToIndex[inp.parameter] = i;
                });

                // Helper: extract handle index from handle id
                const extractIndex = (handleId: string): number | null => {
                  const prefix = handleId.split(node.id)[0];
                  if (!prefix) return null;
                  const m = prefix.match(/\d+$/);
                  return m ? parseInt(m[0], 10) : 0;
                };

                // Remap edges
                const removedEdgeIds = new Set<string>();
                const updatedEdges = edges
                  .map((edge) => {
                    // Remap input edges (edges targeting this node)
                    if (edge.target === node.id && edge.targetHandle) {
                      const oldIdx = extractIndex(edge.targetHandle);
                      if (oldIdx === null) return edge;
                      const oldParam = oldInputs[oldIdx]?.parameter;
                      if (oldParam && newParamToIndex[oldParam] !== undefined) {
                        const newIdx = newParamToIndex[oldParam];
                        return {
                          ...edge,
                          targetHandle: `classicalHandlePluginInput${newIdx}${node.id}`,
                        };
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
                  })
                  .filter((edge) => !removedEdgeIds.has(edge.id));

                // Clean node.data.inputs: remove entries for deleted edges
                const cleanedInputs = (node.data.inputs || []).filter(
                  (inp: any) => !removedEdgeIds.has(inp.edgeId),
                );

                // Apply all updates
                node.data.clusteringAlgorithm = newAlgorithm;
                node.data.dataInputs = newInputs;
                node.data.dataOutputs = newOutputs;
                node.data.inputs = cleanedInputs;

                updateNodeValue(node.id, "clusteringAlgorithm", newAlgorithm);
                updateNodeValue(node.id, "dataInputs", newInputs);
                updateNodeValue(node.id, "dataOutputs", newOutputs);
                updateNodeValue(node.id, "inputs", cleanedInputs);
                setNewEdges(updatedEdges);
                updateNodeInternals(node.id);
              }}
            >
              <option value="k-means">K-Means</option>

              {data.pluginName === "Classical Clustering" && (
                <div>
                  <option value="k-medoids">K-Medoids</option>
                  <option value="optics">OPTICS</option>
                </div>
              )}
            </select>
          </div>
        )}

        {isClusteringNode && data.clusteringAlgorithm === "optics" && (
          <div className="px-3 py-1 mb-2 space-y-2">
            <div>
              <label className="text-sm text-black">Method:</label>
              <select
                className={cn(
                  "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                  isQuantumPlugin
                    ? "border-blue-300 rounded-none"
                    : "border-orange-300 rounded-full",
                )}
                value={node.data.method || "xi"}
                onChange={(e) => {
                  updateNodeValue(node.id, "method", e.target.value);
                }}
              >
                <option value="xi">xi</option>
                <option value="dbscan">dbscan</option>
              </select>
            </div>
            {/* Method dropdown */}
            <div>
              <label className="text-sm text-black">Method:</label>
              <select
                className={cn(
                  "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                  isQuantumPlugin
                    ? "border-blue-300 rounded-none"
                    : "border-orange-300 rounded-full",
                )}
                value={node.data.metric || "dice"}
                onChange={(e) => {
                  updateNodeValue(node.id, "metric", e.target.value);
                }}
              >
                <option value="braycurtis">braycurtis</option>
                <option value="canberra">canberra</option>
                <option value="chebyshev">chebyshev</option>
                <option value="cityblock">cityblock</option>
                <option value="correlation">correlation</option>
                <option value="cosine">cosine</option>
                <option value="dice">dice</option>
                <option value="euclidean">euclidean</option>
                <option value="hamming">hamming</option>
                <option value="haversine">haversine</option>
                <option value="jaccard">jaccard</option>
                <option value="kulsinski">kulsinski</option>
                <option value="l1">l1</option>
                <option value="l2">l2</option>
                <option value="manhattan">manhattan</option>
                <option value="matching">matching</option>
                <option value="minkowski">minkowski</option>
                <option value="nan_euclidean">nan_euclidean</option>
                <option value="rogerstanimoto">rogerstanimoto</option>
                <option value="russellrao">russellrao</option>
                <option value="sokalmichener">sokalmichener</option>
                <option value="sokalsneath">sokalsneath</option>
                <option value="sqeuclidean">sqeuclidean</option>
                <option value="yule">yule</option>
              </select>
            </div>

            {/* Minkowski P value (only when needed) */}
            {node.data.metric === "minkowski" && (
              <div>
                <label className="text-sm text-black">Minkowski p-value:</label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  className={cn(
                    "w-full p-1 mt-1 text-center text-lg border-2",
                    isQuantumPlugin
                      ? "border-blue-300 rounded-none"
                      : "border-orange-300 rounded-full",
                  )}
                  value={node.data.minkowskiPValue || 2}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value)); // enforce p >= 1
                    updateNodeValue(node.id, "minkowskiPValue", val);
                  }}
                />
              </div>
            )}

            {/* Algorithm dropdown */}
            <div>
              <label className="text-sm text-black">Algorithm:</label>
              <select
                className={cn(
                  "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                  isQuantumPlugin
                    ? "border-blue-300 rounded-none"
                    : "border-orange-300 rounded-full",
                )}
                value={node.data.algorithm || "auto"}
                onChange={(e) => {
                  updateNodeValue(node.id, "algorithm", e.target.value);
                }}
              >
                <option value="auto">auto</option>
                <option value="kd_tree">kd_tree</option>
                <option value="ball_tree">ball_tree</option>
                <option value="brute">brute</option>
              </select>
            </div>
          </div>
        )}

        {isClusteringNode && data.clusteringAlgorithm === "k-medoids" && (
          <div className="px-3 py-1 mb-2 space-y-2">
            {/* Initialization Method */}
            <div>
              <label className="text-sm text-black">
                Initialization Method:
              </label>
              <select
                className={cn(
                  "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                  isQuantumPlugin
                    ? "border-blue-300 rounded-none"
                    : "border-orange-300 rounded-full",
                )}
                value={node.data.initializationMethod || "random"}
                onChange={(e) => {
                  updateNodeValue(
                    node.id,
                    "initializationMethod",
                    e.target.value,
                  );
                }}
              >
                <option value="build">Build</option>
                <option value="heuristic">Heuristic</option>
                <option value="random">Random</option>
                <option value="k-medoids++">K-Medoids++</option>
              </select>
            </div>

            {/* Algorithm */}
            <div>
              <label className="text-sm text-black">Algorithm:</label>
              <select
                className={cn(
                  "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                  isQuantumPlugin
                    ? "border-blue-300 rounded-none"
                    : "border-orange-300 rounded-full",
                )}
                value={node.data.algorithm || "pam"}
                onChange={(e) => {
                  updateNodeValue(node.id, "algorithm", e.target.value);
                }}
              >
                <option value="alternate">Alternate</option>
                <option value="pam">PAM</option>
              </select>
            </div>
          </div>
        )}

        {isClusteringNode &&
          data.clusteringAlgorithm === "k-means" &&
          node.data.label.includes("Quantum") && (
            <div className="px-3 py-1 mb-2 space-y-2">
              <div>
                <label className="text-sm text-black">Variant:</label>
                <select
                  className={cn(
                    "w-full p-1 mt-1 bg-white text-center text-lg text-black border-2",
                    isQuantumPlugin
                      ? "border-blue-300 rounded-none"
                      : "border-orange-300 rounded-full",
                  )}
                  value={node.data.variant || "negative_rotation"}
                  onChange={(e) => {
                    updateNodeValue(node.id, "variant", e.target.value);
                  }}
                >
                  <option value="destructive_interference">
                    Destructive Interference
                  </option>
                  <option value="positive_correlation">
                    Positive Correlation
                  </option>
                  <option value="negative_rotation">Negative Rotation</option>
                  <option value="state_prepartion">State Preparation</option>
                </select>
              </div>
            </div>
          )}

        {/* Input Handles */}
        <div className="custom-node-port-in mb-3 mt-2">
          <div className="absolute flex flex-col overflow-visible">
            {dataInputs.map((input, index) => {
              const inputHandleId = `classicalHandlePluginInput${index}${node.id}`;
              const isInputConnected = edges.some(
                (edge) => edge.targetHandle === inputHandleId,
              );
              const ioKind = getIOKindForInput(input);
              const ioIsClassical = ioKind === "classical";

              return (
                <div
                  key={`input-${index}`}
                  className="relative p-2 mb-1"
                  style={{
                    backgroundColor: ioIsClassical
                      ? classicalConstructColor
                      : quantumConstructColor,
                    width: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    borderTopRightRadius: ioIsClassical ? "20px" : "0px",
                    borderBottomRightRadius: ioIsClassical ? "20px" : "0px",
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
                          : "circle-port-op !bg-gray-200 !border-dashed !border-gray-500",
                    )}
                    style={{ top: "50%", transform: "translateY(-50%)" }}
                  />
                  <div className="w-full flex flex-col items-center leading-tight">
                    <span className="text-black text-sm text-center w-full">
                      {node.data.inputs?.[index]?.outputIdentifier ||
                        input.parameter}
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
                  left: "132px",
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
    </div>
  );
});

PluginNode.displayName = "PluginNode";
