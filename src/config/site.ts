import AncillaEdge from "@/components/edges/ancillaEdgeType";
import ClassicalEdge from "@/components/edges/classicalEdgeType";
import QuantumEdge from "@/components/edges/customEdgeType";
import { TextNode, DataTypeNode } from "@/components/nodes";
import { AlgorithmNode } from "@/components/nodes/algorithm";
import { AncillaNode } from "@/components/nodes/ancilla";
import {  IfElseNode } from "@/components/nodes/ifelse";
import { DynamicNode } from "@/components/nodes/dynamically";
import { GateNode } from "@/components/nodes/gate";
import { MeasurementNode } from "@/components/nodes/measurement";
import { OperationNode } from "@/components/nodes/operation";
import { StatePreparationNode } from "@/components/nodes/statepreparation";
import { UncomputeNode } from "@/components/nodes/uncompute";
import { Edge } from "reactflow";
import { ControlStructureNode } from "@/components/nodes/controlstructure";
import { SplitterNode } from "@/components/nodes/splitter";
import { MergerNode } from "@/components/nodes/merger";
import { ClassicalAlgorithmNode } from "@/components/nodes/classicalalgorithm";
import { QubitNode } from "@/components/nodes/qubit";
import { ClassicalOperationNode } from "@/components/nodes/classicalOperation";
import { GroupNode } from "@/components/nodes/group";

export const nodesConfig = {
  initialNodes: [ ] as unknown as Node[],
  initialEdges: [] as Edge[],
  nodeTypes: {
    textNode: TextNode,
    dataTypeNode: DataTypeNode,
    dynamicNode: DynamicNode,
    measurementNode: MeasurementNode,
    statePreparationNode: StatePreparationNode,
    uncomputeNode: UncomputeNode,
    quantumOperatorNode: OperationNode,
    ancillaNode: AncillaNode,
    gateNode: GateNode,
    controlStructureNode: ControlStructureNode,
    ifElseNode: IfElseNode,
    algorithmNode : AlgorithmNode,
    classicalAlgorithmNode: ClassicalAlgorithmNode,
    splitterNode: SplitterNode,
    mergerNode: MergerNode,
    qubitNode: QubitNode,
    classicalOperatorNode: ClassicalOperationNode,
    groupNode: GroupNode
  } as any,
  edgesTypes: {
    quantumEdge: QuantumEdge,
    classicalEdge: ClassicalEdge,
    ancillaEdge: AncillaEdge
  }
};

export const initialDiagram = {
  nodes: [] as Node[],
  edges: [] as Edge[],
  nodeTypes: {
    textNode: TextNode,
    dataTypeNode: DataTypeNode,
    dynamicNode: DynamicNode,
    measurementNode: MeasurementNode,
    statePreparationNode: StatePreparationNode,
    uncomputeNode: UncomputeNode,
    quantumOperatorNode: OperationNode,
    ancillaNode: AncillaNode,
    gateNode: GateNode,
    controlStructureNode: ControlStructureNode,
    ifElseNode: IfElseNode,
    algorithmNode : AlgorithmNode,
    classicalAlgorithmNode: ClassicalAlgorithmNode,
    splitterNode: SplitterNode,
    mergerNode: MergerNode,
    qubitNode: QubitNode,
    classicalOperatorNode: ClassicalOperationNode,
    groupNode: GroupNode
  } as any,
};
