/**
 * group.tsx
 * Platzierung: src/components/nodes/group.tsx
 */

import { memo, useState, useCallback } from "react";
import { NodeResizer, Handle, Position, Node, useReactFlow } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  nodes: Node[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
}) => ({
  nodes: state.nodes,
  updateNodeValue: state.updateNodeValue,
});

const EXPANDED_MIN_WIDTH  = 300;
const EXPANDED_MIN_HEIGHT = 200;
const COLLAPSED_HEIGHT    = 48;

// Node-Typ Kategorien
const QUANTUM_TYPES = new Set([
  "gateNode", "quantumOperatorNode", "ancillaNode", "statePreparationNode",
  "uncomputeNode", "algorithmNode", "qubitNode", "measurementNode",
]);
const CLASSICAL_TYPES = new Set([
  "dataTypeNode", "classicalAlgorithmNode", "classicalOperatorNode",
]);

type GroupType = "quantum" | "classical" | "mixed";

function getGroupType(childNodes: Node[]): GroupType {
  const types = childNodes.map((n) => n.type ?? "");
  const hasQuantum  = types.some((t) => QUANTUM_TYPES.has(t));
  const hasClassical = types.some((t) => CLASSICAL_TYPES.has(t));
  if (hasQuantum && hasClassical) return "mixed";
  if (hasClassical) return "classical";
  return "quantum";
}

function getGroupStyle(type: GroupType, locked: boolean): {
  color: string;
  borderRadius: string;
  borderStyle: string;
} {
  if (locked) return { color: "#d97706", borderRadius: "8px", borderStyle: "solid" };
  switch (type) {
    case "quantum":   return { color: "#3b82f6", borderRadius: "8px",  borderStyle: "dashed" }; // blau, Ecken
    case "classical": return { color: "#f97316", borderRadius: "20px", borderStyle: "dashed" }; // orange, abgerundet
    case "mixed":     return { color: "#8b5cf6", borderRadius: "4px",  borderStyle: "dashed" }; // lila, leicht abgeschnitten
  }
}

