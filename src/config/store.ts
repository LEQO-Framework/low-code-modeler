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
  useUpdateNodeInternals,
} from "reactflow";
import { create } from "zustand";
import { nodesConfig } from "./site";
import { v4 as uuid } from "uuid";
import * as consts from "../constants";
import TabPane from "antd/es/tabs/TabPane";
import { IPortData } from "@/components/nodes/model";
import { Regex } from "lucide-react";

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
  ancillaMode: boolean;
  experienceLevel: string;
  compact: boolean;
  completionGuaranteed: boolean;
  selectedNode: Node | null;
  history: HistoryItem[];
  historyIndex: number;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  setAncillaMode: (ancillaMode: boolean) => void
  setCompletionGuaranteed: (completionGuaranteed: boolean) => void
  setCompact: (compact: boolean) => void
  setExperienceLevel: (experienceLevel: string) => void
  setNewEdges: (newEdges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectEnd: OnConnectEnd;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (nodeId: string, identifier, nodeVal: any) => void;
  setSelectedNode: (node: Node | null) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  updateChildren: (nodeId: string, childIds: string[]) => void;
  undo: () => void;
  redo: () => void;
};

// Zustand store with undo/redo logic
export const useStore = create<RFState>((set, get) => ({
  nodes: nodesConfig.initialNodes,
  edges: nodesConfig.initialEdges,
  ancillaMode: false,
  compact: false,
  completionGuaranteed: true,
  experienceLevel: "explorer",
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
    console.log(node)
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
  setAncillaMode: (ancillaMode: boolean) => {
    const currentEdges = get().edges.map(edge => {
      // If edge.sourceHandle contains "ancillaHandle", hide it when ancillaMode is true
      if (edge.sourceHandle?.includes("ancillaHandle")) {
        return { ...edge, hidden: !ancillaMode };
      }
      // Otherwise, ensure edge is not hidden
      return { ...edge, hidden: false };
    });

    set({
      ancillaMode,
      edges: currentEdges,
    });
  },
  setExperienceLevel: (experienceLevel: string) => {
    set({
      experienceLevel
    });
  },
  setCompact: (compact: boolean) => {
    const currentNodes = get().nodes.map(node => {
      console.log(node)
      if (!node.data.compactOptions.includes(compact)) {
        return { ...node, hidden: !compact };
      }
  
      return { ...node, hidden: false };
    });
    const hiddenNodeIds = new Set(
      currentNodes.filter(n => n.hidden).map(n => n.id)
    );
    const currentEdges = get().edges.map(edge => {
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
      edges: currentEdges
    });
  },
  setCompletionGuaranteed: (completionGuaranteed: boolean) => {

    const currentNodes = get().nodes.map(node => {
      if (!node.data.completionGuaranteed) {
        return { ...node, hidden: completionGuaranteed };
      }
      return { ...node, hidden: false };
    });
    const hiddenNodeIds = new Set(
      currentNodes.filter(n => n.hidden).map(n => n.id)
    );
    const currentEdges = get().edges.map(edge => {
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
      nodes: currentNodes
    });
  },

  setNewEdges: (newEdges: Edge[]) => {
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const newHistoryItem: HistoryItem = {
      nodes: [...currentNodes], // Copy the nodes array to avoid mutation
      edges: newEdges, // Copy the edges array to avoid mutation
    };

    console.log("Updating history (setEdges):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);

    set({
      nodes: currentNodes,
      edges: newEdges,
      history: [
        ...get().history.slice(0, get().historyIndex + 1),
        newHistoryItem,
      ],
      historyIndex: get().historyIndex + 1,
    });
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);
    console.log(get().edges)
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

    if (get().nodes.length < currentNodes) {
      set({
        selectedNode: null,
        nodes: currentNodes,
        edges: currentEdges,
        history: [
          ...get().history.slice(0, get().historyIndex + 1),
          newHistoryItem,
        ],
        historyIndex: get().historyIndex + 1,
      });
    } else {

      set({
        selectedNode: null,
        nodes: currentNodes,
        edges: currentEdges,
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
    console.log("ON CONNECT")
    const currentNodes = get().nodes;
    const ancillaMode = get().ancillaMode;
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

    if (target.id === connection.source && target.type !== "splitterNode" && target.type !== "mergerNode") { console.log("source target"); return false };
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
    let insertEdge = false;
    for (let node of currentNodes) {

      if (node.id === connection.source && (connection.sourceHandle.includes(consts.quantumHandle) || connection.sourceHandle.includes("sideQuantumHandle")) && connection.targetHandle.includes(consts.quantumHandle)) {
        type = "quantumEdge";
        color = "#93C5FD";

      }
      if (node.id === connection.source && (connection.sourceHandle.includes("ancilla") || connection.sourceHandle.includes("dirtyAncilla")) && (connection.sourceHandle.includes("ancilla") || connection.sourceHandle.includes("dirtyAncilla"))) {
        type = "ancillaEdge";
        color = "#86EFAC";

      }

      // allow only classical flow between classical handles 
      if (node.id === connection.source && connection.sourceHandle.includes(consts.classicalHandle) && connection.targetHandle.includes(consts.classicalHandle)) {
        insertEdge = true;
      }

      // allow only ancilla flow between ancilla handles 
      if (node.id === connection.source && connection.sourceHandle.includes(consts.ancillaHandle)
        && connection.targetHandle.includes(consts.ancillaHandle)) {
        insertEdge = true;
      }
      // allow only ancilla flow between ancilla handles 
      if (node.id === connection.source && connection.sourceHandle.includes(consts.dirtyAncillaHandle)
        && connection.targetHandle.includes(consts.dirtyAncillaHandle)) {
        insertEdge = true;
      }

      if (node.id === connection.source && nodeDataSource.type === consts.AncillaNode && connection.targetHandle.includes("ancillaHandle")) {
        insertEdge = true;
      }

      if (node.id === connection.source && connection.sourceHandle.includes("ancillaHandle") && nodeDataTarget.type === "gateNode" && connection.targetHandle.includes("quantumHandle")) {
        insertEdge = true;
      }

      if (nodeDataSource.type === "splitterNode" || nodeDataSource.type === "mergerNode") {
        // only allow source connections that are inside the node
        //if (connection.sourceHandle && connection.sourceHandle.startsWith("quantumHandle") && connection.sourceHandle.endsWith(nodeDataSource.id) && connection.targetHandle.endsWith(nodeDataSource.id)) {
        insertEdge = true;
        //} else {
        //insertEdge = false;
        //}
      }

      console.log(nodeDataSource.type)
      console.log(connection);
      console.log(nodeDataTarget)

      // only allow connections from inside quantum handles 
      if (nodeDataSource.type === "ifElseNode" && connection.sourceHandle.includes("sideQuantumHandle") && connection.targetHandle.includes("quantumHandle") && nodeDataTarget.parentNode === nodeDataSource.id) {
        insertEdge = true;
      }

      // only allow connections to inside quantum handles 
      if (nodeDataTarget.type === "ifElseNode" && connection.targetHandle.includes("quantumHandleDynamic") && connection.targetHandle.includes("quantumHandle") && nodeDataSource.parentNode === nodeDataTarget.id) {
        insertEdge = true;
      }

      // only allow connections from inside classical handles 
      if (nodeDataSource.type === "ifElseNode" && connection.sourceHandle.includes("sideClassicalHandle") && connection.targetHandle.includes("classicalHandle") && nodeDataTarget.parentNode === nodeDataSource.id) {
        insertEdge = true;
      }

      // only allow connections from inside classical handles 
      if (nodeDataSource.type === "ifElseNode" && connection.sourceHandle.includes("sideClassicalHandle") && connection.targetHandle.includes("classicalHandle") && nodeDataTarget.parentNode === nodeDataSource.id) {
        insertEdge = true;
      }

      console.log(connection);

      if (node.id === connection.source && connection.sourceHandle.startsWith("quantumHandle") && connection.targetHandle.includes("quantumHandle")) {
        insertEdge = true;
      }
      if (node.id === connection.source && connection.sourceHandle.startsWith("dirtyAncillaHandle") && connection.targetHandle.includes("dirtyAncillaHandle")) {
        insertEdge = true;
      }

      if ((nodeDataSource.parentNode !== nodeDataTarget.parentNode)) {
        insertEdge = false;
      }
      if (nodeDataSource.id === nodeDataTarget.parentNode) {
        insertEdge = true;
      }
      if (nodeDataTarget.id === nodeDataSource.parentNode) {
        insertEdge = true;
      }
    }
    // Überprüfung: Existiert bereits eine Edge zur connection.targetHandle?
    const edgeExists = currentEdges.some(edge =>
      edge.targetHandle === connection.targetHandle && nodeDataTarget.type !== "mergerNode"
    );

    console.log(connection)
    console.log(insertEdge);
    console.log(!edgeExists)

    const edge = {
      ...connection,
      type: type,
      id: uuid(),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: color,
        hidden: ancillaMode
      }
      //label: label
    };

    console.log("Updating history (onConnect):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", get().edges);
    console.log("New History Item:", newHistoryItem);
    const getOutputIndex = (sourceHandle: String, nodeDataSource: Node) => {
      const tmpHandle = sourceHandle.split(nodeDataSource.id)[0];
      const outputIndex = tmpHandle.match(/\d+$/)[0];
      return parseInt(outputIndex, 10);
    };

    if (insertEdge && !edgeExists) {
      console.log("ONCONNECT")
      console.log(connection)
      console.log(connection.source);

      console.log(nodeDataSource);
      const existingInput = nodeDataTarget.data.inputs.find(
        (input) => (input.id === nodeDataSource.id && input.targetHandle === connection.targetHandle)
      );
      console.log("existing input", existingInput)
      const outputIndex = getOutputIndex(connection.sourceHandle, nodeDataSource);
      console.log("sourceHandle", connection.sourceHandle)
      console.log("index", outputIndex)
      console.log(nodeDataSource.data.outputs?.[outputIndex]?.identifier)
      var sourceOutputIdentifier = "";
      if(nodeDataSource.type === "algorithmNode" || nodeDataSource.type === "classicalAlgorithmNode" || nodeDataSource.type === "measurementNode") {
        sourceOutputIdentifier = nodeDataSource.data.outputs?.[outputIndex]?.identifier 
      } else {
        sourceOutputIdentifier = nodeDataSource.data.outputs?.[outputIndex]?.identifier ?? nodeDataSource.data?.outputIdentifier
      }
      if (existingInput) {
        
        // Update the existing entry
        existingInput.outputIdentifier = sourceOutputIdentifier;
      } else {
        if (nodeDataTarget.type === "statePreparationNode") {
          // Push a new entry
          console.log("VNSOIVNOIDNO")
          nodeDataTarget.data.inputs.push({
            id: nodeDataSource.id,
            outputIdentifier: sourceOutputIdentifier,
            targetHandle: connection.targetHandle
          });
        }

        if (nodeDataTarget.type === "gateNode") {
          console.log(nodeDataTarget)
          if (nodeDataTarget.data.label === "CNOT" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[0]],
              targetHandle: connection.targetHandle
            });
          }
          else if (nodeDataTarget.label === "CNOT" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[1]],
              targetHandle: connection.targetHandle
            });
          } else if (nodeDataTarget.data.label === "Toffoli" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[0]],
              targetHandle: connection.targetHandle
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[1]],
              targetHandle: connection.targetHandle
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output3")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              identifiers: [nodeDataSource.data.identifiers[2]],
              targetHandle: connection.targetHandle
            });
          } else {
            if (!edge.sourceHandle.includes("side") && !edge.targetHandle.includes("side")) {
              // Push a new entry
              console.log("push entry")
              nodeDataTarget.data.inputs.push({
                id: nodeDataSource.id,
                identifiers: nodeDataSource.data.identifiers,
                targetHandle: edge.targetHandle
              });
            }
          }
          //nodeDataTarget.data.identifier = nodeDataSource.data.identifier
        } else {
          if (!edge.sourceHandle.includes("side") && !edge.targetHandle.includes("side") && !edge.sourceHandle.includes("Dynamic") && !edge.targetHandle.includes("Dynamic")) {
            console.log("push entry")
            console.log(edge)
            console.log(connection)
            console.log(nodeDataSource)
            console.log(nodeDataTarget)
            const outputIndex = getOutputIndex(connection.sourceHandle, nodeDataSource);
            console.log("sourceHandle", connection.sourceHandle)
            console.log("index", outputIndex)
            const sourceNode = currentNodes.find(n => n.id === edge.source)
            console.log(sourceNode.data.outputs?.[outputIndex]?.identifier)
            var sourceOutputIdentifier = "";
            if(nodeDataSource.type === "algorithmNode" || nodeDataSource.type === "classicalAlgorithmNode" || nodeDataSource.type === "measurementNode") {
              sourceOutputIdentifier = nodeDataSource.data.outputs?.[outputIndex]?.identifier 
            } else {
              sourceOutputIdentifier = nodeDataSource.data.outputs?.[outputIndex]?.identifier ?? nodeDataSource.data?.outputIdentifier
            }
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              outputIdentifier: sourceOutputIdentifier, 
              identifiers: nodeDataSource.data.identifiers,
              targetHandle: edge.targetHandle
            });
          }

        }

        // Push a new entry
        //nodeDataTarget.data.inputs.push({
        //id: nodeDataSource.id,
        //label: nodeDataSource.data.outputIdentifier
        //});
      }

      set((state) => {
        const { nodes, edges } = state;
        let updatedNodes = [...nodes];
        let reuseQubit = false;
        let sourceIdentifier = 0;
        console.log(sourceIdentifier);
        console.log("set state")

        // Update the target nodes that receive inputs from this node


        if (edge.source === connection.source) {
          const targetNodeIndex = updatedNodes.findIndex((n) => n.id === edge.target);
          const sourceHandle = connection.sourceHandle;
          console.log(targetNodeIndex)
          if (targetNodeIndex !== -1) {
            const targetNode = { ...updatedNodes[targetNodeIndex] };
            const targetData = { ...targetNode.data };
            const sourceNode = updatedNodes.find((n) => n.id === edge.source);
            sourceIdentifier = sourceNode?.data?.identifiers;
            console.log("sourceIdentifier");
            console.log(sourceIdentifier)
            //let sourceOutputIdentifier = sourceNode?.data?.outputIdentifier;
            const outputIndex = getOutputIndex(sourceHandle, sourceNode);
            console.log("sourceHandle", sourceHandle)
            console.log("index", outputIndex)
            var sourceOutputIdentifier = "";
            if(sourceNode.type === "algorithmNode" || sourceNode.type === "classicalAlgorithmNode" || sourceNode.type === "measurementNode") {
              sourceOutputIdentifier = sourceNode.data.outputs?.[outputIndex]?.identifier 
            } else {
              sourceOutputIdentifier = sourceNode.data.outputs?.[outputIndex]?.identifier ?? sourceNode?.data?.outputIdentifier
            }
            console.log("sourceNode", sourceNode)

            console.log(sourceIdentifier)

            if (!targetData.inputs) targetData.inputs = [];

            const inputIndex = targetData.inputs.findIndex((input) => (input.id === connection.source && connection.targetHandle === input.targetHandle));
            console.log("input index", inputIndex)
            console.log("target inputs", targetData.inputs)

            if (inputIndex !== -1) {
              if (targetData.inputs[inputIndex].outputIdentifier === sourceOutputIdentifier) {
                targetData.inputs[inputIndex].outputIdentifier = sourceOutputIdentifier;
                targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                targetData["identifiers"] = sourceIdentifier
                reuseQubit = true;
                console.log(targetData["identifier"])
              } else {
                targetData.inputs[inputIndex].outputIdentifier = sourceOutputIdentifier;
                targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                targetData["identifiers"] = sourceIdentifier
                console.log(targetData["identifiers"])

              }
            } else {
              targetData.inputs.push({
                id: connection.source,
                outputIdentifier: sourceOutputIdentifier,
                "identifiers": sourceIdentifier,
                targetHandle: connection.targetHandle
              });
              targetData["identifiers"] = sourceIdentifier
              console.log(targetData["identifiers"])

            }


          }
        }


        console.log(edge);
        console.log(updatedNodes)

        return ({
          nodes: updatedNodes,
          edges: [edge, ...currentEdges],
          history: [
            ...get().history.slice(0, get().historyIndex + 1),
            newHistoryItem,
          ],
          historyIndex: get().historyIndex + 1,
        });
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
    console.log(event)

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

  updateNodeValue: (nodeId: string, identifier: string, nodeVal: any) => {
    console.log("Updating node value for:", nodeId);
    console.log("Identifier:", identifier, "New Value:", nodeVal);
    const getOutputIndex = (sourceHandle: String, nodeDataSource: Node) => {
      const tmpHandle = sourceHandle.split(nodeDataSource.id)[0];
      const outputIndex = tmpHandle.match(/\d+$/)[0];
      return parseInt(outputIndex, 10);
    };


    set((state) => {
      const { nodes, edges } = state;
      let updatedNodes = [...nodes];
      let reuseQubit = false;
      let sourceIdentifier = 0;
      console.log(sourceIdentifier);
      console.log("set state")

      // Update the target nodes that receive inputs from this node
      edges.forEach((edge) => {
        console.log("Update target node that receive inputs from this node")
        console.log(sourceIdentifier)
        console.log(edge)
        console.log(nodeId)
        if (edge.source === nodeId) { // todo korrekte targetNode input updaten
          const targetNodeIndex = updatedNodes.findIndex((n) => n.id === edge.target);
          if (targetNodeIndex !== -1) {
            const targetNode = { ...updatedNodes[targetNodeIndex] };
            const targetData = { ...targetNode.data };
            const sourceNode = updatedNodes.find((n) => n.id === edge.source);
            sourceIdentifier = sourceNode?.data?.identifiers;
            console.log("sourceIdentifier");
            console.log(sourceIdentifier)
            const sourceHandle = edge.sourceHandle;
            const outputIndex = getOutputIndex(sourceHandle, sourceNode);
            var sourceOutputIdentifier = "";
            if(sourceNode.type === "algorithmNode" || sourceNode.type === "classicalAlgorithmNode" || sourceNode.type === "measurementNode") {
              sourceOutputIdentifier = sourceNode.data.outputs?.[outputIndex]?.identifier;
            } else {
              sourceOutputIdentifier = sourceNode.data.outputs?.[outputIndex]?.identifier ?? nodeVal;
            }
            console.log("sourceHandle", sourceHandle);
            console.log("index", outputIndex);
            console.log("source Output Identifier", sourceOutputIdentifier);
            console.log("source node", sourceNode);

            if (!targetData.inputs) targetData.inputs = [];

            const inputIndex = targetData.inputs.findIndex((input) => (input.id === nodeId && edge.targetHandle === input.targetHandle));
            console.log("inputIndex", inputIndex);

            if (identifier === "outputIdentifier") {
              console.log("erstes if")
              if (inputIndex !== -1) {
                console.log("inputIndex != -1")
                if (targetData.inputs[inputIndex].outputIdentifier === sourceOutputIdentifier) {
                  console.log("targetData outputidentifier === sourceOutput ")
                  targetData.inputs[inputIndex].outputIdentifier = sourceOutputIdentifier;
                  targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                  targetData["identifiers"] = sourceIdentifier
                  reuseQubit = true;
                  console.log(targetData["identifier"])
                } else {
                  targetData.inputs[inputIndex].outputIdentifier = sourceOutputIdentifier;
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
                  outputIdentifier: sourceOutputIdentifier,
                  "identifiers": sourceIdentifier,
                  //targetHandle: connection.targetHandle
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
          if (identifier === "hidden") {
            console.log("updATE WIDTH")
            return {
              ...node,
              style: {
                height: node.height,
                width: node.width,
                hidden: true
              },
              hidden: true
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
    console.log("History after update:", get().history);
    console.log("Current historyIndex:", get().historyIndex);

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
  updateChildren: (nodeId, child: any) => {
    console.log("Updating children value for:", nodeId);

    set((state) => {
      const { nodes, edges } = state;
      let updatedNodes = [...nodes];

      // Update the node's own properties
      for (let i = 0; i < updatedNodes.length; i++) {
        if (updatedNodes[i].id === nodeId) {

          let parentNode = updatedNodes[i];
          console.log(parentNode);
          let children = parentNode.data?.children;
          console.log(children)
          console.log(!children)
          console.log(child)
          console.log(children.includes(child))

          if (children !== undefined && !children.includes(child)) {
            children.push(child);
          }
          console.log(children)
          updatedNodes = updatedNodes.map((node) => {
            // find children and add this to the children attribute
            if (node.parentNode === nodeId) {
              console.log("found parent")
              console.log(node.data["identifier"])
              return {
                ...node,
                data: {
                  ...node.data,
                  children: children
                },
              };
            }
            return node;
          });
        }
      }

      console.log(updatedNodes)

      return {
        nodes: updatedNodes,
        edges: edges,
        history: [
          ...state.history.slice(0, state.historyIndex + 1),
          { nodes: [...nodes], edges: [...edges] },
        ],
        historyIndex: state.historyIndex + 1,
      };
    });

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