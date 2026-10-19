/**
 * LaTeX document for the Dirac export (main.tex, ZIP and PDF), shared by the export menu of
 * a single panel and the "Export all" button.
 */

import type {
  DiracStep,
  DiracStepsResult,
  DiracTerm,
} from "./utils/qasmToDirac";
import {
  getBlochVector,
  getEntanglementPersistence,
  getMultiQubitPersistence,
  isStateFullySeparable,
} from "./BlochSphere";
import {
  basicsTopics,
  buildBasicsLatexSection,
  buildStepTree,
  isBlochTopic,
  markdownToLatex,
  type StepTreeItem,
} from "./mathExplanations";

// ---------------------------------------------------------------------------
// Gate explanations and matrix representations
// ---------------------------------------------------------------------------

interface GateInfo {
  /** Gate name in LaTeX math mode, e.g. "S^\\dagger". */
  name: string;
  /** Plain-text name for the PDF bookmarks. */
  plainName: string;
  /** Number of qubits the matrix acts on; its size is 2^qubits x 2^qubits. */
  qubits: number;
  description: string;
  matrix: string;
  effect: string;
  /** Determinant in LaTeX math mode, if known. */
  det?: string;
}

const GATE_INFO: Record<string, GateInfo> = {
  H: {
    name: "H",
    plainName: "H",
    qubits: 1,
    description:
      "The Hadamard gate creates an equal superposition of $|0\\rangle$ and $|1\\rangle$.",
    matrix:
      "\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}",
    effect:
      "$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$, \\quad $H|1\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) = |-\\rangle$",
    det: "-1",
  },
  X: {
    name: "X",
    plainName: "X",
    qubits: 1,
    description:
      "The Pauli-X gate is the quantum analogue of the classical NOT gate. It flips $|0\\rangle$ to $|1\\rangle$ and vice versa.",
    matrix: "\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}",
    effect: "$X|0\\rangle = |1\\rangle$, \\quad $X|1\\rangle = |0\\rangle$",
    det: "-1",
  },
  Y: {
    name: "Y",
    plainName: "Y",
    qubits: 1,
    description:
      "The Pauli-Y gate rotates the qubit state by $\\pi$ around the Y-axis of the Bloch sphere.",
    matrix: "\\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}",
    effect: "$Y|0\\rangle = i|1\\rangle$, \\quad $Y|1\\rangle = -i|0\\rangle$",
    det: "-1",
  },
  Z: {
    name: "Z",
    plainName: "Z",
    qubits: 1,
    description:
      "The Pauli-Z gate applies a phase flip. It leaves $|0\\rangle$ unchanged and maps $|1\\rangle$ to $-|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}",
    effect: "$Z|0\\rangle = |0\\rangle$, \\quad $Z|1\\rangle = -|1\\rangle$",
    det: "-1",
  },
  S: {
    name: "S",
    plainName: "S",
    qubits: 1,
    description:
      "The S gate (phase gate) applies a $\\frac{\\pi}{2}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & i \\end{pmatrix}",
    effect: "$S|0\\rangle = |0\\rangle$, \\quad $S|1\\rangle = i|1\\rangle$",
    det: "i",
  },
  SDG: {
    name: "S^\\dagger",
    plainName: "S-dagger",
    qubits: 1,
    description:
      "The S-dagger gate (conjugate transpose of S) applies a $-\\frac{\\pi}{2}$ phase rotation and undoes S.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & -i \\end{pmatrix}",
    effect:
      "$S^\\dagger|0\\rangle = |0\\rangle$, \\quad $S^\\dagger|1\\rangle = -i|1\\rangle$",
    det: "-i",
  },
  T: {
    name: "T",
    plainName: "T",
    qubits: 1,
    description: "The T gate applies a $\\frac{\\pi}{4}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}",
    effect:
      "$T|0\\rangle = |0\\rangle$, \\quad $T|1\\rangle = e^{i\\pi/4}|1\\rangle$",
    det: "e^{i\\pi/4}",
  },
  TDG: {
    name: "T^\\dagger",
    plainName: "T-dagger",
    qubits: 1,
    description:
      "The T-dagger gate (conjugate transpose of T) applies a $-\\frac{\\pi}{4}$ phase rotation and undoes T.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & e^{-i\\pi/4} \\end{pmatrix}",
    effect:
      "$T^\\dagger|0\\rangle = |0\\rangle$, \\quad $T^\\dagger|1\\rangle = e^{-i\\pi/4}|1\\rangle$",
    det: "e^{-i\\pi/4}",
  },
  SX: {
    name: "\\sqrt{X}",
    plainName: "SX",
    qubits: 1,
    description:
      "The SX gate ($\\sqrt{X}$) is the square root of the Pauli-X gate: applying it twice gives X.",
    matrix:
      "\\frac{1}{2}\\begin{pmatrix} 1+i & 1-i \\\\ 1-i & 1+i \\end{pmatrix}",
    effect:
      "$\\sqrt{X}|0\\rangle = \\frac{1+i}{2}|0\\rangle + \\frac{1-i}{2}|1\\rangle$",
    det: "i",
  },
  RX: {
    name: "R_x(\\theta)",
    plainName: "Rx",
    qubits: 1,
    description:
      "The $R_x$ gate rotates the qubit by the angle $\\theta$ around the x-axis of the Bloch sphere.",
    matrix:
      "\\begin{pmatrix} \\cos(\\theta/2) & -i\\sin(\\theta/2) \\\\ -i\\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "$R_x(\\theta)|0\\rangle = \\cos(\\theta/2)|0\\rangle - i\\sin(\\theta/2)|1\\rangle$",
    det: "1",
  },
  RY: {
    name: "R_y(\\theta)",
    plainName: "Ry",
    qubits: 1,
    description:
      "The $R_y$ gate rotates the qubit by the angle $\\theta$ around the y-axis of the Bloch sphere. All its entries are real.",
    matrix:
      "\\begin{pmatrix} \\cos(\\theta/2) & -\\sin(\\theta/2) \\\\ \\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "$R_y(\\theta)|0\\rangle = \\cos(\\theta/2)|0\\rangle + \\sin(\\theta/2)|1\\rangle$",
    det: "1",
  },
  RZ: {
    name: "R_z(\\theta)",
    plainName: "Rz",
    qubits: 1,
    description:
      "The $R_z$ gate rotates the qubit by the angle $\\theta$ around the z-axis of the Bloch sphere. It only changes the relative phase, not the measurement probabilities. Phase gates $P(\\theta)$ / $U_1(\\theta)$ are the same up to a global phase.",
    matrix:
      "\\begin{pmatrix} e^{-i\\theta/2} & 0 \\\\ 0 & e^{i\\theta/2} \\end{pmatrix}",
    effect:
      "$R_z(\\theta)|0\\rangle = e^{-i\\theta/2}|0\\rangle$, \\quad $R_z(\\theta)|1\\rangle = e^{i\\theta/2}|1\\rangle$",
    det: "1",
  },
  U2: {
    name: "U_2(\\phi, \\lambda)",
    plainName: "U2",
    qubits: 1,
    description:
      "The U2 gate is a single-qubit gate with two angles: $U_2(\\phi, \\lambda) = U_3(\\pi/2, \\phi, \\lambda)$.",
    matrix:
      "\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & -e^{i\\lambda} \\\\ e^{i\\phi} & e^{i(\\phi+\\lambda)} \\end{pmatrix}",
    effect:
      "$U_2|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + e^{i\\phi}|1\\rangle)$",
    det: "e^{i(\\phi+\\lambda)}",
  },
  U3: {
    name: "U_3(\\theta, \\phi, \\lambda)",
    plainName: "U3",
    qubits: 1,
    description:
      "The U3 gate is the general single-qubit rotation with the angles $(\\theta, \\phi, \\lambda)$; every single-qubit gate can be written as a U3 gate up to a global phase.",
    matrix:
      "\\begin{pmatrix} \\cos(\\theta/2) & -e^{i\\lambda}\\sin(\\theta/2) \\\\ e^{i\\phi}\\sin(\\theta/2) & e^{i(\\phi+\\lambda)}\\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "$U_3|0\\rangle = \\cos(\\theta/2)|0\\rangle + e^{i\\phi}\\sin(\\theta/2)|1\\rangle$",
    det: "e^{i(\\phi+\\lambda)}",
  },
  CNOT: {
    name: "\\text{CNOT}",
    plainName: "CNOT",
    qubits: 2,
    description:
      "The CNOT (Controlled-NOT) gate flips the target qubit if and only if the control qubit is $|1\\rangle$. It is used to create entanglement.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}",
    effect:
      "$\\text{CNOT}|00\\rangle = |00\\rangle$, $\\text{CNOT}|01\\rangle = |01\\rangle$, $\\text{CNOT}|10\\rangle = |11\\rangle$, $\\text{CNOT}|11\\rangle = |10\\rangle$",
    det: "-1",
  },
  CY: {
    name: "\\text{CY}",
    plainName: "CY",
    qubits: 2,
    description:
      "The CY (Controlled-Y) gate applies a Y gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & -i \\\\ 0 & 0 & i & 0 \\end{pmatrix}",
    effect:
      "$\\text{CY}|10\\rangle = i|11\\rangle$, \\quad $\\text{CY}|11\\rangle = -i|10\\rangle$",
    det: "-1",
  },
  CZ: {
    name: "\\text{CZ}",
    plainName: "CZ",
    qubits: 2,
    description:
      "The CZ (Controlled-Z) gate applies a Z gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & -1 \\end{pmatrix}",
    effect:
      "$\\text{CZ}|11\\rangle = -|11\\rangle$, all other basis states unchanged",
    det: "-1",
  },
  CH: {
    name: "\\text{CH}",
    plainName: "CH",
    qubits: 2,
    description:
      "The CH (Controlled-H) gate applies a Hadamard gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{2}} \\\\ 0 & 0 & \\frac{1}{\\sqrt{2}} & -\\frac{1}{\\sqrt{2}} \\end{pmatrix}",
    effect:
      "$\\text{CH}|10\\rangle = |1\\rangle|+\\rangle$, \\quad $\\text{CH}|11\\rangle = |1\\rangle|-\\rangle$",
    det: "-1",
  },
  CP: {
    name: "\\text{CP}(\\lambda)",
    plainName: "CP",
    qubits: 2,
    description:
      "The CP (controlled phase) gate multiplies the state $|11\\rangle$ by the phase $e^{i\\lambda}$ and leaves all other basis states unchanged.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & e^{i\\lambda} \\end{pmatrix}",
    effect: "$\\text{CP}(\\lambda)|11\\rangle = e^{i\\lambda}|11\\rangle$",
    det: "e^{i\\lambda}",
  },
  CRX: {
    name: "\\text{CR}_x(\\theta)",
    plainName: "CRx",
    qubits: 2,
    description:
      "The CRX gate applies an $R_x(\\theta)$ rotation to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\cos(\\theta/2) & -i\\sin(\\theta/2) \\\\ 0 & 0 & -i\\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "$\\text{CRX}(\\theta)|10\\rangle = \\cos(\\theta/2)|10\\rangle - i\\sin(\\theta/2)|11\\rangle$",
    det: "1",
  },
  CRY: {
    name: "\\text{CR}_y(\\theta)",
    plainName: "CRy",
    qubits: 2,
    description:
      "The CRY gate applies an $R_y(\\theta)$ rotation to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\cos(\\theta/2) & -\\sin(\\theta/2) \\\\ 0 & 0 & \\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "$\\text{CRY}(\\theta)|10\\rangle = \\cos(\\theta/2)|10\\rangle + \\sin(\\theta/2)|11\\rangle$",
    det: "1",
  },
  CRZ: {
    name: "\\text{CR}_z(\\theta)",
    plainName: "CRz",
    qubits: 2,
    description:
      "The CRZ gate applies an $R_z(\\theta)$ rotation to the target qubit if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & e^{-i\\theta/2} & 0 \\\\ 0 & 0 & 0 & e^{i\\theta/2} \\end{pmatrix}",
    effect:
      "$\\text{CRZ}(\\theta)|10\\rangle = e^{-i\\theta/2}|10\\rangle$, \\quad $\\text{CRZ}(\\theta)|11\\rangle = e^{i\\theta/2}|11\\rangle$",
    det: "1",
  },
  CU: {
    name: "\\text{CU}",
    plainName: "CU",
    qubits: 2,
    description:
      "The CU gate is a controlled unitary gate with parameters $(\\theta, \\phi, \\lambda, \\gamma)$: it applies a general single-qubit unitary to the target if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & e^{i\\gamma}\\cos(\\theta/2) & -e^{i(\\gamma+\\lambda)}\\sin(\\theta/2) \\\\ 0 & 0 & e^{i(\\gamma+\\phi)}\\sin(\\theta/2) & e^{i(\\gamma+\\phi+\\lambda)}\\cos(\\theta/2) \\end{pmatrix}",
    effect:
      "basis states with the control in $|0\\rangle$ stay unchanged, the target is only transformed when the control is $|1\\rangle$",
    det: "e^{i(2\\gamma+\\phi+\\lambda)}",
  },
  SWAP: {
    name: "\\text{SWAP}",
    plainName: "SWAP",
    qubits: 2,
    description: "The SWAP gate exchanges the states of two qubits.",
    matrix:
      "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\end{pmatrix}",
    effect:
      "$\\text{SWAP}|01\\rangle = |10\\rangle$, \\quad $\\text{SWAP}|10\\rangle = |01\\rangle$",
    det: "-1",
  },
  TOFFOLI: {
    name: "\\text{Toffoli}",
    plainName: "Toffoli",
    qubits: 3,
    description:
      "The Toffoli gate (CCX) flips the target qubit if and only if both control qubits are $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1&0&0&0&0&0&0&0 \\\\ 0&1&0&0&0&0&0&0 \\\\ 0&0&1&0&0&0&0&0 \\\\ 0&0&0&1&0&0&0&0 \\\\ 0&0&0&0&1&0&0&0 \\\\ 0&0&0&0&0&1&0&0 \\\\ 0&0&0&0&0&0&0&1 \\\\ 0&0&0&0&0&0&1&0 \\end{pmatrix}",
    effect:
      "$\\text{Toffoli}|110\\rangle = |111\\rangle$, \\quad $\\text{Toffoli}|111\\rangle = |110\\rangle$",
    det: "-1",
  },
  CSWAP: {
    name: "\\text{CSWAP}",
    plainName: "CSWAP",
    qubits: 3,
    description:
      "The CSWAP (Fredkin) gate swaps the two target qubits if the control qubit is $|1\\rangle$.",
    matrix:
      "\\begin{pmatrix} 1&0&0&0&0&0&0&0 \\\\ 0&1&0&0&0&0&0&0 \\\\ 0&0&1&0&0&0&0&0 \\\\ 0&0&0&1&0&0&0&0 \\\\ 0&0&0&0&1&0&0&0 \\\\ 0&0&0&0&0&0&1&0 \\\\ 0&0&0&0&0&1&0&0 \\\\ 0&0&0&0&0&0&0&1 \\end{pmatrix}",
    effect:
      "$\\text{CSWAP}|101\\rangle = |110\\rangle$, \\quad $\\text{CSWAP}|110\\rangle = |101\\rangle$",
    det: "-1",
  },
};

