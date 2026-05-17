import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import React from "react";

export default function AncillaEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
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
        markerEnd={markerEnd}
        path={d}
      />
    </>
  );
}