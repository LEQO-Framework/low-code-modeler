import { Mistral } from "@mistralai/mistralai";

type ChatContent =
  | string
  | { type: string; text?: string }[]
  | null
  | undefined;

function extractText(content: ChatContent): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c === "string" ? c : c.text ?? ""))
      .join("");
  }

  return "";
}

function safeJsonParse<T = any>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function sendToMistral(prompt: string, token) {
  const mistral = new Mistral({ apiKey: token });

  const result = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "system",
        content: `
You are a parser that extracts input variables for a computational flow.

Return ONLY valid JSON in this format:
{
  "inputs": [
    { "name": "inputName", "type": "string | number | boolean" }
  ]
}

### CASE 2: KNOWN QUANTUM STATES

If the user refers to known quantum constructs such as:
- Bell states
- GHZ states
- W states
- entangled states
- standard circuit templates

DO NOT blindly ask questions.

Instead:

---

## RULE: Only request missing parameters

For every quantum construct:

### STEP 1 — Detect explicit values in user input
If the user already specifies a parameter, DO NOT include it again as a select input.

---


## BELL STATES
If user says "Bell state" WITHOUT specifying which one:
--> return select input for bell_state

If user ALREADY specifies a Bell state (e.g. |Φ+>, Phi+, Psi-, etc.):
--> DO NOT return select
--> instead return fixed value input

Return:
{
  "inputs": [
    {
      "name": "bell_state",
      "type": "select",
      "options": ["|Φ+>", "|Φ->", "|Ψ+>", "|Ψ->"]
    },
    {
      "name": "representation",
      "type": "select",
      "options": ["circuit", "compact"]
    }
  ]
}

If user DOES specify Bell state (examples: "|Φ+>", "phi plus", etc.):

Return ONLY:
{
  "inputs": [
    {
      "name": "representation",
      "type": "select",
      "options": ["circuit", "compact"]
    }
  ]
}

---

##  GHZ STATES 

If user does NOT specify number of qubits:

Return:
{
  "inputs": [
    {
      "name": "qubit_count",
      "type": "number"
    },
    {
      "name": "representation",
      "type": "select",
      "options": ["circuit", "compact"]
    }
  ]
}

If user specifies number of qubits (e.g. "3-qubit GHZ"):

DO NOT ask for qubit_count.

Return ONLY:
{
  "inputs": [
    {
      "name": "representation",
      "type": "select",
      "options": ["circuit", "compact"]
    }
  ]
}

---

## GENERAL RULE

Never ask for a parameter that is already explicitly present in the user prompt.

Always:
- infer explicit values
- only request missing ones
- minimize UI friction
        `,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = extractText(result.choices[0].message.content);
  const parsed = safeJsonParse(raw);

  if (!parsed) {
    console.error("Invalid JSON from Mistral:", raw);
    return { inputs: [] };
  }

  return parsed;
}

export async function generateFlow(data: {
  prompt: string;
  inputs: Record<string, any>
}, token: string) {

  const fetched_prompt = await fetch("/prompts/prompt_create_model_in_QLCM_Notation.txt");
  const systemPrompt = await fetched_prompt.text();

  const mistral = new Mistral({ apiKey: token });
  const result = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "system",
        content: systemPrompt
        /*`
You are a quantum workflow generator.

Return ONLY valid JSON representing a flow graph.

Example format:
{
"nodes": [],
"edges": []
}
        `*/
        ,
      },
      {
        role: "user",
        content: `Prompt: ${data.prompt}, Inputs: ${JSON.stringify(data.inputs, null, 2)} `
        /*`
Prompt: ${data.prompt}

Inputs:
${JSON.stringify(data.inputs, null, 2)}
        `*/
        ,
      },
    ],
  });

  const raw = extractText(result.choices[0].message.content);
  console.log("qlcm notation model:", raw)
  if (raw.length > 0) {
    const newJSONFlow = qlcmNotationToJSON(raw);

    const parsed = safeJsonParse(newJSONFlow);


    if (!parsed) {
      console.error("Invalid JSON from qlcmnToJSON:", newJSONFlow);
      return null;
    }

    return parsed;
  }
}