/** QASM gate name -> key in GATE_INFO. */
const GATE_KEY_BY_QASM_NAME: Record<string, string> = {
  h: "H",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  sdg: "SDG",
  t: "T",
  tdg: "TDG",
  sx: "SX",
  rx: "RX",
  ry: "RY",
  // simulated as R_z (equal up to a global phase), see qasmToDiracSteps
  rz: "RZ",
  p: "RZ",
  u1: "RZ",
  u2: "U2",
  u3: "U3",
  u: "U3",
  cx: "CNOT",
  cnot: "CNOT",
  cy: "CY",
  cz: "CZ",
  ch: "CH",
  cp: "CP",
  cphase: "CP",
  crx: "CRX",
  cry: "CRY",
  crz: "CRZ",
  cu: "CU",
  swap: "SWAP",
  ccx: "TOFFOLI",
  toffoli: "TOFFOLI",
  cswap: "CSWAP",
  fredkin: "CSWAP",
};

const MC_BASE_DET: Record<string, string> = {
  X: "-1",
  Y: "-1",
  Z: "-1",
  H: "-1",
};

/** Matrix information for the gate of a step, or null if the gate is unknown. */
function gateInfoForStep(
  step: DiracStep,
): { key: string; info: GateInfo } | null {
  const fixedKey = GATE_KEY_BY_QASM_NAME[step.gateName];
  if (fixedKey) return { key: fixedKey, info: GATE_INFO[fixedKey] };

  // multi-controlled gate from ctrl(N) @ gate: k-1 controls and one target
  if (step.gateName.startsWith("mc_")) {
    const base = step.gateName.slice(3).toUpperCase();
    const k = step.qubits.length;
    const dim = 2 ** k;
    const baseInfo = GATE_INFO[GATE_KEY_BY_QASM_NAME[base.toLowerCase()] ?? ""];
    const baseMatrix = baseInfo?.qubits === 1 ? baseInfo.matrix : base;
    return {
      key: `MC${base}-${k}`,
      info: {
        name: `\\text{MC${base}}`,
        plainName: `MC${base} (${k} qubits)`,
        qubits: k,
        description: `The multi-controlled ${base} gate on ${k} qubits applies ${base} to the target qubit (the last one) only if all ${k - 1} control qubits are $|1\\rangle$. All other basis states stay unchanged. In Grover's algorithm the multi-controlled Z marks the state $|1\\dots1\\rangle$ with a minus sign.`,
        matrix: `\\begin{pmatrix} I_{${dim - 2}} & 0 \\\\ 0 & ${baseMatrix} \\end{pmatrix}`,
        effect: `Only the block of the basis states $|1\\dots1x\\rangle$ (all controls $1$) is changed by ${base}; $I_{${dim - 2}}$ is the identity on the remaining ${dim - 2} basis states`,
        det: MC_BASE_DET[base],
      },
    };
  }
  return null;
}

