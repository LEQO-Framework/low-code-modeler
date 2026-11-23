import { useEffect, useMemo, useRef, useState } from "react";
import { Node, Panel, useNodes } from "reactflow";
import { Search, X } from "lucide-react";
import { categories } from "./panels/categories";

/** Readable names of node types that have no meaningful label of their own. */
const TYPE_NAMES: Record<string, string> = {
  gateNode: "Gate",
  qubitNode: "Qubit",
  measurementNode: "Measurement",
  statePreparationNode: "State Preparation",
  dataTypeNode: "Data Type",
  classicalOperatorNode: "Classical Operator",
  quantumOperatorNode: "Quantum Operator",
  algorithmNode: "Algorithm",
  classicalAlgorithmNode: "Classical Algorithm",
  controlStructureNode: "Control Structure",
  ifElseNode: "If-Else",
  splitterNode: "Splitter",
  mergerNode: "Merger",
  ancillaNode: "Ancilla",
  groupNode: "Group",
  pluginNode: "Plugin",
  editableNode: "Domain Block",
};

/** Palette display names (e.g. "H" -> "Hadamard (H)"), collected once. */
function collectDisplayNames(): Map<string, string> {
  const names = new Map<string, string>();
  const visit = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry?.label && entry?.displayName) {
          names.set(entry.label, entry.displayName);
        }
      });
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };
  Object.values(categories).forEach((category: any) =>
    visit(category?.content),
  );
  return names;
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLElement && target.isContentEditable);

interface CanvasSearchProps {
  /** Selects the node and centers the canvas on it. */
  onFocusNode: (nodeId: string) => void;
}

/**
 * Search field on the canvas, opened with Ctrl + F (no button), to find a node of the model by name,
 * type, qubit identifier or ID and jump to it.
 */
export default function CanvasSearch({ onFocusNode }: CanvasSearchProps) {
  const nodes = useNodes<any>();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayNames = useMemo(collectDisplayNames, []);

  const nameOf = (node: Node) => {
    const label = typeof node.data?.label === "string" ? node.data.label : "";
    return (
      displayNames.get(label) ??
      (label || TYPE_NAMES[node.type ?? ""] || node.type || node.id)
    );
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter((node) => {
        const haystack = [
          nameOf(node),
          node.data?.label,
          TYPE_NAMES[node.type ?? ""],
          node.type,
          node.id,
          ...(Array.isArray(node.data?.identifiers)
            ? node.data.identifiers
            : []),
          node.data?.outputIdentifier,
        ]
          .filter((value) => typeof value === "string")
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 50);
    // nameOf only depends on displayNames, which is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, query, displayNames]);

  useEffect(() => setActiveIndex(0), [query]);

  // Ctrl/Cmd + F opens the search, Escape closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        if (isEditableTarget(e.target) && e.target !== inputRef.current) return;
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.select(), 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (node: Node | undefined) => {
    if (!node) return;
    onFocusNode(node.id);
    close();
  };

  // Opened with Ctrl + F only (listed in the keyboard shortcut overview).
  if (!open) return null;

  return (
    <>
      {/* below the help button, so it does not overlap the Experience Mode bar */}
      <Panel position="top-right" className="!mx-4 !mt-[72px] !z-20">
        <div className="w-80 rounded-lg border border-gray-300 bg-white text-left shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Find node on canvas..."
              aria-label="Find node on canvas"
              className="w-full bg-transparent text-sm outline-none"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  close();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  choose(results[activeIndex]);
                }
              }}
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {query.trim() && (
            <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
              {results.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">
                  No matching nodes.
                </li>
              )}
              {results.map((node, index) => (
                <li
                  key={node.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    // keep the focus in the input, so Enter/arrows keep working
                    e.preventDefault();
                    setActiveIndex(index);
                    choose(node);
                  }}
                  className={`cursor-pointer px-3 py-1.5 text-sm ${
                    index === activeIndex
                      ? "bg-blue-50 text-blue-800"
                      : "text-gray-800"
                  }`}
                >
                  <div className="font-medium">{nameOf(node)}</div>
                  <div className="truncate text-xs text-gray-500">
                    {[
                      TYPE_NAMES[node.type ?? ""] ?? node.type,
                      Array.isArray(node.data?.identifiers) &&
                      node.data.identifiers.length > 0
                        ? node.data.identifiers.join(", ")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </>
  );
}
