import { useStore } from "@/config/store";
import {
  AlgorithmNode,
  AncillaNode,
  ClassicalAlgorithmNode,
  ClassicalOperatorNode,
  ClassicalOutputOperationNode,
  ControlStructureNode,
  DataTypeNode,
  DeutschJozsaNode,
  EditableNode,
  GateNode,
  GroverDiffuserNode,
  GroverNode,
  IfElseNode,
  InverseQFTNode,
  MCMTGateNode,
  MeasurementNode,
  MergerNode,
  OperatorNode,
  PluginNode,
  QAOANode,
  QFTNode,
  QubitNode,
  SplitterNode,
  StatePreparationNode,
  UniversalOracleNode,
  parameterized_one_qubit,
  parameterized_two_qubit,
  multi_parameterized_two_qubit,
  u_gate_parameters,
  minMaxOperatorLabel,
  comparisonOperatorLabel,
  bitwiseOperatorLabel,
  multi_qubit_gates,
  non_parameterized_one_qubit,
  non_parameterized_two_qubit,
  qubitLabel,
} from "@/constants";
import { ArrowLeft } from "lucide-react";
import { CustomOperatorImplementation } from "./customOperatorImplementation";
import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";

const NODE_EXPLANATIONS: Record<string, string> = {
  [QFTNode]:
    "Applies the Quantum Fourier Transform (QFT), which converts a quantum state into its frequency representation. It is commonly used in algorithms such as phase estimation and factoring.",

  [InverseQFTNode]:
    "Applies the inverse Quantum Fourier Transform (QFT), converting a state back from its frequency representation.",

  [MCMTGateNode]:
    "Applies a gate to one or more target qubits only if all control qubits are in the |1⟩ state. Configure the number of control and target qubits and select the gate matrix.",

  [AlgorithmNode]:
    "Runs a custom quantum algorithm defined in a QASM or Python file. For more inputs or outputs, right click on the block.",

  [ClassicalAlgorithmNode]:
    "Runs a custom classical algorithm defined in a Python file. For more inputs or outputs, right click on the block.",

  [DeutschJozsaNode]:
    "Implements the Deutsch-Jozsa algorithm, which determines whether a function always returns the same value or returns different values for half of its inputs. Select the input size and the function type.",

  [UniversalOracleNode]:
    "Marks selected quantum states for use in quantum algorithms such as Grover's search. Choose whether to flip qubits or apply phase flips, then select the states to mark.",

  [GroverDiffuserNode]:
    "Applies Grover's diffusion operator, increasing the probability of measuring the marked states during Grover's search algorithm.",

  [GroverNode]:
    "Implements Grover's search algorithm, which searches an unsorted set of elements faster than a classical algorithm. Select the number of qubits and the elements to search for.",

  [QAOANode]:
    "Implements the Quantum Approximate Optimization Algorithm (QAOA), which finds approximate solutions to optimization problems. Select the problem, provide the input data, choose an optimizer, and set the number of layers.",

  [MeasurementNode]:
    "Measures a quantum register, converting its quantum state into classical measurement results. Select the measurement basis if required.",

  [AncillaNode]:
    "Creates one or more ancilla qubits. Ancilla qubits are temporary helper qubits used during quantum computations.",

  [QubitNode]:
    "Creates a quantum register. Set the size (number of qubits) in the output register.",

  [SplitterNode]:
    "Splits a quantum register into separate registers according to a OpenQASM definition. Right click on the node to add more outputs.",

  [MergerNode]:
    "Merges quantum registers into a single register according to a OpenQASM definition. Right click on the node to add more inputs.",

  [OperatorNode]: "Applies one or more quantum gates to the selected qubits.",

  [ClassicalOutputOperationNode]:
    "Performs an operation on classical measurement results before passing them to the next node.",

  [IfElseNode]:
    "Executes different branches depending on whether a specified condition is true or false.",

  [ControlStructureNode]:
    "Controls the execution flow of the workflow, such as repeating or conditionally executing nodes.",

  [ClassicalOperatorNode]:
    "Performs classical operations on the input and returns classical output.",

  [PluginNode]: "Executes functionality provided by the plugin.",

  [EditableNode]:
    "A customizable node that can be configured to perform user-defined operations.",
};

const GATE_EXPLANATIONS: Record<string, string> = {
  [parameterized_one_qubit[0]]: "X-axis rotation by an angle (rad or deg).",

  [parameterized_one_qubit[1]]: "Y-axis rotation by an angle (rad or deg).",

  [parameterized_one_qubit[2]]: "Z-axis rotation by an angle (rad or deg).",

  [parameterized_one_qubit[3]]:
    "Applies a phase shift of an angle (rad or deg) to the |1⟩ state.",

  [parameterized_two_qubit[0]]:
    "If control qubit is in state |1⟩, applies a phase shift of an angle (rad or deg) to the |1⟩ state.",

  [parameterized_two_qubit[1]]:
    "If control qubit is in state |1⟩, apply X-axis rotation by an angle (rad or deg).",

  [parameterized_two_qubit[2]]:
    "If control qubit is in state |1⟩, apply Y-axis rotation by an angle (rad or deg).",

  [parameterized_two_qubit[3]]:
    "If control qubit is in state |1⟩, apply Z-axis rotation by an angle (rad or deg).",

  ["CU"]:
    "If control qubit is in state |1⟩, apply the U-gate. Set the matrix for the U-gate in the 'Matrix' field.",

  ["U1(λ)"]:
    "Universal gate U1(λ): applies a phase shift of λ (rad) to the |1⟩ state.",

  ["U2(φ,λ)"]:
    "Universal gate U2(φ,λ) = U3(π/2,φ,λ) with the angles φ and λ (rad).",

  ["U3(θ,φ,λ)"]:
    "Universal gate U3(θ,φ,λ): general single-qubit rotation with the angles θ, φ and λ (rad).",

  [non_parameterized_one_qubit[0]]:
    "Creates superposition by applying a Hadamard transform.",

  [non_parameterized_one_qubit[1]]: "Applies a π/4 phase shift.",

  [non_parameterized_one_qubit[2]]: "Flips |0⟩ and |1⟩ states.",

  [non_parameterized_one_qubit[3]]: "Applies a π rotation around the Y-axis.",

  [non_parameterized_one_qubit[4]]: "Applies a π phase flip to the |1⟩ state.",

  [non_parameterized_one_qubit[5]]:
    "Applies a π/2 phase shift to the |1⟩ state.",

  [non_parameterized_one_qubit[6]]:
    "Creates superposition by applying a π/2 rotation around the X-axis.",

  [non_parameterized_one_qubit[7]]:
    "Inverse S gate; removes a π/2 phase shift.",

  [non_parameterized_one_qubit[8]]:
    "Inverse T gate; removes a π/4 phase shift.",

  [non_parameterized_two_qubit[0]]:
    "If control qubit is in state |1⟩, flips |0⟩ and |1⟩ states of the target qubit.",

  [non_parameterized_two_qubit[1]]: "Swaps the states of two qubits.",

  [non_parameterized_two_qubit[2]]:
    "If control qubit is in state |1⟩, applies a π rotation around the Y-axis to the target qubit.",

  [non_parameterized_two_qubit[3]]:
    "If control qubit is in state |1⟩, applies a π phase flip to the |1⟩ state of the target qubit.",

  [non_parameterized_two_qubit[4]]:
    "If control qubit is in state |1⟩, applies the H gate to the target qubit.",

  [multi_qubit_gates[0]]:
    "If both control qubits are in state |1⟩, flips |0⟩ and |1⟩ states of the target qubit.",

  [multi_qubit_gates[1]]:
    "If control qubit is in state |1⟩, swaps the states of the two target qubits.",

  [qubitLabel]: "Represents an individual qubit in the circuit.",
};

