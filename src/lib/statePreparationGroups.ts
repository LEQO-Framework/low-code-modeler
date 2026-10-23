/**
 * Switches a recognized state preparation between its two representations on the canvas:
 *
 *   expanded:  group "Bell state Φ⁺" with the qubit and gate nodes (circuit level, only
 *              quantum nodes)
 *   collapsed: compact low-code blocks, followed by a Splitter if the qubits continue:
 *              - Prepare State (Bell State φ+, GHZ, W-State, Uniform Superposition)
 *              - Number → Basis Encoding for a basis encoding
 *
 * The Splitter keeps the connection of each qubit. The compact block remembers the
 * circuit of the group, so expanding it restores that circuit; a block without a
 * remembered circuit (e.g. taken from the palette) expands into the same circuit the
 * backend generates for it (expandStatePreparation in circuitLevel.ts).
 */

import { Edge, MarkerType, Node } from "reactflow";
import { v4 as uuid } from "uuid";
import { DataTypeNode, SplitterNode, StatePreparationNode } from "@/constants";
import { circuitSignature } from "./qasmToNodes";
import {
  basisEncodingQasm,
  basisLabel,
  standardStatePreparationQasm,
  stateLabel,
  type RecognizedState,
} from "./recognizeStates";

export interface StatePreparationOutput {
  nodeId: string;
  handle: string;
  identifier: string;
}

/** Stored in data.statePreparation of a recognized group. */
export interface StatePreparationInfo {
  kind?: "prepare" | "basis";
  value?: number;
  quantumStateName: string;
  size: number;
  label: string;
  qasm: string;
  outputs: StatePreparationOutput[];
  signature: string;
}

/** Stored in data.expandableCircuit of a compact block made from a group. */
export interface ExpandableCircuit {
  kind?: "prepare" | "basis";
  quantumStateName: string;
  size: number;
  value?: number;
  qasm: string;
}

/** Widths of the compact blocks, for placing them next to each other. */
const PREPARE_WIDTH = 320;
const NUMBER_WIDTH = 450;
const GAP_X = 60;

const baseData = {
  outputs: [],
  children: [],
  implementation: "",
  implementationType: "",
  uncomputeImplementationType: "",
  uncomputeImplementation: "",
  completionGuaranteed: true,
};

const edgeTo = (
  kind: "quantum" | "classical",
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
  type: kind === "quantum" ? "quantumEdge" : "classicalEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: kind === "quantum" ? "#93C5FD" : "#F5A843",
  },
});

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

/** Points data.inputs entries of `node` that come from `fromId` (via `targetHandle`) to `toId`. */
function redirectInput(
  node: Node,
  fromId: string,
  toId: string,
  targetHandle?: string | null,
  identifiers?: string[],
): Node {
  if (!Array.isArray(node.data?.inputs)) return node;
  let changed = false;
  const inputs = node.data.inputs.map((input: any) => {
    if (
      input?.id !== fromId ||
      (targetHandle &&
        input.targetHandle &&
        input.targetHandle !== targetHandle)
    )
      return input;
    changed = true;
    return { ...input, id: toId, ...(identifiers ? { identifiers } : {}) };
  });
  return changed ? { ...node, data: { ...node.data, inputs } } : node;
}

/**
 * True if the circuit inside the group was changed after it was recognized, or the group
 * receives connections from outside. Collapsing then replaces something that may no
 * longer prepare the recognized state.
 */
export function statePreparationGroupChanged(
  group: Node,
  nodes: Node[],
  edges: Edge[],
): boolean {
  const info: StatePreparationInfo | undefined = group.data?.statePreparation;
  if (!info) return true;
  const inside = descendantsOf(group.id, nodes);
  const children = nodes.filter((n) => inside.has(n.id));
  const incoming = edges.some(
    (e) =>
      (inside.has(e.target) || e.target === group.id) &&
      !inside.has(e.source) &&
      e.source !== group.id,
  );
  return incoming || circuitSignature(children) !== info.signature;
}

/** Name of the compact form, for buttons and messages. */
export function compactFormName(info: { kind?: string }): string {
  return info.kind === "basis" ? "Number → Basis Encoding" : "Prepare State";
}