/*
function qlcmNotationToJSON(qlcmNotation: string): string {
    if (!qlcmNotation) return "";


    return "";
}
*/
function qlcmNotationToJSON(qlcmNotation: string): string {
  if (!qlcmNotation) return "";

  const blocks = parseQLCMNotation(qlcmNotation);

  // --- FIX 1: Check for cycles ---
  if (hasCycle(blocks)) {
    console.error("Circular reference detected in blocks! Cannot parse model.");
    return "";
  }

  // --- FIX 2: Validate inputs/outputs ---
  if (!validateBlocks(blocks)) {
    return "";
  }

  const nodeIdMap = new Map<string, string>();
  const nodes: any[] = [];
  const edges: any[] = [];

  const generateId = () => `node-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  // Step 1: Create nodes
  for (const block of blocks) {
    const nodeId = generateId();
    nodeIdMap.set(block.id, nodeId);

    const { type, label, identifiers, inputTypes, outputTypes, width, height, data } =
      getNodeConfig(block, nodeId, blocks);

    const node = {
      id: nodeId,
      type: type,
      position: { x: 0, y: 0 },
      data: {
        label: label,
        inputs: [],
        children: [],
        implementation: "",
        implementationType: "",
        uncomputeImplementationType: "",
        uncomputeImplementation: "",
        completionGuaranteed: true,
        compactOptions: type === "statePreparationNode" ? [false] : [true, false],
        identifiers: identifiers,
        inputTypes: inputTypes,
        outputTypes: outputTypes,
        ...data,
      },
      width: width,
      height: height,
      positionAbsolute: { x: 0, y: 0 }
    };
    nodes.push(node);
  }

  // Step 2: Create edges
  for (const block of blocks) {
    const targetNodeId = nodeIdMap.get(block.id)!;
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) continue;

    for (let i = 0; i < block.inputs.length; i++) {
      const inputBlockId = block.inputs[i];
      const sourceNodeId = nodeIdMap.get(inputBlockId);
      if (!sourceNodeId) {
        console.warn(`Input block ${inputBlockId} not found for block ${block.id}. Skipping edge.`);
        continue;
      }

      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) continue;

      // Skip invalid inputs for BitEncoder (only Bit is allowed)
      if (targetNode.type === "statePreparationNode" && sourceNode.type !== "dataTypeNode") {
        continue;
      }

      // Find the source block
      const sourceBlock = blocks.find(b => b.id === inputBlockId);
      if (!sourceBlock) continue;

      // Skip if the source block has no outputs
      if (!sourceBlock.outputs || sourceBlock.outputs.length === 0) {
        continue;
      }

      // Find the output index of the current block in the source block's outputs
      const outputIndex = sourceBlock.outputs.findIndex(outputId => outputId === block.id);
      if (outputIndex === -1) {
        console.warn(`Block ${block.id} not found in outputs of ${sourceBlock.id}. Skipping edge.`);
        continue;
      }

      const edgeId = generateId();
      const isClassicalEdge =
        (sourceNode.type === "dataTypeNode" && sourceNode.data.dataType === "bit") ||
        (targetNode.type === "statePreparationNode");

      // Determine source and target handles
      const sourceHandle = getSourceHandle(sourceNode, isClassicalEdge, outputIndex);
      const targetHandle = getTargetHandle(targetNode, i, isClassicalEdge);

      const edge = {
        source: sourceNodeId,
        sourceHandle: sourceHandle,
        target: targetNodeId,
        targetHandle: targetHandle,
        type: isClassicalEdge ? "classicalEdge" : "quantumEdge",
        id: edgeId,
        markerEnd: {
          type: "arrowclosed",
          width: 20,
          height: 20,
          color: isClassicalEdge ? "#F5A843" : "#93C5FD",
          hidden: false
        },
        hidden: false
      };
      edges.push(edge);

      // Add input to the target node's data
      const inputData: any = {
        id: sourceNodeId,
        edgeId: edgeId,
        identifiers: sourceNode.data.identifiers,
        targetHandle: targetHandle,
      };
      if (targetNode.type === "statePreparationNode") {
        inputData.outputIdentifier = "";
      }
      targetNode.data.inputs.push(inputData);
    }
  }

  // Step 3: Assign positions
  assignPositions(nodes, edges);

  // Step 4: Generate metadata
  const metadata = {
    version: "1.0.0",
    name: "My Model",
    description: "This is a model.",
    author: "",
    containsPlaceholder: false,
    id: `flow-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  // Step 5: Construct the final JSON
  const result = {
    metadata: metadata,
    nodes: nodes,
    edges: edges,
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  };

  return JSON.stringify(result, null, 2);
}


