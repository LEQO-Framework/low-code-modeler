/**
 * Transforms an OpenQASM 2 / OpenQASM 3 string into Dirac (bra-ket) notation.
 *
 * Approach: symbolic statevector simulator driven by the parsed gate sequence.
 * Supported gates: H, X, Y, Z, S, T, CNOT (CX), CZ, SWAP, RZ, RX, RY, U1, U2, U3, Measure.
 *
 * Example output for 2 qubits after H on q[0]:
 *   1/√2 |00⟩ + 1/√2 |10⟩
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import { analyzeGrover } from "./groverSegments";

export interface Complex {
  re: number;
  im: number;
}

export interface DiracTerm {
  amplitude: Complex;
  basisState: string; // e.g. "00", "101"
}

export interface DiracResult {
  terms: DiracTerm[]; // all terms with |amplitude|² > THRESHOLD
  latex: string; // LaTeX string of the superposition
  unicode: string; // Unicode string using ⟨ ⟩ brackets
  numQubits: number;
  warnings: string[];
  /** True if the first term carries a non-trivial global phase (e.g. a sign).
   *  The state itself is NOT modified for this - the flag only drives a hint
   *  telling the user that such a phase is not physically measurable.
   *  Only set when calling statevectorToDirac(..., detectGlobalPhase=true). */
  globalPhaseNote?: boolean;
}

// ---------------------------------------------------------------------------
// Complex number helpers
// ---------------------------------------------------------------------------

const C = (re: number, im = 0): Complex => ({ re, im });

function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cmul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function cabs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

const SQRT2_INV = 1 / Math.sqrt(2);

// ---------------------------------------------------------------------------
// Statevector
// ---------------------------------------------------------------------------

function createStatevector(n: number): Complex[] {
  const size = 1 << n;
  const sv: Complex[] = Array.from({ length: size }, () => C(0));
  sv[0] = C(1); // |000...0⟩
  return sv;
}

/** Applies a 2x2 single-qubit matrix to qubit `target`. */
function applySingleQubitGate(
  sv: Complex[],
  n: number,
  target: number,
  m: [Complex, Complex, Complex, Complex], // [m00, m01, m10, m11]
): Complex[] {
  const size = sv.length;
  const result = sv.slice();
  const bit = n - 1 - target; // MSB-first ordering matching QASM convention

  for (let i = 0; i < size; i++) {
    if (i & (1 << bit)) continue; // visit each basis-state pair only once
    const j = i | (1 << bit);
    const a = sv[i];
    const b = sv[j];
    result[i] = cadd(cmul(m[0], a), cmul(m[1], b));
    result[j] = cadd(cmul(m[2], a), cmul(m[3], b));
  }
  return result;
}

/** Controlled unitary: applies the gate to `target` when `control` = 1. */
function applyControlledGate(
  sv: Complex[],
  n: number,
  control: number,
  target: number,
  m: [Complex, Complex, Complex, Complex],
): Complex[] {
  const size = sv.length;
  const result = sv.slice();
  const cBit = n - 1 - control;
  const tBit = n - 1 - target;

  for (let i = 0; i < size; i++) {
    if (!(i & (1 << cBit))) continue; // control must be 1
    if (i & (1 << tBit)) continue; // visit each pair only once
    const j = i | (1 << tBit);
    const a = sv[i];
    const b = sv[j];
    result[i] = cadd(cmul(m[0], a), cmul(m[1], b));
    result[j] = cadd(cmul(m[2], a), cmul(m[3], b));
  }
  return result;
}

