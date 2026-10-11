import { v4 as uuidv4 } from "uuid";
import {
  DATA_TYPE_NODE_TYPE,
  TESTABLE_NODE_REGISTRY,
  TestableNodeSpec,
  TestableOption,
  encodingKind,
  normalizeDataType,
  portKind,
} from "../../lib/nodeSpecs";

// --- Error Taxonomy ---

export type ErrorCategory = "data" | "parameter" | "flow";

export const ERROR_CATEGORIES: {
  id: ErrorCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "data",
    label: "Data & Type Errors",
    description:
      "Invalid, missing, unexpected, or incorrectly typed input data (wrong data types, missing required values, invalid formats, incompatible values).",
  },
  {
    id: "parameter",
    label: "Parameter & Configuration Errors",
    description:
      "Incorrect parameter values or configuration settings (invalid parameters, inconsistent configurations, incorrect default values, out-of-range values).",
  },
  {
    id: "flow",
    label: "Flow Errors",
    description:
      "Errors in the execution flow or sequencing of the model (missing execution paths, invalid node sequences, wrong connections, unintended cycles).",
  },
];

export function categoryLabel(category?: ErrorCategory): string {
  return ERROR_CATEGORIES.find((c) => c.id === category)?.label ?? "";
}

/**
 * How the platform should respond to a generated model:
 * - accept: the model is valid and must be accepted without errors
 * - reject: the model must be rejected (at least one error reported)
 * - warn: the model may be accepted, but the platform must report a warning
 */
export type Expectation = "accept" | "reject" | "warn";

export interface TestModel {
  metadata: Record<string, any>;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
}

export interface MutationContext {
  flow: TestModel;
  spec: TestableNodeSpec;
  mainId: string;
  /** Source node ids, in the order of spec.inputs. */
  inputNodeIds: string[];
  rng: () => number;
}

export interface MutationResult {
  change: string;
  affectedNodeIds: string[];
  expected: Expectation;
  expectedDescription: string;
}

export interface ErrorMutator {
  id: string;
  category: ErrorCategory;
  name: string;
  /** Mutates ctx.flow in place. Returns null if not applicable to this model. */
  apply: (ctx: MutationContext) => MutationResult | null;
}

// --- Helpers ---

/** Deterministic PRNG so a seed reproduces the same set of test models. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function nodeById(flow: TestModel, id: string) {
  return flow.nodes.find((n) => n.id === id);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shortValue(v: string): string {
  return v.length > 40 ? `${v.slice(0, 20)}… (${v.length} chars)` : v;
}

/** Picks a random input port index, optionally filtered; null if none. */
function pickInput(ctx: MutationContext, filter?: (i: number) => boolean) {
  const candidates = ctx.inputNodeIds
    .map((_, i) => i)
    .filter((i) => (filter ? filter(i) : true));
  if (candidates.length === 0) return null;
  return pick(candidates, ctx.rng);
}

function inputLabel(ctx: MutationContext, i: number): string {
  return ctx.spec.inputs[i]?.label ?? `Input ${i + 1}`;
}

function isClassicalPort(ctx: MutationContext, i: number): boolean {
  return portKind(ctx.spec.inputs[i]) === "classical";
}

function edgeOfInput(ctx: MutationContext, i: number) {
  return ctx.flow.edges.find(
    (e) => e.source === ctx.inputNodeIds[i] && e.target === ctx.mainId,
  );
}

interface DataTarget {
  node: any;
  /** How the node is referred to in the report. */
  name: string;
  /** Expected data type (from the port, or the node's own type). */
  expectedType: string;
}

/** Classical data nodes of the model: the inputs, or the node under test itself. */
function dataTargets(ctx: MutationContext): DataTarget[] {
  if (ctx.spec.nodeType === DATA_TYPE_NODE_TYPE) {
    const node = nodeById(ctx.flow, ctx.mainId);
    return [
      {
        node,
        name: ctx.spec.label,
        expectedType: normalizeDataType(node.data.dataType),
      },
    ];
  }
  return ctx.spec.inputs
    .map((port, i) => ({ port, i }))
    .filter(({ i }) => isClassicalPort(ctx, i))
    .map(({ port, i }) => ({
      node: nodeById(ctx.flow, ctx.inputNodeIds[i]),
      name: `input "${inputLabel(ctx, i)}"`,
      expectedType: port.dataTypeKey.split(":")[0],
    }))
    .filter((t) => t.node);
}

/** Retypes a dataTypeNode consistently (label, dataType, outputTypes, value). */
function retypeDataNode(node: any, dataType: string, value: string) {
  node.data.dataType = dataType;
  node.data.label = dataType === "array" ? "Array" : capitalize(dataType);
  node.data.outputTypes = [dataType];
  node.data.value = value;
  node.data.description = `${capitalize(dataType)} input value`;
  node.data.icon = `PaletteIcon_${capitalize(dataType)}.png`;
}

