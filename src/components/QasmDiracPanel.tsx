/**
 * QasmDiracPanel.tsx
 * Platzierung: src/components/QasmDiracPanel.tsx
 */

import { useMemo, useState, useEffect } from "react";
import { qasmToDirac, qasmToDiracSteps, type DiracStepsResult } from "./utils/qasmToDirac";
import type { Complex } from "@/lib/diracFormatter";
import { statevectorToDirac } from "@/lib/diracFormatter";
import JSZip from "jszip";
import { BlochSphere } from "./BlochSphere";

type QasmProps = {
  qasm: string;
  numQubits?: never;
  statevector?: never;
  title?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onGetModel?: () => object;
};

type StatevectorProps = {
  numQubits: number;
  statevector: Complex[];
  qasm?: never;
  title?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onGetModel?: () => object;
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
};

function buildGateExplanationsSection(stepsResult?: DiracStepsResult): string {
  if (!stepsResult || stepsResult.steps.length === 0) return "";

  // Alle verwendeten Gates aus den Steps extrahieren
  const usedGates = new Set<string>();
  for (const step of stepsResult.steps) {
    // Gate-Label bereinigen (z.B. "H₀" → "H", "I₀ ⊗ CNOT₀,₂" → ["I", "CNOT"])
    const label = step.gateLabel ?? step.gateLabelLatex ?? "";
    for (const key of Object.keys(GATE_DESCRIPTIONS)) {
      if (label.includes(key)) usedGates.add(key);
    }
  }

  if (usedGates.size === 0) return "";

  const gateEntries = [...usedGates].map(gate => {
    const info = GATE_DESCRIPTIONS[gate];
    if (!info) return "";
    return `\\subsection*{${gate} Gate}

${info.description}

\\textbf{Matrix representation:}
\\begin{equation}
  ${gate} = ${info.matrix}
\\end{equation}

\\textbf{Effect on basis states:}
\\begin{equation}
  ${info.effect}
\\end{equation}
`;
  }).filter(Boolean).join("\n");

  return `\\section*{Gate Reference}

The following quantum gates are used in this circuit:

${gateEntries}
`;
}

