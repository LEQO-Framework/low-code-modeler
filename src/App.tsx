import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useUpdateNodeInternals
} from "reactflow";
import "reactflow/dist/style.css";
import { ContextMenu, CustomPanel, Palette } from "./components";
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
import { ancillaConstructColor, classicalConstructColor, ClassicalOperatorNode, controlFlowConstructColor, grover, hadamard_test_imaginary_part, hadamard_test_real_part, qaoa, quantum_types, quantumConstructColor, swap_test, custom_template, TEMPLATE_STORAGE_KEY, templates } from "./constants";
import Joyride from 'react-joyride';
import { ConfigModal } from "./components/modals/configModal";
import { QunicornModal } from "./components/modals/qunicornModal";
import { SendRequestModal } from "./components/modals/backendModal";
import { Toast } from "./components/modals/toast";
import ExperienceModePanel from "./components/modals/experienceLevelModal";
import { HistoryItem, HistoryModal } from "./components/modals/historyModal";
import { ValidationModal } from "./components/modals/validationModal";
import AiModal from "./components/modals/aiModal";
import OpenAI from "openai";
import { grover_algorithm, hadamard_test_imaginary_part_algorithm, hadamard_test_real_part_algorithm, qaoa_algorithm, swap_test_algorithm } from "./constants/templates";
import JSZip, { JSZipObject } from "jszip";
import { createDeploymentModel, createNodeType, createServiceTemplate, updateNodeType, updateServiceTemplate } from "./winery";
import custom from "./components/nodes/custom";
import { categories, CategoryEntry, Template } from "./components/panels/categories";
import { ManageTemplateModal } from "./components/modals/templateModal";
import { v4 as uuid } from "uuid";
import DomainProfileModal, { DomainProfile } from "./components/modals/domainProfileModal";

const selector = (state: {
  nodes: Node[];
  edges: Edge[];
  ancillaMode: boolean;
  experienceLevel: string;
  compact: boolean;
  completionGuaranteed: boolean;
  containsPlaceholder: boolean;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onConnectEnd: any;
  typeError: string | null;
  userTemplates: Template[];
  domainProfile: string;
  allDomainProfiles: DomainProfile[];
  setDomainProfile: (domainProfile: string) => void;
  setTypeError: (message: string | null) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeValue: (nodeId: string, field: string, nodeVal: string) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  updateChildren: (nodeId: string, children: any) => void;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  setAncillaMode: (ancillaMode: boolean) => void;
  setCompact: (compact: boolean) => void;
  setCompletionGuaranteed: (completionGuaranteed: boolean) => void;
  setExperienceLevel: (experienceLevel: string) => void;
  addUserTemplate: (template: Template) => void;
	setUserTemplates: (newTemplates: Template[]) => void;
  setAllDomainProfiles: (newProfiles: DomainProfile[]) => void;
  setContainsPlaceholder: (containsPlaceholder: boolean) => void;
  undo: () => void;
  redo: () => void;
}) => ({
  nodes: state.nodes,
  edges: state.edges,
  experienceLevel: state.experienceLevel,
  compact: state.compact,
  completionGuaranteed: state.completionGuaranteed,
  containsPlaceholder: state.containsPlaceholder,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onConnectEnd: state.onConnectEnd,
  typeError: state.typeError,
  userTemplates: state.userTemplates,
  domainProfile: state.domainProfile,
  allDomainProfiles: state.allDomainProfiles,
  setDomainProfile: state.setDomainProfile,
  setTypeError: state.setTypeError,
  setSelectedNode: state.setSelectedNode,
  updateNodeValue: state.updateNodeValue,
  updateParent: state.updateParent,
  updateChildren: state.updateChildren,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setAncillaMode: state.setAncillaMode,
  setCompact: state.setCompact,
  setCompletionGuaranteed: state.setCompletionGuaranteed,
  setContainsPlaceholder: state.setContainsPlaceholder,
  setExperienceLevel: state.setExperienceLevel,
  addUserTemplate: state.addUserTemplate,
  setUserTemplates: state.setUserTemplates,
  setAllDomainProfiles: state.setAllDomainProfiles,
  undo: state.undo,
  redo: state.redo,
});

