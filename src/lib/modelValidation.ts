/**
 * Generic, schema-driven model validation based on the node specs in
 * lib/nodeSpecs.ts. Complements the construct-specific checks in App.tsx
 * (validateFlow) with checks on:
 *  - data & types: missing/malformed/incompatible values, type mismatches
 *  - parameters & configuration: missing settings, values outside the
 *    permitted set or range, inconsistent port declarations
 *  - flow: dangling connections, unknown ports, reversed connections,
 *    classical/quantum mismatches, multiple connections into one port, cycles
 */
import {
  CONTENT_TYPE_EXTENSIONS,
  DATA_TYPE_NODE_TYPE,
  KNOWN_CLASSICAL_TYPES,
  PLUGIN_NODE_TYPE,
  SpecCheckContext,
  TestableNodeSpec,
  checkDataValue,
  dataUrlMediaType,
  fileExtension,
  findNodeSpec,
  isTypeCompatible,
  normalizeDataType,
  portKind,
} from "./nodeSpecs";

export interface ModelValidationItem {
  nodeId: string | null;
  nodeType: string;
  description: string;
}

export interface ModelValidationResult {
  errors: ModelValidationItem[];
  warnings: ModelValidationItem[];
}

/** Containers whose ports are wired from inside and outside (loops, branches). */
const CONTAINER_TYPES = ["ifElseNode", "controlStructureNode", "groupNode"];

/**
 * Node types whose missing inputs are already reported by validateFlow;
 * reporting them again would only duplicate the error.
 */
const INPUT_COUNT_CHECKED_TYPES = [
  "gateNode",
  "quantumOperatorNode",
  "classicalOperatorNode",
  "pluginNode",
  "qftNode",
];
const INPUT_CHECKED_ENCODINGS = [
  "Encode Value",
  "Basis Encoding",
  "Angle Encoding",
  "Amplitude Encoding",
];

function inputsCheckedElsewhere(node: any): boolean {
  return (
    INPUT_COUNT_CHECKED_TYPES.includes(node.type) ||
    (node.type === "statePreparationNode" &&
      INPUT_CHECKED_ENCODINGS.includes(node.data?.label))
  );
}

/** Node types that only produce data and therefore have no input ports. */
const SOURCE_ONLY_TYPES = [DATA_TYPE_NODE_TYPE, "qubitNode", "ancillaNode"];