/**
 * Collapses a recognized group into its compact low-code blocks (plus a Splitter if
 * the qubits continue to other nodes).
 */
export function collapseStatePreparationGroup(
  group: Node,
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[]; compactId: string } {
  const info: StatePreparationInfo = group.data.statePreparation;
  const inside = descendantsOf(group.id, nodes);
  const isInside = (id: string) => inside.has(id) || id === group.id;
  const outgoing = edges.filter(
    (e) => isInside(e.source) && !isInside(e.target),
  );
  const identifiers = info.outputs.map((o) => o.identifier);
  const parent = group.parentNode ? { parentNode: group.parentNode } : {};
  const expandableCircuit: ExpandableCircuit = {
    kind: info.kind,
    quantumStateName: info.quantumStateName,
    size: info.size,
    value: info.value,
    qasm: info.qasm,
  };

  const added: Node[] = [];
  const keptEdges = edges.filter(
    (e) => !isInside(e.source) && !isInside(e.target),
  );
  // block whose quantum output is the prepared register
  let register: Node;
  let x = group.position.x;

  if (info.kind === "basis") {
    const number: Node = {
      id: uuid(),
      type: DataTypeNode,
      position: { ...group.position },
      ...parent,
      data: {
        ...baseData,
        label: "Number",
        inputs: [],
        compactOptions: [true, false],
        description:
          "Integer value (whole number) or floating-point number (decimal).",
        icon: "PaletteIcon_Number.png",
        identifiers: [],
        dataType: "number",
        value: String(info.value ?? 0),
        outputIdentifier: "",
        inputTypes: [],
        outputTypes: ["number"],
      },
    };
    x += NUMBER_WIDTH + GAP_X;
    const encodeId = uuid();
    const classical = edgeTo(
      "classical",
      number.id,
      `classicalHandleDataTypeOutput0${number.id}`,
      encodeId,
      `classicalHandleStatePreparationInput0${encodeId}`,
    );
    register = {
      id: encodeId,
      type: StatePreparationNode,
      position: { x, y: group.position.y },
      ...parent,
      data: {
        ...baseData,
        label: "Basis Encoding",
        inputs: [
          {
            id: number.id,
            edgeId: classical.id,
            outputIdentifier: "",
            targetHandle: classical.targetHandle,
            identifiers,
          },
        ],
        compactOptions: [false],
        description:
          "Encodes classical bits into computational basis quantum states.",
        icon: [
          "PaletteIcon_BasisEncoding.png",
          "PaletteIcon_Ancilla_BasisEncoding.png",
        ],
        identifiers,
        inputTypes: ["number"],
        outputTypes: ["quantum register"],
        encodingType: "Basis Encoding",
        expandableCircuit,
      },
    };
    added.push(number, register);
    keptEdges.push(classical);
  } else {
    register = {
      id: uuid(),
      type: StatePreparationNode,
      position: { ...group.position },
      ...parent,
      data: {
        ...baseData,
        label: "Prepare State",
        inputs: [],
        outputs: [{ identifier: "", size: String(info.size) }],
        compactOptions: [true, false],
        description: "Initializes qubits into a specific quantum state.",
        icon: ["PaletteIcon_PrepareState.png", "PrepareState.png"],
        identifiers,
        quantumStateName: info.quantumStateName,
        size: String(info.size),
        outputIdentifier: "",
        inputTypes: [],
        outputTypes: ["quantum register"],
        expandableCircuit,
      },
    };
    added.push(register);
  }

  let others = nodes.filter((n) => !isInside(n.id));

  if (outgoing.length > 0) {
    const splitterId = uuid();
    const inEdge = edgeTo(
      "quantum",
      register.id,
      `quantumHandle${StatePreparationNode}Output0${register.id}`,
      splitterId,
      `quantumHandleSplitterInput0${splitterId}`,
    );
    added.push({
      id: splitterId,
      type: SplitterNode,
      position: {
        x: x + PREPARE_WIDTH + GAP_X,
        y: group.position.y + 80,
      },
      ...parent,
      data: {
        ...baseData,
        label: "Splitter",
        description: "Splits register.",
        icon: "Splitter_palette.png",
        compactOptions: [true, false],
        numberOutputs: String(info.size),
        identifiers: [...identifiers],
        inputTypes: ["any"],
        outputTypes: [],
        inputs: [
          {
            id: register.id,
            edgeId: inEdge.id,
            identifiers,
            targetHandle: inEdge.targetHandle,
          },
        ],
      },
    });
    keptEdges.push(inEdge);

    for (const e of outgoing) {
      let k = info.outputs.findIndex(
        (o) => o.nodeId === e.source && o.handle === e.sourceHandle,
      );
      if (k < 0) k = info.outputs.findIndex((o) => o.nodeId === e.source);
      if (k < 0) k = 0;
      keptEdges.push({
        ...e,
        source: splitterId,
        sourceHandle: `quantumHandleSplitterOutput${k}${splitterId}`,
      });
      others = others.map((n) =>
        n.id === e.target
          ? redirectInput(n, e.source, splitterId, e.targetHandle)
          : n,
      );
    }
  }

  return {
    nodes: [...others, ...added],
    edges: keptEdges,
    compactId: register.id,
  };
}