function newDataNode(
  dataType: string,
  value: string,
  identifier: string,
  position: { x: number; y: number },
  rng: () => number,
) {
  const id = uuidv4();
  const node = {
    id,
    type: DATA_TYPE_NODE_TYPE,
    position,
    selectable: true,
    draggable: true,
    data: {
      label: "",
      dataType,
      value,
      outputIdentifier: identifier,
      inputs: [],
      outputs: [{ identifier, size: "", type: "classical" }],
      children: [],
      completionGuaranteed: true,
      identifiers: ["q" + Math.floor(100000 + rng() * 900000)],
      inputTypes: [],
      outputTypes: [dataType],
    },
    width: 450,
    height: 270,
  };
  retypeDataNode(node, dataType, value);
  return node;
}

// A value of a type that is incompatible with the expected one.
const INCOMPATIBLE_TYPE: Record<string, { type: string; value: string }> = {
  array: { type: "boolean", value: "true" },
  number: { type: "string", value: "abc" },
  bit: { type: "array", value: "0,1" },
  boolean: { type: "number", value: "3.14" },
  string: { type: "array", value: "1,2,3" },
  file: { type: "number", value: "42" },
  angle: { type: "boolean", value: "true" },
  // "any" accepts every supported type, so only an unsupported one is wrong
  any: { type: "complex", value: "1+2j" },
};

// Values that violate the syntax of the type.
const INVALID_FORMAT: Record<string, string> = {
  array: "0,,1,]",
  number: "12abc",
  bit: "2",
  boolean: "yes",
  string: "\u0000\u0007",
  file: "://not-a-file",
  angle: "ninety",
};

// Syntactically plausible values that are semantically incompatible.
const INCOMPATIBLE_VALUE: Record<string, string> = {
  array: "NaN,Infinity,-Infinity",
  number: "NaN",
  bit: "-1",
  boolean: "1",
  string: "x".repeat(10000),
  file: "<file_placeholder.exe>",
  angle: "Infinity",
};

/** Options the platform can check: those with a permitted set, range or format. */
function isConstrained(opt: TestableOption): boolean {
  return Boolean(
    opt.allowed || opt.numeric || opt.pattern || opt.numericExpression,
  );
}

function sourceHandleOf(node: any): string {
  return node.type === DATA_TYPE_NODE_TYPE
    ? `classicalHandleDataTypeOutput0${node.id}`
    : `quantumHandle${node.type}Output0${node.id}`;
}

/** The encodingType value with which a spec uses the given encoding, if any. */
function encodingTypeFor(
  spec: TestableNodeSpec,
  kind: string,
): string | undefined {
  return spec.options
    .find((o) => o.key === "encodingType")
    ?.allowed?.map(String)
    .find((v) => encodingKind(v) === kind && v.includes("Encoding"));
}

/**
 * Points the file inputs of a plugin to problematic files. Inline data: URLs
 * keep the test models self-contained (no network access needed).
 */
