/**
 * group.tsx
 * Platzierung: src/components/nodes/group.tsx
 */

import { memo, useState, useCallback, useEffect } from "react";
import { NodeResizer, Handle, Position, Node, Edge, useReactFlow } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { awareness } from "@/yjs";

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
  const hasQuantum   = types.some((t) => QUANTUM_TYPES.has(t));
  const hasClassical = types.some((t) => CLASSICAL_TYPES.has(t));
  if (hasQuantum && hasClassical) return "mixed";
  if (hasClassical) return "classical";
  return "quantum";
}

function getGroupStyle(type: GroupType) {
  switch (type) {
    case "quantum":   return { color: "#3b82f6", borderRadius: "8px",  borderStyle: "dashed" };
    case "classical": return { color: "#f97316", borderRadius: "20px", borderStyle: "dashed" };
    case "mixed":     return { color: "#8b5cf6", borderRadius: "4px",  borderStyle: "dashed" };
  }
}

// Determine the handle color from the handle ID
function getHandleColor(handleId: string): string {
  if (handleId.toLowerCase().includes("quantum"))   return "#93c5fd";
  if (handleId.toLowerCase().includes("classical")) return "#F5A843";
  if (handleId.toLowerCase().includes("ancilla"))   return "#c084fc";
  return "#94a3b8";
}

interface ProxyHandle {
  id: string;
  type: "source" | "target";
  color: string;
  index: number;
  total: number;
}

/**
 * Computes the proxy handles of a group from the edges:
 * - output: sourceHandle of a child node that is NOT connected internally
 * - input: targetHandle of a child node that is NOT connected internally
 * The handles are derived from the edges directly, so data.inputs is not needed.
 */
