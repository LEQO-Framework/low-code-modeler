import { useState, useMemo } from "react";
import { Node, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import Modal from "./Modal";
import {
  TESTABLE_NODE_REGISTRY,
  TestableNodeSpec,
  resolvePool,
} from "./testingSpecs";

import { categories } from "../panels/categories";

interface TestingModalProps {
  open: boolean;
  onClose: () => void;
  existingNodes?: Node[];
  onAddFlowToCanvas: (flow: any) => void;
}

function extractNodeLabels(content: any): Record<string, string> {
  const labels: Record<string, string> = {};

  const walk = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((n) => {
        if (n?.label && n?.description) {
          labels[n.label] = n.description;
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);
  return labels;
}

// --- Pairwise Generator (Heuristic) ---
function generatePairwise<T>(pools: T[][]): T[][] {
  if (pools.length === 0) return [[]];
  if (pools.length === 1) return pools[0].map((v) => [v]);

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


function describeFlow(
  spec: TestableNodeSpec,
  optionValues: Record<string, string | number>,
  inputValues: Record<string, string>,
): string[] {
  const lines: string[] = [];
  spec.options.forEach((opt) => {
    lines.push(`${opt.label} (option): ${optionValues[opt.key]}`);
  });
  spec.inputs.forEach((inp) => {
    const label = inp.labelFor ? inp.labelFor(optionValues) : inp.label;
    const rawVal = inputValues[inp.key] ?? "";
    let displayType = inp.dataTypeKey.split(":")[0];
    let displayVal = rawVal;

    if (rawVal.startsWith("type:")) {
      const parts = rawVal.split("|");
      displayType = parts[0].replace("type:", "");
      displayVal = parts.slice(1).join("|");
    }

    lines.push(`${label} (${displayType}): ${displayVal}`);
  });
  return lines;
}

export function generateTestFlows(spec: TestableNodeSpec): {
  flows: GeneratedTestFlow[];
  truncated: boolean;
} {
  const baselineOptions: Record<string, string | number> = {};
  spec.options.forEach((opt) => (baselineOptions[opt.key] = opt.values[0]));

  const baselineInputs: Record<string, string> = {};
  spec.inputs.forEach((inp) => {
    baselineInputs[inp.key] =
      resolvePool(inp.dataTypeKey, baselineOptions)[0] ?? "";
  });

  const flows: GeneratedTestFlow[] = [];
  let counter = 1;
  let truncated = false;

  const optionKeys = spec.options.map((o) => o.key);
  // Using Pairwise instead of Cartesian
  let optionCombos = spec.options.length
    ? generatePairwise(spec.options.map((o) => o.values))
    : [[]];

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
      inputValues[inp.key] =
        resolvePool(inp.dataTypeKey, optionValues)[0] ?? "";
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

export interface GeneratedTestFlow {
  id: string;
  name: string;
  category: "option coverage" | "input coverage";
  optionValues: Record<string, string | number>;
  inputValues: Record<string, string>;
  descriptionLines: string[];
}

/**
 * Builds a complete test flow JSON object matching testflow_example.json.
 * Works generically for any TestableNodeSpec registered.
 */
function buildCanvasFlow(
  spec: TestableNodeSpec,
  flow: GeneratedTestFlow,
  anchor: { x: number; y: number },
): { flowObj: any; nodes: Node[]; edges: Edge[] } {
  const mainId = uuidv4();
  const mainIdentifiers = ["q" + Math.floor(100000 + Math.random() * 900000)];

  const inputNodes: Node[] = [];
  const edges: Edge[] = [];
  const mainNodeInputs: any[] = [];

  spec.inputs.forEach((inp, i) => {
    const inputId = uuidv4();
    const edgeId = uuidv4();
    const rawValue = flow.inputValues[inp.key] ?? "";
    const outputId = String.fromCharCode(97 + (i % 26)); // e.g. 'e', 'g', 'b'
    const inputNodeIdentifiers = [
      "q" + Math.floor(100000 + Math.random() * 900000),
    ];

    let actualDataType = inp.dataTypeKey.split(":")[0];
    let actualValue = rawValue;

    if (rawValue.startsWith("type:")) {
      const parts = rawValue.split("|");
      actualDataType = parts[0].replace("type:", "");
      actualValue = parts.slice(1).join("|");
    }

    const capitalizedType =
      actualDataType.charAt(0).toUpperCase() + actualDataType.slice(1);
    const inputNodeLabel =
      actualDataType === "array" ? "Array" : capitalizedType;

    const targetHandle = inp.targetHandle(mainId);
    const sourceHandle = `classicalHandleDataTypeOutput0${inputId}`;

    // 1. Create Input Node (dataTypeNode)
    const inputNode: Node = {
      id: inputId,
      type: "dataTypeNode",
      position: { x: anchor.x - 550, y: anchor.y + i * 330 },
      selectable: true,
      draggable: true,
      data: {
        label: inputNodeLabel,
        dataType: actualDataType,
        value: actualValue,
        outputIdentifier: outputId,
        inputs: [],
        outputs: [
          {
            identifier: outputId,
            size: "",
            type: "classical",
          },
        ],
        children: [],
        implementation: "",
        implementationType: "",
        uncomputeImplementationType: "",
        uncomputeImplementation: "",
        completionGuaranteed: true,
        compactOptions: [true, false],
        description: `${capitalizedType} input value`,
        icon: `PaletteIcon_${capitalizedType}.png`,
        identifiers: inputNodeIdentifiers,
        inputTypes: [],
        outputTypes: [actualDataType],
      },
      width: 450,
      height: 270,
    };
    inputNodes.push(inputNode);

    // 2. Create Edge
    edges.push({
      id: edgeId,
      source: inputId,
      sourceHandle: sourceHandle,
      target: mainId,
      targetHandle: targetHandle,
      type: "classicalEdge",
      markerEnd: {
        type: "arrowclosed" as any,
        width: 20,
        height: 20,
        color: "#F5A843",
      },
    });

    // 3. Register input mapping for the main node's data.inputs array
    mainNodeInputs.push({
      id: inputId,
      edgeId: edgeId,
      outputIdentifier: outputId,
      identifiers: inputNodeIdentifiers,
      targetHandle: targetHandle,
    });
  });

  // Map "qaoaNode" internal type to "qaoa" schema type if necessary
  const targetNodeType = spec.nodeType === "qaoaNode" ? "qaoa" : spec.nodeType;

  // 4. Create Main Operator Node
  const mainNode: Node = {
    id: mainId,
    type: targetNodeType,
    position: { x: anchor.x, y: anchor.y },
    selectable: true,
    draggable: true,
    data: {
      label: spec.defaultData?.label || spec.label,
      description:
        spec.defaultData?.description || "State preparation / encoding node",
      icon:
        spec.defaultData?.icon || `PaletteIcon_${spec.id.toUpperCase()}.png`,
      children: [],
      implementation: "",
      implementationType: "",
      uncomputeImplementationType: "",
      uncomputeImplementation: "",
      completionGuaranteed: true,
      compactOptions: [false],
      identifiers: mainIdentifiers,
      inputTypes: spec.inputs.map(() => "array"),
      outputTypes: spec.defaultData?.outputTypes || { "0": "quantum register" },
      outputs: spec.defaultData?.outputs || [],
      ...spec.defaultData,
      ...flow.optionValues,
      inputs: mainNodeInputs,
    },
    width: spec.width || 320,
    height: spec.height || 550,
  };

  const allNodes = [...inputNodes, mainNode];

  // 5. Construct full Flow JSON Object
  const flowObj = {
    metadata: {
      version: "1.0.0",
      name: flow.name,
      description: flow.descriptionLines.join("\n"),
      author: "",
      containsPlaceholder: false,
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
    nodes: allNodes,
    edges: edges,
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  return { flowObj, nodes: allNodes, edges };
}

type Row = GeneratedTestFlow & { selected: boolean };

export const TestingModal = ({
  open,
  onClose,
  existingNodes = [],
  onAddFlowToCanvas,
}: TestingModalProps) => {
  const testableSpecs = TESTABLE_NODE_REGISTRY.filter(
    (s) => s.inputs.length > 0,
  );


  const [selectedSpecId, setSelectedSpecId] = useState(
    testableSpecs[0]?.id ?? "",
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [placedCount, setPlacedCount] = useState(0);

  const selectedSpec = testableSpecs.find((s) => s.id === selectedSpecId);

  const handleGenerate = () => {
    if (!selectedSpec) return;
    const { flows } = generateTestFlows(selectedSpec);
    setRows(flows.map((f, index) => ({ ...f, selected: index === 0 })));
  };

  const getAnchor = () => {
    const fallbackWidth = 320;
    const maxX = existingNodes.length
      ? Math.max(
          ...existingNodes.map(
            (n) =>
              n.position.x +
              (typeof n.width === "number" ? n.width : fallbackWidth),
          ),
        )
      : 0;
    const rowHeight = (selectedSpec?.height ?? 550) + 100;
    return { x: maxX + 400, y: 80 };
  };

  const placeFlow = (flow: GeneratedTestFlow) => {
    if (!selectedSpec) return;
    const { flowObj } = buildCanvasFlow(selectedSpec, flow, getAnchor());
    onAddFlowToCanvas(flowObj);
    console.log("placed flow", flowObj);
  };

  // CHANGED: Places flow and marks this row as generated (setting checkmark)
  const handleGenerateOne = (flow: GeneratedTestFlow) => {
    placeFlow(flow);
    setPlacedCount((c) => c + 1);

    // Set checkmark for this specific flow
    setRows((prev) =>
      prev.map((r) => (r.id === flow.id ? { ...r, generated: true } : r)),
    );
  };

  const handleGenerateSelected = () => {
    const selected = rows.filter((r) => r.selected);
    selected.forEach((flow, i) => placeFlow(flow));
    setPlacedCount((c) => c + selected.length);
  };

  const toggleRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  };

  const toggleAll = (value: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: value })));
  };

  const selectedCount = rows.filter((r) => r.selected).length;

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
                  {testableSpecs.length === 0 && (
                    <option value="">No testable nodes registered</option>
                  )}
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
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!selectedSpec}
          >
            Generate Test Cases
          </button>
        </div>

        {rows.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="text-sm text-gray-600">
                {rows.length} test flows generated
              </div>
              {/*
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
              </div>*/}
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
                    {/*<th className="p-2 border w-28">Category</th>*/}
                    <th className="p-2 border w-36">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRow(row.id)}
                        />
                      </td>
                      <td className="p-2 border text-sm font-medium whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="p-2 border text-xs whitespace-pre-line">
                        {row.descriptionLines.join("\n")}
                      </td>
                      {/*<td className="p-2 border text-xs text-gray-500">{row.category}</td>*/}
                      <td className="p-2 border text-center">
                        <button
                          className="btn btn-secondary text-xs"
                          onClick={() => handleGenerateOne(row)}
                        >
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