/** Swaps two qubits. */
function applySwap(
  sv: Complex[],
  n: number,
  q1: number,
  q2: number,
): Complex[] {
  const result = sv.slice();
  const b1 = n - 1 - q1;
  const b2 = n - 1 - q2;
  const size = sv.length;
  for (let i = 0; i < size; i++) {
    const bit1 = (i >> b1) & 1;
    const bit2 = (i >> b2) & 1;
    if (bit1 !== bit2) {
      const j = i ^ (1 << b1) ^ (1 << b2);
      if (j > i) {
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Gate matrices
// ---------------------------------------------------------------------------

const GATE_H: [Complex, Complex, Complex, Complex] = [
  C(SQRT2_INV),
  C(SQRT2_INV),
  C(SQRT2_INV),
  C(-SQRT2_INV),
];
const GATE_X: [Complex, Complex, Complex, Complex] = [C(0), C(1), C(1), C(0)];
const GATE_Y: [Complex, Complex, Complex, Complex] = [
  C(0),
  C(0, -1),
  C(0, 1),
  C(0),
];
const GATE_Z: [Complex, Complex, Complex, Complex] = [C(1), C(0), C(0), C(-1)];
const GATE_S: [Complex, Complex, Complex, Complex] = [
  C(1),
  C(0),
  C(0),
  C(0, 1),
];
const GATE_T: [Complex, Complex, Complex, Complex] = [
  C(1),
  C(0),
  C(0),
  C(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)),
];
const GATE_SDG: [Complex, Complex, Complex, Complex] = [
  C(1),
  C(0),
  C(0),
  C(0, -1),
];
const GATE_TDG: [Complex, Complex, Complex, Complex] = [
  C(1),
  C(0),
  C(0),
  C(Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4)),
];

function gateRZ(theta: number): [Complex, Complex, Complex, Complex] {
  return [
    C(Math.cos(theta / 2), -Math.sin(theta / 2)),
    C(0),
    C(0),
    C(Math.cos(theta / 2), Math.sin(theta / 2)),
  ];
}
function gateRX(theta: number): [Complex, Complex, Complex, Complex] {
  return [
    C(Math.cos(theta / 2)),
    C(0, -Math.sin(theta / 2)),
    C(0, -Math.sin(theta / 2)),
    C(Math.cos(theta / 2)),
  ];
}
function gateRY(theta: number): [Complex, Complex, Complex, Complex] {
  return [
    C(Math.cos(theta / 2)),
    C(-Math.sin(theta / 2)),
    C(Math.sin(theta / 2)),
    C(Math.cos(theta / 2)),
  ];
}
function gateU3(
  theta: number,
  phi: number,
  lam: number,
): [Complex, Complex, Complex, Complex] {
  return [
    C(Math.cos(theta / 2)),
    C(
      -Math.cos(lam) * Math.sin(theta / 2),
      -Math.sin(lam) * Math.sin(theta / 2),
    ),
    C(Math.cos(phi) * Math.sin(theta / 2), Math.sin(phi) * Math.sin(theta / 2)),
    C(
      Math.cos(phi + lam) * Math.cos(theta / 2),
      Math.sin(phi + lam) * Math.cos(theta / 2),
    ),
  ];
}

// SX = √X gate: 0.5 * [[1+i, 1-i], [1-i, 1+i]]
const GATE_SX: [Complex, Complex, Complex, Complex] = [
  C(0.5, 0.5),
  C(0.5, -0.5),
  C(0.5, -0.5),
  C(0.5, 0.5),
];

// CP(λ): controlled phase - |11⟩ picks up the phase e^(iλ)
function gateCPMatrix(lam: number): [Complex, Complex, Complex, Complex] {
  return [C(1), C(0), C(0), C(Math.cos(lam), Math.sin(lam))];
}

// CU(θ,φ,λ,γ): controlled U with global phase factor γ
function gateCUMatrix(
  theta: number,
  phi: number,
  lam: number,
  gamma: number,
): [Complex, Complex, Complex, Complex] {
  const phase = (a: number) => C(Math.cos(a), Math.sin(a));
  return [
    cmul(phase(gamma), C(Math.cos(theta / 2))),
    cmul(
      phase(gamma),
      C(
        -Math.cos(lam) * Math.sin(theta / 2),
        -Math.sin(lam) * Math.sin(theta / 2),
      ),
    ),
    cmul(
      phase(gamma),
      C(
        Math.cos(phi) * Math.sin(theta / 2),
        Math.sin(phi) * Math.sin(theta / 2),
      ),
    ),
    cmul(
      phase(gamma),
      C(
        Math.cos(phi + lam) * Math.cos(theta / 2),
        Math.sin(phi + lam) * Math.cos(theta / 2),
      ),
    ),
  ];
}

/** Toffoli (CCX): applies X to target when c1 = 1 and c2 = 1. */
function applyToffoli(
  sv: Complex[],
  n: number,
  c1: number,
  c2: number,
  target: number,
): Complex[] {
  const result = sv.slice();
  const b1 = n - 1 - c1;
  const b2 = n - 1 - c2;
  const bt = n - 1 - target;
  for (let i = 0; i < sv.length; i++) {
    if (!(i & (1 << b1))) continue;
    if (!(i & (1 << b2))) continue;
    if (i & (1 << bt)) continue;
    const j = i | (1 << bt);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** CSWAP (Fredkin): swaps t1 and t2 when ctrl = 1. */
function applyCSwap(
  sv: Complex[],
  n: number,
  ctrl: number,
  t1: number,
  t2: number,
): Complex[] {
  const result = sv.slice();
  const bc = n - 1 - ctrl;
  const b1 = n - 1 - t1;
  const b2 = n - 1 - t2;
  for (let i = 0; i < sv.length; i++) {
    if (!(i & (1 << bc))) continue;
    const bit1 = (i >> b1) & 1;
    const bit2 = (i >> b2) & 1;
    if (bit1 === bit2) continue;
    const j = i ^ (1 << b1) ^ (1 << b2);
    if (j > i) [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generalized multi-controlled gate application (ctrl(N) @ gate in OpenQASM 3):
 * applies the matrix `m` to `target` when ALL qubits in `controls` are 1.
 * Generalizes applyControlledGate (N=1) and applyToffoli (N=2, fixed to X)
 * to an arbitrary number of controls and an arbitrary base gate.
 */
function applyMultiControlledGate(
  sv: Complex[],
  n: number,
  controls: number[],
  target: number,
  m: [Complex, Complex, Complex, Complex],
): Complex[] {
  const result = sv.slice();
  const cBits = controls.map((c) => n - 1 - c);
  const tBit = n - 1 - target;

  for (let i = 0; i < sv.length; i++) {
    if (cBits.some((b) => !(i & (1 << b)))) continue; // every control must be 1
    if (i & (1 << tBit)) continue; // visit each pair only once
    const j = i | (1 << tBit);
    const a = sv[i];
    const b = sv[j];
    result[i] = cadd(cmul(m[0], a), cmul(m[1], b));
    result[j] = cadd(cmul(m[2], a), cmul(m[3], b));
  }
  return result;
}

/** Lookup table base gate name -> matrix, used for ctrl(N) @ <name> constructs. */
const GATE_MATRIX_BY_NAME: Record<
  string,
  [Complex, Complex, Complex, Complex]
> = {
  h: GATE_H,
  x: GATE_X,
  y: GATE_Y,
  z: GATE_Z,
  s: GATE_S,
  sdg: GATE_SDG,
  t: GATE_T,
  tdg: GATE_TDG,
  sx: GATE_SX,
};

/**
 * Applies a multi-controlled gate encoded as "mc_<basegate>" to the statevector.
 * Returns `null` for an unknown base gate so the caller can emit a warning.
 */
function applyParsedMultiControlledGate(
  sv: Complex[],
  numQubits: number,
  gate: ParsedGate,
): Complex[] | null {
  const baseName = gate.name.slice(3); // strip the "mc_" prefix
  const matrix = GATE_MATRIX_BY_NAME[baseName];
  if (!matrix) return null;

  const numControls = gate.numControls ?? gate.qubits.length - 1;
  const controls = gate.qubits.slice(0, numControls);
  const targets = gate.qubits.slice(numControls);

  let result = sv;
  for (const target of targets) {
    result = applyMultiControlledGate(
      result,
      numQubits,
      controls,
      target,
      matrix,
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// QASM parser
// ---------------------------------------------------------------------------

interface ParsedGate {
  name: string;
  qubits: number[]; // qubit indices (global, already resolved)
  params: number[]; // numeric parameters
  // Number of control qubits for "mc_<gate>" names (ctrl(N) @ gate modifier syntax).
  // The first `numControls` entries in `qubits` are the controls, the rest are the targets.
  numControls?: number;
  // Canvas node ID of the node whose "Start node ..." comment section this gate came from
  // (if any). Used by the step-click mechanism to highlight the corresponding node on the
  // canvas when a step in the Dirac notation is clicked.
  nodeId?: string;
}

/** Minimal expression evaluator for QASM parameters (pi, *, /, +, -). */
function evalParam(expr: string): number {
  const sanitized = expr.trim().replace(/\bpi\b/gi, String(Math.PI));
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + sanitized + ")")() as number;
  } catch {
    return 0;
  }
}

export function parseQasm(qasm: string): {
  numQubits: number;
  gates: ParsedGate[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const lines = qasm
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").trim())
    .filter((l) => l.length > 0);

  // Build the qubit registers: name -> { start, size }
  const registers: Map<string, { start: number; size: number }> = new Map();
  let totalQubits = 0;

  // ---------------------------------------------------------------------------
  // LEQO alias table: alias name -> global qubit index
  // Example: "let leqo_abc_q0 = leqo_reg[{0}];"
  //       -> aliasMap.set("leqo_abc_q0", 0)
  // ---------------------------------------------------------------------------
  const aliasMap: Map<string, number> = new Map();

  // LEQO array alias: alias name -> [idx0, idx1, ...]
  // Example: "let leqo_abc = leqo_reg[{0, 1}];"
  //       -> aliasArrayMap.set("leqo_abc", [0, 1])
  const aliasArrayMap: Map<string, number[]> = new Map();

  // ---------------------------------------------------------------------------
  // First pass: collect registers and LEQO aliases
  // ---------------------------------------------------------------------------
  for (const line of lines) {
    // OPENQASM 2: qreg q[3];
    const qreg2 = line.match(/^qreg\s+(\w+)\s*\[(\d+)\]/);
    if (qreg2) {
      registers.set(qreg2[1], { start: totalQubits, size: parseInt(qreg2[2]) });
      totalQubits += parseInt(qreg2[2]);
      continue;
    }

    // OPENQASM 3: qubit[3] q;
    const qreg3a = line.match(/^qubit\s*\[(\d+)\]\s+(\w+)/);
    if (qreg3a) {
      registers.set(qreg3a[2], {
        start: totalQubits,
        size: parseInt(qreg3a[1]),
      });
      totalQubits += parseInt(qreg3a[1]);
      continue;
    }

    // OPENQASM 3: qubit q;
    const qreg3b = line.match(/^qubit\s+(\w+)/);
    if (qreg3b && !line.includes("[")) {
      registers.set(qreg3b[1], { start: totalQubits, size: 1 });
      totalQubits += 1;
      continue;
    }

    // LEQO alias using curly braces:
    //   single index: let <alias> = <reg>[{0}];
    //   multi index:  let <alias> = <reg>[{0, 1}];
    //   -> aliasMap:      alias -> first qubit index
    //   -> aliasArrayMap: alias -> [idx0, idx1, ...]  (for alias[n] accesses)
    const leqoAlias = line.match(
      /^let\s+(\w+)\s*=\s*(\w+)\s*\[\s*\{([^}]+)\}\s*\]\s*;?$/,
    );
    if (leqoAlias) {
      const alias = leqoAlias[1];
      const regName = leqoAlias[2];
      const indices = leqoAlias[3].split(",").map((s) => parseInt(s.trim()));
      const reg = registers.get(regName);
      if (reg !== undefined) {
        // first index as the default (for gates used without an index)
        aliasMap.set(alias, reg.start + indices[0]);
        // all indices, for alias[n] accesses
        aliasArrayMap.set(
          alias,
          indices.map((i) => reg.start + i),
        );
      }
      continue;
    }

    // LEQO output alias:
    //   let <alias>_out = <alias>;
    // Example: let leqo_abc_q0_out = leqo_abc_q0;
    const leqoOutAlias = line.match(/^let\s+(\w+)\s*=\s*(\w+)\s*;?$/);
    if (leqoOutAlias) {
      const newAlias = leqoOutAlias[1];
      const srcAlias = leqoOutAlias[2];
      if (aliasMap.has(srcAlias)) {
        aliasMap.set(newAlias, aliasMap.get(srcAlias)!);
      } else {
        // src may be a register without an index (size = 1)
        const reg = registers.get(srcAlias);
        if (reg) aliasMap.set(newAlias, reg.start);
      }
      continue;
    }
  }

  if (totalQubits === 0) {
    warnings.push("No qubit register found. Defaulting to 1 qubit.");
    totalQubits = 1;
  }
  if (totalQubits > 16) {
    warnings.push(
      `Too many qubits (${totalQubits}). A maximum of 16 is supported.`,
    );
    totalQubits = Math.min(totalQubits, 16);
  }

  // ---------------------------------------------------------------------------
  // Resolve a qubit expression:
  //   1. alias[n] -> aliasArrayMap[alias][n]
  //   2. alias    -> aliasMap
  //   3. reg[idx] -> registers
  //   4. reg      -> registers (size = 1)
  // ---------------------------------------------------------------------------
  function resolveQubit(expr: string): number | null {
    const e = expr.trim().replace(/;$/, "");

    // 1. alias[n] - index into a multi-qubit alias (e.g. leqo_abc[1])
    const aliasIdx = e.match(/^(\w+)\[(\d+)\]$/);
    if (aliasIdx) {
      const arr = aliasArrayMap.get(aliasIdx[1]);
      if (arr !== undefined) {
        const n = parseInt(aliasIdx[2]);
        return arr[n] ?? null;
      }
      // fallback: a regular register with standard indices
      const reg = registers.get(aliasIdx[1]);
      if (reg) return reg.start + parseInt(aliasIdx[2]);
    }

    // 2. LEQO alias (exact name without index)
    if (aliasMap.has(e)) return aliasMap.get(e)!;

    // 3. standard form: reg[idx] or reg[{idx}]
    const withIndex = e.match(/^(\w+)\[\{?(\d+)\}?\]$/);
    if (withIndex) {
      const reg = registers.get(withIndex[1]);
      if (!reg) return null;
      return reg.start + parseInt(withIndex[2]);
    }

    // 4. whole register (only meaningful when size = 1)
    const reg = registers.get(e);
    if (reg) return reg.start;

    return null;
  }

  const gates: ParsedGate[] = [];
  // Tracks which canvas node section the current line belongs to, delimited by the
  // "/* Start node <id> */" ... "/* End node <id> */" comments, so every gate can be
  // annotated with its originating node ID for the step-click mechanism in the UI.
  let currentNodeId: string | undefined = undefined;

  // ---------------------------------------------------------------------------
  // Second pass: parse the gates
  // ---------------------------------------------------------------------------
  for (const line of lines) {
    const startNodeMatch = line.match(/^\/\*\s*Start node ([\w-]+)\s*\*\/$/);
    if (startNodeMatch) {
      currentNodeId = startNodeMatch[1];
      continue;
    }
    const endNodeMatch = line.match(/^\/\*\s*End node ([\w-]+)\s*\*\/$/);
    if (endNodeMatch) {
      currentNodeId = undefined;
      continue;
    }

    // skip lines that are not gate calls
    if (
      line.startsWith("OPENQASM") ||
      line.startsWith("include") ||
      line.startsWith("qreg") ||
      line.startsWith("creg") ||
      line.startsWith("qubit") ||
      line.startsWith("bit") ||
      line.startsWith("gate ") ||
      line.startsWith("barrier") ||
      line.startsWith("let ") || // LEQO alias definitions
      line.startsWith("@leqo") || // LEQO annotations
      line.startsWith("/*") || // comments
      line.startsWith("*") ||
      line.startsWith("/")
    ) {
      continue;
    }

    // measurement: measure q[0] -> c[0];
    // LEQO measurement: bit[2] x = measure alias[{0,1}];
    if (
      line.includes("->") ||
      line.startsWith("measure") ||
      line.match(/^bit\b/)
    ) {
      const measureMatch = line.match(/measure\s+(\S+)\s*(?:->|\[)/);
      if (measureMatch) {
        const q = resolveQubit(measureMatch[1]);
        if (q !== null)
          gates.push({
            name: "measure",
            qubits: [q],
            params: [],
            nodeId: currentNodeId,
          });
      }
      continue;
    }

    // OpenQASM 3 modifier syntax: ctrl(N) @ gate q0, q1, ..., qTarget;
    //                          or  ctrl @ gate q0, q1;           (N = 1 implied)
    // Example: ctrl(2) @ z leqo_..._ctrl_0[0], leqo_..._ctrl_1[0], leqo_..._target_0[0];
    // The first N qubits are the controls, the remaining ones the targets.
    const ctrlModMatch = line.match(
      /^ctrl(?:\((\d+)\))?\s*@\s*(\w+)\s+(.+?)\s*;?$/,
    );
    if (ctrlModMatch) {
      const numControls = ctrlModMatch[1] ? parseInt(ctrlModMatch[1]) : 1;
      const baseGate = ctrlModMatch[2].toLowerCase();
      const qubits = ctrlModMatch[3]
        .split(",")
        .map((q) => resolveQubit(q.trim()))
        .filter((q): q is number => q !== null);

      if (qubits.length <= numControls) {
        warnings.push(
          `Multi-controlled gate "${baseGate}": too few qubits resolved — skipped.`,
        );
        continue;
      }

      gates.push({
        name: `mc_${baseGate}`,
        qubits,
        params: [],
        numControls,
        nodeId: currentNodeId,
      });
      continue;
    }

    // gate call: gateName(params) qubit1, qubit2;
    //        or  gateName qubit1, qubit2;
    const gateMatch = line.match(/^(\w+)(?:\(([^)]*)\))?\s+(.+?)\s*;?$/);
    if (!gateMatch) continue;

    const rawName = gateMatch[1].toLowerCase();
    const rawParams = gateMatch[2]
      ? gateMatch[2].split(",").map(evalParam)
      : [];
    const rawQubits = gateMatch[3]
      .split(",")
      .map((q) => resolveQubit(q.trim()))
      .filter((q): q is number => q !== null);

    if (rawQubits.length === 0) continue;

    gates.push({
      name: rawName,
      qubits: rawQubits,
      params: rawParams,
      nodeId: currentNodeId,
    });
  }

  return { numQubits: totalQubits, gates, warnings };
}

// ---------------------------------------------------------------------------
// Simulator
// ---------------------------------------------------------------------------

export function simulate(
  numQubits: number,
  gates: ParsedGate[],
): { sv: Complex[]; warnings: string[] } {
  let sv = createStatevector(numQubits);
  const warnings: string[] = [];

  for (const gate of gates) {
    const [q0, q1] = gate.qubits;
    const [p0, p1, p2] = gate.params;

    // multi-controlled gates from the ctrl(N) @ gate modifier syntax
    if (gate.name.startsWith("mc_")) {
      const applied = applyParsedMultiControlledGate(sv, numQubits, gate);
      if (applied === null) {
        warnings.push(
          `Multi-controlled gate with unknown base gate "${gate.name.slice(3)}" — skipped.`,
        );
        continue;
      }
      sv = applied;
      continue;
    }

    switch (gate.name) {
      case "h":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_H);
        break;
      case "x":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_X);
        break;
      case "y":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_Y);
        break;
      case "z":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_Z);
        break;
      case "s":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_S);
        break;
      case "sdg":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_SDG);
        break;
      case "t":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_T);
        break;
      case "tdg":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_TDG);
        break;
      case "rx":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRX(p0 ?? 0));
        break;
      case "ry":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRY(p0 ?? 0));
        break;
      case "rz":
      case "p":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRZ(p0 ?? 0));
        break;
      case "u1":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRZ(p0 ?? 0));
        break;
      case "u2":
        sv = applySingleQubitGate(
          sv,
          numQubits,
          q0,
          gateU3(Math.PI / 2, p0 ?? 0, p1 ?? 0),
        );
        break;
      case "u3":
      case "u":
        sv = applySingleQubitGate(
          sv,
          numQubits,
          q0,
          gateU3(p0 ?? 0, p1 ?? 0, p2 ?? 0),
        );
        break;
      case "cx":
      case "cnot":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_X);
        break;
      case "cy":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_Y);
        break;
      case "cz":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_Z);
        break;
      case "ch":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_H);
        break;
      case "sx":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_SX);
        break;
      case "cp":
      case "cphase":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateCPMatrix(p0 ?? 0));
        break;
      case "crx":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRX(p0 ?? 0));
        break;
      case "cry":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRY(p0 ?? 0));
        break;
      case "crz":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRZ(p0 ?? 0));
        break;
      case "cu":
        sv = applyControlledGate(
          sv,
          numQubits,
          q0,
          q1,
          gateCUMatrix(p0 ?? 0, p1 ?? 0, p2 ?? 0, gate.params[3] ?? 0),
        );
        break;
      case "ccx":
      case "toffoli":
        sv = applyToffoli(sv, numQubits, q0, q1, gate.qubits[2]);
        break;
      case "cswap":
      case "fredkin":
        sv = applyCSwap(sv, numQubits, q0, q1, gate.qubits[2]);
        break;
      case "swap":
        sv = applySwap(sv, numQubits, q0, q1);
        break;
      case "measure":
        // measurements are ignored by this symbolic simulator
        break;
      default:
        warnings.push(`Unknown gate: "${gate.name}" — skipped.`);
    }
  }

  return { sv, warnings };
}

