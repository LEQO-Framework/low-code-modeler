import {
    Edge,
    Node,
} from "reactflow";
import * as consts from "./constants";
import type { components } from "./backend.types";

type CompileRequest = components["schemas"]["CompileRequest"];
type BackendNode = CompileRequest["nodes"][0];
type BackendEdge = CompileRequest["edges"][0];
export type StatusResult = components["schemas"]["StatusBody"];

export const startCompile = async (baseUrl: string, metadata: any, nodes: Node[], edges: Edge[]): Promise<Response> => {

    return await fetch(new URL("/debug/compile", baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            metadata: {
                id: `flow-${Date.now()}`,
                ...metadata
            },
            nodes: [...nodes.filter(x => !x.parentId).map(mapNode)],
            edges: [...edges.map(mapEdge)] // ToDo: Filter nested edges
        } satisfies CompileRequest),
    });

    function mapNode(node: Node): BackendNode {
        if (node.data.implementation) {
            return {
                id: node.id,
                type: "implementation",
                implementation: node.data.implementation
            }
        }

        switch (node.type) {
            // Boundary Nodes
            case consts.StatePreparationNode:
                switch (node.data.label) {
                    case "Encode Value":
                        return {
                            id: node.id,
                            type: "encode",
                            encoding: map({
                                "Amplitude Encoding": "amplitude",
                                "Angle Encoding": "angle",
                                "Basis Encoding": "basis",
                                "Custom Encoding": "custom",
                                "Matrix Encoding": "matrix",
                                "Schmidt Decomposition": "schmidt",
                            }, node.data.encodingType),
                            bounds: (node.data.encodingType === "Basis Encoding") ? parseFloat(node.data.size) : parseFloat(node.data.bound)
                        }

                    case "Prepare State":
                        return {
                            id: node.id,
                            type: "prepare",
                            quantumState: map({
                                "Bell State φ+": "ϕ+",
                                "Bell State φ-": "ϕ-",
                                "Bell State ψ+": "ψ+",
                                "Bell State ψ-": "ψ-",
                                "Custom State": "custom",
                                "GHZ": "ghz",
                                "Uniform Superposition": "uniform",
                                "W-State": "w",
                            }, node.data.quantumStateName),
                            size: parseInt(node.data.size, 10)
                        }
                }
                break;

            case consts.SplitterNode:
                return {
                    id: node.id,
                    type: "splitter",
                    numberOutputs: node.data.numberOutputs
                }
            case consts.MergerNode:
                return {
                    id: node.id,
                    type: "merger",
                    numberInputs: node.data.numberInputs
                }
            case consts.MeasurementNode:
                return {
                    id: node.id,
                    type: "measure",
                    indices: (node.data.indices || null)?.split(",").map(x => parseInt(x, 10)) ?? []
                }

            // Circuit Blocks
            case consts.GateNode:
                if (node.data.label === "Qubit") {
                    return {
                        id: node.id,
                        type: "qubit"
                    }
                } else if (["RX(θ)", "RY(θ)", "RZ(θ)"].includes(node.data.label)) {
                    return {
                        id: node.id,
                        type: "gate-with-param",
                        gate: map({
                            "RX(θ)": "rx",
                            "RY(θ)": "ry",
                            "RZ(θ)": "rz",
                        }, node.data.label),
                        parameter: parseFloat(node.data.parameter)
                    }
                } else {
                    return {
                        id: node.id,
                        type: "gate",
                        gate: map({
                            "CNOT": "cnot",
                            "Toffoli": "toffoli",
                            "H": "h",
                            "X": "x",
                            "Y": "y",
                            "Z": "z",
                        }, node.data.label)
                    }
                }

            // Data Types
            case consts.DataTypeNode:
                switch (node.data.dataType) {
                    case "int":
                        return {
                            id: node.id,
                            type: "int",
                            value: parseInt(node.data.value, 10)
                        }

                    case "float":
                        return {
                            id: node.id,
                            type: "float",
                            value: parseFloat(node.data.value)
                        }

                    case "boolean":
                        return {
                            id: node.id,
                            type: "bool",
                            value: node.data.value === "true"
                        }

                    case "bit":
                        return {
                            id: node.id,
                            type: "bit",
                            value: node.data.value === "1" ? 1 : 0
                        }
                    // Currently no Backend support
                    case "array":
                         return {
                            id: node.id,
                            type: "bit",
                            value: node.data.value
                        }
                }
                break;

            case consts.AncillaNode:
                return {
                    id: node.id,
                    type: "ancilla",
                    size: parseInt(node.data.size)
                }

            // Operators
            case consts.ArithmeticOperatorNode:
                return {
                    id: node.id,
                    type: "operator",
                    operator: node.data.operator
                }
            case consts.ClassicalOutputOperationNode:
                return {
                    id: node.id,
                    type: "operator",
                    operator: node.data.operator || node.data.minmax
                }

            /* Nested nodes
            case consts.ControlStructureNode:
                return {
                    id: node.id,
                    type: "repeat",
                    iterations: 42,
                    block: {
                        nodes: nodes.filter(x => x.parentId === node.id).map(x => mapNode(x)),
                        edges: edges.filter(x => isEdgeWithin(x, node.id)).map(x => mapEdge(x))
                    }
                } */

            // ToDo: case consts.IfElseNode
            case consts.IfElseNode:
                return {
                    id: node.id,
                    type: "if-then-else",
                    condition: node.data?.condition || "true",
                    thenBlock: {
                        nodes: nodes.filter(x => x.parentId === node.id).map(mapNode),
                        edges: edges.filter(x => isEdgeWithin(x, node.id)).map(mapEdge)
                    },
                    elseBlock: {
                        nodes: nodes.filter(x => x.parentId === node.id).map(mapNode),
                        edges: edges.filter(x => isEdgeWithin(x, node.id)).map(mapEdge)
                    },
                };

        }
        throw new Error(`Unsupported node ${node.type} (${node.data.label})`)
    }

    function isNestedEdge(edge: Edge): boolean {
        if (!edge.sourceNode || !edge.targetNode)
            throw new Error("No source or target nodes");

        return !!(edge.sourceNode.parentId || edge.targetNode.parentId);
    }

    function isEdgeWithin(edge: Edge, parentId: string): boolean {
        if (!edge.sourceNode || !edge.targetNode)
            throw new Error("No source or target nodes");

        if (edge.sourceNode.parentId === parentId)
            return true;

        return edge.targetNode.parentId === parentId;
    }

    function getHandleIndex(nodeId: string, handleType: "source" | "target", handleId?: string): number {
        if (!handleId)
            throw new Error(`No handle id for node ${nodeId}`)

        const pattern = new RegExp(`(\\d+)(?=${nodeId}$)`);
        const match = handleId.match(pattern);

        if (match) {
            return parseInt(match[1], 10);
        }

        throw new Error(`Could not extract handle index from ${handleType} handleId: ${handleId}`);
    }


    function mapEdge(edge: Edge): BackendEdge {
        return {
            source: [
                edge.source,
                getHandleIndex(edge.source, "source", edge.sourceHandle)
            ],
            target: [
                edge.target,
                getHandleIndex(edge.target, "target", edge.targetHandle)
            ],
        }
    }
}

function map<const T extends Record<string, any>, K extends keyof T>(map: T, value: K): T[keyof T] {
    if (Object.hasOwn(map, value))
        return map[value];

    throw new Error(`Invalid value "${String(value)}"`);
}
