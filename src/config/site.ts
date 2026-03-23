import AncillaEdge from "@/components/edges/ancillaEdgeType";
import ClassicalEdge from "@/components/edges/classicalEdgeType";
import QuantumEdge from "@/components/edges/customEdgeType";
import { DataTypeNode } from "@/components/nodes";
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
import { EditableNode } from "@/components/nodes/editableNode";

export const nodesConfig = {
  initialNodes: [ ] as unknown as Node[],
  initialEdges: [] as Edge[],
  nodeTypes: {
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
    groupNode: GroupNode,
    editableNode: EditableNode,
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

export const tutorial = {
  metadata: [{
    "version": "1.0.0",
    "name": "My Model",
    "description": "In this model, a number is encoded into a quantum state using basis encoding.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1768938066122",
    "timestamp": "2026-01-20T19:41:06.122Z"
  }],
  nodes: [
     {
      "id": "e2a719bf-516c-4601-84d1-de643b05ea02",
      "type": "statePreparationNode",
      "position": {
        "x": 810,
        "y": 375
      },
      "data": {
        "label": "Basis Encoding",
        "inputs": [
          {
            "id": "086a4f77-2562-44d3-b0df-7cfe83ae369a",
            "edgeId": "acfa3a02-3344-4aad-958b-21ffb6568e87",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput0e2a719bf-516c-4601-84d1-de643b05ea02",
            "identifiers": [
              "q533042"
            ]
          },
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "identifiers": [
          "q533042"
        ],
        "inputTypes": [
          "Number"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Basis Encoding"
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 810,
        "y": 375
      },
      "dragging": true
    },
    {
      "id": "086a4f77-2562-44d3-b0df-7cfe83ae369a",
      "type": "dataTypeNode",
      "position": {
        "x": 255,
        "y": 375
      },
      "data": {
        "label": "Number",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q533042"
        ],
        "dataType": "Number",
        "value": "",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": {
          "0": "Number"
        }
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 255,
        "y": 375
      },
      "dragging": true
    }
  ],
  initialEdges: [{
      "source": "086a4f77-2562-44d3-b0df-7cfe83ae369a",
      "sourceHandle": "classicalHandleDataTypeOutput0086a4f77-2562-44d3-b0df-7cfe83ae369a",
      "target": "e2a719bf-516c-4601-84d1-de643b05ea02",
      "targetHandle": "classicalHandleStatePreparationInput0e2a719bf-516c-4601-84d1-de643b05ea02",
      "type": "classicalEdge",
      "id": "acfa3a02-3344-4aad-958b-21ffb6568e87",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }],
  viewport: {
    "x": 176.5,
    "y": 40,
    "zoom": 1
  }

}

export const testDiagram = {
  nodes: [{
      "id": "e89a752d-b8c5-45c1-95d2-6f39f4d7a155",
      "type": "gateNode",
      "position": {
        "x": 240,
        "y": 405
      },
      "data": {
        "label": "Qubit",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "identifiers": [
          "q529979"
        ],
        "parameter": "0"
      },
      "width": 100,
      "height": 100,
      "positionAbsolute": {
        "x": 240,
        "y": 405
      }
    },
    {
      "id": "94e6368f-c688-4ee5-806b-d1486c181887",
      "type": "gateNode",
      "position": {
        "x": 420,
        "y": 405
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "e89a752d-b8c5-45c1-95d2-6f39f4d7a155",
            "identifiers": [
              "q529979"
            ]
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "identifiers": [
          "q226232"
        ],
        "parameter": "0"
      },
      "width": 100,
      "height": 100,
      "positionAbsolute": {
        "x": 420,
        "y": 405
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "e89a752d-b8c5-45c1-95d2-6f39f4d7a155",
      "sourceHandle": "quantumHandleGateOutput0e89a752d-b8c5-45c1-95d2-6f39f4d7a155",
      "target": "94e6368f-c688-4ee5-806b-d1486c181887",
      "targetHandle": "quantumHandleGateInput094e6368f-c688-4ee5-806b-d1486c181887",
      "type": "quantumEdge",
      "id": "42ab941f-13b2-4c21-a375-5785b64b60ad",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": true
      }
    }
  ],
}