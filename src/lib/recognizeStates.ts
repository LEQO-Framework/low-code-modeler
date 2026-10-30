/**
 * Recognizes well-known states that a circuit prepares from |0...0⟩: the four Bell
 * states, GHZ, W, the uniform superposition and basis encodings of a number. The
 * low-code canvas puts the gates that prepare such a state into a group (e.g.
 * "Bell state Φ⁺") that can be collapsed into the compact low-code block (Prepare State,
 * or Number → Basis Encoding) and expanded back into the circuit.
 */

import { simulate, type Complex } from "@/components/utils/qasmToDirac";

export interface RecognizedState {
  /** "prepare": Prepare State block, "basis": Number → Basis Encoding. */
  kind: "prepare" | "basis";
  /** Prepare State dropdown value ("Bell State φ+", "GHZ", ...), "Basis Encoding" for basis. */
  quantumStateName: string;
  /** Label of the group on the canvas, e.g. "Bell state Φ⁺". */
  label: string;
  size: number;
  /** Encoded number (basis encoding only). */
  value?: number;
}

export interface SimGate {
  name: string;
  qubits: number[];
  params: number[];
}

export interface StatePreparationMatch {
  /** Global qubit indices, ascending. */
  qubits: number[];
  /** Indices of the gates (in circuit order) that prepare the state. */
  gateIndices: number[];
  state: RecognizedState;
}

const EPS = 1e-6;
const near = (a: number, b: number) => Math.abs(a - b) < EPS;

const BELL_LABELS: Record<string, string> = {
  "Bell State φ+": "Bell state Φ⁺",
  "Bell State φ-": "Bell state Φ⁻",
  "Bell State ψ+": "Bell state Ψ⁺",
  "Bell State ψ-": "Bell state Ψ⁻",
};

export function stateLabel(quantumStateName: string, size: number): string {
  if (BELL_LABELS[quantumStateName]) return BELL_LABELS[quantumStateName];
  if (quantumStateName === "GHZ") return `GHZ state (${size} qubits)`;
  if (quantumStateName === "W-State") return `W state (${size} qubits)`;
  if (quantumStateName === "Uniform Superposition")
    return `Uniform superposition (${size} qubits)`;
  return quantumStateName;
}

/**
 * Basis state of an encoded number in the Dirac notation of Math Mode (q0 leftmost).
 * The backend puts the least significant bit on the first qubit, so 6 = 110₂ is |011⟩.
 */
export function basisKet(value: number): string {
  return `|${value.toString(2).split("").reverse().join("")}⟩`;
}

export function basisLabel(value: number): string {
  return `Basis encoding ${value} = ${basisKet(value)}`;
}

const prepared = (quantumStateName: string, size: number): RecognizedState => ({
  kind: "prepare",
  quantumStateName,
  label: stateLabel(quantumStateName, size),
  size,
});

function popcount(i: number): number {
  let c = 0;
  for (let x = i; x; x &= x - 1) c++;
  return c;
}

/**
 * Checks whether a state vector (q0 = most significant bit) is a Bell, GHZ, W or uniform
 * superposition state, up to a global phase.
 */
export function recognizeState(
  sv: Complex[],
  numQubits: number,
): RecognizedState | null {
  const first = sv.find((a) => a.re * a.re + a.im * a.im > 1e-12);
  if (!first || numQubits < 2) return null;
  // divide out the global phase so that the first amplitude is real and positive
  const r = Math.hypot(first.re, first.im);
  const pr = first.re / r;
  const pi = -first.im / r;
  const v = sv.map((a) => ({
    re: a.re * pr - a.im * pi,
    im: a.re * pi + a.im * pr,
  }));
  const nonZero = v
    .map((a, i) => (a.re * a.re + a.im * a.im > 1e-9 ? i : -1))
    .filter((i) => i >= 0);
  const is = (i: number, re: number) => near(v[i].re, re) && near(v[i].im, 0);
  const h = Math.SQRT1_2;

  if (nonZero.length === 2) {
    const [a, b] = nonZero;
    if (numQubits === 2) {
      if (a === 0 && b === 3 && is(0, h)) {
        if (is(3, h)) return prepared("Bell State φ+", 2);
        if (is(3, -h)) return prepared("Bell State φ-", 2);
      }
      if (a === 1 && b === 2 && is(1, h)) {
        if (is(2, h)) return prepared("Bell State ψ+", 2);
        if (is(2, -h)) return prepared("Bell State ψ-", 2);
      }
    } else if (a === 0 && b === sv.length - 1 && is(a, h) && is(b, h)) {
      return prepared("GHZ", numQubits);
    }
  }

  const w = 1 / Math.sqrt(numQubits);
  if (
    numQubits >= 3 &&
    nonZero.length === numQubits &&
    nonZero.every((i) => popcount(i) === 1 && is(i, w))
  ) {
    return prepared("W-State", numQubits);
  }

  const u = 1 / Math.sqrt(sv.length);
  if (nonZero.length === sv.length && nonZero.every((i) => is(i, u))) {
    return prepared("Uniform Superposition", numQubits);
  }
  return null;
}

