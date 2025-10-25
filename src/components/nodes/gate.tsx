import { memo, useEffect } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  experienceLevel: string;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  experienceLevel: state.experienceLevel,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const GateNode = memo((node: Node) => {
  const { data } = node;
  const isQubit = data.label === "Qubit Circuit";
  const isTwoQubit = data.label === "CNOT" || data.label === "SWAP" || data.label === "CZ" || data.label === "CY" || data.label === "CH" || data.label === "CP(λ)" || data.label === "CRX(θ)" || data.label === "CRY(θ)" || data.label === "CRZ(θ)" || data.label === "CU(θ,φ,λ,γ)";
  const isThreeQubit = data.label === "Toffoli" || data.label === "CSWAP";
  const { edges, experienceLevel, updateNodeValue } = useStore(selector, shallow);
  console.log(experienceLevel)

  useEffect(() => {
    if (node) {
      // Set default parameterType if not set
      if (!node.data.parameterType && node.data.type === GateNode) {
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
  }, [node, experienceLevel, data.label, node?.data, updateNodeValue, node?.id]);

  return (
    <div className="grand-parent overflow-visible">
      <div className="w-[110px] h-[110px] border border-solid border-gray-700 shadow-md bg-blue-100 relative overflow-visible">

        <div className="absolute  top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-bold z-0 text-xl">
          {experienceLevel === "pioneer" && (data.label === "Qubit Circuit" ? (
            "|0⟩"
          ) : data.label === "CNOT" ? (
            <img src="CNOT.png" alt="CNOT gate" className="w-5 h-15" />
          ) : data.label === "Toffoli" ? (
            <img src="Toffoli.png" alt="Toffoli gate" className="w-5 h-15 object-fit object-center" />
          ) : data.label === "SWAP" ? (
            <img src="SWAP.png" alt="SWAP gate" className="w-5 h-15" />
          ) : data.label === "CSWAP" ? (
            <img src="CSWAP.png" alt="CSWAP gate" className="w-5 h-15 object-fit object-center" />
          ) : data.label === "CY" ? (
            <img src="CY.png" alt="CY gate" className="w-8 h-18 object-fit object-center translate-y-1" />
          ) : data.label === "CZ" ? (
            <img src="CZ.png" alt="CZ gate" className="w-8 h-18 object-fit object-center translate-y-1" />
          ) : data.label === "CH" ? (
            <img src="CH.png" alt="CH gate" className="w-9 h-19 object-fit object-center translate-y-1" />
          ) : data.label === "CRX(θ)" ? (
            <img src="CRX.png" alt="CRX gate" className="w-12 h-22 object-fit object-center" />
          ) : data.label === "CRY(θ)" ? (
            <img src="CRY.png" alt="CRY gate" className="w-12 h-22 object-fit object-center" />
          ) : data.label === "CRZ(θ)" ? (
            <img src="CRZ.png" alt="CRZ gate" className="w-12 h-22 object-fit object-center" />
          ) : data.label === "CU(θ,φ,λ,γ)" ? (
            <img src="CU.png" alt="CU gate" className="w-14 h-19 object-fit object-center translate-y-1" />
          ) : data.label === "CP(λ)" ? (
            <img src="CP.png" alt="CP gate" className="w-10 h-22 object-fit object-center" />
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
          ) : (
            data.label
          ))}


          {experienceLevel === "explorer" && (data.label === "Qubit Circuit" ? (
            "|0⟩"
          ) : data.label === "CNOT" ? (
            <img
              src="cnotBeginner.png"
              alt="CNOT gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "Toffoli" ? (
            <img
              src="toffoliBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "SWAP" ? (
            <img
              src="swapBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CSWAP" ? (
            <img
              src="cswapBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CY" ? (
            <img
              src="cyBeginner.png"
              alt="Controlled-Y gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CZ" ? (
            <img
              src="czBeginner.png"
              alt="Controlled-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CH" ? (
            <img
              src="chBeginner.png"
              alt="Controlled-H gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CRX(θ)" ? (
            <img
              src="crxBeginner.png"
              alt="Controlled-Rotate-X gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CRY(θ)" ? (
            <img
              src="cryBeginner.png"
              alt="Controlled-Rotate-Y gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CRZ(θ)" ? (
            <img
              src="crzBeginner.png"
              alt="Controlled-Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "CU(θ,φ,λ,γ)" ? (
            <img src="CU.png" alt="CU gate" className="w-14 h-19 object-fit object-center translate-y-1" />
          ) : data.label === "CP(λ)" ? (
            <img src="CP.png" alt="CP gate" className="w-10 h-22 object-fit object-center" />
          ) : data.label === "H" ? (
            <img
              src="hadamardBeginner23.png"
              alt="Hadamard gate"
              style={{ width: "320px", height: "120px", marginLeft: "53px" }}
              className=""
            />
          ) : data.label === "RX(θ)" ? (
            <img
              src="rotatexBeginner.png"
              alt="Rotate-X gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "RY(θ)" ? (
            <img
              src="rotateyBeginner.png"
              alt="Rotate-Y gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "RZ(θ)" ? (
            <img
              src="rotatezBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "SDG" ? (
            <img
              src="sdgBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "TDG" ? (
            <img
              src="tdgBeginner.png"
              alt="Rotate-Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "X" ? (
            <img
              src="xBeginner.png"
              alt="X gate"
              style={{ width: "320px", height: "100px", marginLeft: "55px" }}
              className=""
            />
          ) : data.label === "Y" ? (
            <img
              src="yBeginner.png"
              alt="Y gate"
              style={{ width: "320px", height: "100px", marginLeft: "55px" }}
              className=""
            />
          ) : data.label === "Z" ? (
            <img
              src="zBeginner.png"
              alt="Z gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          )   : data.label === "S" ? (
            <img
              src="sBeginner.png"
              alt="S gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "S" ? (
            <img
              src="sBeginner.png"
              alt="S gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ) : data.label === "SX" ? (
            <img
              src="sxBeginner.png"
              alt="SX gate"
              style={{ width: "320px", height: "120px", marginLeft: "58px" }}
              className=""
            />
          ): (
            ""
          ))}
        </div>

        {!isQubit && !isTwoQubit && !isThreeQubit && (
          <Handle
            type="target"
            id={`quantumHandleGateInput0${node.id}`}
            position={Position.Left}
            className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
            isConnectableStart={false}
            isConnectable={edges.filter(edge => edge.targetHandle === "quantumHandleGateOutput0" + node.id).length < 1}
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
              isConnectableStart={false}

            />
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectableStart={false}
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
              isConnectableStart={false}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput1${node.id}`}
              position={Position.Left}
              className="!absolute !top-[50%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectableStart={false}
            />
            <Handle
              type="target"
              id={`quantumHandleGateInput2${node.id}`}
              position={Position.Left}
              className="!absolute !top-[75%] !left--4 z-10 circle-port-op !bg-blue-300 !border-black"
              isValidConnection={() => true}
              isConnectableStart={false}
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