export const GroupNode = memo((node: Node) => {
  const { data, selected, id } = node;
  const { nodes, updateNodeValue } = useStore(selector, shallow);
  const { setNodes, getNodes } = useReactFlow();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "Gruppe");
  const collapsed = data.collapsed === true;
  const locked = data.locked === true;

  // Typ anhand der Kind-Nodes bestimmen
  const childNodes = nodes.filter((n) => n.parentNode === id);
  const groupType = getGroupType(childNodes);
  const groupStyle = getGroupStyle(groupType, locked);
  const color = locked ? "#d90606" : groupStyle.color;
  const borderRadius = groupStyle.borderRadius;
  const borderStyle = collapsed ? "solid" : groupStyle.borderStyle;

  const getChildBounds = useCallback(() => {
    const children = getNodes().filter((n) => n.parentNode === id);
    if (children.length === 0) return null;
    const minX = Math.min(...children.map((n) => n.position.x)) - 20;
    const minY = Math.min(...children.map((n) => n.position.y)) - 40;
    const maxX = Math.max(...children.map((n) => n.position.x + (n.width  ?? 100))) + 20;
    const maxY = Math.max(...children.map((n) => n.position.y + (n.height ?? 100))) + 20;
    return {
      width:  Math.max(maxX - minX, EXPANDED_MIN_WIDTH),
      height: Math.max(maxY - minY, EXPANDED_MIN_HEIGHT),
    };
  }, [id, getNodes]);

  const toggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    setNodes((nds: Node[]) =>
      nds.map((n) => {
        if (n.parentNode === id) {
          return { ...n, hidden: newCollapsed };
        }
        if (n.id === id) {
          const bounds = newCollapsed ? null : getChildBounds();
          return {
            ...n,
            data: { ...n.data, collapsed: newCollapsed },
            style: {
              ...n.style,
              width:  newCollapsed ? (n.style?.width ?? EXPANDED_MIN_WIDTH) : (bounds?.width  ?? EXPANDED_MIN_WIDTH),
              height: newCollapsed ? COLLAPSED_HEIGHT : (bounds?.height ?? EXPANDED_MIN_HEIGHT),
            },
          };
        }
        return n;
      })
    );
  }, [collapsed, id, setNodes, getChildBounds]);

  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newLocked = !locked;
    setNodes((nds: Node[]) =>
      nds.map((n) => {
        if (n.parentNode === id) {
          return { ...n, draggable: !newLocked, connectable: !newLocked };
        }
        if (n.id === id) {
          return { ...n, data: { ...n.data, locked: newLocked } };
        }
        return n;
      })
    );
  }, [locked, id, setNodes]);

  const handleUngroup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const groupNode = getNodes().find((n) => n.id === id);
    if (!groupNode) return;
    setNodes((nds: Node[]) =>
      nds
        .filter((n) => n.id !== id)
        .map((n) => {
          if (n.parentNode === id) {
            return {
              ...n,
              parentNode: undefined,
              extent: undefined,
              hidden: false,
              draggable: true,       // ← Lock zurücksetzen
              connectable: true,     // ← Lock zurücksetzen
              position: {
                x: n.position.x + groupNode.position.x,
                y: n.position.y + groupNode.position.y,
              },
            };
          }
          return n;
        })
    );
  }, [id, setNodes, getNodes]);

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    updateNodeValue(id, "label", editableLabel);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  handleLabelBlur();
    if (e.key === "Escape") { setIsEditingLabel(false); setEditableLabel(data.label || "Gruppe"); }
  };

  return (
    <>
      <NodeResizer
        minWidth={collapsed ? 150 : EXPANDED_MIN_WIDTH}
        minHeight={collapsed ? COLLAPSED_HEIGHT : EXPANDED_MIN_HEIGHT}
        isVisible={selected && !collapsed}
        lineStyle={{ borderColor: color }}
        handleStyle={{ borderColor: color, backgroundColor: "white" }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          border: `2px ${borderStyle} ${color}`,
          borderRadius,
          backgroundColor: locked ? "#fffbeb" : `${color}${collapsed ? "22" : "0d"}`,
          position: "relative",
          transition: "height 0.2s ease, background-color 0.2s ease",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: `${color}33`,
            borderBottom: collapsed ? "none" : `1px dashed ${color}55`,
            borderRadius: collapsed ? borderRadius : `calc(${borderRadius} - 2px) calc(${borderRadius} - 2px) 0 0`,
            padding: "6px 10px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            userSelect: "none",
          }}
        >
          {/* Icon + Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
            <span style={{ color, fontSize: "11px", flexShrink: 0 }}>▣</span>
            {isEditingLabel ? (
              <input
                autoFocus
                value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                onBlur={handleLabelBlur}
                onKeyDown={handleLabelKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color,
                  background: "transparent",
                  border: "none",
                  borderBottom: `1px solid ${color}`,
                  outline: "none",
                  flex: 1,
                  minWidth: 0,
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  cursor: "text",
                }}
                onDoubleClick={() => setIsEditingLabel(true)}
                title="Doppelklick zum Bearbeiten"
              >
                {data.label || "Gruppe"}
              </span>
            )}
          </div>

          {/* Node-Anzahl wenn collapsed */}
          {collapsed && childNodes.length > 0 && (
            <span style={{ fontSize: "10px", color: `${color}99`, marginRight: "6px", flexShrink: 0 }}>
              {childNodes.length} Node{childNodes.length !== 1 ? "s" : ""}
            </span>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
              backgroundColor: `${color}33`, color,
              border: `1px solid ${color}66`, cursor: "pointer", lineHeight: 1,
            }}
            title={collapsed ? "Aufklappen" : "Einklappen"}
          >
            {collapsed ? "▸" : "▾"}
          </button>

          {/* Lock Button */}
          <button
            onClick={handleToggleLock}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px",
              backgroundColor: locked ? "#fef3c7" : `${color}33`,
              color: locked ? "#d97706" : color,
              border: `1px solid ${locked ? "#fcd34d" : `${color}66`}`,
              cursor: "pointer", lineHeight: 1, marginLeft: "2px",
            }}
            title={locked ? "Gruppe entsperren" : "Gruppe sperren"}
          >
            {locked ? "🔒" : "🔓"}
          </button>

          {/* Gruppierung aufheben */}
          <button
            onClick={handleUngroup}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
              backgroundColor: "#fee2e2", color: "#ef4444",
              border: "1px solid #fca5a5", cursor: "pointer",
              lineHeight: 1, marginLeft: "4px",
            }}
            title="Gruppierung aufheben"
          >
            ×
          </button>
        </div>
      </div>

      {/* Externe Handles */}
      <Handle
        type="target"
        id={`groupInput0${id}`}
        position={Position.Left}
        isConnectable={true}
        style={{ top: "50%", background: color, border: "2px solid white", width: 13, height: 16, zIndex: 10 }}
      />
      <Handle
        type="source"
        id={`groupOutput0${id}`}
        position={Position.Right}
        isConnectable={true}
        style={{ top: "50%", background: color, border: "2px solid white", width: 13, height: 16, zIndex: 10 }}
      />
    </>
  );
});
