import React, { useCallback, useEffect, useState } from "react";
import { useReactFlow, Node, useStore, useUpdateNodeInternals } from "reactflow";
import { FaTrash, FaCopy, FaPlus, FaMinus, FaReact, FaCaretRight } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { v4 as uuid } from "uuid";
import { Button } from "./ui";
import { IPortData } from "@/components/nodes/model";
import { MergerNode } from "@/constants";

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  onAction?: (action: string, nodeId: string) => void; // Optional callback for parent actions
  styles?: React.CSSProperties; // Optional styles for customization
}

const generateRandomId = () => {
  return `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
};



export const ContextMenu: React.FC<ContextMenuProps> = ({
  id,
  top,
  left,
  right,
  bottom,
  onAction,
  styles = {}, // Default styles as an empty object
}) => {
  const { getNode, getNodes, getEdges, setNodes, addNodes, setEdges, addEdges } = useReactFlow();
  const type = getNode(id).type
  console.log("type", type)
  const [inputs, setInputs] = useState(getNode(id).data.inputs || []);
  const updateNodeInternals = useUpdateNodeInternals();

  const regenerateIdentifiers = (data: any): any => {
    const normalized = { ...data };
    // outputTypes/inputTypes/dataType normalisieren
    if (Array.isArray(normalized.outputTypes))
      normalized.outputTypes = normalized.outputTypes.map((t: string) => t.toLowerCase());
    if (Array.isArray(normalized.inputTypes))
      normalized.inputTypes = normalized.inputTypes.map((t: string) => t.toLowerCase());
    if (typeof normalized.dataType === "string")
      normalized.dataType = normalized.dataType.toLowerCase();
    // Neue eindeutige Identifier generieren (exakt wie store.ts Zeile 167ff)
    const newId = () => `q${Math.floor(100000 + Math.random() * 900000)}`;
    if (Array.isArray(normalized.identifiers) && normalized.identifiers.length > 0) {
      normalized.identifiers = normalized.identifiers.map(() => newId());
    }
    // outputIdentifier neu generieren falls vorhanden
    if (normalized.outputIdentifier !== undefined && normalized.outputIdentifier !== "") {
      normalized.outputIdentifier = newId();
    }
    // WICHTIG: data.inputs/data.outputs tracken eingehende/ausgehende Verbindungen
    // (id, edgeId, targetHandle - siehe backend.ts mapEdge Fallback-Logik) des
    // ORIGINAL-Node. Ein frisch duplizierter Node hat noch KEINE eigenen Verbindungen -
    // die entstehen erst, wenn der Nutzer ihn neu verkabelt. Ohne dieses Zurücksetzen
    // bleibt die alte Referenz auf den Original-Node bestehen und führt bei der
    // Backend-Kompilierung zu falscher Register-/Identifier-Zuordnung.
    if (Array.isArray(normalized.inputs)) {
      normalized.inputs = [];
    }
    if (Array.isArray(normalized.outputs)) {
      normalized.outputs = [];
    }
    return normalized;
  };

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const offset = { x: 50, y: 50 };

    if (node.type === "groupNode") {
      const allNodes = getNodes();
      const allEdges = getEdges();
      const childNodes = allNodes.filter(n => n.parentNode === id);

      const newGroupId = uuid();
      const idMap = new Map<string, string>();
      idMap.set(id, newGroupId);
      childNodes.forEach(child => idMap.set(child.id, uuid()));

      const newGroupNode: Node = {
        ...node,
        id: newGroupId,
        data: regenerateIdentifiers(node.data),
        position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
        selected: false,
      };

      const newChildNodes: Node[] = childNodes.map(child => ({
        ...child,
        id: idMap.get(child.id)!,
        data: regenerateIdentifiers(child.data),
        parentNode: newGroupId,
        selected: false,
      }));

      const internalEdges = allEdges.filter(
        e => idMap.has(e.source) && idMap.has(e.target)
      );
      const newEdges = internalEdges.map(e => ({
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
        ...node,
        id: uuid(),
        data: regenerateIdentifiers(node.data),
        position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
        selected: false,
      };
      addNodes([newNode]);
    }

    if (onAction) onAction("duplicate", id);
  }, [id, getNode, getNodes, getEdges, addNodes, addEdges, onAction]);

  const deleteNode = useCallback(() => {
    const allNodes = getNodes();
    // Rekursiv alle Nachkommen sammeln (Subgruppen in Gruppen etc.)
    const idsToDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      allNodes.forEach(n => {
        if (n.parentNode && idsToDelete.has(n.parentNode) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          changed = true;
        }
      });
    }
    // Nodes und Edges atomar in einem Schritt entfernen
    setNodes((nodes) => nodes.filter((n) => !idsToDelete.has(n.id)));
    setEdges((edges) => edges.filter(
      (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)
    ));
    if (onAction) onAction("delete", id);
  }, [id, getNodes, setNodes, setEdges, onAction]);

  const incrementNodeDataField = useCallback((field: string, min_value: number) => { //TODO: richtiges Feld verwenden (bei merger: numberInputs) --> Feld als Argument übergeben?
    const node = getNode(id);
    //const field = "numberQuantumInputs";
    console.log("[INCREMENT] field value", field, "field value type", typeof node.data[field])
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, [field]: n.data[field] ? Number(n.data[field]) + 1 : min_value + 1 } }
          : n
      )
    );
    updateNodeInternals(id);
  }, [id, getNode, setNodes, onAction]);


  const decrementNodeDataField = useCallback((field: string, min_value: number) => {
    const node = getNode(id);
    console.log("[DECREMENT] field value", node.data[field], "field value type", typeof node.data[field])
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, [field]: Number(n.data[field]) > min_value ? Number(n.data[field]) - 1 : min_value } }
          : n
      )
    );
    updateNodeInternals(id);
  }, [id, getNode, setNodes, onAction]);
  
  const [submenuInputAddOpen, setSubmenuInputAddOpen] = useState(false);
  const [submenuInputRemoveOpen, setSubmenuInputRemoveOpen] = useState(false);
  const [submenuOutputAddOpen, setSubmenuOutputAddOpen] = useState(false);
  const [submenuOutputRemoveOpen, setSubmenuOutputRemoveOpen] = useState(false);
  var minInput = 0;
  var minOutput = 0;
  if (type === "mergerNode" || type === "splitterNode") {
    minInput = 2;
    minOutput = 2;
  } else if (type === "ifElseNode" || type === "controlStructureNode") {
    minInput = 1;
  }

  const node = useStore(
    useCallback((state) => state.nodeInternals.get(id), [id])
  );

  
  const quantumInputs =
    Number(node.data["numberQuantumInputs"] ?? 0);
  const hasQuantumInputs = quantumInputs > minInput // what happens if node has no filed numQuantumInputs?
  const hasClassicalInputs = node.data["numberClassicalInputs"] > minInput
  const hasQuantumOutputs = node.data["numberQuantumOutputs"] > minOutput // what happens if node has no filed numQuantumInputs?
  const hasClassicalOutputs = node.data["numberClassicalOutputs"] > minOutput
  const hasInputs = node.data["numberInputs"] > minInput
  const hasOutputs = node.data["numberOutputs"] > minOutput

  const hasQFTInputs = node.data["numberOutputs"] > minInput

  console.log("contextMenu")
  console.log(getNode(id).type)
  console.log(getNode(id).data["numberQuantumInputs"])
  console.log(hasQuantumInputs)
  console.log(hasClassicalInputs)
   useEffect(() => {
    updateNodeInternals(node.id);
    console.log("update handles")
   
  }, [node.data["numberClassicalInputs"] ]);


  const toggleSubmenuInputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing parent
    setSubmenuInputAddOpen(prev => !prev);
}, []);

  const toggleSubmenuInputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing parent
    setSubmenuInputRemoveOpen(prev => !prev);
  }, []);

  const toggleSubmenuOutputAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing parent
    setSubmenuOutputAddOpen(prev => !prev);
}, []);

  const toggleSubmenuOutputRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent closing parent
    setSubmenuOutputRemoveOpen(prev => !prev);
  }, []);

  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const hoverProps = (key: string, isDanger = false) => ({
    onMouseEnter: () => setHoveredBtn(key),
    onMouseLeave: () => setHoveredBtn(null),
    style: {
      ...(isDanger ? deleteButtonStyle : buttonStyle),
      backgroundColor: hoveredBtn === key
        ? isDanger ? "#fef2f2" : "#f3f4f6"
        : "transparent",
    },
  });

  let buttons = [];
  buttons.push(
    <button
      key="duplicate"
      onClick={duplicateNode}
      aria-label="Duplicate Node"
      {...hoverProps("duplicate")}
    >
      <FaCopy style={iconStyle} /> Duplicate
    </button>
  );
  buttons.push(
    <React.Fragment key="delete-section">
      <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "4px 0" }} />
      <button
        onClick={deleteNode}
        aria-label="Delete Node"
        {...hoverProps("delete", true)}
      >
        <FaTrash style={iconStyle} /> Delete
      </button>
    </React.Fragment>
  );

  if (type === "ifElseNode" || type === "controlStructureNode") {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >

        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuInputAddOpen(true)}
          onMouseLeave={() => setSubmenuInputAddOpen(false)}>
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaPlus style={iconStyle} /> Add Input</span> <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div
              style={submenuStyle}>
              <button
                onClick={() => incrementNodeDataField("numberQuantumInputs", 1)}
                style={buttonStyle}
                aria-label="Add Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() => incrementNodeDataField("numberClassicalInputs", 1)}
                style={buttonStyle}
                aria-label="Add Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && <div style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuInputRemoveOpen(true)}
          onMouseLeave={() => setSubmenuInputRemoveOpen(false)}>
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaMinus style={iconStyle} /> Remove Input </span> <FaCaretRight />
          </button>
          {submenuInputRemoveOpen && (
            <div
              style={submenuStyle}>
              {hasQuantumInputs && <button
                onClick={() => decrementNodeDataField("numberQuantumInputs", 1)}
                style={buttonStyle}
                aria-label="Remove Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>}
              {hasClassicalInputs && <button
                onClick={() => decrementNodeDataField("numberClassicalInputs", 1)}
                style={buttonStyle}
                aria-label="Remove Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>}
            </div>
          )}
        </div>}
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
          style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuInputAddOpen(true)}
          onMouseLeave={() => setSubmenuInputAddOpen(false)}>
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaPlus style={iconStyle} /> Add Input</span> <FaCaretRight />
          </button>
          {submenuInputAddOpen && (
            <div
              style={submenuStyle}>
              <button
                onClick={() => incrementNodeDataField("numberQuantumInputs", 0)}
                style={buttonStyle}
                aria-label="Add Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() => incrementNodeDataField("numberClassicalInputs", 0)}
                style={buttonStyle}
                aria-label="Add Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuOutputAddOpen(true)}
          onMouseLeave={() => setSubmenuOutputAddOpen(false)}>
          <button
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaPlus style={iconStyle} /> Add Output</span> <FaCaretRight />
          </button>
          {submenuOutputAddOpen && (
            <div
              style={submenuStyle}>
              <button
                onClick={() => incrementNodeDataField("numberQuantumOutputs", 0)}
                style={buttonStyle}
                aria-label="Add Quantum Output"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>
              <button
                onClick={() => incrementNodeDataField("numberClassicalOutputs", 0)}
                style={buttonStyle}
                aria-label="Add Classical Output"
              >
                <FaGear style={iconStyle} /> Classical
              </button>
            </div>
          )}
        </div>
        {(hasQuantumInputs || hasClassicalInputs) && <div style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuInputRemoveOpen(true)}
          onMouseLeave={() => setSubmenuInputRemoveOpen(false)}>
          <button
            onClick={toggleSubmenuInputRemove}
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaMinus style={iconStyle} /> Remove Input </span> <FaCaretRight />
          </button>
          {submenuInputRemoveOpen && (
            <div
              style={submenuStyle}>
              {hasQuantumInputs && <button
                onClick={() => decrementNodeDataField("numberQuantumInputs", 0)}
                style={buttonStyle}
                aria-label="Remove Quantum Input"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>}
              {hasClassicalInputs && <button
                onClick={() => decrementNodeDataField("numberClassicalInputs", 0)}
                style={buttonStyle}
                aria-label="Remove Classical Input"
              >
                <FaGear style={iconStyle} /> Classical
              </button>}
            </div>
          )}
        </div>}
        {(hasQuantumOutputs || hasClassicalOutputs) && <div style={{ position: 'relative' }}
          onMouseEnter={() => setSubmenuOutputRemoveOpen(true)}
          onMouseLeave={() => setSubmenuOutputRemoveOpen(false)}>
          <button
            onClick={toggleSubmenuInputRemove}
            style={{
              ...buttonStyle,
              justifyContent: "space-between",
            }}
          >
            <span style={{
              display: "flex",
              alignItems: "center",
            }}><FaMinus style={iconStyle} /> Remove Output </span> <FaCaretRight />
          </button>
          {submenuOutputRemoveOpen && (
            <div
              style={submenuStyle}>
              {hasQuantumOutputs && <button
                onClick={() => decrementNodeDataField("numberQuantumOutputs", 0)}
                style={buttonStyle}
                aria-label="Remove Quantum Output"
              >
                <FaReact style={iconStyle} /> Quantum
              </button>}
              {hasClassicalOutputs && <button
                onClick={() => decrementNodeDataField("numberClassicalOutputs", 0)}
                style={buttonStyle}
                aria-label="Remove Classical Output"
              >
                <FaGear style={iconStyle} /> Classical
              </button>}
            </div>
          )}
        </div>}
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
          {hasClassicalInputs && <button
            onClick={() => decrementNodeDataField("numberClassicalInputs", 0)}
            style={buttonStyle}
            aria-label="Remove Classical Input"
          >
            <FaMinus style={iconStyle} /> Remove Classical Input
          </button>}
          {hasClassicalOutputs && <button
            onClick={() => decrementNodeDataField("numberClassicalOutputs", 0)}
            style={buttonStyle}
            aria-label="Remove Classical Output"
          >
            <FaMinus style={iconStyle} /> Remove Classical Output
          </button>}
        </div>
        <div>
          {buttons}
        </div>
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
          {hasInputs && <button
            onClick={() => decrementNodeDataField("numberInputs", 0)}
            style={buttonStyle}
            aria-label="Remove Input"
          >
            <FaMinus style={iconStyle} /> Remove Input
          </button>}
        </div>
        <div>
          {buttons}
        </div>
      </div>
    );
  } 
  
  
  else if (type === "splitterNode") {
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
          {hasOutputs && <button
            onClick={() => decrementNodeDataField("numberOutputs", 2)}
            style={buttonStyle}
            aria-label="Remove Output"
          >
            <FaMinus style={iconStyle} /> Remove Output
          </button>}
        </div>
        <div>
          {buttons}
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{ ...menuStyle, top, left, ...styles }}
        className="context-menu"
      >

        <div>
          {buttons}
        </div>
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
