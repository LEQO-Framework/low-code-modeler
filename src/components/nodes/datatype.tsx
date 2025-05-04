import { memo, useState, useRef } from "react";
import { Handle, Position, Node } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void; 
}) => ({
  selectedNode: state.selectedNode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const DataTypeNode = memo((node: Node) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);

  const { data } = node;
  const xRef = useRef(null);
  const yRef = useRef(null);
  
  const { selectedNode, updateNodeValue, setSelectedNode } = useStore(selector, shallow);

  const handleXChange = (e) => {
    let value = e.target.value.trim();

    if (data.dataType === "int") {
      if (!/^-?\d+$/.test(value) && value !== "") {
        setError(true);
        setX(value);
        return;
      }
    } else if (data.dataType === "float") {
      // Ensure only numbers with at most ONE decimal point are allowed
      if (!/^-?\d+(\.\d+)?$/.test(value) && value !== "") {
        setError(true);
        setX(value);
        return;
    }
    } else if (data.dataType === "bit") {
      if (value !== "0" && value !== "1" && value !== "") {
        setError(true);
        setX(value);
        return;
      }
    } else if (data.dataType === "boolean") {
      // Boolean uses a dropdown, so no input needed here
      return;
    } else if (data.dataType === "array") {
      // Array input is handled separately
      return;
    }

    setError(false);
    setX(value);
    node.data["value"] = value;
    updateNodeValue(node.id, "value", value);
  };

  const handleBooleanChange = (e) => {
    const value = e.target.value;
    setX(value);
    node.data["value"] = value;
    updateNodeValue(node.id, "value", value);
  };

  const handleBitChange = (e) => {
    const value = e.target.value;
    setX(value);
    node.data["value"] = value;
    updateNodeValue(node.id, "value", value);
  };

  const handleArrayChange = (e) => {
    const value = e.target.value;
    const arrayValues = value.split(',').map(item => item.trim());
    const validArray = arrayValues.every(item => !isNaN(Number(item)) && item !== "");

    if (!validArray && value !== "") {
      setError(true);
    } else {
      setError(false);
    }

    setX(value);
    node.data["value"] = value;
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
      <div className="w-[320px] h-[150px] rounded-full bg-white overflow-hidden border border-solid border-gray-700 shadow-md">
        <div className="w-full bg-orange-300 text-black text-center font-semibold py-1 truncate">
          {data.dataType}
        </div>
        <div className="px-2 py-3 flex justify-center">
          <div className="flex items-center mb-2">
            <label htmlFor="x" className="text-black text-sm mr-2">Value</label>
            
            {data.dataType === "boolean" ? (
              <select
                ref={xRef}
                id="x"
                className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                value={node.data.value || x}
                onChange={handleBooleanChange}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ):
            data.dataType === "bit" ? (
              <select
                ref={xRef}
                id="x"
                className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                value={node.data.value || x}
                onChange={handleBitChange}
              >
                <option value="0">0</option>
                <option value="1">1</option>
              </select>
            ) : data.dataType === "Array" ? (
              <input
                ref={xRef}
                id="x"
                type="text"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 transition-all duration-200 ${
                  error
                    ? 'bg-red-500 border-red-500'
                    : 'bg-white border-orange-300'
                }`}
                value={node.data.value || x}
                placeholder="1,2,3"
                onChange={handleArrayChange}
              />
            ) : (
              <input
                ref={xRef}
                id="x"
                type="number"
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${error ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
                value={node.data.value || x}
                placeholder="0"
                step={data.dataType === "int" ? 1 : data.dataType === "float" ? 0.1 : 1}
                onChange={handleXChange}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-0">
          <div className="flex items-center rounded-md overflow-hidden">
            <div
              className="flex items-center rounded-md overflow-hidden"
              style={{
                backgroundColor: 'rgba(212, 128, 72, 0.2)',
                width: '150px',
              }}
            >
              <label htmlFor="y" className="text-black text-sm mr-2">Output</label>
              <input
                ref={yRef}
                id="outputIdentifier"
                className={`p-1 text-black opacity-75 text-sm w-10 text-center rounded-full border-2 ${yError ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
                value={node.data.outputIdentifier || y}
                placeholder="a"
                onChange={handleYChange}
              />
              
              <Handle
                type="source"
                id={`classicalHandleDataTypeOutput0${node.id}`}
                position={Position.Right}
                className="!absolute !top-[73%] z-10 classical-circle-port-round-out !bg-orange-300 !border-black overflow-visible"
                isValidConnection={(connection) => true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
