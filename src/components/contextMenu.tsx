import React, { useCallback, useEffect, useState } from "react";
import {
  useReactFlow,
  Node,
  useStore,
  useUpdateNodeInternals,
} from "reactflow";
import {
  FaTrash,
  FaCopy,
  FaPlus,
  FaMinus,
  FaReact,
  FaCaretRight,
} from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { v4 as uuid } from "uuid";
import { normalizeCustomOutputs } from "./utils/customOutputs";

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  onAction?: (action: string, nodeId: string) => void; // Optional callback for parent actions
  styles?: React.CSSProperties; // Optional styles for customization
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  id,
  top,
  left,
  onAction,
  styles = {},
}) => {
  const {
    getNode,
    getNodes,
    getEdges,
    setNodes,
    addNodes,
    setEdges,
    addEdges,
    getEdge,
  } = useReactFlow();
  // safe fallback: getNode(id) returns undefined for edge context menus
  const type = getNode(id)?.type || "edge";
  const updateNodeInternals = useUpdateNodeInternals();

  // all hooks must run unconditionally BEFORE any early return (rules of hooks)
  const node = useStore(
    useCallback((state) => state.nodeInternals.get(id), [id]),
  );
  const edge = getEdge(id);

  const regenerateIdentifiers = (data: any): any => {
    const normalized = { ...data };
    // normalize outputTypes/inputTypes/dataType
    if (Array.isArray(normalized.outputTypes))
      normalized.outputTypes = normalized.outputTypes.map((t: string) =>
        t.toLowerCase(),
      );
    if (Array.isArray(normalized.inputTypes))
      normalized.inputTypes = normalized.inputTypes.map((t: string) =>
        t.toLowerCase(),
      );
    if (typeof normalized.dataType === "string")
      normalized.dataType = normalized.dataType.toLowerCase();
    // generate new unique identifiers, matching the generator used in store.ts
    const newId = () => `q${Math.floor(100000 + Math.random() * 900000)}`;
    if (
      Array.isArray(normalized.identifiers) &&
      normalized.identifiers.length > 0
    ) {
      normalized.identifiers = normalized.identifiers.map(() => newId());
    }
    // Regenerate outputIdentifier if present
    if (
      normalized.outputIdentifier !== undefined &&
      normalized.outputIdentifier !== ""
    ) {
      normalized.outputIdentifier = newId();
    }
    // IMPORTANT: data.inputs/data.outputs track the incoming and outgoing connections
    // (id, edgeId, targetHandle - see the mapEdge fallback logic in backend.ts) of the
    // ORIGINAL node. A freshly duplicated node has no connections of its own yet; those
    // only appear once the user wires it up. Without resetting them here, the stale
    // reference to the original node survives and leads to a wrong register/identifier
    // assignment during backend compilation.
    if (Array.isArray(normalized.inputs)) {
      normalized.inputs = [];
    }
    if (Array.isArray(normalized.outputs)) {
      normalized.outputs = [];
    }
    return normalized;
  };

  const duplicateNode = useCallback(() => {
    const nodeToDuplicate = getNode(id);
    if (!nodeToDuplicate) return;

    const offset = { x: 50, y: 50 };

    if (nodeToDuplicate.type === "groupNode") {
      const allNodes = getNodes();
      const allEdges = getEdges();
      const childNodes = allNodes.filter((n) => n.parentNode === id);

      const newGroupId = uuid();
      const idMap = new Map<string, string>();
      idMap.set(id, newGroupId);
      childNodes.forEach((child) => idMap.set(child.id, uuid()));

      const newGroupNode: Node = {
        ...nodeToDuplicate,
        id: newGroupId,
        data: regenerateIdentifiers(nodeToDuplicate.data),
        position: {
          x: nodeToDuplicate.position.x + offset.x,
          y: nodeToDuplicate.position.y + offset.y,
        },
        selected: false,
      };

      const newChildNodes: Node[] = childNodes.map((child) => ({
        ...child,
        id: idMap.get(child.id)!,
        data: regenerateIdentifiers(child.data),
        parentNode: newGroupId,
        selected: false,
      }));

      const internalEdges = allEdges.filter(
        (e) => idMap.has(e.source) && idMap.has(e.target),
      );
      const newEdges = internalEdges.map((e) => ({
        ...e,
        id: uuid(),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        sourceHandle: e.sourceHandle?.replace(e.source, idMap.get(e.source)!),
        targetHandle: e.targetHandle?.replace(e.target, idMap.get(e.target)!),
        selected: false,
      }));

      addNodes([newGroupNode, ...newChildNodes]);
      addEdges(newEdges);
    } else {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: uuid(),
        data: regenerateIdentifiers(nodeToDuplicate.data),
        position: {
          x: nodeToDuplicate.position.x + offset.x,
          y: nodeToDuplicate.position.y + offset.y,
        },
        selected: false,
      };
      addNodes([newNode]);
    }

    if (onAction) onAction("duplicate", id);
  }, [id, getNode, getNodes, getEdges, addNodes, addEdges, onAction]);

  const deleteNode = useCallback(() => {
    const allNodes = getNodes();
    // collect all descendants recursively (subgroups inside groups, etc.)
    const idsToDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      allNodes.forEach((n) => {
        if (
          n.parentNode &&
          idsToDelete.has(n.parentNode) &&
          !idsToDelete.has(n.id)
        ) {
          idsToDelete.add(n.id);
          changed = true;
        }
      });
    }
    // Remove nodes and edges atomically in a single step. The extra "e.id !== id" check
    // covers the case where "id" is itself an edge ID (the menu was opened through
    // onEdgeContextMenu), because none of the node-based filters above would match then.
    //
    // IMPORTANT: this path uses the raw setNodes/setEdges from useReactFlow() and
    // therefore bypasses the onEdgesChange cleanup in the Zustand store, which only runs
    // for keyboard deletion via onNodesChange/onEdgesChange. Without the cleanup below,
    // remaining nodes keep data.inputs entries pointing at the deleted IDs, which caused
    // follow-up errors such as blocked new connections and duplicate groups in the
    // component analysis.
    setNodes((nodes) =>
      nodes
        .filter((n) => !idsToDelete.has(n.id))
        .map((n) => {
          if (!Array.isArray(n.data?.inputs)) return n;
          const hasStaleInput = n.data.inputs.some((inp: any) =>
            idsToDelete.has(inp?.id),
          );
          if (!hasStaleInput) return n;
          return {
            ...n,
            data: {
              ...n.data,
              inputs: n.data.inputs.filter(
                (inp: any) => !idsToDelete.has(inp?.id),
              ),
            },
          };
        }),
    );
    setEdges((edges) =>
      edges.filter(
        (e) =>
          !idsToDelete.has(e.source) &&
          !idsToDelete.has(e.target) &&
          e.id !== id,
      ),
    );
    if (onAction) onAction("delete", id);
  }, [id, getNodes, setNodes, setEdges, onAction]);

  // TODO: use the correct field (numberInputs for merger nodes) - pass it as an argument?
  const incrementNodeDataField = useCallback(
    (field: string, min_value: number) => {
      const currentNode = getNode(id);
      const isOutputField = field.includes("Outputs");
      const outputType = field.includes("Quantum") ? "quantum" : "classical";
      console.log(
        "[INCREMENT] field value",
        field,
        "field value type",
        typeof currentNode.data[field],
      );
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...(isOutputField &&
                  (n.type === "algorithmNode" ||
                    n.type === "classicalAlgorithmNode")
                    ? {
                        outputs: [
                          ...normalizeCustomOutputs(
                            n.data.outputs,
                            Number(n.data.numberQuantumOutputs || 0),
                            Number(n.data.numberClassicalOutputs || 0),
                          ),
                          {
                            identifier: "",
                            size: "",
                            type: outputType,
                          },
                        ],
                      }
                    : {}),
                  [field]: n.data[field]
                    ? Number(n.data[field]) + 1
                    : min_value + 1,
                },
              }
            : n,
        ),
      );
      updateNodeInternals(id);
    },
    [id, getNode, setNodes, onAction],
  );

  const decrementNodeDataField = useCallback(
    (field: string, min_value: number) => {
      const currentNode = getNode(id);
      const nextValue = Math.max(
        min_value,
        Number(currentNode.data[field] || 0) - 1,
      );
      const isInput = field.includes("Inputs");
      const portType = field.includes("Quantum") ? "quantum" : "classical";
      const handlePrefix = isInput
        ? `${portType}HandleOperationInput`
        : `${portType}Handle${currentNode.type}Output`;
      const removedHandle = `${handlePrefix}${nextValue}${id}`;
      const removedEdgeIds = new Set(
        getEdges()
          .filter(
            (candidateEdge) =>
              candidateEdge.targetHandle === removedHandle ||
              candidateEdge.sourceHandle === removedHandle,
          )
          .map((removedEdge) => removedEdge.id),
      );

      setEdges((edges) =>
        edges.filter(
          (remainingEdge) =>
            remainingEdge.targetHandle !== removedHandle &&
            remainingEdge.sourceHandle !== removedHandle,
        ),
      );

      console.log(
        "[DECREMENT] field value",
        currentNode.data[field],
        "field value type",
        typeof currentNode.data[field],
      );
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  [field]: nextValue,
                  ...(isInput
                    ? {
                        inputs: (n.data.inputs || []).filter(
                                (input: any) =>
                                  input.targetHandle !== removedHandle &&
                                  !removedEdgeIds.has(input.edgeId),
                        ),
                      }
                    : {
                        outputs: (() => {
                          let seen = 0;
                          const outputs = normalizeCustomOutputs(
                            n.data.outputs,
                            Number(n.data.numberQuantumOutputs || 0),
                            Number(n.data.numberClassicalOutputs || 0),
                          );
                          return outputs.filter(
                            (output: any) =>
                              output?.type !== portType || seen++ < nextValue,
                          );
                        })(),
                      }),
                },
              }
            : n,
        ),
      );
      updateNodeInternals(id);
    },
    [id, getNode, setNodes, onAction],
  );

  const [submenuInputAddOpen, setSubmenuInputAddOpen] = useState(false);
  const [submenuInputRemoveOpen, setSubmenuInputRemoveOpen] = useState(false);
  const [submenuOutputAddOpen, setSubmenuOutputAddOpen] = useState(false);
  const [submenuOutputRemoveOpen, setSubmenuOutputRemoveOpen] = useState(false);
  // syncing effects, kept before any early return (rules of hooks)
  useEffect(() => {
    if (id) updateNodeInternals(id);
  }, [id, node?.data, updateNodeInternals]);

  useEffect(() => {
    if (node?.id) {
      updateNodeInternals(node.id);
    }
  }, [node?.id, node?.data?.["numberClassicalInputs"], updateNodeInternals]);

  const _toggleSubmenuInputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuInputAddOpen((prev) => !prev);
  }, []);

  const toggleSubmenuInputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuInputRemoveOpen((prev) => !prev);
  }, []);

  const _toggleSubmenuOutputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuOutputAddOpen((prev) => !prev);
  }, []);

  const _toggleSubmenuOutputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuOutputRemoveOpen((prev) => !prev);
  }, []);

  // hoveredBtn is a hook and must be declared BEFORE the early return below;
  // hoverProps itself is a plain function and may live anywhere.
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // safe to bail out now if neither a node nor an edge exists,
  // e.g. during a render right after the element was deleted
  if (!node && !edge) return null;

  let minInput = 0;
  let minOutput = 0;

  if (type === "mergerNode" || type === "splitterNode") {
    minInput = 2;
    minOutput = 2;
  } else if (type === "ifElseNode" || type === "controlStructureNode") {
    minInput = 1;
  }

  // optional chaining: id may be an edge ID, in which case node is undefined
  const quantumInputs = Number(node?.data["numberQuantumInputs"] ?? 0);
  const hasQuantumInputs = quantumInputs > minInput || false;
  const hasClassicalInputs =
    node?.data["numberClassicalInputs"] > minInput || false;
  const hasQuantumOutputs =
    node?.data["numberQuantumOutputs"] > minOutput || false;
  const hasClassicalOutputs =
    node?.data["numberClassicalOutputs"] > minOutput || false;
  const hasInputs = node?.data["numberInputs"] > minInput || false;
  const hasOutputs = node?.data["numberOutputs"] > minOutput || false;

  const hoverProps = (key: string, isDanger = false) => ({
    onMouseEnter: () => setHoveredBtn(key),
    onMouseLeave: () => setHoveredBtn(null),
    style: {
      ...(isDanger ? deleteButtonStyle : buttonStyle),
      backgroundColor:
        hoveredBtn === key ? (isDanger ? "#fef2f2" : "#f3f4f6") : "transparent",
    },
  });

  let buttons = [];
  // duplicating only makes sense for nodes; edges can only be deleted
  if (type !== "edge") {
    buttons.push(
      <button
        key="duplicate"
        onClick={duplicateNode}
        aria-label="Duplicate Node"
        {...hoverProps("duplicate")}
      >
        <FaCopy style={iconStyle} /> Duplicate
      </button>,
    );
  }
  buttons.push(
    <React.Fragment key="delete-section">
      <div
        style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "4px 0" }}
      />
      <button
        onClick={deleteNode}
        aria-label={type === "edge" ? "Delete Edge" : "Delete Node"}
        {...hoverProps("delete", true)}
      >
        <FaTrash style={iconStyle} /> Delete
      </button>
    </React.Fragment>,
  );

  if (type === "ifElseNode" || type === "controlStructureNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setSubmenuInputAddOpen(true)}
          onMouseLeave={() => setSubmenuInputAddOpen(false)}
        >
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaPlus style={iconStyle} /> Add Input
            </span>{" "}
            <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div style={submenuStyle}>
              <button
                onClick={() => incrementNodeDataField("numberQuantumInputs", 1)}
                style={buttonStyle}
                aria-label="Add Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() =>
                  incrementNodeDataField("numberClassicalInputs", 1)
                }
                style={buttonStyle}
                aria-label="Add Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setSubmenuInputRemoveOpen(true)}
            onMouseLeave={() => setSubmenuInputRemoveOpen(false)}
          >
            <button
              style={{
                ...buttonStyle,
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaMinus style={iconStyle} /> Remove Input{" "}
              </span>{" "}
              <FaCaretRight />
            </button>
            {submenuInputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumInputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberQuantumInputs", 1)
                    }
                    style={buttonStyle}
                    aria-label="Remove Quantum Input"
                  >
                    <FaReact style={iconStyle} /> Quantum
                  </button>
                )}
                {hasClassicalInputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberClassicalInputs", 1)
                    }
                    style={buttonStyle}
                    aria-label="Remove Classical Input"
                  >
                    <FaGear style={iconStyle} /> Classical
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {buttons}
      </div>
    );
  } else if (type === "algorithmNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setSubmenuInputAddOpen(true)}
          onMouseLeave={() => setSubmenuInputAddOpen(false)}
        >
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaPlus style={iconStyle} /> Add Input
            </span>{" "}
            <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div style={submenuStyle}>
              <button
                onClick={() => incrementNodeDataField("numberQuantumInputs", 0)}
                style={buttonStyle}
                aria-label="Add Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() =>
                  incrementNodeDataField("numberClassicalInputs", 0)
                }
                style={buttonStyle}
                aria-label="Add Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setSubmenuOutputAddOpen(true)}
          onMouseLeave={() => setSubmenuOutputAddOpen(false)}
        >
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaPlus style={iconStyle} /> Add Output
            </span>{" "}
            <FaCaretRight />
          </button>
          {submenuOutputAddOpen && (
            <div style={submenuStyle}>
              <button
                onClick={() =>
                  incrementNodeDataField("numberQuantumOutputs", 0)
                }
                style={buttonStyle}
                aria-label="Add Quantum Output"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() =>
                  incrementNodeDataField("numberClassicalOutputs", 0)
                }
                style={buttonStyle}
                aria-label="Add Classical Output"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setSubmenuInputRemoveOpen(true)}
            onMouseLeave={() => setSubmenuInputRemoveOpen(false)}
          >
            <button
              onClick={toggleSubmenuInputRemove}
              style={{
                ...buttonStyle,
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaMinus style={iconStyle} /> Remove Input{" "}
              </span>{" "}
              <FaCaretRight />
            </button>
            {submenuInputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumInputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberQuantumInputs", 0)
                    }
                    style={buttonStyle}
                    aria-label="Remove Quantum Input"
                  >
                    <FaReact style={iconStyle} /> Quantum
                  </button>
                )}
                {hasClassicalInputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberClassicalInputs", 0)
                    }
                    style={buttonStyle}
                    aria-label="Remove Classical Input"
                  >
                    <FaGear style={iconStyle} /> Classical
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {(hasQuantumOutputs || hasClassicalOutputs) && (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setSubmenuOutputRemoveOpen(true)}
            onMouseLeave={() => setSubmenuOutputRemoveOpen(false)}
          >
            <button
              onClick={toggleSubmenuInputRemove}
              style={{
                ...buttonStyle,
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaMinus style={iconStyle} /> Remove Output{" "}
              </span>{" "}
              <FaCaretRight />
            </button>
            {submenuOutputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumOutputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberQuantumOutputs", 0)
                    }
                    style={buttonStyle}
                    aria-label="Remove Quantum Output"
                  >
                    <FaReact style={iconStyle} /> Quantum
                  </button>
                )}
                {hasClassicalOutputs && (
                  <button
                    onClick={() =>
                      decrementNodeDataField("numberClassicalOutputs", 0)
                    }
                    style={buttonStyle}
                    aria-label="Remove Classical Output"
                  >
                    <FaGear style={iconStyle} /> Classical
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {buttons}
      </div>
    );
  } else if (type === "classicalAlgorithmNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div>
          <button
            onClick={() => incrementNodeDataField("numberClassicalInputs", 0)}
            style={buttonStyle}
            aria-label="Add Classical Input"
          >
            <FaPlus style={iconStyle} /> Add Classical Input
          </button>
          <button
            onClick={() => incrementNodeDataField("numberClassicalOutputs", 0)}
            style={buttonStyle}
            aria-label="Add Classical Output"
          >
            <FaPlus style={iconStyle} /> Add Classical Output
          </button>
          {hasClassicalInputs && (
            <button
              onClick={() => decrementNodeDataField("numberClassicalInputs", 0)}
              style={buttonStyle}
              aria-label="Remove Classical Input"
            >
              <FaMinus style={iconStyle} /> Remove Classical Input
            </button>
          )}
          {hasClassicalOutputs && (
            <button
              onClick={() =>
                decrementNodeDataField("numberClassicalOutputs", 0)
              }
              style={buttonStyle}
              aria-label="Remove Classical Output"
            >
              <FaMinus style={iconStyle} /> Remove Classical Output
            </button>
          )}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else if (type === "mergerNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div>
          <button
            onClick={() => incrementNodeDataField("numberInputs", 2)}
            style={buttonStyle}
            aria-label="Add Input"
          >
            <FaPlus style={iconStyle} /> Add Input
          </button>
          {hasInputs && (
            <button
              onClick={() => decrementNodeDataField("numberInputs", 0)}
              style={buttonStyle}
              aria-label="Remove Input"
            >
              <FaMinus style={iconStyle} /> Remove Input
            </button>
          )}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else if (type === "splitterNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div>
          <button
            onClick={() => incrementNodeDataField("numberOutputs", 2)}
            style={buttonStyle}
            aria-label="Add Output"
          >
            <FaPlus style={iconStyle} /> Add Output
          </button>
          {hasOutputs && (
            <button
              onClick={() => decrementNodeDataField("numberOutputs", 2)}
              style={buttonStyle}
              aria-label="Remove Output"
            >
              <FaMinus style={iconStyle} /> Remove Output
            </button>
          )}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else if (type === "edge") {
    return (
      <div
        style={{
          position: "absolute",
          top,
          left,
          ...styles,
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
        className="context-menu"
      >
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}>
          <small>Edge: {id}</small>
        </p>
        <div>{buttons}</div>
      </div>
    );
  } else {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >
        <div>{buttons}</div>
      </div>
    );
  }
};

const buttonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#333",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  padding: "8px 12px",
  width: "100%",
  textAlign: "left",
  borderRadius: "6px",
  transition: "background-color 0.15s ease, color 0.15s ease",
  gap: "8px",
};

const deleteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: "#dc2626",
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
  padding: "6px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  minWidth: "160px",
};

const iconStyle: React.CSSProperties = {
  marginRight: "8px",
  fontSize: "16px",
};

const submenuStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "100%",
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  padding: "10px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
};