function getProxyHandles(
  childNodes: Node[],
  edges: Edge[]
): { inputs: ProxyHandle[]; outputs: ProxyHandle[]; hasInputs: boolean } {
  const childIds = new Set(childNodes.map((n) => n.id));

  // internal edges (both ends are child nodes)
  const internalEdges = edges.filter(
    (e) => childIds.has(e.source) && childIds.has(e.target)
  );

  // handle IDs from internal edges, used as a prefix set for comparison
  const internalSourceHandles = internalEdges.map((e) => e.sourceHandle).filter(Boolean) as string[];
  const internalTargetHandles = internalEdges.map((e) => e.targetHandle).filter(Boolean) as string[];

  // external edges
  const externalEdges = edges.filter(
    (e) => (childIds.has(e.source) && !childIds.has(e.target)) ||
            (!childIds.has(e.source) && childIds.has(e.target))
  );
  const externalSourceHandles = externalEdges.map((e) => e.sourceHandle).filter(Boolean) as string[];
  const externalTargetHandles = externalEdges.map((e) => e.targetHandle).filter(Boolean) as string[];

  // Checks whether a handle ID matches one of the stored handles,
  // supporting both exact and prefix-based matches.
  const isHandleUsed = (handleId: string, usedHandles: string[]): boolean => {
    return usedHandles.some((h) =>
      h === handleId ||
      h.startsWith(handleId) ||
      handleId.startsWith(h)
    );
  };

  const inputs:  ProxyHandle[] = [];
  const outputs: ProxyHandle[] = [];

  childNodes.forEach((child) => {
    const nodeType = child.type ?? "";

    // Number of qubit wires of this node. For most node types this is exactly 1, but a
    // gateNode can have several wires (CNOT = 2, Toffoli = 3). The real handle IDs carry
    // the wire index right before the node ID (e.g. "quantumHandleGateOutput0<id>",
    // "...Output1<id>", "...Output2<id>"; see the lines in store.ts using
    // sourceHandle.includes("Output1") / .endsWith("Output2")). Previously only index 0
    // was generated here, so the second and third wire of a CNOT/Toffoli gate could never
    // show up as a proxy handle of the group.
    //
    // IMPORTANT: the wire count is deliberately derived from data.label and NOT from
    // data.identifiers.length. The latter is correct at node creation time (see addNode in
    // store.ts: CNOT gets 2 entries, Toffoli 3), but the onConnect logic in store.ts
    // overwrites it on EVERY incoming edge via `targetData["identifiers"] =
    // sourceIdentifier`, i.e. with the identifiers of the connected source node. A single
    // qubit node attached to a CNOT only has 1 identifier, which makes
    // CNOT.data.identifiers fall back to length 1 after connecting. data.label is not
    // affected by this and is therefore the stable signal.
    const wireCount =
      child.data?.label === "Toffoli" ? 3 :
      child.data?.label === "CNOT"    ? 2 : 1;
    const outputWireCount = nodeType === "gateNode" ? wireCount : 1;
    const inputWireCount  = nodeType === "gateNode" ? wireCount : 1;

    // build the output handle prefix from the known pattern (without wire index and ID)
    let outputPrefix: string | null = null;
    if (nodeType === "gateNode")               outputPrefix = "quantumHandleGateOutput";
    else if (nodeType === "qubitNode")         outputPrefix = "quantumHandleQubitOutput";
    else if (nodeType === "measurementNode")   outputPrefix = "quantumHandleMeasurementOutput";
    else if (nodeType === "statePreparationNode") outputPrefix = "quantumHandleStatePreparationOutput";
    else if (nodeType === "quantumOperatorNode")  outputPrefix = "quantumHandleQuantumOperatorOutput";
    else if (nodeType === "algorithmNode")     outputPrefix = "quantumHandleAlgorithmOutput";
    else if (nodeType === "ancillaNode")       outputPrefix = "ancillaHandleAncillaOutput";
    else if (nodeType === "uncomputeNode")     outputPrefix = "quantumHandleUncomputeOutput";
    else if (nodeType === "dataTypeNode")      outputPrefix = "classicalHandleDataTypeOutput";
    else if (nodeType === "classicalAlgorithmNode") outputPrefix = "classicalHandleClassicalAlgorithmOutput";
    else if (nodeType === "classicalOperatorNode")  outputPrefix = "classicalHandleClassicalOperatorOutput";

    // one output proxy per wire: neither connected internally nor already externally
    if (outputPrefix) {
      for (let wireIndex = 0; wireIndex < outputWireCount; wireIndex++) {
        const outputHandleId = `${outputPrefix}${wireIndex}${child.id}`;
        if (!isHandleUsed(outputHandleId, internalSourceHandles)
          && !isHandleUsed(outputHandleId, externalSourceHandles)) {
          outputs.push({
            id: outputHandleId,
            type: "source",
            color: getHandleColor(outputHandleId),
            index: outputs.length,
            total: 0,
          });
        }
      }
    }

    // build the input handle prefix from the known pattern (without wire index and ID)
    let inputPrefix: string | null = null;
    // gateNode: only gets an input if it is NOT a pure |0⟩ qubit source. This used to be
    // checked via child.data?.inputs?.length > 0, but that field does not reliably reflect
    // the actual connections (for freshly grouped or chained gates it can wrongly be
    // empty). "Qubit Circuit" is the structurally stable marker of a qubit source,
    // independent of the current connection state.
    if (nodeType === "gateNode" && child.data?.label !== "Qubit Circuit")
                                               inputPrefix = "quantumHandleGateInput";
    else if (nodeType === "measurementNode")   inputPrefix = "quantumHandleMeasurementInput";
    else if (nodeType === "statePreparationNode") inputPrefix = "classicalHandleStatePreparationInput";
    else if (nodeType === "quantumOperatorNode")  inputPrefix = "quantumHandleQuantumOperatorInput";
    else if (nodeType === "algorithmNode")     inputPrefix = "quantumHandleAlgorithmInput";
    else if (nodeType === "uncomputeNode")     inputPrefix = "quantumHandleUncomputeInput";
    else if (nodeType === "classicalAlgorithmNode") inputPrefix = "classicalHandleClassicalAlgorithmInput";
    else if (nodeType === "classicalOperatorNode")  inputPrefix = "classicalHandleClassicalOperatorInput";
    // qubitNode and dataTypeNode have no inputs

    // one input proxy per wire: neither connected internally nor already externally
    if (inputPrefix) {
      for (let wireIndex = 0; wireIndex < inputWireCount; wireIndex++) {
        const inputHandleId = `${inputPrefix}${wireIndex}${child.id}`;
        if (!isHandleUsed(inputHandleId, internalTargetHandles)
          && !isHandleUsed(inputHandleId, externalTargetHandles)) {
          inputs.push({
            id: inputHandleId,
            type: "target",
            color: getHandleColor(inputHandleId),
            index: inputs.length,
            total: 0,
          });
        }
      }
    }
  });

  // refresh index and total
  inputs.forEach((h, i)  => { h.index = i; h.total = inputs.length; });
  outputs.forEach((h, i) => { h.index = i; h.total = outputs.length; });

  // hasInputs: true when unoccupied input proxy handles actually exist
  const hasInputs = inputs.length > 0;

  return { inputs, outputs, hasInputs };
}