const DATA_TYPE_EXPLANATIONS: Record<string, string> = {
  ["bit"]: "Binary value (0 or 1).",
  ["boolean"]: "True or false value.",
  ["Number"]: "Numeric value.",
  ["Array"]: "List of values, separated by a comma.",
  ["File"]:
    "Data loaded from a file. Specify the file path in the 'Value' field.",
  ["String"]: "Text data.",
};

const STATE_PREPERATION_EXPLANATIONS: Record<string, string> = {
  ["Basis Encoding"]:
    "Takes a classical value, converts it into a binary representation, and uses each binary position to determine the state of a corresponding qubit. In other words, each qubit represents one binary digit (0 or 1). The conversion uses the configured decimal precision.",

  ["Custom Encoding"]:
    "Maps classical values to quantum states using a user-defined implementation.",

  ["Angle Encoding"]:
    "Encodes an array of classical values into a quantum state using rotation gates. For each input value xi, the corresponding qubit is rotated by RY(2xi).",

  ["Amplitude Encoding"]:
    "Encodes an array of numerical values into the amplitudes of a quantum state. It can represent many values using relatively few qubits, but preparing the state can require a deeper quantum circuit.",

  ["Matrix Encoding"]: "Encodes a non-unitary matrix into a unitary matrix.",
  ["Schmidt Decomposition"]: "Computes the Schmidt coefficients.",

  ["Prepare State"]:
    "Initializes the quantum register in a predefined quantum state, such as a basis state, Bell state, GHZ state or W state. Specify size if the state is not a Bell state.",
};

interface NodeInputOutputExplanation {
  input?: string;
  output?: string;
}

const INPUT_OUTPUT_EXPLANATIONS: Record<string, NodeInputOutputExplanation> = {
  ["Basis Encoding"]: {
    input:
      "A classical numeric value or classical data that can be represented as binary.",
    output:
      "A quantum register whose qubits represent the binary digits of the encoded value.",
  },

  ["Angle Encoding"]: {
    input: "An array of classical numeric values.",
    output:
      "A quantum register whose qubits encode the input values using rotation angles.",
  },

  ["Amplitude Encoding"]: {
    input: "An array of numerical values to be encoded as quantum amplitudes.",
    output: "A quantum state whose amplitudes represent the input values.",
  },

  ["Custom Encoding"]: {
    input:
      "Classical data provided to the user-defined encoding implementation.",
    output: "A quantum state produced by the custom encoding implementation.",
  },

  ["Matrix Encoding"]: {
    input:
      "A classical matrix describing the operation or transformation to encode.",
    output: "A quantum representation of the encoded operation.",
  },

  ["Prepare State"]: {
    input: "A selected predefined quantum state and, when required, its size.",
    output: "A quantum register initialized in the selected state.",
  },

  ["Measurement"]: {
    input: "A quantum register to be measured.",
    output:
      "Classical measurement results corresponding to the measured qubits.",
  },

  ["Quantum Arithmetic Operator"]: {
    input: "Two quantum states.",
    output: "The result of applying the selected arithmetic operation.",
  },

  ["Quantum Comparison Operator"]: {
    input: "Classical values to compare.",
    output:
      "A Boolean result indicating whether the selected comparison is true or false.",
  },

  ["Quantum Min/Max Operator"]: {
    input: "A collection of comparable values.",
    output: "The minimum or maximum value according to the selected operation.",
  },

  ["Quantum Bitwise Operator"]: {
    input: "Two quantum states.",
    output: "The result of applying the selected bitwise operation.",
  },

  ["Control Structure"]: {
    input: "Workflow data and the configured control condition.",
    output:
      "Control flow that determines whether or how the associated workflow section executes.",
  },

  ["If Else"]: {
    input: "Workflow data and a condition.",
    output:
      "Execution of either the true branch or the false branch based on the condition.",
  },
  ["Quantum Clustering"]: {
    input:
      "Entity points data, the desired number of clusters, and optionally the convergence tolerance and maximum number of iterations.",
    output: "The entity points grouped into the specified number of clusters.",
  },
  ["Classical Clustering"]: {
    input:
      "Entity points data, the desired number of clusters, the relative residual tolerance, and the maximum number of iterations.",
    output: "The entity points grouped into the specified number of clusters.",
  },

  ["QAOA Ansatz"]: {
    input:
      "The graph edges defining the optimization problem, along with the beta and gamma parameters for each QAOA layer.",
    output:
      "A quantum state encoding an approximate solution to the optimization problem.",
  },

  ["Grover Oracle"]: {
    input: "A quantum register on which the oracle acts (optional).",
    output:
      "The quantum register with the marked elements flipped, either in state or in phase.",
  },
};

type ExperienceLevel = "explorer" | "pioneer";

const EXPERIENCE_LEVEL_ORDER: Record<ExperienceLevel, number> = {
  explorer: 0,
  pioneer: 1,
};

const normalizeExperienceLevel = (level: unknown): ExperienceLevel => {
  const normalized = String(level ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "advanced" ||
    normalized === "expert" ||
    normalized === "pioneer"
  ) {
    return "pioneer";
  }

  return "explorer";
};

interface PropertyDescription {
  description: string;
  minExperienceLevel?: ExperienceLevel;
}

interface PropertyExplanationGroup {
  required?: Record<string, PropertyDescription>;
  optional?: Record<string, PropertyDescription>;
}

