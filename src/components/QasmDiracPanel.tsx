/**
 * QasmDiracPanel.tsx
 * Platzierung: src/components/QasmDiracPanel.tsx
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { qasmToDirac, qasmToDiracSteps, type DiracStepsResult } from "./utils/qasmToDirac";
import type { Complex } from "@/lib/diracFormatter";
import { statevectorToDirac } from "@/lib/diracFormatter";
import JSZip from "jszip";
import { BlochSphere, BlochSphereMulti, getEntanglementPersistence, isStateFullySeparable, getMultiQubitPersistence } from "./BlochSphere";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Extrahiert aus dem rohen QASM die globalen leqo_reg-Qubit-Indizes des Inputs der
 * (letzten) measurementNode im Schaltkreis. Wird genutzt um in der Dirac-Notation einen
 * Hinweis zu zeigen, in welchen Qubits das eigentliche Ergebnis (z.B. eine Summe) kodiert ist,
 * statt dass der User das selbst aus dem vollen Registerzustand herausrechnen muss.
 *
 * Vorgehen: den Block zwischen "@leqo.input 0" und der zugehörigen
 * "let <var> = leqo_reg[{a, b, c}];"-Zeile innerhalb des measure-Knoten-Abschnitts (erkennbar an
 * "measure ...;") finden und die Indizes extrahieren. Liefert null, falls keine Measurement-Node
 * im QASM gefunden wird oder die Struktur nicht dem erwarteten Muster entspricht.
 */
function extractMeasurementResultIndices(qasmText: string): number[] | null {
  if (!qasmText) return null;

  // Alle Node-Abschnitte durchgehen und den (letzten) finden, der eine "measure"-Anweisung enthält.
  const sectionRegex = /\/\* Start node ([\w-]+) \*\/([\s\S]*?)\/\* End node \1 \*\//g;
  let match: RegExpExecArray | null;
  let lastMeasureSection: string | null = null;

  while ((match = sectionRegex.exec(qasmText)) !== null) {
    const section = match[2];
    if (/\bmeasure\b/.test(section)) {
      lastMeasureSection = section;
    }
  }

  if (!lastMeasureSection) return null;

  // Innerhalb dieses Abschnitts: die erste direkte "let <var> = leqo_reg[{a, b, c}];" Zuweisung
  // vor der "measure"-Zeile ist das Input-Register der Messung.
  const directRegex = /let\s+(\S+)\s*=\s*leqo_reg\[\{([^}]*)\}\];/;
  const directMatch = lastMeasureSection.match(directRegex);
  if (!directMatch) return null;

  const indices = directMatch[2].split(",").map((s) => parseInt(s.trim(), 10));
  return indices.every((n) => !Number.isNaN(n)) ? indices : null;
}

type QasmProps = {
  qasm: string;
  numQubits?: never;
  statevector?: never;
  title?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onGetModel?: () => object;
  /** Callback wenn Nutzer auf einen Step-Zustand klickt: liefert die LEQO-Node-UUID */
  onStepClick?: (nodeId: string) => void;
};

type StatevectorProps = {
  numQubits: number;
  statevector: Complex[];
  qasm?: never;
  title?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onGetModel?: () => object;
  onStepClick?: (nodeId: string) => void;
};

type Props = QasmProps | StatevectorProps;

function prob(re: number, im: number): number {
  return Math.round((re * re + im * im) * 10000) / 100;
}

const BAR_COLOR = "#3b82f6";
const BAR_COLOR_HOVER = "#1d4ed8";
const CHART_HEIGHT = 160;
const BAR_MIN_WIDTH = 24;
const MAX_BARS_BEFORE_SCROLL = 16;

// ---------------------------------------------------------------------------
// LaTeX Export
// ---------------------------------------------------------------------------

/**
 * Konvertiert einen SVG-String (oder SVG Data-URL) im Browser zu einem PNG-Base64-String.
 */
async function svgToPngBase64(svgInput: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    // Akzeptiert sowohl rohen SVG-Text als auch Data-URLs
    let objectUrl: string;
    if (svgInput.startsWith("data:")) {
      // Data-URL direkt verwenden
      objectUrl = svgInput;
    } else {
      // Roher SVG-Text → Blob URL
      const blob = new Blob([svgInput], { type: "image/svg+xml" });
      objectUrl = URL.createObjectURL(blob);
    }

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = (img.naturalWidth || 1200) * scale;
      canvas.height = (img.naturalHeight || 800) * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      const base64 = canvas.toDataURL("image/png").split(",")[1];
      resolve(base64);
    };

    img.onerror = (e) => {
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      reject(e);
    };

    img.src = objectUrl;
  });
}

// ---------------------------------------------------------------------------
// Gate-Erklärungen und Matrizendarstellungen
// ---------------------------------------------------------------------------

