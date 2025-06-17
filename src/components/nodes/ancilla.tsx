import { memo, useState, useRef } from "react";
import { Handle, Position, Node, Edge } from "reactflow";
import useStore from "@/config/store";
import { shallow } from "zustand/shallow";
import OutputPort from "../utils/outputPort";

const selector = (state: {
  selectedNode: Node | null;
  edges: Edge[],
  nodes: Node[],
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  edges: state.edges,
  nodes: state.nodes,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode
});

export const AncillaNode = memo((node: Node) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [error, setError] = useState(false);
  const [yError, setYError] = useState(false);
  const [outputs, setOutputs] = useState(node.data.outputs || []);

  const { data } = node;
  const xRef = useRef(null);
  const yRef = useRef(null);

  const { selectedNode, nodes, updateNodeValue, setSelectedNode, edges } = useStore(selector, shallow);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [outputIdentifier, setOutputIdentifier] = useState("");
  const [operation, setOperation] = useState("");
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeError, setSizeError] = useState(false);

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
      <div className="w-[350px] h-[170px] rounded-none bg-white  border border-solid border-gray-700 shadow-md">
        <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-green-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img src="ancillaIcon.png" alt="icon" className="w-[40px] h-[40px] object-contain flex-shrink-0" />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className="truncate font-semibold leading-none" style={{ paddingLeft: '75px' }}>{data.label}</span>
            </div>
          </div>
        <div className="custom-node-port-out">
          <OutputPort
            node={node}
            index={0}
            type={"ancilla"}
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
  );
});
