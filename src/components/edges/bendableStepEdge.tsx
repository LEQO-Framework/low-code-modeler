/**
 * Step edge whose middle segment can be moved: a selected edge shows a handle on that
 * segment, dragging it moves the segment (left/right for an edge that runs forward,
 * up/down for one that loops back to a node further left), and a double click resets
 * it. The shift is stored in the edge data as `bend` = { dx, dy } relative to the
 * default middle of the edge, so it moves along when the nodes move and is saved with
 * the model.
 */

import {
  BaseEdge,
  EdgeProps,
  Position,
  getSmoothStepPath,
} from "@xyflow/react";
import React, { useState } from "react";
import { EdgeLabelRenderer, useReactFlow } from "reactflow";
import { useStore } from "@/config/store";
import { useEdgeMarkerEnd } from "./edgeHighlightContext";

export interface EdgeBend {
  dx: number;
  dy: number;
}

/** Distance of the first and last bend from the handles (getSmoothStepPath default). */
const OFFSET = 20;

/** Which middle segment the step path has: a vertical one (moves along x) or a horizontal one. */
function movableAxis(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
): "x" | "y" {
  if (sourcePosition === Position.Right) {
    return targetX - sourceX > 2 * OFFSET ? "x" : "y";
  }
  if (sourcePosition === Position.Left) {
    return sourceX - targetX > 2 * OFFSET ? "x" : "y";
  }
  if (sourcePosition === Position.Bottom) {
    return targetY - sourceY > 2 * OFFSET ? "y" : "x";
  }
  return sourceY - targetY > 2 * OFFSET ? "y" : "x";
}

export default function BendableStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
  color,
}: EdgeProps & { color: string }) {
  const highlightedMarkerEnd = useEdgeMarkerEnd(id, markerEnd);
  const { screenToFlowPosition } = useReactFlow();
  const setNewEdges = useStore((state) => state.setNewEdges);
  // shift while dragging; saved to the edge when the drag ends
  const [dragBend, setDragBend] = useState<EdgeBend | null>(null);

  const stored: EdgeBend | undefined = (data as any)?.bend;
  const bend = dragBend ?? stored ?? { dx: 0, dy: 0 };
  const defaultX = (sourceX + targetX) / 2;
  const defaultY = (sourceY + targetY) / 2;
  const axis = movableAxis(sourceX, sourceY, sourcePosition, targetX, targetY);
  const centerX = axis === "x" ? defaultX + bend.dx : defaultX;
  const centerY = axis === "y" ? defaultY + bend.dy : defaultY;

  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    centerX,
    centerY,
  });

  const saveBend = (next: EdgeBend | undefined) => {
    const edges = useStore.getState().edges;
    setNewEdges(
      edges.map((edge) => {
        if (edge.id !== id) return edge;
        const { bend: _old, ...rest } = (edge.data ?? {}) as any;
        return { ...edge, data: next ? { ...rest, bend: next } : rest };
      }),
    );
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const start = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const from = bend;
    let latest = from;
    const move = (e: PointerEvent) => {
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      latest = { dx: from.dx + p.x - start.x, dy: from.dy + p.y - start.y };
      setDragBend(latest);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      setDragBend(null);
      if (latest !== from) saveBend(latest);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  return (
    <>
      <BaseEdge
        style={{ stroke: color }}
        markerEnd={highlightedMarkerEnd}
        path={d}
      />
      {(selected || dragBend) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${centerX}px, ${centerY}px)`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#fff",
              border: `2px solid ${color}`,
              boxShadow: "0 0 0 1px #374151",
              cursor: axis === "x" ? "ew-resize" : "ns-resize",
              pointerEvents: "all",
            }}
            title="Drag to move this part of the arrow; double-click to reset"
            onPointerDown={startDrag}
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (stored) saveBend(undefined);
            }}
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
}
