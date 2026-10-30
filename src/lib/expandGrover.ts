/**
 * Expands a compact "Grover's Search Algorithm" node into a subprocess and collapses it
 * back. The subprocess is a group named "Grover Search Algorithm" that contains the
 * equivalent building blocks from the palette, wired like the "Grover - Building Blocks"
 * template:
 *
 *   Prepare State (Uniform Superposition) → [Grover Oracle → Grover Diffuser] × k
 *
 * The backend builds both variants the same way (phase oracle, q0 = least significant
 * bit, same diffuser), so the expanded model computes the same circuit. The group keeps
 * a snapshot of the compact node, so collapsing restores it (same id, data and outgoing
 * connections), taking over the settings edited inside the subprocess.
 */

import { Edge, MarkerType, Node } from "reactflow";
import { v4 as uuid } from "uuid";
import {
  GroupNode,
  GroverDiffuserNode,
  GroverNode,
  StatePreparationNode,
  UniversalOracleNode,
} from "@/constants";

export const GROVER_SUBPROCESS_LABEL = "Grover Search Algorithm";

/** Horizontal distance between the generated blocks. */
const SPACING_X = 400;
/** Padding of the blocks inside the group (the group header is 36px high). */
const PADDING_X = 30;
const PADDING_TOP = 60;
const PADDING_BOTTOM = 30;
/** Size of the compact Grover node and the tallest block (Prepare State). */
const GROVER_WIDTH = 320;
const BLOCK_WIDTH = 320;
const BLOCK_HEIGHT = 460;

/** Same formula as the backend when the Grover node has no iteration count. */
export function optimalGroverIterations(
  numQubits: number,
  marked: number,
): number {
  const N = 2 ** numQubits;
  if (marked === 0 || marked === N) return 0;
  return Math.max(
    1,
    Math.round(Math.PI / (4 * Math.asin(Math.sqrt(marked / N))) - 0.5),
  );
}

export interface GroverSettings {
  numQubits: number;
  markedStates: number[];
  iterations: number;
}

/** Reads the Grover node settings; returns an error message if they cannot be expanded. */
export function readGroverSettings(
  data: Record<string, any>,
): GroverSettings | string {
  const numQubits = parseInt(String(data.numQubits ?? ""), 10);
  if (!Number.isInteger(numQubits) || numQubits < 2) {
    return "Set the number of qubits (at least 2) first.";
  }
  const raw = String(data.targetStates ?? "");
  if (/[a-zA-Z]/.test(raw)) {
    return "Replace the placeholder in the marked states with numbers first.";
  }
  const markedStates = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((s) => !Number.isNaN(s));
  if (markedStates.length === 0) return "Enter the marked states first.";
  if (markedStates.some((s) => s < 0 || s >= 2 ** numQubits)) {
    return "A marked state is outside the qubit range.";
  }
  const explicit = parseInt(String(data.numIterations ?? ""), 10);
  const iterations = Number.isNaN(explicit)
    ? optimalGroverIterations(numQubits, new Set(markedStates).size)
    : explicit;
  return { numQubits, markedStates, iterations };
}

const outputHandle = (node: Node) =>
  `quantumHandle${node.type}Output0${node.id}`;

const quantumEdge = (source: Node, target: Node): Edge => ({
  id: uuid(),
  source: source.id,
  sourceHandle: outputHandle(source),
  target: target.id,
  targetHandle: `quantumHandleInput0${target.id}`,
  type: "quantumEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#93C5FD",
  },
});

const baseData = {
  outputs: [],
  children: [],
  implementation: "",
  implementationType: "",
  uncomputeImplementationType: "",
  uncomputeImplementation: "",
  completionGuaranteed: true,
};

