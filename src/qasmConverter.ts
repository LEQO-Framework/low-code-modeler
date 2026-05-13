type FlowJson = {
  metadata: any;
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
};

const GATE_LABELS: Record<string, string> = {
  x: "X",
  h: "H",
  cx: "CNOT",
  cz: "CZ",
  swap: "SWAP",
};

const generateId = () =>
  `node-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

function createNode(
  id: string,
  label: string,
  x: number,
  y: number,
  identifiers: string[],
  inputs: any[] = []
) {
  return {
    id,
    type: "gateNode",
    position: { x, y },

    data: {
      label,

      inputs,

      children: [],
      implementation: "",
      implementationType: "",
      uncomputeImplementationType: "",
      uncomputeImplementation: "",

      completionGuaranteed: true,

      compactOptions: [true, false],

      identifiers,

      inputTypes: Array(inputs.length).fill("any"),

      outputTypes: [],

      parameter: "0",
    },

    width: 110,
    height: 110,

    positionAbsolute: { x, y },
  };
}

function createEdge(
  source: string,
  target: string,
  targetInputIndex: number
) {
  const edgeId = generateId();

  return {
    source,

    sourceHandle: `quantumHandleGateOutput0${source}`,

    target,

    targetHandle: `quantumHandleGateInput${targetInputIndex}${target}`,

    type: "quantumEdge",

    id: edgeId,

    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#93C5FD",
      hidden: false,
    },
  };
}

export function openQasmToFlow(openqasm: string): FlowJson {
  const nodes: any[] = [];
  const edges: any[] = [];

  // ---------------------------------------------------
  // Parse qubit register
  // ---------------------------------------------------

  const qubitMatch = [
    ...openqasm.matchAll(
      /qubit\s*\[\s*(\d+)\s*\]\s*([a-zA-Z0-9_]+)\s*;/g
    ),
  ];

  if (!qubitMatch.length) {
    throw new Error("No qubit register found.");
  }

  const qubitCount = Number(qubitMatch[0][1]);

  // ---------------------------------------------------
  // Create initial qubit nodes
  // ---------------------------------------------------

  const qubitIdentifiers: string[] = [];
  const lastNodePerQubit: string[] = [];

  // horizontal placement tracking
  const depthPerQubit: number[] = [];

  for (let i = 0; i < qubitCount; i++) {
    const nodeId = generateId();

    const identifier = `q${i}`;

    qubitIdentifiers.push(identifier);

    const y = i * 180 - 90;

    nodes.push(
      createNode(
        nodeId,
        "Qubit Circuit",
        -90,
        y,
        [identifier]
      )
    );

    lastNodePerQubit[i] = nodeId;

    depthPerQubit[i] = 0;
  }

  // ---------------------------------------------------
  // Parse alias mapping
  // ---------------------------------------------------

  const aliasMap: Record<string, number[]> = {};

  const aliasRegex =
    /let\s+([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\s*\[\s*\{([0-9,\s]+)\}\s*\]\s*;/g;

  let aliasMatch;

  while ((aliasMatch = aliasRegex.exec(openqasm)) !== null) {
    const alias = aliasMatch[1];

    const indices = aliasMatch[2]
      .split(",")
      .map((v) => Number(v.trim()));

    aliasMap[alias] = indices;
  }

  // ---------------------------------------------------
  // Parse gates
  // ---------------------------------------------------

  const gateRegex =
    /\b([a-z]+)\s+([a-zA-Z0-9_]+)\[(\d+)\](?:\s*,\s*([a-zA-Z0-9_]+)\[(\d+)\])?\s*;/g;

  let gateMatch;

  while ((gateMatch = gateRegex.exec(openqasm)) !== null) {
    const gate = gateMatch[1].toLowerCase();

    const alias1 = gateMatch[2];
    const idx1 = Number(gateMatch[3]);

    const alias2 = gateMatch[4];
    const idx2 = gateMatch[5]
      ? Number(gateMatch[5])
      : undefined;

    if (!aliasMap[alias1]) continue;

    const q1 = aliasMap[alias1][idx1];

    const q2 =
      alias2 && idx2 !== undefined
        ? aliasMap[alias2]?.[idx2]
        : undefined;

    const physicalQubits =
      q2 !== undefined ? [q1, q2] : [q1];

    const label =
      gate === "cx"
        ? "CNOT"
        : GATE_LABELS[gate] || gate.toUpperCase();

    const nodeId = generateId();

    // ---------------------------------------------------
    // Gate depth / horizontal positioning
    // ---------------------------------------------------

    const gateDepth =
      Math.max(
        ...physicalQubits.map((q) => depthPerQubit[q])
      ) + 1;

    const x = gateDepth * 300 - 180;

    const y =
      physicalQubits.length === 1
        ? q1 * 180 - 90
        : ((q1 + q2!) / 2) * 180 - 90;

    // ---------------------------------------------------
    // Build inputs + edges
    // ---------------------------------------------------

    const inputNodes: any[] = [];

    physicalQubits.forEach((q, inputIndex) => {
      const prev = lastNodePerQubit[q];

      if (!prev) return;

      const edge = createEdge(
        prev,
        nodeId,
        inputIndex
      );

      edges.push(edge);

      inputNodes.push({
        id: prev,

        edgeId: edge.id,

        identifiers: [qubitIdentifiers[q]],

        targetHandle:
          `quantumHandleGateInput${inputIndex}${nodeId}`,
      });
    });

    nodes.push(
      createNode(
        nodeId,
        label,
        x,
        y,
        physicalQubits.map(
          (q) => qubitIdentifiers[q]
        ),
        inputNodes
      )
    );

    // ---------------------------------------------------
    // Update qubit state tracking
    // ---------------------------------------------------

    for (const q of physicalQubits) {
      lastNodePerQubit[q] = nodeId;

      depthPerQubit[q] = gateDepth;
    }
  }

  // ---------------------------------------------------
  // Final flow object
  // ---------------------------------------------------

  return {
    metadata: {
      version: "1.0.0",
      name: "OpenQASM 3.1 Import",
      description: "Generated from OpenQASM",
      author: "",
      containsPlaceholder: false,
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },

    nodes,

    edges,

    viewport: {
      x: 383,
      y: 378.5,
      zoom: 1,
    },
  };
}