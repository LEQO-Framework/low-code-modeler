import { Mistral } from "@mistralai/mistralai";
import { openQasmToFlow } from "./qasmConverter";
import { startCompile } from "./backend";

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

// Deterministically converts the compact flows to circuit-lever flows
async function convertCompactToCircuit(
  flow: any,
  lowcodeBackendEndpoint: string
): Promise<any> {
  console.log("Converting compact flow to circuit-level...");

  // Step 1: Generate OpenQASM from the compact flow
  /*const openQASMCode = await generateOpenQASMFromFlow(
    flow.nodes || [],
    flow.edges || [],
    flow.metadata || {},
    lowcodeBackendEndpoint
  );
  */
  const openQASMCode = await startCompile(lowcodeBackendEndpoint, flow.metadata, flow.nodes, flow.edges, "qasm");
  const response= await openQASMCode.json();
  console.log("Generated OpenQASM:", openQASMCode);

  const uuid = response["uuid"];
      let location = response["result"];
      const statusUrl = `${lowcodeBackendEndpoint}/status/${uuid}`;

      console.log("Initial compile response:", response);

      // Polling function returns a Promise
      const pollStatus = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 20;
          const delay = 10000;

          const check = async () => {
            try {
              const statusResponse = await fetch(statusUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!statusResponse.ok) {
                console.error("Status check failed:", statusResponse.status);
                return reject("Status check failed");
              }

              const statusData = await statusResponse.json();
              console.log("Current status:", statusData.status);
              //setStatus(statusData.status);
              location = statusData["result"];

              if (statusData.status === "completed") {
                //showToast("Result for model " + id + " is available.", "success");
                console.log("Operation completed successfully.");
                return resolve();
              }

              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(check, delay);
              } else {
                console.error("Max polling attempts reached. Operation did not complete.");
                //showToast("Max polling attempts for model " + id + " reached.", "error");
                reject("Max polling attempts reached");
              }
            } catch (error) {
              console.error("Error while polling status:", error);
              reject(error);
            }
          };

          check();
        });
      };

      // Wait for polling to complete
      await pollStatus();

      console.log("Fetching final result from:", location);

      const result = await fetch(location, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // TODO: change for workflow
      // TODO: add modals for service deployment
      // TODO: add QRMS upload
      const openqasmCode = await result.text();
  
  // Step 2: Convert OpenQASM back to a flow
  const circuitFlow = openQasmToFlow(openqasmCode);
  console.log("Converted circuit flow:", circuitFlow);

  return circuitFlow;
}