const GATE_DESCRIPTIONS: Record<string, { description: string; matrix: string; effect: string }> = {
  H: {
    description: "The Hadamard gate creates an equal superposition of $|0\\rangle$ and $|1\\rangle$.",
    matrix: "\\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}",
    effect: "$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$, \\quad $H|1\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) = |-\\rangle$",
  },
  X: {
    description: "The Pauli-X gate is the quantum analogue of the classical NOT gate. It flips $|0\\rangle$ to $|1\\rangle$ and vice versa.",
    matrix: "\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}",
    effect: "$X|0\\rangle = |1\\rangle$, \\quad $X|1\\rangle = |0\\rangle$",
  },
  Y: {
    description: "The Pauli-Y gate rotates the qubit state by $\\pi$ around the Y-axis of the Bloch sphere.",
    matrix: "\\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}",
    effect: "$Y|0\\rangle = i|1\\rangle$, \\quad $Y|1\\rangle = -i|0\\rangle$",
  },
  Z: {
    description: "The Pauli-Z gate applies a phase flip. It leaves $|0\\rangle$ unchanged and maps $|1\\rangle$ to $-|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}",
    effect: "$Z|0\\rangle = |0\\rangle$, \\quad $Z|1\\rangle = -|1\\rangle$",
  },
  S: {
    description: "The S gate (phase gate) applies a $\\frac{\\pi}{2}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & i \\end{pmatrix}",
    effect: "$S|0\\rangle = |0\\rangle$, \\quad $S|1\\rangle = i|1\\rangle$",
  },
  T: {
    description: "The T gate applies a $\\frac{\\pi}{4}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}",
    effect: "$T|0\\rangle = |0\\rangle$, \\quad $T|1\\rangle = e^{i\\pi/4}|1\\rangle$",
  },
  CNOT: {
    description: "The CNOT (Controlled-NOT) gate flips the target qubit if and only if the control qubit is $|1\\rangle$. It is used to create entanglement.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}",
    effect: "$\\text{CNOT}|00\\rangle = |00\\rangle$, $\\text{CNOT}|01\\rangle = |01\\rangle$, $\\text{CNOT}|10\\rangle = |11\\rangle$, $\\text{CNOT}|11\\rangle = |10\\rangle$",
  },
  CZ: {
    description: "The CZ (Controlled-Z) gate applies a Z gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & -1 \\end{pmatrix}",
    effect: "$\\text{CZ}|11\\rangle = -|11\\rangle$, all other basis states unchanged",
  },
  SWAP: {
    description: "The SWAP gate exchanges the states of two qubits.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\end{pmatrix}",
    effect: "$\\text{SWAP}|01\\rangle = |10\\rangle$, \\quad $\\text{SWAP}|10\\rangle = |01\\rangle$",
  },
  I: {
    description: "The identity gate leaves the qubit state unchanged.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}",
    effect: "$I|\\psi\\rangle = |\\psi\\rangle$",
  },
  SX: {
    description: "The SX gate (\\sqrt{X}) is the square root of the Pauli-X gate. It creates a superposition halfway between $|0\\rangle$ and $|1\\rangle$.",
    matrix: "\\frac{1}{2}\\begin{pmatrix} 1+i & 1-i \\\\ 1-i & 1+i \\end{pmatrix}",
    effect: "$\\sqrt{X}|0\\rangle = \\frac{1+i}{2}|0\\rangle + \\frac{1-i}{2}|1\\rangle$",
  },
  "S†": {
    description: "The S-dagger gate (conjugate transpose of S) applies a $-\\frac{\\pi}{2}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & -i \\end{pmatrix}",
    effect: "$S^\\dagger|0\\rangle = |0\\rangle$, \\quad $S^\\dagger|1\\rangle = -i|1\\rangle$",
  },
  "T†": {
    description: "The T-dagger gate (conjugate transpose of T) applies a $-\\frac{\\pi}{4}$ phase rotation.",
    matrix: "\\begin{pmatrix} 1 & 0 \\\\ 0 & e^{-i\\pi/4} \\end{pmatrix}",
    effect: "$T^\\dagger|0\\rangle = |0\\rangle$, \\quad $T^\\dagger|1\\rangle = e^{-i\\pi/4}|1\\rangle$",
  },
  CY: {
    description: "The CY (Controlled-Y) gate applies a Y gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & -i \\\\ 0 & 0 & i & 0 \\end{pmatrix}",
    effect: "$\\text{CY}|10\\rangle = i|11\\rangle$, \\quad $\\text{CY}|11\\rangle = -i|10\\rangle$",
  },
  CH: {
    description: "The CH (Controlled-H) gate applies a Hadamard gate to the target qubit if the control qubit is $|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\frac{1}{\\sqrt{2}} & \\frac{1}{\\sqrt{2}} \\\\ 0 & 0 & \\frac{1}{\\sqrt{2}} & -\\frac{1}{\\sqrt{2}} \\end{pmatrix}",
    effect: "$\\text{CH}|10\\rangle = |1\\rangle|+\\rangle$, \\quad $\\text{CH}|11\\rangle = |1\\rangle|-\\rangle$",
  },
  CRX: {
    description: "The CRX gate applies a controlled RX rotation to the target qubit.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\cos(\\theta/2) & -i\\sin(\\theta/2) \\\\ 0 & 0 & -i\\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect: "$\\text{CRX}(\\theta)|10\\rangle = \\cos(\\theta/2)|10\\rangle - i\\sin(\\theta/2)|11\\rangle$",
  },
  CRY: {
    description: "The CRY gate applies a controlled RY rotation to the target qubit.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & \\cos(\\theta/2) & -\\sin(\\theta/2) \\\\ 0 & 0 & \\sin(\\theta/2) & \\cos(\\theta/2) \\end{pmatrix}",
    effect: "$\\text{CRY}(\\theta)|10\\rangle = \\cos(\\theta/2)|10\\rangle - \\sin(\\theta/2)|11\\rangle$",
  },
  CRZ: {
    description: "The CRZ gate applies a controlled RZ rotation to the target qubit.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & e^{-i\\theta/2} & 0 \\\\ 0 & 0 & 0 & e^{i\\theta/2} \\end{pmatrix}",
    effect: "$\\text{CRZ}(\\theta)|10\\rangle = e^{-i\\theta/2}|10\\rangle$, \\quad $\\text{CRZ}(\\theta)|11\\rangle = e^{i\\theta/2}|11\\rangle$",
  },
  CU: {
    description: "The CU gate is a controlled unitary gate with parameters $(\\theta, \\phi, \\lambda, \\gamma)$.",
    matrix: "\\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & e^{i\\gamma}\\cos(\\theta/2) & -e^{i(\\gamma+\\lambda)}\\sin(\\theta/2) \\\\ 0 & 0 & e^{i(\\gamma+\\phi)}\\sin(\\theta/2) & e^{i(\\gamma+\\phi+\\lambda)}\\cos(\\theta/2) \\end{pmatrix}",
    effect: "Applies a general unitary to target qubit conditioned on control qubit being $|1\\rangle$",
  },
  Toffoli: {
    description: "The Toffoli gate (CCX) flips the target qubit if and only if both control qubits are $|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1&0&0&0&0&0&0&0 \\\\ 0&1&0&0&0&0&0&0 \\\\ 0&0&1&0&0&0&0&0 \\\\ 0&0&0&1&0&0&0&0 \\\\ 0&0&0&0&1&0&0&0 \\\\ 0&0&0&0&0&1&0&0 \\\\ 0&0&0&0&0&0&0&1 \\\\ 0&0&0&0&0&0&1&0 \\end{pmatrix}",
    effect: "$\\text{Toffoli}|110\\rangle = |111\\rangle$, \\quad $\\text{Toffoli}|111\\rangle = |110\\rangle$",
  },
  CSWAP: {
    description: "The CSWAP (Fredkin) gate swaps the two target qubits if the control qubit is $|1\\rangle$.",
    matrix: "\\begin{pmatrix} 1&0&0&0&0&0&0&0 \\\\ 0&1&0&0&0&0&0&0 \\\\ 0&0&1&0&0&0&0&0 \\\\ 0&0&0&1&0&0&0&0 \\\\ 0&0&0&0&1&0&0&0 \\\\ 0&0&0&0&0&0&1&0 \\\\ 0&0&0&0&0&1&0&0 \\\\ 0&0&0&0&0&0&0&1 \\end{pmatrix}",
    effect: "$\\text{CSWAP}|101\\rangle = |110\\rangle$, \\quad $\\text{CSWAP}|110\\rangle = |101\\rangle$",
  },
};

function buildGateExplanationsSection(stepsResult?: DiracStepsResult): string {
  if (!stepsResult || stepsResult.steps.length === 0) return "";

  // Alle verwendeten Gates aus den Steps extrahieren
  const usedGates = new Set<string>();
  for (const step of stepsResult.steps) {
    // Gate-Label bereinigen (z.B. "H₀" → "H", "I₀ ⊗ CNOT₀,₂" → ["I", "CNOT"])
    const label = step.gateLabel ?? step.gateLabelLatex ?? "";
    const sortedKeys = Object.keys(GATE_DESCRIPTIONS).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (label.includes(key)) { usedGates.add(key); break; }
    }
  }

  if (usedGates.size === 0) return "";

  const gateEntries = [...usedGates].map(gate => {
    const info = GATE_DESCRIPTIONS[gate];
    if (!info) return "";
    // effect enthält $...$ – für align-Umgebung die $ entfernen
    const effectLatex = info.effect.replace(/\$([^$]+)\$/g, "$1");
    return `\\subsection*{${gate} Gate}

${info.description}

\\textbf{Matrix representation:}
\\begin{equation}
  ${gate} = ${info.matrix}
\\end{equation}

\\textbf{Effect on basis states:}
\\begin{align}
  ${effectLatex}
\\end{align}
`;
  }).filter(Boolean).join("\n");

  return `\\section*{Gate Reference}

The following quantum gates are used in this circuit:

${gateEntries}
`;
}

/**
 * Konvertiert Markdown-Text in LaTeX-kompatiblen Text.
 */
