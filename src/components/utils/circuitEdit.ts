/**
 * Editable circuit model for Math Mode: the user can change the initial state, add,
 * remove or replace steps and see the resulting matrices and states before the change
 * is written back as OpenQASM and applied to the low-code canvas.
 */

import { parseQasm, simulate, type Complex } from "./qasmToDirac";

export interface EditableGate {
  /** QASM gate name, e.g. "h", "cx", "ccx" or "mc_z". */
  name: string;
  /** Global qubit indices, controls first. */
  qubits: number[];
  /** Angles in radians. */
  params: number[];
  /** Number of controls for "mc_<gate>" gates (ctrl(N) @ gate). */
  numControls?: number;
}

export interface EditableCircuit {
  numQubits: number;
  /** Initial basis state, q0 is the leftmost bit, e.g. "01" for |01⟩. */
  initialBits: string;
  gates: EditableGate[];
}

export interface GateSpec {
  name: string;
  /** Label shown in the editor. */
  label: string;
  /** Number of qubits the gate acts on. */
  arity: number;
  /** Names of the qubit roles, in QASM argument order. */
  roles: string[];
  /** True for gates with one angle parameter. */
  hasParam?: boolean;
}

/** Gates the editor offers; all of them exist in the palette of the low-code canvas. */
export const GATE_CATALOG: GateSpec[] = [
  { name: "h", label: "H (Hadamard)", arity: 1, roles: ["target"] },
  { name: "x", label: "X (NOT)", arity: 1, roles: ["target"] },
  { name: "y", label: "Y", arity: 1, roles: ["target"] },
  { name: "z", label: "Z", arity: 1, roles: ["target"] },
  { name: "s", label: "S", arity: 1, roles: ["target"] },
  { name: "sdg", label: "S†", arity: 1, roles: ["target"] },
  { name: "t", label: "T", arity: 1, roles: ["target"] },
  { name: "tdg", label: "T†", arity: 1, roles: ["target"] },
  { name: "rx", label: "RX(θ)", arity: 1, roles: ["target"], hasParam: true },
  { name: "ry", label: "RY(θ)", arity: 1, roles: ["target"], hasParam: true },
  { name: "rz", label: "RZ(θ)", arity: 1, roles: ["target"], hasParam: true },
  { name: "cx", label: "CNOT", arity: 2, roles: ["control", "target"] },
  { name: "cy", label: "CY", arity: 2, roles: ["control", "target"] },
  { name: "cz", label: "CZ", arity: 2, roles: ["control", "target"] },
  { name: "ch", label: "CH", arity: 2, roles: ["control", "target"] },
  { name: "swap", label: "SWAP", arity: 2, roles: ["qubit", "qubit"] },
  {
    name: "crx",
    label: "CRX(θ)",
    arity: 2,
    roles: ["control", "target"],
    hasParam: true,
  },
  {
    name: "cry",
    label: "CRY(θ)",
    arity: 2,
    roles: ["control", "target"],
    hasParam: true,
  },
  {
    name: "crz",
    label: "CRZ(θ)",
    arity: 2,
    roles: ["control", "target"],
    hasParam: true,
  },
  {
    name: "ccx",
    label: "Toffoli (CCX)",
    arity: 3,
    roles: ["control", "control", "target"],
  },
  {
    name: "cswap",
    label: "CSWAP (Fredkin)",
    arity: 3,
    roles: ["control", "qubit", "qubit"],
  },
];

const ALIASES: Record<string, string> = { cnot: "cx", toffoli: "ccx" };

export function gateSpec(name: string): GateSpec | undefined {
  const key = ALIASES[name] ?? name;
  return GATE_CATALOG.find((g) => g.name === key);
}

/** Number of qubits a gate needs (controls included). */
export function gateArity(gate: EditableGate): number {
  return gateSpec(gate.name)?.arity ?? gate.qubits.length;
}

/** Short display label, e.g. "CNOT q0→q1" or "RX(π/2) q2". */
export function gateDisplayLabel(gate: EditableGate): string {
  const spec = gateSpec(gate.name);
  const base = spec
    ? spec.label.replace(/\s*\(.*\)$/, "").replace("(θ)", "")
    : gate.name.startsWith("mc_")
      ? `C${"C".repeat((gate.numControls ?? 1) - 1)}${gate.name.slice(3).toUpperCase()}`
      : gate.name.toUpperCase();
  const param = spec?.hasParam ? `(${formatAngle(gate.params[0] ?? 0)})` : "";
  const qs = gate.qubits.map((q) => `q${q}`);
  const controls = spec
    ? spec.roles.filter((r) => r === "control").length
    : (gate.numControls ?? 0);
  const qubitText =
    controls > 0 && controls < qs.length
      ? `${qs.slice(0, controls).join(",")}→${qs.slice(controls).join(",")}`
      : qs.join(",");
  return `${base}${param} ${qubitText}`;
}

