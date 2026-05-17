import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import React from "react";
import { Edge } from "react-flow-renderer";
import { EdgeLabelRenderer } from "reactflow";

export default function QuantumEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label
}: EdgeProps) {
  const [d, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 10}px)`,
          }}
          className="edge-label-renderer__custom-edge nodrag nopan"
        >

        </div>
      </EdgeLabelRenderer>
      <BaseEdge
        style={{
          stroke: "#93C5FD",

        }}
        markerEnd={markerEnd}
        path={d}
      />
    </>
  );
}