function handleKind(
  handle: unknown,
): "classical" | "quantum" | "ancilla" | null {
  const h = String(handle ?? "");
  if (h.startsWith("classical")) return "classical";
  if (h.startsWith("quantum")) return "quantum";
  if (h.startsWith("ancilla")) return "ancilla";
  return null;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function nodeName(node: any): string {
  return `"${node.data?.label ?? node.type}" (${String(node.id).slice(0, 8)})`;
}

function checkOptions(spec: TestableNodeSpec, node: any): string[] {
  const errors: string[] = [];
  spec.options.forEach((opt) => {
    // A data node's value is checked against its data type instead.
    if (spec.nodeType === DATA_TYPE_NODE_TYPE && opt.key === "value") return;

    const value = node.data?.[opt.key];
    if (isEmpty(value)) {
      if (opt.required)
        errors.push(`Required setting "${opt.label}" is missing.`);
      return;
    }
    if (opt.allowed && !opt.allowed.map(String).includes(String(value))) {
      errors.push(
        `"${opt.label}" has the invalid value "${value}" (permitted: ${opt.allowed.join(", ")}).`,
      );
      return;
    }
    if (opt.numeric) {
      const n = Number(String(value).trim());
      if (!Number.isFinite(n)) {
        errors.push(`"${opt.label}" must be a number, but is "${value}".`);
        return;
      }
      if (opt.integer && !Number.isInteger(n)) {
        errors.push(`"${opt.label}" must be an integer, but is ${value}.`);
      }
      if (opt.min !== undefined && n < opt.min) {
        errors.push(`"${opt.label}" is ${n}, below the minimum of ${opt.min}.`);
      }
      if (opt.max !== undefined && n > opt.max) {
        errors.push(`"${opt.label}" is ${n}, above the maximum of ${opt.max}.`);
      }
    }
    if (
      opt.numericExpression &&
      !Number.isFinite(Number(String(value).trim())) &&
      !/^[\d\s.+\-*/()πpi]+$/.test(String(value).trim())
    ) {
      errors.push(`"${opt.label}" must be a numeric value, but is "${value}".`);
    }
    if (opt.pattern && !opt.pattern.test(String(value).trim())) {
      errors.push(
        `"${opt.label}" has the invalid format "${value}" (expected ${opt.patternDescription ?? opt.pattern}).`,
      );
    }
  });
  return errors;
}

/** Finds cycles over data-flow edges; returns the node ids of one cycle per strongly connected component. */
function findCycles(nodeIds: string[], edges: any[]): string[][] {
  const adjacency = new Map<string, string[]>();
  nodeIds.forEach((id) => adjacency.set(id, []));
  edges.forEach((e) => adjacency.get(e.source)?.push(e.target));

  const cycles: string[][] = [];
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  const visit = (id: string) => {
    state.set(id, "visiting");
    stack.push(id);
    for (const next of adjacency.get(id) ?? []) {
      if (state.get(next) === "visiting") {
        cycles.push(stack.slice(stack.indexOf(next)));
      } else if (!state.has(next)) {
        visit(next);
      }
    }
    stack.pop();
    state.set(id, "done");
  };
  nodeIds.forEach((id) => !state.has(id) && visit(id));
  return cycles;
}

function sizeOf(value: unknown): number | undefined {
  const n = Number(String(value ?? "").trim());
  return String(value ?? "").trim() !== "" && Number.isInteger(n) && n > 0
    ? n
    : undefined;
}

/**
 * Output handle pattern -> input handle prefix of nodes whose quantum output i
 * carries the register of quantum input i unchanged.
 */
const PASS_THROUGH: Record<string, [RegExp, string]> = {
  gateNode: [/GateOutput(\d+)/, "quantumHandleGateInput"],
  "mcmt-gate": [/quantumHandleOutput(\d+)/, "quantumHandleInput"],
  qftNode: [/QFTOutput(\d+)/, "quantumHandleQFTInput"],
  inverseQftNode: [/QFTOutput(\d+)/, "quantumHandleQFTInput"],
};

/** Nodes with a single quantum input whose quantum output keeps its size. */
const SINGLE_REGISTER_INPUT: Record<string, string> = {
  measurementNode: "quantumHandleMeasurementInput0",
  "universal-oracle": "quantumHandleInput0",
  "grover-diffuser": "quantumHandleInput0",
};

/**
 * Size of the quantum register carried by an edge, traced back to its origin.
 * undefined if it cannot be determined.
 */
export function registerSize(
  edge: any,
  nodesById: Map<string, any>,
  edges: any[],
  visited = new Set<string>(),
): number | undefined {
  const source = nodesById.get(edge.source);
  if (!source || visited.has(source.id)) return undefined;
  visited.add(source.id);

  const sizeAt = (targetHandle: string) => {
    const upstream = edges.find(
      (e) => e.target === source.id && e.targetHandle === targetHandle,
    );
    return upstream
      ? registerSize(upstream, nodesById, edges, new Set(visited))
      : undefined;
  };
  const handle = String(edge.sourceHandle ?? "");

  if (source.type === "gateNode" && source.data?.label === "Qubit Circuit") {
    return sizeOf(source.data?.size) ?? 1;
  }
  const passThrough = PASS_THROUGH[source.type];
  if (passThrough) {
    const index = handle.match(passThrough[0])?.[1];
    return index === undefined
      ? undefined
      : sizeAt(`${passThrough[1]}${index}${source.id}`);
  }
  if (SINGLE_REGISTER_INPUT[source.type]) {
    if (!handle.startsWith("quantum")) return undefined;
    return sizeAt(`${SINGLE_REGISTER_INPUT[source.type]}${source.id}`);
  }
  switch (source.type) {
    case "splitterNode":
      // The splitter splits a register into single qubits.
      return 1;
    case "mergerNode": {
      // The merger concatenates all of its inputs into one register.
      const count = Number(source.data?.numberInputs) || 2;
      const sizes = Array.from({ length: count }, (_, i) =>
        sizeAt(`quantumHandleMergerInput${i}${source.id}`),
      );
      return sizes.every((s) => s !== undefined)
        ? sizes.reduce((a, b) => (a as number) + (b as number), 0)
        : undefined;
    }
    case "grover":
      // Grover's search works on a register of numQubits qubits.
      return sizeOf(source.data?.numQubits);
    case "quantumOperatorNode":
    case "algorithmNode":
    case "ifElseNode":
    case "controlStructureNode":
      // Output widths depend on the operation or the nested model.
      return undefined;
    default:
      return (
        sizeOf(source.data?.size) ?? sizeOf(source.data?.outputs?.[0]?.size)
      );
  }
}

export function validateModelStructure(flow: any): ModelValidationResult {
  const errors: ModelValidationItem[] = [];
  const warnings: ModelValidationItem[] = [];
  const nodes: any[] = flow?.nodes ?? [];
  const edges: any[] = flow?.edges ?? flow?.initialEdges ?? [];
  const metadata = Array.isArray(flow?.metadata)
    ? flow.metadata[0]
    : flow?.metadata;
  // Templates with placeholders are completed by the user: report open values as warnings.
  const containsPlaceholder = metadata?.containsPlaceholder === true;
  const nodesById = new Map<string, any>(nodes.map((n) => [n.id, n]));

  const error = (node: any, description: string) =>
    errors.push({
      nodeId: node?.id ?? null,
      nodeType: node?.type ?? "flow",
      description,
    });
  const warn = (node: any, description: string) =>
    warnings.push({
      nodeId: node?.id ?? null,
      nodeType: node?.type ?? "flow",
      description,
    });

  // ---------- Flow: connections ----------
  const validEdges: any[] = [];
  edges.forEach((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      const missing = [!source && "source", !target && "target"]
        .filter(Boolean)
        .join(" and ");
      error(
        source ?? target ?? null,
        `Connection "${edge.id}" references a non-existent ${missing} node.`,
      );
      return;
    }
    validEdges.push(edge);

    if (edge.source === edge.target) {
      error(source, `Node ${nodeName(source)} is connected to itself.`);
    }

    if (
      SOURCE_ONLY_TYPES.includes(target.type) ||
      (target.type === "gateNode" && target.data?.label === "Qubit Circuit")
    ) {
      error(
        target,
        `Node ${nodeName(target)} has no inputs but receives a connection from ${nodeName(source)} (reversed or invalid connection).`,
      );
      return;
    }

    const sourceSpec = findNodeSpec(source);
    if (sourceSpec && !CONTAINER_TYPES.includes(source.type)) {
      const inputHandles =
        sourceSpec.targetHandles?.(source) ??
        sourceSpec.inputs.map((p) => p.targetHandle(source.id));
      if (inputHandles?.includes(edge.sourceHandle)) {
        error(
          source,
          `Connection from ${nodeName(source)} starts at its input port "${edge.sourceHandle}" (reversed connection).`,
        );
        return;
      }
    }

    const targetSpec = findNodeSpec(target);
    if (targetSpec && !CONTAINER_TYPES.includes(target.type)) {
      const valid = targetSpec.targetHandles
        ? targetSpec.targetHandles(target)
        : targetSpec.inputs.map((p) => p.targetHandle(target.id));
      if (valid && edge.targetHandle && !valid.includes(edge.targetHandle)) {
        error(
          target,
          `Connection from ${nodeName(source)} targets the non-existent port "${edge.targetHandle}" of ${nodeName(target)}.`,
        );
        return;
      }
    }

    const sk = handleKind(edge.sourceHandle);
    const tk = handleKind(edge.targetHandle);
    if (sk && tk && sk !== tk && sk !== "ancilla" && tk !== "ancilla") {
      error(
        target,
        `A ${sk} output of ${nodeName(source)} is connected to a ${tk} input of ${nodeName(target)}.`,
      );
    }
  });

  // Multiple connections into one port.
  const byTargetHandle = new Map<string, any[]>();
  validEdges.forEach((e) => {
    const target = nodesById.get(e.target);
    if (!e.targetHandle || CONTAINER_TYPES.includes(target?.type)) return;
    const key = `${e.target}|${e.targetHandle}`;
    byTargetHandle.set(key, [...(byTargetHandle.get(key) ?? []), e]);
  });
  byTargetHandle.forEach((list) => {
    if (list.length > 1) {
      const target = nodesById.get(list[0].target);
      error(
        target,
        `Input port "${list[0].targetHandle}" of ${nodeName(target)} receives ${list.length} connections; only one is allowed.`,
      );
    }
  });

  // No-cloning: a quantum output can only be used once.
  const byQuantumSource = new Map<string, any[]>();
  validEdges.forEach((e) => {
    if (handleKind(e.sourceHandle) !== "quantum") return;
    if (CONTAINER_TYPES.includes(nodesById.get(e.source)?.type)) return;
    const key = `${e.source}|${e.sourceHandle}`;
    byQuantumSource.set(key, [...(byQuantumSource.get(key) ?? []), e]);
  });
  byQuantumSource.forEach((list) => {
    const targets = new Set(list.map((e) => e.target));
    if (targets.size > 1) {
      const source = nodesById.get(list[0].source);
      error(
        source,
        `The quantum output of ${nodeName(source)} is used by ${targets.size} nodes (${[...targets].map((id) => nodeName(nodesById.get(id))).join(", ")}); quantum states cannot be copied (no-cloning).`,
      );
    }
  });

  // Cycles (containers model loops explicitly and are excluded).
  const flowEdges = validEdges.filter(
    (e) =>
      e.source !== e.target &&
      !CONTAINER_TYPES.includes(nodesById.get(e.source)?.type) &&
      !CONTAINER_TYPES.includes(nodesById.get(e.target)?.type),
  );
  findCycles(
    nodes.map((n) => n.id),
    flowEdges,
  ).forEach((cycle) => {
    error(
      nodesById.get(cycle[0]),
      `The model contains a cycle: ${cycle.map((id) => nodeName(nodesById.get(id))).join(" → ")} → ${nodeName(nodesById.get(cycle[0]))}.`,
    );
  });

  // ---------- Nodes ----------
  nodes.forEach((node) => {
    // Data & type: values of classical data nodes.
    if (node.type === DATA_TYPE_NODE_TYPE) {
      const type = normalizeDataType(node.data?.dataType);
      if (!KNOWN_CLASSICAL_TYPES.includes(type)) {
        error(
          node,
          `Data node ${nodeName(node)} has the unsupported data type "${node.data?.dataType}".`,
        );
      } else {
        const problem = checkDataValue(type, node.data?.value);
        if (problem) {
          (containsPlaceholder ? warn : error)(
            node,
            `Data node ${nodeName(node)}: value ${problem}.`,
          );
        }
      }
    }

    // Generic register sizes.
    (node.data?.outputs ?? []).forEach((o: any, i: number) => {
      if (!isEmpty(o?.size) && !/^\d+$/.test(String(o.size).trim())) {
        error(
          node,
          `Output ${i + 1} of ${nodeName(node)} has the invalid size "${o.size}" (must be a positive integer).`,
        );
      } else if (!isEmpty(o?.size) && Number(o.size) === 0) {
        error(node, `Output ${i + 1} of ${nodeName(node)} has size 0.`);
      }
    });

    const spec = findNodeSpec(node);
    if (!spec) return;

    // Parameters & configuration.
    checkOptions(spec, node).forEach((d) =>
      error(node, `${nodeName(node)}: ${d}`),
    );

    const incoming = validEdges.filter((e) => e.target === node.id);
    const ctx: SpecCheckContext = {
      nodesById,
      edges: validEdges,
      incoming,
      registerSizeAt: (targetHandle) => {
        const edge = incoming.find((e) => e.targetHandle === targetHandle);
        return edge ? registerSize(edge, nodesById, validEdges) : undefined;
      },
    };

    spec.inputs.forEach((port, i) => {
      const handle = port.targetHandle(node.id);
      const edge = incoming.find((e) => e.targetHandle === handle);

      if (!edge) {
        if ((port.required ?? true) && !inputsCheckedElsewhere(node)) {
          error(
            node,
            `Required input "${port.label}" of ${nodeName(node)} is not connected.`,
          );
        }
        return;
      }
      if (portKind(port) !== "classical") return;

      const source = nodesById.get(edge.source);
      if (source?.type !== DATA_TYPE_NODE_TYPE) return;
      const actual = normalizeDataType(source.data?.dataType);

      // Data & type: the connected data must fit the port.
      if (!isTypeCompatible(port.dataTypeKey, actual)) {
        error(
          node,
          `Input "${port.label}" of ${nodeName(node)} expects "${port.dataTypeKey.split(":")[0]}" but receives "${source.data?.dataType}".`,
        );
      } else if (
        actual === "number" &&
        (port.integer || port.min !== undefined)
      ) {
        const n = Number(String(source.data?.value ?? "").trim());
        if (Number.isFinite(n) && port.integer && !Number.isInteger(n)) {
          error(
            node,
            `Input "${port.label}" of ${nodeName(node)} must be an integer, but is ${n}.`,
          );
        }
        if (Number.isFinite(n) && port.min !== undefined && n < port.min) {
          error(
            node,
            `Input "${port.label}" of ${nodeName(node)} must be at least ${port.min}, but is ${n}.`,
          );
        }
      }

      // Configuration: the declared port type must match the connected data.
      const declared = normalizeDataType(node.data?.inputTypes?.[i]);
      if (
        node.type !== PLUGIN_NODE_TYPE && // reported by validateFlow
        KNOWN_CLASSICAL_TYPES.includes(declared) &&
        KNOWN_CLASSICAL_TYPES.includes(actual) &&
        !isTypeCompatible(declared, actual)
      ) {
        error(
          node,
          `Port "${port.label}" of ${nodeName(node)} is declared as "${node.data.inputTypes[i]}" but connected to "${source.data?.dataType}".`,
        );
      }
    });

    // Plugin inputs: file formats must match the accepted content types.
    if (node.type === PLUGIN_NODE_TYPE) {
      (node.data?.dataInputs ?? []).forEach((input: any, index: number) => {
        const edge = incoming.find(
          (e) =>
            e.targetHandle === `classicalHandlePluginInput${index}${node.id}`,
        );
        const source = edge && nodesById.get(edge.source);
        if (!source || normalizeDataType(source.data?.dataType) !== "file")
          return;
        const accepted = (input.content_type ?? []).flatMap(
          (ct: string) => CONTENT_TYPE_EXTENSIONS[ct] ?? [],
        );
        const value = String(source.data?.value ?? "").trim();
        const acceptedTypes: string[] = input.content_type ?? [];
        // Inline data: the media type is part of the URL.
        const mediaType = dataUrlMediaType(value);
        if (mediaType) {
          if (acceptedTypes.length && !acceptedTypes.includes(mediaType)) {
            error(
              node,
              `Input "${input.parameter}" of ${nodeName(node)} accepts ${acceptedTypes.join(", ")}, but receives inline "${mediaType}" data.`,
            );
          }
          return;
        }
        // File names and URL paths: the extension (the content itself is
        // checked by validateFileContents).
        const ext = fileExtension(value);
        if (accepted.length && ext && !accepted.includes(ext)) {
          error(
            node,
            `Input "${input.parameter}" of ${nodeName(node)} accepts ${accepted.map((a: string) => `.${a}`).join(", ")} files, but receives ".${ext}".`,
          );
        }
      });
    }

    // Conditions should refer to a connected classical value.
    if (CONTAINER_TYPES.includes(node.type) && !isEmpty(node.data?.condition)) {
      const known = new Set<string>();
      incoming.forEach((e) => {
        const src = nodesById.get(e.source);
        if (src?.data?.outputIdentifier) known.add(src.data.outputIdentifier);
        (src?.data?.outputs ?? []).forEach(
          (o: any) => o?.identifier && known.add(o.identifier),
        );
      });
      (node.data?.inputs ?? []).forEach(
        (i: any) => i?.outputIdentifier && known.add(i.outputIdentifier.trim()),
      );
      const referenced =
        String(node.data.condition).match(/[A-Za-z_]\w*/g) ?? [];
      const unknown = referenced.filter(
        (r) =>
          !known.has(r) &&
          !["and", "or", "not", "true", "false", "True", "False"].includes(r),
      );
      if (unknown.length) {
        warn(
          node,
          `Condition "${node.data.condition}" of ${nodeName(node)} refers to ${unknown.map((u) => `"${u}"`).join(", ")}, which is not a connected classical value.`,
        );
      }
    }

    // Configuration: multi-qubit gates act on registers of equal size.
    if (spec.equalQuantumInputSizes) {
      const sizes = spec.inputs
        .filter((port) => portKind(port) === "quantum")
        .map((port) => {
          const edge = incoming.find(
            (e) => e.targetHandle === port.targetHandle(node.id),
          );
          return {
            port,
            size: edge ? registerSize(edge, nodesById, validEdges) : undefined,
          };
        })
        .filter(
          (s): s is { port: typeof s.port; size: number } =>
            s.size !== undefined,
        );
      if (new Set(sizes.map((s) => s.size)).size > 1) {
        error(
          node,
          `${nodeName(node)} requires quantum inputs of equal size, but got ${sizes.map((s) => `"${s.port.label}" = ${s.size}`).join(", ")}.`,
        );
      }
    }

    spec
      .check?.(node, ctx)
      .forEach((d) => error(node, `${nodeName(node)}: ${d}`));
  });

  return { errors, warnings };
}