export const GroupNode = memo((node: Node) => {
  const { data, selected, id } = node;
  const { nodes, updateNodeValue } = useStore(selector, shallow);
  const { setNodes, getNodes, getEdges, setEdges } = useReactFlow();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "Group");
  const collapsed = data.collapsed === true;
  const locked = data.locked === true;

  const childNodes = nodes.filter((n) => n.parentNode === id);
  const groupType = getGroupType(childNodes);
  const groupStyle = getGroupStyle(groupType);
  const color = groupStyle.color;
  const borderRadius = groupStyle.borderRadius;
  const borderStyle = collapsed ? "solid" : groupStyle.borderStyle;

  // proxy handles only while the group is expanded
  const { inputs: proxyInputs, outputs: proxyOutputs, hasInputs: groupHasInputs } = !collapsed
    ? getProxyHandles(childNodes, getEdges())
    : { inputs: [] as ProxyHandle[], outputs: [] as ProxyHandle[], hasInputs: false };

  const getChildBounds = useCallback(() => {
    const allNodes = getNodes();
    const children = allNodes.filter((n) => n.parentNode === id);
    if (children.length === 0) return null;

    // for subgroups use style.width/height, which is the real size rather than the collapsed one
    const getNodeWidth  = (n: Node) => (n.type === "groupNode"
      ? ((n.style?.width  as number) ?? n.width  ?? 100)
      : (n.width  ?? 100));
    const getNodeHeight = (n: Node) => (n.type === "groupNode"
      ? ((n.style?.height as number) ?? n.height ?? 100)
      : (n.height ?? 100));

    const minX = Math.min(...children.map((n) => n.position.x)) - 20;
    const minY = Math.min(...children.map((n) => n.position.y)) - 40;
    const maxX = Math.max(...children.map((n) => n.position.x + getNodeWidth(n)))  + 20;
    const maxY = Math.max(...children.map((n) => n.position.y + getNodeHeight(n))) + 20;

    return {
      width:  Math.max(maxX - minX, EXPANDED_MIN_WIDTH),
      height: Math.max(maxY - minY, EXPANDED_MIN_HEIGHT),
    };
  }, [id, getNodes]);

  const toggleCollapse = useCallback(() => {
    const newCollapsed = !collapsed;
    setNodes((nds: Node[]) => {
      // Alle Nachfahren-IDs rekursiv sammeln
      const getDescendants = (groupId: string): Set<string> => {
        const result = new Set<string>();
        const queue = [groupId];
        while (queue.length > 0) {
          const cur = queue.shift()!;
          for (const n of nds) {
            if (n.parentNode === cur) {
              result.add(n.id);
              if (n.type === "groupNode") queue.push(n.id);
            }
          }
        }
        return result;
      };
      const descendants = getDescendants(id);

      return nds.map((n) => {
        if (descendants.has(n.id)) {
          if (newCollapsed) {
            // collapsing: hide all descendants
            return { ...n, hidden: true };
          } else {
            // expanding: only reveal a node if its direct parent is not collapsed
            const parentNode = nds.find(p => p.id === n.parentNode);
            const parentIsCollapsed = parentNode?.data?.collapsed === true && parentNode?.id !== id;
            return { ...n, hidden: parentIsCollapsed };
          }
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
      });
    });
  }, [collapsed, id, setNodes, getChildBounds]);

  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newLocked = !locked;
    setNodes((nds: Node[]) =>
      nds.map((n) => {
        if (n.parentNode === id) return { ...n, draggable: !newLocked, connectable: !newLocked };
        if (n.id === id) return { ...n, data: { ...n.data, locked: newLocked } };
        return n;
      })
    );
  }, [locked, id, setNodes]);

  const handleUngroup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const groupNode = getNodes().find((n) => n.id === id);
    if (!groupNode) return;
    setNodes((nds: Node[]) =>
      nds.filter((n) => n.id !== id).map((n) => {
        if (n.parentNode === id) {
          return {
            ...n,
            parentNode: undefined,
            extent: undefined,
            hidden: false,
            draggable: true,
            connectable: true,
            position: {
              x: n.position.x + groupNode.position.x,
              y: n.position.y + groupNode.position.y,
            },
          };
        }
        // Clean up data.inputs references pointing at the now deleted group ID, e.g. when
        // this node was fed from the group through an output proxy handle. This mirrors the
        // cleanup in deleteNode in contextMenu.tsx; without it, stale entries remain and can
        // wrongly influence later connections and analyses.
        if (Array.isArray(n.data?.inputs) && n.data.inputs.some((inp: any) => inp?.id === id)) {
          return {
            ...n,
            data: {
              ...n.data,
              inputs: n.data.inputs.filter((inp: any) => inp?.id !== id),
            },
          };
        }
        return n;
      })
    );
    // Clean up external edges that pointed at the proxy handles of THE GROUP itself
    // (source/target === groupId). Without this they stay behind as stale entries in the
    // edge array even though the group no longer exists, and they block new connections to
    // the now independent child nodes, e.g. because a later edgeExists check wrongly treats
    // the same targetHandle as already occupied. Internal edges between the child nodes are
    // not affected and are kept unchanged.
    setEdges((eds: Edge[]) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [id, setNodes, setEdges, getNodes]);

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    updateNodeValue(id, "label", editableLabel);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  handleLabelBlur();
    if (e.key === "Escape") { setIsEditingLabel(false); setEditableLabel(data.label || "Group"); }
  };

  // distribute the handles evenly along the vertical axis
  const handleTop = (index: number, total: number): string => {
    if (total === 1) return "50%";
    const step = 70 / (total + 1);
    return `${15 + step * (index + 1)}%`;
  };

  // remote highlight: indicates whether another user currently has this node selected
  const [remoteHighlightColor, setRemoteHighlightColor] = useState<string | null>(null);
  const [_selectingUserName, setSelectingUserName] = useState<string | null>(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      awareness.getStates().forEach((state: any) => {
        if (state.cursor && state.cursor.selectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      setSelectingUserName(foundName);
    };

    checkRemoteSelection();
    awareness.on("change", checkRemoteSelection);
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]);

  return (
    <>
      <NodeResizer
        minWidth={collapsed ? 150 : Math.max(EXPANDED_MIN_WIDTH, (getChildBounds()?.width ?? EXPANDED_MIN_WIDTH))}
        minHeight={collapsed ? COLLAPSED_HEIGHT : Math.max(EXPANDED_MIN_HEIGHT, (getChildBounds()?.height ?? EXPANDED_MIN_HEIGHT))}
        isVisible={selected && !collapsed}
        lineStyle={{ borderColor: color }}
        handleStyle={{ borderColor: color, backgroundColor: "white" }}
      />

      <div
        style={{
          width: "100%", height: "100%",
          border: remoteHighlightColor ? `2px solid ${remoteHighlightColor}` : `2px ${borderStyle} ${color}`,
          borderRadius,
          backgroundColor: locked
            ? `${color}33`  // transparenter im Lock-Zustand
            : `${color}${collapsed ? "22" : "0d"}`,
          opacity: locked ? 0.75 : 1,
          position: "relative",
          transition: "height 0.2s ease, background-color 0.2s ease, opacity 0.2s ease",
          boxSizing: "border-box", overflow: "visible",
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}`
            : undefined,
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: `${color}33`,
            borderBottom: collapsed ? "none" : `1px dashed ${color}55`,
            borderRadius: collapsed ? borderRadius : `calc(${borderRadius} - 2px) calc(${borderRadius} - 2px) 0 0`,
            padding: "6px 10px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
            <span style={{
                  backgroundColor: color,
                  width: "20px",
                  height: "20px",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {groupType === "classical" ? (
                    // Zahnrad (Classical)
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  ) : (
                    // Atom (Quantum / Mixed)
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
                      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
                    </svg>
                  )}
            </span>
            {isEditingLabel ? (
              <input
                autoFocus value={editableLabel}
                onChange={(e) => setEditableLabel(e.target.value)}
                onBlur={handleLabelBlur} onKeyDown={handleLabelKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "18px", fontWeight: 600, color,
                  background: "transparent", border: "none",
                  borderBottom: `1px solid ${color}`, outline: "none",
                  flex: 1, minWidth: 0,
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "18px", fontWeight: 600, color,
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", flex: 1, cursor: "text",
                }}
                onDoubleClick={() => setIsEditingLabel(true)}
                title="Double-click to edit"
              >
                {data.label || "Group"}
              </span>
            )}
          </div>

          {collapsed && childNodes.length > 0 && (
            <span style={{ fontSize: "10px", color: `${color}99`, marginRight: "6px", flexShrink: 0 }}>
              {childNodes.length} Node{childNodes.length !== 1 ? "s" : ""}
            </span>
          )}

          <button onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
              backgroundColor: `${color}33`, color,
              border: `1px solid ${color}66`, cursor: "pointer", lineHeight: 1,
            }}
            title={collapsed ? "Expand" : "Collapse"}
          >{collapsed ? "▸" : "▾"}</button>

          <button onClick={handleToggleLock}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px",
              backgroundColor: locked ? `${color}33` : `${color}22`,
              color: color,
              border: `1px solid ${color}66`,
              cursor: "pointer", lineHeight: 1, marginLeft: "2px",
              opacity: locked ? 1 : 0.7,
            }}
            title={locked ? "Unlock group" : "Lock group"}
          >{locked ? "🔒" : "🔓"}</button>

          <button onClick={handleUngroup}
            style={{
              flexShrink: 0, width: "20px", height: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
              backgroundColor: "#fee2e2", color: "#ef4444",
              border: "1px solid #fca5a5", cursor: "pointer",
              lineHeight: 1, marginLeft: "4px",
            }}
            title="Ungroup"
          >×</button>
        </div>
      </div>

      {/* Proxy Input-Handles (links) */}
      {!collapsed && proxyInputs.length > 0 && proxyInputs.map((h) => (
        <Handle
          key={h.id}
          type="target"
          id={h.id}
          position={Position.Left}
          isConnectable={true}
          style={{
            top: handleTop(h.index, h.total),
            backgroundColor: h.color,
            border: "1px solid black",
            width: 13, height: 13, zIndex: 10,
            borderRadius: h.color === "#F5A843" ? "50%" : 0,
          }}
        />
      ))}

      {/* Proxy Output-Handles (rechts) */}
      {!collapsed && proxyOutputs.length > 0 && proxyOutputs.map((h) => (
        <Handle
          key={h.id}
          type="source"
          id={h.id}
          position={Position.Right}
          isConnectable={true}
          style={{
            top: handleTop(h.index, h.total),
            backgroundColor: h.color,
            border: "1px solid black",
            width: 13, height: 13, zIndex: 10,
            borderRadius: h.color === "#F5A843" ? "50%" : 0,
          }}
        />
      ))}

      {/* Fallback wenn keine Proxy-Handles */}
      {(collapsed || proxyInputs.length === 0) && groupHasInputs && (
        <Handle type="target" id={`groupInput0${id}`} position={Position.Left}
          isConnectable={true}
          style={{ top: "50%", backgroundColor: getHandleColor(`${groupType === "classical" ? "classical" : "quantum"}Handle`), border: "1px solid black", width: 13, height: 13, zIndex: 10, borderRadius: groupType === "classical" ? "50%" : 0 }}
        />
      )}
      {(collapsed || proxyOutputs.length === 0) && (
        <Handle type="source" id={`groupOutput0${id}`} position={Position.Right}
          isConnectable={true}
          style={{ top: "50%", backgroundColor: getHandleColor(`${groupType === "classical" ? "classical" : "quantum"}Handle`), border: "1px solid black", width: 13, height: 13, zIndex: 10, borderRadius: groupType === "classical" ? "50%" : 0 }}
        />
      )}
    </>
  );
});
