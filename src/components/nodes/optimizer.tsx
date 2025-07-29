import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { shallow } from "zustand/shallow";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import { AlertCircle } from "lucide-react";
import { findDuplicateOutputIdentifiers } from "../utils/utils";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[];
  nodes: Node[];
  ancillaMode: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  ancillaMode: state.ancillaMode,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const OptimizerNode = memo((node: Node) => {

  const [sizeError, setSizeError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [optimizer, setoptimizer] = useState("Cobyla");
  const [mounted, setMounted] = useState(false);
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);


  const { updateNodeValue, setSelectedNode, setNodes, edges, nodes, ancillaMode } = useStore(selector, shallow);

  useEffect(() => {
    if (node.data.label === "Encode Value") {
      console.log(node.data.optimizer)
      if (node.data.optimizer !== null && !mounted) {
        // updateNodeValue(node.id, "optimizer", node.data.optimizer);
      } else {
        updateNodeValue(node.id, "optimizer", optimizer);
      }
    }

    updateNodeInternals(node.id);
    setMounted(true);
  }, []);


  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    console.log(duplicates)
    const isDuplicate = duplicates.has(identifier);

    const startsWithDigit = /^\d/.test(identifier);
    // Only update state if error state is actually changing
    if (((isDuplicate) && identifier !== "") !== outputIdentifierError) {
      setOutputIdentifierError((isDuplicate) && identifier !== "");
    }
    if (startsWithDigit) {
      setStartsWithDigitError(true);
    } else {
      setStartsWithDigitError(false);
    }
    console.log(optimizer)
    if ((node.data.optimizer === "Cobyla") && (optimizer !== "Cobyla")) {
      updateNodeInternals(node.id);
      setoptimizer(node.data.optimizer)
    }


  }, [nodes, node.data.outputIdentifier, node.id]);

  const { data, selected } = node;

  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);

  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");

  const [operation, setOperation] = useState("+");
  const updateNodeInternals = useUpdateNodeInternals();

  const addVariable = () => {
    const newInputId = `input-${inputs.length + 1}`;
    const newOutputId = `output-${outputs.length + 1}`;

    setInputs([...inputs, { id: newInputId, label: `Variable ${inputs.length + 1}` }]);
    setOutputs([...outputs, { id: newOutputId, label: `Output ${outputs.length + 1}`, value: "" }]);
  };

  const handleOutputChange = (id, newValue) => {
    setOutputs(outputs.map((output) => (output.id === id ? { ...output, value: newValue } : output)));
  };

  const handleOutputIdentifierChange = (e, field) => {
    const value = e.target.value;

    // Check if the first character is a number
    if (/^\d/.test(value)) {
      setOutputIdentifierError(true);
    } else {
      setOutputIdentifierError(false);
    }

    node.data[field] = value;
    updateNodeValue(node.id, field, value);
    //setSelectedNode(node);
  };

  const baseHeight = data.label === "Prepare State" ? 460 : 560;

  const extraHeightPerVariable = 20;
  const dynamicHeight = baseHeight;

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: 373 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
            selected && "border-blue-500"
          )}
          style={{ height: !ancillaMode ? '370px' : `${dynamicHeight}px`, borderRadius: "28px" }}
        >
          {outputIdentifierError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                Identifier is not unique.
              </div>
            </div>
          )}

          {startsWithDigitError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !outputIdentifierError ? '35px' : '50px',
                }}
              >
                Identifier starts with a number.
              </div>
            </div>
          )}

          {sizeError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: !(outputIdentifierError || startsWithDigitError) ? '35px' : '80px',
                }}
              >
                Size is not an integer.
              </div>
            </div>
          )}

          <div className="w-full flex items-center" style={{ height: '52px' }}>
            {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-4 -right-4 w-8 h-8"
              />
            )}
            <div className="w-full bg-orange-300 py-1 px-2 flex items-center" style={{ height: "inherit", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", overflow: "hidden", paddingLeft: '25px', }}>
              <img
                src={"encodeValueIcon.png"
                }
                alt="icon"
                className={"w-[40px] h-[40px] object-contain flex-shrink-0"
                }
              />

              <div className="h-full w-[1px] bg-black mx-2" />

              <span className="font-semibold leading-none" style={{ paddingLeft: '45px' }}>
                {data.label}
              </span>
            </div>
          </div>
          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col overflow-visible">
              <div
                className="relative p-2 mb-1"
                style={{
                  backgroundColor: 'rgba(255, 165, 0, 0.3)',
                  width: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 "

                />

                <Handle
                  type="target"
                  id={`classicalHandleOptimizerInput0${node.id}`}
                  position={Position.Left}
                  className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
                <span className="text-black text-sm text-center w-full">{node.data.inputs[0]?.outputIdentifier || "Measurements"}</span>
              </div>
            </div>
          </div>

          <div className="custom-node-port-out">

            <>
              <OutputPort
                node={node}
                index={0}
                type={"classical"}
                nodes={nodes}
                outputs={outputs}
                setOutputs={setOutputs}
                edges={edges}
                sizeError={sizeError}
                outputIdentifierError={(outputIdentifierError || startsWithDigitError)}
                updateNodeValue={updateNodeValue}
                setOutputIdentifierError={setOutputIdentifierError}
                setSizeError={setSizeError}
                setSelectedNode={setSelectedNode}
                active={true}
              />
            </>
          </div>
        </div>
      </div>
    </motion.div>
  );
});