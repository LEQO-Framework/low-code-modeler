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
  MiniMapNodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomPanel, Palette } from "./components";
import Toolbar from "./components/toolbar";
import { nodesConfig, tutorial } from "./config/site";
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
import { Placement } from 'react-joyride';
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
import { ancillaConstructColor, classicalConstructColor, ClassicalOperatorNode, controlFlowConstructColor, quantumConstructColor } from "./constants";
import Joyride from 'react-joyride';



const selector = (state: {
  nodes: Node[];
  edges: Edge[];
  ancillaMode: boolean;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onConnectEnd: any;
  setSelectedNode: (node: Node | null) => void;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  updateChildren: (nodeId: string, children: any) => void;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  setAncillaMode: (ancillaMode: boolean) => void;
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
  updateChildren: state.updateChildren,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setAncillaMode: state.setAncillaMode,
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

  const [activeTab, setActiveTab] = useState("endpoints");
  const [tempNisqAnalyzerEndpoint, setTempNisqAnalyzerEndpoint] = useState(nisqAnalyzerEndpoint);
  const [tempQunicornEndpoint, setTempQunicornEndpoint] = useState(qunicornEndpoint);
  const [tempLowcodeBackendEndpoint, setTempLowcodeBackendEndpoint] = useState(lowcodeBackendEndpoint);
  const [tempGithubRepositoryOwner, setTempGithubRepositoryOwner] = useState("");
  const [tempGithubRepositoryName, setTempGithubRepositoryName] = useState("");
  const [tempGithubBranch, setTempGithubBranch] = useState("");
  const [tempGithubToken, setTempGithubToken] = useState("");
  const [openqasmCode, setOpenQASMCode] = useState("");

  const [selectedDevice, setSelectedDevice] = useState("");
  const [provider, setProvider] = useState("");

  const [numShots, setNumShots] = useState(1024);
  const [accessToken, setAccessToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorJobMessage, setErrorJobMessage] = useState("");


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

  const confirmNewDiagram = () => {
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
    setAncillaMode,
    setSelectedNode,
    setNodes,
    updateNodeValue,
    updateParent,
    updateChildren,
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
  const [status, setStatus] = useState("");
  const [modalStep, setModalStep] = useState(0);
  const [loadingQunicorn, setLoadingQunicorn] = useState(true);
  const [statusQunicorn, setStatusQunicorn] = useState(null);
  const [ancillaModelingOn, setAncillaModelingOn] = useState(false);

  const [runTour, setRunTour] = useState(false);
  const [joyrideStepId, setJoyRideStepId] = useState(0);
  const joyrideSteps: {
    target: string;
    content: string;
    placement?: Placement;
  }[] = [
      {
        target: '.toolbar-container',
        content: 'This is the toolbar where you can save, restore, or send your diagrams.',
      },
      {
        target: '.palette-container',
        content: 'This is the palette, where you can drag and drop blocks. Quantum blocks are depicted in blue and classical blocks are depicted in orange.',
        placement: "right"
      },
      {
        target: '.react-flow__pane',
        content: 'This is the main diagram canvas.',
        placement: "top-start"
      },
      {
        target: '.grand-parent',
        content: 'This is a state preparation block which requires one classical value and outputs a quantum state.',

      },
      {
        target: '.currentPanel-container',
        content: 'This is the properties panel where you can configure properties of blocks.',
        placement: "left"
      }
    ];

  const handleClose = () => {
    if (modalStep < 3) {
      setModalStep(modalStep + 1);
    } else {

      // reset all values
      setModalStep(0);
      setChartData(null);
      setErrorMessage("");
      setErrorJobMessage("");
      setJobId(null);
      setDeploymentId(null);
      setProgress(0);
      setSelectedDevice("");
      setProvider("");
      setNumShots(1024);
      setAccessToken("");

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

      const response = await startCompile(
        lowcodeBackendEndpoint,
        metadata,
        reactFlowInstance.getNodes(),
        reactFlowInstance.getEdges()
      );

      const jsonData = await response.json();
      const uuid = jsonData["uuid"];
      let location = jsonData["result"];
      const statusUrl = `${tempLowcodeBackendEndpoint}/status/${uuid}`;

      console.log("Initial compile response:", jsonData);

      // Polling function returns a Promise
      const pollStatus = () => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 20;
          const delay = 10000;

          const check = async () => {
            try {
              const statusResponse = await fetch(statusUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              });

              if (!statusResponse.ok) {
                console.error("Status check failed:", statusResponse.status);
                return reject("Status check failed");
              }

              const statusData = await statusResponse.json();
              console.log("Current status:", statusData.status);
              setStatus(statusData.status);
              location = statusData["result"];

              if (statusData.status === "completed") {
                console.log("Operation completed successfully.");
                return resolve();
              }

              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(check, delay);
              } else {
                console.error("Max polling attempts reached. Operation did not complete.");
                reject("Max polling attempts reached");
              }
            } catch (error) {
              console.error("Error while polling status:", error);
              reject(error);
            }
          };

          check();
        });
      };

      // Wait for polling to complete
      await pollStatus();

      console.log("Fetching final result from:", location);

      const result = await fetch(location, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const openqasmCode = await result.text();
      console.log("Received OpenQASM code:", openqasmCode);

      setOpenQASMCode(openqasmCode);
      setStatus("completed");
      setLoading(false);

    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const startTour2 = () => {
    setRunTour(true);
    setAncillaMode(false);
    console.log("load tutorial")
    loadFlow(tutorial);
    console.log("load toturial")
  }

  const startTour = () => {
    setRunTour(true);
    setAncillaMode(false);
    console.log("load tutorial")
    console.log("load toturial")
  }
  const sendToQunicorn = async () => {
    setModalStep(1);
    setLoading(true);


    try {
      let program = {
        "programs": [
          {
            //"quantumCircuit": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncreg meas[2];\nh q[0];\ncx q[0],q[1];\nbarrier q[0],q[1];\nmeasure q[0] -> meas[0];\nmeasure q[1] -> meas[1];",
            "quantumCircuit": openqasmCode,
            //"quantumCircuit": "OPENQASM 2.0;include 'qelib1.inc';qreg q[6];creg c[6];gate oracle(q0, q1, q2, q3, q4, q5) {    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;}gate diffusion(q0, q1, q2, q3, q4, q5) {    h q0;    h q1;    h q2;    h q3;    h q4;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q0;    h q1;    h q2;    h q3;    h q4;    h q5;}h q[0];h q[1];h q[2];h q[3];h q[4];h q[5];oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);measure q[0] -> c[0];measure q[1] -> c[1];measure q[2] -> c[2];measure q[3] -> c[3];measure q[4] -> c[4];measure q[5] -> c[5];",

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
        "providerName": provider,
        "deviceName": selectedDevice,
        "shots": numShots,
        "errorMitigation": "none",
        "cutToWidth": null,
        "token": accessToken,
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
      if (data["code"] === 500) {
        setErrorJobMessage(data["message"]);
      } else {
        setJobId(data["self"]);
      }
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
    setErrorMessage(null);

    try {

      const url = `http://localhost:8080/${jobId.startsWith('/') ? jobId.slice(1) : jobId}`;

      let getdata = null;

      // Initial fetch
      let getresponse = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!getresponse.ok) {
        throw new Error(`Request failed with status ${getresponse.status}`);
      }

      getdata = await getresponse.json();
      setProgress(5);

      if (getdata.state === "ERROR") {
        setErrorMessage("Job encountered an error.");
        setLoading(false);
        setProgress(0);
        return;
      }

      let tries = 0;
      const maxTries = 20;

      while (getdata.state !== "FINISHED" && getdata.state !== "ERROR" && tries < maxTries) {
        tries++;

        await new Promise((r) => setTimeout(r, 10000));

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        getdata = await response.json();

        if (getdata.state === "ERROR") {
          setErrorMessage("Job encountered an error.");
          setLoading(false);
          setProgress(0);
          return;
        }

        setProgress(Math.min(((tries / maxTries) * 100), 100));
      }

      if (getdata.state !== "FINISHED") {
        setErrorMessage("Job did not finish in time.");
        setLoading(false);
        setProgress(0);
        return;
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
        if ((nd.type === "controlStructureNode" || nd.type === "ifElseNode") && node.type !== "controlStructureNode" && node.type !== "ifElseNode") {
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

                  // Get the current minWidth from computed styles
                  const currentHeight = window.getComputedStyle(firstChild).height;
                  // Parse it into a number
                  const currentMinWidthValue = parseFloat(currentMinWidth);
                  // Add 100 to it
                  const newMinWidth = currentMinWidthValue + 100;

                  // Parse it into a number
                  const currentHeightValue = parseFloat(currentHeight);
                  console.log(currentHeightValue);
                  console.log(node.height)

                  const newHeight = node.height + 200 > currentHeightValue ? currentHeightValue + 100 : currentHeightValue + 100;

                  // Set it back with "px"
                  firstChild.style.minWidth = `${newMinWidth}px`;
                  firstChild.style.height = `${newHeight}px`;
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
              updateChildren(node.parentNode, node.id);
              //updateNodeValue(node.id, "hidden", "true")
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

  async function uploadToGitHub(filename, fileContent) {
    const repoOwner = tempGithubRepositoryOwner;
    const repo = tempGithubRepositoryName;
    const branch = tempGithubBranch;
    const token = tempGithubToken;

    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repo}/contents/${filename}`;

    let sha = null;

    try {
      const getResponse = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (getResponse.ok) {
        const existingFile = await getResponse.json();
        sha = existingFile.sha;
        console.log("File exists, will update.");
      } else if (getResponse.status === 404) {
        console.log("File does not exist, will create new file.");
      } else {
        const errorData = await getResponse.json();
        console.error("Failed to check file existence:", errorData);
        return;
      }
    } catch (error) {
      console.error("Error checking file existence:", error);
      return;
    }

    const payload: any = {
      message: `Upload ${filename} from quantum low-code modeler`,
      content: btoa(fileContent),
      branch: branch,
    };

    if (sha) {
      payload.sha = sha;
    }

    // Upload the file
    try {
      const uploadResponse = await fetch(`${apiUrl}?ref=${branch}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (uploadResponse.ok) {
        console.log(`File ${filename} uploaded to GitHub successfully.`);
      } else {
        const errorData = await uploadResponse.json();
        console.error("GitHub upload failed:", errorData);
      }
    } catch (error) {
      console.error("Error uploading to GitHub:", error);
    }
  }


  async function handleSaveClick(upload) {
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
    const jsonString = JSON.stringify(flowWithMetadata, null, 2);
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${validMetadata.name.replace(/\s+/g, "_")}_${validMetadata.id}.json`; // Use metadata for file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    if (upload) {
      await uploadToGitHub(
        `${validMetadata.name.replace(/\s+/g, "_")}_${validMetadata.id}.json`,
        jsonString
      );
    }
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
          if (flow.edges) {
            reactFlowInstance.setEdges(flow.edges || []);
            console.log("Edges restored.");
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

    },
    [setSelectedNode],
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
    console.log(flow.initialEdges)
    if (flow.initialEdges) {
      reactFlowInstance.setEdges(flow.initialEdges);
      console.log("Edges loaded.");
    }
    console.log(flow.nodes)
    if (flow.nodes) {
      reactFlowInstance.setNodes(
        flow.nodes?.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
          },
        }))
      );
    }
    console.log(nodes);

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
      <Joyride
        steps={joyrideSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        styles={{
          options: {
            primaryColor: '#007bff',
            zIndex: 10000,
          },
        }}
        callback={(data) => {
          const { status, index, type } = data;
          console.log(index)
          if (type === 'step:before' && index === 2) {
            startTour2();

          }
          if (type === 'step:after' && index === 4) {
            loadFlow(initialDiagram);
          }


          if (['finished', 'skipped'].includes(data.status)) {
            setRunTour(false);
            //loadFlow(initialDiagram);
          }
        }}
      />

      <div className="toolbar-container">
        <Toolbar
          onSave={() => handleSaveClick(false)}
          onRestore={handleRestoreClick}
          onSaveAsSVG={handleSaveAsSVG}
          onOpenConfig={handleOpenConfig}
          uploadDiagram={() => handleSaveClick(true)}
          onLoadJson={handleLoadJson}
          sendToBackend={sendToBackend}
          sendToQunicorn={sendToQunicorn}
          startTour={() => { startTour(); }}
        />
      </div>
      {nodes.length > 0 && <Modal title={"New Diagram"} open={isLoadJsonModalOpen} onClose={cancelLoadJson} footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={confirmNewDiagram}>Yes</button>
          <button className="btn btn-secondary" onClick={cancelLoadJson}>Cancel</button>
        </div>
      }>
        <div>
          <p>Are you sure you want to create a new model? This will overwrite the current flow.</p>
        </div>
      </Modal>}
      <Modal title={"Send Request"} open={modalOpen} onClose={() => setModalOpen(false)}>
        <div>
          <h2>Processing</h2>
          {loading ? <p>Loading...</p> : <p>Status: {status || "Unknown"}</p>}
        </div>
      </Modal>
      <Modal
        title={"Configuration"}
        open={isConfigOpen}
        onClose={() => {
          handleCancel();
        }}
        footer={
          <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={() => handleSave()}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={() => handleCancel()}>
              Cancel
            </button>
          </div>
        }
      >
        <div>
          {/* Subtabs */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === "endpoints" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-600"
                }`}
              onClick={() => setActiveTab("endpoints")}
            >
              Endpoints
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "github" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-600"
                }`}
              onClick={() => setActiveTab("github")}
            >
              GitHub
            </button>
          </div>

          {/* Endpoints Tab */}
          {activeTab === "endpoints" && (
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
          )}

          {activeTab === "github" && (
            <div>
              <h3 className="labels">GitHub Settings</h3>
              <table className="config-table">
                <tbody>
                  <tr>
                    <td align="right">GitHub Repository Owner:</td>
                    <td align="left">
                      <input
                        className="qwm-input"
                        type="text"
                        value={tempGithubRepositoryOwner}
                        onChange={(e) => setTempGithubRepositoryOwner(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="right">GitHub Repository Name:</td>
                    <td align="left">
                      <input
                        className="qwm-input"
                        type="text"
                        value={tempGithubRepositoryName}
                        onChange={(e) => setTempGithubRepositoryName(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="right">GitHub Branch:</td>
                    <td align="left">
                      <input
                        className="qwm-input"
                        type="text"
                        value={tempGithubBranch}
                        onChange={(e) => setTempGithubBranch(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="right">GitHub Token:</td>
                    <td align="left">
                      <input
                        className="qwm-input"
                        type="password"
                        value={tempGithubToken}
                        onChange={(e) => setTempGithubToken(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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
        onClose={() => { handleClose(); setModalStep(0) }}
        footer={
          <div className="flex justify-end space-x-2">
            <button
              className={`btn ${selectedDevice.trim() && ['IBM', 'AWS', 'RIGETTI', 'QMWARE'].includes(provider)
                ? 'btn-primary'
                : 'btn-secondary'
                }`}
              onClick={() => {
                if (
                  selectedDevice.trim() &&
                  ['IBM', 'AWS', 'RIGETTI', 'QMWARE'].includes(provider)
                ) {
                  sendToQunicorn2();
                  handleClose();
                }
              }}
            >
              Create
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { handleClose(); setModalStep(0); }}
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p>
            In the next step, a job is created which can be executed on a quantum device.
            Specify here your quantum device, the provider, and the number of shots.
            Furthermore, add here your access token.
          </p>

          <div>
            <label className="block font-medium mb-1">Quantum Device</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              placeholder="aer_simulator"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Provider</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">Select a provider</option>
              <option value="IBM">IBM</option>
              <option value="AWS">AWS</option>
              <option value="RIGETTI">RIGETTI</option>
              <option value="QMWARE">QMWARE</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Number of Shots</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={numShots}
              onChange={(e) => setNumShots(parseInt(e.target.value))}
              placeholder="1024"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Access Token</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Your quantum provider token"
            />
          </div>
        </div>
      </Modal>


      <Modal
        title={"Qunicorn Result"}
        open={modalStep === 3}
        onClose={() => { handleClose(); setModalStep(0) }}
        footer={
          <div className="flex justify-end space-x-2">
            <button className="btn btn-primary" onClick={() => { sendToQunicorn3() }}>Execute</button>
            <button className="btn btn-secondary" onClick={() => { handleClose(); setModalStep(0); }}>Cancel</button>
          </div>
        }
      >

        <div>
          {errorMessage || errorJobMessage ? (
            <p className="text-red-600 font-semibold">{errorMessage || errorJobMessage}</p>
          ) : (
            <p>
              The job is executed on the <strong>{selectedDevice || "unknown device"}</strong> with <strong>{numShots || "N/A"}</strong> shots.
            </p>
          )}

          {chartData && progress === 100 && <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="register" label={{ value: "Register", position: "insideBottom", offset: 5 }} />
              <YAxis
                domain={[0, 100]}
                label={{
                  value: "Probabilities",
                  angle: -90,
                  dx: 0,
                  dy: 30,
                  position: 'insideLeft'
                }}
              />
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

      <main className="flex flex-col lg:flex-row h-[calc(100vh_-_60px)]">
        <div className="relative flex h-[calc(100vh_-_60px)]  border-gray-200 border">
          <div
            className={`transition-all duration-300 ${isPaletteOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >
            {isPaletteOpen && <Palette ancillaMode={ancillaModelingOn} />}
          </div>
          <button
            onClick={togglePalette}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 ${isPaletteOpen ? "right-0" : "hidden"}`}
          >
            {isPaletteOpen ? "←" : "→"}
          </button>

        </div>
        <button
          onClick={togglePalette}
          className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 ${isPaletteOpen ? "hidden" : "-left-0"}`}
        >
          {isPaletteOpen ? "←" : "→"}
        </button>

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
                onClick={() => { setAncillaModelingOn((prev) => !prev); setAncillaMode(!ancillaModelingOn) }}
                className={`px-3 py-1 rounded text-white ${ancillaModelingOn ? "bg-blue-600" : "bg-gray-400"
                  }`}
              >
                Ancilla Modeling: {ancillaModelingOn ? "On" : "Off"}
              </button>
            </Panel>

            <MiniMap
              nodeClassName={(node) => {
                if (node.type === 'dataTypeNode' || node.type === "classicalAlgorithmNode" || node.type === ClassicalOperatorNode) return 'minimap-node-circle';
                if (node.type === 'rounded') return 'minimap-node-rounded';
                return 'minimap-node-default';
              }}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'dataTypeNode':
                  case 'classicalAlgorithmNode':
                  case ClassicalOperatorNode:
                  case 'rounded':
                    return classicalConstructColor;
                  case 'ancillaNode':
                    return ancillaConstructColor;
                  case 'ifElseNode':
                  case 'controlStructureNode':
                    return controlFlowConstructColor;
                  default:
                    return quantumConstructColor
                }
              }}
              nodeComponent={({ className, x, y, width, height, color }) => {
                const borderRadius = className.includes('circle')
                  ? 100
                  : className.includes('rounded')
                    ? 15
                    : 0;

                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={borderRadius}
                    ry={borderRadius}
                    fill={color}
                    stroke="#333"
                  />
                );
              }}
              zoomable={true}
              pannable={true}
            />

            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />


          </ReactFlow>
        </div>

        <div className="relative flex bg-gray-100 h-[calc(100vh_-_60px)]  border-gray-200 border">
          <div
            className={`transition-all duration-300 ${isPanelOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >

            <button
              onClick={togglePanel}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 ${isPanelOpen ? "left-0" : "hidden"}`}
            >
              {isPanelOpen ? "→" : "←"}
            </button>


            {isPanelOpen && <CustomPanel metadata={metadata} onUpdateMetadata={setMetadata} />}
          </div>
        </div>

        <button
          onClick={togglePanel}
          className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 ${isPanelOpen ? "hidden" : "right-0"}`}
        >
          {isPanelOpen ? "→" : "←"}
        </button>
      </main>
    </ReactFlowProvider>
  );
}

export default App;
