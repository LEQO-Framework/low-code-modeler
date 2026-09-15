/**
 * nodesToQasm.ts
 * Platzierung: src/lib/nodesToQasm.ts
 *
 * Generiert QASM 2.0 direkt aus React Flow Nodes und Edges,
 * ohne Backend-Call. Wird für die Canvas → QASM Editor Sync verwendet.
 */

import { Node, Edge } from "reactflow";

// Label → QASM-Befehl Mapping (umgekehrt zu GATE_LABEL_MAP in qasmToNodes.ts)
const LABEL_TO_QASM: Record<string, string> = {
  "H": "h",
  "X": "x",
  "Y": "y",
  "Z": "z",
  "S": "s",
  "T": "t",
  "S†": "sdg",
  "SDG": "sdg",
  "T†": "tdg",
  "TDG": "tdg",
  "SX": "sx",
  "I": "id",
  "CNOT": "cx",
  "CZ": "cz",
  "CY": "cy",
  "CH": "ch",
  "SWAP": "swap",
  "Toffoli": "ccx",
  "CSWAP": "cswap",
  "RX(θ)": "rx",
  "RY(θ)": "ry",
  "RZ(θ)": "rz",
  "P(λ)": "p",
  "CP(λ)": "cp",
  "CRX(θ)": "crx",
  "CRY(θ)": "cry",
  "CRZ(θ)": "crz",
  "CU": "cu",
  "U1(λ)": "u1",
  "U2(φ,λ)": "u2",
  "U3(θ,φ,λ)": "u3",
};

// Parametrische Gates die einen Parameter-Wert benötigen
const PARAMETRIC_GATES = new Set([
  "rx", "ry", "rz", "p", "cp", "crx", "cry", "crz", "u1", "u2", "u3",
]);

/**
 * Wandelt Canvas-Nodes und Edges in QASM 2.0 um.
 * Gibt null zurück wenn keine gültigen Quantum-Nodes gefunden werden.
 */
export function nodesToQasm(nodes: Node[], edges: Edge[]): string | null {
  // Nur Gate-Nodes berücksichtigen
  const gateNodes = nodes.filter(n => n.type === "gateNode");
  if (gateNodes.length === 0) return null;

  // Qubit-Nodes identifizieren (|0⟩)
  const qubitNodes = gateNodes.filter(n => n.data?.label === "Qubit Circuit");
  if (qubitNodes.length === 0) return null;

  // Qubit-Reihenfolge per Y-Position bestimmen
  const sortedQubits = [...qubitNodes].sort((a, b) => {
    const ay = (a.positionAbsolute?.y ?? a.position.y);
    const by = (b.positionAbsolute?.y ?? b.position.y);
    return ay - by;
  });

  // Qubit-Index-Map: nodeId → globaler Index
  const qubitIndexMap = new Map<string, number>();
  sortedQubits.forEach((q, i) => qubitIndexMap.set(q.id, i));

  // Identifier → Qubit-Index Map (für inputs-Referenzen)
  const identifierToIndex = new Map<string, number>();
  sortedQubits.forEach((q, i) => {
    const ids: string[] = q.data?.identifiers ?? [];
    ids.forEach(id => identifierToIndex.set(id, i));
  });

  // Gate-Nodes (ohne Qubits) topologisch sortieren
  const nonQubitGates = gateNodes.filter(n => n.data?.label !== "Qubit Circuit");

  // Topologische Sortierung via Kahn's Algorithmus
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const gate of nonQubitGates) {
    inDegree.set(gate.id, 0);
    adjList.set(gate.id, []);
  }

  for (const edge of edges) {
    const sourceIsGate = nonQubitGates.some(g => g.id === edge.source);
    const targetIsGate = nonQubitGates.some(g => g.id === edge.target);
    if (sourceIsGate && targetIsGate) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const queue = nonQubitGates
    .filter(g => (inDegree.get(g.id) ?? 0) === 0)
    .sort((a, b) => {
      const ax = (a.positionAbsolute?.x ?? a.position.x);
      const bx = (b.positionAbsolute?.x ?? b.position.x);
      return ax - bx;
    })
    .map(g => g.id);

  const sortedGateIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    sortedGateIds.push(id);

    const neighbors = (adjList.get(id) ?? []).sort((a, b) => {
      const an = nonQubitGates.find(g => g.id === a);
      const bn = nonQubitGates.find(g => g.id === b);
      const ax = an ? (an.positionAbsolute?.x ?? an.position.x) : 0;
      const bx = bn ? (bn.positionAbsolute?.x ?? bn.position.x) : 0;
      return ax - bx;
    });

    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // QASM aufbauen
  const numQubits = sortedQubits.length;
  const lines: string[] = [
    "OPENQASM 2.0;",
    `qreg q[${numQubits}];`,
    "",
  ];

  // Gate-Befehle generieren
  for (const gateId of sortedGateIds) {
    const gate = nonQubitGates.find(g => g.id === gateId);
    if (!gate) continue;

    const label: string = gate.data?.label ?? "";
    const qasmName = LABEL_TO_QASM[label];
    if (!qasmName) continue; // unbekanntes Gate überspringen

    // Qubit-Indizes aus inputs-Array ermitteln
    const inputs: any[] = gate.data?.inputs ?? [];
    const qubitIndices: number[] = [];

    for (const input of inputs) {
      // Direkt über die Identifier
      const ids: string[] = input.identifiers ?? [];
      for (const identifier of ids) {
        const idx = identifierToIndex.get(identifier);
        if (idx !== undefined && !qubitIndices.includes(idx)) {
          qubitIndices.push(idx);
          break;
        }
      }
    }

    // Fallback: per Y-Position der Source-Nodes
    if (qubitIndices.length === 0) {
      const sourceEdges = edges.filter(e => e.target === gateId);
      const sourceNodes = sourceEdges
        .map(e => nodes.find(n => n.id === e.source))
        .filter(Boolean) as Node[];
      sourceNodes.sort((a, b) => {
        const ay = a.positionAbsolute?.y ?? a.position.y;
        const by = b.positionAbsolute?.y ?? b.position.y;
        return ay - by;
      });
      for (const src of sourceNodes) {
        const idx = qubitIndexMap.get(src.id) ??
          (() => {
            // Rückwärts durch die Kette bis zum Qubit
            let cur: Node | undefined = src;
            while (cur && cur.data?.label !== "Qubit Circuit") {
              const prevEdge = edges.find(e => e.target === cur!.id);
              cur = prevEdge ? nodes.find(n => n.id === prevEdge.source) : undefined;
            }
            return cur ? qubitIndexMap.get(cur.id) : undefined;
          })();
        if (idx !== undefined && !qubitIndices.includes(idx)) {
          qubitIndices.push(idx);
        }
      }
    }

    if (qubitIndices.length === 0) continue;

    const qubitArgs = qubitIndices.map(i => `q[${i}]`).join(", ");
    const param = gate.data?.parameter;

    if (PARAMETRIC_GATES.has(qasmName) && param !== undefined && param !== "0" && param !== "") {
      lines.push(`${qasmName}(${param}) ${qubitArgs};`);
    } else if (PARAMETRIC_GATES.has(qasmName)) {
      lines.push(`${qasmName}(0) ${qubitArgs};`);
    } else {
      lines.push(`${qasmName} ${qubitArgs};`);
    }
  }

  return lines.join("\n");
}
