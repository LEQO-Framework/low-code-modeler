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

type Mat2 = [Complex, Complex, Complex, Complex];

const GATE_I: Mat2 = [C(1), C(0), C(0), C(1)];

/** P(λ) = diag(1, e^{iλ}); also used for u1(λ) and phase(λ). Not the same as Rz(λ). */
function gateP(lam: number): Mat2 {
  return [C(1), C(0), C(0), C(Math.cos(lam), Math.sin(lam))];
}

/** 2x2 matrix of a single-qubit gate, or null if `name` is not a single-qubit gate. */
function singleQubitMatrix(name: string, params: number[]): Mat2 | null {
  const [p0 = 0, p1 = 0, p2 = 0] = params;
  switch (name) {
    case "id":
    case "i":
      return GATE_I;
    case "h":
      return GATE_H;
    case "x":
      return GATE_X;
    case "y":
      return GATE_Y;
    case "z":
      return GATE_Z;
    case "s":
      return GATE_S;
    case "sdg":
      return GATE_SDG;
    case "t":
      return GATE_T;
    case "tdg":
      return GATE_TDG;
    case "sx":
      return GATE_SX;
    case "rx":
      return gateRX(p0);
    case "ry":
      return gateRY(p0);
    case "rz":
      return gateRZ(p0);
    case "p":
    case "phase":
    case "u1":
      return gateP(p0);
    case "u2":
      return gateU3(Math.PI / 2, p0, p1);
    case "u3":
    case "u":
      return gateU3(p0, p1, p2);
    default:
      return null;
  }
}

/** Number of qubits of every gate the simulator knows (Map, so "constructor" etc. are not found). */
const GATE_ARITY: Map<string, number> = new Map([
  ...[
    "id", "i", "h", "x", "y", "z", "s", "sdg", "t", "tdg", "sx",
    "rx", "ry", "rz", "p", "phase", "u1", "u2", "u3", "u",
  ].map((n): [string, number] => [n, 1]),
  ...[
    "cx", "cnot", "cy", "cz", "ch", "cp", "cphase", "crx", "cry", "crz", "cu", "swap",
  ].map((n): [string, number] => [n, 2]),
  ...["ccx", "toffoli", "cswap", "fredkin"].map((n): [string, number] => [n, 3]),
]);

/**
 * Applies a multi-controlled gate encoded as "mc_<basegate>" to the statevector.
 * The base gate can be any single-qubit gate, also with parameters (mc_rx, mc_p, ...).
 * Returns `null` for an unknown base gate so the caller can emit a warning.
 */
function applyParsedMultiControlledGate(
  sv: Complex[],
  numQubits: number,
  gate: ParsedGate,
): Complex[] | null {
  const baseName = gate.name.slice(3); // strip the "mc_" prefix
  const matrix = singleQubitMatrix(baseName, gate.params);
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
  // Source text of parameters that could not be evaluated (their value in `params` is 0),
  // so that normalizeQasm can write them back instead of a silent 0.
  paramExprs?: (string | undefined)[];
  // Canvas node ID of the node whose "Start node ..." comment section this gate came from
  // (if any). Used by the step-click mechanism to highlight the corresponding node on the
  // canvas when a step in the Dirac notation is clicked.
  nodeId?: string;
  // 0-based line of the gate in the parsed QASM source (highlighted in the OpenQASM editor).
  line?: number;
}

const ANGLE_CONSTANTS: Map<string, number> = new Map([
  ["pi", Math.PI],
  ["π", Math.PI],
  ["tau", 2 * Math.PI],
  ["τ", 2 * Math.PI],
  ["euler", Math.E],
  ["ℇ", Math.E],
]);

const ANGLE_FUNCTIONS: Map<string, (x: number) => number> = new Map([
  ["sin", Math.sin],
  ["cos", Math.cos],
  ["tan", Math.tan],
  ["arcsin", Math.asin],
  ["arccos", Math.acos],
  ["arctan", Math.atan],
  ["asin", Math.asin],
  ["acos", Math.acos],
  ["atan", Math.atan],
  ["exp", Math.exp],
  ["ln", Math.log],
  ["log", Math.log],
  ["sqrt", Math.sqrt],
]);

/**
 * Safe arithmetic evaluator for QASM angle expressions (no code execution).
 * Supports numbers, + - * / ** ^, parentheses, unary signs, the constants pi/π, tau/τ,
 * euler/ℇ, the functions sin, cos, tan, arcsin, arccos, arctan, exp, ln, sqrt, and the
 * given variables (e.g. gate parameters). Returns NaN if the expression is invalid.
 */
