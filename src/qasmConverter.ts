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
  z: "Z",
  y: "Y",
  t: "T",
  cy: "CY",
  cz: "CZ",
  h: "H",
  cx: "CNOT",
  swap: "SWAP",
  ccx: "Toffoli",
};

const generateId = () => crypto.randomUUID();

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

  // Create initial qubit nodes
  const qubitIdentifiers: string[] = [];
  const lastNodePerQubit: string[] = [];
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
  // Supports:
  // let a = q[{0}];
  // let b = q[{0,1,2}];
  // ---------------------------------------------------

  const aliasMap: Record<string, number[]> = {};

  const aliasRegex =
    /let\s+([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\s*\[\s*\{([^}]+)\}\s*\]\s*;/g;

  let aliasMatch;

  while ((aliasMatch = aliasRegex.exec(openqasm)) !== null) {
    const alias = aliasMatch[1];

    const indices = aliasMatch[2]
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => !Number.isNaN(v));

    aliasMap[alias] = indices;
  }

  // ---------------------------------------------------
  // Parse gates
  // Supports:
  // x a[0];
  // cx a[0], a[1];
  // ccx a[0], a[1], a[2];
  // Also supports direct aliases:
  // x q0;
  // cx q0, q1;
  // ccx q0, q1, q2;
  // ---------------------------------------------------

  const gateRegex =
    /\b([a-z]+)\s+([a-zA-Z0-9_]+)(?:\[(\d+)\])?(?:\s*,\s*([a-zA-Z0-9_]+)(?:\[(\d+)\])?)?(?:\s*,\s*([a-zA-Z0-9_]+)(?:\[(\d+)\])?)?\s*;/g;

  let gateMatch;

  while ((gateMatch = gateRegex.exec(openqasm)) !== null) {
    const gate = gateMatch[1].toLowerCase();

    // ---------------------------------------------------
    // Operand 1
    // ---------------------------------------------------

    const alias1 = gateMatch[2];
    const idx1 =
      gateMatch[3] !== undefined
        ? Number(gateMatch[3])
        : 0;

    // ---------------------------------------------------
    // Operand 2
    // ---------------------------------------------------

    const alias2 = gateMatch[4];
    const idx2 =
      gateMatch[5] !== undefined
        ? Number(gateMatch[5])
        : 0;

    // ---------------------------------------------------
    // Operand 3
    // ---------------------------------------------------

    const alias3 = gateMatch[6];
    const idx3 =
      gateMatch[7] !== undefined
        ? Number(gateMatch[7])
        : 0;

    // ---------------------------------------------------
    // Resolve physical qubits
    // ---------------------------------------------------

    if (!aliasMap[alias1]) {
      continue;
    }

    const q1 = aliasMap[alias1][idx1];

    const q2 =
      alias2 && aliasMap[alias2]
        ? aliasMap[alias2][idx2]
        : undefined;

    const q3 =
      alias3 && aliasMap[alias3]
        ? aliasMap[alias3][idx3]
        : undefined;

    const physicalQubits: number[] = [q1];

    if (q2 !== undefined) {
      physicalQubits.push(q2);
    }

    if (q3 !== undefined) {
      physicalQubits.push(q3);
    }

    // ---------------------------------------------------
    // Gate label
    // ---------------------------------------------------

    const label =
      GATE_LABELS[gate] || gate.toUpperCase();

    const nodeId = generateId();

    // ---------------------------------------------------
    // Compute gate depth
    // ---------------------------------------------------

    const gateDepth =
      Math.max(
        ...physicalQubits.map(
          (q) => depthPerQubit[q]
        )
      ) + 1;

    const x = gateDepth * 300 - 180;

    // ---------------------------------------------------
    // Vertical positioning
    // ---------------------------------------------------

    const minQubit = Math.min(...physicalQubits);
    const maxQubit = Math.max(...physicalQubits);

    const y =
      ((minQubit + maxQubit) / 2) * 180 - 90;

    // ---------------------------------------------------
    // Build edges + inputs
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

    // ---------------------------------------------------
    // Create node
    // ---------------------------------------------------

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
    // Update tracking
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