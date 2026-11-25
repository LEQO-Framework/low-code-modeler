import { Node, Edge, MarkerType } from "reactflow";
import { v4 as uuid } from "uuid";
import { MCMTGateNode } from "@/constants";
import {
  detectStatePreparations,
  matchToQasm,
  type RecognizedState,
  type SimGate,
  type StatePreparationMatch,
} from "./recognizeStates";

export const GATE_LABEL_MAP: Record<string, string> = {
  h: "H",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  t: "T",
  sdg: "SDG",
  tdg: "TDG",
  cx: "CNOT",
  cnot: "CNOT",
  cz: "CZ",
  cy: "CY",
  ch: "CH",
  swap: "SWAP",
  ccx: "Toffoli",
  cswap: "CSWAP",
  rx: "RX(θ)",
  ry: "RY(θ)",
  rz: "RZ(θ)",
  crx: "CRX(θ)",
  cry: "CRY(θ)",
  crz: "CRZ(θ)",
  u1: "U1(λ)",
  u2: "U2(φ,λ)",
  u3: "U3(θ,φ,λ)",
  p: "P(λ)",
  cp: "CP(λ)",
  id: "I",
  sx: "SX",
  // aliases that the OpenQASM editor accepts (stdgates.inc / qelib1.inc names)
  i: "I",
  toffoli: "Toffoli",
  fredkin: "CSWAP",
  u: "U3(θ,φ,λ)",
  phase: "P(λ)",
  cphase: "CP(λ)",
  cu1: "CP(λ)",
};

export interface ParsedGate {
  name: string;
  label: string;
  qubits: number[]; // global qubit indices
  params?: string;
  /** Multi-controlled gates (ctrl(N) @ gate): the first N qubits are the controls. */
  numControls?: number;
}

/** Multi-controlled gates that have a gate node of their own on the canvas. */
const CONTROLLED_GATE: Record<string, string> = {
  "x/1": "cx",
  "x/2": "ccx",
  "y/1": "cy",
  "z/1": "cz",
  "h/1": "ch",
  "rx/1": "crx",
  "ry/1": "cry",
  "rz/1": "crz",
  "p/1": "cp",
  "swap/1": "cswap",
};

export interface QasmNodes {
  nodes: Node[];
  edges: Edge[];
  /** "Qubit Circuit" source node of every qubit. */
  qubitNodeIds: string[];
  /** Gate nodes in circuit order. */
  gateNodeIds: string[];
  /** Node and output handle where each qubit ends. */
  lastHandles: { nodeId: string; handle: string }[];
  /** Statements that could not be turned into nodes (unsupported gates, loops, ...). */
  warnings: string[];
}

