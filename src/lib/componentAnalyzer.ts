/**
 * Finds the connected components of the flow and sends each of them to the backend
 * separately, so that every component gets its own QASM/Dirac output.
 */

import { Node, Edge } from "reactflow";
import { startCompile } from "../backend";

export interface DiracComponent {
  /** Unique index of the component. */
  index: number;
  /** Group name if all nodes belong to the same group, otherwise null. */
  groupLabel: string | null;
  /** Group ID, used for the summary. */
  groupId: string | null;
  /** Group color. */
  groupColor: string;
  /** Original node IDs, before transformation, for the canvas export. */
  nodeIds: string[];
  /** Nodes of this component. */
  nodes: Node[];
  /** QASM output from the backend, null on error. */
  qasm: string | null;
  /** Error message if the backend call failed. */
  error: string | null;
}

/**
 * Finds all connected components of the flow via BFS. Group nodes and hidden nodes are
 * ignored; edges attached to a group are expanded to the corresponding child nodes.
 */
export function findConnectedComponents(
  nodes: Node[],
  edges: Edge[],
  allNodes?: Node[],
): Node[][] {
  const activeNodes = nodes.filter((n) => n.type !== "groupNode");

  if (activeNodes.length === 0) return [];

  const nodeIds = new Set(activeNodes.map((n) => n.id));
  // allNodes also contains the group nodes needed for the expansion
  const fullNodes = allNodes ?? nodes;

  // Gruppen-Edges expandieren
  const expandedEdges: Edge[] = [];
  for (const edge of edges) {
    const sourceNode = fullNodes.find((n) => n.id === edge.source);
    const targetNode = fullNodes.find((n) => n.id === edge.target);

    if (sourceNode?.type === "groupNode" || targetNode?.type === "groupNode") {
      const sourceChildren =
        sourceNode?.type === "groupNode"
          ? activeNodes.filter((n) => n.parentNode === sourceNode.id)
          : sourceNode
            ? [sourceNode]
            : [];
      const targetChildren =
        targetNode?.type === "groupNode"
          ? activeNodes.filter((n) => n.parentNode === targetNode.id)
          : targetNode
            ? [targetNode]
            : [];

      for (const src of sourceChildren) {
        for (const tgt of targetChildren) {
          expandedEdges.push({
            ...edge,
            id: `virtual-${edge.id}-${src.id}-${tgt.id}`,
            source: src.id,
            target: tgt.id,
          });
        }
      }
    } else {
      expandedEdges.push(edge);
    }
  }

  // Adjazenzliste aufbauen (bidirektional)
  const adjacency = new Map<string, Set<string>>();
  for (const node of activeNodes) {
    adjacency.set(node.id, new Set());
  }

  for (const edge of expandedEdges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }
  }

  // BFS to find the connected components
  const visited = new Set<string>();
  const components: Node[][] = [];

  for (const node of activeNodes) {
    if (visited.has(node.id)) continue;

    const component: Node[] = [];
    const queue: string[] = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = activeNodes.find((n) => n.id === currentId);
      if (currentNode) component.push(currentNode);

      for (const neighborId of adjacency.get(currentId) ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    components.push(component);
  }

  return components;
}

/**
 * Collects all child nodes reachable from a group target.
 */
function collectReachableNodes(
  targetId: string,
  allNodes: Node[],
  activeNodes: Node[],
  edges: Edge[],
  visitedGroups: Set<string> = new Set(),
): Node[] {
  const tgtNode = allNodes.find((n) => n.id === targetId);
  if (!tgtNode) return [];

  const result: Node[] = [];

  if (tgtNode.type === "groupNode") {
    if (visitedGroups.has(tgtNode.id)) return [];
    visitedGroups.add(tgtNode.id);
    const children = activeNodes.filter((n) => n.parentNode === tgtNode.id);
    result.push(...children);
    // Weiter durch ausgehende Edges
    for (const nextEdge of edges.filter((e) => e.source === tgtNode.id)) {
      result.push(
        ...collectReachableNodes(
          nextEdge.target,
          allNodes,
          activeNodes,
          edges,
          visitedGroups,
        ),
      );
    }
  } else {
    result.push(tgtNode);
    // Weiter durch ausgehende Edges
    for (const nextEdge of edges.filter((e) => e.source === tgtNode.id)) {
      result.push(
        ...collectReachableNodes(
          nextEdge.target,
          allNodes,
          activeNodes,
          edges,
          visitedGroups,
        ),
      );
    }
  }

  return result;
}

