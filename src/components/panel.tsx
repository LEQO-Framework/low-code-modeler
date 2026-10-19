/**
 * panel.tsx
 * Platzierung: src/components/panel.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Node, Edge, useReactFlow } from "reactflow";
import { shallow } from "zustand/shallow";
import { appendHistory, useStore } from "@/config/store";
import { TextPanel, MetadataPanel } from "./panels";
import { QasmDiracPanel } from "./QasmDiracPanel";
import { MathCircuitEditor } from "./MathCircuitEditor";
import {
  analyzeComponents,
  type DiracComponent,
} from "@/lib/componentAnalyzer";
import { qasmToNodes } from "@/lib/qasmToNodes";
import {
  createOpenedBlocks,
  followStep,
  type OpenedBlocks,
} from "@/lib/circuitLevel";
import { nodesToQasm } from "@/lib/nodesToQasm";
import JSZip from "jszip";
import { buildStepTree } from "./mathExplanations";
import { buildLatexExport } from "./latexExport";

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
  // Math Mode editor outside of a circuit: on an empty canvas or via "Start a new circuit"
  const [standaloneEditor, setStandaloneEditor] = useState(false);
  const canvasEmpty = nodes.length === 0;
  // blocks opened on the canvas by clicking a step; the steps keep the block ids until
  // the model is recompiled
  const openedBlocks = useRef<OpenedBlocks>(createOpenedBlocks());
  useEffect(() => {
    openedBlocks.current = createOpenedBlocks();
  }, [qasmCode]);

  // clicking a node on the canvas shows its properties
  useEffect(() => {
    if (selectedNode) setActiveTab("properties");
  }, [selectedNode]);
  // code typed in the OpenQASM editor that is not (yet) the compiled model; Math Mode's
  // circuit editor shows it so that both editors show the same circuit
  const editorQasmChanged =
    qasmEditorCode.trim() !== "" && qasmEditorCode.trim() !== qasmCode.trim();

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

  // Applies a circuit edited in Math Mode: the nodes of the edited circuit (component) are
  // replaced by gate nodes built from the new OpenQASM, other circuits on the canvas stay.
  // Without a component (new circuit started from the empty Math Mode view) the whole
  // canvas is replaced.
  // The QASM tab gets the new code right away and the backend recompiles the model, after
  // which Math Mode is analyzed again.
  const applyEditedQasm = useCallback(
    (component: DiracComponent | null, newQasm: string) => {
      const { nodes: newNodes, edges: newEdges } = qasmToNodes(newQasm);
      if (newNodes.length === 0) return;

      const replaced = new Set(
        component ? component.nodeIds : nodes.map((n) => n.id),
      );
      if (component?.groupId) {
        replaced.add(component.groupId);
        for (const n of nodes) {
          if (n.parentNode === component.groupId) replaced.add(n.id);
        }
      }
      // groups (e.g. a recognized Bell state) whose nodes are all replaced go as well
      for (const group of nodes) {
        if (group.type !== "groupNode" || replaced.has(group.id)) continue;
        const children = nodes.filter((n) => n.parentNode === group.id);
        if (children.length > 0 && children.every((n) => replaced.has(n.id)))
          replaced.add(group.id);
      }
      // place the new circuit where the old one was
      const oldNodes = nodes.filter((n) => replaced.has(n.id) && !n.parentNode);
      const topLevel = newNodes.filter((n) => !n.parentNode);
      const newMinX = Math.min(...topLevel.map((n) => n.position.x));
      const newMinY = Math.min(...topLevel.map((n) => n.position.y));
      const minX = oldNodes.length
        ? Math.min(...oldNodes.map((n) => n.position.x))
        : newMinX;
      const minY = oldNodes.length
        ? Math.min(...oldNodes.map((n) => n.position.y))
        : newMinY;
      // children of a (recognized state) group are positioned relative to the group
      const shifted = newNodes.map((n) =>
        n.parentNode
          ? n
          : {
              ...n,
              position: {
                x: n.position.x - newMinX + minX,
                y: n.position.y - newMinY + minY,
              },
            },
      );

      setNodes((nds: Node[]) => [
        ...nds.filter((n) => !replaced.has(n.id)),
        ...shifted,
      ]);
      setEdges((eds: Edge[]) => [
        ...eds.filter(
          (e) => !replaced.has(e.source) && !replaced.has(e.target),
        ),
        ...newEdges,
      ]);
      setQasmEditorCode(newQasm);

      // show the edited circuit immediately, the backend result replaces it when it arrives
      const edited = {
        qasm: newQasm,
        error: null,
        groupId: null,
        nodes: shifted.filter((n) => n.type !== "groupNode"),
        nodeIds: shifted
          .filter((n) => n.type !== "groupNode")
          .map((n) => n.id),
      };
      setComponents((prev) =>
        component
          ? prev.map((c) =>
              c.index === component.index ? { ...c, ...edited } : c,
            )
          : [{ ...edited, index: 0, groupLabel: null, groupColor: "#6366f1" }],
      );
      setHasAnalyzedOnce(true);
      setStandaloneEditor(false);
      if (onSendToBackend) {
        setWaitingForQasm(true);
        // see "Apply to Canvas": the flow instance only knows the new nodes after the commit
        setTimeout(() => onSendToBackend(), 0);
      }
    },
    [nodes, setNodes, setEdges, onSendToBackend],
  );

  // Beim Wechsel zum Math Mode Tab → automatisch Backend-Call auslösen
  // (not on an empty canvas: there Math Mode opens with the editor to start a new circuit)
  const handleTabSwitch = useCallback(
    (tab: "properties" | "math") => {
      setActiveTab(tab);
      if (tab === "math" && mathMode && !hasAnalyzedOnce && !canvasEmpty) {
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
      canvasEmpty,
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

  const startNewButton = (
    <button
      onClick={() => setStandaloneEditor(true)}
      className="mt-1 text-xs px-2.5 py-1 rounded-full border border-blue-300 hover:bg-blue-50 text-blue-600 transition-colors"
      title="Build a new circuit in Math Mode; it replaces the current model when applied"
    >
      + Start a new circuit
    </button>
  );

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
                    // Math Mode is analyzed again as soon as the recompiled QASM arrives
                    if (mathMode && onSendToBackend) setWaitingForQasm(true);
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
              disabled={analyzing || !qasmCode.trim() || canvasEmpty}
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
            {canvasEmpty || standaloneEditor ? (
              <div className="flex flex-col gap-2">
                {canvasEmpty && (
                  <p className="text-xs text-gray-500 px-1">
                    The canvas is empty. Build a circuit step by step here:
                    choose the number of qubits and the initial state, add gates
                    and watch the state change. "Create on canvas" turns it into
                    a low-code model and OpenQASM.
                  </p>
                )}
                <MathCircuitEditor
                  qasm={
                    canvasEmpty
                      ? editorQasmChanged
                        ? qasmEditorCode
                        : undefined
                      : qasmEditorCode || qasmCode
                  }
                  fromQasmEditor={editorQasmChanged}
                  initialMode="new"
                  onApply={(qasm) => applyEditedQasm(null, qasm)}
                  onClose={
                    canvasEmpty ? undefined : () => setStandaloneEditor(false)
                  }
                />
              </div>
            ) : analyzing ? (
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
                onApplyQasm={applyEditedQasm}
                openedBlocks={openedBlocks.current}
                editorQasm={
                  editorQasmChanged && components.length === 1
                    ? qasmEditorCode
                    : undefined
                }
              />
            ) : qasmCode.trim().length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <span className="text-2xl">⟩</span>
                <p className="text-sm text-center">
                  Press "Refresh" to calculate the Dirac notation.
                </p>
                {startNewButton}
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
                {startNewButton}
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
  onApplyQasm,
  editorQasm,
  openedBlocks,
}: {
  components: DiracComponent[];
  onGetCircuitSvg?: () => Promise<string>;
  nodes: Node[];
  onGetModel?: () => object;
  onApplyQasm?: (component: DiracComponent, qasm: string) => void;
  qasmEditorMode?: boolean;
  editorQasm?: string;
  openedBlocks: OpenedBlocks;
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
            onApplyQasm={
              onApplyQasm
                ? (qasm: string) => onApplyQasm(component, qasm)
                : undefined
            }
            editorQasm={editorQasm}
            openedBlocks={openedBlocks}
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
  onApplyQasm,
  editorQasm,
  openedBlocks,
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
  onApplyQasm?: (qasm: string) => void;
  qasmEditorMode?: boolean;
  editorQasm?: string;
  openedBlocks: OpenedBlocks;
}) {
  const [expanded, setExpanded] = useState(true);
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

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

  // Follows a clicked step onto the canvas: the block of the step is opened down to the
  // circuit level (e.g. Grover → its uniform superposition → the H gates) and the gates
  // of the step are highlighted.
  const handleStepClick = (
    stepNodeIds: string[],
    clicked?: { nodeId: string; from: number; to: number },
  ) => {
    if (!clicked) {
      highlightNodes(stepNodeIds);
      return;
    }
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const result = followStep(
      openedBlocks,
      currentNodes,
      currentEdges,
      qasm,
      clicked,
      stepNodeIds.filter((id) => id !== clicked.nodeId),
    );
    if (!result.changed) {
      highlightNodes(result.highlight);
      return;
    }
    // keep the compact version in the undo history
    useStore.setState((state: any) => ({
      ...appendHistory(state.history, state.historyIndex, {
        nodes: structuredClone(currentNodes),
        edges: structuredClone(currentEdges),
      }),
      redoStack: [],
    }));
    setNodes(result.nodes);
    setEdges(result.edges);
    // wait until the circuit is rendered
    setTimeout(() => highlightNodes(result.highlight), 150);
  };

  const highlightNodes = (nodeIds: string[]) => {
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
              onApplyQasm={onApplyQasm}
              editorQasm={editorQasm}
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

          const texContent = buildLatexExport({
            title: label,
            latex: result.latex,
            numQubits: result.numQubits,
            terms: result.terms,
            stepsResult,
            pngBase64,
            stepTree: buildStepTree(
              stepsResult.steps,
              useStore.getState().nodes,
            ),
          });

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

// SVG → PNG Base64
async function svgToPngBase64(svgInput: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = svgInput.startsWith("data:")
      ? svgInput
      : URL.createObjectURL(new Blob([svgInput], { type: "image/svg+xml" }));
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
      resolve(canvas.toDataURL("image/png").split(",")[1]);
    };
    img.onerror = (e) => {
      if (!svgInput.startsWith("data:")) URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    img.src = objectUrl;
  });
}