function App() {
  const reactFlowWrapper = React.useRef<any>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const {
    nodes,
    edges,
    experienceLevel,
    compact,
    completionGuaranteed,
    containsPlaceholder,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    typeError,
    userTemplates,
    domainProfile,
    allDomainProfiles,
    setAllDomainProfiles,
    setDomainProfile,
    addUserTemplate,
    setUserTemplates,
    setTypeError,
    setCompact,
    setExperienceLevel,
    setAncillaMode,
    setCompletionGuaranteed,
    setContainsPlaceholder,
    setSelectedNode,
    setNodes,
    updateNodeValue,
    updateParent,
    updateChildren,
    setEdges,
  } = useStore(useShallow(selector));



  const [metadata, setMetadata] = React.useState<any>({
    version: "1.0.0",
    name: "My Model",
    description: "This is a model.",
    author: ""
  });
  const [menu, setMenu] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const [nisqAnalyzerEndpoint, setNisqAnalyzerEndpoint] = useState(
    import.meta.env.VITE_NISQ_ANALYZER || "http://localhost:8098/nisq-analyzer"
  );

  const [openAIToken, setOpenAIToken] = useState(
    import.meta.env.VITE_OPENAI_TOKEN
  );
  const [qunicornEndpoint, setQunicornEndpoint] = useState(
    import.meta.env.VITE_QUNICORN || "http://localhost:8080"
  );
  const [lowcodeBackendEndpoint, setLowcodeBackendEndpoint] = useState(
    import.meta.env.VITE_LOW_CODE_BACKEND || "http://localhost:8000"
  );

  const [patternAtlasApiEndpoint, setPatternAtlasApiEndpoint] = useState(
    import.meta.env.VITE_PATTERN_ATLAS_API || "http://localhost:1977/patternatlas/patternLanguages/af7780d5-1f97-4536-8da7-4194b093ab1d"
  );
  const [patternAtlasUiEndpoint, setPatternAtlasUiEndpoint] = useState(
    import.meta.env.VITE_PATTERN_ATLAS_UI || "http://localhost:1978"
  );
  const [qcAtlasEndpoint, setQcAtlasEndpoint] = useState(
    import.meta.env.VITE_QC_ATLAS || "http://localhost:6626"
  );


  const [activeTab, setActiveTab] = useState("editor");
  const [warningExecution, setWarningExecution] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    nodeId: string | null;
    top: number;
    left: number;
  }>({
    visible: false,
    nodeId: null,
    top: 0,
    left: 0,
  });

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        nodeId: node.id,
        top: event.clientY,
        left: event.clientX,
        //top: node.position.y+0.5*node.height, //passt nicht
        //left: node.position.x-0.5*node.width, //passt nicht
      });
    },
    []
  );

  const onEdgesDelete = (edges: Edge[]) => {
    edges.forEach((edge) => {
      console.log("ON EDGES DELETE")
      console.log("EDGE", edge)
      const targetNodeId = edge.target
      const targetHandle = edge.targetHandle
      const targetNode = nodes.find(n => n.id === targetNodeId);
      const newInputs = targetNode.data.inputs.filter(i => i.targetHandle !== targetHandle)
      updateNodeValue(targetNodeId, "inputs", newInputs)
      console.log(targetHandle)
      console.log("update new inputs", newInputs)
      console.log("NEW INPUTS", targetNode.data.inputs)
    })
  };



  const handleAction = (action: string, nodeId: string) => {
    console.log(`Action: ${action} on Node: ${nodeId}`);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };


  const [validationResult, setValidationResult] = useState({ warnings: [], errors: [] });
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [githubRepositoryOwner, setGithubRepositoryOwner] = useState(import.meta.env.VITE_GITHUB_REPO_OWNER);
  const [githubRepositoryName, setGithubRepositoryName] = useState(import.meta.env.VITE_GITHUB_REPO_NAME);
  const [githubBranch, setGithubBranch] = useState(import.meta.env.VITE_GITHUB_REPO_BRANCH);
  const [githubToken, setGithubToken] = useState(import.meta.env.VITE_GITHUB_TOKEN);
  const [openqasmCode, setOpenQASMCode] = useState("");

  const [selectedDevice, setSelectedDevice] = useState("aer_simulator");
  const [provider, setProvider] = useState("IBM");

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
  const [quantumAlgorithmModalStep, setQuantumAlgorithmModalStep] = useState(0);
  const [domainProfileOpen, setDomainProfileOpen] = useState(false);
  const [quantumAlgorithms, setQuantumAlgorithms] = useState([
    { name: "Quantum Approximate Optimization Algorithm (QAOA)", configCount: 0, patternGraphPng: "patterns/qaoa_patterngraph.png" },
    { name: "SWAP Test", configCount: 0, patternGraphPng: null },
    { name: "Hadamard Test", configCount: 0, patternGraphPng: null },
    { name: "Grover's Algorithm", configCount: 0, patternGraphPng: "patterns/grover_patterngraph.png" },
    { name: "Uniform Superposition", configCount: 0, patternGraphPng: null },
    { name: "Initialization", configCount: 0, patternGraphPng: "patterns/initialization_patterngraph.png" },
  ]);

  const [patternGraph, setPatternGraph] = useState(null);
  const [isDetectingAlgorithms, setIsDetectingAlgorithms] = useState(false);

  const client = new OpenAI({
    apiKey: openAIToken, dangerouslyAllowBrowser: true
  });


  const detectQuantumAlgorithms = async (userInput: string): Promise<string | null> => {
    try {
      setIsDetectingAlgorithms(true);

      const algorithms = [
        "Quantum Approximate Optimization Algorithm (QAOA)",
        "Variational Quantum Eigensolver (VQE)",
        "Grover's Algorithm",
        "Quantum Phase Estimation (QPE)",
        "Quantum Fourier Transform (QFT)",
        "SWAP Test",
        "Hadamard Test",
        "Quantum Classification",
        "Quantum Clustering",
        "Basis Encoding",
        "Matrix Encoding",
        "Amplitude Encoding",
        "Angle Encoding",
        "Initialization",
        "Dynamic Circuits"
      ];

      setQuantumAlgorithms(quantumAlgorithms);

      let response;
      try {
        response = await client.responses.create({
          model: "gpt-5-nano",
          input: [
            {
              role: "system",
              content: `
You are a quantum computing expert.
Given a problem description, identify applicable quantum algorithms.

Check first if some algorithms from this list match:
${algorithms.join(", ")}

Add then the other matches. The first algorithm should be the most suitable one.

Return JSON ONLY in this exact format:
{
  "algorithms": ["<algorithm name>", "..."]
}
If none apply, return { "algorithms": [] }.
            `,
            },
            { role: "user", content: userInput },
          ],
        });

        if (!response?.output_text) {
          setQuantumAlgorithms(quantumAlgorithms);
          return null;
        }

        const parsed = JSON.parse(response.output_text);

        if (!Array.isArray(parsed.algorithms)) throw new Error("Invalid response format");

        setQuantumAlgorithms(parsed.algorithms.map((name: string) => ({ name })));

        return null;
      } catch (sendError: any) {
        console.error("OpenAI request failed:", sendError);
        setQuantumAlgorithms(quantumAlgorithms);
        return sendError.message || "Unknown error";
      }
    } finally {
      setIsDetectingAlgorithms(false);
    }
  };


  function viewPatternGraph(algo) {
    setPatternGraph(algo.patternGraphPng);
  }


  const handleQuantumAlgorithmModalClose = () => {
    if (quantumAlgorithmModalStep <= 1) {
      setQuantumAlgorithmModalStep(quantumAlgorithmModalStep + 1)
    } else {
      setQuantumAlgorithmModalStep(0);
    }
  }


  globalThis.setNisqAnalyzerEndpoint = setNisqAnalyzerEndpoint;
  globalThis.setQunicornEndpoint = setQunicornEndpoint;
  globalThis.setLowcodeBackendEndpoint = setLowcodeBackendEndpoint;
  globalThis.setPatternAtlasUiEndpoint = setPatternAtlasUiEndpoint;
  globalThis.setPatternAtlasApiEndpoint = setPatternAtlasApiEndpoint;
  globalThis.setQcAtlasEndpoint = setQcAtlasEndpoint;
  globalThis.setGithubRepositoryOwner = setGithubRepositoryOwner;
  globalThis.setGithubRepositoryName = setGithubRepositoryName;
  globalThis.setGithubBranch = setGithubBranch;
  globalThis.setGithubToken = setGithubToken;

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
    overwriteFlow(initialDiagram);
  };

  const handleSave = (newValues) => {
    console.log(newValues)
    setNisqAnalyzerEndpoint(newValues.tempNisqAnalyzerEndpoint);
    setOpenAIToken(newValues.tempOpenAIToken);
    setQunicornEndpoint(newValues.tempQunicornEndpoint);
    setLowcodeBackendEndpoint(newValues.tempLowcodeBackendEndpoint);
    setPatternAtlasUiEndpoint(newValues.tempPatternAtlasUiEndpoint);
    setPatternAtlasApiEndpoint(newValues.tempPatternAtlasApiEndpoint);
    setQcAtlasEndpoint(newValues.tempQcAtlasEndpoint);
    setGithubRepositoryOwner(newValues.tempGithubRepositoryOwner);
    setGithubRepositoryName(newValues.tempGithubRepositoryName);
    setGithubBranch(newValues.tempGithubBranch);
    setGithubToken(newValues.tempGithubToken);

    setCompact(newValues.compactVisualization);
    setCompactVisualization(newValues.compactVisualization);
    setAncillaMode(newValues.ancillaMode);
    setAncillaModelingOn(newValues.ancillaMode);
    setExperienceLevel(newValues.experienceLevel);
    setCompletionGuaranteed(newValues.completionGuaranteed);

    setIsConfigOpen(false);
  };

  const handleManageTemplatesSave = (updatedTemplates) => {
    console.log("saving user template changes.");
    console.log(updatedTemplates);
    setUserTemplates(updatedTemplates);
    setIsManageTemplatesOpen(false);
  };

  

  const cancelLoadJson = () => {
    setIsLoadJsonModalOpen(false);
  };
  const [helperLines, setHelperLines] = useState(null);
  const [deploymentId, setDeploymentId] = useState(null);

  const [expanded, setExpanded] = useState(false);
  const [completionGuaranteedOption, setCompletionGuaranteedOption] = useState("Yes");

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
  const [experienceLevelOn, setExperienceLevelOn] = useState("explorer");
  const [compactVisualization, setCompactVisualization] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [workflow, setWorkflow] = useState("");


  const updateNodeInternals = useUpdateNodeInternals();

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (typeError) {
      showToast(typeError, "error");
    }
  }, [typeError, showToast, setTypeError]);

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
        target: '.backend-button',
        content: 'This transforms the model into QASM code or workflows, which can then be executed on quantum devices or on a workflow engine.',
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
        target: '.experience-mode',
        content: 'This panel allows you to configure the editor based on your preferences.',
        placement: "right"
      },
      {
        target: '.classical-node',
        content: 'This is a classical node that requires a value.',

      },
      {
        target: '.grand-parent',
        content: 'This value is then encoded via the state preparation block into a quantum state.',

      },
      {
        target: '.currentPanel-container',
        content: 'This is the properties panel, where you can configure the properties of blocks or the model.',
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
    setWarningExecution(false);
    //setSelectedDevice("");
    //setProvider("");
    setNumShots(1024);
    setAccessToken("");
    setAlreadyExecuted(false);
  };

  const sendToBackend = async () => {
    //setLoading(true);
    setModalOpen(false);
    setProcessingModalOpen(true);

    let id = `flow-${Date.now()}`;
    showToast("QASM request for model " + id + " submitted.", "info");

    try {
      const validMetadata = {
        ...metadata,
        containsPlaceholder: containsPlaceholder,
        id: id,
        timestamp: new Date().toISOString(),
      };

      console.log(validMetadata);
      console.log(metadata);

      const response = await startCompile(
        lowcodeBackendEndpoint,
        validMetadata,
        reactFlowInstance.getNodes(),
        reactFlowInstance.getEdges(),
        compilationTarget
      );
      console.log(response)

      const jsonData = await response.json();
      const uuid = jsonData["uuid"];
      let location = jsonData["result"];
      const statusUrl = `${lowcodeBackendEndpoint}/status/${uuid}`;

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
                //showToast("Result for model " + id + " is available.", "success");
                console.log("Operation completed successfully.");
                return resolve();
              }

              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(check, delay);
              } else {
                console.error("Max polling attempts reached. Operation did not complete.");
                showToast("Max polling attempts for model " + id + " reached.", "error");
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
      setTimeout(() => {
        setStatus("completed");
        setLoading(false);
        showToast("Result for model " + id + " is available.", "success");
      }, 3000);
      setStatus("completed");
      setLoading(false);


    } catch (error) {
      console.error("Error sending data:", error);
      showToast("Error during result generation for model " + id + ".", "error");
      setLoading(false);
    }
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${lowcodeBackendEndpoint}/results`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Failed to fetch history:", response.statusText);
        return;
      }

      const data: HistoryItem[] = await response.json();
      console.log(data)
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = async () => {
    await fetchHistory();
    setHistoryOpen(true);
  };

  const startTour2 = () => {
    setRunTour(true);
    setAncillaMode(false);
    setAncillaModelingOn(false);
    //updateNodeInternals since ancilla mode changes number of handles
    nodes.forEach((node) => {
      updateNodeInternals(node.id);
    })
    console.log("load tutorial")
    overwriteFlow(tutorial);
    console.log("load toturial")
  }

  interface ValidationItem {
    nodeId: string;
    nodeType: string;
    description: string;
  }

  interface ValidationResult {
    warnings: ValidationItem[];
    errors: ValidationItem[];
  }

  function validateFlow(flow): ValidationResult {
    const warnings: ValidationItem[] = [];
    const errors: ValidationItem[] = [];

    const outputIds = new Map<string, string>();
    const nodesById: any = new Map(flow.nodes?.map((n) => [n.id, n]));

    // Map targetNodeId => sourceNodeIds[]
    const nodeConnections = new Map<string, string[]>();
    flow.edges?.forEach((edge) => {
      if (!nodeConnections.has(edge.target)) nodeConnections.set(edge.target, []);
      nodeConnections.get(edge.target)?.push(edge.source);
    });

    // Map sourceNodeId => targetNodeIds[] for output checks
    const outgoingConnections = new Map<string, string[]>();
    flow.edges?.forEach((edge) => {
      if (!outgoingConnections.has(edge.source)) outgoingConnections.set(edge.source, []);
      outgoingConnections.get(edge.source)?.push(edge.target);
    });

    // Existing node validation 
    flow.nodes?.forEach((node) => {
      const { outputIdentifier, label, inputs, outputSize, condition, operator } =
        node.data || {};
      const connectedSources = nodeConnections.get(node.id) || [];
      const inputCount = connectedSources.length;

      const hasQuantumOutput = connectedSources.some((srcId) => {
        const sourceNode: any = nodesById.get(srcId);
        return sourceNode !== undefined;
      });

      // Output Identifier Checks 
      if (outputIdentifier && /^[0-9]/.test(outputIdentifier)) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          description: `Invalid outputIdentifier "${outputIdentifier}" (cannot start with a number).`,
        });
      }

      if (outputIdentifier) {
        if (outputIds.has(outputIdentifier)) {
          const firstNodeId = outputIds.get(outputIdentifier);
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Duplicate outputIdentifier "${outputIdentifier}" already used by node "${firstNodeId}".`,
          });
        } else {
          outputIds.set(outputIdentifier, node.id);
        }
      }

      // Gate / Operator Validation 
      const twoQubitGates = [
        "CNOT",
        "SWAP",
        "CZ",
        "CY",
        "CH",
        "CP(λ)",
        "CRX(θ)",
        "CRY(θ)",
        "CRZ(θ)",
        "CU(θ,φ,λ,γ)",
      ];
      const threeQubitGates = ["Toffoli", "CSWAP"];
      const minMaxOperators = ["Min", "Max"];

      if (
        twoQubitGates.includes(label) ||
        ((node.type === "quantumOperatorNode" || node.type === "classicalOperatorNode") &&
          !minMaxOperators.includes(operator))
      ) {
        if (inputCount !== 2) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" with label "${label}" requires exactly 2 inputs, but got ${inputCount}.`,
          });
        }
        if (node.data.label === "Quantum Comparison Operator" || node.data.label === "Quantum Min & Max Operator") {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" (${node.data.label}) produces a classical output but its output is not used.`,
          });
        } else if (!twoQubitGates.includes(label) && !hasQuantumOutput) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" (${node.data.label}) produces a quantum state but its output is not used.`,
          });
        }

      }

      if (threeQubitGates.includes(label)) {
        if (inputCount !== 3) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Gate "${label}" requires exactly 3 inputs, but got ${inputCount}.`,
          });
        }
      }

      if (
        minMaxOperators.includes(label) ||
        (node.type === "gateNode" &&
          label !== "Qubit Circuit" &&
          !threeQubitGates.includes(label) &&
          !twoQubitGates.includes(label))
      ) {
        if (inputCount < 1) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Operator "${label}" requires at least 1 input.`,
          });
        }

        // Warn if Min/Max operator has no output connection 
        const outgoing = outgoingConnections.get(node.id) || [];
        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Operator "${label}" has no output connection (unused result).`,
          });
        }
      }

      // State Preparation Node 
      if (node.type === "statePreparationNode") {
        if (
          ["Encode Value", "Basis Encoding", "Angle Encoding", "Amplitude Encoding"].includes(
            node.data.label
          )
        ) {
          const hasClassical = connectedSources.some((srcId) => {
            const sourceNode: any = nodesById.get(srcId);
            return sourceNode?.type === "dataTypeNode";
          });
          if (!hasClassical) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" has no classical data input connected.`,
            });
          }
          if (node.data.encodingType === "Custom Encoding" && !node.data.implementation) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" is missing an implementation for custom encoding.`,
            });
          }
        }

        if (node.data.label === "Prepare State") {
          if (!node.data.size) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" has no quantum register size specified.`,
            });
          }
          if (node.data.quantumStateName === "Custom State" && !node.data.implementation) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" is missing implementation for custom state.`,
            });
          }
        }

        if (!hasQuantumOutput) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" is missing an output connection.`,
          });
        }
      }

      // DataTypeNode: warn if no output connection 
      if (node.type === "dataTypeNode") {
        const outgoing = outgoingConnections.get(node.id) || [];
        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Classical data node "${node.id}" has no output connection (unused variable).`,
          });
        }
      }

      // Measurement Node 
      if (node.type === "measurementNode") {
        const missingRegister = connectedSources.every((srcId) => {
          const sourceNode: any = nodesById.get(srcId);
          return sourceNode?.type !== "qubitNode" && sourceNode?.type !== "gateNode";
        });
        if (!node?.data?.indices) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" has no specified indices.`,
          });
        } else if (!/^\d+(,\d+)*$/.test(node.data.indices)) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Indices of measurement node "${node.id}" can only contain numbers separated by commas.`,
          });
        }
      }

      // Control / If Nodes 
      if (node.type === "ifElseNode") {
        const hasClassical = connectedSources.some((srcId) => {
          const sourceNode: any = nodesById.get(srcId);
          return sourceNode?.type === "dataTypeNode";
        });
        if (!hasClassical) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${label}" requires at least one classical data input.`,
          });
        }
        if (!condition) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${label}" requires a condition.`,
          });
        }
      }

      if (node.type === "controlStructureNode" && !condition) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          description: `Node "${label}" requires a condition.`,
        });
      }

      // Algorithm / Custom Nodes 
      if (node.type === "algorithmNode" || node.type === "classicalAlgorithmNode") {
        const expectedInputs = node.data?.numberInputs || 0;
        const actualInputs = connectedSources.length;
        if (actualInputs < expectedInputs) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${label}" requires ${expectedInputs} input(s), but only ${actualInputs} connected.`,
          });
        }


        // Quantum outputs check based on numberQuantumOutputs 
        const numberQuantumOutputs = node.data?.numberQuantumOutputs || 0;
        if (numberQuantumOutputs > 0) {
          const outgoing = outgoingConnections.get(node.id) || [];
          if (outgoing.length < numberQuantumOutputs) {
            warnings.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" produces ${numberQuantumOutputs} quantum outputs but only ${outgoing.length} are connected (some quantum outputs are unused).`,
            });
          }
        }
      }

    });

    // Gate node connection to measurement 
    const gateNodes = flow.nodes?.filter((n) => n.type === "gateNode") || [];
    const measurementNodes = new Set(
      flow.nodes?.filter((n) => n.type === "measurementNode").map((n) => n.id)
    );

    const visited = new Set<string>();
    function reachesMeasurement(nodeId: string): boolean {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      if (measurementNodes.has(nodeId)) return true;

      const outputs =
        flow.edges?.filter((e) => e.source === nodeId).map((e) => e.target) || [];
      return outputs.some((outId) => reachesMeasurement(outId));
    }

    const meaningfulGateExists = gateNodes.some((gate) => {
      visited.clear();
      return reachesMeasurement(gate.id);
    });

    if (!meaningfulGateExists && gateNodes.length > 0) {
      warnings.push({
        nodeId: null,
        nodeType: "flow",
        description:
          "No gate node in the model has a path to a measurement node. " +
          "Executing this flow will not produce meaningful results.",
      });
    }


    return { warnings, errors };
  }


  const startQuantumAlgorithmSelection = () => {
    setQuantumAlgorithmModalStep(1);
  }

  const handleOpenValidation = () => {
    if (!reactFlowInstance) return;

    const flow = reactFlowInstance.toObject();
    const result = validateFlow(flow);
    console.log(flow)

    setValidationResult(result);
    setIsValidationOpen(true);
  };


  const startTour3 = () => {
    overwriteFlow(modeledDiagram);
  }

  const startTour = () => {
    setRunTour(true);
    setAncillaMode(false);
    setAncillaModelingOn(false);
    //updateNodeInternals since ancilla mode changes number of handles
    nodes.forEach((node) => {
      updateNodeInternals(node.id);
    })
    console.log("load tutorial")
    console.log("load toturial")
  }
  const handleDeploy = async () => {
    setIsQunicornOpen(true);
    setLoading(true);
    console.log(qunicornEndpoint)

    try {
      let program = {
        "programs": [
          {
            //"quantumCircuit": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncreg meas[2];\nh q[0];\ncx q[0],q[1];\nbarrier q[0],q[1];\nmeasure q[0] -> meas[0];\nmeasure q[1] -> meas[1];",
            "quantumCircuit": openqasmCode,
            //"quantumCircuit": "OPENQASM 2.0;include 'qelib1.inc';qreg q[6];creg c[6];gate oracle(q0, q1, q2, q3, q4, q5) {    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;}gate diffusion(q0, q1, q2, q3, q4, q5) {    h q0;    h q1;    h q2;    h q3;    h q4;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q0;    h q1;    h q2;    h q3;    h q4;    h q5;}h q[0];h q[1];h q[2];h q[3];h q[4];h q[5];oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);measure q[0] -> c[0];measure q[1] -> c[1];measure q[2] -> c[2];measure q[3] -> c[3];measure q[4] -> c[4];measure q[5] -> c[5];",
            "assemblerLanguage": "QASM3",
            "pythonFilePath": "",
            "pythonFileMetadata": ""
          }
        ],
        "name": "DeploymentName"
      };
      console.log(openqasmCode)
      const regex = /^qubit\[\d+\]\s+\w+;$/gm;
      const qubitMatches = openqasmCode.match(regex);
      console.log(qubitMatches)

      if (qubitMatches) {
        const qubitIndices = qubitMatches.map(m => parseInt(m.match(/\d+/)[0], 10));
        console.log(qubitIndices)
        const maxQubitIndex = Math.max(...qubitIndices);

        // Example: trigger warning if any qubit index >= 30
        if (maxQubitIndex >= 30) {
          setWarningExecution(true);
          console.warn(`⚠️ Warning: High qubit index detected (${maxQubitIndex})`);
        }
      }
      let response = await fetch(qunicornEndpoint + "/deployments/", {
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

      let response = await fetch(qunicornEndpoint + "/jobs/", {
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

      const url = `${qunicornEndpoint}/${jobId.startsWith('/') ? jobId.slice(1) : jobId}`;

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
          register: parseInt(key, 16),
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
      if (node.id == contextMenu.nodeId) {
        console.log("moving context menu for node", node.id)
        setContextMenu((prev) => ({ ...prev, left: evt.clientX, top: evt.clientY }));
      }
    }, [nodes, setContextMenu]);
  
  const currentCategories: Record<string, CategoryEntry> = useMemo(() => {
      const domainProfileNames = allDomainProfiles.map((p) => p.name);
      const index = domainProfileNames.indexOf(domainProfile);
      console.log("domainProfile", domainProfile)
      console.log("index", index)
      if (index > -1) {
          return allDomainProfiles[index].domainBlocks;
      } else {
          return categories;
      }
    }, [domainProfile, allDomainProfiles]);
  
  const onDrop = React.useCallback(
    (event: any) => {
      console.log("dropped")
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const label = event.dataTransfer.getData("application/reactflow/label");
      console.log(position);


      if (label == qaoa) {
        loadFlow(qaoa_algorithm)
      } else if (label == swap_test) {
        loadFlow(swap_test_algorithm);
      }
      else if (label == hadamard_test_imaginary_part) {
        loadFlow(hadamard_test_imaginary_part_algorithm);
      }
      else if (label == hadamard_test_real_part) {
        loadFlow(hadamard_test_real_part_algorithm);
      }
      else if (label == grover) {
        loadFlow(grover_algorithm);
      }
      else if (label.startsWith(custom_template)) {
        const userTemplateFlowData = JSON.parse(event.dataTransfer.getData("application/reactflow/templateFlowData"));
        console.log("USER TEMPLATE")
        console.log(userTemplateFlowData)
        if(userTemplateFlowData) {
          loadFlow(userTemplateFlowData);
        }
        else {
          console.error(`User Template ${label} not found.`)
        }
      }
      else {
        console.log("current categories", currentCategories)
        handleOnDrop(event, reactFlowWrapper, reactFlowInstance, setNodes, currentCategories);
      }

      //setContextMenu((prev) => ({ ...prev, left: event.clientX, top: event.clientY,}));
    },
    [reactFlowInstance, setNodes, currentCategories],
  );

  const onNodesDelete = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when node is deleted
  }, [setContextMenu]);


  const flowKey = "example-flow";

  async function uploadToGitHub() {
    let flowId = `model-${Date.now()}`;
    const repoOwner = githubRepositoryOwner;
    const repo = githubRepositoryName;
    const branch = githubBranch;
    const token = githubToken;

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

    console.log(containsPlaceholder)

    let fileContent = JSON.stringify({
      metadata: {
        ...metadata,
        containsPlaceholder: containsPlaceholder,
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

  async function handleSaveClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }
    console.log("davor");
    const flow = reactFlowInstance.toObject();
    console.log(flow);
    const validMetadata = {
      ...metadata,
      containsPlaceholder: containsPlaceholder,
      id: `flow-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    console.log(validMetadata);
    console.log(metadata);

    const flowWithMetadata = { metadata: validMetadata, ...flow };

    const event = new CustomEvent("lcm-save", {
      cancelable: true,
      detail: flowWithMetadata,
    });
    const defaultAction = document.dispatchEvent(event);
    console.log(`defaultAction: ${defaultAction}`);
    if (!defaultAction)
      return;

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
    console.log("Flow saved:", flowWithMetadata);
  }

  const handleSaveDomainProfile = (newProfile: DomainProfile) => {
    const updatedProfiles = [...allDomainProfiles, newProfile]
    setAllDomainProfiles(updatedProfiles);
    console.log("Profile saved and appended:", newProfile);
  };

  
	const handleSaveAsTemplate = () => {
    console.log("Saving User Template")
		if (!reactFlowInstance) {
      		console.error("React Flow instance is not initialized.");
    		return;
			// TODO: toast error message
		}
		let templateFlow = reactFlowInstance.toObject();
    console.log(templateFlow)
    // add metadata to templateFlow
    templateFlow = {
      ...templateFlow,
      metadata: metadata,
    }
    const date = Date.now();
    const timestamp = new Date().toISOString();
    const newTemplate: Template = {
      label: `${custom_template}-${date}`,
      type: templates,
      icon: "QAOA.png", //TODO
      description: metadata.description,
      completionGuaranteed: true,
      compactOptions:[true, false],
      id: `flow-${date}`,
      timestamp: timestamp,
      name: metadata.name, // get name from meta data
      flowData: templateFlow
    }
    console.log(newTemplate)
    // save metadata to userTemplates
    addUserTemplate(newTemplate);
  	};


  function handleRestoreClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }

    function restoreFlow(flow) {
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
    }

    const event = new CustomEvent("lcm-open", {
      cancelable: true,
      detail: {
        restoreFlow
      },
    });
    const defaultAction = document.dispatchEvent(event);
    console.log(`defaultAction: ${defaultAction}`);
    if (!defaultAction)
      return;

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

          restoreFlow(flow);
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

  const [modeledDiagram, setModeledDiagram] = useState(null);
  
  // Function to load the flow
  const overwriteFlow = (flow: any) => {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }
    console.log(flow.initialEdges)
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
    if (flow.initialEdges) {
      reactFlowInstance.setEdges(flow.initialEdges);
      console.log("Edges loaded.");
    } else if (flow.edges){
      reactFlowInstance.setEdges(flow.edges);
      console.log("Edges loaded.");
    }
    console.log("load flow nodes", nodes);
    console.log(edges);

    // Reset the viewport (optional based on your use case)
    const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
    reactFlowInstance.setViewport({ x, y, zoom });

    console.log(flow.metadata)
    // Set the metadata (if any) - assuming initialDiagram has metadata
    if (flow.metadata) {
      // If metadata is an array, unpack it
      const dataToSet = Array.isArray(flow.metadata) ? flow.metadata[0] : flow.metadata;
      setMetadata(dataToSet);
      console.log("Metadata loaded:", dataToSet);
    }

  };

  // Function to load the flow in addition to all nodes and edges already on the canvas
  const loadFlow = (flow: any) => {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }
    const existingNodes = reactFlowInstance.getNodes();
    const existingEdges = reactFlowInstance.getEdges();
    console.log("LOAD FLOW")
    console.log("current nodes", existingNodes)
    console.log("current edges", existingEdges)
    // regenerate all node and edge ids (that are incoming), to ensure no duplicate ids
    const nodeIdMap: Record<string, string> = {};
    const edgeIdMap: Record<string, string> = {};
    //const identifierMap: Record<string, string> = {};

    const incomingNodes = flow.nodes || [];
    const incomingEdges = flow.initialEdges || flow.edges || [];
    incomingNodes.forEach((node) => {
      nodeIdMap[node.id] = uuid();
    })
    incomingEdges.forEach((edge) => {
      edgeIdMap[edge.id] = uuid();
    })
    // auch unique identifier neu generieren?

    // compute node position offset, so loaded nodes and edges are visible and don't cover anything, 
    // even if same flow is loaded multiple times
    const iterationCount = Math.floor(existingNodes.length / (flow.nodes?.length || 1));
    const offset = 50;
    const offsetX = (iterationCount + 1) * offset;
    const offsetY = (iterationCount + 1) * offset;

    // process nodes
    const processedNodes = incomingNodes.map((node: any) => {
      const newNodeId = nodeIdMap[node.id];
      return {
        ...node,
        id: newNodeId,
        // Adjust position slightly, incase exact same node is already on canvas
        position: { 
          x: (node.position?.x || 0) + offsetX, 
          y: (node.position?.y || 0) + offsetY 
        },
        data: {
          ...node.data,
          // update children
          children: node.data.children?.map((child: string) => nodeIdMap[child]),
          // update node and edge Ids in inputs for each node
          inputs: node.data.inputs?.map((input: any) => {
            let updatedInput = { ...input };
                       
            if (input.targetHandle && typeof input.targetHandle === 'string') {
              Object.keys(nodeIdMap).forEach(oldId => {
                updatedInput.targetHandle = updatedInput.targetHandle.replace(oldId, nodeIdMap[oldId]);
              });
            }
            
            if (nodeIdMap[input.id]) updatedInput.id = nodeIdMap[input.id];
            if (edgeIdMap[input.edgeId]) updatedInput.id = edgeIdMap[input.id];

            return updatedInput;
          }),
        },
      };
    });
    nodes.forEach((node) => (console.log(node.position)))
    processedNodes.forEach((node) => (console.log(node.position)))

    // process edges
    const processedEdges = incomingEdges.map((edge: any) => {
      // update source and tagret nodes
      let newSource = nodeIdMap[edge.source] || edge.source;
      let newTarget = nodeIdMap[edge.target] || edge.target;
      
      // update source and target handles
      let newSourceHandle = edge.sourceHandle;
      let newTargetHandle = edge.targetHandle;
      
      Object.keys(nodeIdMap).forEach(oldId => {
        newSourceHandle = newSourceHandle?.replace(oldId, nodeIdMap[oldId]);
        newTargetHandle = newTargetHandle?.replace(oldId, nodeIdMap[oldId]);
      });

      return {
        ...edge,
        id: edgeIdMap[edge.id],
        source: newSource,
        target: newTarget,
        sourceHandle: newSourceHandle,
        targetHandle: newTargetHandle,
      };
    });

    // append processed nodes and edges to existing reactFlowInstance
    if(processedNodes.length > 0) {
      const allNodes = [...existingNodes, ...processedNodes];
      console.log("new nodes", allNodes)
      // reactFlowInstance.addNodes(processedNodes);
      reactFlowInstance.setNodes(
        allNodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
          },
        }))
      );
    };

    if(processedEdges.length > 0) {
      const allEdges = [...existingEdges, ...processedEdges];
      console.log("new edges", allEdges)
      // reactFlowInstance.addEdges(processedEdges);
      reactFlowInstance.setEdges(allEdges);
    }

    // don't set metadata!!
    // // set Metadata
    // if (flow.metadata) {
    //   const dataToSet = Array.isArray(flow.metadata) ? flow.metadata[0] : flow.metadata;
    //   setMetadata(dataToSet);
    //   console.log("Metadata loaded:", dataToSet);
    // }

    console.log("Templates successfully loaded onto canvas.");
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
    // move contextmenu with dragged node if it belongs to that node
    // if other node is dragged: make context menu invisible
    if (node.id == contextMenu.nodeId) {
      console.log("drag contextmenu to nodeid: ", node.id)
      setContextMenu((prev) => ({ ...prev, top: event.clientY, left: event.clientX }))
    } else {
      setContextMenu((prev) => ({ ...prev, visible: false }))
    }
  }
    , [reactFlowInstance, helperLines, nodes, setContextMenu]);

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when clicking on pane
    setSelectedNode(null);
    console.log("reset");
  }, [setMenu, setContextMenu, setSelectedNode]);

  const onClick = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when clicking anywhere in canvas (but not other panels)
  }, [setContextMenu]);

  const handleOpenConfig = () => setIsConfigOpen(true);
  const handleManageTemplates = () => setIsManageTemplatesOpen(true);

  const onExperienceLevelChange = (event) => {
    setExperienceLevel(event);
    setExperienceLevelOn(event);
    const bool_value = (experienceLevel === "pioneer") ? false : true; // if previous experience level was pioneer...
    setCompactVisualization(bool_value)
    setAncillaMode(bool_value)
    setAncillaModelingOn(bool_value)
    //updateNodeInternals since ancilla mode changes number of handles
    nodes.forEach((node) => {
      updateNodeInternals(node.id);
    })
  };



  const onToggleAncilla = () => {
    setAncillaModelingOn(!ancillaModelingOn);
    setAncillaMode(!ancillaModelingOn);
    //updateNodeInternals since ancilla mode changes number of handles
    nodes.forEach((node) => {
      updateNodeInternals(node.id);
    })
  }

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
        a.setAttribute("download", "reactflow-diagram.svg"); // TODO: Dateiname ändern?
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .catch((err) => console.error("Error exporting SVG:", err));
  };

  /**
   * Uploads a QRMS ZIP file to GitHub, updating files if they already exist.
   */
  async function uploadQRMS(qrmsUrl: string, modelId: string): Promise<void> {
    const token = githubToken;
    if (!token) throw new Error("Missing GitHub token");
    const owner = githubRepositoryOwner;
    const repo = githubRepositoryName;
    const basePath = `qrms_uploads/${modelId}`;

    const res = await fetch(qrmsUrl);
    if (!res.ok) throw new Error("Failed to fetch QRMS zip");
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}`;

    const folderCheck = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (folderCheck.ok) {
      console.log(`Folder ${basePath} already exists — skipping upload.`);
      return; // exit early — skip re-upload
    }
    const buf = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    for (const [relative, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      const content = await file.async("string");
      const encoded = btoa(unescape(encodeURIComponent(content)));
      const githubPath = `${basePath}/${relative}`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`;

      // look up sha if file already exists
      let sha: string | undefined;
      const head = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (head.ok) {
        const data = await head.json();
        sha = data.sha;
      }

      // create or update file
      const put = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: sha
            ? `Update existing QRMS file: ${relative}`
            : `Upload new QRMS file: ${relative}`,
          content: encoded,
          sha,
        }),
      });

      if (!put.ok) {
        const txt = await put.text();
        throw new Error(`Failed to upload ${relative}: ${txt}`);
      }
      console.log("QRMs uploaded", githubPath);
    }
  }

  async function createServiceTemplates(serviceDeploymentModelsUrl: string, namespace: string): Promise<void> {
    const res = await fetch(serviceDeploymentModelsUrl);
    if (!res.ok) throw new Error(`Failed to fetch service deployment models: ${res.statusText}`);

    // Load ZIP into JSZip
    const arrayBuffer = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract folder names
    const folderNames = new Set<string>();

    for (const [path, entry] of Object.entries(zip.files)) {
      const match = path.match(/^(Activity_[^/]+)/);
      if (match) {
        folderNames.add(match[1]);
      }
    }

    console.log(`Found service deployment folders:`, Array.from(folderNames));


    const masterZip = await JSZip.loadAsync(arrayBuffer);
    // Process each folder 
    for (const [path, entry] of Object.entries(masterZip.files)) {
      if (entry.dir) continue;
      if (!path.endsWith(".zip")) continue;

      // Extract activity name
      const activityName = path.replace(".zip", "");
      console.log(`Processing activity ZIP: ${activityName}`);

      // Load the activity ZIP in memory
      const activityArrayBuffer = await entry.async("arraybuffer");
      const activityZip = await JSZip.loadAsync(activityArrayBuffer);

      // Find service.zip inside activity ZIP
      const serviceEntry = Object.values(activityZip.files).find(
        (f) => !f.dir && f.name.endsWith("service.zip")
      );

      if (!serviceEntry) {
        console.warn(`No service.zip found in ${activityName}`);
        continue;
      }

      // Extract service.zip as Blob
      const serviceArrayBuffer = await serviceEntry.async("arraybuffer");
      const serviceBlob = new Blob([serviceArrayBuffer], { type: "application/zip" });

      // Create deployment model
      const versionUrl = `http://localhost:8093/winery/servicetemplates/${activityName}`;
      await createDeploymentModel(
        serviceBlob,
        "http://localhost:8093/winery",
        `${activityName}_DA`,
        "http://opentosca.org/artifacttemplates",
        "{http://opentosca.org/artifacttypes}DockerContainerArtifact",
        "service.zip",
        versionUrl
      );
      const OPENTOSCA_NAMESPACE_NODETYPE = "http://opentosca.org/nodetypes";
      const QUANTME_NAMESPACE_PULL = "http://quantil.org/quantme/pull";

      // Create service template
      let serviceTemplate = await createServiceTemplate(activityName, namespace);
      await createNodeType(
        activityName + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE
      );
      await updateNodeType(
        activityName + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE
      );
      serviceTemplate = await updateServiceTemplate(
        activityName,
        QUANTME_NAMESPACE_PULL
      );
      console.log(`Service template created for: ${activityName}`);
    }

  }

  return (
    <>
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
          console.log("HELP");
          console.log(index);
          console.log(type);
          if (type === 'step:before' && index === 0) {
            // open both side panels if they're not opened
            setIsPaletteOpen(true);
            setIsPanelOpen(true);
            //setExpanded(true);
          }
          if (type === 'step:before' && index === 1) {
            let fileContent = JSON.stringify(reactFlowInstance.toObject());
            setModeledDiagram(fileContent);
          }
          if (type === 'step:before' && index === 3) {
            startTour2();
            setExpanded(true);
          }
          if (type === 'step:before' && index === 4) {

            const id = "086a4f77-2562-44d3-b0df-7cfe83ae369a";
            const node = nodes.find(n => n.id === id);
            setSelectedNode(node);
            console.log("NODES", nodes);
            console.log("SELECTED NODE", node);
          }
          if (type === 'step:before' && index === 5) {
            setExpanded(false);
            const id = "e2a719bf-516c-4601-84d1-de643b05ea02";
            const node = nodes.find(n => n.id === id);
            setSelectedNode(node);
            console.log("NODES", nodes);
            console.log("SELECTED NODE", node);
          }
          if (type === 'step:before' && index === 6) {
            setExpanded(false);
            setSelectedNode(null);
          }
          if (type === 'step:after' && index === 7) {
            startTour3();

          }
          if (['finished', 'skipped'].includes(data.status)) {
            setRunTour(false);
            setExpanded(false);
            if(modeledDiagram) {
              overwriteFlow(JSON.parse(modeledDiagram));
            }
          }
        }}
      />

      <div className="toolbar-container">
        <Toolbar
          onSave={handleSaveClick}
          onRestore={handleRestoreClick}
          onSaveAsSVG={handleSaveAsSVG}
          onOpenConfig={handleOpenConfig}
          uploadDiagram={() => uploadToGitHub()}
          onLoadJson={handleLoadJson}
          sendToBackend={handleOpenValidation}
          createDomainProfile={() => setDomainProfileOpen(true)}
          startQuantumAlgorithmSelection={startQuantumAlgorithmSelection}
          //sendToQunicorn={() => setIsQunicornOpen(true)}
          openHistory={openHistoryModal}
          startTour={() => { startTour(); }}
          onSaveAsTemplate={handleSaveAsTemplate}
          onManageTemplates={handleManageTemplates}
        />
      </div>
      {<NewDiagramModal open={isLoadJsonModalOpen} onClose={cancelLoadJson} onConfirm={confirmNewDiagram} />}

      <ValidationModal
        open={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        onConfirm={() => {
          setIsValidationOpen(false);
          setModalOpen(true);
        }}
        validationResult={validationResult}
      />
      <SendRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        compilationTarget={compilationTarget}
        containsPlaceholder={containsPlaceholder}
        setCompilationTarget={setCompilationTarget}
        sendToBackend={sendToBackend}
      />

      <ConfigModal
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ancillaMode={ancillaModelingOn}
        compactVisualization={compactVisualization}
        completionGuaranteed={completionGuaranteed}
        experienceLevel={experienceLevel}
        tempNisqAnalyzerEndpoint={nisqAnalyzerEndpoint}
        tempOpenAIToken={openAIToken}
        tempQunicornEndpoint={qunicornEndpoint}
        tempLowcodeBackendEndpoint={lowcodeBackendEndpoint}
        tempPatternAtlasUiEndpoint={patternAtlasUiEndpoint}
        tempPatternAtlasApiEndpoint={patternAtlasApiEndpoint}
        tempQcAtlasEndpoint={qcAtlasEndpoint}
        tempGithubRepositoryOwner={githubRepositoryOwner}
        tempGithubRepositoryName={githubRepositoryName}
        tempGithubBranch={githubBranch}
        tempGithubToken={githubToken}
      />

      <ManageTemplateModal 
        open={isManageTemplatesOpen} 
        onClose={() => setIsManageTemplatesOpen(false)} 
        templates={userTemplates} 
        onSave={handleManageTemplatesSave}      
      />

      <QunicornModal
        open={isQunicornOpen}
        step={modalStep}
        executed={executed}
        onClose={handleClose}
        simulatorWarning={warningExecution}
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

      {patternGraph && (
        <Modal
          title="Pattern Graph"
          open={true}
          onClose={() => setPatternGraph(null)}
        >
          <img src={patternGraph} alt="Pattern graph" className="w-full rounded" />
        </Modal>
      )}

      <DomainProfileModal
        open={domainProfileOpen}
        onClose={() => setDomainProfileOpen(false)}
        onSave={handleSaveDomainProfile}
      />

      <AiModal
        quantumAlgorithmModalStep={quantumAlgorithmModalStep}
        quantumAlgorithms={quantumAlgorithms}
        isDetectingAlgorithms={isDetectingAlgorithms}
        detectQuantumAlgorithms={detectQuantumAlgorithms}
        handleQuantumAlgorithmModalClose={handleQuantumAlgorithmModalClose}
        setQuantumAlgorithmModalStep={setQuantumAlgorithmModalStep}
        loadFlow={overwriteFlow}
      />

      <HistoryModal
        open={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onExecute={async (item) => {
          console.log(item);
          setHistoryOpen(false);

          try {
            // Fetch the model JSON from the request link to check compilation_target
            const requestResponse = await fetch(item.links.request);
            if (!requestResponse.ok) throw new Error("Failed to fetch model file");
            const modelData = await requestResponse.json();

            const compilationTarget = modelData?.compilation_target;

            // If the model is a workflow
            if (compilationTarget === "workflow") {
              //store the workflow data in your state
              setWorkflow(modelData);

              // Upload the QRMS file to GitHub if available
              if (item.links?.qrms) {
                try {
                  await uploadQRMS(item.links.qrms, item.uuid);
                } catch (err) {
                  console.error("QRMS upload failed:", err);
                }
              }

              if (item.links?.serviceDeploymentModels) {
                try {
                  const QUANTME_NAMESPACE_PULL = "http://quantil.org/quantme/pull";
                  await createServiceTemplates(item.links.serviceDeploymentModels, QUANTME_NAMESPACE_PULL);

                } catch (err) {
                  console.error("QRMS upload failed:", err);
                }
              }

              return;
            }

            setIsQunicornOpen(true);
            const resultResponse = await fetch(item.links.result);
            if (!resultResponse.ok) throw new Error("Failed to fetch QASM result");

            const qasmText = await resultResponse.text();
            setOpenQASMCode(qasmText);

          } catch (error) {
            console.error("Error handling execution:", error);
          }
        }}
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
            style={{
              width: "24px"
            }}
            className={`
    absolute top-1/2 transform -translate-y-1/2 
    bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 
    ${isPaletteOpen ? "right-0" : "hidden"} 
    ${isValidationOpen ? "hidden" : ""}
  `}
          >
            {isPaletteOpen ? "←" : "→"}
          </button>

          <button
            onClick={togglePalette}
            style={{
              width: "24px",
              paddingLeft: "4px"
            }}
            className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-r-lg shadow-md hover:bg-gray-600 z-50 ${isPaletteOpen ? "hidden" : "-left-0"} ${isValidationOpen ? "hidden" : ""}`}
          >
            {isPaletteOpen ? "←" : "→"}
          </button>

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
            onNodeContextMenu={onNodeContextMenu}
            onNodeClick={(event: React.MouseEvent, node: Node) => {
              handleClick(event, node);
            }}
            onConnectEnd={onConnectEnd}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onClick={onClick}
            onDragOver={onDragOver}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}

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
            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}

            <ExperienceModePanel
              expanded={expanded}
              onToggleExpanded={() => setExpanded(!expanded)}
              ancillaModelingOn={ancillaModelingOn}
              onToggleAncilla={onToggleAncilla}
              experienceLevel={experienceLevel}
              onExperienceLevelChange={onExperienceLevelChange}
              //onExperienceLevelChange={(event) => { setExperienceLevel(event); setExperienceLevelOn(event); }}
              compactVisualization={compactVisualization}
              onCompactVisualizationChange={() => { setCompactVisualization(!compact); setCompact(!compact) }}
              completionGuaranteed={completionGuaranteed}
              onCompletionGuaranteedChange={setCompletionGuaranteed}
              domainProfile={domainProfile}
              onDomainProfileChange={(event) => {setDomainProfile(event)}}
              domainProfileNames={allDomainProfiles.map((p) => p.name)}
            />

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
          {contextMenu.visible && contextMenu.nodeId && (
            <ContextMenu
              id={contextMenu.nodeId}
              top={contextMenu.top}
              left={contextMenu.left}
              onAction={handleAction}
            />
          )}
        </div>

        <div className="relative flex bg-gray-100 h-[calc(100vh_-_60px)]  border-gray-200 border">
          <div
            className={`transition-all duration-300 ${isPanelOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >

            <button
              onClick={togglePanel}
              style={{
                width: "24px",
                paddingLeft: "4px",
              }}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white text-center p-2 rounded-r-lg shadow-md hover:bg-gray-600 z-50 ${isPanelOpen ? "-left-0" : "hidden"} ${isValidationOpen ? "hidden" : ""}`}
            >

              {isPanelOpen ? "→" : "←"}
            </button>
            <button
              onClick={togglePanel}
              style={{
                width: "24px"
              }}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 ${isPanelOpen ? "hidden" : "right-0"} ${isValidationOpen ? "hidden" : ""}`}
            >
              {isPanelOpen ? "→" : "←"}
            </button>


            {isPanelOpen && <CustomPanel metadata={metadata} onUpdateMetadata={setMetadata} />}
          </div>
        </div>


      </main>
    </>
  );
}


export default App;