// ---------------------------------------------------------------------------
// Dirac notation rendering
// ---------------------------------------------------------------------------

const THRESHOLD = 1e-8;

/** Rounds tiny floats to 0 to remove display noise. */
function clean(x: number, eps = 1e-10): number {
  return Math.abs(x) < eps ? 0 : x;
}

/** Formats an amplitude as a readable string. */
function formatAmplitude(c: Complex, useLatex: boolean): string {
  const re = clean(c.re);
  const im = clean(c.im);

  const frac = (x: number): string => {
    const abs = Math.abs(x);
    const sign = x < 0 ? "-" : "";
    if (Math.abs(abs - 1) < 1e-8) return sign + "1";
    if (Math.abs(abs - SQRT2_INV) < 1e-8)
      return sign + (useLatex ? "\\frac{1}{\\sqrt{2}}" : "1/√2");
    if (Math.abs(abs - 0.5) < 1e-8)
      return sign + (useLatex ? "\\frac{1}{2}" : "1/2");
    if (Math.abs(abs - 0.25) < 1e-8)
      return sign + (useLatex ? "\\frac{1}{4}" : "1/4");
    if (Math.abs(abs - SQRT2_INV / 2) < 1e-8)
      return sign + (useLatex ? "\\frac{1}{2\\sqrt{2}}" : "1/(2√2)");
    return sign + abs.toFixed(4);
  };

  // purely real
  if (im === 0) return frac(re);

  // purely imaginary: i/√2 stays "i/√2", -i/√2 stays "-i/√2"
  if (re === 0) {
    if (Math.abs(im - 1) < 1e-8) return useLatex ? "i" : "i";
    if (Math.abs(im + 1) < 1e-8) return useLatex ? "-i" : "-i";
    // i * frac(im): render as "i/√2" instead of "1/√2i"
    const f = frac(im);
    const absIm = Math.abs(im);
    if (Math.abs(absIm - SQRT2_INV) < 1e-8)
      return (im < 0 ? "-" : "") + (useLatex ? "\\frac{i}{\\sqrt{2}}" : "i/√2");
    if (Math.abs(absIm - 0.5) < 1e-8)
      return (im < 0 ? "-" : "") + (useLatex ? "\\frac{i}{2}" : "i/2");
    return f + (useLatex ? "i" : "i");
  }

  // mixed (re + im*i)
  const imStr = im < 0 ? ` - ${frac(-im)}i` : ` + ${frac(im)}i`;
  return `(${frac(re)}${imStr})`;
}

