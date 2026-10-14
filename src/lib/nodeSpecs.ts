/**
 *
 * Used by the model validation (lib/modelValidation.ts) and by the test model
 * generator (components/modals/testingModal.tsx).
 */

export const QAOA_NODE_TYPE = "qaoa";
export const STATE_PREPARATION_NODE_TYPE = "statePreparationNode";
export const CLASSICAL_OPERATOR_NODE_TYPE = "classicalOperatorNode";
export const QUANTUM_OPERATOR_NODE_TYPE = "quantumOperatorNode";
export const PLUGIN_NODE_TYPE = "pluginNode";
export const GATE_NODE_TYPE = "gateNode";
export const DATA_TYPE_NODE_TYPE = "dataTypeNode";
export const QUBIT_NODE_TYPE = "qubitNode";

// --- Classical data types & values ---

export const KNOWN_CLASSICAL_TYPES = [
  "bit",
  "boolean",
  "number",
  "array",
  "string",
  "file",
  "angle",
];

/** Maps the different spellings used in models ("Number", "float", "Array") to one type. */
export function normalizeDataType(type: unknown): string {
  const t = String(type ?? "")
    .trim()
    .toLowerCase();
  if (["float", "int", "integer", "double"].includes(t)) return "number";
  return t;
}

export function isTypeCompatible(expected: string, actual: string): boolean {
  const e = normalizeDataType(expected.split(":")[0]);
  const a = normalizeDataType(actual);
  if (!KNOWN_CLASSICAL_TYPES.includes(a)) return false;
  return e === "any" || e === a || (e === "number" && a === "angle");
}

const isFiniteNumber = (s: string) =>
  s.trim() !== "" && Number.isFinite(Number(s.trim()));

export const MAX_STRING_LENGTH = 4096;

const EXECUTABLE_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "com",
  "dll",
  "msi",
  "ps1",
  "scr",
  "sh",
];

/**
 * Checks a value of a classical data node against its data type.
 * Returns a description of the problem, or null if the value is valid.
 */
export function checkDataValue(type: string, value: unknown): string | null {
  const t = normalizeDataType(type);
  if (value === undefined || value === null || String(value).trim() === "") {
    return "has no value";
  }
  const v = String(value).trim();
  switch (t) {
    case "bit":
      return /^[01]$/.test(v) ? null : `"${v}" is not a bit (0 or 1)`;
    case "boolean":
      return /^(true|false)$/i.test(v)
        ? null
        : `"${v}" is not a boolean (true or false)`;
    case "number":
      return isFiniteNumber(v) ? null : `"${v}" is not a finite number`;
    case "angle":
      return isFiniteNumber(v) || /^[\d\s.+\-*/()πpi]+$/.test(v)
        ? null
        : `"${v}" is not a valid angle`;
    case "array": {
      const open = (v.match(/\[/g) || []).length;
      const close = (v.match(/\]/g) || []).length;
      if (open !== close) return `"${v}" has unbalanced brackets`;
      const tokens = v.replace(/[[\]\s]/g, "").split(",");
      const bad = tokens.find((tok) => !isFiniteNumber(tok));
      return bad === undefined
        ? null
        : `"${short(v)}" is not a list of finite numbers (invalid element "${bad}")`;
    }
    case "string":
      // eslint-disable-next-line no-control-regex
      if (/[\u0000-\u001f]/.test(v)) return "contains control characters";
      return v.length > MAX_STRING_LENGTH
        ? `exceeds the maximum length of ${MAX_STRING_LENGTH} characters`
        : null;
    case "file": {
      // Inline file contents ("data:text/csv,1,2%0A3,4")
      if (/^data:/i.test(v)) {
        return /^data:[\w.+-]+\/[\w.+-]+(;[\w=.+-]+)*,/i.test(v)
          ? null
          : `"${short(v)}" is not a valid data: URL`;
      }
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) && !/^https?:\/\/\S+$/i.test(v)) {
        return `"${v}" is neither a file name nor an http(s) URL`;
      }
      if (!/^https?:\/\//i.test(v) && !/\.[A-Za-z0-9]+>?$/.test(v)) {
        return `"${v}" has no file extension`;
      }
      const ext = fileExtension(v);
      if (EXECUTABLE_EXTENSIONS.includes(ext)) {
        return `"${v}" is an executable, not a data file`;
      }
      return null;
    }
    default:
      return null;
  }
}

function short(v: string): string {
  return v.length > 40 ? `${v.slice(0, 20)}…` : v;
}

/** File extension of a file value, e.g. "csv" for "<data.csv>" or "x/data.csv". */
export function fileExtension(value: string): string {
  let v = String(value).trim();
  if (/^data:/i.test(v)) return "";
  // For URLs only the path counts, not the query or fragment.
  if (/^https?:\/\//i.test(v)) v = v.replace(/[?#].*$/, "");
  const m = v.match(/\/?[^/]*\.([A-Za-z0-9]+)>?$/);
  return m ? m[1].toLowerCase() : "";
}

/** Media type of a data: URL ("data:text/csv,..." -> "text/csv"). */
export function dataUrlMediaType(value: string): string {
  const m = String(value)
    .trim()
    .match(/^data:([\w.+-]+\/[\w.+-]+)/i);
  return m ? m[1].toLowerCase() : "";
}

export const CONTENT_TYPE_EXTENSIONS: Record<string, string[]> = {
  "application/json": ["json"],
  "text/csv": ["csv"],
  "text/plain": ["txt"],
};

// --- Test value pools ---

export type ValuePoolContext = Record<string, string | number | boolean>;
export type ValuePool = string[] | ((ctx: ValuePoolContext) => string[]);

// The first value of each pool is used for the valid baseline models.
export const dataTypeValuePools: Record<string, ValuePool> = {
  array: ["0,1"],
  "array:edgeArray": ["[0,1],[1,2]"], // QAOA graph: list of edges
  "array:normalized": ["0.6,0.8"], // amplitude encoding: L2 norm 1, length 2^n
  "array:unitary": ["0,1,1,0"], // matrix encoding: flattened Pauli-X
  number: ["1"],
  bit: ["1"],
  boolean: ["true"],
  string: ["<string_placeholder>"],
  file: ["<file_placeholder.csv>"],
  // "type:<data type>|<value>" lets an "any" port pick a concrete data type
  any: ["type:number|3.14"],
  // Derived pool ensuring array length matches 'p' parameter
  "array:length=p": (ctx) => {
    const p = Math.max(1, Number(ctx.p) || 1);
    return [
      Array.from({ length: p }, (_, i) => ((i + 1) * 0.1).toFixed(2)).join(","),
    ];
  },
};

export function resolvePool(key: string, ctx: ValuePoolContext): string[] {
  const pool = dataTypeValuePools[key];
  if (!pool) return [""];
  return typeof pool === "function" ? pool(ctx) : pool;
}

// --- Encoding constraints (mirror the backend's encode value handlers) ---

/** "Amplitude Encoding" / "amplitude" -> "amplitude" */
export function encodingKind(encodingType: unknown): string {
  return String(encodingType ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s*encoding$/, "");
}

/** Parses an array value ("0,1", "[0,1],[1,0]") into a flat list of numbers. */
export function parseNumberArray(value: unknown): number[] | null {
  const tokens = String(value ?? "")
    .replace(/[[\]\s]/g, "")
    .split(",");
  const numbers = tokens.map(Number);
  return tokens.length && numbers.every(Number.isFinite) ? numbers : null;
}

const TOLERANCE = 1e-6;

const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;

/** Amplitude encoding requires a normalized vector of length 2^n (n >= 1). */
export function checkAmplitudeVector(values: number[]): string | null {
  if (!isPowerOfTwo(values.length)) {
    return `amplitude encoding requires 2^n amplitudes (2, 4, 8, …), but got ${values.length}`;
  }
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return Math.abs(norm - 1) > TOLERANCE
    ? `amplitude encoding requires a normalized vector, but [${values.join(", ")}] has norm ${norm.toFixed(4)}`
    : null;
}

/** Matrix encoding requires a flat 2^n x 2^n unitary matrix (n >= 1). */
export function checkUnitaryMatrix(values: number[]): string | null {
  const dim = Math.round(Math.sqrt(values.length));
  if (dim * dim !== values.length) {
    return `matrix encoding requires a flat square matrix, but got ${values.length} values`;
  }
  if (!isPowerOfTwo(dim)) {
    return `matrix encoding requires a 2^n x 2^n matrix, but got ${dim} x ${dim}`;
  }
  // U^T U = I for a real matrix
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      let dot = 0;
      for (let k = 0; k < dim; k++) {
        dot += values[k * dim + i] * values[k * dim + j];
      }
      if (Math.abs(dot - (i === j ? 1 : 0)) > TOLERANCE) {
        return `matrix encoding requires a unitary matrix, but [${values.join(", ")}] is not unitary`;
      }
    }
  }
  return null;
}

