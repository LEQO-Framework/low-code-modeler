/**
 * QasmDiracPanel.tsx
 * Platzierung: src/components/QasmDiracPanel.tsx
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  qasmToDirac,
  qasmToDiracSteps,
  normalizeQasm,
  type DiracStepsResult,
  type DiracTerm,
} from "./utils/qasmToDirac";
import type { Complex } from "@/lib/diracFormatter";
import { statevectorToDirac } from "@/lib/diracFormatter";
import JSZip from "jszip";
import {
  BlochSphereMulti,
  getEntanglementPersistence,
  isStateFullySeparable,
  getMultiQubitPersistence,
} from "./BlochSphere";
import { GroverInfoBox } from "./GroverInfoBox";
import { MathCircuitEditor } from "./MathCircuitEditor";
import {
  basicsTopics,
  buildStepTree,
  type StepGroup,
  type StepTreeItem,
} from "./mathExplanations";
import { buildLatexExport, type LatexExportOptions } from "./latexExport";
import { useStore } from "@/config/store";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * Extracts the global leqo_reg qubit indices of the input of the (last) measurement node
 * in the circuit from the raw QASM. Used to show a hint in the Dirac notation about which
 * qubits actually encode the result (e.g. a sum), instead of making the user work that out
 * from the full register state.
 *
 * Approach: find the block between "@leqo.input 0" and the corresponding
 * "let <var> = leqo_reg[{a, b, c}];" line inside the measure node section (recognizable by
 * "measure ...;") and extract the indices. Returns null if no measurement node is found in
 * the QASM or the structure does not match the expected pattern.
 */