export function qasmToNodes(
  qasm: string,
  {
    recognizeStates = true,
    asState,
  }: {
    recognizeStates?: boolean;
    /** Puts the whole circuit into one group for this (known) state, without detection. */
    asState?: RecognizedState;
  } = {},
): QasmNodes {
  const parsed = parseQasmGates(qasm);
  const { gates, warnings } = parsed;
  const totalQubits = Math.max(1, parsed.totalQubits);

  // build the nodes and edges
  const SPACING_X = 200;
  const SPACING_Y = 160;
  const START_X = 100;
  const START_Y = 80;

  const lastNodePerQubit = new Map<number, string>();
  const lastHandlePerQubit = new Map<number, string>(); // last output handle per qubit
  const columnPerQubit = new Map<number, number>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const qubitNodeIds: string[] = [];
  const gateNodeIds: string[] = [];

  // qubit source nodes (|0⟩)
  for (let i = 0; i < totalQubits; i++) {
    const id = uuid();
    const outputHandle = `quantumHandleGateOutput0${id}`;
    nodes.push({
      id,
      type: "gateNode",
      position: { x: START_X, y: START_Y + i * SPACING_Y },
      data: {
        label: "Qubit Circuit",
        inputs: [],
        identifiers: [`q${i}`],
        parameter: "0",
        inputTypes: [],
        outputTypes: ["quantum register"],
        children: [],
        implementation: "",
        implementationType: "",
        uncomputeImplementationType: "",
        uncomputeImplementation: "",
        completionGuaranteed: true,
      },
    });
    qubitNodeIds.push(id);
    lastNodePerQubit.set(i, id);
    lastHandlePerQubit.set(i, outputHandle);
    columnPerQubit.set(i, 1);
  }

  // gate nodes
  for (const gate of gates) {
    const id = uuid();
    gateNodeIds.push(id);
    // multi-controlled gates without a gate node of their own become MCMT gate nodes
    const mcmt = gate.name.startsWith("mc_");
    const inputHandle = (i: number) =>
      mcmt ? `quantumHandleInput${i}${id}` : `quantumHandleGateInput${i}${id}`;
    const outputHandle = (i: number) =>
      mcmt
        ? `quantumHandleOutput${i}${id}`
        : `quantumHandleGateOutput${i}${id}`;
    const col = Math.max(...gate.qubits.map((q) => columnPerQubit.get(q) ?? 1));
    const minQ = Math.min(...gate.qubits);
    const maxQ = Math.max(...gate.qubits);
    const centerY = START_Y + ((minQ + maxQ) / 2) * SPACING_Y;

    nodes.push({
      id,
      type: mcmt ? MCMTGateNode : "gateNode",
      position: {
        x: START_X + col * SPACING_X,
        y: centerY,
      },
      data: {
        label: gate.label,
        ...(mcmt
          ? {
              baseGate: gate.name.slice(3).toUpperCase(),
              numControls: gate.numControls ?? 1,
              numTargets: gate.qubits.length - (gate.numControls ?? 1),
            }
          : {}),
        inputs: gate.qubits.map((q, i) => ({
          id: lastNodePerQubit.get(q),
          targetHandle: inputHandle(i),
          identifiers: [`q${q}`],
        })),
        identifiers: gate.qubits.map((q) => `q${q}`),
        parameter: evaluateParam(gate.params),
        inputTypes: gate.qubits.map(() => "quantum register"),
        outputTypes: gate.qubits.map(() => "quantum register"),
        children: [],
        implementation: "",
        implementationType: "",
        uncomputeImplementationType: "",
        uncomputeImplementation: "",
        completionGuaranteed: true,
      },
    });

    // one edge per involved qubit, from that qubit's last node to the new gate node
    for (let i = 0; i < gate.qubits.length; i++) {
      const q = gate.qubits[i];
      const prevId = lastNodePerQubit.get(q);
      const prevHandle =
        lastHandlePerQubit.get(q) ?? `quantumHandleGateOutput0${prevId}`;
      if (prevId) {
        edges.push({
          id: uuid(),
          source: prevId,
          target: id,
          sourceHandle: prevHandle,
          targetHandle: inputHandle(i),
          type: "quantumEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#93C5FD",
          },
        });
      }
      // this gate node becomes the new "last node" for this qubit
      lastNodePerQubit.set(q, id);
      lastHandlePerQubit.set(q, outputHandle(i));
      columnPerQubit.set(q, col + 1);
    }
  }

  const lastHandles = Array.from({ length: totalQubits }, (_, q) => ({
    nodeId: lastNodePerQubit.get(q)!,
    handle: lastHandlePerQubit.get(q)!,
  }));
  const result = { qubitNodeIds, gateNodeIds, lastHandles, warnings };
  if (!recognizeStates && !asState) return { nodes, edges, ...result };
  const groups = groupStatePreparations(
    totalQubits,
    gates,
    asState,
    nodes,
    qubitNodeIds,
    gateNodeIds,
  );
  // React Flow requires a parent node to come before its children
  return { nodes: [...groups, ...nodes], edges, ...result };
}

/**
 * Nodes of `result` (built from new code) for the qubits and gates that are not in
 * `previousQasm`, e.g. to highlight what was added in the OpenQASM editor. The gates are
 * matched in order (longest common subsequence of label, qubits and parameter), so a gate
 * inserted in the middle is found as well. Empty when there was no previous circuit.
 */
export function addedNodeIds(
  previousQasm: string,
  result: QasmNodes,
): string[] {
  const previous = qasmToNodes(previousQasm, { recognizeStates: false });
  if (
    previous.gateNodeIds.length === 0 &&
    !previousQasm.match(/\b(qubit|qreg)\b/)
  )
    return [];
  const signatures = ({ nodes, gateNodeIds }: QasmNodes) => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return gateNodeIds.map((id) => {
      const data = byId.get(id)?.data;
      return `${data?.label}|${data?.identifiers?.join(",")}|${data?.parameter}`;
    });
  };
  const a = signatures(previous);
  const b = signatures(result);
  // lcs[i][j]: length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () =>
    Array.from<number>({ length: b.length + 1 }).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const added: string[] = result.qubitNodeIds.slice(
    previous.qubitNodeIds.length,
  );
  let i = 0;
  for (let j = 0; j < b.length; j++) {
    if (i < a.length && a[i] === b[j]) i++;
    else if (i < a.length && lcs[i + 1][j] >= lcs[i][j + 1]) {
      // a[i] was removed; compare b[j] again with the next old gate
      i++;
      j--;
    } else added.push(result.gateNodeIds[j]);
  }
  return added;
}

