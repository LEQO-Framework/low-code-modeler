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
    (n) => n.type !== "groupNode" && !n.hidden
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
        label: groupNode.data?.label || "Gruppe",
        color: groupNode.data?.color || "#6366f1",
        groupId,
      };
    }
  }

  return { label: null, color: "#6366f1", groupId: null };
}

/**
 * Sendet zusammenhängende Komponenten ans Backend.
 * Verbundene Gruppen werden zusammen als ein Job gesendet.
 */
export async function analyzeComponents(
  nodes: Node[],
  edges: Edge[],
  backendUrl: string,
  metadata: any,
  compilationTarget: string
): Promise<DiracComponent[]> {
  const activeNodes = nodes.filter(
    (n) => n.type !== "groupNode" && !n.hidden
  );
  if (activeNodes.length === 0) return [];

  // Zusammenhängende Komponenten finden (berücksichtigt Gruppen-Edges)
  const components = findConnectedComponents(activeNodes, edges, nodes);

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
