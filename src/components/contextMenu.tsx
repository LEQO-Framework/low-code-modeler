import React, { useCallback, useEffect, useState } from "react";
import {
  useReactFlow,
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
import { awareness } from "@/yjs";

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  onAction?: (action: string, nodeId: string) => void;
  styles?: React.CSSProperties;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  id,
  top,
  left,
  right,
  bottom,
  onAction,
  styles = {},
}) => {
  const { setNodes, setEdges, addNodes, addEdges, getNodes, getEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  // All hooks must be defined unconditionally at the top
  const node = useStore(
    useCallback((state) => state.nodeInternals.get(id), [id])
  );

  const [submenuInputAddOpen, setSubmenuInputAddOpen] = useState(false);
  const [submenuInputRemoveOpen, setSubmenuInputRemoveOpen] = useState(false);
  const [submenuOutputAddOpen, setSubmenuOutputAddOpen] = useState(false);
  const [submenuOutputRemoveOpen, setSubmenuOutputRemoveOpen] = useState(false);

  // Safely grab initial inputs using optional chaining since node might be null initially
  const [inputs] = useState(() => node?.data?.inputs ?? []);

  // Syncing effects (Must stay above early return)
  useEffect(() => {
    if (id) updateNodeInternals(id);
  }, [id, node?.data, updateNodeInternals]);

  useEffect(() => {
    if (node?.id) {
      updateNodeInternals(node.id);
      console.log("update handles");
    }
  }, [node?.id, node?.data?.[ "numberClassicalInputs" ], updateNodeInternals]);

  // Callbacks (Must stay above early return)
  const duplicateNode = useCallback(() => {
    if (!node) return;
    const offset = { x: 50, y: 50 };

    if (node.type === "groupNode") {
      // Gruppe duplizieren: GroupNode + alle Kind-Nodes + interne Edges
      const allNodes = getNodes();
      const allEdges = getEdges();
      const childNodes = allNodes.filter((n) => n.parentNode === id);

      // Neue IDs erstellen
      const newGroupId = uuid();
      const idMap = new Map<string, string>();
      idMap.set(id, newGroupId);
      childNodes.forEach((child) => idMap.set(child.id, uuid()));

      // GroupNode duplizieren
      const newGroupNode = {
        ...node,
        id: newGroupId,
        position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
        selected: false,
      };

      // Kind-Nodes duplizieren
      const newChildNodes = childNodes.map((child) => ({
        ...child,
        id: idMap.get(child.id)!,
        parentNode: newGroupId,
        selected: false,
      }));

      // Interne Edges duplizieren (beide Seiten innerhalb der Gruppe)
      const internalEdges = allEdges.filter(
        (e) => idMap.has(e.source) && idMap.has(e.target)
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
      // Normaler Node
      const randomId = uuid();
      addNodes([
        {
          ...node,
          id: randomId,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
        },
      ]);
    }

    onAction?.("duplicate", id);
  }, [node, id, getNodes, getEdges, addNodes, addEdges, onAction]);

  const deleteNode = useCallback(() => {
    const myCursor = awareness.getLocalState()?.cursor;
    if (myCursor?.mySelectedNodeId !== id) return;

    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) => edges.filter((e) => e.source !== id));

    onAction?.("delete", id);
  }, [id, setNodes, setEdges, onAction]);

  const incrementNodeDataField = useCallback(
    (field: string, min: number) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  [field]: Number(n.data?.[field] ?? min) + 1,
                },
              }
            : n
        )
      );
      updateNodeInternals(id);
    },
    [id, setNodes, updateNodeInternals]
  );

  const decrementNodeDataField = useCallback(
    (field: string, min: number) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  [field]: Math.max(Number(n.data?.[field] ?? min), min) - 1,
                },
              }
            : n
        )
      );
      updateNodeInternals(id);
    },
    [id, setNodes, updateNodeInternals]
  );

  const toggleSubmenuInputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuInputAddOpen(prev => !prev);
  }, []);

  const toggleSubmenuInputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuInputRemoveOpen(prev => !prev);
  }, []);

  const toggleSubmenuOutputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuOutputAddOpen(prev => !prev);
  }, []);

  const toggleSubmenuOutputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmenuOutputRemoveOpen(prev => !prev);
  }, []);


  // 2. NOW it is completely safe to exit early if node data isn't ready
  if (!node) return null;

  // Variables dependent on node existence
  const type = node.type;
  let minInput = 0;
  let minOutput = 0;

  if (type === "mergerNode" || type === "splitterNode") {
    minInput = 2;
    minOutput = 2;
  } else if (type === "ifElseNode" || type === "controlStructureNode") {
    minInput = 1;
  }

  // Answer to your code comment question: 
  // If the field is missing, fallback defaults (?? 0) handle it cleanly now.
  const quantumInputs = Number(node.data["numberQuantumInputs"] ?? 0);
  const hasQuantumInputs = quantumInputs > minInput;
  const hasClassicalInputs = (node.data["numberClassicalInputs"] ?? 0) > minInput;
  const hasQuantumOutputs = (node.data["numberQuantumOutputs"] ?? 0) > minOutput;
  const hasClassicalOutputs = (node.data["numberClassicalOutputs"] ?? 0) > minOutput;
  const hasInputs = (node.data["numberInputs"] ?? 0) > minInput;
  const hasOutputs = (node.data["numberOutputs"] ?? 0) > minOutput;

  let buttons = [
    <button key="duplicate" onClick={duplicateNode} style={buttonStyle} aria-label="Duplicate Node">
      <FaCopy style={iconStyle} /> Duplicate
    </button>,
    <button key="delete" onClick={deleteNode} style={buttonStyle} aria-label="Delete Node">
      <FaTrash style={iconStyle} /> Delete
    </button>
  ];

  if (type === "ifElseNode" || type === "controlStructureNode") {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuInputAddOpen(true)} onMouseLeave={() => setSubmenuInputAddOpen(false)}>
          <button style={{ ...buttonStyle, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center" }}><FaPlus style={iconStyle} /> Add Input</span> <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div style={submenuStyle}>
              <button onClick={() => incrementNodeDataField("numberQuantumInputs", 1)} style={buttonStyle} aria-label="Add Quantum Input"><FaReact style={iconStyle} /> Quantum</button>
              <button onClick={() => incrementNodeDataField("numberClassicalInputs", 1)} style={buttonStyle} aria-label="Add Classical Input"><FaGear style={iconStyle} /> Classical</button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && (
          <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuInputRemoveOpen(true)} onMouseLeave={() => setSubmenuInputRemoveOpen(false)}>
            <button style={{ ...buttonStyle, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center" }}><FaMinus style={iconStyle} /> Remove Input </span> <FaCaretRight />
            </button>
            {submenuInputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumInputs && <button onClick={() => decrementNodeDataField("numberQuantumInputs", 1)} style={buttonStyle} aria-label="Remove Quantum Input"><FaReact style={iconStyle} /> Quantum</button>}
                {hasClassicalInputs && <button onClick={() => decrementNodeDataField("numberClassicalInputs", 1)} style={buttonStyle} aria-label="Remove Classical Input"><FaGear style={iconStyle} /> Classical</button>}
              </div>
            )}
          </div>
        )}
        {buttons}
      </div>
    );
  } else if (type === "algorithmNode") {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuInputAddOpen(true)} onMouseLeave={() => setSubmenuInputAddOpen(false)}>
          <button style={{ ...buttonStyle, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center" }}><FaPlus style={iconStyle} /> Add Input</span> <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div style={submenuStyle}>
              <button onClick={() => incrementNodeDataField("numberQuantumInputs", 0)} style={buttonStyle} aria-label="Add Quantum Input"><FaReact style={iconStyle} /> Quantum</button>
              <button onClick={() => incrementNodeDataField("numberClassicalInputs", 0)} style={buttonStyle} aria-label="Add Classical Input"><FaGear style={iconStyle} /> Classical</button>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuOutputAddOpen(true)} onMouseLeave={() => setSubmenuOutputAddOpen(false)}>
          <button style={{ ...buttonStyle, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center" }}><FaPlus style={iconStyle} /> Add Output</span> <FaCaretRight />
          </button>
          {submenuOutputAddOpen && (
            <div style={submenuStyle}>
              <button onClick={() => incrementNodeDataField("numberQuantumOutputs", 0)} style={buttonStyle} aria-label="Add Quantum Output"><FaReact style={iconStyle} /> Quantum</button>
              <button onClick={() => incrementNodeDataField("numberClassicalOutputs", 0)} style={buttonStyle} aria-label="Add Classical Output"><FaGear style={iconStyle} /> Classical</button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && (
          <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuInputRemoveOpen(true)} onMouseLeave={() => setSubmenuInputRemoveOpen(false)}>
            <button onClick={toggleSubmenuInputRemove} style={{ ...buttonStyle, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center" }}><FaMinus style={iconStyle} /> Remove Input </span> <FaCaretRight />
            </button>
            {submenuInputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumInputs && <button onClick={() => decrementNodeDataField("numberQuantumInputs", 0)} style={buttonStyle} aria-label="Remove Quantum Input"><FaReact style={iconStyle} /> Quantum</button>}
                {hasClassicalInputs && <button onClick={() => decrementNodeDataField("numberClassicalInputs", 0)} style={buttonStyle} aria-label="Remove Classical Input"><FaGear style={iconStyle} /> Classical</button>}
              </div>
            )}
          </div>
        )}
        {(hasQuantumOutputs || hasClassicalOutputs) && (
          <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenuOutputRemoveOpen(true)} onMouseLeave={() => setSubmenuOutputRemoveOpen(false)}>
            <button onClick={toggleSubmenuOutputRemove} style={{ ...buttonStyle, justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center" }}><FaMinus style={iconStyle} /> Remove Output </span> <FaCaretRight />
            </button>
            {submenuOutputRemoveOpen && (
              <div style={submenuStyle}>
                {hasQuantumOutputs && <button onClick={() => decrementNodeDataField("numberQuantumOutputs", 0)} style={buttonStyle} aria-label="Remove Quantum Output"><FaReact style={iconStyle} /> Quantum</button>}
                {hasClassicalOutputs && <button onClick={() => decrementNodeDataField("numberClassicalOutputs", 0)} style={buttonStyle} aria-label="Remove Classical Output"><FaGear style={iconStyle} /> Classical</button>}
              </div>
            )}
          </div>
        )}
        {buttons}
      </div>
    );
  } else if (type === "classicalAlgorithmNode") {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div>
          <button onClick={() => incrementNodeDataField("numberClassicalInputs", 0)} style={buttonStyle} aria-label="Add Classical Input"><FaPlus style={iconStyle} /> Add Classical Input</button>
          <button onClick={() => incrementNodeDataField("numberClassicalOutputs", 0)} style={buttonStyle} aria-label="Add Classical Output"><FaPlus style={iconStyle} /> Add Classical Output</button>
          {hasClassicalInputs && <button onClick={() => decrementNodeDataField("numberClassicalInputs", 0)} style={buttonStyle} aria-label="Remove Classical Input"><FaMinus style={iconStyle} /> Remove Classical Input</button>}
          {hasClassicalOutputs && <button onClick={() => decrementNodeDataField("numberClassicalOutputs", 0)} style={buttonStyle} aria-label="Remove Classical Output"><FaMinus style={iconStyle} /> Remove Classical Output</button>}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else if (type === "mergerNode") {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div>
          <button onClick={() => incrementNodeDataField("numberInputs", 2)} style={buttonStyle} aria-label="Add Input"><FaPlus style={iconStyle} /> Add Input</button>
          {hasInputs && <button onClick={() => decrementNodeDataField("numberInputs", 0)} style={buttonStyle} aria-label="Remove Input"><FaMinus style={iconStyle} /> Remove Input</button>}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else if (type === "splitterNode") {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div>
          <button onClick={() => incrementNodeDataField("numberOutputs", 2)} style={buttonStyle} aria-label="Add Output"><FaPlus style={iconStyle} /> Add Output</button>
          {hasOutputs && <button onClick={() => decrementNodeDataField("numberOutputs", 2)} style={buttonStyle} aria-label="Remove Output"><FaMinus style={iconStyle} /> Remove Output</button>}
        </div>
        <div>{buttons}</div>
      </div>
    );
  } else {
    return (
      <div style={{ position: "absolute", top, left, ...styles, backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column" }} className="context-menu">
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}><small>Node: {id}</small></p>
        <div>{buttons}</div>
      </div>
    );
  }
};

// Styles remain unchanged
const buttonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#333",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  padding: "8px 0",
  width: "100%",
  textAlign: "left",
  borderRadius: "4px",
  transition: "background-color 0.3s ease",
};

const iconStyle: React.CSSProperties = {
  marginRight: "8px",
  fontSize: "16px",
};

const submenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: '100%',
  backgroundColor: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  padding: "10px",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
};