import { Edge } from "@xyflow/react";

export const initialEdges: Edge[] = [];

export const initialNodes: Node[] = [];

export enum HistoryAction {
  AddNode = "addNode",
  RemoveNode = "removeNode",
  AddEdge = "addEdge",
  RemoveEdge = "removeEdge",
  MoveNode = "moveNode",
}

// supported modeling constructs
export const DataTypeNode: string = "dataTypeNode";
export const GateNode: string = "gateNode";
export const AlgorithmNode: string = "algorithmNode";
export const StatePreparationNode: string = "statePreparationNode";
export const MeasurementNode: string = "measurementNode";
export const AncillaNode: string = "ancillaNode";
export const ControlStructureNode: string = "controlStructureNode";
export const IfElseNode: string = "ifElseNode";
export const ClassicalOutputOperationNode = "classicalOutputOperationNode";
export const SplitterNode: string = "splitterNode";
export const MergerNode: string = "mergerNode";
export const ArithmeticOperatorNode: string = "arithmeticOperatorNode";

// handle prefix ensures correctness of edges
export const classicalHandle: string = "classicalHandle";
export const quantumHandle: string = "quantumHandle";
export const ancillaHandle: string = "ancillaHandle";