function markdownToLatex(md: string): string {
  // Schritt 1: Math-Blöcke zuerst schützen
  const mathBlocks: string[] = [];
  let out = md
    .replace(/\$\$[\s\S]*?\$\$/g, (m) => {
      mathBlocks.push(m);
      return `%%MATH${mathBlocks.length - 1}%%`;
    })
    .replace(/\$[^$\n]+\$/g, (m) => {
      mathBlocks.push(m);
      return `%%MATH${mathBlocks.length - 1}%%`;
    });

  // Schritt 2: Headers (vor Bold/Italic)
  out = out
    .replace(/^#{4}\s+(.+)$/gm, (_: string, t: string) => `\\subsubsection*{${t}}`)
    .replace(/^#{3}\s+(.+)$/gm, (_: string, t: string) => `\\subsubsection*{${t}}`)
    .replace(/^#{2}\s+(.+)$/gm, (_: string, t: string) => `\\subsection*{${t}}`)
    .replace(/^#{1}\s+(.+)$/gm, (_: string, t: string) => `\\section*{${t}}`);

  // Schritt 3: Bold und Italic
  out = out
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, (_: string, t: string) => `\\textbf{\\textit{${t}}}`)
    .replace(/\*\*([^*\n]+)\*\*/g, (_: string, t: string) => `\\textbf{${t}}`)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_: string, t: string) => `\\textit{${t}}`);

  // Schritt 4: Listen
  out = out
    .replace(/^[-*]\s+(.+)$/gm, (_: string, t: string) => `\\item ${t}`)
    .replace(/((?:\\item .+\n?)+)/g, (_: string, items: string) =>
      `\\begin{itemize}\n${items}\\end{itemize}\n`);

  // Schritt 5: Sonstiges
  out = out
    .replace(/^---$/gm, "\\hrule\\vspace{0.5em}")
    .replace(/`([^`]+)`/g, (_: string, t: string) => `\\texttt{${t}}`)
    .replace(/→/g, "$\\rightarrow$")
    .replace(/←/g, "$\\leftarrow$")
    .replace(/₀/g, "$_0$").replace(/₁/g, "$_1$").replace(/₂/g, "$_2$");

  // Schritt 6: Bra-Ket außerhalb von Math
  out = out.replace(/\|([^|\n⟩%%]{0,20})⟩/g, (_: string, s: string) => {
    const inner = s.replace(/ψ/g, "\\psi").replace(/φ/g, "\\phi");
    return `$|${inner}\\rangle$`;
  });

  // Schritt 7: Math-Blöcke wiederherstellen
  out = out.replace(/%%MATH(\d+)%%/g, (_: string, i: string) => {
    const block = mathBlocks[parseInt(i)];
    if (block.startsWith("$$")) {
      const inner = block.slice(2, -2).trim();
      return `\\begin{equation}\n${inner}\n\\end{equation}`;
    }
    return block;
  });

  return out;
}

function buildLatexExport(
  latex: string,
  numQubits: number,
  terms: any[],
  pngBase64?: string,
  stepsResult?: DiracStepsResult,
  aiExplanation?: string
): string {
  // Statevector einmal rekonstruieren, für Separabilitäts- und Persistence-Berechnung genutzt.
  const statevectorArr = Array.from({ length: 1 << numQubits }, (_, i) => {
    const term = terms.find((t) => parseInt(t.basisState, 2) === i);
    return term ? term.amplitude : { re: 0, im: 0 };
  });

  // Exakte Separabilitätsprüfung (keine Heuristik): vollständig separabel, wenn JEDES Qubit
  // einen reinen reduzierten Zustand hat (Bloch-Vektor-Länge 1 für jede Qubit-Bipartition).
  const isEntangledExport = numQubits >= 2 && !isStateFullySeparable(statevectorArr, numQubits);

  const persistenceExport: number | null = numQubits === 1
    ? getEntanglementPersistence(statevectorArr, numQubits, 0)
    : isEntangledExport
    ? getMultiQubitPersistence(terms, numQubits)
    : 0;

  const entanglementSection = `\\section*{Entanglement Properties}

\\textbf{Definitions.}

\\emph{Separable:} A multi-qubit quantum state is called \\emph{separable} if it can be
written as a tensor product of the individual qubit states, i.e.\\
$|\\psi\\rangle = |\\psi_1\\rangle \\otimes |\\psi_2\\rangle \\otimes \\dots \\otimes |\\psi_n\\rangle$.
In this case, each qubit can be fully described by its own, independent quantum state.

\\emph{Entangled:} A multi-qubit quantum state is called \\emph{entangled} if no such
tensor-product decomposition exists. The qubits cannot be described independently of one
another: measuring one qubit instantaneously affects the possible outcomes of measuring the
others, even if the qubits are physically separated.

\\textbf{Status for this circuit:} This ${numQubits}-qubit state is
\\textbf{${isEntangledExport ? "entangled" : "separable"}}${
    numQubits >= 2 && !isEntangledExport
      ? " (it factors into a product of single-qubit states)"
      : ""
  }.

${persistenceExport !== null
  ? numQubits === 1
    ? `\\textbf{Entanglement Persistence:} $S = ${persistenceExport.toFixed(3)}$ (von Neumann entropy of the qubit's reduced density matrix, in bits). $S = 0$ corresponds to a pure, unentangled state; $S = 1$ corresponds to a maximally mixed/entangled qubit.\n\n`
    : `\\textbf{Entanglement Persistence:} $P = ${persistenceExport.toFixed(3)}$ (persistency of entanglement: the minimum number of local qubit measurements required until the remaining state is guaranteed to be fully separable).\n\n`
  : numQubits >= 2
  ? `\\textbf{Entanglement Persistence:} not computable -- this state does not match any of the recognized standard patterns (GHZ-like states, Bell-state variants, W-states).\n\n`
  : ""}`;

  const termLines = terms
    .map((t) => {
      const p = prob(t.amplitude.re, t.amplitude.im);
      return `    \\hline\n    $|${t.basisState}\\rangle$ & $${p}\\%$ \\\\`;
    })
    .join("\n");

  const circuitSection = pngBase64
    ? `\\section*{Quantum Circuit}

\\begin{figure}[h]
  \\centering
  \\includegraphics[width=0.9\\textwidth]{circuit}
  \\caption{Quantum Circuit}
  \\label{fig:circuit}
\\end{figure}

`
    : "";

  // Zwischenschritte als align-Umgebung
  // Hilfsfunktion: Matrix für ein Gate-Label finden
  const getGateMatrix = (gateLabelLatex: string): string | null => {
    // Längere Keys zuerst prüfen damit "CNOT" vor "T" und "NOT" gefunden wird
    const sortedKeys = Object.keys(GATE_DESCRIPTIONS).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (gateLabelLatex.includes(key)) {
        return `${key} = ${GATE_DESCRIPTIONS[key].matrix}`;
      }
    }
    return null;
  };

  const stepsSection = stepsResult && stepsResult.steps.length > 0
    ? `\\section*{Mathematical Intermediate Steps}

${stepsResult.steps.map((step, idx) => {
  const matrix = getGateMatrix(step.gateLabelLatex ?? step.gateLabel ?? "");
  const matrixBlock = matrix
    ? `\\textbf{Gate:} $${step.gateLabelLatex}$\n\\begin{equation}\n  ${matrix}\n\\end{equation}\n\n`
    : `\\textbf{Gate:} $${step.gateLabelLatex}$\n\n`;
  const prevState = idx === 0
    ? `|\\psi_0\\rangle = ${stepsResult.initial.latex}`
    : `|\\psi_{${idx}}\\rangle`;
  return `${matrixBlock}\\begin{align}\n  ${prevState} &\\xrightarrow{${step.gateLabelLatex}} \\\\[2pt]\n  |\\psi_{${idx + 1}}\\rangle &= ${step.latex}\n\\end{align}`;
}).join("\n\n")}

`
    : "";

  // pgfplots Histogram
  const histogramSection = terms.length > 0
    ? (() => {
        const coords = terms
          .map((t) => {
            const p = prob(t.amplitude.re, t.amplitude.im);
            // Escape den Basis State für pgfplots x-Tick-Labels
            return { label: `|${t.basisState}\\rangle`, value: p };
          });
        const coordStr = coords
          .map((c, i) => `(${i}, ${c.value})`)
          .join(' ');
        const tickLabels = coords
          .map((c) => `$${c.label}$`)
          .join(', ');
        const xMax = coords.length - 0.5;

        return `\\section*{Measurement Probabilities}

\\begin{figure}[h]
  \\centering
  \\begin{tikzpicture}
    \\begin{axis}[
      ybar,
      bar width=0.5cm,
      width=0.85\\textwidth,
      height=6cm,
      ymin=0, ymax=100,
      xmin=-0.5, xmax=${xMax},
      xtick={${coords.map((_, i) => i).join(', ')}},
      xticklabels={${tickLabels}},
      xticklabel style={font=\\small},
      ylabel={Probability (\\%)},
      ymajorgrids=true,
      grid style=dashed,
      nodes near coords,
      nodes near coords align={vertical},
      every node near coord/.append style={font=\\tiny},
    ]
      \\addplot[fill=blue!60, draw=blue!80] coordinates {${coordStr}};
    \\end{axis}
  \\end{tikzpicture}
  \\caption{Measurement Probabilities of Basis States}
  \\label{fig:histogram}
\\end{figure}

`;
      })()
    : "";

  const tableSection = terms.length > 0
    ? `\\section*{Measurement Probabilities (Table)}

\\begin{center}
  \\begin{tabular}{|c|c|}
    \\hline
    \\textbf{Basis State} & \\textbf{Probability} \\\\
    \\hline
${termLines}
    \\hline
  \\end{tabular}
\\end{center}

`
    : "";

  const gateExplanationsSection = buildGateExplanationsSection(stepsResult);

  // AI Erklärung in LaTeX umwandeln
  const aiSection = aiExplanation
    ? `\\section*{AI Explanation of the Computation}

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
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{braket}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{pgfplots}
\\usepackage{booktabs}
\\pgfplotsset{compat=1.18}
\\geometry{margin=2.5cm}

${hint}
\\title{Dirac Notation -- Quantum Low-Code Modeler}
\\date{\\today}

\\begin{document}

\\maketitle

${circuitSection}\\section*{Quantum State in Dirac Notation}

The quantum system state with ${numQubits} qubit${numQubits !== 1 ? "s" : ""} is:

\\begin{equation}
  |\\psi\\rangle = ${latex}
\\end{equation}

${entanglementSection}${stepsSection}${histogramSection}${tableSection}${gateExplanationsSection ? "\\clearpage\n" + gateExplanationsSection : ""}${aiSection}\\end{document}
`;
}

function downloadTex(content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dirac_notation.tex";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(texContent: string, pngBase64: string, modelJson?: object) {
  const zip = new JSZip();
  zip.file("main.tex", texContent);
  zip.file("circuit.png", pngBase64, { base64: true });
  if (modelJson) {
    zip.file("model.json", JSON.stringify(modelJson, null, 2));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dirac_export.zip";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Export-Menü
// ---------------------------------------------------------------------------

function ExportMenu({ latex, numQubits, terms, unicode, onGetCircuitSvg, stepsResult, onGetModel, aiExplanation}: {
  latex: string;
  numQubits: number;
  terms: any[];
  unicode: string;
  onGetCircuitSvg?: () => Promise<string>;
  stepsResult?: DiracStepsResult;
  onGetModel?: () => object;
  aiExplanation?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
    setOpen(false);
  };

  const handleDownloadTex = async (withCircuit: boolean) => {
    setOpen(false);
    if (withCircuit && onGetCircuitSvg) {
      setLoadingSvg(true);
      try {
        const svg = await onGetCircuitSvg();
        const pngBase64 = await svgToPngBase64(svg);
        const texContent = buildLatexExport(latex, numQubits, terms, pngBase64, stepsResult, aiExplanation);
        const modelJson = onGetModel?.();
        await downloadZip(texContent, pngBase64, modelJson);
      } catch (e) {
        console.error("Export failed:", e);
        downloadTex(buildLatexExport(latex, numQubits, terms, undefined, stepsResult, aiExplanation));
      } finally {
        setLoadingSvg(false);
      }
    } else {
      downloadTex(buildLatexExport(latex, numQubits, terms, undefined, stepsResult, aiExplanation));
    }
  };

  const handleDownloadPng = async () => {
    setOpen(false);
    if (!onGetCircuitSvg) return;
    setLoadingSvg(true);
    try {
      const svg = await onGetCircuitSvg();
      const pngBase64 = await svgToPngBase64(svg);
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${pngBase64}`;
      a.download = "circuit.png";
      a.click();
    } catch (e) {
      console.error("PNG Export failed:", e);
    } finally {
      setLoadingSvg(false);
    }
  };

  const handleDownloadPdf = async () => {
    setOpen(false);
    setLoadingPdf(true);
    setPdfError(null);
    try {
      // circuit.png einbetten wenn möglich
      let pngBase64: string | undefined;
      if (onGetCircuitSvg) {
        try {
          const svg = await onGetCircuitSvg();
          pngBase64 = await svgToPngBase64(svg);
        } catch {
          pngBase64 = undefined;
        }
      }

      const texContent = buildLatexExport(latex, numQubits, terms, pngBase64, stepsResult, aiExplanation);

      // ytotech JSON API: resources-Array mit main.tex + optional circuit.png
      const resources: object[] = [
        { main: true, content: texContent },
      ];
      if (pngBase64) {
        resources.push({ path: "circuit.png", file: pngBase64 });
      }

      const response = await fetch("https://latex.ytotech.com/builds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler: "pdflatex", resources }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LaTeX compile error (${response.status}): ${errorText.slice(0, 300)}`);
      }
      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dirac_export.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loadingSvg || loadingPdf}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
      >
        {loadingSvg ? "⏳ Exporting..." : loadingPdf ? "⏳ PDF..." : "↑ Export"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-60 py-1 text-sm">

            {/* Kopieren */}
            <button onClick={() => copy(`|\\psi\\rangle = ${latex}`, "latex")}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
              <span>𝜓</span>{copied === "latex" ? "✓ Copied!" : "Copy LaTeX"}
            </button>
            <button onClick={() => copy(unicode, "unicode")}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
              <span>⟩</span>{copied === "unicode" ? "✓ Copied!" : "Copy Unicode"}
            </button>

            <hr className="my-1 border-gray-100" />
            <p className="px-3 py-1 text-gray-400" style={{ fontSize: "10px" }}>OVERLEAF EXPORT</p>

            {/* .tex without circuit */}
            <button onClick={() => handleDownloadTex(false)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
              <span>↓</span>
              <span>
                <span className="block">Download main.tex</span>
                <span className="block text-gray-400" style={{ fontSize: "10px" }}>formula & table only</span>
              </span>
            </button>

            {/* .zip mit .tex + circuit.png */}
            {onGetCircuitSvg && (
              <button onClick={() => handleDownloadTex(true)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                <span>↓</span>
                <span>
                  <span className="block">dirac_export.zip</span>
                  <span className="block text-gray-400" style={{ fontSize: "10px" }}>main.tex + circuit.png + model.json</span>
                </span>
              </button>
            )}

            <hr className="my-1 border-gray-100" />
            <p className="px-3 py-1 text-gray-400" style={{ fontSize: "10px" }}>PDF EXPORT</p>

            {/* PDF via LaTeX.Online */}
            <button onClick={handleDownloadPdf} disabled={loadingPdf}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 disabled:opacity-50">
              <span>📄</span>
              <span>
                <span className="block">{loadingPdf ? "Compiling PDF..." : "Download PDF"}</span>
                <span className="block text-gray-400" style={{ fontSize: "10px" }}>via LaTeX.Online · inkl. circuit.png · ~5–10s</span>
              </span>
            </button>

            {pdfError && (
              <div className="px-3 py-2 text-red-500 text-xs">{pdfError}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Qubit Selector
// ---------------------------------------------------------------------------

interface QubitSelectorProps {
  numQubits: number;
  selected: number[];
  onChange: (selected: number[]) => void;
}

function QubitSelector({ numQubits, selected, onChange }: QubitSelectorProps) {
  const allSelected = selected.length === numQubits;
  const selectOne = (q: number) => {
    // Wenn nur dieser eine bereits ausgewählt ist → alle auswählen
    if (selected.length === 1 && selected[0] === q) {
      onChange(Array.from({ length: numQubits }, (_, i) => i));
    } else {
      // Sonst: nur diesen einen auswählen
      onChange([q]);
    }
  };
  const toggleAll = () => {
    if (allSelected) onChange([0]);
    else onChange(Array.from({ length: numQubits }, (_, i) => i));
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-500 mr-1">qubits:</span>
      <button
        onClick={toggleAll}
        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
          allSelected ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
        }`}
      >
        All
      </button>
      {Array.from({ length: numQubits }, (_, i) => (
        <button key={i} onClick={() => selectOne(i)}
          className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors ${
            selected.includes(i) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          q{i}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------

interface HistogramBar { label: string; value: number; }

function Histogram({ data }: { data: HistogramBar[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const needsScroll = data.length > MAX_BARS_BEFORE_SCROLL;
  const barWidth = needsScroll
    ? BAR_MIN_WIDTH
    : Math.max(BAR_MIN_WIDTH, Math.floor((containerWidth - 70) / data.length) - 12);
  const gap = needsScroll ? 4 : Math.max(4, Math.floor(barWidth * 0.3));
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="w-full overflow-x-auto" ref={containerRef}>
      <div style={{ minWidth: needsScroll ? `${totalWidth}px` : "100%" }}>
        <div className="flex items-end" style={{ height: `${CHART_HEIGHT + 32}px` }}>
          <div className="flex flex-col justify-between items-end pr-1 flex-shrink-0"
            style={{ height: `${CHART_HEIGHT}px`, marginBottom: "28px" }}>
            {[100, 75, 50, 25, 0].map((tick) => (
              <span key={tick} className="text-gray-400" style={{ fontSize: "10px", lineHeight: 1 }}>{tick}%</span>
            ))}
          </div>
          <div className="flex flex-col flex-1">
            <div className="relative flex items-end"
              style={{ height: `${CHART_HEIGHT}px`, borderLeft: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
              {[25, 50, 75].map((tick) => (
                <div key={tick} className="absolute w-full"
                  style={{ bottom: `${(tick / 100) * CHART_HEIGHT}px`, borderTop: "1px dashed #f3f4f6", pointerEvents: "none" }} />
              ))}
              <div className="flex items-end w-full h-full px-2" style={{ gap: `${gap}px` }}>
                {data.map((d) => {
                  const barH = Math.max(2, (d.value / 100) * CHART_HEIGHT);
                  const isHov = hovered === d.label;
                  return (
                    <div key={d.label} className="relative flex flex-col items-center"
                      style={{ width: `${barWidth}px`, flexShrink: 0 }}
                      onMouseEnter={() => setHovered(d.label)}
                      onMouseLeave={() => setHovered(null)}>
                      {isHov && (
                        <div className="absolute bottom-full mb-1 bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10"
                          style={{ fontSize: "11px" }}>
                          {d.label}: {d.value}%
                        </div>
                      )}
                      <div style={{
                        width: `${barWidth}px`, height: `${barH}px`,
                        backgroundColor: isHov ? BAR_COLOR_HOVER : BAR_COLOR,
                        borderRadius: "3px 3px 0 0", transition: "background-color 0.15s",
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex px-2 mt-1" style={{ gap: `${gap}px` }}>
              {data.map((d) => (
                <div key={d.label} className="text-center text-gray-600 font-mono overflow-hidden"
                  style={{ width: `${barWidth}px`, flexShrink: 0, fontSize: barWidth < 32 ? "9px" : "11px", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                  title={d.label}>{d.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

export function QasmDiracPanel(props: Props) {
  const title = props.title ?? "Dirac Representation";
  const onStepClick = props.onStepClick;
  const [showBasisStates, setShowBasisStates] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [showBloch, setShowBloch] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [blochQubit, setBlochQubit] = useState(0);
  const [mistralExplanation, setMistralExplanation] = useState<string | null>(null);
  const [mistralLoading, setMistralLoading] = useState(false);

  /**
   * Behebt Formatierungsfehler in der Mistral-Antwort, die KaTeX nicht rendern kann:
   * - \begin{pmatrix}...\end{pmatrix} Blöcke, die nicht in $$...$$ eingeschlossen sind
   * - \text{...} um Gate-Namen, was in $...$ oft nicht korrekt mit \otimes etc. zusammenspielt
   */
  const sanitizeMistralMath = (text: string): string => {
    let result = text;

    // Lose \begin{pmatrix}...\end{pmatrix} (und ähnliche Matrix-Envs) automatisch in $$...$$ einschließen,
    // falls sie nicht bereits in $ oder $$ stehen.
    const matrixEnvRegex = /(\\begin\{(?:p|b|v|V)?matrix\}[\s\S]*?\\end\{(?:p|b|v|V)?matrix\})/g;
    result = result.replace(matrixEnvRegex, (match, group, offset, fullStr) => {
      // Prüfen ob unmittelbar davor schon ein $ oder $$ steht
      const before = fullStr.slice(Math.max(0, offset - 2), offset);
      const after = fullStr.slice(offset + match.length, offset + match.length + 2);
      if (before.includes("$") || after.includes("$")) {
        return match; // bereits umschlossen, nichts tun
      }
      return `$$${match}$$`;
    });

    // \text{Toffoli} = $$...$$  →  Vorangestelltes "X =" außerhalb von $$ in die Formel hineinziehen,
    // damit "Toffoli = " nicht als rohtext vor der Formel landet.
    result = result.replace(/\\text\{([A-Za-z0-9†]+)\}\s*=\s*\$\$/g, "$$$1 = ");

    return result;
  };

  const explainWithMistral = async () => {
    if (!stepsResult || stepsResult.steps.length === 0) return;
    setMistralLoading(true);
    setMistralExplanation(null);
    try {
      const token = import.meta.env.VITE_MISTRAL_TOKEN;
      if (!token) {
        setMistralExplanation("⚠ No Mistral API token found. Please add VITE_MISTRAL_TOKEN to your .env file.");
        return;
      }
      const stepsText = stepsResult.steps.map((s: any, i: number) =>
        `Step ${i + 1}: Apply gate $${s.gateLabelLatex ?? s.gateLabel}$ → $|\\psi_{${i + 1}}\\rangle$ = ${s.unicode}`
      ).join("\n");

      // Node-Kontext aus Model extrahieren
      let nodeContextText = "";
      if (props.onGetModel) {
        try {
          const model = props.onGetModel() as any;
          const nodes = model?.nodes ?? [];
          const relevantNodes = nodes.filter((n: any) =>
            n.type === "statePreparationNode" || n.type === "dataTypeNode"
          );
          if (relevantNodes.length > 0) {
            const contextParts = relevantNodes.map((n: any) => {
              const d = n.data ?? {};
              const parts: string[] = [];
              if (d.label)           parts.push(`Node: "${d.label}"`);
              if (d.encodingType)    parts.push(`Encoding: ${d.encodingType}`);
              if (d.decimalPrecision !== undefined) parts.push(`Decimal Precision: ${d.decimalPrecision}`);
              if (d.bound !== undefined) parts.push(`Bound: ${d.bound}`);
              if (d.value !== undefined) parts.push(`Value: ${d.value}`);
              if (d.inputs?.length)  parts.push(`Inputs: ${d.inputs.map((i: any) => i.label ?? i.id).join(", ")}`);
              if (d.outputs?.length) parts.push(`Outputs: ${d.outputs.map((o: any) => o.label ?? o.id).join(", ")}`);
              return parts.join(", ");
            }).filter(Boolean).join("\n");
            if (contextParts) {
              nodeContextText = `\n\nNode configuration in this circuit:\n${contextParts}\n\nIf relevant, use this context to give a concrete explanation (e.g. "this circuit encodes the number X using Basis Encoding with Y qubits").`;
            }
          }
        } catch { /* ignore model errors */ }
      }

      const numSteps = stepsResult.steps.length;
      // Bei vielen Steps kürzer fassen und Matrizen nur einmal pro Gate-Typ zeigen,
      // damit die Antwort innerhalb des Token-Budgets bleibt und nicht abgeschnitten wird.
      const lengthGuidance = numSteps > 6
        ? `This circuit has ${numSteps} steps. To stay within the response length limit: explain each step in 1-2 short sentences, and only include the matrix representation the FIRST time a given gate type appears (for repeated gate types, just refer back to it by name without repeating the matrix).`
        : `Please explain each step in 2-3 sentences. Include the matrix representation for each gate.`;

      const prompt = `You are a quantum computing tutor. Explain the following quantum circuit computation in simple, clear English. For each step, explain what the gate does physically and mathematically, and why the state changes the way it does.\n\nFormatting rules (follow these strictly):\n- Use LaTeX math notation with $...$ for inline math and $$...$$ for block equations.\n- Every math expression, including step headers, gate names, and tensor products (e.g. $I_0 \\otimes X_2$), MUST be wrapped in $...$. Never write LaTeX commands like \\otimes, \\text, or subscripts outside of $...$.\n- Do not use \\text{...} for gate names inside math mode; instead write the gate symbol directly, e.g. write $\\text{CNOT}_{2,3}$ as $CNOT_{2,3}$ using plain uppercase letters, not \\text.\n- Keep each step header on its own line in the format: ### Step N: Apply $<gate notation>$\n- IMPORTANT: make sure your response is complete and not cut off. Always finish with a brief concluding sentence about the final state.\n\nInitial state: $|\\psi_0\\rangle$ = ${stepsResult.initial.unicode}\n\n${stepsText}${nodeContextText}\n\n${lengthGuidance} Focus on intuition and physical meaning.`;
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: prompt }], max_tokens: 4000 }),
      });
      if (!response.ok) throw new Error(`Mistral API error: ${response.status}`);
      const data = await response.json();
      const rawExplanation = data.choices?.[0]?.message?.content ?? "No explanation received.";
      setMistralExplanation(sanitizeMistralMath(rawExplanation));
    } catch (e) {
      setMistralExplanation(`⚠ Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setMistralLoading(false);
    }
  };

  const MAX_QUBITS = 12; // 2^12 = 4096 Terme, darüber Speicher/Performance-Probleme

  const fullResult = useMemo(() => {
    if (!("qasm" in props) || !props.qasm) return null;
    try {
      const result = qasmToDirac(props.qasm);
      if (result.numQubits > MAX_QUBITS) return null;
      return result;
    } catch {
      return null;
    }
  }, [props]);

  const stepsResult = useMemo(() => {
    if (!("qasm" in props) || !props.qasm) return null;
    if (!fullResult) return null; // nicht simulieren wenn Qubit-Limit überschritten
    try {
      return qasmToDiracSteps(props.qasm);
    } catch {
      return null;
    }
  }, [props, fullResult]);

  const unicodeStr = useMemo(() => {
    if (fullResult) return fullResult.unicode;
    if ("statevector" in props && props.statevector)
      return statevectorToDirac(props.statevector, props.numQubits);
    return null;
  }, [fullResult, props]);

  const numQubits = fullResult?.numQubits ?? ("numQubits" in props ? props.numQubits : 0);

  // Globale Qubit-Indizes, in denen laut QASM das tatsächliche Measurement-Ergebnis liegt
  // (z.B. die Summe eines Additionsknotens), und das daraus direkt berechnete Teilergebnis.
  // Wird nur als Hinweis angezeigt, verändert nicht die eigentliche Qubit-Auswahl.
  const measurementResultIndices = useMemo(() => {
    if (!("qasm" in props) || !props.qasm) return null;
    return extractMeasurementResultIndices(props.qasm);
  }, [props]);

  const measurementResultHint = useMemo(() => {
    if (!measurementResultIndices || !fullResult) return null;
    if (measurementResultIndices.length === 0) return null;
    // Nur sinnvoll als Hinweis, wenn es tatsächlich eine ECHTE Teilmenge aller Qubits ist
    if (measurementResultIndices.length >= fullResult.numQubits) return null;

    // Eindeutigkeit prüfen: alle Terme müssen an diesen Indizes denselben Bitstring haben,
    // sonst gibt es kein deterministisches Einzelergebnis zum Anzeigen.
    const bitsForTerm = (basisState: string) =>
      measurementResultIndices.map((i) => basisState[i]).join("");

    const distinctOutcomes = new Set(fullResult.terms.map((t) => bitsForTerm(t.basisState)));
    if (distinctOutcomes.size !== 1) return null;

    const bits = [...distinctOutcomes][0];
    // measurementResultIndices ist aufsteigend sortiert, d.h. bits[0] = LSB (niedrigstwertigstes
    // Qubit zuerst, wie im Addier-Schaltkreis üblich). Für die Anzeige und die Dezimalumwandlung
    // wird in die intuitive MSB-first-Reihenfolge umgekehrt, damit Bitstring und Dezimalwert
    // konsistent sind: |011⟩ = 3₁₀ statt (irreführend) |110⟩ = 3₁₀.
    const bitsDisplay = bits.split("").reverse().join("");
    const decimal = parseInt(bitsDisplay, 2);
    return {
      indices: measurementResultIndices,
      bits: bitsDisplay,
      decimal,
    };
  }, [measurementResultIndices, fullResult]);

  const [selectedqubits, setSelectedQubits] = useState<number[]>([]);

  // Wenn numQubits sich ändert (neues QASM geladen): Measurement-Ergebnis-Indizes
  // vorauswählen falls vorhanden (z.B. Additions-Schaltkreis -> direkt Summe anzeigen),
  // sonst alle Qubits auswählen.
  useEffect(() => {
    if (numQubits > 0) {
      if (measurementResultIndices && measurementResultIndices.length > 0
          && measurementResultIndices.length < numQubits) {
        setSelectedQubits(measurementResultIndices);
      } else {
        setSelectedQubits(Array.from({ length: numQubits }, (_, i) => i));
      }
    }
  }, [numQubits, measurementResultIndices]);

  const effectiveSelected = useMemo(() => {
    if (selectedqubits.length === 0 || selectedqubits.some((q) => q >= numQubits))
      return Array.from({ length: numQubits }, (_, i) => i);
    return selectedqubits;
  }, [selectedqubits, numQubits]);

  // ---------------------------------------------------------------------------
  // Partielle Messung: Projektionsoperator, Wahrscheinlichkeit, kollabierter Zustand
  // ---------------------------------------------------------------------------
  const partialMeasurement = useMemo(() => {
    if (!fullResult || effectiveSelected.length === 0) return null;
    // Bei 1 Qubit: immer alle Qubits messen
    const measuredQubits = numQubits === 1 ? [0] : effectiveSelected.length === numQubits ? [] : effectiveSelected;
    if (measuredQubits.length === 0) return null;

    // Für jedes mögliche Messergebnis (0 oder 1 pro gemessenem Qubit)
    const results = [];
    const numOutcomes = 1 << measuredQubits.length;

    for (let outcome = 0; outcome < numOutcomes; outcome++) {
      // Welche Terme passen zu diesem Messergebnis?
      const matchingTerms = fullResult.terms.filter(term => {
        for (let k = 0; k < measuredQubits.length; k++) {
          const bit = parseInt(term.basisState[measuredQubits[k]] ?? "0");
          const expectedBit = (outcome >> (measuredQubits.length - 1 - k)) & 1;
          if (bit !== expectedBit) return false;
        }
        return true;
      });

      if (matchingTerms.length === 0) continue;

      // P(outcome) = Summe der |amplitude|^2 der passenden Terme
      const probability = matchingTerms.reduce((sum, t) =>
        sum + t.amplitude.re * t.amplitude.re + t.amplitude.im * t.amplitude.im, 0
      );

      if (probability < 1e-10) continue;

      // Kollabierter Zustand: normierte Terme
      const collapsedTerms = matchingTerms.map(t => ({
        ...t,
        amplitude: {
          re: t.amplitude.re / Math.sqrt(probability),
          im: t.amplitude.im / Math.sqrt(probability),
        }
      }));

      // Unicode-Darstellung des kollabierten Zustands
      const formatAmplitude = (re: number, im: number): string => {
        const absVal = Math.sqrt(re * re + im * im);
        if (Math.abs(absVal - 1) < 0.001) return "";
        if (Math.abs(im) < 0.001) {
          const frac = Math.abs(re - 1/Math.sqrt(2)) < 0.001 ? "1/√2" :
                       Math.abs(re - 1/Math.sqrt(3)) < 0.001 ? "1/√3" :
                       Math.abs(re - 0.5) < 0.001 ? "1/2" :
                       re.toFixed(3);
          return frac + " ";
        }
        return `(${re.toFixed(2)}+${im.toFixed(2)}i) `;
      };

      const collapsedUnicode = collapsedTerms.map((t, i) => {
        const amp = formatAmplitude(t.amplitude.re, t.amplitude.im);
        const sign = i > 0 ? " + " : "";
        return `${sign}${amp}|${t.basisState}⟩`;
      }).join("");

      // Outcome-Label z.B. "q0=1"
      const outcomeLabel = measuredQubits.map((q, k) =>
        `q${q}=${(outcome >> (measuredQubits.length - 1 - k)) & 1}`
      ).join(", ");

      const outcomeBits = outcome.toString(2).padStart(measuredQubits.length, "0");

      results.push({
        outcome,
        outcomeBits,
        outcomeLabel,
        probability,
        probabilityPercent: Math.round(probability * 10000) / 100,
        collapsedUnicode,
        matchingTerms,
        collapsedTerms,
      });
    }

    return results.length > 0 ? results : null;
  }, [fullResult, effectiveSelected, numQubits]);

  const histogramData = useMemo((): HistogramBar[] => {
    if (!fullResult) return [];
    const allSelected = effectiveSelected.length === numQubits;
    if (allSelected) {
      return fullResult.terms.map((t) => ({
        label: `|${t.basisState}⟩`,
        value: prob(t.amplitude.re, t.amplitude.im),
      }));
    }
    const reducedSize = 1 << effectiveSelected.length;
    const probs = new Array(reducedSize).fill(0);
    for (const term of fullResult.terms) {
      const p = prob(term.amplitude.re, term.amplitude.im) / 100;
      let reducedIdx = 0;
      for (let k = 0; k < effectiveSelected.length; k++) {
        const bitVal = parseInt(term.basisState[effectiveSelected[k]] ?? "0");
        reducedIdx |= bitVal << (effectiveSelected.length - 1 - k);
      }
      probs[reducedIdx] += p;
    }
    return probs
      .map((p, idx) => ({
        label: `|${idx.toString(2).padStart(effectiveSelected.length, "0")}⟩`,
        value: Math.round(p * 10000) / 100,
      }))
      .filter((d) => d.value > 0.001);
  }, [fullResult, effectiveSelected, numQubits]);

  if (!unicodeStr) {
    // Prüfen ob ein QASM vorhanden ist aber das Qubit-Limit überschritten wurde
    const hasQasm = "qasm" in props && !!props.qasm;
    const tooManyQubits = hasQasm && !fullResult;
    return (
      <div className="rounded-xl border bg-white flex flex-col gap-3 p-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {tooManyQubits ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ⚠ This circuit has too many qubits for local Math Mode simulation (max. {MAX_QUBITS}).
            The backend result is still computed — only the local visualization is disabled.
          </div>
        ) : (
          <div className="text-sm text-gray-400">No QASM code available.</div>
        )}
      </div>
    );
  }

  const terms = fullResult?.terms ?? [];
  const isPartial = effectiveSelected.length < numQubits;

  // Exakte Separabilitätsprüfung (keine Heuristik mehr): vollständig separabel, wenn JEDES
  // Qubit einen reinen reduzierten Zustand hat (Bloch-Vektor-Länge 1 für jede Bipartition).
  // Deckt z.B. den Fall ab, dass zwei unabhängige H-Gates ohne CNOT 4 Terme erzeugen, der
  // Zustand aber trotzdem ein reines Tensorprodukt (separabel) ist.
  const isEntangled = useMemo(() => {
    if (numQubits < 2 || terms.length === 0) return false;
    const statevectorArr = Array.from({ length: 1 << numQubits }, (_, i) => {
      const term = terms.find((t: any) => parseInt(t.basisState, 2) === i);
      return term ? term.amplitude : { re: 0, im: 0 };
    });
    return !isStateFullySeparable(statevectorArr, numQubits);
  }, [terms, numQubits]);

  return (
    <div className="rounded-xl border bg-white flex flex-col gap-3 p-4">

      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0 gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {fullResult && (
            <span className="text-xs text-gray-400">
             {numQubits} {numQubits === 1 ? "Qubit" : "Qubits"} · {terms.length} {terms.length === 1 ? "Term" : "Terms"}
            </span>
          )}
          {terms.length > 0 && (
            <button
              onClick={() => setShowBasisStates((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <span>{showBasisStates ? "▾" : "▸"}</span>
              Histogram
            </button>
          )}
          {"qasm" in props && props.qasm && stepsResult && stepsResult.steps.length > 0 && (
            <button
              onClick={() => setShowSteps((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                showSteps
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showSteps ? "▾" : "▸"}</span>
              Steps
            </button>
          )}
          {fullResult && numQubits > 0 && (
            <button
              onClick={() => setShowBloch((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                showBloch
                  ? "bg-purple-50 border-purple-300 text-purple-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showBloch ? "▾" : "▸"}</span>
              Bloch
            </button>
          )}
          {fullResult && numQubits > 0 && (
            <button
              onClick={() => setShowProperties((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                showProperties
                  ? "bg-teal-50 border-teal-300 text-teal-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showProperties ? "▾" : "▸"}</span>
              Properties
            </button>
          )}
          {fullResult && terms.length > 0 && (
            <ExportMenu
              latex={fullResult.latex}
              numQubits={numQubits}
              terms={terms}
              unicode={fullResult.unicode}
              onGetCircuitSvg={props.onGetCircuitSvg}
              stepsResult={stepsResult ?? undefined}
              onGetModel={props.onGetModel}
              aiExplanation={mistralExplanation ?? undefined}
            />
          )}
        </div>
      </div>

      {/* Warnungen */}
      {fullResult?.warnings && fullResult.warnings.length > 0 && (
        <div className="flex-shrink-0 space-y-1">
          {fullResult.warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* Formula */}
      <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-x-auto">
        <span className="font-mono text-sm text-gray-800 whitespace-nowrap">
          |ψ⟩ = {unicodeStr}
        </span>
      </div>

      {/* Hinweis: in welchen Qubits laut Measurement-Node das eigentliche Ergebnis kodiert ist,
          nur sichtbar wenn aktuell "All" ausgewählt ist (sonst hat der User die Auswahl bereits
          selbst getroffen und der Hinweis wäre redundant). */}
      {!isPartial && measurementResultHint && (
        <div className="flex-shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-emerald-600">💡</span>
          <span className="text-xs text-emerald-800">
            Result is encoded in qubit{measurementResultHint.indices.length > 1 ? "s" : ""}{" "}
            <span className="font-mono font-semibold">
              q{measurementResultHint.indices.join(", q")}
            </span>
            :{" "}
            <span className="font-mono font-semibold">
              |{measurementResultHint.bits}⟩ = {measurementResultHint.decimal}₁₀
            </span>
          </span>
        </div>
      )}

      {/* Zwischenschritte */}
      {showSteps && stepsResult && stepsResult.steps.length > 0 && (
        <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50/30 px-3 py-3 overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Mathematical Intermediate Steps
            </p>
            <button
              onClick={explainWithMistral}
              disabled={mistralLoading}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                mistralLoading
                  ? "border-purple-200 text-purple-400 opacity-60"
                  : "border-purple-300 hover:bg-purple-50 text-purple-600"
              }`}
              title="Explain steps with Mistral AI"
            >
              <span>{mistralLoading ? "⟳" : "✦"}</span>
              {mistralLoading ? "Explaining..." : "Explain"}
            </button>
          </div>
          {/* Notation-Hinweis */}
          <div className="flex items-start gap-1.5 mb-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-100">
            <span className="text-blue-400 text-xs mt-0.5">ℹ</span>
            <p className="text-xs text-blue-600 leading-relaxed">
              <strong>Notation:</strong> H<sub>0</sub> means the H gate applied to qubit 0, I<sub>1</sub> means identity (no operation) on qubit 1. The subscript indicates which qubit the gate acts on.
            </p>
          </div>

          <div className="flex flex-col gap-0 font-mono text-sm">
            <div className="flex items-baseline gap-2 py-1">
              <span className="text-gray-400 text-xs min-w-[36px]">|ψ₀⟩</span>
              <span className="text-gray-500 text-xs">=</span>
              <span className="text-gray-800 whitespace-nowrap">{stepsResult.initial.unicode}</span>
            </div>
            {stepsResult.steps.map((step, idx) => {
              const isClickable = !!onStepClick && !!step.nodeId;
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-1.5 py-0.5 pl-10">
                    <span className="text-blue-400 text-xs">──</span>
                    <span
                      className={`text-blue-600 text-xs font-sans font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
                        isClickable ? "cursor-pointer hover:bg-blue-200 hover:border-blue-400" : ""
                      }`}
                      title={isClickable ? "Select in Canvas" : undefined}
                      onClick={() => isClickable && onStepClick!(step.nodeId!)}
                    >
                      {step.gateLabel}
                    </span>
                    <span className="text-blue-400 text-xs">──→</span>
                  </div>
                  <div className="flex items-baseline gap-2 py-1">
                    <span className="text-gray-400 text-xs min-w-[36px]">
                      |ψ{'₀₁₂₃₄₅₆₇₈₉'[idx + 1] ?? (idx + 1)}⟩
                    </span>
                    <span className="text-gray-500 text-xs">=</span>
                    <span className="text-gray-800 whitespace-nowrap">{step.unicode}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mistral AI Erklärung */}
          {mistralExplanation && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-purple-500 text-xs">✦</span>
                <p className="text-xs font-medium text-purple-700">AI Explanation</p>
              </div>
              <div className="text-xs text-gray-700 leading-relaxed font-sans
                [&_h3]:text-purple-700 [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1
                [&_h4]:text-purple-600 [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1
                [&_p]:my-1.5 [&_li]:my-0.5 [&_strong]:text-gray-800 [&_ul]:pl-4 [&_ol]:pl-4
                [&_.katex]:text-sm [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {mistralExplanation}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Histogram + Qubit Selector + Partielle Messung */}
      {terms.length > 0 && showBasisStates && (
        <div className="flex-shrink-0 flex flex-col gap-2">
          {numQubits > 1 && (
            <div className="flex flex-col gap-1">
              <QubitSelector numQubits={numQubits} selected={effectiveSelected} onChange={setSelectedQubits} />

            </div>
          )}
          {/* Histogramm: nur wenn alle Qubits ausgewählt */}
          {!isPartial && (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Measurement Probabilities
              </p>
              <Histogram data={histogramData} />
            </>
          )}

          {/* Partielle Messung: Projektion + kollabierter Zustand */}
          {isPartial && partialMeasurement && partialMeasurement.length > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 px-3 py-3 mt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                {numQubits === 1 ? "Measurement" : `Partial Measurement · q${effectiveSelected.join(", q")}`}
              </p>

              {/* Projektionsoperator */}
              <div className="mb-3 font-mono text-xs text-gray-600 overflow-x-auto">
                <span className="text-gray-400">P</span>
                <span className="text-gray-400 text-[10px] align-sub">
                  {numQubits === 1 ? "q0" : effectiveSelected.map(q => `q${q}`).join(",")}
                </span>
                <span className="text-gray-600"> = </span>
                {partialMeasurement.map((r, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-gray-400"> + </span>}
                    <span className="text-indigo-600">|{r.outcomeBits}⟩⟨{r.outcomeBits}|</span>
                    <span className="text-gray-400"> ⊗ </span>
                    <span className="text-gray-600">I</span>
                  </span>
                ))}
              </div>

              {/* Ergebnisse */}
              <div className="flex flex-col gap-3">
                {partialMeasurement.map((r) => (
                  <div key={r.outcome} className="rounded-md border border-indigo-100 bg-white px-3 py-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-indigo-700">{r.outcomeLabel}</span>
                      <span className="text-xs font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-600">
                        P = {r.probabilityPercent}%
                      </span>
                    </div>
                    <div className="font-mono text-xs text-gray-500 mb-1.5">
                      <span>P({r.outcomeLabel}) = ‖P</span>
                      <span className="text-[10px] align-sub">{r.outcomeBits}</span>
                      <span>|ψ⟩‖² = {(r.probabilityPercent / 100).toFixed(3)}</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-gray-400">|ψ'⟩ = </span>
                      <span className="text-gray-800">{r.collapsedUnicode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bloch Sphere */}
      {showBloch && fullResult && numQubits > 0 && (
        <div className="flex-shrink-0 rounded-lg border border-purple-100 bg-purple-50/20 px-3 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Bloch Sphere{numQubits > 1 ? ` (${numQubits} Qubits)` : ""}
          </p>
          <BlochSphereMulti
            statevector={Array.from({ length: 1 << numQubits }, (_, i) => {
              const term = fullResult.terms.find(t => parseInt(t.basisState, 2) === i);
              return term ? term.amplitude : { re: 0, im: 0 };
            })}
            numQubits={numQubits}
          />
        </div>
      )}

      {/* Properties Tab */}
      {showProperties && fullResult && numQubits > 0 && (() => {
        const statevectorArr = Array.from({ length: 1 << numQubits }, (_, i) => {
          const term = fullResult.terms.find(t => parseInt(t.basisState, 2) === i);
          return term ? term.amplitude : { re: 0, im: 0 };
        });

        // Persistence: bei 1 Qubit die exakte von-Neumann-Entropie. Bei mehreren Qubits:
        // 0 falls vollständig separabel, sonst Mustererkennung (GHZ/Bell/W-State) - liefert
        // null ("not computable") falls kein bekanntes Muster zutrifft.
        const persistence: number | null = numQubits === 1
          ? getEntanglementPersistence(statevectorArr, numQubits, 0)
          : isEntangled
          ? getMultiQubitPersistence(fullResult.terms, numQubits)
          : 0;

        return (
          <div className="flex-shrink-0 rounded-lg border border-teal-100 bg-teal-50/20 px-3 py-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Properties
            </p>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-teal-100">
                  <td className="py-1.5 pr-2 font-medium text-gray-600">Property</td>
                  <td className="py-1.5"></td>
                </tr>
                <tr className="border-b border-teal-100">
                  <td className="py-1.5 pr-2 text-gray-700">Bloch Sphere Representation</td>
                  <td className="py-1.5 text-gray-700">
                    {numQubits === 1
                      ? <span className="font-semibold">✓</span>
                      : <span className="font-semibold text-gray-400">✗ <span className="font-normal text-gray-400 text-xs">(only for single qubits)</span></span>}
                  </td>
                </tr>
                <tr className="border-b border-teal-100">
                  <td className="py-1.5 pr-2 text-gray-700">Entangled</td>
                  <td className="py-1.5">
                    {isEntangled ? (
                      <span className="font-semibold">✓</span>
                    ) : (
                      <span className="font-semibold">✗</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 text-gray-700">
                    Persistence
                    {numQubits >= 2 && (
                      <span
                        className="text-gray-400 cursor-help"
                        title="Minimum number of qubits that must be measured to guarantee full separability of the remaining state. Recognized for GHZ-like states (incl. all Bell variants) and W-states. Other states show 'not computable'."
                      > ⓘ</span>
                    )}
                  </td>
                  <td className="py-1.5 font-mono text-gray-700">
                    {persistence !== null ? persistence : "not computable"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}