/**
 * Detects - without modifying the statevector - whether the first non-zero term
 * carries a non-trivial global phase (e.g. the sign of -|1⟩ after Z|1⟩). This only
 * drives a hint text: the display itself always shows the exact, algebraically
 * correct state including the sign, because even though a global phase is not
 * physically measurable, the sign still reflects the actual computation and should
 * not be hidden from the user.
 */
function hasNonTrivialGlobalPhase(sv: Complex[]): boolean {
  let ref: Complex | null = null;
  for (const amp of sv) {
    if (cabs2(amp) > THRESHOLD) {
      ref = amp;
      break;
    }
  }
  if (!ref) return false;
  // already real and positive within tolerance means no notable phase
  return !(ref.im > -1e-8 && ref.im < 1e-8 && ref.re > 0);
}

export function statevectorToDirac(
  sv: Complex[],
  numQubits: number,
  warnings: string[] = [],
  detectGlobalPhase: boolean = false,
): DiracResult {
  // The statevector is NEVER modified - signs are no longer normalized away, so both
  // the final Dirac notation and the intermediate steps always show the exact,
  // algebraically correct state. When requested (detectGlobalPhase=true, used only for
  // the final display in qasmToDirac()) a non-trivial global phase is merely DETECTED
  // so that an explanatory hint can be shown ("this sign is not measurable").
  const normalizedSv = sv;
  const globalPhaseNote = detectGlobalPhase
    ? hasNonTrivialGlobalPhase(sv)
    : false;
  const terms: DiracTerm[] = [];

  for (let i = 0; i < normalizedSv.length; i++) {
    if (cabs2(normalizedSv[i]) < THRESHOLD) continue;
    const basisState = i.toString(2).padStart(numQubits, "0");
    terms.push({ amplitude: normalizedSv[i], basisState });
  }

  if (terms.length === 0) {
    warnings.push(
      "Statevector is zero, possibly after a measurement collapse.",
    );
    return {
      terms,
      latex: "0",
      unicode: "0",
      numQubits,
      warnings,
      globalPhaseNote,
    };
  }

  const renderTerms = (useLatex: boolean): string => {
    return terms
      .map((t, idx) => {
        const amp = formatAmplitude(t.amplitude, useLatex);
        const ket = useLatex ? `|${t.basisState}\\rangle` : `|${t.basisState}⟩`;
        // sign handling: the first term is written without a leading +
        const prefix =
          idx === 0
            ? amp === "1"
              ? ""
              : amp === "-1"
                ? "-"
                : amp + " "
            : amp === "1"
              ? " + "
              : amp.startsWith("-")
                ? ` - ${amp.slice(1)} `
                : ` + ${amp} `;
        return prefix + ket;
      })
      .join("");
  };

  const latex = renderTerms(true);
  const unicode = renderTerms(false);

  return { terms, latex, unicode, numQubits, warnings, globalPhaseNote };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes the marginal probability distribution for a subset of qubits
 * (partial trace).
 *
 * @param sv         full statevector (length 2^n)
 * @param numQubits  total number of qubits
 * @param keepQubits indices of the qubits to keep (0-based)
 * @returns          array of { basisState, probability } for the selected qubits
 *
 * @example
 * // GHZ state, looking at qubit 0 only
 * marginalizeQubits(sv, 3, [0])
 * // -> [{ basisState: "0", probability: 0.5 }, { basisState: "1", probability: 0.5 }]
 */
export function marginalizeQubits(
  sv: Complex[],
  numQubits: number,
  keepQubits: number[],
): { basisState: string; probability: number }[] {
  // probability per reduced basis index
  const reducedSize = 1 << keepQubits.length;
  const probs = Array.from({ length: reducedSize }, () => 0);

  for (let i = 0; i < sv.length; i++) {
    const p = cabs2(sv[i]);
    if (p < THRESHOLD) continue;

    // extract the bits of the selected qubits from the full index
    let reducedIdx = 0;
    for (let k = 0; k < keepQubits.length; k++) {
      const qubitIdx = keepQubits[k];
      const bit = numQubits - 1 - qubitIdx; // MSB-first
      const bitVal = (i >> bit) & 1;
      reducedIdx |= bitVal << (keepQubits.length - 1 - k);
    }
    probs[reducedIdx] += p;
  }

  return probs
    .map((probability, idx) => ({
      basisState: idx.toString(2).padStart(keepQubits.length, "0"),
      probability: Math.round(probability * 10000) / 10000,
    }))
    .filter(({ probability }) => probability > THRESHOLD);
}

/**
 * Converts a QASM string into Dirac notation.
 */
export function qasmToDirac(qasm: string): DiracResult {
  const { numQubits, gates, warnings: parseWarnings } = parseQasm(qasm);
  const { sv, warnings: simWarnings } = simulate(numQubits, gates);
  // detectGlobalPhase=true is used here only, for the final overall notation: the state
  // stays unchanged and the sign remains visible, the flag merely decides whether a hint
  // about a non-measurable global phase is shown.
  const result = statevectorToDirac(
    sv,
    numQubits,
    [...parseWarnings, ...simWarnings],
    true,
  );
  return result;
}

// ---------------------------------------------------------------------------
// Intermediate step API
// ---------------------------------------------------------------------------

/**
 * Determines which basis states a Grover oracle marks, and therefore M.
 *
 * The oracle is by definition the operation that inverts the phase of exactly the
 * searched states. Applying it to the equal superposition over the Grover register and
 * comparing the amplitudes before and after therefore reveals the marked states, without
 * any assumption about how the oracle is built internally.
 *
 * Returns the marked basis states, restricted to the bits of the Grover register.
 */
function evaluateGroverMarkedStates(
  numQubits: number,
  gates: ParsedGate[],
  groverQubits: number[],
  oracleRange: { start: number; end: number },
): string[] {
  if (groverQubits.length === 0) return [];

  // Equal superposition over the Grover register; all other qubits stay in |0>.
  const superposition: ParsedGate[] = groverQubits.map((q) => ({
    name: "h",
    qubits: [q],
    params: [],
  }));
  const oracle = gates.slice(oracleRange.start, oracleRange.end + 1);

  const { sv: before } = simulate(numQubits, superposition);
  const { sv: after } = simulate(numQubits, [...superposition, ...oracle]);

  const marked: string[] = [];
  for (let i = 0; i < before.length; i++) {
    const norm = cabs2(before[i]);
    if (norm < THRESHOLD) continue;
    // Real part of after/before; a marked state picks up a phase of -1.
    const ratioRe =
      (after[i].re * before[i].re + after[i].im * before[i].im) / norm;
    if (ratioRe >= -0.5) continue;
    const bits = i.toString(2).padStart(numQubits, "0");
    marked.push(groverQubits.map((q) => bits[q]).join(""));
  }
  return marked;
}

export interface DiracStep {
  /** Gate label for the arrow (unicode), e.g. "H₀ ⊗ I₁". */
  gateLabel: string;
  /** Gate label for LaTeX, e.g. "H_{0} \otimes I_{1}". */
  gateLabelLatex: string;
  /** Dirac notation after this step (unicode). */
  unicode: string;
  /** Dirac notation after this step (LaTeX). */
  latex: string;
  /** Canvas node ID this gate originated from, used for step-click highlighting, if known. */
  nodeId?: string;
  /** Grover component this gate belongs to; undefined unless a Grover node was detected. */
  component?: string;
}

export interface DiracStepsResult {
  /** Initial state, before any gate is applied. */
  initial: { unicode: string; latex: string };
  /** All steps, each with its gate label and the resulting state. */
  steps: DiracStep[];
  numQubits: number;
  /** Number of Grover iterations found, 0 if the model contains no Grover node. */
  groverIterations: number;
  /** Qubits of the detected Grover register, empty if none. */
  groverQubits: number[];
  /** Basis states marked by the oracle, restricted to the Grover register's bits. */
  groverMarkedStates: string[];
  warnings: string[];
}

/** Formats a gate name for display. */
function formatGateLabel(gate: ParsedGate, numQubits: number): string {
  const q = gate.qubits;
  const p = gate.params;

  const paramStr = (val: number): string => {
    if (Math.abs(val - Math.PI) < 1e-6) return "π";
    if (Math.abs(val - Math.PI / 2) < 1e-6) return "π/2";
    if (Math.abs(val - Math.PI / 4) < 1e-6) return "π/4";
    if (Math.abs(val - -Math.PI) < 1e-6) return "-π";
    if (Math.abs(val - 2 * Math.PI) < 1e-6) return "2π";
    return val.toFixed(3);
  };

  // subscript digits
  const sub = (n: number): string =>
    String(n)
      .split("")
      .map((d) => "₀₁₂₃₄₅₆₇₈₉"[parseInt(d)])
      .join("");

  // Renders all qubit indices as a tensor product padded with identities:
  //   single qubit: H₀ ⊗ I₁ ⊗ I₂
  //   two qubit:    CNOT₀₁ ⊗ I₂  or  I₀ ⊗ CNOT₁₃ ⊗ I₂
  //   three qubit:  Toffoli₀₁₂ ⊗ I₃

  const buildTensor = (gateName: string, gateQubits: number[]): string => {
    const gateSet = new Set(gateQubits);
    const sorted = [...gateQubits].sort((a, b) => a - b);
    const minQ = sorted[0];
    const maxQ = sorted[sorted.length - 1];

    const parts: string[] = [];
    let i = 0;
    while (i < numQubits) {
      if (i === minQ) {
        // gate block: comma-separated indices as subscript
        const subscripts = gateQubits.map(sub).join(",");
        parts.push(`${gateName}${subscripts}`);
        // fill qubits skipped between the gate qubits with identities
        for (let j = minQ + 1; j <= maxQ; j++) {
          if (!gateSet.has(j)) {
            parts.push(`I${sub(j)}`);
          }
        }
        i = maxQ + 1;
      } else if (!gateSet.has(i)) {
        parts.push(`I${sub(i)}`);
        i++;
      } else {
        i++;
      }
    }
    return parts.join(" ⊗ ");
  };

  switch (gate.name) {
    case "h":
      return buildTensor("H", [q[0]]);
    case "x":
      return buildTensor("X", [q[0]]);
    case "y":
      return buildTensor("Y", [q[0]]);
    case "z":
      return buildTensor("Z", [q[0]]);
    case "s":
      return buildTensor("S", [q[0]]);
    case "sdg":
      return buildTensor("S†", [q[0]]);
    case "t":
      return buildTensor("T", [q[0]]);
    case "tdg":
      return buildTensor("T†", [q[0]]);
    case "sx":
      return buildTensor("√X", [q[0]]);
    case "rx":
      return buildTensor(`Rₓ(${paramStr(p[0])})`, [q[0]]);
    case "ry":
      return buildTensor(`Rᵧ(${paramStr(p[0])})`, [q[0]]);
    // p and u1 are phase gates, not z-rotations: P(l) = diag(1, e^il) whereas
    // Rz(t) = diag(e^-it/2, e^it/2). They are labelled Rz here because the simulation
    // applies gateRZ to all three, so a "P" label would not match what is computed.
    case "rz":
    case "p":
    case "u1":
      return buildTensor(`Rz(${paramStr(p[0])})`, [q[0]]);
    case "u2":
      return buildTensor(`U2`, [q[0]]);
    case "u3":
    case "u":
      return buildTensor(`U3`, [q[0]]);
    case "cx":
    case "cnot":
      return buildTensor("CNOT", [q[0], q[1]]);
    case "cy":
      return buildTensor("CY", [q[0], q[1]]);
    case "cz":
      return buildTensor("CZ", [q[0], q[1]]);
    case "ch":
      return buildTensor("CH", [q[0], q[1]]);
    case "swap":
      return buildTensor("SWAP", [q[0], q[1]]);
    case "cp":
      return buildTensor(`CP(${paramStr(p[0])})`, [q[0], q[1]]);
    case "crx":
      return buildTensor(`CRₓ(${paramStr(p[0])})`, [q[0], q[1]]);
    case "cry":
      return buildTensor(`CRᵧ(${paramStr(p[0])})`, [q[0], q[1]]);
    case "crz":
      return buildTensor(`CRz(${paramStr(p[0])})`, [q[0], q[1]]);
    case "cu":
      return buildTensor("CU", [q[0], q[1]]);
    case "ccx":
    case "toffoli":
      return buildTensor("Toffoli", [q[0], q[1], q[2]]);
    case "cswap":
    case "fredkin":
      return buildTensor("CSWAP", [q[0], q[1], q[2]]);
    case "measure":
      return `Measure q${sub(q[0])}`;
    default: {
      // multi-controlled gates from the ctrl(N) @ gate modifier syntax: "mc_z" -> "MCZ"
      if (gate.name.startsWith("mc_")) {
        const baseName = gate.name.slice(3).toUpperCase();
        return buildTensor(`MC${baseName}`, gate.qubits);
      }
      return gate.name.toUpperCase();
    }
  }
}

/** Formats a gate label for LaTeX output. */
function formatGateLabelLatex(gate: ParsedGate, numQubits: number): string {
  const q = gate.qubits;
  const p = gate.params;

  const paramLatex = (val: number): string => {
    if (Math.abs(val - Math.PI) < 1e-6) return "\\pi";
    if (Math.abs(val - Math.PI / 2) < 1e-6) return "\\pi/2";
    if (Math.abs(val - Math.PI / 4) < 1e-6) return "\\pi/4";
    if (Math.abs(val - -Math.PI) < 1e-6) return "-\\pi";
    if (Math.abs(val - 2 * Math.PI) < 1e-6) return "2\\pi";
    return val.toFixed(3);
  };

  const sub = (n: number): string => `_{${n}}`;

  const buildTensorLatex = (gateName: string, gateQubits: number[]): string => {
    const gateSet = new Set(gateQubits);
    const sorted = [...gateQubits].sort((a, b) => a - b);
    const minQ = sorted[0];
    const maxQ = sorted[sorted.length - 1];

    const parts: string[] = [];
    let i = 0;
    while (i < numQubits) {
      if (i === minQ) {
        // comma-separated indices in the subscript: CNOT_{0,2}
        const subscripts = `_{${gateQubits.join(",")}}`;
        parts.push(`${gateName}${subscripts}`);
        // fill qubits skipped between the gate qubits with identities
        for (let j = minQ + 1; j <= maxQ; j++) {
          if (!gateSet.has(j)) {
            parts.push(`I${sub(j)}`);
          }
        }
        i = maxQ + 1;
      } else if (!gateSet.has(i)) {
        parts.push(`I${sub(i)}`);
        i++;
      } else {
        i++;
      }
    }
    return parts.join(" \\otimes ");
  };

  switch (gate.name) {
    case "h":
      return buildTensorLatex("H", [q[0]]);
    case "x":
      return buildTensorLatex("X", [q[0]]);
    case "y":
      return buildTensorLatex("Y", [q[0]]);
    case "z":
      return buildTensorLatex("Z", [q[0]]);
    case "s":
      return buildTensorLatex("S", [q[0]]);
    case "sdg":
      return buildTensorLatex("S^\\dagger", [q[0]]);
    case "t":
      return buildTensorLatex("T", [q[0]]);
    case "tdg":
      return buildTensorLatex("T^\\dagger", [q[0]]);
    case "sx":
      return buildTensorLatex("\\sqrt{X}", [q[0]]);
    case "rx":
      return buildTensorLatex(`R_x(${paramLatex(p[0])})`, [q[0]]);
    case "ry":
      return buildTensorLatex(`R_y(${paramLatex(p[0])})`, [q[0]]);
    case "rz":
    case "p":
    case "u1":
      return buildTensorLatex(`R_z(${paramLatex(p[0])})`, [q[0]]);
    case "cx":
    case "cnot":
      return buildTensorLatex("\\text{CNOT}", [q[0], q[1]]);
    case "cy":
      return buildTensorLatex("\\text{CY}", [q[0], q[1]]);
    case "cz":
      return buildTensorLatex("\\text{CZ}", [q[0], q[1]]);
    case "ch":
      return buildTensorLatex("\\text{CH}", [q[0], q[1]]);
    case "swap":
      return buildTensorLatex("\\text{SWAP}", [q[0], q[1]]);
    case "cp":
      return buildTensorLatex(`\\text{CP}(${paramLatex(p[0])})`, [q[0], q[1]]);
    case "crx":
      return buildTensorLatex(`\\text{CR}_x(${paramLatex(p[0])})`, [
        q[0],
        q[1],
      ]);
    case "cry":
      return buildTensorLatex(`\\text{CR}_y(${paramLatex(p[0])})`, [
        q[0],
        q[1],
      ]);
    case "crz":
      return buildTensorLatex(`\\text{CR}_z(${paramLatex(p[0])})`, [
        q[0],
        q[1],
      ]);
    case "ccx":
    case "toffoli":
      return buildTensorLatex("\\text{Toffoli}", [q[0], q[1], q[2]]);
    case "cswap":
    case "fredkin":
      return buildTensorLatex("\\text{CSWAP}", [q[0], q[1], q[2]]);
    default: {
      // multi-controlled gates from the ctrl(N) @ gate modifier syntax
      if (gate.name.startsWith("mc_")) {
        const baseName = gate.name.slice(3).toUpperCase();
        return buildTensorLatex(`\\text{MC${baseName}}`, gate.qubits);
      }
      return `\\text{${gate.name.toUpperCase()}}`;
    }
  }
}

/**
 * Computes the quantum state after each individual gate step.
 *
 * @example
 * const steps = qasmToDiracSteps(`
 *   OPENQASM 2.0;
 *   qreg q[2];
 *   h q[0];
 *   cx q[0], q[1];
 * `);
 * // steps.initial.unicode    -> "|00⟩"
 * // steps.steps[0].gateLabel -> "H⊗I"
 * // steps.steps[0].unicode   -> "1/√2 |00⟩ + 1/√2 |10⟩"
 * // steps.steps[1].gateLabel -> "CNOT q0→q1"
 * // steps.steps[1].unicode   -> "1/√2 |00⟩ + 1/√2 |11⟩"
 */
export function qasmToDiracSteps(qasm: string): DiracStepsResult {
  const { numQubits, gates, warnings: parseWarnings } = parseQasm(qasm);
  const simWarnings: string[] = [];

  let sv = createStatevector(numQubits);
  const initialResult = statevectorToDirac(sv, numQubits);

  const steps: DiracStep[] = [];

  // Grover components (superposition / oracle / diffusion operator), detected per canvas
  // node. Yields an empty lookup and 0 iterations if the model contains no Grover node.
  const grover = analyzeGrover(gates);
  // M and the marked states are derived from the oracle itself rather than assumed.
  const groverMarkedStates = grover.oracleRange
    ? evaluateGroverMarkedStates(
        numQubits,
        gates,
        grover.qubits,
        grover.oracleRange,
      )
    : [];

  // apply the gates one by one and store the state after each step
  for (let gateIndex = 0; gateIndex < gates.length; gateIndex++) {
    const gate = gates[gateIndex];
    const [q0, q1] = gate.qubits;
    const [p0, p1, p2] = gate.params;

    switch (gate.name) {
      case "h":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_H);
        break;
      case "x":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_X);
        break;
      case "y":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_Y);
        break;
      case "z":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_Z);
        break;
      case "s":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_S);
        break;
      case "sdg":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_SDG);
        break;
      case "t":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_T);
        break;
      case "tdg":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_TDG);
        break;
      case "sx":
        sv = applySingleQubitGate(sv, numQubits, q0, GATE_SX);
        break;
      case "rx":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRX(p0 ?? 0));
        break;
      case "ry":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRY(p0 ?? 0));
        break;
      case "rz":
      case "p":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRZ(p0 ?? 0));
        break;
      case "u1":
        sv = applySingleQubitGate(sv, numQubits, q0, gateRZ(p0 ?? 0));
        break;
      case "u2":
        sv = applySingleQubitGate(
          sv,
          numQubits,
          q0,
          gateU3(Math.PI / 2, p0 ?? 0, p1 ?? 0),
        );
        break;
      case "u3":
      case "u":
        sv = applySingleQubitGate(
          sv,
          numQubits,
          q0,
          gateU3(p0 ?? 0, p1 ?? 0, p2 ?? 0),
        );
        break;
      case "cx":
      case "cnot":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_X);
        break;
      case "cy":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_Y);
        break;
      case "cz":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_Z);
        break;
      case "ch":
        sv = applyControlledGate(sv, numQubits, q0, q1, GATE_H);
        break;
      case "cp":
      case "cphase":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateCPMatrix(p0 ?? 0));
        break;
      case "crx":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRX(p0 ?? 0));
        break;
      case "cry":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRY(p0 ?? 0));
        break;
      case "crz":
        sv = applyControlledGate(sv, numQubits, q0, q1, gateRZ(p0 ?? 0));
        break;
      case "cu":
        sv = applyControlledGate(
          sv,
          numQubits,
          q0,
          q1,
          gateCUMatrix(p0 ?? 0, p1 ?? 0, p2 ?? 0, gate.params[3] ?? 0),
        );
        break;
      case "ccx":
      case "toffoli":
        sv = applyToffoli(sv, numQubits, q0, q1, gate.qubits[2]);
        break;
      case "cswap":
      case "fredkin":
        sv = applyCSwap(sv, numQubits, q0, q1, gate.qubits[2]);
        break;
      case "swap":
        sv = applySwap(sv, numQubits, q0, q1);
        break;
      case "measure":
        continue; // skip measurements
      default:
        // multi-controlled gates coming from the ctrl(N) @ gate modifier syntax
        if (gate.name.startsWith("mc_")) {
          const applied = applyParsedMultiControlledGate(sv, numQubits, gate);
          if (applied === null) {
            simWarnings.push(
              `Multi-controlled gate with unknown base gate "${gate.name.slice(3)}" — skipped.`,
            );
            continue;
          }
          sv = applied;
          break;
        }
        simWarnings.push(`Unknown gate: "${gate.name}" — skipped.`);
        continue;
    }

    const stepResult = statevectorToDirac(sv, numQubits);
    steps.push({
      gateLabel: formatGateLabel(gate, numQubits),
      gateLabelLatex: formatGateLabelLatex(gate, numQubits),
      unicode: stepResult.unicode,
      latex: stepResult.latex,
      nodeId: gate.nodeId,
      component: grover.lookup[gateIndex],
    });
  }

  return {
    initial: { unicode: initialResult.unicode, latex: initialResult.latex },
    steps,
    numQubits,
    groverIterations: grover.iterations,
    groverQubits: grover.qubits,
    groverMarkedStates,
    warnings: [...parseWarnings, ...simWarnings],
  };
}

