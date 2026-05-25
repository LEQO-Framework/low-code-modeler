import { Node, Edge } from "reactflow";

// Helper to map node types (copy from backend.ts)
function mapNode(node: Node, allNodes: Node[]): any {
  if (node.data.implementation) {
    return {
      id: node.id,
      type: "implementation",
      implementation: node.data.implementation,
    };
  }

  // Map node types as in backend.ts
  switch (node.type) {
    case "gateNode":
      if (node.data.label === "Qubit" || node.data.label === "Qubit Circuit") {
        return { id: node.id, type: "qubit" };
      } else if (["RX(θ)", "RY(θ)", "RZ(θ)"].includes(node.data.label)) {
        return {
          id: node.id,
          type: "gate-with-param",
          gate: node.data.label.toLowerCase().replace(/[()θ]/g, ""),
          parameter: parseFloat(node.data.parameter) || 0,
        };
      } else {
        const gateMap: Record<string, string> = {
          CNOT: "cnot",
          Toffoli: "toffoli",
          H: "h",
          T: "t",
          X: "x",
          Y: "y",
          Z: "z",
        };
        return {
          id: node.id,
          type: "gate",
          gate: gateMap[node.data.label] || node.data.label.toLowerCase(),
        };
      }
    case "statePreparationNode":
      if (node.data.label === "Basis Encoding") {
        return { id: node.id, type: "encode", encoding: "basis", bounds: 0 };
      } else if (node.data.label === "Prepare State") {
        const stateMap: Record<string, string> = {
          "Bell State φ+": "ϕ+",
          "Bell State φ-": "ϕ-",
          "Bell State ψ+": "ψ+",
          "Bell State ψ-": "ψ-",
          GHZ: "ghz",
          "Uniform Superposition": "uniform",
          "W State": "w",
        };
        return {
          id: node.id,
          type: "prepare",
          quantumState: stateMap[node.data.quantumStateName] || "custom",
          size: parseInt(node.data.size) || 1,
        };
      }
      break;
    case "dataTypeNode":
      const value = node.data.value;
      if (node.data.dataType === "Number" || node.data.dataType === "int") {
        return { id: node.id, type: "float", value: parseFloat(value) || 0 };
      } else if (node.data.dataType === "bit") {
        return { id: node.id, type: "bit", value: value === "1" ? 1 : 0 };
      } else if (node.data.dataType === "Boolean" || node.data.dataType === "boolean") {
        return { id: node.id, type: "bool", value: value === "true" };
      } else if (node.data.dataType === "String") {
        return { id: node.id, type: "string", value: value || "" };
      } else if (node.data.dataType === "Array") {
        return {
          id: node.id,
          type: "array",
          value: (Array.isArray(value) ? value : String(value).split(",")).map(Number),
        };
      }
      break;
    case "measurementNode":
      return {
        id: node.id,
        type: "measure",
        indices: (node.data.indices || "").split(",").map((x: string) => parseInt(x, 10)),
      };
    case "quantumOperatorNode":
      return {
        id: node.id,
        type: "operator",
        operator: node.data.operator || "+",
      };
    case "ancillaNode":
      return { id: node.id, type: "ancilla", size: parseInt(node.data.size) || 1 };
    case "qftNode":
      return { id: node.id, type: "qft", inverse: node.data.inverse || false };
    case "controlStructureNode":
      return {
        id: node.id,
        type: "repeat",
        iterations: node.data.condition || 1,
        block: {
          nodes: allNodes
            .filter((n) => n.parentNode === node.id)
            .map((n) => mapNode(n, allNodes)),
          edges: allNodes
            .filter((n) => n.parentNode === node.id)
            .flatMap((n) =>
              allNodes
                .filter((e: any) => e.source === n.id || e.target === n.id)
                .map((e) => mapEdge(e, allNodes))
            ),
        },
      };
    case "ifElseNode":
      const childNodes = allNodes.filter((n) => n.parentNode === node.id);
      const thenNodes = childNodes.filter((n) => n.data.scope === "if");
      const elseNodes = childNodes.filter((n) => n.data.scope === "else");
      return {
        id: node.id,
        type: "if-then-else",
        condition: node.data.condition || "true",
        thenBlock: {
          nodes: thenNodes.map((n) => mapNode(n, allNodes)),
          edges: allNodes
            .filter(
              (e: any) =>
                thenNodes.some((n) => n.id === e.source || n.id === e.target)
            )
            .map((e) => mapEdge(e, allNodes)),
        },
        elseBlock: {
          nodes: elseNodes.map((n) => mapNode(n, allNodes)),
          edges: allNodes
            .filter(
              (e: any) =>
                elseNodes.some((n) => n.id === e.source || n.id === e.target)
            )
            .map((e) => mapEdge(e, allNodes)),
        },
      };
    case "pluginNode":
      return {
        id: node.id,
        type: "plugin",
        pluginName: node.data.pluginName || node.data.label,
        inputs: node.data.dataInputs || [],
        outputs: node.data.dataOutputs || [],
      };
    default:
      return { id: node.id, type: node.type, label: node.data.label };
  }
  return { id: node.id, type: node.type, label: node.data.label };
}

