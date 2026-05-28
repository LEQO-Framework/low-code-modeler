import { memo, useState } from "react";
import { Node, Handle, Position } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import { quantumConstructColor } from "@/constants";

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
});

export const GroverDiffuserNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode } = useStore(selector, shallow);

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const isConnected = edges.some(edge => edge.target === id);

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: 250 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500"
          )}
          style={{ height: "250px" }}
        >
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="diffusionIcon.png"
                alt="Grover icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="font-semibold leading-none" style={{ paddingLeft: '60px' }}>
                Grover Diffuser
              </span>
            </div>
          </div>

          {/* QUANTUM INPUT PORT */}
          <div className="mt-4 flex flex-col space-y-2">
            <div
              className={cn(
                "relative p-2 flex items-center")}
              style={{ width: "140px", background: quantumConstructColor }}
            >
              <Handle
                type="target"
                id={`quantumHandleInput0${id}`}
                position={Position.Left}
                className={cn(
                  "z-10 circle-port-op !bg-blue-300 !border-gray-400 !absolute !top-1/2 !-translate-y-1/2 -left-[8px]",
                  isConnected
                    ? "!border-solid !border-black !bg-blue-400"
                    : "!border-dashed !bg-gray-200"
                )}
                style={{ width: 12, height: 12 }}
                isConnectable={!isConnected}
              />
              <div className="flex flex-col w-full text-center leading-tight">
                <span className="text-black text-sm truncate">
                  {node.data.inputs?.[0]?.outputIdentifier || "Register"}
                </span>
                <span className="text-[10px] text-gray-600">
                  type: quantum register
                </span>
              </div>
            </div>
          </div>

          {/* NATIVE OUTPUT PORT */}
          <div className="custom-node-port-out absolute bottom-4 right-0">
            <OutputPort
              node={node}
              index={0}
              type={"quantum"}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              sizeError={sizeError}
              outputIdentifierError={outputIdentifierError}
              updateNodeValue={updateNodeValue}
              setOutputIdentifierError={setOutputIdentifierError}
              setSizeError={setSizeError}
              setSelectedNode={setSelectedNode}
              active={true}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
});