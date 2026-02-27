import { Edge } from "reactflow";
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
  compactOptions: boolean[];
  properties?: any[];
  constraints?: any[];
  mapping?: string[][];
  category?: string,
  outputType?: string,
  isDataType?: boolean,
}

export interface Template {
  id: string;
  timestamp?: string;
  icon: string;
  label: string;
  type: string;
  name: string;
  description: string;
  completionGuaranteed: boolean;
  compactOptions: boolean[];
  flowData: {
    metadata?: any | any[], 
    nodes: Node[], edges: Edge[], 
    viewport?: {x: number, y: number, zoom: number}
  };
}

export interface CategoryEntry {
  description?: string | string[];
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
          label: "Encode Value", type: consts.StatePreparationNode, icon: ["PaletteIcon_EncodeValue.png", "PaletteIcon_Ancilla_EncodeValue.png"], description: "Encodes a classical value into a quantum state.", completionGuaranteed: true, compactOptions: [true],
        },
        {
          label: "Basis Encoding", type: consts.StatePreparationNode, icon: ["PaletteIcon_BasisEncoding.png", "PaletteIcon_Ancilla_BasisEncoding.png"], description: "Encodes classical bits into computational basis quantum states.", completionGuaranteed: true, compactOptions: [false],
        },
         {
          label: "Custom Encoding", type: consts.StatePreparationNode, icon: ["PaletteIcon_CustomEncoding.png", "PaletteIcon_Ancilla_CustomEncoding.png"], description: "Encodes classical bits into quantum states using a custom encoding.", completionGuaranteed: true, compactOptions: [false],
        },
        {
          label: "Angle Encoding", type: consts.StatePreparationNode, icon: ["PaletteIcon_AngleEncoding.png", "PaletteIcon_Ancilla_AngleEncoding.png"], description: "Encodes classical data into qubit rotation angles.", completionGuaranteed: false, compactOptions: [false],
        },
        {
          label: "Amplitude Encoding", type: consts.StatePreparationNode, icon: ["PaletteIcon_AmplitudeEncoding.png", "PaletteIcon_Ancilla_AmplitudeEncoding.png"], description: "Encodes a normalized classical vector into quantum state amplitudes.", completionGuaranteed: false, compactOptions: [false],
        },
        {
          label: "Matrix Encoding", type: consts.StatePreparationNode, icon: ["PaletteIcon_MatrixEncoding.png", "PaletteIcon_Ancilla_MatrixEncoding.png"], description: "Prepare an arbitrary state.", completionGuaranteed: false, compactOptions: [false],
        },
        {
          label: "Schmidt Decomposition", type: consts.StatePreparationNode, icon: ["PaletteIcon_SchmidtDecomposition.png", "PaletteIcon_Ancilla_SchmidtDecomposition.png"], description: "Encodes a normalized classical vector into quantum state amplitudes.", completionGuaranteed: false, compactOptions: [false],
        },
        {
          label: "Prepare State", type: consts.StatePreparationNode, icon: ["PaletteIcon_PrepareState.png", "PaletteIcon_Ancilla_PrepareState.png"], description: "Initializes qubits into a specific quantum state.", completionGuaranteed: true, compactOptions: [true, false],
        },
      ],
      "Quantum To Classical": [
        {
          label: "Measurement", type: consts.MeasurementNode, icon: "PaletteIcon_Measurement.png", description: "Measures a quantum state and returns its classical information and collapsed quantum state.", completionGuaranteed: true, compactOptions: [true, false],
        },
      ],
    },
  },

  [consts.circuitLevelNodes]: {
    description: "Basic gates for quantum circuits.",
    content: {
      Qubits: [
        {
          label: "Qubit Circuit", type: consts.GateNode, icon: "qubit.png", description: "Represents a single qubit used in the circuit.", completionGuaranteed: true, compactOptions: [true, false],
        },
      ],
      "Circuit Blocks": [
        { label: "H", aliases: ["Hadamard"], type: consts.GateNode, icon: ["hadamard.png", "PaletteIcon_Hadamard_Beginner.png"], description: "Hadamard gate: puts a qubit into superposition.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "RX(θ)", type: consts.GateNode, icon: ["RX_palette.png", "PaletteIcon_RotateX_Beginner.png"], description: "Rotates qubit around X-axis by θ radians.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "RY(θ)", type: consts.GateNode, icon: ["RY_palette.png", "PaletteIcon_RotateY_Beginner.png"], description: "Rotates qubit around Y-axis by θ radians.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "RZ(θ)", type: consts.GateNode, icon: ["RZ_palette.png", "PaletteIcon_RotateZ_Beginner.png"], description: "Rotates qubit around Z-axis by θ radians.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "T", aliases: ["π/4 Phase"], type: consts.GateNode, icon: ["t.png", "PaletteIcon_T_Beginner.png"], description: "T gate: a π/4 phase shift.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "TDG", aliases: ["T†", "T-dagger"], type: consts.GateNode, icon: ["TDG_palette.png", "PaletteIcon_TDG_Beginner.png"], description: "T† gate: inverse of the T gate.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "X", aliases: ["Pauli-X", "NOT"], type: consts.GateNode, icon: ["pauliX.png", "PaletteIcon_X_Beginner.png"], description: "Pauli-X gate: flips the state (like a NOT gate).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Y", aliases: ["Pauli-Y"], type: consts.GateNode, icon: ["pauliY.png", "PaletteIcon_Y_Beginner.png"], description: "Pauli-Y gate: flips and phases the qubit state.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Z", aliases: ["Pauli-Z"], type: consts.GateNode, icon: ["pauliZ.png", "PaletteIcon_Z_Beginner.png"], description: "Pauli-Z gate: adds a π phase shift to |1⟩ state.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "S", aliases: ["π/2 Phase"], type: consts.GateNode, icon: ["S_palette.png", "PaletteIcon_S_Beginner.png"], description: "S gate: a π/2 phase shift.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "SX", aliases: ["√X", "square root of X"], type: consts.GateNode, icon: ["SX_palette.png", "PaletteIcon_SX_Beginner.png"], description: "Square root of X gate (√X).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "SDG", aliases: ["S†", "S-dagger"], type: consts.GateNode, icon: ["SDG_palette.png", "PaletteIcon_SDG_Beginner.png"], description: "S† gate: inverse of the S gate.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CNOT", aliases: ["Controlled-X"], type: consts.GateNode, icon: ["CNOT_palette.png", "PaletteIcon_CNOT_Beginner.png"], description: "Controlled-X gate: flips target qubit if control is |1⟩.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "SWAP", type: consts.GateNode, icon: ["SWAP_palette.png", "PaletteIcon_SWAP_Beginner.png"], description: "Swaps the states of two qubits.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CY", aliases: ["Controlled-Y"], type: consts.GateNode, icon: ["CY_palette.png", "PaletteIcon_CY_Beginner.png"], description: "Controlled-Y gate.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CZ", aliases: ["Controlled-Z"], type: consts.GateNode, icon: ["CZ_palette.png", "PaletteIcon_CZ_Beginner.png"], description: "Controlled-Z gate.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CH", aliases: ["Controlled-Hadamard"], type: consts.GateNode, icon: ["CH_palette.png", "PaletteIcon_CH_Beginner.png"], description: "Controlled-Hadamard gate.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CRX(θ)", aliases: ["Controlled-RX(θ)"], type: consts.GateNode, icon: ["CRX_palette.png", "PaletteIcon_CRX_Beginner.png"], description: "Controlled rotation by θ around X-axis.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CRY(θ)", aliases: ["Controlled-RY(θ)"], type: consts.GateNode, icon: ["CRY_palette.png", "PaletteIcon_CRY_Beginner.png"], description: "Controlled rotation by θ around Y-axis.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CRZ(θ)", aliases: ["Controlled-RZ(θ)"], type: consts.GateNode, icon: ["CRZ_palette.png", "PaletteIcon_CRZ_Beginner.png"], description: "Controlled rotation by θ around Z-axis.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Toffoli", aliases: ["CCNOT", "Controlled-Controlled-NOT"], type: consts.GateNode, icon: ["Toffoli_palette.png", "PaletteIcon_Toffoli_Beginner.png"], description: "CCNOT: flips target if both controls are |1⟩.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "CSWAP", aliases: ["Fredkin"], type: consts.GateNode, icon: ["CSWAP_palette.png", "PaletteIcon_CSWAP_Beginner.png"], description: "Controlled SWAP: swaps two qubits if control is |1⟩.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Splitter", type: consts.SplitterNode, icon: "Splitter_palette.png", description: "Splits a quantum register into individual qubits.", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Merger", type: consts.MergerNode, icon: "Merger_palette.png", description: "Merges multiple qubits into one register.", completionGuaranteed: true, compactOptions: [true, false] },
      ]

    },
  },

  [consts.dataTypes]: {
    description: ["Classical and quantum data types such as bits, angles, qubits, and arrays used to define block inputs.", "Classical data types such as bits and arrays used to define block inputs."],
    content: {
      "Classical Datatypes": [
        //{ label: "angle", dataType: "angle", type: consts.DataTypeNode, icon: "PaletteIcon_Angle.png", description: "Represents a rotation angle.", completionGuaranteed: false, compactOptions: [true, false] },
        { label: "bit", dataType: "bit", type: consts.DataTypeNode, icon: "PaletteIcon_Bit.png", description: "A binary value (0 or 1).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "boolean", dataType: "boolean", type: consts.DataTypeNode, icon: "PaletteIcon_Boolean.png", description: "True/false value used for logic.", completionGuaranteed: true, compactOptions: [true, false] },
        //{ label: "complex", dataType: "complex", type: consts.DataTypeNode, icon: "PaletteIcon_Complex.png", description: "A number with real and imaginary parts.", completionGuaranteed: false, compactOptions: [true, false] },
        //{ label: "duration", dataType: "duration", type: consts.DataTypeNode, icon: "PaletteIcon_Duration.png", description: "Represents a time duration.", completionGuaranteed: false, compactOptions: [true, false] },
        //{ label: "int", dataType: "int", type: consts.DataTypeNode, icon: "PaletteIcon_Int.png", description: "Integer value (whole number).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Number", dataType: "float", type: consts.DataTypeNode, icon: "PaletteIcon_Number.png", description: "Integer value (whole number) or floating-point number (decimal).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: "Array", dataType: "Array", type: consts.DataTypeNode, icon: "PaletteIcon_Array.png", description: "A list of values, possibly of varying length.", completionGuaranteed: true, compactOptions: [true, false] },
      ],
      "Quantum Datatypes": [
        { label: "Ancilla", dataType: consts.AncillaNode, type: consts.AncillaNode, icon: "PaletteIcon_Ancilla.png", description: "Helper qubit used temporarily in a computation.", completionGuaranteed: false, compactOptions: [true, false] },
        { label: "Qubit", dataType: consts.QubitNode, type: consts.QubitNode, icon: "PaletteIcon_Qubit.png", description: "Basic unit of quantum information.", completionGuaranteed: false, compactOptions: [true, false] },
      ],
    },
  },

  [consts.operator]: {
    description: ["Predefined quantum and classical operators, including arithmetic, bitwise, and comparison operations.", "Predefined classical arithematic operator."],
    content: {
      "Quantum Operators": [
        { label: consts.quantumLabel + consts.arithmeticOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ArithmeticOperator.png", "PaletteIcon_Ancilla_ArithmeticOperator.png"], description: "Performs quantum arithmetic (add, subtract, etc.).", completionGuaranteed: true, compactOptions: [true, false] },
        { label: consts.quantumLabel + consts.bitwiseOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_BitwiseOperator.png", "PaletteIcon_Ancilla_BitwiseOperator.png"], description: "Applies quantum bitwise operations.", completionGuaranteed: false, compactOptions: [true, false] },
        { label: consts.quantumLabel + consts.comparisonOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_ComparisonOperator.png", "PaletteIcon_Ancilla_ComparisonOperator.png"], description: "Performs quantum comparisons (e.g., equality).", completionGuaranteed: false, compactOptions: [true, false] },
        { label: consts.quantumLabel + consts.minMaxOperatorLabel, type: consts.OperatorNode, icon: ["PaletteIcon_MinMaxOperator.png", "PaletteIcon_Ancilla_MinMaxOperator.png"], description: "Finds min or max between quantum values.", completionGuaranteed: false, compactOptions: [true, false] },
      ],
      "Classical Operators": [
        { label: consts.classicalLabel + consts.arithmeticOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ArithmeticOperator.png", description: "Performs classical arithmetic operations.", completionGuaranteed: false, compactOptions: [true, false] },
        { label: consts.classicalLabel + consts.bitwiseOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_BitwiseOperator.png", description: "Applies classical bitwise logic (AND, OR, etc.).", completionGuaranteed: false, compactOptions: [true, false] },
        { label: consts.classicalLabel + consts.comparisonOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_ComparisonOperator.png", description: "Compares classical values.", completionGuaranteed: false, compactOptions: [true, false] },
        { label: consts.classicalLabel + consts.minMaxOperatorLabel, type: consts.ClassicalOperatorNode, icon: "PaletteIcon_Classical_MinMaxOperator.png", description: "Finds min or max between classical values.", completionGuaranteed: false, compactOptions: [true, false] },
      ],
    },
  },

  [consts.controlStructureNodes]: {
    description: "Control structures like conditionals and loops that influence the execution flow.",
    content: [
      { label: "If-Then-Else", type: consts.IfElseNode, icon: "PaletteIcon_IfElse.png", description: "Conditional block that branches based on a boolean input.", completionGuaranteed: false, compactOptions: [true, false] },
      { label: "Repeat", type: consts.ControlStructureNode, icon: "PaletteIcon_Repeat.png", description: "Repeats a block of operations a fixed number of times.", completionGuaranteed: false, compactOptions: [true, false] },
    ],
  },

  [consts.customOperators]: {
    description: "User-defined custom operation with arbitrarily classical and quantum inputs/outputs.",
    content: [
      { label: "Custom Quantum Operator", type: consts.AlgorithmNode, icon: ["PaletteIcon_CustomQuantumOperator.png", "PaletteIcon_Ancilla_CustomQuantumOperator.png"], description: "Encapsulates a reusable quantum operation defined by the user.", completionGuaranteed: true, compactOptions: [true, false] },
      { label: "Custom Classical Operator", type: consts.ClassicalAlgorithmNode, icon: "PaletteIcon_CustomClassicalOperator.png", description: "Encapsulates a reusable classical computation defined by the user.", completionGuaranteed: true, compactOptions: [true, false] },
    ],
  },

  [consts.templates]: {
    description: "Configurable quantum algorithms directly to use.",
    content: [
      {
        label: consts.grover,
        type: consts.templates,
        icon: "Grover.png",
        description: "Searches for the correct answer in a large set of possibilities faster than a normal search.",
        completionGuaranteed: false,
        compactOptions: [true, false],
      },
      {
        label: consts.hadamard_test_real_part,
        type: consts.templates,
        icon: "HadamardTestRealPart.png",
        description: "Measures the real (non-imaginary) part of a result produced by a quantum operation.",
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      {
        label: consts.hadamard_test_imaginary_part,
        type: consts.templates,
        icon: "HadamardTestImaginaryPart.png",
        description: "Measures the imaginary part of a result produced by a quantum operation.",
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      {
        label: consts.swap_test,
        type: consts.templates,
        icon: "SWAPTest.png",
        description: "Compares two quantum states and tells how similar they are.",
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      {
        label: consts.qaoa,
        type: consts.templates,
        icon: "QAOA.png",
        description: "Solves optimization problems by combining a quantum process with a classical optimizer.",
        completionGuaranteed: false,
        compactOptions: [true, false],
      },
    ]
    ,
  },
};
