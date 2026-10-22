/**
 * Checks the code of the OpenQASM editor for operations that do not exist and for qubits
 * that are not declared or lie outside their register. The check is conservative: code
 * it cannot follow (e.g. control flow or LEQO aliases built from expressions) is skipped
 * rather than reported, so valid code is never marked as wrong.
 */

export interface QasmProblem {
  /** 0-based line in the code. */
  line: number;
  message: string;
}

/** Gates of stdgates.inc (and their aliases): [number of qubits, number of angles]. */
const KNOWN_GATES: Record<string, [number, number]> = {
  id: [1, 0],
  i: [1, 0],
  h: [1, 0],
  x: [1, 0],
  y: [1, 0],
  z: [1, 0],
  s: [1, 0],
  sdg: [1, 0],
  t: [1, 0],
  tdg: [1, 0],
  sx: [1, 0],
  rx: [1, 1],
  ry: [1, 1],
  rz: [1, 1],
  p: [1, 1],
  phase: [1, 1],
  u1: [1, 1],
  u2: [1, 2],
  u3: [1, 3],
  u: [1, 3],
  U: [1, 3],
  cx: [2, 0],
  CX: [2, 0],
  cnot: [2, 0],
  cy: [2, 0],
  cz: [2, 0],
  ch: [2, 0],
  swap: [2, 0],
  cp: [2, 1],
  cphase: [2, 1],
  crx: [2, 1],
  cry: [2, 1],
  crz: [2, 1],
  cu: [2, 4],
  ccx: [3, 0],
  toffoli: [3, 0],
  cswap: [3, 0],
  fredkin: [3, 0],
};

/** Operations on any number of qubits. */
const QUBIT_OPERATIONS = new Set(["measure", "reset", "barrier"]);

/** Statements that are not gate calls; their content is not checked. */
const SKIPPED_STATEMENTS =
  /^(OPENQASM|include|creg|bit|int|uint|float|angle|bool|complex|duration|stretch|const|input|output|if|else|for|while|def|defcal|cal|box|return|break|continue|end|opaque|let|gphase)\b/;

interface Register {
  /** Number of qubits, null if unknown (e.g. an alias built from an expression). */
  size: number | null;
}

/** Removes comments; block comments may span several lines. */
function stripComments(lines: string[]): string[] {
  let inBlock = false;
  return lines.map((raw) => {
    let line = "";
    let rest = raw;
    while (rest.length > 0) {
      if (inBlock) {
        const end = rest.indexOf("*/");
        if (end < 0) return line;
        inBlock = false;
        rest = rest.slice(end + 2);
      } else {
        const start = rest.indexOf("/*");
        const lineComment = rest.indexOf("//");
        if (lineComment >= 0 && (start < 0 || lineComment < start))
          return line + rest.slice(0, lineComment);
        if (start < 0) return line + rest;
        line += rest.slice(0, start);
        inBlock = true;
        rest = rest.slice(start + 2);
      }
    }
    return line;
  });
}

/** Splits at top-level commas (not inside brackets or parentheses). */
function splitArgs(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[a.length][b.length];
}

function suggestion(name: string, candidates: string[]): string {
  let best: string | null = null;
  let bestDistance = 3;
  for (const c of candidates) {
    const distance = editDistance(name.toLowerCase(), c.toLowerCase());
    if (distance < bestDistance) {
      best = c;
      bestDistance = distance;
    }
  }
  return best ? ` Did you mean "${best}"?` : "";
}

function qubitRange(name: string, size: number): string {
  return size === 1
    ? `${name} has 1 qubit (${name}[0])`
    : `${name} has ${size} qubits (${name}[0] to ${name}[${size - 1}])`;
}

