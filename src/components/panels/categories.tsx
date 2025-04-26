import { icons } from "antd/es/image/PreviewGroup";

export type NodeType =
  | "operationNode1"
  | "operationNode2"
  | "stateNode1"
  | "stateNode2"
  | "classicalInt"
  | "classicalFloat"
  | "classicalBoolean"
  | "quantumQint"
  | "quantumQfloat";

export interface Node {
  label: string;
  type: NodeType;
  dataType: string;
  icon: string;
}

export interface Categories {
  [key: string]: Node[] | { [subcategory: string]: Node[] };
}

export const categories: { [key: string]: any } = {
  "Boundary Nodes": {
    "Classical To Quantum": [
      { label: "Encode Value", type: "statePreparationNode", inputs: [], icon: "encodeValue.png" },
      { label: "Prepare State", type: "statePreparationNode", icon: "prepareState.png" },
      { label: "Splitter", type: "splitterNode" },
      { label: "Merge", type: "mergerNode" },
    ],
    "Quantum To Classical": [
      { label: "Measurement", type: "measurementNode", icon: "measurement.png" },
    ]
  },
  "Circuit Blocks": {
    "Qubits": [
      { label: "Qubit", type: "gateNode", icon: "qubit.png" }
    ],
    "Circuit Blocks": [
      { label: "CNOT", type: "gateNode", icon: "cnotgate.png" },
      { label: "Toffoli", type: "gateNode", icon: "toffoligate.png" },
      { label: "H", type: "gateNode", icon: "hadamard.png" },
      { label: "RX(θ)", type: "gateNode", icon: "rx.png"},
      { label: "RY(θ)", type: "gateNode", icon: "ry.png" },
      { label: "RZ(θ)", type: "gateNode", icon: "rz.png" },
      { label: "X", type: "gateNode", icon: "pauliX.png" },
      { label: "Y", type: "gateNode", icon: "pauliY.png" },
      { label: "Z", type: "gateNode", icon: "pauliZ.png"},
    ],
  },
  "Data Types": {
    "Classical Datatypes": [
      { label: "Array", dataType: "Array", type: "positionNode", icon: "array.png" },
      { label: "bit", dataType: "bit", type: "positionNode", icon: "bit.png" },
      { label: "boolean", dataType: "boolean", type: "positionNode", icon: "boolean.png" },
      { label: "int", dataType: "int", type: "positionNode", icon: "int.png"  },
      { label: "float", dataType: "float", type: "positionNode", icon: "float.png" },
    ],
    "Quantum Type": [
      { label: "Ancilla", dataType: "ancillaNode", type: "ancillaNode", icon: "ancilla.png" },
    ]
  },
  "Flow Structures": {
    "If-Then-Else": [
      { label: "If-Then-Else", type: "ifElseNode" },
    ],
    "Loop": [
      { label: "Repeat", type: "controlStructureNode" }
    ],
  },
  Operators: {
    "Arithmetic Operators": [
      { label: "Arithmetic Operator", type: "arithmeticOperatorNode", icon: "add.png" }
    ],
    "Bitwise Operators": [
      { label: "Bitwise Operator", type: "classicalOutputOperationNode", icon: "bitwise.png" }
    ],
    "Comparison Operators": [
      { label: "Comparison Operator", type: "classicalOutputOperationNode", icon: "comparison.png" }
    ],
    "Min & Max": [{ label: "minMax", type: "classicalOutputOperationNode", icon: "minMax.png" }],
    "Search": [{ label: "Search", type: "classicalOutputOperationNode", icon: "search.png" }],
  },
  "Custom Operators": {
    "Custom Quantum Operator": [
      { label: "Custom Quantum Operator", type: "algorithmNode"}
    ],
    "Custom Classical Operator": [
      { label: "Custom Classical Operator", type: "algorithmNode" }
    ],
  }

};