/**
 * Computes the connected components of the flow, including group merging and splitting for
 * groups whose outputs branch to several targets, and sorts them by their visual position
 * on the canvas (Y first, X as the tie-breaker).
 *
 * IMPORTANT: this ordering matters because the backend assigns register indices based on
 * the array order. Without it, nodes would end up in creation order rather than visual
 * order.
 *
 * Used both by analyzeComponents (backend compile) and live by the canvas (qubit index
 * display in qubit.tsx via src/lib/qubitIndexing.ts), so that the two ALWAYS use exactly
 * the same grouping and ordering and cannot drift apart.
 */
export function computeOrderedComponents(
  nodes: Node[],
  edges: Edge[],
): Node[][] {
  const activeNodes = nodes.filter((n) => n.type !== "groupNode");
  if (activeNodes.length === 0) return [];

  // find the connected components, taking group edges into account
  const rawComponents = findConnectedComponents(activeNodes, edges, nodes);

  // helper: determine the target group ID of an edge
  const getEdgeTargetGroupId = (edge: Edge): string => {
    const tgtNode = nodes.find((n) => n.id === edge.target);
    return tgtNode?.type === "groupNode"
      ? tgtNode.id
      : (tgtNode?.parentNode ?? edge.target);
  };

  // identify groups whose outputs go to several different targets
  const groupsWithMultipleTargets = new Set<string>();
  for (const node of nodes) {
    if (node.type !== "groupNode") continue;
    const outEdges = edges.filter((e) => e.source === node.id);
    if (outEdges.length <= 1) continue;
    const targets = new Set(outEdges.map((e) => getEdgeTargetGroupId(e)));
    if (targets.size > 1) groupsWithMultipleTargets.add(node.id);
  }

  // check whether the canvas contains any groups at all
  const hasGroups = nodes.some((n) => n.type === "groupNode");

  let components: Node[][];

  if (groupsWithMultipleTargets.size === 0) {
    // no split needed, merge the components belonging to the same group
    const mergedComponents: Node[][] = [];
    const groupComponentMap = new Map<string, number>();

    // collect standalone circuits (no parentNode)
    const standaloneComponents: Node[][] = [];

    // helper: find a node's topmost (root) group by walking up the parentNode chain
    const getRootGroupId = (n: Node): string | null => {
      let current: Node | undefined = n;
      let rootId: string | null = null;
      while (current?.parentNode) {
        rootId = current.parentNode;
        current = nodes.find((x) => x.id === current!.parentNode);
      }
      return rootId;
    };

    for (const component of rawComponents) {
      const parentIds = [
        ...new Set(
          component.map((n) => n.parentNode).filter(Boolean) as string[],
        ),
      ];

      if (parentIds.length === 0) {
        // truly standalone component: no node has a parentNode
        if (!hasGroups) {
          standaloneComponents.push(component);
        } else {
          mergedComponents.push(component);
        }
        continue;
      }

      // determine the component's root group(s), taking nested groups into account
      const rootGroupIds = new Set(
        component.map((n) => getRootGroupId(n)).filter(Boolean) as string[],
      );

      if (rootGroupIds.size === 1) {
        // all nodes of the component belong to the same root group, directly or through nesting
        const rootGroupId = [...rootGroupIds][0];
        if (groupComponentMap.has(rootGroupId)) {
          mergedComponents[groupComponentMap.get(rootGroupId)!].push(
            ...component,
          );
        } else {
          groupComponentMap.set(rootGroupId, mergedComponents.length);
          mergedComponents.push([...component]);
        }
      } else {
        // the component spans several independent root groups, so handle it separately
        mergedComponents.push(component);
      }
    }

    // merge all standalone circuits into a single component (only when there are no groups)
    if (standaloneComponents.length > 0) {
      const merged = standaloneComponents.flat();
      mergedComponents.push(merged);
    }

    components = mergedComponents;
  } else {
    // split: create separate sub-components for every group that has to be split
    components = [];
    const usedNodeIds = new Set<string>();

    for (const splitGroupId of groupsWithMultipleTargets) {
      const outEdges = edges.filter((e) => e.source === splitGroupId);
      const groupKindNodes = activeNodes.filter(
        (n) => n.parentNode === splitGroupId,
      );
      const internalEdges = edges.filter(
        (e) =>
          groupKindNodes.some((n) => n.id === e.source) &&
          groupKindNodes.some((n) => n.id === e.target),
      );
      const internalTargets = new Set(internalEdges.map((e) => e.target));

      for (const outEdge of outEdges) {
        const handleId = outEdge.sourceHandle ?? "";
        let sourceKindNode = groupKindNodes.find((n) =>
          handleId.includes(n.id),
        );
        if (!sourceKindNode) {
          const outputNodes = groupKindNodes.filter(
            (n) => !internalTargets.has(n.id) && n.type !== "qubitNode",
          );
          const idx = outEdges.indexOf(outEdge);
          sourceKindNode = outputNodes[idx] ?? outputNodes[0];
        }
        if (!sourceKindNode) continue;

        // BFS to collect the qubit path inside the group
        const subNodes: Node[] = [];
        const visited = new Set<string>();
        const queue = [sourceKindNode.id];
        visited.add(sourceKindNode.id);
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const n = groupKindNodes.find((n) => n.id === currentId);
          if (n) subNodes.push(n);
          for (const e of internalEdges) {
            if (e.source === currentId && !visited.has(e.target)) {
              visited.add(e.target);
              queue.push(e.target);
            }
            if (e.target === currentId && !visited.has(e.source)) {
              visited.add(e.source);
              queue.push(e.source);
            }
          }
        }

        // collect the target nodes reachable through the edge
        const targetNodes = collectReachableNodes(
          outEdge.target,
          nodes,
          activeNodes,
          edges,
          new Set([splitGroupId]),
        );

        const allSubNodes = [...subNodes, ...targetNodes];
        allSubNodes.forEach((n) => usedNodeIds.add(n.id));
        components.push(allSubNodes);
      }
    }

    // remaining components from rawComponents that were not part of a split group
    for (const comp of rawComponents) {
      const notUsed = comp.filter((n) => !usedNodeIds.has(n.id));
      if (notUsed.length > 0) components.push(notUsed);
    }
  }

  // Sort by visual position (Y first, then X) so that "higher up on the canvas" reliably
  // maps to lower register indices, independent of the node creation order.
  const sortByVisualPosition = (a: Node, b: Node): number => {
    const ay = a.positionAbsolute?.y ?? a.position.y;
    const by = b.positionAbsolute?.y ?? b.position.y;
    if (ay !== by) return ay - by;
    const ax = a.positionAbsolute?.x ?? a.position.x;
    const bx = b.positionAbsolute?.x ?? b.position.x;
    return ax - bx;
  };

  return components.map((componentNodes) =>
    [...componentNodes].sort(sortByVisualPosition),
  );
}

