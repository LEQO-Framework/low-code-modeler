import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { classicalConstructColor } from "@/constants";
import { findDuplicateOutputIdentifier, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import InputPort from "../utils/inputPort";


const selector = (state: any) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  ancillaMode: state.ancillaMode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges
});

export const EditableNode = memo((node: Node) => {
  const { data, selected } = node;

  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges, ancillaMode } = useStore(selector, shallow);
  const updateNodeInternals = useUpdateNodeInternals();
  const properties = data.properties;
  const constraints = data.constraints;
  const outputType = data.outputType;
  const numberInputs = properties.length;
  const numberOutputs = 1;
  const isDataType = data.isDataType;
  const label = data.label || "Editable Node";
  const [values, setValues] = useState([])
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState<{ [key: number]: boolean }>({});

  const headerHeight = 52;
  const inputHeight = 80;
  const inputsTotalHeight = numberInputs * inputHeight;
  const outputHeight = 120;
  const outputsStartTop = headerHeight + inputsTotalHeight + 10;


  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
    console.log("update editable Node handles")
  }, [ancillaMode]);


  const getInputType = (inputIndex: number) => {
    const prop = properties[inputIndex];
    return prop.type
  };


  useEffect(() => {
    //const selectedNode = nodes.find(n => n.id === node.id);
    let selectedNode = node;
    const newErrors: { [key: number]: boolean } = {};
    const newSizeErrors: { [key: number]: boolean } = {};

    outputs.forEach((output: any, index: number) => {
      const outputIdentifier = output?.identifier?.trim();
      const size = output?.size?.trim();
      if (!outputIdentifier) return;

      const duplicates = findDuplicateOutputIdentifier(nodes, selectedNode.id, selectedNode, outputIdentifier);
      let isDuplicate = false;
      for (const [key] of duplicates.entries()) {
        if (Array.isArray(key) && key.some((item: any) => item.identifier === outputIdentifier)) {
          isDuplicate = true;
          break;
        }
      }
      isDuplicate = isDuplicate || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, outputIdentifier);
      const startsWithDigit = /^\d/.test(outputIdentifier);

      newErrors[index] = startsWithDigit || isDuplicate;

      if (size) {
        newSizeErrors[index] = !/^\d/.test(size);
      }
    });

    setOutputIdentifierErrors(newErrors);
    setSizeErrors(newSizeErrors);
  }, [nodes, outputs, node.id]);

  const baseHeight = !ancillaMode ? 50 : 200;
  const extraHeightPerVariable = 130;
  const dynamicHeight = baseHeight + 2 * 40 + 3 * 50 + numberInputs * 50 + numberOutputs * extraHeightPerVariable;

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{
        width: 320,
        height: dynamicHeight,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
          selected && "border-blue-500"
        )}
        style={{
          height: `${dynamicHeight}px`,
          borderRadius: "28px",
        }}
      >

        {(Object.values(outputIdentifierErrors).some(Boolean) ||
          Object.values(sizeErrors).some(Boolean)) && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                One or more outputs have errors (duplicate ID or size is not a number).
              </div>
            </div>
          )}

        <div
          className="relative w-full h-[52px] overflow-hidden rounded-t-[28px]"
        >
          <div className="w-full h-full bg-orange-300 flex items-center py-1 px-2">
            <img
              src="classicalAlgorithmIcon.png" //TODO?
              alt="icon"
              className="w-[42px] h-[42px] object-contain flex-shrink-0"
            />
            <div className="h-full w-[1px] bg-black mx-2" />
            
              <span
                className="font-semibold leading-none cursor-pointer"
                style={{ paddingLeft: "25px" }}
              >
                {label}
              </span>
          </div>
        </div>

        <div className="mt-[5px] flex flex-col relative z-0">
          {properties.map((prop, index) => (
          isDataType? (
          <div
            key={`classical-input-${index}`}
            className="absolute left-0 w-full z-10"
            style={{ top: `${index * inputHeight}px` }}
          >
            <InputPort
                key={`classicalHandleInput${index}${node.id}`} //TODO: anderer key?
                node={node}
                index={index}
                type={"classical"}
                nodes={nodes}
                edges={edges}
                inputIdentifierError={outputIdentifierErrors[index]} //TODO
                updateNodeValue={updateNodeValue}
                setInputIdentifierError={(error) => setOutputIdentifierErrors(prev => ({ ...prev, [index]: error }))} //TODO
                setSelectedNode={setSelectedNode}
                active={true} 
                propertyName={prop.name} 
                propertyType={prop.type}  
                hasInputHandles={!isDataType}          
            />
          </div>) : (
          <div
            className="relative p-2 mb-1"
            style={{
              backgroundColor: classicalConstructColor,
              width: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              borderTopRightRadius: '20px',
              borderBottomRightRadius: '20px',
            }}
            >
            <Handle
              type="target"
              id={`classicalHandle${node.type}Input${index}${node.id}`}
              position={Position.Left}
              className="z-10 classical-circle-port-operation !bg-orange-300 !border-black -left-[8px]"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <div className="flex flex-col items-center w-full leading-tight">
              <span className="text-black text-sm">
              {prop.name || `Input ${index + 1}`}
              </span>
              <span
                className={cn(
                  "text-[10px]", "text-gray-600"
                )}
              >
              type: {prop.type || "undefined"}
              </span>
            </div>

          </div>
          )
          ))}
        </div>
        <div className="custom-node-port-out">
        {Array.from({ length: numberOutputs }).map((_, index) => (
          <div
            key={`output-wrapper-${index}`}
            className="absolute left-0 w-full z-10"
            style={{ top: `${outputsStartTop + index * outputHeight}px` }}
          >
            <OutputPort
              key={`output-port-${index}`}
              node={node}
              index={index}
              type={"classical"}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              outputIdentifierError={outputIdentifierErrors[index]}
              updateNodeValue={updateNodeValue}
              setOutputIdentifierError={(error) =>
                setOutputIdentifierErrors(prev => ({ ...prev, [index]: error }))
              }
              sizeError={sizeErrors[index]}
              setSizeError={(error) =>
                setSizeErrors((prev) => ({ ...prev, [index]: error }))
              }
              setSelectedNode={setSelectedNode}
              active={true}
            />
          </div>
        ))}
        </div>

      </div>
    </motion.div>
  );
});
