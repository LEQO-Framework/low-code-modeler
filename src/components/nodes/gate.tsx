import { memo, useEffect } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const GateNode = memo((node: Node) => {
  const { data } = node;
  const isQubit = data.label === "Qubit";
  const isTwoQubit = data.label === "CNOT" || data.label === "SWAP" || data.label === "CZ" || data.label === "CY" || data.label === "CH" || data.label === "CP(λ)" || data.label === "CRX(θ)" || data.label === "CRY(θ)" || data.label === "CRZ(θ)" || data.label === "CU(θ,φ,λ,γ)";
  const isThreeQubit = data.label === "Toffoli" || data.label === "CSWAP";
  const { edges, updateNodeValue } = useStore(selector, shallow);

  useEffect(() => {
    if (node) {
      // Set default parameterType if not set
      if (!node.data.parameterType) {
        updateNodeValue(node.id, "parameterType", "degree");
      }

      // Initialize multi-parameter gate fields if label is CU(θ,φ,λ,γ)
      if (data.label === "CU(θ,φ,λ,γ)") {
        const params = ["theta", "phi", "lambda", "gamma"];
        params.forEach((param) => {
          if (node.data[param] === undefined) {
            updateNodeValue(node.id, param, "0");
          }
        });
      } else {
        // For single parameter gates, initialize parameter to 0 if not set
        if (node.data.parameter === undefined) {
          updateNodeValue(node.id, "parameter", "0");
        }
      }
    }
  }, [node, data.label, node?.data, updateNodeValue, node?.id]);

  return (
    <div className="grand-parent overflow-visible">
      <div className="w-[100px] h-[100px] border border-solid border-gray-700 shadow-md bg-blue-100 relative overflow-visible">

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-bold z-0 text-xl">
          {data.label === "Qubit" ? (
            "|0⟩"
          ) : data.label === "CNOT" ? (
            <img src="/CNOT4.png" alt="CNOT gate" className="w-5 h-15" />
          ) : data.label === "Toffoli" ? (
            <img src="/Toffoli16.png" alt="Toffoli gate" className="w-5 h-15 object-fit object-center" />
          ) : data.label === "SWAP" ? (
            <img src="/swap_gate10.png" alt="SWAP gate" className="w-5 h-15" />
          ) : data.label === "CSWAP" ? (
            <img src="/CSWAP5.png" alt="CSWAP gate" className="w-5 h-15 object-fit object-center" />
          ) : data.label === "CY" ? (
            <img src="/CY11.png" alt="CY gate" className="w-8 h-18 object-fit object-center translate-y-1" />
          ): data.label === "CZ" ? (
            <img src="/CZ6.png" alt="CZ gate" className="w-8 h-18 object-fit object-center translate-y-1" />
          ) : data.label === "CH" ? (
            <img src="/CH8.png" alt="CH gate" className="w-9 h-19 object-fit object-center translate-y-1" />
          ): data.label === "CRX(θ)" ? (
            <img src="/CRX8.png" alt="CRX gate" className="w-12 h-22 object-fit object-center" />
          ): data.label === "CRY(θ)" ? (
            <img src="/CRY4.png" alt="CRY gate" className="w-12 h-22 object-fit object-center" />
          ): data.label === "CRZ(θ)" ? (
            <img src="/CRZ7.png" alt="CRZ gate" className="w-12 h-22 object-fit object-center" />
          ): data.label === "CU(θ,φ,λ,γ)" ? (
            <img src="/CU7.png" alt="CU gate" className="w-14 h-19 object-fit object-center translate-y-1" />
          ): data.label === "CP(λ)" ? (
            <img src="/CP2.png" alt="CP gate" className="w-10 h-22 object-fit object-center" />
          ) : data.label === "RX(θ)" ? (
            <span>
              R<sub>X</sub>(θ)
            </span>
          ) : data.label === "RY(θ)" ? (
            <span>
              R<sub>Y</sub>(θ)
            </span>
          ) : data.label === "RZ(θ)" ? (
            <span>
              R<sub>Z</sub>(θ)
            </span>
          ) : data.label === "SDG" ? (
            <span>
              S<sup>†</sup>
            </span>
          ) : data.label === "TDG" ? (
            <span>
              T<sup>†</sup>
            </span>
          ): (
            data.label
          )}
        </div>

        {!isQubit && !isTwoQubit && !isThreeQubit && (
          <Handle
            type="target"
            id={`quantumHandleGateInput0${node.id}`}
            position={Position.Left}
            className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
            isValidConnection={() => true}
          />
        )}

        {isTwoQubit && (
          <>
            <Handle
              type="target"
              id={`quantumHandleGateInput0${node.id}`}
              position={Position.Left}
              className="!absolute !top-[25%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}

            />
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
          </>
        )}

        {isThreeQubit && (
          <>
            <Handle
              type="target"
              id={`quantumHandleGateInput0${node.id}`}
              position={Position.Left}
              className="!absolute !top-[25%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput2${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
            />
          </>
        )}

        {!isTwoQubit && !isThreeQubit && (
          <Handle
            type="source"
            id={`quantumHandleGateOutput0${node.id}`}
            position={Position.Right}
            className="!absolute !top-[50%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
            isValidConnection={() => true}
            isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput0" + node.id).length < 1}
            isConnectableEnd={false}
          />
        )}

        {isTwoQubit && (
          <>
            <Handle
              type="source"
              id={`quantumHandleGateOutput0${node.id}`}
              position={Position.Right}
              className="!absolute !top-[25%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput2" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput1${node.id}`}
              position={Position.Right}
              className="!absolute !top-[75%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput1" + node.id).length < 1}
            />
          </>
        )}

        {isThreeQubit && (
          <>
            <Handle
              type="source"
              id={`quantumHandleGateOutput0${node.id}`}
              position={Position.Right}
              className="!absolute !top-[25%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput0" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput1${node.id}`}
              position={Position.Right}
              className="!absolute !top-[50%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput1" + node.id).length < 1}
            />
            <Handle
              type="source"
              id={`quantumHandleGateOutput2${node.id}`}
              position={Position.Right}
              className="!absolute !top-[75%] !right--15 z-10 circle-port-out !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectable={edges.filter(edge => edge.sourceHandle === "quantumHandleGateOutput2" + node.id).length < 1}
            />
          </>
        )}
      </div>
    </div>
  );
});