/** Builds the chain of blocks (positions relative to the group) and its edges. */
function buildBlocks(
  settings: GroverSettings,
  groupId: string,
  identifiers: string[],
): { blocks: Node[]; edges: Edge[] } {
  const { numQubits, markedStates, iterations } = settings;
  const at = (i: number) => ({ x: PADDING_X + SPACING_X * i, y: PADDING_TOP });

  const prepare: Node = {
    id: uuid(),
    type: StatePreparationNode,
    position: at(0),
    parentNode: groupId,
    data: {
      ...baseData,
      label: "Prepare State",
      inputs: [],
      outputs: [{ identifier: "", size: String(numQubits) }],
      compactOptions: [true, false],
      description: "Initializes qubits into a specific quantum state.",
      icon: ["PaletteIcon_PrepareState.png", "PrepareState.png"],
      identifiers,
      quantumStateName: "Uniform Superposition",
      size: numQubits,
      outputIdentifier: "",
      inputTypes: [],
      outputTypes: ["quantum register"],
    },
  };

  const blocks: Node[] = [prepare];
  const edges: Edge[] = [];
  let previous = prepare;

  const connect = (target: Node) => {
    const edge = quantumEdge(previous, target);
    target.data.inputs = [
      {
        id: previous.id,
        edgeId: edge.id,
        outputIdentifier: "",
        identifiers,
        targetHandle: edge.targetHandle,
      },
    ];
    edges.push(edge);
    blocks.push(target);
    previous = target;
  };

  for (let i = 0; i < iterations; i++) {
    connect({
      id: uuid(),
      type: UniversalOracleNode,
      position: at(2 * i + 1),
      parentNode: groupId,
      data: {
        ...baseData,
        label: "Grover Oracle",
        compactOptions: [false, true],
        description:
          "Arbitrary Oracle defined by a Truth Table for Boolean or Phase evaluation.",
        icon: "PaletteIcon_Oracle.png",
        identifiers,
        inputTypes: ["quantum register"],
        outputTypes: { "0": "quantum register" },
        targetStates: markedStates.join(", "),
        mode: "phase",
      },
    });
    connect({
      id: uuid(),
      type: GroverDiffuserNode,
      position: at(2 * i + 2),
      parentNode: groupId,
      data: {
        ...baseData,
        label: "Grover Diffuser",
        compactOptions: [false, true],
        description:
          "Applies inversion about the mean for amplitude amplification.",
        icon: "PaletteIcon_GroverDiffuser.png",
        identifiers,
        inputTypes: ["quantum register"],
        outputTypes: { "0": "quantum register" },
      },
    });
  }

  return { blocks, edges };
}

/** Moves the nodes right of `x` (same parent) by `dx` to make or give back room. */
function shiftRight(
  nodes: Node[],
  parentNode: string | undefined,
  x: number,
  dx: number,
): Node[] {
  if (dx === 0) return nodes;
  return nodes.map((n) =>
    n.parentNode === parentNode && n.position.x > x
      ? { ...n, position: { ...n.position, x: n.position.x + dx } }
      : n,
  );
}

/** Replaces references to `fromId` in data.inputs / data.children with `toIds`. */
function replaceReferences(
  nodes: Node[],
  fromId: string,
  inputId: string,
  childIds: string[],
): Node[] {
  return nodes.map((n) => {
    let data = n.data;
    if (data?.inputs?.some((input: any) => input?.id === fromId)) {
      data = {
        ...data,
        inputs: data.inputs.map((input: any) =>
          input?.id === fromId ? { ...input, id: inputId } : input,
        ),
      };
    }
    if (data?.children?.includes(fromId)) {
      data = {
        ...data,
        children: [
          ...data.children.filter((c: string) => c !== fromId),
          ...childIds,
        ],
      };
    }
    return data === n.data ? n : { ...n, data };
  });
}

/**
 * Expands the compact Grover node into a "Grover Search Algorithm" subprocess group.
 * Connections leaving the Grover node now leave the last block of the subprocess.
 */
