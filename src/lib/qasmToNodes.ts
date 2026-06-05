/**
 * qasmToNodes.ts
 * Platzierung: src/lib/qasmToNodes.ts
 */

import { Node, Edge } from "reactflow";
import { v4 as uuid } from "uuid";

const GATE_LABEL_MAP: Record<string, string> = {
  // Single-qubit gates
  h: "H", x: "X", y: "Y", z: "Z",
  s: "S", t: "T", sdg: "S†", tdg: "T†",
  sx: "SX", id: "I",
  // Parametric single-qubit gates
  rx: "RX(θ)", ry: "RY(θ)", rz: "RZ(θ)",
  p: "P(λ)", u1: "U1(λ)", u2: "U2(φ,λ)", u3: "U3(θ,φ,λ)", u: "U3(θ,φ,λ)",
  // Two-qubit gates
  cx: "CNOT", cnot: "CNOT", cz: "CZ", cy: "CY", ch: "CH",
  swap: "SWAP", cp: "CP(λ)",
  crx: "CRX(θ)", cry: "CRY(θ)", crz: "CRZ(θ)",
  cu: "CU", cu1: "U1(λ)", cu3: "U3(θ,φ,λ)",
  // Three-qubit gates
  ccx: "Toffoli", cswap: "CSWAP",
};

interface ParsedGate {
  name: string;
  label: string;
  qubits: number[]; // globale Qubit-Indizes
  params?: string;
}

export function qasmToNodes(qasm: string): { nodes: Node[]; edges: Edge[] } {
  const lines = qasm.split("\n").map(l => l.trim());

  // Qubit-Register parsen (QASM 2 + 3)
  const qubitMap = new Map<string, number>(); // variablenname → globaler Index
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

  // LEQO-spezifisch: let-Statements parsen
  // "let varName = register[{idx}]" → varName → globaler Index
  const varMap = new Map<string, number>(); // varName → globaler Qubit-Index
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

  // Gates parsen
  const gates: ParsedGate[] = [];

  for (const line of lines) {
    // Kommentare und Direktiven überspringen
    if (!line || line.startsWith("//") || line.startsWith("/*") ||
        line.startsWith("*") || line.startsWith("OPENQASM") ||
        line.startsWith("include") || line.startsWith("let") ||
        line.startsWith("@") || line.startsWith("creg") ||
        line.startsWith("bit") || line.startsWith("measure") ||
        line.startsWith("barrier")) continue;

    // Gate mit Parametern: rx(0.5) varName
    const paramMatch = line.match(/^(\w+)\(([^)]*)\)\s+(.+)/);
    if (paramMatch) {
      const name = paramMatch[1].toLowerCase();
      const params = paramMatch[2];
      const qubitsStr = paramMatch[3].replace(";", "");
      const qubits = resolveQubits(qubitsStr, qubitMap, varMap);
      if (qubits.length > 0) {
        gates.push({ name, label: GATE_LABEL_MAP[name] ?? name.toUpperCase(), qubits, params });
      }
      continue;
    }

    // Gate ohne Parameter: h varName oder cx varName, varName2
    const gateMatch = line.match(/^([a-z]\w*)\s+(.+)/);
    if (gateMatch) {
      const name = gateMatch[1].toLowerCase();
      if (["openqasm", "include", "gate", "if", "let", "qubit", "qreg"].includes(name)) continue;
      const qubitsStr = gateMatch[2].replace(";", "");
      const qubits = resolveQubits(qubitsStr, qubitMap, varMap);
      if (qubits.length > 0) {
        gates.push({ name, label: GATE_LABEL_MAP[name] ?? name.toUpperCase(), qubits });
      }
    }
  }

  // Nodes und Edges erstellen
  const SPACING_X = 200;
  const SPACING_Y = 160;
  const START_X = 100;
  const START_Y = 80;

  const lastNodePerQubit = new Map<number, string>();
  const columnPerQubit = new Map<number, number>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Qubit-Start-Nodes (|0⟩)
  for (let i = 0; i < totalQubits; i++) {
    const id = uuid();
    nodes.push({
      id,
      type: "gateNode",
      position: { x: START_X, y: START_Y + i * SPACING_Y },
      data: {
        label: "Qubit Circuit",
        inputs: [],
        identifiers: [`q${i}`],
        parameter: "0",
      },
    });
    lastNodePerQubit.set(i, id);
    columnPerQubit.set(i, 1);
  }

  // Gate-Nodes
  for (const gate of gates) {
    const id = uuid();
    const col = Math.max(...gate.qubits.map(q => columnPerQubit.get(q) ?? 1));
    const row = gate.qubits[0];

    nodes.push({
      id,
      type: "gateNode",
      position: {
        x: START_X + col * SPACING_X,
        y: START_Y + row * SPACING_Y,
      },
      data: {
        label: gate.label,
        inputs: gate.qubits.map((q, i) => ({
          id: lastNodePerQubit.get(q),
          targetHandle: `quantumHandleGateInput${i}${id}`,
          identifiers: [`q${q}`],
        })),
        identifiers: gate.qubits.map(q => `q${q}`),
        parameter: gate.params ?? "0",
      },
    });

    // Edges
    for (let i = 0; i < gate.qubits.length; i++) {
      const q = gate.qubits[i];
      const prevId = lastNodePerQubit.get(q);
      if (prevId) {
        edges.push({
          id: uuid(),
          source: prevId,
          target: id,
          sourceHandle: `quantumHandleGateOutput0${prevId}`,
          targetHandle: `quantumHandleGateInput${i}${id}`,
          type: "quantumEdge",
          markerEnd: { type: "arrowclosed", width: 20, height: 20, color: "#93C5FD", hidden: true },
        });
      }
      lastNodePerQubit.set(q, id);
      columnPerQubit.set(q, col + 1);
    }
  }

  return { nodes, edges };
}

function resolveQubits(
  qubitsStr: string,
  qubitMap: Map<string, number>,
  varMap: Map<string, number>
): number[] {
  const parts = qubitsStr.split(",").map(s => s.trim());
  const result: number[] = [];

  for (const part of parts) {
    // reg[idx] format
    const idxMatch = part.match(/(\w+)\[(\d+)\]/);
    if (idxMatch) {
      const key = `${idxMatch[1]}[${idxMatch[2]}]`;
      const idx = qubitMap.get(key);
      if (idx !== undefined) { result.push(idx); continue; }
    }
    // Variable aus let-Statement
    const varIdx = varMap.get(part);
    if (varIdx !== undefined) { result.push(varIdx); continue; }
    // Ganzes Register
    let found = false;
    for (const [key, idx] of qubitMap.entries()) {
      if (key.startsWith(part + "[")) { result.push(idx); found = true; }
    }
  }

  return result;
}