const ANGLES: [number, string, string][] = [
  [Math.PI, "π", "pi"],
  [Math.PI / 2, "π/2", "pi/2"],
  [Math.PI / 4, "π/4", "pi/4"],
  [Math.PI / 8, "π/8", "pi/8"],
  [(3 * Math.PI) / 2, "3π/2", "3*pi/2"],
  [(3 * Math.PI) / 4, "3π/4", "3*pi/4"],
];

export function formatAngle(value: number, qasm = false): string {
  if (Math.abs(value) < 1e-9) return "0";
  for (const [v, unicode, text] of ANGLES) {
    if (Math.abs(Math.abs(value) - v) < 1e-9)
      return (value < 0 ? "-" : "") + (qasm ? text : unicode);
  }
  return String(Number(value.toFixed(6)));
}

/** Parses an angle such as "pi/2", "π/4", "0.5" or "90°". Returns null if invalid. */
export function parseAngle(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const degrees = trimmed.endsWith("°");
  const expr = (degrees ? trimmed.slice(0, -1) : trimmed)
    .replace(/π/g, "pi")
    .replace(/\bpi\b/gi, `(${Math.PI})`);
  if (!/^[\d\s.+\-*/()e]*$/i.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)() as number;
    if (!Number.isFinite(value)) return null;
    return degrees ? (value * Math.PI) / 180 : value;
  } catch {
    return null;
  }
}

/**
 * Builds the editable circuit from QASM. X gates that are the very first operation on
 * their qubit are read as the preparation of the initial state (every qubit starts in
 * |0⟩, so an initial |1⟩ is always produced by an X gate). Measurements are dropped.
 */
export function circuitFromQasm(qasm: string): EditableCircuit {
  const { numQubits, gates } = parseQasm(qasm);
  const bits = Array.from({ length: numQubits }, () => "0");
  const touched = new Set<number>();
  const result: EditableGate[] = [];

  for (const gate of gates) {
    if (gate.name === "measure") continue;
    const q = gate.qubits[0];
    if (gate.name === "x" && !touched.has(q) && bits[q] === "0") {
      bits[q] = "1";
      continue;
    }
    gate.qubits.forEach((qubit) => touched.add(qubit));
    result.push({
      name: ALIASES[gate.name] ?? gate.name,
      qubits: [...gate.qubits],
      params: [...gate.params],
      numControls: gate.numControls,
    });
  }

  return { numQubits, initialBits: bits.join(""), gates: result };
}

function gateToQasmLine(gate: EditableGate): string {
  const qubits = gate.qubits.map((q) => `q[${q}]`).join(", ");
  if (gate.name.startsWith("mc_")) {
    const n = gate.numControls ?? 1;
    return `ctrl${n > 1 ? `(${n})` : ""} @ ${gate.name.slice(3)} ${qubits};`;
  }
  const params =
    gate.params.length > 0
      ? `(${gate.params.map((p) => formatAngle(p, true)).join(", ")})`
      : "";
  return `${gate.name}${params} ${qubits};`;
}

/**
 * OpenQASM 3 for the edited circuit. With `includeInitialState` the initial state is
 * prepared with X gates (needed for the canvas and the backend, where every qubit
 * starts in |0⟩); without it, only the steps are emitted.
 */
export function circuitToQasm(
  circuit: EditableCircuit,
  includeInitialState = true,
): string {
  const preparation = includeInitialState
    ? circuit.initialBits
        .split("")
        .map((bit, q) => (bit === "1" ? `x q[${q}];` : null))
        .filter((line): line is string => line !== null)
    : [];
  return [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    `qubit[${circuit.numQubits}] q;`,
    "",
    ...(preparation.length > 0
      ? [
          `// initial state |${circuit.initialBits}⟩ (every qubit starts in |0⟩)`,
          ...preparation,
          "",
        ]
      : []),
    ...circuit.gates.map(gateToQasmLine),
  ].join("\n");
}

/**
 * Checks whether a gate fits into the register. Returns a message explaining what is
 * missing, e.g. that a Toffoli gate needs a matrix on 3 qubits, or null if it fits.
 */
