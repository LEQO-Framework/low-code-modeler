import {
  Connection,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
  OnConnect,
  OnConnectEnd,
  OnEdgesChange,
  OnNodesChange,
  applyEdgeChanges,
  applyNodeChanges,
  getOutgoers,
} from "reactflow";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nodesConfig } from "./site";
import { v4 as uuid } from "uuid";
import * as consts from "../constants";
import {
  basePortType,
  getPortTypes,
  isCustomOperator,
  PORT_COUNT_FIELDS,
  portTypeIndex,
  toTypeArray,
} from "@/lib/portTypes";
import { Template } from "@/components/panels/categories";
import { DomainProfile } from "@/components/modals/domainProfileModal";

export type NodeData = {
  label: string;
  dataType: string;
  isInitial?: boolean;
};

export type NodeTypes = "customNodeComponent";

type HistoryItem = {
  nodes: Node[];
  edges: Edge[];
};

export const MAX_HISTORY_ENTRIES = 100;

/**
 * Adds a new state to the undo history.
 * Detects unchanged states based on the relevant node and edge data
 * and updates the existing history entry instead of adding a duplicate.
 */
export const appendHistory = (
  history: HistoryItem[],
  historyIndex: number,
  item: HistoryItem,
) => {
  const previousItem = history[historyIndex];
  if (
    previousItem &&
    JSON.stringify(getMeaningfulHistoryData(previousItem)) ===
      JSON.stringify(getMeaningfulHistoryData(item))
  ) {
    const nextHistory = [...history];
    [...history][historyIndex] = item;

    return {
      history: nextHistory,
      historyIndex,
    };
  }
  const nextHistory = [...history.slice(0, historyIndex + 1), item].slice(
    -MAX_HISTORY_ENTRIES,
  );
  return { history: nextHistory, historyIndex: nextHistory.length - 1 };
};

type RFState = {
  nodes: any;
  edges: Edge[];
  experienceLevel: string;
  compact: boolean;
  completionGuaranteed: boolean;
  containsPlaceholder: boolean;
  selectedNode: Node | null;
  history: HistoryItem[];
  historyIndex: number;
  redoStack: HistoryItem[];
  dragSnapshot: HistoryItem | null;
  pendingNodeInitializationId: string | null;
  isReplayingHistory: boolean;
  autoConnectOnEdgeDrop: boolean;
  autoConnectOnSameLine: boolean;
  typeError: string | null;
  userTemplates: Template[];
  domainProfile: string;
  allDomainProfiles: DomainProfile[];
  setDomainProfile: (domainProfile: string) => void;
  setTypeError: (message: string | null) => void;
  setNodes: (node: Node) => void;
  completeNodeInitialization: (nodeId: string) => void;
  setEdges: (edge: Edge) => void;
  setCompletionGuaranteed: (completionGuaranteed: boolean) => void;
  setContainsPlaceholder: (containsPlaceholder: boolean) => void;
  setCompact: (compact: boolean) => void;
  setExperienceLevel: (experienceLevel: string) => void;
  setNewEdges: (newEdges: Edge[]) => void;
  addUserTemplate: (template: Template) => void;
  setUserTemplates: (newTemplates: Template[]) => void;
  setAllDomainProfiles: (newProfiles: DomainProfile[]) => void;
  setAutoConnectOnEdgeDrop: (enabled: boolean) => void;
  setAutoConnectOnSameLine: (enabled: boolean) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectEnd: OnConnectEnd;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (nodeId: string, identifier, nodeVal: any) => void;
  updateNodeValues: (nodeId: string, values: Record<string, any>) => void;
  setSelectedNode: (node: Node | null) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  updateChildren: (nodeId: string, childIds: string[]) => void;
  undo: () => void;
  redo: () => void;
};
let typeErrorTimer: ReturnType<typeof setTimeout> | null = null;
const getHandleIndex = (nodeId: string, handleId: string) => {
  const tmpHandle = handleId.split(nodeId)[0];
  if (!tmpHandle) {
    return null;
  }
  const match = tmpHandle.match(/\d+$/);

  if (!match) {
    return 0; //no match --> only one handle --> index is 0
  }

  return parseInt(match[0], 10);
};

/**
 * Resolves the actual owner node of a handle from the ID embedded in the handle string
 * (e.g. "quantumHandleGateOutput0<nodeId>").
 *
 * This matters for groups: a group proxy handle belongs to the group as far as the DOM is
 * concerned (connection.source/target = groupId), but the ID embedded in the handle ID
 * belongs to the actual child node inside the group (see group.tsx:
 * outputHandleId = `quantumHandleGateOutput0${child.id}`). Without this resolution,
 * getNodeOutputType/getNodeInputType/getHandleIndex would wrongly look at the group
 * itself, whose data.outputTypes/inputTypes do not match the proxy handle indices of the
 * child nodes (or do not exist at all), which blocks every connection to or from a group
 * handle.
 */
const resolveHandleOwnerId = (
  nodes: Node[],
  fallbackNodeId: string,
  handleId?: string | null,
): string => {
  if (!handleId) return fallbackNodeId;
  const owner = nodes.find((n) => handleId.endsWith(n.id));
  return owner ? owner.id : fallbackNodeId;
};

function getMeaningfulHistoryData(item) {
  if (!item) return null;
  return {
    nodes: item.nodes.map((node) => ({
      id: node.id,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
    })),

    edges: item.edges.map((edge) => ({
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    })),
  };
}