// Helper: Get source handle for a node
function getSourceHandle(node: any, isClassical: boolean, outputIndex: number = 0): string {
  if (isClassical) {
    return `classicalHandle${node.type}Output${outputIndex}${node.id}`;
  } else {
    if (node.type === "measurementNode") {
      return `quantumHandleMeasurementOutput${outputIndex}${node.id}`;
    } else if (node.type === "gateNode") {
      return `quantumHandleGateOutput${outputIndex}${node.id}`;
    } else if (node.type === "quantumOperatorNode") {
      return `quantumHandleOperationOutput${outputIndex}${node.id}`;
    } else {
      return `quantumHandle${node.type}Output${outputIndex}${node.id}`;
    }
  }
}

// Helper: Get target handle for a node
function getTargetHandle(node: any, inputIndex: number, isClassical: boolean): string {
  if (isClassical) {
    return `classicalHandle${node.type}Input${inputIndex}${node.id}`;
  } else {
    if (node.type === "measurementNode") {
      return `quantumHandleMeasurementInput${inputIndex}${node.id}`;
    } else if (node.type === "gateNode") {
      return `quantumHandleGateInput${inputIndex}${node.id}`;
    } else if (node.type === "quantumOperatorNode") {
      return `quantumHandleOperationInput${inputIndex}${node.id}`;
    } else {
      return `quantumHandle${node.type}Input${inputIndex}${node.id}`;
    }
  }
}

// Helper: Get node configuration based on block type
function getNodeConfig(
  block: { id: string; step: string; inputs: string[]; outputs: string[], state?: string, value?: string },
  nodeId: string,
  allBlocks: Array<{ id: string; step: string; inputs: string[]; outputs: string[] }>
) {
  const identifiers = [block.id.toLowerCase().replace(/[^a-z0-9]/g, '')];
  console.log(block)
  switch (block.step) {
    case "String":
      return {
        type: "dataTypeNode",
        dataType: "String",
        label: "String",
        identifiers,
        inputTypes: [],
        outputTypes: ["String"],
        width: 110,

        height: 110,
        data: { parameter: "0", value: block.value }
      };
    case "Qubit":
      return {
        type: "gateNode",
        label: "Qubit Circuit",
        identifiers,
        inputTypes: [],
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 110,
        height: 110,
        data: { parameter: "0" }
      };
    case "Hadamard":
      return {
        type: "gateNode",
        label: "H",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 110,
        height: 110,
        data: { parameter: "0" }
      };
    case "CNOT":
      return {
        type: "gateNode",
        label: "CNOT",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 110,
        height: 110,
        data: { parameter: "0" }
      };
    case "Bit":
      return {
        type: "dataTypeNode",
        label: "bit",
        identifiers,
        inputTypes: [],
        outputTypes: ["bit"],
        width: 450,
        height: 270,
        data: { dataType: "bit", value: "0", outputIdentifier: "" }
      };
    case "BitEncoder":
      return {
        type: "statePreparationNode",
        label: "Basis Encoding",
        identifiers,
        inputTypes: ["bit"],
        outputTypes: ["quantum register"],
        width: 320,
        height: 373,
        data: {
          encodingType: "Basis Encoding",
          outputs: [{ identifier: "", size: "", type: "quantum" }],
          outputIdentifier: ""
        }
      };
    case "Addition":
    case "Subtraction":
    case "Division":
    case "Multiplication":
      return {
        type: "quantumOperatorNode",
        label: "Quantum Arithmetic Operator",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 320,
        height: 375,
        data: {
          operator: block.step === "Addition" ? "+" :
            block.step === "Subtraction" ? "-" :
              block.step === "Division" ? "/" : "*"
        }
      };
    case "PrepareState":
      console.log(block)
      const prepareState = (block as any).state || "Custom";

      const stateMapping: Record<string, { name: string; size: string }> = {
        BellPhiPlus: { name: "Bell State φ+", size: "2" },
        BellPhiMinus: { name: "Bell State φ-", size: "2" },
        BellPsiPlus: { name: "Bell State ψ+", size: "2" },
        BellPsiMinus: { name: "Bell State ψ-", size: "2" },
        UniformSuperposition: { name: "Uniform Superposition", size: block.value },
        GHZ: { name: "GHZ", size: block.value },
        W: { name: "W State", size: block.value },
        One: { name: "|1⟩", size: block.value },
        Plus: { name: "|+⟩", size: block.value },
        Minus: { name: "|-⟩", size: block.value },
        Custom: { name: "Custom State", size: block.value }
      };

      const mappedState = stateMapping[prepareState] || stateMapping.Custom;

      return {
        type: "statePreparationNode",
        label: "Prepare State",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: ["quantum register"],
        width: 320,
        height: 373,
        data: {
          quantumStateName: mappedState.name,
          size: mappedState.size,
          outputIdentifier: "",
          outputs: [
            {
              identifier: "",
              size: mappedState.size
            }
          ]
        }
      };
    case "Measurement":
      return {
        type: "measurementNode",
        label: "Measurement",
        identifiers,
        inputTypes: ["quantum register"],
        outputTypes: ["array", "quantum register"],
        width: 320,
        height: 440,
        data: {
          indices: "",
          outputIdentifier: "",
          outputs: [
            { identifier: "", size: "", type: "classical" },
            { identifier: "", size: "", type: "quantum" }
          ]
        }
      };
    default:
      return {
        type: "gateNode",
        label: block.step,
        identifiers,
        inputTypes: Array(block.inputs.length).fill("any"),
        outputTypes: Array(block.outputs.length).fill("any"),
        width: 110,
        height: 110,
        data: {}
      };
  }
}

