import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import React from "react";
import { useEdgeMarkerEnd } from "./edgeHighlightContext";

export default function AncillaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const highlightedMarkerEnd = useEdgeMarkerEnd(id, markerEnd);
  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        style={{
          stroke:  "#86EFAC",
          
        }}
        markerEnd={highlightedMarkerEnd}
        path={d}
      />
    </>
  );
}