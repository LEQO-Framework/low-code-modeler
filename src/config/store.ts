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
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getOutgoers,
} from "reactflow";
import { create } from "zustand";
import { nodesConfig } from "./site";
import { v4 as uuid } from "uuid";
import * as consts from "../constants";

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

type RFState = {
  nodes: any;
  edges: Edge[];
  selectedNode: Node | null;
  history: HistoryItem[];
  historyIndex: number;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectEnd: OnConnectEnd;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (nodeId: string, identifier, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  undo: () => void;
  redo: () => void;
};

// Zustand store with undo/redo logic
const useStore = create<RFState>((set, get) => ({
  nodes: nodesConfig.initialNodes,
  edges: nodesConfig.initialEdges,
  selectedNode: null,
  history: [],
  historyIndex: -1,

  setSelectedNode: (node: Node | null) => {
    set({
      selectedNode: node,
    });
    console.log("rerender")
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
      nodes: [...currentNodes], // Copy the nodes array to avoid mutation
      edges: [...currentEdges], // Copy the edges array to avoid mutation
    };

    console.log("Updating history (setNodes):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);
    const uniqueIdentifier = `q${Math.floor(100000 + Math.random() * 900000)}`;
    node.data.identifiers = [uniqueIdentifier];
    console.log("IIIIIIIIIIIIIII");
    console.log(node);
    const uniqueIdentifier2 = `q${Math.floor(100000 + Math.random() * 900000)}`;
    const uniqueIdentifier3 = `q${Math.floor(100000 + Math.random() * 900000)}`;
    //node.data.identifiers = uniqueIdentifier;
    if (node.type === "measurementNode") {
      node.data.indices = "";
      node.data.outputIdentifier = "";
    }

    if (node.type === "gateNode") {
      if (node.data.label === "H") {
        console.log("set Hadanard")
        node.data.implementation = consts.HadamardImplementation;
        node.data.implementationType = "openqasm2";
      } else if (node.data.label === "X") {
        node.data.implementation = consts.PauliXImplementation;
        node.data.implementationType = "openqasm2";
      } else if (node.data.label === "Y") {
        node.data.implementation = consts.PauliYImplementation;
        node.data.implementationType = "openqasm2";
      } else if (node.data.label === "Z") {
        node.data.implementation = consts.PauliZImplementation;
        node.data.implementationType = "openqasm2";
      } else if (node.data.label === "Toffoli") {
        node.data.implementation = consts.ToffoliImplementation;
        node.data.identifiers.push(uniqueIdentifier2);
        node.data.identifiers.push(uniqueIdentifier3);
        node.data.implementationType = "openqasm2";
      } else if (node.data.label === "CNOT") {
        node.data.identifiers.push(uniqueIdentifier2);
        node.data.implementation = consts.CnotImplementation;
        node.data.implementationType = "openqasm2";
      }
    }

    if (node.type === "positionNode") {
      node.data.dataType = node.data.label;
      node.data.value = "";
      node.data.outputIdentifier = "";
    }

    if (node.type === "statePreparationNode" && node.data.label === "Encode Value") {
      node.data.encodingType = "";
      node.data.bound = 0;
      node.data.size = "";
      node.data.outputIdentifier = "";
    }

    if (node.type === "statePreparationNode" && node.data.label === "Prepare State") {
      node.data.quantumStateName = "";
      node.data.size = "";
      node.data.outputIdentifier = "";
    }
    if (node.type === "arithmeticOperatorNode") {
      node.data.operator = "";
      node.data.outputIdentifier = "";
    }
    set({
      nodes: [...currentNodes, node],
      edges: currentEdges,
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },

  setEdges: (edge: Edge) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    for (let edge of currentEdges) {
      edge.type = "quantumEdge";

    }
    const newHistoryItem: HistoryItem = {
      nodes: [...currentNodes], // Copy the nodes array to avoid mutation
      edges: [...currentEdges], // Copy the edges array to avoid mutation
    };

    console.log("Updating history (setEdges):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);

    set({
      nodes: currentNodes,
      edges: [...currentEdges, edge],
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },

  onNodesChange: (changes: NodeChange[]) => {
    const currentNodes = applyNodeChanges(changes, get().nodes);
    const currentEdges = get().edges;
    console.log(currentNodes)
    const newHistoryItem: HistoryItem = {
      nodes: [...get().nodes], // Copy the nodes array to avoid mutation
      edges: [...currentEdges], // Copy the edges array to avoid mutation
    };
    console.log(changes);
    // Avoid unnecessary history updates if there are no changes
    const validChanges = changes.filter((change) => {
      if (
        (change.type === "position" && !change.dragging) ||
        change.type === "select"
      ) {
        console.log("Ignoring position change as dragging is false");
        return false; // Ignore position change when not dragging
      }
      return true; // Keep other changes
    });

    if (validChanges.length === 0) {
      // No meaningful changes
      console.log("No meaningful node changes. Skipping history update.");
      return;
    }
    console.log("Updating history (onNodesChange):");
    console.log("Current Nodes:", get().nodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);

    set({
      nodes: currentNodes,
      edges: currentEdges,
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const currentNodes = get().nodes;
    const currentEdges = applyEdgeChanges(changes, get().edges);
    const newHistoryItem: HistoryItem = {
      nodes: [...currentNodes], // Copy the nodes array to avoid mutation
      edges: [...currentEdges], // Copy the edges array to avoid mutation
    };

    console.log(changes);
    console.log("Updating history (onEdgesChange):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);

    set({
      nodes: currentNodes,
      edges: currentEdges,
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },

  onConnect: (connection: Connection) => {
    const currentNodes = get().nodes;
    console.log(connection)
    //const currentEdges = addEdge(connection, get().edges);
    const currentEdges = get().edges;
    const newHistoryItem: HistoryItem = {
      nodes: [...currentNodes], // Copy the nodes array to avoid mutation
      edges: [...get().edges], // Copy the edges array to avoid mutation
    };
    console.log(currentNodes)
    let type = "classicalEdge";
    let color = "#F5A843";
    let nodeDataSource;
    let nodeDataTarget;
    console.log(connection)
    const target = get().nodes.find((node) => node.id === connection.target);
    const hasCycle = (node, visited = new Set()) => {
      if (visited.has(node.id)) { console.log("has"); return false; }

      visited.add(node.id);

      for (const outgoer of getOutgoers(node, get().nodes, get().edges)) {
        if (outgoer.id === connection.source) { console.log("me"); return true; }
        if (hasCycle(outgoer, visited)) { console.log("hasCcycle"); return true; }
      }
    };

    if (target.id === connection.source) { console.log("source target"); return false };
    console.log(!hasCycle(target))
    let cycle = !hasCycle(target);
    for (let node of currentNodes) {
      if (node.id === connection.source) {
        nodeDataSource = node;
      }
      if (node.id === connection.target) {
        nodeDataTarget = node;
      }
    }
    let label;
    let insertEdge = false;
    //handler type and name
    for (let node of currentNodes) {

      if (node.id === connection.source && node.type !== "positionNode") {
        type = "quantumEdge";
        color = "#93C5FD"
      }
      if (node.id === connection.source && node.type === "ancillaNode") {
        type = "ancillaEdge";
        color = "#86EFAC";
      }

      if (node.id === connection.source && node.type === "positionNode" && connection.targetHandle.includes("classicalHandle")) {
        insertEdge = true;
      }
      if (node.id === connection.source && node.type === "ancillaNode" && connection.targetHandle.includes("ancillaHandle")) {
        insertEdge = true;
      }
      if (node.id === connection.source && connection.sourceHandle.includes("quantumHandle") && connection.targetHandle.includes("quantumHandle")) {
        insertEdge = true;
      }
      if (node.id === connection.source && connection.sourceHandle.includes("ancillaHandle") && nodeDataTarget.type === "gateNode" && connection.targetHandle.includes("quantumHandle")) {
        insertEdge = true;
      }
      if (node.id === connection.source && nodeDataSource.type === "gateNode" && nodeDataTarget.type === "gateNode") {
        label = "1";
      }
      if (node.id === connection.source && nodeDataSource.type === "positionNode") {
        console.log(nodeDataSource)
        if (nodeDataSource.data.label === "boolean" || nodeDataSource.data.label === "bit") {
          label = 1;
        } else if (nodeDataSource.data.label ==="Array") {
          let value =  nodeDataSource.data.value.split(',').map(item => Number(item.trim()));
          console.log(value)
          // the biggest number requires the most bits
          let maximum = Math.max(...value);
          console.log(maximum)
          let bits = Math.ceil(Math.log2(maximum));
          label = bits;
        }else {
          let value = nodeDataSource.data.value;
          let bits = Math.ceil(Math.log2(value));
          label = bits;
        }
      }

    }
    // Überprüfung: Existiert bereits eine Edge zur connection.targetHandle?
    const edgeExists = currentEdges.some(edge =>
      edge.targetHandle === connection.targetHandle
    );
    console.log(connection)

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
      label: label
    };

    console.log("Updating history (onConnect):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", get().edges);
    console.log("New History Item:", newHistoryItem);
    if (insertEdge && !edgeExists) {

      console.log(connection.source);
      console.log(nodeDataSource);
      const existingInput = nodeDataTarget.data.inputs.find(
        (input) => input.id === nodeDataSource.id
      );

      if (existingInput) {
        // Update the existing entry
        existingInput.label = nodeDataSource.data.outputIdentifier;
      } else {
        if (nodeDataTarget.type === "statePreparationNode") {
          // Push a new entry
          nodeDataTarget.data.inputs.push({
            id: nodeDataSource.id,

          });
        }

        if (nodeDataTarget.type === "gateNode") {
          console.log(nodeDataTarget)
          if (nodeDataTarget.data.label === "CNOT" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[0]]
            });
          }
          else if (nodeDataTarget.label === "CNOT" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[1]]
            });
          } else if (nodeDataTarget.data.label === "Toffoli" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[0]]
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[1]]
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output3")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[2]]
            });
          } else {
            // Push a new entry
            console.log("push entry")
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: nodeDataSource.data.identifiers
            });
          }
          //nodeDataTarget.data.identifier = nodeDataSource.data.identifier
        } else {
          console.log("push entry")
          nodeDataTarget.data.inputs.push({
            id: nodeDataSource.id,
            identifiers: nodeDataSource.data.identifiers
          });

        }

        // Push a new entry
        //nodeDataTarget.data.inputs.push({
        //id: nodeDataSource.id,
        //label: nodeDataSource.data.outputIdentifier
        //});
      }

      console.log(edge);
      set({
        nodes: currentNodes,
        edges: [edge, ...currentEdges],
        history: [
          ...get().history.slice(0, get().historyIndex + 1),
          newHistoryItem,
        ],
        historyIndex: get().historyIndex + 1,
      });
    } else {

      set({
        nodes: currentNodes,
        edges: [...currentEdges],
        history: [
          ...get().history.slice(0, get().historyIndex + 1),
          newHistoryItem,
        ],
        historyIndex: get().historyIndex + 1,
      });
    }
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },
  onConnectEnd: (event: MouseEvent) => {
    const currentNodes = get().nodes;
    console.log(event);


    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },
  updateNodeLabel: (nodeId: string, nodeVal: string) => {
    console.log("label")
    const currentNodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        node.data = { ...node.data, label: nodeVal };
      }

      return node;
    });

    const currentEdges = get().edges;
    const newHistoryItem: HistoryItem = {
      nodes: [...get().nodes], // Copy the nodes array to avoid mutation
      edges: [...currentEdges], // Copy the edges array to avoid mutation
    };

    console.log("Updating history (updateNodeLabel):");
    console.log("Current Nodes:", get().nodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);

    set({
      nodes: currentNodes,
      edges: currentEdges,
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
  },

  updateNodeValue: (nodeId: string, identifier: string, nodeVal: string) => {
    console.log("Updating node value for:", nodeId);
    console.log("Identifier:", identifier, "New Value:", nodeVal);

    set((state) => {
      const { nodes, edges } = state;
      let updatedNodes = [...nodes];
      let reuseQubit = false;
      let sourceIdentifier = 0;
      console.log(sourceIdentifier);
      console.log("set state")

      // Update the target nodes that receive inputs from this node
      edges.forEach((edge) => {
        console.log(sourceIdentifier)
        console.log(edge)
        console.log(nodeId)
        if (edge.source === nodeId) {
          const targetNodeIndex = updatedNodes.findIndex((n) => n.id === edge.target);
          if (targetNodeIndex !== -1) {
            const targetNode = { ...updatedNodes[targetNodeIndex] };
            const targetData = { ...targetNode.data };
            const sourceNode = updatedNodes.find((n) => n.id === edge.source);
            sourceIdentifier = sourceNode?.data?.identifiers;
            console.log("sourceIdentifier");
            console.log(sourceIdentifier)
            const sourceOutputIdentifier = sourceNode?.data?.outputIdentifier;

            if (!targetData.inputs) targetData.inputs = [];

            const inputIndex = targetData.inputs.findIndex((input) => input.id === nodeId);

            if (identifier === "outputIdentifier") {
              if (inputIndex !== -1) {
                if (targetData.inputs[inputIndex].outputIdentifier === sourceOutputIdentifier) {
                  targetData.inputs[inputIndex].outputIdentifier = nodeVal;
                  targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                  targetData["identifiers"] = sourceIdentifier
                  reuseQubit = true;
                  console.log(targetData["identifier"])
                } else {
                  targetData.inputs[inputIndex].outputIdentifier = nodeVal;
                  targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                  targetData["identifiers"] = sourceIdentifier
                  console.log(targetData["identifiers"])
                  if (nodeVal.includes(sourceOutputIdentifier)) {
                    reuseQubit = true;
                  }
                }
              } else {
                targetData.inputs.push({
                  id: nodeId,
                  outputIdentifier: nodeVal,
                  "identifiers": sourceIdentifier,
                });
                targetData["identifiers"] = sourceIdentifier
                console.log(targetData["identifiers"])
                if (nodeVal.includes(sourceOutputIdentifier)) {
                  reuseQubit = true;
                }
              }
            }
          }
        }
        if (edge.target === nodeId) {
          console.log("Target passt")
          const targetNodeIndex = updatedNodes.findIndex((n) => n.id === edge.target);
          if (targetNodeIndex !== -1) {
            const targetNode = { ...updatedNodes[targetNodeIndex] };
            const targetData = { ...targetNode.data };
            const sourceNode = updatedNodes.find((n) => n.id === edge.source);
            sourceIdentifier = sourceNode?.data?.identifiers;
            console.log("sourceIdentifier");
            console.log(sourceIdentifier)
            const sourceOutputIdentifier = sourceNode?.data?.outputIdentifier;

            if (!targetData.inputs) targetData.inputs = [];

            const inputIndex = targetData.inputs.findIndex((input) => input.id === sourceNode.id);

            if (identifier === "outputIdentifier") {
              if (inputIndex !== -1) {
                if (targetData.inputs[inputIndex].outputIdentifier === sourceOutputIdentifier) {
                  targetData.inputs[inputIndex].outputIdentifier = nodeVal;
                  targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                  targetData["identifier"] = sourceIdentifier
                  reuseQubit = true;
                  console.log(targetData["identifier"])
                } else {
                  targetData.inputs[inputIndex].outputIdentifier = nodeVal;
                  targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                  targetData["identifier"] = sourceIdentifier
                  console.log(targetData["identifier"])
                  if (nodeVal.includes(sourceOutputIdentifier)) {
                    reuseQubit = true;
                  }
                }
              } else {
                targetData.inputs.push({
                  id: nodeId,
                  outputIdentifier: nodeVal,
                  "identifiers": sourceIdentifier,
                });
                targetData["identifiers"] = sourceIdentifier
                console.log(targetData["identifiers"])
                if (nodeVal.includes(sourceOutputIdentifier)) {
                  reuseQubit = true;
                }
              }
            }
          }
        }
      });

      // Update the node's own properties
      updatedNodes = updatedNodes.map((node) => {
        if (node.id === nodeId) {
          if (identifier === "width") {
            console.log("updATE WIDTH")

            node.width = node.width + 500;
            return {
              ...node,
              style: {
                height: node.height,
                width: 1000,
              },
            };
          }
          console.log(node.data["identifiers"])
          //node.data["identifiers"] = sourceIdentifier
          if (identifier === "parentNode") {
            console.log("update parentnode")
            node.parentNode = nodeVal
            return {
              ...node,
              data: {
                ...node.data,
                [identifier]: nodeVal,

              },
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

      console.log(updatedNodes)

      return {
        nodes: updatedNodes,
        edges: edges,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { nodes: [...updatedNodes], edges: [...edges] },
        ],
        historyIndex: state.historyIndex + 1,
      };
    });

    console.log("History updated successfully.");
  },
  updateParent: (nodeId: string, parentId: string, position: any) => {
    console.log("Updating parent value for:", nodeId);
    console.log("Identifier:", parentId);

    set((state) => {
      const { nodes, edges } = state;
      let updatedNodes = [...nodes];
      let reuseQubit = false;
      let sourceIdentifier = 0;
      console.log(sourceIdentifier);
      console.log("set state")



      // Update the node's own properties
      updatedNodes = updatedNodes.map((node) => {
        if (node.id === nodeId) {
          console.log(node.data["identifier"])

          node.parentNode = parentId;
          node.position = position;
          node.extent = "parent"
          return {
            ...node,
            data: {
              ...node.data
            },
          };
        }
        return node;
      });

      console.log(updatedNodes)

      return {
        nodes: updatedNodes,
        edges: edges,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { nodes: [...updatedNodes], edges: [...edges] },
        ],
        historyIndex: state.historyIndex + 1,
      };
    });

    console.log("History updated successfully.");
  },
  undo: () => {
    const historyIndex = get().historyIndex;
    if (historyIndex > 0) {
      const previousHistoryItem = get().history[historyIndex - 1];
      console.log("Performing undo:");
      console.log("Previous History Item:", previousHistoryItem);
      set({
        nodes: previousHistoryItem.nodes,
        edges: previousHistoryItem.edges,
        historyIndex: historyIndex - 1,
      });
    }
    console.log("History after undo:", get().history);
    console.log("Current historyIndex after undo:", get().historyIndex);
  },

  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex < history.length - 1) {
      const nextHistoryItem = history[historyIndex + 1];

      set({
        nodes: nextHistoryItem.nodes,
        edges: nextHistoryItem.edges,
        historyIndex: historyIndex + 1,
      });
    } else {
      console.warn("Redo is not possible: no further history to redo");
    }

    console.log("Updated state after redo:", get());
  },
}));

export default useStore;
