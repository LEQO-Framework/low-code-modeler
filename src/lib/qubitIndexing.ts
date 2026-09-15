/**
 * qubitIndexing.ts
 * Platzierung: src/lib/qubitIndexing.ts
 *
 * Berechnet für jeden QubitNode auf dem Canvas den Register-Index, den er auch beim
 * tatsächlichen Kompilieren zum Backend bekommen würde (Variante 2: "echter" Index,
 * nicht nur simple visuelle Durchnummerierung).
 *
 * WICHTIG: Nutzt dieselbe computeOrderedComponents-Funktion wie componentAnalyzer.ts
 * (Komponenten-Gruppierung + Sortierung nach visueller Position), damit die hier
 * angezeigten Indizes garantiert mit dem übereinstimmen, was beim Senden ans Backend
 * tatsächlich passiert. Falls sich die Gruppierungs-/Sortierlogik künftig ändert, muss
 * das NUR in computeOrderedComponents angepasst werden - diese Datei zieht automatisch nach.
 */

import { Node, Edge } from "reactflow";
import { computeOrderedComponents } from "./componentAnalyzer";

/**
 * Liefert eine Map von Node-ID -> Start-Index im Register für jeden QubitNode.
 *
 * Ein einzelner QubitNode kann laut node.data.size mehr als 1 Qubit umfassen
 * (Standard: 1, falls size fehlt/ungültig ist). In diesem Fall ist der zurückgegebene
 * Wert der STARTINDEX des belegten Bereichs (z.B. size=2 -> belegt Indizes {start, start+1}).
 * Nicht-Qubit-Nodes (Gates, DataType-Nodes, etc.) tauchen in der Map nicht auf.
 */
/**
 * Prüft ob ein Node eine "Qubit-Quelle" ist, die einen eigenen Register-Index belegt.
 * Zwei Fälle werden erkannt:
 * 1. type === "qubitNode": der "klassische" QubitNode aus qubit.tsx.
 * 2. type === "gateNode" && data.label === "Qubit Circuit": im "Experience Mode" werden
 *    Qubit-Quellen über die generische GateNode-Komponente (gate.tsx) gerendert, erkennbar
 *    ausschließlich am label "Qubit Circuit" (siehe isQubit-Check dort). Ohne diesen Fall
 *    würde computeQubitIndices im Experience Mode gar keine Qubits finden.
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
 * Liefert für einen einzelnen QubitNode ein Label für die Anzeige (z.B. "0" oder "0–1"
 * bei einem Register mit size > 1), oder null falls der Node nicht gefunden wird / kein
 * QubitNode ist.
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
