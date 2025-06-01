import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  ReactFlowProvider,
  MiniMap,
  getOutgoers,
  getNodesBounds,
  ConnectionMode,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomPanel, Palette } from "./components";
import Toolbar from "./components/toolbar";
import { nodesConfig } from "./config/site";
import useStore from "./config/store";
import { useShallow } from "zustand/react/shallow";
import { handleDragOver, handleOnDrop } from "./lib/utils";
import useKeyBindings from "./hooks/useKeyBindings";
import { toSvg } from "html-to-image";
import { initialDiagram } from "./config/site";
import Modal from "./Modal";
import './index.css';
import { useStoreState } from "react-flow-renderer";
import { useInternalNode } from "@xyflow/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { startCompile } from "./backend";
import { Button } from "antd";



const selector = (state: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onConnectEnd: any;
  setSelectedNode: (node: Node | null) => void;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  undo: () => void;
  redo: () => void;
}) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onConnectEnd: state.onConnectEnd,
  setSelectedNode: state.setSelectedNode,
  updateNodeValue: state.updateNodeValue,
  updateParent: state.updateParent,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  undo: state.undo,
  redo: state.redo,
});

function App() {
  const reactFlowWrapper = React.useRef<any>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [metadata, setMetadata] = React.useState<any>({
    version: "1.0.0",
    name: "My Model",
    description: "This is a model.",
    author: "",
  });
  const [menu, setMenu] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [nisqAnalyzerEndpoint, setNisqAnalyzerEndpoint] = useState(import.meta.env.VITE_NISQ_ANALYZER);
  const [qunicornEndpoint, setQunicornEndpoint] = useState(import.meta.env.VITE_QUNICORN);
  const [lowcodeBackendEndpoint, setLowcodeBackendEndpoint] = useState(import.meta.env.VITE_LOW_CODE_BACKEND);

  const [tempNisqAnalyzerEndpoint, setTempNisqAnalyzerEndpoint] = useState(nisqAnalyzerEndpoint);
  const [tempQunicornEndpoint, setTempQunicornEndpoint] = useState(qunicornEndpoint);
  const [tempLowcodeBackendEndpoint, setTempLowcodeBackendEndpoint] = useState(lowcodeBackendEndpoint);

  const [isLoadJsonModalOpen, setIsLoadJsonModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);

  const togglePalette = () => {
    setIsPaletteOpen((prev) => !prev);
  };

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };
  const handleLoadJson = () => {
    setIsLoadJsonModalOpen(true);
  };

  const confirmLoadJson = () => {
    setIsLoadJsonModalOpen(false);
    loadFlow(initialDiagram);
  };

  const handleSave = () => {
    setNisqAnalyzerEndpoint(tempNisqAnalyzerEndpoint);
    setLowcodeBackendEndpoint(tempLowcodeBackendEndpoint);
    setQunicornEndpoint(tempQunicornEndpoint);
    setIsConfigOpen(false);

  };

  const handleCancel = () => {
    setTempNisqAnalyzerEndpoint(nisqAnalyzerEndpoint);
    setTempQunicornEndpoint(qunicornEndpoint);
    setTempLowcodeBackendEndpoint(lowcodeBackendEndpoint);
    setIsConfigOpen(false);
  };


  const cancelLoadJson = () => {
    setIsLoadJsonModalOpen(false);
  };
  const [helperLines, setHelperLines] = useState(null);
  const [deploymentId, setDeploymentId] = useState(null);


  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    setSelectedNode,
    setNodes,
    updateNodeValue,
    updateParent,
    setEdges,
  } = useStore(useShallow(selector));

  const { undo } = useStore((state) => ({
    undo: state.undo,
  }));

  const { redo } = useStore((state) => ({
    redo: state.redo,
  }));

  const ref = useRef(null);

  const onDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      handleDragOver(event);
    },
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [modalStep, setModalStep] = useState(0);
  const [loadingQunicorn, setLoadingQunicorn] = useState(true);
  const [statusQunicorn, setStatusQunicorn] = useState(null);
  const [ancillaModelingOn, setAncillaModelingOn] = useState(true);

  const handleClose = () => {
    if (modalStep < 3) {
      setModalStep(modalStep + 1);
    } else {
      setModalStep(0); // or false if you want to hide all modals at the end
      setChartData(null);
      setJobId(null);
      setDeploymentId(null);
      setProgress(0);
    }
  };

  const sendToBackend = async () => {
    setModalOpen(true);
    setLoading(true);

    try {

      const validMetadata = {
        ...metadata,
        id: `flow-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      console.log(validMetadata);
      console.log(metadata);
      const flow = reactFlowInstance.toObject();

      const flowWithMetadata = { metadata: validMetadata, ...flow };
      let response = await startCompile(lowcodeBackendEndpoint, metadata, reactFlowInstance.getNodes(), reactFlowInstance.getEdges());
      // must return the location where to poll
      //let response = await fetch(lowcodeBackendEndpoint + "/compile", {
      // method: "POST",
      //headers: { "Content-Type": "application/json" },
      //body: JSON.stringify(flowWithMetadata),
      //});

      console.log(await response.text());

      if (!response["Location"]) {
        return {
          error: "Received invalid response from Low Code Backend.",
        };
      }
      //pollStatus(response["Location"]);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const sendToQunicorn = async () => {
    setModalStep(1);
    setLoading(true);


    try {
      let program = {
        "programs": [
          {
            "quantumCircuit": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncreg meas[2];\nh q[0];\ncx q[0],q[1];\nbarrier q[0],q[1];\nmeasure q[0] -> meas[0];\nmeasure q[1] -> meas[1];",
            "assemblerLanguage": "QASM2",
            "pythonFilePath": "",
            "pythonFileMetadata": ""
          }
        ],
        "name": "DeploymentName"
      };

      let response = await fetch("http://localhost:8080/deployments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });

      let data = await response.json();
      console.log(data["id"]);
      setDeploymentId(data["id"]);
      //pollStatus(response["Location"]);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const sendToQunicorn2 = async () => {
    setModalStep(2);
    setLoading(true);

    try {
      let program = {
        "name": "JobName",
        "providerName": "IBM",
        "deviceName": "aer_simulator",
        "shots": 4000,
        "errorMitigation": "none",
        "cutToWidth": null,
        "token": "",
        "type": "RUNNER",
        "deploymentId": deploymentId
      }

      let response = await fetch("http://localhost:8080/jobs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });

      let data = await response.json();
      console.log(data);
      setJobId(data["self"]);
      //handleClose();
      //pollStatus(response["Location"]);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const sendToQunicorn3 = async () => {
    setModalStep(3);
    setLoading(true);
    setProgress(0);

    try {

      let getresponse = await fetch("http://localhost:8080" + jobId, {
        method: "GET",
        headers: { "Content-Type": "application/json" },

      });
      setProgress(5);

      let getdata = await getresponse.json();
      console.log(getdata);
      while (getdata["state"] !== "FINISHED" && progress < 100) {
        let getresponse = await fetch("http://localhost:8080" + jobId, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        getdata = await getresponse.json();
        setProgress(progress + 20);
      }
      setProgress(100);
      console.log(getdata.results[1])
      let counts = getdata.results[1].data;
      console.log(counts)
      const chartData = Object.entries(counts || {}).map(([key, value]) => ({
        register: key,
        value: Number(value) * 100,
      }));
      setChartData(chartData);

      //handleClose();
      //pollStatus(response["Location"]);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(lowcodeBackendEndpoint + "/status");
        const result = await response.json();
        setStatus(result);

        if (result.status === "complete") {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error polling status:", error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);
  };


  const onNodeDragStop = useCallback(


    /**
     * 
     * @param evt {
        id: (nds.length + 1).toString(),
        type: "custom",
        position: { x: Math.random() * 100, y: Math.random() * 100 }, // Random position inside the parent
        data: { label: `Child ${nds.length}` },
        parentNode: parentId, // Link it to the parent
        extent: "parent", // Keeps child within parent bounds
      },
     * @param node 
     * @returns 
     */
    (evt, node) => {
      setHelperLines(null);
      if (node.type === "group") {
        return;
      }
      console.log("onNodeDrag");
      console.log(node);
      let nodeT = nodes[0];
      nodes.forEach((nd) => {
        // Check if there's a group node in the array of nodes on the screen
        if (nd.type === "controlStructureNode" || nd.type === "ifElseNode") {
          //safety check to make sure there's a height and width
          console.log(node);
          console.log(nd.id);
          let intersectionNodes = reactFlowInstance.getIntersectingNodes(node).map((n) => n.id);
          console.log(intersectionNodes)

          // Check if the dragged node is inside the group
          if (intersectionNodes[0] == nd.id) {
            console.log(nd);
            const rec = { height: nd.height, width: nd.width, ...nd.position };

            //Check if dragged node isn't already a child to the group
            if (!node.parentNode) {

              console.log("update node")
              node.parentNode = nd.id;
              // node cannot be moved outside parent
              node.extent = "parent";
              node.expandParent = true;


              node.position = {
                x: node.positionAbsolute.x - nd.position.x,
                y: node.positionAbsolute.y - nd.position.y,
              };

              // Get the main node
              const mainNode = document.querySelector<HTMLDivElement>(
                'div.react-flow__node-controlStructureNode'
              );

              if (mainNode) {
                // Get the first child div (grand-parent where you set width)
                const firstChild = mainNode.querySelector<HTMLDivElement>(
                  'div.grand-parent'
                );

                console.log('Main node:', mainNode);
                console.log('First child (grand-parent):', firstChild);
                if (firstChild) {
                  console.log()


                  // Get the current minWidth from computed styles
                  const currentMinWidth = window.getComputedStyle(firstChild).minWidth;

                  // Parse it into a number
                  const currentMinWidthValue = parseFloat(currentMinWidth);

                  // Add 100 to it
                  const newMinWidth = currentMinWidthValue + 100;

                  // Set it back with "px"
                  firstChild.style.minWidth = `${newMinWidth}px`;

                  console.log(`Updated minWidth to ${newMinWidth}px`);


                }
              } else {
                console.error('Main node not found');
              }


              //nd.style.width = 10;
              console.log(node);
              //intersectionNodes[0].width = 1000;
              nodeT = node;
              updateParent(node.id, nd.id, node.position);


              updateNodeValue(node.id, "position", node.position);
              updateNodeValue(node.id, "scope", "if");
            }
          }
        }
      });
      //setNodes(nodeT);
    }, [nodes]);

  const onDrop = React.useCallback(
    (event: any) => {
      console.log("dropped")
      console.log(reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }));

      handleOnDrop(event, reactFlowWrapper, reactFlowInstance, setNodes);

    },
    [reactFlowInstance, setNodes],
  );



  const flowKey = "example-flow";
  function handleSaveClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }
    console.log("davor");
    const flow = reactFlowInstance.toObject();
    console.log(flow);
    const validMetadata = {
      ...metadata,
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    console.log(validMetadata);
    console.log(metadata);

    const flowWithMetadata = { metadata: validMetadata, ...flow };

    localStorage.setItem(flowKey, JSON.stringify(flowWithMetadata));
    console.log("Flow saved:", flowWithMetadata);
    // Create a downloadable JSON file
    const jsonBlob = new Blob([JSON.stringify(flowWithMetadata, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${validMetadata.name.replace(/\s+/g, "_")}_${validMetadata.id}.json`; // Use metadata for file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }
  function handleMetadataUpdate(updatedMetadata: any) {
    setMetadata(updatedMetadata);
  }

  function handleRestoreClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (!file) {
        console.warn("No file selected.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const flow = JSON.parse(e.target?.result as string);

          console.log("Restoring flow:", flow);

          if (flow.edges) {
            reactFlowInstance.setEdges(flow.edges || []);
            console.log("Edges restored.");
          }

          if (flow.nodes) {
            reactFlowInstance.setNodes(
              flow.nodes.map((node: Node) => ({
                ...node,
                data: {
                  ...node.data,
                },
              }))
            );
            console.log("Nodes restored.");
          }

          const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
          reactFlowInstance.setViewport({ x, y, zoom });

          if (flow.metadata) {
            setMetadata(flow.metadata);
            console.log("Metadata restored:", flow.metadata);
          }
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert("Invalid JSON file. Please ensure it is a valid flow file.");
        }
      };

      reader.onerror = (err) => {
        console.error("Error reading file:", err);
        alert("Failed to read file. Please try again.");
      };

      reader.readAsText(file);
    };

    fileInput.click();
  }

  useKeyBindings({ undo, redo });

  const handleClick = React.useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Prevent the default action (if any)
      event.preventDefault();

      // Set the selected node
      setSelectedNode(node);

      // Get the bounding rectangle of the ReactFlow pane to position the menu
      const pane = ref.current?.getBoundingClientRect();

      // Calculate the position of the context menu relative to the node
      // Here we add an offset (e.g., 10px) to position the menu next to the node.
      const menuTop = node.position.y + 10; // 10px below the node
      const menuLeft = node.position.x + 10; // 10px to the right of the node

      // Ensure the menu stays within the visible area of the pane
      const top =
        menuTop < (pane?.height || 0) - 200
          ? menuTop
          : (pane?.height || 0) - 200;
      const left =
        menuLeft < (pane?.width || 0) - 200
          ? menuLeft
          : (pane?.width || 0) - 200;

      // Set the position of the context menu
      setMenu({
        id: node.id,
        top,
        left,
        right: 0, // Not needed here since we use `left`
        bottom: 0, // Not needed here since we use `top`
      });
    },
    [setMenu, setSelectedNode],
  );

  const [isModalOpen, setIsModalOpen] = useState(true);

  //const handleLoadJson = () => {
  //setIsModalOpen(true);
  //loadFlow(initialDiagram);
  //};

  //const confirmLoadJson = () => {
  // setIsModalOpen(false);
  //loadFlow(initialDiagram);
  //};


  //const handleLoadJson = () => {
  //if (
  //window.confirm(
  //"Are you sure you want to create a new model? This will overwrite the current flow."
  //)
  //) {
  // Load the initialDiagram after confirmation
  //loadFlow(initialDiagram);
  //}
  //};
  // Function to load the flow
  const loadFlow = (flow: any) => {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }

    if (flow.initialEdges) {
      reactFlowInstance.setEdges(flow.initialEdges);
      console.log("Edges loaded.");
    }

    if (flow.initialNodes) {
      reactFlowInstance.setNodes(flow.initialNodes);
      console.log("Nodes loaded.");
    }

    // Reset the viewport (optional based on your use case)
    const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
    reactFlowInstance.setViewport({ x, y, zoom });

    // Set the metadata (if any) - assuming initialDiagram has metadata
    if (flow.metadata) {
      setMetadata(flow.metadata);
      console.log("Metadata loaded:", flow.metadata);
    }
  };

  const overlappingNodeRef = useRef<Node | null>(null);

  const onNodeDrag = React.useCallback((event: React.MouseEvent, node: Node, nodes: Node[]) => {
    console.log(reactFlowInstance.getNodes())
    const currentNodes = reactFlowInstance.getNodes();
    console.log(node.position.x);
    console.log(helperLines)
    console.log(event.clientX)

    let verticalLine = null;
    let horizontalLine = null;

    console.log(verticalLine);
    console.log(horizontalLine)
    const bounds = getNodesBounds(currentNodes);
    console.log(bounds);
    const { x, y, zoom } = reactFlowInstance.getViewport();
    console.log(x);
    console.log(y);
    const snapThreshold = 0; // Adjust threshold for snapping
    console.log(ref.current?.getBoundingClientRect())
    const boundingRect = ref.current?.getBoundingClientRect()
    const cneter = reactFlowInstance.screenToFlowPosition({
      x: boundingRect.x + boundingRect.width,
      y: boundingRect.y + boundingRect.height
    })
    console.log(cneter)
    const screenY = reactFlowInstance.flowToScreenPosition({ x: node.position.x, y: node.position.y });
    console.log(screenY);
    console.log(reactFlowInstance.getZoom())

    // Find closest nodes for alignment
    currentNodes.forEach((otherNode) => {
      if (otherNode.id === node.id) return;

      // Check for horizontal alignment
      if (Math.abs(node.position.y - otherNode.position.y) === snapThreshold) {
        console.log("horizontalLine")
        const screen = reactFlowInstance.flowToScreenPosition({ x: node.position.x, y: node.position.y });
        console.log(screen);
        horizontalLine = screen.y - 70;
      }
    });

    // Only update helperLines if there's alignment
    if (verticalLine !== null) {
      setHelperLines({
        x: verticalLine,
        y: null
      });
    }
    if (horizontalLine !== null) {

      setHelperLines({
        x: null,
        y: horizontalLine
      });
    }
    if (horizontalLine === null && verticalLine === null) {

      setHelperLines({
        x: null,
        y: null
      });
    }
    console.log(helperLines)
    console.log(node.position.x)


    //findGuidelines(node);
    console.log(reactFlowInstance)
    const intersections = reactFlowInstance.getIntersectingNodes(node).map((n) => n.id);
    console.log(intersections)
    //updateNodeValue(node.id, "parentNode", intersections)
    console.log("trest")
    console.log(intersections)
    console.log(nodes);
    let oldPosition = node.position;
    currentNodes.forEach((nd) => {
      console.log("check")
      console.log(nd.id);
      console.log(node.id);
      console.log(node.parentNode)
      if (node.parentNode && nd.id !== node.id) {
        console.log("parent nicht nzkk")
        const relativeX = node.positionAbsolute.x - nd.position.x;
        const relativeY = node.positionAbsolute.y - nd.position.y;
        console.warn("Hier drin")

        const isForbidden = node.data?.scope === "if" && relativeY > nd.height / 2;

        if (isForbidden) {
          const maxY = relativeY > nd.height / 2;
          //node.position.y = relativeY ;
        
          console.warn("Cannot drop node in the right half due to 'if' constraint.");
          return;
          
        }
      }
    })
  }
    , [reactFlowInstance, helperLines, nodes]);

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setSelectedNode(null);
    console.log("reset");
  }, [setMenu, setSelectedNode]);

  const handleOpenConfig = () => setIsConfigOpen(true);

  const handleCloseConfig = () => setIsConfigOpen(false);
  const handleSaveConfig = (config: {
    patternRepo: string;
    solutionRepo: string;
    backendURL: string;
  }) => {
    console.log("Configuration Saved:", config);
  };

  const handleSaveAsSVG = () => {
    if (ref.current === null) {
      console.error("React Flow container reference is null.");
      return;
    }

    toSvg(ref.current, {
      filter: (node) =>
        !node?.classList?.contains("react-flow__minimap") &&
        !node?.classList?.contains("react-flow__controls"),
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute("download", "reactflow-diagram.svg");
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .catch((err) => console.error("Error exporting SVG:", err));
  };

  return (
    <ReactFlowProvider>
      <div className="toolbar-container">
        <Toolbar
          onSave={handleSaveClick}
          onRestore={handleRestoreClick}
          onSaveAsSVG={handleSaveAsSVG}
          onOpenConfig={handleOpenConfig}
          onLoadJson={handleLoadJson}
          sendToBackend={sendToBackend}
          sendToQunicorn={sendToQunicorn}
        />
      </div>
      <Modal title={"New Diagram"} open={isLoadJsonModalOpen} onClose={cancelLoadJson} footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={confirmLoadJson}>Yes</button>
          <button className="btn btn-secondary" onClick={cancelLoadJson}>Cancel</button>
        </div>
      }>
        <div>
          <p>Are you sure you want to create a new model? This will overwrite the current flow.</p>
        </div>
      </Modal>
      <Modal title={"Send Request"} open={modalOpen} onClose={() => setModalOpen(false)}>
        <div>
          <h2>Processing</h2>
          {loading ? <p>Loading...</p> : <p>Status: {status?.status || "Unknown"}</p>}
        </div>
      </Modal>
      <Modal title={"Configuration"} open={isConfigOpen} onClose={() => { handleCancel() }} footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={() => { handleSave() }}>Save</button>
          <button className="btn btn-secondary" onClick={() => { handleCancel() }}>Cancel</button>
        </div>
      }>
        <div>
          <h3 className="labels">NISQ Analyzer</h3>
          <table className="config-table">
            <tbody>
              <tr>
                <td align="right">NISQ Analyzer Endpoint:</td>
                <td align="left">
                  <input
                    className="qwm-input"
                    type="text"
                    value={tempNisqAnalyzerEndpoint}
                    onChange={(event) => setTempNisqAnalyzerEndpoint(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="labels">Qunicorn</h3>
          <table className="config-table">
            <tbody>
              <tr>
                <td align="right">Qunicorn Endpoint:</td>
                <td align="left">
                  <input
                    className="qwm-input"
                    type="text"
                    value={tempQunicornEndpoint}
                    onChange={(event) => setTempQunicornEndpoint(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="labels">Low-Code Backend:</h3>
          <table className="config-table">
            <tbody>
              <tr>
                <td align="right">Low-Code Backend Endpoint:</td>
                <td align="left">
                  <input
                    className="qwm-input"
                    type="text"
                    value={tempLowcodeBackendEndpoint}
                    onChange={(event) => setTempLowcodeBackendEndpoint(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
      <Modal
        title={"Qunicorn Deployment (1/2)"}
        open={modalStep === 1}
        onClose={handleClose}
        footer={
          <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={() => { handleClose() }}>Deploy</button>
            <button className="btn btn-secondary" onClick={() => { setModalStep(0) }}>Cancel</button>
          </div>
        }
      >
        <div>
          In the first step, the QASM of the model is deployed to Qunicorn.
          Qunicorn serves as a unification layer to allow the unified execution across hetegerogeneous quantum cloud offerings such as IBM and AWS.
        </div>
      </Modal>

      <Modal
        title={"Qunicorn Deployment (2/2)"}
        open={modalStep === 2}
        onClose={() => setModalStep(0)}
        footer={
          <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={() => { sendToQunicorn2(); handleClose(); }}>Create</button>
            <button className="btn btn-secondary" onClick={() => { setModalStep(0) }}>Cancel</button>
          </div>
        }
      >
        <div>
          In the next step, a job is created which can be executed on a quantum device.
        </div>
      </Modal>

      <Modal
        title={"Qunicorn Result"}
        open={modalStep === 3}
        onClose={() => setModalStep(0)}
        footer={
          <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={() => { sendToQunicorn3() }}>Execute</button>
            <button className="btn btn-secondary" onClick={() => { setModalStep(0) }}>Cancel</button>
          </div>
        }
      >

        <div>
          The job is executed on the aer_qasm_simulator with 1024 shots.

          {chartData && progress === 100 && <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="register" label={{ value: "Register", position: "insideBottom", offset: 5 }} />
              <YAxis domain={[0, 100]} label={{
                value: "Probabilities",
                angle: -90,
                offset: 20,
              }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>}
          <div style={{ marginTop: "20px" }}>
            <progress value={progress} max={100} style={{ width: "100%" }} />
            <p>{progress}%</p>
          </div>
        </div>

      </Modal>

      <main className="flex flex-col lg:flex-row h-[calc(100vh_-_60px)]  overflow-hidden">
        <div className="relative flex h-[calc(100vh_-_60px)]  border-gray-200 border">
          <div
            className={`transition-all duration-300 ${isPaletteOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >
            {isPaletteOpen && <Palette />}
          </div>


        </div>


        <div
          className="h-[calc(100vh_-_60px)] flex-grow"
          ref={reactFlowWrapper}
        >
          <ReactFlow
            ref={ref}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(event: React.MouseEvent, node: Node) => {
              handleClick(event, node);
            }}
            onConnectEnd={onConnectEnd}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            fitView
            fitViewOptions={{ maxZoom: 1 }}
            onInit={setReactFlowInstance}
            snapToGrid={true}
            nodeTypes={nodesConfig.nodeTypes}
            edgeTypes={nodesConfig.edgesTypes}
          >{helperLines && (
            <>
              {helperLines.x !== null && (
                <div
                  style={{
                    position: "absolute",
                    left: helperLines.x,
                    top: 0,
                    height: "100%",
                    width: "1px",
                    background: "red",
                    pointerEvents: "none"
                  }}
                />
              )}
              {helperLines.y !== null && (
                <div
                  style={{
                    position: "absolute",
                    top: helperLines.y, //(ref.current?.scrollTop || 0),
                    left: 0,
                    width: "100%",
                    height: "1px",
                    background: "red",
                    pointerEvents: "none"
                  }}
                />
              )}
            </>
          )}
            <Controls />
             <Panel position="top-left" className="p-2">
      <button
    onClick={() => setAncillaModelingOn((prev) => !prev)}
    className={`px-3 py-1 rounded text-white ${
      ancillaModelingOn ? "bg-blue-600" : "bg-gray-400"
    }`}
  >
    Ancilla Modeling: {ancillaModelingOn ? "On" : "Off"}
  </button>
    </Panel>


            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            <MiniMap zoomable={true} pannable={true} />
          </ReactFlow>
        </div>

        <div className="relative flex bg-gray-100 h-[calc(100vh_-_60px)]  border-gray-200 border">

          <div
            className={`transition-all duration-300 ${isPanelOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >
            {isPanelOpen && <CustomPanel metadata={metadata} onUpdateMetadata={setMetadata} />}
          </div>
        </div>

      </main>
    </ReactFlowProvider>
  );
}

export default App;
