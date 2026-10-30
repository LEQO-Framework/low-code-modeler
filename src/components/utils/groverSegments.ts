/**
 * Structural detection of Grover algorithm components (superposition, oracle,
 * diffusion operator) within the gate sequence of a single canvas node.
 *
 * Every ParsedGate carries the UUID of the node it originated from (see the
 * "/* Start node <id> *\/" markers in the raw QASM). Detection is therefore
 * scoped per node: only a contiguous run of gates belonging to one node is
 * tested against the Grover template. A circuit assembled from individual gate
 * nodes never matches, because each of its gates has a different node ID.
 *
 * The diffusion operator has a fixed, unambiguous shape:
 *
 *   H on all qubits | X on all qubits | MCZ | X on all qubits | H on all qubits
 *
 * Everything between two diffusion operators is the oracle by definition, which
 * keeps detection independent of the marked state and of the qubit count.
 *
 * If a run does not match, no annotation is produced (fail-safe).
 */

/** Minimal gate shape required here; ParsedGate satisfies it structurally. */
export interface SegmentableGate {
  name: string;
  /** Qubit indices; for ccx/mcx the target is the last entry. */
  qubits: number[];
  /** Canvas node this gate originated from. */
  nodeId?: string;
}

export type GroverComponentKind = "superposition" | "oracle" | "diffusor";

export interface GroverSegment {
  /** Index of the first gate of the segment, relative to the run (inclusive). */
  start: number;
  /** Index of the last gate of the segment, relative to the run (inclusive). */
  end: number;
  kind: GroverComponentKind;
  /** 1-based Grover iteration; undefined for the initial superposition. */
  iteration?: number;
}

const MCX_NAMES = new Set(["ccx", "toffoli", "mcx"]);
const CZ_NAMES = new Set(["cz", "ccz", "mcz"]);

function gateName(g: SegmentableGate): string {
  return g.name.toLowerCase();
}

/** True for the ctrl(N) @ x modifier form produced by parseQasm ("mc_x"). */
function isMultiControlledX(g: SegmentableGate): boolean {
  const n = gateName(g);
  return MCX_NAMES.has(n) || n === "mc_x";
}

/**
 * Matches a layer of `name` gates covering every qubit of `qubits` exactly once.
 * Returns the index after the layer, or -1 if it does not match.
 */
function matchFullLayer(
  gates: SegmentableGate[],
  i: number,
  name: string,
  qubits: number[],
): number {
  const width = qubits.length;
  if (i + width > gates.length) return -1;
  const seen = new Set<number>();
  for (let k = i; k < i + width; k++) {
    const g = gates[k];
    if (gateName(g) !== name) return -1;
    if (g.qubits.length !== 1) return -1;
    if (!qubits.includes(g.qubits[0])) return -1;
    if (seen.has(g.qubits[0])) return -1;
    seen.add(g.qubits[0]);
  }
  return seen.size === width ? i + width : -1;
}

/**
 * Matches a multi-controlled Z, either as an explicit CZ-family gate or as the
 * H-MCX-H decomposition on a common target qubit.
 * Returns the index after the block, or -1 if it does not match.
 */
function matchMCZ(gates: SegmentableGate[], i: number): number {
  if (i >= gates.length) return -1;
  if (CZ_NAMES.has(gateName(gates[i]))) return i + 1;

  if (i + 2 >= gates.length) return -1;
  const [h1, mcx, h2] = [gates[i], gates[i + 1], gates[i + 2]];
  if (gateName(h1) !== "h" || gateName(h2) !== "h") return -1;
  if (!isMultiControlledX(mcx)) return -1;
  if (h1.qubits.length !== 1 || h2.qubits.length !== 1) return -1;

  const target = mcx.qubits[mcx.qubits.length - 1];
  if (h1.qubits[0] !== target || h2.qubits[0] !== target) return -1;
  return i + 3;
}

/** Matches a full diffusion operator starting at i, or returns -1. */
function matchDiffusor(
  gates: SegmentableGate[],
  i: number,
  qubits: number[],
): number {
  let j = matchFullLayer(gates, i, "h", qubits);
  if (j < 0) return -1;
  j = matchFullLayer(gates, j, "x", qubits);
  if (j < 0) return -1;
  j = matchMCZ(gates, j);
  if (j < 0) return -1;
  j = matchFullLayer(gates, j, "x", qubits);
  if (j < 0) return -1;
  return matchFullLayer(gates, j, "h", qubits);
}