/** Rough size of the generated nodes, for the group bounds. */
const NODE_WIDTH = 110;
const NODE_HEIGHT = 110;

/**
 * Puts the gates that prepare a Bell, GHZ or W state from |0...0⟩ (together with their
 * qubit nodes) into a group labelled with the state. The group remembers the circuit, so
 * it can be collapsed into a Prepare State block and expanded again.
 * The child nodes are reparented in place; returns the new group nodes.
 */
function groupStatePreparations(
  numQubits: number,
  gates: ParsedGate[],
  asState: RecognizedState | undefined,
  nodes: Node[],
  qubitNodeIds: string[],
  gateNodeIds: string[],
): Node[] {
  // The simulator treats every qubit of "mc_<gate>" except the last as a control, so a
  // multi-target MCMT gate is split into one gate per target (as cx/ccx where possible).
  const simGates: SimGate[] = [];
  const simOrigin: number[] = []; // simGates index -> gates index
  // the gates for the group's OpenQASM, with the number of controls in the MCMT name
  const qasmGates: SimGate[] = [];
  gates.forEach((g, index) => {
    const params = g.params
      ? splitTopLevel(g.params, ",").map((p) => parseFloat(evaluateParam(p)))
      : [];
    const numControls = g.numControls ?? 0;
    qasmGates.push({
      name: g.name.startsWith("mc_")
        ? `mc${numControls}_${g.name.slice(3)}`
        : g.name,
      qubits: g.qubits,
      params,
    });
    if (!g.name.startsWith("mc_") || g.qubits.length <= numControls + 1) {
      simGates.push({ name: g.name, qubits: g.qubits, params });
      simOrigin.push(index);
      return;
    }
    const base = g.name.slice(3);
    const controls = g.qubits.slice(0, numControls);
    for (const target of g.qubits.slice(numControls)) {
      simGates.push({
        name: CONTROLLED_GATE[`${base}/${numControls}`] ?? g.name,
        qubits: [...controls, target],
        params,
      });
      simOrigin.push(index);
    }
  });
  const toGateIndices = (simIndices: number[]) => [
    ...new Set(simIndices.map((i) => simOrigin[i])),
  ];
  // a match must contain either all or none of the parts of a split gate
  const complete = (simIndices: number[]) =>
    toGateIndices(simIndices).every((gi) =>
      simOrigin.every((o, si) => o !== gi || simIndices.includes(si)),
    );
  const matches: StatePreparationMatch[] = asState
    ? [
        {
          qubits: Array.from({ length: numQubits }, (_, q) => q),
          gateIndices: gates.map((_, i) => i),
          state: asState,
        },
      ]
    : detectStatePreparations(numQubits, simGates).filter((m) =>
        complete(m.gateIndices),
      );
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const groups: Node[] = [];

  for (const simMatch of matches) {
    const match = asState
      ? simMatch
      : { ...simMatch, gateIndices: toGateIndices(simMatch.gateIndices) };
    const memberIds = [
      ...match.qubits.map((q) => qubitNodeIds[q]),
      ...match.gateIndices.map((i) => gateNodeIds[i]),
    ];
    const members = memberIds.map((id) => byId.get(id)!);
    const height = (n: Node) =>
      NODE_HEIGHT * Math.max(1, n.data.identifiers?.length ?? 1);
    const minX = Math.min(...members.map((n) => n.position.x)) - 30;
    const minY = Math.min(...members.map((n) => n.position.y)) - 50;
    const maxX =
      Math.max(...members.map((n) => n.position.x + NODE_WIDTH)) + 30;
    const maxY = Math.max(...members.map((n) => n.position.y + height(n))) + 30;

    // output of the group on each of its qubits: the last matched node on that qubit
    const outputs = match.qubits.map((q) => {
      const last = [...match.gateIndices]
        .reverse()
        .find((i) => gates[i].qubits.includes(q));
      return last === undefined
        ? {
            nodeId: qubitNodeIds[q],
            handle: `quantumHandleGateOutput0${qubitNodeIds[q]}`,
            identifier: `q${q}`,
          }
        : {
            nodeId: gateNodeIds[last],
            handle: `${
              gates[last].name.startsWith("mc_")
                ? "quantumHandleOutput"
                : "quantumHandleGateOutput"
            }${gates[last].qubits.indexOf(q)}${gateNodeIds[last]}`,
            identifier: `q${q}`,
          };
    });

    const groupId = uuid();
    groups.push({
      id: groupId,
      type: "groupNode",
      position: { x: minX, y: minY },
      style: { width: maxX - minX, height: maxY - minY },
      data: {
        label: match.state.label,
        collapsed: false,
        color: "#6366f1",
        childCount: members.length,
        isGroup: true,
        statePreparation: {
          kind: match.state.kind,
          value: match.state.value,
          quantumStateName: match.state.quantumStateName,
          size: match.state.size,
          label: match.state.label,
          qasm: mcToCtrlSyntax(matchToQasm(match, qasmGates)),
          outputs,
          signature: circuitSignature(members),
        },
      },
      draggable: true,
      selectable: true,
      zIndex: -1,
    });
    for (const member of members) {
      member.parentNode = groupId;
      member.position = {
        x: member.position.x - minX,
        y: member.position.y - minY,
      };
    }
  }
  return groups;
}

