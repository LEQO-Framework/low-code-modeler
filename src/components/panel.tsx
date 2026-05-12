/**
 * panel.tsx
 * Platzierung: src/components/panel.tsx
 */

import { useState, useEffect, useCallback } from "react";
import { Node, Edge, useReactFlow } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { TextPanel, MetadataPanel } from "./panels";
import { QasmDiracPanel } from "./QasmDiracPanel";
import { analyzeComponents, type DiracComponent } from "@/lib/componentAnalyzer";
import JSZip from "jszip";

const selector = (state: { selectedNode: Node | null; nodes: Node[]; edges: Edge[] }) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
});

interface CustomPanelProps {
  metadata: any;
  onUpdateMetadata: any;
  mathMode?: boolean;
  qasmCode?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onWidthChange?: (width: number) => void;
  backendUrl?: string;
  compilationTarget?: string;
  onSendToBackend?: () => void;
  onGetModel?: () => object;
}

export const CustomPanel = ({
  metadata,
  onUpdateMetadata,
  mathMode = false,
  qasmCode = "",
  onGetCircuitSvg,
  onWidthChange,
  backendUrl = "",
  compilationTarget = "qasm",
  onSendToBackend,
  onGetModel,
}: CustomPanelProps) => {
  const { selectedNode, nodes, edges } = useStore(selector, shallow);
  const { setNodes } = useReactFlow();
  const [activeTab, setActiveTab] = useState<"properties" | "math">("properties");
  const [components, setComponents] = useState<DiracComponent[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [waitingForQasm, setWaitingForQasm] = useState(false);

  // Wenn Math Mode ausgeschaltet → zurück zu Properties
  useEffect(() => {
    if (!mathMode) setActiveTab("properties");
    onWidthChange?.(mathMode ? 480 : 350);
  }, [mathMode]);

  // Wenn neues QASM ankommt → Analyse zurücksetzen
  useEffect(() => {
    setComponents([]);
    setHasAnalyzedOnce(false);
    // Wenn wir auf QASM gewartet haben → jetzt analysieren
    if (waitingForQasm && qasmCode.trim().length > 0) {
      setWaitingForQasm(false);
      setHasAnalyzedOnce(true);
      setAnalyzing(true);
      analyzeComponents(nodes, edges, backendUrl, metadata, compilationTarget)
        .then(setComponents)
        .finally(() => setAnalyzing(false));
    }
  }, [qasmCode]);

  // Analyse-Funktion – aufrufbar per Refresh-Button
  const runAnalysis = useCallback(() => {
    if (!backendUrl) return;
    setAnalyzing(true);
    setComponents([]);
    analyzeComponents(nodes, edges, backendUrl, metadata, compilationTarget)
      .then(setComponents)
      .finally(() => setAnalyzing(false));
  }, [nodes, edges, backendUrl, metadata, compilationTarget]);

  // Beim Wechsel zum Math Mode Tab → automatisch Backend-Call auslösen
  const handleTabSwitch = useCallback((tab: "properties" | "math") => {
    setActiveTab(tab);
    if (tab === "math" && mathMode && !hasAnalyzedOnce) {
      if (qasmCode.trim().length > 0) {
        // QASM vorhanden → direkt analysieren
        setHasAnalyzedOnce(true);
        setAnalyzing(true);
        setComponents([]);
        analyzeComponents(nodes, edges, backendUrl, metadata, compilationTarget)
          .then(setComponents)
          .finally(() => setAnalyzing(false));
      } else if (onSendToBackend) {
        // Kein QASM → Backend-Call auslösen und warten
        setWaitingForQasm(true);
        setAnalyzing(true);
        onSendToBackend();
      }
    }
  }, [mathMode, hasAnalyzedOnce, qasmCode, nodes, edges, backendUrl, metadata, compilationTarget, onSendToBackend]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onUpdateMetadata(e);
  }

  return (
    <div className="currentPanel-container bg-gray-100 h-full border-gray-200 border text-black flex flex-col">

      {/* Tab-Leiste */}
      {mathMode && (
        <div className="flex border-b border-gray-300 bg-white flex-shrink-0">
          <button
            onClick={() => setActiveTab("properties")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "properties"
                ? "border-b-2 border-blue-500 text-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => handleTabSwitch("math")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "math"
                ? "border-b-2 border-blue-500 text-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Math Mode ⟩
          </button>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <TextPanel />
          ) : (
            <MetadataPanel metadata={metadata} onUpdateMetadata={handleChange} />
          )}
        </div>
      )}

      {/* Math Mode Tab */}
      {activeTab === "math" && mathMode && (
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* Toolbar: Refresh + Export all */}
          <div className="flex-shrink-0 flex justify-between items-center px-2 pt-2 gap-2">
            <button
              onClick={runAnalysis}
              disabled={analyzing || !qasmCode.trim()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
              title="Recalculate Dirac notation"
            >
              <span className={analyzing ? "animate-spin" : ""}>↺</span>
              {analyzing ? "Analyzing..." : "Refresh"}
            </button>

            {components.length > 0 && onGetCircuitSvg && (
              <ExportAllButton
                components={components}
                onGetCircuitSvg={onGetCircuitSvg}
                setNodes={setNodes}
                onGetModel={onGetModel}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-lg animate-spin">⟳</span>
                <p className="text-sm">Analyzing circuits...</p>
              </div>
            ) : components.length > 0 ? (
              <ComponentsView
                components={components}
                onGetCircuitSvg={onGetCircuitSvg}
                nodes={nodes}
                onGetModel={onGetModel}
              />
            ) : qasmCode.trim().length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">Press "Refresh" to calculate the Dirac notation.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">No QASM output available yet.</p>
                <p className="text-xs text-center text-gray-300">
                  Send the model to the backend to view the Dirac notation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Komponenten-Ansicht
// ---------------------------------------------------------------------------

function ComponentsView({
  components,
  onGetCircuitSvg,
  nodes,
  onGetModel,
}: {
  components: DiracComponent[];
  onGetCircuitSvg?: () => Promise<string>;
  nodes: Node[];
  onGetModel?: () => object;
}) {
  return (
    <div className="flex flex-col gap-3">
      {components.length > 1 && (
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          ℹ {components.length} separate circuits found.
        </div>
      )}
      {components.map((component, idx) => {
        const label = component.groupLabel
          ? component.groupLabel
          : components.length === 1
          ? "Dirac Notation"
          : `Circuit ${idx + 1}`;
        return (
          <ComponentSection
            key={idx}
            label={label}
            color={component.groupColor || "#6366f1"}
            nodeCount={component.nodes.length}
            qasm={component.qasm}
            error={component.error}
            onGetCircuitSvg={onGetCircuitSvg}
            groupId={component.groupId}
            nodes={nodes}
            onGetModel={onGetModel}
          />
        );
      })}
    </div>
  );
}

function ComponentSection({
  label,
  color,
  nodeCount,
  qasm,
  error,
  onGetCircuitSvg,
  groupId,
  nodes,
  onGetModel,
}: {
  label: string;
  color: string;
  nodeCount: number;
  qasm: string | null;
  error: string | null;
  onGetCircuitSvg?: () => Promise<string>;
  groupId: string | null;
  nodes: Node[];
  onGetModel?: () => object;
}) {
  const [expanded, setExpanded] = useState(true);
  const { setNodes, getNodes } = useReactFlow();

  // Gibt nur das SVG der Nodes dieser Gruppe zurück
  const getGroupCircuitSvg = onGetCircuitSvg && groupId
    ? async (): Promise<string> => {
        // Alle Nodes außer dieser Gruppe temporär ausblenden
        setNodes((nds: Node[]) =>
          nds.map((n) => {
            if (n.id === groupId || n.parentNode === groupId) return n;
            return { ...n, hidden: true };
          })
        );
        // Kurz warten damit React den neuen State rendert
        await new Promise((r) => setTimeout(r, 150));
        try {
          return await onGetCircuitSvg();
        } finally {
          // Alle Nodes wieder einblenden
          setNodes((nds: Node[]) =>
            nds.map((n) => ({ ...n, hidden: false }))
          );
        }
      }
    : onGetCircuitSvg;

  return (
    <div style={{ border: `1.5px solid ${color}55`, borderRadius: "8px", overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: `${color}18`,
          borderBottom: expanded ? `1px solid ${color}33` : "none",
          cursor: "pointer",
          border: "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color, fontSize: "12px" }}>▣</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color }}>{label}</span>
          <span style={{ fontSize: "11px", color: `${color}99` }}>
            ({nodeCount} Node{nodeCount !== 1 ? "s" : ""})
          </span>
        </div>
        <span style={{ color, fontSize: "11px" }}>{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "8px" }}>
          {error ? (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              ⚠ {error}
            </div>
          ) : qasm ? (
            <QasmDiracPanel
              qasm={qasm}
              title={label}
              onGetCircuitSvg={getGroupCircuitSvg}
              onGetModel={onGetModel}
            />
          ) : (
            <div className="text-xs text-gray-400 px-2 py-1">No QASM available.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export all groups at once
// ---------------------------------------------------------------------------

function ExportAllButton({
  components,
  onGetCircuitSvg,
  setNodes,
  onGetModel,
}: {
  components: DiracComponent[];
  onGetCircuitSvg: () => Promise<string>;
  setNodes: (fn: (nds: Node[]) => Node[]) => void;
  onGetModel?: () => object;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    setExporting(true);
    const zip = new JSZip();

    try {
      // model.json einmal für die gesamte ZIP
      if (onGetModel) {
        const modelJson = onGetModel();
        zip.file("model.json", JSON.stringify(modelJson, null, 2));
      }

      for (const component of components) {
        const label = component.groupLabel || `Circuit_${component.index + 1}`;
        const safeName = label.replace(/[^a-zA-Z0-9_äöüÄÖÜ]/g, "_");

        // PNG für diese Gruppe erstellen
        let pngBase64: string | undefined;
        if (component.groupId) {
          setNodes((nds: Node[]) =>
            nds.map((n) => {
              if (n.id === component.groupId || n.parentNode === component.groupId) return n;
              return { ...n, hidden: true };
            })
          );
          await new Promise((r) => setTimeout(r, 150));
          try {
            const svg = await onGetCircuitSvg();
            pngBase64 = await svgToPngBase64(svg);
          } catch {
            // PNG-Export fehlgeschlagen – ohne Bild weiterfahren
          } finally {
            setNodes((nds: Node[]) => nds.map((n) => ({ ...n, hidden: false })));
            await new Promise((r) => setTimeout(r, 50));
          }
        } else {
          try {
            const svg = await onGetCircuitSvg();
            pngBase64 = await svgToPngBase64(svg);
          } catch { /* ignore */ }
        }

        // LaTeX generieren
        if (component.qasm) {
          const { qasmToDirac, qasmToDiracSteps } = await import("./utils/qasmToDirac");
          const result = qasmToDirac(component.qasm);
          const stepsResult = qasmToDiracSteps(component.qasm);

          const texContent = buildLatexForComponent(
            label,
            result.latex,
            result.numQubits,
            result.terms,
            stepsResult,
            pngBase64
          );

          zip.file(`${safeName}/main.tex`, texContent);
          if (pngBase64) {
            zip.file(`${safeName}/circuit.png`, pngBase64, { base64: true });
          }
        }
      }

      // ZIP herunterladen
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dirac_export_alle_gruppen.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportAll}
      disabled={exporting}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-blue-300 hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-40"
      title="Export all groups as ZIP"
    >
      <span>{exporting ? "⟳" : "↓"}</span>
      {exporting ? "Exporting..." : "Export all"}
    </button>
  );
}

// Hilfsfunktion: LaTeX für eine Komponente bauen
function buildLatexForComponent(
  label: string,
  latex: string,
  numQubits: number,
  terms: any[],
  stepsResult: any,
  pngBase64?: string
): string {
  const termLines = terms
    .map((t: any) => {
      const p = Math.round((t.amplitude.re ** 2 + t.amplitude.im ** 2) * 10000) / 100;
      return `    \\hline\n    $|${t.basisState}\\rangle$ & $${p}\\%$ \\\\`;
    })
    .join("\n");

  const circuitSection = pngBase64
    ? `\\section*{Quantum Circuit}\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.9\\textwidth]{circuit}\n  \\caption{${label}}\n\\end{figure}\n\n`
    : "";

  const stepsSection = stepsResult?.steps?.length > 0
    ? `\\section*{Mathematical Intermediate Steps}\n\\begin{align}\n  |\\psi_0\\rangle &= ${stepsResult.initial.latex} \\\\[6pt]\n${stepsResult.steps.map((s: any, i: number) => `  &\\xrightarrow{${s.gateLabelLatex}} \\\\[2pt]\n  |\\psi_{${i + 1}}\\rangle &= ${s.latex}`).join(' \\\\[6pt]\n')}\n\\end{align}\n\n`
    : "";

  // pgfplots Histogram
  const histogramSection = terms.length > 0
    ? (() => {
        const coords = terms.map((t: any) => {
          const p = Math.round((t.amplitude.re ** 2 + t.amplitude.im ** 2) * 10000) / 100;
          return { label: `|${t.basisState}\\rangle`, value: p };
        });
        const coordStr = coords.map((c: any, i: number) => `(${i}, ${c.value})`).join(' ');
        const tickLabels = coords.map((c: any) => `$${c.label}$`).join(', ');
        const xMax = coords.length - 0.5;
        return `\\section*{Measurement Probabilities}\n\\begin{figure}[h]\n  \\centering\n  \\begin{tikzpicture}\n    \\begin{axis}[\n      ybar, bar width=0.5cm, width=0.85\\textwidth, height=6cm,\n      ymin=0, ymax=100, xmin=-0.5, xmax=${xMax},\n      xtick={${coords.map((_: any, i: number) => i).join(', ')}},\n      xticklabels={${tickLabels}},\n      ylabel={Probability (\\%)}, ymajorgrids=true, grid style=dashed,\n      nodes near coords, nodes near coords align={vertical},\n    ]\n      \\addplot[fill=blue!60, draw=blue!80] coordinates {${coordStr}};\n    \\end{axis}\n  \\end{tikzpicture}\n  \\caption{Measurement Probabilities of Basis States}\n\\end{figure}\n\n`;
      })()
    : "";

  const tableSection = terms.length > 0
    ? `\\section*{Measurement Probabilities (Table)}\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{|c|c|}\n    \\hline\n    \\textbf{Basis State} & \\textbf{Probability} \\\\\n${termLines}\n    \\hline\n  \\end{tabular}\n\\end{table}\n\n`
    : "";

  // Gate-Erklärungen
  const GATE_INFO: Record<string, { desc: string; matrix: string; effect: string }> = {
    H: { desc: "The Hadamard gate creates an equal superposition.", matrix: "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}", effect: "$H|0\\rangle=|+\\rangle,\\;H|1\\rangle=|-\\rangle$" },
    X: { desc: "The Pauli-X gate is the quantum NOT gate.", matrix: "\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}", effect: "$X|0\\rangle=|1\\rangle,\\;X|1\\rangle=|0\\rangle$" },
    Y: { desc: "The Pauli-Y gate rotates around the Y-axis.", matrix: "\\begin{pmatrix}0&-i\\\\i&0\\end{pmatrix}", effect: "$Y|0\\rangle=i|1\\rangle,\\;Y|1\\rangle=-i|0\\rangle$" },
    Z: { desc: "The Pauli-Z gate applies a phase flip.", matrix: "\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}", effect: "$Z|0\\rangle=|0\\rangle,\\;Z|1\\rangle=-|1\\rangle$" },
    S: { desc: "The S gate applies a $\\pi/2$ phase rotation.", matrix: "\\begin{pmatrix}1&0\\\\0&i\\end{pmatrix}", effect: "$S|1\\rangle=i|1\\rangle$" },
    T: { desc: "The T gate applies a $\\pi/4$ phase rotation.", matrix: "\\begin{pmatrix}1&0\\\\0&e^{i\\pi/4}\\end{pmatrix}", effect: "$T|1\\rangle=e^{i\\pi/4}|1\\rangle$" },
    CNOT: { desc: "The CNOT gate flips the target qubit if control is $|1\\rangle$.", matrix: "\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}", effect: "$\\text{CNOT}|10\\rangle=|11\\rangle,\\;\\text{CNOT}|11\\rangle=|10\\rangle$" },
    SWAP: { desc: "The SWAP gate exchanges the states of two qubits.", matrix: "\\begin{pmatrix}1&0&0&0\\\\0&0&1&0\\\\0&1&0&0\\\\0&0&0&1\\end{pmatrix}", effect: "$\\text{SWAP}|01\\rangle=|10\\rangle$" },
  };

  const usedGates = new Set<string>();
  if (stepsResult?.steps) {
    for (const s of stepsResult.steps) {
      for (const key of Object.keys(GATE_INFO)) {
        if ((s.gateLabel ?? s.gateLabelLatex ?? "").includes(key)) usedGates.add(key);
      }
    }
  }

  const gateSection = usedGates.size > 0
    ? `\\section*{Gate Reference}\n\n` + [...usedGates].map(g => {
        const info = GATE_INFO[g];
        return `\\subsection*{${g} Gate}\n${info.desc}\n\\begin{equation}\n  ${g} = ${info.matrix}\n\\end{equation}\n\\textbf{Effect:} ${info.effect}\n`;
      }).join("\n")
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

\\title{Dirac Notation -- ${label}}
\\date{\\today}

\\begin{document}
\\maketitle

${circuitSection}\\section*{Quantum State in Dirac Notation}

The quantum system state with ${numQubits} qubit${numQubits !== 1 ? "s" : ""} is:

\\begin{equation}
  |\\psi\\rangle = ${latex}
\\end{equation}

${stepsSection}${histogramSection}${tableSection}${gateSection}\\end{document}
`;
}

// SVG → PNG Base64
async function svgToPngBase64(svgInput: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = svgInput.startsWith("data:")
      ? svgInput
      : URL.createObjectURL(new Blob([svgInput], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = (img.naturalWidth  || 1200) * scale;
      canvas.height = (img.naturalHeight || 800)  * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png").split(",")[1]);
    };
    img.onerror = (e) => { if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl); reject(e); };
    img.src = objectUrl;
  });
}

const getPanel = (type: string) => TextPanel;
