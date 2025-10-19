import React, { useCallback } from "react";
import { useReactFlow, Node } from "reactflow";
import { FaTrash, FaLink, FaCopy } from "react-icons/fa";

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

  const duplicateNode = useCallback(() => { // duplicate node at slighlty shifted position
    const node = getNode(id);
    if (node) {
      const randomId = generateRandomId();
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

  return (
    <div
      style={{
        position: "absolute",
        top, // klappt nicht: top: getNode(id).position.y
        left, // klappt nicht: analog .... .position.x
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
        <button
          onClick={duplicateNode}
          style={buttonStyle}
          aria-label="Duplicate Node"
        >
          <FaCopy style={iconStyle} /> Duplicate
        </button>
        <button
          onClick={() => console.log("Connect Node")} // Placeholder
          style={buttonStyle}
          aria-label="Connect Node"
        >
          <FaLink style={iconStyle} /> Connect
        </button>
        <button
          onClick={deleteNode}
          style={buttonStyle}
          aria-label="Delete Node"
        >
          <FaTrash style={iconStyle} /> Delete
        </button>
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
