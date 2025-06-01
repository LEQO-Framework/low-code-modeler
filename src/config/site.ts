import AncillaEdge from "@/components/edges/ancillaEdgeType";
import ClassicalEdge from "@/components/edges/classicalEdgeType";
import QuantumEdge from "@/components/edges/customEdgeType";
import { TextNode, DataTypeNode } from "@/components/nodes";
import { AlgorithmNode } from "@/components/nodes/algorithm";
import { AncillaNode } from "@/components/nodes/ancilla";
import { ClassicalOutputOperationNode } from "@/components/nodes/classicalOutputOperation";
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
    operatorNode: OperationNode,
    ancillaNode: AncillaNode,
    classicalOutputOperationNode: ClassicalOutputOperationNode,
    gateNode: GateNode,
    controlStructureNode: ControlStructureNode,
    ifElseNode: IfElseNode,
    algorithmNode : AlgorithmNode,
    classicalAlgorithmNode: ClassicalAlgorithmNode,
    splitterNode: SplitterNode,
    mergerNode: MergerNode
  } as any,
  edgesTypes: {
    quantumEdge: QuantumEdge,
    classicalEdge: ClassicalEdge,
    ancillaEdge: AncillaEdge
  }
};

export const initialDiagram = {
  initialNodes: [
    
  ] as Node[],
  initialEdges: [] as Edge[],
  nodeTypes: {
    node: Node,
  } as any,
};
