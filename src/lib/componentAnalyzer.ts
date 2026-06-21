/**
 * componentAnalyzer.ts
 * Platzierung: src/lib/componentAnalyzer.ts
 *
 * Findet zusammenhängende Teilgraphen (Connected Components) im Flow
 * und sendet jeden separat ans Backend um eigene QASM/Dirac-Ausgaben zu erhalten.
 */

import { Node, Edge } from "reactflow";
import { startCompile } from "../backend";

export interface DiracComponent {
  /** Eindeutiger Index der Komponente */
  index: number;
  /** Gruppenname wenn alle Nodes in derselben Gruppe sind, sonst null */
  groupLabel: string | null;
  /** Gruppen-ID für Zusammenfassung */
  groupId: string | null;
  /** Gruppenfarbe */
  groupColor: string;
  /** Originale Node-IDs (vor Transformation, für Canvas-Export) */
  nodeIds: string[];
  /** Nodes dieser Komponente */
  nodes: Node[];
  /** QASM-Output vom Backend (null wenn Fehler) */
  qasm: string | null;
  /** Fehlermeldung falls Backend-Call fehlschlug */
  error: string | null;
}

/**
 * Findet alle zusammenhängenden Teilgraphen im Flow per BFS.
 * Ignoriert GroupNodes und versteckte Nodes.
 * Gruppen-Edges werden auf Kind-Nodes erweitert.
 */