/**
 * Splits a single node's gate sequence into Grover components.
 * Returns null if the sequence does not follow the expected structure.
 */
export function detectGroverSegments(
  gates: SegmentableGate[],
  qubits?: number[],
): GroverSegment[] | null {
  if (gates.length === 0) return null;

  // Qubits touched by this run, ascending.
  const used =
    qubits ??
    [...new Set(gates.flatMap((g) => g.qubits))].sort((a, b) => a - b);
  if (used.length < 2) return null;

  const segments: GroverSegment[] = [];

  // 1. Initial superposition: one H layer over all qubits of the run.
  const afterInit = matchFullLayer(gates, 0, "h", used);
  if (afterInit < 0) return null;
  segments.push({ start: 0, end: afterInit - 1, kind: "superposition" });

  // 2. Alternating oracle / diffusion blocks.
  let i = afterInit;
  let iteration = 0;

  while (i < gates.length) {
    const afterDiffusor = matchDiffusor(gates, i, used);

    if (afterDiffusor > 0) {
      // A diffusion operator without a preceding oracle would be malformed.
      if (segments[segments.length - 1].kind !== "oracle") return null;
      segments.push({
        start: i,
        end: afterDiffusor - 1,
        kind: "diffusor",
        iteration,
      });
      i = afterDiffusor;
      continue;
    }

    // Not a diffusion operator: scan forward for the next one;
    // everything up to it is the oracle.
    let next = -1;
    for (let d = i + 1; d < gates.length; d++) {
      if (matchDiffusor(gates, d, used) > 0) {
        next = d;
        break;
      }
    }
    if (next < 0) return null; // trailing gates without a closing diffusion operator

    iteration += 1;
    segments.push({ start: i, end: next - 1, kind: "oracle", iteration });
    i = next;
  }

  return segments.some((s) => s.kind === "diffusor") ? segments : null;
}

/** Human-readable label shown above the corresponding intermediate steps. */
export function groverComponentLabel(segment: GroverSegment): string {
  switch (segment.kind) {
    case "superposition":
      return "Uniform superposition";
    case "oracle":
      return `Oracle (iteration ${segment.iteration})`;
    case "diffusor":
      return `Diffusion operator (iteration ${segment.iteration})`;
  }
}

export interface GroverAnalysis {
  /** Component label per gate index, aligned with the input gate array. */
  lookup: (string | undefined)[];
  /** Number of Grover iterations found, 0 if no Grover node is present. */
  iterations: number;
  /** Qubits of the detected Grover register, empty if none. */
  qubits: number[];
  /**
   * Gate index range of the first oracle segment, relative to the input gate array.
   * The caller can replay these gates to determine which basis states the oracle
   * marks, and therefore M. Null if no Grover node was detected.
   */
  oracleRange: { start: number; end: number } | null;
}

/**
 * Groups gates into contiguous runs by node ID, tests each run against the
 * Grover template and builds a per-gate-index lookup of component labels.
 */
export function analyzeGrover(gates: SegmentableGate[]): GroverAnalysis {
  const lookup: (string | undefined)[] = Array.from(
    { length: gates.length },
    () => undefined,
  );
  let iterations = 0;
  let groverQubits: number[] = [];
  let oracleRange: { start: number; end: number } | null = null;

  let i = 0;
  while (i < gates.length) {
    const id = gates[i].nodeId;
    let j = i;
    while (j < gates.length && gates[j].nodeId === id) j++;

    // A run needs a node ID and enough gates to hold at least one iteration.
    if (id && j - i >= 8) {
      const run = gates.slice(i, j);
      const segments = detectGroverSegments(run);
      if (segments) {
        for (const seg of segments) {
          const label = groverComponentLabel(seg);
          for (let k = seg.start; k <= seg.end; k++) lookup[i + k] = label;
        }
        iterations = Math.max(
          iterations,
          segments.filter((s) => s.kind === "diffusor").length,
        );
        groverQubits = [...new Set(run.flatMap((g) => g.qubits))].sort(
          (a, b) => a - b,
        );
        const firstOracle = segments.find((s) => s.kind === "oracle");
        if (firstOracle) {
          oracleRange = {
            start: i + firstOracle.start,
            end: i + firstOracle.end,
          };
        }
      }
    }
    i = j;
  }

  return { lookup, iterations, qubits: groverQubits, oracleRange };
}
