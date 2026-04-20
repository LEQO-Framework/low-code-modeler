/**
 * panel.tsx
 * Platzierung: src/components/panel.tsx
 */

import { useState } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { TextPanel, MetadataPanel } from "./panels";
import { QasmDiracPanel } from "./QasmDiracPanel";

const selector = (state: { selectedNode: Node | null; nodes: Node[] }) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
});

interface CustomPanelProps {
  metadata: any;
  onUpdateMetadata: any;
  mathMode?: boolean;
  qasmCode?: string;
  onGetCircuitSvg?: () => Promise<string>;
  onWidthChange?: (width: number) => void;
}

export const CustomPanel = ({
  metadata,
  onUpdateMetadata,
  mathMode = false,
  qasmCode = "",
  onGetCircuitSvg,
  onWidthChange,
}: CustomPanelProps) => {
  const { selectedNode, nodes } = useStore(selector, shallow);
  const [activeTab, setActiveTab] = useState<"properties" | "math">("properties");
  const [prevMathMode, setPrevMathMode] = useState(false);

  // Wenn Math Mode eingeschaltet wird, Panel automatisch breiter machen
  if (mathMode !== prevMathMode) {
    setPrevMathMode(mathMode);
    onWidthChange?.(mathMode ? 480 : 350);
  }

  const CurrentPanel = selectedNode ? TextPanel : MetadataPanel;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onUpdateMetadata(e);
  }

  const hasMathContent = mathMode && qasmCode.trim().length > 0;

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
          <CurrentPanel metadata={metadata} onUpdateMetadata={handleChange} />
        </div>
      )}

      {/* Math Mode Tab */}
      {activeTab === "math" && mathMode && (
        <div className="flex-1 overflow-y-auto p-2">
          {hasMathContent ? (
            <MathModePanel
              qasmCode={qasmCode}
              onGetCircuitSvg={onGetCircuitSvg}
              nodes={nodes}
            />
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
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Math Mode Panel – mit Gruppenunterstützung
// ---------------------------------------------------------------------------

function MathModePanel({
  qasmCode,
  onGetCircuitSvg,
  nodes,
}: {
  qasmCode: string;
  onGetCircuitSvg?: () => Promise<string>;
  nodes: Node[];
}) {
  const groups = nodes.filter((n) => n.type === "groupNode");

  if (groups.length === 0) {
    return (
      <QasmDiracPanel
        qasm={qasmCode}
        title="Dirac-Notation"
        onGetCircuitSvg={onGetCircuitSvg}
      />
    );
  }

  const ungroupedNodes = nodes.filter(
    (n) => !n.parentNode && n.type !== "groupNode"
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-3 py-2">
        ℹ Das QASM des gesamten Modells wird pro Gruppe dargestellt.
      </div>

      {groups.map((group) => {
        const childNodes = nodes.filter((n) => n.parentNode === group.id);
        return (
          <GroupSection
            key={group.id}
            label={group.data?.label || "Gruppe"}
            color={group.data?.color || "#6366f1"}
            childCount={childNodes.length}
            qasmCode={qasmCode}
            onGetCircuitSvg={onGetCircuitSvg}
          />
        );
      })}

      {ungroupedNodes.length > 0 && (
        <GroupSection
          label="Ohne Gruppe"
          color="#9ca3af"
          childCount={ungroupedNodes.length}
          qasmCode={qasmCode}
          onGetCircuitSvg={onGetCircuitSvg}
        />
      )}
    </div>
  );
}

function GroupSection({
  label,
  color,
  childCount,
  qasmCode,
  onGetCircuitSvg,
}: {
  label: string;
  color: string;
  childCount: number;
  qasmCode: string;
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
            ({childCount} Node{childCount !== 1 ? "s" : ""})
          </span>
        </div>
        <span style={{ color, fontSize: "11px" }}>{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div style={{ padding: "8px" }}>
          <QasmDiracPanel
            qasm={qasmCode}
            title={`Dirac-Notation – ${label}`}
            onGetCircuitSvg={onGetCircuitSvg}
          />
        </div>
      )}
    </div>
  );
}

const getPanel = (type: string) => TextPanel;