function extractMeasurementResultIndices(qasmText: string): number[] | null {
  if (!qasmText) return null;

  // Walk all node sections and pick the last one containing a "measure" statement.
  const sectionRegex =
    /\/\* Start node ([\w-]+) \*\/([\s\S]*?)\/\* End node \1 \*\//g;
  let match: RegExpExecArray | null;
  let lastMeasureSection: string | null = null;

  while ((match = sectionRegex.exec(qasmText)) !== null) {
    const section = match[2];
    if (/\bmeasure\b/.test(section)) {
      lastMeasureSection = section;
    }
  }

  if (!lastMeasureSection) return null;

  // Inside that section, the first direct "let <var> = leqo_reg[{a, b, c}];" assignment
  // before the "measure" line is the input register of the measurement.
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
  /** Called when a step in the Mathematical Intermediate Steps is clicked, with the canvas
   *  node IDs of ALL gates from step 1 up to and including the clicked step (step-click
   *  mechanism, highlights every node used up to that point on the canvas). */
  onStepClick?: (nodeIds: string[]) => void;
  /** Applies a circuit edited in Math Mode (OpenQASM) to the QASM output and the canvas.
   *  Without it the editor works as a preview only. */
  onApplyQasm?: (qasm: string) => void;
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
 * Converts an SVG string (or SVG data URL) to a base64 PNG string in the browser.
 */
async function svgToPngBase64(svgInput: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    // Accepts both raw SVG text and data URLs
    let objectUrl: string;
    if (svgInput.startsWith("data:")) {
      // use the data URL directly
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

function downloadTex(content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dirac_notation.tex";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadZip(
  texContent: string,
  pngBase64: string,
  modelJson?: object,
  qasmContent?: string,
) {
  const zip = new JSZip();
  zip.file("main.tex", texContent);
  zip.file("circuit.png", pngBase64, { base64: true });
  if (modelJson) {
    zip.file("model.json", JSON.stringify(modelJson, null, 2));
  }
  if (qasmContent) {
    zip.file("circuit.qasm", qasmContent);
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
// Export menu
// ---------------------------------------------------------------------------

function ExportMenu({
  title,
  latex,
  numQubits,
  terms,
  unicode,
  onGetCircuitSvg,
  stepsResult,
  onGetModel,
  aiExplanation,
  qasm,
  stepTree,
}: {
  title?: string;
  latex: string;
  numQubits: number;
  terms: DiracTerm[];
  unicode: string;
  onGetCircuitSvg?: () => Promise<string>;
  stepsResult?: DiracStepsResult;
  onGetModel?: () => object;
  aiExplanation?: string;
  qasm?: string;
  stepTree?: StepTreeItem[];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );

  // Compute the dropdown position relative to the viewport rather than to the nearest
  // "position: relative" ancestor, so that "position: fixed" plus the portal into
  // document.body is placed correctly even below overflow-hidden ancestors.
  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  // Recompute the position on scroll/resize, or close the menu, so it does not end up
  // floating at the wrong place.
  useEffect(() => {
    if (!open) return;
    const handleReposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    };
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  const exportOptions: LatexExportOptions = {
    title,
    latex,
    numQubits,
    terms,
    stepsResult,
    aiExplanation,
    stepTree,
  };

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
        const texContent = buildLatexExport({ ...exportOptions, pngBase64 });
        const modelJson = onGetModel?.();
        const normalizedQasm = qasm ? normalizeQasm(qasm) : undefined;
        await downloadZip(texContent, pngBase64, modelJson, normalizedQasm);
      } catch (e) {
        console.error("Export failed:", e);
        downloadTex(buildLatexExport(exportOptions));
      } finally {
        setLoadingSvg(false);
      }
    } else {
      downloadTex(buildLatexExport(exportOptions));
    }
  };

  const handleDownloadPdf = async () => {
    setOpen(false);
    setLoadingPdf(true);
    setPdfError(null);
    try {
      // embed circuit.png when possible
      let pngBase64: string | undefined;
      if (onGetCircuitSvg) {
        try {
          const svg = await onGetCircuitSvg();
          pngBase64 = await svgToPngBase64(svg);
        } catch {
          pngBase64 = undefined;
        }
      }

      const texContent = buildLatexExport({ ...exportOptions, pngBase64 });

      // ytotech JSON API: resources array with main.tex and optionally circuit.png
      const resources: object[] = [{ main: true, content: texContent }];
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
        throw new Error(
          `LaTeX compile error (${response.status}): ${errorText.slice(0, 300)}`,
        );
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
    <div className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        disabled={loadingSvg || loadingPdf}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loadingSvg ? "⏳ Exporting..." : loadingPdf ? "⏳ PDF..." : "↑ Export"}
      </button>

      {open &&
        menuPos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-60 py-1 text-sm"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {/* Kopieren */}
              <button
                onClick={() => copy(`|\\psi\\rangle = ${latex}`, "latex")}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <span>𝜓</span>
                {copied === "latex" ? "✓ Copied!" : "Copy LaTeX"}
              </button>
              <button
                onClick={() => copy(unicode, "unicode")}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <span>⟩</span>
                {copied === "unicode" ? "✓ Copied!" : "Copy Unicode"}
              </button>

              <hr className="my-1 border-gray-100" />
              <p
                className="px-3 py-1 text-gray-400"
                style={{ fontSize: "10px" }}
              >
                OVERLEAF EXPORT
              </p>

              {/* .tex without circuit */}
              <button
                onClick={() => handleDownloadTex(false)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
              >
                <span>↓</span>
                <span>
                  <span className="block">Download main.tex</span>
                  <span
                    className="block text-gray-400"
                    style={{ fontSize: "10px" }}
                  >
                    formula & table only
                  </span>
                </span>
              </button>

              {/* .zip with .tex + circuit.png + circuit.qasm */}
              {onGetCircuitSvg && (
                <button
                  onClick={() => handleDownloadTex(true)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <span>↓</span>
                  <span>
                    <span className="block">dirac_export.zip</span>
                    <span
                      className="block text-gray-400"
                      style={{ fontSize: "10px" }}
                    >
                      main.tex + circuit.png + circuit.qasm + model.json
                    </span>
                  </span>
                </button>
              )}

              <hr className="my-1 border-gray-100" />
              <p
                className="px-3 py-1 text-gray-400"
                style={{ fontSize: "10px" }}
              >
                PDF EXPORT
              </p>

              {/* PDF via LaTeX.Online */}
              <button
                onClick={handleDownloadPdf}
                disabled={loadingPdf}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                <span>📄</span>
                <span>
                  <span className="block">
                    {loadingPdf ? "Compiling PDF..." : "Download PDF"}
                  </span>
                  <span
                    className="block text-gray-400"
                    style={{ fontSize: "10px" }}
                  >
                    via LaTeX.Online · inkl. circuit.png · ~5–10s
                  </span>
                </span>
              </button>

              {pdfError && (
                <div className="px-3 py-2 text-red-500 text-xs">{pdfError}</div>
              )}
            </div>
          </>,
          document.body,
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
    // if this one is the only selected qubit, select all of them
    if (selected.length === 1 && selected[0] === q) {
      onChange(Array.from({ length: numQubits }, (_, i) => i));
    } else {
      // otherwise select just this one
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
          allSelected
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
        }`}
      >
        All
      </button>
      {Array.from({ length: numQubits }, (_, i) => (
        <button
          key={i}
          onClick={() => selectOne(i)}
          className={`text-xs px-2 py-0.5 rounded border font-mono transition-colors ${
            selected.includes(i)
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
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

interface HistogramBar {
  label: string;
  value: number;
}

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
    : Math.max(
        BAR_MIN_WIDTH,
        Math.floor((containerWidth - 70) / data.length) - 12,
      );
  const gap = needsScroll ? 4 : Math.max(4, Math.floor(barWidth * 0.3));
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="w-full overflow-x-auto pt-8" ref={containerRef}>
      <div style={{ minWidth: needsScroll ? `${totalWidth}px` : "100%" }}>
        <div
          className="flex items-end"
          style={{ height: `${CHART_HEIGHT + 32}px` }}
        >
          <div
            className="flex flex-col justify-between items-end pr-1 flex-shrink-0"
            style={{ height: `${CHART_HEIGHT}px`, marginBottom: "28px" }}
          >
            {[100, 75, 50, 25, 0].map((tick) => (
              <span
                key={tick}
                className="text-gray-400"
                style={{ fontSize: "10px", lineHeight: 1 }}
              >
                {tick}%
              </span>
            ))}
          </div>
          <div className="flex flex-col flex-1">
            <div
              className="relative flex items-end"
              style={{
                height: `${CHART_HEIGHT}px`,
                borderLeft: "1px solid #e5e7eb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {[25, 50, 75].map((tick) => (
                <div
                  key={tick}
                  className="absolute w-full"
                  style={{
                    bottom: `${(tick / 100) * CHART_HEIGHT}px`,
                    borderTop: "1px dashed #f3f4f6",
                    pointerEvents: "none",
                  }}
                />
              ))}
              <div
                className="flex items-end w-full h-full px-2"
                style={{ gap: `${gap}px` }}
              >
                {data.map((d) => {
                  const barH = Math.max(2, (d.value / 100) * CHART_HEIGHT);
                  const isHov = hovered === d.label;
                  return (
                    <div
                      key={d.label}
                      className="relative flex flex-col items-center"
                      style={{ width: `${barWidth}px`, flexShrink: 0 }}
                      onMouseEnter={() => setHovered(d.label)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {isHov && (
                        <div
                          className="absolute bottom-full mb-1 bg-gray-800 text-white rounded px-2 py-1 whitespace-nowrap z-10"
                          style={{ fontSize: "11px" }}
                        >
                          {d.label}: {d.value}%
                        </div>
                      )}
                      <div
                        style={{
                          width: `${barWidth}px`,
                          height: `${barH}px`,
                          backgroundColor: isHov ? BAR_COLOR_HOVER : BAR_COLOR,
                          borderRadius: "3px 3px 0 0",
                          transition: "background-color 0.15s",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex px-2 mt-1" style={{ gap: `${gap}px` }}>
              {data.map((d) => (
                <div
                  key={d.label}
                  className="text-center text-gray-600 font-mono overflow-hidden"
                  style={{
                    width: `${barWidth}px`,
                    flexShrink: 0,
                    fontSize: barWidth < 32 ? "9px" : "11px",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                  title={d.label}
                >
                  {d.label}
                </div>
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
  // onStepClick only exists on QasmProps (steps are only available for QASM input), so it is
  // extracted from the props union via an "in" check.
  const onStepClick = "onStepClick" in props ? props.onStepClick : undefined;
  const onApplyQasm = "onApplyQasm" in props ? props.onApplyQasm : undefined;
  const [showEditor, setShowEditor] = useState(false);
  const [showBasisStates, setShowBasisStates] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showBloch, setShowBloch] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showBasics, setShowBasics] = useState(false);
  const [mistralExplanation, setMistralExplanation] = useState<string | null>(
    null,
  );
  const [mistralLoading, setMistralLoading] = useState(false);

  /**
   * Fixes formatting problems in the Mistral response that KaTeX cannot render:
   * - \begin{pmatrix}...\end{pmatrix} blocks that are not wrapped in $$...$$
   * - \text{...} around gate names, which often does not combine correctly with \otimes in $...$
   */
  const sanitizeMistralMath = (text: string): string => {
    let result = text;

    // Automatically wrap loose \begin{pmatrix}...\end{pmatrix} (and similar matrix
    // environments) in $$...$$ unless they already sit inside $ or $$.
    const matrixEnvRegex =
      /(\\begin\{(?:p|b|v|V)?matrix\}[\s\S]*?\\end\{(?:p|b|v|V)?matrix\})/g;
    result = result.replace(matrixEnvRegex, (match, group, offset, fullStr) => {
      // check whether a $ or $$ already precedes it directly
      const before = fullStr.slice(Math.max(0, offset - 2), offset);
      const after = fullStr.slice(
        offset + match.length,
        offset + match.length + 2,
      );
      if (before.includes("$") || after.includes("$")) {
        return match; // bereits umschlossen, nichts tun
      }
      return `$$${match}$$`;
    });

    // \text{Toffoli} = $$...$$  ->  pull a leading "X =" outside the $$ into the formula, so
    // that "Toffoli = " does not end up as raw text in front of it.
    result = result.replace(/\\text\{([A-Za-z0-9†]+)\}\s*=\s*\$\$/g, "$$$1 = ");

    // CRITICAL: remark-math only recognizes $$...$$ as a standalone block (on its own line).
    // Mistral sometimes produces lines such as "X|0\rangle = $$...$$ $$...$$ = |1\rangle" in which
    // several $$ blocks are mixed with running text on the SAME line, which remark-math does
    // not recognize as math at all and renders raw. Fix: check per line whether the line
    // consists of a single $$...$$ block only (a real block). If not (running text or several
    // $$ segments on the same line), convert every $$...$$ on that line to inline $...$ so it
    // at least renders correctly inline.
    result = result
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        const isStandaloneBlock =
          /^\$\$[\s\S]*\$\$$/.test(trimmed) &&
          (trimmed.match(/\$\$/g) || []).length === 2;
        if (isStandaloneBlock) return line; // a real standalone block, leave unchanged
        // convert every $$...$$ occurrence on this line to inline $...$
        return line.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => `$${inner}$`);
      })
      .join("\n");

    return result;
  };

  const explainWithMistral = async () => {
    if (!stepsResult || stepsResult.steps.length === 0) return;
    setMistralLoading(true);
    setMistralExplanation(null);
    try {
      const token = import.meta.env.VITE_MISTRAL_TOKEN;
      if (!token) {
        setMistralExplanation(
          "⚠ No Mistral API token found. Please add VITE_MISTRAL_TOKEN to your .env file.",
        );
        return;
      }
      const stepsText = stepsResult.steps
        .map(
          (s: any, i: number) =>
            `Step ${i + 1}: Apply gate $${s.gateLabelLatex ?? s.gateLabel}$ → $|\\psi_{${i + 1}}\\rangle$ = ${s.unicode}`,
        )
        .join("\n");

      // Extract node context from the model
      let nodeContextText = "";
      if (props.onGetModel) {
        try {
          const model = props.onGetModel() as any;
          const nodes = model?.nodes ?? [];
          const relevantNodes = nodes.filter(
            (n: any) =>
              n.type === "statePreparationNode" || n.type === "dataTypeNode",
          );
          if (relevantNodes.length > 0) {
            const contextParts = relevantNodes
              .map((n: any) => {
                const d = n.data ?? {};
                const parts: string[] = [];
                if (d.label) parts.push(`Node: "${d.label}"`);
                if (d.encodingType) parts.push(`Encoding: ${d.encodingType}`);
                if (d.decimalPrecision !== undefined)
                  parts.push(`Decimal Precision: ${d.decimalPrecision}`);
                if (d.bound !== undefined) parts.push(`Bound: ${d.bound}`);
                if (d.value !== undefined) parts.push(`Value: ${d.value}`);
                if (d.inputs?.length)
                  parts.push(
                    `Inputs: ${d.inputs.map((i: any) => i.label ?? i.id).join(", ")}`,
                  );
                if (d.outputs?.length)
                  parts.push(
                    `Outputs: ${d.outputs.map((o: any) => o.label ?? o.id).join(", ")}`,
                  );
                return parts.join(", ");
              })
              .filter(Boolean)
              .join("\n");
            if (contextParts) {
              nodeContextText = `\n\nNode configuration in this circuit:\n${contextParts}\n\nIf relevant, use this context to give a concrete explanation (e.g. "this circuit encodes the number X using Basis Encoding with Y qubits").`;
            }
          }
        } catch {
          /* ignore model errors */
        }
      }

      const numSteps = stepsResult.steps.length;
      // With many steps, keep it shorter and show the matrices only once per gate type, so
      // the answer stays within the token budget and does not get truncated.
      const lengthGuidance =
        numSteps > 6
          ? `This circuit has ${numSteps} steps. To stay within the response length limit: explain each step in 1-2 short sentences, and only include the matrix representation the FIRST time a given gate type appears (for repeated gate types, just refer back to it by name without repeating the matrix).`
          : `Please explain each step in 2-3 sentences. Include the matrix representation for each gate.`;

      const prompt = `You are a quantum computing tutor. Explain the following quantum circuit computation in simple, clear English. For each step, explain what the gate does physically and mathematically, and why the state changes the way it does.\n\nFormatting rules (follow these strictly):\n- Use LaTeX math notation with $...$ for inline math and $$...$$ for block equations.\n- Every math expression, including step headers, gate names, and tensor products (e.g. $I_0 \\otimes X_2$), MUST be wrapped in $...$. Never write LaTeX commands like \\otimes, \\text, or subscripts outside of $...$.\n- Do not use \\text{...} for gate names inside math mode; instead write the gate symbol directly, e.g. write $\\text{CNOT}_{2,3}$ as $CNOT_{2,3}$ using plain uppercase letters, not \\text.\n- CRITICAL: A $$...$$ block equation MUST be the ONLY thing on its line (on its own line, with nothing else before or after it). NEVER write a line that mixes plain text with $$...$$, and NEVER put more than one $$...$$ on the same line (e.g. NEVER write something like "X|0\\rangle = $$\\begin{pmatrix}...\\end{pmatrix}$$ = |1\\rangle" all on one line). If you want to show a full calculation with matrices inline in a sentence, use inline $...$ math instead of $$...$$, or put the entire calculation as a single standalone $$...$$ block on its own line with nothing else on that line.\n- Keep each step header on its own line in the format: ### Step N: Apply $<gate notation>$\n- IMPORTANT: make sure your response is complete and not cut off. Always finish with a brief concluding sentence about the final state.\n\nInitial state: $|\\psi_0\\rangle$ = ${stepsResult.initial.unicode}\n\n${stepsText}${nodeContextText}\n\n${lengthGuidance} Focus on intuition and physical meaning.`;
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
          }),
        },
      );
      if (!response.ok)
        throw new Error(`Mistral API error: ${response.status}`);
      const data = await response.json();
      const rawExplanation =
        data.choices?.[0]?.message?.content ?? "No explanation received.";
      setMistralExplanation(sanitizeMistralMath(rawExplanation));
    } catch (e) {
      setMistralExplanation(
        `⚠ Error: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
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

  // Steps grouped per canvas node (Grover operator, basis encoding, ...), shown collapsed.
  const nodes = useStore((state) => state.nodes);
  const stepTree = useMemo(
    () => (stepsResult ? buildStepTree(stepsResult.steps, nodes) : []),
    [stepsResult, nodes],
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const unicodeStr = useMemo(() => {
    if (fullResult) return fullResult.unicode;
    if ("statevector" in props && props.statevector)
      return statevectorToDirac(props.statevector, props.numQubits);
    return null;
  }, [fullResult, props]);

  const numQubits =
    fullResult?.numQubits ?? ("numQubits" in props ? props.numQubits : 0);

  // Global qubit indices holding the actual measurement result according to the QASM (e.g.
  // the sum of an adder node), plus the partial result computed directly from them. Shown
  // as a hint only; it does not change the actual qubit selection.
  const measurementResultIndices = useMemo(() => {
    if (!("qasm" in props) || !props.qasm) return null;
    return extractMeasurementResultIndices(props.qasm);
  }, [props]);

  const measurementResultHint = useMemo(() => {
    if (!measurementResultIndices || !fullResult) return null;
    if (measurementResultIndices.length === 0) return null;
    // only useful as a hint if it really is a PROPER subset of all qubits
    if (measurementResultIndices.length >= fullResult.numQubits) return null;

    // Check uniqueness: all terms must carry the same bitstring at these indices, otherwise
    // there is no deterministic single result to display.
    const bitsForTerm = (basisState: string) =>
      measurementResultIndices.map((i) => basisState[i]).join("");

    const distinctOutcomes = new Set(
      fullResult.terms.map((t) => bitsForTerm(t.basisState)),
    );
    if (distinctOutcomes.size !== 1) return null;

    const bits = [...distinctOutcomes][0];
    // measurementResultIndices is sorted ascending, i.e. bits[0] = LSB (least significant
    // qubit first, as usual in the adder circuit). For display and the decimal conversion it
    // is reversed into the intuitive MSB-first order, so that bitstring and decimal value are
    // consistent: |011⟩ = 3₁₀ instead of the misleading |110⟩ = 3₁₀.
    const bitsDisplay = bits.split("").reverse().join("");
    const decimal = parseInt(bitsDisplay, 2);
    return {
      indices: measurementResultIndices,
      bits: bitsDisplay,
      decimal,
    };
  }, [measurementResultIndices, fullResult]);

  const [selectedqubits, setSelectedQubits] = useState<number[]>([]);

  // When numQubits changes (new QASM is loaded), always select all qubits ("All"), even
  // if a measurement was detected. Previously only the measured qubits were preselected
  // in that case, which suppressed the green measurementResultHint box (shown only when
  // !isPartial, see below) even though that box is exactly what presents the result
  // compactly and with additional context such as the hint about the bit order.
  // Selecting everything keeps that box available.
  useEffect(() => {
    if (numQubits > 0) {
      setSelectedQubits(Array.from({ length: numQubits }, (_, i) => i));
    }
  }, [numQubits, measurementResultIndices]);

  const effectiveSelected = useMemo(() => {
    if (
      selectedqubits.length === 0 ||
      selectedqubits.some((q) => q >= numQubits)
    )
      return Array.from({ length: numQubits }, (_, i) => i);
    return selectedqubits;
  }, [selectedqubits, numQubits]);

  // ---------------------------------------------------------------------------
  // partial measurement: projection operator, probability, collapsed state
  // ---------------------------------------------------------------------------
  const partialMeasurement = useMemo(() => {
    if (!fullResult || effectiveSelected.length === 0) return null;
    // With a single qubit, always measure all qubits
    const measuredQubits =
      numQubits === 1
        ? [0]
        : effectiveSelected.length === numQubits
          ? []
          : effectiveSelected;
    if (measuredQubits.length === 0) return null;

    // for every possible measurement outcome (0 or 1 per measured qubit)
    const results = [];
    const numOutcomes = 1 << measuredQubits.length;

    for (let outcome = 0; outcome < numOutcomes; outcome++) {
      // which terms match this measurement outcome?
      const matchingTerms = fullResult.terms.filter((term) => {
        for (let k = 0; k < measuredQubits.length; k++) {
          const bit = parseInt(term.basisState[measuredQubits[k]] ?? "0");
          const expectedBit = (outcome >> (measuredQubits.length - 1 - k)) & 1;
          if (bit !== expectedBit) return false;
        }
        return true;
      });

      if (matchingTerms.length === 0) continue;

      // P(outcome) = sum of |amplitude|^2 over the matching terms
      const probability = matchingTerms.reduce(
        (sum, t) =>
          sum +
          t.amplitude.re * t.amplitude.re +
          t.amplitude.im * t.amplitude.im,
        0,
      );

      if (probability < 1e-10) continue;

      // collapsed state: renormalized terms
      const collapsedTerms = matchingTerms.map((t) => ({
        ...t,
        amplitude: {
          re: t.amplitude.re / Math.sqrt(probability),
          im: t.amplitude.im / Math.sqrt(probability),
        },
      }));

      // Unicode representation of the collapsed state
      const formatAmplitude = (re: number, im: number): string => {
        const absVal = Math.sqrt(re * re + im * im);
        if (Math.abs(absVal - 1) < 0.001) return "";
        if (Math.abs(im) < 0.001) {
          const frac =
            Math.abs(re - 1 / Math.sqrt(2)) < 0.001
              ? "1/√2"
              : Math.abs(re - 1 / Math.sqrt(3)) < 0.001
                ? "1/√3"
                : Math.abs(re - 0.5) < 0.001
                  ? "1/2"
                  : re.toFixed(3);
          return frac + " ";
        }
        return `(${re.toFixed(2)}+${im.toFixed(2)}i) `;
      };

      const collapsedUnicode = collapsedTerms
        .map((t, i) => {
          const amp = formatAmplitude(t.amplitude.re, t.amplitude.im);
          const sign = i > 0 ? " + " : "";
          return `${sign}${amp}|${t.basisState}⟩`;
        })
        .join("");

      // Outcome-Label z.B. "q0=1"
      const outcomeLabel = measuredQubits
        .map(
          (q, k) => `q${q}=${(outcome >> (measuredQubits.length - 1 - k)) & 1}`,
        )
        .join(", ");

      const outcomeBits = outcome
        .toString(2)
        .padStart(measuredQubits.length, "0");

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
    const probs = Array.from({ length: reducedSize }, () => 0);
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

  // Exact separability check (no longer a heuristic): fully separable when EVERY qubit has a
  // pure reduced state (Bloch vector length 1 for each bipartition). This covers e.g. the case
  // where two independent H gates without a CNOT produce 4 terms while the state is still a
  // pure tensor product, i.e. separable.
  const isEntangled = useMemo(() => {
    if (numQubits < 2 || terms.length === 0) return false;
    const statevectorArr = Array.from({ length: 1 << numQubits }, (_, i) => {
      const term = terms.find((t: any) => parseInt(t.basisState, 2) === i);
      return term ? term.amplitude : { re: 0, im: 0 };
    });
    return !isStateFullySeparable(statevectorArr, numQubits);
  }, [terms, numQubits]);

  const markdownClassName =
    "text-xs text-gray-700 leading-relaxed font-sans [&_p]:my-1.5 [&_li]:my-0.5 [&_strong]:text-gray-800 [&_ul]:pl-4 [&_ul]:list-disc [&_.katex]:text-sm [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto";

  const renderMarkdown = (markdown: string) => (
    <div className={markdownClassName}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );

  const psiLabel = (n: number) =>
    `|ψ${String(n)
      .split("")
      .map((d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])
      .join("")}⟩`;

  // State after step idx, i.e. |ψ_{idx+1}⟩.
  const renderStateRow = (idx: number) => (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-gray-400 text-xs min-w-[36px]">
        {psiLabel(idx + 1)}
      </span>
      <span className="text-gray-500 text-xs">=</span>
      <span className="text-gray-800 whitespace-nowrap">
        {stepsResult?.steps[idx]?.unicode}
      </span>
    </div>
  );

  const renderStep = (idx: number) => {
    if (!stepsResult) return null;
    const step = stepsResult.steps[idx];
    return (
      <div key={`step-${idx}`} className="flex flex-col">
        <div className="flex items-center gap-1.5 py-0.5 pl-10">
          <span className="text-blue-400 text-xs">──</span>
          <span
            className={`text-blue-600 text-xs font-sans font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap ${
              step.nodeId && onStepClick
                ? "cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
                : ""
            }`}
            onClick={
              step.nodeId && onStepClick
                ? () => {
                    // Collect all node IDs from step 0 up to and including the
                    // clicked step (deduplicated, without undefined), so that every
                    // node used up to that point is highlighted together.
                    const nodeIdsUpToHere = Array.from(
                      new Set(
                        stepsResult.steps
                          .slice(0, idx + 1)
                          .map((s) => s.nodeId)
                          .filter((n): n is string => !!n),
                      ),
                    );
                    onStepClick(nodeIdsUpToHere);
                  }
                : undefined
            }
            title={
              step.nodeId && onStepClick
                ? "Click to highlight all nodes used up to this point on the canvas"
                : undefined
            }
          >
            {step.gateLabel}
          </span>
          <span className="text-blue-400 text-xs">──→</span>
        </div>
        {renderStateRow(idx)}
      </div>
    );
  };

  // A group (e.g. Grover operator, its oracle, or a basis encoding) is collapsed to a
  // single arrow with the resulting state and can be opened to show its parts.
  const renderGroup = (group: StepGroup) => {
    const key = `${group.first}-${group.last}-${group.label}`;
    const open = openGroups.has(key);
    const gateCount = group.last - group.first + 1;
    return (
      <div key={key} className="flex flex-col">
        <div className="flex items-center gap-1.5 py-0.5 pl-10">
          <span className="text-indigo-400 text-xs">──</span>
          <button
            onClick={() => toggleGroup(key)}
            className="flex items-center gap-1 text-indigo-700 text-xs font-sans font-semibold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 px-1.5 py-0.5 rounded whitespace-nowrap transition-colors"
            title={open ? "Collapse" : "Open to see the components"}
          >
            <span>{open ? "▾" : "▸"}</span>
            {group.label}
            <span className="font-normal text-indigo-400">
              ({gateCount} gate{gateCount === 1 ? "" : "s"})
            </span>
          </button>
          {!open && <span className="text-indigo-400 text-xs">──→</span>}
        </div>
        {open ? (
          <div className="ml-10 pl-2 border-l-2 border-indigo-100">
            {group.description && (
              <div className="my-1 rounded bg-indigo-50/60 px-2 py-1">
                {renderMarkdown(group.description)}
              </div>
            )}
            {group.children.map((child) =>
              child.type === "group"
                ? renderGroup(child)
                : renderStep(child.index),
            )}
          </div>
        ) : (
          renderStateRow(group.last)
        )}
      </div>
    );
  };

  const basics = basicsTopics(numQubits);
  const blochTopic = basics.find((t) => t.title.includes("Bloch"));

  return (
    <div className="rounded-xl border bg-white flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {fullResult && (
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {numQubits} {numQubits === 1 ? "Qubit" : "Qubits"} ·{" "}
              {terms.length} {terms.length === 1 ? "Term" : "Terms"}
            </span>
          )}
          {fullResult && numQubits > 0 && (
            <button
              onClick={() => setShowProperties((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                showProperties
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showProperties ? "▾" : "▸"}</span>
              Properties
            </button>
          )}
          {fullResult && numQubits > 0 && (
            <button
              onClick={() => setShowBasics((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                showBasics
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
              title="What is a qubit, why the state has 2^n entries, how to read a matrix and the Bloch sphere, unitarity"
            >
              <span>{showBasics ? "▾" : "▸"}</span>
              Basics
            </button>
          )}
          {"qasm" in props &&
            props.qasm &&
            stepsResult &&
            stepsResult.steps.length > 0 && (
              <button
                onClick={() => setShowSteps((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                  showSteps
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "border-gray-300 hover:bg-gray-100 text-gray-600"
                }`}
              >
                <span>{showSteps ? "▾" : "▸"}</span>
                Steps
              </button>
            )}
          {"qasm" in props && props.qasm && (
            <button
              onClick={() => setShowEditor((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                showEditor
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
              title="Change the initial state, add, remove or switch steps and apply them to OpenQASM and the canvas"
            >
              <span>{showEditor ? "▾" : "▸"}</span>
              Edit
            </button>
          )}
          {terms.length > 0 && (
            <button
              onClick={() => setShowBasisStates((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                showBasisStates
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showBasisStates ? "▾" : "▸"}</span>
              Histogram
            </button>
          )}
          {fullResult && numQubits > 0 && (
            <button
              onClick={() => setShowBloch((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 whitespace-nowrap ${
                showBloch
                  ? "bg-blue-50 border-blue-300 text-blue-600"
                  : "border-gray-300 hover:bg-gray-100 text-gray-600"
              }`}
            >
              <span>{showBloch ? "▾" : "▸"}</span>
              Bloch
            </button>
          )}
          {fullResult && terms.length > 0 && (
            <ExportMenu
              title={props.title}
              latex={fullResult.latex}
              numQubits={numQubits}
              terms={terms}
              unicode={fullResult.unicode}
              onGetCircuitSvg={props.onGetCircuitSvg}
              stepsResult={stepsResult ?? undefined}
              onGetModel={props.onGetModel}
              aiExplanation={mistralExplanation ?? undefined}
              qasm={"qasm" in props ? props.qasm : undefined}
              stepTree={stepTree}
            />
          )}
        </div>
      </div>

      {/* Warnungen */}
      {fullResult?.warnings && fullResult.warnings.length > 0 && (
        <div className="flex-shrink-0 space-y-1">
          {fullResult.warnings.map((w, i) => (
            <div
              key={i}
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5"
            >
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* Formula: if a measurement was detected (measurementResultHint) and as long as the
          user has not made a manual qubit selection (!isPartial), only the result of the
          measured qubits is shown - not the full register. Without a measurement, the full
          register state is shown as before. */}
      <div className="flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 overflow-x-auto">
        <span className="font-mono text-sm text-gray-800 whitespace-nowrap">
          |ψ⟩ ={" "}
          {!isPartial && measurementResultHint
            ? `|${measurementResultHint.bits}⟩`
            : unicodeStr}
        </span>
      </div>

      {/* Note: in the final display a purely global phase (e.g. a sign on single-term
          states such as -|1⟩) is removed, because it makes no physically measurable
          difference. In the Mathematical Intermediate Steps further below the sign
          remains visible, so that the algebraic effect of each individual gate stays
          traceable. */}
      {!isPartial && fullResult?.globalPhaseNote && (
        <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2 flex items-start gap-2">
          <span className="text-blue-500 text-xs mt-0.5">ℹ</span>
          <span className="text-xs text-blue-800">
            The sign shown above reflects a global phase. This has no physical
            effect and cannot be detected by measurement - a state and its
            negative (or any overall phase factor) are indistinguishable.
          </span>
        </div>
      )}

      {/* Note: which qubits carry the actual result according to the measurement node,
          plus (since the main line is now reduced) the full register state for reference,
          only visible while "All" is selected (otherwise the user has already made the
          selection and the note would be redundant). */}
      {!isPartial && measurementResultHint && (
        <div className="flex-shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-600">💡</span>
            <span className="text-xs text-emerald-800">
              Result is encoded in qubit
              {measurementResultHint.indices.length > 1 ? "s" : ""}{" "}
              <span className="font-mono font-semibold">
                q{measurementResultHint.indices.join(", q")}
              </span>
              :{" "}
              <span className="font-mono font-semibold">
                |{measurementResultHint.bits}⟩ = {measurementResultHint.decimal}
                ₁₀
              </span>
              {unicodeStr && (
                <>
                  {" "}
                  · Full register:{" "}
                  <span className="font-mono">{unicodeStr}</span>
                </>
              )}
            </span>
          </div>
          {/* Note on bit significance: the display always follows q0,q1,q2,... from
              left to right. Whether q[lowest index] is the least or the most significant
              bit depends on the individual circuit (a ripple-carry adder, for example,
              typically uses index 0 as the LSB). The decimal value shown above assumes
              exactly the bit order in which the qubits are listed here
              (q{measurementResultHint.indices[0]} first) - this does not necessarily
              match the MSB-first convention. */}
          {measurementResultHint.indices.length > 1 && (
            <div className="text-xs text-emerald-700/80 mt-1.5 pt-1.5 border-t border-emerald-200/70">
              ⓘ Bit order shown: q{measurementResultHint.indices[0]} first (as
              listed above). Depending on how this circuit encodes values (e.g.
              an adder typically treats the lowest qubit index as the
              least-significant bit), the decimal value may need to be read with
              the bits in reverse order. Check your circuit's specific wiring if
              the decimal value looks unexpected.
            </div>
          )}
        </div>
      )}

      {/* Properties Tab */}
      {showProperties &&
        fullResult &&
        numQubits > 0 &&
        (() => {
          const statevectorArr = Array.from(
            { length: 1 << numQubits },
            (_, i) => {
              const term = fullResult.terms.find(
                (t) => parseInt(t.basisState, 2) === i,
              );
              return term ? term.amplitude : { re: 0, im: 0 };
            },
          );

          // Persistence: for a single qubit the exact von Neumann entropy. For several qubits:
          // 0 when fully separable, otherwise pattern matching (GHZ/Bell/W state), returning
          // null ("not computable") when no known pattern applies.
          const persistence: number | null =
            numQubits === 1
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
                    <td className="py-1.5 pr-2 font-medium text-gray-600">
                      Property
                    </td>
                    <td className="py-1.5"></td>
                  </tr>
                  <tr className="border-b border-teal-100">
                    <td className="py-1.5 pr-2 text-gray-700">
                      State dimension
                      <span
                        className="text-gray-400 cursor-help"
                        title="Each qubit doubles the number of basis states, so n qubits give a vector of 2^n amplitudes (see Basics)."
                      >
                        {" "}
                        ⓘ
                      </span>
                    </td>
                    <td className="py-1.5 font-mono text-gray-700">
                      2<sup>{numQubits}</sup> = {2 ** numQubits}
                    </td>
                  </tr>
                  <tr className="border-b border-teal-100">
                    <td className="py-1.5 pr-2 text-gray-700">
                      Normalized
                      <span
                        className="text-gray-400 cursor-help"
                        title="The squared amplitudes sum to 1. Every gate is unitary and keeps this sum at 1 (see Basics)."
                      >
                        {" "}
                        ⓘ
                      </span>
                    </td>
                    <td className="py-1.5 font-mono text-gray-700">
                      Σ|c<sub>x</sub>|² ={" "}
                      {fullResult.terms
                        .reduce(
                          (sum, t) =>
                            sum + t.amplitude.re ** 2 + t.amplitude.im ** 2,
                          0,
                        )
                        .toFixed(3)}
                    </td>
                  </tr>
                  <tr className="border-b border-teal-100">
                    <td className="py-1.5 pr-2 text-gray-700">
                      Bloch Sphere Representation
                    </td>
                    <td className="py-1.5 text-gray-700">
                      {numQubits === 1 ? (
                        <span className="font-semibold">✓</span>
                      ) : (
                        <span className="font-semibold text-gray-400">
                          ✗{" "}
                          <span className="font-normal text-gray-400 text-xs">
                            (only for single qubits)
                          </span>
                        </span>
                      )}
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
                        >
                          {" "}
                          ⓘ
                        </span>
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

      {/* Circuit editor: initial state, steps and matrices, applied back to QASM + canvas */}
      {showEditor && "qasm" in props && props.qasm && (
        <MathCircuitEditor
          qasm={props.qasm}
          onApply={onApplyQasm}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Basics: the concepts needed to read the output above and below */}
      {showBasics && fullResult && numQubits > 0 && (
        <div className="flex-shrink-0 rounded-lg border border-sky-100 bg-sky-50/30 px-3 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Basics
          </p>
          <div className="flex flex-col gap-1">
            {basics.map((topic) => (
              <details
                key={topic.title}
                className="rounded border border-sky-100 bg-white px-2 py-1"
              >
                <summary className="cursor-pointer text-xs font-semibold text-sky-800">
                  {topic.title}
                </summary>
                {renderMarkdown(topic.markdown)}
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Intermediate steps */}
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
          {/* Notation note */}
          <div className="flex items-start gap-1.5 mb-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-100">
            <span className="text-blue-400 text-xs mt-0.5">ℹ</span>
            <p className="text-xs text-blue-600 leading-relaxed">
              <strong>Notation:</strong> U<sub>0</sub> means that U is applied
              to qubit 0, I<sub>1</sub> means identity (no operation) on qubit
              1. The subscript indicates which qubit the gate acts on.
            </p>
          </div>

          {/* Grover metadata, only rendered when a Grover node was detected */}
          {stepsResult.groverIterations > 0 && (
            <GroverInfoBox
              numQubits={stepsResult.groverQubits.length}
              iterations={stepsResult.groverIterations}
              markedStates={stepsResult.groverMarkedStates}
            />
          )}

          <div className="flex flex-col gap-0 font-mono text-sm">
            <div className="flex items-baseline gap-2 py-1">
              <span className="text-gray-400 text-xs min-w-[36px]">|ψ₀⟩</span>
              <span className="text-gray-500 text-xs">=</span>
              <span className="text-gray-800 whitespace-nowrap">
                {stepsResult.initial.unicode}
              </span>
            </div>
            {stepTree.map((item) =>
              item.type === "group"
                ? renderGroup(item)
                : renderStep(item.index),
            )}
          </div>

          {/* Mistral AI explanation */}
          {mistralExplanation && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-purple-500 text-xs">✦</span>
                <p className="text-xs font-medium text-purple-700">
                  AI Explanation
                </p>
              </div>
              <div
                className="text-xs text-gray-700 leading-relaxed font-sans
                [&_h3]:text-purple-700 [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1
                [&_h4]:text-purple-600 [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1
                [&_p]:my-1.5 [&_li]:my-0.5 [&_strong]:text-gray-800 [&_ul]:pl-4 [&_ol]:pl-4
                [&_.katex]:text-sm [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto"
              >
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

      {/* Histogram + qubit selector + partial measurement */}
      {terms.length > 0 && showBasisStates && (
        <div className="flex-shrink-0 flex flex-col gap-2">
          {numQubits > 1 && (
            <div className="flex flex-col gap-1">
              <QubitSelector
                numQubits={numQubits}
                selected={effectiveSelected}
                onChange={setSelectedQubits}
              />
            </div>
          )}
          {/* Histogram: only when all qubits are selected */}
          {!isPartial && (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Measurement Probabilities
              </p>
              <Histogram data={histogramData} />
            </>
          )}

          {/* Partial measurement: projection + collapsed state */}
          {isPartial && partialMeasurement && partialMeasurement.length > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 px-3 py-3 mt-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                {numQubits === 1
                  ? "Measurement"
                  : `Partial Measurement · q${effectiveSelected.join(", q")}`}
              </p>

              {/* Projektionsoperator */}
              <div className="mb-3 font-mono text-xs text-gray-600 overflow-x-auto">
                <span className="text-gray-400">P</span>
                <span className="text-gray-400 text-[10px] align-sub">
                  {numQubits === 1
                    ? "q0"
                    : effectiveSelected.map((q) => `q${q}`).join(",")}
                </span>
                <span className="text-gray-600"> = </span>
                {partialMeasurement.map((r, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-gray-400"> + </span>}
                    <span className="text-indigo-600">
                      |{r.outcomeBits}⟩⟨{r.outcomeBits}|
                    </span>
                    <span className="text-gray-400"> ⊗ </span>
                    <span className="text-gray-600">I</span>
                  </span>
                ))}
              </div>

              {/* Ergebnisse */}
              <div className="flex flex-col gap-3">
                {partialMeasurement.map((r) => (
                  <div
                    key={r.outcome}
                    className="rounded-md border border-indigo-100 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-indigo-700">
                        {r.outcomeLabel}
                      </span>
                      <span className="text-xs font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-600">
                        P = {r.probabilityPercent}%
                      </span>
                    </div>
                    <div className="font-mono text-xs text-gray-500 mb-1.5">
                      <span>P({r.outcomeLabel}) = ‖P</span>
                      <span className="text-[10px] align-sub">
                        {r.outcomeBits}
                      </span>
                      <span>
                        |ψ⟩‖² = {(r.probabilityPercent / 100).toFixed(3)}
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-gray-400">|ψ'⟩ = </span>
                      <span className="text-gray-800">
                        {r.collapsedUnicode}
                      </span>
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
          {blochTopic && (
            <details className="mb-3 rounded border border-purple-100 bg-white px-2 py-1">
              <summary className="cursor-pointer text-xs font-semibold text-purple-700">
                {blochTopic.title}
              </summary>
              {renderMarkdown(blochTopic.markdown)}
            </details>
          )}
          <BlochSphereMulti
            statevector={Array.from({ length: 1 << numQubits }, (_, i) => {
              const term = fullResult.terms.find(
                (t) => parseInt(t.basisState, 2) === i,
              );
              return term ? term.amplitude : { re: 0, im: 0 };
            })}
            numQubits={numQubits}
          />
        </div>
      )}
    </div>
  );
}
