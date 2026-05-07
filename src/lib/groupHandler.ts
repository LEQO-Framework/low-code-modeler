/**
 * groupHandler.ts
 * Platzierung: src/lib/groupHandler.ts
 */

import { Node, Edge } from "reactflow";
import { v4 as uuid } from "uuid";

const GROUP_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#10b981",
];

let colorIndex = 0;
let groupCounter = 1;

export function groupSelectedNodes(nodes: Node[], edges: Edge[]): Node[] {
  // Alle selektierten Nodes außer:
  // - bestehenden Gruppen
  // - Nodes die bereits in einer Gruppe sind (parentNode gesetzt)
  const selected = nodes.filter(
    (n) => n.selected === true
      && n.type !== "groupNode"
      && !n.parentNode  // ← Nodes die bereits in einer Gruppe sind ausschließen
  );

  console.log("groupSelectedNodes – selected:", selected.length, selected.map(n => n.id));

  if (selected.length < 2) return nodes;

  // Bounding Box
  const minX = Math.min(...selected.map((n) => n.positionAbsolute?.x ?? n.position.x)) - 30;
  const minY = Math.min(...selected.map((n) => n.positionAbsolute?.y ?? n.position.y)) - 50;
  const maxX = Math.max(...selected.map((n) => (n.positionAbsolute?.x ?? n.position.x) + (n.width ?? 150))) + 30;
  const maxY = Math.max(...selected.map((n) => (n.positionAbsolute?.y ?? n.position.y) + (n.height ?? 100))) + 30;

  const groupWidth  = maxX - minX;
  const groupHeight = maxY - minY;

  const groupId = uuid();
  const color   = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
  const label   = `Gruppe ${groupCounter}`;
  colorIndex++;
  groupCounter++;

  const selectedIds = new Set(selected.map((n) => n.id));

  // GroupNode
  const groupNode: Node = {
    id: groupId,
    type: "groupNode",
    position: { x: minX, y: minY },
    style: { width: groupWidth, height: groupHeight },
    data: {
      label,
      collapsed: false,
      color,
      childCount: selected.length,
      isGroup: true,   // ← markiert als Gruppencontainer
    },
    draggable: true,
    selectable: true,
    selected: false,
    zIndex: -1,
  };

  // Kind-Nodes relativ zur Gruppe positionieren
  const updatedNodes = nodes.map((n) => {
    if (!selectedIds.has(n.id)) return n;
    const absX = n.positionAbsolute?.x ?? n.position.x;
    const absY = n.positionAbsolute?.y ?? n.position.y;
    return {
      ...n,
      parentNode: groupId,
      extent: undefined,          // ← kein extent:parent
      position: {
        x: absX - minX,
        y: Math.max(40, absY - minY),
      },
      selected: false,
    };
  });

  return [groupNode, ...updatedNodes];
}

export function ungroupNodes(groupId: string, nodes: Node[]): Node[] {
  const groupNode = nodes.find((n) => n.id === groupId);
  if (!groupNode) return nodes;

  return nodes
    .filter((n) => n.id !== groupId)
    .map((n) => {
      if (n.parentNode === groupId) {
        return {
          ...n,
          parentNode: undefined,
          extent: undefined,
          position: {
            x: n.position.x + groupNode.position.x,
            y: n.position.y + groupNode.position.y,
          },
          hidden: false,
        };
      }
      return n;
    });
}

// ---------------------------------------------------------------------------
// Drag-to-Group: Node in eine Gruppe ziehen
// ---------------------------------------------------------------------------

/**
 * Prüft nach einem Drag ob ein Node in einen GroupNode gezogen wurde.
 * Wenn ja, wird der Node als Kind-Node der Gruppe gesetzt.
 * Wenn ein Node aus einer Gruppe herausgezogen wurde, wird er eigenständig.
 *
 * In App.tsx so verwenden:
 *   const onNodeDragStop = useCallback((event, draggedNode) => {
 *     setNodes(nds => handleNodeDropOnGroup(draggedNode, nds));
 *   }, [setNodes]);
 *
 *   <ReactFlow onNodeDragStop={onNodeDragStop} ... />
 */
export function handleNodeDropOnGroup(
  draggedNode: Node,
  nodes: Node[]
): Node[] {
  // GroupNodes ignorieren
  if (draggedNode.type === "groupNode") return nodes;

  // Absolute Position des gezogenen Nodes
  const dragX = draggedNode.positionAbsolute?.x ?? draggedNode.position.x;
  const dragY = draggedNode.positionAbsolute?.y ?? draggedNode.position.y;
  const dragW = draggedNode.width  ?? 100;
  const dragH = draggedNode.height ?? 100;

  // Mittelpunkt des gezogenen Nodes
  const cx = dragX + dragW / 2;
  const cy = dragY + dragH / 2;

  // Finde GroupNode unter dem Mittelpunkt
  const targetGroup = nodes.find((n) => {
    if (n.type !== "groupNode" || n.id === draggedNode.parentNode) return false;
    if (n.data?.collapsed) return false;
    if (n.data?.locked) return false; // ← gesperrte Gruppen akzeptieren keine neuen Nodes

    const gx = n.positionAbsolute?.x ?? n.position.x;
    const gy = n.positionAbsolute?.y ?? n.position.y;
    const gw = (n.style?.width  as number) ?? n.width  ?? 300;
    const gh = (n.style?.height as number) ?? n.height ?? 200;

    return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
  });

  // Kein Ziel und kein bestehender Parent → nichts tun, GLEICHE Referenz zurück
  if (!targetGroup && !draggedNode.parentNode) return nodes;

  // Node in Gruppe aufnehmen
  if (targetGroup) {
    const gx = targetGroup.positionAbsolute?.x ?? targetGroup.position.x;
    const gy = targetGroup.positionAbsolute?.y ?? targetGroup.position.y;
    return nodes.map((n) => {
      if (n.id !== draggedNode.id) return n;
      return {
        ...n,
        parentNode: targetGroup.id,
        extent: undefined,          // ← kein extent:parent
        position: {
          x: Math.max(0, dragX - gx),
          y: Math.max(40, dragY - gy),
        },
      };
    });
  }

  // Node aus Gruppe herausgezogen (hatte parentNode, landet außerhalb)
  if (draggedNode.parentNode) {
    const parentGroup = nodes.find((g) => g.id === draggedNode.parentNode);
    // Gesperrte Gruppe → Node bleibt drin
    if (parentGroup?.data?.locked) return nodes;
    if (parentGroup) {
      const gx = parentGroup.positionAbsolute?.x ?? parentGroup.position.x;
      const gy = parentGroup.positionAbsolute?.y ?? parentGroup.position.y;
      const gw = (parentGroup.style?.width  as number) ?? parentGroup.width  ?? 300;
      const gh = (parentGroup.style?.height as number) ?? parentGroup.height ?? 200;
      // Noch innerhalb → nichts tun
      if (cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh) return nodes;
      // Außerhalb → aus Gruppe lösen, absolute Position berechnen
      return nodes.map((n) => {
        if (n.id !== draggedNode.id) return n;
        return {
          ...n,
          parentNode: undefined,
          extent: undefined,
          // Absolute Position = relative Position + Gruppenposition
          position: { x: dragX, y: dragY },
        };
      });
    }
  }

  return nodes;
}