// Helper to map edges (copy from backend.ts)
function mapEdge(edge: Edge, allNodes: Node[]): any {
  const sourceNode = allNodes.find((n) => n.id === edge.source);
  if (!sourceNode) throw new Error(`Source node ${edge.source} not found`);

  // Extract output index from source handle
  const getHandleIndex = (handleId: string | undefined): number => {
    if (!handleId) return 0;
    const match = handleId.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const outputIndex = getHandleIndex(edge.sourceHandle);
  const targetIndex = getHandleIndex(edge.targetHandle);

  const output = sourceNode.data.outputs?.[outputIndex];
  return {
    source: [edge.source, outputIndex],
    target: [edge.target, targetIndex],
    identifier: output?.identifier,
    size: output?.size ? parseInt(output.size, 10) : 1,
  };
}

// Helper to check if edge is nested
function isNestedEdge(edge: Edge, allNodes: Node[]): boolean {
  const sourceNode = allNodes.find((n) => n.id === edge.source);
  const targetNode = allNodes.find((n) => n.id === edge.target);
  return !!(sourceNode?.parentNode || targetNode?.parentNode);
}

// Main function
export async function generateOpenQASMFromFlow(
  nodes: Node[],
  edges: Edge[],
  metadata: any,
  lowcodeBackendEndpoint: string
): Promise<string> {
  const id = `flow-${Date.now()}`;
  const validMetadata = {
    ...metadata,
    containsPlaceholder: metadata.containsPlaceholder || false,
    id,
    timestamp: new Date().toISOString(),
  };

  // Map nodes and edges to backend format
  const mappedNodes = nodes.filter((x) => !x.parentNode).map((n) => mapNode(n, nodes));
  const mappedEdges = edges
    .filter((e) => !isNestedEdge(e, nodes))
    .map((e) => mapEdge(e, nodes));

  const response = await fetch(`${lowcodeBackendEndpoint}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: validMetadata,
      nodes: mappedNodes,
      edges: mappedEdges,
      compilation_target: "qasm", // <-- Use snake_case
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate OpenQASM: ${response.status} ${errorText}`);
  }

  const jsonData = await response.json();
  const uuid = jsonData["uuid"];
  const statusUrl = `${lowcodeBackendEndpoint}/status/${uuid}`;

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 20;
  const delay = 10000;

  while (attempts < maxAttempts) {
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    if (statusData.status === "completed") {
      const resultResponse = await fetch(statusData.result, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const openqasmCode = await resultResponse.text();
      return openqasmCode;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    attempts++;
  }

  throw new Error("Max polling attempts reached for OpenQASM generation.");
}