export function evaluateAngle(
  expr: string,
  variables?: ReadonlyMap<string, number>,
): number {
  const tokens =
    expr.match(
      /\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\*\*|[A-Za-z_\u0080-￿][\w\u0080-￿]*|\S/g,
    ) ?? [];
  let pos = 0;
  const fail = (): never => {
    throw new Error("invalid angle expression");
  };
  const expect = (t: string) => {
    if (tokens[pos++] !== t) fail();
  };
  const parseExpr = (): number => {
    let v = parseTerm();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const parseTerm = (): number => {
    let v = parseUnary();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const r = parseUnary();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const parseUnary = (): number => {
    if (tokens[pos] === "-") {
      pos++;
      return -parseUnary();
    }
    if (tokens[pos] === "+") {
      pos++;
      return parseUnary();
    }
    return parsePower();
  };
  const parsePower = (): number => {
    const base = parsePrimary();
    if (tokens[pos] === "**" || tokens[pos] === "^") {
      pos++;
      return Math.pow(base, parseUnary());
    }
    return base;
  };
  const parsePrimary = (): number => {
    const t = tokens[pos++];
    if (t === undefined) return fail();
    if (t === "(") {
      const v = parseExpr();
      expect(")");
      return v;
    }
    if (/^[\d.]/.test(t)) {
      const v = Number(t);
      return Number.isNaN(v) ? fail() : v;
    }
    if (/^[A-Za-z_\u0080-￿]/.test(t)) {
      const fn = ANGLE_FUNCTIONS.get(t.toLowerCase());
      if (fn && tokens[pos] === "(") {
        pos++;
        const v = parseExpr();
        expect(")");
        return fn(v);
      }
      if (variables?.has(t)) return variables.get(t)!;
      const c = ANGLE_CONSTANTS.get(t.toLowerCase());
      if (c !== undefined) return c;
    }
    return fail();
  };
  try {
    if (tokens.length === 0) return NaN;
    const v = parseExpr();
    if (pos !== tokens.length) return NaN;
    return Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

/** Splits `text` at `sep` outside of (), [] and {}. */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if ((ch === ")" || ch === "]" || ch === "}") && depth > 0) depth--;
    else if (depth === 0 && text.startsWith(sep, i)) {
      parts.push(text.slice(start, i));
      start = i + sep.length;
      i += sep.length - 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim());
}

/** Reads a balanced "( ... )" group starting at `start`; returns its content and end index. */
function readParens(
  text: string,
  start: number,
): { inner: string; end: number } | null {
  if (text[start] !== "(") return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return { inner: text.slice(start + 1, i), end: i + 1 };
    }
  }
  return null;
}

interface Statement {
  text: string;
  lineNo: number;
}

const NODE_MARKER = /^\/\*\s*(?:Start|End) node [\w-]+\s*\*\/$/;

/**
 * Splits QASM into statements: comments are removed (node markers are kept as statements
 * of their own), each line is split at top-level ";", and "{" / "}" become separate
 * statements. Statements do not continue over line breaks (a missing ";" at the end of a
 * line is tolerated, as LEQO annotations have none).
 */
function splitStatements(qasm: string): Statement[] {
  const out: Statement[] = [];
  let inComment = false;
  qasm.split("\n").forEach((line, lineNo) => {
    let cur = "";
    let depth = 0;
    const flush = () => {
      const t = cur.trim();
      if (t) out.push({ text: t, lineNo });
      cur = "";
    };
    let i = 0;
    while (i < line.length) {
      if (inComment) {
        const end = line.indexOf("*/", i);
        if (end < 0) break;
        inComment = false;
        i = end + 2;
        cur += " ";
        continue;
      }
      const ch = line[i];
      if (ch === "/" && line[i + 1] === "/") break;
      if (ch === "/" && line[i + 1] === "*") {
        const end = line.indexOf("*/", i + 2);
        if (end < 0) {
          inComment = true;
          break;
        }
        const comment = line.slice(i, end + 2);
        if (NODE_MARKER.test(comment)) {
          flush();
          out.push({ text: comment, lineNo });
        } else cur += " ";
        i = end + 2;
        continue;
      }
      if (ch === '"') {
        const end = line.indexOf('"', i + 1);
        const stop = end < 0 ? line.length : end + 1;
        cur += line.slice(i, stop);
        i = stop;
        continue;
      }
      if (ch === "[" || ch === "(") depth++;
      else if ((ch === "]" || ch === ")") && depth > 0) depth--;
      else if (depth === 0 && ch === ";") {
        flush();
        i++;
        continue;
      } else if (depth === 0 && (ch === "{" || ch === "}")) {
        flush();
        out.push({ text: ch, lineNo });
        i++;
        continue;
      }
      cur += ch;
      i++;
    }
    flush();
  });
  return out;
}

interface GateDefinition {
  params: string[];
  qargs: string[];
  body: Statement[];
}

/**
 * Removes "{ ... }" blocks from the statement list: custom `gate` bodies are stored in
 * `defs` (and expanded when the gate is called), classical control flow is skipped with a
 * warning, `box` contents are kept.
 */
function structureStatements(
  stmts: Statement[],
  defs: Map<string, GateDefinition>,
  warnings: string[],
): Statement[] {
  const top: Statement[] = [];
  let i = 0;
  while (i < stmts.length) {
    const { text } = stmts[i];
    const isGate = /^gate\s/.test(text);
    const isControlFlow = /^(?:if|else|for|while)\b/.test(text);
    const isBlockHeader =
      isGate || isControlFlow || /^(?:def|defcal|cal|box)\b/.test(text);
    if (isBlockHeader && stmts[i + 1]?.text === "{") {
      let depth = 0;
      let j = i + 1;
      const body: Statement[] = [];
      for (; j < stmts.length; j++) {
        const t = stmts[j].text;
        if (t === "{") {
          depth++;
          if (depth === 1) continue;
        } else if (t === "}") {
          depth--;
          if (depth === 0) break;
        }
        body.push(stmts[j]);
      }
      i = j + 1;
      if (isGate) {
        const m = text.match(/^gate\s+(\w+)\s*(?:\(([^)]*)\))?\s*(.*)$/);
        if (m) {
          const list = (s: string | undefined) =>
            (s ?? "")
              .split(",")
              .map((x) => x.trim())
              .filter((x) => x.length > 0);
          defs.set(m[1].toLowerCase(), {
            params: list(m[2]),
            qargs: list(m[3]),
            body,
          });
        }
      } else if (/^box\b/.test(text)) {
        top.push(...structureStatements(body, defs, warnings));
      } else if (isControlFlow) {
        warnings.push(
          `Classical control flow is not simulated — block "${text}" skipped.`,
        );
      }
      continue;
    }
    i++;
    if (text === "{" || text === "}") continue;
    if (isGate) continue; // gate declaration without a body
    if (isControlFlow) {
      warnings.push(
        `Classical control flow is not simulated — statement "${text}" skipped.`,
      );
      continue;
    }
    top.push(stmts[i - 1]);
  }
  return top;
}