// ---------------------------------------------------------------------------
// QASM normalization: rewrite LEQO-specific code into standard OpenQASM 3.0
// ---------------------------------------------------------------------------

function formatParam(p: number): string {
  const PI = Math.PI;
  const tol = 1e-6;
  const fracs: [number, string][] = [
    [0, "0"],
    [PI, "pi"],
    [-PI, "-pi"],
    [PI / 2, "pi/2"],
    [-PI / 2, "-pi/2"],
    [PI / 4, "pi/4"],
    [-PI / 4, "-pi/4"],
    [(3 * PI) / 4, "3*pi/4"],
    [(-3 * PI) / 4, "-3*pi/4"],
    [(3 * PI) / 2, "3*pi/2"],
    [(-3 * PI) / 2, "-3*pi/2"],
  ];
  for (const [val, label] of fracs) {
    if (Math.abs(p - val) < tol) return label;
  }
  return p.toFixed(10).replace(/\.?0+$/, "");
}

function gateNameForQasm(name: string): string {
  const map: Record<string, string> = { cnot: "cx", toffoli: "ccx" };
  return map[name.toLowerCase()] ?? name.toLowerCase();
}

/**
 * Normalizes LEQO-specific QASM code into standard OpenQASM 3.0.
 * Resolves the global register and all aliases, returning only a qubit[n] q;
 * declaration followed by direct gate calls on q[i].
 */
export function normalizeQasm(qasm: string): string {
  const { numQubits, gates } = parseQasm(qasm);
  const gateLines = gates.map((gate) => {
    const name = gateNameForQasm(gate.name);
    const qubits = gate.qubits.map((q) => `q[${q}]`).join(", ");
    const params =
      gate.params.length > 0
        ? `(${gate.params.map(formatParam).join(", ")})`
        : "";
    return `${name}${params} ${qubits};`;
  });
  return [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    `qubit[${numQubits}] q;`,
    "",
    ...gateLines,
  ].join("\n");
}
