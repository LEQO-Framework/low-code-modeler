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
import {
  analyzeComponents,
  type DiracComponent,
} from "@/lib/componentAnalyzer";
import { qasmToNodes } from "@/lib/qasmToNodes";
import { nodesToQasm } from "@/lib/nodesToQasm";
import JSZip from "jszip";
import {
  getEntanglementPersistence,
  isStateFullySeparable,
  getMultiQubitPersistence,
} from "./BlochSphere";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, value: any) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
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
  qasmEditorMode?: boolean;
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
  qasmEditorMode = false,
}: CustomPanelProps) => {
  const { selectedNode, nodes, edges } = useStore(selector, shallow);
  const { setNodes, setEdges } = useReactFlow();
  const [activeTab, setActiveTab] = useState<"properties" | "math" | "qasm">(
    "properties",
  );
  const [components, setComponents] = useState<DiracComponent[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [waitingForQasm, setWaitingForQasm] = useState(false);
  const [qasmEditorCode, setQasmEditorCode] = useState<string>("");
  const [qasmApplyError, setQasmApplyError] = useState<string | null>(null);
  const [qasmApplySuccess, setQasmApplySuccess] = useState(false);

  // Wenn Math Mode ausgeschaltet → zurück zu Properties (außer QASM Editor ist aktiv)
  useEffect(() => {
    if (!mathMode && activeTab === "math") setActiveTab("properties");
    onWidthChange?.(mathMode || qasmEditorMode ? 480 : 350);
  }, [mathMode, qasmEditorMode]);

  // QASM Editor mit Backend-QASM synchronisieren (hat Priorität)
  useEffect(() => {
    if (qasmCode && qasmCode.trim()) {
      setQasmEditorCode(qasmCode);
    }
  }, [qasmCode]);

  // Canvas → QASM Editor Sync: automatisch wenn sich Nodes/Edges ändern
  // Nur wenn noch kein Backend-QASM vorhanden ist
  useEffect(() => {
    if (qasmCode && qasmCode.trim()) return; // Backend-QASM hat Priorität
    if (!qasmEditorMode) return;
    const generated = nodesToQasm(nodes, edges);
    if (generated) {
      setQasmEditorCode(generated);
    }
  }, [nodes, edges, qasmEditorMode]);

  // Wenn QASM Editor deaktiviert → zurück zu Properties wenn aktiv
  useEffect(() => {
    if (!qasmEditorMode && activeTab === "qasm") setActiveTab("properties");
  }, [qasmEditorMode]);

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
    // Zusätzlich den regulären Backend-Compile anstoßen, damit der QASM-Tab
    // (qasmCode, gesteuert von sendToBackend() in App.tsx) synchron mit dem
    // Math-Mode-Ergebnis bleibt. Ohne das lief Math Mode über seinen eigenen,
    // unabhängigen analyzeComponents()-Request und der QASM-Tab blieb auf
    // dem Stand des letzten "Send to Backend"-/"Apply to Canvas"-Klicks stehen.
    onSendToBackend?.();
    setAnalyzing(true);
    setComponents([]);
    analyzeComponents(nodes, edges, backendUrl, metadata, compilationTarget)
      .then(setComponents)
      .finally(() => setAnalyzing(false));
  }, [nodes, edges, backendUrl, metadata, compilationTarget, onSendToBackend]);

  // Beim Wechsel zum Math Mode Tab → automatisch Backend-Call auslösen
  const handleTabSwitch = useCallback(
    (tab: "properties" | "math") => {
      setActiveTab(tab);
      if (tab === "math" && mathMode && !hasAnalyzedOnce) {
        if (qasmCode.trim().length > 0) {
          // QASM vorhanden → direkt analysieren
          setHasAnalyzedOnce(true);
          setAnalyzing(true);
          setComponents([]);
          analyzeComponents(
            nodes,
            edges,
            backendUrl,
            metadata,
            compilationTarget,
          )
            .then(setComponents)
            .finally(() => setAnalyzing(false));
        } else if (onSendToBackend) {
          // Kein QASM → Backend-Call auslösen und warten
          setWaitingForQasm(true);
          setAnalyzing(true);
          onSendToBackend();
        }
      }
    },
    [
      mathMode,
      hasAnalyzedOnce,
      qasmCode,
      nodes,
      edges,
      backendUrl,
      metadata,
      compilationTarget,
      onSendToBackend,
    ],
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    onUpdateMetadata(e);
  }

  return (
    <div className="currentPanel-container bg-gray-100 h-full border-gray-200 border text-black flex flex-col">
      {/* Tab-Leiste */}
      {(mathMode || qasmEditorMode) && (
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
          {mathMode && (
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
          )}
          {qasmEditorMode && (
            <button
              onClick={() => setActiveTab("qasm")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "qasm"
                  ? "border-b-2 border-blue-500 text-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              QASM
            </button>
          )}
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="flex-1 overflow-y-auto">
          {selectedNode ? (
            <TextPanel />
          ) : (
            <MetadataPanel
              metadata={metadata}
              onUpdateMetadata={handleChange}
            />
          )}
        </div>
      )}

      {/* QASM Editor Tab */}
      {activeTab === "qasm" && qasmEditorMode && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-2 pt-2 pb-1 gap-2 flex-wrap">
            <span className="text-xs text-gray-400">
              {qasmCode?.trim() ? "OpenQASM" : "No OpenQASM available yet"}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onSendToBackend?.()}
                disabled={!onSendToBackend}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
                title="Recompile current canvas and refresh QASM output"
              >
                ↺ Refresh
              </button>
              <button
                onClick={() => {
                  setQasmApplyError(null);
                  setQasmApplySuccess(false);
                  try {
                    const { nodes: newNodes, edges: newEdges } =
                      qasmToNodes(qasmEditorCode);
                    if (newNodes.length === 0) {
                      setQasmApplyError("No nodes could be parsed from QASM.");
                      return;
                    }
                    setNodes(newNodes);
                    setEdges(newEdges);
                    setQasmApplySuccess(true);
                    // setTimeout(0): reactFlowInstance synchronisiert seinen internen
                    // Store erst NACH dem React-Commit von setNodes/setEdges. Ein
                    // synchroner onSendToBackend()-Aufruf hier würde daher noch mit
                    // dem alten Circuit-Stand compilen (siehe auch der analoge
                    // setTimeout(0)-Patch für den Zustand-Duplicate-Fix).
                    setTimeout(() => onSendToBackend?.(), 0);
                    setTimeout(() => setQasmApplySuccess(false), 2000);
                  } catch (e) {
                    setQasmApplyError(
                      e instanceof Error ? e.message : "Parse error",
                    );
                  }
                }}
                disabled={!qasmEditorCode.trim()}
                className="text-xs px-2.5 py-1 rounded-full border border-blue-300 hover:bg-blue-300 text-blue-600 transition-colors disabled:opacity-40"
                title="Apply OpenQASM to canvas"
              >
                ↙ Apply to Canvas
              </button>
            </div>
          </div>
          {qasmApplyError && (
            <div className="flex-shrink-0 mx-2 mb-1 px-2 py-1 rounded bg-red-50 border border-red-200 text-xs text-red-600">
              ⚠ {qasmApplyError}
            </div>
          )}
          {qasmApplySuccess && (
            <div className="flex-shrink-0 mx-2 mb-1 px-2 py-1 rounded bg-green-50 border border-green-200 text-xs text-green-600">
              ✓ Applied to canvas
            </div>
          )}
          <div className="flex-1 overflow-hidden mx-2 mb-2 rounded border border-gray-200 relative">
            <textarea
              value={qasmEditorCode}
              onChange={(e) => {
                setQasmEditorCode(e.target.value);
                setQasmApplyError(null);
              }}
              spellCheck={false}
              className="w-full h-full resize-none p-3 font-mono text-xs leading-relaxed bg-transparent text-black-100 outline-none"
              placeholder="// QASM code will appear here after backend call&#10;// You can also write QASM directly&#10;OPENQASM 2.0;&#10;qreg q[2];&#10;h q[0];&#10;cx q[0],q[1];"
              style={{ caretColor: "black" }}
            />
          </div>
        </div>
      )}

      {/* Math Mode Tab */}
      {activeTab === "math" && mathMode && (
        <div className="flex-1 overflow-hidden flex flex-col">
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
                <p className="text-sm text-center">
                  Press "Refresh" to calculate the Dirac notation.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">
                  No QASM output available yet.
                </p>
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
  onGetModel,
}: {
  components: DiracComponent[];
  onGetCircuitSvg?: () => Promise<string>;
  nodes: Node[];
  onGetModel?: () => object;
  qasmEditorMode?: boolean;
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
            nodeIds={component.nodeIds}
            nodes={component.nodes}
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
  nodeIds,
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
  nodeIds?: string[];
  nodes: Node[];
  onGetModel?: () => object;
  qasmEditorMode?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { setNodes } = useReactFlow();

  // Gibt nur das SVG der Nodes dieses Circuits/dieser Gruppe zurück
  const circuitNodeIds = new Set(nodeIds ?? nodes.map((n) => n.id));

  const getGroupCircuitSvg = onGetCircuitSvg
    ? async (): Promise<string> => {
        if (groupId) {
          // Gruppen-Fall: alle Nodes außer dieser Gruppe ausblenden
          setNodes((nds: Node[]) =>
            nds.map((n) => {
              if (n.id === groupId || n.parentNode === groupId) return n;
              return { ...n, hidden: true };
            }),
          );
        } else {
          // Circuit-Fall (kein groupId): alle Nodes außer den Circuit-Nodes ausblenden
          setNodes((nds: Node[]) =>
            nds.map((n) => {
              if (circuitNodeIds.has(n.id)) return n;
              return { ...n, hidden: true };
            }),
          );
        }
        // Kurz warten damit React den neuen State rendert
        await new Promise((r) => setTimeout(r, 150));
        try {
          return await onGetCircuitSvg();
        } finally {
          // Alle Nodes wieder einblenden
          setNodes((nds: Node[]) => nds.map((n) => ({ ...n, hidden: false })));
        }
      }
    : undefined;

  const handleStepClick = (nodeIds: string[]) => {
    const idSet = new Set(nodeIds);
    setNodes((nds: Node[]) =>
      nds.map((n) => ({
        ...n,
        selected: idSet.has(n.id),
        className: idSet.has(n.id)
          ? n.className
            ? n.className +
              " !ring-4 !ring-blue-500 !ring-offset-2 !shadow-lg !shadow-blue-400/60"
            : "!ring-4 !ring-blue-500 !ring-offset-2 !shadow-lg !shadow-blue-400/60"
          : n.className
              ?.replace(
                "!ring-4 !ring-blue-500 !ring-offset-2 !shadow-lg !shadow-blue-400/60",
                "",
              )
              .trim(),
      })),
    );
    setTimeout(() => {
      let firstEl: HTMLElement | null = null;
      for (const nodeId of nodeIds) {
        const el = document.querySelector(
          `[data-id="${nodeId}"]`,
        ) as HTMLElement | null;
        if (!el) continue;
        if (!firstEl) firstEl = el;
        el.style.transition =
          "box-shadow 0.15s ease-in-out, outline 0.15s ease-in-out";
        el.style.outline = "3px solid #3b82f6";
        el.style.outlineOffset = "3px";
        el.style.boxShadow =
          "0 0 0 6px rgba(59,130,246,0.35), 0 0 20px rgba(59,130,246,0.25)";
        el.style.zIndex = "999";
      }
      // Nur zum ersten (frühesten) hervorgehobenen Node scrollen, damit die Ansicht nicht
      // zwischen mehreren Nodes hin- und herspringt.
      firstEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        for (const nodeId of nodeIds) {
          const el = document.querySelector(
            `[data-id="${nodeId}"]`,
          ) as HTMLElement | null;
          if (!el) continue;
          el.style.outline = "";
          el.style.outlineOffset = "";
          el.style.boxShadow = "";
          el.style.zIndex = "";
        }
      }, 1500);
    }, 50);
    setTimeout(() => {
      setNodes((nds: Node[]) =>
        nds.map((n) => ({
          ...n,
          selected: false,
          className: n.className
            ?.replace(
              "!ring-4 !ring-blue-500 !ring-offset-2 !shadow-lg !shadow-blue-400/60",
              "",
            )
            .trim(),
        })),
      );
    }, 1500);
  };

  return (
    <div
      style={{
        border: `1.5px solid ${color}55`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
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
          <span style={{ fontSize: "13px", fontWeight: 600, color }}>
            {label}
          </span>
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
              onStepClick={handleStepClick}
            />
          ) : (
            <div className="text-xs text-gray-400 px-2 py-1">
              No QASM available.
            </div>
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
  qasmEditorMode?: boolean;
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
              if (
                n.id === component.groupId ||
                n.parentNode === component.groupId
              )
                return n;
              return { ...n, hidden: true };
            }),
          );
          await new Promise((r) => setTimeout(r, 150));
          try {
            const svg = await onGetCircuitSvg();
            pngBase64 = await svgToPngBase64(svg);
          } catch {
            // PNG-Export fehlgeschlagen – ohne Bild weiterfahren
          } finally {
            setNodes((nds: Node[]) =>
              nds.map((n) => ({ ...n, hidden: false })),
            );
            await new Promise((r) => setTimeout(r, 50));
          }
        } else {
          // Circuit-Fall: nur Circuit-Nodes sichtbar lassen
          const circuitIds = new Set(component.nodeIds ?? []);
          if (circuitIds.size > 0) {
            setNodes((nds: Node[]) =>
              nds.map((n) => {
                if (circuitIds.has(n.id)) return n;
                return { ...n, hidden: true };
              }),
            );
            await new Promise((r) => setTimeout(r, 150));
          }
          try {
            const svg = await onGetCircuitSvg();
            pngBase64 = await svgToPngBase64(svg);
          } catch {
            /* ignore */
          } finally {
            setNodes((nds: Node[]) =>
              nds.map((n) => ({ ...n, hidden: false })),
            );
            await new Promise((r) => setTimeout(r, 50));
          }
        }

        // LaTeX generieren
        if (component.qasm) {
          const { qasmToDirac, qasmToDiracSteps, normalizeQasm } = await import(
            "./utils/qasmToDirac"
          );
          const result = qasmToDirac(component.qasm);
          const stepsResult = qasmToDiracSteps(component.qasm);

          const texContent = buildLatexForComponent(
            label,
            result.latex,
            result.numQubits,
            result.terms,
            stepsResult,
            pngBase64,
          );

          zip.file(`${safeName}/main.tex`, texContent);
          if (pngBase64) {
            zip.file(`${safeName}/circuit.png`, pngBase64, { base64: true });
          }
          zip.file(`${safeName}/circuit.qasm`, normalizeQasm(component.qasm));
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
  pngBase64?: string,
): string {
  const termLines = terms
    .map((t: any) => {
      const p =
        Math.round((t.amplitude.re ** 2 + t.amplitude.im ** 2) * 10000) / 100;
      return `    \\hline\n    $|${t.basisState}\\rangle$ & $${p}\\%$ \\\\`;
    })
    .join("\n");

  const circuitSection = pngBase64
    ? `\\section*{Quantum Circuit}\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.9\\textwidth]{circuit}\n  \\caption{${label}}\n\\end{figure}\n\n`
    : "";

  const stepsSection =
    stepsResult?.steps?.length > 0
      ? `\\section*{Mathematical Intermediate Steps}\n\\begin{align}\n  |\\psi_0\\rangle &= ${stepsResult.initial.latex} \\\\[6pt]\n${stepsResult.steps.map((s: any, i: number) => `  &\\xrightarrow{${s.gateLabelLatex}} \\\\[2pt]\n  |\\psi_{${i + 1}}\\rangle &= ${s.latex}`).join(" \\\\[6pt]\n")}\n\\end{align}\n\n`
      : "";

  // pgfplots Histogram
  const histogramSection =
    terms.length > 0
      ? (() => {
          const coords = terms.map((t: any) => {
            const p =
              Math.round((t.amplitude.re ** 2 + t.amplitude.im ** 2) * 10000) /
              100;
            return { label: `|${t.basisState}\\rangle`, value: p };
          });
          const coordStr = coords
            .map((c: any, i: number) => `(${i}, ${c.value})`)
            .join(" ");
          const tickLabels = coords.map((c: any) => `$${c.label}$`).join(", ");
          const xMax = coords.length - 0.5;
          return `\\section*{Measurement Probabilities}\n\\begin{figure}[h]\n  \\centering\n  \\begin{tikzpicture}\n    \\begin{axis}[\n      ybar, bar width=0.5cm, width=0.85\\textwidth, height=6cm,\n      ymin=0, ymax=100, xmin=-0.5, xmax=${xMax},\n      xtick={${coords.map((_: any, i: number) => i).join(", ")}},\n      xticklabels={${tickLabels}},\n      ylabel={Probability (\\%)}, ymajorgrids=true, grid style=dashed,\n      nodes near coords, nodes near coords align={vertical},\n    ]\n      \\addplot[fill=blue!60, draw=blue!80] coordinates {${coordStr}};\n    \\end{axis}\n  \\end{tikzpicture}\n  \\caption{Measurement Probabilities of Basis States}\n\\end{figure}\n\n`;
        })()
      : "";

  const tableSection =
    terms.length > 0
      ? `\\section*{Measurement Probabilities (Table)}\n\\begin{table}[h]\n  \\centering\n  \\begin{tabular}{|c|c|}\n    \\hline\n    \\textbf{Basis State} & \\textbf{Probability} \\\\\n${termLines}\n    \\hline\n  \\end{tabular}\n\\end{table}\n\n`
      : "";

  // Statevector einmal rekonstruieren, für Separabilitäts- und Persistence-Berechnung genutzt.
  const statevectorArrForProperties = Array.from(
    { length: 1 << numQubits },
    (_, i) => {
      const term = terms.find((t: any) => parseInt(t.basisState, 2) === i);
      return term ? term.amplitude : { re: 0, im: 0 };
    },
  );

  // Exakte Separabilitätsprüfung (keine Heuristik): vollständig separabel, wenn JEDES Qubit
  // einen reinen reduzierten Zustand hat (Bloch-Vektor-Länge 1 für jede Qubit-Bipartition).
  const isEntangledComponent =
    numQubits >= 2 &&
    !isStateFullySeparable(statevectorArrForProperties, numQubits);
  const persistenceComponent: number | null =
    numQubits === 1
      ? getEntanglementPersistence(statevectorArrForProperties, numQubits, 0)
      : isEntangledComponent
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
\\textbf{${isEntangledComponent ? "entangled" : "separable"}}${
    numQubits >= 2 && !isEntangledComponent
      ? " (it factors into a product of single-qubit states)"
      : ""
  }.

${
  persistenceComponent !== null
    ? numQubits === 1
      ? `\\textbf{Entanglement Persistence:} $S = ${persistenceComponent.toFixed(3)}$ (von Neumann entropy of the qubit's reduced density matrix, in bits). $S = 0$ corresponds to a pure, unentangled state; $S = 1$ corresponds to a maximally mixed/entangled qubit.\n\n`
      : `\\textbf{Entanglement Persistence:} $P = ${persistenceComponent.toFixed(3)}$ (persistency of entanglement: the minimum number of local qubit measurements required until the remaining state is guaranteed to be fully separable).\n\n`
    : numQubits >= 2
      ? `\\textbf{Entanglement Persistence:} not computable -- this state does not match any of the recognized standard patterns (GHZ-like states, Bell-state variants, W-states).\n\n`
      : ""
}`;

  // Gate-Erklärungen
  const GATE_INFO: Record<
    string,
    { desc: string; matrix: string; effect: string }
  > = {
    H: {
      desc: "The Hadamard gate creates an equal superposition.",
      matrix: "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}",
      effect: "$H|0\\rangle=|+\\rangle,\\;H|1\\rangle=|-\\rangle$",
    },
    X: {
      desc: "The Pauli-X gate is the quantum NOT gate.",
      matrix: "\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}",
      effect: "$X|0\\rangle=|1\\rangle,\\;X|1\\rangle=|0\\rangle$",
    },
    Y: {
      desc: "The Pauli-Y gate rotates around the Y-axis.",
      matrix: "\\begin{pmatrix}0&-i\\\\i&0\\end{pmatrix}",
      effect: "$Y|0\\rangle=i|1\\rangle,\\;Y|1\\rangle=-i|0\\rangle$",
    },
    Z: {
      desc: "The Pauli-Z gate applies a phase flip.",
      matrix: "\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}",
      effect: "$Z|0\\rangle=|0\\rangle,\\;Z|1\\rangle=-|1\\rangle$",
    },
    S: {
      desc: "The S gate applies a $\\pi/2$ phase rotation.",
      matrix: "\\begin{pmatrix}1&0\\\\0&i\\end{pmatrix}",
      effect: "$S|1\\rangle=i|1\\rangle$",
    },
    T: {
      desc: "The T gate applies a $\\pi/4$ phase rotation.",
      matrix: "\\begin{pmatrix}1&0\\\\0&e^{i\\pi/4}\\end{pmatrix}",
      effect: "$T|1\\rangle=e^{i\\pi/4}|1\\rangle$",
    },
    CNOT: {
      desc: "The CNOT gate flips the target qubit if control is $|1\\rangle$.",
      matrix:
        "\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}",
      effect:
        "$\\text{CNOT}|10\\rangle=|11\\rangle,\\;\\text{CNOT}|11\\rangle=|10\\rangle$",
    },
    SWAP: {
      desc: "The SWAP gate exchanges the states of two qubits.",
      matrix:
        "\\begin{pmatrix}1&0&0&0\\\\0&0&1&0\\\\0&1&0&0\\\\0&0&0&1\\end{pmatrix}",
      effect: "$\\text{SWAP}|01\\rangle=|10\\rangle$",
    },
  };

  const usedGates = new Set<string>();
  if (stepsResult?.steps) {
    for (const s of stepsResult.steps) {
      for (const key of Object.keys(GATE_INFO)) {
        if ((s.gateLabel ?? s.gateLabelLatex ?? "").includes(key))
          usedGates.add(key);
      }
    }
  }

  const gateSection =
    usedGates.size > 0
      ? `\\section*{Gate Reference}\n\n` +
        [...usedGates]
          .map((g) => {
            const info = GATE_INFO[g];
            return `\\subsection*{${g} Gate}\n${info.desc}\n\\begin{equation}\n  ${g} = ${info.matrix}\n\\end{equation}\n\\textbf{Effect:} ${info.effect}\n`;
          })
          .join("\n")
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

${stepsSection}${histogramSection}${tableSection}${entanglementSection}${gateSection}\\end{document}
`;
}

// SVG → PNG Base64
async function svgToPngBase64(svgInput: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = svgInput.startsWith("data:")
      ? svgInput
      : URL.createObjectURL(new Blob([svgInput], { type: "image/svg+xml" }));
    const img = new Image();
    img.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = (img.naturalWidth || 1200) * scale;
      canvas.height = (img.naturalHeight || 800) * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png").split(",")[1]);
    });
    img.addEventListener("error", (e) => {
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      reject(e);
    });
    img.src = objectUrl;
  });
}