/** A gate parameter: its value and, if it could not be evaluated, its source text. */
interface Angle {
  value: number;
  expr?: string;
}

/** Gate operation before it is stored as a ParsedGate. */
interface GateOp {
  name: string;
  angles: Angle[];
  qubits: number[];
  numControls?: number;
}

const negAngle = (a: Angle): Angle => ({
  value: -a.value,
  expr: a.expr !== undefined ? `-(${a.expr})` : undefined,
});
const scaleAngle = (a: Angle, k: number): Angle => ({
  value: a.value * k,
  expr: a.expr !== undefined ? `${k}*(${a.expr})` : undefined,
});

const SELF_INVERSE = new Set([
  "id", "i", "h", "x", "y", "z", "cx", "cnot", "cy", "cz", "ch", "swap",
  "ccx", "toffoli", "cswap", "fredkin",
]);
const INVERSE_NAME: Map<string, string> = new Map([
  ["s", "sdg"],
  ["sdg", "s"],
  ["t", "tdg"],
  ["tdg", "t"],
]);
/** Gates G(θ) with G(θ)^k = G(kθ) and G(θ)^-1 = G(-θ). */
const ANGLE_GATES = new Set([
  "rx", "ry", "rz", "p", "phase", "u1", "crx", "cry", "crz", "cp", "cphase",
]);
/** Phase gates written as P(λ) (or CP(λ)), used for non-integer powers. */
const PHASE_EQUIVALENT: Map<string, [string, number]> = new Map([
  ["z", ["p", Math.PI]],
  ["s", ["p", Math.PI / 2]],
  ["sdg", ["p", -Math.PI / 2]],
  ["t", ["p", Math.PI / 4]],
  ["tdg", ["p", -Math.PI / 4]],
  ["cz", ["cp", Math.PI]],
]);
/** Order k of a gate (G^k = I), used to reduce integer powers. */
const GATE_ORDER: Map<string, number> = new Map([
  ...[...SELF_INVERSE].map((n): [string, number] => [n, 2]),
  ["s", 4],
  ["sdg", 4],
  ["sx", 4],
  ["t", 8],
  ["tdg", 8],
]);
/** Two- and three-qubit gates that are a controlled single-qubit gate. */
const CONTROLLED_BASE: Map<string, [string, number]> = new Map([
  ["cx", ["x", 1]],
  ["cnot", ["x", 1]],
  ["cy", ["y", 1]],
  ["cz", ["z", 1]],
  ["ch", ["h", 1]],
  ["crx", ["rx", 1]],
  ["cry", ["ry", 1]],
  ["crz", ["rz", 1]],
  ["cp", ["p", 1]],
  ["cphase", ["p", 1]],
  ["ccx", ["x", 2]],
  ["toffoli", ["x", 2]],
]);

/** Inverse of a gate (name + angles), or null if it is not known. */
function invertBase(
  name: string,
  a: Angle[],
): { name: string; angles: Angle[] }[] | null {
  const zero: Angle = { value: 0 };
  if (SELF_INVERSE.has(name)) return [{ name, angles: a }];
  const inv = INVERSE_NAME.get(name);
  if (inv) return [{ name: inv, angles: [] }];
  if (ANGLE_GATES.has(name)) return [{ name, angles: [negAngle(a[0] ?? zero)] }];
  if (name === "u3" || name === "u") {
    const [t = zero, p = zero, l = zero] = a;
    return [{ name, angles: [negAngle(t), negAngle(l), negAngle(p)] }];
  }
  if (name === "u2") {
    const [p = zero, l = zero] = a;
    return [
      {
        name: "u3",
        angles: [{ value: -Math.PI / 2 }, negAngle(l), negAngle(p)],
      },
    ];
  }
  if (name === "cu") {
    const [t = zero, p = zero, l = zero, g = zero] = a;
    return [
      { name, angles: [negAngle(t), negAngle(l), negAngle(p), negAngle(g)] },
    ];
  }
  if (name === "sx") return [0, 1, 2].map(() => ({ name: "sx", angles: [] })); // SX^-1 = SX^3
  return null;
}

