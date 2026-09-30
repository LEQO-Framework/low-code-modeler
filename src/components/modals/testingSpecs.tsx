export const QAOA_NODE_TYPE = "qaoaNode";
export const EDITABLE_NODE_TYPE = "editableNode";
export const STATE_PREPARATION_NODE_TYPE = "statePreparationNode";
export const TEST_EDGE_TYPE: string | undefined = undefined;

export type ValuePoolContext = Record<string, string | number | boolean>;
export type ValuePool = string[] | ((ctx: ValuePoolContext) => string[]);

export const dataTypeValuePools: Record<string, ValuePool> = {
  array: ["0,1", "0.1", "0.1, 0.2, 0.1"],
  "array:edgeArray": ["0,1", "[0,1],[1,0]", "[1,2],[1,1],[0,2]"], // for QAOA Operator edge input, TODO FIX
  number: ["0", "1", "-1", "3.14"],
  bit: ["0", "1"],
  boolean: ["true", "false"],
  string: ["<string_placeholder>"],
  file: ["<file_placeholder.txt>"],

  // "any" pool creates distinct test cases covering all 6 data types
  any: [
    "type:array|0,1,2",
    "type:number|3.14",
    "type:bit|1",
    "type:boolean|true",
    "type:file|<file_placeholder.txt>",
    "type:string|<string_placeholder>",
  ],
  // Derived pool ensuring array length matches 'p' parameter
  "array:length=p": (ctx) => {
    const p = Math.max(1, Number(ctx.p) || 1);
    return [Array.from({ length: p }, (_, i) => ((i + 1) * 0.1).toFixed(2)).join(",")];
  },
};

export function resolvePool(key: string, ctx: ValuePoolContext): string[] {
  const pool = dataTypeValuePools[key];
  if (!pool) return [""];
  return typeof pool === "function" ? pool(ctx) : pool;
}

export interface TestableOption {
  key: string;
  label: string;
  values: (string | number)[];
}

export interface TestableInputPort {
  key: string;
  label: string;
  labelFor?: (optionValues: Record<string, string | number>) => string;
  dataTypeKey: string;
  targetHandle: (nodeId: string) => string;
}

export interface TestableNodeSpec {
  id: string;
  label: string;
  nodeType: string;
  defaultData: Record<string, any>;
  width: number;
  height: number;
  options: TestableOption[];
  inputs: TestableInputPort[];
}

export const TESTABLE_NODE_REGISTRY: TestableNodeSpec[] = [
  {
    id: "qaoa",
    label: "QAOA",
    nodeType: QAOA_NODE_TYPE,
    defaultData: { outputs: [] },
    width: 320,
    height: 550,
    options: [
      { key: "problem", label: "Problem", values: ["MaxCut", "Max2SAT", "GraphColoring"] },
      { key: "optimizer", label: "Optimizer", values: ["COBYLA", "SPSA", "NELDER_MEAD"] },
      { key: "p", label: "Layers (p)", values: [1, 3] },
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
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleQAOAInput1${id}`,
      },
      {
        key: "beta",
        label: "Beta (β)",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleQAOAInput2${id}`,
      },
    ],
  },
// --- Encoding Nodes ---
  {
    id: "basisEncoding",
    label: "Basis Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Basis Encoding",
      encodingType: "Basis Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "decimalPrecision",
        label: "Decimal Precision",
        values: [2, -1], // Valid precision vs Invalid negative precision
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "angleEncoding",
    label: "Angle Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Angle Encoding",
      encodingType: "Angle Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "amplitudeEncoding",
    label: "Amplitude Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Amplitude Encoding",
      encodingType: "Amplitude Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.5, -0.5], 
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "customEncoding",
    label: "Custom Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Custom Encoding",
      encodingType: "Custom Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.8, 1.5], // Valid bound vs Invalid bound (> 1)
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "matrixEncoding",
    label: "Matrix Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Matrix Encoding",
      encodingType: "Matrix Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.2, -1.0], // Valid bound vs Invalid negative bound
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
];