const NAME_ALIASES: Record<string, string> = {
  cnot: "cx",
  toffoli: "ccx",
  i: "id",
};

/** Simulates gates on the given qubits only (renumbered 0..k-1 in ascending order). */
function simulateOn(qubits: number[], gates: SimGate[]) {
  const local = new Map(qubits.map((q, i) => [q, i]));
  return simulate(
    qubits.length,
    gates.map((g) => ({
      name: NAME_ALIASES[g.name] ?? g.name,
      qubits: g.qubits.map((q) => local.get(q)!),
      params: g.params,
    })),
  );
}

/** Splits ascending qubit indices into runs of neighbouring qubits. */
function contiguousRuns(qubits: number[]): number[][] {
  const runs: number[][] = [];
  for (const q of qubits) {
    const run = runs.at(-1);
    if (run && run.at(-1) === q - 1) run.push(q);
    else runs.push([q]);
  }
  return runs;
}

/**
 * Finds the parts of a circuit that prepare a recognized state from |0...0⟩.
 *
 * 1. Entangled states (Bell, GHZ, W, and uniform superpositions built with multi-qubit
 *    gates): qubits are clustered by the multi-qubit gates acting on them. Since every
 *    gate on a cluster's qubits belongs to that cluster, each prefix of its gate list is
 *    the very beginning of the circuit on these qubits; after every gate the cluster's
 *    state is checked. Of overlapping candidates, the one with the most qubits wins (GHZ
 *    over the Bell pair it starts with), then the one with the most gates.
 * 2. Uniform superposition: neighbouring remaining qubits that each start in |+⟩
 *    (e.g. an H gate on every qubit), at least two.
 * 3. Basis encoding: neighbouring remaining qubits that start with X gates, from the
 *    first to the last qubit in |1⟩ (qubits in |0⟩ in between belong to the number), at
 *    least two qubits.
 */
export function detectStatePreparations(
  numQubits: number,
  gates: SimGate[],
): StatePreparationMatch[] {
  const parent = Array.from({ length: numQubits }, (_, i) => i);
  const find = (q: number): number => {
    while (parent[q] !== q) q = parent[q] = parent[parent[q]];
    return q;
  };
  const clusterGates = new Map<number, number[]>();
  const poisoned = new Set<number>();
  const candidates: StatePreparationMatch[] = [];
  // gate indices per qubit, in circuit order
  const perQubit: number[][] = Array.from({ length: numQubits }, () => []);
  const valid = (g: SimGate) => g.params.every((p) => Number.isFinite(p));

  gates.forEach((gate, index) => {
    const qubits = gate.qubits.filter((q) => q >= 0 && q < numQubits);
    if (qubits.length === 0) return;
    qubits.forEach((q) => perQubit[q].push(index));
    const roots = [...new Set(qubits.map(find))];
    const root = roots[0];
    const merged: number[] = [];
    let bad = !valid(gate);
    for (const r of roots) {
      merged.push(...(clusterGates.get(r) ?? []));
      if (poisoned.has(r)) bad = true;
      clusterGates.delete(r);
      poisoned.delete(r);
      parent[r] = root;
    }
    merged.sort((a, b) => a - b);
    merged.push(index);
    clusterGates.set(root, merged);
    if (bad) {
      poisoned.add(root);
      return;
    }

    const members = Array.from({ length: numQubits }, (_, q) => q).filter(
      (q) => find(q) === root,
    );
    if (members.length < 2) return;
    const { sv, warnings } = simulateOn(
      members,
      merged.map((i) => gates[i]),
    );
    if (warnings.length > 0) {
      // unknown gate: this cluster cannot be recognized any more
      poisoned.add(root);
      return;
    }
    const state = recognizeState(sv, members.length);
    if (state) {
      candidates.push({ qubits: members, gateIndices: [...merged], state });
    }
  });

  candidates.sort(
    (a, b) =>
      b.qubits.length - a.qubits.length ||
      b.gateIndices.length - a.gateIndices.length,
  );
  const used = new Set<number>();
  const chosen: StatePreparationMatch[] = [];
  for (const c of candidates) {
    if (c.qubits.some((q) => used.has(q))) continue;
    c.qubits.forEach((q) => used.add(q));
    chosen.push(c);
  }

  // single-qubit beginnings of the remaining qubits
  const free = Array.from({ length: numQubits }, (_, q) => q).filter(
    (q) => !used.has(q),
  );
  const leadingSingle = (q: number) => {
    const result: number[] = [];
    for (const i of perQubit[q]) {
      if (gates[i].qubits.length !== 1 || !valid(gates[i])) break;
      result.push(i);
    }
    return result;
  };

  // 2. uniform superposition: the longest single-qubit beginning that yields |+⟩
  const plusPrefix = new Map<number, number[]>();
  for (const q of free) {
    const single = leadingSingle(q);
    for (let len = single.length; len > 0; len--) {
      const prefix = single.slice(0, len);
      const { sv, warnings } = simulateOn(
        [q],
        prefix.map((i) => gates[i]),
      );
      const h = Math.SQRT1_2;
      const r = Math.hypot(sv[0].re, sv[0].im);
      if (warnings.length > 0 || !near(r, h)) continue;
      // relative phase of |1⟩ against |0⟩ must be 0
      const re = (sv[1].re * sv[0].re + sv[1].im * sv[0].im) / (r * r);
      const im = (sv[1].im * sv[0].re - sv[1].re * sv[0].im) / (r * r);
      if (near(re, 1) && near(im, 0)) {
        plusPrefix.set(q, prefix);
        break;
      }
    }
  }
  for (const run of contiguousRuns(free.filter((q) => plusPrefix.has(q)))) {
    if (run.length < 2) continue;
    run.forEach((q) => used.add(q));
    chosen.push({
      qubits: run,
      gateIndices: run.flatMap((q) => plusPrefix.get(q)!).sort((a, b) => a - b),
      state: prepared("Uniform Superposition", run.length),
    });
  }

  // 3. basis encoding: leading X gates (an odd number of them gives |1⟩)
  const remaining = free.filter((q) => !used.has(q));
  const leadingX = new Map<number, number[]>();
  for (const q of remaining) {
    const xs: number[] = [];
    for (const i of perQubit[q]) {
      if (gates[i].name !== "x" || gates[i].qubits.length !== 1) break;
      xs.push(i);
    }
    leadingX.set(q, xs);
  }
  const isOne = (q: number) => (leadingX.get(q)?.length ?? 0) % 2 === 1;
  for (const run of contiguousRuns(remaining)) {
    const ones = run.filter(isOne);
    if (ones.length < 2) continue;
    const qubits = run.filter((q) => q >= ones[0] && q <= ones.at(-1)!);
    const value = qubits.reduce((v, q, k) => (isOne(q) ? v + 2 ** k : v), 0);
    qubits.forEach((q) => used.add(q));
    chosen.push({
      qubits,
      gateIndices: qubits
        .flatMap((q) => leadingX.get(q) ?? [])
        .sort((a, b) => a - b),
      state: {
        kind: "basis",
        quantumStateName: "Basis Encoding",
        label: basisLabel(value),
        size: qubits.length,
        value,
      },
    });
  }

  return chosen.sort((a, b) => a.qubits[0] - b.qubits[0]);
}

