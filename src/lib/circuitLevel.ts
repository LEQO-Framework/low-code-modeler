/**
 * Circuit-level view of low-code blocks: a block (e.g. QFT, Grover Oracle, Prepare State,
 * Basis Encoding, a quantum operator) is replaced by a group with the qubit and gate
 * nodes it compiles to, and the group collapses back into the original block.
 *
 *   compact:        … → [block] → …
 *   circuit level:  … → Splitter → [group: gates] → Merger → …
 *
 * The Splitter and Merger connect the gates to the registers of the neighbouring blocks
 * (a Splitter/Merger that already sits next to the block is reused instead). Classical
 * inputs whose values are compiled into the gates (e.g. the Number of a basis
 * encoding) disappear from the circuit level, so it only contains quantum nodes.
 *
 * The gates come from the compiled OpenQASM of the model (the section
 * "Start node <id>" … "End node <id>"), so they are exactly what the backend generates.
 * Prepare State and Basis Encoding do not need the compiled QASM (see
 * statePreparationGroups.ts). Grover's algorithm first opens as its building blocks.
 *
 * Not expanded: circuit primitives (gates, Qubit Circuit, MCMT, Splitter, Merger),
 * data types, templates and machine learning plugins.
 */

import { Edge, MarkerType, Node } from "reactflow";
import { v4 as uuid } from "uuid";
import {
  AlgorithmNode,
  DataTypeNode,
  DeutschJozsaNode,
  GroupNode,
  GroverDiffuserNode,
  GroverNode,
  InverseQFTNode,
  MergerNode,
  OperatorNode,
  QAOANode,
  QFTNode,
  SplitterNode,
  StatePreparationNode,
  UniversalOracleNode,
} from "@/constants";
import { parseQasm } from "@/components/utils/qasmToDirac";
import { detectGroverSegments } from "@/components/utils/groverSegments";
import { circuitSignature, qasmToNodes, type QasmNodes } from "./qasmToNodes";
import { expandGroverToSubprocess, readGroverSettings } from "./expandGrover";
import { expansionFor, isBasisEncoding } from "./statePreparationGroups";

/** Blocks that have a circuit level. */
const CIRCUIT_LEVEL_TYPES = new Set([
  StatePreparationNode,
  QFTNode,
  InverseQFTNode,
  DeutschJozsaNode,
  UniversalOracleNode,
  GroverDiffuserNode,
  GroverNode,
  QAOANode,
  OperatorNode,
  AlgorithmNode,
]);

export function hasCircuitLevel(node: Node | undefined): boolean {
  return !!node && CIRCUIT_LEVEL_TYPES.has(node.type ?? "");
}

/**
 * Grover, and Prepare State / Basis Encoding with a known circuit (Bell, GHZ, uniform
 * superposition, a basis-encoded number) expand without the compiled QASM.
 */
export function expandsWithoutQasm(
  node: Node,
  nodes: Node[],
  edges: Edge[],
): boolean {
  return (
    node.type === GroverNode ||
    (node.type === StatePreparationNode &&
      (node.data?.label === "Prepare State" || isBasisEncoding(node.data)) &&
      typeof expansionFor(node, nodes, edges) !== "string")
  );
}

/** Gates of a block in the compiled QASM (global qubit indices). */
export interface SectionGate {
  name: string;
  qubits: number[];
  params: number[];
  numControls?: number;
}

export interface NodeSection {
  gates: SectionGate[];
  /** Qubits (global) of each quantum input / output, in register order. */
  inputs: number[][];
  outputs: number[][];
}

/** Stored in data.circuitLevel of a circuit-level group. */
export interface CircuitLevelSnapshot {
  removedNodes: Node[];
  removedEdges: Edge[];
  /** How far the nodes right of the block were moved to make room. */
  dx: number;
  signature: string;
}

const baseData = {
  outputs: [],
  children: [],
  implementation: "",
  implementationType: "",
  uncomputeImplementationType: "",
  uncomputeImplementation: "",
  completionGuaranteed: true,
};

const quantumEdge = (
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): Edge => ({
  id: uuid(),
  source,
  sourceHandle,
  target,
  targetHandle,
  type: "quantumEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#93C5FD",
  },
});

const isQuantumHandle = (handle?: string | null) =>
  !!handle && (handle.startsWith("quantum") || handle.startsWith("ancilla"));

