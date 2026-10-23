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

export function groupSelectedNodes(nodes: Node[], _edges: Edge[]): Node[] {
  // All selected nodes, including existing groups so that supergroups can be formed,
  // restricted to top level: nodes whose parent is also selected are left out.
  const selected = nodes.filter((n) => n.selected === true && !n.data?.locked);

  if (selected.length < 2) return nodes;

  // keep only top-level nodes, i.e. those whose parentNode is not selected as well
  const selectedIds = new Set(selected.map((n) => n.id));
  const topLevel = selected.filter(
    (n) => !n.parentNode || !selectedIds.has(n.parentNode),
  );

  if (topLevel.length < 2) return nodes;

  // bounding box over the absolute positions
  const minX =
    Math.min(...topLevel.map((n) => n.positionAbsolute?.x ?? n.position.x)) -
    30;
  const minY =
    Math.min(...topLevel.map((n) => n.positionAbsolute?.y ?? n.position.y)) -
    50;
  const maxX =
    Math.max(
      ...topLevel.map(
        (n) =>
          (n.positionAbsolute?.x ?? n.position.x) +
          ((n.style?.width as number) ?? n.width ?? 150),
      ),
    ) + 30;
  const maxY =
    Math.max(
      ...topLevel.map(
        (n) =>
          (n.positionAbsolute?.y ?? n.position.y) +
          ((n.style?.height as number) ?? n.height ?? 100),
      ),
    ) + 30;

  const groupWidth = maxX - minX;
  const groupHeight = maxY - minY;

  const groupId = uuid();
  const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
  const label = `Group ${groupCounter}`;
  colorIndex++;
  groupCounter++;

  const topLevelIds = new Set(topLevel.map((n) => n.id));

  // the enclosing group node
  const groupNode: Node = {
    id: groupId,
    type: "groupNode",
    position: { x: minX, y: minY },
    style: { width: groupWidth, height: groupHeight },
    data: {
      label,
      collapsed: false,
      color,
      childCount: topLevel.length,
      isGroup: true,
    },
    draggable: true,
    selectable: true,
    selected: false,
    zIndex: -1,
  };

  // only top-level nodes are reparented to the new group
  const updatedNodes = nodes.map((n) => {
    if (!topLevelIds.has(n.id)) return n;
    const absX = n.positionAbsolute?.x ?? n.position.x;
    const absY = n.positionAbsolute?.y ?? n.position.y;
    return {
      ...n,
      parentNode: groupId,
      extent: undefined,
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

  // if the group itself sits in a parent group, move the child nodes up into it
  const parentOfGroup = groupNode.parentNode;

  return nodes
    .filter((n) => n.id !== groupId)
    .map((n) => {
      if (n.parentNode === groupId) {
        const absX =
          (groupNode.positionAbsolute?.x ?? groupNode.position.x) +
          n.position.x;
        const absY =
          (groupNode.positionAbsolute?.y ?? groupNode.position.y) +
          n.position.y;

        if (parentOfGroup) {
          // promote the child nodes to the parent group
          const parentNode = nodes.find((p) => p.id === parentOfGroup);
          const pgx =
            parentNode?.positionAbsolute?.x ?? parentNode?.position.x ?? 0;
          const pgy =
            parentNode?.positionAbsolute?.y ?? parentNode?.position.y ?? 0;
          return {
            ...n,
            parentNode: parentOfGroup,
            extent: undefined,
            position: {
              x: absX - pgx,
              y: Math.max(40, absY - pgy),
            },
            hidden: false,
          };
        }

        return {
          ...n,
          parentNode: undefined,
          extent: undefined,
          position: { x: absX, y: absY },
          hidden: false,
        };
      }
      return n;
    });
}

// ---------------------------------------------------------------------------
// Drag-to-group: dragging a node into a group
// ---------------------------------------------------------------------------

/**
 * Checks after a drag whether a node was dropped onto a group node. If so, the node
 * becomes a child of that group; if a node was dragged out of a group, it becomes
 * standalone again.
 *
 * Usage in App.tsx:
 *   const onNodeDragStop = useCallback((event, draggedNode) => {
 *     setNodes(nds => handleNodeDropOnGroup(draggedNode, nds));
 *   }, [setNodes]);
 *
 *   <ReactFlow onNodeDragStop={onNodeDragStop} ... />
 */
export function handleNodeDropOnGroup(
  draggedNode: Node,
  nodes: Node[],
): Node[] {
  // group nodes themselves are ignored
  if (draggedNode.type === "groupNode") return nodes;

  // absolute position of the dragged node
  const dragX = draggedNode.positionAbsolute?.x ?? draggedNode.position.x;
  const dragY = draggedNode.positionAbsolute?.y ?? draggedNode.position.y;
  const dragW = draggedNode.width ?? 100;
  const dragH = draggedNode.height ?? 100;

  // center point of the dragged node
  const cx = dragX + dragW / 2;
  const cy = dragY + dragH / 2;

  // find the group node underneath that center point
  const targetGroup = nodes.find((n) => {
    if (n.type !== "groupNode" || n.id === draggedNode.parentNode) return false;
    if (n.data?.collapsed) return false;
    if (n.data?.locked) return false; // locked groups do not accept new nodes

    const gx = n.positionAbsolute?.x ?? n.position.x;
    const gy = n.positionAbsolute?.y ?? n.position.y;
    const gw = (n.style?.width as number) ?? n.width ?? 300;
    const gh = (n.style?.height as number) ?? n.height ?? 200;

    return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
  });

  // no target and no existing parent: do nothing and return the SAME reference
  if (!targetGroup && !draggedNode.parentNode) return nodes;

  // add the node to the group
  if (targetGroup) {
    const gx = targetGroup.positionAbsolute?.x ?? targetGroup.position.x;
    const gy = targetGroup.positionAbsolute?.y ?? targetGroup.position.y;
    return nodes.map((n) => {
      if (n.id !== draggedNode.id) return n;
      return {
        ...n,
        parentNode: targetGroup.id,
        extent: undefined, // deliberately no extent: parent
        position: {
          x: Math.max(0, dragX - gx),
          y: Math.max(40, dragY - gy),
        },
      };
    });
  }

  // node dragged out of a group: it had a parentNode and now lies outside of it
  if (draggedNode.parentNode) {
    const parentGroup = nodes.find((g) => g.id === draggedNode.parentNode);
    // locked group: the node stays inside
    if (parentGroup?.data?.locked) return nodes;
    if (parentGroup) {
      const gx = parentGroup.positionAbsolute?.x ?? parentGroup.position.x;
      const gy = parentGroup.positionAbsolute?.y ?? parentGroup.position.y;
      const gw =
        (parentGroup.style?.width as number) ?? parentGroup.width ?? 300;
      const gh =
        (parentGroup.style?.height as number) ?? parentGroup.height ?? 200;
      // still inside: nothing to do
      if (cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh) return nodes;
      // outside: detach from the group and use the absolute position
      return nodes.map((n) => {
        if (n.id !== draggedNode.id) return n;
        return {
          ...n,
          parentNode: undefined,
          extent: undefined,
          // absolute position = relative position + group position
          position: { x: dragX, y: dragY },
        };
      });
    }
  }

  return nodes;
}

/**
 * Expands every collapsed group that contains one of the given nodes (also groups
 * nested in each other), like clicking ▸ on each of them, so that the nodes are shown.
 * Returns null if nothing had to be expanded.
 */
export function expandGroupsAround(
  nodes: Node[],
  nodeIds: string[],
): Node[] | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const toExpand = new Set<string>();
  for (const id of nodeIds) {
    let parentId = byId.get(id)?.parentNode;
    while (parentId) {
      const parent = byId.get(parentId);
      if (!parent) break;
      if (parent.type === "groupNode" && parent.data?.collapsed)
        toExpand.add(parent.id);
      parentId = parent.parentNode;
    }
  }
  if (toExpand.size === 0) return null;

  const isCollapsed = (id: string | undefined) =>
    !!id && !toExpand.has(id) && byId.get(id)?.data?.collapsed === true;
  // a node is shown when no group around it stays collapsed
  const shown = (n: Node): boolean => {
    let parentId = n.parentNode;
    while (parentId) {
      if (isCollapsed(parentId)) return false;
      parentId = byId.get(parentId)?.parentNode;
    }
    return true;
  };
  // same size as when the group is expanded on the canvas (see group.tsx)
  const size = (n: Node, axis: "width" | "height") =>
    (n.type === "groupNode" ? (n.style?.[axis] as number) : undefined) ??
    n[axis] ??
    100;
  const bounds = (groupId: string) => {
    const children = nodes.filter((n) => n.parentNode === groupId);
    if (children.length === 0) return null;
    const minX = Math.min(...children.map((n) => n.position.x)) - 20;
    const minY = Math.min(...children.map((n) => n.position.y)) - 40;
    const maxX =
      Math.max(...children.map((n) => n.position.x + size(n, "width"))) + 20;
    const maxY =
      Math.max(...children.map((n) => n.position.y + size(n, "height"))) + 20;
    return {
      width: Math.max(maxX - minX, 300),
      height: Math.max(maxY - minY, 200),
    };
  };

  const insideExpanded = (n: Node) => {
    let parentId = n.parentNode;
    while (parentId) {
      if (toExpand.has(parentId)) return true;
      parentId = byId.get(parentId)?.parentNode;
    }
    return false;
  };

  return nodes.map((n) => {
    const updated = insideExpanded(n) ? { ...n, hidden: !shown(n) } : n;
    if (!toExpand.has(n.id)) return updated;
    const b = bounds(n.id);
    return {
      ...updated,
      data: { ...n.data, collapsed: false },
      style: { ...n.style, width: b?.width ?? 300, height: b?.height ?? 200 },
    };
  });
}