/** inv @ for a gate sequence: reversed order, every gate inverted. */
function invertOps(ops: GateOp[]): GateOp[] | null {
  const result: GateOp[] = [];
  for (const op of [...ops].reverse()) {
    const mc = op.name.startsWith("mc_");
    const inv = invertBase(mc ? op.name.slice(3) : op.name, op.angles);
    if (!inv) return null;
    for (const g of inv)
      result.push({ ...op, name: mc ? `mc_${g.name}` : g.name, angles: g.angles });
  }
  return result;
}

/** pow(k) @ for a gate sequence; null if not supported. */
function powerOps(ops: GateOp[], k: number): GateOp[] | null {
  if (ops.length === 1) {
    const op = ops[0];
    const mc = op.name.startsWith("mc_");
    const base = mc ? op.name.slice(3) : op.name;
    const named = (name: string, angles: Angle[]): GateOp[] => [
      { ...op, name: mc ? `mc_${name}` : name, angles },
    ];
    if (ANGLE_GATES.has(base))
      return named(base, [scaleAngle(op.angles[0] ?? { value: 0 }, k)]);
    const phase = PHASE_EQUIVALENT.get(base);
    if (phase && !Number.isInteger(k))
      return named(phase[0], [{ value: phase[1] * k }]);
  }
  if (!Number.isInteger(k)) return null;
  let base: GateOp[] | null = ops;
  if (k < 0) {
    base = invertOps(ops);
    if (!base) return null;
    k = -k;
  }
  if (ops.length === 1) {
    const order = GATE_ORDER.get(ops[0].name.replace(/^mc_/, ""));
    if (order) k %= order;
  }
  if (k > 64) return null;
  const result: GateOp[] = [];
  for (let i = 0; i < k; i++) result.push(...base);
  return result;
}

/** ctrl @ for one gate: the control qubits are put in front. Null if not supported. */
function addControls(op: GateOp, controls: number[]): GateOp | null {
  const n = controls.length;
  const qubits = [...controls, ...op.qubits];
  if (op.name.startsWith("mc_"))
    return {
      ...op,
      qubits,
      numControls: (op.numControls ?? op.qubits.length - 1) + n,
    };
  const arity = GATE_ARITY.get(op.name);
  if (arity === 1 || arity === undefined)
    // arity undefined: unknown gate, the simulator reports the unknown base gate
    return { name: `mc_${op.name}`, angles: op.angles, qubits, numControls: n };
  const controlled = CONTROLLED_BASE.get(op.name);
  if (controlled)
    return {
      name: `mc_${controlled[0]}`,
      angles: op.angles,
      qubits,
      numControls: n + controlled[1],
    };
  if (op.name === "swap" && n === 1)
    return { name: "cswap", angles: [], qubits };
  return null;
}

type Modifier =
  | { kind: "inv" }
  | { kind: "pow"; expr: string }
  | { kind: "ctrl" | "negctrl"; count: number };