// Zustand store with undo/redo logic
export const useStore = create<RFState>()(
  persist(
    (set, get) => ({
      nodes: nodesConfig.initialNodes,
      edges: nodesConfig.initialEdges,
      compact: false,
      completionGuaranteed: true,
      experienceLevel: "explorer",
      selectedNode: null,
      history: [],
      historyIndex: -1,
      redoStack: [],
      dragSnapshot: null,
      pendingNodeInitializationId: null,
      isReplayingHistory: false,
      autoConnectOnEdgeDrop: true,
      autoConnectOnSameLine: false,
      containsPlaceholder: false,
      typeError: null,
      userTemplates: [],
      domainProfile: "standard",
      allDomainProfiles: [],

      setDomainProfile: (domainProfile: string) => {
        set({
          domainProfile,
        });
      },

      setTypeError: (message: string | null) => {
        set({ typeError: message });
        // clear any existing timer to prevent premature clearing
        if (typeErrorTimer) {
          clearTimeout(typeErrorTimer);
        }
        // Start timer to clear typeError message automatically after 5 seconds
        if (message) {
          typeErrorTimer = setTimeout(() => {
            set({ typeError: null });
            typeErrorTimer = null;
          }, 3000);
        }
      },

      setSelectedNode: (node: Node | null) => {
        set({
          selectedNode: node,
        });
        console.log("rerender");
        if (node === null) {
          const selectedNode = get().nodes.find((n) => n.selected === true);
          if (selectedNode) {
            get().onNodesChange([
              {
                type: "select",
                id: selectedNode.id,
                selected: false,
              },
            ]);
          }
        }
      },

      setNodes: (node: Node) => {
        const currentNodes = get().nodes;
        const currentEdges = get().edges;
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(currentNodes),
          edges: structuredClone(currentEdges),
        };

        const uniqueIdentifier = `q${Math.floor(100000 + Math.random() * 900000)}`;
        node.data.identifiers = [uniqueIdentifier];
        console.log(node);
        const uniqueIdentifier2 = `q${Math.floor(100000 + Math.random() * 900000)}`;
        const uniqueIdentifier3 = `q${Math.floor(100000 + Math.random() * 900000)}`;
        //node.data.identifiers = uniqueIdentifier;
        if (node.type === "measurementNode") {
          node.data.indices = "";
          node.data.outputIdentifier = "";
        }

        if (node.type === "gateNode") {
          if (node.data.label === "Toffoli") {
            node.data.identifiers.push(uniqueIdentifier2);
            node.data.identifiers.push(uniqueIdentifier3);
          } else if (node.data.label === "CNOT") {
            node.data.identifiers.push(uniqueIdentifier2);
          }
        }

        if (node.type === consts.DataTypeNode) {
          node.data.dataType = node.data.label.toLowerCase();
          node.data.value = "";
          node.data.outputIdentifier = "";
        }

        if (
          node.type === "statePreparationNode" &&
          node.data.label === "Encode Value"
        ) {
          node.data.encodingType = "";
          node.data.bound = 0;
          node.data.size = "";
          node.data.outputIdentifier = "";
        }

        if (
          node.type === "statePreparationNode" &&
          node.data.label === "Prepare State"
        ) {
          node.data.quantumStateName = "";
          node.data.size = "";
          node.data.outputIdentifier = "";
        }
        if (node.type === "arithmeticOperatorNode") {
          node.data.operator = "";
          node.data.outputIdentifier = "";
        }
        // Map plugin data_type to internal type system
        const mapPluginTypeToInternal = (dataType: string): string => {
          const t = dataType.toLowerCase();
          if (t.startsWith("entity/")) return "file";
          if (t === "int") return "number";
          if (t === "float") return "number";
          if (t === "string") return "string";
          if (t === "plot") return "any";
          if (t === "model") return "file";
          return "any";
        };

        // Helper to get default types based on node type and label
        const getInitialInputTypes = (node: Node): string[] => {
          const type = node.type;
          const label = node.data.label ?? "";

          const fixed = getPortTypes(node);
          if (fixed) return fixed.inputTypes;

          if (type === "classicalOperatorNode") {
            if (label.includes("Bitwise")) return ["bit", "bit"];
            if (label.includes("Arithmetic")) return ["any", "any"];
            if (label.includes("Comparison")) return ["any", "any"];
            if (label.includes("Min & Max")) return ["array"];
          } else if (type === "measurementNode") return ["quantum register"];
          else if (type === "quantumOperatorNode") {
            if (label.includes("Min & Max")) return ["quantum register"];
            else return ["quantum register", "quantum register"];
          } else if (type === "statePreparationNode") {
            const encodingType = node.data.encodingType ?? "";
            console.log("encodingType", encodingType);
            if (
              encodingType.includes("Matrix") ||
              encodingType.includes("Amplitude") ||
              encodingType.includes("Angle") ||
              encodingType.includes("Schmidt")
            )
              return ["array"];
            if (
              encodingType.includes("Basis") ||
              encodingType.includes("Custom")
            )
              return ["any"];
          } else if (type === consts.PluginNode && node.data.dataInputs) {
            return node.data.dataInputs.map((input: any) =>
              mapPluginTypeToInternal(input.data_type ?? "any"),
            );
          } else if (type.includes("editable")) {
            const inputTypes = node.data.properties.map((p) => p.type);
            return inputTypes;
          }

          return []; // Default empty
        };
        const getInitialOutputTypes = (node: Node): string[] => {
          const type = node.type;
          const label = node.data.label ?? "";

          const fixed = getPortTypes(node);
          if (fixed) return fixed.outputTypes;

          if (type.includes("OperatorNode")) {
            if (label.includes("Comparison")) return ["boolean"];
            else if (label.includes("Min & Max")) return ["number"];
            else if (type.includes("quantum")) {
              if (label.includes("Bit")) return ["quantum register"];
              else if (label.includes("Arithmetic"))
                return ["quantum register"];
            } else if (type.includes("classical")) {
              if (label.includes("Bit")) return ["bit"];
              else if (label.includes("Arithmetic")) return ["any"];
            }
          } else if (type === "measurementNode")
            return ["array", "quantum register"];
          else if (
            type === "qubitNode" ||
            type === "ancillaNode" ||
            type === "statePreparationNode"
          )
            return ["quantum register"];
          else if (type === "dataTypeNode")
            return [(node.data.dataType ?? "any").toLowerCase()];
          else if (type === consts.PluginNode && node.data.dataOutputs) {
            return node.data.dataOutputs.map((output: any) =>
              mapPluginTypeToInternal(output.data_type ?? "any"),
            );
          } else if (type.includes("editable")) return [node.data.outputType];
          return []; // Default empty
        };
        const inputTypes = getInitialInputTypes(node);
        const outputTypes = getInitialOutputTypes(node);
        node.data.inputTypes = inputTypes;
        node.data.outputTypes = outputTypes;

        set({
          nodes: [...currentNodes, node],
          edges: currentEdges,
          ...appendHistory(get().history, get().historyIndex, newHistoryItem),
          redoStack: [],
          pendingNodeInitializationId: node.id,
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
        console.log(node);
      },

      completeNodeInitialization: (nodeId: string) => {
        set((state) =>
          state.pendingNodeInitializationId === nodeId
            ? { pendingNodeInitializationId: null }
            : state,
        );
      },

      setEdges: (edge: Edge) => {
        const currentNodes = get().nodes;
        const currentEdges = get().edges;
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(currentNodes),
          edges: structuredClone(currentEdges),
        };
        for (let edge of currentEdges) {
          edge.type = "quantumEdge";
        }

        console.log("Updating history (setEdges):");
        console.log("Current Nodes:", currentNodes);
        console.log("Current Edges:", currentEdges);
        console.log("New History Item:", newHistoryItem);

        set({
          nodes: currentNodes,
          edges: [...currentEdges, edge],
          ...appendHistory(get().history, get().historyIndex, newHistoryItem),
          redoStack: [],
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },
      setExperienceLevel: (experienceLevel: string) => {
        set({
          experienceLevel,
        });
      },
      setContainsPlaceholder: (containsPlaceholder: boolean) => {
        set({
          containsPlaceholder,
        });
      },
      setCompact: (compact: boolean) => {
        const currentNodes = get().nodes.map((node) => {
          let newNode = { ...node };

          // handle compact change
          if (
            compact &&
            (node.data.label === "Basis Encoding" ||
              node.data.label === "Angle Encoding" ||
              node.data.label === "Amplitude Encoding" ||
              node.data.label === "Custom Encoding" ||
              node.data.label === "Schmidt Decomposition" ||
              node.data.label === "Matrix Encoding")
          ) {
            newNode = {
              ...newNode,
              data: { ...newNode.data, label: "Encode Value" },
              hidden: false,
            };
          } else if (!compact && node.data.label === "Encode Value") {
            // Restore original encoding type when leaving compact mode
            const originalLabel = node.data.encodingType || "Encode Value";
            newNode = {
              ...newNode,
              data: { ...newNode.data, label: originalLabel },
              hidden: false,
            };
          } else {
            const hideNode = !node.data.compactOptions?.includes(compact);
            newNode = { ...newNode, hidden: hideNode };
          }

          return newNode;
        });

        const hiddenNodeIds = new Set(
          currentNodes.filter((n) => n.hidden).map((n) => n.id),
        );

        const currentEdges = get().edges.map((edge) => {
          if (
            hiddenNodeIds.has(edge.source) ||
            hiddenNodeIds.has(edge.target)
          ) {
            return { ...edge, hidden: true };
          }
          return { ...edge, hidden: false };
        });

        set({
          compact,
          nodes: currentNodes,
          edges: currentEdges,
        });
      },
      setCompletionGuaranteed: (completionGuaranteed: boolean) => {
        const currentNodes = get().nodes.map((node) => {
          if (!node.data.completionGuaranteed) {
            return { ...node, hidden: completionGuaranteed };
          }
          return { ...node, hidden: false };
        });
        const hiddenNodeIds = new Set(
          currentNodes.filter((n) => n.hidden).map((n) => n.id),
        );
        const currentEdges = get().edges.map((edge) => {
          if (
            hiddenNodeIds.has(edge.source) ||
            hiddenNodeIds.has(edge.target)
          ) {
            return { ...edge, hidden: true };
          }
          return { ...edge, hidden: false };
        });

        set({
          completionGuaranteed,
          edges: currentEdges,
          nodes: currentNodes,
        });
      },

      setNewEdges: (newEdges: Edge[]) => {
        const currentNodes = get().nodes;
        const currentEdges = get().edges;
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(currentNodes),
          edges: structuredClone(currentEdges),
        };

        console.log("Updating history (setEdges):");
        console.log("Current Nodes:", currentNodes);
        console.log("Current Edges:", currentEdges);
        console.log("New History Item:", newHistoryItem);

        set({
          nodes: currentNodes,
          edges: newEdges,
          ...appendHistory(get().history, get().historyIndex, newHistoryItem),
          redoStack: [],
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
        console.log(get().edges);
      },

      addUserTemplate: (template: Template) => {
        set({
          userTemplates: [...get().userTemplates, template],
        });
      },

      setUserTemplates: (newTemplates: Template[]) => {
        set({
          userTemplates: newTemplates,
        });
        console.log("after setting templates", get().userTemplates);
      },

      setAllDomainProfiles(newProfiles) {
        set({
          allDomainProfiles: newProfiles,
        });
        console.log("after setting templates", get().userTemplates);
      },

      setAutoConnectOnEdgeDrop: (enabled: boolean) => {
        set({ autoConnectOnEdgeDrop: enabled });
      },

      setAutoConnectOnSameLine: (enabled: boolean) => {
        set({ autoConnectOnSameLine: enabled });
      },

      onNodesChange: (changes: NodeChange[]) => {
        const state = get();
        const currentNodes = applyNodeChanges(changes, state.nodes);
        const currentEdges = get().edges;
        if (state.isReplayingHistory) {
          set({
            nodes: currentNodes,
            edges: currentEdges,
            dragSnapshot: null,
          });
          return;
        }
        const hasDraggingPosition = changes.some(
          (change) => change.type === "position" && change.dragging,
        );
        const hasDragEnd = changes.some(
          (change) => change.type === "position" && change.dragging === false,
        );
        const dragSnapshot =
          state.dragSnapshot ??
          (hasDraggingPosition
            ? {
                nodes: structuredClone(state.nodes),
                edges: structuredClone(currentEdges),
              }
            : null);
        console.log(currentNodes);
        const newHistoryItem: HistoryItem = {
          nodes: [...get().nodes], // Copy the nodes array to avoid mutation
          edges: [...currentEdges], // Copy the edges array to avoid mutation
        };
        console.log(changes);
        // Avoid unnecessary history updates if there are no changes
        const validChanges = changes.filter((change) => {
          if (change.type === "position" || change.type === "select") {
            return false; // Position history is committed once we end dragging
          }
          return true; // Keep other changes
        });

        if (validChanges.length === 0) {
          if (dragSnapshot && hasDragEnd) {
            set({
              nodes: currentNodes,
              edges: currentEdges,
              ...appendHistory(state.history, state.historyIndex, dragSnapshot),
              redoStack: [],
              dragSnapshot: null,
            });
            return;
          }

          set({
            nodes: currentNodes,
            edges: currentEdges,
            dragSnapshot,
          });

          console.log("Applied non-history node changes.");
          return;
        }
        console.log("Updating history (onNodesChange):");
        console.log("Current Nodes:", get().nodes);
        console.log("Current Edges:", currentEdges);
        console.log("New History Item:", newHistoryItem);

        if (get().nodes.length < currentNodes) {
          set({
            selectedNode: null,
            nodes: currentNodes,
            edges: currentEdges,
            ...appendHistory(get().history, get().historyIndex, newHistoryItem),
            redoStack: [],
          });
        } else {
          set({
            selectedNode: null,
            nodes: currentNodes,
            edges: currentEdges,
            ...appendHistory(get().history, get().historyIndex, newHistoryItem),
            redoStack: [],
          });
        }
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        const state = get();
        const currentNodes = state.nodes;
        const currentEdges = state.edges;

        let updatedNodes = [...currentNodes];
        changes.forEach((change) => {
          // make changes to source and target of removed edges
          if (change.type === "remove") {
            const removedEdge = get().edges.find((e) => e.id === change.id);
            if (removedEdge) {
              console.log("removed edge", removedEdge);
              const targetNode = currentNodes.find(
                (n) => n.id === removedEdge.target,
              );
              console.log("target Node", targetNode);

              if (targetNode) {
                const targetNodeIndex = currentNodes.findIndex(
                  (n) => n.id === targetNode.id,
                );

                let targetData = {
                  ...targetNode.data,
                  inputs: [...(targetNode.data.inputs || [])],
                };
                // remove targetNode.data.inputs entry corresponding to removed edge
                const _inputIndex = targetData.inputs.findIndex(
                  (i) => (i.edgeId ?? -1) === removedEdge.id,
                );
                const updatedInputs = targetData.inputs.filter(
                  (i) => (i.edgeId ?? -1) !== removedEdge.id,
                );
                console.log("updatedInputs", updatedInputs);
                targetData.inputs = updatedInputs;

                // custom operators: the input slot of the removed edge takes its base type again
                if (isCustomOperator(targetNode)) {
                  const inputTypes = toTypeArray(targetNode.data.inputTypes);
                  const slot = portTypeIndex(
                    targetNode,
                    removedEdge.targetHandle,
                  );
                  if (slot < inputTypes.length) {
                    inputTypes[slot] = basePortType(
                      targetNode,
                      removedEdge.targetHandle,
                    );
                    targetData.inputTypes = inputTypes;
                  }
                }

                // revert inputTypes in targetNode.data.inputTypes to "any", if applicable for targetNode
                if (
                  targetNode.type === consts.AlgorithmNode ||
                  targetNode.type === consts.ClassicalAlgorithmNode ||
                  targetNode.type === consts.StatePreparationNode ||
                  (targetNode.type === consts.ClassicalOperatorNode &&
                    (targetNode.data.label.includes("Arithmetic") ||
                      targetNode.data.label.includes("Comparison")))
                ) {
                  // find other edge connected to targetNode
                  const otherEdge = get().edges.find(
                    (e) =>
                      e.target === targetNode.id && e.id !== removedEdge.id,
                  );

                  const hasNoFixedType =
                    targetNode.data.encodingType === "Basis Encoding" ||
                    targetNode.data.encodingType === "Custom Encoding";
                  // if no other edge exists: revert input & output type
                  if (!otherEdge && hasNoFixedType) {
                    targetData.inputTypes = ["any", "any"];
                    if (targetNode.data.label.includes("Arithmetic")) {
                      targetData.outputTypes = ["any"];
                    }
                  }
                }

                updatedNodes[targetNodeIndex] = {
                  ...targetNode,
                  data: targetData,
                };
              }
            }
          }
        });

        const updatedEdges = applyEdgeChanges(changes, get().edges);
        if (state.isReplayingHistory) {
          set({
            nodes: updatedNodes,
            edges: updatedEdges,
          });
          return;
        }
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(currentNodes),
          edges: structuredClone(currentEdges),
        };

        console.log(changes);
        console.log("Updating history (onEdgesChange):");
        console.log("Current Nodes:", currentNodes);
        console.log("Current Edges:", currentEdges);
        console.log("New History Item:", newHistoryItem);

        set({
          nodes: updatedNodes,
          edges: updatedEdges,
          ...appendHistory(get().history, get().historyIndex, newHistoryItem),
          redoStack: [],
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },

      onConnect: (connection: Connection) => {
        let setTypeError = get().setTypeError;
        const getNodeLockedType = (nodeId: string): string => {
          const node = get().nodes.find((n) => n.id === nodeId);

          if (!node) return "any";
          if (
            node.type === consts.AlgorithmNode ||
            node.type === consts.ClassicalAlgorithmNode
          ) {
            return "any";
          }
          // TODO: figure out a better way to opt out of locked input types
          if (node.type === consts.PluginNode) return "any";
          else if (node.type.includes("editable")) {
            // Same port resolution as editableNode.tsx: declared inputPorts, or
            // properties for legacy nodes created before inputs could be declared.
            const isLegacyOperator =
              !node.data?.isDataType && !Array.isArray(node.data?.inputPorts);
            const inputTypes: (string | undefined)[] = (
              isLegacyOperator
                ? node.data?.properties || []
                : node.data?.inputPorts || []
            ).map((p: any) => p?.type);

            // Extract the index from the targetHandle string
            // Example targetHandle: "classicalHandleInput0node123"
            let handleIndex = 0;

            const handle = connection.targetHandle ?? "";
            const match = (
              handle.endsWith(node.id)
                ? handle.slice(0, -node.id.length)
                : handle
            ).match(/^(?:classical|quantum)HandleInput(\d+)$/);
            if (match) {
              handleIndex = parseInt(match[1], 10);
            }

            return (inputTypes[handleIndex] || "any").toLowerCase();
          }

          // Find the first input that has a type other than "any"
          if (node.data.inputs) {
            for (const input of node.data.inputs) {
              const sourceNode = get().nodes.find((n) => n.id === input.id);
              if (!sourceNode) continue;

              let type = "any";
              if (sourceNode.type === "dataTypeNode")
                type = (sourceNode.data?.dataType ?? "any").toLowerCase();
              else if (sourceNode.type === "ClassicalOperationNode") {
                type = getNodeLockedType(sourceNode.id);
              } else if (sourceNode.data?.outputTypes?.[0]) {
                type = sourceNode.data.outputTypes[0]; // TODO:  eigentlich sollte man da den richtigen outputType aussuchen. Geht mittlerweile, weil edgeId mitgespeichert wird.
              }

              if (type !== "any") return type;
            }
          }
          return "any"; // no locked type yet
        };

        const getNodeOutputType = (
          nodeId: string,
          handleId?: string,
        ): string => {
          // For group proxy handles, handleId belongs to the actual child node rather than to
          // the group (nodeId) itself; see the comment on resolveHandleOwnerId above.
          const effectiveId = resolveHandleOwnerId(
            get().nodes,
            nodeId,
            handleId,
          );
          const node = get().nodes.find((n) => n.id === effectiveId);
          if (!node) return "any";
          const index = portTypeIndex(node, handleId);
          console.log("GETNODEOUTPUTTYPES", node.data.outputTypes);
          console.log(handleId);
          console.log("INDEX", index);
          if (node.data.outputTypes?.[index])
            return node.data.outputTypes[index].toLowerCase();

          // Measurement Node
          if (node.type === "measurementNode") {
            // If handleId is specified, pick the correct output
            if (handleId === node.data.outputs?.[0]?.id) return "array";
            if (handleId === node.data.outputs?.[1]?.id)
              return "quantum register";
            // Default fallback
            return "any";
          }

          // Data type node
          if (node.type === "dataTypeNode")
            return node.data?.dataType.toLowerCase() ?? "any";

          // Classical Operators
          if (
            node.type === consts.ClassicalOperatorNode ||
            node.type === "ClassicalAlgorithmNode"
          ) {
            switch (node.data.label) {
              case "Classical Arithmetic Operator":
                // Arithmetic operator: output type comes from first input type (assuming input types match)
                const firstInputEdge = get().edges.find(
                  (e) =>
                    e.target === node.id &&
                    e.targetHandle ===
                      `classicalHandleOperationInput0${node.id}`,
                );
                if (firstInputEdge)
                  return getNodeOutputType(
                    firstInputEdge.source,
                    firstInputEdge.sourceHandle,
                  );
                return "any"; // fallback if no input
              case "Classical Bitwise Operator":
                return "bit";
              case "Classical Min & Max Operator":
                return "number";
              case "Classical Comparison Operator":
                return "boolean";
              default:
                return "any";
            }
          }

          // Algorithm nodes or unknown node types
          if (
            node.type === consts.AlgorithmNode ||
            node.type === consts.ClassicalAlgorithmNode
          ) {
            return "any";
          }

          return "any"; // fallback
        };

        const getNodeInputType = (nodeId: string, handleId: string) => {
          // See the comment on resolveHandleOwnerId: for group proxy handles, handleId
          // belongs to the child node, not to the group (nodeId).
          const effectiveId = resolveHandleOwnerId(
            get().nodes,
            nodeId,
            handleId,
          );
          const targetNode = get().nodes.find((n) => n.id === effectiveId);
          if (!targetNode) return "any";

          const inputIndex = portTypeIndex(targetNode, handleId);
          console.log("InputIndex", inputIndex);
          return (
            targetNode.data.inputTypes?.[inputIndex] ?? "any"
          ).toLowerCase();
        };

        const currentNodes = get().nodes;
        console.log(connection);
        const currentEdges = get().edges;
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(currentNodes),
          edges: structuredClone(get().edges),
        };
        console.log(currentNodes);
        let type = "classicalEdge";
        let color = "#F5A843";

        let nodeDataSource = get().nodes.find(
          (node) => node.id === connection.source,
        );
        let nodeDataTarget;
        console.log(connection);
        console.log("HIERRRRRRRRRRRR");
        const target = get().nodes.find(
          (node) => node.id === connection.target,
        );
        console.log(nodeDataSource);
        console.log(target);
        if (
          nodeDataSource.data.label == consts.qubitLabel &&
          target.type === consts.SplitterNode
        ) {
          setTypeError("A qubit cannot be split into smaller units");
          return false;
        }
        const hasCycle = (node, visited = new Set()) => {
          console.log("has Cycle ID", node.id);
          if (visited.has(node.id)) {
            console.log("has");
            return false;
          }

          visited.add(node.id);

          for (const outgoer of getOutgoers(node, get().nodes, get().edges)) {
            if (outgoer.id === connection.source) {
              console.log("me");
              return true;
            }
            if (hasCycle(outgoer, visited)) {
              console.log("hasCcycle");
              return true;
            }
          }
        };
        console.log("!hasCycle", !hasCycle(target));

        // --- BYPASS CYCLE CHECK FOR CONTROL FLOW CLOSURES ---
        let isControlFlowEnd = false;
        const sourceNodeForCycle = get().nodes.find(
          (n) => n.id === connection.source,
        );

        if (
          target?.type === "ifElseNode" ||
          target?.type === "controlStructureNode"
        ) {
          if (
            sourceNodeForCycle &&
            sourceNodeForCycle.parentNode === target.id
          ) {
            isControlFlowEnd = true;
          } else if (
            connection.targetHandle &&
            (connection.targetHandle.includes("DynamicOutput") ||
              connection.targetHandle.includes("InputDynamic"))
          ) {
            isControlFlowEnd = true;
          }
        }

        if (!isControlFlowEnd && hasCycle(target)) {
          setTypeError(
            "Cycles are not allowed, since the quantum output of an operation cannot be fed back as the input to a previous operation.",
          );
          return false;
        }
        if (
          target.id === connection.source &&
          target.type !== "splitterNode" &&
          target.type !== "mergerNode"
        ) {
          console.log("source target");
          return false;
        }

        for (let node of currentNodes) {
          if (node.id === connection.source) {
            nodeDataSource = node;
          }
          if (node.id === connection.target) {
            nodeDataTarget = node;
          }
        }
        let insertEdge = false;
        for (let node of currentNodes) {
          if (
            node.id === connection.source &&
            (connection.sourceHandle.includes(consts.quantumHandle) ||
              connection.sourceHandle.includes("sideQuantumHandle")) &&
            connection.targetHandle.includes(consts.quantumHandle)
          ) {
            type = "quantumEdge";
            color = "#93C5FD";
          }
          if (
            node.id === connection.source &&
            (connection.sourceHandle.includes("ancilla") ||
              connection.sourceHandle.includes("dirtyAncilla")) &&
            (connection.sourceHandle.includes("ancilla") ||
              connection.sourceHandle.includes("dirtyAncilla"))
          ) {
            type = "ancillaEdge";
            color = "#86EFAC";
          }

          // allow only classical flow between classical handles
          if (
            node.id === connection.source &&
            connection.sourceHandle.includes(consts.classicalHandle) &&
            connection.targetHandle.includes(consts.classicalHandle)
          ) {
            insertEdge = true;
          }

          // allow only ancilla flow between ancilla handles
          if (
            node.id === connection.source &&
            connection.sourceHandle.includes(consts.ancillaHandle) &&
            connection.targetHandle.includes(consts.ancillaHandle)
          ) {
            insertEdge = true;
          }
          // allow only ancilla flow between ancilla handles
          if (
            node.id === connection.source &&
            connection.sourceHandle.includes(consts.dirtyAncillaHandle) &&
            connection.targetHandle.includes(consts.dirtyAncillaHandle)
          ) {
            insertEdge = true;
          }

          if (
            node.id === connection.source &&
            nodeDataSource.type === consts.AncillaNode &&
            connection.targetHandle.includes("ancillaHandle")
          ) {
            insertEdge = true;
          }

          if (
            node.id === connection.source &&
            connection.sourceHandle.includes("ancillaHandle") &&
            nodeDataTarget.type === "gateNode" &&
            connection.targetHandle.includes("quantumHandle")
          ) {
            insertEdge = true;
          }

          if (
            nodeDataSource.type === "splitterNode" ||
            nodeDataSource.type === "mergerNode"
          ) {
            // only allow source connections that are inside the node
            //if (connection.sourceHandle && connection.sourceHandle.startsWith("quantumHandle") && connection.sourceHandle.endsWith(nodeDataSource.id) && connection.targetHandle.endsWith(nodeDataSource.id)) {
            insertEdge = true;
            //} else {
            //insertEdge = false;
            //}
          }

          console.log(nodeDataSource.type);
          console.log(connection);
          console.log(nodeDataTarget);

          // only allow connections from inside quantum handles
          if (
            nodeDataSource.type === "ifElseNode" &&
            connection.sourceHandle.includes("sideQuantumHandle") &&
            connection.targetHandle.includes("quantumHandle") &&
            nodeDataTarget.parentNode === nodeDataSource.id
          ) {
            insertEdge = true;
          }

          // only allow connections to inside quantum handles
          if (
            nodeDataTarget.type === "ifElseNode" &&
            connection.targetHandle.includes("quantumHandleDynamic") &&
            connection.targetHandle.includes("quantumHandle") &&
            nodeDataSource.parentNode === nodeDataTarget.id
          ) {
            insertEdge = true;
          }

          // only allow connections from inside classical handles
          if (
            nodeDataSource.type === "ifElseNode" &&
            connection.sourceHandle.includes("sideClassicalHandle") &&
            connection.targetHandle.includes("classicalHandle") &&
            nodeDataTarget.parentNode === nodeDataSource.id
          ) {
            insertEdge = true;
          }

          // only allow connections from inside classical handles
          if (
            nodeDataSource.type === "ifElseNode" &&
            connection.sourceHandle.includes("sideClassicalHandle") &&
            connection.targetHandle.includes("classicalHandle") &&
            nodeDataTarget.parentNode === nodeDataSource.id
          ) {
            insertEdge = true;
          }

          console.log(connection);

          if (
            node.id === connection.source &&
            connection.sourceHandle.startsWith("quantumHandle") &&
            connection.targetHandle.includes("quantumHandle")
          ) {
            insertEdge = true;
          }
          if (
            node.id === connection.source &&
            connection.sourceHandle.startsWith("dirtyAncillaHandle") &&
            connection.targetHandle.includes("dirtyAncillaHandle")
          ) {
            insertEdge = true;
          }

          if (nodeDataSource.parentNode !== nodeDataTarget.parentNode) {
            insertEdge = false;
          }
          if (nodeDataSource.id === nodeDataTarget.parentNode) {
            insertEdge = true;
          }
          if (nodeDataTarget.id === nodeDataSource.parentNode) {
            insertEdge = true;
          }
        }

        const edgeExists = currentEdges.some(
          (edge) =>
            edge.targetHandle === connection.targetHandle &&
            nodeDataTarget.type !== "mergerNode",
        );

        console.log(connection);
        console.log(insertEdge);

        if (!insertEdge) {
          const getHandleDomain = (
            handleId?: string,
          ):
            | "classical"
            | "quantum"
            | "ancilla"
            | "dirtyAncilla"
            | "unknown" => {
            if (!handleId) return "unknown";
            if (handleId.includes(consts.classicalHandle)) return "classical";
            if (handleId.includes(consts.dirtyAncillaHandle))
              return "dirtyAncilla";
            if (handleId.includes(consts.ancillaHandle)) return "ancilla";
            if (
              handleId.includes(consts.quantumHandle) ||
              handleId.includes("sideQuantumHandle")
            )
              return "quantum";
            return "unknown";
          };
          const sourceDomain = getHandleDomain(connection.sourceHandle);
          const targetDomain = getHandleDomain(connection.targetHandle);

          const handles = (d: string) => {
            switch (d) {
              case "classical":
                return "classical";
              case "quantum":
                return "quantum";
              case "ancilla":
                return "ancilla";
              case "dirtyAncilla":
                return "dirty ancilla";
              default:
                return "unknown";
            }
          };

          setTypeError(
            `Cannot connect ${handles(sourceDomain)} output to ${handles(targetDomain)} input`,
          );
        }
        console.log(!edgeExists);

        const edge = {
          ...connection,
          type: type,
          id: uuid(),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: color,
          },
          redoStack: [],
        };

        console.log("Updating history (onConnect):");
        console.log("Current Nodes:", currentNodes);
        console.log("Current Edges:", get().edges);
        console.log("New History Item:", newHistoryItem);
        const getOutputIndex = (sourceHandle: string, nodeDataSource: Node) => {
          // For group proxy handles, sourceHandle belongs to the child node rather than to
          // the group (nodeDataSource); see the comment on resolveHandleOwnerId above.
          const effectiveId = resolveHandleOwnerId(
            get().nodes,
            nodeDataSource.id,
            sourceHandle,
          );
          const tmpHandle = sourceHandle.split(effectiveId)[0];
          if (!tmpHandle) {
            return null;
          }
          const match = tmpHandle.match(/\d+$/);

          if (!match) {
            return null;
          }

          return parseInt(match[0], 10);
        };

        // TYPE CHECK
        let sourceType = getNodeOutputType(
          connection.source,
          connection.sourceHandle,
        ).toLowerCase();
        const targetType = getNodeInputType(
          connection.target,
          connection.targetHandle,
        ).toLowerCase();
        const _inputIndex = getHandleIndex(
          resolveHandleOwnerId(
            get().nodes,
            connection.target,
            connection.targetHandle,
          ),
          connection.targetHandle,
        );

        const sourceNode = get().nodes.find((n) => n.id === connection.source);
        const targetNode = get().nodes.find((n) => n.id === connection.target);
        if (!targetNode) {
          insertEdge = false;
          return false;
        }

        console.log("Types", sourceType, targetType);
        console.log("------------------------------");

        // If types are incompatible, reject connection
        if (
          targetNode.type !== "controlStructureNode" &&
          targetType !== "any" &&
          sourceType !== "any" &&
          sourceType !== targetType
        ) {
          const errorMsg = `Type mismatch: ${sourceType} -> ${targetType}, connection rejected`;
          console.log(errorMsg);
          setTypeError(errorMsg);
          insertEdge = false;
          return false; // reject edge
        }

        const lockedType = getNodeLockedType(targetNode.id).toLowerCase();

        if (sourceNode) {
          if (sourceNode.type === "dataTypeNode")
            sourceType = (sourceNode.data?.dataType ?? "any").toLowerCase();
          else if (sourceNode.type === "ClassicalOperationNode")
            sourceType = getNodeLockedType(sourceNode.id);
        }

        // If the target node already has a locked type, new input must match
        // Skip this check for pluginNodes - each input can have its own type
        if (
          targetNode.type !== "controlStructureNode" &&
          targetNode.type !== "qaoa" &&
          targetNode.type !== "pluginNode" &&
          lockedType !== "any" &&
          sourceType !== "any" &&
          sourceType !== lockedType
        ) {
          const errorMsg = `Cannot connect: type "${sourceType}" does not match locked type "${lockedType}"`;
          console.warn(errorMsg);
          setTypeError(errorMsg);
          insertEdge = false;
          return false;
        }

        if (!targetNode) return false;

        // Special handling for state preparation nodes
        const encodingNodes = [
          "Angle Encoding",
          "Amplitude Encoding",
          "Matrix Encoding",
          "Schmidt Decomposition",
          "Matrix Encoding",
        ];

        if (
          encodingNodes.includes(targetNode.data.label) &&
          sourceType.toLowerCase() !== "array"
        ) {
          const errorMsg = `Cannot connect: ${sourceType} is incompatible with ${targetNode.type}, expected "array".`;
          console.warn(errorMsg);
          insertEdge = false;
          return false; // reject edge
        }

        if (insertEdge && !edgeExists) {
          console.log("INSERT EDGE");
          console.log(connection.source);

          console.log(nodeDataSource);
          // Safeguard: nodeDataTarget can be a group, whose data object (unlike that of a real
          // gate node) has no inputs array. Without this initialization, the .find()/.push()
          // calls below would throw and silently abort every connection to a group proxy
          // handle.
          if (!nodeDataTarget.data.inputs) nodeDataTarget.data.inputs = [];
          const existingInput = nodeDataTarget.data.inputs.find(
            (input) =>
              input.id === nodeDataSource.id &&
              input.targetHandle === connection.targetHandle,
          );

          if (existingInput) {
            // Update the existing entry
            existingInput.outputIdentifier = sourceOutputIdentifier;
          } else {
            if (nodeDataTarget.type === "statePreparationNode") {
              // Push a new entry
              console.log("VNSOIVNOIDNO");
              nodeDataTarget.data.inputs.push({
                id: nodeDataSource.id,
                edgeId: edge.id,
                outputIdentifier: sourceOutputIdentifier,
                targetHandle: connection.targetHandle,
              });
            }

            if (nodeDataTarget.type === "gateNode") {
              console.log(nodeDataTarget);
              if (
                nodeDataTarget.data.label === "CNOT" &&
                connection.sourceHandle.includes("Output1")
              ) {
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  identifiers: [nodeDataSource.data.identifiers[0]],
                  targetHandle: connection.targetHandle,
                });
              } else if (
                nodeDataTarget.label === "CNOT" &&
                connection.sourceHandle.endsWith("Output2")
              ) {
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  identifiers: [nodeDataSource.data.identifiers[1]],
                  targetHandle: connection.targetHandle,
                });
              } else if (
                nodeDataTarget.data.label === "Toffoli" &&
                connection.sourceHandle.includes("Output1")
              ) {
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  identifiers: [nodeDataSource.data.identifiers[0]],
                  targetHandle: connection.targetHandle,
                });
              } else if (
                nodeDataTarget.label === "Toffoli" &&
                connection.sourceHandle.endsWith("Output2")
              ) {
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  identifiers: [nodeDataSource.data.identifiers[1]],
                  targetHandle: connection.targetHandle,
                });
              } else if (
                nodeDataTarget.label === "Toffoli" &&
                connection.sourceHandle.endsWith("Output3")
              ) {
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  identifiers: [nodeDataSource.data.identifiers[2]],
                  targetHandle: connection.targetHandle,
                });
              } else {
                if (
                  !edge.sourceHandle.includes("side") &&
                  !edge.targetHandle.includes("side")
                ) {
                  // Push a new entry
                  console.log("push entry");
                  nodeDataTarget.data.inputs.push({
                    id: nodeDataSource.id,
                    edgeId: edge.id,
                    identifiers: nodeDataSource.data.identifiers,
                    targetHandle: edge.targetHandle,
                  });
                }
              }
              //nodeDataTarget.data.identifier = nodeDataSource.data.identifier
            } else {
              if (
                !edge.sourceHandle.includes("side") &&
                !edge.targetHandle.includes("side") &&
                !edge.sourceHandle.includes("Dynamic") &&
                !edge.targetHandle.includes("Dynamic")
              ) {
                console.log("push entry");
                console.log(edge);
                console.log(connection);
                console.log(nodeDataSource);
                console.log(nodeDataTarget);
                const outputIndex = getOutputIndex(
                  connection.sourceHandle,
                  nodeDataSource,
                );
                console.log("sourceHandle", connection.sourceHandle);
                console.log("index", outputIndex);
                const sourceNode = currentNodes.find(
                  (n) => n.id === edge.source,
                );
                console.log(sourceNode.data.outputs?.[outputIndex]?.identifier);
                var sourceOutputIdentifier = "";
                if (
                  nodeDataSource.type === "algorithmNode" ||
                  nodeDataSource.type === "classicalAlgorithmNode" ||
                  nodeDataSource.type === "measurementNode"
                ) {
                  sourceOutputIdentifier =
                    nodeDataSource.data.outputs?.[outputIndex]?.identifier;
                } else {
                  sourceOutputIdentifier =
                    nodeDataSource.data.outputs?.[outputIndex]?.identifier ??
                    nodeDataSource.data?.outputIdentifier;
                }
                nodeDataTarget.data.inputs.push({
                  id: nodeDataSource.id,
                  edgeId: edge.id,
                  outputIdentifier: sourceOutputIdentifier,
                  identifiers: nodeDataSource.data.identifiers,
                  targetHandle: edge.targetHandle,
                });
              }
            }
          }

          set((state) => {
            const { nodes } = state;
            let updatedNodes = [...nodes];
            let sourceIdentifier = 0;
            console.log(sourceIdentifier);
            console.log("set state");

            // Update the target nodes that receive inputs from this node
            if (edge.source === connection.source) {
              const targetNodeIndex = updatedNodes.findIndex(
                (n) => n.id === edge.target,
              );
              const sourceHandle = connection.sourceHandle;
              console.log(targetNodeIndex);
              if (targetNodeIndex !== -1) {
                const targetNode = { ...updatedNodes[targetNodeIndex] };
                const targetData = { ...targetNode.data };
                const sourceNode = updatedNodes.find(
                  (n) => n.id === edge.source,
                );
                sourceIdentifier = sourceNode?.data?.identifiers;
                const sourceType = getNodeOutputType(
                  sourceNode.id,
                  connection.sourceHandle,
                ).toLowerCase();
                const targetType = getNodeInputType(
                  targetNode.id,
                  connection.targetHandle,
                ).toLowerCase();
                const lockedType = getNodeLockedType(
                  targetNode.id,
                ).toLowerCase();
                console.log("SOURCE TYPE", sourceType);
                console.log("TARGET TYPE", targetType);
                console.log("LOCKED TYPE", lockedType);

                console.log("sourceIdentifier");
                console.log(sourceIdentifier);
                //let sourceOutputIdentifier = sourceNode?.data?.outputIdentifier;
                const outputIndex = getOutputIndex(sourceHandle, sourceNode);
                console.log("sourceHandle", sourceHandle);
                console.log("index", outputIndex);
                var sourceOutputIdentifier = "";
                if (
                  sourceNode.type === "algorithmNode" ||
                  sourceNode.type === "classicalAlgorithmNode" ||
                  sourceNode.type === "measurementNode"
                ) {
                  sourceOutputIdentifier =
                    sourceNode.data.outputs?.[outputIndex]?.identifier;
                } else {
                  sourceOutputIdentifier =
                    sourceNode.data.outputs?.[outputIndex]?.identifier ??
                    sourceNode?.data?.outputIdentifier;
                }
                console.log("sourceNode", sourceNode);

                console.log(sourceIdentifier);

                if (!targetData.inputs) targetData.inputs = [];
                // Safeguard: targetData.inputTypes can be missing for group proxy handles,
                // since groups do not maintain an inputTypes array like real gate nodes do.
                if (!targetData.inputTypes) targetData.inputTypes = [];

                const inputIndex = targetData.inputs.findIndex(
                  (input) => input.id === connection.source,
                );
                const handleOwnerId = resolveHandleOwnerId(
                  updatedNodes,
                  targetNode.id,
                  connection.targetHandle,
                );
                const handleIndex = isCustomOperator(targetNode)
                  ? portTypeIndex(targetNode, connection.targetHandle)
                  : getHandleIndex(handleOwnerId, connection.targetHandle);
                // Update target node inputType if it was "any"
                if (targetType === "any" && handleIndex !== null) {
                  targetData.inputTypes[handleIndex] = sourceType.toLowerCase();
                }
                // Update target node input and output types if classical operation node and both inputs are set
                if (
                  targetNode.type === consts.ClassicalOperatorNode &&
                  (targetNode.data.label.includes("Arithmetic") ||
                    targetNode.data.label.includes("Comparison")) &&
                  lockedType !== "any"
                ) {
                  console.log("updating input output types");
                  targetData.inputTypes = [lockedType, lockedType];
                  if (targetNode.data.label.includes("Arithmetic")) {
                    targetData.outputTypes = [lockedType];
                    //TODO if outputType is changed inputType of any connected Edge should be changed too
                  }
                  console.log(targetData);
                  console.log(updatedNodes[targetNodeIndex]);
                }

                if (inputIndex !== -1) {
                  if (
                    targetData.inputs[inputIndex].outputIdentifier ===
                    sourceOutputIdentifier
                  ) {
                    targetData.inputs[inputIndex].outputIdentifier =
                      sourceOutputIdentifier;
                    targetData.inputs[inputIndex]["identifiers"] =
                      sourceIdentifier;
                    targetData["identifiers"] = sourceIdentifier;
                    console.log(targetData["identifier"]);
                  } else {
                    targetData.inputs[inputIndex].outputIdentifier =
                      sourceOutputIdentifier;
                    targetData.inputs[inputIndex]["identifiers"] =
                      sourceIdentifier;
                    targetData["identifiers"] = sourceIdentifier;
                    console.log(targetData["identifiers"]);
                  }
                } else {
                  targetData.inputs.push({
                    id: connection.source,
                    edgeId: edge.id,
                    outputIdentifier: sourceNode.data.outputIdentifier,
                    identifiers: sourceIdentifier,
                    targetHandle: connection.targetHandle,
                  });
                  targetData["identifiers"] = sourceIdentifier;
                  console.log(targetData["identifiers"]);
                }

                targetNode.data = targetData;
                updatedNodes[targetNodeIndex] = targetNode;
              }
            }

            console.log("Set edge", edge);
            console.log(updatedNodes);

            return {
              nodes: updatedNodes,
              edges: [edge, ...currentEdges],
              ...appendHistory(
                get().history,
                get().historyIndex,
                newHistoryItem,
              ),
              redoStack: [],
            };
          });
        } else {
          set({
            nodes: currentNodes,
            edges: [...currentEdges],
            ...appendHistory(get().history, get().historyIndex, newHistoryItem),
            redoStack: [],
          });
        }
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },
      onConnectEnd: (event: MouseEvent) => {
        console.log(event);
        console.log(event);

        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },
      updateNodeLabel: (nodeId: string, nodeVal: string) => {
        console.log("label");
        const previousNodes = get().nodes;
        const currentEdges = get().edges;
        const newHistoryItem: HistoryItem = {
          nodes: structuredClone(previousNodes),
          edges: structuredClone(currentEdges),
        };
        const currentNodes = get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, label: nodeVal };
          }

          return node;
        });

        set({
          nodes: currentNodes,
          edges: currentEdges,
          ...appendHistory(get().history, get().historyIndex, newHistoryItem),
          redoStack: [],
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);
      },

      updateNodeValue: (nodeId: string, identifier: string, nodeVal: any) => {
        console.log("Updating node value for:", nodeId);
        console.log("Identifier:", identifier, "New Value:", nodeVal);
        const getOutputIndex = (sourceHandle: string, nodeDataSource: Node) => {
          // For group proxy handles, sourceHandle belongs to the child node rather than to
          // the group (nodeDataSource); see the comment on resolveHandleOwnerId above.
          const effectiveId = resolveHandleOwnerId(
            get().nodes,
            nodeDataSource.id,
            sourceHandle,
          );
          const tmpHandle = sourceHandle.split(effectiveId)[0];

          if (!tmpHandle) {
            return null;
          }

          const match = tmpHandle.match(/\d+$/);

          if (!match) {
            return null;
          }

          return parseInt(match[0], 10);
        };

        set((state) => {
          const { nodes, edges } = state;
          const newHistoryItem: HistoryItem = {
            nodes: structuredClone(nodes),
            edges: structuredClone(edges),
          };
          const shouldRecordHistory =
            !state.isReplayingHistory &&
            state.pendingNodeInitializationId !== nodeId;
          let updatedNodes = [...nodes];
          let sourceIdentifier = 0;
          console.log(sourceIdentifier);
          console.log("set state");

          // Update the target nodes that receive inputs from this node
          edges.forEach((edge) => {
            console.log(
              "Update target node that receive inputs from this node",
            );
            console.log(sourceIdentifier);
            console.log(edge);
            console.log(nodeId);
            if (edge.source === nodeId) {
              // todo korrekte targetNode input updaten
              const targetNodeIndex = updatedNodes.findIndex(
                (n) => n.id === edge.target,
              );
              if (targetNodeIndex !== -1) {
                const targetNode = { ...updatedNodes[targetNodeIndex] };
                const targetData = { ...targetNode.data };
                const sourceNode = updatedNodes.find(
                  (n) => n.id === edge.source,
                );
                sourceIdentifier = sourceNode?.data?.identifiers;
                console.log("sourceIdentifier");
                console.log(sourceIdentifier);
                const sourceHandle = edge.sourceHandle;
                const outputIndex = getOutputIndex(sourceHandle, sourceNode);
                var sourceOutputIdentifier = "";
                if (
                  sourceNode.type === "algorithmNode" ||
                  sourceNode.type === "classicalAlgorithmNode" ||
                  sourceNode.type === "measurementNode"
                ) {
                  sourceOutputIdentifier =
                    sourceNode.data.outputs?.[outputIndex]?.identifier;
                } else {
                  sourceOutputIdentifier =
                    sourceNode.data.outputs?.[outputIndex]?.identifier ??
                    nodeVal;
                }
                console.log("sourceHandle", sourceHandle);
                console.log("index", outputIndex);
                console.log("source Output Identifier", sourceOutputIdentifier);
                console.log("source node", sourceNode);

                if (!targetData.inputs) targetData.inputs = [];

                const inputIndex = targetData.inputs.findIndex(
                  (input) =>
                    input.id === nodeId &&
                    edge.targetHandle === input.targetHandle,
                );
                console.log("inputIndex", inputIndex);

                if (identifier === "outputIdentifier") {
                  console.log("erstes if");
                  if (inputIndex !== -1) {
                    console.log("inputIndex != -1");
                    if (
                      targetData.inputs[inputIndex].outputIdentifier ===
                      sourceOutputIdentifier
                    ) {
                      console.log(
                        "targetData outputidentifier === sourceOutput ",
                      );
                      targetData.inputs[inputIndex].outputIdentifier =
                        sourceOutputIdentifier;
                      targetData.inputs[inputIndex]["identifiers"] =
                        sourceIdentifier;
                      targetData["identifiers"] = sourceIdentifier;
                      console.log(targetData["identifier"]);
                    } else {
                      targetData.inputs[inputIndex].outputIdentifier =
                        sourceOutputIdentifier;
                      targetData.inputs[inputIndex]["identifiers"] =
                        sourceIdentifier;
                      targetData["identifiers"] = sourceIdentifier;
                      console.log(targetData["identifiers"]);
                    }
                  } else {
                    targetData.inputs.push({
                      id: nodeId,
                      edgeId: edge.id,
                      outputIdentifier: nodeVal,
                      identifiers: sourceIdentifier,
                    });
                    targetData["identifiers"] = sourceIdentifier;
                    console.log(targetData["identifiers"]);
                  }
                }
              }
            }
          });

          // Update the node's own properties
          updatedNodes = updatedNodes.map((node) => {
            if (node.id === nodeId) {
              if (identifier === "width") {
                console.log("updATE WIDTH");

                node.width = node.width + 500;
                return {
                  ...node,
                  style: {
                    height: node.height,
                    width: 1000,
                  },
                };
              }
              if (identifier === "hidden") {
                console.log("updATE WIDTH");
                return {
                  ...node,
                  style: {
                    height: node.height,
                    width: node.width,
                    hidden: true,
                  },
                  hidden: true,
                };
              }
              console.log(node.data["identifiers"]);
              //node.data["identifiers"] = sourceIdentifier
              if (identifier === "parentNode") {
                console.log("update parentnode");
                node.parentNode = nodeVal;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [identifier]: nodeVal,
                  },
                };
              }
              if (identifier === "encodingType") {
                let inputTypes = ["array"];
                console.log("update node data type");
                console.log(node.data.inputTypes);
                const existingInputTypes = node.data.inputTypes;

                const resolvedInputTypes =
                  Array.isArray(existingInputTypes) &&
                  existingInputTypes.length > 0 &&
                  existingInputTypes.some((t) => t !== "any" && t != "array")
                    ? existingInputTypes
                    : ["any"];
                if (nodeVal.includes("Basis") || nodeVal.includes("Custom"))
                  inputTypes = resolvedInputTypes;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [identifier]: nodeVal,
                    inputTypes: inputTypes,
                  },
                };
              }
              if (identifier === "inputTypes" || identifier === "outputTypes") {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    [identifier]: toTypeArray(nodeVal),
                  },
                };
              }
              if (PORT_COUNT_FIELDS.includes(identifier)) {
                // keep the port types in sync with the new port count
                const updatedData = { ...node.data, [identifier]: nodeVal };
                const fixed = getPortTypes({ ...node, data: updatedData });
                return {
                  ...node,
                  data: fixed ? { ...updatedData, ...fixed } : updatedData,
                };
              }
              return {
                ...node,
                data: {
                  ...node.data,
                  [identifier]: nodeVal,
                },
              };
            }
            return node;
          });

          console.log(updatedNodes);

          return {
            nodes: updatedNodes,
            edges: edges,
            ...(shouldRecordHistory
              ? appendHistory(state.history, state.historyIndex, newHistoryItem)
              : {}),
            redoStack: shouldRecordHistory ? [] : state.redoStack,
          };
        });
        console.log("History after update:", get().history);
        console.log("Current historyIndex:", get().historyIndex);

        console.log("History updated successfully.");
      },
      updateNodeValues: (nodeId: string, values: Record<string, any>) => {
        set((state) => {
          const { nodes, edges } = state;
          const shouldRecordHistory =
            !state.isReplayingHistory &&
            state.pendingNodeInitializationId !== nodeId;
          const newHistoryItem: HistoryItem = {
            nodes: structuredClone(nodes),
            edges: structuredClone(edges),
          };
          const updatedNodes = nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...values } }
              : node,
          );

          return {
            nodes: updatedNodes,
            edges,
            ...(shouldRecordHistory
              ? appendHistory(state.history, state.historyIndex, newHistoryItem)
              : {}),
            redoStack: shouldRecordHistory ? [] : state.redoStack,
          };
        });
      },
      updateParent: (nodeId: string, parentId: string, position: any) => {
        console.log("Updating parent value for:", nodeId);
        console.log("Identifier:", parentId);

        set((state) => {
          const { nodes, edges } = state;
          const newHistoryItem: HistoryItem = {
            nodes: structuredClone(nodes),
            edges: structuredClone(edges),
          };
          let updatedNodes = [...nodes];
          let sourceIdentifier = 0;
          console.log(sourceIdentifier);
          console.log("set state");

          // Update the node's own properties
          updatedNodes = updatedNodes.map((node) => {
            if (node.id === nodeId) {
              console.log(node.data["identifier"]);

              node.parentNode = parentId;
              node.position = position;
              node.extent = "parent";
              return {
                ...node,
                data: {
                  ...node.data,
                },
              };
            }
            return node;
          });

          console.log(updatedNodes);

          return {
            nodes: updatedNodes,
            edges: edges,
            ...appendHistory(state.history, state.historyIndex, newHistoryItem),
            redoStack: [],
          };
        });

        console.log("History updated successfully.");
      },
      updateChildren: (nodeId, child: any) => {
        console.log("Updating children value for:", nodeId);

        set((state) => {
          const { nodes, edges } = state;
          const newHistoryItem: HistoryItem = {
            nodes: structuredClone(nodes),
            edges: structuredClone(edges),
          };
          let updatedNodes = [...nodes];

          // Update the node's own properties
          for (let i = 0; i < updatedNodes.length; i++) {
            if (updatedNodes[i].id === nodeId) {
              let parentNode = updatedNodes[i];
              console.log(parentNode);
              let children = parentNode.data?.children;
              console.log(children);
              console.log(!children);
              console.log(child);
              console.log(children.includes(child));

              if (children !== undefined && !children.includes(child)) {
                children.push(child);
              }
              console.log(children);
              updatedNodes = updatedNodes.map((node) => {
                // find children and add this to the children attribute
                if (node.parentNode === nodeId) {
                  console.log("found parent");
                  console.log(node.data["identifier"]);
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      children: children,
                    },
                  };
                }
                return node;
              });
            }
          }

          console.log(updatedNodes);

          return {
            nodes: updatedNodes,
            edges: edges,
            ...appendHistory(state.history, state.historyIndex, newHistoryItem),
            redoStack: [],
          };
        });
      },
      undo: () => {
        const { history, historyIndex, nodes, edges, redoStack } = get();
        if (historyIndex <= 0 || !history[historyIndex]) {
          return;
        }
        const previousHistoryItem = history[historyIndex - 1];
        set({
          nodes: previousHistoryItem.nodes,
          edges: previousHistoryItem.edges,
          historyIndex: historyIndex - 1,
          isReplayingHistory: true,
          redoStack: [
            ...redoStack,
            {
              nodes: structuredClone(nodes),
              edges: structuredClone(edges),
            },
          ].slice(-MAX_HISTORY_ENTRIES),
        });
        setTimeout(() => set({ isReplayingHistory: false }), 0);
      },

      redo: () => {
        const { historyIndex, redoStack } = get();
        const nextHistoryItem = redoStack[redoStack.length - 1];

        if (nextHistoryItem) {
          set({
            nodes: nextHistoryItem.nodes,
            edges: nextHistoryItem.edges,
            historyIndex: historyIndex + 1,
            redoStack: redoStack.slice(0, -1),
            isReplayingHistory: true,
          });
          setTimeout(() => set({ isReplayingHistory: false }), 0);
        } else {
          console.warn("Redo is not possible: no further history to redo");
        }
      },
    }),
    {
      name: "user-app-storage",

      partialize: (state) => ({
        userTemplates: state.userTemplates,
        allDomainProfiles: state.allDomainProfiles,
        autoConnectOnEdgeDrop: state.autoConnectOnEdgeDrop,
        autoConnectOnSameLine: state.autoConnectOnSameLine,
      }),
    },
  ),
);
