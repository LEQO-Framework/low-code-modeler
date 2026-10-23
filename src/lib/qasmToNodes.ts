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

const GATE_LABEL_MAP: Record<string, string> = {
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
};

interface ParsedGate {
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
  const lines = qasm.split("\n").map((l) => l.trim());

  // parse the qubit registers (QASM 2 and 3)
  const qubitMap = new Map<string, number>(); // variable name -> global index
  let totalQubits = 0;

  // QASM 3: qubit[2] leqo_reg → leqo_reg[0], leqo_reg[1]
  // QASM 2: qreg q[2]
  for (const line of lines) {
    const m3 = line.match(/^qubit(?:\[(\d+)\])?\s+(\w+)/);
    if (m3) {
      const count = parseInt(m3[1] ?? "1");
      const name = m3[2];
      for (let i = 0; i < count; i++) {
        qubitMap.set(`${name}[${i}]`, totalQubits++);
      }
      continue;
    }
    const m2 = line.match(/^qreg\s+(\w+)\[(\d+)\]/);
    if (m2) {
      const name = m2[1];
      const count = parseInt(m2[2]);
      for (let i = 0; i < count; i++) {
        qubitMap.set(`${name}[${i}]`, totalQubits++);
      }
    }
  }

  if (totalQubits === 0) totalQubits = 1;

  // LEQO specific: parse the let statements
  // "let varName = register[{idx}]" -> varName -> global index
  const varMap = new Map<string, number>(); // varName -> global qubit index
  for (const line of lines) {
    // let leqo_xxx_q0 = leqo_reg[{0}];
    const letMatch = line.match(/^let\s+(\S+)\s*=\s*(\w+)\[\{?(\d+)\}?\]/);
    if (letMatch) {
      const varName = letMatch[1].replace(";", "");
      const regName = letMatch[2];
      const idx = parseInt(letMatch[3]);
      const globalIdx = qubitMap.get(`${regName}[${idx}]`) ?? idx;
      varMap.set(varName, globalIdx);
    }
  }

  // parse the gates
  const gates: ParsedGate[] = [];

  for (const line of lines) {
    // skip comments and directives
    if (
      !line ||
      line.startsWith("//") ||
      line.startsWith("/*") ||
      line.startsWith("*") ||
      line.startsWith("OPENQASM") ||
      line.startsWith("include") ||
      line.startsWith("let") ||
      line.startsWith("@") ||
      line.startsWith("creg") ||
      line.startsWith("bit") ||
      line.startsWith("measure") ||
      line.startsWith("barrier")
    )
      continue;

    // OpenQASM 3 modifier syntax: ctrl(N) @ gate controls..., target
    const ctrlMatch = line.match(/^ctrl(?:\((\d+)\))?\s*@\s*(\w+)\s+(.+?);?$/);
    if (ctrlMatch) {
      const numControls = ctrlMatch[1] ? parseInt(ctrlMatch[1], 10) : 1;
      const base = ctrlMatch[2].toLowerCase();
      const qubits = resolveQubits(ctrlMatch[3], qubitMap, varMap);
      if (qubits.length > numControls) {
        const single = CONTROLLED_GATE[`${base}/${numControls}`];
        gates.push(
          single && qubits.length === numControls + 1
            ? { name: single, label: GATE_LABEL_MAP[single], qubits }
            : {
                name: `mc_${base}`,
                label: "MCMT Gate",
                qubits,
                numControls,
              },
        );
      }
      continue;
    }

    // gate with parameters: rx(0.5) varName
    const paramMatch = line.match(/^(\w+)\(([^)]*)\)\s+(.+)/);
    if (paramMatch) {
      const name = paramMatch[1].toLowerCase();
      const params = paramMatch[2];
      const qubitsStr = paramMatch[3].replace(";", "");
      const qubits = resolveQubits(qubitsStr, qubitMap, varMap);
      if (qubits.length > 0) {
        gates.push({
          name,
          label: GATE_LABEL_MAP[name] ?? name.toUpperCase(),
          qubits,
          params,
        });
      }
      continue;
    }

