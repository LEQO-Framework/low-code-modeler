import useStore from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo, useState, useRef, useEffect } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";
import { AlertCircle } from "lucide-react";
import { findDuplicateOutputIdentifiers, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[],
  nodes: Node[],
  updateNodeValue: (nodeId: string, field: string, nodeVal: any) => void;
  setNodes: (node: Node) => void;
  setSelectedNode: (node: Node) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  setNodes: state.setNodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const MeasurementNode = memo((node: Node) => {
  const { data, selected } = node;
  const { edges, nodes, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);
  const [y, setY] = useState("");
  const [classicalOutputIdentifierError, setClassicalOutputIdentifierError] = useState(false);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [operation, setOperation] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [classicalSizeError, setClassicalSizeError] = useState(false);


  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);
  const [indices, setIndices] = useState("");
  const [startsWithDigitError, setStartsWithDigitError] = useState(false);

  const xRef = useRef(null);
  const yRef = useRef(null);


  const baseHeight = 400;
  const extraHeightPerVariable = 40;
  const dynamicHeight = baseHeight + (inputs.length) * extraHeightPerVariable;
  console.log(dynamicHeight)


  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    console.log(nodes)
    let selectedNode = nodes.find(n => n.id === node.id);
    const duplicates = findDuplicateOutputIdentifiers(nodes, node.id);
    let isDuplicate = duplicates.has(identifier);
    const startsWithDigit = /^\d/.test(outputIdentifier);
 
    isDuplicate = isDuplicate || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, identifier) ||startsWithDigit;
    
    setOutputIdentifierError(isDuplicate && identifier !== "");
    setClassicalOutputIdentifierError(isDuplicate && identifier !== "");

  }, [nodes, node.data]);

  const handleYChange = (e, field) => {
    const value = e.target.value;
    if (/^[a-zA-Z_]/.test(value) && value !== "") {
      setError(true);
    } else {
      setError(false)
    }
    if (field === "indices") {
      setIndices(value);
    }
    const number = Number(value);
    
    node.data[field] = value;
    updateNodeValue(node.id, field, number);
    setSelectedNode(node);
  };

  return (
    <div className="grand-parent">
      <div
        className={cn(
          "w-[320px] bg-white border border-solid border-gray-700 shadow-md",
          selected && "border-blue-500"
        )}
        style={{ height: `${dynamicHeight}px` }}
      >
        {(outputIdentifierError || classicalOutputIdentifierError) && (
          <div className="absolute top-2 right-[-50px] group z-20">
            <AlertCircle className="text-red-600 w-5 h-5" />
            <div className="absolute top-5 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
              Identifier is not unique or starts with a number
            </div>
          </div>
        )}
        {(sizeError || classicalSizeError) && (
          <div className="absolute top-2 right-[-50px] group z-20">
            <AlertCircle className="text-red-600 w-5 h-5" />
            <div className="absolute top-12 left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
              Size is not an integer
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-2 right-[-50px] group z-20">
            <AlertCircle className="text-red-600 w-5 h-5" />
            <div className="absolute top-[75px] left-[20px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
              Indices is not an integer
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
          <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
            <img src="measurementIcon2.png" alt="icon" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
            <div className="h-full w-[1px] bg-black mx-2" />
            <span className="truncate font-semibold leading-none" style={{ paddingLeft: '25px' }}>{data.label}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="custom-node-port-in mb-3 mt-2">
            <div className="relative flex flex-col items-start text-black text-center overflow-visible">

              <div className=" ml-6">
                <label htmlFor="indices" className="text-black text-xs mb-1 block">
                  Indices
                </label>
                <input
                  ref={xRef}
                  id="indices"
                  type="text"
                  className={`p-1 text-black opacity-75 text-xs rounded-full w-[130px] text-center border-2 ${error ? "bg-red-500 border-red-500" : "bg-white border-blue-300"
                    }`}
                  value={node.data.indices || indices}
                  placeholder="e.g. 1,2,3"
                  onChange={(e) => handleYChange(e, "indices")}
                />
              </div>
            </div>
          </div>


        </div>
        <div className="custom-node-port-in mb-3 mt-2">

          <div className="relative flex flex-col items-start text-black text-center overflow-visible">
            <div style={{ padding: "4px", backgroundColor: "rgba(105, 145, 210, 0.2)", width: "45%" }}>

              <div className="flex items-center space-x-2 mt-2">
                <Handle
                  type="target"
                  id={`quantumHandleMeasurementInput0${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black"
                  style={{ top: "20px" }}
                  isValidConnection={(connection) => true}
                  isConnectable={edges.filter(edge => edge.targetHandle === `quantumHandleMeasurementInput0${node.id}`).length < 1}
                  isConnectableStart={false}
                />
                <span className="text-black text-sm" >{node.data.inputs[0]?.outputIdentifier || "Register"}</span>
              </div>
            </div>
          </div>
        </div>


        <div className="custom-node-port-out">
          <OutputPort
            node={node}
            index={0}
            type={"classical"}
            nodes={nodes}
            outputs={outputs}
            setOutputs={setOutputs}
            edges={edges}
            sizeError={classicalSizeError}
            outputIdentifierError={classicalOutputIdentifierError}
            updateNodeValue={updateNodeValue}
            setOutputIdentifierError={setClassicalOutputIdentifierError}
            setSizeError={setClassicalSizeError}
            setSelectedNode={setSelectedNode}
            active={false}
          />
          <OutputPort
            node={node}
            index={1}
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
            active={false}
          />
        </div>



      </div>
    </div>
  );
});