function fileContentMutator(
  id: string,
  name: string,
  variant: (
    filePorts: string[],
  ) => { values: Record<string, string>; reason: string } | null,
): ErrorMutator {
  return {
    id,
    category: "data",
    name,
    apply: (ctx) => {
      const filePorts = ctx.spec.inputs
        .filter((p) => p.dataTypeKey === "file")
        .map((p) => p.key);
      if (ctx.spec.nodeType !== "pluginNode" || filePorts.length === 0) {
        return null;
      }
      const chosen = variant(filePorts);
      if (!chosen) return null;
      const affected: string[] = [];
      const changes: string[] = [];
      Object.entries(chosen.values).forEach(([key, value]) => {
        const i = ctx.spec.inputs.findIndex((p) => p.key === key);
        const source = nodeById(ctx.flow, ctx.inputNodeIds[i]);
        source.data.value = value;
        affected.push(source.id);
        changes.push(`"${inputLabel(ctx, i)}" → ${shortValue(value)}`);
      });
      return {
        change: `File inputs were changed (${changes.join(", ")}): ${chosen.reason}.`,
        affectedNodeIds: [...affected, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because ${chosen.reason}.`,
      };
    },
  };
}

/**
 * Feeds an encoding node (e.g. Amplitude Encoding, or Encode Value switched to
 * that encoding) an array that violates the encoding's constraints.
 */
function encodingValueMutator(
  id: string,
  name: string,
  kind: "amplitude" | "matrix",
  value: string,
  reason: string,
): ErrorMutator {
  return {
    id,
    category: "data",
    name,
    apply: (ctx) => {
      const encodingType = encodingTypeFor(ctx.spec, kind);
      if (!encodingType || ctx.inputNodeIds.length === 0) return null;
      const main = nodeById(ctx.flow, ctx.mainId);
      const source = nodeById(ctx.flow, ctx.inputNodeIds[0]);
      const switched = main.data.encodingType !== encodingType;
      main.data.encodingType = encodingType;
      retypeDataNode(source, "array", value);
      return {
        change: `${switched ? `Encoding type was set to "${encodingType}" and the` : "The"} input array was set to "${value}": ${reason}.`,
        affectedNodeIds: [source.id, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because ${reason}.`,
      };
    },
  };
}

// --- Mutators ---

export const ERROR_MUTATORS: ErrorMutator[] = [
  // ---------- Data & Type ----------
  {
    id: "wrong-type",
    category: "data",
    name: "Incorrect data type",
    apply: (ctx) => {
      const quantumPorts = ctx.spec.inputs
        .map((_, i) => i)
        .filter((i) => !isClassicalPort(ctx, i));
      const targets = dataTargets(ctx);
      // Either feed classical data into a quantum port, or retype a data node.
      const useQuantum =
        quantumPorts.length > 0 && (targets.length === 0 || ctx.rng() < 0.5);
      if (useQuantum) {
        const i = pick(quantumPorts, ctx.rng);
        const oldSource = nodeById(ctx.flow, ctx.inputNodeIds[i]);
        const replacement = newDataNode(
          "number",
          "1",
          "wrongtype",
          oldSource.position,
          ctx.rng,
        );
        ctx.flow.nodes = ctx.flow.nodes.filter((n) => n.id !== oldSource.id);
        ctx.flow.nodes.push(replacement);
        const edge = edgeOfInput(ctx, i);
        edge.source = replacement.id;
        edge.sourceHandle = sourceHandleOf(replacement);
        edge.type = "classicalEdge";
        return {
          change: `Quantum input "${inputLabel(ctx, i)}" is fed by a classical Number node (value 1) instead of a quantum register.`,
          affectedNodeIds: [replacement.id, ctx.mainId],
          expected: "reject",
          expectedDescription: `Reject the model because classical data is connected to the quantum input "${inputLabel(ctx, i)}".`,
        };
      }
      if (targets.length === 0) return null;
      const t = pick(targets, ctx.rng);
      const wrong = INCOMPATIBLE_TYPE[t.expectedType] ?? INCOMPATIBLE_TYPE.any;
      // For a data node under test, its own type is "expected": use an unsupported type.
      const replacement =
        ctx.spec.nodeType === DATA_TYPE_NODE_TYPE
          ? INCOMPATIBLE_TYPE.any
          : wrong;
      const before = t.node.data.dataType;
      retypeDataNode(t.node, replacement.type, replacement.value);
      return {
        change: `${capitalize(t.name)} (expected type "${t.expectedType}") was changed from type "${before}" to "${replacement.type}" (value "${replacement.value}").`,
        affectedNodeIds: [t.node.id, ctx.mainId].filter(
          (v, i, a) => a.indexOf(v) === i,
        ),
        expected: "reject",
        expectedDescription: `Reject the model with a type error for ${t.name}.`,
      };
    },
  },
  {
    id: "missing-value",
    category: "data",
    name: "Missing required value",
    apply: (ctx) => {
      const targets = dataTargets(ctx);
      if (targets.length === 0) return null;
      const t = pick(targets, ctx.rng);
      const before = t.node.data.value;
      t.node.data.value = "";
      return {
        change: `Value of ${t.name} was cleared (was "${shortValue(String(before))}").`,
        affectedNodeIds: [t.node.id],
        expected: "reject",
        expectedDescription: `Reject the model and report that ${t.name} has no value.`,
      };
    },
  },
  {
    id: "invalid-format",
    category: "data",
    name: "Invalid format",
    apply: (ctx) => {
      const targets = dataTargets(ctx).filter(
        (t) => INVALID_FORMAT[normalizeDataType(t.node.data.dataType)],
      );
      if (targets.length === 0) return null;
      const t = pick(targets, ctx.rng);
      const type = normalizeDataType(t.node.data.dataType);
      const value = INVALID_FORMAT[type];
      const before = t.node.data.value;
      t.node.data.value = value;
      return {
        change: `Value of ${t.name} (${type}) was changed from "${shortValue(String(before))}" to malformed "${JSON.stringify(value).slice(1, -1)}".`,
        affectedNodeIds: [t.node.id],
        expected: "reject",
        expectedDescription: `Reject the model with a format error for ${t.name}.`,
      };
    },
  },
  {
    id: "incompatible-value",
    category: "data",
    name: "Incompatible input value",
    apply: (ctx) => {
      const targets = dataTargets(ctx).filter(
        (t) => INCOMPATIBLE_VALUE[normalizeDataType(t.node.data.dataType)],
      );
      if (targets.length === 0) return null;
      const t = pick(targets, ctx.rng);
      const type = normalizeDataType(t.node.data.dataType);
      const value = INCOMPATIBLE_VALUE[type];
      const before = t.node.data.value;
      t.node.data.value = value;
      return {
        change: `Value of ${t.name} (${type}) was changed from "${shortValue(String(before))}" to semantically invalid "${shortValue(value)}".`,
        affectedNodeIds: [t.node.id],
        expected: "reject",
        expectedDescription: `Reject the model because ${t.name} holds a value outside the accepted domain.`,
      };
    },
  },
  encodingValueMutator(
    "unnormalized-amplitudes",
    "Unnormalized amplitude vector",
    "amplitude",
    "1,1,1,1",
    "an amplitude vector must have an L2 norm of 1 (this one has norm 2)",
  ),
  encodingValueMutator(
    "matrix-not-square",
    "Non-square matrix",
    "matrix",
    "1,0,0",
    "matrix encoding requires a flat square matrix (3 values)",
  ),
  encodingValueMutator(
    "matrix-dimension",
    "Matrix dimension not a power of two",
    "matrix",
    "1,0,0,0,1,0,0,0,1",
    "matrix encoding requires a 2^n x 2^n matrix (this one is 3 x 3)",
  ),
  encodingValueMutator(
    "matrix-not-unitary",
    "Non-unitary matrix",
    "matrix",
    "1,1,0,1",
    "matrix encoding requires a unitary matrix",
  ),
  encodingValueMutator(
    "amplitude-length",
    "Amplitude vector length not a power of two",
    "amplitude",
    "0.6,0.8,0",
    "amplitude encoding requires 2^n amplitudes (this vector has 3)",
  ),
  {
    id: "invalid-count",
    category: "data",
    name: "Non-integer or non-positive count",
    apply: (ctx) => {
      // Ports such as k, epochs or windowSize require positive integers.
      const ports = ctx.spec.inputs
        .map((port, i) => ({ port, i }))
        .filter(({ port }) => port.integer || port.min !== undefined);
      if (ports.length === 0) return null;
      const { port, i } = pick(ports, ctx.rng);
      const source = nodeById(ctx.flow, ctx.inputNodeIds[i]);
      const value = pick(["3.14", "-5", "0"], ctx.rng);
      const before = source.data.value;
      source.data.value = value;
      return {
        change: `Input "${port.label}" was set to ${value} (was ${before}); it must be an integer ≥ ${port.min ?? 1}.`,
        affectedNodeIds: [source.id, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because "${port.label}" must be a positive integer.`,
      };
    },
  },
  {
    id: "invalid-edge-list",
    category: "data",
    name: "Invalid graph edges",
    apply: (ctx) => {
      const i = ctx.spec.inputs.findIndex(
        (p) => p.dataTypeKey === "array:edgeArray",
      );
      if (i < 0) return null;
      const variants: [string, string][] = [
        ["[0,1],[1]", "edge [1] is not a pair of vertices"],
        ["[0,1],[1,2],[1,0]", "edge [1,0] duplicates edge [0,1]"],
        ["[0,1],[0,1]", "edge [0,1] appears twice"],
        ["[0,1],[2,2]", "edge [2,2] connects a vertex with itself"],
        ["0,1,1,2", "the value is a flat list instead of a list of pairs"],
        ["[0,1],[1,-2]", "vertex -2 does not exist"],
      ];
      const [value, reason] = pick(variants, ctx.rng);
      const main = nodeById(ctx.flow, ctx.mainId);
      main.data.problem = "MaxCut";
      const source = nodeById(ctx.flow, ctx.inputNodeIds[i]);
      source.data.value = value;
      return {
        change: `MaxCut edges were set to "${value}": ${reason}.`,
        affectedNodeIds: [source.id, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because MaxCut requires distinct edges like [[0,1],[1,2]] (${reason}).`,
      };
    },
  },
  fileContentMutator("malformed-csv", "Malformed CSV file", (filePorts) => ({
    values: { [filePorts[0]]: "data:text/csv,1,2%0A3,4,5%0A6,7" },
    reason:
      "the CSV file is malformed (row 2 has 3 columns, rows 1 and 3 have 2)",
  })),
  fileContentMutator(
    "label-count-mismatch",
    "Labels do not match the data",
    (filePorts) =>
      filePorts.includes("trainingDataUrl") &&
      filePorts.includes("trainingLabelsUrl")
        ? {
            values: {
              trainingDataUrl: "data:text/csv,1,2%0A3,4%0A5,6",
              trainingLabelsUrl: "data:text/csv,0%0A1",
            },
            reason: "the training data has 3 records but only 2 labels",
          }
        : null,
  ),
  fileContentMutator(
    "not-a-data-file",
    "File is not a data file",
    (filePorts) => ({
      values: { [filePorts[0]]: "https://example.org/docs/overview.mdx" },
      reason:
        "the file is a Markdown documentation page (.mdx) instead of CSV/JSON data",
    }),
  ),

  // ---------- Parameter & Configuration ----------
  {
    id: "invalid-option",
    category: "parameter",
    name: "Invalid parameter value",
    apply: (ctx) => {
      const options = ctx.spec.options.filter(isConstrained);
      if (options.length === 0) return null;
      const opt = pick(options, ctx.rng);
      const main = nodeById(ctx.flow, ctx.mainId);
      const before = main.data[opt.key];
      main.data[opt.key] = "__INVALID__";
      const permitted = opt.allowed
        ? `allowed: ${opt.allowed.join(", ")}`
        : (opt.patternDescription ?? "a number");
      return {
        change: `Parameter "${opt.label}" was set to "__INVALID__" (was "${before}"; ${permitted}).`,
        affectedNodeIds: [ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because "${opt.label}" has a value that is not permitted.`,
      };
    },
  },
  {
    id: "out-of-range",
    category: "parameter",
    name: "Value outside permitted range",
    apply: (ctx) => {
      const main = nodeById(ctx.flow, ctx.mainId);
      const ranged = ctx.spec.options.filter(
        (o) => o.numeric && (o.min !== undefined || o.max !== undefined),
      );
      if (ranged.length) {
        const opt = pick(ranged, ctx.rng);
        const candidates: number[] = [];
        if (opt.min !== undefined)
          candidates.push(opt.min - (opt.integer ? 1 : 0.5));
        if (opt.max !== undefined)
          candidates.push(opt.max + (opt.integer ? 1 : 0.5));
        const value = pick(candidates, ctx.rng);
        const before = main.data[opt.key];
        main.data[opt.key] = value;
        return {
          change: `Parameter "${opt.label}" was set to ${value} (was ${before}; permitted range ${opt.min ?? "-∞"}..${opt.max ?? "∞"}).`,
          affectedNodeIds: [ctx.mainId],
          expected: "reject",
          expectedDescription: `Reject the model because "${opt.label}" is outside its permitted range.`,
        };
      }
      const sized = main.data.outputs?.find((o: any) => o.size !== undefined);
      if (sized) {
        const before = sized.size;
        sized.size = "-3";
        return {
          change: `Size of output ${sized.identifier ? `"${sized.identifier}"` : "1"} was set to -3 (was "${before}").`,
          affectedNodeIds: [ctx.mainId],
          expected: "reject",
          expectedDescription: `Reject the model because a register size must be a positive integer.`,
        };
      }
      return null;
    },
  },
  {
    id: "missing-config",
    category: "parameter",
    name: "Missing configuration",
    apply: (ctx) => {
      const required = ctx.spec.options.filter(
        (o) =>
          o.required &&
          !(ctx.spec.nodeType === DATA_TYPE_NODE_TYPE && o.key === "value"),
      );
      if (required.length === 0) return null;
      const opt = pick(required, ctx.rng);
      const main = nodeById(ctx.flow, ctx.mainId);
      const before = main.data[opt.key];
      delete main.data[opt.key];
      return {
        change: `Required setting "${opt.label}" (${opt.key}) was removed from the node configuration (was "${before}").`,
        affectedNodeIds: [ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model and report the missing "${opt.label}" setting.`,
      };
    },
  },
  {
    id: "wrong-default",
    category: "parameter",
    name: "Incorrect default value",
    apply: (ctx) => {
      // Use a value that is valid for a sibling construct but not for this one.
      const main = nodeById(ctx.flow, ctx.mainId);
      const candidates: {
        key: string;
        label: string;
        value: string | number;
      }[] = [];
      ctx.spec.options.forEach((opt) => {
        if (!opt.allowed) return;
        const permitted = opt.allowed.map(String);
        TESTABLE_NODE_REGISTRY.filter(
          (s) => s.id !== ctx.spec.id && s.nodeType === ctx.spec.nodeType,
        ).forEach((sibling) => {
          sibling.options
            .filter((o) => o.key === opt.key)
            .flatMap((o) => o.values)
            .filter((v) => !permitted.includes(String(v)))
            .forEach((v) =>
              candidates.push({ key: opt.key, label: opt.label, value: v }),
            );
        });
      });
      if (candidates.length === 0) return null;
      const c = pick(candidates, ctx.rng);
      const before = main.data[c.key];
      main.data[c.key] = c.value;
      return {
        change: `Parameter "${c.label}" was set to "${c.value}" (was "${before}"), a value that belongs to another "${ctx.spec.nodeType}" construct.`,
        affectedNodeIds: [ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because "${c.value}" is not a valid "${c.label}" for ${ctx.spec.label}.`,
      };
    },
  },
  {
    id: "inconsistent-config",
    category: "parameter",
    name: "Inconsistent configuration",
    apply: (ctx) => {
      const i = pickInput(ctx, (i) => isClassicalPort(ctx, i));
      if (i === null) return null;
      const main = nodeById(ctx.flow, ctx.mainId);
      const source = nodeById(ctx.flow, ctx.inputNodeIds[i]);
      const actual = source.data.dataType;
      const declared = actual === "bit" ? "boolean" : "bit";
      main.data.inputTypes = [...(main.data.inputTypes ?? [])];
      main.data.inputTypes[i] = declared;
      return {
        change: `Declared type of input port "${inputLabel(ctx, i)}" was changed to "${declared}", while a "${actual}" node is connected to it.`,
        affectedNodeIds: [ctx.mainId, source.id],
        expected: "reject",
        expectedDescription: `Reject the model because the port configuration contradicts the connected data.`,
      };
    },
  },
  {
    id: "invalid-identifier",
    category: "parameter",
    name: "Invalid identifier",
    apply: (ctx) => {
      const targets = dataTargets(ctx);
      if (targets.length === 0) return null;
      const t = pick(targets, ctx.rng);
      const before = t.node.data.outputIdentifier;
      const renamed = `1${before}`;
      t.node.data.outputIdentifier = renamed;
      t.node.data.outputs = t.node.data.outputs.map((o: any) => ({
        ...o,
        identifier: renamed,
      }));
      return {
        change: `Output identifier of ${t.name} was renamed from "${before}" to "${renamed}" (starts with a digit).`,
        affectedNodeIds: [t.node.id],
        expected: "reject",
        expectedDescription: `Reject the model because identifiers must not start with a number.`,
      };
    },
  },
  {
    id: "duplicate-identifier",
    category: "parameter",
    name: "Duplicate identifier",
    apply: (ctx) => {
      const targets = dataTargets(ctx);
      let first: any;
      let second: any;
      let secondName: string;
      let firstName: string;
      if (targets.length >= 2) {
        [first, second] = [targets[0].node, targets[1].node];
        [firstName, secondName] = [targets[0].name, targets[1].name];
      } else if (targets.length === 1) {
        // Add a second data node that reuses the identifier.
        first = targets[0].node;
        firstName = targets[0].name;
        second = newDataNode(
          "number",
          "2",
          "tmp",
          { x: first.position.x, y: first.position.y - 350 },
          ctx.rng,
        );
        ctx.flow.nodes.push(second);
        secondName = "an added Number node";
      } else {
        return null;
      }
      const before = second.data.outputIdentifier;
      second.data.outputIdentifier = first.data.outputIdentifier;
      second.data.outputs = second.data.outputs.map((o: any) => ({
        ...o,
        identifier: first.data.outputIdentifier,
      }));
      return {
        change: `Output identifier of ${secondName} was changed from "${before}" to "${first.data.outputIdentifier}", duplicating ${firstName}.`,
        affectedNodeIds: [first.id, second.id],
        expected: "reject",
        expectedDescription: `Reject the model because output identifiers must be unique.`,
      };
    },
  },
  {
    id: "register-size-mismatch",
    category: "parameter",
    name: "Register size mismatch",
    apply: (ctx) => {
      if (!ctx.spec.equalQuantumInputSizes) return null;
      const quantumPorts = ctx.spec.inputs
        .map((_, i) => i)
        .filter((i) => !isClassicalPort(ctx, i));
      if (quantumPorts.length < 2) return null;
      // Enlarge one register, e.g. a CY with a 1-qubit control and a 2-qubit target.
      const i = pick(quantumPorts, ctx.rng);
      const source = nodeById(ctx.flow, ctx.inputNodeIds[i]);
      const size = pick([2, 3], ctx.rng);
      source.data.size = size;
      source.data.outputs = [{ identifier: "", size: String(size) }];
      const others = quantumPorts
        .filter((j) => j !== i)
        .map((j) => `"${inputLabel(ctx, j)}" has size 1`)
        .join(", ");
      return {
        change: `The register connected to "${inputLabel(ctx, i)}" was enlarged to ${size} qubits, while ${others}.`,
        affectedNodeIds: [source.id, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because ${ctx.spec.label} requires all quantum inputs to have the same size.`,
      };
    },
  },
  {
    id: "index-out-of-register",
    category: "parameter",
    name: "Exceeds register size",
    apply: (ctx) => {
      const main = nodeById(ctx.flow, ctx.mainId);
      const source = ctx.inputNodeIds[0]
        ? nodeById(ctx.flow, ctx.inputNodeIds[0])
        : undefined;
      const size = Number(source?.data?.size);
      if (!Number.isInteger(size)) return null;
      if (main.type === "measurementNode") {
        const before = main.data.indices;
        main.data.indices = `0,${size + 2}`;
        return {
          change: `Measurement indices were set to "${main.data.indices}" (was "${before}"), but the connected register has only ${size} qubit(s).`,
          affectedNodeIds: [ctx.mainId, source.id],
          expected: "reject",
          expectedDescription: `Reject the model because index ${size + 2} is outside the ${size}-qubit register.`,
        };
      }
      if (main.type === "splitterNode") {
        const before = main.data.numberOutputs;
        main.data.numberOutputs = size + 2;
        return {
          change: `Splitter outputs were set to ${size + 2} (was ${before}), but the connected register has only ${size} qubit(s).`,
          affectedNodeIds: [ctx.mainId, source.id],
          expected: "reject",
          expectedDescription: `Reject the model because a ${size}-qubit register cannot be split into ${size + 2} qubits.`,
        };
      }
      return null;
    },
  },

  // ---------- Flow ----------
  {
    id: "quantum-fan-out",
    category: "flow",
    name: "Quantum state used twice (no-cloning)",
    apply: (ctx) => {
      // Reuse the register feeding a quantum input, or the node's own quantum output.
      const port = ctx.spec.inputs.findIndex((p) => portKind(p) === "quantum");
      const main = nodeById(ctx.flow, ctx.mainId);
      let source: any;
      let sourceHandle: string;
      let consumers: number;
      if (port >= 0) {
        source = nodeById(ctx.flow, ctx.inputNodeIds[port]);
        sourceHandle = sourceHandleOf(source);
        consumers = 1;
      } else {
        const outputHandle = ctx.spec.outputHandle?.(ctx.mainId);
        if (!outputHandle?.startsWith("quantum")) return null;
        source = main;
        sourceHandle = outputHandle;
        consumers = 2;
      }
      const added: string[] = [];
      for (let k = 0; k < consumers; k++) {
        const id = uuidv4();
        ctx.flow.nodes.push({
          id,
          type: "measurementNode",
          position: {
            x: main.position.x + 500,
            y: main.position.y + k * 460,
          },
          data: {
            label: "Measurement",
            indices: "0",
            outputIdentifier: "",
            inputs: [],
            outputs: [],
            inputTypes: ["quantum register"],
            outputTypes: ["array", "quantum register"],
          },
          width: 320,
          height: 440,
        });
        ctx.flow.edges.push({
          id: uuidv4(),
          source: source.id,
          sourceHandle,
          target: id,
          targetHandle: `quantumHandleMeasurementInput0${id}`,
          type: "quantumEdge",
        });
        added.push(id);
      }
      const what =
        port >= 0
          ? `the register feeding "${inputLabel(ctx, port)}" is also connected to a Measurement`
          : `the quantum output of ${ctx.spec.label} is connected to two Measurements`;
      return {
        change: `Quantum fan-out: ${what}.`,
        affectedNodeIds: [source.id, ...added],
        expected: "reject",
        expectedDescription: `Reject the model because a quantum state cannot be copied and used twice (no-cloning).`,
      };
    },
  },
  {
    id: "missing-path",
    category: "flow",
    name: "Missing execution path",
    apply: (ctx) => {
      const i = pickInput(ctx, (i) => ctx.spec.inputs[i].required ?? true);
      if (i === null) return null;
      const inputId = ctx.inputNodeIds[i];
      ctx.flow.edges = ctx.flow.edges.filter((e) => e.source !== inputId);
      const main = nodeById(ctx.flow, ctx.mainId);
      main.data.inputs = (main.data.inputs ?? []).filter(
        (x: any) => x.id !== inputId,
      );
      return {
        change: `Connection from input "${inputLabel(ctx, i)}" to ${ctx.spec.label} was removed.`,
        affectedNodeIds: [inputId, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because the required input "${inputLabel(ctx, i)}" is not connected.`,
      };
    },
  },
  {
    id: "unreachable-node",
    category: "flow",
    name: "Unreachable node",
    apply: (ctx) => {
      const main = nodeById(ctx.flow, ctx.mainId);
      const orphan = newDataNode(
        "number",
        "1",
        "orphan",
        { x: main.position.x, y: main.position.y - 400 },
        ctx.rng,
      );
      ctx.flow.nodes.push(orphan);
      return {
        change: `An additional, unconnected Number node ("orphan") was added to the model.`,
        affectedNodeIds: [orphan.id],
        expected: "warn",
        expectedDescription: `Accept the model but warn that the added node is not used.`,
      };
    },
  },
  {
    id: "reversed-edge",
    category: "flow",
    name: "Invalid node sequence",
    apply: (ctx) => {
      const i = pickInput(ctx);
      if (i === null) return null;
      const edge = edgeOfInput(ctx, i);
      if (!edge) return null;
      [edge.source, edge.target] = [edge.target, edge.source];
      [edge.sourceHandle, edge.targetHandle] = [
        edge.targetHandle,
        edge.sourceHandle,
      ];
      return {
        change: `Connection between "${inputLabel(ctx, i)}" and ${ctx.spec.label} was reversed (${ctx.spec.label} now feeds its input node).`,
        affectedNodeIds: [ctx.inputNodeIds[i], ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because data flows from an operation back into its source.`,
      };
    },
  },
  {
    id: "cycle",
    category: "flow",
    name: "Unintended cycle",
    apply: (ctx) => {
      const main = nodeById(ctx.flow, ctx.mainId);
      const outputHandle =
        ctx.spec.outputHandle?.(ctx.mainId) ?? sourceHandleOf(main);
      const i = pickInput(ctx);
      if (i === null) {
        // Node without inputs: connect its output to itself.
        ctx.flow.edges.push({
          id: uuidv4(),
          source: ctx.mainId,
          sourceHandle: outputHandle,
          target: ctx.mainId,
          targetHandle: outputHandle.replace("Output", "Input"),
          type: outputHandle.startsWith("classical")
            ? "classicalEdge"
            : "quantumEdge",
        });
        return {
          change: `The output of ${ctx.spec.label} was connected back to the node itself.`,
          affectedNodeIds: [ctx.mainId],
          expected: "reject",
          expectedDescription: `Reject the model because it contains a cycle (self-loop).`,
        };
      }
      const inputId = ctx.inputNodeIds[i];
      const inputNode = nodeById(ctx.flow, inputId);
      ctx.flow.edges.push({
        id: uuidv4(),
        source: ctx.mainId,
        sourceHandle: outputHandle,
        target: inputId,
        targetHandle: sourceHandleOf(inputNode).replace("Output", "Input"),
        type: outputHandle.startsWith("classical")
          ? "classicalEdge"
          : "quantumEdge",
      });
      return {
        change: `The output of ${ctx.spec.label} was connected back to its input "${inputLabel(ctx, i)}", creating the cycle ${inputLabel(ctx, i)} → ${ctx.spec.label} → ${inputLabel(ctx, i)}.`,
        affectedNodeIds: [inputId, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because it contains a cycle.`,
      };
    },
  },
  {
    id: "duplicate-connection",
    category: "flow",
    name: "Conflicting connections",
    apply: (ctx) => {
      if (ctx.inputNodeIds.length < 2) return null;
      // Connect the second source into the port of a first source of the same kind.
      const kinds = ctx.spec.inputs.map((p) => portKind(p));
      const pairs: [number, number][] = [];
      kinds.forEach((k, a) =>
        kinds.forEach((k2, b) => a !== b && k === k2 && pairs.push([a, b])),
      );
      if (pairs.length === 0) return null;
      const [a, b] = pick(pairs, ctx.rng);
      const edgeA = edgeOfInput(ctx, a);
      const sourceB = nodeById(ctx.flow, ctx.inputNodeIds[b]);
      if (!edgeA || !sourceB) return null;
      ctx.flow.edges.push({
        ...edgeA,
        id: uuidv4(),
        source: sourceB.id,
        sourceHandle: sourceHandleOf(sourceB),
      });
      return {
        change: `Input "${inputLabel(ctx, b)}" was additionally connected to the port of "${inputLabel(ctx, a)}", so that port receives two values.`,
        affectedNodeIds: [ctx.inputNodeIds[a], sourceB.id, ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because a single input port has multiple incoming connections.`,
      };
    },
  },
  {
    id: "wrong-port",
    category: "flow",
    name: "Connection to non-existent port",
    apply: (ctx) => {
      const i = pickInput(ctx);
      if (i === null) return null;
      const edge = edgeOfInput(ctx, i);
      if (!edge) return null;
      const before = edge.targetHandle;
      // Handles are "<prefix><port index><node id>": use port index 99.
      const idx = before.lastIndexOf(ctx.mainId);
      edge.targetHandle =
        idx >= 0
          ? before.slice(0, idx).replace(/\d*$/, "99") + before.slice(idx)
          : `${before}99`;
      return {
        change: `Connection from "${inputLabel(ctx, i)}" was moved to the non-existent port "${edge.targetHandle}".`,
        affectedNodeIds: [ctx.inputNodeIds[i], ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because the connection targets a port that does not exist.`,
      };
    },
  },
  {
    id: "dangling-edge",
    category: "flow",
    name: "Dangling connection",
    apply: (ctx) => {
      const main = nodeById(ctx.flow, ctx.mainId);
      const outputHandle =
        ctx.spec.outputHandle?.(ctx.mainId) ?? sourceHandleOf(main);
      const missingId = uuidv4();
      ctx.flow.edges.push({
        id: uuidv4(),
        source: ctx.mainId,
        sourceHandle: outputHandle,
        target: missingId,
        targetHandle: `quantumHandleGateInput0${missingId}`,
        type: outputHandle.startsWith("classical")
          ? "classicalEdge"
          : "quantumEdge",
      });
      return {
        change: `A connection from ${ctx.spec.label} to a non-existent node (${missingId.slice(0, 8)}…) was added.`,
        affectedNodeIds: [ctx.mainId],
        expected: "reject",
        expectedDescription: `Reject the model because a connection references a node that does not exist.`,
      };
    },
  },
];

/**
 * Orders mutators so that consecutive picks alternate between categories,
 * e.g. data, parameter, flow, data, ... — small model counts still cover
 * every selected category.
 */
export function interleaveByCategory(
  categories: ErrorCategory[],
): ErrorMutator[] {
  const buckets = categories.map((c) =>
    ERROR_MUTATORS.filter((m) => m.category === c),
  );
  const result: ErrorMutator[] = [];
  const max = Math.max(0, ...buckets.map((b) => b.length));
  for (let i = 0; i < max; i++) {
    buckets.forEach((b) => b[i] && result.push(b[i]));
  }
  return result;
}