/** Handle ids end with "<index><nodeId>", and node ids may start with digits. */
function handleIndex(handle: string | null | undefined, nodeId: string) {
  if (!handle?.endsWith(nodeId)) return 0;
  const match = handle.slice(0, -nodeId.length).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

function descendantsOf(groupId: string, nodes: Node[]): Set<string> {
  const result = new Set<string>();
  const queue = [groupId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const n of nodes) {
      if (n.parentNode === current && !result.has(n.id)) {
        result.add(n.id);
        queue.push(n.id);
      }
    }
  }
  return result;
}

/** Sets the source of the data.inputs entry of `node` at `targetHandle`. */
function setInputSource(
  node: Node,
  targetHandle: string | null | undefined,
  sourceId: string,
): Node {
  if (!Array.isArray(node.data?.inputs)) return node;
  let changed = false;
  const inputs = node.data.inputs.map((input: any) => {
    if (!input || (targetHandle && input.targetHandle !== targetHandle))
      return input;
    if (!targetHandle && input.id !== sourceId) return input;
    changed = true;
    return { ...input, id: sourceId };
  });
  return changed ? { ...node, data: { ...node.data, inputs } } : node;
}

/** Width of a node on the canvas (measured if available). */
const widthOf = (n: Node, fallback = 320) =>
  (n.style?.width as number) ?? n.width ?? fallback;

// ---------------------------------------------------------------------------
// Compiled QASM of a block
// ---------------------------------------------------------------------------

/**
 * Reads the section of a block from the compiled OpenQASM: its gates and which qubits
 * its quantum inputs and outputs carry. Null if the block is not in the QASM.
 */
