import { memo, useState, useRef } from "react";
import { Handle, Position, Node } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { isUniqueIdentifier } from "../utils/utils";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[]
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const DataTypeNode = memo((node: Node) => {
  const [value, setValue] = useState("");
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [size, setSize] = useState("");

  const [valueError, setValueError] = useState(false);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const { nodes, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const { data } = node;

  const changeValue = (e) => {
    let value = e.target.value.trim();
    setValue(value);
    node.data["value"] = value;
    updateNodeValue(node.id, "value", value);

    if (data.dataType === "float" || data.dataType === "int") {
      // Replace commas with dots in the value
      value = value.replace(",", ".");
      if (data.dataType === "int") {
        if (!/^-?\d+$/.test(value) && value !== "") {
          setValueError(true);
          return
        }
      } else if (data.dataType === "float") {
        // Ensure only numbers with at most ONE decimal point are allowed
        if (!/^-?\d+(\.\d+)?$/.test(value) && value !== "") {
          setValueError(true);
          return;
        }
      }

    } else if (data.dataType === "array") {
      const value = e.target.value;
      const arrayValues = value.split(',').map(item => item.trim());
      const validArray = arrayValues.every(item => !isNaN(Number(item)) && item !== "");

      if (!validArray && value !== "") {
        setValueError(true);
        return;
      }
    }

    setValueError(false);
  };

  const changeSize = (e) => {
    let size = e.target.value.trim();
    setValue(size);
    node.data["size"] = size;
    updateNodeValue(node.id, "size", size);


    if (!/^-?\d+$/.test(size) && size !== "") {
      setSizeError(true);
      return
    }
    setValueError(false);
  };

  const changeOutputIdentifier = (e) => {
    const value = e.target.value;
    node.data["outputIdentifier"] = value;
    updateNodeValue(node.id, "outputIdentifier", value);
    console.log(isUniqueIdentifier(nodes, value, node.id));

    if ((!/^[a-zA-Z_]/.test(value) && value !== "") || !isUniqueIdentifier(nodes, value, node.id)) {
      setOutputIdentifierError(true);
    } else {
      setOutputIdentifierError(false);
    }
    setOutputIdentifier(value);
    setSelectedNode(node);
  };

  return (
    <div className="grand-parent">
      <div className="w-[400px] h-[200px] rounded-full bg-white overflow-hidden border border-solid border-gray-700 shadow-md">
        <div className="w-full bg-orange-300 text-black text-center font-semibold py-1 truncate">
          {data.dataType}
        </div>
        <div className="px-4 py-3 flex flex-col items-center space-y-3">
          <div className="flex flex-col items-center">
            <label htmlFor="value" className="text-black text-sm mr-2">Value</label>

            {data.dataType === "boolean" ? (
              <select
                id="value"
                className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                value={node.data.value || value}
                onChange={changeValue}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) :
              data.dataType === "bit" ? (
                <select
                  id="value"
                  className="input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 bg-white border-orange-300 focus:border-orange-500"
                  value={node.data.value || value}
                  onChange={changeValue}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              ) : data.dataType === "Array" ? (
                <input
                  id="value"
                  type="text"
                  className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 transition-all duration-200 ${valueError
                    ? 'bg-red-500 border-red-500'
                    : 'bg-white border-orange-300'
                    }`}
                  value={node.data.value || value}
                  placeholder="1,2,3"
                  onChange={changeValue}
                />
              ) : (
                <input
                  id="value"
                  type="text"
                  className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${valueError ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
                  value={node.data.value || value}
                  placeholder="0"
                  onChange={changeValue}
                />
              )}
          </div>
          <div className="flex flex-col items-center">
            <label htmlFor="size" className="text-black text-sm mr-2">Size</label>
            <input
              id="size"
              type="text"
              className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-20 text-center border-2 ${sizeError ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
              value={node.data.size || size}
              placeholder="0"
              onChange={changeSize}
            />
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
              <label htmlFor="outputIdentifier" className="text-black text-sm mr-2">Output</label>
              <input
                id="outputIdentifier"
                className={`p-1 text-black opacity-75 text-sm w-10 text-center rounded-full border-2 ${outputIdentifierError ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
                value={node.data.outputIdentifier || outputIdentifier}
                placeholder="a"
                onChange={changeOutputIdentifier}
              />

              <Handle
                type="source"
                id={`classicalHandleDataTypeOutput0${node.id}`}
                position={Position.Right}
                className="!absolute !top-[73%] z-10 classical-circle-port-round-out !bg-orange-300 !border-black overflow-visible"
                isValidConnection={(connection) => true}
                isConnectableEnd={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