export function findConnectedComponents(
  nodes: Node[],
  edges: Edge[],
  allNodes?: Node[]
): Node[][] {
  const activeNodes = nodes.filter(
    (n) => n.type !== "groupNode"
  );

  if (activeNodes.length === 0) return [];

  const nodeIds = new Set(activeNodes.map((n) => n.id));
  // allNodes enthält auch GroupNodes für die Expansion
  const fullNodes = allNodes ?? nodes;

  // Gruppen-Edges expandieren
  const expandedEdges: Edge[] = [];
  for (const edge of edges) {
    const sourceNode = fullNodes.find((n) => n.id === edge.source);
    const targetNode = fullNodes.find((n) => n.id === edge.target);

    if (sourceNode?.type === "groupNode" || targetNode?.type === "groupNode") {
      const sourceChildren = sourceNode?.type === "groupNode"
        ? activeNodes.filter((n) => n.parentNode === sourceNode.id)
        : sourceNode ? [sourceNode] : [];
      const targetChildren = targetNode?.type === "groupNode"
        ? activeNodes.filter((n) => n.parentNode === targetNode.id)
        : targetNode ? [targetNode] : [];

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

  // BFS um zusammenhängende Komponenten zu finden
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
 * Bestimmt den Gruppennamen einer Komponente.
 * Wenn alle Nodes in derselben Gruppe sind → Gruppenname.
 * Sonst → null.
 */
function getComponentGroupInfo(
  componentNodes: Node[],
  allNodes: Node[]
): { label: string | null; color: string; groupId: string | null } {
  const parentIds = new Set(
    componentNodes.map((n) => n.parentNode).filter(Boolean)
  );

  if (parentIds.size === 1) {
    const groupId = [...parentIds][0]!;
    const groupNode = allNodes.find((n) => n.id === groupId);
    if (groupNode) {
      return {
        label: groupNode.data?.label || "Group",
        color: groupNode.data?.color || "#6366f1",
        groupId,
      };
    }
  }

  return { label: null, color: "#6366f1", groupId: null };
}

/**
 * Sammelt alle erreichbaren Kind-Nodes von einem Gruppen-Target aus.
 */
function collectReachableNodes(
  targetId: string,
  allNodes: Node[],
  activeNodes: Node[],
  edges: Edge[],
  visitedGroups: Set<string> = new Set()
): Node[] {
  const tgtNode = allNodes.find(n => n.id === targetId);
  if (!tgtNode) return [];

  const result: Node[] = [];

  if (tgtNode.type === "groupNode") {
    if (visitedGroups.has(tgtNode.id)) return [];
    visitedGroups.add(tgtNode.id);
    const children = activeNodes.filter(n => n.parentNode === tgtNode.id);
    result.push(...children);
    // Weiter durch ausgehende Edges
    for (const nextEdge of edges.filter(e => e.source === tgtNode.id)) {
      result.push(...collectReachableNodes(nextEdge.target, allNodes, activeNodes, edges, visitedGroups));
    }
  } else {
    result.push(tgtNode);
    // Weiter durch ausgehende Edges
    for (const nextEdge of edges.filter(e => e.source === tgtNode.id)) {
      result.push(...collectReachableNodes(nextEdge.target, allNodes, activeNodes, edges, visitedGroups));
    }
  }

  return result;
}

/**
 * Sendet zusammenhängende Komponenten ans Backend.
 */
export async function analyzeComponents(
  nodes: Node[],
  edges: Edge[],
  backendUrl: string,
  metadata: any,
  compilationTarget: string
): Promise<DiracComponent[]> {
  const activeNodes = nodes.filter(
    (n) => n.type !== "groupNode"
  );
  if (activeNodes.length === 0) return [];

  // Zusammenhängende Komponenten finden (berücksichtigt Gruppen-Edges)
  const rawComponents = findConnectedComponents(activeNodes, edges, nodes);

  // Hilfsfunktion: Ziel-Gruppen-ID einer Edge bestimmen
  const getEdgeTargetGroupId = (edge: Edge): string => {
    const tgtNode = nodes.find(n => n.id === edge.target);
    return tgtNode?.type === "groupNode" ? tgtNode.id : (tgtNode?.parentNode ?? edge.target);
  };

  // Für jede Gruppe prüfen ob ihre Outputs zu verschiedenen Zielen gehen
  const splitGroupComponents = (groupId: string, groupNodes: Node[]): Node[][] => {
    const groupNodeIds = new Set(groupNodes.map(n => n.id));

    // Externe Edges die von dieser Gruppe ausgehen
    const externalEdges = edges.filter(e => {
      const srcNode = nodes.find(n => n.id === e.source);
      // Edge geht von GroupNode selbst aus
      if (srcNode?.type === "groupNode" && srcNode.id === groupId) return true;
      // Edge geht von einem Kind-Node nach außen
      if (groupNodeIds.has(e.source)) {
        const tgtNode = nodes.find(n => n.id === e.target);
        return !groupNodeIds.has(e.target) && tgtNode?.parentNode !== groupId;
      }
      return false;
    });

    if (externalEdges.length <= 1) return [groupNodes];

    // Ziele bestimmen
    const targetGroups = new Set(externalEdges.map(e => getEdgeTargetGroupId(e)));
    if (targetGroups.size <= 1) return [groupNodes];

    // Interne Edges der Gruppe
    const internalEdges = edges.filter(
      e => groupNodeIds.has(e.source) && groupNodeIds.has(e.target)
    );
    const internalTargets = new Set(internalEdges.map(e => e.target));

    // Für jede externe Edge den zugehörigen Kind-Node finden
    // und per BFS rückwärts alle verbundenen Nodes sammeln
    const subComponents: Node[][] = [];
    const assignedNodes = new Set<string>();

    for (const edge of externalEdges) {
      const srcNode = nodes.find(n => n.id === edge.source);

      // Finde den Ausgangs-Kind-Node dieser Edge
      let sourceKindNode: Node | undefined;

      if (srcNode?.type === "groupNode") {
        // Proxy-Handle: Handle-ID enthält Kind-Node ID
        const handleId = edge.sourceHandle ?? "";
        sourceKindNode = groupNodes.find(n => handleId.includes(n.id));

        // Fallback: finde den Kind-Node der kein internes Target ist
        // und zu diesem Ziel führt (per Index)
        if (!sourceKindNode) {
          const outputNodes = groupNodes.filter(n => !internalTargets.has(n.id) && n.type !== "qubitNode" && n.type !== "groupNode");
          const edgeIndex = externalEdges.indexOf(edge);
          sourceKindNode = outputNodes[edgeIndex] ?? outputNodes[0];
        }
      } else {
        sourceKindNode = srcNode;
      }

      if (!sourceKindNode) continue;

      // BFS rückwärts: finde alle Nodes die zu diesem Ausgangs-Node führen
      const subComponent: Node[] = [];
      const visited = new Set<string>();
      const queue = [sourceKindNode.id];
      visited.add(sourceKindNode.id);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentNode = groupNodes.find(n => n.id === currentId);
        if (currentNode) subComponent.push(currentNode);

        // Vorwärts-Nachbarn (intern)
        for (const e of internalEdges) {
          if (e.source === currentId && !visited.has(e.target)) {
            visited.add(e.target);
            queue.push(e.target);
          }
        }
        // Rückwärts-Nachbarn (intern)
        for (const e of internalEdges) {
          if (e.target === currentId && !visited.has(e.source)) {
            visited.add(e.source);
            queue.push(e.source);
          }
        }
      }

      subComponent.forEach(n => assignedNodes.add(n.id));
      if (subComponent.length > 0) subComponents.push(subComponent);
    }

    // Nicht zugeordnete Nodes zur ersten Sub-Komponente
    const unassigned = groupNodes.filter(n => !assignedNodes.has(n.id));
    if (unassigned.length > 0 && subComponents.length > 0) {
      subComponents[0].push(...unassigned);
    } else if (unassigned.length > 0) {
      subComponents.push(unassigned);
    }

    return subComponents.length > 0 ? subComponents : [groupNodes];
  };

  // Gruppen mit mehreren Outputs zu verschiedenen Zielen identifizieren
  const groupsWithMultipleTargets = new Set<string>();
  for (const node of nodes) {
    if (node.type !== "groupNode") continue;
    const outEdges = edges.filter(e => e.source === node.id);
    if (outEdges.length <= 1) continue;
    const targets = new Set(outEdges.map(e => getEdgeTargetGroupId(e)));
    if (targets.size > 1) groupsWithMultipleTargets.add(node.id);
  }

  // Prüfen ob Gruppen im Canvas vorhanden sind
  const hasGroups = nodes.some(n => n.type === "groupNode");

  let components: Node[][];

  if (groupsWithMultipleTargets.size === 0) {
    // Keine Aufteilung nötig – Komponenten derselben Gruppe zusammenführen
    const mergedComponents: Node[][] = [];
    const groupComponentMap = new Map<string, number>();

    // Freistehende Circuits (kein parentNode) sammeln
    const standaloneComponents: Node[][] = [];

    // Hilfsfunktion: oberste (Root-)Gruppe eines Nodes finden, indem die parentNode-Kette hochgegangen wird
    const getRootGroupId = (n: Node): string | null => {
      let current: Node | undefined = n;
      let rootId: string | null = null;
      while (current?.parentNode) {
        rootId = current.parentNode;
        current = nodes.find(x => x.id === current!.parentNode);
      }
      return rootId;
    };

    for (const component of rawComponents) {
      const parentIds = [...new Set(component.map(n => n.parentNode).filter(Boolean) as string[])];

      if (parentIds.length === 0) {
        // Echt freistehende Komponente (kein parentNode bei irgendeinem Node)
        if (!hasGroups) {
          standaloneComponents.push(component);
        } else {
          mergedComponents.push(component);
        }
        continue;
      }

      // Root-Gruppe(n) der Komponente bestimmen (berücksichtigt verschachtelte Gruppen)
      const rootGroupIds = new Set(
        component.map(n => getRootGroupId(n)).filter(Boolean) as string[]
      );

      if (rootGroupIds.size === 1) {
        // Alle Nodes der Komponente gehören (direkt oder über Verschachtelung) zur selben Root-Gruppe
        const rootGroupId = [...rootGroupIds][0];
        if (groupComponentMap.has(rootGroupId)) {
          mergedComponents[groupComponentMap.get(rootGroupId)!].push(...component);
        } else {
          groupComponentMap.set(rootGroupId, mergedComponents.length);
          mergedComponents.push([...component]);
        }
      } else {
        // Komponente verteilt sich über mehrere unabhängige Root-Gruppen → separat behandeln
        mergedComponents.push(component);
      }
    }

    // Alle freistehenden als eine einzige Komponente zusammenführen (nur wenn keine Gruppen)
    if (standaloneComponents.length > 0) {
      const merged = standaloneComponents.flat();
      mergedComponents.push(merged);
    }

    components = mergedComponents;
  } else {
    // Aufteilen: für jede Split-Gruppe separate Sub-Komponenten erstellen
    components = [];
    const usedNodeIds = new Set<string>();

    for (const splitGroupId of groupsWithMultipleTargets) {
      const outEdges = edges.filter(e => e.source === splitGroupId);
      const groupKindNodes = activeNodes.filter(n => n.parentNode === splitGroupId);
      const internalEdges = edges.filter(
        e => groupKindNodes.some(n => n.id === e.source) &&
             groupKindNodes.some(n => n.id === e.target)
      );
      const internalTargets = new Set(internalEdges.map(e => e.target));

      for (const outEdge of outEdges) {
        const handleId = outEdge.sourceHandle ?? "";
        let sourceKindNode = groupKindNodes.find(n => handleId.includes(n.id));
        if (!sourceKindNode) {
          const outputNodes = groupKindNodes.filter(n => !internalTargets.has(n.id) && n.type !== "qubitNode");
          const idx = outEdges.indexOf(outEdge);
          sourceKindNode = outputNodes[idx] ?? outputNodes[0];
        }
        if (!sourceKindNode) continue;

        // BFS um Qubit-Pfad in Gruppe zu sammeln
        const subNodes: Node[] = [];
        const visited = new Set<string>();
        const queue = [sourceKindNode.id];
        visited.add(sourceKindNode.id);
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const n = groupKindNodes.find(n => n.id === currentId);
          if (n) subNodes.push(n);
          for (const e of internalEdges) {
            if (e.source === currentId && !visited.has(e.target)) { visited.add(e.target); queue.push(e.target); }
            if (e.target === currentId && !visited.has(e.source)) { visited.add(e.source); queue.push(e.source); }
          }
        }

        // Ziel-Nodes über die Edge sammeln
        const targetNodes = collectReachableNodes(outEdge.target, nodes, activeNodes, edges, new Set([splitGroupId]));

        const allSubNodes = [...subNodes, ...targetNodes];
        allSubNodes.forEach(n => usedNodeIds.add(n.id));
        components.push(allSubNodes);
      }
    }

    // Restliche Komponenten aus rawComponents die nicht in Split-Gruppen waren
    for (const comp of rawComponents) {
      const notUsed = comp.filter(n => !usedNodeIds.has(n.id));
      if (notUsed.length > 0) components.push(notUsed);
    }
  }

  // Gruppen-Edges expandieren für Backend-Calls
  const expandEdges = (componentNodes: Node[]): Edge[] => {
    const nodeIds = new Set(componentNodes.map((n) => n.id));
    const result: Edge[] = [];

    for (const edge of edges) {
      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);

      if (srcNode?.type === "groupNode" || tgtNode?.type === "groupNode") {
        // Finde den richtigen Kind-Node anhand der Handle-ID
          

        const findChild = (handleId: string | null, groupId: string): Node | undefined => {
        if (!handleId) return undefined;
        const children = activeNodes.filter(n => n.parentNode === groupId);
        
        // Prüfe ob Handle-ID eine Kind-Node ID enthält
        const match = children.find(n => handleId.includes(n.id));
        if (match) return match;
        
        // Fallback: finde den ersten Node der keinen internen Input hat
        // (d.h. der "Eingangs-Node" der Gruppe)
        if (handleId.includes("groupInput")) {
          const internalEdges = edges.filter(
            e => children.some(c => c.id === e.source) && children.some(c => c.id === e.target)
          );
          const internalTargets = new Set(internalEdges.map(e => e.target));
          // Node der kein internes Target ist = Eingangs-Node
          return children.find(n => !internalTargets.has(n.id) && n.type !== "qubitNode")
            ?? children[0];
        }
        if (handleId.includes("groupOutput")) {
          const internalEdges = edges.filter(
            e => children.some(c => c.id === e.source) && children.some(c => c.id === e.target)
          );
          const internalSources = new Set(internalEdges.map(e => e.source));
          // Node der kein internes Source ist = Ausgangs-Node
          return children.find(n => !internalSources.has(n.id))
            ?? children[children.length - 1];
        }
        return children[0];
      };

        const realSrc = srcNode?.type === "groupNode"
          ? findChild(edge.sourceHandle, srcNode.id)
          : srcNode;
        const realTgt = tgtNode?.type === "groupNode"
          ? findChild(edge.targetHandle, tgtNode.id)
          : tgtNode;

        if (realSrc && realTgt && nodeIds.has(realSrc.id) && nodeIds.has(realTgt.id)) {
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

  // Label und Farbe für eine Komponente bestimmen
  const getComponentInfo = (componentNodes: Node[]) => {
    const parentIds = new Set(componentNodes.map(n => n.parentNode).filter(Boolean) as string[]);

    if (parentIds.size === 1) {
      // Alle Nodes in derselben Gruppe
      const groupId = [...parentIds][0];
      const groupNode = nodes.find(n => n.id === groupId);
      return {
        label: groupNode?.data?.label || "Group",
        color: groupNode?.data?.color || "#6366f1",
        groupId,
      };
    } else if (parentIds.size > 1) {
      // Nodes aus mehreren Gruppen → zusammengesetzter Name
      const groupNames = [...parentIds].map(gid => {
        const g = nodes.find(n => n.id === gid);
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

  // Jobs erstellen
  const jobs = components.map((componentNodes) => {
    const info = getComponentInfo(componentNodes);
    return {
      label: info.label,
      groupId: info.groupId,
      color: info.color,
      originalNodeIds: componentNodes.map(n => n.id),
      jobNodes: componentNodes.map(n => ({
        ...n,
        parentNode: undefined,
        extent: undefined,
        position: n.positionAbsolute ?? n.position,
      })),
      jobEdges: expandEdges(componentNodes),
    };
  });

  // Alle Jobs parallel ausführen
  const results = await Promise.allSettled(
    jobs.map(async (job, index) => {
      try {
        const response = await startCompile(
          backendUrl,
          metadata,
          job.jobNodes,
          job.jobEdges,
          compilationTarget
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
    })
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
 * Pollt den Status-Endpoint bis das Ergebnis fertig ist,
 * dann holt es das QASM vom Result-Endpoint.
 * Basiert auf der gleichen Logik wie App.tsx sendToBackend.
 */
async function pollForResult(
  statusUrl: string,
  resultUrl: string,
  maxWaitMs = 60000,
  intervalMs = 1000
): Promise<string | null> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const statusRes = await fetch(statusUrl);
    if (!statusRes.ok) throw new Error(`Status-Fehler: ${statusRes.status}`);

    const statusData = await statusRes.json();
    const status = statusData.status ?? statusData.state ?? "";

    console.log("Komponente Status:", status);

    if (status === "completed" || status === "SUCCESS" || status === "success" || status === "DONE") {
      // Ergebnis abrufen – App.tsx liest den Text direkt als QASM
      const resultRes = await fetch(resultUrl);
      if (!resultRes.ok) throw new Error(`Result-Fehler: ${resultRes.status}`);

      // Versuche erst als Text (direkt QASM), dann als JSON
      const resultText = await resultRes.text();
      console.log("Komponente Result (erste 100 Zeichen):", resultText.slice(0, 100));

      // Wenn es wie QASM aussieht, direkt zurückgeben
      if (resultText.includes("OPENQASM") || resultText.includes("qubit")) {
        return resultText;
      }

      // Sonst als JSON parsen
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

    if (status === "failed" || status === "FAILED" || status === "ERROR" || status === "error") {
      throw new Error(`Backend-Job fehlgeschlagen: ${status}`);
    }
  }

  throw new Error("Timeout: Backend hat nicht rechtzeitig geantwortet");
}

