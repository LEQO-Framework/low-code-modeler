import React, { useCallback, useState } from "react";
import { useReactFlow, Node } from "reactflow";
import { FaTrash, FaCopy, FaPlus, FaMinus } from "react-icons/fa";
import { v4 as uuid } from "uuid";
import { Button } from "./ui";

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
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();
  const type = getNode(id).type
  console.log("type", type)

  const duplicateNode = useCallback(() => { // duplicate node at slighlty shifted position
    const node = getNode(id);
    if (node) {
      const randomId = uuid();
      const position = {
        x: node.position.x + 50,
        y: node.position.y + 50,
      };

      const duplicatedNode: Node = {
        ...node,
        id: randomId, // Ensure unique ID
        position,
      };

      addNodes([duplicatedNode]);
      if (onAction) onAction("duplicate", id);
    }
  }, [id, getNode, addNodes, onAction]);

  const deleteNode = useCallback(() => { // delete node
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
    if (onAction) onAction("delete", id);
  }, [id, setNodes, setEdges, onAction]);

  const incrementNodeDataField = useCallback((field: string, min_value: number) => { //TODO: richtiges Feld verwenden (bei merger: numberInputs) --> Feld als Argument übergeben?
    const node = getNode(id);
    //const field = "numberQuantumInputs";
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, [field]: n.data[field]? n.data[field] + 1 : min_value+1 } }
          : n
      )
    );
  }, [id, getNode, setNodes, onAction]);

  const decrementNodeDataField = useCallback((field: string, min_value: number) => {
    const node = getNode(id);
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, [field]: n.data[field]>min_value? n.data[field] - 1 : min_value } }
          : n
      )
    );
  }, [id, getNode, setNodes, onAction]);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  let buttons = [];
  if (type == "ifElseNode" || type == "controlStructureNode"){
    buttons.push(
      <button
        onClick={() => incrementNodeDataField("numberQuantumInputs",1)}
        style={buttonStyle}
        aria-label="Add Quantum Input"
      >
        <FaPlus style={iconStyle} /> Add Quantum Input
      </button>);
    buttons.push(
      <button
        onClick={() => incrementNodeDataField("numberClassicalInputs",1)}
        style={buttonStyle}
        aria-label="Add Classical Input"
      >
        <FaPlus style={iconStyle} /> Add Classical Input
      </button>);
    buttons.push(
      <button
        onClick={() => decrementNodeDataField("numberQuantumInputs",1)} // Placeholder
        style={buttonStyle}
        aria-label="Remove Quantum Input"
      >
        <FaMinus style={iconStyle} /> Remove Quantum Input
      </button>);
    buttons.push(
      <button
        onClick={() => decrementNodeDataField("numberClassicalInputs",1)} // Placeholder
        style={buttonStyle}
        aria-label="Remove Classical Input"
      >
        <FaMinus style={iconStyle} /> Remove Classical Input
      </button>);
  } else if (type == "mergerNode"){
    buttons.push(
      <button
        onClick={() => incrementNodeDataField("numberInputs",2)}
        style={buttonStyle}
        aria-label="Add Input"
      >
        <FaPlus style={iconStyle} /> Add Input
      </button>);
    buttons.push(
      <button
        onClick={() => decrementNodeDataField("numberInputs",2)} // Placeholder
        style={buttonStyle}
        aria-label="Remove Input"
      >
        <FaMinus style={iconStyle} /> Remove Input
      </button>);
  } else if(type == "splitterNode"){
        buttons.push(
      <button
        onClick={() => incrementNodeDataField("numberOutputs",2)}
        style={buttonStyle}
        aria-label="Add Output"
      >
        <FaPlus style={iconStyle} /> Add Output
      </button>);
    buttons.push(
      <button
        onClick={() => decrementNodeDataField("numberOutputs",2)} // Placeholder
        style={buttonStyle}
        aria-label="Remove Output"
      >
        <FaMinus style={iconStyle} /> Remove Output
      </button>);
  } 
  // every node can be duplicated and deleted
  buttons.push(     
    <button
      onClick={duplicateNode}
      style={buttonStyle}
      aria-label="Duplicate Node"
      >
        <FaCopy style={iconStyle} /> Duplicate
    </button>);
  buttons.push(
    <button
      onClick={deleteNode}
      style={buttonStyle}
      aria-label="Delete Node"
      >
        <FaTrash style={iconStyle} /> Delete
      </button>);
  console.log("buttons", buttons)
  // find better solution for following (too much duplicated code)
    return (
      <div
        style={{
          position: "absolute",
          top,
          left,
          ...styles, // Merge passed styles
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
        className="context-menu"
      >
        <p style={{ margin: "0.5em", fontSize: "14px", color: "#666" }}>
          <small>Node: {id}</small>
        </p>
        <div>
          {buttons}
        </div>
      </div>
    );
};

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
