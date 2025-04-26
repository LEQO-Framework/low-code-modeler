import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import React from "react";
import { Edge } from "react-flow-renderer";
import { EdgeLabelRenderer, getStraightPath } from "reactflow";

export default function QuantumEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label
}: EdgeProps<Edge>) {
  const [d, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  });
  console.log(label)
console.log(sourceX)
console.log(sourcePosition)
  return (
    <>
      <BaseEdge
        style={{
          stroke: "#93C5FD",
          zIndex: 300000000000
          
        }}
        markerEnd={markerEnd}
        path={d}
      />
    </>
  );
}