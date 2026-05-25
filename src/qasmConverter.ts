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
  measure: "Measurement",
};

const generateId = () => crypto.randomUUID();

// ---------------------------------------------------
// NODE FACTORIES
// ---------------------------------------------------

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

function createMergerNode(
  id: string,
  x: number,
  y: number,
  inputs: any[],
  identifiers: string[]
) {
  return {
    id,
    type: "mergerNode",
    position: { x, y },
    data: {
      label: "Merger",
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
      numberInputs: inputs.length,
    },
    width: 170,
    height: 205,
    positionAbsolute: { x, y },
  };
}

// ---------------------------------------------------
// EDGE FACTORIES
// ---------------------------------------------------

function createGateEdge(
  source: string,
  target: string,
  sourceOutputIndex: number,
  targetInputIndex: number
) {
  return {
    source,
    sourceHandle: `quantumHandleGateOutput${sourceOutputIndex}${source}`,
    target,
    targetHandle: `quantumHandleGateInput${targetInputIndex}${target}`,
    type: "quantumEdge",
    id: generateId(),
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#93C5FD",
      hidden: false,
    },
  };
}

function createGateToMergerEdge(
  source: string,
  mergerId: string,
  sourceOutputIndex: number,
  mergerInputIndex: number
) {
  return {
    source,
    sourceHandle: `quantumHandleGateOutput${sourceOutputIndex}${source}`,
    target: mergerId,
    targetHandle: `quantumHandleMergerInput${mergerInputIndex}${mergerId}`,
    type: "quantumEdge",
    id: generateId(),
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#93C5FD",
      hidden: false,
    },
  };
}

function createMergerToMeasurementEdge(
  mergerId: string,
  measurementId: string
) {
  return {
    source: mergerId,
    sourceHandle: `quantumHandleMergerOutput0${mergerId}`,
    target: measurementId,
    targetHandle: `quantumHandleMeasurementInput0${measurementId}`,
    type: "quantumEdge",
    id: generateId(),
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#93C5FD",
      hidden: false,
    },
  };
}

// ---------------------------------------------------
// MAIN CONVERTER
// ---------------------------------------------------

