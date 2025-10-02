import React, { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  ReactFlowProvider,
  MiniMap,
  getNodesBounds,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomPanel, Palette } from "./components";
import Toolbar from "./components/toolbar";
import { nodesConfig, tutorial } from "./config/site";
import { useStore } from "./config/store";
import { useShallow } from "zustand/react/shallow";
import { handleDragOver, handleOnDrop } from "./lib/utils";
import useKeyBindings from "./hooks/useKeyBindings";
import { toSvg } from "html-to-image";
import { initialDiagram } from "./config/site";
import Modal, { NewDiagramModal } from "./Modal";
import './index.css';
import { Placement } from 'react-joyride';
import { startCompile } from "./backend";
import { ancillaConstructColor, classicalConstructColor, ClassicalOperatorNode, controlFlowConstructColor, quantumConstructColor } from "./constants";
import Joyride from 'react-joyride';
import { ConfigModal } from "./components/modals/configModal";
import { QunicornModal } from "./components/modals/qunicornModal";
import { SendRequestModal } from "./components/modals/backendModal";
import { Toast } from "./components/modals/toast";

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

  const [patternAtlasApiEndpoint, setPatternAtlasApiEndpoint] = useState(import.meta.env.VITE_PATTERN_ATLAS_API);
  const [patternAtlasUiEndpoint, setPatternAtlasUiEndpoint] = useState(import.meta.env.VITE_PATTERN_ATLAS_UI);
  const [qcAtlasEndpoint, setQcAtlasEndpoint] = useState(import.meta.env.VITE_QC_ATLAS);
  const [tempPatternAtlasApiEndpoint, setTempPatternAtlasApiEndpoint] = useState(patternAtlasApiEndpoint);
  const [tempPatternAtlasUiEndpoint, setTempPatternAtlasUiEndpoint] = useState(patternAtlasUiEndpoint);
  const [tempQcAtlasEndpoint, setTempQcAtlasEndpoint] = useState(qcAtlasEndpoint);

  const [activeTab, setActiveTab] = useState("editor");
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
  const [executed, setAlreadyExecuted] = useState(false);
  const [jobId, setJobId] = useState(null);


  const togglePalette = () => {
    setIsPaletteOpen((prev) => !prev);
  };

  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };
  const handleLoadJson = () => {
    if (nodes.length > 0) {
      setIsLoadJsonModalOpen(true);
    }
  };

  const confirmNewDiagram = () => {
    setIsLoadJsonModalOpen(false);
    loadFlow(initialDiagram);
  };

  const handleSave = (newValues) => {
    setTempNisqAnalyzerEndpoint(newValues.tempNisqAnalyzerEndpoint);
    setTempQunicornEndpoint(newValues.tempQunicornEndpoint);
    setTempLowcodeBackendEndpoint(newValues.tempLowcodeBackendEndpoint);
    setTempPatternAtlasUiEndpoint(newValues.tempPatternAtlasUiEndpoint);
    setTempPatternAtlasApiEndpoint(newValues.tempPatternAtlasApiEndpoint);
    setTempQcAtlasEndpoint(newValues.tempQcAtlasEndpoint);
    setTempGithubRepositoryOwner(newValues.tempGithubRepositoryOwner);
    setTempGithubRepositoryName(newValues.tempGithubRepositoryName);
    setTempGithubBranch(newValues.tempGithubBranch);
    setTempGithubToken(newValues.tempGithubToken);

    setIsConfigOpen(false);
  };


  const handleCancel = () => {
    setTempNisqAnalyzerEndpoint(nisqAnalyzerEndpoint);
    setTempQunicornEndpoint(qunicornEndpoint);
    setTempLowcodeBackendEndpoint(lowcodeBackendEndpoint);
    setIsConfigOpen(false);
    setTempPatternAtlasApiEndpoint(patternAtlasApiEndpoint);
    setTempPatternAtlasUiEndpoint(patternAtlasUiEndpoint);
    setTempQcAtlasEndpoint(qcAtlasEndpoint);
  };


  const cancelLoadJson = () => {
    setIsLoadJsonModalOpen(false);
  };
  const [helperLines, setHelperLines] = useState(null);
  const [deploymentId, setDeploymentId] = useState(null);

  const [expanded, setExpanded] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("Beginner");
  const [completionGuaranteed, setCompletionGuaranteed] = useState("Yes");


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
  const [modalStep, setModalStep] = useState(1);
  const [isQunicornOpen, setIsQunicornOpen] = useState(false);
  const [loadingQunicorn, setLoadingQunicorn] = useState(true);
  const [statusQunicorn, setStatusQunicorn] = useState(null);
  const [ancillaModelingOn, setAncillaModelingOn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

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
        target: '.ancilla-button',
        content: 'This button enables or disables ancilla modeling.',
        placement: "right"
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

  const [isProcessingModalOpen, setProcessingModalOpen] = useState(false);

  // TODO: Change here to workflow
  const [compilationTarget, setCompilationTarget] = useState("qasm");
  const handleClose = () => {
    // reset all values
    setIsQunicornOpen(false);
    setModalStep(1);
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
    setAlreadyExecuted(false);
  };


  const prepareBackendRequest = () => {
    setModalOpen(true);
  }
  const sendToBackend = async () => {
    setLoading(true);
    setModalOpen(false);
    setProcessingModalOpen(true);

    try {
      const validMetadata = {
        ...metadata,
        id: `flow-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      console.log(validMetadata);
      console.log(metadata);

      const flow = reactFlowInstance.toObject();

      const response = await startCompile(
        lowcodeBackendEndpoint,
        metadata,
        reactFlowInstance.getNodes(),
        reactFlowInstance.getEdges(),
        compilationTarget
      );

      const jsonData = await response.json();
      const uuid = jsonData["uuid"];
      let location = jsonData["result"];
      const statusUrl = `${tempLowcodeBackendEndpoint}/status/${uuid}`;

      console.log("Initial compile response:", jsonData);

      // Polling function returns a Promise
      const pollStatus = () => {
        return new Promise<void>((resolve, reject) => {
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

      // TODO: change for workflow
      // TODO: add modals for service deployment
      // TODO: add QRMS upload
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
  const handleDeploy = async () => {
    setIsQunicornOpen(true);
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
      setModalStep(2);
      //pollStatus(response["Location"]);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };


  const handleCreateJob = async () => {
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
        setModalStep(3);
      }
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const handleJobExecute = async () => {
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
      setTimeout(() => {
        setProgress(50);
      }, 1000);
      setTimeout(() => {
        setProgress(100);
        setAlreadyExecuted(true);
        console.log(getdata.results[1])
        let counts = getdata.results[1].data;
        console.log(counts)
        const chartData = Object.entries(counts || {}).map(([key, value]) => ({
          register: key,
          value: Number(value) * 100,
        }));
        setChartData(chartData);
      }, 2000);
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

  async function uploadToGitHub() {
    let flowId = `model-${Date.now()}`;
    const repoOwner = tempGithubRepositoryOwner;
    const repo = tempGithubRepositoryName;
    const branch = tempGithubBranch;
    const token = tempGithubToken;

    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repo}/contents/${flowId}`;
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
        return { success: false };
      }
    } catch (error) {
      console.error("Error checking file existence:", error);
      showToast("Upload failed. Credentials or repository fields incorrect.", "error");
      return { success: false };
    }

    let fileContent = JSON.stringify({
      metadata: {
        ...metadata,
        id: flowId,
        timestamp: new Date().toISOString(),
      },
      flow: reactFlowInstance.toObject(),
    }, null, 2);

    const payload: any = {
      message: `Upload ${flowId} from quantum low-code modeler`,
      content: btoa(fileContent),
      branch: branch,
    };

    if (sha) {
      payload.sha = sha;
    }

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
        console.log(`File ${flowId} uploaded to GitHub successfully.`);
        showToast("Model with id " + flowId + " uploaded successfully!", "success");
        return { success: true };
      } else {
        const errorData = await uploadResponse.json();
        showToast("Upload failed. Check console.", "error");
        console.error("GitHub upload failed:", errorData);
        return { success: false };
      }
    } catch (error) {
      console.error("Error uploading to GitHub:", error);
      return { success: false };
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
      await uploadToGitHub();
    }
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

  const handleSaveAsSVG = () => {
    if (ref.current === null) {
      console.error("React Flow container reference is null.");
      return;
    }

    toSvg(ref.current, {
      filter: (node) => {
        if (!node) return false;
        if (node.classList?.contains("react-flow__minimap")) return false;
        if (node.classList?.contains("react-flow__controls")) return false;
        if (node.classList?.contains("react-flow__panel")) return false;
        if (typeof node.className === "string" && node.className.includes("react-flow__panel")) return false;

        return true;
      }
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
          if (type === 'step:before' && index === 3) {
            startTour2();

          }
          if (type === 'step:after' && index === 5) {
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
          uploadDiagram={() => uploadToGitHub()}
          onLoadJson={handleLoadJson}
          sendToBackend={prepareBackendRequest}
          sendToQunicorn={() => setIsQunicornOpen(true)}
          startTour={() => { startTour(); }}
        />
      </div>
      {<NewDiagramModal open={isLoadJsonModalOpen} onClose={cancelLoadJson} onConfirm={confirmNewDiagram} />}

      <SendRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        compilationTarget={compilationTarget}
        setCompilationTarget={setCompilationTarget}
        sendToBackend={sendToBackend}
      />

      <Modal
        title={"Processing"}
        open={isProcessingModalOpen}
        onClose={() => setProcessingModalOpen(false)}
      >
        <div>
          <h2>Processing</h2>
          {loading ? <p>Loading...</p> : <p>Status: {status || "Unknown"}</p>}
        </div>
      </Modal>

      <ConfigModal
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}

        tempNisqAnalyzerEndpoint={tempNisqAnalyzerEndpoint}
        tempQunicornEndpoint={tempQunicornEndpoint}
        tempLowcodeBackendEndpoint={tempLowcodeBackendEndpoint}
        tempPatternAtlasUiEndpoint={tempPatternAtlasUiEndpoint}
        tempPatternAtlasApiEndpoint={tempPatternAtlasApiEndpoint}
        tempQcAtlasEndpoint={tempQcAtlasEndpoint}
        tempGithubRepositoryOwner={tempGithubRepositoryOwner}
        tempGithubRepositoryName={tempGithubRepositoryName}
        tempGithubBranch={tempGithubBranch}
        tempGithubToken={tempGithubToken}
      />

      <QunicornModal
        open={isQunicornOpen}
        step={modalStep}
        executed={executed}
        onClose={handleClose}
        onStep1Deploy={handleDeploy}
        onStep2CreateJob={handleCreateJob}
        onStep3Execute={handleJobExecute}
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        provider={provider}
        setProvider={setProvider}
        numShots={numShots}
        setNumShots={setNumShots}
        accessToken={accessToken}
        setAccessToken={setAccessToken}
        errorMessage={errorMessage}
        progress={progress}
        chartData={chartData}
      />

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

            <Panel position="top-left" className="p-2 z-50">
              <div className="w-70">
                <div
                  onClick={() => setExpanded(!expanded)}
                  className={`cursor-pointer px-4 py-2 rounded text-white transition-all duration-300 flex justify-between items-center ${expanded ? "bg-blue-600" : "bg-gray-400"
                    }`}
                >
                  <span>Experience Mode</span>
                  <div className="flex items-center space-x-2">
                    <span className={`transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}>
                      ▼
                    </span>
                  </div>
                </div>

                <div
                  className={`origin-top transition-all duration-300 overflow-hidden ${expanded ? "max-h-96 opacity-100 scale-y-100 mt-2" : "max-h-0 opacity-0 scale-y-0"
                    } bg-gray-100 rounded p-4`}
                  style={{ transformOrigin: "top" }}
                >

                  <table className="config-table">
                    <tbody>
                      <tr>
                        <td align="right">Ancilla Modeling</td>
                        <td align="left">
                          <button
                            onClick={() => setAncillaModelingOn(!ancillaModelingOn)}
                            className={`px-2 py-1 rounded text-white ${ancillaModelingOn ? "bg-blue-600" : "bg-gray-400"
                              }`}
                          >{ancillaModelingOn ? "On" : "Off"}
                          </button>

                        </td>
                      </tr>
                      <tr>
                        <td align="right">Experience Level</td>
                        <td align="left">
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="mt-1 px-2 py-1 border rounded"
                          >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Expert</option>
                          </select>
                        </td>
                        </tr>
                        <tr>
                        <td align="right">Completion Guaranteed</td>
                        <td align="left">
                          <select
                            value={completionGuaranteed}
                            onChange={(e) => setCompletionGuaranteed(e.target.value)}
                            className="px-2 py-1 border rounded"
                          >
                            <option>Yes</option>
                            <option>No</option>
                          </select>
                        </td>
                        </tr>
                  
                    </tbody>
                  </table>

                </div>


              </div>
            </Panel>



            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}

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
