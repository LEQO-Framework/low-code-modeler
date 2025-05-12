import { memo, useState, useRef } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[],
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void; 
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const AncillaNode = memo((node: Node) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);

  const { data } = node;
  const xRef = useRef(null);
  const yRef = useRef(null);
  
  const { selectedNode, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);

  const handleXChange = (e) => {
    let value = e.target.value.trim();

    if (data.dataType === "int") {
      if (!/^-?\d+$/.test(value) && value !== "") {
        setError(true);
        setX(value);
        return;
      }
    } 

    setError(false);
    setX(value);
    node.data["size"] = value;
    updateNodeValue(node.id, "value", value);
  };


  const handleYChange = (e) => {
    const value = e.target.value;
    if (!/^[a-zA-Z_]/.test(value) && value !== "") {
      setYError(true);
    } else {
      setYError(false);
    }
    setY(value);
    node.data["outputIdentifier"] = value;
    updateNodeValue(node.id, "outputIdentifier", value);
    setSelectedNode(node);
  };

  return (
    <div className="grand-parent">
      <div className="w-[320px] h-[150px] rounded-none bg-white overflow-hidden border border-solid border-gray-700 shadow-md">
        <div className="w-full bg-green-300 text-black text-center font-semibold py-1 truncate">
          Ancilla
        </div>
        <div className="px-2 py-3 flex justify-center">
          <div className="flex items-center mb-2">
            <label htmlFor="x" className="text-black text-sm mr-2">Size</label>
              <input
                ref={xRef}
                id="x"
                type="number"
                className={`p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${error ? 'bg-red-500 border-red-500' : 'bg-white border-green-300'}`}
                value={node.data.size || x}
                placeholder="0"
                step={1}
                onChange={handleXChange}
              />
          
          </div>
        </div>

        <div className="flex items-center justify-end space-x-0">
          <div className="flex items-center rounded-md overflow-hidden">
            <div
              className="flex items-center rounded-md overflow-hidden"
              style={{
                backgroundColor: 'rgba(137, 218, 131, 0.2)',
                width: '150px',
              }}
            >
              <label htmlFor="y" className="text-black text-sm mr-2">Output</label>
              <input
                ref={yRef}
                id="outputIdentifier"
                className={`p-1 text-black opacity-75 text-sm w-10 text-center rounded-none border-2 ${yError ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}
                value={node.data.outputIdentifier || y}
                placeholder="a"
                onChange={handleYChange}
              />
              
              <Handle
                type="source"
                id={`ancillaHandleOutput${node.id}`}
                position={Position.Right}
                className="!absolute !top-[70%] z-10 circle-port-out !bg-green-200 !border-black overflow-visible transform rotate-45"
                isValidConnection={(connection) => true}
                isConnectable={edges.filter(edge=> edge.source === node.id).length < 1}
                isConnectableEnd={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