/**
 * Sends the connected components to the backend.
 */
export async function analyzeComponents(
  nodes: Node[],
  edges: Edge[],
  backendUrl: string,
  metadata: any,
  compilationTarget: string,
): Promise<DiracComponent[]> {
  // activeNodes is captured below as a closure variable by expandEdges/findChild
  const activeNodes = nodes.filter((n) => n.type !== "groupNode");
  if (activeNodes.length === 0) return [];

  const components = computeOrderedComponents(nodes, edges);
  if (components.length === 0) return [];

  // expand group edges for the backend calls
  const expandEdges = (componentNodes: Node[]): Edge[] => {
    const nodeIds = new Set(componentNodes.map((n) => n.id));
    const result: Edge[] = [];

    for (const edge of edges) {
      const srcNode = nodes.find((n) => n.id === edge.source);
      const tgtNode = nodes.find((n) => n.id === edge.target);

      if (srcNode?.type === "groupNode" || tgtNode?.type === "groupNode") {
        // find the matching child node from the handle ID

        const findChild = (
          handleId: string | null,
          groupId: string,
        ): Node | undefined => {
          if (!handleId) return undefined;
          const children = activeNodes.filter((n) => n.parentNode === groupId);

          // check whether the handle ID contains a child node ID
          const match = children.find((n) => handleId.includes(n.id));
          if (match) return match;

          // fallback: find the first node without an internal input,
          // i.e. the entry node of the group
          if (handleId.includes("groupInput")) {
            const internalEdges = edges.filter(
              (e) =>
                children.some((c) => c.id === e.source) &&
                children.some((c) => c.id === e.target),
            );
            const internalTargets = new Set(internalEdges.map((e) => e.target));
            // a node that is not an internal target is the entry node
            return (
              children.find(
                (n) => !internalTargets.has(n.id) && n.type !== "qubitNode",
              ) ?? children[0]
            );
          }
          if (handleId.includes("groupOutput")) {
            const internalEdges = edges.filter(
              (e) =>
                children.some((c) => c.id === e.source) &&
                children.some((c) => c.id === e.target),
            );
            const internalSources = new Set(internalEdges.map((e) => e.source));
            // a node that is not an internal source is the exit node
            return (
              children.find((n) => !internalSources.has(n.id)) ??
              children[children.length - 1]
            );
          }
          return children[0];
        };

        const realSrc =
          srcNode?.type === "groupNode"
            ? findChild(edge.sourceHandle, srcNode.id)
            : srcNode;
        const realTgt =
          tgtNode?.type === "groupNode"
            ? findChild(edge.targetHandle, tgtNode.id)
            : tgtNode;

        if (
          realSrc &&
          realTgt &&
          nodeIds.has(realSrc.id) &&
          nodeIds.has(realTgt.id)
        ) {
          const newSourceHandle = edge.sourceHandle?.includes("groupOutput")
            ? `quantumHandleGateOutput0${realSrc.id}`
            : edge.sourceHandle;
          const newTargetHandle = edge.targetHandle?.includes("groupInput")
            ? `quantumHandleGateInput0${realTgt.id}`
            : edge.targetHandle;
          result.push({
            ...edge,
            id: `expanded-${edge.id}`,
            source: realSrc.id,
            target: realTgt.id,
            sourceHandle: newSourceHandle,
            targetHandle: newTargetHandle,
          });
        }
      } else if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        result.push(edge);
      }
    }
    return result;
  };

  // determine label and color of a component
  const getComponentInfo = (componentNodes: Node[]) => {
    const parentIds = new Set(
      componentNodes.map((n) => n.parentNode).filter(Boolean) as string[],
    );

    if (parentIds.size === 1) {
      // all nodes are in the same group
      const groupId = [...parentIds][0];
      const groupNode = nodes.find((n) => n.id === groupId);
      return {
        label: groupNode?.data?.label || "Group",
        color: groupNode?.data?.color || "#6366f1",
        groupId,
      };
    } else if (parentIds.size > 1) {
      // Nodes aus mehreren Gruppen → zusammengesetzter Name
      const groupNames = [...parentIds].map((gid) => {
        const g = nodes.find((n) => n.id === gid);
        return g?.data?.label || "Group";
      });
      return {
        label: groupNames.join(" → "),
        color: "#8b5cf6",
        groupId: null,
      };
    }
    return { label: null, color: "#6366f1", groupId: null };
  };

  const jobs = components.map((componentNodes) => {
    const info = getComponentInfo(componentNodes);
    return {
      label: info.label,
      groupId: info.groupId,
      color: info.color,
      originalNodeIds: componentNodes.map((n) => n.id),
      jobNodes: componentNodes.map((n) => ({
        ...n,
        parentNode: undefined,
        extent: undefined,
        position: n.positionAbsolute ?? n.position,
      })),
      jobEdges: expandEdges(componentNodes),
    };
  });

  // run all jobs in parallel
  const results = await Promise.allSettled(
    jobs.map(async (job, index) => {
      try {
        const response = await startCompile(
          backendUrl,
          metadata,
          job.jobNodes,
          job.jobEdges,
          compilationTarget,
        );

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const data = await response.json();
        const uuid = data.uuid;
        if (!uuid) throw new Error("No UUID from backend");

        const statusUrl = `${backendUrl}/status/${uuid}`;
        const resultUrl = `${backendUrl}/results/${uuid}`;
        const qasm = await pollForResult(statusUrl, resultUrl);

        return {
          index,
          groupLabel: job.label,
          groupId: job.groupId,
          groupColor: job.color,
          nodeIds: job.originalNodeIds,
          nodes: job.jobNodes,
          qasm,
          error: null,
        } as DiracComponent;
      } catch (e) {
        return {
          index,
          groupLabel: job.label,
          groupId: job.groupId,
          groupColor: job.color,
          nodeIds: job.originalNodeIds,
          nodes: job.jobNodes,
          qasm: null,
          error: e instanceof Error ? e.message : "Unknown error",
        } as DiracComponent;
      }
    }),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      index,
      groupLabel: null,
      groupId: null,
      groupColor: "#6366f1",
      nodeIds: jobs[index]?.originalNodeIds ?? [],
      nodes: jobs[index]?.jobNodes ?? [],
      qasm: null,
      error: "Backend call failed",
    };
  });
}