const PROPERTIES_EXPLANATIONS: Record<string, PropertyExplanationGroup> = {
  ["Basis Encoding"]: {
    optional: {
      decimalPrecision: {
        description:
          "Determines how many digits after the decimal point are considered when converting a numeric value into its binary representation. A higher precision allows more fractional digits to be represented.",
        minExperienceLevel: "explorer",
      },

      implementation: {
        description:
          "Provides an optional custom implementation for the encoding operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Angle Encoding"]: {
    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation for the encoding operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Amplitude Encoding"]: {
    required: {
      bound: {
        description:
          "Defines the allowed error bound for the amplitude encoding. The value must be between 0 and 1. A smaller value requires a more accurate encoding.",
        minExperienceLevel: "explorer",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation for the encoding operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Matrix Encoding"]: {
    optional: {
      bound: {
        description:
          "Defines the allowed error bound for the matrix encoding. The value must be between 0 and 1. A smaller value requires a more accurate encoding.",
        minExperienceLevel: "explorer",
      },

      implementation: {
        description:
          "Provides an optional custom implementation for the encoding operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Custom Encoding"]: {
    required: {
      implementation: {
        description:
          "Defines the implementation used to map the classical input data to the desired quantum state.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Prepare State"]: {
    required: {
      quantumStateName: {
        description:
          "Specifies the predefined quantum state used to initialize the quantum register.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation for preparing the quantum state.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["RX(θ)"]: {
    required: {
      "Parameter ϕ": {
        description: "Specifies the rotation angle applied around the X-axis.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },

  ["RY(θ)"]: {
    required: {
      "Parameter ϕ": {
        description: "Specifies the rotation angle applied around the Y-axis.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },

  ["RZ(θ)"]: {
    required: {
      "Parameter ϕ": {
        description: "Specifies the rotation angle applied around the Z-axis.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },

  ["CRX(θ)"]: {
    required: {
      "Parameter ϕ": {
        description:
          "Specifies the rotation angle applied around the X-axis if the control qubit is 1.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },

  ["CRY(θ)"]: {
    required: {
      "Parameter ϕ": {
        description:
          "Specifies the rotation angle applied around the Y-axis if the control qubit is 1.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },

  ["CRZ(θ)"]: {
    required: {
      "Parameter ϕ": {
        description:
          "Specifies the rotation angle applied around the Z-axis if the control qubit is 1.",
      },
      "Parameter Type": {
        description:
          "Specifies whether the parameter is interpreted in degrees or radians. The selected conversion is applied once when the parameter type is switched.",
      },
    },
  },
  ["Custom Classical Operator"]: {
    required: {
      implementation: {
        description:
          "Defines the custom implementation executed by the classical operator.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Custom Quantum Operator"]: {
    required: {
      implementation: {
        description:
          "Defines the custom implementation executed by the quantum operator.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Quantum Arithmetic Operator"]: {
    required: {
      operator: {
        description:
          "Specifies the arithmetic operation that is applied to the input values.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the quantum operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Quantum Comparison Operator"]: {
    required: {
      operator: {
        description:
          "Specifies the comparison used to determine the relationship between input values.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the quantum operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Min/Max Operator"]: {
    required: {
      minMaxOperator: {
        description:
          "Determines whether the minimum or maximum value is selected from the input values.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the minimum or maximum operation.",
        minExperienceLevel: "pioneer",
      },
    },
  },

  ["Bitwise Operator"]: {
    required: {
      operator: {
        description:
          "Specifies the bitwise operation applied to the input values.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the bitwise operation.",
        minExperienceLevel: "pioneer",
      },
    },
  },

  ["CU"]: {
    required: {
      controlValue: {
        description:
          "Specifies the classical value that determines when the controlled U operation is activated.",
      },

      matrix: {
        description: "Defines the matrix used by the U-gate.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the controlled U operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["MCMT Gate"]: {
    required: {
      "Matrix U": {
        description:
          "Specifies the matrix of the quantum gate applied to the target qubits.",
      },

      "Number of Controls": {
        description:
          "Specifies the number of control qubits. The gate is applied to the target qubits when all control qubits are in the |1⟩ state.",
      },

      "Number of Targets": {
        description:
          "Specifies the number of target qubits to which the selected gate is applied.",
      },
    },
    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the MCMT Gate operation.",
        minExperienceLevel: "explorer",
      },
    },
  },
  ["bit"]: {
    required: {
      value: {
        description:
          "Specifies the binary value of the data. A bit can contain either 0 or 1.",
      },
    },
  },

  ["boolean"]: {
    required: {
      value: {
        description:
          "Specifies the logical value of the data. A Boolean can be either true or false.",
      },
    },
  },

  ["String"]: {
    required: {
      value: {
        description: "Specifies the text value stored by the data.",
      },
    },
  },

  ["File"]: {
    required: {
      value: {
        description:
          "Specifies the file path used to load the data from a file.",
      },
    },
  },

  ["Number"]: {
    required: {
      value: {
        description: "Specifies the numeric value stored by the data.",
      },
    },
  },

  ["Array"]: {
    required: {
      value: {
        description:
          "Specifies a list of values stored by the data. Values should be separated by commas.",
      },
    },
  },

  ["Measurement"]: {
    optional: {
      indices: {
        description:
          "Specifies the indices that are measured from the input quantum register. If not specified, the whole register is measured.",
        minExperienceLevel: "explorer",
      },

      basis: {
        description:
          "Specifies the measurement basis. Supported bases are X, Y, and Z.",
        minExperienceLevel: "explorer",
      },

      implementation: {
        description:
          "Provides an optional custom implementation of the measurement operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["If-Then-Else"]: {
    required: {
      condition: {
        description:
          "Defines the condition used to select between the true and false branches.",
      },
    },
  },

  ["Repeat"]: {
    required: {
      condition: {
        description:
          "Defines the condition used to determine whether the controlled process section should execute.",
      },
    },
  },

  ["Quantum Clustering"]: {
    required: {
      variant: {
        description:
          "Specifies the quantum clustering variant used to perform the clustering operation.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the clustering operation.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Classical Clustering"]: {
    required: {
      algorithm: {
        description:
          "Specifies the classical clustering algorithm used to group the input data.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the clustering operation.",
        minExperienceLevel: "explorer",
      },
    },
  },
  ["Deutsch-Jozsa"]: {
    required: {
      "Number of Qubits": {
        description:
          "Specifies the number of input qubits used by the Deutsch-Jozsa algorithm.",
      },
      behaviorType: {
        description: "Specifies whether the function is constant or balanced.",
      },
      balancedMask: {
        description:
          "Specifies the mask used to define the balanced function when the behavior type is set to balanced.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the Deutsch-Jozsa algorithm.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Grover's Search Algorithm"]: {
    required: {
      numberOfElements: {
        description:
          "Specifies the total number of elements in the search space.",
      },
      elementsToSearch: {
        description:
          "Specifies the elements that Grover's algorithm should search for.",
      },
    },

    optional: {
      iterations: {
        description:
          "Specifies the number of Grover iterations to perform. If not provided, the algorithm computes the optimal number of Grover iterations.",
      },
      implementation: {
        description:
          "Provides an optional custom implementation of Grover's search algorithm.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["Grover Oracle"]: {
    required: {
      oracleMode: {
        description:
          "Specifies how the oracle marks the selected elements: using a phase oracle or a Boolean oracle.",
      },
      markedElements: {
        description:
          "Specifies the elements that the oracle marks as solutions for the quantum algorithm.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the oracle.",
        minExperienceLevel: "explorer",
      },
    },
  },

  ["QAOA Ansatz"]: {
    required: {
      problem: {
        description:
          "Specifies the optimization problem to solve, such as MaxCut, Max-2-SAT, or graph coloring.",
      },
      optimizer: {
        description:
          "Specifies the classical optimizer used to optimize the QAOA parameters.",
      },
      layers: {
        description:
          "Specifies the number of QAOA layers (p) used in the circuit.",
      },
    },

    optional: {
      implementation: {
        description:
          "Provides an optional custom implementation of the QAOA algorithm.",
        minExperienceLevel: "explorer",
      },
    },
  },
  [EditableNode]: {
    required: {
      implementation: {
        description:
          "Defines the custom implementation executed by the node. Custom operators require an implementation to perform their operation.",
        minExperienceLevel: "pioneer",
      },
    },
  },
};

const isPropertyExplanationVisible = (
  property: PropertyDescription,
  experienceLevel: unknown,
): boolean => {
  if (!property.minExperienceLevel) {
    return true;
  }

  const currentLevel = normalizeExperienceLevel(experienceLevel);

  return (
    EXPERIENCE_LEVEL_ORDER[currentLevel] >=
    EXPERIENCE_LEVEL_ORDER[property.minExperienceLevel]
  );
};

const filterPropertyExplanationGroup = (
  group: PropertyExplanationGroup,
  experienceLevel: unknown,
): PropertyExplanationGroup => {
  const filterEntries = (entries: Record<string, PropertyDescription> = {}) =>
    Object.fromEntries(
      Object.entries(entries).filter(([, property]) =>
        isPropertyExplanationVisible(property, experienceLevel),
      ),
    );

  return {
    required: filterEntries(group.required),
    optional: filterEntries(group.optional),
  };
};

const getPropertyExplanations = (
  selectedNode: Node | null,
  experienceLevel: unknown,
): PropertyExplanationGroup => {
  if (!selectedNode) {
    return {};
  }

  const label = selectedNode.data?.label;

  let explanations: PropertyExplanationGroup = {};

  if (label === "Encode Value" && selectedNode.data?.encodingType) {
    explanations =
      PROPERTIES_EXPLANATIONS[selectedNode.data.encodingType] ?? {};
  } else if (label && PROPERTIES_EXPLANATIONS[label]) {
    explanations = PROPERTIES_EXPLANATIONS[label];
  } else if (
    selectedNode.type === EditableNode &&
    PROPERTIES_EXPLANATIONS[EditableNode]
  ) {
    explanations = PROPERTIES_EXPLANATIONS[EditableNode];
  }

  return filterPropertyExplanationGroup(explanations, experienceLevel);
};



/**
 * Returns the input/output explanation for the currently selected node.
 *
 * Some node types (quantum registers, classical data types, and gate
 * nodes) describe their input/output behavior structurally rather than
 * per-label, so those are handled first. Multi-control/multi-qubit gates
 * get an extra note that all inputs must be of the same size. Everything
 * else falls back to the per-label lookup table.
 */
const getInputOutputExplanations = (
  selectedNode: Node | null,
): NodeInputOutputExplanation => {
  if (!selectedNode) {
    return {};
  }

  const label = selectedNode.data?.label;

  // Quantum register / qubit array nodes: output only.
  if (selectedNode.type === QubitNode) {
    return {
      output: "A quantum register containing the specified number of qubits.",
    };
  }

  // Classical data type nodes: output only.
  if (selectedNode.type === DataTypeNode) {
    return {
      output: "The classical value defined for this data type.",
    };
  }
  if (selectedNode.type === SplitterNode) {
    return {
      input: "A quantum register of length n",
      output: "n individual qubits",
    };
  }

  if (selectedNode.type === MergerNode) {
    return {
      output: "A quantum register of length n",
      input: "n individual qubits",
    };
  }

  if (selectedNode.type === DeutschJozsaNode) {
    return {
      output: "An oracle that detects if the function is balanced or constant.",
    };
  }

  if (selectedNode.type === GroverNode) {
    return {
      output: "An oracle that detects if the function is balanced or constant.",
    };
  }

  if (selectedNode.type === GroverDiffuserNode) {
    return {
      input:
        "A quantum register where the elements that need to be found are marked.",
      output:
        "A quantum register where the probability of the marked elements is amplified and others reduced.",
    };
  }

  // Gate nodes: quantum state in, quantum state out. Multi-control /
  // multi-qubit gates additionally require same-sized inputs.
  if (
    selectedNode.type === GateNode ||
    selectedNode.type === QFTNode ||
    selectedNode.type === InverseQFTNode
  ) {
    if (label && multi_qubit_gates.includes(label)) {
      return {
        input:
          "Quantum states for the control and target qubits. All inputs must be of the same size.",
        output: "The quantum state after the gate has been applied.",
      };
    }

    return {
      input: "A quantum state.",
      output: "The quantum state after the gate has been applied.",
    };
  }

  if (selectedNode.type === MCMTGateNode) {
    return {
      input:
        "Quantum states for the control and target qubits. All inputs must be of the same size.",
      output: "The quantum state after the gate has been applied.",
    };
  }

  if (label && INPUT_OUTPUT_EXPLANATIONS[label]) {
    return INPUT_OUTPUT_EXPLANATIONS[label];
  }

  return {};
};

const formatPropertyName = (property: string): string => {
  return property
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
};

interface PropertyInputOutputProps {
  input?: string;
  output?: string;
}

const PropertyInputOutput: React.FC<PropertyInputOutputProps> = ({
  input,
  output,
}) => {
  if (!input && !output) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {input && (
        <div>
          <div className="font-semibold text-sm text-gray-700">Input</div>

          <div className="text-sm text-gray-600 mt-1">{input}</div>
        </div>
      )}

      {output && (
        <div>
          <div className="font-semibold text-sm text-gray-700">Output</div>

          <div className="text-sm text-gray-600 mt-1">{output}</div>
        </div>
      )}
    </div>
  );
};

interface PropertyExplanationsProps {
  properties: PropertyExplanationGroup;
}

const PropertyExplanations: React.FC<PropertyExplanationsProps> = ({
  properties,
}) => {
  const requiredEntries = Object.entries(properties.required ?? {});

  const optionalEntries = Object.entries(properties.optional ?? {});

  if (requiredEntries.length === 0 && optionalEntries.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {requiredEntries.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Required
          </div>

          <div className="mt-3 space-y-4">
            {requiredEntries.map(([property, details]) => (
              <div key={property}>
                <div className="font-semibold text-sm text-gray-700">
                  {formatPropertyName(property)}

                  <span className="font-normal text-xs text-gray-500 ml-1">
                    (Required)
                  </span>
                </div>

                <div className="text-sm text-gray-600 mt-1">
                  {details.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {optionalEntries.length > 0 && (
        <div className={requiredEntries.length > 0 ? "mt-6" : ""}>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Optional
          </div>

          <div className="mt-3 space-y-4">
            {optionalEntries.map(([property, details]) => (
              <div key={property}>
                <div className="font-semibold text-sm text-gray-700">
                  {formatPropertyName(property)}

                  <span className="font-normal text-xs text-gray-500 ml-1">
                    (Optional)
                  </span>
                </div>

                <div className="text-sm text-gray-600 mt-1">
                  {details.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getNodeMappings = (selectedNode: Node | null): string[] => {
  if (!selectedNode?.data?.mapping) {
    return [];
  }

  const mapping = selectedNode.data.mapping;

  if (Array.isArray(mapping)) {
    return mapping
      .flat(Infinity)
      .filter((value: unknown): value is string => typeof value === "string");
  }

  return [];
};

const getEditableNodeImplementationType = (
  selectedNode: Node | null,
): "quantum" | "classical" | null => {
  if (!selectedNode || selectedNode.type !== EditableNode) {
    return null;
  }

  const mappings = getNodeMappings(selectedNode).map((mapping) =>
    mapping.trim().toLowerCase(),
  );

  const hasCustomQuantumOperator = mappings.some(
    (mapping) =>
      mapping === "custom quantum operator" ||
      mapping.includes("custom quantum operator"),
  );

  const hasCustomClassicalOperator = mappings.some(
    (mapping) =>
      mapping === "custom classical operator" ||
      mapping.includes("custom classical operator"),
  );

  if (hasCustomQuantumOperator) {
    return "quantum";
  }

  if (hasCustomClassicalOperator) {
    return "classical";
  }

  return null;
};

const getNodeExplanation = (selectedNode: Node | null) => {
  if (!selectedNode) {
    return "";
  }

  if (selectedNode.type === GateNode) {
    return (
      GATE_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for gate node: " +
        selectedNode.data.label
    );
  }

  if (selectedNode.type === DataTypeNode) {
    return (
      DATA_TYPE_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for data type node: " +
        selectedNode.data.label
    );
  }

  if (selectedNode.type === StatePreparationNode) {
    return (
      STATE_PREPERATION_EXPLANATIONS[selectedNode.data.label] ??
      "Error: No explanation available for state preparation node: " +
        selectedNode.data.label
    );
  }

  if (selectedNode.type === EditableNode) {
    return (
      selectedNode.data.explanation ?? NODE_EXPLANATIONS[EditableNode] ?? ""
    );
  }

  return (
    NODE_EXPLANATIONS[selectedNode.type] ??
    "Error: No explanation available for node type: " + selectedNode.type
  );
};

const selector = (state: {
  selectedNode: Node | null;
  completionGuaranteed: boolean;
  updateNodeLabel: (nodeId: string, nodeVal: string) => void;
  updateNodeValue: (
    nodeId: string,
    identifier: string,
    nodeVal: string,
  ) => void;
  setSelectedNode: (node: Node | null) => void;
  experienceLevel: unknown;
}) => ({
  selectedNode: state.selectedNode,
  completionGuaranteed: state.completionGuaranteed,
  updateNodeLabel: state.updateNodeLabel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  experienceLevel: state.experienceLevel,
});

type PanelTab = "information" | "properties";

export const TextPanel = () => {
  const {
    selectedNode,
    updateNodeValue,
    setSelectedNode,
    completionGuaranteed,
    experienceLevel,
  } = useStore(selector, shallow);

  const [activeTab, setActiveTab] = useState<PanelTab>("information");

  const propertyExplanations = getPropertyExplanations(
    selectedNode,
    experienceLevel,
  );

  const hasPropertyExplanations =
    Object.keys(propertyExplanations.required ?? {}).length > 0 ||
    Object.keys(propertyExplanations.optional ?? {}).length > 0;

  const inputOutputExplanations = getInputOutputExplanations(selectedNode);

  const [idCopied, setIdCopied] = useState(false);

  const copyNodeId = async () => {
    if (!selectedNode) return;
    try {
      await navigator.clipboard.writeText(selectedNode.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the id stays selectable.
    }
  };
  /**
   * When a different node is selected, always
   * start on the Information tab.
   *
   * This also prevents the user from being left
   * on the Properties tab when the newly selected
   * node has no properties.
   */
  useEffect(() => {
    setActiveTab("information");
  }, [selectedNode?.id]);

  /**
   * If the current node loses all visible property
   * explanations because of experience-level filtering,
   * automatically return to the Information tab.
   */
  useEffect(() => {
    if (!hasPropertyExplanations) {
      setActiveTab("information");
    }
  }, [hasPropertyExplanations]);

  useEffect(() => {
    if (
      selectedNode &&
      !selectedNode.data.parameterType &&
      (parameterized_one_qubit.includes(selectedNode.data.label) ||
        parameterized_two_qubit.includes(selectedNode.data.label))
    ) {
      handleNumberChange("parameterType", "degree");
    }
  }, [selectedNode]);

  const [_fileName, setFileName] = useState("");

  const [_uncomputeFileName, setUncomputeFileName] = useState("");

  const [implementationContent, setImplementationContent] = useState("");

  const validFields = [
    "gamma",
    "lambda",
    "theta",
    "phi",
    "parameterType",
    "quantumStateName",
    "encodingType",
    "implementationType",
    "operator",
    "minMaxOperator",
    "uncomputeImplementationType",
    "implementation",
    "fileName",
    "uncomputeImplementation",
    "parameter",
    "nodeType",
    "basis",
    "indices",
    "condition",
    "clusteringAlgorithm",
    "numControls",
    "numTargets",
    "matrix",
    "controlValue",
    "explanation",
    "implementationLanguage",
    "implementationFileName",
    "decimalPrecision",
    "bound",
    "registerName",
    "value",
  ];

  const normalizeDegrees = (deg: number) => {
    const normalized = deg % 360;

    return normalized < 0 ? normalized + 360 : normalized;
  };

  const degToRad = (deg: string | number) =>
    (normalizeDegrees(parseFloat(String(deg))) * Math.PI) / 180;

  const radToDeg = (rad: string | number) =>
    normalizeDegrees((parseFloat(String(rad)) * 180) / Math.PI);

  const safeEval = (expr: string) => {
    try {
      const sanitized = expr.replace(/π|pi/gi, `${Math.PI}`);

      return sanitized;
    } catch {
      return NaN;
    }
  };

  const handleParameterChange = (value: string) => {
    const evaluated = safeEval(value);

    if (!isNaN(Number(evaluated))) {
      const storedValue =
        selectedNode?.data.parameterType === "degree"
          ? degToRad(value)
          : radToDeg(value);

      handleNumberChange("parameter", "" + storedValue);
    } else {
      handleNumberChange("parameter", String(evaluated));
    }
  };

  let validMinValue = 0;

  if (
    selectedNode?.type === "splitterNode" ||
    selectedNode?.type === "mergerNode"
  ) {
    validMinValue = 2;
  } else if (
    selectedNode?.type === "ifElseNode" ||
    selectedNode?.type === "controlStructureNode" ||
    selectedNode?.type === "mcmt-gate"
  ) {
    validMinValue = 1;
  }

  function handleNumberChange(field: string, value: string) {
    if (selectedNode) {
      if (field === "parameterType") {
        updateNodeValue(selectedNode.id, field, value);

        handleParameterChange(selectedNode.data.parameter);
      }

      if (field === "implementation") {
        setImplementationContent(value);
      }

      if (validFields.includes(field)) {
        selectedNode.data[field] = value;

        updateNodeValue(selectedNode.id, field, value);
      } else if (!isNaN(Number(value))) {
        if (Number(value) < validMinValue) {
          selectedNode.data[field] = Number(validMinValue);

          updateNodeValue(selectedNode.id, field, String(validMinValue));
        } else {
          selectedNode.data[field] = Number(value);

          updateNodeValue(selectedNode.id, field, value);
        }
      }
    }
  }

  function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) {
    if (event.target.files && selectedNode) {
      const file = event.target.files[0];

      const reader = new FileReader();

      reader.onload = function (e) {
        const fileContent = e.target?.result as string;

        if (field === "uncomputeImplementation") {
          selectedNode.data.uncomputeImplementation = fileContent;

          updateNodeValue(selectedNode.id, field, fileContent);

          updateNodeValue(selectedNode.id, "uncomputeFileName", file.name);

          setUncomputeFileName(file.name);
        } else {
          selectedNode.data.implementation = fileContent;

          updateNodeValue(selectedNode.id, "implementation", fileContent);

          updateNodeValue(selectedNode.id, "fileName", file.name);

          setFileName(file.name);

          if (selectedNode.type === EditableNode) {
            updateNodeValue(
              selectedNode.id,
              "implementationFileName",
              file.name,
            );

            const extension = file.name.split(".").pop()?.toLowerCase();

            if (extension === "qasm") {
              updateNodeValue(
                selectedNode.id,
                "implementationLanguage",
                "qasm",
              );
            } else if (extension === "py") {
              updateNodeValue(
                selectedNode.id,
                "implementationLanguage",
                "python",
              );
            }
          }
        }
      };

      reader.readAsText(file);
    }
  }

  const editableImplementationType =
    getEditableNodeImplementationType(selectedNode);

  /** Stores structured values (objects, lists) that handleNumberChange does not support. */
  function updateField(field: string, value: any) {
    if (!selectedNode) return;
    selectedNode.data[field] = value;
    updateNodeValue(selectedNode.id, field, value);
  }

  return (
    <>
      <aside className="flex flex-col w-full h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-2 font-semibold flex">
          <button
            onClick={() => {
              setSelectedNode(null);
            }}
          >
            <ArrowLeft />
          </button>

          <h2 className="flex-grow text-center">Properties Panel</h2>
        </div>

        <hr />

        {selectedNode && (
          <>
            {/* Tabs */}
            <div className="mt-4 border-b border-gray-200">
              <div
                className="flex"
                role="tablist"
                aria-label="Node information"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "information"}
                  onClick={() => setActiveTab("information")}
                  className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "information"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Information
                </button>

                {hasPropertyExplanations && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "properties"}
                    onClick={() => setActiveTab("properties")}
                    className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "properties"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Properties
                  </button>
                )}
              </div>
            </div>

            {/* Information Tab */}
            {activeTab === "information" && (
              <div role="tabpanel" className="p-2">
                <div>
                  <label
                    className="block text-sm font-medium text-start text-gray-700"
                    htmlFor="nodeId"
                  >
                    Node ID
                  </label>
                  <div className="mt-1 flex gap-2 items-center">
                    <input
                      id="nodeId"
                      type="text"
                      readOnly
                      value={selectedNode.id}
                      onFocus={(e) => e.target.select()}
                      className="border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-700 font-mono text-xs w-full min-w-0"
                    />
                    <button
                      type="button"
                      onClick={copyNodeId}
                      className="text-xs text-blue-600 underline whitespace-nowrap"
                    >
                      {idCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-start text-gray-700">
                    Explanation
                  </label>

                  {selectedNode.type === EditableNode ? (
                    <textarea
                      id="nodeExplanation"
                      name="nodeExplanation"
                      value={
                        selectedNode.data.explanation ??
                        NODE_EXPLANATIONS[EditableNode] ??
                        ""
                      }
                      onChange={(e) =>
                        handleNumberChange("explanation", e.target.value)
                      }
                      className="mt-1 border border-gray-300 rounded-md sm:text-sm p-2 bg-white text-gray-700 w-full min-h-28 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter an explanation for this custom node..."
                    />
                  ) : (
                    <div className="mt-1 min-h-28 border border-gray-300 rounded-md sm:text-sm p-2 bg-gray-50 text-gray-700">
                      {getNodeExplanation(selectedNode)}
                    </div>
                  )}
                </div>

                <PropertyInputOutput
                  input={inputOutputExplanations.input}
                  output={inputOutputExplanations.output}
                />
              </div>
            )}

            {/* Properties Tab */}
            {hasPropertyExplanations && activeTab === "properties" && (
              <div role="tabpanel" className="p-2">
                <PropertyExplanations properties={propertyExplanations} />
              </div>
            )}
          </>
        )}

        {selectedNode?.type === EditableNode && editableImplementationType && (
          <CustomOperatorImplementation
            selectedNode={selectedNode}
            updateField={updateField}
            implementationFields={
              <EditableNodeImplementationFields
                selectedNode={selectedNode}
                implementationType={editableImplementationType}
                handleNumberChange={handleNumberChange}
                handleFileUpload={handleFileUpload}
              />
            }
          />
        )}

        {selectedNode?.type === "positionNode" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="value"
            >
              Value
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="value"
                name="value"
                value={selectedNode.data.value || ""}
                onChange={(e) => handleNumberChange("value", e.target.value)}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter a number"
              />
            </div>
          </div>
        )}

        {selectedNode?.data.label === "Encode Value" && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="encodingType"
            >
              Encoding Type
            </label>

            <div className="mt-1">
              <select
                id="encodingType"
                name="encodingType"
                value={selectedNode.data.encodingType || "Amplitude Encoding"}
                onChange={(e) =>
                  handleNumberChange("encodingType", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
              >
                {!completionGuaranteed && (
                  <option value="Amplitude Encoding">Amplitude Encoding</option>
                )}

                <option value="Angle Encoding">Angle Encoding</option>

                <option value="Basis Encoding">Basis Encoding</option>

                <option value="Custom Encoding">Custom Encoding</option>

                {!completionGuaranteed && (
                  <option value="Matrix Encoding">Matrix Encoding</option>
                )}

                {!completionGuaranteed && (
                  <option value="Schmidt Decomposition">
                    Schmidt Decomposition
                  </option>
                )}
              </select>
            </div>

            {selectedNode.data.encodingType !== "Basis Encoding" &&
              selectedNode.data.encodingType !== "Angle Encoding" && (
                <>
                  <label
                    className="block text-sm font-medium text-start text-gray-700 mt-2"
                    htmlFor="bound"
                  >
                    Bound
                  </label>

                  <div className="mt-1">
                    <input
                      type="text"
                      id="bound"
                      name="bound"
                      value={selectedNode.data.bound || ""}
                      onChange={(e) =>
                        handleNumberChange("bound", e.target.value)
                      }
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                      placeholder="Enter bound"
                    />
                  </div>
                </>
              )}
          </div>
        )}

        {(selectedNode?.type === OperatorNode ||
          selectedNode?.type === ClassicalOperatorNode) && (
          <div className="p-2 mt-3">
            {selectedNode.data.label.includes("Arithmetic Operator") && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="arithmeticOperator"
                >
                  Arithmetic Operator
                </label>

                <div className="mt-1">
                  <select
                    id="arithmeticOperator"
                    name="arithmeticOperator"
                    value={selectedNode.data.operator || "+"}
                    onChange={(e) =>
                      handleNumberChange("operator", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="+">+</option>

                    {!completionGuaranteed && <option value="-">-</option>}

                    {!completionGuaranteed && <option value="/">/</option>}

                    {!completionGuaranteed && <option value="*">*</option>}

                    {!completionGuaranteed && <option value="**">**</option>}
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(comparisonOperatorLabel) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="comparisonOperator"
                >
                  Comparison Operator
                </label>

                <div className="mt-1">
                  <select
                    id="comparisonOperator"
                    name="comparisonOperator"
                    value={selectedNode.data.operator || "≤"}
                    onChange={(e) =>
                      handleNumberChange("operator", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="<=">≤</option>

                    <option value="<">&lt;</option>

                    <option value="=">=</option>

                    <option value="!=">≠</option>

                    <option value=">">&gt;</option>

                    <option value=">=">≥</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(minMaxOperatorLabel) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="minMaxOperator"
                >
                  Min/Max Operator
                </label>

                <div className="mt-1">
                  <select
                    id="minMaxOperator"
                    name="minMaxOperator"
                    value={selectedNode.data.operator || "min"}
                    onChange={(e) =>
                      handleNumberChange("operator", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="min">Min</option>

                    <option value="max">Max</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.data.label.includes(bitwiseOperatorLabel) && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-2"
                  htmlFor="minMaxOperator"
                >
                  Bitwise Operator
                </label>

                <div className="mt-1">
                  <select
                    id="minMaxOperator"
                    name="minMaxOperator"
                    value={selectedNode.data.operator || "min"}
                    onChange={(e) =>
                      handleNumberChange("operator", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="|">OR</option>

                    <option value="&">AND</option>

                    <option value="~">INVERT</option>

                    <option value="^">XOR</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode?.type === OperatorNode && (
              <ImplementationFields
                selectedNode={selectedNode}
                handleNumberChange={handleNumberChange}
                handleFileUpload={handleFileUpload}
                implementationContent={implementationContent}
                type=""
              />
            )}
          </div>
        )}

        {selectedNode?.type === "measurementNode" && (
          <div className="p-2 mt-3">
            {selectedNode.data.hasRegisterInput && (
              <>
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="registerName"
                >
                  Register Name
                </label>

                <div className="mt-1">
                  <input
                    type="text"
                    id="registerName"
                    name="registerName"
                    value={selectedNode.data.registerName || ""}
                    onChange={(e) =>
                      handleNumberChange("registerName", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter register name"
                  />
                </div>
              </>
            )}

            <label
              className="block text-sm font-medium text-start text-gray-700 mt-2"
              htmlFor="basis"
            >
              Basis
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="basis"
                name="basis"
                value={selectedNode.data.basis || ""}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();

                  if (/^[XYZ]*$/.test(value)) {
                    handleNumberChange("basis", value);
                  }
                }}
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="e.g. XYZ"
              />
            </div>

            {selectedNode.data.basis &&
              !/^[XYZ]+$/.test(selectedNode.data.basis.toUpperCase()) && (
                <p className="text-red-500 text-xs mt-1">
                  Basis may only contain X, Y, or Z.
                </p>
              )}

            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === "gateNode" && (
          <>
            {(parameterized_one_qubit.includes(selectedNode.data.label) ||
              parameterized_two_qubit.includes(selectedNode.data.label)) && (
              <div className="p-2 mt-3">
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="parameter"
                >
                  Parameter
                </label>

                <div className="mt-1">
                  <input
                    type="number"
                    id="parameter"
                    name="parameter"
                    value={
                      selectedNode.data.parameterType === "degree"
                        ? selectedNode.data.parameter
                        : selectedNode.data.parameter || ""
                    }
                    onChange={(e) =>
                      handleNumberChange("parameter", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    placeholder="Enter parameter"
                  />
                </div>

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="parameterType"
                >
                  Parameter Type
                </label>

                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={selectedNode.data.parameterType || ""}
                    onChange={(e) =>
                      handleNumberChange("parameterType", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="degree">Degree</option>

                    <option value="radian">Radian</option>
                  </select>
                </div>
              </div>
            )}

            {u_gate_parameters[selectedNode.data.label] && (
              <div className="p-2 mt-3">
                <label className="block text-sm font-medium text-start text-gray-700 mb-2">
                  Parameters (radian, e.g. pi/2)
                </label>

                {u_gate_parameters[selectedNode.data.label].map(
                  (angle, index, angles) => {
                    const values = String(selectedNode.data.parameter ?? "")
                      .split(",")
                      .map((v) => v.trim());

                    return (
                      <div key={angle} className="mb-3">
                        <label
                          className="block text-xs font-medium text-gray-600"
                          htmlFor={`u-param-${index}`}
                        >
                          {angle}
                        </label>

                        <input
                          type="text"
                          id={`u-param-${index}`}
                          name={`u-param-${index}`}
                          value={values[index] ?? ""}
                          onChange={(e) => {
                            const next = angles.map(
                              (_, i) => values[i] ?? "0",
                            );
                            next[index] = e.target.value.replace(/,/g, "");
                            handleNumberChange("parameter", next.join(","));
                          }}
                          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                          placeholder={`Enter ${angle}`}
                        />
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {selectedNode.data.label === "CU" && (
              <div className="p-2 mt-3">
                <label
                  className="block text-sm font-medium text-start text-gray-700"
                  htmlFor="controlValue"
                >
                  Control Value
                </label>

                <div className="mt-1">
                  <select
                    id="controlValue"
                    name="controlValue"
                    value={selectedNode.data.controlValue || ""}
                    onChange={(e) =>
                      handleNumberChange("controlValue", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="0">0</option>

                    <option value="1">1</option>
                  </select>
                </div>

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="matrix"
                >
                  Matrix
                </label>

                <div className="mt-1">
                  <input
                    id="matrix"
                    name="matrix"
                    value={selectedNode.data.matrix || ""}
                    onChange={(e) =>
                      handleNumberChange("matrix", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  />
                </div>
              </div>
            )}

            {multi_parameterized_two_qubit.includes(
              selectedNode.data.label,
            ) && (
              <div className="p-2 mt-3">
                <label className="block text-sm font-medium text-start text-gray-700 mb-2">
                  Parameters
                </label>

                {[
                  {
                    key: "theta",
                    label: "θ",
                  },
                  {
                    key: "phi",
                    label: "φ",
                  },
                  {
                    key: "lambda",
                    label: "λ",
                  },
                  {
                    key: "gamma",
                    label: "γ",
                  },
                ].map(({ key, label }) => (
                  <div key={key} className="mb-3">
                    <label
                      className="block text-xs font-medium text-gray-600"
                      htmlFor={`param-${key}`}
                    >
                      {label}
                    </label>

                    <input
                      type="text"
                      id={`param-${key}`}
                      name={`param-${key}`}
                      value={
                        selectedNode.data.parameterType === "degree"
                          ? radToDeg(selectedNode.data[key] || 0)
                          : selectedNode.data[key] || ""
                      }
                      onChange={(e) => handleNumberChange(key, e.target.value)}
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                      placeholder={`Enter ${label}`}
                    />
                  </div>
                ))}

                <label
                  className="block text-sm font-medium text-start text-gray-700 mt-4"
                  htmlFor="parameterType"
                >
                  Parameter Type
                </label>

                <div className="mt-1">
                  <select
                    id="parameterType"
                    name="parameterType"
                    value={selectedNode.data.parameterType || ""}
                    onChange={(e) =>
                      handleNumberChange("parameterType", e.target.value)
                    }
                    className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                  >
                    <option value="degree">Degree</option>

                    <option value="radian">Radian</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {(selectedNode?.type === AlgorithmNode ||
          selectedNode?.type === ClassicalAlgorithmNode) && (
          <CustomOperatorImplementation
            selectedNode={selectedNode}
            updateField={updateField}
            implementationFields={
              <ImplementationFields
                selectedNode={selectedNode}
                handleNumberChange={handleNumberChange}
                handleFileUpload={handleFileUpload}
                implementationContent={implementationContent}
                type=""
              />
            }
          />
        )}

        {selectedNode?.type === "splitterNode" && (
          <div className="p-2 mt-3">
            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === "mergerNode" && (
          <div className="p-2 mt-3">
            <ImplementationFields
              selectedNode={selectedNode}
              handleNumberChange={handleNumberChange}
              handleFileUpload={handleFileUpload}
              implementationContent={implementationContent}
              type=""
            />
          </div>
        )}

        {selectedNode?.type === ControlStructureNode && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="condition"
            >
              Condition
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="condition"
                name="condition"
                value={selectedNode.data.condition || ""}
                onChange={(e) =>
                  handleNumberChange("condition", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
          </div>
        )}

        {selectedNode?.type === IfElseNode && (
          <div className="p-2 mt-3">
            <label
              className="block text-sm font-medium text-start text-gray-700"
              htmlFor="condition"
            >
              Condition
            </label>

            <div className="mt-1">
              <input
                type="text"
                id="condition"
                name="condition"
                value={selectedNode.data.condition || ""}
                onChange={(e) =>
                  handleNumberChange("condition", e.target.value)
                }
                className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                placeholder="Enter condition"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

interface EditableNodeImplementationFieldsProps {
  selectedNode: Node;
  implementationType: "quantum" | "classical";
  handleNumberChange: (field: string, value: string) => void;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => void;
}

const EditableNodeImplementationFields: React.FC<
  EditableNodeImplementationFieldsProps
> = ({
  selectedNode,
  implementationType,
  handleNumberChange,
  handleFileUpload,
}) => {
  const isQuantum = implementationType === "quantum";

  const implementation = selectedNode.data.implementation || "";

  const fileName =
    selectedNode.data.implementationFileName ||
    selectedNode.data.fileName ||
    "";

  const language = selectedNode.data.implementationLanguage || "";

  return (
    <div className="p-2 mt-3 border border-gray-200 rounded-md bg-gray-50">
      <label className="block text-sm font-medium text-start text-gray-700">
        Custom Implementation
      </label>

      <p className="text-xs text-gray-500 mt-1 mb-3">
        {isQuantum
          ? "Custom Quantum Operator: upload a QASM or Python implementation."
          : "Custom Classical Operator: upload a Python implementation."}
      </p>

      <label
        className="block text-sm font-medium text-start text-gray-700"
        htmlFor="editableNodeImplementationFile"
      >
        Upload Implementation
      </label>

      <div className="mt-1">
        <input
          type="file"
          id="editableNodeImplementationFile"
          name="editableNodeImplementationFile"
          accept={
            isQuantum
              ? ".qasm,.py,text/x-python,application/x-python"
              : ".py,text/x-python,application/x-python"
          }
          onChange={(e) => handleFileUpload(e, "implementation")}
          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 bg-white"
        />
      </div>

      {fileName && (
        <div className="mt-1 text-xs text-gray-500">File: {fileName}</div>
      )}

      {language && (
        <div className="mt-1 text-xs text-gray-500">
          Language: {language === "qasm" ? "QASM" : "Python"}
        </div>
      )}

      <label
        className="block text-sm font-medium text-start text-gray-700 mt-3"
        htmlFor="editableNodeImplementation"
      >
        Implementation
      </label>

      <textarea
        id="editableNodeImplementation"
        name="editableNodeImplementation"
        value={implementation}
        onChange={(e) => handleNumberChange("implementation", e.target.value)}
        className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-48 overflow-auto bg-white font-mono text-xs"
        placeholder={
          isQuantum
            ? "Upload a .qasm or .py file, or enter the implementation manually..."
            : "Upload a .py file, or enter the Python implementation manually..."
        }
      />
    </div>
  );
};

interface ImplementationFieldsProps {
  selectedNode: any;
  handleNumberChange: (field: string, value: string) => void;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => void;
  implementationContent: string;
  type?: "" | "uncompute";
}

export const ImplementationFields: React.FC<ImplementationFieldsProps> = ({
  selectedNode,
  handleNumberChange,
  handleFileUpload,
  implementationContent,
  type = "",
}) => {
  const isUncompute = type === "uncompute";

  const prefix = isUncompute ? "uncompute" : "";
  const isClassical = selectedNode.type.includes("classical");

  const implementationKey = `${prefix}${
    isUncompute ? "Implementation" : "implementation"
  }`;

  const fileNameKey = `${prefix}${isUncompute ? "FileName" : "fileName"}`;

  return (
    <>
      <label
        className="block text-sm font-medium text-start text-gray-700 mt-2"
        htmlFor={`${prefix}FileUpload`}
      >
        {isUncompute
          ? "Upload Uncompute Implementation File"
          : isClassical
            ? "Upload Python File"
            : "Upload QASM File or Python File"}
      </label>

      <div className="mt-1">
        <input
          type="file"
          accept={isClassical ? ".py" : ".qasm,.py"}
          id={`${prefix}FileUpload`}
          name={`${prefix}FileUpload`}
          onChange={(e) => handleFileUpload(e, implementationKey)}
          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
        />
      </div>

      <span className="text-sm text-gray-500">
        {selectedNode.data[fileNameKey]}
      </span>

      <label
        className="block text-sm font-medium text-start text-gray-700 mt-2"
        htmlFor={`${implementationKey}Content`}
      >
        {isUncompute
          ? "Uncompute Implementation Content"
          : "Implementation Content"}
      </label>

      <textarea
        id={`${implementationKey}Content`}
        name={`${implementationKey}Content`}
        value={selectedNode.data[implementationKey] || implementationContent}
        onChange={(e) => handleNumberChange(implementationKey, e.target.value)}
        className="border block w-full border-gray-300 rounded-md sm:text-sm p-2 h-32 overflow-auto"
        placeholder="File content will appear here or enter manually"
      />
    </>
  );
};