export function validateQasm(qasm: string): QasmProblem[] {
  const problems: QasmProblem[] = [];
  const lines = stripComments(qasm.split("\n"));
  const registers = new Map<string, Register>();
  const definedGates = new Map<string, number>();

  // statements with their line, a gate body ({ ... }) is skipped
  const statements: { text: string; line: number }[] = [];
  let bodyDepth = 0;
  lines.forEach((text, line) => {
    for (const part of text.split(";")) {
      let statement = part.trim();
      if (!statement) continue;
      if (bodyDepth > 0) {
        bodyDepth += (statement.match(/\{/g) ?? []).length;
        bodyDepth -= (statement.match(/\}/g) ?? []).length;
        continue;
      }
      // custom gate: gate name(params) a, b { ... }
      const gateDef = statement.match(/^gate\s+(\w+)(?:\([^)]*\))?\s+([^{]*)/);
      if (gateDef) {
        definedGates.set(gateDef[1], splitArgs(gateDef[2]).length);
        const opens = (statement.match(/\{/g) ?? []).length;
        const closes = (statement.match(/\}/g) ?? []).length;
        bodyDepth = Math.max(0, opens - closes);
        if (opens === 0) bodyDepth = 1; // body starts on a later line
        continue;
      }
      if (/^[{}]+$/.test(statement)) continue;
      statement = statement.replace(/^\}\s*/, "");
      statements.push({ text: statement, line });
    }
  });

  // first pass: registers and aliases
  for (const { text } of statements) {
    const qubit3 = text.match(/^qubit\s*\[\s*(\d+)\s*\]\s*(\w+)$/);
    if (qubit3) {
      registers.set(qubit3[2], { size: parseInt(qubit3[1], 10) });
      continue;
    }
    const qubit3Single = text.match(/^qubit\s+(\w+)$/);
    if (qubit3Single) {
      registers.set(qubit3Single[1], { size: 1 });
      continue;
    }
    // size given as an expression, e.g. qubit[n] q;
    const qubit3Expr = text.match(/^qubit\s*\[[^\]]*\]\s*(\w+)$/);
    if (qubit3Expr) {
      registers.set(qubit3Expr[1], { size: null });
      continue;
    }
    const qreg = text.match(/^qreg\s+(\w+)\s*\[\s*(\d+)\s*\]$/);
    if (qreg) {
      registers.set(qreg[1], { size: parseInt(qreg[2], 10) });
      continue;
    }
    // LEQO aliases: let a = reg[{0, 1}];  let a = reg[2];  let a_out = a;
    const alias = text.match(/^let\s+(\w+)\s*=\s*(.+)$/);
    if (alias) {
      const indexed = alias[2].match(/^\w+\s*\[\s*\{?([\d\s,]+)\}?\s*\]$/);
      const copied = registers.get(alias[2].trim());
      registers.set(alias[1], {
        size: indexed
          ? splitArgs(indexed[1]).length
          : copied
            ? copied.size
            : null,
      });
    }
  }

  // checks one qubit operand; returns "name[index]" for a single known qubit
  const checkOperand = (
    operand: string,
    line: number,
  ): { key: string | null; single: boolean } => {
    const m = operand.match(/^(\w+)\s*(?:\[\s*\{?\s*([^\]}]*)\}?\s*\])?$/);
    if (!m) return { key: null, single: false };
    const [, name, index] = m;
    const register = registers.get(name);
    if (!register) {
      problems.push({
        line,
        message: `Qubit "${name}" is not declared.${suggestion(name, [...registers.keys()])}`,
      });
      return { key: null, single: false };
    }
    if (index === undefined)
      return {
        key: register.size === 1 ? `${name}[0]` : null,
        single: register.size === 1,
      };
    const indices = splitArgs(index);
    if (!indices.every((i) => /^\d+$/.test(i)))
      return { key: null, single: false };
    for (const i of indices) {
      if (register.size !== null && parseInt(i, 10) >= register.size)
        problems.push({
          line,
          message: `Qubit ${name}[${i}] does not exist: ${qubitRange(name, register.size)}.`,
        });
    }
    return indices.length === 1
      ? { key: `${name}[${indices[0]}]`, single: true }
      : { key: null, single: false };
  };

  const checkOperands = (operands: string[], line: number) =>
    operands.map((o) => checkOperand(o, line));

  // second pass: alias sources and gate calls
  for (const { text, line } of statements) {
    if (/^(qubit|qreg)\b/.test(text)) continue;

    const alias = text.match(
      /^let\s+\w+\s*=\s*(\w+)\s*\[\s*\{?([^\]}]*)\}?\s*\]$/,
    );
    if (alias) {
      checkOperand(`${alias[1]}[${alias[2]}]`, line);
      continue;
    }

    // measurement: measure q[0] -> c[0];  c = measure q;  bit[2] c = measure q;
    const measure = text.match(/\bmeasure\s+(.+?)(?:\s*->.*)?$/);
    if (measure) {
      checkOperands(splitArgs(measure[1]), line);
      continue;
    }
    if (text.startsWith("@") || SKIPPED_STATEMENTS.test(text)) continue;

    // modifiers: ctrl(2) @ x a, b, c;  inv @ s q;
    let controls = 0;
    let call = text;
    const modifier = /^(ctrl|negctrl|inv|pow)\s*(?:\(\s*([^)]*)\))?\s*@\s*/;
    for (let m = call.match(modifier); m; m = call.match(modifier)) {
      if (m[1] === "ctrl" || m[1] === "negctrl")
        controls += m[2] && /^\d+$/.test(m[2].trim()) ? parseInt(m[2], 10) : 1;
      call = call.slice(m[0].length);
    }

    const gateCall = call.match(/^(\w+)\s*(?:\(([^)]*)\))?\s*(.*)$/);
    if (!gateCall) continue;
    const [, name, params, operandText] = gateCall;
    if (!operandText.trim()) continue; // e.g. an assignment, not a gate call
    if (/[=+\-*<>!]/.test(operandText.split("[")[0])) continue; // classical expression

    const operands = checkOperands(splitArgs(operandText), line);

    let qubits: number | null = null;
    let angles: number | null = null;
    if (QUBIT_OPERATIONS.has(name)) continue;
    if (KNOWN_GATES[name]) [qubits, angles] = KNOWN_GATES[name];
    else if (definedGates.has(name)) qubits = definedGates.get(name)!;
    else {
      problems.push({
        line,
        message: `Unknown operation "${name}".${suggestion(name, [...Object.keys(KNOWN_GATES), ...definedGates.keys()])}`,
      });
      continue;
    }

    const expected = qubits + controls;
    if (operands.every((o) => o.single) && operands.length !== expected)
      problems.push({
        line,
        message: `"${name}"${controls ? ` with ${controls} control${controls === 1 ? "" : "s"}` : ""} acts on ${expected} qubit${expected === 1 ? "" : "s"}, but ${operands.length} ${operands.length === 1 ? "is" : "are"} given.`,
      });
    const keys = operands.map((o) => o.key).filter((k): k is string => !!k);
    const duplicate = keys.find((k, i) => keys.indexOf(k) !== i);
    if (duplicate)
      problems.push({
        line,
        message: `"${name}" uses qubit ${duplicate} more than once.`,
      });
    const given = params?.trim() ? splitArgs(params).length : 0;
    if (angles !== null && given !== angles)
      problems.push({
        line,
        message: `"${name}" takes ${angles} angle${angles === 1 ? "" : "s"}, but ${given} ${given === 1 ? "is" : "are"} given.`,
      });
  }

  return problems;
}