/** True for the Basis Encoding block and Encode Value set to basis encoding. */
export function isBasisEncoding(data: Record<string, any>): boolean {
  return (
    data?.label === "Basis Encoding" ||
    (data?.label === "Encode Value" &&
      String(data.encodingType ?? "")
        .toLowerCase()
        .includes("basis"))
  );
}

export interface Expansion {
  qasm: string;
  state: RecognizedState;
  /** Nodes that disappear in the circuit-level view (e.g. the classical Number). */
  removeIds: string[];
  position: { x: number; y: number };
}

/**
 * What a compact block expands into, or a message why it cannot be expanded.
 */
export function expansionFor(
  node: Node,
  nodes: Node[],
  edges: Edge[],
): Expansion | string {
  const data = node.data ?? {};
  const remembered: ExpandableCircuit | undefined = data.expandableCircuit;

  if (isBasisEncoding(data)) {
    const inputs = edges.filter((e) => e.target === node.id);
    const source = nodes.find(
      (n) => n.id === inputs[0]?.source && n.type === DataTypeNode,
    );
    const value = Number(source?.data?.value);
    if (inputs.length !== 1 || !source) {
      return "Connect a Number block with the value to encode first.";
    }
    const qasm = basisEncodingQasm(value);
    if (!qasm) return "Only whole numbers ≥ 1 can be shown as a circuit.";
    // the Number block goes as well, unless it feeds other blocks too
    const numberOnlyHere = edges
      .filter((e) => e.source === source.id)
      .every((e) => e.target === node.id);
    const size = value.toString(2).length;
    return {
      qasm:
        remembered?.kind === "basis" && remembered.value === value
          ? remembered.qasm
          : qasm,
      state: {
        kind: "basis",
        quantumStateName: "Basis Encoding",
        label: basisLabel(value),
        size,
        value,
      },
      removeIds: numberOnlyHere ? [node.id, source.id] : [node.id],
      position: numberOnlyHere ? { ...source.position } : { ...node.position },
    };
  }

  if (data.label !== "Prepare State") return "This block does not expand.";
  const name = String(data.quantumStateName ?? "Bell State φ+");
  const size = name.startsWith("Bell")
    ? 2
    : parseInt(String(data.size ?? ""), 10);
  const state: RecognizedState = {
    kind: "prepare",
    quantumStateName: name,
    label: stateLabel(name, size),
    size,
  };
  const base = { state, removeIds: [node.id], position: { ...node.position } };
  if (
    remembered &&
    remembered.quantumStateName === name &&
    remembered.size === size
  ) {
    return { ...base, qasm: remembered.qasm };
  }
  if (!(size >= 2)) return "Set the size of the state first.";
  const qasm = standardStatePreparationQasm(name, size);
  return qasm
    ? { ...base, qasm }
    : `${name} has no fixed gate circuit to expand into.`;
}
