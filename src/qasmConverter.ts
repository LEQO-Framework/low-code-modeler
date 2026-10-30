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
      outputTypes: ["quantum register"],
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
      inputTypes: Array(inputs.length).fill("quantum register"),
      outputTypes: Array(Math.max(1, inputs.length)).fill("quantum register"),
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
      inputTypes: Array(inputs.length).fill("quantum register"),
      outputTypes: ["quantum register"],
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

  // Register: QASM 3 "qubit[N] name;" or QASM 2 "qreg name[N];"
  const qasm3Match = /qubit\[(\d+)\]\s+([a-zA-Z0-9_]+)\s*;/.exec(qasm);
  const qasm2Match = /qreg\s+([a-zA-Z0-9_]+)\s*\[(\d+)\]\s*;/.exec(qasm);
  if (!qasm3Match && !qasm2Match)
    throw new Error(
      'No qubit register found. Expected "qubit[N] name;" (OpenQASM 3) or "qreg name[N];" (OpenQASM 2).',
    );

  const n = Number(qasm3Match ? qasm3Match[1] : qasm2Match![2]);
  const reg = qasm3Match ? qasm3Match[2] : qasm2Match![1];
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
  //  Patterns:
  //    QASM 3: bit[N] name = measure alias[{0,1}];
  //    QASM 2: measure q[i] -> c[j];   or   measure q -> c;
  //
  //  All measured qubits are collected, then we:
  //    a) Create one MERGER combining the wires of all qubits
  //       (skipped for a single qubit, which goes straight into the measurement)
  //    b) Create one MEASUREMENT node with a single input from the merger,
  //       its indices are the measured qubits (empty if the whole register is measured)
  const measured: number[] = [];
  let outputName: string | null = null;
  const addMeasured = (q: number | undefined) => {
    if (q !== undefined && q < n && !measured.includes(q)) measured.push(q);
  };

  const measRe =
    /bit\[(\d+)\]\s+([a-zA-Z0-9_]+)\s*=\s*measure\s+([a-zA-Z0-9_.]+)\s*\[\{([^}]+)\}\]\s*;/g;

  while ((m = measRe.exec(noComments))) {
    const aliasName = m[3];
    outputName ??= m[2];
    m[4]
      .split(",")
      .map((s) => Number(s.trim()))
      .forEach((li) => addMeasured(resolveQubit(aliasName, li)));
  }

  const qasm2MeasRe =
    /measure\s+([a-zA-Z0-9_]+)\s*(?:\[(\d+)\])?\s*->\s*([a-zA-Z0-9_]+)\s*(?:\[\d+\])?\s*;/g;

  while ((m = qasm2MeasRe.exec(noComments))) {
    if (m[1] !== reg) continue;
    outputName ??= m[3];
    if (m[2] !== undefined) addMeasured(Number(m[2]));
    else for (let q = 0; q < n; q++) addMeasured(q);
  }

  if (measured.length > 0) {
    const allQubits = [...Array(n).keys()];
    const identifiers = allQubits.map((q) => qLabel(q));
    const maxDepth = Math.max(...depth);
    const midY = ((n - 1) / 2) * 180 - 90;

    const measId = generateId();
    const measX = (maxDepth + 2) * 300 - 180 + (n > 1 ? 350 : 0);
    const measTHandle = `quantumHandleMeasurementInput0${measId}`;

    let measInputNode: string;
    let measSHandle: string;

    if (n > 1) {
      const mergerId = generateId();
      const mergerInputs: any[] = [];

      allQubits.forEach((q, mergerInputPos) => {
        const prevNode = lastNodeId[q];
        if (prevNode === null) return;

        const tHandle = `quantumHandleMergerInput${mergerInputPos}${mergerId}`;
        const e = makeEdge(
          prevNode,
          mergerId,
          sourceHandle(prevNode, lastOutIdx[q]),
          tHandle,
        );
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

      nodes.push(
        createMergerNode(
          mergerId,
          measX - 350,
          midY + 180, // place below midpoint like reference
          identifiers,
          mergerInputs,
        ),
      );
      measInputNode = mergerId;
      measSHandle = `quantumHandleMergerOutput0${mergerId}`;
    } else {
      measInputNode = lastNodeId[0]!;
      measSHandle = sourceHandle(measInputNode, lastOutIdx[0]);
    }

    const measEdge = makeEdge(measInputNode, measId, measSHandle, measTHandle);
    edges.push(measEdge);

    const measuredSorted = [...measured].sort((a, b) => a - b);

    nodes.push({
      id: measId,
      type: "measurementNode",
      position: { x: measX, y: midY },
      data: {
        label: "Measurement",
        inputs: [
          {
            id: measInputNode,
            edgeId: measEdge.id,
            identifiers,
            targetHandle: measTHandle,
          },
        ],
        children: [],
        identifiers,
        outputIdentifier: outputName,
        indices: measured.length === n ? "" : measuredSorted.join(","),
        inputTypes: ["quantum register"],
        outputTypes: ["array", "quantum register"],
        completionGuaranteed: true,
        compactOptions: [true, false],
      },
      width: 320,
      height: 440,
      positionAbsolute: { x: measX, y: midY },
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