export function validateGate(
  gate: EditableGate,
  numQubits: number,
): string | null {
  const spec = gateSpec(gate.name);
  const arity = gateArity(gate);
  const name = spec?.label ?? gate.name.toUpperCase();
  if (arity > numQubits) {
    const dim = 2 ** arity;
    return `${name} acts on ${arity} qubits, so its matrix is ${dim}×${dim} and needs at least ${arity} qubits. The register has only ${numQubits} qubit${numQubits === 1 ? "" : "s"} (${2 ** numQubits}×${2 ** numQubits} matrices). Add ${arity - numQubits} qubit${arity - numQubits === 1 ? "" : "s"} first.`;
  }
  if (gate.qubits.some((q) => q < 0 || q >= numQubits)) {
    return `${name} uses a qubit that does not exist in the ${numQubits}-qubit register.`;
  }
  if (new Set(gate.qubits).size !== gate.qubits.length) {
    return `${name} must act on ${arity} different qubits.`;
  }
  return null;
}

/** First valid qubit assignment for a gate: q0, q1, ... */
export function defaultQubits(arity: number): number[] {
  return Array.from({ length: arity }, (_, i) => i);
}

/**
 * Matrix of a gate on the whole register (2^n x 2^n). Column j is the state the gate
 * produces from the basis state |j⟩, so the first column belongs to |0...0⟩.
 */
export function registerMatrix(
  gate: EditableGate,
  numQubits: number,
): Complex[][] {
  const dim = 1 << numQubits;
  const columns: Complex[][] = [];
  for (let j = 0; j < dim; j++) {
    const bits = j.toString(2).padStart(numQubits, "0");
    const prepare = bits
      .split("")
      .map((bit, q) =>
        bit === "1" ? { name: "x", qubits: [q], params: [] } : null,
      )
      .filter(
        (g): g is { name: string; qubits: number[]; params: never[] } => !!g,
      );
    columns.push(simulate(numQubits, [...prepare, gate]).sv);
  }
  // transpose: rows[i][j] = <i|U|j>
  return Array.from({ length: dim }, (_, i) => columns.map((col) => col[i]));
}

/** Matrix of the gate on its own qubits only (2^k x 2^k), with q0 of the gate leftmost. */
export function localMatrix(gate: EditableGate): Complex[][] {
  const arity = gateArity(gate);
  return registerMatrix(
    { ...gate, qubits: Array.from({ length: arity }, (_, i) => i) },
    arity,
  );
}

export function basisLabels(numQubits: number): string[] {
  return Array.from({ length: 1 << numQubits }, (_, i) =>
    i.toString(2).padStart(numQubits, "0"),
  );
}

function formatReal(x: number): string {
  const abs = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (Math.abs(abs - 1) < 1e-9) return `${sign}1`;
  if (Math.abs(abs - Math.SQRT1_2) < 1e-9)
    return `${sign}\\tfrac{1}{\\sqrt{2}}`;
  if (Math.abs(abs - 0.5) < 1e-9) return `${sign}\\tfrac{1}{2}`;
  return String(Number(x.toFixed(3)));
}

/** LaTeX for a single matrix entry. */
export function complexToLatex(c: Complex): string {
  const re = Math.abs(c.re) < 1e-9 ? 0 : c.re;
  const im = Math.abs(c.im) < 1e-9 ? 0 : c.im;
  if (im === 0) return re === 0 ? "0" : formatReal(re);
  const imPart =
    Math.abs(Math.abs(im) - 1) < 1e-9
      ? `${im < 0 ? "-" : ""}i`
      : `${formatReal(im)}i`;
  if (re === 0) return imPart;
  return `${formatReal(re)}${im < 0 ? "" : "+"}${imPart}`;
}

/**
 * LaTeX array of a matrix with the basis states as column (input) and row (output)
 * labels, so the reader sees that column j belongs to the basis state |j⟩.
 */
export function labeledMatrixLatex(
  matrix: Complex[][],
  numQubits: number,
): string {
  const labels = basisLabels(numQubits);
  const header = labels.map((l) => `|${l}\\rangle`).join(" & ");
  const rows = matrix
    .map(
      (row, i) =>
        `\\langle ${labels[i]}| & ${row.map(complexToLatex).join(" & ")}`,
    )
    .join(" \\\\ ");
  return `\\begin{array}{c|${"c".repeat(labels.length)}} & ${header} \\\\ \\hline ${rows} \\end{array}`;
}