/**
 * Fingerprint of the gates in a group, to notice when the user changed the circuit
 * inside a recognized group (then it may no longer prepare the recognized state).
 */
export function circuitSignature(members: Node[]): string {
  return members
    .map((n) => `${n.data?.label}|${n.data?.parameter ?? ""}`)
    .sort()
    .join(";");
}

/**
 * The backend expects numeric angles (radians), so expressions like "pi/2" are evaluated.
 * A parameter list ("pi/2, pi") is evaluated element by element and joined with ",".
 */
export function evaluateParam(params: string | undefined): string {
  if (!params || !params.trim()) return "0";
  const parts = splitTopLevel(params, ",");
  return parts.length > 1
    ? parts.map(evaluateSingleParam).join(",")
    : evaluateSingleParam(params);
}

function evaluateSingleParam(param: string): string {
  const raw = param.trim();
  if (!raw) return "0";
  const expr = raw.replace(/\bpi\b/gi, `(${Math.PI})`);
  if (!/^[\d\s.+\-*/()e]*$/i.test(expr)) return raw;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)() as number;
    return Number.isFinite(value) ? String(value) : raw;
  } catch {
    return raw;
  }
}

/** Splits at `sep` outside of (), [] and {}; the parts are trimmed. */
export function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if ((c === ")" || c === "]" || c === "}") && depth > 0) depth--;
    else if (depth === 0 && text.startsWith(sep, i)) {
      parts.push(text.slice(start, i).trim());
      start = i + sep.length;
      i += sep.length - 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

/** Index of the parenthesis that closes the one at `open`, or -1. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

interface Statement {
  text: string;
  /** Statements inside the `{ … }` block that follows the header `text`. */
  body?: Statement[];
}

/** Splits comment-free OpenQASM into statements at top-level `;`, nesting `{ … }` blocks. */
function splitStatements(src: string): Statement[] {
  let i = 0;
  const norm = (t: string) => t.replace(/\s+/g, " ").trim();
  const block = (): Statement[] => {
    const out: Statement[] = [];
    let buf = "";
    let depth = 0;
    const flush = () => {
      if (norm(buf)) out.push({ text: norm(buf) });
      buf = "";
    };
    while (i < src.length) {
      const c = src[i++];
      if (c === "(" || c === "[") depth++;
      else if ((c === ")" || c === "]") && depth > 0) depth--;
      if (depth === 0 && c === ";") flush();
      else if (depth === 0 && c === "{") {
        const text = norm(buf);
        buf = "";
        out.push({ text, body: block() });
      } else if (depth === 0 && c === "}") {
        flush();
        return out;
      } else buf += c;
    }
    flush();
    return out;
  };
  return block();
}

/** Number of qubits and of angles of the gates that have a node on the canvas. */
const GATE_ARITY: Record<string, [qubits: number, params: number]> = {
  h: [1, 0],
  x: [1, 0],
  y: [1, 0],
  z: [1, 0],
  s: [1, 0],
  t: [1, 0],
  sdg: [1, 0],
  tdg: [1, 0],
  sx: [1, 0],
  id: [1, 0],
  rx: [1, 1],
  ry: [1, 1],
  rz: [1, 1],
  p: [1, 1],
  u1: [1, 1],
  u2: [1, 2],
  u3: [1, 3],
  cx: [2, 0],
  cy: [2, 0],
  cz: [2, 0],
  ch: [2, 0],
  swap: [2, 0],
  crx: [2, 1],
  cry: [2, 1],
  crz: [2, 1],
  cp: [2, 1],
  ccx: [3, 0],
  cswap: [3, 0],
};

