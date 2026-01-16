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
import TabPane from "antd/es/tabs/TabPane";
import { insertTopNodeTag } from "@/winery";
import { remove } from "jszip";

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
  containsPlaceholder: boolean;
  selectedNode: Node | null;
  history: HistoryItem[];
  historyIndex: number;
  typeError: string | null;
  setTypeError: (message: string | null) => void;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  setAncillaMode: (ancillaMode: boolean) => void
  setCompletionGuaranteed: (completionGuaranteed: boolean) => void
  setContainsPlaceholder: (containsPlaceholder: boolean) => void
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
  containsPlaceholder: false,
  typeError: null,

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
    // Helper to get default types based on node type and label
    const getInitialInputTypes = (node: Node): string[] => {
      const type = node.type;
      const label = node.data.label ?? "";

      if (type === "classicalOperatorNode") {
        if (label.includes("Bitwise")) return ["bit", "bit"];
        if (label.includes("Arithmetic")) return ["any", "any"];
        if (label.includes("Comparison")) return ["any", "any"];
        if (label.includes("Min & Max")) return ["array"];
      }
      else if (type === "measurementNode") return ["quantum register"];
      else if (type === "quantumOperatorNode") {
        if(label.includes("Min & Max")) return ["quantum register"];
        else return ["quantum register", "quantum register"];
      }
      else if (type === "statePreparationNode") {
        const encodingType = node.data.encodingType?? "";
        console.log("encodingType", encodingType)
        if(encodingType.includes("Matrix") || encodingType.includes("Amplitude") || encodingType.includes("Angle") || encodingType.includes("Schmidt")) return ["array"];
        if(encodingType.includes("Basis") || encodingType.includes("Custom")) return ["any"];
      }

      return []; // Default empty
    }
    const getInitialOutputTypes = (node: Node): string[] => {
      const type = node.type;
      const label = node.data.label ?? "";

      if (type.includes("OperatorNode")) {
        if (label.includes("Comparison")) return ["boolean"];
        else if (label.includes("Min & Max")) return ["number"];
        else if (type.includes("quantum")) {
          if (label.includes("Bit")) return ["quantum register"];
          else if (label.includes("Arithmetic")) return ["quantum register"];
        } else if (type.includes("classical")) {
          if (label.includes("Bit")) return ["bit"];
          else if (label.includes("Arithmetic")) return ["any"];
        }
      }
      else if (type === "measurementNode") return ["array", "quantum register"];
      else if (type === "qubitNode" || type === "ancillaNode" || type === "statePreparationNode") return ["quantum register"];
      else if (type === "dataTypeNode") return [(node.data.dataType ?? "any").toLowerCase()];
      return []; // Default empty
    }
    const inputTypes = getInitialInputTypes(node);
    const outputTypes = getInitialOutputTypes(node);
    node.data.inputTypes = inputTypes;
    node.data.outputTypes = outputTypes;

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
  setContainsPlaceholder: (containsPlaceholder: boolean) => {
    set({
      containsPlaceholder
    });
  },
  setCompact: (compact: boolean) => {
    const currentNodes = get().nodes.map(node => {
      let newNode = { ...node };

      // handle compact change
      if (compact && (node.data.label === "Basis Encoding" || node.data.label === "Angle Encoding" || node.data.label === "Amplitude Encoding")) {
        newNode = {
          ...newNode,
          data: { ...newNode.data, label: "Encode Value" },
          hidden: false
        };
      } else if (!compact && node.data.label === "Encode Value") {
        // Restore original encoding type when leaving compact mode
        const originalLabel = node.data.encodingType || "Encode Value";
        newNode = {
          ...newNode,
          data: { ...newNode.data, label: originalLabel },
          hidden: false
        };
      } else {

        const hideNode = !node.data.compactOptions?.includes(compact);
        newNode = { ...newNode, hidden: hideNode };
      }

      return newNode;
    });

    const hiddenNodeIds = new Set(
      currentNodes.filter(n => n.hidden).map(n => n.id)
    );

    const currentEdges = get().edges.map(edge => {
      if (hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)) {
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
    const currentEdges = get().edges;

    let updatedNodes = [... currentNodes];
    changes.forEach((change) => {
      // make changes to source and target of removed edges
      if (change.type === "remove") {
        const removedEdge = get().edges.find((e) => e.id === change.id)
        console.log("removed edge", removedEdge);
        const targetNode = currentNodes.find((n) => n.id === removedEdge.target);
        const sourceNode = currentNodes.find((n) => n.id === removedEdge.source);
        console.log(targetNode);

        const targetNodeIndex = currentNodes.findIndex((n) => n.id === targetNode.id);
        
        let targetData = {
          ... targetNode.data,
          inputs: [... (targetNode.data.inputs || [])]
        };
        // remove targetNode.data.inputs entry corresponding to removed edge
        const inputIndex = targetData.inputs.findIndex((i) => (i.edgeId ?? -1) === removedEdge.id);
        const updatedInputs = targetData.inputs.filter((i) => (i.edgeId ?? -1) !== removedEdge.id);
        console.log("updatedInputs", updatedInputs)
        targetData.inputs = updatedInputs;
        

        // revert inputTypes in targetNode.data.inputTypes to "any", if applicable for targetNode
        if(targetNode.type === consts.ClassicalOperatorNode && (targetNode.data.label.includes("Arithmetic") || targetNode.data.label.includes("Comparison"))){
          const sourceHandle = removedEdge.sourceHandle;
          const targetHandle = removedEdge.targetHandle;

          const handleIndex = getHandleIndex(targetNode.id, targetHandle);
          const otherHandleIndex = handleIndex===0?1:0;
          // find other edge connected to targetNode
          const otherEdge = get().edges.find((e) => e.target === targetNode.id && e.id !== removedEdge.id);
          // if no other edge exists: revert input & output type
          if(!otherEdge) {
            targetData.inputTypes = ["any", "any"];
            if(targetNode.data.label.includes("Arithmetic")) {
              targetData.outputTypes = ["any"];
            }
          }
        }

        updatedNodes[targetNodeIndex] = {
          ...targetNode,
          data: targetData,
        };
      }
    });


    const updatedEdges = applyEdgeChanges(changes, get().edges);
    const newHistoryItem: HistoryItem = {
      nodes: updatedNodes, // Copy the nodes array to avoid mutation
      edges: updatedEdges, // Copy the edges array to avoid mutation
    };

    console.log(changes);
    console.log("Updating history (onEdgesChange):");
    console.log("Current Nodes:", currentNodes);
    console.log("Current Edges:", currentEdges);
    console.log("New History Item:", newHistoryItem);


    set({
      nodes: updatedNodes,
      edges: updatedEdges,
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
    const getNodeLockedType = (nodeId: string): string => {
      const node = get().nodes.find(n => n.id === nodeId);
      if (!node) return "any";
      if (node.type === consts.AlgorithmNode || node.type === consts.ClassicalAlgorithmNode) {
        return "any"
      }

      // Find the first input that has a type other than "any"
      if(node.data.inputs){
        for (const input of node.data.inputs) {
          const sourceNode = get().nodes.find(n => n.id === input.id);
          if (!sourceNode) continue;

          let type = "any";
          if (sourceNode.type === "dataTypeNode") type = sourceNode.data?.dataType ?? "any";
          else if (sourceNode.type === "ClassicalOperationNode") {
            type = getNodeLockedType(sourceNode.id);
          } else if(sourceNode.data.outputTypes[0]) {
            type = sourceNode.data.outputTypes[0]; // TODO:  eigentlich sollte man da den richtigen outputType aussuchen. Geht mittlerweile, weil edgeId mitgespeichert wird. 
          }

          if (type !== "any") return type;
        }
      }
      // Find entry in inputTypes != any
/*       if(node.data.inputTypes){
        for(const type of node.data.inputTypes) {
          if(type.toLowerCase() !== "any") return type;
        }
      } */
      return "any"; // no locked type yet
    };

    const getNodeOutputType = (nodeId: string, handleId?: string): string => {
      const node = get().nodes.find(n => n.id === nodeId);
      if (!node) return "any";
      const index = getHandleIndex(nodeId, handleId);
      console.log("GETNODEOUTPUTTYPES", node.data.outputTypes)
      console.log(handleId)
      console.log("INDEX", index)
      if (node.data.outputTypes[index]) return node.data.outputTypes[index];

      // Measurement Node
      if (node.type === "measurementNode") {
        // If handleId is specified, pick the correct output
        if (handleId === node.data.outputs?.[0]?.id) return "array";
        if (handleId === node.data.outputs?.[1]?.id) return "quantum register";
        // Default fallback
        return "any";
      }

      // Data type node
      if (node.type === "dataTypeNode") return node.data?.dataType ?? "any";

      // Classical Operators
      if (
        node.type === consts.ClassicalOperatorNode ||
        node.type === "ClassicalAlgorithmNode"
      ) {
        switch (node.data.label) {
          case "Classical Arithmetic Operator":
            // Arithmetic operator: output type comes from first input type (assuming input types match)
            const firstInputEdge = get().edges.find(
              (e) => e.target === node.id && e.targetHandle === `classicalHandleOperationInput0${node.id}`
            );
            if (firstInputEdge) return getNodeOutputType(firstInputEdge.source, firstInputEdge.sourceHandle);
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
      if (node.type === consts.AlgorithmNode || node.type === consts.ClassicalAlgorithmNode) {
        return "any";
      }

      return "any"; // fallback
    };


    const getNodeInputType = (nodeId: string, handleId: string) => {
      const targetNode = get().nodes.find(n => n.id === nodeId);
      if (!targetNode) return "any";

      // Find input corresponding to this handle
      const input = targetNode.data.inputs?.find((i: any) => i.id === handleId);
      //if (!input) return "any";
      const inputIndex = getHandleIndex(nodeId, handleId);
      console.log("InputIndex", inputIndex);
      //return input.dataType ?? "any"; // fallback to any
      return targetNode.data.inputTypes[inputIndex] ?? "any";
    };

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


    // TYPE CHECK
    let sourceType = getNodeOutputType(connection.source, connection.sourceHandle);
    const targetType = getNodeInputType(connection.target, connection.targetHandle);
    const inputIndex = getHandleIndex(connection.target, connection.targetHandle);
    const setTypeError = get().setTypeError;
    console.log("Types", sourceType, targetType);

    // If types are incompatible, reject connection
    if (targetType !== "any" && sourceType !== "any" && sourceType !== targetType) {
      const errorMsg = `Type mismatch: ${sourceType} -> ${targetType}, connection rejected`
      console.log(errorMsg);
      setTypeError(errorMsg); 
      insertEdge = false;
      return false; // reject edge
    }
    const targetNode = get().nodes.find(n => n.id === connection.target);
    if (!targetNode) {
      insertEdge = false;
      return false;
    }

    const lockedType = getNodeLockedType(targetNode.id);

    const sourceNode = get().nodes.find(n => n.id === connection.source);

    if (sourceNode) {
      if (sourceNode.type === "dataTypeNode") sourceType = sourceNode.data?.dataType ?? "any";
      else if (sourceNode.type === "ClassicalOperationNode") sourceType = getNodeLockedType(sourceNode.id);
    }

    // If the target node already has a locked type, new input must match
    if (lockedType !== "any" && sourceType !== "any" && sourceType !== lockedType) {
      const errorMsg = `Cannot connect: type "${sourceType}" does not match locked type "${lockedType}"`
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
      console.log("INSERT EDGE")
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
            edgeId: edge.id,
          });
        }

        if (nodeDataTarget.type === "gateNode") {
          console.log(nodeDataTarget)
          if (nodeDataTarget.data.label === "CNOT" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: [nodeDataSource.data.identifiers[0]]
            });
          }
          else if (nodeDataTarget.label === "CNOT" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: [nodeDataSource.data.identifiers[1]]
            });
          } else if (nodeDataTarget.data.label === "Toffoli" && connection.sourceHandle.includes("Output1")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: [nodeDataSource.data.identifiers[0]]
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output2")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: [nodeDataSource.data.identifiers[1]]
            });
          }
          else if (nodeDataTarget.label === "Toffoli" && connection.sourceHandle.endsWith("Output3")) {
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: [nodeDataSource.data.identifiers[2]]
            });
          } else {
            if (!edge.sourceHandle.includes("side") && !edge.targetHandle.includes("side")) {
              // Push a new entry
              console.log("push entry")
              nodeDataTarget.data.inputs.push({
                id: nodeDataSource.id,
                edgeId: edge.id,
                identifiers: nodeDataSource.data.identifiers
              });
            }
          }
          //nodeDataTarget.data.identifier = nodeDataSource.data.identifier
        } else {
          if (!edge.sourceHandle.includes("side") && !edge.targetHandle.includes("side") && !edge.sourceHandle.includes("Dynamic") && !edge.targetHandle.includes("Dynamic")) {
            console.log("push entry")
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              edgeId: edge.id,
              identifiers: nodeDataSource.data.identifiers
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
          console.log(targetNodeIndex)
          if (targetNodeIndex !== -1) {
            const targetNode = { ...updatedNodes[targetNodeIndex] };
            const targetData = { ...targetNode.data };
            const sourceNode = updatedNodes.find((n) => n.id === edge.source);
            sourceIdentifier = sourceNode?.data?.identifiers;
            const sourceType = getNodeOutputType(sourceNode.id, connection.sourceHandle);
            const targetType = getNodeInputType(targetNode.id, connection.targetHandle);
            const lockedType = getNodeLockedType(targetNode.id);
            console.log("SOURCE TYPE", sourceType)
            console.log("TARGET TYPE", targetType)
            console.log("LOCKED TYPE", lockedType)

            console.log("sourceIdentifier");
            console.log(sourceIdentifier)
            const sourceOutputIdentifier = sourceNode?.data?.outputIdentifier;
            console.log(sourceIdentifier)

            if (!targetData.inputs) targetData.inputs = [];

            const inputIndex = targetData.inputs.findIndex((input) => input.id === connection.source);
            const handleIndex = getHandleIndex(targetNode.id, connection.targetHandle);
            // Update target node inputType if it was "any"
            if (targetType === "any") {
              targetData.inputTypes[handleIndex] = sourceType;
            }
            // Update target node input and output types if classical operation node and both inputs are set
            if(targetNode.type === consts.ClassicalOperatorNode && (targetNode.data.label.includes("Arithmetic") || targetNode.data.label.includes("Comparison")) && lockedType !== "any"){
              console.log("updating input output types")
              targetData.inputTypes = [lockedType, lockedType];
              if(targetNode.data.label.includes("Arithmetic")){
                targetData.outputTypes = [lockedType]; 
				//TODO if outputType is changed inputType of any connected Edge should be changed too
              }
              console.log(targetData)
              console.log(updatedNodes[targetNodeIndex])
            }

            if (inputIndex !== -1) {
              if (targetData.inputs[inputIndex].outputIdentifier === sourceOutputIdentifier) {
                targetData.inputs[inputIndex].outputIdentifier = sourceNode.data.outputIdentifier;
                targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                targetData["identifiers"] = sourceIdentifier
                reuseQubit = true;
                console.log(targetData["identifier"])
              } else {
                targetData.inputs[inputIndex].outputIdentifier = sourceNode.data.outputIdentifier;
                targetData.inputs[inputIndex]["identifiers"] = sourceIdentifier;
                targetData["identifiers"] = sourceIdentifier
                console.log(targetData["identifiers"])

              }
            } else {
              targetData.inputs.push({
                id: connection.source,
                edgeId: edge.id,
                outputIdentifier: sourceNode.data.outputIdentifier,
                "identifiers": sourceIdentifier,
              });
              targetData["identifiers"] = sourceIdentifier
              console.log(targetData["identifiers"])

            }

            targetNode.data = targetData;
            updatedNodes[targetNodeIndex] = targetNode;

          }
        }


        console.log("Set edge", edge);
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
                  edgeId: edge.id,
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
          if (identifier === "encodingType") {
            let inputTypes = ["array"]
            if(nodeVal.includes("Basis") || nodeVal.includes("Custom")) inputTypes = ["any"];
            return {
              ...node,
              data: {
                ...node.data,
                [identifier]: nodeVal,
                "inputTypes": inputTypes,

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