function buildLatexExport(
  latex: string,
  numQubits: number,
  terms: any[],
  pngBase64?: string,
  stepsResult?: DiracStepsResult
): string {
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
  \\caption{Modellierter Quantum Circuit}
  \\label{fig:circuit}
\\end{figure}

`
    : "";

  // Zwischenschritte als align-Umgebung
  const stepsSection = stepsResult && stepsResult.steps.length > 0
    ? `\\section*{Mathematical Intermediate Steps}

\\begin{align}
  |\\psi_0\\rangle &= ${stepsResult.initial.latex} \\\\[6pt]
${stepsResult.steps.map((step, idx) =>
  `  &\\xrightarrow{${step.gateLabelLatex}} \\\\[2pt]\n  |\\psi_{${idx + 1}}\\rangle &= ${step.latex}`
).join(' \\\\[6pt]\n')}
\\end{align}

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

\\begin{table}[h]
  \\centering
  \\begin{tabular}{|c|c|}
    \\hline
    \\textbf{Basis State} & \\textbf{Probability} \\\\
${termLines}
    \\hline
  \\end{tabular}
  \\caption{Measurement Probabilities of Basis States}
\\end{table}

`
    : "";

  const gateExplanationsSection = buildGateExplanationsSection(stepsResult);

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

${stepsSection}${histogramSection}${tableSection}${gateExplanationsSection}\\end{document}
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

function ExportMenu({ latex, numQubits, terms, unicode, onGetCircuitSvg, stepsResult, onGetModel}: {
  latex: string;
  numQubits: number;
  terms: any[];
  unicode: string;
  onGetCircuitSvg?: () => Promise<string>;
  stepsResult?: DiracStepsResult;
  onGetModel?: () => object;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);

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
        const texContent = buildLatexExport(latex, numQubits, terms, pngBase64, stepsResult);
        const modelJson = onGetModel?.();
        await downloadZip(texContent, pngBase64, modelJson);
      } catch (e) {
        console.error("Export failed:", e);
        downloadTex(buildLatexExport(latex, numQubits, terms, undefined, stepsResult));
      } finally {
        setLoadingSvg(false);
      }
    } else {
      downloadTex(buildLatexExport(latex, numQubits, terms, undefined, stepsResult));
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loadingSvg}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
      >
        {loadingSvg ? "⏳ Exportiere..." : "↑ Export"}
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
                  <span className="block text-gray-400" style={{ fontSize: "10px" }}>main.tex + circuit.png</span>
                </span>
              </button>
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
  const toggle = (q: number) => {
    if (selected.includes(q)) {
      if (selected.length === 1) return;
      onChange(selected.filter((x) => x !== q));
    } else {
      onChange([...selected, q].sort((a, b) => a - b));
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
        Alle
      </button>
      {Array.from({ length: numQubits }, (_, i) => (
        <button key={i} onClick={() => toggle(i)}
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
  const needsScroll = data.length > MAX_BARS_BEFORE_SCROLL;
  const barWidth = needsScroll ? BAR_MIN_WIDTH : Math.max(BAR_MIN_WIDTH, Math.floor(480 / data.length) - 8);
  const gap = needsScroll ? 4 : Math.max(4, Math.floor(barWidth * 0.3));
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="w-full overflow-x-auto">
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
  const [showBasisStates, setShowBasisStates] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [showBloch, setShowBloch] = useState(false);
  const [blochQubit, setBlochQubit] = useState(0);
  const [mistralExplanation, setMistralExplanation] = useState<string | null>(null);
  const [mistralLoading, setMistralLoading] = useState(false);

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

      // Prompt aufbauen
      const stepsText = stepsResult.steps.map((s, i) =>
        `Step ${i + 1}: Apply ${s.gateLabel} → |ψ${i + 1}⟩ = ${s.unicode}`
      ).join("\n");

      const prompt = `You are a quantum computing tutor. Explain the following quantum circuit computation in simple, clear English. For each step, explain what the gate does physically and mathematically, and why the state changes the way it does.

Initial state: |ψ₀⟩ = ${stepsResult.initial.unicode}

${stepsText}

Final state: |ψ⟩ = ${"unicode" in props ? "" : ""} ${stepsResult.steps[stepsResult.steps.length - 1]?.unicode ?? ""}

Please explain each step in 2-3 sentences. Focus on intuition and physical meaning.`;

      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
        }),
      });

      if (!response.ok) throw new Error(`Mistral API error: ${response.status}`);
      const data = await response.json();
      setMistralExplanation(data.choices?.[0]?.message?.content ?? "No explanation received.");
    } catch (e) {
      setMistralExplanation(`⚠ Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setMistralLoading(false);
    }
  };

  const fullResult = useMemo(() => {
    if ("qasm" in props && props.qasm) return qasmToDirac(props.qasm);
    return null;
  }, [props]);

  const stepsResult = useMemo(() => {
    if ("qasm" in props && props.qasm) return qasmToDiracSteps(props.qasm);
    return null;
  }, [props]);

  const unicodeStr = useMemo(() => {
    if (fullResult) return fullResult.unicode;
    if ("statevector" in props && props.statevector)
      return statevectorToDirac(props.statevector, props.numQubits);
    return null;
  }, [fullResult, props]);

  const numQubits = fullResult?.numQubits ?? ("numQubits" in props ? props.numQubits : 0);

  const [selectedqubits, setSelectedQubits] = useState<number[]>([]);

  // Wenn numQubits sich ändert (neues QASM geladen), alle qubits auswählen
  useEffect(() => {
    if (numQubits > 0) {
      setSelectedQubits(Array.from({ length: numQubits }, (_, i) => i));
    }
  }, [numQubits]);

  const effectiveSelected = useMemo(() => {
    if (selectedqubits.length === 0 || selectedqubits.some((q) => q >= numQubits))
      return Array.from({ length: numQubits }, (_, i) => i);
    return selectedqubits;
  }, [selectedqubits, numQubits]);

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
    return (
      <div className="rounded-xl border p-4 text-sm text-gray-400">
        No QASM code available.
      </div>
    );
  }

  const terms = fullResult?.terms ?? [];
  const isPartial = effectiveSelected.length < numQubits;

  return (
    <div className="rounded-xl border bg-white flex flex-col gap-3 p-4 max-h-[70vh] overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          {fullResult && (
            <span className="text-xs text-gray-400">
              {numQubits} qubits · {terms.length} Terms
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
          {fullResult && terms.length > 0 && (
            <ExportMenu
              latex={fullResult.latex}
              numQubits={numQubits}
              terms={terms}
              unicode={fullResult.unicode}
              onGetCircuitSvg={props.onGetCircuitSvg}
              stepsResult={stepsResult ?? undefined}
              onGetModel={props.onGetModel}
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
          <div className="flex flex-col gap-0 font-mono text-sm">
            <div className="flex items-baseline gap-2 py-1">
              <span className="text-gray-400 text-xs min-w-[36px]">|ψ₀⟩</span>
              <span className="text-gray-500 text-xs">=</span>
              <span className="text-gray-800 whitespace-nowrap">{stepsResult.initial.unicode}</span>
            </div>
            {stepsResult.steps.map((step, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-1.5 py-0.5 pl-10">
                  <span className="text-blue-400 text-xs">──</span>
                  <span className="text-blue-600 text-xs font-sans font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">
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
            ))}
          </div>

          {/* Mistral Erklärung */}
          {mistralExplanation && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-purple-500 text-xs">✦</span>
                <p className="text-xs font-medium text-purple-700">AI Explanation</p>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                {mistralExplanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Histogram + Qubit Selector */}
      {terms.length > 0 && showBasisStates && (
        <div className="flex-shrink-0 flex flex-col gap-2">
          {numQubits > 1 && (
            <div className="flex flex-col gap-1">
              <QubitSelector numQubits={numQubits} selected={effectiveSelected} onChange={setSelectedQubits} />
              {isPartial && (
                <p className="text-xs text-blue-600">
                  Partial measurement: probabilities summed over unselected qubits
                </p>
              )}
            </div>
          )}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Measurement Probabilities{isPartial && ` (q${effectiveSelected.join(", q")})`}
          </p>
          <Histogram data={histogramData} />
        </div>
      )}

      {/* Bloch Sphere */}
      {showBloch && fullResult && numQubits > 0 && (
        <div className="flex-shrink-0 rounded-lg border border-purple-100 bg-purple-50/20 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Bloch Sphere
            </p>
            {/* Qubit-Auswahl */}
            {numQubits > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Qubit:</span>
                {Array.from({ length: numQubits }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setBlochQubit(i)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      blochQubit === i
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    q{i}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <BlochSphere
              statevector={Array.from({ length: 1 << numQubits }, (_, i) => {
                const term = fullResult.terms.find(t => parseInt(t.basisState, 2) === i);
                return term ? term.amplitude : { re: 0, im: 0 };
              })}
              numQubits={numQubits}
              qubitIndex={blochQubit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
