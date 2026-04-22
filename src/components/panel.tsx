/**
 * panel.tsx
 * Platzierung: src/components/panel.tsx
 */

import { useState, useEffect, useCallback } from "react";
import { Node, Edge } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { TextPanel, MetadataPanel } from "./panels";
import { QasmDiracPanel } from "./QasmDiracPanel";
import { analyzeComponents, type DiracComponent } from "@/lib/componentAnalyzer";

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
}: CustomPanelProps) => {
  const { selectedNode, nodes, edges } = useStore(selector, shallow);
  const [activeTab, setActiveTab] = useState<"properties" | "math">("properties");
  const [components, setComponents] = useState<DiracComponent[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);

  // Wenn Math Mode ausgeschaltet → zurück zu Properties
  useEffect(() => {
    if (!mathMode) setActiveTab("properties");
    onWidthChange?.(mathMode ? 480 : 350);
  }, [mathMode]);

  // Wenn neues QASM ankommt → Analyse zurücksetzen
  useEffect(() => {
    setComponents([]);
    setHasAnalyzedOnce(false);
  }, [qasmCode]);

  // Analyse-Funktion – aufrufbar per Refresh-Button oder automatisch
  const runAnalysis = useCallback(() => {
    if (!backendUrl || !qasmCode.trim()) return;
    setAnalyzing(true);
    setComponents([]);
    analyzeComponents(nodes, edges, backendUrl, metadata, compilationTarget)
      .then(setComponents)
      .finally(() => setAnalyzing(false));
  }, [nodes, edges, backendUrl, metadata, compilationTarget, qasmCode]);

  // Beim ersten Öffnen des Math Mode Tabs automatisch analysieren
  useEffect(() => {
    if (activeTab === "math" && mathMode && backendUrl && !hasAnalyzedOnce && qasmCode.trim().length > 0) {
      setHasAnalyzedOnce(true);
      runAnalysis();
    }
  }, [activeTab, mathMode, qasmCode]);

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
            onClick={() => setActiveTab("math")}
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

          {/* Refresh-Button */}
          <div className="flex-shrink-0 flex justify-end px-2 pt-2">
            <button
              onClick={runAnalysis}
              disabled={analyzing || !qasmCode.trim()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
              title="Dirac-Notation neu berechnen"
            >
              <span className={analyzing ? "animate-spin" : ""}>↺</span>
              {analyzing ? "Analysiere..." : "Aktualisieren"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-lg animate-spin">⟳</span>
                <p className="text-sm">Schaltkreise werden analysiert...</p>
              </div>
            ) : components.length > 0 ? (
              <ComponentsView
                components={components}
                onGetCircuitSvg={onGetCircuitSvg}
              />
            ) : qasmCode.trim().length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">Auf „Aktualisieren" drücken um die Dirac-Notation zu berechnen.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">Noch kein QASM-Output vorhanden.</p>
                <p className="text-xs text-center text-gray-300">
                  Sende das Modell ans Backend um die Dirac-Notation zu sehen.
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
}: {
  components: DiracComponent[];
  onGetCircuitSvg?: () => Promise<string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {components.length > 1 && (
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          ℹ {components.length} separate Schaltkreise gefunden.
        </div>
      )}
      {components.map((component, idx) => {
        const label = component.groupLabel
          ? component.groupLabel
          : components.length === 1
          ? "Dirac-Notation"
          : `Schaltkreis ${idx + 1}`;
        return (
          <ComponentSection
            key={idx}
            label={label}
            color={component.groupColor || "#6366f1"}
            nodeCount={component.nodes.length}
            qasm={component.qasm}
            error={component.error}
            onGetCircuitSvg={onGetCircuitSvg}
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
}: {
  label: string;
  color: string;
  nodeCount: number;
  qasm: string | null;
  error: string | null;
  onGetCircuitSvg?: () => Promise<string>;
}) {
  const [expanded, setExpanded] = useState(true);

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
              onGetCircuitSvg={onGetCircuitSvg}
            />
          ) : (
            <div className="text-xs text-gray-400 px-2 py-1">Kein QASM verfügbar.</div>
          )}
        </div>
      )}
    </div>
  );
}

const getPanel = (type: string) => TextPanel;
