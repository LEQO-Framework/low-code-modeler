import { memo, useState } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import { isUniqueIdentifier } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import OutputPort from "../utils/outputPort";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
});

export const DataTypeNode = memo((node: Node) => {
  const [value, setValue] = useState("");
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [outputs, setOutputs] = useState(node.data.outputs || []);

  const [valueError, setValueError] = useState(false);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const { nodes, edges, updateNodeValue, setSelectedNode } = useStore(selector, shallow);
  const { data } = node;

  const changeValue = (e) => {
    let value = e.target.value.trim();
    setValue(value);
    node.data["value"] = value;
    updateNodeValue(node.id, "value", value);

    if (data.dataType === "float" || data.dataType === "int") {
      value = value.replace(",", ".");
      if (data.dataType === "int") {
        if (!/^-?\d+$/.test(value) && value !== "") {
          setValueError(true);
          return;
        }
      } else if (data.dataType === "float") {
        if (!/^-?\d+(\.\d+)?$/.test(value) && value !== "") {
          setValueError(true);
          return;
        }
      }
    } else if (data.dataType === "array") {
      const arrayValues = value.split(",").map((item) => item.trim());
      const validArray = arrayValues.every((item) => !isNaN(Number(item)) && item !== "");

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
      return;
    }
    setValueError(false);
  };

  const changeOutputIdentifier = (e) => {
    const value = e.target.value;
    node.data["outputIdentifier"] = value;
    updateNodeValue(node.id, "outputIdentifier", value);

    if ((!/^[a-zA-Z_]/.test(value) && value !== "") || !isUniqueIdentifier(nodes, value, node.id)) {
      setOutputIdentifierError(true);
    } else {
      setOutputIdentifierError(false);
    }

    setOutputIdentifier(value);
    setSelectedNode(node);
  };

  return (
    <div className="relative w-[450px] h-[250px]  ">
      <div className="w-full h-full rounded-full bg-white overflow-hidden border border-solid border-gray-700 shadow-md">
        <div className="w-full bg-orange-300 text-black text-center font-semibold py-1 truncate relative">
          {outputIdentifierError && (
            <div className="absolute top-2 right-2 group">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-6 right-0 z-10 bg-white text-xs text-red-600 border border-red-400 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Identifier not unique
              </div>
            </div>
          )}
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
            ) : data.dataType === "bit" ? (
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
                className={`input-classical-focus p-1 text-black opacity-75 text-sm rounded-full w-24 text-center border-2 transition-all duration-200 ${valueError ? 'bg-red-500 border-red-500' : 'bg-white border-orange-300'}`}
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
        </div>
        <div className="relative">
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10 w-[200px] h-full">
            <OutputPort
              node={node}
              index={0}
              type={"classical"}
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

      <div className="flex items-center justify-end space-x-0">
        <Handle
          type="source"
          id={`classicalHandleDataTypeOutput0${node.id}`}
          position={Position.Right}
          className="!absolute !top-[67%] z-10 classical-circle-port-round-out !bg-orange-300 !border-black overflow-visible"
          isValidConnection={(connection) => true}
          isConnectableEnd={false}
        />

      </div>
    </div>
  );
});