/**
 * Graph edges for QAOA (MaxCut, Graph Coloring): a list of vertex pairs,
 * "[0,1],[1,2]" or "[[0,1],[1,2]]". Each edge connects two different vertices
 * (non-negative integers) and appears only once, in either direction.
 */
export function checkEdgeList(value: unknown): string | null {
  const v = String(value ?? "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(`[${v}]`);
  } catch {
    return `"${short(v)}" is not a list of edges like [[0,1],[1,2]]`;
  }
  let edges = parsed as unknown[];
  // "[[0,1],[1,2]]" wraps the list once more.
  if (
    edges.length === 1 &&
    Array.isArray(edges[0]) &&
    (edges[0] as unknown[]).every(Array.isArray)
  ) {
    edges = edges[0] as unknown[];
  }
  if (edges.length === 0) return "the edge list is empty";
  const seen = new Map<string, string>();
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) {
      return `edge ${JSON.stringify(edge)} is not a pair of vertices [i,j] (expected a list like [[0,1],[1,2]])`;
    }
    const [i, j] = edge;
    if (![i, j].every((x) => Number.isInteger(x) && x >= 0)) {
      return `edge ${JSON.stringify(edge)} must connect non-negative integer vertex indices`;
    }
    if (i === j) return `edge [${i},${j}] connects vertex ${i} with itself`;
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
    const previous = seen.get(key);
    if (previous) {
      return `edge [${i},${j}] duplicates edge ${previous}`;
    }
    seen.set(key, `[${i},${j}]`);
  }
  return null;
}

export const GRAPH_PROBLEMS = ["MaxCut", "GraphColoring"];

/** Checks the array connected to an encoding node against its encoding. */
function checkEncodedValue(node: any, ctx: SpecCheckContext): string[] {
  const edge = ctx.incoming.find(
    (e) => e.targetHandle === `classicalHandleStatePreparationInput0${node.id}`,
  );
  const source = edge && ctx.nodesById.get(edge.source);
  if (
    source?.type !== DATA_TYPE_NODE_TYPE ||
    normalizeDataType(source.data?.dataType) !== "array"
  ) {
    return [];
  }
  // Malformed arrays are reported by the data value check.
  const values = parseNumberArray(source.data?.value);
  if (!values) return [];
  const kind = encodingKind(node.data?.encodingType);
  const problem =
    kind === "amplitude"
      ? checkAmplitudeVector(values)
      : kind === "matrix"
        ? checkUnitaryMatrix(values)
        : null;
  return problem ? [`Input value: ${problem}.`] : [];
}

// --- Spec types ---

export interface TestableOption {
  key: string;
  label: string;
  /** Values used to generate test models; the first one is the baseline. */
  values: (string | number)[];
  /** Complete set of permitted values (defaults to no restriction). */
  allowed?: (string | number)[];
  /** The parameter must be present and non-empty. */
  required?: boolean;
  /** Numeric parameter constraints. */
  numeric?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  /** Numeric value or expression with π (gate parameters). */
  numericExpression?: boolean;
  /** Format a string value must match. */
  pattern?: RegExp;
  patternDescription?: string;
}

export type PortKind = "classical" | "quantum";

export interface TestableInputPort {
  key: string;
  label: string;
  labelFor?: (optionValues: Record<string, string | number>) => string;
  /** Defaults to "classical". */
  kind?: PortKind;
  /** Expected data type of a classical port ("quantum" for quantum ports). */
  dataTypeKey: string;
  targetHandle: (nodeId: string) => string;
  /** Defaults to true. */
  required?: boolean;
  /** Numeric constraints on the connected value (e.g. k >= 1 and integer). */
  integer?: boolean;
  min?: number;
  /** Register size of the qubit source in generated test models (default 1). */
  registerSize?: number;
}

export interface SpecCheckContext {
  nodesById: Map<string, any>;
  edges: any[];
  /** Edges ending at this node. */
  incoming: any[];
  /** Size of the quantum register connected to a target handle, if it can be determined. */
  registerSizeAt: (targetHandle: string) => number | undefined;
}

export interface TestableNodeSpec {
  id: string;
  label: string;
  /** Palette category, used for grouping. */
  category: string;
  nodeType: string;
  /** Further labels a node of this kind may carry in saved models. */
  aliases?: string[];
  defaultData: Record<string, any>;
  width: number;
  height: number;
  options: TestableOption[];
  inputs: TestableInputPort[];
  /** Handle of the (first) output. */
  outputHandle?: (nodeId: string) => string;
  /**
   * All valid target handles of a concrete node (ports can depend on its
   * configuration). null disables the port check for this node type.
   */
  targetHandles?: (node: any) => string[] | null;
  /** Node-specific semantic checks; returns error descriptions. */
  check?: (node: any, ctx: SpecCheckContext) => string[];
  /** All quantum inputs must carry registers of the same size (multi-qubit gates). */
  equalQuantumInputSizes?: boolean;
}

