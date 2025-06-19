import * as consts from "../../constants";

export type NodeType = (typeof consts.NodeTypes)[number];

export interface Node {
  label: string;
  type: NodeType;
  dataType?: string;
  icon?:  string | string[];
}

export type CategoryContent =
  | Node[]
  | {
      [subcategory: string]: Node[] | { [subsubcategory: string]: Node[] };
    };

export const categories: Record<string, CategoryContent> = {
  [consts.boundaryNodes]: {
    "Classical To Quantum": [
      { label: "Encode Value", type: consts.StatePreparationNode, icon: ["PaletteIcon_EncodeValue.png", "PaletteIcon_Ancilla_EncodeValue.png"] },
      { label: "Prepare State", type: consts.StatePreparationNode, icon: ["PaletteIcon_PrepareState.png", "PaletteIcon_Ancilla_PrepareState.png"] },
    ],
    "Quantum To Classical": [
      { label: "Measurement", type: consts.MeasurementNode, icon: "PaletteIcon_Measurement.png" },
    ],
  },

  [consts.circuitLevelNodes]: {
    "Qubits": [
      { label: "Qubit", type: consts.GateNode, icon: "qubit.png" },
    ],
    "Circuit Blocks": [
      { label: "H", type: consts.GateNode, icon: "hadamard.png" },
      { label: "RX(θ)", type: consts.GateNode, icon: "rx.png" },
      { label: "RY(θ)", type: consts.GateNode, icon: "ry.png" },
      { label: "RZ(θ)", type: consts.GateNode, icon: "rz.png" },
      { label: "T", type: consts.GateNode, icon: "t.png" },
      { label: "X", type: consts.GateNode, icon: "pauliX.png" },
      { label: "Y", type: consts.GateNode, icon: "pauliY.png" },
      { label: "Z", type: consts.GateNode, icon: "pauliZ.png" },
      { label: "S", type: consts.GateNode, icon: "S_palette.png" },
      { label: "SX", type: consts.GateNode, icon: "SX_palette.png" },
      { label: "SDG", type: consts.GateNode, icon: "SDG_palette.png" },
      { label: "TDG", type: consts.GateNode, icon: "TDG_palette.png"},
      { label: "P(λ)", type: consts.GateNode, icon: "P_palette.png" },
      { label: "CNOT", type: consts.GateNode, icon: "CNOT_palette.png" },
      { label: "SWAP", type: consts.GateNode, icon: "SWAP_palette.png" },
      { label: "CY", type: consts.GateNode, icon: "CY_palette.png" },
      { label: "CZ", type: consts.GateNode, icon: "CZ_palette.png" },
      { label: "CH", type: consts.GateNode, icon: "CH_palette.png" },
      { label: "CP(λ)", type: consts.GateNode, icon: "CP_palette.png" },
      { label: "CRX(θ)", type: consts.GateNode, icon: "CRX_palette.png" },
      { label: "CRY(θ)", type: consts.GateNode, icon: "CRY_palette.png" },
      { label: "CRZ(θ)", type: consts.GateNode, icon: "CRZ_palette.png" },
      { label: "CU(θ,φ,λ,γ)", type: consts.GateNode, icon: "CU_palette.png" },
      { label: "Toffoli", type: consts.GateNode, icon: "Toffoli_palette.png" },
      { label: "CSWAP", type: consts.GateNode, icon: "CSWAP_palette.png" },
      { label: "Splitter", type: consts.SplitterNode, icon: "Splitter_palette.png" },
      { label: "Merger", type: consts.MergerNode, icon: "Merger_palette.png" },
    ],
  },

  [consts.dataTypes]: {
    "Classical Datatypes": [
      { label: "angle", dataType: "angle", type: consts.DataTypeNode, icon: "PaletteIcon_Angle.png"},
      { label: "bit", dataType: "bit", type: consts.DataTypeNode, icon: "PaletteIcon_Bit.png" },
      { label: "boolean", dataType: "boolean", type: consts.DataTypeNode, icon: "PaletteIcon_Boolean.png" },
      { label: "complex", dataType: "complex", type: consts.DataTypeNode, icon: "PaletteIcon_Complex.png" },
      { label: "duration", dataType: "duration", type: consts.DataTypeNode, icon: "PaletteIcon_Duration.png" },
      { label: "int", dataType: "int", type: consts.DataTypeNode, icon: "PaletteIcon_Int.png" },
      { label: "float", dataType: "float", type: consts.DataTypeNode, icon: "PaletteIcon_Float.png" },
      { label: "Array", dataType: "Array", type: consts.DataTypeNode, icon: "PaletteIcon_Array.png" },
    ],
    "Quantum Datatypes": [
        {
          label: "Ancilla",
          dataType: consts.AncillaNode,
          type: consts.AncillaNode,
          icon: "PaletteIcon_Ancilla.png",
        },
        {
          label: "Qubit",
          dataType: consts.QubitNode,
          type: consts.QubitNode,
          icon: "PaletteIcon_Qubit.png"
        },
      ],
  },

  [consts.operator]: {
    "Quantum Operators": [
        { label: consts.arithmeticOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ArithmeticOperator.png", "PaletteIcon_Ancilla_ArithmeticOperator.png"] },
        { label: consts.bitwiseOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_BitwiseOperator.png", "PaletteIcon_Ancilla_BitwiseOperator.png"] },
        { label: consts.comparisonOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ComparisonOperator.png", "PaletteIcon_Ancilla_ComparisonOperator.png"] },
        { label: consts.minMaxOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_MinMaxOperator.png", "PaletteIcon_Ancilla_MinMaxOperator.png"] },
      ],
    "Classical Operators": [
      { label: consts.arithmeticOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ArithmeticOperator.png" },
      { label: consts.bitwiseOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_BitwiseOperator.png" },
      { label: consts.comparisonOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ComparisonOperator.png" },
      { label: consts.minMaxOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_MinMaxOperator.png" },
    ],
  },

  [consts.controlStructureNodes]: [
    { label: "If-Then-Else", type: consts.IfElseNode, icon: "PaletteIcon_IfElse.png"  },
    { label: "Repeat", type: consts.ControlStructureNode, icon: "PaletteIcon_Repeat.png"  },
    { label: "Group", type: consts.GroupNode, icon: "minMax.png"  },
  ],

  [consts.customOperators]: [
    { label: "Custom Quantum Operator", type: consts.AlgorithmNode, icon: ["PaletteIcon_CustomQuantumOperator.png", "PaletteIcon_Ancilla_CustomQuantumOperator.png"] },
    { label: "Custom Classical Operator", type: consts.ClassicalAlgorithmNode, icon: "PaletteIcon_CustomClassicalOperator.png" },
  ],
};
