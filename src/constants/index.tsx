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

export const HadamardImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[1];\nh q[0];";
export const PauliXImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[1];\nx q[0];";
export const PauliYImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[1];\ny q[0];";
export const PauliZImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[1];\nz q[0];";
export const ToffoliImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[3];\nccx q[0], q[1], q[2]";
export const CnotImplementation: string = "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncx q[0], q[1]";
