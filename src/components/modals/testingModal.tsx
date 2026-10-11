import { useState } from "react";
import { Node, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import Modal from "./Modal";
import {
  QUBIT_NODE_TYPE,
  TESTABLE_NODE_REGISTRY,
  TestableNodeSpec,
  portKind,
  resolvePool,
} from "../../lib/nodeSpecs";
import {
  ERROR_CATEGORIES,
  ErrorCategory,
  Expectation,
  TestModel,
  categoryLabel,
  interleaveByCategory,
  mulberry32,
} from "./testingErrors";
import { startCompile } from "../../backend";
import { validateFileContents } from "../../lib/fileValidation";
import JSZip from "jszip";

export interface PlatformValidationResult {
  errors: { nodeId: string | null; description: string }[];
  warnings: { nodeId: string | null; description: string }[];
}

interface TestingModalProps {
  open: boolean;
  onClose: () => void;
  existingNodes?: Node[];
  onAddFlowToCanvas: (flow: any) => void;
  /** The platform's model validation, used to record the platform response. */
  validateModel?: (flow: any) => PlatformValidationResult;
  /** Low-code backend; when set, models can additionally be compiled there. */
  backendEndpoint?: string;
}

/** Settings and input values from which a test model is built. */
export interface TestFlowInput {
  name: string;
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

function baselineValues(spec: TestableNodeSpec) {
  const optionValues: Record<string, string | number> = {};
  spec.options.forEach((opt) => (optionValues[opt.key] = opt.values[0]));

  const inputValues: Record<string, string> = {};
  spec.inputs.forEach((inp) => {
    inputValues[inp.key] = resolvePool(inp.dataTypeKey, optionValues)[0] ?? "";
  });
  return { optionValues, inputValues };
}

/**
 * Builds a complete test flow JSON object matching testflow_example.json.
 * Works generically for any TestableNodeSpec registered.
 */
export function buildCanvasFlow(
  spec: TestableNodeSpec,
  flow: TestFlowInput,
  anchor: { x: number; y: number },
): { flowObj: TestModel; nodes: Node[]; edges: Edge[]; mainId: string } {
  const mainId = uuidv4();
  const mainIdentifiers = ["q" + Math.floor(100000 + Math.random() * 900000)];

  const inputNodes: Node[] = [];
  const edges: Edge[] = [];
  const mainNodeInputs: any[] = [];

  spec.inputs.forEach((inp, i) => {
    const inputId = uuidv4();
    const edgeId = uuidv4();

    // Quantum ports are fed by a qubit register (one qubit unless specified).
    if (portKind(inp) === "quantum") {
      const identifiers = ["q" + Math.floor(100000 + Math.random() * 900000)];
      const targetHandle = inp.targetHandle(mainId);
      const size = inp.registerSize ?? 1;
      inputNodes.push({
        id: inputId,
        type: QUBIT_NODE_TYPE,
        position: { x: anchor.x - 450, y: anchor.y + i * 330 },
        selectable: true,
        draggable: true,
        data: {
          label: "Qubit",
          size,
          inputs: [],
          outputs: [{ identifier: "", size: String(size) }],
          children: [],
          completionGuaranteed: true,
          compactOptions: [true, false],
          description: "Basic unit of quantum information.",
          icon: "PaletteIcon_Qubit.png",
          identifiers,
          inputTypes: [],
          outputTypes: ["quantum register"],
        },
        width: 350,
        height: 170,
      });
      edges.push({
        id: edgeId,
        source: inputId,
        sourceHandle: `quantumHandle${QUBIT_NODE_TYPE}Output0${inputId}`,
        target: mainId,
        targetHandle,
        type: "quantumEdge",
        markerEnd: {
          type: "arrowclosed" as any,
          width: 20,
          height: 20,
          color: "#93C5FD",
        },
      });
      mainNodeInputs.push({ id: inputId, edgeId, identifiers, targetHandle });
      return;
    }

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

  // Every model gets its own copy: mutators change the node data in place.
  const defaultData = structuredClone(spec.defaultData ?? {});

  // 4. Create Main Node
  const mainNode: Node = {
    id: mainId,
    type: spec.nodeType,
    position: { x: anchor.x, y: anchor.y },
    selectable: true,
    draggable: true,
    data: {
      label: defaultData.label || spec.label,
      description: defaultData.description || spec.label,
      icon: defaultData.icon || `PaletteIcon_${spec.id.toUpperCase()}.png`,
      children: [],
      implementation: "",
      implementationType: "",
      uncomputeImplementationType: "",
      uncomputeImplementation: "",
      completionGuaranteed: true,
      compactOptions: [false],
      identifiers: mainIdentifiers,
      // Declared port types must match the spec, otherwise valid models are
      // reported as type mismatches by the platform validation.
      inputTypes: spec.inputs.map((inp) =>
        portKind(inp) === "quantum"
          ? "quantum register"
          : inp.dataTypeKey.split(":")[0],
      ),
      outputTypes: defaultData.outputTypes || ["quantum register"],
      outputs: defaultData.outputs || [],
      ...defaultData,
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

  return { flowObj, nodes: allNodes, edges, mainId };
}

// --- Test cases & report ---

type TestKind = "error" | "control";

interface PlatformResponse {
  status: "running" | "done" | "failed";
  accepted?: boolean;
  summary: string;
  errors: string[];
  warnings: string[];
  backend?: { accepted: boolean; message: string };
  /** true/false = behaved as expected; null = no expectation to compare against */
  passed?: boolean | null;
}

interface TestCase {
  id: string;
  name: string;
  specId: string;
  nodeLabel: string;
  kind: TestKind;
  category?: ErrorCategory;
  errorType: string;
  change: string;
  affectedNodes: { id: string; label: string }[];
  expected: Expectation;
  expectedDescription: string;
  model: TestModel;
  response?: PlatformResponse;
  selected: boolean;
}

const EXPECTATION_LABEL: Record<Expectation, string> = {
  accept: "Accept",
  reject: "Reject",
  warn: "Accept with warning",
};

const MODEL_ANCHOR = { x: 600, y: 80 };

function affectedNodesOf(model: TestModel, ids: string[]) {
  return ids.map((id) => {
    const node = model.nodes.find((n) => n.id === id);
    return {
      id,
      label: node ? `${node.data?.label ?? node.type}` : "(removed)",
    };
  });
}

function generateErrorCases(
  spec: TestableNodeSpec,
  categories: ErrorCategory[],
  count: number,
  rng: () => number,
  startIndex: number,
): TestCase[] {
  const mutators = interleaveByCategory(categories);
  const cases: TestCase[] = [];
  if (mutators.length === 0) return cases;

  const baseline = baselineValues(spec);
  // Each mutator gets a few chances; inapplicable ones (e.g. no options) are skipped.
  let attempts = 0;
  let m = 0;
  while (cases.length < count && attempts < count + mutators.length * 2) {
    const mutator = mutators[m++ % mutators.length];
    attempts++;

    const name = `TC-${String(startIndex + cases.length).padStart(3, "0")}`;
    const { flowObj, mainId } = buildCanvasFlow(
      spec,
      { name, ...baseline, descriptionLines: [] },
      MODEL_ANCHOR,
    );
    const inputNodeIds = flowObj.nodes
      .filter((n) => n.id !== mainId)
      .map((n) => n.id);
    const result = mutator.apply({
      flow: flowObj,
      spec,
      mainId,
      inputNodeIds,
      rng,
    });
    if (!result) continue;

    flowObj.metadata.description = `[${categoryLabel(mutator.category)}] ${mutator.name}: ${result.change}`;
    cases.push({
      id: uuidv4(),
      name,
      specId: spec.id,
      nodeLabel: spec.label,
      kind: "error",
      category: mutator.category,
      errorType: mutator.name,
      change: result.change,
      affectedNodes: affectedNodesOf(flowObj, result.affectedNodeIds),
      expected: result.expected,
      expectedDescription: result.expectedDescription,
      model: flowObj,
      selected: true,
    });
  }
  return cases;
}

function generateControlCase(spec: TestableNodeSpec, index: number): TestCase {
  const name = `TC-${String(index).padStart(3, "0")}`;
  const baseline = baselineValues(spec);
  const { flowObj, mainId } = buildCanvasFlow(
    spec,
    {
      name,
      ...baseline,
      descriptionLines: describeFlow(
        spec,
        baseline.optionValues,
        baseline.inputValues,
      ),
    },
    MODEL_ANCHOR,
  );
  return {
    id: uuidv4(),
    name,
    specId: spec.id,
    nodeLabel: spec.label,
    kind: "control",
    errorType: "None (valid baseline)",
    change: "Unmodified baseline model.",
    affectedNodes: affectedNodesOf(flowObj, [mainId]),
    expected: "accept",
    expectedDescription: "Accept the model without errors.",
    model: flowObj,
    selected: true,
  };
}

function compareWithExpectation(
  expected: Expectation,
  accepted: boolean,
  warningCount: number,
): boolean | null {
  switch (expected) {
    case "accept":
      return accepted;
    case "reject":
      return !accepted;
    case "warn":
      return accepted && warningCount > 0;
    default:
      return null;
  }
}

function compilationTargetFor(model: TestModel): string {
  const needsWorkflow = model.nodes.some(
    (n) =>
      n.type === "pluginNode" ||
      (n.type === "dataTypeNode" &&
        ["string", "file"].includes(String(n.data?.dataType).toLowerCase())),
  );
  return needsWorkflow ? "workflow" : "qasm";
}

async function compileOnBackend(
  endpoint: string,
  model: TestModel,
): Promise<{ accepted: boolean; message: string }> {
  const response = await startCompile(
    endpoint,
    { ...model.metadata, id: `flow-${Date.now()}` },
    model.nodes,
    model.edges,
    compilationTargetFor(model),
  );
  if (!response.ok) {
    const text = await response.text();
    return {
      accepted: false,
      message: `HTTP ${response.status}: ${text.slice(0, 500)}`,
    };
  }
  const { uuid } = await response.json();
  for (let attempt = 0; attempt < 60; attempt++) {
    const statusResponse = await fetch(`${endpoint}/status/${uuid}`);
    if (!statusResponse.ok) {
      return {
        accepted: false,
        message: `Status check failed (HTTP ${statusResponse.status}).`,
      };
    }
    const status = await statusResponse.json();
    if (status.status === "completed") {
      return { accepted: true, message: "Compilation completed." };
    }
    if (status.status === "failed") {
      return {
        accepted: false,
        message: `Compilation failed: ${String(status.result ?? "").slice(0, 500)}`,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return { accepted: false, message: "Compilation timed out." };
}

function reportEntry(tc: TestCase) {
  const r = tc.response;
  return {
    testCase: tc.name,
    node: tc.nodeLabel,
    generatedError: {
      category: tc.kind === "error" ? categoryLabel(tc.category) : tc.kind,
      type: tc.errorType,
      change: tc.change,
    },
    affectedNodes: tc.affectedNodes,
    expectedBehavior: {
      outcome: EXPECTATION_LABEL[tc.expected],
      description: tc.expectedDescription,
    },
    platformResponse: r
      ? {
          summary: r.summary,
          errors: r.errors,
          warnings: r.warnings,
          backend: r.backend,
        }
      : null,
    acceptedOrRejected:
      r?.accepted === undefined ? null : r.accepted ? "Accepted" : "Rejected",
    validationResult:
      r?.passed === undefined || r.passed === null
        ? "n/a"
        : r.passed
          ? "Passed"
          : "Failed",
    modelFile: `models/${tc.name}.json`,
  };
}

function mdCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function buildMarkdownReport(cases: TestCase[]): string {
  const entries = cases.map(reportEntry);
  const passed = entries.filter((e) => e.validationResult === "Passed").length;
  const failed = entries.filter((e) => e.validationResult === "Failed").length;
  const lines = [
    "# Automated Test Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Test cases: ${entries.length} · Passed: ${passed} · Failed: ${failed} · Not evaluated: ${entries.length - passed - failed}`,
    "",
    "| Test case | Node | Generated error | Affected node(s) | Expected behavior | Platform response | Accepted/Rejected | Validation result |",
    "|---|---|---|---|---|---|---|---|",
    ...entries
      .map((e) =>
        [
          e.testCase,
          e.node,
          `**${e.generatedError.category}** – ${e.generatedError.type}: ${e.generatedError.change}`,
          e.affectedNodes
            .map((n) => `${n.label} (${n.id.slice(0, 8)})`)
            .join(", "),
          `${e.expectedBehavior.outcome}: ${e.expectedBehavior.description}`,
          e.platformResponse?.summary ?? "not run",
          e.acceptedOrRejected ?? "—",
          e.validationResult,
        ]
          .map((c) => mdCell(String(c)))
          .join(" | "),
      )
      .map((row) => `| ${row} |`),
  ];
  return lines.join("\n") + "\n";
}

async function downloadZip(cases: TestCase[], filename: string) {
  const zip = new JSZip();
  cases.forEach((tc) => {
    zip.file(`models/${tc.name}.json`, JSON.stringify(tc.model, null, 2));
  });
  zip.file("report.json", JSON.stringify(cases.map(reportEntry), null, 2));
  zip.file("report.md", buildMarkdownReport(cases));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const TestingModal = ({
  open,
  onClose,
  onAddFlowToCanvas,
  validateModel,
  backendEndpoint,
}: TestingModalProps) => {
  const testableSpecs = TESTABLE_NODE_REGISTRY;
  const specCategories = [...new Set(testableSpecs.map((s) => s.category))];

  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>(
    testableSpecs[0] ? [testableSpecs[0].id] : [],
  );
  const [categories, setCategories] = useState<ErrorCategory[]>(
    ERROR_CATEGORIES.map((c) => c.id),
  );
  const [modelsPerNode, setModelsPerNode] = useState(10);
  const [seed, setSeed] = useState(42);
  const [includeControl, setIncludeControl] = useState(true);
  const [useBackend, setUseBackend] = useState(false);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<TestCase[]>([]);

  const toggleSpec = (id: string) =>
    setSelectedSpecIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const toggleCategory = (id: ErrorCategory) =>
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const canGenerate =
    selectedSpecIds.length > 0 && modelsPerNode > 0 && categories.length > 0;

  const handleGenerate = () => {
    const rng = mulberry32(seed);
    const cases: TestCase[] = [];
    testableSpecs
      .filter((s) => selectedSpecIds.includes(s.id))
      .forEach((spec) => {
        if (includeControl) {
          cases.push(generateControlCase(spec, cases.length + 1));
        }
        cases.push(
          ...generateErrorCases(
            spec,
            ERROR_CATEGORIES.map((c) => c.id).filter((c) =>
              categories.includes(c),
            ),
            modelsPerNode,
            rng,
            cases.length + 1,
          ),
        );
      });
    setRows(cases);
  };

  const setResponse = (id: string, response: PlatformResponse) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, response } : r)));

  const evaluate = async (tc: TestCase) => {
    setResponse(tc.id, {
      status: "running",
      summary: "Running…",
      errors: [],
      warnings: [],
    });
    try {
      const validation = validateModel
        ? validateModel(structuredClone(tc.model))
        : { errors: [], warnings: [] };
      // The platform also downloads and checks referenced files.
      const files = await validateFileContents(tc.model);
      const errors = [...validation.errors, ...files.errors].map(
        (e) => e.description,
      );
      const warnings = [...validation.warnings, ...files.warnings].map(
        (w) => w.description,
      );

      let backend: PlatformResponse["backend"];
      if (useBackend && backendEndpoint) {
        try {
          backend = await compileOnBackend(backendEndpoint, tc.model);
        } catch (e) {
          backend = {
            accepted: false,
            message: `Backend not reachable: ${(e as Error).message}`,
          };
        }
      }

      const accepted =
        errors.length === 0 && (backend ? backend.accepted : true);
      const parts = [
        errors.length
          ? `Validation errors (${errors.length}): ${errors.join("; ")}`
          : "Validation: no errors.",
      ];
      if (warnings.length) {
        parts.push(`Warnings (${warnings.length}): ${warnings.join("; ")}`);
      }
      if (backend) parts.push(`Backend: ${backend.message}`);

      setResponse(tc.id, {
        status: "done",
        accepted,
        summary: parts.join("\n"),
        errors,
        warnings,
        backend,
        passed: compareWithExpectation(tc.expected, accepted, warnings.length),
      });
    } catch (e) {
      setResponse(tc.id, {
        status: "failed",
        summary: `Evaluation crashed: ${(e as Error).message}`,
        errors: [],
        warnings: [],
      });
    }
  };

  const handleRunSelected = async () => {
    setRunning(true);
    for (const tc of rows.filter((r) => r.selected)) {
      await evaluate(tc);
    }
    setRunning(false);
  };

  const toggleRow = (id: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );

  const toggleAll = (value: boolean) =>
    setRows((prev) => prev.map((r) => ({ ...r, selected: value })));

  const selectedRows = rows.filter((r) => r.selected);
  const evaluated = rows.filter((r) => r.response?.status === "done");
  const passedCount = evaluated.filter(
    (r) => r.response?.passed === true,
  ).length;
  const failedCount = evaluated.filter(
    (r) => r.response?.passed === false,
  ).length;

  const zipName = `test-models-${new Date().toISOString().slice(0, 10)}.zip`;

  return (
    <Modal
      title="Generate Test Models"
      open={open}
      onClose={onClose}
      className="max-w-[95vw]"
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <div className="flex flex-wrap gap-6">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center justify-between">
              <h3 className="labels">Nodes to test</h3>
              <div className="flex gap-2 text-xs">
                <button
                  className="underline text-blue-600"
                  onClick={() =>
                    setSelectedSpecIds(testableSpecs.map((s) => s.id))
                  }
                >
                  All
                </button>
                <button
                  className="underline text-blue-600"
                  onClick={() => setSelectedSpecIds([])}
                >
                  None
                </button>
              </div>
            </div>
            <div className="mt-1 max-h-72 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
              {specCategories.map((category) => {
                const specs = testableSpecs.filter(
                  (s) => s.category === category,
                );
                const ids = specs.map((s) => s.id);
                const allSelected = ids.every((id) =>
                  selectedSpecIds.includes(id),
                );
                return (
                  <div key={category}>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelectedSpecIds((prev) =>
                            allSelected
                              ? prev.filter((id) => !ids.includes(id))
                              : [...new Set([...prev, ...ids])],
                          )
                        }
                      />
                      {category}
                    </label>
                    <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {specs.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSpecIds.includes(s.id)}
                            onChange={() => toggleSpec(s.id)}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedSpecIds.length} of {testableSpecs.length} nodes selected
            </div>
          </div>

          <div className="min-w-[260px] flex-1">
            <h3 className="labels">Error types</h3>
            <div className="mt-2 space-y-1">
              {ERROR_CATEGORIES.map((c) => (
                <label
                  key={c.id}
                  className="flex items-start gap-2 text-sm"
                  title={c.description}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={categories.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  <span>
                    {c.label}
                    <span className="block text-xs text-gray-500">
                      {c.description}
                    </span>
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeControl}
                  onChange={(e) => setIncludeControl(e.target.checked)}
                />
                Add a valid baseline model per node (control)
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                Models per node
                <input
                  type="number"
                  className="qwm-input w-20"
                  min={1}
                  max={500}
                  value={modelsPerNode}
                  onChange={(e) =>
                    setModelsPerNode(
                      Math.max(0, Math.min(500, Number(e.target.value) || 0)),
                    )
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                Seed
                <input
                  type="number"
                  className="qwm-input w-24"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!canGenerate || running}
          >
            Generate Test Models
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRunSelected}
            disabled={selectedRows.length === 0 || running}
          >
            {running ? "Running…" : `Run Tests (${selectedRows.length})`}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => downloadZip(selectedRows, zipName)}
            disabled={selectedRows.length === 0}
          >
            Download Models & Report ({selectedRows.length})
          </button>
          {backendEndpoint && (
            <label
              className="flex items-center gap-2 text-sm"
              title={`Also submit each model to ${backendEndpoint}/compile`}
            >
              <input
                type="checkbox"
                checked={useBackend}
                onChange={(e) => setUseBackend(e.target.checked)}
              />
              Also compile on backend
            </label>
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">
              {rows.length} test models generated · {evaluated.length} evaluated
              · <span className="text-green-700">{passedCount} passed</span> ·{" "}
              <span className="text-red-700">{failedCount} failed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-gray-300 rounded-md text-xs">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="p-2 border w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === rows.length}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-2 border">Test case</th>
                    <th className="p-2 border">Generated error</th>
                    <th className="p-2 border">Affected node(s)</th>
                    <th className="p-2 border">Expected behavior</th>
                    <th className="p-2 border">Platform response</th>
                    <th className="p-2 border">Accepted / Rejected</th>
                    <th className="p-2 border">Validation result</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const r = row.response;
                    return (
                      <tr key={row.id} className="align-top">
                        <td className="p-2 border text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(row.id)}
                          />
                        </td>
                        <td className="p-2 border whitespace-nowrap">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-gray-500">{row.nodeLabel}</div>
                        </td>
                        <td className="p-2 border min-w-[240px] whitespace-pre-line">
                          {row.kind === "error" && (
                            <div className="font-medium">
                              {categoryLabel(row.category)}
                            </div>
                          )}
                          <div className="italic">{row.errorType}</div>
                          <div>{row.change}</div>
                        </td>
                        <td className="p-2 border">
                          {row.affectedNodes.map((n) => (
                            <div key={n.id} title={n.id}>
                              {n.label}
                            </div>
                          ))}
                        </td>
                        <td className="p-2 border min-w-[160px]">
                          <div className="font-medium">
                            {EXPECTATION_LABEL[row.expected]}
                          </div>
                          <div>{row.expectedDescription}</div>
                        </td>
                        <td className="p-2 border min-w-[220px] whitespace-pre-line">
                          {r ? (
                            r.summary
                          ) : (
                            <span className="text-gray-400">Not run</span>
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          {r?.accepted === undefined
                            ? "—"
                            : r.accepted
                              ? "Accepted"
                              : "Rejected"}
                        </td>
                        <td className="p-2 border text-center font-medium">
                          {r?.passed === true && (
                            <span className="text-green-700">✔ Passed</span>
                          )}
                          {r?.passed === false && (
                            <span className="text-red-700">✘ Failed</span>
                          )}
                          {(r?.passed === null || r?.passed === undefined) &&
                            (r?.status === "done" ? "n/a" : "—")}
                        </td>
                        <td className="p-2 border text-center space-y-1">
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() =>
                              onAddFlowToCanvas(structuredClone(row.model))
                            }
                          >
                            Open on Canvas
                          </button>
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() => evaluate(row)}
                            disabled={running || r?.status === "running"}
                          >
                            Run
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
