/**
 * panel.tsx
 * Platzierung: src/components/panel.tsx
 */

import { useState, useRef, useCallback } from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { TextPanel, MetadataPanel } from "../panels";
import { QasmDiracPanel } from "../QasmDiracPanel";

const selector = (state: { selectedNode: Node | null }) => ({
  selectedNode: state.selectedNode,
});

interface CustomPanelProps {
  metadata: any;
  onUpdateMetadata: any;
  mathMode?: boolean;
  qasmCode?: string;
  onGetCircuitSvg?: () => Promise<string>;
}

const DEFAULT_WIDTH     = 350;
const MATH_MODE_WIDTH   = 480;
const MIN_WIDTH         = 280;
const MAX_WIDTH         = 900;

export const CustomPanel = ({
  metadata,
  onUpdateMetadata,
  mathMode = false,
  qasmCode = "",
  onGetCircuitSvg,
}: CustomPanelProps) => {
  const { selectedNode } = useStore(selector, shallow);
  const [activeTab, setActiveTab] = useState<"properties" | "math">("properties");

  // Manuelle Breite – wenn Math Mode ein, starte breiter
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [prevMathMode, setPrevMathMode] = useState(false);

  // Wenn Math Mode umgeschaltet wird, Breite anpassen
  if (mathMode !== prevMathMode) {
    setPrevMathMode(mathMode);
    setWidth(mathMode ? MATH_MODE_WIDTH : DEFAULT_WIDTH);
     if (!mathMode) setActiveTab("properties");
  }

  // Drag-to-resize
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current     = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX; // Panel ist rechts → nach links ziehen = breiter
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [width]);

  const CurrentPanel = selectedNode
    ? TextPanel
    : MetadataPanel;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onUpdateMetadata(e);
  }

  const hasMathContent = mathMode && qasmCode.trim().length > 0;

  return (
    <div style={{ display: "flex", height: "100%" }}>

      {/* Drag-Handle links (ziehen um Panel zu verbreitern) */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: "6px",
          cursor: "ew-resize",
          background: "transparent",
          flexShrink: 0,
          borderLeft: "2px solid #e5e7eb",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        title="Breite anpassen"
      />

      {/* Panel-Inhalt */}
      <div
        className="currentPanel-container bg-gray-100 h-full border-gray-200 border text-black flex flex-col"
        style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, transition: isDragging.current ? "none" : "width 0.2s ease" }}
      >
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
              <QasmDiracPanel
                qasm={qasmCode}
                title="Dirac-Notation"
                onGetCircuitSvg={onGetCircuitSvg}
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
    </div>
  );
};

const getPanel = (type: string) => TextPanel;
