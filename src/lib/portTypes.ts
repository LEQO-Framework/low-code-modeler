import * as consts from "@/constants";

export const QUANTUM_REGISTER = "quantum register";

const quantumRegisters = (count: number): string[] =>
  Array.from({ length: Math.max(0, count) }, () => QUANTUM_REGISTER);

const positiveInt = (value: unknown, fallback: number): number => {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const TWO_QUBIT_GATES = [
  "CU",
  "CNOT",
  "SWAP",
  "CZ",
  "CY",
  "CH",
  "CP(λ)",
  "CRX(θ)",
  "CRY(θ)",
  "CRZ(θ)",
  "CU(θ,φ,λ,γ)",
];

/** Number of qubit ports of a gate node (same count for inputs and outputs). */
export const getGateArity = (label: string): number => {
  if (label === consts.qubitLabel) return 0;
  if (label === "Toffoli" || label === "CSWAP") return 3;
  if (TWO_QUBIT_GATES.includes(label)) return 2;
  return 1;
};

/**
 * Port types of nodes whose ports only depend on the node's own data (and not on
 * what is connected to them). Returns undefined for all other node types.
 */
export const getFixedPortTypes = (
  node: any,
): { inputTypes: string[]; outputTypes: string[] } | undefined => {
  const data = node?.data ?? {};
  switch (node?.type) {
    case consts.GateNode: {
      const arity = getGateArity(data.label ?? "");
      return {
        inputTypes: quantumRegisters(arity),
        outputTypes: quantumRegisters(Math.max(1, arity)),
      };
    }
    case consts.SplitterNode:
      return {
        inputTypes: [QUANTUM_REGISTER],
        outputTypes: quantumRegisters(positiveInt(data.numberOutputs, 2)),
      };
    case consts.MergerNode:
      return {
        inputTypes: quantumRegisters(positiveInt(data.numberInputs, 2)),
        outputTypes: [QUANTUM_REGISTER],
      };
    case consts.QFTNode:
    case consts.InverseQFTNode: {
      const qubits = positiveInt(data.numberOutputs, 1);
      return {
        inputTypes: quantumRegisters(qubits),
        outputTypes: quantumRegisters(qubits),
      };
    }
    case consts.MCMTGateNode: {
      const total =
        positiveInt(data.numControls, 1) + positiveInt(data.numTargets, 1);
      return {
        inputTypes: quantumRegisters(total),
        outputTypes: quantumRegisters(total),
      };
    }
    case consts.UniversalOracleNode:
    case consts.GroverDiffuserNode:
      return {
        inputTypes: [QUANTUM_REGISTER],
        outputTypes: [QUANTUM_REGISTER],
      };
    case consts.DeutschJozsaNode:
    case consts.GroverNode:
      return { inputTypes: [], outputTypes: [QUANTUM_REGISTER] };
    case consts.QAOANode:
      return {
        inputTypes: ["array", "array", "array"],
        outputTypes: [QUANTUM_REGISTER],
      };
    case consts.QubitNode:
    case consts.AncillaNode:
      return { inputTypes: [], outputTypes: [QUANTUM_REGISTER] };
    case consts.MeasurementNode:
      return {
        inputTypes: [QUANTUM_REGISTER],
        outputTypes: ["array", QUANTUM_REGISTER],
      };
    default:
      return undefined;
  }
};

// ===== Custom operators =====

const CUSTOM_OPERATOR_TYPES = [
  consts.AlgorithmNode,
  consts.ClassicalAlgorithmNode,
];

export const isCustomOperator = (node: any): boolean =>
  CUSTOM_OPERATOR_TYPES.includes(node?.type);

const count = (value: unknown) => Math.max(0, parseInt(String(value), 10) || 0);

/** Classical slot value: keep a concrete classical type, otherwise the default. */
const classicalSlot = (existing: unknown, fallback: string) =>
  typeof existing === "string" &&
  existing !== "" &&
  existing !== "any" &&
  existing.toLowerCase() !== QUANTUM_REGISTER
    ? existing.toLowerCase()
    : fallback;

/**
 * Port types of a custom operator. Classical and quantum handles are both
 * numbered from 0, so the types are laid out as
 *   [classical port 0..n-1, quantum port 0..m-1]
 * for inputs and outputs (see {@link portTypeIndex}).
 *
 * Classical inputs are "any" until something is connected (the connected type is
 * kept), classical outputs are "any" or the data type of the API connector output.
 */
const getCustomOperatorPortTypes = (node: any) => {
  const data = node.data ?? {};
  const classicalInputs = count(data.numberClassicalInputs);
  const classicalOutputs = count(data.numberClassicalOutputs);
  const quantumInputs = count(data.numberQuantumInputs);
  const quantumOutputs = count(data.numberQuantumOutputs);
  const existingInputs = toTypeArray(data.inputTypes);
  const existingOutputs = toTypeArray(data.outputTypes);
  const apiOutputs: any[] =
    data.implementationMode === "api" ? (data.apiConnector?.outputs ?? []) : [];

  return {
    inputTypes: [
      ...Array.from({ length: classicalInputs }, (_, i) =>
        classicalSlot(existingInputs[i], "any"),
      ),
      ...quantumRegisters(quantumInputs),
    ],
    outputTypes: [
      ...Array.from({ length: classicalOutputs }, (_, i) =>
        apiOutputs[i]?.dataType
          ? String(apiOutputs[i].dataType).toLowerCase()
          : classicalSlot(existingOutputs[i], "any"),
      ),
      ...quantumRegisters(quantumOutputs),
    ],
  };
};

/**
 * Computed port types of a node: fixed types, or the types of a custom operator.
 * Returns undefined for nodes whose types are managed elsewhere.
 */
export const getPortTypes = (
  node: any,
): { inputTypes: string[]; outputTypes: string[] } | undefined =>
  getFixedPortTypes(node) ??
  (isCustomOperator(node) ? getCustomOperatorPortTypes(node) : undefined);

/**
 * Index of a handle in the node's inputTypes/outputTypes. For custom operators,
 * quantum ports come after the classical ones.
 */
export const portTypeIndex = (
  node: any,
  handleId: string | null | undefined,
): number => {
  if (!handleId || !node) return 0;
  const prefix = handleId.endsWith(node.id)
    ? handleId.slice(0, -node.id.length)
    : handleId.replace(node.id, "");
  const match = prefix.match(/(\d+)$/);
  const index = match ? Number(match[1]) : 0;
  if (!isCustomOperator(node) || !handleId.startsWith("quantum")) return index;
  const offset = handleId.includes("Output")
    ? count(node.data?.numberClassicalOutputs)
    : count(node.data?.numberClassicalInputs);
  return offset + index;
};

/** Base type of a port, used when its connection is removed. */
export const basePortType = (
  node: any,
  handleId: string | null | undefined,
): string =>
  isCustomOperator(node) && handleId?.startsWith("quantum")
    ? QUANTUM_REGISTER
    : "any";

/** Data fields that change the port types of a node with computed port types. */
export const PORT_COUNT_FIELDS = [
  "numberInputs",
  "numberOutputs",
  "numControls",
  "numTargets",
  "numberClassicalInputs",
  "numberClassicalOutputs",
  "numberQuantumInputs",
  "numberQuantumOutputs",
  "implementationMode",
  "apiConnector",
];

/**
 * Converts a types value to a plain array. Older models (and older versions of
 * OutputPort) stored types as an index-keyed object like { "0": "...", "1": "..." }.
 */
export const toTypeArray = (types: unknown): string[] => {
  if (Array.isArray(types)) return [...types];
  if (types && typeof types === "object") {
    const result: string[] = [];
    Object.entries(types as Record<string, string>).forEach(([key, value]) => {
      const index = Number(key);
      if (Number.isInteger(index) && index >= 0) result[index] = value;
    });
    return Array.from(result, (t) => t ?? "any");
  }
  return [];
};

/**
 * Normalizes a node's inputTypes/outputTypes: always arrays, and recomputed for
 * node types whose port types are computed (see {@link getPortTypes}).
 */
export const withPortTypes = <T extends { type?: string; data?: any }>(
  node: T,
): T => {
  if (!node?.data) return node;
  const fixed = getPortTypes(node);
  return {
    ...node,
    data: {
      ...node.data,
      inputTypes: fixed?.inputTypes ?? toTypeArray(node.data.inputTypes),
      outputTypes: fixed?.outputTypes ?? toTypeArray(node.data.outputTypes),
    },
  };
};
