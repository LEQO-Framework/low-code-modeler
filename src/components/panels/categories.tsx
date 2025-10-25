import * as consts from "../../constants";

export type NodeType = (typeof consts.NodeTypes)[number];

export interface Node {
  label: string;
  type: NodeType;
  dataType?: string;
  icon?: string | string[];
  description: string;
  completionGuaranteed?: boolean;
  aliases?: string[];
}

interface CategoryEntry {
  description?: string;
  content: CategoryContent;
}

export type CategoryContent =
  | Node[]
  | {
    [subcategory: string]: Node[] | { [subsubcategory: string]: Node[] };
  };

export const categories: Record<string, CategoryEntry> = {
  [consts.boundaryNodes]: {
    description: "Blocks that convert between classical and quantum information.",
    content: {
      "Classical To Quantum": [
        {
          label: "Encode Value",
          type: consts.StatePreparationNode,
          icon: ["PaletteIcon_EncodeValue.png", "PaletteIcon_Ancilla_EncodeValue.png"],
          description: "Encodes a classical value into a quantum state.",
          completionGuaranteed: true
        },
        {
          label: "Prepare State",
          type: consts.StatePreparationNode,
          icon: ["PaletteIcon_PrepareState.png", "PaletteIcon_Ancilla_PrepareState.png"],
          description: "Initializes qubits into a specific quantum state.",
          completionGuaranteed: true
        },
      ],
      "Quantum To Classical": [
        {
          label: "Measurement",
          type: consts.MeasurementNode,
          icon: "PaletteIcon_Measurement.png",
          description: "Measures a quantum state and returns its classical information and collapsed quantum state.",
          completionGuaranteed: true
        },
      ],
    },
  },

  [consts.circuitLevelNodes]: {
    description: "Basic gates for quantum circuits.",
    content: {
      Qubits: [
        {
          label: "Qubit Circuit",
          type: consts.GateNode,
          icon: "qubit.png",
          description: "Represents a single qubit used in the circuit.",
          completionGuaranteed: true
        },
      ],
      "Circuit Blocks": [
        { label: "H", aliases: ["Hadamard"], type: consts.GateNode, icon: "hadamardBeginner.png", description: "Hadamard gate: puts a qubit into superposition.", completionGuaranteed: true },
        { label: "RX(θ)", type: consts.GateNode, icon: "RX_palette.png", description: "Rotates qubit around X-axis by θ radians.", completionGuaranteed: true },
        { label: "RY(θ)", type: consts.GateNode, icon: "RY_palette.png", description: "Rotates qubit around Y-axis by θ radians.", completionGuaranteed: true },
        { label: "RZ(θ)", type: consts.GateNode, icon: "RZ_palette.png", description: "Rotates qubit around Z-axis by θ radians.", completionGuaranteed: true },
        { label: "T", aliases: ["π/4 Phase"], type: consts.GateNode, icon: "t.png", description: "T gate: a π/4 phase shift.", completionGuaranteed: true },
        { label: "X", aliases: ["Pauli-X", "NOT"], type: consts.GateNode, icon: "pauliX.png", description: "Pauli-X gate: flips the state (like a NOT gate).", completionGuaranteed: true },
        { label: "Y", aliases: ["Pauli-Y"], type: consts.GateNode, icon: "pauliY.png", description: "Pauli-Y gate: flips and phases the qubit state.", completionGuaranteed: true },
        { label: "Z", aliases: ["Pauli-Z"], type: consts.GateNode, icon: "pauliZ.png", description: "Pauli-Z gate: adds a π phase shift to |1⟩ state.", completionGuaranteed: true },
        { label: "S", aliases: ["π/2 Phase"], type: consts.GateNode, icon: "S_palette.png", description: "S gate: a π/2 phase shift.", completionGuaranteed: true },
        { label: "SX", aliases: ["√X", "square root of X"], type: consts.GateNode, icon: "SX_palette.png", description: "Square root of X gate (√X).", completionGuaranteed: true },
        { label: "SDG", aliases: ["S†", "S-dagger"], type: consts.GateNode, icon: "SDG_palette.png", description: "S† gate: inverse of the S gate.", completionGuaranteed: true },
        { label: "TDG", aliases: ["T†", "T-dagger"], type: consts.GateNode, icon: "TDG_palette.png", description: "T† gate: inverse of the T gate.", completionGuaranteed: true },
        { label: "CNOT", aliases: ["Controlled-X"], type: consts.GateNode, icon: "CNOT_palette.png", description: "Controlled-X gate: flips target qubit if control is |1⟩.", completionGuaranteed: true },
        { label: "SWAP", type: consts.GateNode, icon: "SWAP_palette.png", description: "Swaps the states of two qubits.", completionGuaranteed: true },
        { label: "CY", aliases: ["Controlled-Y"], type: consts.GateNode, icon: "CY_palette.png", description: "Controlled-Y gate.", completionGuaranteed: true },
        { label: "CZ", aliases: ["Controlled-Z"], type: consts.GateNode, icon: "CZ_palette.png", description: "Controlled-Z gate.", completionGuaranteed: true },
        { label: "CH", aliases: ["Controlled-Hadamard"], type: consts.GateNode, icon: "CH_palette.png", description: "Controlled-Hadamard gate.", completionGuaranteed: true },
        { label: "CRX(θ)", aliases: ["Controlled-RX(θ)"], type: consts.GateNode, icon: "CRX_palette.png", description: "Controlled rotation by θ around X-axis.", completionGuaranteed: true },
        { label: "CRY(θ)", aliases: ["Controlled-RY(θ)"], type: consts.GateNode, icon: "CRY_palette.png", description: "Controlled rotation by θ around Y-axis.", completionGuaranteed: true },
        { label: "CRZ(θ)", aliases: ["Controlled-RZ(θ)"], type: consts.GateNode, icon: "CRZ_palette.png", description: "Controlled rotation by θ around Z-axis.", completionGuaranteed: true },
        //{ label: "CU(θ,φ,λ,γ)", aliases: ["Controlled-U"], type: consts.GateNode, icon: "CU_palette.png", description: "Controlled universal unitary gate.", completionGuaranteed: false },
        { label: "Toffoli", aliases: ["CCNOT", "Controlled-Controlled-NOT"], type: consts.GateNode, icon: "Toffoli_palette.png", description: "CCNOT: flips target if both controls are |1⟩.", completionGuaranteed: true },
        { label: "CSWAP", aliases: ["Fredkin"], type: consts.GateNode, icon: "CSWAP_palette.png", description: "Controlled SWAP: swaps two qubits if control is |1⟩.", completionGuaranteed: false },
        { label: "Splitter", type: consts.SplitterNode, icon: "Splitter_palette.png", description: "Splits a quantum register into individual qubits.", completionGuaranteed: true },
        { label: "Merger", type: consts.MergerNode, icon: "Merger_palette.png", description: "Merges multiple qubits into one register." , completionGuaranteed: true},
      ],
    },
  },

  [consts.dataTypes]: {
    description: "Classical and quantum data types such as bits, angles, qubits, and arrays used to define block inputs.",
    content: {
      "Classical Datatypes": [
        { label: "angle", dataType: "angle", type: consts.DataTypeNode, icon: "PaletteIcon_Angle.png", description: "Represents a rotation angle.", completionGuaranteed: false},
        { label: "bit", dataType: "bit", type: consts.DataTypeNode, icon: "PaletteIcon_Bit.png", description: "A binary value (0 or 1).", completionGuaranteed: true },
        { label: "boolean", dataType: "boolean", type: consts.DataTypeNode, icon: "PaletteIcon_Boolean.png", description: "True/false value used for logic.", completionGuaranteed: true },
        { label: "complex", dataType: "complex", type: consts.DataTypeNode, icon: "PaletteIcon_Complex.png", description: "A number with real and imaginary parts.", completionGuaranteed: false },
        { label: "duration", dataType: "duration", type: consts.DataTypeNode, icon: "PaletteIcon_Duration.png", description: "Represents a time duration.", completionGuaranteed: false },
        { label: "int", dataType: "int", type: consts.DataTypeNode, icon: "PaletteIcon_Int.png", description: "Integer value (whole number).", completionGuaranteed: true },
        { label: "float", dataType: "float", type: consts.DataTypeNode, icon: "PaletteIcon_Float.png", description: "Floating-point number (decimal).", completionGuaranteed: false },
        { label: "Array", dataType: "Array", type: consts.DataTypeNode, icon: "PaletteIcon_Array.png", description: "A list of values, possibly of varying length.", completionGuaranteed: false },
      ],
      "Quantum Datatypes": [
        { label: "Ancilla", dataType: consts.AncillaNode, type: consts.AncillaNode, icon: "PaletteIcon_Ancilla.png", description: "Helper qubit used temporarily in a computation.", completionGuaranteed: false },
        { label: "Qubit", dataType: consts.QubitNode, type: consts.QubitNode, icon: "PaletteIcon_Qubit.png", description: "Basic unit of quantum information.", completionGuaranteed: false },
      ],
    },
  },

  [consts.operator]: {
    description: "Predefined quantum and classical operators, including arithmetic, bitwise, and comparison operations.",
    content: {
      "Quantum Operators": [
        { label: consts.quantumLabel + consts.arithmeticOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ArithmeticOperator.png", "PaletteIcon_Ancilla_ArithmeticOperator.png"], description: "Performs quantum arithmetic (add, subtract, etc.).", completionGuaranteed: true },
        { label: consts.quantumLabel + consts.bitwiseOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_BitwiseOperator.png", "PaletteIcon_Ancilla_BitwiseOperator.png"], description: "Applies quantum bitwise operations.", completionGuaranteed: false },
        { label: consts.quantumLabel + consts.comparisonOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ComparisonOperator.png", "PaletteIcon_Ancilla_ComparisonOperator.png"], description: "Performs quantum comparisons (e.g., equality).", completionGuaranteed: false },
        { label: consts.quantumLabel + consts.minMaxOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_MinMaxOperator.png", "PaletteIcon_Ancilla_MinMaxOperator.png"], description: "Finds min or max between quantum values.", completionGuaranteed: false },
      ],
      "Classical Operators": [
        { label: consts.classicalLabel + consts.arithmeticOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ArithmeticOperator.png", description: "Performs classical arithmetic operations.", completionGuaranteed: false },
        { label: consts.classicalLabel + consts.bitwiseOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_BitwiseOperator.png", description: "Applies classical bitwise logic (AND, OR, etc.).", completionGuaranteed: false },
        { label: consts.classicalLabel + consts.comparisonOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ComparisonOperator.png", description: "Compares classical values.", completionGuaranteed: false },
        { label: consts.classicalLabel + consts.minMaxOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_MinMaxOperator.png", description: "Finds min or max between classical values.", completionGuaranteed: false },
      ],
    },
  },

  [consts.controlStructureNodes]: {
    description: "Control structures like conditionals and loops that influence the execution flow.",
    content: [
      { label: "If-Then-Else", type: consts.IfElseNode, icon: "PaletteIcon_IfElse.png", description: "Conditional block that branches based on a boolean input.", completionGuaranteed: false },
      { label: "Repeat", type: consts.ControlStructureNode, icon: "PaletteIcon_Repeat.png", description: "Repeats a block of operations a fixed number of times.", completionGuaranteed: false },
    ],
  },

  [consts.customOperators]: {
    description: "User-defined custom operation with arbitrarily classical and quantum inputs/outputs.",
    content: [
      {
        label: "Custom Quantum Operator",
        type: consts.AlgorithmNode,
        icon: ["PaletteIcon_CustomQuantumOperator.png", "PaletteIcon_Ancilla_CustomQuantumOperator.png"],
        description: "Encapsulates a reusable quantum operation defined by the user.",
        completionGuaranteed: true
      },
      {
        label: "Custom Classical Operator",
        type: consts.ClassicalAlgorithmNode,
        icon: "PaletteIcon_CustomClassicalOperator.png",
        description: "Encapsulates a reusable classical computation defined by the user.",
        completionGuaranteed: true
      },
    ],
  },
};