    // gate without parameters: h varName, or cx varName, varName2
    const gateMatch = line.match(/^([a-z]\w*)\s+(.+)/);
    if (gateMatch) {
      const name = gateMatch[1].toLowerCase();
      if (
        ["openqasm", "include", "gate", "if", "let", "qubit", "qreg"].includes(
          name,
        )
      )
        continue;
      const qubitsStr = gateMatch[2].replace(";", "");
      const qubits = resolveQubits(qubitsStr, qubitMap, varMap);
      if (qubits.length > 0) {
        gates.push({
          name,
          label: GATE_LABEL_MAP[name] ?? name.toUpperCase(),
          qubits,
        });
      }
    }
  }

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
  const result = { qubitNodeIds, gateNodeIds, lastHandles };
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
export function addedNodeIds(previousQasm: string, result: QasmNodes): string[] {
  const previous = qasmToNodes(previousQasm, { recognizeStates: false });
  if (previous.gateNodeIds.length === 0 && !previousQasm.match(/\b(qubit|qreg)\b/))
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
  const simGates: SimGate[] = gates.map((g) => ({
    name: g.name,
    qubits: g.qubits,
    params: g.params
      ? g.params.split(",").map((p) => parseFloat(evaluateParam(p)))
      : [],
  }));
  const matches: StatePreparationMatch[] = asState
    ? [
        {
          qubits: Array.from({ length: numQubits }, (_, q) => q),
          gateIndices: gates.map((_, i) => i),
          state: asState,
        },
      ]
    : detectStatePreparations(numQubits, simGates);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const groups: Node[] = [];

  for (const match of matches) {
    const memberIds = [
      ...match.qubits.map((q) => qubitNodeIds[q]),
      ...match.gateIndices.map((i) => gateNodeIds[i]),
    ];
    const members = memberIds.map((id) => byId.get(id)!);
    const height = (n: Node) =>
      NODE_HEIGHT * Math.max(1, n.data.identifiers?.length ?? 1);
    const minX = Math.min(...members.map((n) => n.position.x)) - 30;
    const minY = Math.min(...members.map((n) => n.position.y)) - 50;
    const maxX = Math.max(...members.map((n) => n.position.x + NODE_WIDTH)) + 30;
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
            handle: `quantumHandleGateOutput${gates[last].qubits.indexOf(q)}${gateNodeIds[last]}`,
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
          qasm: matchToQasm(match, simGates),
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

/** The backend expects numeric angles (radians), so expressions like "pi/2" are evaluated. */
function evaluateParam(params: string | undefined): string {
  if (!params) return "0";
  const expr = params.trim().replace(/\bpi\b/gi, `(${Math.PI})`);
  if (!/^[\d\s.+\-*/()e]*$/i.test(expr)) return params;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)() as number;
    return Number.isFinite(value) ? String(value) : params;
  } catch {
    return params;
  }
}

function resolveQubits(
  qubitsStr: string,
  qubitMap: Map<string, number>,
  varMap: Map<string, number>,
): number[] {
  const parts = qubitsStr.split(",").map((s) => s.trim());
  const result: number[] = [];

  for (const part of parts) {
    // reg[idx] format
    const idxMatch = part.match(/(\w+)\[(\d+)\]/);
    if (idxMatch) {
      const key = `${idxMatch[1]}[${idxMatch[2]}]`;
      const idx = qubitMap.get(key);
      if (idx !== undefined) {
        result.push(idx);
        continue;
      }
    }
    // variable from a let statement
    const varIdx = varMap.get(part);
    if (varIdx !== undefined) {
      result.push(varIdx);
      continue;
    }
    // whole register
    for (const [key, idx] of qubitMap.entries()) {
      if (key.startsWith(part + "[")) {
        result.push(idx);
      }
    }
  }

  return result;
}