const qasmFor = (numQubits: number, lines: string[]) =>
  [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    `qubit[${numQubits}] q;`,
    "",
    ...lines,
  ].join("\n");

/**
 * Circuit for a Prepare State block as OpenQASM, gate for gate the same as the backend
 * compiles it (so the steps of Math Mode match the expanded gate nodes). Null for
 * states without a fixed small circuit.
 */
export function standardStatePreparationQasm(
  quantumStateName: string,
  size: number,
): string | null {
  const bell = ["h q[0];", "cx q[0], q[1];"];
  switch (quantumStateName) {
    case "Bell State φ+":
      return qasmFor(2, bell);
    case "Bell State φ-":
      return qasmFor(2, [...bell, "z q[0];"]);
    case "Bell State ψ+":
      return qasmFor(2, [...bell, "x q[1];"]);
    case "Bell State ψ-":
      return qasmFor(2, [...bell, "x q[1];", "z q[0];"]);
    case "GHZ":
      if (!Number.isInteger(size) || size < 3) return null;
      return qasmFor(size, [
        "h q[0];",
        ...Array.from({ length: size - 1 }, (_, i) => `cx q[0], q[${i + 1}];`),
      ]);
    case "Uniform Superposition":
      if (!Number.isInteger(size) || size < 2) return null;
      return qasmFor(
        size,
        Array.from({ length: size }, (_, q) => `h q[${q}];`),
      );
    default:
      return null;
  }
}

/**
 * Basis encoding of a number as OpenQASM: as many qubits as the number has bits, an X
 * gate on every qubit whose bit is 1, least significant bit on the first qubit (as in
 * the backend).
 */
export function basisEncodingQasm(value: number): string | null {
  if (!Number.isInteger(value) || value < 1) return null;
  const bits = value.toString(2).split("").reverse();
  return qasmFor(
    bits.length,
    bits.flatMap((bit, q) => (bit === "1" ? [`x q[${q}];`] : [])),
  );
}

/** OpenQASM of the matched gates only, on the matched qubits renumbered 0..k-1. */
export function matchToQasm(
  match: StatePreparationMatch,
  gates: SimGate[],
): string {
  const local = new Map(match.qubits.map((q, i) => [q, i]));
  return qasmFor(
    match.qubits.length,
    match.gateIndices.map((i) => {
      const g = gates[i];
      const params =
        g.params.length > 0
          ? `(${g.params.map((p) => String(p)).join(", ")})`
          : "";
      const qubits = g.qubits.map((q) => `q[${local.get(q)}]`).join(", ");
      return `${g.name}${params} ${qubits};`;
    }),
  );
}
