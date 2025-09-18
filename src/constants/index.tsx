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
export const ClassicalAlgorithmNode: string = "classicalAlgorithmNode";
export const StatePreparationNode: string = "statePreparationNode";
export const MeasurementNode: string = "measurementNode";
export const AncillaNode: string = "ancillaNode";
export const QubitNode: string = "qubitNode";
export const ControlStructureNode: string = "controlStructureNode";
export const IfElseNode: string = "ifElseNode";
export const ClassicalOutputOperationNode = "classicalOutputOperationNode";
export const SplitterNode: string = "splitterNode";
export const MergerNode: string = "mergerNode";
export const OperatorNode: string = "quantumOperatorNode";
export const ClassicalOperatorNode: string = "classicalOperatorNode";
export const GroupNode: string = "groupNode";


export const NodeTypes = [
  DataTypeNode,
  GateNode,
  AlgorithmNode,
  ClassicalAlgorithmNode,
  StatePreparationNode,
  MeasurementNode,
  AncillaNode,
  QubitNode,
  ControlStructureNode,
  IfElseNode,
  ClassicalOutputOperationNode,
  SplitterNode,
  MergerNode,
  OperatorNode,
  ClassicalOperatorNode,
  GroupNode
]

export const quantumLabel = "Quantum ";

export const classicalLabel = "Classical ";
export const arithmeticOperatorLabel = "Arithmetic Operator";
export const bitwiseOperatorLabel = "Bitwise Operator";
export const minMaxOperatorLabel = "Min & Max Operator";
export const comparisonOperatorLabel = "Comparison Operator";

// categories of modeling constructs
export const boundaryNodes = "Boundary Nodes";
export const circuitLevelNodes = "Circuit-level Nodes";
export const dataTypes = "Data Types";
export const controlStructureNodes = "Control Structure Nodes";
export const operator = "Operators";
export const customOperators = "Custom Operators";

// handle prefix ensures correctness of edges
export const classicalHandle: string = "classicalHandle";
export const quantumHandle: string = "quantumHandle";
export const ancillaHandle: string = "ancillaHandle";
export const dirtyAncillaHandle: string = "dirtyAncillaHandle";

// colors for modeling constructs
export const quantumConstructColor = "rgba(105, 145, 210, 0.2)";
export const ancillaConstructColor = "rgba(83, 242, 71, 0.2)";
export const dirtyConstructColor = "rgba(50, 93, 48, 0.24)";
export const classicalConstructColor = "rgba(255, 165, 0, 0.2)";
export const controlFlowConstructColor = "rgba(183, 0, 255, 0.21)";

export const parameterized_one_qubit = [
  "RX(θ)",
  "RY(θ)",
  "RZ(θ)",
  "P(λ)",
];

export const parameterized_two_qubit = [
  "CP(λ)",
  "CRX(θ)",
  "CRY(θ)",
  "CRZ(θ)",
];

export const multi_parameterized_two_qubit = [
  "CU(θ,φ,λ,γ)",
];

export const non_parameterized_one_qubit = [
  "H",
  "T",
  "X",
  "Y",
  "Z",
  "S",
  "SX",
  "SDG",
  "TDG",
];

export const non_parameterized_two_qubit = [
  "CNOT",
  "SWAP",
  "CY",
  "CZ",
  "CH",
];

export const multi_qubit_gates = [
  "Toffoli",
  "CSWAP",
];