/** Statements that are not gate calls (declarations, annotations, ...). */
const NON_GATE_STATEMENT =
  /^(?:OPENQASM\b|include\b|qreg\b|creg\b|qubit\b|bit\b|barrier\b|let\b|@|#|\*|pragma\b|input\b|output\b|const\b|opaque\b|extern\b|defcalgrammar\b|angle\b|float\b|int\b|uint\b|bool\b|duration\b|stretch\b|complex\b|array\b|return\b)/;

export function parseQasm(qasm: string): {
  numQubits: number;
  gates: ParsedGate[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const gateDefs: Map<string, GateDefinition> = new Map();
  // One statement per entry, even if several share a line ("h q[0]; cx q[0], q[1];"),
  // with the 0-based source line, so gates can be found in the editor. Node markers
  // ("/* Start node h1 */") are statements of their own. Gate bodies are removed.
  const statements = structureStatements(
    splitStatements(qasm),
    gateDefs,
    warnings,
  );

  // ---------------------------------------------------------------------------
  // Qubit names: register or LEQO alias -> global qubit indices
  // Examples: "qubit[2] leqo_reg;"                 -> leqo_reg = [0, 1]
  //           "let leqo_a = leqo_reg[{0, 1}];"     -> leqo_a = [0, 1]
  //           "let leqo_a_out = leqo_a;"           -> leqo_a_out = [0, 1]
  //           "let c = a ++ b;", "let a = reg[1];" -> concatenation, single index
  // ---------------------------------------------------------------------------
  const qubitNames: Map<string, number[]> = new Map();
  // classical constants ("const float theta = pi/4;"), usable in angles
  const variables: Map<string, number> = new Map();
  let totalQubits = 0;
  const declare = (name: string, size: number) => {
    qubitNames.set(
      name,
      Array.from({ length: size }, (_, i) => totalQubits + i),
    );
    totalQubits += size;
  };

  /** Evaluates an integer index expression; null if it is not an integer. */
  const evalIndex = (expr: string): number | null => {
    const v = evaluateAngle(expr, variables);
    return Number.isInteger(v) ? v : null;
  };

  /**
   * Resolves a qubit expression to global indices: name, name[i], name[{i, j}],
   * name[a:b] / name[a:s:b] (inclusive), and x ++ y. Inside a gate body only the gate's
   * qubit arguments (`args`) are visible. Returns null if it cannot be resolved.
   */
  function resolveQubits(
    expr: string,
    args: Map<string, number[]> | null,
  ): number[] | null {
    const e = expr.trim();
    const parts = splitTopLevel(e, "++");
    if (parts.length > 1) {
      const all: number[] = [];
      for (const part of parts) {
        const r = resolveQubits(part, args);
        if (!r) return null;
        all.push(...r);
      }
      return all;
    }
    const m = e.match(/^([A-Za-z_]\w*)\s*(?:\[(.*)\])?$/);
    if (!m) return null;
    const base = (args ?? qubitNames).get(m[1]);
    if (!base) return null;
    if (m[2] === undefined) return base;
    const at = (i: number | null): number | null => {
      if (i === null) return null;
      const k = i < 0 ? base.length + i : i;
      return k >= 0 && k < base.length ? base[k] : null;
    };
    const idx = m[2].trim();
    let picked: (number | null)[];
    const set = idx.match(/^\{(.*)\}$/);
    if (set) {
      picked = splitTopLevel(set[1], ",").map((s) => at(evalIndex(s)));
    } else if (idx.includes(":")) {
      const r = idx.split(":").map((s) => s.trim());
      if (r.length > 3) return null;
      const start = r[0] === "" ? 0 : evalIndex(r[0]);
      const step = r.length === 3 ? evalIndex(r[1]) : 1;
      const endText = r[r.length - 1];
      const end = endText === "" ? base.length - 1 : evalIndex(endText);
      if (start === null || step === null || end === null || step === 0)
        return null;
      picked = [];
      for (let i = start; step > 0 ? i <= end : i >= end; i += step)
        picked.push(at(i));
    } else {
      picked = [at(evalIndex(idx))];
    }
    return picked.every((q): q is number => q !== null)
      ? (picked as number[])
      : null;
  }

  // ---------------------------------------------------------------------------
  // First pass: collect registers, LEQO aliases and classical constants
  // ---------------------------------------------------------------------------
  for (const { text } of statements) {
    // OPENQASM 2: qreg q[3];
    const qreg2 = text.match(/^qreg\s+(\w+)\s*\[(\d+)\]/);
    if (qreg2) {
      declare(qreg2[1], parseInt(qreg2[2]));
      continue;
    }

    // OPENQASM 3: qubit[3] q;
    const qreg3a = text.match(/^qubit\s*\[(\d+)\]\s+(\w+)/);
    if (qreg3a) {
      declare(qreg3a[2], parseInt(qreg3a[1]));
      continue;
    }

    // OPENQASM 3: qubit q;
    const qreg3b = text.match(/^qubit\s+(\w+)\s*$/);
    if (qreg3b) {
      declare(qreg3b[1], 1);
      continue;
    }

    // LEQO alias: let <alias> = <expr>;
    const alias = text.match(/^let\s+(\w+)\s*=\s*(.+)$/);
    if (alias) {
      const resolved = resolveQubits(alias[2], null);
      if (resolved) qubitNames.set(alias[1], resolved);
      // only warn for qubit aliases (an alias of a classical register is not an error)
      else if (
        splitTopLevel(alias[2], "++").some((p) =>
          qubitNames.has(p.match(/^\w+/)?.[0] ?? ""),
        )
      )
        warnings.push(
          `Could not resolve the alias "${text}" — gates on "${alias[1]}" are skipped.`,
        );
      continue;
    }

    // classical constant: const float theta = pi/4;
    const constant = text.match(
      /^(?:const\s+)?(?:angle|float|int|uint)\s*(?:\[[^\]]*\])?\s+(\w+)\s*=\s*(.+)$/,
    );
    if (constant) {
      const v = evaluateAngle(constant[2], variables);
      if (!Number.isNaN(v)) variables.set(constant[1], v);
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

  const gates: ParsedGate[] = [];
  // Tracks which canvas node section the current line belongs to, delimited by the
  // "/* Start node <id> */" ... "/* End node <id> */" comments, so every gate can be
  // annotated with its originating node ID for the step-click mechanism in the UI.
  let currentNodeId: string | undefined = undefined;

  interface Scope {
    args: Map<string, number[]> | null; // qubit arguments inside a gate body
    env: Map<string, number>; // variables for angles
    depth: number; // nesting depth of custom gate expansion
  }

  const toOp = (g: ParsedGate): GateOp => ({
    name: g.name,
    angles: g.params.map((value, i) => ({ value, expr: g.paramExprs?.[i] })),
    qubits: g.qubits,
    numControls: g.numControls,
  });

  /** Expands a call of a custom gate into its body; null (with a warning) on failure. */
  function expandDefinition(
    name: string,
    def: GateDefinition,
    angles: Angle[],
    targets: number[],
    scope: Scope,
    lineNo: number,
  ): GateOp[] | null {
    if (scope.depth >= 16) {
      warnings.push(`Gate "${name}" is nested too deeply — skipped.`);
      return null;
    }
    if (targets.length !== def.qargs.length || angles.length !== def.params.length) {
      warnings.push(
        `Gate "${name}" expects ${def.qargs.length} qubit(s) and ${def.params.length} parameter(s) — skipped.`,
      );
      return null;
    }
    const args = new Map(def.qargs.map((a, i): [string, number[]] => [a, [targets[i]]]));
    const env = new Map(variables);
    def.params.forEach((p, i) => env.set(p, angles[i].value));
    const body: ParsedGate[] = [];
    for (const st of def.body)
      processStatement(st.text, lineNo, { args, env, depth: scope.depth + 1 }, body);
    return body.map(toOp);
  }

  /** Parses one statement (gate call or measurement) and appends its gates to `out`. */
  function processStatement(
    text: string,
    lineNo: number,
    scope: Scope,
    out: ParsedGate[],
  ): void {
    const push = (op: GateOp) => {
      const gate: ParsedGate = {
        name: op.name,
        qubits: op.qubits,
        params: op.angles.map((a) => a.value),
        nodeId: currentNodeId,
        line: lineNo,
      };
      if (op.numControls !== undefined) gate.numControls = op.numControls;
      if (op.angles.some((a) => a.expr !== undefined))
        gate.paramExprs = op.angles.map((a) => a.expr);
      out.push(gate);
    };

    // measurement: measure q[0] -> c[0];  c[0] = measure q[0];
    // LEQO measurement: bit[2] x = measure alias[{0,1}];
    if (/^measure\b/.test(text) || /=\s*measure\b/.test(text)) {
      const m = text.match(/(?:^|=\s*)measure\s+(.+?)(?:\s*->\s*.+)?$/);
      const qubits = m ? resolveQubits(m[1], scope.args) : null;
      if (!qubits) {
        warnings.push(`Could not resolve the measured qubits in "${text}" — skipped.`);
        return;
      }
      for (const q of qubits) push({ name: "measure", angles: [], qubits: [q] });
      return;
    }

    if (NON_GATE_STATEMENT.test(text)) return;

    // OpenQASM 3 modifiers: inv @, pow(k) @, ctrl(N) @, negctrl(N) @ (any combination)
    const modifiers: Modifier[] = [];
    let rest = text;
    for (;;) {
      const m = rest.match(/^(inv|pow|ctrl|negctrl)\s*/);
      if (!m) break;
      let after = m[0].length;
      let arg: string | undefined;
      const parens = readParens(rest, after);
      if (parens) {
        arg = parens.inner;
        after = parens.end;
      }
      const at = rest.slice(after).match(/^\s*@\s*/);
      if (!at) break; // a gate whose name starts like a modifier
      rest = rest.slice(after + at[0].length);
      if (m[1] === "inv") modifiers.push({ kind: "inv" });
      else if (m[1] === "pow") modifiers.push({ kind: "pow", expr: arg ?? "" });
      else {
        const count = arg === undefined ? 1 : evaluateAngle(arg, scope.env);
        if (!Number.isInteger(count) || count < 1) {
          warnings.push(`Invalid number of controls in "${text}" — skipped.`);
          return;
        }
        modifiers.push({ kind: m[1] as "ctrl" | "negctrl", count });
      }
    }

    // gate call: gateName(params) qubit1, qubit2;  or  gateName qubit1, qubit2;
    const nameMatch = rest.match(/^([A-Za-z_]\w*)\s*/);
    if (!nameMatch) return;
    const name = nameMatch[1].toLowerCase();
    let operandStart = nameMatch[0].length;
    let paramText: string | undefined;
    const parens = readParens(rest, operandStart);
    if (parens) {
      paramText = parens.inner;
      operandStart = parens.end;
    }
    const operandText = rest.slice(operandStart).trim();
    if (!operandText) {
      warnings.push(
        name === "gphase"
          ? `Global phase "${text}" is not shown — skipped.`
          : `Statement "${text}" has no qubit operands — skipped.`,
      );
      return;
    }

    const angles: Angle[] = (
      paramText !== undefined && paramText.trim() !== ""
        ? splitTopLevel(paramText, ",")
        : []
    ).map((expr) => {
      const value = evaluateAngle(expr, scope.env);
      if (Number.isNaN(value)) {
        warnings.push(
          `Could not evaluate angle "${expr}" in "${text}" — using 0.`,
        );
        return { value: 0, expr };
      }
      return { value };
    });

    const operands: number[][] = [];
    for (const operand of splitTopLevel(operandText, ",")) {
      const resolved = resolveQubits(operand, scope.args);
      if (!resolved || resolved.length === 0) {
        warnings.push(
          `Could not resolve qubit "${operand}" in "${text}" — statement skipped.`,
        );
        return;
      }
      operands.push(resolved);
    }

    // broadcast: a register operand applies the gate to each of its qubits (zipped with
    // the other register operands; single qubits are repeated)
    const width = Math.max(...operands.map((o) => o.length));
    if (operands.some((o) => o.length !== 1 && o.length !== width)) {
      warnings.push(
        `Registers of different sizes in "${text}" — statement skipped.`,
      );
      return;
    }

    const numControls = modifiers.reduce(
      (n, m) => n + (m.kind === "ctrl" || m.kind === "negctrl" ? m.count : 0),
      0,
    );
    const def = GATE_ARITY.has(name) ? undefined : gateDefs.get(name);

    for (let k = 0; k < width; k++) {
      const qubits = operands.map((o) => (o.length === 1 ? o[0] : o[k]));
      if (qubits.length <= numControls) {
        warnings.push(
          `Multi-controlled gate "${name}": too few qubits resolved — skipped.`,
        );
        return;
      }
      const targets = qubits.slice(numControls);
      let ops: GateOp[] | null = def
        ? expandDefinition(name, def, angles, targets, scope, lineNo)
        : [{ name, angles, qubits: targets }];
      if (!ops) return;

      // inv / pow act on the base gate, innermost (rightmost) modifier first
      for (const mod of [...modifiers].reverse()) {
        if (mod.kind === "inv") {
          ops = invertOps(ops);
          if (!ops) {
            warnings.push(`"inv @ ${name}" is not supported — "${text}" skipped.`);
            return;
          }
        } else if (mod.kind === "pow") {
          const exponent = evaluateAngle(mod.expr, scope.env);
          ops = Number.isNaN(exponent) ? null : powerOps(ops, exponent);
          if (!ops) {
            warnings.push(
              `"pow(${mod.expr}) @ ${name}" is not supported — "${text}" skipped.`,
            );
            return;
          }
        }
      }

      // controls in modifier order; negctrl via X conjugation of its qubits
      const negated: number[] = [];
      if (numControls > 0) {
        let offset = 0;
        for (const mod of modifiers) {
          if (mod.kind !== "ctrl" && mod.kind !== "negctrl") continue;
          if (mod.kind === "negctrl")
            negated.push(...qubits.slice(offset, offset + mod.count));
          offset += mod.count;
        }
        const controls = qubits.slice(0, numControls);
        const controlled: GateOp[] = [];
        for (const op of ops) {
          const c = addControls(op, controls);
          if (!c) {
            warnings.push(`"ctrl @ ${op.name}" is not supported — "${text}" skipped.`);
            return;
          }
          controlled.push(c);
        }
        ops = controlled;
      }

      const flips: GateOp[] = negated.map((q) => ({
        name: "x",
        angles: [],
        qubits: [q],
      }));
      [...flips, ...ops, ...flips].forEach(push);
    }
  }

  // ---------------------------------------------------------------------------
  // Second pass: parse the gates
  // ---------------------------------------------------------------------------
  const globalScope: Scope = { args: null, env: variables, depth: 0 };
  for (const { text, lineNo } of statements) {
    const startNodeMatch = text.match(/^\/\*\s*Start node ([\w-]+)\s*\*\/$/);
    if (startNodeMatch) {
      currentNodeId = startNodeMatch[1];
      continue;
    }
    const endNodeMatch = text.match(/^\/\*\s*End node ([\w-]+)\s*\*\/$/);
    if (endNodeMatch) {
      currentNodeId = undefined;
      continue;
    }
    processStatement(text, lineNo, globalScope, gates);
  }

  return { numQubits: totalQubits, gates, warnings };
}

// ---------------------------------------------------------------------------
// Simulator
// ---------------------------------------------------------------------------

/**
 * Applies one parsed gate. Returns the new statevector, or a warning text if the gate
 * is unknown or its qubits are invalid. Measurements leave the state unchanged.
 */
function applyGate(
  sv: Complex[],
  numQubits: number,
  gate: ParsedGate,
): Complex[] | string {
  const q = gate.qubits;
  const [p0 = 0, p1 = 0, p2 = 0, p3 = 0] = gate.params;
  const validQubit = (x: number) =>
    Number.isInteger(x) && x >= 0 && x < numQubits;

  if (gate.name === "measure") return sv;

  // multi-controlled gates from the ctrl(N) @ gate modifier syntax
  if (gate.name.startsWith("mc_")) {
    if (!q.every(validQubit))
      return `Gate "${gate.name}" uses a qubit outside the register — skipped.`;
    const applied = applyParsedMultiControlledGate(sv, numQubits, gate);
    return (
      applied ??
      `Multi-controlled gate with unknown base gate "${gate.name.slice(3)}" — skipped.`
    );
  }

  const arity = GATE_ARITY.get(gate.name);
  if (arity === undefined) return `Unknown gate: "${gate.name}" — skipped.`;
  if (q.length < arity || !q.slice(0, arity).every(validQubit))
    return `Gate "${gate.name}" needs ${arity} valid qubit(s) — skipped.`;

  if (arity === 1) {
    if (gate.name === "id" || gate.name === "i") return sv; // identity
    return applySingleQubitGate(
      sv,
      numQubits,
      q[0],
      singleQubitMatrix(gate.name, gate.params)!,
    );
  }

  switch (gate.name) {
    case "cx":
    case "cnot":
      return applyControlledGate(sv, numQubits, q[0], q[1], GATE_X);
    case "cy":
      return applyControlledGate(sv, numQubits, q[0], q[1], GATE_Y);
    case "cz":
      return applyControlledGate(sv, numQubits, q[0], q[1], GATE_Z);
    case "ch":
      return applyControlledGate(sv, numQubits, q[0], q[1], GATE_H);
    case "cp":
    case "cphase":
      return applyControlledGate(sv, numQubits, q[0], q[1], gateCPMatrix(p0));
    case "crx":
      return applyControlledGate(sv, numQubits, q[0], q[1], gateRX(p0));
    case "cry":
      return applyControlledGate(sv, numQubits, q[0], q[1], gateRY(p0));
    case "crz":
      return applyControlledGate(sv, numQubits, q[0], q[1], gateRZ(p0));
    case "cu":
      return applyControlledGate(
        sv,
        numQubits,
        q[0],
        q[1],
        gateCUMatrix(p0, p1, p2, p3),
      );
    case "ccx":
    case "toffoli":
      return applyToffoli(sv, numQubits, q[0], q[1], q[2]);
    case "cswap":
    case "fredkin":
      return applyCSwap(sv, numQubits, q[0], q[1], q[2]);
    case "swap":
      return applySwap(sv, numQubits, q[0], q[1]);
    default:
      return `Unknown gate: "${gate.name}" — skipped.`;
  }
}

export function simulate(
  numQubits: number,
  gates: ParsedGate[],
): { sv: Complex[]; warnings: string[] } {
  let sv = createStatevector(numQubits);
  const warnings: string[] = [];

  for (const gate of gates) {
    const result = applyGate(sv, numQubits, gate);
    if (typeof result === "string") warnings.push(result);
    else sv = result;
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
  /** QASM gate name, e.g. "h", "cx" or "mc_z". */
  gateName: string;
  /** Global qubit indices the gate acts on (controls first). */
  qubits: number[];
  /** 0-based line of the gate in the QASM the steps were computed from. */
  line?: number;
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
    case "i":
      return buildTensor("I", [q[0]]);
    case "h":
      return buildTensor("H", [q[0]]);
    case "id":
      return buildTensor("I", [q[0]]);
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
    case "rz":
      return buildTensor(`Rz(${paramStr(p[0])})`, [q[0]]);
    // p, phase and u1 are phase gates P(λ) = diag(1, e^iλ), not z-rotations
    case "p":
    case "phase":
    case "u1":
      return buildTensor(`P(${paramStr(p[0])})`, [q[0]]);
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
    case "cphase":
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
        const args = p.length > 0 ? `(${p.map(paramStr).join(",")})` : "";
        return buildTensor(`MC${baseName}${args}`, gate.qubits);
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
    case "i":
      return buildTensorLatex("I", [q[0]]);
    case "h":
      return buildTensorLatex("H", [q[0]]);
    case "id":
      return buildTensorLatex("I", [q[0]]);
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
      return buildTensorLatex(`R_z(${paramLatex(p[0])})`, [q[0]]);
    case "p":
    case "phase":
    case "u1":
      return buildTensorLatex(`P(${paramLatex(p[0])})`, [q[0]]);
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
    case "cphase":
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
        const args =
          p.length > 0 ? `(${p.map(paramLatex).join(",")})` : "";
        return buildTensorLatex(`\\text{MC${baseName}}${args}`, gate.qubits);
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
export function qasmToDiracSteps(
  qasm: string,
  /** Optional initial basis state (q0 leftmost, e.g. "01"); defaults to |0...0⟩. */
  initialBits?: string,
): DiracStepsResult {
  const { numQubits, gates, warnings: parseWarnings } = parseQasm(qasm);
  const simWarnings: string[] = [];

  let sv = createStatevector(numQubits);
  if (
    initialBits &&
    initialBits.length === numQubits &&
    /^[01]+$/.test(initialBits)
  ) {
    sv[0] = C(0);
    sv[parseInt(initialBits, 2)] = C(1);
  }
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
    if (gate.name === "measure") continue; // skip measurements

    const applied = applyGate(sv, numQubits, gate);
    if (typeof applied === "string") {
      simWarnings.push(applied);
      continue;
    }
    sv = applied;

    const stepResult = statevectorToDirac(sv, numQubits);
    steps.push({
      gateLabel: formatGateLabel(gate, numQubits),
      gateLabelLatex: formatGateLabelLatex(gate, numQubits),
      unicode: stepResult.unicode,
      latex: stepResult.latex,
      nodeId: gate.nodeId,
      component: grover.lookup[gateIndex],
      gateName: gate.name,
      qubits: gate.qubits,
      line: gate.line,
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
  const map: Map<string, string> = new Map([
    ["cnot", "cx"],
    ["toffoli", "ccx"],
    ["fredkin", "cswap"],
    ["i", "id"],
  ]);
  return map.get(name.toLowerCase()) ?? name.toLowerCase();
}

/**
 * Normalizes LEQO-specific QASM code into standard OpenQASM 3.0.
 * Resolves the global register and all aliases, returning only a qubit[n] q;
 * declaration followed by direct gate calls on q[i]. Multi-controlled gates are written
 * as ctrl(n) @ <gate>, measurements as c[k] = measure q[i]; with a bit[m] c; register.
 * Angles that could not be evaluated are written back as their source text.
 */
export function normalizeQasm(qasm: string): string {
  const { numQubits, gates } = parseQasm(qasm);
  let numBits = 0;
  const gateLines = gates.map((gate) => {
    const qubits = gate.qubits.map((q) => `q[${q}]`).join(", ");
    if (gate.name === "measure") return `c[${numBits++}] = measure ${qubits};`;
    const params =
      gate.params.length > 0
        ? `(${gate.params
            .map((p, i) => gate.paramExprs?.[i] ?? formatParam(p))
            .join(", ")})`
        : "";
    if (gate.name.startsWith("mc_")) {
      const n = gate.numControls ?? gate.qubits.length - 1;
      const base = gateNameForQasm(gate.name.slice(3));
      return `ctrl${n > 1 ? `(${n})` : ""} @ ${base}${params} ${qubits};`;
    }
    return `${gateNameForQasm(gate.name)}${params} ${qubits};`;
  });
  return [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    `qubit[${numQubits}] q;`,
    ...(numBits > 0 ? [`bit[${numBits}] c;`] : []),
    "",
    ...gateLines,
  ].join("\n");
}
