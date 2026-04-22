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
 */
export function findConnectedComponents(
  nodes: Node[],
  edges: Edge[]
): Node[][] {
  // Nur echte Schaltkreis-Nodes (keine Gruppen, keine versteckten)
  const activeNodes = nodes.filter(
    (n) => n.type !== "groupNode" && !n.hidden
  );

  if (activeNodes.length === 0) return [];

  const nodeIds = new Set(activeNodes.map((n) => n.id));

  // Adjazenzliste aufbauen (bidirektional)
  const adjacency = new Map<string, Set<string>>();
  for (const node of activeNodes) {
    adjacency.set(node.id, new Set());
  }

  for (const edge of edges) {
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

    // Neue Komponente starten
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
 * Sendet jede Gruppe/Komponente als einen Backend-Call.
 * Nodes derselben Gruppe werden zusammen gesendet.
 * Ungrouped Nodes werden als separate Schaltkreise gesendet.
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

  // Gruppen-IDs sammeln
  const groupIds = new Set(
    activeNodes.map((n) => n.parentNode).filter(Boolean) as string[]
  );

  // Ungrouped Nodes → separate Komponenten per BFS
  const ungroupedNodes = activeNodes.filter((n) => !n.parentNode);
  const ungroupedComponents = findConnectedComponents(ungroupedNodes, edges);

  // Jobs aufbauen: eine Job-Einheit pro Gruppe + eine pro ungrouped Komponente
  type Job = {
    label: string | null;
    groupId: string | null;
    color: string;
    jobNodes: Node[];
    jobEdges: Edge[];
  };

  const jobs: Job[] = [];

  // Jobs für Gruppen
  for (const groupId of groupIds) {
    const groupNode = nodes.find((n) => n.id === groupId);
    const groupNodes = activeNodes.filter((n) => n.parentNode === groupId);
    const nodeIds = new Set(groupNodes.map((n) => n.id));
    const groupEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    jobs.push({
      label: groupNode?.data?.label || "Gruppe",
      groupId,
      color: groupNode?.data?.color || "#6366f1",
      jobNodes: groupNodes.map((n) => ({
        ...n,
        parentNode: undefined,
        extent: undefined,
        position: n.positionAbsolute ?? n.position,
      })),
      jobEdges: groupEdges,
    });
  }

  // Jobs für ungrouped Komponenten
  ungroupedComponents.forEach((componentNodes, idx) => {
    const nodeIds = new Set(componentNodes.map((n) => n.id));
    const componentEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
    jobs.push({
      label: ungroupedComponents.length === 1 ? null : `Schaltkreis ${idx + 1}`,
      groupId: null,
      color: "#6366f1",
      jobNodes: componentNodes.map((n) => ({
        ...n,
        parentNode: undefined,
        extent: undefined,
        position: n.positionAbsolute ?? n.position,
      })),
      jobEdges: componentEdges,
    });
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

        if (!response.ok) throw new Error(`Backend Fehler: ${response.status}`);

        const data = await response.json();
        const uuid = data.uuid;
        if (!uuid) throw new Error("Keine UUID vom Backend erhalten");

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
          error: e instanceof Error ? e.message : "Unbekannter Fehler",
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
      error: "Fehler beim Backend-Call",
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
