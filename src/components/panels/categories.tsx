import * as consts from "../../constants";

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
      { label: "Encode Value", type: consts.StatePreparationNode, inputs: [], icon: "encodeValue.png" },
      { label: "Prepare State", type: consts.StatePreparationNode, icon: "prepareState.png" },
      { label: "Splitter", type: consts.SplitterNode },
      { label: "Merger", type: consts.MergerNode },
    ],
    "Quantum To Classical": [
      { label: "Measurement", type: consts.MeasurementNode, icon: "measurement.png" },
    ]
  },
  "Circuit Blocks": {
    "Qubits": [
      { label: "Qubit", type: consts.GateNode, icon: "qubit.png" }
    ],
    "Circuit Blocks": [
      { label: "CNOT", type: consts.GateNode, icon: "cnotgate.png" },
      { label: "Toffoli", type: consts.GateNode, icon: "toffoligate.png" },
      { label: "H", type: consts.GateNode, icon: "hadamard.png" },
      { label: "RX(θ)", type: consts.GateNode, icon: "rx.png"},
      { label: "RY(θ)", type: consts.GateNode, icon: "ry.png" },
      { label: "RZ(θ)", type: consts.GateNode, icon: "rz.png" },
      { label: "T", type: consts.GateNode, icon: "t.png" },
      { label: "X", type: consts.GateNode, icon: "pauliX.png" },
      { label: "Y", type: consts.GateNode, icon: "pauliY.png" },
      { label: "Z", type: consts.GateNode, icon: "pauliZ.png"},
    ],
  },
  "Data Types": {
    "Classical Datatypes": [
      { label: "Array", dataType: "Array", type: consts.DataTypeNode, icon: "array.png" },
      { label: "angle", dataType: "angle", type: consts.DataTypeNode},
      { label: "bit", dataType: "bit", type: consts.DataTypeNode, icon: "bit.png" },
      { label: "boolean", dataType: "boolean", type: consts.DataTypeNode, icon: "boolean.png" },
      { label: "complex", dataType: "complex", type: consts.DataTypeNode },
      { label: "duration", dataType: "duration", type: consts.DataTypeNode },
      { label: "int", dataType: "int", type: consts.DataTypeNode, icon: "int.png"  },
      { label: "float", dataType: "float", type: consts.DataTypeNode, icon: "float.png" },
    ],
    "Quantum Type": [
      { label: "Ancilla", dataType: consts.AncillaNode, type: consts.AncillaNode, icon: "ancilla.png" },
      { label: "Qubit", dataType: consts.QubitNode, type: consts.QubitNode},
    ]
  },
  "Flow Structures": {
    "If-Then-Else": [
      { label: "If-Then-Else", type: consts.IfElseNode },
    ],
    "Loop": [
      { label: "Repeat", type: consts.ControlStructureNode }
    ],
  },
  Operators: {
    "Arithmetic Operators": [
      { label: "Arithmetic Operator", type: consts.OperatorNode, icon: "add.png" }
    ],
    "Bitwise Operators": [
      { label: "Bitwise Operator", type: consts.OperatorNode, icon: "bitwise.png" }
    ],
    "Comparison Operators": [
      { label: "Comparison Operator", type: consts.OperatorNode, icon: "comparison.png" }
    ],
    "Min & Max": [{ label: "Min & Max Operator", type: consts.OperatorNode, icon: "minMax.png" }]
  },
  "Custom Operators": {
    "Custom Quantum Operator": [
      { label: "Custom Quantum Operator", type: consts.AlgorithmNode}
    ],
    "Custom Classical Operator": [
      { label: "Custom Classical Operator", type: consts.ClassicalAlgorithmNode }
    ],
  }

};