export async function sendToMistral(prompt: string, token: string) {
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

export async function generateFlow(
  data: {
    prompt: string;
    inputs: Record<string, any>;
    generationMode: "compact" | "circuit";
  },
  token: string,
  lowcodeBackendEndpoint?: string // Add this parameter
): Promise<any> {
  const fetched_prompt = await fetch("/prompts/prompt_create_model_in_QLCM_Notation.txt");
  const systemPrompt = await fetched_prompt.text();

  const mistral = new Mistral({ apiKey: token });
  const result = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Prompt: ${data.prompt}, Inputs: ${JSON.stringify(data.inputs, null, 2)}`,
      },
    ],
  });

  const raw = extractText(result.choices[0].message.content);
  console.log("qlcm notation model:", raw);
  if (raw.length > 0) {
    const newJSONFlow = qlcmNotationToJSON(raw);
    const parsed = safeJsonParse(newJSONFlow);

    if (!parsed) {
      console.error("Invalid JSON from qlcmnToJSON:", newJSONFlow);
      return null;
    }

    // If circuit-level is selected, convert the flow
    if (data.generationMode === "circuit" && lowcodeBackendEndpoint) {
      return await convertCompactToCircuit(parsed, lowcodeBackendEndpoint);
    }

    return parsed;
  }
  return null;
}



function qlcmNotationToJSON(qlcmNotation: string): string {
  if (!qlcmNotation) return "";

  const blocks = parseQLCMNotation(qlcmNotation);

  if (hasCycle(blocks)) {
    console.error("Circular reference detected in blocks! Cannot parse model.");
    return "";
  }

  if (!validateBlocks(blocks)) {
    return "";
  }

  const nodeIdMap = new Map<string, string>();
  const nodes: any[] = [];
  const edges: any[] = [];

  //const generateId = () => `node-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
  const generateId = () => crypto.randomUUID();


  // Step 1: Create nodes
  for (const block of blocks) {
    const nodeId = generateId();
    nodeIdMap.set(block.id, nodeId);

    const nodeConfig = getNodeConfig(block, nodeId, blocks);

    const node = {
      id: nodeId,
      type: nodeConfig.type,
      position: { x: 0, y: 0 },
      data: {
        label: nodeConfig.label,
        inputs: [],
        children: [],
        implementation: "",
        implementationType: "",
        uncomputeImplementationType: "",
        uncomputeImplementation: "",
        completionGuaranteed: true,
        compactOptions: nodeConfig.type === "statePreparationNode" ? [false] : [true, false],
        identifiers: nodeConfig.identifiers,
        inputTypes: nodeConfig.inputTypes,
        outputTypes: nodeConfig.outputTypes,
        ...nodeConfig.data,
      },
      width: nodeConfig.width,
      height: nodeConfig.height,
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

      // Skip invalid connections for state preparation
      if (targetNode.data.label === "Basis Encoding" && sourceNode.type !== "dataTypeNode") {
        continue;
      }

      const sourceBlock = blocks.find(b => b.id === inputBlockId);
      if (!sourceBlock) continue;

      if (!sourceBlock.outputs || sourceBlock.outputs.length === 0) {
        continue;
      }

      // Check if this block is in the outputs of the source block
      const isConnected = sourceBlock.outputs.includes(block.id);
      if (!isConnected) {
        console.warn(`Block ${block.id} not found in outputs of ${sourceBlock.id}. Skipping edge.`);
        continue;
      }

      const outputIndex = sourceBlock.outputs.indexOf(block.id);

      const edgeId = generateId();

      // Determine if this is a classical edge
      const isClassicalEdge = isClassicalConnection(sourceNode, targetNode);

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

  assignPositions(nodes, edges);

  const metadata = {
    version: "1.0.0",
    name: "My Model",
    description: "This is a model.",
    author: "",
    containsPlaceholder: false,
    id: `flow-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

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

// helper function to determine if a connection is classical
function isClassicalConnection(sourceNode: any, targetNode: any): boolean {
  // Check if source is a classical data type
  const sourceIsClassical =
    sourceNode.type === "dataTypeNode" &&
    (sourceNode.data.dataType === "bit" ||
     sourceNode.data.dataType === "Number" ||
     sourceNode.data.dataType === "Boolean" ||
     sourceNode.data.dataType === "Array" ||
     sourceNode.data.dataType === "File" ||
     sourceNode.data.dataType === "String");

  // Check if target is a plugin node (like clustering)
  const targetIsPlugin = targetNode.type === "pluginNode";

  // Check if source is a plugin node
  const sourceIsPlugin = sourceNode.type === "pluginNode";

  // Check if target is a state preparation node
  const targetIsStatePrep = targetNode.type === "statePreparationNode";

  return sourceIsClassical || targetIsPlugin || sourceIsPlugin || targetIsStatePrep;
}

function getSourceHandle(node: any, isClassical: boolean, outputIndex: number = 0): string {
  if (isClassical) {
    if (node.type === "dataTypeNode") {
      return `classicalHandleDataTypeOutput${outputIndex}${node.id}`;
    } else if (node.type === "pluginNode") {
      return `classicalHandlePluginOutput${outputIndex}${node.id}`;
    } else {
      return `classicalHandle${node.type}Output${outputIndex}${node.id}`;
    }
  } else {
    if (node.type === "measurementNode") {
      return `quantumHandleMeasurementOutput${outputIndex}${node.id}`;
    } else if (node.type === "gateNode") {
      return `quantumHandleGateOutput${outputIndex}${node.id}`;
    } else if (node.type === "quantumOperatorNode") {
      return `quantumHandleOperationOutput${outputIndex}${node.id}`;
    } else if (node.type === "statePreparationNode") {
      return `quantumHandleStatePreparationOutput${outputIndex}${node.id}`;
    } else {
      return `quantumHandle${node.type}Output${outputIndex}${node.id}`;
    }
  }
}

function getTargetHandle(node: any, inputIndex: number, isClassical: boolean): string {
  if (isClassical) {
    if (node.type === "dataTypeNode") {
      return `classicalHandleDataTypeInput${inputIndex}${node.id}`;
    } else if (node.type === "pluginNode") {
      return `classicalHandlePluginInput${inputIndex}${node.id}`;
    } else if (node.type === "statePreparationNode") {
      return `classicalHandleStatePreparationInput${inputIndex}${node.id}`;
    } else {
      return `classicalHandle${node.type}Input${inputIndex}${node.id}`;
    }
  } else {
    if (node.type === "measurementNode") {
      return `quantumHandleMeasurementInput${inputIndex}${node.id}`;
    } else if (node.type === "gateNode") {
      return `quantumHandleGateInput${inputIndex}${node.id}`;
    } else if (node.type === "quantumOperatorNode") {
      return `quantumHandleOperationInput${inputIndex}${node.id}`;
    } else if (node.type === "statePreparationNode") {
      return `quantumHandleStatePreparationInput${inputIndex}${node.id}`;
    } else {
      return `quantumHandle${node.type}Input${inputIndex}${node.id}`;
    }
  }
}

function getNodeConfig(
  block: {
    id: string;
    step: string;
    inputs: string[];
    outputs: string[];
    state?: string;
    value?: string | number;
    variant?: string;
    inputs_classical?: string[];
    inputs_quantum?: string[];
    condition?: string;
    thenBlocks?: any[];
    elseBlocks?: any[];
    number?: number;
    repeat?: any[];
  }) {
  const identifiers = [block.id.toLowerCase().replace(/[^a-z0-9]/g, '')];

  switch (block.step) {
    // --- Quantum Blocks ---
    case "Qubit":
      return {
        type: "gateNode",
        label: "Qubit Circuit",
        identifiers,
        inputTypes: [],
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 110,
        height: 110,
        data: {
          parameter: "0",
          numberQuantumInputs: 0,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
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
        data: {
          parameter: "0",
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
      };
    case "Z":
      return {
        type: "gateNode",
        label: "Z",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 110,
        height: 110,
        data: {
          parameter: "0",
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
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
        data: {
          parameter: "0",
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
      };

    // --- Classical Data Types ---
    case "Bit":
      return {
        type: "dataTypeNode",
        label: "Bit",
        identifiers,
        inputTypes: [],
        outputTypes: ["bit"],
        width: 450,
        height: 270,
        data: {
          dataType: "bit",
          value: block.value !== undefined ? block.value.toString() : "0",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "bit" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };
    case "Number":
      return {
        type: "dataTypeNode",
        label: "Number",
        identifiers,
        inputTypes: [],
        outputTypes: ["Number"],
        width: 450,
        height: 270,
        data: {
          dataType: "Number",
          value: block.value !== undefined ? block.value.toString() : "",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "Number" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };
    case "Boolean":
      return {
        type: "dataTypeNode",
        label: "Boolean",
        identifiers,
        inputTypes: [],
        outputTypes: ["Boolean"],
        width: 450,
        height: 270,
        data: {
          dataType: "Boolean",
          value: block.value !== undefined ? block.value.toString() : "false",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "Boolean" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };
    case "Array":
      return {
        type: "dataTypeNode",
        label: "Array",
        identifiers,
        inputTypes: [],
        outputTypes: ["Array"],
        width: 450,
        height: 270,
        data: {
          dataType: "Array",
          value: block.value !== undefined ? block.value.toString() : "",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "Array" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };
    case "String":
      return {
        type: "dataTypeNode",
        label: "String",
        identifiers,
        inputTypes: [],
        outputTypes: ["String"],
        width: 450,
        height: 270,
        data: {
          dataType: "String",
          value: block.value !== undefined ? block.value.toString() : "",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "String" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };
    case "File":
      return {
        type: "dataTypeNode",
        label: "File",
        identifiers,
        inputTypes: [],
        outputTypes: ["File"],
        width: 450,
        height: 270,
        data: {
          dataType: "File",
          value: block.value !== undefined ? block.value.toString() : "",
          outputIdentifier: "",
          inputTypes: [],
          outputTypes: { "0": "File" },
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };

    // --- Operators ---
    case "QuantumArithmeticOperator":
      return {
        type: "quantumOperatorNode",
        label: "Quantum Arithmetic Operator",
        identifiers,
        inputTypes: Array(block.inputs.length).fill("quantum register"),
        outputTypes: Array(block.outputs.length).fill("quantum register"),
        width: 320,
        height: 375,
        data: {
          operator: block.variant === "Addition" ? "+" :
                   block.variant === "Subtraction" ? "-" :
                   block.variant === "Division" ? "/" : "*",
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
      };

    // --- Encoding & Measurement ---
    case "BasisEncoder":
      return {
        type: "statePreparationNode",
        label: "Basis Encoding",
        identifiers,
        inputTypes: ["bit", "Number"],
        outputTypes: ["quantum register"],
        width: 320,
        height: 373,
        data: {
          encodingType: "Basis Encoding",
          outputs: [{ identifier: "", size: "", type: "quantum" }],
          outputIdentifier: "",
          numberQuantumInputs: 0,
          numberQuantumOutputs: 1,
          numberClassicalInputs: 1,
          numberClassicalOutputs: 0
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
          ],
          numberQuantumInputs: 1,
          numberQuantumOutputs: 1,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 1
        }
      };

    // --- State Preparation ---
    case "PrepareState":
      const prepareState = block.state || "Custom";
      const stateMapping: Record<string, { name: string; size: string }> = {
        BellPhiPlus: { name: "Bell State φ+", size: "2" },
        BellPhiMinus: { name: "Bell State φ-", size: "2" },
        BellPsiPlus: { name: "Bell State ψ+", size: "2" },
        BellPsiMinus: { name: "Bell State ψ-", size: "2" },
        UniformSuperposition: { name: "Uniform Superposition", size: block.value ? block.value.toString() : "" },
        GHZ: { name: "GHZ", size: block.value ? block.value.toString() : "" },
        W: { name: "W State", size: block.value ? block.value.toString() : "" },
        One: { name: "|1⟩", size: block.value ? block.value.toString() : "" },
        Plus: { name: "|+⟩", size: block.value ? block.value.toString() : "" },
        Minus: { name: "|-⟩", size: block.value ? block.value.toString() : "" },
        Custom: { name: "Custom State", size: block.value ? block.value.toString() : "" }
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
          outputs: [{ identifier: "", size: mappedState.size, type: "quantum" }],
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: 1,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
      };

    // --- Clustering Blocks ---
    case "QuantumClustering":
      return {
        type: "pluginNode",
        label: "Quantum Clustering",
        identifiers,
        inputTypes: ["File", "Number"],
        outputTypes: ["Array"],
        width: 320,
        height: 550,
        data: {
          label: "Quantum Clustering",
          pluginName: "Quantum Clustering",
          clusteringAlgorithm: "quantum-k-means",
          identifiers,
          inputTypes: ["File", "Number"],
          outputTypes: { "0": "Array" },
          dataInputs: [
            {
              parameter: "entityPointsUrl",
              data_type: "entity/vector",
              content_type: ["application/json", "text/csv"],
              required: true
            },
            {
              parameter: "numberOfClusters",
              data_type: "int",
              content_type: ["text/plain"],
              required: true
            }
          ],
          dataOutputs: [
            {
              name: "Cluster Labels",
              data_type: "entity/label",
              content_type: ["application/json"],
              required: true
            }
          ],
          inputs: [],
          children: [],
          implementation: "",
          implementationType: "",
          uncomputeImplementationType: "",
          uncomputeImplementation: "",
          completionGuaranteed: true,
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 2,
          numberClassicalOutputs: 1
        }
      };
    case "ClassicalClustering":
      return {
        type: "pluginNode",
        label: "Classical Clustering",
        identifiers,
        inputTypes: ["File", "Number", "Number", "Number"],
        outputTypes: ["Array"],
        width: 320,
        height: 550,
        data: {
          label: "Classical Clustering",
          pluginName: "Classical Clustering",
          clusteringAlgorithm: "k-means",
          identifiers,
          inputTypes: ["File", "Number", "Number", "Number"],
          outputTypes: { "0": "Array" },
          dataInputs: [
            {
              parameter: "entityPointsUrl",
              data_type: "entity/vector",
              content_type: ["application/json", "text/csv"],
              required: true
            },
            {
              parameter: "numberOfClusters",
              data_type: "int",
              content_type: ["text/plain"],
              required: true
            },
            {
              parameter: "relativeResidual",
              data_type: "float",
              content_type: ["text/plain"],
              required: true
            },
            {
              parameter: "maxIterations",
              data_type: "int",
              content_type: ["text/plain"],
              required: true
            }
          ],
          dataOutputs: [
            {
              name: "Cluster Labels",
              data_type: "entity/label",
              content_type: ["application/json"],
              required: true
            }
          ],
          inputs: [],
          children: [],
          implementation: "",
          implementationType: "",
          uncomputeImplementationType: "",
          uncomputeImplementation: "",
          completionGuaranteed: true,
          numberQuantumInputs: 0,
          numberQuantumOutputs: 0,
          numberClassicalInputs: 4,
          numberClassicalOutputs: 1
        }
      };

    // --- Control Flow ---
    case "If-Then-Else":
      return {
        type: "controlNode",
        label: "If-Then-Else",
        identifiers,
        inputTypes: ["bit", "quantum register"],
        outputTypes: ["quantum register"],
        width: 320,
        height: 400,
        data: {
          condition: block.condition || "",
          identifiers,
          inputTypes: ["bit", "quantum register"],
          outputTypes: ["quantum register"],
          numberQuantumInputs: 1,
          numberQuantumOutputs: 1,
          numberClassicalInputs: 1,
          numberClassicalOutputs: 0
        }
      };
    case "Repeat":
      return {
        type: "controlNode",
        label: "Repeat",
        identifiers,
        inputTypes: ["bit", "quantum register"],
        outputTypes: ["quantum register"],
        width: 320,
        height: 400,
        data: {
          number: block.number || 1,
          identifiers,
          inputTypes: ["bit", "quantum register"],
          outputTypes: ["quantum register"],
          numberQuantumInputs: 1,
          numberQuantumOutputs: 1,
          numberClassicalInputs: 1,
          numberClassicalOutputs: 0
        }
      };

    // --- Default ---
    default:
      return {
        type: "gateNode",
        label: block.step,
        identifiers,
        inputTypes: Array(block.inputs.length).fill("any"),
        outputTypes: Array(block.outputs.length).fill("any"),
        width: 110,
        height: 110,
        data: {
          numberQuantumInputs: block.inputs.length,
          numberQuantumOutputs: block.outputs.length,
          numberClassicalInputs: 0,
          numberClassicalOutputs: 0
        }
      };
  }
}

function assignPositions(nodes: any[], edges: any[]) {
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

  const layers: Record<number, string[]> = {};
  nodes.forEach(node => {
    const d = depth[node.id];
    if (!layers[d]) layers[d] = [];
    layers[d].push(node.id);
  });

  const orderedLayers: string[][] = [];
  for (let d = 0; d < Object.keys(layers).length; d++) {
    if (!layers[d]) continue;
    orderedLayers[d] = layers[d].slice();
  }

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

  // Increased layer spacing from 300 to 500 for better horizontal separation
  const layerSpacing = 500;
  // Increased base node spacing from 20 to 40 for better vertical separation
  const baseNodeSpacing = 40;

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

  nodes.forEach(node => {
    const d = depth[node.id];
    const layer = orderedLayers[d];
    const indexInLayer = layer.indexOf(node.id);

    let y = 0;
    for (let i = 0; i < indexInLayer; i++) {
      const prevNodeId = layer[i];
      const prevNode = nodes.find(n => n.id === prevNodeId)!;
      y += prevNode.height + baseNodeSpacing;
    }

    // Add additional vertical spacing for data type nodes to prevent overlap
    const nodeData = nodes.find(n => n.id === node.id);
    if (nodeData && nodeData.type === "dataTypeNode") {
      y += 20; // Extra spacing for data type nodes
    }

    node.position = {
      x: d * layerSpacing,
      y: y,
    };
    node.positionAbsolute = { ...node.position };
  });
}

function parseQLCMNotation(qlcmNotation: string): Array<{
  id: string;
  step: string;
  inputs: string[];
  outputs: string[];
  state?: string;
  value?: string | number;
  variant?: string;
  inputs_classical?: string[];
  inputs_quantum?: string[];
  condition?: string;
  thenBlocks?: any[];
  elseBlocks?: any[];
  number?: number;
  repeat?: any[];
}> {
  const blocks: Array<{
    id: string;
    step: string;
    inputs: string[];
    outputs: string[];
    state?: string;
    value?: string | number;
    variant?: string;
    inputs_classical?: string[];
    inputs_quantum?: string[];
    condition?: string;
    thenBlocks?: any[];
    elseBlocks?: any[];
    number?: number;
    repeat?: any[];
  }> = [];

  console.log("qlcmNotation:" + qlcmNotation);

  const innerContent = qlcmNotation.trim().slice(1, -1).trim();
  if (!innerContent) return blocks;

  // Split blocks, handling nested structures
  let depth = 0;
  let start = 0;
  for (let i = 0; i < innerContent.length; i++) {
    if (innerContent[i] === '[') depth++;
    if (innerContent[i] === ']') depth--;
    if (depth === 0 && innerContent[i] === ',') {
      const blockStr = innerContent.slice(start, i).trim();
      if (blockStr) {
        const parsedBlock = parseSingleBlock(`[${blockStr}]`);
        if (parsedBlock) blocks.push(parsedBlock);
      }
      start = i + 1;
    }
  }
  // Add the last block
  const lastBlockStr = innerContent.slice(start).trim();
  if (lastBlockStr) {
    const parsedBlock = parseSingleBlock(`[${lastBlockStr}]`);
    if (parsedBlock) blocks.push(parsedBlock);
  }

  return blocks;
}

function parseSingleBlock(blockStr: string): any {
  const idMatch = blockStr.match(/id:\s*"([^"]+)"/);
  const stepMatch = blockStr.match(/step:\s*"([^"]+)"/);
  const inputsMatch = blockStr.match(/inputs:\s*\[([^\]]*)\]/);
  const outputsMatch = blockStr.match(/outputs:\s*\[([^\]]*)\]/);
  const stateMatch = blockStr.match(/state:\s*"([^"]+)"/);
  const valueMatch = blockStr.match(/value:\s*"([^"]+)"|value:\s*([^\s,[\]]+)/);
  const variantMatch = blockStr.match(/variant:\s*"([^"]+)"/);
  const inputsClassicalMatch = blockStr.match(/inputs_classical:\s*\[([^\]]*)\]/);
  const inputsQuantumMatch = blockStr.match(/inputs_quantum:\s*\[([^\]]*)\]/);
  const conditionMatch = blockStr.match(/condition:\s*"([^"]+)"/);
  const numberMatch = blockStr.match(/number:\s*(\d+)/);

  const id = idMatch ? idMatch[1] : "";
  const step = stepMatch ? stepMatch[1] : "";

  const inputs = inputsMatch
    ? inputsMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[[\]"]/g, ''))
      .filter(s => s)
    : [];

  const outputs = outputsMatch
    ? outputsMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[[\]"]/g, ''))
      .filter(s => s)
    : [];

  const state = stateMatch ? stateMatch[1] : undefined;

  // Handle value (can be string or number)
  let value: string | number | undefined;
  if (valueMatch) {
    value = valueMatch[1] ? valueMatch[1] : valueMatch[2];
    // Try to parse as number if not a string
    if (value && !isNaN(Number(value)) && !/^["']/.test(value)) {
      value = Number(value);
    }
  }

  const variant = variantMatch ? variantMatch[1] : undefined;

  const inputs_classical = inputsClassicalMatch
    ? inputsClassicalMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[[\]"]/g, ''))
      .filter(s => s)
    : [];

  const inputs_quantum = inputsQuantumMatch
    ? inputsQuantumMatch[1]
      .split(',')
      .map(s => s.trim().replace(/[[\]"]/g, ''))
      .filter(s => s)
    : [];

  const condition = conditionMatch ? conditionMatch[1] : undefined;
  const number = numberMatch ? parseInt(numberMatch[1], 10) : undefined;

  // Handle nested blocks (then/else/repeat)
  let thenBlocks: any[] = [];
  let elseBlocks: any[] = [];
  let repeatBlocks: any[] = [];

  // Use a more robust regex to capture nested blocks
  const thenMatch = blockStr.match(/thenBlocks:\s*\[([\s\S]*?)(?=\s*elseBlocks:\s*\[|\s*\]\s*$)/);
  if (thenMatch) {
    try {
      const thenContent = `[${thenMatch[1].trim()}]`;
      thenBlocks = parseQLCMNotation(thenContent);
    } catch (e) {
      console.warn("Could not parse then blocks:", e);
    }
  }

  const elseMatch = blockStr.match(/else:\s*\[([\s\S]*?)(?=\s*\]\s*$)/);
  if (elseMatch) {
    try {
      const elseContent = `[${elseMatch[1].trim()}]`;
      elseBlocks = parseQLCMNotation(elseContent);
    } catch (e) {
      console.warn("Could not parse else blocks:", e);
    }
  }

  const repeatMatch = blockStr.match(/repeat:\s*\[([\s\S]*?)(?=\s*\]\s*$)/);
  if (repeatMatch) {
    try {
      const repeatContent = `[${repeatMatch[1].trim()}]`;
      repeatBlocks = parseQLCMNotation(repeatContent);
    } catch (e) {
      console.warn("Could not parse repeat blocks:", e);
    }
  }

  return {
    id,
    step,
    inputs,
    outputs,
    state,
    value,
    variant,
    inputs_classical,
    inputs_quantum,
    condition,
    number,
    thenBlocks: thenBlocks,
    elseBlocks: elseBlocks,
    repeat: repeatBlocks
  };
}

function hasCycle(blocks: Array<{ id: string; inputs: string[]; outputs: string[] }>): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function visit(blockId: string): boolean {
    if (recursionStack.has(blockId)) return true;
    if (visited.has(blockId)) return false;

    visited.add(blockId);
    recursionStack.add(blockId);

    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;

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
      console.error(`❌ Block ${block.id} references itself in inputs or outputs.`);
      return false;
    }

    // Check for invalid input references
    for (const inputId of block.inputs) {
      if (!blockIds.has(inputId)) {
        console.error(`❌ Block ${block.id} references non-existent input: ${inputId}. Available blocks: ${Array.from(blockIds).join(", ")}`);
        return false;
      }
    }

    // Check for invalid output references
    for (const outputId of block.outputs) {
      if (!blockIds.has(outputId)) {
        console.error(`❌ Block ${block.id} references non-existent output: ${outputId}. Available blocks: ${Array.from(blockIds).join(", ")}`);
        return false;
      }
    }
  }
  return true;
}
