/**
 * Links the steps of Math Mode to the lines of the OpenQASM editor. Math Mode computes the
 * steps from the QASM of a circuit (component), the editor shows the QASM of the whole
 * model (or code the user is typing), so a gate is identified by the canvas node it was
 * compiled from and its position within that node rather than by its line number.
 */

import { parseQasm } from "./qasmToDirac";

export interface GateLocator {
  /** Canvas node the gate was compiled from, if the QASM has node sections. */
  nodeId?: string;
  /** Position of the gate among the gates of its node (or of the whole QASM). */
  indexInNode: number;
  /** Position of the gate in the whole QASM, used when the node is not found. */
  index: number;
}

interface LocatedGate extends GateLocator {
  line: number;
}

const cache = new Map<string, LocatedGate[]>();

function locatedGates(qasm: string): LocatedGate[] {
  const cached = cache.get(qasm);
  if (cached) return cached;
  let gates: LocatedGate[] = [];
  try {
    const perNode = new Map<string | undefined, number>();
    gates = parseQasm(qasm)
      .gates.filter((g) => g.name !== "measure" && g.line !== undefined)
      .map((g, index) => {
        const indexInNode = perNode.get(g.nodeId) ?? 0;
        perNode.set(g.nodeId, indexInNode + 1);
        return { nodeId: g.nodeId, indexInNode, index, line: g.line! };
      });
  } catch {
    // incomplete QASM while typing: no gates to link
  }
  if (cache.size > 20) cache.clear();
  cache.set(qasm, gates);
  return gates;
}

/** The gate on a (0-based) line of the QASM, or null if the line holds no gate. */
export function gateAtLine(qasm: string, line: number): GateLocator | null {
  const gate = locatedGates(qasm).find((g) => g.line === line);
  return gate
    ? { nodeId: gate.nodeId, indexInNode: gate.indexInNode, index: gate.index }
    : null;
}

/** The (0-based) line of a gate in the QASM, or null if it is not found. */
export function lineOfGate(qasm: string, gate: GateLocator): number | null {
  const gates = locatedGates(qasm);
  if (gate.nodeId && gates.some((g) => g.nodeId === gate.nodeId)) {
    return (
      gates.find(
        (g) => g.nodeId === gate.nodeId && g.indexInNode === gate.indexInNode,
      )?.line ?? null
    );
  }
  return gates[gate.index]?.line ?? null;
}

export function sameGate(a: GateLocator, b: GateLocator): boolean {
  return a.nodeId && b.nodeId
    ? a.nodeId === b.nodeId && a.indexInNode === b.indexInNode
    : a.index === b.index;
}

/**
 * What a (0-based) line declares about qubits: "register" for the qubit register of the
 * whole circuit ("qubit[3] q;", "qreg q[3];"), "alias" for a qubit alias of a node
 * ("let leqo_..._q0 = leqo_reg[{0}];"), otherwise null.
 */
export function qubitLineKind(
  qasm: string,
  line: number,
): "register" | "alias" | null {
  const text = qasm.split("\n")[line]?.trim() ?? "";
  if (/^(qubit(\[\d+\])?\s+\w+|qreg\s+\w+\s*\[\d+\])\s*;/.test(text))
    return "register";
  if (/^let\s+\S+\s*=\s*\w+\[/.test(text)) return "alias";
  return null;
}

/** Canvas node whose "Start node <id>" … "End node <id>" section contains the line. */
export function nodeSectionAtLine(qasm: string, line: number): string | null {
  const lines = qasm.split("\n");
  for (let i = line; i >= 0; i--) {
    if (i < line && /\/\*\s*End node [\w-]+\s*\*\//.test(lines[i])) return null;
    const start = lines[i].match(/\/\*\s*Start node ([\w-]+)\s*\*\//);
    if (start) return start[1];
  }
  return null;
}