// Helper: Assign positions to nodes
function assignPositions(nodes: any[], edges: any[]) {
  // Step 1: Build adjacency list and in-degree map
  const adjacency: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach(node => {
    adjacency[node.id] = [];
    inDegree[node.id] = 0;
  });
  edges.forEach(edge => {
    adjacency[edge.source].push(edge.target);
    inDegree[edge.target]++;
  });

  // Step 2: Topological sort to assign depths
  const depth: Record<string, number> = {};
  const queue: string[] = [];
  nodes.forEach(node => {
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
      depth[node.id] = 0;
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    for (const neighbor of adjacency[nodeId]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        depth[neighbor] = depth[nodeId] + 1;
      }
    }
  }

  // Step 3: Group nodes by depth (layer)
  const layers: Record<number, string[]> = {};
  nodes.forEach(node => {
    const d = depth[node.id];
    if (!layers[d]) layers[d] = [];
    layers[d].push(node.id);
  });

  // Step 4: Order nodes within each layer using barycenter heuristic
  const orderedLayers: string[][] = [];
  for (let d = 0; d < Object.keys(layers).length; d++) {
    if (!layers[d]) continue;
    orderedLayers[d] = layers[d].slice(); // Copy
  }

  // Apply barycenter heuristic
  for (let d = 1; d < orderedLayers.length; d++) {
    const currentLayer = orderedLayers[d];
    const prevLayer = orderedLayers[d - 1];

    const barycenters: Record<string, number> = {};
    currentLayer.forEach(nodeId => {
      const incomingEdges = edges.filter(e => e.target === nodeId);
      let sum = 0;
      let count = 0;
      incomingEdges.forEach(edge => {
        const sourceIndex = prevLayer.indexOf(edge.source);
        if (sourceIndex !== -1) {
          sum += sourceIndex;
          count++;
        }
      });
      barycenters[nodeId] = count > 0 ? sum / count : 0;
    });

    currentLayer.sort((a, b) => barycenters[a] - barycenters[b]);
  }

  // Step 5: Assign x and y positions
  const layerSpacing = 300; // Horizontal spacing between layers
  const baseNodeSpacing = 20; // Minimum vertical spacing

  // Calculate the maximum height in each layer
  const layerHeights: Record<number, number> = {};
  for (const d in layers) {
    const layer = layers[d];
    let maxHeight = 0;
    layer.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId)!;
      if (node.height > maxHeight) maxHeight = node.height;
    });
    layerHeights[d] = maxHeight;
  }

  // Assign positions with dynamic vertical spacing
  nodes.forEach(node => {
    const d = depth[node.id];
    const layer = orderedLayers[d];
    const indexInLayer = layer.indexOf(node.id);

    // Calculate y position: sum of heights of previous nodes in the same layer + base spacing
    let y = 0;
    for (let i = 0; i < indexInLayer; i++) {
      const prevNodeId = layer[i];
      const prevNode = nodes.find(n => n.id === prevNodeId)!;
      y += prevNode.height + baseNodeSpacing;
    }

    node.position = {
      x: d * layerSpacing,
      y: y,
    };
    node.positionAbsolute = { ...node.position };
  });
}

