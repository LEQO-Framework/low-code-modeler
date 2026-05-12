

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
  cx: "CX",
  cz: "CZ",
  swap: "SWAP",
};

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
      inputTypes: inputs.length ? ["any"] : [],
      outputTypes: [],
      parameter: "0",
    },
    width: 110,
    height: 110,
    positionAbsolute: { x, y },
  };
}
const generateId = () => `node-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;


function createEdge(source: string, target: string) {
  const edgeId = generateId();


  return {
    source,
    sourceHandle: `quantumHandleGateOutput0${source}`,
    target,
    targetHandle: `quantumHandleGateInput0${target}`,
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

export function openQasmToFlow(openqasm: string): string {
  const nodes: any[] = [];
  const edges: any[] = [];

  // ---------------------------------------------------
  // Parse qubit count
  // ---------------------------------------------------

  const qubitMatch = openqasm.match(/qubit\[(\d+)\]/);

  if (!qubitMatch) {
    throw new Error("No qubit register found.");
  }

  const qubitCount = Number(qubitMatch[1]);

  // ---------------------------------------------------
  // Create initial qubit nodes
  // ---------------------------------------------------

  const qubitIds: string[] = [];
  const qubitIdentifiers: string[] = [];

  // Track last node per qubit
  const lastNodePerQubit: string[] = [];

  for (let i = 0; i < qubitCount; i++) {
    const nodeId = generateId()


    const identifier = `q${Math.floor(Math.random() * 900000 + 100000)}`;

    qubitIds.push(nodeId);
    qubitIdentifiers.push(identifier);

    const y = i * 180 - 90;

    const node = createNode(
      nodeId,
      "Qubit Circuit",
      -90,
      y,
      [identifier]
    );

    nodes.push(node);

    lastNodePerQubit[i] = nodeId;
  }

  // ---------------------------------------------------
  // Parse alias mapping
  // Example:
  // let foo = leqo_reg[{0,1,2}]
  // ---------------------------------------------------

  const aliasMap: Record<string, number[]> = {};

  const aliasRegex =
    /let\s+([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\[\{([0-9,\s]+)\}\]/g;

  let aliasMatch;

  while ((aliasMatch = aliasRegex.exec(openqasm)) !== null) {
    const alias = aliasMatch[1];

    const indices = aliasMatch[2]
      .split(",")
      .map((v) => Number(v.trim()));

    aliasMap[alias] = indices;
  }

  // ---------------------------------------------------
  // Parse gate operations
  // Example:
  // x foo[0];
  // ---------------------------------------------------

  const gateRegex =
    /\b([a-z]+)\s+([a-zA-Z0-9_]+)\[(\d+)\]\s*;/g;

  let gateMatch;

  const gateColumnCounter: Record<number, number> = {};

  while ((gateMatch = gateRegex.exec(openqasm)) !== null) {
    const gate = gateMatch[1].toLowerCase();
    const alias = gateMatch[2];
    const aliasIndex = Number(gateMatch[3]);

    if (!aliasMap[alias]) continue;

    const physicalQubit = aliasMap[alias][aliasIndex];

    const label = GATE_LABELS[gate] || gate.toUpperCase();

    const nodeId = generateId();


    gateColumnCounter[physicalQubit] ??= 0;

    const x = 120 + gateColumnCounter[physicalQubit] * 180;
    const y = physicalQubit * 180 - 90;

    const previousNode = lastNodePerQubit[physicalQubit];

    const edge = createEdge(previousNode, nodeId);

    const input = {
      id: previousNode,
      edgeId: edge.id,
      identifiers: [qubitIdentifiers[physicalQubit]],
      targetHandle: `quantumHandleGateInput0${nodeId}`,
    };

    const node = createNode(
      nodeId,
      label,
      x,
      y,
      [qubitIdentifiers[physicalQubit]],
      [input]
    );

    nodes.push(node);
    edges.push(edge);

    lastNodePerQubit[physicalQubit] = nodeId;

    gateColumnCounter[physicalQubit]++;
  }

  return {
    metadata: {
      version: "1.0.0",
      name: "OpenQASM Import",
      description: "Generated from OpenQASM",
      author: "",
      containsPlaceholder: false,
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    },
    nodes,
    edges,
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  };
}