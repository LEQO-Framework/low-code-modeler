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

export const startCompile = async (baseUrl: string, metadata: any, nodes: Node[], edges: Edge[], compilation_target: string): Promise<Response> => {

    return await fetch(new URL("/compile", baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            metadata: {
                id: `flow-${Date.now()}`,
                ...metadata
            },
            nodes: [],
            edges: [],
            compilation_target: compilation_target
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
                            bounds: (node.data.encodingType === "Basis Encoding") ? 0 : parseFloat(node.data.bound)
                        }

                    case "Basis Encoding":
                        return {
                            id: node.id,
                            type: "encode",
                            encoding: "basis",
                            bounds: 0
                        }
                    case "Angle Encoding":
                        return {
                            id: node.id,
                            type: "encode",
                            encoding: "angle",
                            bounds: 0
                        }
                    case "Amplitude Encoding":
                        return {
                            id: node.id,
                            type: "encode",
                            encoding: "amplitude",
                            bounds: parseFloat(node.data.bound)
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
                if (node.data.label === "Qubit" || node.data.label === "Qubit Circuit") {
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
                            "T": "t",
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

                    case "Array":
                        return {
                            id: node.id,
                            type: "array",
                            value: Array.isArray(node.data.value)
                                ? node.data.value.map(Number)
                                : String(node.data.value).split(",").map(Number)
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
            case consts.OperatorNode:
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


            case consts.ControlStructureNode:
                return {
                    id: node.id,
                    type: "repeat",
                    iterations: node.data?.condition,
                    block: {
                        nodes: nodes.filter(x => x.parentNode === node.id).map(x => mapNode(x)),
                        edges: edges.filter(x => isEdgeWithin(x, node.id)).map(x => mapEdge(x))
                    }
                }

            case consts.IfElseNode:
                const childNodes = nodes.filter(x => x.parentNode === node.id);
                const thenNodes = childNodes.filter(n => n.data.scope === "if");
                const elseNodes = childNodes.filter(n => n.data.scope === "else");

                const thenNodeIds = new Set(thenNodes.map(n => n.id));
                const elseNodeIds = new Set(elseNodes.map(n => n.id));
                return {
                    id: node.id,
                    type: "if-then-else",
                    condition: node.data?.condition || "true",
                    thenBlock: {
                        nodes: thenNodes.map(mapNode),
                        edges: edges.filter(e =>
                            e.source && e.target &&
                            thenNodeIds.has(e.source) || thenNodeIds.has(e.target)
                        ).map(mapEdge)
                    },
                    elseBlock: {
                        nodes: elseNodes.map(mapNode),
                        edges: edges.filter(e =>
                            e.source && e.target &&
                            elseNodeIds.has(e.source) && elseNodeIds.has(e.target)
                        ).map(mapEdge)
                    }
                };

        }
        throw new Error(`Unsupported node ${node.type} (${node.data.label})`)
    }

    function isNestedEdge(edge: Edge): boolean {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        return !!(sourceNode?.parentNode || targetNode?.parentNode);
    }


    function isEdgeWithin(edge: Edge, parentNode: string): boolean {
        if (!edge.source || !edge.target)
            throw new Error("No source or target nodes");

        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode.parentNode === parentNode)
            return true;


        return targetNode.parentNode === parentNode;
    }

    function getHandleIndex(nodeId: string, handleType: "source" | "target", handleId?: string): number {
        if (!handleId)
            throw new Error(`No handle id for node ${nodeId}`)

        console.log(handleId)
        // Generic pattern to check if handleId ends with -<number>
        const endsWithIndexPattern = /-(\d+)$/;
        const indexMatch = handleId.match(endsWithIndexPattern);

        if (indexMatch) {
            return parseInt(indexMatch[1], 10);
        }

        const pattern = new RegExp(`(\\d+)(?=${nodeId}$)`);
        const match = handleId.match(pattern);
        console.log(nodeId);
        console.log(handleId);
        console.log(match)

        if (match) {
            return parseInt(match[1], 10);
        }

        throw new Error(`Could not extract handle index from ${handleType} handleId: ${handleId}`);
    }


    function mapEdge(edge: Edge): BackendEdge {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) {
            throw new Error(`Source node ${edge.source} not found`);
        }
        // Extract the output index from the handleId
        const outputIndex = getHandleIndex(edge.source, "source", edge.sourceHandle);
        console.log(outputIndex)

        let output = sourceNode.data.outputs?.[outputIndex];

        // If not found, fallback to connected inputs (nested scenario)
        if (!output) {
            console.log(edge)
            console.log(sourceNode.data.inputs)
            const inputConnection = sourceNode.data.inputs?.[outputIndex];
            console.log(inputConnection)
            if (inputConnection) {
                const inputNode = nodes.find(n => n.id === inputConnection.id);

                output = {
                    identifier: inputConnection.outputIdentifier || inputNode?.data.outputIdentifier || null,
                    size: inputNode?.data.size ? parseInt(inputNode.data.size, 10) : 1
                };
            } else {
                console.log("add edge")
                return {
                    source: [
                        edge.source,
                        getHandleIndex(edge.source, "source", edge.sourceHandle)
                    ],
                    target: [
                        edge.target,
                        getHandleIndex(edge.target, "target", edge.targetHandle)
                    ],
                    identifier: output?.identifier,
                    size: output?.size
                }
            }
        }
        return {
            source: [
                edge.source,
                getHandleIndex(edge.source, "source", edge.sourceHandle)
            ],
            target: [
                edge.target,
                getHandleIndex(edge.target, "target", edge.targetHandle)
            ],
            identifier: output.identifier,
            size: parseInt(output.size, 10)
        }
    }
}

function map<const T extends Record<string, any>, K extends keyof T>(map: T, value: K): T[keyof T] {
    if (Object.hasOwn(map, value))
        return map[value];

    throw new Error(`Invalid value "${String(value)}"`);
}