/** Other spellings of these gates. */
const GATE_ALIASES: Record<string, string> = {
  cnot: "cx",
  toffoli: "ccx",
  fredkin: "cswap",
  u: "u3",
  phase: "p",
  cphase: "cp",
  cu1: "cp",
  i: "id",
};

/** Controlled gates as (base gate, number of controls), to add further controls. */
const CONTROL_DECOMPOSITION: Record<string, [string, number]> = {
  cx: ["x", 1],
  ccx: ["x", 2],
  cy: ["y", 1],
  cz: ["z", 1],
  ch: ["h", 1],
  crx: ["rx", 1],
  cry: ["ry", 1],
  crz: ["rz", 1],
  cp: ["p", 1],
  cswap: ["swap", 1],
};

/** Base gates the MCMT gate node supports. */
const MCMT_BASES = new Set([
  "x",
  "y",
  "z",
  "h",
  "rx",
  "ry",
  "rz",
  "s",
  "sdg",
  "t",
  "tdg",
]);

const SELF_INVERSE = new Set([
  "h",
  "x",
  "y",
  "z",
  "id",
  "cx",
  "cy",
  "cz",
  "ch",
  "swap",
  "ccx",
  "cswap",
]);
const INVERSE_NAME: Record<string, string> = {
  s: "sdg",
  sdg: "s",
  t: "tdg",
  tdg: "t",
};
const NEGATED_ANGLE = new Set([
  "rx",
  "ry",
  "rz",
  "p",
  "u1",
  "crx",
  "cry",
  "crz",
  "cp",
]);

type GateOp = { name: string; params?: string };

/** The inverse of a supported gate as a sequence of supported gates. */
function invertGate({ name, params }: GateOp): GateOp[] {
  const neg = (p: string) => `-(${p})`;
  if (SELF_INVERSE.has(name)) return [{ name, params }];
  if (INVERSE_NAME[name]) return [{ name: INVERSE_NAME[name] }];
  if (name === "sx") return [{ name }, { name }, { name }]; // SX⁴ = I
  if (NEGATED_ANGLE.has(name)) return [{ name, params: neg(params ?? "0") }];
  const p = splitTopLevel(params ?? "", ",");
  // u3(θ, φ, λ)⁻¹ = u3(-θ, -λ, -φ), and u2(φ, λ) = u3(π/2, φ, λ)
  if (name === "u3")
    return [{ name, params: [neg(p[0]), neg(p[2]), neg(p[1])].join(", ") }];
  return [
    { name: "u3", params: [neg("pi/2"), neg(p[1]), neg(p[0])].join(", ") },
  ];
}

export interface QasmRegister {
  name: string;
  /** Global index of the register's first qubit. */
  start: number;
  size: number;
}

export interface ParsedQasm {
  gates: ParsedGate[];
  registers: QasmRegister[];
  totalQubits: number;
  /** Statements that were not turned into gates. */
  warnings: string[];
  /** Global qubit indices of a register, `let` alias or indexed/concatenated expression. */
  resolve: (expr: string) => number[] | null;
}

/**
 * Parses the gate statements of OpenQASM 2/3 into gates on global qubit indices:
 * several statements per line, LEQO `let` aliases (`reg[{0, 1}]`, `reg[k]`, `a ++ b`,
 * alias of alias), register broadcast (`h q;`), the modifiers `ctrl`, `negctrl`, `inv`
 * and integer `pow`, and calls of custom `gate` definitions (expanded; the bodies are
 * not run on their own). Everything else that cannot become a canvas node (unknown
 * gates, `if`, loops, `reset`, …) is skipped with a warning.
 */
