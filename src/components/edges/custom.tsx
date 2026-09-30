import {
  ConnectionLineComponentProps,
  getSimpleBezierPath,
} from "@xyflow/react";
import React from "react";

export default function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  const [d] = getSimpleBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return <path fill="none" stroke={"black"} strokeWidth={1.5} d={d} />;
}