// Helper: Parse QLCM notation
function parseQLCMNotation(qlcmNotation: string): Array<{
  id: string;
  step: string;
  inputs: string[];
  outputs: string[];
  state: string,
  value: string
}> {
  const blocks: Array<{ id: string; step: string; inputs: string[]; outputs: string[], state: string, value: string }> = [];
  const innerContent = qlcmNotation.trim().slice(1, -1).trim();
  const blockStrings = innerContent.split(/],\s*\[/).map(s => `[${s.trim()}]`);

  for (const blockStr of blockStrings) {
    const idMatch = blockStr.match(/id:\s*"([^"]+)"/);
    const stepMatch = blockStr.match(/step:\s*"([^"]+)"/);
    const inputsMatch = blockStr.match(/inputs:\s*\[([^\]]*)\]/);
    const outputsMatch = blockStr.match(/outputs:\s*\[([^\]]*)\]/);

    const id = idMatch ? idMatch[1] : "";
    const step = stepMatch ? stepMatch[1] : "";
    const inputs = inputsMatch
      ? inputsMatch[1]
        .split(',')
        .map(s => s.trim().replace(/[\[\]"]/g, ''))
        .filter(s => s) // Remove empty strings
      : [];
    const outputs = outputsMatch
      ? outputsMatch[1]
        .split(',')
        .map(s => s.trim().replace(/[\[\]"]/g, ''))
        .filter(s => s) // Remove empty strings
      : [];
    const stateMatch = blockStr.match(/state:\s*"([^"]+)"/);
    const state = stateMatch ? stateMatch[1] : undefined;

    const valueMatch = blockStr.match(/value:\s*"([^"]+)"/);
    const value = valueMatch ? valueMatch[1] : undefined;

    blocks.push({ id, step, inputs, outputs, state, value });
  }

  return blocks;
}

// Helper: check if model has cycle
function hasCycle(blocks: Array<{ id: string; inputs: string[]; outputs: string[] }>): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function visit(blockId: string): boolean {
    if (recursionStack.has(blockId)) return true; // Cycle detected
    if (visited.has(blockId)) return false; // Already visited, no cycle here

    visited.add(blockId);
    recursionStack.add(blockId);

    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;

    // Check all inputs for cycles
    for (const inputId of block.inputs) {
      if (visit(inputId)) return true;
    }

    recursionStack.delete(blockId);
    return false;
  }

  for (const block of blocks) {
    if (visit(block.id)) return true;
  }
  return false;
}

function validateBlocks(blocks: Array<{ id: string; inputs: string[]; outputs: string[] }>): boolean {
  const blockIds = new Set(blocks.map(b => b.id));

  for (const block of blocks) {
    // Check for self-references
    if (block.inputs.includes(block.id) || block.outputs.includes(block.id)) {
      console.error(`Block ${block.id} references itself in inputs or outputs.`);
      return false;
    }

    // Check for invalid input references
    for (const inputId of block.inputs) {
      if (!blockIds.has(inputId)) {
        console.error(`Block ${block.id} references non-existent input: ${inputId}`);
        return false;
      }
    }

    // Check for invalid output references
    for (const outputId of block.outputs) {
      if (!blockIds.has(outputId)) {
        console.error(`Block ${block.id} references non-existent output: ${outputId}`);
        return false;
      }
    }
  }
  return true;
}