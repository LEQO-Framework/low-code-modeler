import  {
    Edge,
    Node,
  } from "reactflow";
import * as consts from "./constants";

export const startCompile = async (baseUrl: string, metadata: any, nodes: any, edges:any): Promise<Response> => {

    console.log( JSON.stringify({
        metadata: {
            id: `flow-${Date.now()}`,
            ...metadata
        },
        nodes: [...nodes.map(mapNode)],
        edges: [...edges.map(mapEdge)]}))

    return await fetch(new URL("/compile", baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            metadata: {
                id: `flow-${Date.now()}`,
                ...metadata
            },
            nodes: [...nodes.map(mapNode)],
            edges: [...edges.map(mapEdge)]
        }),
    });

    function mapNode(node: Node): BackendNode {
        if (node.data.implementation) {
            return {
                id: node.id,
                type: "implementation",
                implementation: node.data.implementation,
                operation: node.data.operation
            }
        }

        switch (node.type) {
            case consts.DataTypeNode:
                switch (node.data.dataType) {
                    case "int":
                        return {
                            id: node.id,
                            type: "int",
                            value: parseInt(node.data.value)
                        } satisfies IntLiteralNode

                    case "float":
                        return {
                            id: node.id,
                            type: "float",
                            value: parseFloat(node.data.value)
                        } satisfies FloatLiteralNode

                    case "boolean":
                        return {
                            id: node.id,
                            type: "bool",
                            value: !!node.data.value
                        } satisfies BoolLiteralNode

                    case "bit":
                        return {
                            id: node.id,
                            type: "bit",
                            value: node.data.value === "1"
                        } satisfies BitLiteralNode
                }
            case consts.ArithmeticOperatorNode:
                return {
                    id: node.id,
                    type: "implementation",
                    implementation: node.data.implementation,
                    operation: node.data.operator
                }
            case consts.GateNode:
                return {
                    id: node.id,
                    type: "implementation",
                    implementation: node.data.implementation,
                    operation: node.data.label
                }
            case consts.StatePreparationNode:
                    return {
                        id: node.id,
                        type: "implementation",
                        implementation: node.data.implementation,
                        operation: node.data.label,
                        encoding: node.data.encoding
                    }
            case consts.MeasurementNode:
                return {
                    id: node.id,
                    type: "measure",
                    indices: node.data.indices?.split(",").map(x => parseInt(x)) ?? []
                } satisfies MeasurementNode

            case consts.AncillaNode:
                return {
                    id: node.id,
                    type: "ancilla",
                    size: parseInt(node.data.size)
                }

            default:
                throw new Error(`Unsupported node ${node.type}`)
        }
    }

 
    function getHandleIndex(nodeId: string, handleType: "source" | "target", handleId?: string): number {
        if (!handleId) return -1;
        console.log(handleId)
        const pattern = new RegExp(`(\\d+)(?=${nodeId}$)`);
        const match = handleId.match(pattern);
    
        if (match) {
            return parseInt(match[1], 10);
        }
    
        console.warn(`Could not extract handle index from ${handleType} handleId: ${handleId}`);
        return -1;
    }
    

    function mapEdge(edge: Edge): BackendEdge {
        let type: "classical" | "qubit" | "ancilla"
        switch (edge.type) {
            case "classicalEdge":
                type = "classical";
                break;

            case "quantumEdge":
                type = "qubit";
                break;

            case "ancillaEdge":
                type = "ancilla";
                break;
            default:
                throw new Error(`We don't support ${edge.type} edges`)
        }
        return {
            type,
            source: [
                edge.source,
                getHandleIndex(edge.source, "source", edge.sourceHandle)
            ],
            target: [
                edge.target,
                getHandleIndex(edge.target, "target", edge.targetHandle)
            ],
        } satisfies BackendEdge
    }
}

interface NodeBase {
    id: string
    label?: string | null
    parentNode?: string | null
}

interface ImplementationNode extends NodeBase {
    implementation: string
    type: "implementation"
    operation: string
}

interface IntLiteralNode extends NodeBase {
    type: "int"
    bitSize?: number
    value: number
}

interface FloatLiteralNode extends NodeBase {
    type: "float"
    bitSize?: number
    value: number
}

interface BitLiteralNode extends NodeBase {
    type: "bit"
    value: boolean
}

interface BoolLiteralNode extends NodeBase {
    type: "bool"
    value: boolean
}

interface ArrayLiteralNode extends NodeBase {
    type: "array"
    value: string
}

interface MeasurementNode extends NodeBase {
    type: "measure"
    indices: number[]
}

interface AncillaNode extends NodeBase {
    type: "ancilla"
    size: number
}

interface GateNode extends ImplementationNode {
    operator: number
}

interface StatePreparationNode extends ImplementationNode {
    encoding: number
}

type LiteralNode = IntLiteralNode | FloatLiteralNode | BitLiteralNode | BoolLiteralNode
type BackendNode = ImplementationNode | LiteralNode | MeasurementNode | AncillaNode | GateNode | StatePreparationNode

interface BackendEdge {
    type: "qubit" | "classical" | "ancilla"
    source: [string, number]
    target: [string, number]
}
