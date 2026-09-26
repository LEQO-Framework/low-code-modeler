/**
 * Computes, for every qubit node on the canvas, the register index it would actually
 * receive when compiled by the backend - the real index, not just a simple visual
 * numbering.
 *
 * IMPORTANT: this uses the same computeOrderedComponents function as componentAnalyzer.ts
 * (component grouping plus sorting by visual position), so the indices shown here are
 * guaranteed to match what happens when the model is sent to the backend. If the grouping
 * or sorting logic ever changes, it only has to be changed in computeOrderedComponents and
 * this file follows automatically.
 */

import { Node, Edge } from "reactflow";
import { computeOrderedComponents } from "./componentAnalyzer";

/**
 * Checks whether a node is a "qubit source" that occupies a register index of its own.
 * Two cases are recognized:
 * 1. type === "qubitNode": the classic qubit node from qubit.tsx.
 * 2. type === "gateNode" && data.label === "Qubit Circuit": in Experience Mode, qubit
 *    sources are rendered through the generic GateNode component (gate.tsx) and can only
 *    be identified by the label "Qubit Circuit" (see the isQubit check there). Without
 *    this case, computeQubitIndices would not find any qubits in Experience Mode.
 */
function isQubitSourceNode(node: Node): boolean {
  if (node.type === "qubitNode") return true;
  if (node.type === "gateNode" && node.data?.label === "Qubit Circuit") return true;
  return false;
}

export function computeQubitIndices(
  nodes: Node[],
  edges: Edge[]
): Map<string, number> {
  const indices = new Map<string, number>();
  const orderedComponents = computeOrderedComponents(nodes, edges);

  for (const componentNodes of orderedComponents) {
    let nextIndex = 0;
    for (const node of componentNodes) {
      if (!isQubitSourceNode(node)) continue;

      indices.set(node.id, nextIndex);

      const rawSize = parseInt(String(node.data?.size), 10);
      const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 1;
      nextIndex += size;
    }
  }

  return indices;
}

/**
 * Returns a display label for a single qubit node, e.g. "0" or "0–1" for a register with
 * size > 1. Returns null if the node cannot be found or is not a qubit source.
 *
 * A single qubit node can span more than one qubit via node.data.size (defaulting to 1 if
 * size is missing or invalid); the index in the map is then the START index of the range
 * it occupies, e.g. size = 2 occupies {start, start + 1}.
 */
export function getQubitIndexLabel(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): string | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !isQubitSourceNode(node)) return null;

  const indices = computeQubitIndices(nodes, edges);
  const start = indices.get(nodeId);
  if (start === undefined) return null;

  const rawSize = parseInt(String(node.data?.size), 10);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 1;

  return size > 1 ? `${start}–${start + size - 1}` : `${start}`;
}
