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
  connectionStatus,
}: ConnectionLineComponentProps) {
  const [d] = getSimpleBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  console.log("this one")

  let color = "black";
  //if (connectionStatus === "valid") color = "#55dd99";
  //if (connectionStatus === "invalid") color = "#ff6060";

  return <path fill="none" stroke={"black"} strokeWidth={1.5} d={d} />;
}