export function portKind(port: TestableInputPort): PortKind {
  return port.kind ?? "classical";
}

// --- Helpers to define specs ---

const CAT_BOUNDARY = "Boundary Elements";
const CAT_CIRCUIT = "Circuit Primitives";
const CAT_DATA = "Data Types";
const CAT_OPERATOR = "Operators";
const CAT_CONTROL = "Control Structures";
const CAT_CUSTOM = "Custom Operators";
const CAT_ML = "Machine Learning";

const quantumPort = (
  key: string,
  label: string,
  handle: (id: string) => string,
): TestableInputPort => ({
  key,
  label,
  kind: "quantum",
  dataTypeKey: "quantum",
  targetHandle: handle,
});

const intOption = (
  key: string,
  label: string,
  values: number[],
  min?: number,
  max?: number,
  required = true,
): TestableOption => ({
  key,
  label,
  values,
  numeric: true,
  integer: true,
  min,
  max,
  required,
});

const STATE_LIST_PATTERN = /^\s*\d+(\s*,\s*\d+)*\s*$/;

/** Checks comma-separated basis states against a register of numQubits qubits. */
function statesInRange(states: unknown, numQubits: number): string | null {
  if (!Number.isInteger(numQubits) || numQubits <= 0) return null;
  const max = 2 ** numQubits - 1;
  const bad = String(states ?? "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((s) => !Number.isNaN(s) && s > max);
  return bad.length
    ? `marked states ${bad.join(", ")} exceed the ${numQubits}-qubit range 0-${max}`
    : null;
}

// --- Gates ---

const SINGLE_QUBIT_GATES = ["X", "Y", "Z", "H", "S", "SDG", "T", "TDG"];
const ROTATION_GATES = ["RX(θ)", "RY(θ)", "RZ(θ)", "P(λ)"];
const U_GATES: Record<string, number> = {
  "U1(λ)": 1,
  "U2(φ,λ)": 2,
  "U3(θ,φ,λ)": 3,
};
const TWO_QUBIT_GATES = ["CNOT", "CY", "CZ", "SWAP", "CH", "CU"];
const TWO_QUBIT_ROTATION_GATES = ["CRX(θ)", "CRY(θ)", "CRZ(θ)"];
const THREE_QUBIT_GATES = ["Toffoli", "CSWAP"];

function gatePortLabel(label: string, arity: number, i: number): string {
  if (arity === 1) return "Qubit";
  if (label === "SWAP") return `Qubit ${i + 1}`;
  if (label === "CSWAP") return i === 0 ? "Control" : `Target ${i}`;
  if (i === arity - 1) return "Target";
  return arity === 2 ? "Control" : `Control ${i + 1}`;
}

function gateSpec(
  label: string,
  arity: number,
  parameterized: boolean,
): TestableNodeSpec {
  return {
    id: `gate:${label}`,
    label: label === "Qubit Circuit" ? "Qubit Circuit" : `${label} Gate`,
    category: CAT_CIRCUIT,
    nodeType: GATE_NODE_TYPE,
    defaultData: {
      label,
      parameter: "0",
      parameterType: "degree",
      inputTypes: Array.from({ length: arity }, () => "any"),
      outputTypes: [],
      outputs: [],
      ...(label === "CU" && { controlValue: "0" }),
    },
    width: 110,
    height: 110 * Math.max(1, arity),
    equalQuantumInputSizes: arity > 1,
    options: parameterized
      ? [
          {
            key: "parameter",
            label: "Angle",
            values: ["90", "0.5", "pi/2"],
            numericExpression: true,
            required: true,
          },
        ]
      : [],
    inputs: Array.from({ length: arity }, (_, i) =>
      quantumPort(
        `q${i}`,
        gatePortLabel(label, arity, i),
        (id) => `quantumHandleGateInput${i}${id}`,
      ),
    ),
    outputHandle: (id) => `quantumHandleGateOutput0${id}`,
  };
}

/** U gates keep one comma-separated angle (radian) per parameter. */
function uGateSpec(label: string, parameterCount: number): TestableNodeSpec {
  const spec = gateSpec(label, 1, false);
  const zeros = Array.from({ length: parameterCount }, () => "0").join(",");
  return {
    ...spec,
    defaultData: { ...spec.defaultData, parameter: zeros },
    options: [
      {
        key: "parameter",
        label: "Angles",
        values: [
          zeros,
          Array.from({ length: parameterCount }, () => "pi/2").join(","),
        ],
        required: true,
        pattern: new RegExp(
          `^[\\d\\s.+\\-*/()πpi]+(,[\\d\\s.+\\-*/()πpi]+){${parameterCount - 1}}$`,
        ),
        patternDescription: `${parameterCount} comma-separated angle(s)`,
      },
    ],
  };
}

// --- Plugins (machine learning) ---

interface PluginInput {
  key: string;
  label: string;
  data_type: string;
  content_type: string[];
  required: boolean;
  /** Data type of the connected data node. */
  dataTypeKey: string;
}

function pluginSpec(
  label: string,
  outputs: { identifier: string; outputType: string; dataOutput: any },
  inputs: PluginInput[],
  options: TestableOption[] = [],
  extraData: Record<string, any> = {},
  height = 450,
): TestableNodeSpec {
  return {
    id: label.replace(/[^A-Za-z]/g, "").replace(/^./, (c) => c.toLowerCase()),
    label,
    category: CAT_ML,
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label,
      pluginName: label,
      ...extraData,
      outputs: [{ identifier: outputs.identifier, type: "classical" }],
      outputTypes: [outputs.outputType],
      dataInputs: inputs.map((i) => ({
        parameter: i.key,
        data_type: i.data_type,
        content_type: i.content_type,
        required: i.required,
      })),
      dataOutputs: [outputs.dataOutput],
    },
    width: 320,
    height,
    options: [
      {
        key: "pluginName",
        label: "Plugin",
        values: [label],
        allowed: [label],
        required: true,
      },
      ...options,
    ],
    inputs: inputs.map((i, index) => ({
      key: i.key,
      label: i.label,
      dataTypeKey: i.dataTypeKey,
      required: i.required,
      // Counts such as k, epochs or window sizes are positive integers.
      ...(["int", "integer"].includes(i.data_type) && {
        integer: true,
        min: 1,
      }),
      targetHandle: (id) => `classicalHandlePluginInput${index}${id}`,
    })),
    outputHandle: (id) => `classicalHandlepluginNodeOutput0${id}`,
    targetHandles: (node) =>
      (node.data?.dataInputs ?? inputs).map(
        (_: any, index: number) =>
          `classicalHandlePluginInput${index}${node.id}`,
      ),
  };
}

