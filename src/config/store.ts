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
} from "reactflow";
import { create } from "zustand";
import { nodesConfig } from "./site";
import { v4 as uuid } from "uuid";
import {
  Position,
  useNodesData,
} from '@xyflow/react';

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

    if(node.type === "measurementNode"){
      node.data.indices = "";
      node.data.outputIdentifier= "";
    }

    if(node.type === "positionNode"){
      node.data.dataType = node.data.label;
      node.data.value = "";
      node.data.outputIdentifier= "";
    }

    if(node.type === "statePreparationNode" && node.data.label === "Encode Value"){
      node.data.encodingType = "";
      node.data.bound = 0;
      node.data.size = "";
      node.data.outputIdentifier= "";
    }

    if(node.type === "statePreparationNode" && node.data.label === "Prepare State"){
      node.data.quantumStateName = "";
      node.data.size = "";
      node.data.outputIdentifier= "";
    }
    if(node.type === "arithmeticOperatorNode" ){
      node.data.operator = "";
      node.data.outputIdentifier= "";
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
    for (let node of currentNodes) {
      if (node.id === connection.source) {
        nodeDataSource = node;
      }
      if (node.id === connection.target) {
        nodeDataTarget = node;
      }
    }
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
        
          if (nodeDataSource.type === "statePreparationNode") {
            // Push a new entry
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id,
              
            });
          }
          if (nodeDataSource.type === "arithmeticOperatorNode") {
            // Push a new entry
            nodeDataTarget.data.inputs.push({
              id: nodeDataSource.id
            });
          }
        
        // Push a new entry
        //nodeDataTarget.data.inputs.push({
          //id: nodeDataSource.id,
          //label: nodeDataSource.data.outputIdentifier
        //});
      }


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

    const currentEdges = get().edges;
    let currentNodes = get().nodes.map((node) => {
      // Update the node's position separately
      if (node.id === nodeId && identifier === "position") {
        node.position = nodeVal;
        return node;
      }
      return node;
    });

    // Update inputs of target nodes connected by edges where this node is the source
    currentEdges.forEach((edge) => {
      console.log("edge")
      if (edge.source === nodeId) {
        console.log("found edge")
        const targetNodeIndex = currentNodes.findIndex((n) => n.id === edge.target);
        if (targetNodeIndex !== -1) {
          const targetNode = { ...currentNodes[targetNodeIndex] };
          const targetData = { ...targetNode.data };

          // Ensure inputs exist
          if (!targetData.inputs) targetData.inputs = [];

          // Check if inputs already contain this nodeId
          const inputIndex = targetData.inputs.findIndex((input) => input.id === nodeId);

          if (inputIndex !== -1) {
            if(identifier === "outputIdentifier"){
            // Update existing input label
            //targetData.inputs[inputIndex].label = nodeVal;
            targetData.inputs[inputIndex].outputIdentifier = nodeVal;
          }
          
          } else {

            
            //targetData.inputs.push({
              //id: nodeId,
              //label: nodeVal,
            //});
          }

          // Update target node in the nodes list
          //targetNode.data = targetData;
          //currentNodes[targetNodeIndex] = targetNode;
        }
      }
    });

    // Update the node's other data fields if the identifier is not "position"
    currentNodes = currentNodes.map((node) => {
      if (node.id === nodeId && identifier !== "position") {
        return {
          ...node,
          data: { ...node.data, [identifier]: nodeVal },
        };
      }
      return node;
    });

    const newHistoryItem: HistoryItem = {
      nodes: [...currentNodes], // Copy nodes array to avoid mutation
      edges: [...currentEdges], // Copy edges array to avoid mutation
    };

    console.log("Updating history (updateNodeValue):", newHistoryItem);

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
