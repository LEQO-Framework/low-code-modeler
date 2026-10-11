type FlowJson = {
  metadata: any;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
};

const GATE_LABELS: Record<string, string> = {
  x: "X",
  y: "Y",
  z: "Z",
  h: "H",
  cx: "CNOT",
  cnot: "CNOT",
  ccx: "Toffoli",
  swap: "SWAP",
  measure: "Measurement",
};

const generateId = () => crypto.randomUUID();

function createQubitNode(id: string, x: number, y: number, q: string) {
  return {
    id,
    type: "gateNode",
    position: { x, y },
    data: {
      label: "Qubit Circuit",
      inputs: [],
      children: [],
      identifiers: [q],
      inputTypes: [],
      outputTypes: [],
      completionGuaranteed: true,
      compactOptions: [true, false],
      parameter: "0",
    },
    width: 110,
    height: 110,
    positionAbsolute: { x, y },
  };
}

function createGateNode(
  id: string,
  label: string,
  x: number,
  y: number,
  identifiers: string[],
  inputs: any[],
) {
  return {
    id,
    type: "gateNode",
    position: { x, y },
    data: {
      label,
      inputs,
      children: [],
      identifiers,
      inputTypes: Array(inputs.length).fill("any"),
      outputTypes: [],
      completionGuaranteed: true,
      compactOptions: [true, false],
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
  identifiers: string[],
  inputs: any[],
) {
  return {
    id,
    type: "mergerNode",
    position: { x, y },
    data: {
      label: "Merger",
      inputs,
      children: [],
      identifiers,
      inputTypes: Array(inputs.length).fill("any"),
      outputTypes: [],
      numberInputs: inputs.length,
      completionGuaranteed: true,
      compactOptions: [true, false],
    },
    width: 170,
    height: 165,
    positionAbsolute: { x, y },
  };
}

function makeEdge(
  source: string,
  target: string,
  sHandle: string,
  tHandle: string,
) {
  return {
    id: generateId(),
    source,
    target,
    sourceHandle: sHandle,
    targetHandle: tHandle,
    type: "quantumEdge",
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: "#93C5FD",
      hidden: false,
    },
  };
}

export function openQasmToFlow(qasm: string): FlowJson {
  qasm = qasm.replace(/\r\n/g, "\n").replace(/\uFEFF/g, "");

  const nodes: any[] = [];
  const edges: any[] = [];

  // Register
  const qubitMatch = /qubit\[(\d+)\]\s+([a-zA-Z0-9_]+)\s*;/.exec(qasm);
  if (!qubitMatch) throw new Error("No qubit register found");

  const n = Number(qubitMatch[1]);
  const reg = qubitMatch[2];
  const qLabel = (i: number) => `${reg}[${i}]`;

  // Per-qubit wire state:
  //   lastNodeId[q]   = id of the node that currently "owns" qubit q's wire
  //   lastOutIdx[q]   = which output-slot index that qubit exits from that node
  //   depth[q]        = column depth (for x-positioning)
  const lastNodeId: (string | null)[] = Array(n).fill(null);
  const lastOutIdx: number[] = Array(n).fill(0);
  const depth: number[] = Array(n).fill(0);

  // Qubit source nodes
  for (let i = 0; i < n; i++) {
    const id = generateId();
    nodes.push(createQubitNode(id, -90, i * 180 - 90, qLabel(i)));
    lastNodeId[i] = id;
    lastOutIdx[i] = 0; // qubit nodes only have output slot 0
  }

  // 2. ALIAS MAP
  //    let alias = reg[{0}]
  //    let alias = reg[{2,3}]
  //    let alias = otherAlias, copy
  const aliasMap: Record<string, number[]> = {};

  const directAliasRe =
    /let\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_]+)\s*\[\{([^}]+)\}\]\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = directAliasRe.exec(qasm))) {
    const aliasName = m[1];
    const srcName = m[2];
    const idxs = m[3].split(",").map((s) => Number(s.trim()));
    if (srcName === reg) {
      aliasMap[aliasName] = idxs;
    } else if (aliasMap[srcName]) {
      aliasMap[aliasName] = idxs.map((i) => aliasMap[srcName][i]);
    }
  }

  // alias-of-alias without indexing:  let out = encoded;
  const indirectAliasRe = /let\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)\s*;/g;
  while ((m = indirectAliasRe.exec(qasm))) {
    const [, dst, src] = m;
    if (!aliasMap[dst] && aliasMap[src]) aliasMap[dst] = [...aliasMap[src]];
  }

  // 3. RESOLVE alias name + local index, absolute qubit index
  function resolveQubit(name: string, localIdx: number): number | undefined {
    if (aliasMap[name] !== undefined) return aliasMap[name][localIdx];
    if (name === reg) return localIdx;
    return undefined;
  }

  // 4. SOURCE HANDLE for a qubit wire leaving a node
  //
  //    sourceHandle format:
  //      gate/qubit node:  quantumHandleGateOutput{outIdx}{nodeId}
  //      merger node:      quantumHandleMergerOutput{outIdx}{nodeId}
  //
  //    outIdx = the position slot in the node that this qubit uses
  function sourceHandle(nodeId: string, outIdx: number): string {
    const node = nodes.find((nd) => nd.id === nodeId);
    if (node?.type === "mergerNode") {
      return `quantumHandleMergerOutput${outIdx}${nodeId}`;
    }
    return `quantumHandleGateOutput${outIdx}${nodeId}`;
  }

  // 5. APPLY A GATE
  //    operands: ordered list of [aliasName, localIdx]
  function applyGate(gate: string, operands: Array<[string, number]>) {
    // Resolve each operand to an absolute qubit index
    const qIdxs: number[] = [];
    for (const [name, li] of operands) {
      const q = resolveQubit(name, li);
      if (q === undefined) {
        console.warn(`Cannot resolve qubit: ${name}[${li}]`);
        return;
      }
      qIdxs.push(q);
    }

    const gateId = generateId();
    const d = Math.max(...qIdxs.map((q) => depth[q])) + 1;
    const x = d * 300 - 180;
    const y = ((Math.min(...qIdxs) + Math.max(...qIdxs)) / 2) * 180 - 90;

    const inputs: any[] = [];

    qIdxs.forEach((q, inputPos) => {
      const prevNode = lastNodeId[q];
      const prevOutIdx = lastOutIdx[q];
      if (prevNode === null) return;

      // target handle: which input slot of the NEW gate this qubit enters
      const tHandle = `quantumHandleGateInput${inputPos}${gateId}`;
      // source handle: which output slot of the PREVIOUS node this qubit exits
      const sHandle = sourceHandle(prevNode, prevOutIdx);

      const e = makeEdge(prevNode, gateId, sHandle, tHandle);
      edges.push(e);

      inputs.push({
        id: prevNode,
        edgeId: e.id,
        identifiers: [qLabel(q)],
        targetHandle: tHandle,
      });

      // After this gate, qubit q exits at output slot = inputPos (same position)
      lastNodeId[q] = gateId;
      lastOutIdx[q] = inputPos;
      depth[q] = d;
    });

    nodes.push(
      createGateNode(
        gateId,
        GATE_LABELS[gate] || gate.toUpperCase(),
        x,
        y,
        qIdxs.map((q) => qLabel(q)),
        inputs,
      ),
    );
  }

  // 6. PARSE GATE LINES (handle multi-line operands)
  const noComments = qasm
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

  const gateLineRe =
    /\b(x|y|z|h|cx|ccx|cnot|swap)\s+((?:[a-zA-Z0-9_.]+\s*\[\d+\]\s*,?\s*\n?\s*)+);/gi;

  while ((m = gateLineRe.exec(noComments))) {
    const gate = m[1].toLowerCase();
    const operandStr = m[2];
    const opRe = /([a-zA-Z0-9_.]+)\s*\[(\d+)\]/g;
    const operands: Array<[string, number]> = [];
    let om: RegExpExecArray | null;
    while ((om = opRe.exec(operandStr))) {
      operands.push([om[1], Number(om[2])]);
    }
    if (operands.length > 0) applyGate(gate, operands);
  }

  // 7. PARSE MEASUREMENTS
  //
  //  Pattern:
  //    bit[N] name = measure alias[{0,1}];
  //
  //  For each measurement we:
  //    a) Create a MERGER collecting all measured qubit wires
  //    b) Create a MEASUREMENT node with a single input from the merger
  //       (edgeId = "" as per reference format, no edge added for meas <-merger)
  //    c) Add real edges from each qubit's last node into the merger

  const measRe =
    /bit\[(\d+)\]\s+([a-zA-Z0-9_]+)\s*=\s*measure\s+([a-zA-Z0-9_.]+)\s*\[\{([^}]+)\}\]\s*;/g;

  while ((m = measRe.exec(noComments))) {
    const outputName = m[2];
    const aliasName = m[3];
    const localIdxs = m[4]
      .split(",")
      .map((s) => s.trim())
      .map(Number);

    // Resolve to absolute qubit indices
    const absIdxs: number[] = [];
    for (const li of localIdxs) {
      const q = resolveQubit(aliasName, li);
      if (q !== undefined) absIdxs.push(q);
    }
    if (absIdxs.length === 0) continue;

    const maxDepth = Math.max(...depth);
    const midY = ((Math.min(...absIdxs) + Math.max(...absIdxs)) / 2) * 180 - 90;

    const mergerId = generateId();
    const mergerX = (maxDepth + 2) * 300 - 180;
    const mergerY = midY + 180; // place below midpoint like reference

    const mergerInputs: any[] = [];

    absIdxs.forEach((q, mergerInputPos) => {
      const prevNode = lastNodeId[q];
      const prevOutIdx = lastOutIdx[q];
      if (prevNode === null) return;

      const tHandle = `quantumHandleMergerInput${mergerInputPos}${mergerId}`;
      const sHandle = sourceHandle(prevNode, prevOutIdx);

      const e = makeEdge(prevNode, mergerId, sHandle, tHandle);
      edges.push(e);

      mergerInputs.push({
        id: prevNode,
        edgeId: e.id,
        identifiers: [qLabel(q)],
        targetHandle: tHandle,
      });

      // Merger absorbs the wire
      lastNodeId[q] = mergerId;
      lastOutIdx[q] = mergerInputPos;
    });

    // Merger identifiers = all measured qubits
    const mergerIdentifiers = absIdxs.map((q) => qLabel(q));
    nodes.push(
      createMergerNode(
        mergerId,
        mergerX,
        mergerY,
        mergerIdentifiers,
        mergerInputs,
      ),
    );

    // Edge from merger to measurement
    const measId = generateId();
    const measX = mergerX + 350;
    const measY = midY;

    const measTHandle = `quantumHandleMeasurementInput0${measId}`;
    const measSHandle = `quantumHandleMergerOutput0${mergerId}`;

    const measEdge = makeEdge(mergerId, measId, measSHandle, measTHandle);
    edges.push(measEdge);

    // Single input from merger, edgeId is "" per reference format
    nodes.push({
      id: measId,
      type: "measurementNode",
      position: { x: measX, y: measY },
      data: {
        label: "Measurement",
        inputs: [
          {
            id: mergerId,
            edgeId: "",
            identifiers: mergerIdentifiers,
            targetHandle: measTHandle,
          },
        ],
        children: [],
        identifiers: mergerIdentifiers,
        outputIdentifier: outputName,
        indices: localIdxs.join(","),
        inputTypes: ["quantum register"],
        outputTypes: ["array", "quantum register"],
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      width: 320,
      height: 440,
      positionAbsolute: { x: measX, y: measY },
    });
  }

  return {
    metadata: {
      version: "1.0.0",
      name: "OpenQASM Import",
      description: "Converted model from OpenQASM",
      id: `flow-${Date.now()}`,
      author: "",
      timestamp: new Date().toISOString(),
      containsPlaceholder: false,
    },
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.8 },
  };
}