export function parseNodeSection(
  qasm: string,
  nodeId: string,
): NodeSection | null {
  const lines = qasm.split(/\r?\n/).map((l) => l.trim());
  const start = lines.findIndex((l) =>
    new RegExp(`^/\\*\\s*Start node ${nodeId}\\s*\\*/$`).test(l),
  );
  if (start < 0) return null;
  const end = lines.findIndex(
    (l, i) =>
      i > start && new RegExp(`^/\\*\\s*End node ${nodeId}\\s*\\*/$`).test(l),
  );
  const register =
    qasm.match(/^\s*qubit\[\d+\]\s+(\w+)\s*;/m)?.[1] ?? "leqo_reg";

  const aliases = new Map<string, number[]>();
  const resolvePart = (part: string): number[] | null => {
    const sliced = part.match(/^(\w+)\[\{([\d,\s]*)\}\]$/);
    if (sliced) {
      const indices = sliced[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      if (sliced[1] === register) return indices;
      const base = aliases.get(sliced[1]);
      return base ? indices.map((i) => base[i]) : null;
    }
    const single = part.match(/^(\w+)\[(\d+)\]$/);
    if (single) {
      const i = Number(single[2]);
      if (single[1] === register) return [i];
      const base = aliases.get(single[1]);
      return base && base[i] !== undefined ? [base[i]] : null;
    }
    return aliases.get(part) ?? null;
  };
  const resolve = (expr: string): number[] | null => {
    const parts = expr.split("++").map((p) => p.trim());
    const result: number[] = [];
    for (const part of parts) {
      const qubits = resolvePart(part);
      if (!qubits) return null;
      result.push(...qubits);
    }
    return result;
  };

  const inputs: number[][] = [];
  const outputs: number[][] = [];
  let pending: { kind: "input" | "output"; index: number } | null = null;
  for (const line of lines.slice(start + 1, end < 0 ? undefined : end)) {
    const annotation = line.match(/^@leqo\.(input|output)\s+(\d+)/);
    if (annotation) {
      pending = {
        kind: annotation[1] as "input" | "output",
        index: Number(annotation[2]),
      };
      continue;
    }
    const alias = line.match(/^let\s+(\w+)\s*=\s*(.+?)\s*;$/);
    if (!alias) continue;
    const qubits = resolve(alias[2]);
    if (qubits) aliases.set(alias[1], qubits);
    if (pending && qubits) {
      (pending.kind === "input" ? inputs : outputs)[pending.index] = qubits;
    }
    pending = null;
  }

  const gates = parseQasm(qasm)
    .gates.filter((g) => g.nodeId === nodeId)
    .map((g) => ({
      name: g.name,
      qubits: g.qubits,
      params: g.params,
      numControls: g.numControls,
    }));
  return { gates, inputs, outputs };
}

/** Gate names that have a node on the canvas. */
const CANVAS_GATES = new Set([
  "id",
  "h",
  "x",
  "y",
  "z",
  "s",
  "sdg",
  "t",
  "tdg",
  "rx",
  "ry",
  "rz",
  "cx",
  "cnot",
  "cy",
  "cz",
  "ch",
  "swap",
  "ccx",
  "toffoli",
  "cswap",
  "crx",
  "cry",
  "crz",
  "p",
  "cp",
  "u1",
  "u2",
  "u3",
]);
const MULTI_CONTROLLED_BASES = new Set(["x", "y", "z", "h"]);

function gateLine(gate: SectionGate, local: Map<number, number>): string {
  const qubits = gate.qubits.map((q) => `q[${local.get(q)}]`).join(", ");
  if (gate.name.startsWith("mc_")) {
    return `ctrl(${gate.numControls ?? 1}) @ ${gate.name.slice(3)} ${qubits};`;
  }
  const params = gate.params.length ? `(${gate.params.join(", ")})` : "";
  return `${gate.name}${params} ${qubits};`;
}

/**
 * Builds the circuit-level group of a block from its compiled gates. Returns a message
 * if the gates cannot be shown as nodes (e.g. custom gate definitions, measurements).
 */
export function expandNodeFromSection(
  node: Node,
  nodes: Node[],
  edges: Edge[],
  section: NodeSection,
):
  | { nodes: Node[]; edges: Edge[]; groupId: string; gateNodeIds: string[] }
  | string {
  if (section.gates.length === 0) {
    return "This block compiles to no gates, there is no circuit to show.";
  }
  const unsupported = section.gates.find((g) =>
    g.name.startsWith("mc_")
      ? !MULTI_CONTROLLED_BASES.has(g.name.slice(3))
      : !CANVAS_GATES.has(g.name),
  );
  if (unsupported) {
    return unsupported.name === "measure"
      ? "This block contains a measurement and cannot be shown as gates."
      : `This block compiles to "${unsupported.name}", which has no gate node on the canvas.`;
  }

  // local qubit order: the registers of the inputs, then outputs, then the rest
  const order: number[] = [];
  const add = (q: number) => {
    if (!order.includes(q)) order.push(q);
  };
  section.inputs.flat().forEach(add);
  section.outputs.flat().forEach(add);
  [...new Set(section.gates.flatMap((g) => g.qubits))]
    .sort((a, b) => a - b)
    .forEach(add);
  const local = new Map(order.map((q, i) => [q, i]));

  const qasm = [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    `qubit[${order.length}] q;`,
    "",
    ...section.gates.map((g) => gateLine(g, local)),
  ].join("\n");
  // classical inputs: values of data type blocks are compiled into the gates, so these
  // blocks are not needed on the circuit level; values computed at runtime are
  const classicalSources = edges
    .filter((e) => e.target === node.id && !isQuantumHandle(e.targetHandle))
    .map((e) => nodes.find((n) => n.id === e.source));
  if (classicalSources.some((n) => n?.type !== DataTypeNode)) {
    return "This block gets a classical value computed while the circuit runs, so it has no fixed gates.";
  }
  const extraRemoved = classicalSources
    .filter((n) =>
      edges
        .filter((e) => e.source === n!.id)
        .every((e) => e.target === node.id),
    )
    .map((n) => n!.id);

  const built = qasmToNodes(qasm, { recognizeStates: false });
  const toLocal = (qubits: number[] | undefined) =>
    qubits?.map((q) => local.get(q)!);

  return buildCircuitLevel(node, nodes, edges, {
    built,
    label: `${blockTitle(node)} · circuit level`,
    inputs: section.inputs.map(toLocal) as number[][],
    outputs: section.outputs.map(toLocal) as number[][],
    allQubits: order.map((_, i) => i),
    extraRemoved,
  });
}

function blockTitle(node: Node): string {
  const d = node.data ?? {};
  if (d.label === "Prepare State" && d.quantumStateName)
    return d.quantumStateName;
  if (d.label === "Encode Value" && d.encodingType) return d.encodingType;
  return d.label ?? "Block";
}

// ---------------------------------------------------------------------------
// Replacing a block by its circuit and back
// ---------------------------------------------------------------------------

interface BuildOptions {
  built: QasmNodes;
  label: string;
  /** Local qubit indices carried by each quantum input / output of the block. */
  inputs: number[][];
  outputs: number[][];
  /** Fallback register for an input/output without known qubits. */
  allQubits: number[];
  /** Further nodes that disappear, e.g. a classical Number feeding only this block. */
  extraRemoved?: string[];
  position?: { x: number; y: number };
}

const SPLITTER_WIDTH = 220;

/**
 * Replaces `compact` by the built circuit: wraps it in a group (or uses the group that
 * the built nodes already have) and connects it to the neighbouring nodes.
 */
export function buildCircuitLevel(
  compact: Node,
  nodes: Node[],
  edges: Edge[],
  options: BuildOptions,
): { nodes: Node[]; edges: Edge[]; groupId: string; gateNodeIds: string[] } {
  const { built } = options;
  const removed = new Set([compact.id, ...(options.extraRemoved ?? [])]);
  const parentNode = compact.parentNode;
  const parent = parentNode ? { parentNode } : {};
  const origin = options.position ?? compact.position;

  let group = built.nodes.find((n) => n.type === GroupNode);
  let inner = built.nodes.filter((n) => n.type !== GroupNode);
  let innerEdges = [...built.edges];
  const groupId = group?.id ?? uuid();
  // the source of every qubit and where it ends inside the group
  const ends = built.lastHandles.map((h) => ({ ...h }));
  const interfaceNodes: Node[] = [];
  const newEdges: Edge[] = [];
  let outside = nodes;

  // inputs: the qubits come from the register of the previous block
  const incoming = edges.filter(
    (e) => e.target === compact.id && isQuantumHandle(e.targetHandle),
  );
  for (const e of incoming) {
    const k = handleIndex(e.targetHandle, compact.id);
    const qubits = options.inputs[k] ?? (k === 0 ? options.allQubits : null);
    if (!qubits?.length) continue;

    const source = nodes.find((n) => n.id === e.source);
    let sources: { nodeId: string; handle: string }[];
    const mergerEdges = edges.filter((x) => x.target === e.source);
    if (
      source?.type === MergerNode &&
      !source.data?.circuitLevelOf &&
      edges.filter((x) => x.source === source.id).length === 1 &&
      mergerEdges.length === qubits.length
    ) {
      // the qubits were merged right before the block: take them from there
      removed.add(source.id);
      sources = qubits.map((_, j) => {
        const me = mergerEdges.find(
          (x) => handleIndex(x.targetHandle, source.id) === j,
        )!;
        return { nodeId: me.source, handle: me.sourceHandle! };
      });
    } else if (qubits.length === 1) {
      // a single qubit needs no Splitter (the backend requires at least two outputs)
      sources = [{ nodeId: e.source, handle: e.sourceHandle! }];
    } else {
      const splitterId = uuid();
      const splitterIn = quantumEdge(
        e.source,
        e.sourceHandle!,
        splitterId,
        `quantumHandleSplitterInput0${splitterId}`,
      );
      interfaceNodes.push({
        id: splitterId,
        type: SplitterNode,
        position: { x: origin.x, y: origin.y + 60 },
        ...parent,
        data: {
          ...baseData,
          label: "Splitter",
          description: "Splits register.",
          icon: "Splitter_palette.png",
          compactOptions: [true, false],
          numberOutputs: String(qubits.length),
          identifiers: qubits.map((q) => `q${q}`),
          inputTypes: ["any"],
          outputTypes: [],
          inputs: [
            {
              id: e.source,
              edgeId: splitterIn.id,
              identifiers: [],
              targetHandle: splitterIn.targetHandle,
            },
          ],
          circuitLevelOf: groupId,
          circuitLevelHandle: e.targetHandle,
        },
      });
      newEdges.push(splitterIn);
      sources = qubits.map((_, j) => ({
        nodeId: splitterId,
        handle: `quantumHandleSplitterOutput${j}${splitterId}`,
      }));
    }

    // the qubit nodes of these qubits are replaced by the incoming qubits
    qubits.forEach((l, j) => {
      const qubitNode = built.qubitNodeIds[l];
      const from = sources[j];
      innerEdges = innerEdges.flatMap((ie) => {
        if (ie.source !== qubitNode) return [ie];
        inner = inner.map((n) =>
          n.id === ie.target
            ? setInputSource(n, ie.targetHandle, from.nodeId)
            : n,
        );
        newEdges.push({
          ...ie,
          source: from.nodeId,
          sourceHandle: from.handle,
        });
        return [];
      });
      inner = inner.filter((n) => n.id !== qubitNode);
      if (ends[l].nodeId === qubitNode) ends[l] = { ...from };
    });
  }

  // outputs: the qubits continue as the register of the next block
  const outgoing = edges.filter(
    (e) => e.source === compact.id && isQuantumHandle(e.sourceHandle),
  );
  const mergerByOutput = new Map<number, string>();
  for (const e of outgoing) {
    const o = handleIndex(e.sourceHandle, compact.id);
    const qubits = options.outputs[o] ?? (o === 0 ? options.allQubits : null);
    if (!qubits?.length) continue;
    const target = nodes.find((n) => n.id === e.target);
    const splitterOut = edges.filter((x) => x.source === e.target);
    if (
      target?.type === SplitterNode &&
      !target.data?.circuitLevelOf &&
      edges.filter((x) => x.target === target.id).length === 1 &&
      splitterOut.every(
        (x) => handleIndex(x.sourceHandle, target.id) < qubits.length,
      )
    ) {
      // the register is split right after the block: connect the qubits directly
      removed.add(target.id);
      for (const se of splitterOut) {
        const end = ends[qubits[handleIndex(se.sourceHandle, target.id)]];
        newEdges.push({ ...se, source: end.nodeId, sourceHandle: end.handle });
        outside = outside.map((n) =>
          n.id === se.target
            ? setInputSource(n, se.targetHandle, end.nodeId)
            : n,
        );
      }
      continue;
    }

    if (qubits.length === 1) {
      // a single qubit needs no Merger (the backend requires at least two inputs)
      const end = ends[qubits[0]];
      newEdges.push({ ...e, source: end.nodeId, sourceHandle: end.handle });
      outside = outside.map((n) =>
        n.id === e.target ? setInputSource(n, e.targetHandle, end.nodeId) : n,
      );
      continue;
    }

    let mergerId = mergerByOutput.get(o);
    if (!mergerId) {
      mergerId = uuid();
      mergerByOutput.set(o, mergerId);
      const inEdges = qubits.map((l, j) =>
        quantumEdge(
          ends[l].nodeId,
          ends[l].handle,
          mergerId!,
          `quantumHandleMergerInput${j}${mergerId}`,
        ),
      );
      interfaceNodes.push({
        id: mergerId,
        type: MergerNode,
        position: { x: 0, y: origin.y + 60 }, // x is set below
        ...parent,
        data: {
          ...baseData,
          label: "Merger",
          description: "Merges qubits.",
          icon: "Merger_palette.png",
          compactOptions: [true, false],
          numberInputs: String(qubits.length),
          identifiers: qubits.map((l) => `q${l}`),
          inputTypes: qubits.map(() => "any"),
          outputTypes: [],
          inputs: inEdges.map((ie) => ({
            id: ie.source,
            edgeId: ie.id,
            identifiers: [],
            targetHandle: ie.targetHandle,
          })),
          circuitLevelOf: groupId,
          circuitLevelHandle: e.sourceHandle,
        },
      });
      newEdges.push(...inEdges);
    }
    newEdges.push({
      ...e,
      source: mergerId,
      sourceHandle: `quantumHandleMergerOutput0${mergerId}`,
    });
    outside = outside.map((n) =>
      n.id === e.target ? setInputSource(n, e.targetHandle, mergerId!) : n,
    );
  }

  // group around the circuit, positioned where the block was
  const hasSplitter = interfaceNodes.some((n) => n.type === SplitterNode);
  const groupX = origin.x + (hasSplitter ? SPLITTER_WIDTH : 0);
  const topLevel = inner.filter(
    (n) => !n.parentNode || n.parentNode !== groupId,
  );
  if (!group) {
    const minX = Math.min(...topLevel.map((n) => n.position.x)) - 30;
    const minY = Math.min(...topLevel.map((n) => n.position.y)) - 50;
    const maxX = Math.max(...topLevel.map((n) => n.position.x + 110)) + 30;
    const maxY =
      Math.max(
        ...topLevel.map(
          (n) =>
            n.position.y + 110 * Math.max(1, n.data?.identifiers?.length ?? 1),
        ),
      ) + 30;
    inner = inner.map((n) => ({
      ...n,
      parentNode: groupId,
      position: { x: n.position.x - minX, y: n.position.y - minY },
    }));
    group = {
      id: groupId,
      type: GroupNode,
      position: { x: 0, y: 0 },
      style: { width: maxX - minX, height: maxY - minY },
      data: { label: options.label, collapsed: false, isGroup: true },
      draggable: true,
      selectable: true,
      zIndex: -1,
    };
  }
  const groupWidth = widthOf(group, 400);
  for (const n of interfaceNodes) {
    if (n.type === MergerNode) n.position.x = groupX + groupWidth + 60;
  }
  const totalWidth =
    groupX -
    origin.x +
    groupWidth +
    (mergerByOutput.size > 0 ? 60 + SPLITTER_WIDTH : 0);
  const dx = Math.max(0, totalWidth - widthOf(compact));

  const removedNodes = nodes.filter((n) => removed.has(n.id));
  const removedEdges = edges.filter(
    (e) => removed.has(e.source) || removed.has(e.target),
  );
  group = {
    ...group,
    position: { x: groupX, y: origin.y },
    ...parent,
    data: {
      ...group.data,
      label: group.data?.statePreparation ? group.data.label : options.label,
      circuitLevel: {
        removedNodes: structuredClone(removedNodes),
        removedEdges: structuredClone(removedEdges),
        dx,
        signature: circuitSignature(inner),
      } satisfies CircuitLevelSnapshot,
    },
  };

  // make room: move the nodes right of the block, and widen its parent group
  outside = outside
    .filter((n) => !removed.has(n.id))
    .map((n) => {
      if (n.id === parentNode && dx > 0) {
        return {
          ...n,
          style: { ...n.style, width: widthOf(n, 400) + dx },
        };
      }
      return n.parentNode === parentNode &&
        n.position.x > compact.position.x &&
        dx > 0
        ? { ...n, position: { ...n.position, x: n.position.x + dx } }
        : n;
    });

  const keptEdges = edges.filter(
    (e) => !removed.has(e.source) && !removed.has(e.target),
  );
  return {
    // React Flow requires a parent to come before its children
    nodes: [...outside, group, ...inner, ...interfaceNodes],
    edges: [...keptEdges, ...newEdges, ...innerEdges],
    groupId,
    gateNodeIds: built.gateNodeIds.filter((id) =>
      inner.some((n) => n.id === id),
    ),
  };
}

/** True if the circuit inside a circuit-level group was edited after it was opened. */
export function circuitLevelChanged(group: Node, nodes: Node[]): boolean {
  const snapshot: CircuitLevelSnapshot | undefined = group.data?.circuitLevel;
  if (!snapshot) return false;
  const inside = descendantsOf(group.id, nodes);
  return (
    circuitSignature(nodes.filter((n) => inside.has(n.id))) !==
    snapshot.signature
  );
}

/**
 * Collapses a circuit-level group back into the block(s) it was opened from, with their
 * settings and connections.
 */
export function restoreCompactModel(
  group: Node,
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const snapshot: CircuitLevelSnapshot = group.data.circuitLevel;
  const inside = descendantsOf(group.id, nodes);
  inside.add(group.id);
  for (const n of nodes) {
    if (n.data?.circuitLevelOf === group.id) inside.add(n.id);
  }
  const restored = snapshot.removedNodes.map((n) => structuredClone(n));
  const compact = restored.find(
    (n) =>
      n.type !== DataTypeNode &&
      n.type !== SplitterNode &&
      n.type !== MergerNode,
  );
  const { dx } = snapshot;
  const parentNode = group.parentNode;

  let others = nodes
    .filter((n) => !inside.has(n.id))
    .map((n) => {
      if (n.id === parentNode && dx > 0) {
        return { ...n, style: { ...n.style, width: widthOf(n, 400) - dx } };
      }
      return compact &&
        n.parentNode === parentNode &&
        n.position.x > compact.position.x &&
        dx > 0
        ? { ...n, position: { ...n.position, x: n.position.x - dx } }
        : n;
    });

  const exists = new Set([...others, ...restored].map((n) => n.id));
  const result: Edge[] = edges.filter(
    (e) => !inside.has(e.source) && !inside.has(e.target),
  );
  const taken = new Set(result.map((e) => `${e.target}|${e.targetHandle}`));
  const push = (e: Edge) => {
    const key = `${e.target}|${e.targetHandle}`;
    if (taken.has(key) || !exists.has(e.source) || !exists.has(e.target))
      return;
    taken.add(key);
    result.push(e);
    others = others.map((n) =>
      n.id === e.target ? setInputSource(n, e.targetHandle, e.source) : n,
    );
  };

  // connections made to the circuit level meanwhile go back to the block
  if (compact) {
    for (const e of edges) {
      const source = nodes.find((n) => n.id === e.source);
      const target = nodes.find((n) => n.id === e.target);
      if (target?.data?.circuitLevelOf === group.id && !inside.has(e.source)) {
        push({
          ...e,
          target: compact.id,
          targetHandle: target.data.circuitLevelHandle,
        });
      } else if (
        source?.data?.circuitLevelOf === group.id &&
        source.type === MergerNode &&
        !inside.has(e.target)
      ) {
        push({
          ...e,
          source: compact.id,
          sourceHandle: source.data.circuitLevelHandle,
        });
      }
    }
  }
  // and the original connections of the restored nodes
  snapshot.removedEdges.forEach((e) => push(structuredClone(e)));

  return { nodes: [...others, ...restored], edges: result };
}

// ---------------------------------------------------------------------------
// Prepare State / Basis Encoding
// ---------------------------------------------------------------------------

/**
 * Expands a Prepare State or Basis Encoding block into the circuit-level group (no
 * compiled QASM needed: the circuit is the one the backend generates).
 */
export function expandStatePreparation(
  compact: Node,
  nodes: Node[],
  edges: Edge[],
):
  | { nodes: Node[]; edges: Edge[]; groupId: string; gateNodeIds: string[] }
  | string {
  const expansion = expansionFor(compact, nodes, edges);
  if (typeof expansion === "string") return expansion;
  const built = qasmToNodes(expansion.qasm, { asState: expansion.state });
  const all = built.qubitNodeIds.map((_, i) => i);
  return buildCircuitLevel(compact, nodes, edges, {
    built,
    label: expansion.state.label,
    inputs: [],
    outputs: [all],
    allQubits: all,
    extraRemoved: expansion.removeIds.filter((id) => id !== compact.id),
    position: expansion.position,
  });
}

// ---------------------------------------------------------------------------
// Opening a block (canvas, context menu) and following a step (Math Mode)
// ---------------------------------------------------------------------------

export type Expanded = {
  nodes: Node[];
  edges: Edge[];
  /** Per step of the block's section: the node that shows it after opening. */
  stepNodeIds: string[];
  /** Blocks inside the opened block that can be opened further, with their gates. */
  inner?: { blockId: string; start: number; section: NodeSection }[];
};

/**
 * Opens a block one level: Grover into its building blocks, every other block into its
 * gates. `qasm` is the compiled model; it is only needed for blocks whose circuit is not
 * known in advance.
 */
export function openBlock(
  node: Node,
  nodes: Node[],
  edges: Edge[],
  qasm: string | null,
  section?: NodeSection | null,
): Expanded | string {
  if (node.type === GroverNode) {
    const settings = readGroverSettings(node.data ?? {});
    if (typeof settings === "string") return settings;
    const result = expandGroverToSubprocess(node, nodes, edges, settings);
    const blocks = result.nodes.filter((n) => n.parentNode === result.groupId);
    const own = section ?? (qasm ? parseNodeSection(qasm, node.id) : null);
    const segments = own ? detectGroverSegments(own.gates) : null;
    const stepNodeIds: string[] = [];
    const inner: Expanded["inner"] = [];
    if (own && segments) {
      const register = own.outputs[0] ?? [
        ...new Set(own.gates.flatMap((g) => g.qubits)),
      ];
      for (const seg of segments) {
        const blockIndex =
          seg.kind === "superposition"
            ? 0
            : seg.kind === "oracle"
              ? 2 * (seg.iteration ?? 1) - 1
              : 2 * (seg.iteration ?? 1);
        const block = blocks[blockIndex];
        if (!block) continue;
        for (let k = seg.start; k <= seg.end; k++) stepNodeIds[k] = block.id;
        inner.push({
          blockId: block.id,
          start: seg.start,
          section: {
            gates: own.gates.slice(seg.start, seg.end + 1),
            inputs: seg.kind === "superposition" ? [] : [register],
            outputs: [register],
          },
        });
      }
    }
    return {
      nodes: result.nodes,
      edges: result.edges,
      stepNodeIds,
      inner,
    };
  }

  const own = section ?? (qasm ? parseNodeSection(qasm, node.id) : null);
  // a known state becomes its labelled group (e.g. "Bell state Φ⁺"), as long as its
  // gates match the compiled steps one to one; otherwise the compiled gates are used
  const asState = expandsWithoutQasm(node, nodes, edges)
    ? expandStatePreparation(node, nodes, edges)
    : null;
  const result =
    asState &&
    typeof asState !== "string" &&
    (!own || asState.gateNodeIds.length === own.gates.length)
      ? asState
      : own
        ? expandNodeFromSection(node, nodes, edges, own)
        : "Compile the model first: the circuit of this block comes from the compiled OpenQASM.";
  if (typeof result === "string") return result;
  return {
    nodes: result.nodes,
    edges: result.edges,
    stepNodeIds: result.gateNodeIds,
  };
}

/**
 * What Math Mode remembers about the blocks it opened on the canvas, so that steps that
 * still refer to an opened block (until the model is recompiled) find its gates.
 */
export interface OpenedBlocks {
  /** block id → node showing each of its steps */
  steps: Map<string, string[]>;
  /** blocks inside opened blocks that can be opened further */
  inner: Map<string, { owner: string; start: number; section: NodeSection }>;
}

export function createOpenedBlocks(): OpenedBlocks {
  return { steps: new Map(), inner: new Map() };
}

/**
 * Follows a clicked step onto the canvas: opens the block of the step (and, e.g. for
 * Grover, the building block inside it) down to the gate level, and returns the nodes
 * to highlight.
 *
 * `clicked.from`..`clicked.to` are the step indices within the block to highlight;
 * `others` are the further node ids of earlier steps.
 */
export function followStep(
  opened: OpenedBlocks,
  nodes: Node[],
  edges: Edge[],
  qasm: string | null,
  clicked: { nodeId: string; from: number; to: number },
  others: string[],
): { nodes: Node[]; edges: Edge[]; changed: boolean; highlight: string[] } {
  let current = { nodes, edges };
  let changed = false;
  const { nodeId } = clicked;

  if (!opened.steps.has(nodeId)) {
    const node = nodes.find((n) => n.id === nodeId);
    const own = qasm ? parseNodeSection(qasm, nodeId) : null;
    if (node && hasCircuitLevel(node)) {
      const result = openBlock(node, nodes, edges, qasm, own);
      if (typeof result !== "string") {
        current = result;
        changed = true;
        const count = own?.gates.length ?? result.stepNodeIds.length;
        opened.steps.set(
          nodeId,
          Array.from(
            { length: Math.max(count, result.stepNodeIds.length) },
            (_, k) =>
              result.stepNodeIds[k] ?? result.stepNodeIds.at(-1) ?? nodeId,
          ),
        );
        for (const i of result.inner ?? []) {
          opened.inner.set(i.blockId, {
            owner: nodeId,
            start: i.start,
            section: i.section,
          });
        }
      }
    }
  }

  const steps = opened.steps.get(nodeId);
  if (steps) {
    // go inside the building block if the highlighted steps all lie in it
    const targets = new Set(steps.slice(clicked.from, clicked.to + 1));
    const [only] = [...targets];
    const inner = targets.size === 1 ? opened.inner.get(only) : undefined;
    const block = inner && current.nodes.find((n) => n.id === only);
    if (inner && block) {
      // building blocks of a subprocess are opened like any block (Prepare State
      // without QASM, the others from the gates of their part of the section)
      const result = openBlock(
        block,
        current.nodes,
        current.edges,
        qasm,
        expandsWithoutQasm(block, current.nodes, current.edges)
          ? null
          : inner.section,
      );
      if (typeof result !== "string") {
        current = result;
        changed = true;
        opened.inner.delete(only);
        for (let k = 0; k < inner.section.gates.length; k++) {
          steps[inner.start + k] =
            result.stepNodeIds[k] ?? result.stepNodeIds.at(-1) ?? only;
        }
      }
    }
  }

  const resolve = (id: string) => opened.steps.get(id) ?? [id];
  const highlight = [
    ...others.flatMap(resolve),
    ...(steps ? steps.slice(clicked.from, clicked.to + 1) : [nodeId]),
  ];
  return { ...current, changed, highlight: [...new Set(highlight)] };
}