/** "2 \\times 2" for a gate on one qubit. */
function matrixSize(qubits: number): string {
  const dim = 2 ** qubits;
  return `${dim} \\times ${dim}`;
}

/** Escapes LaTeX special characters in plain text such as node labels. */
export function latexEscape(text: string): string {
  return text.replace(/([&%$#_{}])/g, "\\$1");
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

interface GateUsage {
  info: GateInfo;
  count: number;
  /** Distinct qubit tuples the gate acted on, e.g. "q_0" or "q_0, q_1". */
  targets: string[];
  /** Label of the first step that used the gate, shows how it is embedded in the register. */
  exampleLabel: string;
}

function collectGateUsage(steps: DiracStep[]): Map<string, GateUsage> {
  const usage = new Map<string, GateUsage>();
  for (const step of steps) {
    const found = gateInfoForStep(step);
    if (!found) continue;
    const target = step.qubits.map((q) => `q_{${q}}`).join(", ");
    const entry = usage.get(found.key);
    if (entry) {
      entry.count++;
      if (!entry.targets.includes(target)) entry.targets.push(target);
    } else {
      usage.set(found.key, {
        info: found.info,
        count: 1,
        targets: [target],
        exampleLabel: step.gateLabelLatex,
      });
    }
  }
  return usage;
}

function formatTargets(targets: string[]): string {
  const shown = targets
    .slice(0, 4)
    .map((t) => (t.includes(",") ? `$(${t})$` : `$${t}$`));
  return targets.length > 4 ? `${shown.join(", ")}, \\dots` : shown.join(", ");
}

function buildModelOverviewSection(
  numQubits: number,
  terms: DiracTerm[],
  stepsResult: DiracStepsResult | undefined,
  usage: Map<string, GateUsage>,
  stepTree: StepTreeItem[],
): string {
  const dim = 2 ** numQubits;
  const steps = stepsResult?.steps ?? [];

  const operationRows = [...usage.values()]
    .map(
      (u) =>
        `    $${u.info.name}$ & ${u.count} & ${formatTargets(u.targets)} & $${matrixSize(u.info.qubits)}$ \\\\`,
    )
    .join("\n");

  const operationsTable =
    usage.size > 0
      ? `\\subsection{Operations}

The model applies the following operations (quantum gates). Every operation is a unitary matrix;
the matrix size follows from the number of qubits it acts on. Details on every matrix are given in
Section~\\ref{sec:matrices}.

\\begin{center}
  \\begin{tabular}{llll}
    \\toprule
    \\textbf{Operation} & \\textbf{Count} & \\textbf{Acts on} & \\textbf{Matrix size} \\\\
    \\midrule
${operationRows}
    \\bottomrule
  \\end{tabular}
\\end{center}

`
      : "";

  const blocks = stepTree.filter((item) => item.type === "group");
  const blocksSection =
    blocks.length > 0
      ? `\\subsection{Building blocks}

The operations come from the following building blocks of the model:

\\begin{itemize}
${blocks
  .map((b) => {
    const count = b.last - b.first + 1;
    return `  \\item \\textbf{${latexEscape(b.label)}}: ${count} operation${count === 1 ? "" : "s"} (steps ${b.first + 1}--${b.last + 1})`;
  })
  .join("\n")}
\\end{itemize}

`
      : "";

  return `\\section{Model Overview}

\\begin{center}
  \\begin{tabular}{ll}
    \\toprule
    Number of qubits & $n = ${numQubits}$ \\\\
    Size of the state vector & $2^{${numQubits}} = ${dim}$ amplitudes \\\\
    Size of an operator on the whole register & $${dim} \\times ${dim}$ \\\\
    Number of operations (gates) & ${steps.length} \\\\
    Different operation types & ${usage.size} \\\\
    Basis states in the final state & ${terms.length} \\\\
    \\bottomrule
  \\end{tabular}
\\end{center}

${operationsTable}${blocksSection}`;
}

function buildPropertiesSection(
  numQubits: number,
  terms: DiracTerm[],
  statevector: { re: number; im: number }[],
): string {
  // Exact separability check (not a heuristic): fully separable when EVERY qubit has a pure
  // reduced state (Bloch vector length 1 for each qubit bipartition).
  const isEntangled =
    numQubits >= 2 && !isStateFullySeparable(statevector, numQubits);

  const persistence: number | null =
    numQubits === 1
      ? getEntanglementPersistence(statevector, numQubits, 0)
      : isEntangled
        ? getMultiQubitPersistence(terms, numQubits)
        : 0;

  const norm = terms.reduce(
    (sum, t) => sum + t.amplitude.re ** 2 + t.amplitude.im ** 2,
    0,
  );

  const persistenceValue =
    persistence === null
      ? "not computable"
      : numQubits === 1
        ? `$S = ${persistence.toFixed(3)}$`
        : `$P = ${persistence}$`;

  const persistenceText =
    persistence !== null
      ? numQubits === 1
        ? `\\textbf{Entanglement Persistence:} $S = ${persistence.toFixed(3)}$ (von Neumann entropy of the qubit's reduced density matrix, in bits). $S = 0$ corresponds to an unentangled qubit; $S = 1$ corresponds to a maximally entangled qubit.\n\n`
        : `\\textbf{Entanglement Persistence:} $P = ${persistence}$ (persistency of entanglement: the minimum number of local qubit measurements required until the remaining state is guaranteed to be fully separable).\n\n`
      : `\\textbf{Entanglement Persistence:} not computable -- this state does not match any of the recognized standard patterns (GHZ-like states, Bell-state variants, W-states).\n\n`;

  return `\\section{Properties}

\\begin{center}
  \\begin{tabular}{ll}
    \\toprule
    \\textbf{Property} & \\textbf{Value} \\\\
    \\midrule
    State dimension & $2^{${numQubits}} = ${2 ** numQubits}$ \\\\
    Normalized & $\\sum_x |c_x|^2 = ${norm.toFixed(3)}$ \\\\
    Bloch sphere representation & ${numQubits === 1 ? "yes" : "no (only for single qubits)"} \\\\
    Entangled & ${numQubits === 1 ? "no (single qubit)" : isEntangled ? "yes" : "no"} \\\\
    Persistence & ${persistenceValue} \\\\
    \\bottomrule
  \\end{tabular}
\\end{center}

\\begin{description}
  \\item[State dimension] Each qubit doubles the number of basis states, so $n$ qubits give a vector of $2^n$ amplitudes (see Basics).
  \\item[Normalized] The squared amplitudes sum to 1. Every gate is unitary and keeps this sum at 1.
  \\item[Bloch sphere representation] Only the state of a single qubit can be drawn as a point on the Bloch sphere.
  \\item[Entangled] Whether the state can be written as a tensor product of single-qubit states (see below).
  \\item[Persistence] Minimum number of qubits that must be measured to guarantee full separability of the remaining state.
\\end{description}

\\subsection{Entanglement}

\\emph{Separable:} A multi-qubit quantum state is called \\emph{separable} if it can be
written as a tensor product of the individual qubit states, i.e.\\
$|\\psi\\rangle = |\\psi_1\\rangle \\otimes |\\psi_2\\rangle \\otimes \\dots \\otimes |\\psi_n\\rangle$.
In this case, each qubit can be fully described by its own, independent quantum state.

\\emph{Entangled:} A multi-qubit quantum state is called \\emph{entangled} if no such
tensor-product decomposition exists. The qubits cannot be described independently of one
another: measuring one qubit instantaneously affects the possible outcomes of measuring the
others, even if the qubits are physically separated.

\\textbf{Status for this circuit:} This ${numQubits}-qubit state is
\\textbf{${isEntangled ? "entangled" : "separable"}}${
    numQubits >= 2 && !isEntangled
      ? " (it factors into a product of single-qubit states)"
      : ""
  }.

${persistenceText}`;
}

/**
 * Bloch sphere of a single qubit, drawn with TikZ in an orthographic projection
 * (x towards the viewer, y to the right, z up). Only used when the model has one qubit.
 */
function buildBlochSection(statevector: { re: number; im: number }[]): string {
  // getBlochVector returns three.js coordinates (y up): physical (X, Y, Z) = (x, z, y)
  const v = getBlochVector(statevector, 1, 0);
  const X = v.x;
  const Y = v.z;
  const Z = v.y;
  const r = Math.sqrt(X * X + Y * Y + Z * Z);

  const azimuth = Math.PI / 6;
  const elevation = Math.PI / 9;
  const project = (x: number, y: number, z: number) => {
    const u = -Math.sin(azimuth) * x + Math.cos(azimuth) * y;
    const w =
      z * Math.cos(elevation) -
      (Math.cos(azimuth) * x + Math.sin(azimuth) * y) * Math.sin(elevation);
    return `(${u.toFixed(3)}, ${w.toFixed(3)})`;
  };
  const equator = (fromDeg: number, toDeg: number) => {
    const points: string[] = [];
    for (let d = fromDeg; d <= toDeg; d += 5) {
      const t = (d * Math.PI) / 180;
      points.push(project(Math.cos(t), Math.sin(t), 0));
    }
    return points.join(" ");
  };
  const azDeg = (azimuth * 180) / Math.PI;

  const theta = r > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, Z / r))) : 0;
  const hasPhase = Math.hypot(X, Y) > 1e-6;
  const phi = hasPhase ? (Math.atan2(Y, X) + 2 * Math.PI) % (2 * Math.PI) : 0;
  const p0 = (1 + Z) / 2;
  const fmt = (n: number) => (Math.abs(n) < 5e-4 ? "0" : n.toFixed(3));

  const blochTopic = basicsTopics(1).find(isBlochTopic);
  const explanation = blochTopic
    ? `${markdownToLatex(blochTopic.markdown)}\n\n`
    : "";

  return `\\section{Bloch Sphere}

The model has a single qubit, so its state can be drawn as a point on the Bloch sphere.

\\begin{figure}[h]
  \\centering
  \\begin{tikzpicture}[scale=2.4]
    \\draw[thick] (0,0) circle (1);
    \\draw[gray] plot[smooth] coordinates {${equator(azDeg - 90, azDeg + 90)}};
    \\draw[gray, dashed] plot[smooth] coordinates {${equator(azDeg + 90, azDeg + 270)}};
    \\draw[->, gray] (0,0) -- ${project(1.3, 0, 0)} node[below left] {$x$};
    \\draw[->, gray] (0,0) -- ${project(0, 1.3, 0)} node[right] {$y$};
    \\draw[->, gray] (0,0) -- ${project(0, 0, 1.3)} node[above] {$z$};
    \\fill ${project(0, 0, 1)} circle (0.02) node[above right] {$|0\\rangle$};
    \\fill ${project(0, 0, -1)} circle (0.02) node[below right] {$|1\\rangle$};
    \\fill ${project(1, 0, 0)} circle (0.02) node[above left] {$|+\\rangle$};
    \\fill ${project(0, 1, 0)} circle (0.02) node[above right] {$|{+i}\\rangle$};
    \\draw[dashed, red!60] ${project(X, Y, Z)} -- ${project(X, Y, 0)} -- (0,0);
    \\draw[->, very thick, red] (0,0) -- ${project(X, Y, Z)};
    \\fill[red] ${project(X, Y, Z)} circle (0.03) node[above right] {$|\\psi\\rangle$};
  \\end{tikzpicture}
  \\caption{Bloch sphere of the qubit}
  \\label{fig:bloch}
\\end{figure}

\\begin{center}
  \\begin{tabular}{ll}
    \\toprule
    Bloch vector $(x, y, z)$ & $(${fmt(X)}, ${fmt(Y)}, ${fmt(Z)})$ \\\\
    Length $|\\vec r|$ & $${fmt(r)}$ \\\\
    Polar angle $\\theta$ & $${fmt(theta)}$ rad $= ${fmt((theta * 180) / Math.PI)}^\\circ$ \\\\
    Azimuth (relative phase) $\\varphi$ & ${hasPhase ? `$${fmt(phi)}$ rad $= ${fmt((phi * 180) / Math.PI)}^\\circ$` : "undefined (state on the z-axis)"} \\\\
    $P(0) = (1+z)/2$ & $${fmt(p0)}$ \\\\
    $P(1) = (1-z)/2$ & $${fmt(1 - p0)}$ \\\\
    \\bottomrule
  \\end{tabular}
\\end{center}

\\subsection{How to read the Bloch sphere}

${explanation}`;
}

function buildMatricesSection(
  numQubits: number,
  usage: Map<string, GateUsage>,
): string {
  if (usage.size === 0) return "";
  const dim = 2 ** numQubits;

  const entries = [...usage.values()]
    .map(({ info, count, exampleLabel }) => {
      const embedding =
        info.qubits < numQubits
          ? `In this ${numQubits}-qubit model it is extended with identities on the other qubits to a $${dim} \\times ${dim}$ matrix, e.g.\\ $${exampleLabel}$.`
          : `In this ${numQubits}-qubit model it acts on the whole register.`;
      return `\\subsection{\\texorpdfstring{$${info.name}$}{${info.plainName}} gate}

${info.description}

\\begin{itemize}
  \\item \\textbf{Dimension:} $${matrixSize(info.qubits)}$ (acts on ${info.qubits} qubit${info.qubits === 1 ? "" : "s"}). ${embedding}
  \\item \\textbf{Used:} ${count} time${count === 1 ? "" : "s"} in this model.
${info.det ? `  \\item \\textbf{Determinant:} $\\det ${info.name} = ${info.det}$, so $|\\det| = 1$ as for every unitary matrix.\n` : ""}\\end{itemize}

\\textbf{Matrix representation:}
\\begin{equation*}
  ${info.name} = ${info.matrix}
\\end{equation*}

\\textbf{Effect on basis states:} ${info.effect}
`;
    })
    .join("\n");

  return `\\section{Matrices}
\\label{sec:matrices}

Every operation in the model is a unitary matrix $U$ ($U^\\dagger U = I$). A gate on $k$ qubits is
a $2^k \\times 2^k$ matrix. Applied to the whole ${numQubits}-qubit register it is combined with
identity matrices via the tensor product, giving a $${dim} \\times ${dim}$ matrix that multiplies the
state vector of length ${dim}.

${entries}`;
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export interface LatexExportOptions {
  /** Shown in the document title, e.g. the group label. */
  title?: string;
  /** Final state in Dirac notation (LaTeX). */
  latex: string;
  numQubits: number;
  terms: DiracTerm[];
  /** Circuit image; when set, the document includes circuit.png. */
  pngBase64?: string;
  stepsResult?: DiracStepsResult;
  aiExplanation?: string;
  stepTree?: StepTreeItem[];
}

export function buildLatexExport({
  title,
  latex,
  numQubits,
  terms,
  pngBase64,
  stepsResult,
  aiExplanation,
  stepTree: givenStepTree,
}: LatexExportOptions): string {
  const statevector = Array.from({ length: 1 << numQubits }, (_, i) => {
    const term = terms.find((t) => parseInt(t.basisState, 2) === i);
    return term ? term.amplitude : { re: 0, im: 0 };
  });

  const steps = stepsResult?.steps ?? [];
  const stepTree = givenStepTree ?? buildStepTree(steps, []);
  const usage = collectGateUsage(steps);

  const circuitSection = pngBase64
    ? `\\section{Quantum Circuit}

\\begin{figure}[h]
  \\centering
  \\includegraphics[width=0.9\\textwidth]{circuit}
  \\caption{${title ? latexEscape(title) : "Quantum Circuit"}}
  \\label{fig:circuit}
\\end{figure}

`
    : "";

  // Headings of the step groups (e.g. Grover operator > Oracle, Basis encoding), emitted
  // before the first step of each group together with their explanation.
  const groupHeadings = new Map<number, string>();
  const collectHeadings = (items: StepTreeItem[], depth: number) => {
    for (const item of items) {
      if (item.type !== "group") continue;
      const command = depth === 0 ? "subsection" : "subsubsection*";
      const description = item.description
        ? `${markdownToLatex(item.description)}\n\n`
        : "";
      groupHeadings.set(
        item.first,
        `${groupHeadings.get(item.first) ?? ""}\\${command}{${latexEscape(item.label)}}\n\n${description}`,
      );
      collectHeadings(item.children, depth + 1);
    }
  };
  collectHeadings(stepTree, 0);

  const stepsSection =
    stepsResult && steps.length > 0
      ? `\\section{Mathematical Intermediate Steps}

Notation: $U_0$ means that $U$ is applied to qubit 0, $I_1$ means identity (no operation) on
qubit 1. Each step multiplies the state vector with the $${2 ** numQubits} \\times ${2 ** numQubits}$
matrix of the step.

${steps
  .map((step, idx) => {
    const gate = gateInfoForStep(step);
    const matrixBlock = gate
      ? `\\textbf{Gate:} $${step.gateLabelLatex}$ \\quad (${gate.info.plainName}: $${matrixSize(gate.info.qubits)}$ matrix)\n\\begin{equation*}\n  ${gate.info.name} = ${gate.info.matrix}\n\\end{equation*}\n\n`
      : `\\textbf{Gate:} $${step.gateLabelLatex}$\n\n`;
    const prevState =
      idx === 0
        ? `|\\psi_0\\rangle = ${stepsResult.initial.latex}`
        : `|\\psi_{${idx}}\\rangle`;
    const componentHeader = groupHeadings.get(idx) ?? "";
    return `${componentHeader}${matrixBlock}\\begin{align}\n  ${prevState} &\\xrightarrow{${step.gateLabelLatex}} \\\\[2pt]\n  |\\psi_{${idx + 1}}\\rangle &= ${step.latex}\n\\end{align}`;
  })
  .join("\n\n")}

`
      : "";

  const probabilities = terms.map((t) => ({
    label: `|${t.basisState}\\rangle`,
    value:
      Math.round((t.amplitude.re ** 2 + t.amplitude.im ** 2) * 10000) / 100,
  }));

  const probabilitiesSection =
    probabilities.length > 0
      ? `\\section{Measurement Probabilities}

\\begin{figure}[h]
  \\centering
  \\begin{tikzpicture}
    \\begin{axis}[
      ybar,
      bar width=0.5cm,
      width=0.85\\textwidth,
      height=6cm,
      ymin=0, ymax=100,
      xmin=-0.5, xmax=${probabilities.length - 0.5},
      xtick={${probabilities.map((_, i) => i).join(", ")}},
      xticklabels={${probabilities.map((c) => `$${c.label}$`).join(", ")}},
      xticklabel style={font=\\small},
      ylabel={Probability (\\%)},
      ymajorgrids=true,
      grid style=dashed,
      nodes near coords,
      nodes near coords align={vertical},
      every node near coord/.append style={font=\\tiny},
    ]
      \\addplot[fill=blue!60, draw=blue!80] coordinates {${probabilities.map((c, i) => `(${i}, ${c.value})`).join(" ")}};
    \\end{axis}
  \\end{tikzpicture}
  \\caption{Measurement Probabilities of Basis States}
  \\label{fig:histogram}
\\end{figure}

\\begin{center}
  \\begin{tabular}{|c|c|}
    \\hline
    \\textbf{Basis State} & \\textbf{Probability} \\\\
${probabilities.map((c) => `    \\hline\n    $${c.label}$ & $${c.value}\\%$ \\\\`).join("\n")}
    \\hline
  \\end{tabular}
\\end{center}

`
      : "";

  const matricesSection = buildMatricesSection(numQubits, usage);

  const aiSection = aiExplanation
    ? `\\section{AI Explanation of the Computation}

\\textit{The following explanation was generated by an AI assistant (Mistral AI) and provides an intuitive understanding of the quantum circuit computation.}

\\vspace{0.5em}
${markdownToLatex(aiExplanation)}

`
    : "";

  const hint = pngBase64
    ? "% OVERLEAF: circuit.png is included in the ZIP file\n"
    : "";

  return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{braket}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{pgfplots}
\\usepackage{booktabs}
\\usepackage[hidelinks]{hyperref}
\\pgfplotsset{compat=1.18}
\\geometry{margin=2.5cm}

${hint}
\\title{Learning materials -- ${title ? latexEscape(title) : "Quantum Low-Code Modeler"}}
\\date{\\today}

\\begin{document}

\\maketitle

\\tableofcontents

\\clearpage

${buildModelOverviewSection(numQubits, terms, stepsResult, usage, stepTree)}${circuitSection}${buildBasicsLatexSection(numQubits)}\\section{Quantum State in Dirac Notation}

The quantum system state with ${numQubits} qubit${numQubits !== 1 ? "s" : ""} is:

\\begin{equation}
  |\\psi\\rangle = ${latex}
\\end{equation}

${buildPropertiesSection(numQubits, terms, statevector)}${numQubits === 1 ? buildBlochSection(statevector) : ""}${stepsSection}${probabilitiesSection}${matricesSection ? "\\clearpage\n" + matricesSection : ""}${aiSection}\\end{document}
`;
}