const fileInput = (
  key: string,
  label: string,
  data_type = "entity/vector",
  required = true,
): PluginInput => ({
  key,
  label,
  data_type,
  content_type: ["application/json", "text/csv"],
  required,
  dataTypeKey: "file",
});

const scalarInput = (
  key: string,
  label: string,
  data_type: string,
  dataTypeKey: "number" | "string",
  required = true,
): PluginInput => ({
  key,
  label,
  data_type,
  content_type: ["text/plain"],
  required,
  dataTypeKey,
});

const labelsOutput = (name = "Predicted Labels") => ({
  identifier: name,
  outputType: "array",
  dataOutput: {
    name,
    data_type: "entity/label",
    content_type: ["application/json"],
    required: true,
  },
});

// --- Operators ---

const ARITHMETIC_OPERATORS = ["+", "-", "/", "*", "**"];
const BITWISE_OPERATORS = ["|", "&", "~", "^"];
const COMPARISON_OPERATORS = ["<", ">", "<=", ">=", "==", "!="];
const MIN_MAX_OPERATORS = ["min", "max"];

/** Operators that take a single operand. */
export const UNARY_OPERATORS = ["~", "INVERT", "min", "max", "Min", "Max"];

function operatorSpec(
  domain: "Classical" | "Quantum",
  kind: string,
  operators: string[],
  outputType: string,
): TestableNodeSpec {
  const quantum = domain === "Quantum";
  const nodeType = quantum
    ? QUANTUM_OPERATOR_NODE_TYPE
    : CLASSICAL_OPERATOR_NODE_TYPE;
  const unaryOnly = operators.every((o) => UNARY_OPERATORS.includes(o));
  const prefix = quantum ? "quantum" : "classical";
  const handle = (i: number) => (id: string) =>
    `${prefix}HandleOperationInput${i}${id}`;
  const port = (i: number): TestableInputPort =>
    quantum
      ? quantumPort(`input${i}`, `Input ${i + 1}`, handle(i))
      : {
          key: `input${i}`,
          label: `Input ${i + 1}`,
          dataTypeKey:
            kind === "Bitwise Operator"
              ? "bit"
              : kind === "Min & Max Operator"
                ? "array"
                : "any",
          targetHandle: handle(i),
        };
  const label = `${domain} ${kind}`;
  return {
    id: `${prefix}${kind.replace(/[^A-Za-z]/g, "")}`,
    label,
    category: CAT_OPERATOR,
    nodeType,
    defaultData: {
      label,
      operator: operators[0],
      completionGuaranteed: false,
      outputs: [
        {
          identifier: quantum ? "" : "a",
          type: quantum ? "quantum" : "classical",
        },
      ],
      outputTypes: [outputType],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "operator",
        label: "Operator",
        values: operators,
        allowed: operators,
        required: true,
      },
    ],
    inputs: unaryOnly ? [port(0)] : [port(0), port(1)],
    outputHandle: (id) => `${prefix}Handle${nodeType}Output0${id}`,
    targetHandles: (node) =>
      UNARY_OPERATORS.includes(node.data?.operator)
        ? [handle(0)(node.id)]
        : [handle(0)(node.id), handle(1)(node.id)],
  };
}

// --- State preparation ---

const ENCODE_VALUE_TYPES = [
  "Basis Encoding",
  "Amplitude Encoding",
  "Angle Encoding",
  "Custom Encoding",
  "Matrix Encoding",
  "basis",
  "amplitude",
  "angle",
  "custom",
  "matrix",
];

const PREPARE_STATE_NAMES = [
  "Bell State φ+",
  "Bell State φ-",
  "Bell State ψ+",
  "Bell State ψ-",
  "Custom State",
  "GHZ",
  "Uniform Superposition",
  "W-State",
];

function encodingSpec(
  label: string,
  dataTypeKey: string,
  options: TestableOption[] = [],
  extra: Partial<TestableNodeSpec> = {},
): TestableNodeSpec {
  return {
    id: label.replace(/[^A-Za-z]/g, "").replace(/^./, (c) => c.toLowerCase()),
    label,
    category: CAT_BOUNDARY,
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label,
      encodingType: label,
      outputs: [{ identifier: "", size: "", type: "quantum" }],
      outputTypes: ["quantum register"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "encodingType",
        label: "Encoding Type",
        values: [label],
        allowed: [label],
        required: true,
      },
      ...options,
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey,
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
    outputHandle: (id) => `quantumHandlestatePreparationNodeOutput0${id}`,
    check: checkEncodedValue,
    ...extra,
  };
}

const boundOption = (values: number[]): TestableOption => ({
  key: "bound",
  label: "Error Bound",
  values,
  numeric: true,
  min: 0,
  max: 1,
});

// --- Data types ---

function dataTypeSpec(
  label: string,
  dataType: string,
  values: string[],
): TestableNodeSpec {
  return {
    id: `data:${dataType}`,
    label,
    category: CAT_DATA,
    nodeType: DATA_TYPE_NODE_TYPE,
    aliases: [label, dataType, label.toLowerCase()],
    defaultData: {
      label,
      dataType,
      value: values[0],
      outputIdentifier: "x",
      outputs: [{ identifier: "x", size: "", type: "classical" }],
      outputTypes: [dataType],
      inputTypes: [],
    },
    width: 450,
    height: 270,
    options: [{ key: "value", label: "Value", values, required: true }],
    inputs: [],
    outputHandle: (id) => `classicalHandleDataTypeOutput0${id}`,
    targetHandles: () => [],
  };
}

// --- Registry ---

