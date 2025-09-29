import { memo, useEffect, useState } from "react";
import { Handle, Position, Node, Edge, getConnectedEdges, useUpdateNodeInternals } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import AncillaPort from "../utils/ancillaPort";
import UncomputePort from "../utils/uncomputePort";
import OutputPort from "../utils/outputPort";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ancillaConstructColor, dirtyAncillaHandle, dirtyConstructColor, quantumConstructColor } from "@/constants";
import { findDuplicateOutputIdentifier, findDuplicateOutputIdentifiers, findDuplicateOutputIdentifiersInsideNode } from "../utils/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "antd";

const selector = (state: {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  ancillaMode: boolean;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  setSelectedNode: (node: Node | null) => void;
  setEdges: (edge: Edge) => void;
  setNewEdges: (newEdges: Edge[]) => void;
}) => ({
  selectedNode: state.selectedNode,
  nodes: state.nodes,
  edges: state.edges,
  ancillaMode: state.ancillaMode,
  updateNodeValue: state.updateNodeValue,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  setNewEdges: state.setNewEdges
});

export const GroupNode = memo((node: Node) => {
  const { data, selected } = node;
  console.log(selected)
  console.log(data.numberInputs)
  const numberInputs = 7;
  const numberOutputs = 7;

  const handleCount = numberInputs + numberOutputs;
  console.log(handleCount)

  const handleGap = 40;
  const handleOffset = 15;

  const nodeHeight = Math.max(handleOffset * 2 + (handleCount) * handleGap, 100);
  const { edges, nodes, updateNodeValue, setSelectedNode, setNewEdges, setEdges, ancillaMode } = useStore(
    selector,
    shallow
  );
  const alledges = getConnectedEdges([node], edges);

  const [inputs, setInputs] = useState(data.inputs || []);
  const [outputs, setOutputs] = useState(data.outputs || []);
  const [yError, setYError] = useState(false);
  const [y, setY] = useState("");
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [showingChildren, setShowingChildren] = useState(false);
  const [sizeErrors, setSizeErrors] = useState<{ [key: number]: boolean }>({});
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editableLabel, setEditableLabel] = useState(data.label || "");
  const updateNodeInternals = useUpdateNodeInternals();
  const [outputIdentifierErrors, setOutputIdentifierErrors] = useState({});

  const handleLabelChange = () => {
    setIsEditingLabel(false);
    updateNodeValue(node.id, "label", editableLabel);
    node.data.label = editableLabel;
    setSelectedNode(node);
  };

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [node]);


  const isAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `ancillaHandleOperationInput2${node.id}`
  );

  const isDirtyAncillaConnected = edges.some(
    edge => edge.target === node.id && edge.targetHandle === `${dirtyAncillaHandle}OperationInput3${node.id}`
  );


  const [quantumHandles, setQuantumHandles] = useState([0]);
  const [classicalHandles, setClassicalHandles] = useState([0]);

  const [quantumOutputHandles, setQuantumOutputHandles] = useState([0]);
  const [quantumOutputHandlesElse, setQuantumOutputHandlesElse] = useState([0]);
  const [classicalOutputHandles, setClassicalOutputHandles] = useState([{ index: 0, branch: "then" }]);

  const [classicalOutputHandlesElse, setClassicalOutputHandlesElse] = useState([0]);
  const [collapsed, setColllapsed] = useState(false);

  const collapseParent = () => {
    setColllapsed(!collapsed);
    updateNodeValue(node.id, "collapsed", "" + collapsed);
    console.log("collap")
    // Get the main node
    let mainNodes = document.querySelectorAll<HTMLDivElement>(
      'div.react-flow__node-ifElseNode'
    );
    let keys = mainNodes.keys();

    // extract key and see if it matches data-id this is then the mainNode
    let mainNode: HTMLDivElement | undefined;
    mainNodes.forEach((nodeElement) => {
      const dataId = nodeElement.getAttribute('data-id');
      console.log('Checking node with data-id:', dataId);
      if (dataId === node.id) {   // assuming node.id is available in scope
        mainNode = nodeElement;
      }
    });

    console.log('Main node:', mainNode);
    if (mainNode) {
      // Get the first child div (grand-parent where you set width)
      const firstChild = mainNode.querySelector<HTMLDivElement>(
        'div.grand-parent'
      );

      console.log('Main node:', mainNode);

      console.log('First child (grand-parent):', firstChild);
      if (firstChild) {
        for (let i = 0; i < nodes.length; i++) {
          console.log(node.data)
          console.log(nodes[i]);
          if (nodes[i].parentNode === node.id && node.data.collapsed === "true") {
            updateNodeValue(nodes[i].id, "hidden", "true");
          } else if (nodes[i].parentNode === node.id && node.data.collapsed === "false") {
            updateNodeValue(nodes[i].id, "hidden", "false");
          }
        }

        // Get the current minWidth from computed styles
        const currentMinWidth = window.getComputedStyle(firstChild).minWidth;
        // Parse it into a number
        const currentMinWidthValue = parseFloat(currentMinWidth);
        // Add 100 to it
        const newMinWidth = 400;
        // Set it back with "px"
        firstChild.style.minWidth = `${newMinWidth}px`;
        firstChild.style.height = `${newMinWidth}px`;
        console.log(`Updated minWidth to ${newMinWidth}px`);
        updateNodeValue(node.id, "collapsed", "" + collapsed);
      }
    } else {
      console.error('Main node not found');
    }

  }

  useEffect(() => {
    updateNodeInternals(node.id);
    setSelectedNode(node);
  }, [node]);
  useEffect(() => {
    const connectedQuantumHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const connectedClassicalHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleInputInitialization${node.id}`))
      .map(edge => edge.targetHandle);

    const expectedHandles = quantumHandles.map(index => `quantumHandleInputInitialization${index}${node.id}`);
    const lastHandle = expectedHandles[expectedHandles.length - 1];

    const expectedClassicalHandles = classicalHandles.map(index => `classicalHandleInputInitialization${index}${node.id}`);
    const lastClassicalHandle = expectedClassicalHandles[expectedClassicalHandles.length - 1];

    if (connectedQuantumHandles.includes(lastHandle)) {
      setQuantumHandles(prev => [...prev, prev.length]);
    }
    console.log(classicalHandles)
    console.log(connectedClassicalHandles)
    console.log(lastClassicalHandle)

    if (connectedClassicalHandles.includes(lastClassicalHandle)) {
      setClassicalHandles(prev => [...prev, prev.length]);
      console.log(classicalHandles)
    } else {
      console.log(connectedClassicalHandles)
      const expectedClassicalIndices = connectedClassicalHandles.map(handleId => {
        const parts = handleId.split("-");
        return parseInt(parts[parts.length - 1], 10);
      });
      const nextClassicalIndex = Math.max(...expectedClassicalIndices, -1) + 1;
      console.log(expectedClassicalIndices)
      setClassicalHandles([...expectedClassicalIndices, nextClassicalIndex]);

    }
    const connectedOutputHandles = edges
      .filter(edge => edge.target === node.id && (edge.targetHandle?.startsWith(`classicalHandleDynamicOutput${node.id}`) || edge.targetHandle?.startsWith(`classicalHandleDynamicOutputElse${node.id}`)))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandles)

    const expected = classicalOutputHandles.map(({ index, branch }) => {
      console.log(index);
      return `classicalHandleDynamicOutput${branch === "else" ? "Else" : ""}${node.id}-${index}`
    }
    );
    const lastHandleId = expected[expected.length - 1];

    // Extract last branch from the last handleId
    const lastBranch = lastHandleId.includes("Else") ? "else" : "then";

    if (connectedOutputHandles.includes(lastHandleId)) {
      const nextIndex = classicalOutputHandles.length;
      setClassicalOutputHandles(prev => [...prev, { index: nextIndex, branch: lastBranch }]);
    }

    const connectedOutputHandlesElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`classicalHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesElse)

    const expectedElse = connectedClassicalHandles.map(index => `classicalHandleDynamicOutputElse${node.id}-${index}`);
    const lastHandleIdElse = expectedElse[expectedElse.length - 1];

    if (connectedOutputHandlesElse.includes(lastHandleIdElse)) {
      setClassicalOutputHandlesElse(prev => [...prev, prev.length]);
    }

    const connectedQuantumOutputHandles = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleDynamicOutput${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandles)

    const quantumExpected = quantumOutputHandles.map(index => `quantumHandleDynamicOutput${index}${node.id}`);
    const lastQuantumHandleId = quantumExpected[quantumExpected.length - 1];

    if (connectedQuantumOutputHandles.includes(lastQuantumHandleId)) {
      setQuantumOutputHandles(prev => [...prev, prev.length]);
    }

    const connectedOutputHandlesQuantumElse = edges
      .filter(edge => edge.target === node.id && edge.targetHandle?.startsWith(`quantumHandleDynamicOutputElse${node.id}`))
      .map(edge => edge.targetHandle);
    console.log(connectedOutputHandlesQuantumElse)

    const expectedQuantumElse = quantumOutputHandlesElse.map(index => `quantumHandleDynamicOutputElse${index}${node.id}`);
    const lastHandleIdQuantumElse = expectedQuantumElse[expectedQuantumElse.length - 1];

    if (connectedOutputHandlesQuantumElse.includes(lastHandleIdQuantumElse)) {
      setQuantumOutputHandlesElse(prev => [...prev, prev.length]);
    }

    updateNodeInternals(node.id); // `nodeId` is the ID of the updated node
  }, [edges, node.id, quantumHandles, classicalOutputHandles, quantumOutputHandles, quantumOutputHandlesElse, classicalOutputHandlesElse]);

  const dynamicHeight = 900 + Math.max(0, numberInputs + numberInputs - 1 + (numberOutputs - 1)) * 30;
  const totalHandles = Math.max(classicalHandles.length + quantumHandles.length, classicalOutputHandles.length + classicalOutputHandlesElse.length + quantumOutputHandles.length + quantumOutputHandlesElse.length);
  const hexagonHeight = dynamicHeight + 50//handleOffset * 2 + (handleCount) * handleGap + Math.max(250, 280 + totalHandles * 30);
  const hexagonTopOffset = -(hexagonHeight / 2) + 20;
  const hexagonWidth = collapsed ? 200 : 250;
  const hexagonHeightCollapsed = collapsed ? 100 : hexagonHeight;
  const hexagonTopOffsetCollapsed = collapsed ? 10 : hexagonTopOffset;

  useEffect(() => {
    const identifier = node.data.outputIdentifier;
    console.log(nodes)
    let selectedNode = nodes.find(n => n.id === node.id);
    const newErrors = {};

    outputs.forEach((output, index) => {
      const outputIdentifier = output?.identifier?.trim();
      console.log(outputIdentifier)
      const size = output?.size?.trim();
      if (!outputIdentifier) return;
      const duplicates = findDuplicateOutputIdentifier(nodes, selectedNode.id, selectedNode, outputIdentifier);
      let isDuplicate = false;
      for (const [key] of duplicates.entries()) {
        if (
          Array.isArray(key) &&
          key.some((item) => item.identifier === outputIdentifier)
        ) {
          isDuplicate = true;
          break;
        }
      }
      console.log(isDuplicate)
      isDuplicate = isDuplicate || findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, outputIdentifier)
      console.log(findDuplicateOutputIdentifiersInsideNode(nodes, selectedNode, outputIdentifier))
      const startsWithDigit = /^\d/.test(outputIdentifier);
      console.log(isDuplicate)
      console.log(output)

      console.log("set for identifier error");
      console.log(outputIdentifier)
      // Flag error if identifier is invalid or duplicated
      newErrors[index] = startsWithDigit || isDuplicate;
      console.log(newErrors[index])
      if (!size) return;
      const startsWithDigitSize = !/^\d/.test(size);
      sizeErrors[index] = startsWithDigitSize;
    })

    setOutputIdentifierErrors(newErrors);
    setSizeErrors(sizeErrors)
  }, [nodes, outputs, node.id]);


  const baseHeight = !ancillaMode ? 50 : 200;
  const extraHeightPerVariable = 130;
  // Ensure identifiers exist and match the number of outputs
  if (!data.identifiers) {
    data.identifiers = [];
  }

  // Add missing identifiers
  while (data.identifiers.length < numberOutputs) {
    data.identifiers.push("q" + Math.floor(100000 + Math.random() * 900000).toString());
  }

  // Remove extra identifiers
  if (data.identifiers.length > numberOutputs) {
    const removedIdentifiers = data.identifiers.slice(numberOutputs);
    console.log(removedIdentifiers);

    // Clean up edges with sourceHandles related to removed identifiers
    const edgesToRemove = edges.filter((edge) =>
      !removedIdentifiers.some((id, index) =>
        edge.sourceHandle === `quantumHandleGateOutput${numberOutputs + index + 1}${node.id}`
      )
    );
    console.log("EDGES")
    console.log(edgesToRemove)

    if (edgesToRemove.length > 0) {
      console.log("remove edges")
      setNewEdges(edgesToRemove);
    }

    data.identifiers = data.identifiers.slice(0, numberOutputs);
  }

  console.log(nodeHeight)

  return !collapsed ? (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{
        width: showingChildren ? 360 : 320,
        height: showingChildren ? 400 : 373,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">

        <div
          className={cn(
            "w-[320px]  border border-solid border-gray-700 shadow-md",
            selected && "border-blue-500"
          )}
          style={{ height: `${dynamicHeight}px` }}
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


          <div className="w-full flex items-center" style={{ height: "52px" }}>
            {node.data.implementation && (
              <img
                src="implementation-icon.png"
                alt="Custom Icon"
                className="absolute -top-4 -right-4 w-8 h-8"
              />
            )}
            <div
              className="w-full bg-blue-300 py-1 px-2 flex items-center"
              style={{ height: "inherit" }}
            >
              <img
                src="algorithmIcon.png"
                alt="icon"
                className="w-[42px] h-[42px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              {isEditingLabel ? (
                <input
                  autoFocus
                  type="text"
                  value={editableLabel}
                  onChange={(e) => setEditableLabel(e.target.value)}
                  onBlur={handleLabelChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLabelChange();
                  }}
                  className="font-semibold leading-none bg-white border border-gray-400 px-2 py-1 rounded"
                  style={{ paddingLeft: "25px", width: "100%" }}
                />
              ) : (
                <span
                  className="truncate font-semibold leading-none cursor-pointer"
                  style={{ paddingLeft: "25px" }}
                  onClick={() => setIsEditingLabel(true)}
                >
                  {editableLabel}
                </span>
              )}
            </div>
          </div>

          <div className="custom-node-port-in mb-3 mt-[5px]">
            <div className="relative flex flex-col overflow-visible">
              <div className="custom-node-port-in">
                <div className="relative flex flex-col overflow-visible">
                  {Array.from({ length: numberInputs }).map((_, index) => (
                    <div
                      key={`quantum-input-${index}`}
                      className="relative p-2 mb-1"
                      style={{
                        backgroundColor: quantumConstructColor,
                        width: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Handle
                        type="target"
                        id={`quantumHandleOperationInput${index}${node.id}`}
                        position={Position.Left}
                        className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                        style={{ top: "50%", transform: "translateY(-50%)" }}
                      />
                      <span className="text-black text-sm text-center w-full">
                        {node.data.inputs?.[index]?.outputIdentifier || `Input ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {ancillaMode && (<div>
                <div
                  className="relative p-2 mb-1"
                  style={{
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    className="absolute inset-0 custom-shape-mirrored"
                    style={{ backgroundColor: ancillaConstructColor }}
                  />
                  <Handle
                    type="target"
                    id={`ancillaHandleOperationInput2${node.id}`}
                    position={Position.Left}
                    className={cn(
                      "z-10 ancilla-port-in w-4 transform rotate-45 -left-[8px]",
                      isAncillaConnected
                        ? "!bg-green-100 !border-solid !border-black"
                        : "!bg-gray-200 !border-dashed !border-black"
                    )}
                    style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
                  />
                  <span
                    className="text-black text-sm text-center w-full"
                    style={{ zIndex: 1 }}
                  >
                    Ancilla
                  </span>
                </div>
                <div
                  className="relative p-2"
                  style={{
                    width: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    className="absolute inset-0 custom-shape-mirrored"
                    style={{ backgroundColor: dirtyConstructColor }}
                  />
                  <Handle
                    type="target"
                    id={`${dirtyAncillaHandle}OperationInput3${node.id}`}
                    position={Position.Left}
                    className={cn(
                      "z-10 ancilla-port-in w-4 transform rotate-45 -left-[8px]",
                      isDirtyAncillaConnected
                        ? "!bg-green-100 !border-solid !border-black"
                        : "!bg-gray-200 !border-dashed !border-black"
                    )}
                    style={{ zIndex: 1, top: '50% !important', transform: 'translateY(-50%) rotate(45deg)' }}
                  />
                  <span
                    className="text-black text-sm text-center w-full"
                    style={{ zIndex: 1 }}
                  >
                    Dirty Ancilla
                  </span>
                </div>
              </div>)}
            </div>
          </div>


          <div className="custom-node-port-out">
            {Array.from({ length: numberOutputs }).map((_, index) => (
              <OutputPort
                key={`output-port-${index}`}
                node={node}
                index={index}
                type={"quantum"}
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
            ))}

          </div>

          {ancillaMode && (
            <div>
              <AncillaPort node={node} edges={edges} dirty={false} index={numberOutputs} />
              <AncillaPort node={node} edges={edges} dirty={true} index={numberOutputs + 1} />
              <UncomputePort node={node} edges={edges} index={numberOutputs + 2} />
            </div>
          )}

        </div>
        <Button
          onClick={() => { collapseParent(); }}
          icon={collapsed ? "-" : "+"}
          style={{
            position: "absolute",
            bottom: "0px",
            left: "50%",
            transform: "translateX(-50%)",
            border: "1px solid black",
            borderRadius: 0,
            zIndex: 30,
          }}
        />
      </div>
    </motion.div>
  ) : (
    <div className="absolute left-0 overflow-visible text-center" style={{ zIndex: 30 }}>
      <div style={{ position: "relative", width: "225px", overflow: "visible" }}>

        <div
          className="hexagon-left"
          style={{
            position: "absolute",
            left: "-50px",
            width: "250px",
            height: `${hexagonHeight}px`,
            backgroundColor: "black",
            top: `${-90}px`,
            clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
          }}
        ></div>
        <div
          className="hexagon-left"
          style={{
            position: "absolute",
            left: "-50px",
            width: "250px",
            height: `${hexagonHeight}px`,
            backgroundColor: "white",
            top: `${-90}px`,
            clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",


          }}
        >
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-purple-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img src="Grouping icon.png" alt="icon" className="w-[60px] h-[60px] object-contain flex-shrink-0" style={{ paddingLeft: '25px' }} />
              <div className="h-full w-[1px] bg-black mx-2" />
              <span className=" font-semibold leading-none" style={{ paddingLeft: '25px' }}>Dynamic Circuit</span>
            </div>
          </div>

          <Button
            onClick={() => { collapseParent(); setColllapsed(!collapsed) }}
            icon={collapsed ? "+" : "-"}
            style={{
              position: "absolute",
              bottom: "0px",
              left: "50%",
              transform: "translateX(-50%)",
              border: "1px solid black",
              borderRadius: 0,
              zIndex: 30,
            }}
          />
        </div>

        <div style={{ position: "relative", left: "-120px", overflow: "visible" }}>
          <div style={{ position: "relative", left: "2px", overflow: "visible" }}>
            {Array.from({ length: numberInputs }).map((_, index) => (
              <div
                key={`quantum-input-${index}`}
                className="relative p-2 mb-1"
                style={{
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <Handle
                  type="target"
                  id={`quantumHandleOperationInput${index}${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                  style={{ top: "16px", }}
                />
           
              </div>
            ))}
        
            {Array.from({ length: numberInputs }).map((_, index) => (
              <div
                key={`quantum-input-${index}`}
                className="relative p-2 mb-1"
                style={{
                  width: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <Handle
                  type="target"
                  id={`quantumHandleOperationInput${index}${node.id}`}
                  position={Position.Left}
                  className="z-10 circle-port-op !bg-blue-300 !border-black -left-[8px]"
                  style={{ top: "16px", }}
                />
           
              </div>
            ))}
          </div>


          <div style={{ right: "-25px", overflow: "visible", position: "relative" }}>

            {Array.from({ length: numberOutputs }).map((_, index) => (
              <OutputPort
                key={`output-port-${index}`}
                node={node}
                index={index}
                type={"quantum"}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});