export function expandGroverToSubprocess(
  grover: Node,
  nodes: Node[],
  edges: Edge[],
  settings: GroverSettings,
): { nodes: Node[]; edges: Edge[]; groupId: string } {
  const groupId = uuid();
  const { blocks, edges: innerEdges } = buildBlocks(
    settings,
    groupId,
    grover.data?.identifiers ?? [],
  );

  // The last block takes over the Grover node's output (identifier and connections).
  const last = blocks[blocks.length - 1];
  if (grover.data?.outputs?.length) last.data.outputs = grover.data.outputs;

  const width =
    2 * PADDING_X + SPACING_X * (blocks.length - 1) + BLOCK_WIDTH;
  const height = PADDING_TOP + BLOCK_HEIGHT + PADDING_BOTTOM;

  const group: Node = {
    id: groupId,
    type: GroupNode,
    position: grover.position,
    ...(grover.parentNode ? { parentNode: grover.parentNode } : {}),
    style: { width, height },
    data: {
      label: GROVER_SUBPROCESS_LABEL,
      collapsed: false,
      color: "#6366f1",
      childCount: blocks.length,
      isGroup: true,
      // snapshot of the compact node, restored by collapseGroverSubprocess
      subprocess: {
        id: grover.id,
        type: grover.type,
        data: structuredClone(grover.data),
      },
    },
    draggable: true,
    selectable: true,
    zIndex: -1,
  };

  let others = nodes.filter((n) => n.id !== grover.id);
  others = shiftRight(
    others,
    grover.parentNode,
    grover.position.x,
    width - GROVER_WIDTH,
  );
  others = replaceReferences(others, grover.id, last.id, [groupId]);

  const keptEdges = edges
    .filter((e) => e.target !== grover.id)
    .map((e) =>
      e.source === grover.id
        ? { ...e, source: last.id, sourceHandle: outputHandle(last) }
        : e,
    );

  return {
    // React Flow requires a parent to come before its children
    nodes: [...others, group, ...blocks],
    edges: [...keptEdges, ...innerEdges],
    groupId,
  };
}

/** Returns the ids of all nodes nested (at any depth) in the given group. */
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

/**
 * True if the subprocess still consists only of the generated block types, i.e.
 * collapsing it does not discard anything the user added inside.
 */
export function subprocessHasOnlyGroverBlocks(
  group: Node,
  nodes: Node[],
): boolean {
  const inside = descendantsOf(group.id, nodes);
  return nodes
    .filter((n) => inside.has(n.id))
    .every((n) =>
      [StatePreparationNode, UniversalOracleNode, GroverDiffuserNode].includes(
        n.type ?? "",
      ),
    );
}

/**
 * Collapses a "Grover Search Algorithm" subprocess back into the compact Grover node.
 * Qubit count, marked states and the number of iterations edited inside the subprocess
 * are taken over; connections leaving the subprocess leave the Grover node again.
 */
export function collapseGroverSubprocess(
  group: Node,
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[]; groverId: string } {
  const snapshot = group.data.subprocess;
  const inside = descendantsOf(group.id, nodes);
  const children = nodes.filter((n) => inside.has(n.id));

  const data = { ...snapshot.data };
  const prepare = children.find((n) => n.type === StatePreparationNode);
  const oracles = children.filter((n) => n.type === UniversalOracleNode);
  const size = parseInt(String(prepare?.data?.size ?? ""), 10);
  if (Number.isInteger(size) && size > 0) data.numQubits = size;
  if (oracles[0]?.data?.targetStates !== undefined) {
    data.targetStates = String(oracles[0].data.targetStates);
  }
  // keep "Auto" unless the subprocess no longer has the automatic number of iterations
  const settings = readGroverSettings({ ...data, numIterations: "" });
  if (typeof settings === "string" || settings.iterations !== oracles.length) {
    data.numIterations = oracles.length;
  }

  const grover: Node = {
    id: snapshot.id,
    type: snapshot.type ?? GroverNode,
    position: group.position,
    ...(group.parentNode ? { parentNode: group.parentNode } : {}),
    data,
  };
  const groverHandle = `quantumHandle${grover.type}Output0${grover.id}`;

  // edges leaving the subprocess now leave the Grover node; internal edges disappear
  const isInside = (id: string) => inside.has(id) || id === group.id;
  const outgoing = edges.filter((e) => isInside(e.source) && !isInside(e.target));
  const keptEdges = edges
    .filter((e) => !isInside(e.source) && !isInside(e.target))
    .concat(
      outgoing.map((e) => ({
        ...e,
        source: grover.id,
        sourceHandle: groverHandle,
      })),
    );

  const groupWidth = (group.style?.width as number) ?? group.width ?? GROVER_WIDTH;
  let others = nodes.filter((n) => !isInside(n.id));
  others = shiftRight(
    others,
    group.parentNode,
    group.position.x,
    -(groupWidth - GROVER_WIDTH),
  );
  for (const child of children) {
    others = replaceReferences(others, child.id, grover.id, []);
  }
  others = replaceReferences(others, group.id, grover.id, [grover.id]);

  return { nodes: [...others, grover], edges: keptEdges, groverId: grover.id };
}