export function openQasmToFlow(openqasm: string): FlowJson {
  const nodes: any[] = [];
  const edges: any[] = [];

  openqasm = openqasm.replace(/\r\n/g, "\n").replace(/\uFEFF/g, "");

  // ---------------------------------------------------
  // QUBITS
  // ---------------------------------------------------

  const qubitRegex = /qubit\s*\[\s*(\d+)\s*\]\s*([a-zA-Z0-9_]+)\s*;/g;

  const qubitMatches = [...openqasm.matchAll(qubitRegex)];

  if (!qubitMatches.length) {
    throw new Error("No qubit register found.");
  }

  const qubitCount = Number(qubitMatches[0][1]);

  const qubitIdentifiers: string[] = [];
  const lastNodePerQubit: (string | undefined)[] = [];
  const lastOutputLanePerQubit: number[] = [];
  const depthPerQubit: number[] = [];

  for (let i = 0; i < qubitCount; i++) {
    const nodeId = generateId();
    const identifier = `q${i}`;

    qubitIdentifiers.push(identifier);

    const y = i * 180 - 90;

    nodes.push(
      createNode(nodeId, "Qubit Circuit", -90, y, [identifier])
    );

    lastNodePerQubit[i] = nodeId;
    lastOutputLanePerQubit[i] = 0;
    depthPerQubit[i] = 0;
  }

  // ---------------------------------------------------
  // ALIASES
  // ---------------------------------------------------

  const aliasMap: Record<string, number[]> = {};

  const aliasRegex =
    /let\s+([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\s*\[\s*\{([^}]+)\}\s*\]\s*;/g;

  let aliasMatch;

  while ((aliasMatch = aliasRegex.exec(openqasm)) !== null) {
    const alias = aliasMatch[1];

    aliasMap[alias] = aliasMatch[2]
      .split(",")
      .map(v => Number(v.trim()))
      .filter(v => !Number.isNaN(v));
  }

  // ---------------------------------------------------
  // GATES
  // ---------------------------------------------------

  const gateRegex =
    /\b([a-zA-Z]+)\s+([a-zA-Z0-9_]+)(?:\[(\d+)\])?(?:\s*,\s*([a-zA-Z0-9_]+)(?:\[(\d+)\])?)?(?:\s*,\s*([a-zA-Z0-9_]+)(?:\[(\d+)\])?)?\s*;/g;

  let gateMatch;

  while ((gateMatch = gateRegex.exec(openqasm)) !== null) {
    const gate = gateMatch[1].toLowerCase();

    if (gate === "measure") continue;

    const alias1 = gateMatch[2];
    const idx1 = gateMatch[3] ? Number(gateMatch[3]) : 0;

    const alias2 = gateMatch[4];
    const idx2 = gateMatch[5] ? Number(gateMatch[5]) : 0;

    const alias3 = gateMatch[6];
    const idx3 = gateMatch[7] ? Number(gateMatch[7]) : 0;

    if (!aliasMap[alias1]) continue;

    const q1 = aliasMap[alias1][idx1];
    const q2 = alias2 ? aliasMap[alias2]?.[idx2] : undefined;
    const q3 = alias3 ? aliasMap[alias3]?.[idx3] : undefined;

    const physicalQubits = [q1];

    if (q2 !== undefined) physicalQubits.push(q2);
    if (q3 !== undefined) physicalQubits.push(q3);

    const nodeId = generateId();

    const gateDepth =
      Math.max(...physicalQubits.map(q => depthPerQubit[q])) + 1;

    const x = gateDepth * 300 - 180;

    const minQ = Math.min(...physicalQubits);
    const maxQ = Math.max(...physicalQubits);

    const y = ((minQ + maxQ) / 2) * 180 - 90;

    const inputNodes: any[] = [];

    physicalQubits.forEach((q, i) => {
      const prev = lastNodePerQubit[q];

      if (!prev) return;

      const edge = createGateEdge(
        prev,
        nodeId,
        lastOutputLanePerQubit[q],
        i
      );

      edges.push(edge);

      inputNodes.push({
        id: prev,
        edgeId: edge.id,
        identifiers: [qubitIdentifiers[q]],
        targetHandle: `quantumHandleGateInput${i}${nodeId}`,
      });
    });

    nodes.push(
      createNode(
        nodeId,
        GATE_LABELS[gate] || gate.toUpperCase(),
        x,
        y,
        physicalQubits.map(q => qubitIdentifiers[q]),
        inputNodes
      )
    );

    physicalQubits.forEach((q, i) => {
      depthPerQubit[q] = gateDepth;
      lastNodePerQubit[q] = nodeId;
      lastOutputLanePerQubit[q] = i;
    });
  }

  // ---------------------------------------------------
  // MEASUREMENTS
  // ---------------------------------------------------

  const measureRegex =
    /bit\s*\[\s*(\d+)\s*\]\s*([a-zA-Z0-9_]+)\s*=\s*measure\s+([a-zA-Z0-9_]+)\s*\[\s*\{([^}]+)\}\s*\]\s*;/g;

  let m;

  while ((m = measureRegex.exec(openqasm)) !== null) {
    const resultName = m[2];

    const indices = m[4]
      .split(",")
      .map(v => Number(v.trim()));

    const physicalQubits = indices;

    const measurementId = generateId();

    const minQ = Math.min(...physicalQubits);
    const maxQ = Math.max(...physicalQubits);

    const baseY = ((minQ + maxQ) / 2) * 180 - 90;

    const measurementX = 1320;

    let measurementInputId: string;

    // ---------------------------------------------------
    // MULTI-QUBIT → MERGER
    // ---------------------------------------------------

    if (physicalQubits.length > 1) {
      const mergerId = generateId();

      const mergerInputs: any[] = [];

      physicalQubits.forEach((q, i) => {
        const prev = lastNodePerQubit[q];

        if (!prev) return;

        const edge = createGateToMergerEdge(
          prev,
          mergerId,
          lastOutputLanePerQubit[q],
          i
        );

        edges.push(edge);

        mergerInputs.push({
          id: prev,
          edgeId: edge.id,
          identifiers: [qubitIdentifiers[q]],
          targetHandle: `quantumHandleMergerInput${i}${mergerId}`,
        });
      });

      nodes.push(
        createMergerNode(
          mergerId,
          measurementX - 480,
          baseY,
          mergerInputs,
          physicalQubits.map(q => qubitIdentifiers[q])
        )
      );

      measurementInputId = mergerId;

      edges.push(
        createMergerToMeasurementEdge(
          mergerId,
          measurementId
        )
      );
    } else {
      measurementInputId = lastNodePerQubit[physicalQubits[0]]!;
    }

    // ---------------------------------------------------
    // MEASUREMENT NODE
    // ---------------------------------------------------

    nodes.push({
      id: measurementId,
      type: "measurementNode",
      position: { x: measurementX, y: baseY },
      data: {
        label: "Measurement",
        inputs: [
          {
            id: measurementInputId,
            edgeId: "",
            identifiers: physicalQubits.map(
              q => qubitIdentifiers[q]
            ),
            targetHandle: `quantumHandleMeasurementInput0${measurementId}`,
          },
        ],
        identifiers: physicalQubits.map(
          q => qubitIdentifiers[q]
        ),
        outputIdentifier: resultName,
        indices: indices.join(","),
        inputTypes: ["quantum register"],
        outputTypes: ["array", "quantum register"],
        children: [],
        implementation: "",
        implementationType: "",
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      width: 320,
      height: 440,
      positionAbsolute: { x: measurementX, y: baseY },
    });

    physicalQubits.forEach(q => {
      lastNodePerQubit[q] = measurementId;
      lastOutputLanePerQubit[q] = 0;
    });
  }

  return {
    metadata: {
      version: "1.0.0",
      name: "OpenQASM 3.1 Import",
      description: "Generated from OpenQASM",
      author: "",
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
      containsPlaceholder: false,
    },
    nodes,
    edges,
    viewport: {
      x: -155.23281447101772,
      y: 354.3400046901496,
      zoom: 0.5,
    },
  };
}