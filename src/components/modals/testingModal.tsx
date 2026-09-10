// TestingModal.tsx
import { useState, useMemo } from "react";
import { Node, Edge, MarkerType } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import Modal from "./Modal";
import { 
  TESTABLE_NODE_REGISTRY, 
  TestableNodeSpec, 
  resolvePool, 
  ARRAY_DATATYPE_NODE_TYPE, 
  TEST_EDGE_TYPE 
} from "./testingSpecs";

import { categories, CategoryEntry } from "../panels/categories";

interface TestingModalProps {
  open: boolean;
  onClose: () => void;
  // existingNodes?: CategoryEntry[];
  onAddFlowToCanvas: (nodes: Node[], edges: Edge[]) => void;
}

const existingNodes = categories;

function extractNodeLabels(nodes: Node[] = []): Record<string, string> {
  const labels: Record<string, string> = {};

  const walk = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const label = item?.data?.label || item?.label;
        const description = item?.data?.description || item?.description || "";
        if (label) {
          labels[label] = description;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(nodes);
  return labels;
}

// --- Pairwise Generator (Heuristic) ---
function generatePairwise<T>(pools: T[][]): T[][] {
  if (pools.length === 0) return [[]];
  if (pools.length === 1) return pools[0].map(v => [v]);

  // Seed with cartesian product of first two pools to guarantee pairs
  let results: T[][] = [];
  for (const v1 of pools[0]) {
    for (const v2 of pools[1]) {
      results.push([v1, v2]);
    }
  }

  // Greedily distribute remaining pools
  for (let i = 2; i < pools.length; i++) {
    const currentPool = pools[i];
    const newResults: T[][] = [];
    
    results.forEach((row, rowIndex) => {
      const valueToAssign = currentPool[rowIndex % currentPool.length];
      newResults.push([...row, valueToAssign]);
    });

    // Expand rows if the current pool is larger than the existing result matrix
    if (currentPool.length > results.length) {
      for (let j = results.length; j < currentPool.length; j++) {
         const fallbackRow = results[0].slice(); 
         newResults.push([...fallbackRow, currentPool[j]]);
      }
    }
    results = newResults;
  }
  return results;
}

export interface GeneratedTestFlow {
  id: string;
  name: string;
  category: "option coverage" | "input coverage";
  optionValues: Record<string, string | number>;
  inputValues: Record<string, string>;
  descriptionLines: string[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildOutputHandleId(node: Node, index = 0): string {
  const kind = node.data?.isDataType ? "classical" : "quantum";
  return `${kind}Output${index}${node.id}`;
}

function describeFlow(
  spec: TestableNodeSpec,
  optionValues: Record<string, string | number>,
  inputValues: Record<string, string>
): string[] {
  const lines: string[] = [];
  spec.options.forEach((opt) => {
    lines.push(`${opt.label} (option): ${optionValues[opt.key]}`);
  });
  spec.inputs.forEach((inp) => {
    const label = inp.labelFor ? inp.labelFor(optionValues) : inp.label;
    const typeName = inp.dataTypeKey.split(":")[0];
    lines.push(`${label} (${typeName}): ${inputValues[inp.key]}`);
  });
  return lines;
}

export function generateTestFlows(spec: TestableNodeSpec): { flows: GeneratedTestFlow[]; truncated: boolean } {
  const baselineOptions: Record<string, string | number> = {};
  spec.options.forEach((opt) => (baselineOptions[opt.key] = opt.values[0]));

  const baselineInputs: Record<string, string> = {};
  spec.inputs.forEach((inp) => {
    baselineInputs[inp.key] = resolvePool(inp.dataTypeKey, baselineOptions)[0] ?? "";
  });

  const flows: GeneratedTestFlow[] = [];
  let counter = 1;
  let truncated = false;

  const optionKeys = spec.options.map((o) => o.key);
  // Using Pairwise instead of Cartesian
  let optionCombos = spec.options.length ? generatePairwise(spec.options.map((o) => o.values)) : [[]];
  
  const MAX_OPTION_COMBOS = 60;
  if (optionCombos.length > MAX_OPTION_COMBOS) {
    optionCombos = optionCombos.slice(0, MAX_OPTION_COMBOS);
    truncated = true;
  }

  optionCombos.forEach((combo) => {
    const optionValues: Record<string, string | number> = {};
    optionKeys.forEach((key, i) => (optionValues[key] = combo[i]));

    const inputValues: Record<string, string> = {};
    spec.inputs.forEach((inp) => {
      inputValues[inp.key] = resolvePool(inp.dataTypeKey, optionValues)[0] ?? "";
    });

    flows.push({
      id: uuidv4(),
      name: `Test Flow ${counter++}`,
      category: "option coverage",
      optionValues,
      inputValues,
      descriptionLines: describeFlow(spec, optionValues, inputValues),
    });
  });

  spec.inputs.forEach((inp) => {
    const pool = resolvePool(inp.dataTypeKey, baselineOptions);
    pool.forEach((value) => {
      if (value === baselineInputs[inp.key]) return; 
      const inputValues = { ...baselineInputs, [inp.key]: value };
      flows.push({
        id: uuidv4(),
        name: `Test Flow ${counter++}`,
        category: "input coverage",
        optionValues: baselineOptions,
        inputValues,
        descriptionLines: describeFlow(spec, baselineOptions, inputValues),
      });
    });
  });

  return { flows, truncated };
}

function buildCanvasFlow(
  spec: TestableNodeSpec,
  flow: GeneratedTestFlow,
  anchor: { x: number; y: number }
): { nodes: Node[]; edges: Edge[] } {
  const slug = slugify(flow.name);
  const mainId = uuidv4();

  const mainNode: Node = {
    id: mainId,
    type: spec.nodeType,
    position: { x: anchor.x, y: anchor.y },
    data: {
      ...spec.defaultData,
      ...flow.optionValues,
      outputIdentifier: `${slug}_out_${mainId.slice(0, 6)}`,
    },
  };

  const inputNodes: Node[] = [];
  const edges: Edge[] = [];

  spec.inputs.forEach((inp, i) => {
    const inputId = uuidv4();
    const raw = flow.inputValues[inp.key] ?? "";
    const arrayValue = raw === "" ? [] : raw.split(",").map((v) => v.trim());
    const label = inp.labelFor ? inp.labelFor(flow.optionValues) : inp.label;

    const inputNode: Node = {
      id: inputId,
      type: ARRAY_DATATYPE_NODE_TYPE,
      position: { x: anchor.x - 260, y: anchor.y + i * 140 },
      data: {
        isDataType: true,
        dataType: "array",
        label,
        value: arrayValue,
        outputIdentifier: `${slug}_${inp.key}_${inputId.slice(0, 6)}`,
        outputs: [],
      },
    };
    inputNodes.push(inputNode);

    edges.push({
      id: uuidv4(),
      source: inputId,
      sourceHandle: buildOutputHandleId(inputNode, 0),
      target: mainId,
      targetHandle: inp.targetHandle(mainId),
      type: TEST_EDGE_TYPE,
      markerEnd: { type: MarkerType.ArrowClosed },
    });
  });

  return { nodes: [mainNode, ...inputNodes], edges };
}



type Row = GeneratedTestFlow & { selected: boolean };

export const TestingModal = ({ open, onClose, onAddFlowToCanvas }: TestingModalProps) => {
  const testableSpecs = TESTABLE_NODE_REGISTRY.filter((s) => s.inputs.length > 0);

  // Dynamically extract node labels from existing canvas nodes
  const dynamicNodeLabels = useMemo(() => {
    return extractNodeLabels(existingNodes);
  }, [existingNodes]);

  const [selectedSpecId, setSelectedSpecId] = useState(testableSpecs[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);

  const selectedSpec = testableSpecs.find((s) => s.id === selectedSpecId);

  const handleGenerate = () => {
    if (!selectedSpec) return;
    const { flows, truncated } = generateTestFlows(selectedSpec);
    setRows(flows.map((f) => ({ ...f, selected: true })));
    setTruncated(truncated);
  };


  const anchorFor = (offsetIndex: number) => {
    const fallbackWidth = 320;
    const maxX = existingNodes.length
      ? Math.max(...existingNodes.map((n) => n.position.x + (typeof n.width === "number" ? n.width : fallbackWidth)))
      : 0;
    const rowHeight = (selectedSpec?.height ?? 550) + 100;
    return { x: maxX + 400, y: 80 + offsetIndex * rowHeight };
  };

  const placeFlow = (flow: GeneratedTestFlow, offsetIndex: number) => {
    if (!selectedSpec) return;
    const { nodes, edges } = buildCanvasFlow(selectedSpec, flow, anchorFor(offsetIndex));
    onAddFlowToCanvas(nodes, edges);
  };

  const handleGenerateOne = (flow: GeneratedTestFlow) => {
    placeFlow(flow, placedCount);
    setPlacedCount((c) => c + 1);
  };

  const handleGenerateSelected = () => {
    const selected = rows.filter((r) => r.selected);
    selected.forEach((flow, i) => placeFlow(flow, placedCount + i));
    setPlacedCount((c) => c + selected.length);
  };

  const toggleRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const toggleAll = (value: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: value })));
  };

  const selectedCount = rows.filter((r) => r.selected).length;
  const optionCount = rows.filter((r) => r.category === "option coverage").length;
  const inputCount = rows.filter((r) => r.category === "input coverage").length;

  return (
    <Modal
      title="Generate Test Flows for Nodes"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <h3 className="labels">Node to test</h3>
        <table className="config-table">
          <tbody>
            <tr>
              <td align="right">Node type:</td>
              <td align="left">
                <select
                  className="qwm-input"
                  value={selectedSpecId}
                  onChange={(e) => {
                    setSelectedSpecId(e.target.value);
                    setRows([]);
                  }}
                >
                  {testableSpecs.length === 0 && <option value="">No testable nodes registered</option>}
                  {testableSpecs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-3">
          <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedSpec}>
          </button>
        </div>

        {rows.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="text-sm text-gray-600">
                {rows.length} test flows generated ({optionCount} option coverage, {inputCount} input coverage)
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs underline text-blue-600" onClick={() => toggleAll(true)}>
                  Select all
                </button>
                <button className="text-xs underline text-blue-600" onClick={() => toggleAll(false)}>
                  Deselect all
                </button>
                <button className="btn btn-primary" onClick={handleGenerateSelected} disabled={selectedCount === 0}>
                  Generate Selected ({selectedCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-gray-300 rounded-md">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="p-2 border w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCount === rows.length}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-2 border w-32">Name</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border w-28">Category</th>
                    <th className="p-2 border w-36">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="p-2 border text-center">
                        <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.id)} />
                      </td>
                      <td className="p-2 border text-sm font-medium whitespace-nowrap">{row.name}</td>
                      <td className="p-2 border text-xs whitespace-pre-line">{row.descriptionLines.join("\n")}</td>
                      <td className="p-2 border text-xs text-gray-500">{row.category}</td>
                      <td className="p-2 border text-center">
                        <button className="btn btn-secondary text-xs" onClick={() => handleGenerateOne(row)}>
                          Generate on Canvas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TestingModal;