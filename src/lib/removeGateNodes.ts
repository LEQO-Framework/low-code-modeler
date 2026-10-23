/**
 * Removes gate nodes from the canvas and reconnects their wires: the node that fed qubit
 * i into a removed gate is connected to the node that read qubit i from it. Used when a
 * step is removed in Math Mode, so that the rest of the model (positions, groups such as
 * a user-made "Bell state" group) stays as it is instead of being rebuilt from OpenQASM.
 */

import type { Edge, Node } from "reactflow";
import { v4 as uuid } from "uuid";
import { MCMTGateNode } from "@/constants";

/** Qubit (wire) index of a gate handle, e.g. 1 for "quantumHandleGateInput1<id>". */
function wireIndex(handle: string | null | undefined, nodeId: string) {
  const match = handle
    ?.replace(nodeId, "")
    .match(/^quantumHandle(?:Gate)?(?:Input|Output)(\d+)$/);
  return match ? Number(match[1]) : null;
}

/**
 * Returns the canvas without the given nodes, or null if one of them is not a gate node
 * on the canvas or its wires cannot be read (then the circuit has to be rebuilt).
 */
export function removeGateNodes(
  nodes: Node[],
  edges: Edge[],
  removedIds: string[],
): { nodes: Node[]; edges: Edge[] } | null {
  let currentNodes = nodes;
  let currentEdges = edges;

  for (const id of removedIds) {
    const node = currentNodes.find((n) => n.id === id);
    if (!node || (node.type !== "gateNode" && node.type !== MCMTGateNode))
      return null;

    const incoming = currentEdges.filter((e) => e.target === id);
    const outgoing = currentEdges.filter((e) => e.source === id);
    if (
      incoming.some((e) => wireIndex(e.targetHandle, id) === null) ||
      outgoing.some((e) => wireIndex(e.sourceHandle, id) === null)
    )
      return null;

    // the wire i continues from the source of input i to the targets of output i
    const bridges: Edge[] = [];
    for (const out of outgoing) {
      const wire = wireIndex(out.sourceHandle, id);
      const into = incoming.find((e) => wireIndex(e.targetHandle, id) === wire);
      if (!into) continue; // the qubit starts at the removed gate
      bridges.push({
        ...out,
        id: uuid(),
        source: into.source,
        sourceHandle: into.sourceHandle,
      });
    }

    currentEdges = [
      ...currentEdges.filter((e) => e.source !== id && e.target !== id),
      ...bridges,
    ];
    currentNodes = currentNodes
      .filter((n) => n.id !== id)
      .map((n) => {
        const inputs = n.data?.inputs as
          | { id?: string; edgeId?: string; targetHandle?: string }[]
          | undefined;
        if (!inputs?.some((input) => input.id === id)) return n;
        // the inputs bookkeeping of the next gate now points to the new source
        return {
          ...n,
          data: {
            ...n.data,
            inputs: inputs.flatMap((input) => {
              if (input.id !== id) return [input];
              const bridge = bridges.find(
                (b) =>
                  b.target === n.id && b.targetHandle === input.targetHandle,
              );
              return bridge
                ? [{ ...input, id: bridge.source, edgeId: bridge.id }]
                : [];
            }),
          },
        };
      });
  }

  return { nodes: currentNodes, edges: currentEdges };
}