export function parseQasmGates(qasm: string): ParsedQasm {
  const src = qasm
    .replace(/\uFEFF/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    // annotations (@leqo.input 0) run to the end of the line, without ";"
    .replace(/^[ \t]*@[^\n]*$/gm, " ");

  const gates: ParsedGate[] = [];
  const registers: QasmRegister[] = [];
  const registerQubits = new Map<string, number[]>();
  const aliases = new Map<string, number[]>();
  const gateDefs = new Map<
    string,
    { params: string[]; args: string[]; body: Statement[] }
  >();
  const warnings: string[] = [];
  let totalQubits = 0;

  const short = (t: string) => (t.length > 60 ? `${t.slice(0, 57)}…` : t);
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };

  type Scope = {
    /** Gate arguments inside a custom gate body (registers are not visible there). */
    qubits?: Map<string, number[]>;
    params?: Map<string, string>;
    depth: number;
  };
  const top: Scope = { depth: 0 };

  const lookup = (name: string, scope: Scope) =>
    scope.qubits
      ? scope.qubits.get(name)
      : (aliases.get(name) ?? registerQubits.get(name));

  /** Local indices selected by `[…]` (`k`, `{i, j}`, `a:b`, `a:s:b`; negative from the end). */
  const select = (sel: string, size: number): number[] | null => {
    const int = (s: string) =>
      /^-?\d+$/.test(s.trim()) ? parseInt(s, 10) : NaN;
    const fix = (k: number) => (k < 0 ? size + k : k);
    let idx: number[];
    if (/^\{.*\}$/.test(sel))
      idx = splitTopLevel(sel.slice(1, -1), ",").map((s) => fix(int(s)));
    else if (sel.includes(":")) {
      const r = sel.split(":").map((s) => s.trim());
      if (r.length > 3) return null;
      const from = r[0] ? fix(int(r[0])) : 0;
      const step = r.length === 3 ? int(r[1]) : 1;
      const last = r[r.length - 1];
      const to = last ? fix(int(last)) : size - 1;
      if (![from, step, to].every(Number.isInteger) || step === 0) return null;
      idx = [];
      for (let k = from; step > 0 ? k <= to : k >= to; k += step) idx.push(k);
    } else idx = [fix(int(sel))];
    return idx.every((k) => Number.isInteger(k) && k >= 0 && k < size)
      ? idx
      : null;
  };

  const resolveIn = (expr: string, scope: Scope): number[] | null => {
    const parts = splitTopLevel(expr, "++");
    if (parts.length > 1) {
      const all = parts.map((p) => resolveIn(p, scope));
      return all.every((a) => a) ? all.flatMap((a) => a!) : null;
    }
    const m = expr.trim().match(/^([A-Za-z_][\w.]*)\s*(?:\[(.*)\])?$/);
    if (!m) return null;
    const base = lookup(m[1], scope);
    if (!base) return null;
    if (m[2] === undefined) return base;
    const idx = select(m[2].trim(), base.length);
    return idx ? idx.map((k) => base[k]) : null;
  };

  /** Replaces the parameters of a custom gate by the values of the call. */
  const substitute = (text: string | undefined, scope: Scope) =>
    text && scope.params
      ? text.replace(/\b[A-Za-z_]\w*\b/g, (w) =>
          scope.params!.has(w) ? `(${scope.params!.get(w)})` : w,
        )
      : text;

  const push = (
    name: string,
    qubits: number[],
    params?: string,
    numControls?: number,
  ) =>
    gates.push(
      name.startsWith("mc_")
        ? { name, label: "MCMT Gate", qubits, params, numControls }
        : { name, label: GATE_LABEL_MAP[name], qubits, params },
    );

  type Modifier = { kind: string; arg?: string };

  /** One application of a (possibly modified) gate to concrete qubits. */
  const apply = (
    text: string,
    name: string,
    params: string | undefined,
    mods: Modifier[],
    qubits: number[],
    scope: Scope,
  ) => {
    const builtin = GATE_ALIASES[name.toLowerCase()] ?? name.toLowerCase();
    const def = GATE_ARITY[builtin] ? undefined : gateDefs.get(name);
    if (def) {
      const values = params ? splitTopLevel(params, ",") : [];
      if (mods.length > 0)
        warn(
          `Modifiers on the custom gate "${name}" are not supported, skipped: ${short(text)}`,
        );
      else if (
        qubits.length !== def.args.length ||
        values.length !== def.params.length
      )
        warn(
          `Wrong number of qubits or parameters for "${name}", skipped: ${short(text)}`,
        );
      else if (scope.depth > 20)
        warn(`Custom gate "${name}" nests too deeply, skipped`);
      else {
        const inner: Scope = {
          qubits: new Map(def.args.map((a, i) => [a, [qubits[i]]])),
          params: new Map(def.params.map((p, i) => [p, values[i]])),
          depth: scope.depth + 1,
        };
        def.body.forEach((st) => handle(st, inner));
      }
      return;
    }
    const arity = GATE_ARITY[builtin];
    if (!arity) {
      warn(`Unsupported gate "${name}" skipped (no canvas node)`);
      return;
    }
    const paramCount = params ? splitTopLevel(params, ",").length : 0;
    if (paramCount !== arity[1]) {
      warn(
        `"${name}" expects ${arity[1]} parameter(s), skipped: ${short(text)}`,
      );
      return;
    }

    const controls: { neg: boolean }[] = [];
    let inverse = false;
    let power = 1;
    for (const mod of mods) {
      if (mod.kind === "inv") inverse = !inverse;
      else if (mod.kind === "pow") {
        const k = Number(evaluateParam(mod.arg));
        if (!Number.isInteger(k) || Math.abs(k) > 64) {
          warn(
            `pow(${mod.arg}) is only supported for small integers, skipped: ${short(text)}`,
          );
          return;
        }
        power *= k;
      } else {
        const n = mod.arg === undefined ? 1 : Number(evaluateParam(mod.arg));
        if (!Number.isInteger(n) || n < 1) {
          warn(`Invalid ${mod.kind}(${mod.arg}), skipped: ${short(text)}`);
          return;
        }
        for (let c = 0; c < n; c++)
          controls.push({ neg: mod.kind === "negctrl" });
      }
    }
    if (power < 0) {
      inverse = !inverse;
      power = -power;
    }

    const ctrlQubits = qubits.slice(0, controls.length);
    const targets = qubits.slice(controls.length);
    // ctrl @ x c, t1, t2: one MCMT gate with several targets
    const multiTarget =
      controls.length > 0 && arity[0] === 1 && targets.length > 1;
    if (targets.length !== arity[0] && !multiTarget) {
      warn(`Wrong number of qubits for "${name}", skipped: ${short(text)}`);
      return;
    }

    const once: GateOp[] = inverse
      ? invertGate({ name: builtin, params })
      : [{ name: builtin, params }];
    const sequence: GateOp[] = [];
    for (let k = 0; k < power; k++) sequence.push(...once);

    if (controls.length === 0) {
      sequence.forEach((g) => push(g.name, qubits, g.params));
      return;
    }

    // controlled gates: build all of them first, so nothing is added if one has no node
    const built: [string, number[], string | undefined, number | undefined][] =
      [];
    for (const g of sequence) {
      const [core0, extra] = CONTROL_DECOMPOSITION[g.name] ?? [g.name, 0];
      const core = core0 === "u1" ? "p" : core0;
      const n = controls.length + extra;
      const allControls = [...ctrlQubits, ...targets.slice(0, extra)];
      const coreTargets = targets.slice(extra);
      const single = CONTROLLED_GATE[`${core}/${n}`];
      const coreArity = GATE_ARITY[core]?.[0] ?? 1;
      if (single && coreTargets.length === coreArity)
        built.push([
          single,
          [...allControls, ...coreTargets],
          g.params,
          undefined,
        ]);
      else if (MCMT_BASES.has(core))
        built.push([
          `mc_${core}`,
          [...allControls, ...coreTargets],
          g.params,
          n,
        ]);
      else {
        warn(
          `Controlled "${core}" with ${n} control(s) has no canvas node, skipped: ${short(text)}`,
        );
        return;
      }
    }
    // negctrl: the control is active on |0⟩, so it is conjugated with X
    const negated = ctrlQubits.filter((_, i) => controls[i].neg);
    negated.forEach((q) => push("x", [q]));
    built.forEach(([n, qs, p, c]) => push(n, qs, p, c));
    negated.forEach((q) => push("x", [q]));
  };

  // declarations and statements that have no node on purpose
  const SILENT = new Set([
    "openqasm",
    "include",
    "creg",
    "bit",
    "int",
    "uint",
    "float",
    "angle",
    "bool",
    "complex",
    "duration",
    "stretch",
    "const",
    "input",
    "output",
    "barrier",
    "opaque",
    "defcalgrammar",
    "pragma",
    "extern",
  ]);

  function handle(st: Statement, scope: Scope): void {
    const text = st.text;
    const keyword = (text.match(/^[A-Za-z_]\w*/)?.[0] ?? "").toLowerCase();

    if (st.body) {
      if (keyword === "gate" && scope === top) {
        const m = text.match(
          /^gate\s+([A-Za-z_]\w*)\s*(?:\(([^)]*)\))?\s*(.*)$/,
        );
        if (m) {
          const list = (s?: string) =>
            s ? splitTopLevel(s, ",").filter(Boolean) : [];
          gateDefs.set(m[1], {
            params: list(m[2]),
            args: list(m[3]),
            body: st.body,
          });
        }
      } else if (keyword === "box") st.body.forEach((s) => handle(s, scope));
      else if (keyword === "if" || keyword === "else")
        warn(`Conditional block not imported: ${short(text)}`);
      else if (keyword === "for" || keyword === "while")
        warn(`Loop not imported: ${short(text)}`);
      else if (keyword === "def")
        warn(`Subroutine not imported: ${short(text)}`);
      else if (text) warn(`Block not imported: ${short(text)}`);
      return;
    }
    if (!text || SILENT.has(keyword) || /\bmeasure\b/.test(text)) return;

    if (keyword === "qubit" || keyword === "qreg") {
      const m =
        keyword === "qubit"
          ? text.match(/^qubit\s*(?:\[\s*(\d+)\s*\])?\s+([A-Za-z_][\w.]*)$/)
          : text.match(/^qreg\s+([A-Za-z_][\w.]*)\s*\[\s*(\d+)\s*\]$/);
      if (!m || scope !== top) {
        warn(`Qubit declaration not understood: ${short(text)}`);
        return;
      }
      const [name, size] =
        keyword === "qubit"
          ? [m[2], parseInt(m[1] ?? "1", 10)]
          : [m[1], parseInt(m[2], 10)];
      registers.push({ name, start: totalQubits, size });
      registerQubits.set(
        name,
        Array.from({ length: size }, (_, k) => totalQubits + k),
      );
      totalQubits += size;
      return;
    }
    if (keyword === "let") {
      const m = text.match(/^let\s+([A-Za-z_][\w.]*)\s*=\s*(.+)$/);
      const target = m && resolveIn(m[2], scope);
      if (m && target) aliases.set(m[1], target);
      else warn(`Alias not understood: ${short(text)}`);
      return;
    }
    if (keyword === "if") {
      warn(`Conditional statement not imported: ${short(text)}`);
      return;
    }
    if (keyword === "reset" || keyword === "delay") {
      warn(`"${keyword}" is not imported: ${short(text)}`);
      return;
    }

    // [modifier @]* name[(params)] operand, operand, ...
    let rest = text;
    const mods: Modifier[] = [];
    for (;;) {
      const mm = rest.match(/^(ctrl|negctrl|inv|pow)\b\s*/);
      if (!mm) break;
      let after = rest.slice(mm[0].length);
      let arg: string | undefined;
      if (after.startsWith("(")) {
        const close = closingParen(after, 0);
        if (close < 0) break;
        arg = after.slice(1, close);
        after = after.slice(close + 1).trimStart();
      }
      if (!after.startsWith("@")) break;
      mods.push({ kind: mm[1], arg: substitute(arg, scope) });
      rest = after.slice(1).trimStart();
    }
    const nm = rest.match(/^([A-Za-z_]\w*)\s*/);
    if (!nm) {
      warn(`Statement not imported: ${short(text)}`);
      return;
    }
    let after = rest.slice(nm[0].length);
    let params: string | undefined;
    if (after.startsWith("(")) {
      const close = closingParen(after, 0);
      if (close < 0) {
        warn(`Statement not imported: ${short(text)}`);
        return;
      }
      params = substitute(after.slice(1, close).trim(), scope);
      after = after.slice(close + 1).trim();
    }
    const operands = after ? splitTopLevel(after, ",") : [];
    if (operands.length === 0 || operands.some((o) => !o)) {
      warn(`Statement not imported: ${short(text)}`);
      return;
    }
    const resolved: number[][] = [];
    for (const operand of operands) {
      const qs = resolveIn(operand, scope);
      if (!qs || qs.length === 0) {
        warn(`Cannot resolve qubit "${operand}", skipped: ${short(text)}`);
        return;
      }
      resolved.push(qs);
    }
    // broadcast: whole registers of equal size are applied index by index
    const sizes = [
      ...new Set(resolved.filter((r) => r.length > 1).map((r) => r.length)),
    ];
    if (sizes.length > 1) {
      warn(`Registers of different sizes, skipped: ${short(text)}`);
      return;
    }
    const count = sizes[0] ?? 1;
    for (let k = 0; k < count; k++) {
      const qubits = resolved.map((r) => (r.length > 1 ? r[k] : r[0]));
      if (new Set(qubits).size !== qubits.length) {
        warn(`The same qubit is used twice, skipped: ${short(text)}`);
        continue;
      }
      apply(text, nm[1], params, mods, qubits, scope);
    }
  }

  splitStatements(src).forEach((st) => handle(st, top));
  warnings.forEach((w) => console.warn(`OpenQASM import: ${w}`));
  return {
    gates,
    registers,
    totalQubits,
    warnings,
    resolve: (expr) => resolveIn(expr, top),
  };
}

/** `mc1_x q[0], q[1], q[2];` (MCMT gate with 1 control) as OpenQASM: `ctrl(1) @ x …`. */
function mcToCtrlSyntax(qasm: string): string {
  return qasm.replace(/^mc(\d+)_(\w+)/gm, "ctrl($1) @ $2");
}
