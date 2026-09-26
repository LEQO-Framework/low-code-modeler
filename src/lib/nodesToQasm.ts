/**
 * Generates QASM 2.0 directly from React Flow nodes and edges, without a backend call.
 * Used for the canvas to QASM editor synchronization.
 */

import { Node, Edge } from "reactflow";

// label to QASM instruction mapping (the inverse of GATE_LABEL_MAP in qasmToNodes.ts)
const LABEL_TO_QASM: Record<string, string> = {
  H: "h",
  X: "x",
  Y: "y",
  Z: "z",
  S: "s",
  T: "t",
  "S†": "sdg",
  SDG: "sdg",
  "T†": "tdg",
  TDG: "tdg",
  SX: "sx",
  I: "id",
  CNOT: "cx",
  CZ: "cz",
  CY: "cy",
  CH: "ch",
  SWAP: "swap",
  Toffoli: "ccx",
  CSWAP: "cswap",
  "RX(θ)": "rx",
  "RY(θ)": "ry",
  "RZ(θ)": "rz",
  "P(λ)": "p",
  "CP(λ)": "cp",
  "CRX(θ)": "crx",
  "CRY(θ)": "cry",
  "CRZ(θ)": "crz",
  CU: "cu",
  "U1(λ)": "u1",
  "U2(φ,λ)": "u2",
  "U3(θ,φ,λ)": "u3",
};

// parametric gates that require a parameter value
const PARAMETRIC_GATES = new Set([
  "rx",
  "ry",
  "rz",
  "p",
  "cp",
  "crx",
  "cry",
  "crz",
  "u1",
  "u2",
  "u3",
]);

/**
 * Converts canvas nodes and edges into QASM 2.0.
 * Returns null when no valid quantum nodes are found.
 */
export function nodesToQasm(nodes: Node[], edges: Edge[]): string | null {
  // only gate nodes are considered
  const gateNodes = nodes.filter((n) => n.type === "gateNode");
  if (gateNodes.length === 0) return null;

  // identify the qubit nodes (|0⟩)
  const qubitNodes = gateNodes.filter((n) => n.data?.label === "Qubit Circuit");
  if (qubitNodes.length === 0) return null;

  // determine the qubit order from the Y position
  const sortedQubits = [...qubitNodes].sort((a, b) => {
    const ay = a.positionAbsolute?.y ?? a.position.y;
    const by = b.positionAbsolute?.y ?? b.position.y;
    return ay - by;
  });

  // qubit index map: node ID -> global index
  const qubitIndexMap = new Map<string, number>();
  sortedQubits.forEach((q, i) => qubitIndexMap.set(q.id, i));

  // identifier to qubit index map, used for the inputs references
  const identifierToIndex = new Map<string, number>();
  sortedQubits.forEach((q, i) => {
    const ids: string[] = q.data?.identifiers ?? [];
    ids.forEach((id) => identifierToIndex.set(id, i));
  });

  // topologically sort the gate nodes, excluding the qubit sources
  const nonQubitGates = gateNodes.filter(
    (n) => n.data?.label !== "Qubit Circuit",
  );

  // topological sort via Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const gate of nonQubitGates) {
    inDegree.set(gate.id, 0);
    adjList.set(gate.id, []);
  }

  for (const edge of edges) {
    const sourceIsGate = nonQubitGates.some((g) => g.id === edge.source);
    const targetIsGate = nonQubitGates.some((g) => g.id === edge.target);
    if (sourceIsGate && targetIsGate) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const queue = nonQubitGates
    .filter((g) => (inDegree.get(g.id) ?? 0) === 0)
    .sort((a, b) => {
      const ax = a.positionAbsolute?.x ?? a.position.x;
      const bx = b.positionAbsolute?.x ?? b.position.x;
      return ax - bx;
    })
    .map((g) => g.id);

  const sortedGateIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    sortedGateIds.push(id);

    const neighbors = (adjList.get(id) ?? []).sort((a, b) => {
      const an = nonQubitGates.find((g) => g.id === a);
      const bn = nonQubitGates.find((g) => g.id === b);
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

  // assemble the QASM
  const numQubits = sortedQubits.length;
  const lines: string[] = ["OPENQASM 2.0;", `qreg q[${numQubits}];`, ""];

  // generate the gate instructions
  for (const gateId of sortedGateIds) {
    const gate = nonQubitGates.find((g) => g.id === gateId);
    if (!gate) continue;

    const label: string = gate.data?.label ?? "";
    const qasmName = LABEL_TO_QASM[label];
    if (!qasmName) continue; // skip unknown gates

    // derive the qubit indices from the inputs array
    const inputs: any[] = gate.data?.inputs ?? [];
    const qubitIndices: number[] = [];

    for (const input of inputs) {
      // directly via the identifiers
      const ids: string[] = input.identifiers ?? [];
      for (const identifier of ids) {
        const idx = identifierToIndex.get(identifier);
        if (idx !== undefined && !qubitIndices.includes(idx)) {
          qubitIndices.push(idx);
          break;
        }
      }
    }

    // fallback: use the Y position of the source nodes
    if (qubitIndices.length === 0) {
      const sourceEdges = edges.filter((e) => e.target === gateId);
      const sourceNodes = sourceEdges
        .map((e) => nodes.find((n) => n.id === e.source))
        .filter(Boolean) as Node[];
      sourceNodes.sort((a, b) => {
        const ay = a.positionAbsolute?.y ?? a.position.y;
        const by = b.positionAbsolute?.y ?? b.position.y;
        return ay - by;
      });
      for (const src of sourceNodes) {
        const idx =
          qubitIndexMap.get(src.id) ??
          (() => {
            // walk backwards along the chain until the qubit is reached
            let cur: Node | undefined = src;
            while (cur && cur.data?.label !== "Qubit Circuit") {
              const prevEdge = edges.find((e) => e.target === cur!.id);
              cur = prevEdge
                ? nodes.find((n) => n.id === prevEdge.source)
                : undefined;
            }
            return cur ? qubitIndexMap.get(cur.id) : undefined;
          })();
        if (idx !== undefined && !qubitIndices.includes(idx)) {
          qubitIndices.push(idx);
        }
      }
    }

    if (qubitIndices.length === 0) continue;

    const qubitArgs = qubitIndices.map((i) => `q[${i}]`).join(", ");
    const param = gate.data?.parameter;

    if (
      PARAMETRIC_GATES.has(qasmName) &&
      param !== undefined &&
      param !== "0" &&
      param !== ""
    ) {
      lines.push(`${qasmName}(${param}) ${qubitArgs};`);
    } else if (PARAMETRIC_GATES.has(qasmName)) {
      lines.push(`${qasmName}(0) ${qubitArgs};`);
    } else {
      lines.push(`${qasmName} ${qubitArgs};`);
    }
  }

  return lines.join("\n");
}