/**
 * Polls the status endpoint until the result is ready, then fetches the QASM from the
 * result endpoint. Uses the same logic as sendToBackend in App.tsx.
 */
async function pollForResult(
  statusUrl: string,
  resultUrl: string,
  maxWaitMs = 60000,
  intervalMs = 1000,
): Promise<string | null> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const statusRes = await fetch(statusUrl);
    if (!statusRes.ok) throw new Error(`Status-Fehler: ${statusRes.status}`);

    const statusData = await statusRes.json();
    const status = statusData.status ?? statusData.state ?? "";

    console.log("Komponente Status:", status);

    if (
      status === "completed" ||
      status === "SUCCESS" ||
      status === "success" ||
      status === "DONE"
    ) {
      // fetch the result; App.tsx reads the response text directly as QASM
      const resultRes = await fetch(resultUrl);
      if (!resultRes.ok) throw new Error(`Result-Fehler: ${resultRes.status}`);

      // try plain text first (QASM directly), then JSON
      const resultText = await resultRes.text();
      console.log(
        "Komponente Result (erste 100 Zeichen):",
        resultText.slice(0, 100),
      );

      // if it looks like QASM, return it as is
      if (resultText.includes("OPENQASM") || resultText.includes("qubit")) {
        return resultText;
      }

      // otherwise parse it as JSON
      try {
        const resultData = JSON.parse(resultText);
        return (
          resultData.openQASMCode ??
          resultData.result?.openQASMCode ??
          resultData.qasm ??
          resultData.code ??
          null
        );
      } catch {
        return resultText || null;
      }
    }

    if (
      status === "failed" ||
      status === "FAILED" ||
      status === "ERROR" ||
      status === "error"
    ) {
      throw new Error(`Backend-Job fehlgeschlagen: ${status}`);
    }
  }

  throw new Error("Timeout: Backend hat nicht rechtzeitig geantwortet");
}