export const TESTABLE_NODE_REGISTRY: TestableNodeSpec[] = [
  // ===== Boundary Elements: Classical To Quantum =====
  encodingSpec("Encode Value", "any", [], {
    options: [
      {
        key: "encodingType",
        label: "Encoding Type",
        values: ["Basis Encoding", "Angle Encoding", "Amplitude Encoding"],
        allowed: ENCODE_VALUE_TYPES,
        required: true,
      },
      boundOption([0.1, -0.5]),
    ],
  }),
  encodingSpec("Basis Encoding", "any", [
    intOption("decimalPrecision", "Decimal Precision", [2, -1], 0, 15, false),
  ]),
  encodingSpec("Angle Encoding", "array"),
  encodingSpec("Amplitude Encoding", "array:normalized", [
    boundOption([0.5, -0.5]),
  ]),
  encodingSpec("Custom Encoding", "any", [boundOption([0.8, 1.5])]),
  encodingSpec("Matrix Encoding", "array:unitary", [boundOption([0.2, -1.0])]),
  encodingSpec("Schmidt Decomposition", "array", [boundOption([0.1])]),
  {
    id: "prepareState",
    label: "Prepare State",
    category: CAT_BOUNDARY,
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Prepare State",
      quantumStateName: "Bell State φ+",
      size: "2",
      outputs: [{ identifier: "", size: "2", type: "quantum" }],
      outputTypes: ["quantum register"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "quantumStateName",
        label: "Quantum State",
        values: ["Bell State φ+", "GHZ", "W-State", "Uniform Superposition"],
        allowed: PREPARE_STATE_NAMES,
        required: true,
      },
      // The size must always be specified.
      intOption("size", "Size", [2], 1, 64),
    ],
    inputs: [],
    outputHandle: (id) => `quantumHandlestatePreparationNodeOutput0${id}`,
    targetHandles: () => [],
    check: (node) => {
      const name = String(node.data?.quantumStateName ?? "");
      const rawSize = node.data?.size;
      if (String(rawSize ?? "").trim() === "") return [];
      const size = Number(rawSize);
      if ((name === "GHZ" || name === "W-State") && size < 3) {
        return [`${name} requires a size of at least 3, but got ${rawSize}.`];
      }
      if (name.startsWith("Bell State") && size !== 2) {
        return [`${name} is a 2-qubit state, but the size is ${rawSize}.`];
      }
      return [];
    },
  },

  // ===== Boundary Elements: Quantum To Classical =====
  {
    id: "measurement",
    label: "Measurement",
    category: CAT_BOUNDARY,
    nodeType: "measurementNode",
    defaultData: {
      label: "Measurement",
      indices: "0",
      outputIdentifier: "",
      inputTypes: ["quantum register"],
      outputTypes: ["array", "quantum register"],
      outputs: [],
    },
    width: 320,
    height: 440,
    options: [
      {
        key: "indices",
        label: "Indices",
        values: ["0", "0,1"],
        pattern: /^\d+(,\d+)*$/,
        patternDescription: "comma-separated qubit indices",
      },
    ],
    inputs: [
      quantumPort(
        "register",
        "Quantum Register",
        (id) => `quantumHandleMeasurementInput0${id}`,
      ),
    ],
    outputHandle: (id) => `classicalHandlemeasurementNodeOutput0${id}`,
    check: (node, ctx) => {
      const size = ctx.registerSizeAt(
        `quantumHandleMeasurementInput0${node.id}`,
      );
      const indices = String(node.data?.indices ?? "").trim();
      if (size === undefined || !/^\d+(,\d+)*$/.test(indices)) return [];
      const outside = indices
        .split(",")
        .map(Number)
        .filter((i) => i >= size);
      return outside.length
        ? [
            `indices ${outside.join(", ")} are outside the connected ${size}-qubit register (valid: 0-${size - 1}).`,
          ]
        : [];
    },
  },

  // ===== Circuit Primitives =====
  gateSpec("Qubit Circuit", 0, false),
  ...SINGLE_QUBIT_GATES.map((g) => gateSpec(g, 1, false)),
  ...ROTATION_GATES.map((g) => gateSpec(g, 1, true)),
  ...Object.entries(U_GATES).map(([g, count]) => uGateSpec(g, count)),
  ...TWO_QUBIT_GATES.map((g) => gateSpec(g, 2, false)),
  ...TWO_QUBIT_ROTATION_GATES.map((g) => gateSpec(g, 2, true)),
  ...THREE_QUBIT_GATES.map((g) => gateSpec(g, 3, false)),
  {
    id: "mcmtGate",
    label: "MCMT Gate",
    category: CAT_CIRCUIT,
    nodeType: "mcmt-gate",
    defaultData: {
      label: "MCMT Gate",
      baseGate: "x",
      numControls: 1,
      numTargets: 1,
      parameter: 0,
      outputs: [],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "baseGate",
        label: "Base Gate",
        values: ["x", "h", "rz"],
        allowed: ["x", "y", "z", "h", "rx", "ry", "rz", "s", "sdg", "t", "tdg"],
        required: true,
      },
      intOption("numControls", "Controls", [1], 1, 16),
      intOption("numTargets", "Targets", [1], 1, 16),
    ],
    inputs: [
      quantumPort("control", "Control", (id) => `quantumHandleInput0${id}`),
      quantumPort("target", "Target", (id) => `quantumHandleInput1${id}`),
    ],
    outputHandle: (id) => `quantumHandleOutput0${id}`,
    targetHandles: (node) => {
      const n =
        (Number(node.data?.numControls) || 1) +
        (Number(node.data?.numTargets) || 1);
      return Array.from(
        { length: n },
        (_, i) => `quantumHandleInput${i}${node.id}`,
      );
    },
  },
  ...(["QFT", "Inverse QFT"] as const).map(
    (label): TestableNodeSpec => ({
      id: label === "QFT" ? "qft" : "inverseQft",
      label,
      category: CAT_CIRCUIT,
      nodeType: label === "QFT" ? "qftNode" : "inverseQftNode",
      defaultData: { label, numberOutputs: 1, outputs: [] },
      width: 160,
      height: 160,
      options: [intOption("numberOutputs", "Qubits", [1, 2], 1, 64)],
      inputs: [
        quantumPort("q0", "Qubit 1", (id) => `quantumHandleQFTInput0${id}`),
      ],
      outputHandle: (id) => `quantumHandleQFTOutput0${id}`,
      targetHandles: (node) =>
        Array.from(
          { length: Number(node.data?.numberOutputs) || 1 },
          (_, i) => `quantumHandleQFTInput${i}${node.id}`,
        ),
    }),
  ),
  {
    id: "splitter",
    label: "Splitter",
    category: CAT_CIRCUIT,
    nodeType: "splitterNode",
    defaultData: { label: "Splitter", numberOutputs: 2, outputs: [] },
    width: 160,
    height: 220,
    options: [intOption("numberOutputs", "Outputs", [2], 1, 64)],
    inputs: [
      {
        ...quantumPort(
          "in",
          "Register",
          (id) => `quantumHandleSplitterInput0${id}`,
        ),
        registerSize: 2,
      },
    ],
    outputHandle: (id) => `quantumHandleSplitterOutput0${id}`,
    check: (node, ctx) => {
      // The splitter splits a register into single qubits.
      const size = ctx.registerSizeAt(`quantumHandleSplitterInput0${node.id}`);
      const outputs = Number(node.data?.numberOutputs);
      return size !== undefined && outputs > size
        ? [
            `splits into ${outputs} single qubits, but the connected register has only ${size}.`,
          ]
        : [];
    },
  },
  {
    id: "merger",
    label: "Merger",
    category: CAT_CIRCUIT,
    nodeType: "mergerNode",
    defaultData: {
      label: "Merger",
      numberInputs: 2,
      numberOutputs: 1,
      outputs: [],
    },
    width: 160,
    height: 220,
    options: [intOption("numberInputs", "Inputs", [2], 2, 64)],
    inputs: [
      quantumPort(
        "in0",
        "Register 1",
        (id) => `quantumHandleMergerInput0${id}`,
      ),
      quantumPort(
        "in1",
        "Register 2",
        (id) => `quantumHandleMergerInput1${id}`,
      ),
    ],
    outputHandle: (id) => `quantumHandleMergerOutput0${id}`,
    targetHandles: (node) =>
      Array.from(
        { length: Number(node.data?.numberInputs) || 2 },
        (_, i) => `quantumHandleMergerInput${i}${node.id}`,
      ),
  },

  // ===== Data Types =====
  dataTypeSpec("bit", "bit", ["1", "0"]),
  dataTypeSpec("boolean", "boolean", ["true", "false"]),
  dataTypeSpec("Number", "number", ["3.14", "-1", "0"]),
  dataTypeSpec("Array", "array", ["0.1,0.2,0.3", "[0,1],[1,0]"]),
  dataTypeSpec("File", "file", [
    "<file_placeholder.csv>",
    "https://example.org/data.json",
  ]),
  dataTypeSpec("String", "string", ["<string_placeholder>", "hello"]),
  {
    id: "qubitArray",
    label: "Qubit Array",
    category: CAT_DATA,
    nodeType: QUBIT_NODE_TYPE,
    aliases: ["Qubit"],
    defaultData: {
      label: "Qubit",
      size: 3,
      outputs: [{ identifier: "", size: "3" }],
      inputTypes: [],
      outputTypes: ["quantum register"],
    },
    width: 350,
    height: 170,
    options: [intOption("size", "Size", [3, 1], 1, 64)],
    inputs: [],
    outputHandle: (id) => `quantumHandlequbitNodeOutput0${id}`,
    targetHandles: () => [],
  },

  // ===== Operators: Oracles & Algorithms =====
  {
    id: "deutschJozsa",
    label: "Deutsch-Jozsa",
    category: CAT_OPERATOR,
    nodeType: "deutsch-jozsa",
    aliases: ["Deutsch-Jozsa Algorithm"],
    defaultData: {
      label: "Deutsch-Jozsa",
      numQubits: 3,
      oracleType: "balanced",
      balancedMask: 5,
      constantValue: 0,
      outputs: [],
    },
    width: 320,
    height: 420,
    options: [
      intOption("numQubits", "Qubits", [3, 2], 1, 32),
      {
        key: "oracleType",
        label: "Oracle Type",
        values: ["balanced", "constant"],
        allowed: ["balanced", "constant"],
        required: true,
      },
      intOption("balancedMask", "Mask", [5, 1], 0, undefined, false),
      {
        key: "constantValue",
        label: "Constant Value",
        values: [0, 1],
        allowed: [0, 1, "0", "1"],
      },
    ],
    inputs: [],
    outputHandle: (id) => `quantumHandledeutsch-jozsaOutput0${id}`,
    targetHandles: () => [],
  },
  {
    id: "groverOracle",
    label: "Grover Oracle",
    category: CAT_OPERATOR,
    nodeType: "universal-oracle",
    aliases: ["Universal Oracle"],
    defaultData: {
      label: "Grover Oracle",
      mode: "phase",
      targetStates: "1",
      outputs: [],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "mode",
        label: "Mode",
        values: ["phase", "boolean"],
        allowed: ["phase", "boolean"],
      },
      {
        key: "targetStates",
        label: "Marked States",
        values: ["1", "1,3"],
        required: true,
        pattern: STATE_LIST_PATTERN,
        patternDescription: "comma-separated integers",
      },
    ],
    inputs: [
      quantumPort(
        "register",
        "Quantum Register",
        (id) => `quantumHandleInput0${id}`,
      ),
    ],
    outputHandle: (id) => `quantumHandleuniversal-oracleOutput0${id}`,
  },
  {
    id: "groverDiffuser",
    label: "Grover Diffuser",
    category: CAT_OPERATOR,
    nodeType: "grover-diffuser",
    defaultData: { label: "Grover Diffuser", outputs: [] },
    width: 320,
    height: 300,
    options: [],
    inputs: [
      quantumPort(
        "register",
        "Quantum Register",
        (id) => `quantumHandleInput0${id}`,
      ),
    ],
    outputHandle: (id) => `quantumHandlegrover-diffuserOutput0${id}`,
  },
  {
    id: "groverSearch",
    label: "Grover's Search Algorithm",
    category: CAT_OPERATOR,
    nodeType: "grover",
    aliases: ["Grover Algorithm"],
    defaultData: {
      label: "Grover's Search Algorithm",
      numQubits: 3,
      targetStates: "5",
      numIterations: 1,
      outputs: [],
    },
    width: 320,
    height: 450,
    options: [
      intOption("numQubits", "Qubits", [3, 2], 1, 32),
      {
        key: "targetStates",
        label: "Marked States",
        values: ["5", "1,2"],
        required: true,
        pattern: STATE_LIST_PATTERN,
        patternDescription: "comma-separated integers",
      },
      intOption("numIterations", "Iterations", [1, 2], 1, 1000, false),
    ],
    inputs: [],
    outputHandle: (id) => `quantumHandlegroverOutput0${id}`,
    targetHandles: () => [],
    check: (node) => {
      const problem = statesInRange(
        node.data?.targetStates,
        Number(node.data?.numQubits),
      );
      return problem ? [`Grover search: ${problem}.`] : [];
    },
  },
  {
    id: "qaoa",
    label: "QAOA Ansatz",
    category: CAT_OPERATOR,
    nodeType: QAOA_NODE_TYPE,
    aliases: ["QAOA"],
    defaultData: { label: "QAOA Ansatz", outputIdentifier: "", outputs: [] },
    width: 320,
    height: 550,
    options: [
      {
        key: "problem",
        label: "Problem",
        values: ["MaxCut", "Max2SAT", "GraphColoring"],
        allowed: ["MaxCut", "Max2SAT", "GraphColoring"],
        required: true,
      },
      {
        key: "optimizer",
        label: "Optimizer",
        values: ["COBYLA", "SPSA", "NELDER_MEAD"],
        allowed: ["COBYLA", "SPSA", "NELDER_MEAD"],
      },
      intOption("p", "Layers (p)", [1, 3], 1, 100, false),
    ],
    inputs: [
      {
        key: "edges",
        label: "Edges",
        labelFor: (opts) => (opts.problem === "Max2SAT" ? "Clauses" : "Edges"),
        dataTypeKey: "array:edgeArray",
        targetHandle: (id) => `classicalHandleQAOAInput0${id}`,
      },
      {
        key: "gamma",
        label: "Gamma (γ)",
        dataTypeKey: "array:length=p",
        targetHandle: (id) => `classicalHandleQAOAInput1${id}`,
      },
      {
        key: "beta",
        label: "Beta (β)",
        dataTypeKey: "array:length=p",
        targetHandle: (id) => `classicalHandleQAOAInput2${id}`,
      },
    ],
    outputHandle: (id) => `quantumHandleqaoaOutput0${id}`,
    check: (node, ctx) => {
      const errors: string[] = [];
      const sourceAt = (i: number) => {
        const edge = ctx.incoming.find(
          (e) => e.targetHandle === `classicalHandleQAOAInput${i}${node.id}`,
        );
        const source = edge && ctx.nodesById.get(edge.source);
        return source?.type === DATA_TYPE_NODE_TYPE ? source : undefined;
      };

      // Graph problems take a list of distinct edges [[i,j], ...].
      const edgesSource = sourceAt(0);
      if (GRAPH_PROBLEMS.includes(node.data?.problem) && edgesSource) {
        const problem = checkEdgeList(edgesSource.data?.value);
        if (problem) errors.push(`Edges (${node.data.problem}): ${problem}.`);
      }

      // γ and β need exactly p values each.
      const p = Number(node.data?.p);
      if (!Number.isInteger(p) || p < 1) return errors;
      [1, 2].forEach((i, n) => {
        const source = sourceAt(i);
        if (!source) return;
        const count = String(source.data?.value ?? "")
          .split(",")
          .filter((s) => s.trim() !== "").length;
        if (count !== p) {
          errors.push(
            `${n === 0 ? "Gamma (γ)" : "Beta (β)"} has ${count} value(s) but p = ${p} layers require ${p}.`,
          );
        }
      });
      return errors;
    },
  },

  // ===== Operators: Arithmetic & Logic =====
  operatorSpec(
    "Quantum",
    "Arithmetic Operator",
    ARITHMETIC_OPERATORS,
    "quantum register",
  ),
  operatorSpec(
    "Quantum",
    "Bitwise Operator",
    BITWISE_OPERATORS,
    "quantum register",
  ),
  operatorSpec(
    "Quantum",
    "Comparison Operator",
    COMPARISON_OPERATORS,
    "quantum register",
  ),
  operatorSpec(
    "Quantum",
    "Min & Max Operator",
    MIN_MAX_OPERATORS,
    "quantum register",
  ),
  operatorSpec("Classical", "Arithmetic Operator", ARITHMETIC_OPERATORS, "any"),
  operatorSpec("Classical", "Bitwise Operator", BITWISE_OPERATORS, "bit"),
  operatorSpec(
    "Classical",
    "Comparison Operator",
    COMPARISON_OPERATORS,
    "boolean",
  ),
  operatorSpec("Classical", "Min & Max Operator", MIN_MAX_OPERATORS, "number"),

  // ===== Control Structures =====
  {
    id: "ifThenElse",
    label: "If-Then-Else",
    category: CAT_CONTROL,
    nodeType: "ifElseNode",
    defaultData: {
      label: "If-Then-Else",
      condition: "b==0",
      inputTypes: ["array"],
      outputTypes: [],
      outputs: [],
    },
    width: 1100,
    height: 900,
    options: [
      {
        key: "condition",
        label: "Condition",
        values: ["b==0", "b==1"],
        required: true,
      },
    ],
    inputs: [
      quantumPort(
        "register",
        "Quantum Register",
        (id) => `quantumHandleInputInitialization0${id}`,
      ),
      {
        key: "b",
        label: "Condition Variable",
        dataTypeKey: "bit",
        targetHandle: (id) => `classicalHandleInputInitialization0${id}`,
      },
    ],
    outputHandle: () => `quantumHandleOutputFinal-0`,
    targetHandles: () => null,
  },
  {
    id: "repeat",
    label: "Repeat",
    category: CAT_CONTROL,
    nodeType: "controlStructureNode",
    defaultData: {
      label: "Repeat",
      condition: "a < 20",
      numberClassicalInputs: 1,
      inputTypes: ["Number"],
      outputTypes: [],
      outputs: [],
    },
    width: 1100,
    height: 900,
    options: [
      {
        key: "condition",
        label: "Condition",
        values: ["a < 20", "a <= 1"],
        required: true,
      },
    ],
    inputs: [
      {
        key: "a",
        label: "Loop Variable",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandleInputInitialization${id}-0`,
      },
    ],
    outputHandle: (id) => `classicalHandleOutputInitialization${id}-0`,
    targetHandles: () => null,
  },

  // ===== Custom Operators =====
  {
    id: "customQuantumOperator",
    label: "Custom Quantum Operator",
    category: CAT_CUSTOM,
    nodeType: "algorithmNode",
    defaultData: {
      label: "Custom Quantum Operator",
      numberQuantumInputs: 1,
      numberClassicalInputs: 1,
      numberQuantumOutputs: 1,
      numberClassicalOutputs: 0,
      outputs: [{ identifier: "", size: "", type: "quantum" }],
    },
    width: 320,
    height: 450,
    options: [
      intOption("numberQuantumInputs", "Quantum Inputs", [1], 0, 32, false),
      intOption("numberClassicalInputs", "Classical Inputs", [1], 0, 32, false),
    ],
    inputs: [
      {
        ...quantumPort(
          "register",
          "Quantum Input 1",
          (id) => `quantumHandleOperationInput0${id}`,
        ),
        required: false,
      },
      {
        key: "param",
        label: "Classical Input 1",
        dataTypeKey: "any",
        required: false,
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
    ],
    outputHandle: (id) => `quantumHandlealgorithmNodeOutput0${id}`,
    targetHandles: (node) => [
      ...Array.from(
        { length: Number(node.data?.numberQuantumInputs) || 0 },
        (_, i) => `quantumHandleOperationInput${i}${node.id}`,
      ),
      ...Array.from(
        { length: Number(node.data?.numberClassicalInputs) || 0 },
        (_, i) => `classicalHandleOperationInput${i}${node.id}`,
      ),
    ],
  },
  {
    id: "customClassicalOperator",
    label: "Custom Classical Operator",
    category: CAT_CUSTOM,
    nodeType: "classicalAlgorithmNode",
    defaultData: {
      label: "Custom Classical Operator",
      numberClassicalInputs: 1,
      numberClassicalOutputs: 1,
      outputs: [{ identifier: "r", size: "", type: "classical" }],
    },
    width: 320,
    height: 400,
    options: [
      intOption("numberClassicalInputs", "Classical Inputs", [1], 0, 32, false),
    ],
    inputs: [
      {
        key: "in0",
        label: "Classical Input 1",
        dataTypeKey: "any",
        required: false,
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
    ],
    outputHandle: (id) => `classicalHandleclassicalAlgorithmNodeOutput0${id}`,
    targetHandles: (node) =>
      Array.from(
        { length: Number(node.data?.numberClassicalInputs) || 0 },
        (_, i) => `classicalHandleOperationInput${i}${node.id}`,
      ),
  },

  // ===== Machine Learning: Quantum =====
  pluginSpec(
    "Quantum Clustering",
    {
      identifier: "clusters",
      outputType: "array",
      dataOutput: {
        name: "clusters",
        data_type: "array",
        content_type: ["application/json"],
        required: true,
      },
    },
    [
      {
        key: "data",
        label: "Input Data",
        data_type: "array",
        content_type: ["text/csv"],
        required: true,
        dataTypeKey: "file",
      },
    ],
    [
      {
        key: "variant",
        label: "Quantum Variant",
        values: [
          "negative_rotation",
          "destructive_interference",
          "positive_correlation",
          "state_prepartion",
        ],
      },
    ],
    { clusteringAlgorithm: "k-means", variant: "negative_rotation" },
    520,
  ),
  pluginSpec(
    "Quantum Neural Network",
    labelsOutput(),
    [
      fileInput("trainingDataUrl", "Training Data"),
      fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
      fileInput("testDataUrl", "Test Data"),
      fileInput("testLabelsUrl", "Test Labels", "entity/label"),
      scalarInput("epochs", "Epochs", "int", "number", false),
    ],
    [],
    {},
    530,
  ),
  pluginSpec(
    "Quantum K-Nearest Neighbours",
    labelsOutput(),
    [
      fileInput("trainingDataUrl", "Training Data"),
      fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
      fileInput("testDataUrl", "Test Data"),
      scalarInput("k", "K", "int", "number"),
    ],
    [],
    {},
    490,
  ),
  pluginSpec(
    "Quantum Parzen Windows",
    labelsOutput(),
    [
      fileInput("trainingDataUrl", "Training Data"),
      fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
      scalarInput("variant", "Variant", "string", "string"),
      scalarInput("windowSize", "Window Size", "int", "number"),
      fileInput("testDataUrl", "Test Data"),
      fileInput("testLabelsUrl", "Test Labels", "entity/label", false),
    ],
    [],
    {},
    570,
  ),
  pluginSpec(
    "Quantum Kernel Estimator",
    {
      identifier: "Kernel Matrix",
      outputType: "array",
      dataOutput: {
        name: "Kernel Matrix",
        data_type: "entity/matrix",
        content_type: ["application/json"],
        required: true,
      },
    },
    [
      fileInput("entityPointsUrl", "Entity Points"),
      scalarInput("featureMap", "Feature Map", "string", "string", false),
    ],
    [
      {
        key: "featureMap",
        label: "Feature Map",
        values: ["ZFeatureMap", "ZZFeatureMap", "PauliFeatureMap"],
        allowed: ["ZFeatureMap", "ZZFeatureMap", "PauliFeatureMap"],
      },
    ],
    {},
    410,
  ),
  pluginSpec("Variational Quantum Classifier", labelsOutput(), [
    fileInput("trainingDataUrl", "Training Data"),
    fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
    fileInput("testDataUrl", "Test Data"),
  ]),
  pluginSpec(
    "Hybrid Autoencoder",
    {
      identifier: "Reduced Data",
      outputType: "array",
      dataOutput: {
        name: "Reduced Data",
        data_type: "entity/vector",
        content_type: ["application/json"],
        required: true,
      },
    },
    [
      fileInput("trainingPointsUrl", "Training Points"),
      scalarInput("embeddingSize", "Embedding Size", "integer", "number"),
      scalarInput("qnnName", "QNN Name", "string", "string"),
      scalarInput("trainingSteps", "Training Steps", "int", "number"),
      scalarInput("numberOfQubits", "Number of Qubits", "int", "number"),
      scalarInput("testPointsUrl", "Test Points", "string", "string", false),
    ],
    [],
    {},
    570,
  ),

  // ===== Machine Learning: Classical =====
  pluginSpec(
    "Classical Clustering",
    {
      identifier: "clusters",
      outputType: "array",
      dataOutput: {
        name: "clusters",
        data_type: "array",
        content_type: ["application/json"],
        required: true,
      },
    },
    [
      {
        key: "data",
        label: "Input Data",
        data_type: "array",
        content_type: ["text/csv"],
        required: true,
        dataTypeKey: "file",
      },
    ],
    [
      {
        key: "clusteringAlgorithm",
        label: "Algorithm",
        values: ["k-medoids", "optics", "k-means"],
        allowed: ["k-medoids", "optics", "k-means"],
      },
      {
        key: "initializationMethod",
        label: "Initialization Method",
        values: ["random", "k-medoids++"],
        allowed: ["build", "heuristic", "random", "k-medoids++"],
      },
      {
        key: "metric",
        label: "Metric",
        values: ["euclidean", "minkowski", "dice"],
        allowed: [
          "braycurtis",
          "canberra",
          "chebyshev",
          "cityblock",
          "correlation",
          "cosine",
          "dice",
          "euclidean",
          "hamming",
          "haversine",
          "jaccard",
          "kulsinski",
          "l1",
          "l2",
          "manhattan",
          "matching",
          "minkowski",
          "nan_euclidean",
          "rogerstanimoto",
          "russellrao",
          "sokalmichener",
          "sokalsneath",
          "sqeuclidean",
          "yule",
        ],
      },
    ],
    {
      clusteringAlgorithm: "k-medoids",
      initializationMethod: "random",
      algorithm: "pam",
    },
    520,
  ),
  pluginSpec("Support Vector Machine", labelsOutput(), [
    fileInput("trainingDataUrl", "Training Data"),
    fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
    fileInput("testDataUrl", "Test Data"),
  ]),
  pluginSpec(
    "Neural Network",
    {
      identifier: "Model",
      outputType: "array",
      dataOutput: {
        name: "Model",
        data_type: "model",
        content_type: ["application/json"],
        required: true,
      },
    },
    [
      fileInput("trainingDataUrl", "Training Data"),
      fileInput("trainingLabelsUrl", "Training Labels", "entity/label"),
    ],
    [],
    {},
    410,
  ),
];

/** The spec describing a concrete model node, if any. */
export function findNodeSpec(node: any): TestableNodeSpec | undefined {
  const type = node?.type === "qaoaNode" ? QAOA_NODE_TYPE : node?.type;
  const candidates = TESTABLE_NODE_REGISTRY.filter((s) => s.nodeType === type);
  if (candidates.length === 0) return undefined;
  if (type === DATA_TYPE_NODE_TYPE) {
    const dataType = normalizeDataType(node.data?.dataType);
    return candidates.find((s) => s.defaultData.dataType === dataType);
  }
  const label = node.data?.label;
  const pluginName = node.data?.pluginName;
  const byLabel = candidates.find(
    (s) =>
      s.defaultData.label === label ||
      s.label === label ||
      (s.aliases ?? []).includes(label),
  );
  const byPluginName =
    pluginName &&
    candidates.find((s) => s.defaultData.pluginName === pluginName);
  // Node types with a single construct are matched even when relabeled.
  return (
    byLabel ??
    byPluginName ??
    (candidates.length === 1 ? candidates[0] : undefined)
  );
}
