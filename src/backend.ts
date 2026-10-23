import { Edge, Node } from "reactflow";
import * as consts from "./constants";
import type { components } from "./backend.types";
import {
  getPayloadEntries,
  isApiConnectorNode,
  normalizeApiConnector,
  toBackendApiConnector,
} from "./lib/apiConnector";

type CompileRequest = components["schemas"]["CompileRequest"];
type BackendNode = CompileRequest["nodes"][0];
type BackendEdge = CompileRequest["edges"][0];
export type StatusResult = components["schemas"]["StatusBody"];

export const startCompile = async (
  baseUrl: string,
  metadata: any,
  rawNodes: Node[],
  rawEdges: Edge[],
  compilation_target: string,
): Promise<Response> => {
  // 1. Deep clone nodes to safely inject missing parentNodes based on visual geometry
  const nodes = rawNodes.map((n) => ({ ...n, data: { ...n.data } }));

  // --- GHOST EDGE SANITIZATION ---
  const edges = rawEdges.filter(
    (e) =>
      nodes.some((n) => n.id === e.source) &&
      nodes.some((n) => n.id === e.target),
  );
  // 2. Pre-processing pass: Auto-assign parentNode and scope by checking bounding boxes
  nodes.forEach((child) => {
    if (
      child.type === consts.IfElseNode ||
      child.type === consts.ControlStructureNode
    )
      return;

    const containers = nodes.filter(
      (n) =>
        n.type === consts.IfElseNode || n.type === consts.ControlStructureNode,
    );
    for (const container of containers) {
      const cx = container.positionAbsolute?.x ?? container.position?.x ?? 0;
      const cy = container.positionAbsolute?.y ?? container.position?.y ?? 0;
      const cw = container.width ?? 1100;
      const ch = container.height ?? 900;

      let nx = child.positionAbsolute?.x ?? child.position?.x ?? 0;
      let ny = child.positionAbsolute?.y ?? child.position?.y ?? 0;

      // We must add the container's absolute position to get the true screen coordinates.
      if (child.parentNode === container.id && !child.positionAbsolute) {
        nx += cx;
        ny += cy;
      }

      const nodeCenterY = ny + (child.height ?? 50) / 2;
      const nodeCenterX = nx + (child.width ?? 100) / 2;

      // If visually inside OR already parented by React Flow
      if (
        child.parentNode === container.id ||
        (nodeCenterX > cx &&
          nodeCenterX < cx + cw &&
          nodeCenterY > cy &&
          nodeCenterY < cy + ch)
      ) {
        child.parentNode = container.id;

        // Top half is Then ("if"), Bottom half is Else ("else") - ONLY FOR IF NODES
        if (container.type === consts.IfElseNode) {
          child.data.scope = nodeCenterY < cy + ch / 2 ? "if" : "else";
        }
        break;
      }
    }
  });

  function resolveRegisterSize(
    nodeId: string,
    visited = new Set<string>(),
  ): number {
    if (visited.has(nodeId)) return 3;
    visited.add(nodeId);

    const incomingEdge = edges.find((e) => e.target === nodeId);

    if (!incomingEdge) {
      const selfNode = nodes.find((n) => n.id === nodeId);
      if (selfNode?.data?.size) return parseInt(selfNode.data.size, 10);
      return 3;
    }

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    if (!sourceNode) return 3;

    if (sourceNode.data?.size) {
      return parseInt(sourceNode.data.size, 10);
    }

    return resolveRegisterSize(sourceNode.id, visited);
  }

  return await fetch(new URL("/compile", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: {
        id: `flow-${Date.now()}`,
        ...metadata,
      },
      nodes: nodes.filter((x) => !x.parentNode).map(mapNode),
      edges: edges
        .filter((e) => !isNestedEdge(e))
        .filter((e) => {
          const targetNode = nodes.find((n) => n.id === e.target);
          if (targetNode && targetNode.type === consts.QAOANode) {
            return false;
          }
          return true;
        })
        .map(mapEdge),
      compilation_target: compilation_target,
    } satisfies CompileRequest),
  });

  function mapNode(node: Node): BackendNode {
    // custom operators implemented by an API become a service task in the workflow
    if (isApiConnectorNode(node)) {
      return {
        id: node.id,
        type: "api-connector",
        label: node.data.label,
        ...toBackendApiConnector(
          normalizeApiConnector(node.data.apiConnector),
          getPayloadEntries(node, nodes, edges),
        ),
      };
    }

    if (node.data.implementation) {
      return {
        id: node.id,
        type: "implementation",
        implementation: node.data.implementation,
      };
    }

    switch (node.type) {
      // Boundary Nodes
      case consts.EditableNode:
        return {
          id: node.id,
          type: "editableNode",
          label: node.data.label, // optional
          propertyValues: node.data.propertyValues || {}, // numeric/string/date/etc.
          mapping: node.data.mapping || [], // input-output mapping
          isDataType: node.data.isDataType || "false", // true if it is a data type node, false if it is a operator node
        };

      case consts.StatePreparationNode:
        switch (node.data.label) {
          case "Encode Value": {
            return {
              id: node.id,
              type: "encode",
              encoding: map(
                {
                  "Amplitude Encoding": "amplitude",
                  "Angle Encoding": "angle",
                  "Basis Encoding": "basis",
                  "Custom Encoding": "custom",
                  "Matrix Encoding": "matrix",
                  "Schmidt Decomposition": "schmidt",
                },
                node.data.encodingType,
              ),
              bounds:
                node.data.encodingType === "Basis Encoding"
                  ? 0
                  : parseFloat(node.data.bound),
              decimalPrecision:
                node.data.decimalPrecision !== undefined &&
                node.data.decimalPrecision !== ""
                  ? parseInt(node.data.decimalPrecision, 10)
                  : null,
            };
          }

          case "Basis Encoding":
            return {
              id: node.id,
              type: "encode",
              encoding: "basis",
              bounds: 0,
              decimalPrecision:
                node.data.decimalPrecision !== undefined &&
                node.data.decimalPrecision !== ""
                  ? parseInt(node.data.decimalPrecision, 10)
                  : null,
            };
          case "Angle Encoding":
            return {
              id: node.id,
              type: "encode",
              encoding: "angle",
              bounds: 0,
            };
          case "Amplitude Encoding":
            return {
              id: node.id,
              type: "encode",
              encoding: "amplitude",
              bounds: parseFloat(node.data.bound),
            };

          case "Prepare State":
            return {
              id: node.id,
              type: "prepare",
              quantumState: map(
                {
                  "Bell State φ+": "ϕ+",
                  "Bell State φ-": "ϕ-",
                  "Bell State ψ+": "ψ+",
                  "Bell State ψ-": "ψ-",
                  "Custom State": "custom",
                  GHZ: "ghz",
                  "Uniform Superposition": "uniform",
                  "W-State": "w",
                },
                node.data.quantumStateName,
              ),
              size: parseInt(node.data.size, 10),
            };
        }
        break;

      case consts.SplitterNode:
        return {
          id: node.id,
          type: "splitter",
          numberOutputs: node.data.numberOutputs,
        };
      case consts.MergerNode:
        return {
          id: node.id,
          type: "merger",
          numberInputs: node.data.numberInputs,
        };
      case consts.MeasurementNode:
        return {
          id: node.id,
          type: "measure",
          basis: node.data.basis || "Z",
          indices:
            (node.data.indices || null)
              ?.split(",")
              .map((x) => parseInt(x, 10)) ?? [],
        };

      // Circuit Blocks
      case consts.GateNode:
        if (
          node.data.label === "Qubit" ||
          node.data.label === "Qubit Circuit"
        ) {
          return {
            id: node.id,
            type: "qubit",
          };
        }
        if (node.data.label === "CU") {
          return {
            id: node.id,
            type: "controlled-u",
            controlValue: Number(node.data.controlValue),
            matrix: JSON.parse(node.data.matrix),
          };
        } else if (consts.u_gate_parameters[node.data.label]) {
          // u2/u3 take several angles (stored comma separated); the backend
          // expects them as an ordered `parameters` list.
          const label = node.data.label;
          const expected = consts.u_gate_parameters[label].length;
          const parameters = String(node.data.parameter ?? "0")
            .split(",")
            .map(parseAngle);
          if (parameters.length !== expected) {
            throw new Error(
              `${label} expects ${expected} parameter(s), but got "${node.data.parameter}"`,
            );
          }
          return {
            id: node.id,
            type: "gate-with-param",
            gate: map(
              { "U1(λ)": "u1", "U2(φ,λ)": "u2", "U3(θ,φ,λ)": "u3" },
              label,
            ),
            parameters,
          };
        } else if (
          [
            "RX(θ)",
            "RY(θ)",
            "RZ(θ)",
            "P(λ)",
            "CP(λ)",
            "CRX(θ)",
            "CRY(θ)",
            "CRZ(θ)",
          ].includes(node.data.label)
        ) {
          return {
            id: node.id,
            type: "gate-with-param",
            gate: map(
              {
                "RX(θ)": "rx",
                "RY(θ)": "ry",
                "RZ(θ)": "rz",
                "P(λ)": "p",
                "CP(λ)": "cp",
                "CRX(θ)": "crx",
                "CRY(θ)": "cry",
                "CRZ(θ)": "crz",
              },
              node.data.label,
            ),
            parameter: parseFloat(node.data.parameter),
          };
        } else {
          return {
            id: node.id,
            type: "gate",
            gate: map(
              {
                CNOT: "cnot",
                Toffoli: "toffoli",
                CSWAP: "cswap",
                H: "h",
                T: "t",
                X: "x",
                Y: "y",
                Z: "z",
                S: "s",
                SX: "sx",
                SDG: "sdg",
                "S†": "sdg",
                TDG: "tdg",
                "T†": "tdg",
                I: "id",
                CZ: "cz",
                CY: "cy",
                CH: "ch",
                SWAP: "swap",
              },
              node.data.label,
            ),
          };
        }

      // Data Types
      case consts.DataTypeNode:
        // Compare case-insensitively: node.data.dataType may arrive
        // (Neuanlage vs. Duplizieren via contextMenu.tsx normalizeNodeTypes)
        // in different casings depending on its origin (e.g. "Number" vs "number").
        switch (String(node.data.dataType).toLowerCase()) {
          case "int":
          case "number": {
            const numValue = Number(node.data.value);
            return {
              id: node.id,
              type: Number.isInteger(numValue) ? "int" : "float",
              value: numValue,
            };
          }

          case "boolean":
            return {
              id: node.id,
              type: "bool",
              value: node.data.value === "true",
            };

          case "bit":
            return {
              id: node.id,
              type: "bit",
              value: node.data.value === "1" ? 1 : 0,
            };

          case "string":
            return {
              id: node.id,
              type: "string",
              value: node.data.value,
            };

          case "file":
            return {
              id: node.id,
              type: "file",
              value: node.data.value,
            };

          case "array": {
            const val = node.data.value;
            let parsedValue = val;

            if (typeof val === "string") {
              try {
                parsedValue = JSON.parse(val);
              } catch {
                parsedValue = val.split(",").map(Number);
              }
            }

            const flattenArray = (arr: any[]): any[] =>
              arr.reduce(
                (acc, v) => acc.concat(Array.isArray(v) ? flattenArray(v) : v),
                [],
              );

            if (Array.isArray(parsedValue)) {
              parsedValue = flattenArray(parsedValue);
            }

            return {
              id: node.id,
              type: "array",
              values: parsedValue,
            };
          }
        }
        break;

      case consts.AncillaNode:
        return {
          id: node.id,
          type: "ancilla",
          size: parseInt(node.data.size),
        };

      // Operators
      case consts.OperatorNode:
        if (node.data.operator === "INVERT") {
          return {
            id: node.id,
            type: "operator",
            operator: "~",
          };
        }
        return {
          id: node.id,
          type: "operator",
          operator: node.data.operator,
        };
      case consts.ClassicalOutputOperationNode:
        return {
          id: node.id,
          type: "operator",
          operator: node.data.operator || node.data.minmax,
        };

      case consts.QubitNode:
        return {
          id: node.id,
          type: "qubit",
          size: node.data.size,
        };

      case consts.QFTNode:
      case consts.InverseQFTNode:
        return {
          id: node.id,
          type: "qft",
          inverse: node.data.inverse,
          //size: node.data.numberOutputs
        };

      case consts.MCMTGateNode:
        return {
          id: node.id,
          type: "mcmt-gate",
          baseGate: (node.data.baseGate || "x")
            .replace(/\(.*\)/, "")
            .toLowerCase(),
          numControls: parseInt(node.data.numControls) || 1,
          numTargets: parseInt(node.data.numTargets) || 1,
          parameter:
            node.data.parameter !== "" && node.data.parameter != null
              ? parseFloat(node.data.parameter)
              : null,
        };

      case consts.QAOANode: {
        const classicalInputEdge = edges.find(
          (e) =>
            e.target === node.id &&
            e.targetHandle === `classicalHandleQAOAInput0${node.id}`,
        );

        let edgesString = "[]";
        if (classicalInputEdge) {
          const sourceNode = nodes.find(
            (n) => n.id === classicalInputEdge.source,
          );
          if (sourceNode && sourceNode.data.value) {
            edgesString =
              typeof sourceNode.data.value === "string"
                ? sourceNode.data.value
                : JSON.stringify(sourceNode.data.value);
          }
        }

        return {
          id: node.id,
          type: "qaoa",
          p: Number(node.data.p) || 1,
          problem: node.data.problem || "MaxCut",
          optimizer: node.data.optimizer || "COBYLA",
          edges: edgesString,
          gamma: String(node.data.gamma || ""),
          beta: String(node.data.beta || ""),
          outputIdentifier: node.data.outputIdentifier || "qaoa_reg",
        };
      }

      case consts.ControlStructureNode:
        return {
          id: node.id,
          type: "repeat",
          iterations: parseInt(node.data?.condition || "1", 10),
          block: {
            nodes: nodes
              .filter((x) => x.parentNode === node.id)
              .map((x) => mapNode(x)) as any,
            edges: edges
              .filter((x) => isEdgeWithin(x, node.id))
              .map((x) => mapEdge(x)),
          },
        };

      case consts.IfElseNode:
        const childNodes = nodes.filter((x) => x.parentNode === node.id);
        const thenNodes = childNodes.filter((n) => n.data.scope === "if");
        const elseNodes = childNodes.filter((n) => n.data.scope === "else");

        const thenNodeIds = new Set(thenNodes.map((n) => n.id));
        const elseNodeIds = new Set(elseNodes.map((n) => n.id));
        return {
          id: node.id,
          type: "if-then-else",
          condition: node.data?.condition || "true",
          thenBlock: {
            nodes: thenNodes.map(mapNode) as any,
            edges: edges
              .filter(
                (e) =>
                  e.source &&
                  e.target &&
                  (thenNodeIds.has(e.source) || thenNodeIds.has(e.target)),
              )
              .map(mapEdge),
          },
          elseBlock: {
            nodes: elseNodes.map(mapNode) as any,
            edges: edges
              .filter(
                (e) =>
                  e.source &&
                  e.target &&
                  (elseNodeIds.has(e.source) || elseNodeIds.has(e.target)),
              )
              .map(mapEdge),
          },
        };
      case "deutsch-jozsa":
        return {
          id: node.id,
          type: "deutsch-jozsa",
          numQubits: node.data.numQubits || 3,
          oracleType: node.data.oracleType || "balanced",
          balancedMask: node.data.balancedMask || 5,
          constantValue: node.data.constantValue ?? 0,
        } as any;
      case consts.UniversalOracleNode:
        return {
          id: node.id,
          type: "universal-oracle",
          numQubits: resolveRegisterSize(node.id),
          targetStates: node.data.targetStates
            ? node.data.targetStates
                .split(",")
                .map((x: string) => parseInt(x.trim(), 10))
                .filter((n: number) => !isNaN(n))
            : [],
          mode: node.data.mode || "phase",
        } as any;
      case consts.GroverDiffuserNode:
        return {
          id: node.id,
          type: "grover-diffuser",
          numQubits: resolveRegisterSize(node.id),
        } as any;
      case consts.GroverNode:
        return {
          id: node.id,
          type: "grover",
          numQubits: node.data.numQubits || 3,
          targetStates: "" + node.data.targetStates,
          numIterations: node.data.numIterations || "",
        } as any;

      case consts.PluginNode: {
        const basePluginName = node.data.pluginName;
        const algo = node.data.clusteringAlgorithm;
        const variant = node.data.variant;
        const algorithm = node.data.algorithm;
        const method = node.data.method;
        const metric = node.data.metric;
        const minSteepness = node.data.minSteepness;
        const maxDistance = node.data.maxDistance;
        const minkowskiPValue = node.data.minkowskiPValue;
        const initEnum = node.data.initializationMethod;
        let effectivePluginName = basePluginName;
        if (
          algo &&
          algo !== "k-means" &&
          (basePluginName === "classical-k-means" ||
            basePluginName === "quantum-k-means")
        ) {
          const prefix =
            basePluginName === "classical-k-means" ? "classical" : "quantum";
          effectivePluginName = `${prefix}-${algo}`;
        }
        return {
          id: node.id,
          type: "plugin",
          pluginIdentifier: node.data.pluginIdentifier,
          pluginName: effectivePluginName,
          clusteringAlgorithm: algo,
          variant: variant,
          initEnum: initEnum,
          metricEnum: metric,
          methodEnum: method,
          maxEpsilon: maxDistance,
          algorithmEnum: algorithm,
          minkowskiP: minkowskiPValue,
          xi: minSteepness,
          inputs:
            node.data.dataInputs?.map((input: any) => ({
              parameter: input.parameter,
              dataType: input.data_type,
              contentType: input.content_type,
              required: input.required,
            })) || [],
          outputs:
            node.data.dataOutputs?.map((output: any, index: number) => ({
              name: output.name || `output_${index}`,
              dataType: output.data_type,
              contentType: output.content_type,
              required: output.required,
            })) || [],
        };
      }
    }
    throw new Error(`Unsupported node ${node.type} (${node.data.label})`);
  }

  function isNestedEdge(edge: Edge): boolean {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    return !!(sourceNode?.parentNode || targetNode?.parentNode);
  }

  function isEdgeWithin(edge: Edge, parentNode: string): boolean {
    if (!edge.source || !edge.target)
      throw new Error("No source or target nodes");

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode?.parentNode === parentNode) return true;

    return targetNode?.parentNode === parentNode;
  }

  function getHandleIndex(
    nodeId: string,
    handleType: "source" | "target",
    handleId?: string,
  ): number {
    if (!handleId) throw new Error(`No handle id for node ${nodeId}`);

    let extractedIndex = -1;

    // PRIORITY 1: handle IDs always end with "<index><nodeId>" (e.g. "...Output0qubit-1").
    // Extract the digits immediately preceding the known nodeId suffix. This must take
    // priority over the generic "-<number>$" check below, because node IDs themselves can
    // end in "-<digit>" (e.g. "qubit-1", "gate-h0"), which would otherwise be misread as
    // the handle index instead of the actual index digit before the nodeId.
    if (handleId.endsWith(nodeId)) {
      const prefix = handleId.slice(0, handleId.length - nodeId.length);
      const prefixMatch = prefix.match(/(\d+)$/);
      if (prefixMatch) {
        extractedIndex = parseInt(prefixMatch[1], 10);
      }
    }

    // PRIORITY 2 (fallback): generic pattern to check if handleId ends with -<number>
    if (extractedIndex === -1) {
      const endsWithIndexPattern = /-(\d+)$/;
      const indexMatch = handleId.match(endsWithIndexPattern);
      if (indexMatch) {
        extractedIndex = parseInt(indexMatch[1], 10);
      }
    }

    if (extractedIndex === -1) {
      throw new Error(
        `Could not extract handle index from ${handleType} handleId: ${handleId}`,
      );
    }

    // --- PREVENT PORT COLLISIONS FOR CONTAINERS ---
    const parentNode = nodes.find((n) => n.id === nodeId);
    if (
      parentNode &&
      (parentNode.type === consts.IfElseNode ||
        parentNode.type === consts.ControlStructureNode)
    ) {
      if (handleId.toLowerCase().includes("quantum")) {
        const numClassical = parentNode.data.numberClassicalInputs || 1;
        extractedIndex += numClassical;
      }
    }

    return extractedIndex;
  }

  function mapEdge(edge: Edge): BackendEdge {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) {
      throw new Error(`Source node ${edge.source} not found`);
    }
    // Extract the output index from the handleId
    const outputIndex = getHandleIndex(
      edge.source,
      "source",
      edge.sourceHandle,
    );
    console.log(outputIndex);

    let output = sourceNode.data.outputs?.[outputIndex];

    // If not found, fallback to connected inputs (nested scenario)
    if (!output) {
      console.log(edge);
      console.log(sourceNode.data.inputs);
      const inputConnection = sourceNode.data.inputs?.find(
        // The inputs array can hold entries for SEVERAL different nodes, not just for
        // sourceNode itself. So first check with endsWith whether the targetHandle
        // belongs to sourceNode at all before calling getHandleIndex; otherwise
        // getHandleIndex throws on entries belonging to other nodes, even though
        // .find() should simply skip them.
        (i: any) =>
          i.targetHandle?.endsWith(sourceNode.id) &&
          getHandleIndex(sourceNode.id, "target", i.targetHandle) ===
            outputIndex,
      );
      console.log(inputConnection);
      if (inputConnection) {
        const inputNode = nodes.find((n) => n.id === inputConnection.id);

        output = {
          identifier:
            inputConnection.outputIdentifier ||
            inputNode?.data.outputIdentifier ||
            null,
          size: inputNode?.data.size ? parseInt(inputNode.data.size, 10) : 1,
        };
      } else {
        return {
          source: [
            edge.source,
            getHandleIndex(edge.source, "source", edge.sourceHandle),
          ],
          target: [
            edge.target,
            getHandleIndex(edge.target, "target", edge.targetHandle),
          ],
          identifier: output?.identifier,
          size: output?.size,
        };
      }
    }

    if (sourceNode.type === consts.QAOANode) {
      try {
        const classicalInputEdge = edges.find(
          (e) =>
            e.target === sourceNode.id &&
            e.targetHandle === `classicalHandleQAOAInput0${sourceNode.id}`,
        );

        let edgesString = sourceNode.data.edges || "[]";
        if (classicalInputEdge) {
          const arrayNode = nodes.find(
            (n) => n.id === classicalInputEdge.source,
          );
          if (arrayNode && arrayNode.data.value) {
            edgesString =
              typeof arrayNode.data.value === "string"
                ? arrayNode.data.value
                : JSON.stringify(arrayNode.data.value);
          }
        }

        const edgesArr = JSON.parse(edgesString);
        const flattenArray = (arr: any[]): any[] =>
          arr.reduce(
            (acc, v) => acc.concat(Array.isArray(v) ? flattenArray(v) : v),
            [],
          );

        const flatArr = flattenArray(edgesArr);
        if (flatArr.length > 0) {
          const isDimacs =
            flatArr.some((x) => x < 0) ||
            (sourceNode.data.problem === "Max2SAT" && !flatArr.includes(0));
          const numQubits = isDimacs
            ? Math.max(...flatArr.map(Math.abs))
            : Math.max(...flatArr) + 1;
          output = output
            ? { ...output, size: numQubits }
            : {
                size: numQubits,
                identifier: sourceNode.data.outputIdentifier || "qaoa_reg",
              };
        }
      } catch (e) {
        console.warn("Failed to compute QAOA edge size", e);
      }
    }

    const parsedSize = parseInt(output?.size, 10);

    // Generate a fallback identifier when the user did not provide a name. This is only
    // relevant for classical operator nodes (arithmetic/bitwise/comparison/min&max);
    // quantum gates such as H or CNOT neither need nor expect an artificial identifier
    // here, because identifier is not used for disambiguation there.
    const isClassicalOperatorNode =
      sourceNode.type === consts.ClassicalOperatorNode;

    const getDefaultIdentifier = (): string => {
      const OPERATOR_NAME_MAP: Record<string, string> = {
        "+": "sum",
        "-": "diff",
        "*": "product",
        "/": "quotient",
        "**": "power",
        "|": "or",
        "&": "and",
        "^": "xor",
        "~": "invert",
        "<": "lt",
        ">": "gt",
        "<=": "lte",
        ">=": "gte",
        "==": "eq",
        "!=": "neq",
        min: "min",
        max: "max",
      };
      const opName = OPERATOR_NAME_MAP[sourceNode.data?.operator] ?? "result";
      // append the full node ID, not a shortened one, to avoid collisions between similar IDs
      return `${opName}_out_${sourceNode.id}`;
    };

    const identifier =
      output.identifier && output.identifier.trim() !== ""
        ? output.identifier
        : isClassicalOperatorNode
          ? getDefaultIdentifier()
          : output.identifier;

    return {
      source: [
        edge.source,
        getHandleIndex(edge.source, "source", edge.sourceHandle),
      ],
      target: [
        edge.target,
        getHandleIndex(edge.target, "target", edge.targetHandle),
      ],
      identifier: identifier,
      size: Number.isNaN(parsedSize) ? null : parsedSize,
    };
  }
};

/** Evaluates an angle in radians such as "0.5", "pi/2" or "-3*π/4". */
function parseAngle(value: string): number {
  const expr = value.trim().replace(/π|pi/gi, `(${Math.PI})`);
  if (!/^[\d\s.+\-*/()eE]+$/.test(expr)) {
    throw new Error(`Invalid gate parameter "${value}"`);
  }
  const result = Number(new Function(`return (${expr});`)());
  if (!Number.isFinite(result)) {
    throw new Error(`Invalid gate parameter "${value}"`);
  }
  return result;
}

function map<const T extends Record<string, any>, K extends keyof T>(
  map: T,
  value: K,
): T[keyof T] {
  if (Object.hasOwn(map, value)) return map[value];

  throw new Error(`Invalid value "${String(value)}"`);
}
