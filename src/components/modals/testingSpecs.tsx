export const QAOA_NODE_TYPE = "qaoaNode";
export const ARRAY_DATATYPE_NODE_TYPE = "editableNode";
export const TEST_EDGE_TYPE: string | undefined = undefined;

export type ValuePoolContext = Record<string, string | number | boolean>;
export type ValuePool = string[] | ((ctx: ValuePoolContext) => string[]);

export const dataTypeValuePools: Record<string, ValuePool> = {
  array: ["0,1", "0,1,1,0", "1,2,3"],
  number: ["0", "1", "-1", "3.14"],
  boolean: ["true", "false"],
  string: ["sample", "test_value"],
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
      { key: "p", label: "Layers (p)", values: [1, 2, 3] },
    ],
    inputs: [
      {
        key: "edges",
        label: "Edges",
        labelFor: (opts) => (opts.problem === "Max2SAT" ? "Clauses" : "Edges"),
        dataTypeKey: "array",
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
  },
];