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

export const DataTypeNode : string = "dataTypeNode";
export const GateNode : string = "gateNode";
export const AlgorithmNode: string = "algorithmNode";
export const StatePreparationNode : string = "statePreparationNode";
export const MeasurementNode: string = "measurementNode";
export const AncillaNode: string = "ancillaNode";
export const ControlStructureNode: string = "controlStructureNode";
export const IfElseNode: string = "ifElseNode";
export const ClassicalOutputOperationNode = "classicalOutputOperationNode";
export const SplitterNode : string = "splitterNode";
export const MergerNode: string = "mergerNode";
export const ArithmeticOperatorNode = "arithmeticOperatorNode";

export const HadamardImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q;\nh q[0];\n@leqo.output 0\nlet output = q;";
export const PauliXImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q;\nx q[0];\n@leqo.output 0\nlet output = q;";
export const PauliYImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q;\ny q[0];\n@leqo.output 0\nlet output = q;";
export const PauliZImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q;\nz q[0];\n@leqo.output 0\nlet output = q;";
export const ToffoliImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q0;\n@leqo.output 1\nqubit[1] q1;\n@leqo.input 2\nqubit[1] q2;\nccx q0, q1, q2;\n@leqo.output 0\nlet output0 = q0;\n@leqo.output 1\nlet output1 = q1;\n@leqo.output 2\nlet output2 = q2;";
export const CnotImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n@leqo.input 0\nqubit[1] q0;\n@leqo.input 0\nqubit[1] q1;\ncx q0, q1;\n@leqo.output 0\nlet output0 = q0;\n@leqo.output 1\nlet output1 = q1;";

export const RXImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\ninput float[64] theta;\n@leqo.input 0\nqubit[1] q0;\nrx(theta) q0[0];\n@leqo.output 0\nlet output0 = q0;"
export const RYImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\ninput float[64] theta;\n@leqo.input 0\nqubit[1] q0;\nry(theta) q0[0];\n@leqo.output 0\nlet output0 = q0;"
export const RZImplementation: string = "OPENQASM 3.0;\ninclude \"stdgates.inc\";\ninput float[64] theta;\n@leqo.input 0\nqubit[1] q0;\nrz(theta) q0[0];\n@leqo.output 0\nlet output0 = q0;"