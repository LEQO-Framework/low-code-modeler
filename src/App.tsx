import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  MiniMap,
  getNodesBounds,
  useUpdateNodeInternals,
  SelectionMode,
  Connection,
  MarkerType,
  applyNodeChanges,
  NodeChange,
  XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { nodesMap, edgesMap, ydoc, awareness, yProvider } from "@/yjs";
import { ContextMenu, CustomPanel, Palette } from "./components";
import Toolbar from "./components/toolbar";
import { nodesConfig, tutorial } from "./config/site";
import { appendHistory, useStore } from "./config/store";
import { expandsWithoutQasm, openBlock } from "./lib/circuitLevel";
import { analyzeComponents } from "./lib/componentAnalyzer";
import { useShallow } from "zustand/react/shallow";
import { findNodeDefinition, handleDragOver } from "./lib/utils";
import useKeyBindings from "./hooks/useKeyBindings";
import { toSvg } from "html-to-image";
import { initialDiagram } from "./config/site";
import Modal, { NewDiagramModal } from "./Modal";
import "./index.css";
import { Placement } from "react-joyride";
import { startCompile } from "./backend";
import {
  ancillaConstructColor,
  classicalConstructColor,
  ClassicalOperatorNode,
  controlFlowConstructColor,
  grover,
  hadamard_test_imaginary_part,
  hadamard_test_real_part,
  qaoa,
  quantumConstructColor,
  swap_test,
  quantum_k_means,
  custom_template,
  templates,
  PluginNode,
} from "./constants";
import Joyride from "react-joyride";
import { ConfigModal } from "./components/modals/configModal";
import { QunicornModal } from "./components/modals/qunicornModal";
import { SendRequestModal } from "./components/modals/backendModal";
import { Toast } from "./components/modals/toast";
import ExperienceModePanel from "./components/modals/experienceLevelModal";
import { HistoryItem, HistoryModal } from "./components/modals/historyModal";
import { ValidationModal } from "./components/modals/validationModal";
import AiModal from "./components/modals/aiModal";
import OpenAI from "openai";
import {
  grover_algorithm,
  hadamard_test_imaginary_part_algorithm,
  hadamard_test_real_part_algorithm,
  qaoa_algorithm,
  swap_test_algorithm,
  quantum_k_means_algorithm,
} from "./constants/templates";
import JSZip from "jszip";
import {
  createDeploymentModel,
  createNodeType,
  createServiceTemplate,
  updateNodeType,
  updateServiceTemplate,
} from "./winery";
import {
  categories,
  CategoryEntry,
  Template,
} from "./components/panels/categories";
import { ManageTemplateModal } from "./components/modals/templateModal";
import { v4 as uuid } from "uuid";
import DomainProfileModal, {
  DomainProfile,
} from "./components/modals/domainProfileModal";
import { PatternSelectionModal } from "./components/modals/patternSelectionModal";
import { PatternImplementationSelectionModal } from "./components/modals/patternImplementationSelectionModal";
import { groupSelectedNodes, handleNodeDropOnGroup } from "./lib/groupHandler";
import UserCountPanel from "./components/modals/userAwareness";
import VersioningPanel from "./components/modals/versioningModal";
import { EdgeChange } from "@xyflow/react";
import PromptFlowModal from "./components/modals/promptFlowModal";
import ShortcutHelpModal from "./components/modals/shortcutHelpModal";
import { openQasmToFlow } from "./qasmConverter";
import { TestingModal } from "./components/modals/testingModal";
import { validateModelStructure } from "./lib/modelValidation";
import { validateFileContents } from "./lib/fileValidation";
import { UNARY_OPERATORS } from "./lib/nodeSpecs";
import { portTypeIndex, withPortTypes } from "./lib/portTypes";
import {
  EdgeHighlightMarkers,
  EdgeHighlightProvider,
} from "./components/edges/edgeHighlightContext";
import {
  amplitude_encoding,
  angle_encoding,
  basis_encoding,
  bell_state_phi_plus,
  classical_clustering,
  conditional_quantum_model,
  custom_quantum_operator,
  empty_model,
  encode_value,
  first_measurement,
  ghz,
  grover_building_blocks,
  grover_circuit_level,
  hello_quantum,
  multi_controlled_gates,
  quantum_arithmetic,
  quantum_clustering,
  quantum_fourier_transform,
} from "./constants/exampleModels";

const selector = (state: {
  nodes: Node[];
  edges: Edge[];
  pendingNodeInitializationId: string | null;
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
  completeNodeInitialization: (nodeId: string) => void;
  updateParent: (nodeId: string, parentId: string, position: any) => void;
  updateChildren: (nodeId: string, children: any) => void;
  setNodes: (node: Node) => void;
  setEdges: (edge: Edge) => void;
  setCompact: (compact: boolean) => void;
  setCompletionGuaranteed: (completionGuaranteed: boolean) => void;
  setExperienceLevel: (experienceLevel: string) => void;
  addUserTemplate: (template: Template) => void;
  setUserTemplates: (newTemplates: Template[]) => void;
  setAllDomainProfiles: (newProfiles: DomainProfile[]) => void;
  autoConnectOnEdgeDrop: boolean;
  setAutoConnectOnEdgeDrop: (enabled: boolean) => void;
  autoConnectOnSameLine: boolean;
  setAutoConnectOnSameLine: (enabled: boolean) => void;
  setContainsPlaceholder: (containsPlaceholder: boolean) => void;
  undo: () => void;
  redo: () => void;
}) => ({
  nodes: state.nodes,
  edges: state.edges,
  pendingNodeInitializationId: state.pendingNodeInitializationId,
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
  completeNodeInitialization: state.completeNodeInitialization,
  updateParent: state.updateParent,
  updateChildren: state.updateChildren,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setCompact: state.setCompact,
  setCompletionGuaranteed: state.setCompletionGuaranteed,
  setContainsPlaceholder: state.setContainsPlaceholder,
  setExperienceLevel: state.setExperienceLevel,
  addUserTemplate: state.addUserTemplate,
  setUserTemplates: state.setUserTemplates,
  setAllDomainProfiles: state.setAllDomainProfiles,
  autoConnectOnEdgeDrop: state.autoConnectOnEdgeDrop,
  setAutoConnectOnEdgeDrop: state.setAutoConnectOnEdgeDrop,
  autoConnectOnSameLine: state.autoConnectOnSameLine,
  setAutoConnectOnSameLine: state.setAutoConnectOnSameLine,
  undo: state.undo,
  redo: state.redo,
});

type HandleCandidate = {
  id: string;
  domain: "classical" | "quantum" | "unknown";
  index: number;
};

const getHandleDomain = (handleId: string): HandleCandidate["domain"] => {
  if (handleId.includes("classical")) return "classical";
  if (handleId.includes("quantum") || handleId.includes("sideQuantum")) {
    return "quantum";
  }
  return "unknown";
};

const getRenderedHandles = (
  nodeId: string,
  node: Node,
  direction: "source" | "target",
): HandleCandidate[] => {
  const nodeElement = Array.from(
    document.querySelectorAll<HTMLElement>(".react-flow__node"),
  ).find((element) => element.dataset.id === nodeId);

  if (!nodeElement) return [];

  return Array.from(
    nodeElement.querySelectorAll<HTMLElement>(
      `.react-flow__handle.${direction}[data-handleid]`,
    ),
  )
    .map((handle) => {
      const id = handle.dataset.handleid;
      if (!id) return null;

      return {
        id,
        domain: getHandleDomain(id),
        index: portTypeIndex(node, id),
      };
    })
    .filter((handle): handle is HandleCandidate => handle !== null);
};

const getNodeCenter = (node: Node) => {
  const x = node.positionAbsolute?.x ?? node.position.x;
  const y = node.positionAbsolute?.y ?? node.position.y;
  return {
    x: x + (node.width ?? 0) / 2,
    y: y + (node.height ?? 0) / 2,
  };
};

const getClosestRenderedEdgePoint = (
  edgeId: string,
  point: { x: number; y: number },
  reactFlowInstance: any,
) => {
  const edgeElement = Array.from(
    document.querySelectorAll<SVGGElement>(".react-flow__edge"),
  ).find((element) => element.dataset.testid === `rf__edge-${edgeId}`);
  const path = edgeElement?.querySelector<SVGPathElement>(
    ".react-flow__edge-path",
  );

  if (!path || !reactFlowInstance) return null;

  const matrix = path.getScreenCTM();
  if (!matrix) return null;

  const pointOnScreen = reactFlowInstance.flowToScreenPosition(point);
  const totalLength = path.getTotalLength();

  let searchStartProgress = 0;
  let searchEndProgress = 1;
  let closest: {
    distance: number;
    screenPoint: { x: number; y: number };
    progress: number;
  } | null = null;

  const refinementSteps = 5;
  const samplesPerStep = 10;
  for (let step = 0; step < refinementSteps; step += 1) {
    const progressStep =
      (searchEndProgress - searchStartProgress) / samplesPerStep;

    for (let index = 0; index <= samplesPerStep; index += 1) {
      const pathProgress = searchStartProgress + progressStep * index;
      const pathPoint = path.getPointAtLength(totalLength * pathProgress);

      const screenPoint = new DOMPoint(
        pathPoint.x,
        pathPoint.y,
      ).matrixTransform(matrix);

      const distance = Math.hypot(
        pointOnScreen.x - screenPoint.x,
        pointOnScreen.y - screenPoint.y,
      );

      if (!closest || distance < closest.distance) {
        closest = {
          distance,
          progress: pathProgress,
          screenPoint: {
            x: screenPoint.x,
            y: screenPoint.y,
          },
        };
      }
    }

    if (closest) {
      searchStartProgress = Math.max(0, closest.progress - progressStep);
      searchEndProgress = Math.min(1, closest.progress + progressStep);
    }
  }

  if (!closest) {
    return null;
  } else {
    return {
      distance: closest.distance,
      point: reactFlowInstance.screenToFlowPosition(closest.screenPoint),
    };
  }
};

function App() {
  const reactFlowWrapper = React.useRef<any>(null);
  const nodeDragStartPositions = React.useRef(new Map<string, XYPosition>());
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const {
    nodes,
    edges,
    pendingNodeInitializationId,
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
    autoConnectOnEdgeDrop,
    setAutoConnectOnEdgeDrop,
    autoConnectOnSameLine,
    setAutoConnectOnSameLine,
    setDomainProfile,
    addUserTemplate,
    setUserTemplates,
    setTypeError,
    setCompact,
    setExperienceLevel,
    setCompletionGuaranteed,
    setSelectedNode,
    setNodes,
    updateNodeValue,
    completeNodeInitialization,
    updateParent,
    updateChildren,
  } = useStore(useShallow(selector));

  /**
   * Waits until React Flow has measured the newly added node before
   * running the enabled automatic connection strategies.
   */
  useEffect(() => {
    if (
      !pendingNodeInitializationId ||
      !nodes.some((node) => node.id === pendingNodeInitializationId)
    ) {
      return undefined;
    }

    const initializationId = pendingNodeInitializationId;

    const frame = requestAnimationFrame(() => {
      const initializedNode = nodes.find(
        (node) => node.id === initializationId,
      );

      if (
        !initializedNode ||
        initializedNode.width == null ||
        initializedNode.height == null
      ) {
        return;
      }

      automaticConnections(initializedNode, nodes, edges);
      completeNodeInitialization(initializationId);
    });

    return () => cancelAnimationFrame(frame);
  }, [nodes, edges, pendingNodeInitializationId, completeNodeInitialization]);

  // TODO: don't use if no collab mode

  const [metadata, setMetadata] = React.useState<any>({
    version: "1.0.0",
    name: "My Model",
    description: "This is a model.",
    author: "",
    containsPlaceholder: false,
  });

  const historyArray = ydoc.getArray<any>("history");
  const [versioningHistory, setVersioningHistory] = useState<any[]>([]);

  const [nodesI, setNodesI] = useState<Node[]>([]);
  const [edgesI, setEdgesI] = useState<Edge[]>([]);
  useEffect(() => {
    const update = () => {
      setVersioningHistory([...historyArray.toArray()]);
      console.log(versioningHistory);
    };

    historyArray.observe(update);
    update();

    return () => historyArray.unobserve(update);
  }, []);

  const [userName, setUserName] = useState<string>("Default Name");

  const onUserNameChange = (newName) => {
    console.log("newName", newName);
    setUserName(newName);
    const currentCursorState = awareness.getLocalState()?.cursor || {};
    awareness.setLocalStateField("cursor", {
      ...currentCursorState,
      name: newName,
    }); //update only name
    console.log("cursors", cursors);
  };

  const [, setMenu] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const [nisqAnalyzerEndpoint, setNisqAnalyzerEndpoint] = useState(
    import.meta.env.VITE_NISQ_ANALYZER || "http://localhost:8098/nisq-analyzer",
  );
  const [camundaEndpoint, setCamundaEndpoint] = useState(
    import.meta.env.VITE_CAMUNDA7_ENDPOINT ||
      "http://localhost:8090/engine-rest",
  );

  const [openAIToken, setOpenAIToken] = useState(
    import.meta.env.VITE_OPENAI_TOKEN,
  );
  const [mistralToken, setMistralToken] = useState(
    import.meta.env.VITE_MISTRAL_TOKEN,
  );
  const [qunicornEndpoint, setQunicornEndpoint] = useState(
    import.meta.env.VITE_QUNICORN || "http://localhost:8080",
  );
  const [lowcodeBackendEndpoint, setLowcodeBackendEndpoint] = useState(
    import.meta.env.VITE_LOW_CODE_BACKEND || "http://localhost:8000",
  );

  const [patternAtlasApiEndpoint, setPatternAtlasApiEndpoint] = useState(
    import.meta.env.VITE_PATTERN_ATLAS_API ||
      "http://localhost:1977/patternatlas/patternLanguages/af7780d5-1f97-4536-8da7-4194b093ab1d",
  );
  const [patternAtlasUiEndpoint, setPatternAtlasUiEndpoint] = useState(
    import.meta.env.VITE_PATTERN_ATLAS_UI || "http://localhost:1978",
  );
  const [qcAtlasEndpoint, setQcAtlasEndpoint] = useState(
    import.meta.env.VITE_QC_ATLAS || "http://localhost:6626",
  );
  const [activeTab, setActiveTab] = useState("editor");
  const [warningExecution, setWarningExecution] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    componentId: string | null;
    top: number;
    left: number;
  }>({
    visible: false,
    componentId: null,
    top: 0,
    left: 0,
  });

  const [cursors, setCursors] = useState<{
    [clientId: number]: {
      name: string;
      x: number;
      y: number;
      color: string;
    };
  }>({});
  const [myClientId, setMyClientId] = useState<number | null>(null);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        componentId: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        componentId: edge.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [],
  );

  const onEdgesDelete = (edges: Edge[]) => {
    edges.forEach((edge) => {
      const targetNodeId = edge.target;
      const targetHandle = edge.targetHandle;
      const targetNode = nodes.find((n) => n.id === targetNodeId);

      // Skip GroupNodes and nodes without inputs
      if (
        !targetNode ||
        !targetNode.data?.inputs ||
        targetNode.type === "groupNode"
      )
        return;

      const newInputs = targetNode.data.inputs.filter(
        (i: any) => i.targetHandle !== targetHandle,
      );
      updateNodeValue(targetNodeId, "inputs", newInputs);
    });
  };

  const handleAction = (action: string, nodeId: string) => {
    console.log(`Action: ${action} on Node: ${nodeId}`);
    setContextMenu((prev) => ({ ...prev, visible: false }));
    if (action === "circuitLevel") showCircuitLevel(nodeId);
  };

  // Opens a block one level towards the circuit level: Grover into its building blocks,
  // other blocks into the gates they compile to (taken from the freshly compiled model).
  const showCircuitLevel = async (nodeId: string) => {
    const nodes: Node[] = reactFlowInstance.getNodes();
    const edges: Edge[] = reactFlowInstance.getEdges();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    let qasm: string | null = null;
    if (!expandsWithoutQasm(node, nodes, edges)) {
      showToast("Compiling the model to get the circuit of this block…", "info");
      try {
        const components = await analyzeComponents(
          nodes,
          edges,
          lowcodeBackendEndpoint,
          metadata,
          compilationTarget,
        );
        qasm =
          components.find((c) => c.qasm?.includes(`Start node ${nodeId}`))
            ?.qasm ?? null;
      } catch (error) {
        console.error("Compiling for the circuit level failed:", error);
      }
      if (!qasm && openqasmCode.includes(`Start node ${nodeId}`)) {
        qasm = openqasmCode;
      }
    }
    const result = openBlock(node, nodes, edges, qasm);
    if (typeof result === "string") {
      showToast(result, "error");
      return;
    }
    useStore.setState((state: any) => ({
      ...appendHistory(state.history, state.historyIndex, {
        nodes: structuredClone(nodes),
        edges: structuredClone(edges),
      }),
      redoStack: [],
    }));
    setSelectedNode(null);
    reactFlowInstance.setNodes(result.nodes);
    reactFlowInstance.setEdges(result.edges);
  };

  const [validationResult, setValidationResult] = useState({
    warnings: [],
    errors: [],
  });
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [githubRepositoryOwner, setGithubRepositoryOwner] = useState(
    import.meta.env.VITE_GITHUB_REPO_OWNER,
  );
  const [githubRepositoryName, setGithubRepositoryName] = useState(
    import.meta.env.VITE_GITHUB_REPO_NAME,
  );
  const [githubBranch, setGithubBranch] = useState(
    import.meta.env.VITE_GITHUB_REPO_BRANCH,
  );
  const [githubToken, setGithubToken] = useState(
    import.meta.env.VITE_GITHUB_TOKEN,
  );
  const [openqasmCode, setOpenQASMCode] = useState("");
  const [, setShowResultModal] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState("aer_simulator");
  const [provider, setProvider] = useState("IBM");

  const [numShots, setNumShots] = useState(1024);
  const [accessToken, setAccessToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [, setErrorJobMessage] = useState("");
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [isPatternImplementationOpen, setIsPatternImplementationOpen] =
    useState(false);
  const [lassoMode, setLassoMode] = useState(false);

  const [mathMode, setMathMode] = useState(false);
  const [qasmEditorMode, setQasmEditorMode] = useState(false);

  const [isLoadJsonModalOpen, setIsLoadJsonModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [executed, setAlreadyExecuted] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [quantumAlgorithmModalStep, setQuantumAlgorithmModalStep] = useState(0);
  const [domainProfileOpen, setDomainProfileOpen] = useState(false);
  const [editingDomainProfileIndex, setEditingDomainProfileIndex] = useState<
    number | null
  >(null);
  const [editingDomainProfile, setEditingDomainProfile] =
    useState<DomainProfile | null>(null);
  const [quantumAlgorithms, setQuantumAlgorithms] = useState([
    {
      name: "Quantum Approximate Optimization Algorithm (QAOA)",
      configCount: 0,
      patternGraphPng: "patterns/qaoa_patterngraph.png",
    },
    { name: "SWAP Test", configCount: 0, patternGraphPng: null },
    { name: "Hadamard Test", configCount: 0, patternGraphPng: null },
    {
      name: "Grover's Algorithm",
      configCount: 0,
      patternGraphPng: "patterns/grover_patterngraph.png",
    },
    { name: "Uniform Superposition", configCount: 0, patternGraphPng: null },
    {
      name: "Initialization",
      configCount: 0,
      patternGraphPng: "patterns/initialization_patterngraph.png",
    },
  ]);

  const [patternGraph, setPatternGraph] = useState(null);
  const [isDetectingAlgorithms, setIsDetectingAlgorithms] = useState(false);

  let client: OpenAI | null = null;
  try {
    if (openAIToken) {
      client = new OpenAI({
        apiKey: openAIToken,
        dangerouslyAllowBrowser: true,
      });
    }
  } catch (e) {
    console.warn("OpenAI init failed, continuing without it:", e);
    client = null;
  }

  const detectQuantumAlgorithms = async (
    userInput: string,
  ): Promise<string | null> => {
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
        "Dynamic Circuits",
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

        if (!Array.isArray(parsed.algorithms))
          throw new Error("Invalid response format");

        setQuantumAlgorithms(
          parsed.algorithms.map((name: string) => ({ name })),
        );

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

  const handleQuantumAlgorithmModalClose = () => {
    setQuantumAlgorithmModalStep(0);
  };

  globalThis.setCamundaEndpoint = setCamundaEndpoint;
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
    console.log(newValues);
    setCamundaEndpoint(newValues.tempCamundaEndpoint);
    setNisqAnalyzerEndpoint(newValues.tempNisqAnalyzerEndpoint);
    setOpenAIToken(newValues.tempOpenAIToken);
    setMistralToken(newValues.tempMistralToken);
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
    setExperienceLevel(newValues.experienceLevel);
    setCompletionGuaranteed(newValues.completionGuaranteed);
    setAutoConnectOnEdgeDrop(newValues.autoConnectOnEdgeDrop);
    setAutoConnectOnSameLine(newValues.autoConnectOnSameLine);
    setCollaborationModeOn(newValues.collaborationMode); // passt das?? lieber onToggleCollaborationMode?
    onUserNameChange(newValues.userName);

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
  const [splitPreview, setSplitPreview] = useState<{
    edgeId: string;
    splitPoint: { x: number; y: number };
    canSplit: boolean;
    reasons: string[];
  } | null>(null);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    document
      .querySelectorAll<SVGGElement>(".react-flow__edge")
      .forEach((edge) => {
        const isHighlighted =
          edge.dataset.testid === `rf__edge-${highlightedEdgeId}`;
        edge.classList.toggle(
          "split-highlighted",
          isHighlighted && splitPreview?.canSplit === true,
        );
        edge.classList.toggle(
          "split-highlighted-invalid",
          isHighlighted && splitPreview?.canSplit === false,
        );
      });
  }, [highlightedEdgeId, splitPreview?.canSplit, edges]);
  const [deploymentId, setDeploymentId] = useState(null);

  const [expanded, setExpanded] = useState(false);

  const { undo } = useStore((state) => ({
    undo: state.undo,
  }));

  const { redo } = useStore((state) => ({
    redo: state.redo,
  }));

  const ref = useRef(null);
  const snapTargetRef = useRef<Node | null>(null);
  const hasLoadedFromUrl = useRef(false);
  const lastSelectedNodes = useRef<Node[]>([]);
  const copiedSelectionRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(
    null,
  );
  const pasteCountRef = useRef(0);

  const onDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      handleDragOver(event);
    },
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [, setLoading] = useState(false);
  const [, setStatus] = useState("");
  const [modalStep, setModalStep] = useState(1);
  const [isQunicornOpen, setIsQunicornOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [stateTest, setStateTest] = useState(1);
  const [, setExperienceLevelOn] = useState("explorer");
  const [compactVisualization, setCompactVisualization] = useState(false);
  const [collaborationModeOn, setCollaborationModeOn] = useState(false);
  //const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const isTestingFeatureEnabled =
    import.meta.env.VITE_ENABLE_NODE_TESTING === "true";
  const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: React.ReactNode;
    type: "success" | "error" | "info";
  } | null>(null);

  const [, setWorkflow] = useState("");
  const [panelWidth, setPanelWidth] = useState(350);

  const updateNodeInternals = useUpdateNodeInternals();

  const showToast = (
    message: React.ReactNode,
    type: "success" | "error" | "info",
  ) => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (typeError) {
      showToast(typeError, "error");
    }
  }, [typeError, showToast, setTypeError]);

  const isSyncingFromRemote = useRef(false);

  const stripTransientNodeState = useCallback((node: Node) => {
    const {
      selected: _selected,
      dragging: _dragging,
      positionAbsolute: _positionAbsolute,
      ...rest
    } = node as Node & {
      selected?: boolean;
      dragging?: boolean;
      positionAbsolute?: { x: number; y: number };
    };

    return rest;
  }, []);

  // EFFECT 1: Remote-to-Local (Yjs to Zustand & nodesI)
  useEffect(() => {
    if (!collaborationModeOn) return;

    const updateFromRemote = () => {
      // set flag, so that this is ignored by effect 2
      isSyncingFromRemote.current = true;

      const localNodes = useStore.getState().nodes;
      const localNodesById = new Map<string, Node>(
        localNodes.map((node: Node) => [node.id, node]),
      );

      const sharedNodes: any = Array.from(nodesMap.values()).map(
        (sharedNode: any) => {
          const localNode = localNodesById.get(sharedNode.id);

          if (!localNode) {
            return sharedNode;
          }

          return {
            ...sharedNode,
            selected: localNode.selected,
            dragging: localNode.dragging,
          };
        },
      );
      const sharedEdges: any = Array.from(edgesMap.values());

      // Update the local rendering tracking arrays
      setNodesI(sharedNodes);
      setEdgesI(sharedEdges);

      // Forcefully inject remote changes into Zustand.
      // Stringify check to prevent triggering an infinite state update loop.
      const currentLocalState = useStore.getState();

      if (
        JSON.stringify(currentLocalState.nodes) !==
          JSON.stringify(sharedNodes) ||
        JSON.stringify(currentLocalState.edges) !== JSON.stringify(sharedEdges)
      ) {
        useStore.setState({
          nodes: sharedNodes,
          edges: sharedEdges,
        });
      }
      // reset flag
      setTimeout(() => {
        isSyncingFromRemote.current = false;
      }, 50);
    };

    // Listen to remote changes on the Yjs maps
    nodesMap.observe(updateFromRemote);
    edgesMap.observe(updateFromRemote);

    // Run immediately on mount/enable to pull initial room state
    updateFromRemote();

    return () => {
      nodesMap.unobserve(updateFromRemote);
      edgesMap.unobserve(updateFromRemote);
    };
  }, [collaborationModeOn]);

  // EFFECT 2: Local-to-Remote (Zustand to Yjs)
  useEffect(() => {
    if (!collaborationModeOn || isSyncingFromRemote.current) return;

    // Bundle operations into a single transaction block
    ydoc.transact(() => {
      // Sync local Zustand nodes to the network map
      nodes.forEach((node) => {
        // Keep transient React Flow interaction state local.
        const nodeData = stripTransientNodeState(node);

        const remoteNode = nodesMap.get(node.id);
        if (
          !remoteNode ||
          JSON.stringify(remoteNode) !== JSON.stringify(nodeData)
        ) {
          nodesMap.set(node.id, nodeData);
        }
      });

      // Handle local deletions (If it's in Yjs but missing from local Zustand, delete from Yjs)
      nodesMap.forEach((_, id) => {
        if (!nodes.some((n) => n.id === id)) {
          nodesMap.delete(id);
        }
      });

      // Sync local Zustand edges to the network map
      edges.forEach((edge) => {
        const remoteEdge = edgesMap.get(edge.id);
        if (
          !remoteEdge ||
          JSON.stringify(remoteEdge) !== JSON.stringify(edge)
        ) {
          edgesMap.set(edge.id, edge);
        }
      });

      // Handle edge deletions
      edgesMap.forEach((_, id) => {
        if (!edges.some((e) => e.id === id)) {
          edgesMap.delete(id);
        }
      });
    });
  }, [nodes, edges, collaborationModeOn]);

  // useEffect(() => {
  //   console.log("rerun")

  //   if(!collaborationModeOn) return;

  //   // observe remote changes
  //   const nodesObserver = () => {
  //     const sharedNodes = Array.from(nodesMap.values());
  //     setNodesI(sharedNodes);
  //     console.log(nodesI)
  //   };

  //   const edgesObserver = () => {
  //     const sharedEdges = Array.from(edgesMap.values());
  //     setEdgesI(sharedEdges);
  //     console.log(edgesI)
  //   };

  //   nodesObserver();
  //   edgesObserver()
  //   nodesMap.observe(nodesObserver);
  //   edgesMap.observe(edgesObserver);
  //   return () => { nodesMap.unobserve(nodesObserver); edgesMap.unobserve(edgesObserver) };

  // }, [collaborationModeOn]);

  // needed?
  useEffect(() => {
    const updateCursors = () => {
      const newCursors: typeof cursors = {};
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (state.cursor) {
          // Replace name with "Me" if this is your client
          // --> maybe not??
          newCursors[clientId] = {
            ...state.cursor,
            //name: clientId === awareness.clientID ? "Me" : state.cursor.name
          };
        }
      });
      setCursors(newCursors);
    };

    awareness.on("change", updateCursors);
    updateCursors();

    console.log("CURSORS", cursors);

    return () => awareness.off("change", updateCursors);
  }, []);

  useEffect(() => {
    if (collaborationModeOn) {
      // Generate a random username
      const randomNames = [
        "Alice",
        "Bob",
        "Charlie",
        "Dana",
        "Eve",
        "Frank",
        "Grace",
        "Hugo",
      ];
      const randomUsername =
        randomNames[Math.floor(Math.random() * randomNames.length)];
      // Store local clientId
      setMyClientId(awareness.clientID);

      const color = "#" + Math.floor(Math.random() * 16777215).toString(16);

      // Set initial cursor state with username
      awareness.setLocalStateField("cursor", {
        x: 0,
        y: 0,
        color: color,
        name: randomUsername,
        role: experienceLevel,
      });

      awareness.setLocalStateField("locks", {
        nodeIds: [],
      });

      // set initial user name
      setUserName(randomUsername);
      console.log("CURSORS", cursors);
    }
  }, [collaborationModeOn]);

  // Sync local Zustand store changes to Yjs Awareness state fields
  useEffect(() => {
    if (!awareness) return;

    const currentLocalState = awareness.getLocalState();
    const existingCursor = currentLocalState?.cursor || {};

    awareness.setLocalStateField("cursor", {
      ...existingCursor,
      // Normalize to lowercase strings to eliminate case mismatch in comparisons
      role: experienceLevel?.toLowerCase(),
      experienceLevel: experienceLevel?.toLowerCase(),
    });
  }, [experienceLevel]);

  const [runTour, setRunTour] = useState(false);

  const joyrideSteps: {
    target: string;
    content: string;
    placement?: Placement;
  }[] = [
    {
      target: ".toolbar-container",
      content:
        "This is the toolbar where you can save, restore, or send your diagrams.",
    },
    {
      target: ".backend-button",
      content:
        "This transforms the model into QASM code or workflows, which can then be executed on quantum devices or on a workflow engine.",
    },
    {
      target: ".palette-container",
      content:
        "This is the palette, where you can drag and drop blocks. Quantum blocks are depicted in blue and classical blocks are depicted in orange.",
      placement: "right",
    },
    {
      target: ".react-flow__pane",
      content: "This is the main diagram canvas.",
      placement: "top-start",
    },
    {
      target: ".experience-mode",
      content:
        "This panel allows you to configure the editor based on your preferences.",
      placement: "right",
    },
    {
      target: ".classical-node",
      content: "This is a classical node that requires a value.",
    },
    {
      target: ".grand-parent",
      content:
        "This value is then encoded via the state preparation block into a quantum state.",
    },
    {
      target: ".currentPanel-container",
      content:
        "This is the properties panel, where you can configure the properties of blocks or the model.",
      placement: "left",
    },
  ];

  const [, setProcessingModalOpen] = useState(false);

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

  type Node2 = {
    mapping?: string[][];
  };

  type Flow = {
    nodes: Node2[];
  };

  function hasMultipleMappingsInFlow(flow: Flow): boolean {
    for (const node of flow.nodes) {
      if (!node.mapping || node.mapping.length === 0) continue;

      // Convert each sub-array to a string
      const mappingStrings = node.mapping.map((arr) => arr.join("+"));

      // Check unique mappings
      const uniqueMappings = new Set(mappingStrings);

      if (uniqueMappings.size > 1) {
        return true; // Found a node with multiple distinct mappings
      }
    }

    return false; // No node with multiple mappings found
  }
  // Returns the compiled OpenQASM, or null when the compilation failed.
  const sendToBackend = async (): Promise<string | null> => {
    //setLoading(true);
    setModalOpen(false);
    setProcessingModalOpen(true);

    let id = `flow-${Date.now()}`;
    if (compilationTarget === "qasm") {
      showToast("QASM request for model " + id + " submitted.", "info");
    } else {
      showToast("Workflow request for model " + id + " submitted.", "info");
    }

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
        reactFlowInstance
          .getNodes()
          .map((n) => ({
            ...n,
            parentNode: undefined,
            extent: undefined,
            position: n.positionAbsolute ?? n.position,
          }))
          .filter((n) => n.type !== "groupNode"),
        (() => {
          const allNodes = reactFlowInstance.getNodes();
          const allEdges = reactFlowInstance.getEdges();
          const expandedEdges: typeof allEdges = [];

          const findNodeFromHandle = (
            handleId: string | null,
            groupId: string,
          ): Node | undefined => {
            if (!handleId) return undefined;
            const children = allNodes.filter(
              (n) => n.parentNode === groupId && n.type !== "groupNode",
            );
            // check whether the handle ID contains a child node ID
            const match = children.find((n) => handleId.includes(n.id));
            if (match) return match;
            // fallback: for a group handle (groupInput/groupOutput),
            // take the first or last child node
            if (handleId.includes("groupInput")) {
              // take the first child node with a free input
              return (
                children.find(
                  (n) => n.type === "gateNode" && n.data?.inputs?.length > 0,
                ) ?? children[0]
              );
            }
            if (handleId.includes("groupOutput")) {
              // take the last child node (output)
              return children[children.length - 1];
            }
            return children[0];
          };

          for (const edge of allEdges) {
            const srcNode = allNodes.find((n) => n.id === edge.source);
            const tgtNode = allNodes.find((n) => n.id === edge.target);

            if (
              srcNode?.type === "groupNode" ||
              tgtNode?.type === "groupNode"
            ) {
              const realSrc =
                srcNode?.type === "groupNode"
                  ? (findNodeFromHandle(edge.sourceHandle, srcNode.id) ??
                    allNodes.filter(
                      (n) =>
                        n.parentNode === srcNode.id && n.type !== "groupNode",
                    )[0])
                  : srcNode;
              const realTgt =
                tgtNode?.type === "groupNode"
                  ? (findNodeFromHandle(edge.targetHandle, tgtNode.id) ??
                    allNodes.filter(
                      (n) =>
                        n.parentNode === tgtNode.id && n.type !== "groupNode",
                    )[0])
                  : tgtNode;

              if (realSrc && realTgt) {
                // build the correct handle IDs if these were group handles
                const newSourceHandle = edge.sourceHandle?.includes(
                  "groupOutput",
                )
                  ? `quantumHandleGateOutput0${realSrc.id}`
                  : edge.sourceHandle;
                const newTargetHandle = edge.targetHandle?.includes(
                  "groupInput",
                )
                  ? `quantumHandleGateInput0${realTgt.id}`
                  : edge.targetHandle;

                expandedEdges.push({
                  ...edge,
                  id: `expanded-${edge.id}`,
                  source: realSrc.id,
                  target: realTgt.id,
                  sourceHandle: newSourceHandle,
                  targetHandle: newTargetHandle,
                });
              }
            } else {
              expandedEdges.push(edge);
            }
          }
          return expandedEdges;
        })(),
        compilationTarget,
      );
      console.log(response);

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
                console.error(
                  "Max polling attempts reached. Operation did not complete.",
                );
                showToast(
                  "Max polling attempts for model " + id + " reached.",
                  "error",
                );
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
      setShowResultModal(true);
      setTimeout(() => {
        setStatus("completed");
        setLoading(false);
        showToast("Result for model " + id + " is available.", "success");
      }, 3000);
      setStatus("completed");
      setLoading(false);
      return openqasmCode;
    } catch (error) {
      console.error("Error sending data:", error);
      showToast(
        "Error during result generation for model " + id + ".",
        "error",
      );
      setLoading(false);
      return null;
    }
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [_historyLoading, setHistoryLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      let generationItems: HistoryItem[] = [];
      let executionItems: HistoryItem[] = [];

      // Fetch generation jobs
      try {
        const jobsRes = await fetch(`http://localhost:3000/jobs`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (jobsRes.ok) {
          const jobs = await jobsRes.json();

          generationItems = (jobs || []).map((job: any) => ({
            uuid: job.id,
            name: "Generation Job",
            description: job.prompt,
            status: job.status,
            created: job.createdAt,
            type: "generation",
            result: job.result,
            semanticScore: job.semanticScore,
            missingValues: job.missingValues,
            links: {
              request: `http://localhost:3000/job/${job.id}/request`,
              result: `http://localhost:3000/job/${job.id}/result`,
            },
          }));
        } else {
          console.error("Failed to fetch generation jobs:", jobsRes.status);
        }
      } catch (err) {
        console.error("Error fetching generation jobs:", err);
      }

      // Fetch execution results
      try {
        const response = await fetch(`${lowcodeBackendEndpoint}/results`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();

          executionItems = (data || []).map((job: any) => ({
            uuid: job.uuid,
            name: job.name,
            description: job.description,
            status: job.status,
            created: job.created,
            type: "execution",
            links: job.links,
          }));
        } else {
          console.error(
            "Failed to fetch execution history:",
            response.status,
            response.statusText,
          );
        }
      } catch (err) {
        console.error("Error fetching execution history:", err);
      }

      // Works even if one or both arrays are empty
      setHistory([...generationItems, ...executionItems]);
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
    console.log("load tutorial");
    overwriteFlow(tutorial);
    console.log("load toturial");
  };

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
      if (!nodeConnections.has(edge.target))
        nodeConnections.set(edge.target, []);
      nodeConnections.get(edge.target)?.push(edge.source);
    });

    console.log(flow.edges);

    // Map sourceNodeId => targetNodeIds[] for output checks
    const outgoingConnections = new Map<string, string[]>();
    flow.edges?.forEach((edge) => {
      if (!outgoingConnections.has(edge.source))
        outgoingConnections.set(edge.source, []);
      outgoingConnections.get(edge.source)?.push(edge.target);
    });

    // Existing node validation
    flow.nodes?.forEach((node) => {
      const { outputIdentifier, label, condition, operator } = node.data || {};
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
        "CU",
      ];
      const threeQubitGates = ["Toffoli", "CSWAP"];
      const minMaxOperators = ["Min", "Max"];
      const isOperatorNode =
        node.type === "quantumOperatorNode" ||
        node.type === "classicalOperatorNode";

      if (
        isOperatorNode &&
        UNARY_OPERATORS.includes(operator) &&
        inputCount !== 1
      ) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          description: `Node "${node.id}" with label "${label}" and operator "${operator}" requires exactly 1 input, but got ${inputCount}.`,
        });
      }

      if (
        twoQubitGates.includes(label) ||
        (isOperatorNode && !UNARY_OPERATORS.includes(operator))
      ) {
        if (inputCount !== 2) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" with label "${label}" requires exactly 2 inputs, but got ${inputCount}.`,
          });
        }
        if (
          node.data.label === "Quantum Comparison Operator" ||
          node.data.label === "Quantum Min & Max Operator"
        ) {
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

      if (
        node.data.label === "Qubit" &&
        (node.data.size === undefined || node.data.size === 0)
      ) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          description: `Node "${node.id}" needs a size value.`,
        });
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
          [
            "Encode Value",
            "Basis Encoding",
            "Angle Encoding",
            "Amplitude Encoding",
          ].includes(node.data.label)
        ) {
          const hasClassical = flow.edges?.some(
            (edge) =>
              edge.target === node.id &&
              (edge.type === "classicalEdge" ||
                edge.targetHandle?.startsWith("classicalHandle")),
          );
          if (!hasClassical) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" has no classical data input connected.`,
            });
          }
          if (
            node.data.encodingType === "Custom Encoding" &&
            !node.data.implementation
          ) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" is missing an implementation for custom encoding.`,
            });
          }
        }

        // The size of Prepare State is checked by validateModelStructure.
        if (node.data.label === "Prepare State") {
          if (
            node.data.quantumStateName === "Custom State" &&
            !node.data.implementation
          ) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Node "${node.id}" is missing implementation for custom state.`,
            });
          }
        }

        // MCMT Gate validation
        if (
          node.type === "mcmt-gate" ||
          node.data?.label === "MCMT Gate" ||
          node.type === "MCMTGateNode"
        ) {
          const numControls = parseInt(node.data.numControls, 10) || 1;
          const numTargets = parseInt(node.data.numTargets, 10) || 1;
          const expectedInputsCount = numControls + numTargets;

          const connectedEdges = edges.filter(
            (edge) => edge.target === node.id,
          );

          const prefix = "quantumHandleInput";
          const connectedIndices = new Set(
            connectedEdges
              .map((edge) => {
                if (
                  edge.targetHandle &&
                  edge.targetHandle.startsWith(prefix) &&
                  edge.targetHandle.endsWith(node.id)
                ) {
                  const indexStr = edge.targetHandle.substring(
                    prefix.length,
                    edge.targetHandle.length - node.id.length,
                  );
                  return parseInt(indexStr, 10);
                }
                return null;
              })
              .filter((idx) => idx !== null),
          );

          const missingIndices: number[] = [];
          for (let i = 0; i < expectedInputsCount; i++) {
            if (!connectedIndices.has(i)) {
              missingIndices.push(i);
            }
          }

          if (missingIndices.length > 0) {
            const firstMissing = missingIndices[0];
            const missingLabel =
              firstMissing < numControls
                ? `Control ${firstMissing}`
                : `Target ${firstMissing - numControls}`;

            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `MCMT Gate block requires ${expectedInputsCount} connected inputs, but is missing an incoming wire at "${missingLabel}".`,
            });
          }
        }

        const outgoing = outgoingConnections.get(node.id) || [];
        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Node "${node.id}" has no output connection (unused quantum register).`,
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
      const value = node.data?.value;

      if (typeof value === "string" && node.data.label === "Number") {
        const startsWithNumber = /^[+-]?\d/.test(value.trim());
        const hasLetter = /[a-zA-Z]/.test(value);

        if (startsWithNumber && hasLetter) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Invalid value "${value}". Values starting with a number cannot contain letters.`,
          });
        }
      }

      // Control / If Nodes
      if (node.type === "ifElseNode") {
        const hasClassical = connectedSources.some((srcId) => {
          const sourceNode: any = nodesById.get(srcId);
          // A measurement result and an operator output are classical data too,
          // not only a dataTypeNode literal. Needed for measurement-driven ifs
          // like the teleportation corrections (if m == 1 -> X / Z).
          return (
            sourceNode?.type === "dataTypeNode" ||
            sourceNode?.type === "measurementNode" ||
            sourceNode?.type === "operatorNode"
          );
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
      if (
        node.type === "algorithmNode" ||
        node.type === "classicalAlgorithmNode"
      ) {
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

      if (
        node.data?.label === "QFT" ||
        node.type === "qftNode" ||
        node.type === "inverseQftNode"
      ) {
        // the QFT nodes default to a single qubit (see nodes/qft.tsx)
        const qubitCount = parseInt(node.data?.numberOutputs || "1");

        for (let i = 0; i < qubitCount; i++) {
          const handleId = `quantumHandleQFTInput${i}${node.id}`;

          const isConnected = flow.edges?.some(
            (e) => e.targetHandle === handleId,
          );

          if (!isConnected) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `QFT node "${node.id}" is missing connection on input ${i + 1}.`,
            });
          }
        }

        for (let i = 0; i < qubitCount; i++) {
          const handleId = `quantumHandleQFTOutput${i}${node.id}`;

          const isUsed = flow.edges?.some((e) => e.sourceHandle === handleId);

          if (!isUsed) {
            warnings.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `QFT node "${node.id}" output ${i + 1}/${qubitCount} is not used.`,
            });
          }
        }
      }

      // Universal Oracle Validation
      if (
        node.type === "universal-oracle" ||
        node.data?.label === "Universal Oracle"
      ) {
        const connectedInput = connectedSources.length > 0;

        if (!connectedInput) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Universal Oracle "${node.id}" requires a quantum register input.`,
          });
        }

        const mode = node.data?.mode;
        if (mode && !["boolean", "phase"].includes(mode)) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Universal Oracle "${node.id}" has invalid mode "${mode}".`,
          });
        }

        const targetStates = node.data?.targetStates;

        if (!targetStates || targetStates.trim() === "") {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Universal Oracle "${node.id}" requires at least one marked state.`,
          });
        } else if (!/^\d+(?:\s*,\s*\d+)*$/.test(targetStates.trim())) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Universal Oracle "${node.id}" marked states must be comma-separated integers.`,
          });
        } else {
          // Find input register size
          let registerSize = 3;

          const source = connectedSources
            .map((src) => nodesById.get(src))
            .find((n) => n?.data?.size);

          if (source?.data?.size) {
            registerSize = parseInt(source.data.size, 10);
          }

          const maxState = (1 << registerSize) - 1;

          const invalidState = targetStates
            .split(",")
            .map((x: string) => parseInt(x.trim(), 10))
            .some((x: number) => x < 0 || x > maxState);

          if (invalidState) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Universal Oracle "${node.id}" contains marked states outside register range 0-${maxState}.`,
            });
          }
        }

        const outgoing = outgoingConnections.get(node.id) || [];
        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Universal Oracle "${node.id}" output is not connected.`,
          });
        }
      }

      // Deutsch-Jozsa Validation
      if (
        node.type === "deutsch-jozsa" ||
        node.data?.label === "Deutsch-Jozsa Algorithm"
      ) {
        const numQubits = parseInt(node.data?.numQubits, 10);

        if (!numQubits || numQubits <= 0) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Deutsch-Jozsa node "${node.id}" requires a valid number of qubits.`,
          });
        }

        const oracleType = node.data?.oracleType;

        if (!["balanced", "constant"].includes(oracleType)) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Deutsch-Jozsa node "${node.id}" has invalid oracle type "${oracleType}".`,
          });
        }

        if (oracleType === "balanced") {
          const mask = parseInt(node.data?.balancedMask, 10);

          if (isNaN(mask)) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Deutsch-Jozsa balanced oracle requires a mask value.`,
            });
          } else if (numQubits && mask >= 1 << numQubits) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Deutsch-Jozsa balanced mask ${mask} exceeds ${numQubits}-qubit input range.`,
            });
          }
        }

        if (
          oracleType === "constant" &&
          ![0, 1].includes(Number(node.data?.constantValue))
        ) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Deutsch-Jozsa constant value must be either 0 or 1.`,
          });
        }

        const outgoing = outgoingConnections.get(node.id) || [];

        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Deutsch-Jozsa node "${node.id}" output is not connected.`,
          });
        }
      }

      if (node.type === "universal-oracle") {
        const markedStates = node.data?.targetStates;

        if (!markedStates || markedStates.trim() === "") {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Grover node "${node.id}" requires marked states.`,
          });
        }
      }
      // Grover Algorithm Validation
      if (node.type === "grover" || node.data?.label === "Grover Algorithm") {
        const numQubits = parseInt(node.data?.numQubits, 10);

        if (!numQubits || numQubits <= 0) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Grover node "${node.id}" requires a valid number of qubits.`,
          });
        }

        const rawIterations = node.data?.numIterations ?? node.data?.iterations;
        const iterations = Number(rawIterations);

        if (
          rawIterations !== undefined &&
          rawIterations !== "" &&
          !(iterations > 0)
        ) {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Grover iteration count must be greater than zero.`,
          });
        }

        const markedStates = node.data?.targetStates;

        if (!markedStates || markedStates.trim() === "") {
          errors.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Grover node "${node.id}" requires marked states.`,
          });
        } else if (numQubits) {
          const maxState = (1 << numQubits) - 1;

          const invalid = markedStates
            .split(",")
            .map((x: string) => parseInt(x.trim(), 10))
            .some((x: number) => x > maxState);

          if (invalid) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Grover marked states exceed the ${numQubits}-qubit range (0-${maxState}).`,
            });
          }
        }

        const outgoing = outgoingConnections.get(node.id) || [];

        if (outgoing.length === 0) {
          warnings.push({
            nodeId: node.id,
            nodeType: node.type,
            description: `Grover node "${node.id}" output is not connected.`,
          });
        }
      }
      // Plugin Node Validation
      if (node.type === "pluginNode") {
        const dataInputs = node.data?.dataInputs || [];
        const pluginEdges =
          flow.edges?.filter((e) => e.target === node.id) || [];

        dataInputs.forEach((input: any, index: number) => {
          const handleId = `classicalHandlePluginInput${index}${node.id}`;
          const connectedEdge = pluginEdges.find(
            (e) => e.targetHandle === handleId,
          );

          if (input.required && !connectedEdge) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              description: `Required input "${input.parameter}" is not connected.`,
            });
          }

          if (connectedEdge) {
            const sourceNode: any = nodesById.get(connectedEdge.source);
            if (sourceNode) {
              const sourceOutputType = (
                sourceNode.data?.outputTypes?.[0] ?? "any"
              ).toLowerCase();
              const expectedType = (
                node.data?.inputTypes?.[index] ?? "any"
              ).toLowerCase();

              if (
                expectedType !== "any" &&
                sourceOutputType !== "any" &&
                sourceOutputType !== expectedType
              ) {
                errors.push({
                  nodeId: node.id,
                  nodeType: node.type,
                  description: `Input "${input.parameter}" expects type "${expectedType}" but is connected to "${sourceOutputType}".`,
                });
              }
            }
          }
        });
      }
    });

    // Gate node connection to measurement
    const gateNodes = flow.nodes?.filter((n) => n.type === "gateNode") || [];
    const measurementNodes = new Set(
      flow.nodes?.filter((n) => n.type === "measurementNode").map((n) => n.id),
    );

    const visited = new Set<string>();
    function reachesMeasurement(nodeId: string): boolean {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      if (measurementNodes.has(nodeId)) return true;

      const outputs =
        flow.edges?.filter((e) => e.source === nodeId).map((e) => e.target) ||
        [];
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

    // Schema-based checks for data, parameters and flow (lib/modelValidation.ts)
    const structural = validateModelStructure(flow);
    errors.push(...structural.errors);
    warnings.push(...structural.warnings);

    return { warnings, errors };
  }

  // Checks if there are any Nodes conflicting with QASM
  const [containsWorkflowNodes, setContainsWorkflowNodes] = useState(false);
  function checkContainsWorkflowNodes(flow): boolean {
    return flow.nodes?.some(
      (node) =>
        (node.type == "dataTypeNode" &&
          ["String", "File"].includes(node.data?.dataType)) ||
        ["pluginNode"].includes(node.type),
    );
  }

  const startQuantumAlgorithmSelection = () => {
    setQuantumAlgorithmModalStep(1);
  };

  const handleOpenValidation = () => {
    if (!reactFlowInstance) return;

    const flow = reactFlowInstance.toObject();
    const result = validateFlow(flow);
    console.log(flow);
    setContainsWorkflowNodes(checkContainsWorkflowNodes(flow));

    setValidationResult(result);
    setIsValidationOpen(true);

    // File contents have to be downloaded: add their results when available.
    validateFileContents(flow).then((files) => {
      if (files.errors.length === 0 && files.warnings.length === 0) return;
      setValidationResult({
        errors: [...result.errors, ...files.errors],
        warnings: [...result.warnings, ...files.warnings],
      });
    });
  };

  const startTour3 = () => {
    overwriteFlow(modeledDiagram);
  };

  const startTour = () => {
    setRunTour(true);
    console.log("load tutorial");
    console.log("load toturial");
  };
  const handleDeploy = async () => {
    setIsQunicornOpen(true);
    setLoading(true);
    console.log(qunicornEndpoint);

    try {
      let program = {
        programs: [
          {
            //"quantumCircuit": "OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\ncreg meas[2];\nh q[0];\ncx q[0],q[1];\nbarrier q[0],q[1];\nmeasure q[0] -> meas[0];\nmeasure q[1] -> meas[1];",
            quantumCircuit: openqasmCode,
            //"quantumCircuit": "OPENQASM 2.0;include 'qelib1.inc';qreg q[6];creg c[6];gate oracle(q0, q1, q2, q3, q4, q5) {    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;    x q0;    x q1;    x q2;    x q3;    x q4;    x q5;}gate diffusion(q0, q1, q2, q3, q4, q5) {    h q0;    h q1;    h q2;    h q3;    h q4;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q5;    ccx q3, q4, q5;    cx q2, q3;    cx q1, q2;    cx q0, q1;    h q5;        x q0;    x q1;    x q2;    x q3;    x q4;    x q5;        h q0;    h q1;    h q2;    h q3;    h q4;    h q5;}h q[0];h q[1];h q[2];h q[3];h q[4];h q[5];oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);oracle(q[0], q[1], q[2], q[3], q[4], q[5]);diffusion(q[0], q[1], q[2], q[3], q[4], q[5]);measure q[0] -> c[0];measure q[1] -> c[1];measure q[2] -> c[2];measure q[3] -> c[3];measure q[4] -> c[4];measure q[5] -> c[5];",
            assemblerLanguage: "QASM3",
            pythonFilePath: "",
            pythonFileMetadata: "",
          },
        ],
        name: "DeploymentName",
      };
      console.log(openqasmCode);
      const regex = /^qubit\[\d+\]\s+\w+;$/gm;
      const qubitMatches = openqasmCode.match(regex);
      console.log(qubitMatches);

      if (qubitMatches) {
        const qubitIndices = qubitMatches.map((m) =>
          parseInt(m.match(/\d+/)[0], 10),
        );
        console.log(qubitIndices);
        const maxQubitIndex = Math.max(...qubitIndices);

        // Example: trigger warning if any qubit index >= 30
        if (maxQubitIndex >= 30) {
          setWarningExecution(true);
          console.warn(
            `⚠️ Warning: High qubit index detected (${maxQubitIndex})`,
          );
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
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    setLoading(true);

    try {
      let program = {
        name: "JobName",
        providerName: provider,
        deviceName: selectedDevice,
        shots: numShots,
        errorMitigation: "none",
        cutToWidth: null,
        token: accessToken,
        type: "RUNNER",
        deploymentId: deploymentId,
      };

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
      const url = `${qunicornEndpoint}/${jobId.startsWith("/") ? jobId.slice(1) : jobId}`;

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

      while (
        getdata.state !== "FINISHED" &&
        getdata.state !== "ERROR" &&
        tries < maxTries
      ) {
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

        setProgress(Math.min((tries / maxTries) * 100, 100));
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
        console.log(getdata.results[1]);
        let counts = getdata.results[1].data;
        console.log(counts);
        const chartData = Object.entries(counts || {}).map(([key, value]) => ({
          register: parseInt(key, 16), // TODO: add hex value
          value: Number(value) * 100,
        }));
        setChartData(chartData);
      }, 2000);
    } catch (error) {
      console.error("Error sending data:", error);
      setLoading(false);
    }
  };

  /**
   * Finds the first compatible pair of unconnected source and target handles
   * based on handle domain and input/output types.
   */
  const findMatchingHandlePair = (
    sourceNode: Node,
    targetNode: Node,
    currentEdges: Edge[],
  ) => {
    const outputHandles = getRenderedHandles(
      sourceNode.id,
      sourceNode,
      "source",
    );
    const inputHandles = getRenderedHandles(
      targetNode.id,
      targetNode,
      "target",
    );
    const connectedOutputs = new Set(
      currentEdges
        .filter((edge) => edge.source === sourceNode.id)
        .map((edge) => edge.sourceHandle),
    );
    const connectedInputs = new Set(
      currentEdges
        .filter((edge) => edge.target === targetNode.id)
        .map((edge) => edge.targetHandle),
    );

    return outputHandles
      .map((output) => ({
        output,
        input: inputHandles.find(
          (input) =>
            !connectedInputs.has(input.id) &&
            input.domain === output.domain &&
            ((targetNode.data.inputTypes?.[input.index] ?? "any") === "any" ||
              (sourceNode.data.outputTypes?.[output.index] ?? "any") ===
                "any" ||
              sourceNode.data.outputTypes?.[output.index]?.toLowerCase() ===
                targetNode.data.inputTypes?.[input.index]?.toLowerCase()),
        ),
      }))
      .find(
        ({ output, input }) =>
          !connectedOutputs.has(output.id) && input !== undefined,
      );
  };

  /**
   * Creates a history snapshot and returns a function to commit it.
   *
   * @param historyNodes Nodes to include in the history snapshot.
   * @param historyEdges Edges to include in the history snapshot.
   * @returns A function that commits the snapshot to the history.
   */
  const prepareHistory = (historyNodes: Node[], historyEdges: Edge[]) => {
    const historyItem = {
      nodes: structuredClone(historyNodes),
      edges: structuredClone(historyEdges),
    };
    return () =>
      useStore.setState((state) => ({
        ...appendHistory(state.history, state.historyIndex, historyItem),
        redoStack: [],
      }));
  };

  /**
   * Attempts to insert the dragged node into the closest compatible edge.
   *
   * @param draggedNode The node being dragged.
   * @param currentNodes Current nodes in the flow.
   * @param currentEdges Current edges in the flow.
   */
  const tryAutoConnectToEdge = (
    draggedNode: Node,
    currentNodes: Node[],
    currentEdges: Edge[],
  ) => {
    const nodesById = new Map<string, Node>(
      currentNodes.map((current) => [current.id, current]),
    );
    const draggedCenter = getNodeCenter(draggedNode);
    const closest = currentEdges
      .filter(
        (edge) =>
          edge.source !== draggedNode.id && edge.target !== draggedNode.id,
      )
      .map((edge) => {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        if (!source || !target) return null;
        const renderedPoint = getClosestRenderedEdgePoint(
          edge.id,
          draggedCenter,
          reactFlowInstance,
        );
        if (!renderedPoint) return null;
        return {
          edge,
          distance: renderedPoint.distance / reactFlowInstance.getZoom(),
        };
      })
      .filter(
        (candidate): candidate is { edge: Edge; distance: number } =>
          candidate !== null,
      )
      .reduce<{ edge: Edge; distance: number } | undefined>(
        (best, candidate) =>
          !best || candidate.distance < best.distance ? candidate : best,
        undefined,
      );
    const tolerance = Math.max(
      (draggedNode.width ?? 0) / 2,
      (draggedNode.height ?? 0) / 2,
      32,
    );
    if (!closest || closest.distance > tolerance) return;

    const closestEdge = closest.edge;
    const closestEdgeSource = nodesById.get(closestEdge.source);
    const closestEdgeTarget = nodesById.get(closestEdge.target);
    if (!closestEdgeSource || !closestEdgeTarget) return;
    const sourceToDraggedPair = findMatchingHandlePair(
      closestEdgeSource,
      draggedNode,
      currentEdges.filter((current) => current.id !== closestEdge.id),
    );
    const draggedToTargetPair = findMatchingHandlePair(
      draggedNode,
      closestEdgeTarget,
      currentEdges.filter((current) => current.id !== closestEdge.id),
    );
    if (!sourceToDraggedPair || !draggedToTargetPair) return;
    const sourceOutputIndex = portTypeIndex(
      closestEdgeSource,
      closestEdge.sourceHandle,
    );
    const targetInputIndex = portTypeIndex(
      closestEdgeTarget,
      closestEdge.targetHandle,
    );
    const sourceType = (
      closestEdgeSource.data.outputTypes?.[sourceOutputIndex] ?? "any"
    ).toLowerCase();
    const targetType = (
      closestEdgeTarget.data.inputTypes?.[targetInputIndex] ?? "any"
    ).toLowerCase();
    const inputHandles = getRenderedHandles(
      draggedNode.id,
      draggedNode,
      "target",
    );
    const outputHandles = getRenderedHandles(
      draggedNode.id,
      draggedNode,
      "source",
    );
    const connectedHandles = new Set(
      currentEdges
        .filter((current) => current.target === draggedNode.id)
        .map((current) => current.targetHandle),
    );
    const connectedOutputHandles = new Set(
      currentEdges
        .filter((current) => current.source === draggedNode.id)
        .map((current) => current.sourceHandle),
    );
    const matchingInput = inputHandles.find(
      (handle) =>
        !connectedHandles.has(handle.id) &&
        handle.domain === getHandleDomain(closestEdge.sourceHandle ?? "") &&
        ((draggedNode.data.inputTypes?.[handle.index] ?? "any") === "any" ||
          sourceType === "any" ||
          draggedNode.data.inputTypes?.[handle.index]?.toLowerCase() ===
            sourceType),
    );
    const matchingOutput = outputHandles.find(
      (handle) =>
        !connectedOutputHandles.has(handle.id) &&
        handle.domain === getHandleDomain(closestEdge.targetHandle ?? "") &&
        (targetType === "any" ||
          draggedNode.data.outputTypes?.[handle.index] === "any" ||
          draggedNode.data.outputTypes?.[handle.index]?.toLowerCase() ===
            targetType),
    );
    if (!matchingInput || !matchingOutput) return;

    const commitHistory = prepareHistory(currentNodes, currentEdges);
    onEdgesChange([{ id: closestEdge.id, type: "remove" }]);
    onConnect({
      source: closestEdge.source,
      sourceHandle: closestEdge.sourceHandle,
      target: draggedNode.id,
      targetHandle: matchingInput.id,
    });
    onConnect({
      source: draggedNode.id,
      sourceHandle: matchingOutput.id,
      target: closestEdge.target,
      targetHandle: closestEdge.targetHandle,
    });
    commitHistory();
  };

  /**
   * Attempts to connect the dragged node to compatible nodes on the same line within the allowed distance.
   *
   * @param draggedNode The node being dragged.
   * @param currentNodes Current nodes in the flow.
   * @param currentEdges Current edges in the flow.
   */
  const tryAutoConnectOnSameLine = (
    draggedNode: Node,
    currentNodes: Node[],
    currentEdges: Edge[],
  ) => {
    const draggedNodeWidth = draggedNode.width;
    if (draggedNodeWidth === undefined || draggedNodeWidth <= 0) return;
    const maxDistanceBetweenConnectedNodes = 3 * draggedNodeWidth;
    const leftNode = currentNodes
      .filter(
        (candidate) =>
          candidate.position.y === draggedNode.position.y &&
          candidate.position.x < draggedNode.position.x &&
          draggedNode.position.x - (candidate.position.x + candidate.width) <=
            maxDistanceBetweenConnectedNodes &&
          candidate.id !== draggedNode.id,
      )
      .sort((a, b) => b.position.x - a.position.x)[0];
    const rightNode = currentNodes
      .filter(
        (candidate) =>
          candidate.position.y === draggedNode.position.y &&
          candidate.position.x > draggedNode.position.x &&
          candidate.position.x - (draggedNode.position.x + draggedNode.width) <=
            maxDistanceBetweenConnectedNodes &&
          candidate.id !== draggedNode.id,
      )
      .sort((a, b) => a.position.x - b.position.x)[0];
    if (!leftNode && !rightNode) return;

    const connections: Connection[] = [];

    if (leftNode) {
      const matchingPair = findMatchingHandlePair(
        leftNode,
        draggedNode,
        currentEdges,
      );
      if (matchingPair) {
        connections.push({
          source: leftNode.id,
          sourceHandle: matchingPair.output.id,
          target: draggedNode.id,
          targetHandle: matchingPair.input.id,
        });
      }
    }

    if (rightNode) {
      const matchingPair = findMatchingHandlePair(
        draggedNode,
        rightNode,
        currentEdges,
      );
      if (matchingPair) {
        connections.push({
          source: draggedNode.id,
          sourceHandle: matchingPair.output.id,
          target: rightNode.id,
          targetHandle: matchingPair.input.id,
        });
      }
    }

    if (connections.length === 0) return;

    const commitHistory = prepareHistory(currentNodes, currentEdges);
    for (const connection of connections) onConnect(connection);
    commitHistory();
  };

  /**
   * Runs the enabled automatic connection strategies for the dragged node.
   *
   * @param draggedNode The node being dragged.
   * @param currentNodes Current nodes in the flow.
   * @param currentEdges Current edges in the flow.
   */
  const automaticConnections = (
    draggedNode: Node | undefined,
    currentNodes: Node[],
    currentEdges: Edge[],
  ) => {
    if (!draggedNode || draggedNode.type === "groupNode") return;
    if (autoConnectOnEdgeDrop) {
      tryAutoConnectToEdge(draggedNode, currentNodes, currentEdges);
      currentNodes = useStore.getState().nodes;
      currentEdges = useStore.getState().edges;
    }
    if (autoConnectOnSameLine) {
      tryAutoConnectOnSameLine(draggedNode, currentNodes, currentEdges);
    }
  };

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      nodeDragStartPositions.current.set(node.id, { ...node.position });
    },
    [],
  );

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
      setSplitPreview(null);
      setHighlightedEdgeId(null);
      if (node.type === "group") {
        return;
      }

      const startPosition = nodeDragStartPositions.current.get(node.id);
      nodeDragStartPositions.current.delete(node.id);

      const hasMoved =
        startPosition !== undefined &&
        (startPosition.x !== node.position.x ||
          startPosition.y !== node.position.y);

      const currentNodes: Node[] = useStore.getState().nodes;
      const currentEdges: Edge[] = useStore.getState().edges;
      const nodesById = new Map<string, Node>(
        currentNodes.map((current) => [current.id, current]),
      );
      const draggedNodeFromStore = nodesById.get(node.id);
      const draggedNode = draggedNodeFromStore
        ? { ...draggedNodeFromStore, ...node }
        : undefined;

      if (hasMoved) {
        automaticConnections(draggedNode, currentNodes, currentEdges);
      }

      // drag-to-group for groupNode
      if (node.type !== "groupNode") {
        try {
          const currentNodesRFI = reactFlowInstance.getNodes();
          const updatedNodes = handleNodeDropOnGroup(node, currentNodesRFI);
          if (updatedNodes !== currentNodesRFI) {
            reactFlowInstance.setNodes(updatedNodes);
          }
        } catch {
          // node not found, no update needed
        }
      }

      console.log("onNodeDrag");
      console.log(node);
      nodes.forEach((nd) => {
        // Check if there's a group node in the array of nodes on the screen
        if (
          (nd.type === "controlStructureNode" || nd.type === "ifElseNode") &&
          node.type !== "controlStructureNode" &&
          node.type !== "ifElseNode"
        ) {
          //safety check to make sure there's a height and width
          console.log(node);
          console.log(nd.id);
          let intersectionNodes = reactFlowInstance
            .getIntersectingNodes(node)
            .map((n) => n.id);
          console.log(intersectionNodes);

          // Check if the dragged node is inside the group
          if (intersectionNodes[0] == nd.id) {
            console.log(nd);

            //Check if dragged node isn't already a child to the group
            if (!node.parentNode) {
              console.log("update node");
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
                "div.react-flow__node-controlStructureNode",
              );

              if (mainNode) {
                // Get the first child div (grand-parent where you set width)
                const firstChild =
                  mainNode.querySelector<HTMLDivElement>("div.grand-parent");

                console.log("Main node:", mainNode);
                console.log("First child (grand-parent):", firstChild);
                if (firstChild) {
                  console.log();

                  // Get the current minWidth from computed styles
                  const currentMinWidth =
                    window.getComputedStyle(firstChild).minWidth;

                  // Get the current minWidth from computed styles
                  const currentHeight =
                    window.getComputedStyle(firstChild).height;
                  // Parse it into a number
                  const currentMinWidthValue = parseFloat(currentMinWidth);
                  // Add 100 to it
                  const newMinWidth = currentMinWidthValue + 100;

                  // Parse it into a number
                  const currentHeightValue = parseFloat(currentHeight);
                  console.log(currentHeightValue);
                  console.log(node.height);

                  const newHeight =
                    node.height + 200 > currentHeightValue
                      ? currentHeightValue + 100
                      : currentHeightValue + 100;

                  // Set it back with "px"
                  firstChild.style.minWidth = `${newMinWidth}px`;
                  firstChild.style.height = `${newHeight}px`;
                  console.log(`Updated minWidth to ${newMinWidth}px`);
                }
              } else {
                console.error("Main node not found");
              }

              //nd.style.width = 10;
              console.log(node);
              //intersectionNodes[0].width = 1000;
              updateParent(node.id, nd.id, node.position);
              updateChildren(node.parentNode, node.id);
              //updateNodeValue(node.id, "hidden", "true")
              updateNodeValue(node.id, "position", node.position);
              updateNodeValue(node.id, "scope", "if");
            }
          }
        }
      });

      if (node.id == contextMenu.componentId) {
        console.log("moving context menu for node", node.id);
        setContextMenu((prev) => ({
          ...prev,
          left: evt.clientX,
          top: evt.clientY,
        }));
      }
    },
    [
      nodes,
      setContextMenu,
      autoConnectOnEdgeDrop,
      autoConnectOnSameLine,
      automaticConnections,
    ],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length === 0) return;

      // Selektierte top-level Nodes (GroupNodes + normale Nodes ohne Parent) merken
      lastSelectedNodes.current = selectedNodes.filter((n) => !n.parentNode);

      // Kind-Nodes (keine GroupNodes) deselektieren
      const groupedSelected = selectedNodes.filter(
        (n) => n.parentNode && n.type !== "groupNode",
      );
      if (groupedSelected.length > 0) {
        reactFlowInstance.setNodes((nds: Node[]) =>
          nds.map((n) => {
            if (n.parentNode && n.type !== "groupNode") {
              return { ...n, selected: false };
            }
            return n;
          }),
        );
      }

      // Collaboration: Sperren für ausgewählte Nodes broadcasten
      if (collaborationModeOn) {
        const lockedIds = selectedNodes.map((n) => n.id);
        awareness.setLocalStateField("locks", { nodeIds: lockedIds });
        console.log("locked ids", lockedIds);
      }
    },
    [reactFlowInstance, collaborationModeOn],
  );

  const onSelectionEnd = useCallback(() => {
    if (!lassoMode) return;
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();

    // Selektierte Nodes aus ref verwenden
    const selectedIds = new Set(lastSelectedNodes.current.map((n) => n.id));
    const nodesWithSelection = currentNodes.map((n) => ({
      ...n,
      selected: selectedIds.has(n.id),
    }));

    const updatedNodes = groupSelectedNodes(nodesWithSelection, currentEdges);
    if (updatedNodes !== nodesWithSelection) {
      reactFlowInstance.setNodes(updatedNodes);
      setLassoMode(false);
    }
  }, [lassoMode, reactFlowInstance]);

  // TODO: unused
  const _handleConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = reactFlowInstance.getNode(connection.source ?? "");
      const targetNode = reactFlowInstance.getNode(connection.target ?? "");

      if (
        sourceNode?.type === "groupNode" ||
        targetNode?.type === "groupNode"
      ) {
        const edgeType = connection.sourceHandle?.includes("quantum")
          ? "quantumEdge"
          : "classicalEdge";
        const color = connection.sourceHandle?.includes("quantum")
          ? "#93C5FD"
          : "#F5A843";

        // If source or target is a group, resolve the actual child node from the handle suffix so
        // that the edge points directly at the child node instead of at the group itself.
        // Handle IDs always end with the node ID, e.g. "...StatePreparationInput0<nodeId>".
        const resolveRealNodeId = (
          groupId: string | null | undefined,
          handleId: string | null | undefined,
        ): string | null => {
          if (!handleId) return null;
          const allNodes = reactFlowInstance.getNodes();
          // candidates: all nodes whose ID appears at the end of the handle ID
          const candidates = allNodes.filter((n) => handleId.endsWith(n.id));
          if (candidates.length === 0) return null;
          // pick the longest match to avoid substring mismatches between similar IDs
          candidates.sort((a, b) => b.id.length - a.id.length);
          return candidates[0].id;
        };

        let realSource = connection.source;
        let realTarget = connection.target;

        if (sourceNode?.type === "groupNode") {
          realSource =
            resolveRealNodeId(sourceNode.id, connection.sourceHandle) ??
            connection.source;
        }
        if (targetNode?.type === "groupNode") {
          realTarget =
            resolveRealNodeId(targetNode.id, connection.targetHandle) ??
            connection.target;
        }

        reactFlowInstance.addEdges([
          {
            ...connection,
            source: realSource,
            target: realTarget,
            id: `edge-group-${Date.now()}`,
            type: edgeType,
            markerEnd: {
              type: "arrowclosed",
              width: 20,
              height: 20,
              color,
              hidden: false,
            },
          },
        ]);
        return;
      }

      onConnect(connection);
    },
    [reactFlowInstance, onConnect],
  );

  const currentCategories: Record<string, CategoryEntry> = useMemo(() => {
    const domainProfileNames = allDomainProfiles.map((p) => p.name);
    const index = domainProfileNames.indexOf(domainProfile);
    console.log("domainProfile", domainProfile);
    console.log("index", index);
    if (index > -1) {
      return allDomainProfiles[index].domainBlocks;
    } else {
      return categories;
    }
  }, [domainProfile, allDomainProfiles]);

  const addNodeToCanvas = useCallback(
    (def: any, customPosition?: { x: number; y: number }, pluginData?: any) => {
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const getId = () => crypto.randomUUID();

      // Calculate position: Use custom position or center of the canvas
      const position =
        customPosition ||
        reactFlowInstance.project({
          x: reactFlowWrapper.current.clientWidth / 2,
          y: reactFlowWrapper.current.clientHeight / 2,
        });

      const compactOptions = def?.compactOptions ?? [];

      const newNode = {
        id: getId(),
        type: def.type,
        position,

        selected: false,
        selectable: true,
        draggable: true,

        data: {
          label: def.label,

          inputs: [],
          outputs: [],

          children: [],

          implementation: "",
          implementationType: "",
          uncomputeImplementationType: "",
          uncomputeImplementation: "",

          completionGuaranteed: def?.completionGuaranteed ?? false,

          compactOptions,

          // =====================================
          // PLUGIN NODE DATA
          // =====================================
          ...(def.type === PluginNode && {
            pluginName: pluginData?.name,

            dataInputs: pluginData?.mockDataInputs ?? [],

            dataOutputs: pluginData?.mockDataOutputs ?? [],
          }),

          ...(def?.properties && {
            properties: def.properties,
          }),

          ...(def?.constraints && {
            constraints: def.constraints,
          }),

          ...(def?.mapping && {
            mapping: def.mapping,
          }),

          ...(def?.description && {
            description: def.description,
          }),

          ...(def?.outputType && {
            outputType: def.outputType,
          }),

          ...(def?.icon && {
            icon: def.icon,
          }),

          ...(def?.isDataType && {
            isDataType: def.isDataType,
          }),
        },
      };

      console.log("CREATED NODE", newNode);

      // Update local Zustand Store
      setNodes(newNode);

      // Update Yjs Collaborative Store

      const activeName = cursors[myClientId]?.name || userName || "unknown";

      if (collaborationModeOn) {
        console.log("ON DROP: collab mode on", collaborationModeOn);

        nodesMap.set(newNode.id, newNode);

        historyArray.push([
          {
            type: "node-added",
            nodeId: newNode.id,
            label: newNode.data?.label,
            userId: activeName,
            user: activeName,
            timestamp: Date.now(),
          },
        ]);

        console.log("ADD NODE HISTORY", historyArray.toArray());

        console.log("shared nodes", Array.from(nodesMap.values()));

        console.log("shared edges", Array.from(edgesMap.values()));
      }

      // Optional: Pan the camera to the newly added node
      // reactFlowInstance.setCenter(position.x, position.y, { zoom: 1, duration: 700 });
    },
    [
      reactFlowInstance,
      setNodes,
      collaborationModeOn,
      cursors,
      myClientId,
      userName,
    ],
  );

  const onDrop = React.useCallback(
    (event: any) => {
      console.log("dropped");
      console.log("collab mode", collaborationModeOn);

      event.preventDefault();

      const label = event.dataTransfer.getData("application/reactflow/label");

      if (label == qaoa) {
        loadFlow(qaoa_algorithm);
        return;
      } else if (label == swap_test) {
        loadFlow(swap_test_algorithm);
        return;
      } else if (label == hadamard_test_imaginary_part) {
        loadFlow(hadamard_test_imaginary_part_algorithm);
        return;
      } else if (label == hadamard_test_real_part) {
        loadFlow(hadamard_test_real_part_algorithm);
        return;
      } else if (label == grover) {
        loadFlow(grover_algorithm);
        return;
      } else if (label == quantum_k_means) {
        loadFlow(quantum_k_means_algorithm);
        return;
      } else if (label.startsWith(custom_template)) {
        const userTemplateFlowData = JSON.parse(
          event.dataTransfer.getData("application/reactflow/templateFlowData"),
        );

        if (userTemplateFlowData) {
          loadFlow(userTemplateFlowData);
        } else {
          console.error(`User Template ${label} not found.`);
        }

        return;
      }

      console.log("current categories", currentCategories);

      if (!reactFlowWrapper) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const type = event.dataTransfer.getData("application/reactflow");

      if (!type) {
        return;
      }

      const def = findNodeDefinition(type, label, currentCategories);

      console.log("found node", def);

      // ================================
      // GET PLUGIN METADATA HERE
      // ================================
      const pluginDataRaw = event.dataTransfer.getData(
        "application/reactflow/pluginData",
      );

      const pluginData = pluginDataRaw ? JSON.parse(pluginDataRaw) : null;

      console.log("PLUGIN DATA FROM DROP", pluginData);

      // Get drop position
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // add node to canvas
      addNodeToCanvas(def, position, pluginData);

      console.log("nodes", nodes);
    },
    [
      reactFlowInstance,
      setNodes,
      currentCategories,
      collaborationModeOn,
      cursors,
    ],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when node is deleted

      // Recompute the handle bounds of the sibling nodes so that connecting works again
      // after a node has been deleted, e.g. from inside a group.
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      const affectedParentIds = new Set(
        deletedNodes.map((n) => n.parentNode).filter(Boolean) as string[],
      );

      // short delay so React Flow applies the new node/edge state first
      requestAnimationFrame(() => {
        const remainingNodes = reactFlowInstance.getNodes();
        remainingNodes.forEach((node) => {
          if (deletedIds.has(node.id)) return;
          // update the sibling nodes (same group) and the group itself
          if (
            (node.parentNode && affectedParentIds.has(node.parentNode)) ||
            affectedParentIds.has(node.id)
          ) {
            updateNodeInternals(node.id);
          }
        });
      });
    },
    [setContextMenu, reactFlowInstance, updateNodeInternals],
  );

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
      showToast(
        "Upload failed. Credentials or repository fields incorrect.",
        "error",
      );
      return { success: false };
    }

    console.log(containsPlaceholder);

    let fileContent = JSON.stringify(
      {
        metadata: {
          ...metadata,
          containsPlaceholder: containsPlaceholder,
          id: flowId,
          timestamp: new Date().toISOString(),
        },
        flow: reactFlowInstance.toObject(),
      },
      null,
      2,
    );

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
        showToast(
          "Model with id " + flowId + " uploaded successfully!",
          "success",
        );
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

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!awareness) return;

    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;

    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    awareness.setLocalStateField("cursor", {
      ...awareness.getLocalState()?.cursor,
      x,
      y,
    });
  };

  async function registerAndUploadToGitHub(
    patternId: string,
    patternName: string,
    overwriteImplementationId,
    solutionId,
  ) {
    const flowId = `flow-${Date.now()}`;
    const modelFileName = `${flowId}.json`;
    const sqlPath = "example-data/SQL/backup-files/2_pattern_solutions.sql";
    const modelPath = "example-data/models";

    console.log(overwriteImplementationId);
    console.log(solutionId);
    const headers = {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // ------------------------
    // Generate model content
    // ------------------------
    const modelContent = JSON.stringify(
      {
        metadata: {
          ...metadata,
          id: flowId,
          timestamp: new Date().toISOString(),
        },
        ...reactFlowInstance.toObject(),
      },
      null,
      2,
    );

    const toHex = (str: string) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      return (
        "\\x" +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    };

    const hexData = toHex(modelContent);

    try {
      // ------------------------
      // 1. Fetch SQL file
      // ------------------------
      const sqlUrl = `https://api.github.com/repos/${githubRepositoryOwner}/${githubRepositoryName}/contents/${sqlPath}`;
      const sqlGet = await fetch(`${sqlUrl}?ref=${githubBranch}`, { headers });

      if (!sqlGet.ok) throw new Error("Failed to fetch SQL file");

      const { content, sha } = await sqlGet.json();
      let sqlContent = atob(content);

      // ------------------------
      // 2. Check if implementation already exists
      // ------------------------
      const packageFileRegex = new RegExp(
        `INSERT INTO public\\.implementation_package_file\\s*\\([^)]*\\)\\s*VALUES\\s*\\('([^']+)'\\s*,\\s*'([^']+)'\\);`,
        "g",
      );

      console.log(solutionId);
      console.log(overwriteImplementationId);

      const match = [...sqlContent.matchAll(packageFileRegex)].find(
        (m) => m[2] === solutionId,
      );

      console.log(match);

      if (match) {
        // =========================================
        // UPDATE EXISTING ENTRY
        // =========================================

        const fileId = match[1];

        // Replace file_data hex
        const fileDataRegex = new RegExp(
          `INSERT INTO public\\.file_data \\(id, data, file_id\\) VALUES \\('([^']+)', '\\\\x[0-9a-f]*', '${fileId}'\\);`,
        );

        sqlContent = sqlContent.replace(
          fileDataRegex,
          (full, dataId) =>
            `INSERT INTO public.file_data (id, data, file_id) VALUES ('${dataId}', '${hexData}', '${fileId}');`,
        );

        console.log("Existing implementation updated.");
        showToast(
          "Update existing implementation for " + patternName,
          "success",
        );
      } else {
        // =========================================
        // CREATE NEW ENTRY
        // =========================================

        const ids = {
          algo: crypto.randomUUID(),
          fileId: crypto.randomUUID(),
          fileImplementationId: crypto.randomUUID(),
          data: crypto.randomUUID(),
          package: crypto.randomUUID(),
        };

        const sqlAppend = `
-- Register ${modelFileName}
INSERT INTO public.knowledge_artifact (id, creation_date, last_modified_at) VALUES ('${ids.algo}', NULL, NULL);
INSERT INTO public.knowledge_artifact (id, creation_date, last_modified_at) VALUES ('${ids.package}', NULL, NULL);
INSERT INTO public.knowledge_artifact (id, creation_date, last_modified_at) VALUES ('${ids.fileId}', NULL, NULL);
INSERT INTO public.algorithm (name, id) VALUES ('QML Implementation', '${ids.algo}');
INSERT INTO public.quantum_algorithm (nisq_ready, quantum_computation_model, id) VALUES (false, 0, '${ids.algo}');
INSERT INTO public.implementation (name, id, implemented_algorithm_id) VALUES ('${patternName} low-code solution', '${ids.package}', '${ids.algo}');
INSERT INTO public.pattern_uris (implementation_id, pattern_uri) VALUES ('${ids.package}', 'pattern-languages/${patternId}');
INSERT INTO public.file (fileurl, mime_type, name, id) VALUES ('${modelFileName}', 'application/json', '${modelFileName}', '${ids.fileId}');
INSERT INTO public.file_data (id, data, file_id) VALUES ('${ids.data}', '${hexData}', '${ids.fileId}');
INSERT INTO public.implementation_package (dtype, id, description, name, package_type, implementation_id, type)
VALUES ('FileImplementationPackage', '${ids.fileImplementationId}', '${patternName} solution', 'Pattern low_code_modeler package', 0, '${ids.package}', 'low_code_modeler');
INSERT INTO public.implementation_package_file (file_id, implementation_package_id)
VALUES ('${ids.fileId}', '${ids.fileImplementationId}');
`;

        sqlContent += sqlAppend;
        console.log("New implementation inserted.");
        showToast("Upload new implementation for " + patternName, "success");
      }

      // ------------------------
      // 3. Upload updated SQL
      // ------------------------
      await fetch(sqlUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Register or update ${modelFileName}`,
          content: btoa(sqlContent),
          sha,
          branch: githubBranch,
        }),
      });

      // ------------------------
      // 4. Upload model JSON
      // ------------------------
      const modelUrl = `https://api.github.com/repos/${githubRepositoryOwner}/${githubRepositoryName}/contents/${modelPath}/${modelFileName}`;

      await fetch(modelUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Upload model ${flowId}`,
          content: btoa(modelContent),
          branch: githubBranch,
        }),
      });

      console.log("SQL + Model upload successful.");
      return { success: true, flowId };
    } catch (error) {
      console.error("GitHub API Error:", error);
      showToast(
        "Upload of implementation for " + patternName + " failed.",
        "error",
      );
      return { success: false };
    }
  }

  const handleGenerateModel = async (
    prompt: string,
    generationMode: "compact" | "circuit",
  ) => {
    if (!prompt.trim()) return;

    setLoading(true);
    showToast("Your model is now being generated.", "info");

    try {
      // Send the prompt to your backend
      const response = await fetch(`http://localhost:3000/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          generationMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start model generation");
      }

      const newJob = await response.json();

      // Add the new job to the history
      const newHistoryItem: HistoryItem = {
        uuid: newJob.id,
        name: "Generation Job",
        description: prompt,
        status: newJob.status || "Pending",
        created: new Date().toISOString(),
        type: "generation",
        result: null,
        semanticScore: 0,
        missingValues: newJob.missingValues || [],
        links: {
          request: `http://localhost:3000/jobs/${newJob.id}/request`,
          result: `http://localhost:3000/jobs/${newJob.id}/result`,
        },
      };

      setHistory((prevHistory) => [newHistoryItem, ...prevHistory]);

      showToast("Model generation started successfully!", "success");
      return newJob;
    } catch (err: any) {
      showToast(`Failed to generate model: ${err.message}`, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

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

    // Dispatch save event for QHAna integration (cancelable)
    const event = new CustomEvent("lcm-save", {
      cancelable: true,
      detail: flowWithMetadata,
    });
    const defaultAction = document.dispatchEvent(event);
    console.log(`defaultAction: ${defaultAction}`);
    if (!defaultAction) return;

    // Create a downloadable JSON file
    const jsonBlob = new Blob([JSON.stringify(flowWithMetadata, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${(validMetadata?.name ?? "metadata").replace(/\s+/g, "_")}_${validMetadata?.id ?? "unknown"}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    console.log("Flow saved:", flowWithMetadata);
  }

  const openDomainProfileEditor = (
    profile: DomainProfile | null = null,
    index: number | null = null,
  ) => {
    setEditingDomainProfileIndex(index);
    setEditingDomainProfile(profile);
    setDomainProfileOpen(true);
  };

  const closeDomainProfileEditor = () => {
    setDomainProfileOpen(false);
    setEditingDomainProfileIndex(null);
    setEditingDomainProfile(null);
  };

  const handleSaveDomainProfile = (newProfile: DomainProfile) => {
    const previousProfile =
      editingDomainProfileIndex !== null
        ? allDomainProfiles[editingDomainProfileIndex]
        : null;
    const updatedProfiles =
      editingDomainProfileIndex === null
        ? [...allDomainProfiles, newProfile]
        : allDomainProfiles.map((profile, index) =>
            index === editingDomainProfileIndex ? newProfile : profile,
          );

    setAllDomainProfiles(updatedProfiles);

    if (editingDomainProfileIndex === null) {
      setDomainProfile(newProfile.name);
    } else if (previousProfile && domainProfile === previousProfile.name) {
      setDomainProfile(newProfile.name);
    }

    console.log("Profile saved:", newProfile);
  };

  const handleDeleteDomainProfile = (index: number) => {
    const profileToDelete = allDomainProfiles[index];
    if (!profileToDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete domain profile "${profileToDelete.name}"?`,
    );
    if (!confirmed) {
      return;
    }

    const updatedProfiles = allDomainProfiles.filter(
      (_, profileIndex) => profileIndex !== index,
    );
    setAllDomainProfiles(updatedProfiles);

    if (domainProfile === profileToDelete.name) {
      setDomainProfile(updatedProfiles[0]?.name ?? "standard");
    }

    if (editingDomainProfileIndex === index) {
      closeDomainProfileEditor();
    }
  };

  const handleReorderDomainProfiles = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    const nextProfiles = [...allDomainProfiles];
    const [movedProfile] = nextProfiles.splice(fromIndex, 1);
    nextProfiles.splice(toIndex, 0, movedProfile);
    setAllDomainProfiles(nextProfiles);
  };

  const handleDuplicateDomainProfile = (index: number) => {
    const sourceProfile = allDomainProfiles[index];
    if (!sourceProfile) {
      return;
    }

    const clonedProfile = structuredClone(sourceProfile);
    const baseName = `${sourceProfile.name} (Copy)`;
    const existingNames = new Set(
      allDomainProfiles.map((profile) => profile.name),
    );
    let duplicateName = baseName;
    let copyIndex = 2;

    while (existingNames.has(duplicateName)) {
      duplicateName = `${baseName} ${copyIndex}`;
      copyIndex += 1;
    }

    clonedProfile.name = duplicateName;

    const nextProfiles = [...allDomainProfiles];
    nextProfiles.splice(index + 1, 0, clonedProfile);
    setAllDomainProfiles(nextProfiles);
  };

  const handleSaveAsTemplate = () => {
    console.log("Saving User Template");
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
      // TODO: toast error message
    }
    let templateFlow = reactFlowInstance.toObject();
    console.log(templateFlow);
    // add metadata to templateFlow
    templateFlow = {
      ...templateFlow,
      metadata: metadata,
    };
    const date = Date.now();
    const timestamp = new Date().toISOString();
    const newTemplate: Template = {
      label: `${custom_template}-${date}`,
      type: templates,
      icon: "QAOA.png", //TODO
      description: metadata.description,
      completionGuaranteed: true,
      compactOptions: [true, false],
      id: `flow-${date}`,
      timestamp: timestamp,
      name: metadata.name, // get name from meta data
      flowData: templateFlow,
    };
    console.log(newTemplate);
    // save metadata to userTemplates
    addUserTemplate(newTemplate);
  };

  function handleOpenQASMClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }

    function restoreFlow(flow) {
      console.log("Restoring flow:", flow);
      if (flow.nodes) {
        reactFlowInstance.setNodes(
          flow.nodes.map((node: Node) =>
            withPortTypes({
              ...node,
              data: {
                ...node.data,
              },
            }),
          ),
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
        restoreFlow,
      },
    });
    const defaultAction = document.dispatchEvent(event);
    console.log(`defaultAction: ${defaultAction}`);
    if (!defaultAction) return;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/txt";

    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (!file) {
        console.warn("No file selected.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const flow = openQasmToFlow(e.target?.result as string);
          console.log(flow);

          restoreFlow(flow);
        } catch (error) {
          console.error("Error parsing OpenQASM file:", error);
          alert(
            `Could not import the OpenQASM file. ${error instanceof Error ? error.message : ""}`.trim(),
          );
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

  function handleRestoreClick() {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }

    function restoreFlow(flow) {
      console.log("Restoring flow:", flow);
      if (flow.nodes) {
        reactFlowInstance.setNodes(
          flow.nodes.map((node: Node) =>
            withPortTypes({
              ...node,
              data: {
                ...node.data,
              },
            }),
          ),
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
        restoreFlow,
      },
    });
    const defaultAction = document.dispatchEvent(event);
    console.log(`defaultAction: ${defaultAction}`);
    if (!defaultAction) return;

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

  const clearCurrentSelection = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    reactFlowInstance.setNodes((currentNodes: Node[]) =>
      currentNodes.map((node) => ({
        ...node,
        selected: false,
      })),
    );
    setSelectedNode(null);
  }, [reactFlowInstance, setSelectedNode]);

  const copySelectedNodes = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    const selectedNodes = (reactFlowInstance.getNodes() as Node[]).filter(
      (node) => node.selected,
    );
    if (!selectedNodes.length) {
      return;
    }

    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
    const selectedEdges = (reactFlowInstance.getEdges() as Edge[]).filter(
      (edge) =>
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target),
    );

    copiedSelectionRef.current = {
      nodes: structuredClone(selectedNodes),
      edges: structuredClone(selectedEdges),
    };
    pasteCountRef.current = 0;
  }, [reactFlowInstance]);

  const pasteCopiedNodes = useCallback(() => {
    if (!reactFlowInstance || !copiedSelectionRef.current?.nodes?.length) {
      return;
    }

    const copiedSelection = copiedSelectionRef.current;
    pasteCountRef.current += 1;

    const offset = 40 * pasteCountRef.current;
    const idMap = new Map<string, string>();

    const newNodes = copiedSelection.nodes.map((node) => {
      const newId = uuidv4();
      idMap.set(node.id, newId);

      return {
        id: newId,
        type: node.type,
        data: structuredClone(node.data),
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
        selectable: true,
        draggable: true,
      };
    });

    const newEdges = copiedSelection.edges
      .map((edge) => {
        const source = idMap.get(edge.source);
        const target = idMap.get(edge.target);

        if (!source || !target) {
          return null;
        }

        return {
          ...structuredClone(edge),
          id: uuidv4(),
          source,
          target,
          selected: false,
        };
      })
      .filter(Boolean) as Edge[];

    reactFlowInstance.setNodes((currentNodes: Node[]) =>
      currentNodes.map((node) => ({
        ...node,
        selected: false,
      })),
    );

    reactFlowInstance.addNodes(newNodes);
    if (newEdges.length) {
      reactFlowInstance.addEdges(newEdges);
    }
  }, [reactFlowInstance]);

  const cutSelectedNodes = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    copySelectedNodes();
    const selectedNodes = (reactFlowInstance.getNodes() as Node[]).filter(
      (node) => node.selected,
    );
    if (!selectedNodes.length) {
      return;
    }

    reactFlowInstance.deleteElements({
      nodes: selectedNodes.map((node) => ({ id: node.id })),
    });
    setSelectedNode(null);
  }, [copySelectedNodes, reactFlowInstance, setSelectedNode]);

  const selectAllNodes = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    reactFlowInstance.setNodes((currentNodes: Node[]) =>
      currentNodes.map((node) => ({
        ...node,
        selected: true,
      })),
    );
  }, [reactFlowInstance]);

  const duplicateSelectedNodes = useCallback(() => {
    copySelectedNodes();
    pasteCopiedNodes();
  }, [copySelectedNodes, pasteCopiedNodes]);

  useKeyBindings({
    undo,
    redo,
    copy: copySelectedNodes,
    paste: pasteCopiedNodes,
    cut: cutSelectedNodes,
    selectAll: selectAllNodes,
    duplicate: duplicateSelectedNodes,
    clearSelection: clearCurrentSelection,
  });

  const [, setMySelectedNodeId] = useState<string | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (collaborationModeOn && awareness) {
        const currentCursorState = awareness.getLocalState()?.cursor || {};
        console.log(currentCursorState);
        console.log(node.id);
        let findAny = false;
        awareness.getStates().forEach((state: any) => {
          // Skip your own client ID so you don't highlight it with your own color
          console.log(state.cursor);

          // Check if a peer has selected this specific node ID
          if (state.cursor && state.cursor.mySelectedNodeId === node.id) {
            findAny = true;
            return;
          }
        });
        if (!findAny) {
          // Write the currently selected node directly into this tab's unique Yjs cursor object
          awareness.setLocalStateField("cursor", {
            ...currentCursorState,
            mySelectedNodeId: node.id,
          });
        }
      }

      // Keep your normal single-user state if necessary
      setSelectedNode(node);
    },
    [collaborationModeOn, awareness, setSelectedNode],
  );

  const [modeledDiagram, setModeledDiagram] = useState(null);

  useEffect(() => {
    if (!reactFlowInstance || hasLoadedFromUrl.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const loadUrl = urlParams.get("load-url");
    if (!loadUrl) return;

    hasLoadedFromUrl.current = true;

    fetch(loadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.status}`);
        }
        return response.json();
      })
      .then((modelData) => {
        overwriteFlow(modelData);
        showToast("Model loaded successfully from URL", "success");
      })
      .catch((error) => {
        showToast(`Error loading model from URL: ${error.message}`, "error");
        hasLoadedFromUrl.current = false;
      });
  }, [reactFlowInstance]);

  // Function to load the flow
  const overwriteFlow = (flow: any) => {
    if (!reactFlowInstance) {
      console.error("React Flow instance is not initialized.");
      return;
    }
    console.log(flow.initialEdges);
    console.log(flow.nodes);
    if (flow.nodes) {
      reactFlowInstance.setNodes(
        flow.nodes?.map((node: Node) =>
          withPortTypes({
            ...node,
            data: {
              ...node.data,
            },
          }),
        ),
      );
    }
    if (flow.initialEdges) {
      reactFlowInstance.setEdges(flow.initialEdges);
      console.log("Edges loaded.");
    } else if (flow.edges) {
      reactFlowInstance.setEdges(flow.edges);
      console.log("Edges loaded.");
    }
    console.log("load flow nodes", nodes);
    console.log(edges);

    // Reset the viewport
    const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
    console.log(flow.viewport);
    reactFlowInstance.setViewport({ x, y, zoom });

    console.log(flow.metadata);
    // Set the metadata (if any) - assuming initialDiagram has metadata
    if (flow.metadata) {
      // If metadata is an array, unpack it
      const dataToSet = Array.isArray(flow.metadata)
        ? flow.metadata[0]
        : flow.metadata;
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
    console.log(flow.initialEdges);
    console.log(flow.nodes);
    if (flow.nodes) {
      reactFlowInstance.setNodes(
        flow.nodes?.map((node: Node) =>
          withPortTypes({
            ...node,
            data: {
              ...node.data,
            },
          }),
        ),
      );
    }
    if (flow.initialEdges) {
      reactFlowInstance.setEdges(flow.initialEdges);
      console.log("Edges loaded.");
    } else if (flow.edges) {
      reactFlowInstance.setEdges(flow.edges);
      console.log("Edges loaded.");
    }
    console.log("load flow nodes", nodes);
    console.log(edges);

    // Reset the viewport (optional based on your use case)
    const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
    reactFlowInstance.setViewport({ x, y, zoom });

    console.log(flow.metadata);
    // Set the metadata (if any) - assuming initialDiagram has metadata
    if (flow.metadata) {
      // If metadata is an array, unpack it
      const dataToSet = Array.isArray(flow.metadata)
        ? flow.metadata[0]
        : flow.metadata;
      setMetadata(dataToSet);
      console.log("Metadata loaded:", dataToSet);
    }
  };

  const loadModelFromUrl = useCallback(
    (modelName: string) => {
      console.log(modelName);

      switch (modelName.toLowerCase()) {
        // Starters
        case "model_a":
          loadFlow(empty_model);
          break;

        case "model_b":
          loadFlow(hello_quantum);
          break;

        case "model_c":
          loadFlow(first_measurement);
          break;

        // Circuit-Level Examples
        case "model_d":
          loadFlow(quantum_k_means_algorithm);
          break;

        case "model_e":
          loadFlow(bell_state_phi_plus);
          break;

        case "model_f":
          loadFlow(ghz);
          break;

        // Encoding Examples
        case "model_h":
          loadFlow(basis_encoding);
          break;

        case "model_i":
          loadFlow(angle_encoding);
          break;

        case "model_j":
          loadFlow(amplitude_encoding);
          break;

        case "model_k":
          loadFlow(encode_value);
          break;

        // Quantum Algorithms
        case "model_l":
          loadFlow(grover_circuit_level);
          break;

        case "model_m":
          loadFlow(grover_building_blocks);
          break;

        case "model_n":
          loadFlow(grover_algorithm);
          break;

        case "model_o":
          loadFlow(quantum_fourier_transform);
          break;

        case "model_p":
          loadFlow(hadamard_test_real_part);
          break;

        case "model_q":
          loadFlow(hadamard_test_imaginary_part);
          break;

        case "model_r":
          loadFlow(swap_test);
          break;

        case "model_s":
          loadFlow(qaoa);
          break;

        // Quantum Machine Learning
        case "model_t":
          loadFlow(quantum_clustering);
          break;

        case "model_u":
          loadFlow(classical_clustering);
          break;

        // Advanced Examples
        case "model_v":
          loadFlow(multi_controlled_gates);
          break;

        case "model_w":
          loadFlow(quantum_arithmetic);
          break;

        case "model_x":
          loadFlow(conditional_quantum_model);
          break;

        case "model_y":
          loadFlow(custom_quantum_operator);
          break;

        default:
          console.warn(`Unknown model: ${modelName}`);
      }
    },
    [loadFlow],
  );

  useEffect(() => {
    if (!reactFlowInstance) return;

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    console.log("pathname:", pathname);
    console.log("search:", window.location.search);

    let modelName: string | null = null;

    // New option: /?model=model_d
    if (!modelName) {
      modelName = searchParams.get("model");
    }

    if (!modelName) return;

    console.log("Loading model:", modelName);

    // Let loadModelFromUrl() / switch handle whether the model exists.
    loadModelFromUrl(modelName);

    // Clean the URL after loading.
    if (searchParams.has("model")) {
      window.history.replaceState({}, "", "/");
    }
  }, [reactFlowInstance, loadModelFromUrl]);

  const onNodeDrag = React.useCallback(
    (event: React.MouseEvent, node: Node, nodes: Node[]) => {
      if (autoConnectOnEdgeDrop && node.type !== "groupNode") {
        const currentNodes: Node[] = reactFlowInstance
          .getNodes()
          .map((current) =>
            current.id === node.id ? { ...current, ...node } : current,
          );
        const currentEdges: Edge[] = reactFlowInstance.getEdges();
        const nodesById = new Map<string, Node>(
          currentNodes.map((current) => [current.id, current]),
        );
        const draggedNode = nodesById.get(node.id);

        if (draggedNode) {
          const draggedCenter = getNodeCenter(draggedNode);
          const closest = currentEdges
            .filter(
              (edge) =>
                edge.source !== draggedNode.id &&
                edge.target !== draggedNode.id,
            )
            .map((edge) => {
              const source = nodesById.get(edge.source);
              const target = nodesById.get(edge.target);
              if (!source || !target) return null;

              const renderedPoint = getClosestRenderedEdgePoint(
                edge.id,
                draggedCenter,
                reactFlowInstance,
              );
              if (!renderedPoint) return null;

              return {
                edge,
                splitPoint: renderedPoint.point,
                distance: renderedPoint.distance / reactFlowInstance.getZoom(),
              };
            })
            .filter(
              (candidate): candidate is NonNullable<typeof candidate> =>
                candidate !== null,
            )
            .reduce<(typeof closest)[number] | undefined>(
              (best, candidate) =>
                !best || candidate.distance < best.distance ? candidate : best,
              undefined,
            );
          const tolerance = Math.max(
            (draggedNode.width ?? 0) / 2,
            (draggedNode.height ?? 0) / 2,
            32,
          );
          const closestEdge = closest?.edge;
          const sourceAndTargetDomain = getHandleDomain(
            closestEdge?.sourceHandle ?? "",
          );
          const connectedInputHandles = new Set(
            currentEdges
              .filter((edge) => edge.target === draggedNode.id)
              .map((edge) => edge.targetHandle),
          );
          const connectedOutputHandles = new Set(
            currentEdges
              .filter((edge) => edge.source === draggedNode.id)
              .map((edge) => edge.sourceHandle),
          );
          const inputHandles = getRenderedHandles(
            draggedNode.id,
            draggedNode,
            "target",
          );
          const outputHandles = getRenderedHandles(
            draggedNode.id,
            draggedNode,
            "source",
          );
          const hasOpenInput = inputHandles.some(
            (handle) =>
              !connectedInputHandles.has(handle.id) &&
              handle.domain === sourceAndTargetDomain,
          );
          const hasOpenOutput = outputHandles.some(
            (handle) =>
              !connectedOutputHandles.has(handle.id) &&
              handle.domain === sourceAndTargetDomain,
          );

          if (!closest || closest.distance > tolerance) {
            setSplitPreview(null);
            setHighlightedEdgeId(null);
          } else {
            const splitReasons: string[] = [];

            if (!hasOpenInput) {
              splitReasons.push(`No open ${sourceAndTargetDomain} Input`);
            }
            if (!hasOpenOutput) {
              splitReasons.push(`No open ${sourceAndTargetDomain} Output`);
            }
            setSplitPreview({
              edgeId: closest.edge.id,
              splitPoint: closest.splitPoint,
              canSplit: splitReasons.length === 0,
              reasons: splitReasons,
            });
            setHighlightedEdgeId(closest.edge.id);
          }
        }
      } else {
        setSplitPreview(null);
        setHighlightedEdgeId(null);
      }

      console.log(reactFlowInstance.getNodes());
      const currentNodes = reactFlowInstance.getNodes();
      console.log(node.position.x);
      console.log(helperLines);
      console.log(event.clientX);
      if (collaborationModeOn) {
        let findAny = false;

        awareness.getStates().forEach((state: any) => {
          // Skip your own client ID so you don't highlight it with your own color
          console.log(state.cursor);

          // Check if a peer has selected this specific node ID
          if (state.cursor && state.cursor.mySelectedNodeId === node.id) {
            findAny = true;
            return;
          }
        });
        if (!findAny) {
          return;
        }
      }
      let verticalLine = null;
      let horizontalLine = null;

      console.log(verticalLine);
      console.log(horizontalLine);
      const bounds = getNodesBounds(currentNodes);
      console.log(bounds);
      const { x, y } = reactFlowInstance.getViewport();
      console.log(x);
      console.log(y);
      const snapThreshold = 0; // Adjust threshold for snapping
      console.log(ref.current?.getBoundingClientRect());
      const boundingRect = ref.current?.getBoundingClientRect();
      const cneter = reactFlowInstance.screenToFlowPosition({
        x: boundingRect.x + boundingRect.width,
        y: boundingRect.y + boundingRect.height,
      });
      console.log(cneter);
      const screenY = reactFlowInstance.flowToScreenPosition({
        x: node.position.x,
        y: node.position.y,
      });
      console.log(screenY);
      console.log(reactFlowInstance.getZoom());

      // Find closest nodes for alignment
      currentNodes.forEach((otherNode) => {
        if (otherNode.id === node.id) return;

        // Check for horizontal alignment
        if (
          Math.abs(node.position.y - otherNode.position.y) === snapThreshold
        ) {
          snapTargetRef.current = otherNode;
          console.log("horizontalLine");
          const screen = reactFlowInstance.flowToScreenPosition({
            x: node.position.x,
            y: node.position.y,
          });
          console.log(screen);
          horizontalLine = screen.y - 70;
        }
      });

      // Only update helperLines if there's alignment
      if (verticalLine !== null) {
        setHelperLines({
          x: verticalLine,
          y: null,
        });
      }
      if (horizontalLine !== null) {
        setHelperLines({
          x: null,
          y: horizontalLine,
        });
      }
      if (horizontalLine === null && verticalLine === null) {
        setHelperLines({
          x: null,
          y: null,
        });
      }
      console.log(helperLines);
      console.log(node.position.x);

      console.log(reactFlowInstance);
      const intersections = reactFlowInstance
        .getIntersectingNodes(node)
        .map((n) => n.id);
      console.log(intersections);
      //updateNodeValue
      console.log("trest");
      console.log(intersections);
      console.log(nodes);
      currentNodes.forEach((nd) => {
        console.log("check");
        console.log(nd.id);
        console.log(node.id);
        console.log(node.parentId);
        if (node.parentId && nd.id !== node.id) {
          console.log("parent nicht nzkk");
          const relativeY = node.positionAbsolute.y - nd.position.y;
          console.warn("Hier drin");

          const isForbidden =
            node.data?.scope === "if" && relativeY > nd.height / 2;

          if (isForbidden) {
            console.warn(
              "Cannot drop node in the right half due to 'if' constraint.",
            );
            return;
          }
        }
      });
      // move contextmenu with dragged node if it belongs to that node
      // if other node is dragged: make context menu invisible
      if (node.id == contextMenu.componentId) {
        console.log("drag contextmenu to nodeid: ", node.id);
        setContextMenu((prev) => ({
          ...prev,
          top: event.clientY,
          left: event.clientX,
        }));
      } else {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    },
    [
      reactFlowInstance,
      helperLines,
      nodes,
      setContextMenu,
      autoConnectOnEdgeDrop,
    ],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    for (const node of nodes) {
      updateNodeValue(node.id, "selected", "false");
    }

    if (!collaborationModeOn) return;

    setMenu(null);
    setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when clicking on pane
    setSelectedNode(null);
    setMySelectedNodeId(null);
    console.log("reset");
  }, [collaborationModeOn]);

  const onClick = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false })); // contextMenu disappears when clicking anywhere in canvas (but not other panels)
  }, [setContextMenu]);

  const handleOpenConfig = () => setIsConfigOpen(true);
  const handleManageTemplates = () => setIsManageTemplatesOpen(true);

  const onExperienceLevelChange = (event) => {
    setExperienceLevel(event);
    setExperienceLevelOn(event);
    const bool_value = experienceLevel === "pioneer" ? false : true; // if previous experience level was pioneer...
    setCompactVisualization(bool_value);
    nodes.forEach((node) => {
      updateNodeInternals(node.id);
    });
  };

  const handleAddMissingValues = (job: HistoryItem) => {
    setSelectedJob(job);
    setStateTest(2);
    setIsPromptModalOpen(true);
  };

  const handleClosePromptModal = () => {
    setIsPromptModalOpen(false);
    setSelectedJob(null);
    setStateTest(1);
  };

  const onToggleCollaborationMode = useCallback(() => {
    const nextMode = !collaborationModeOn;
    setCollaborationModeOn(nextMode);
    console.log(nextMode, collaborationModeOn);
    // if collaborationMode is now off: delete cursor of current client from list of cursors
    if (nextMode) {
      // collaboration mode has been turned on
      // (re-)initialize cursor
      // Sync room data immediately to overwrite offline state
      useStore.setState({
        nodes: Array.from(nodesMap.values()),
        edges: Array.from(edgesMap.values()),
      });

      // Generate a random username
      const randomNames = [
        "Alice",
        "Bob",
        "Charlie",
        "Dana",
        "Eve",
        "Frank",
        "Grace",
        "Hugo",
      ];
      const randomUsername =
        randomNames[Math.floor(Math.random() * randomNames.length)];
      // Store local clientId
      setMyClientId(awareness.clientID);

      const color = "#" + Math.floor(Math.random() * 16777215).toString(16);

      // Set initial cursor state with username
      awareness.setLocalStateField("cursor", {
        x: 0,
        y: 0,
        color: color,
        name: randomUsername,
      });

      awareness.setLocalStateField("locks", {
        nodeIds: [],
      });

      // set initial user name
      setUserName(randomUsername);
      console.log("CURSORS", cursors);

      setNodesI(Array.from(nodesMap.values()));
      setEdgesI(Array.from(edgesMap.values()));
    } else {
      // collaboration mode has been turned off
      // delete cursor from awareness state
      awareness.setLocalStateField("cursor", null);
      setCursors({});
      setNodesI([]);
      setEdgesI([]);
      setUserName("");
      // reset canvas
      // overwriteFlow(initialDiagram);
    }
  }, [collaborationModeOn, userName]);

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
        if (
          typeof node.className === "string" &&
          node.className.includes("react-flow__panel")
        )
          return false;

        return true;
      },
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute("download", "reactflow-diagram.svg"); // TODO: Dateiname ändern?
        a.setAttribute("href", dataUrl);
        a.click();
      })
      .catch((err) => console.error("Error exporting SVG:", err));
  };

  const getCircuitSvg = (): Promise<string> => {
    // center the view before taking the screenshot
    reactFlowInstance.fitView({ padding: 0.1 });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        toSvg(ref.current, {
          filter: (node) => {
            if (!node) return false;
            if (node.classList?.contains("react-flow__minimap")) return false;
            if (node.classList?.contains("react-flow__controls")) return false;
            if (node.classList?.contains("react-flow__panel")) return false;
            if (
              typeof node.className === "string" &&
              node.className.includes("react-flow__panel")
            )
              return false;
            if (node.classList?.contains("lasso-button")) return false;
            if (
              typeof node.className === "string" &&
              node.className.includes("lasso")
            )
              return false;
            if (node instanceof HTMLElement && node.style.display === "none")
              return false;
            return true;
          },
        })
          .then((dataUrl) => resolve(dataUrl)) // ← Data-URL direkt zurückgeben
          .catch(reject);
      }, 300);
    });
  };

  const getModel = useCallback(() => {
    return reactFlowInstance.toObject();
  }, [reactFlowInstance]);

  //Handler-Funktionen für Gruppierung von Nodes
  const handleGroupSelected = useCallback(() => {
    const currentNodes = reactFlowInstance.getNodes();

    // React Flow sometimes keeps the selection in a separate list,
    // so read the selected nodes through the selection systemmRe
    const selectedNodes = currentNodes.filter(
      (n) => n.selected || reactFlowInstance.getNode(n.id)?.selected,
    );

    console.log("Selected nodes:", selectedNodes.length);

    if (selectedNodes.length < 2) {
      showToast("Select at least 2 nodes to group.", "info");
      return;
    }

    const currentEdges = reactFlowInstance.getEdges();
    const updatedNodes = groupSelectedNodes(currentNodes, currentEdges);
    if (updatedNodes !== currentNodes) {
      reactFlowInstance.setNodes(updatedNodes);
      showToast("Nodes grouped.", "success");
    } else {
      showToast("Select at least 2 nodes to group.", "info");
    }
  }, [reactFlowInstance, showToast]);

  async function deployWorkflowToCamunda(workflowName, workflowXml) {
    console.log("Deploying workflow to Camunda Engine");

    // add required form data fields
    const form = new FormData();
    form.append("deployment-name", workflowName);
    form.append("deployment-source", "QuantME Modeler");
    form.append("deploy-changed-only", "false");

    // add bpmn file ending if not present
    let fileName = workflowName;
    if (!fileName.endsWith(".bpmn")) {
      fileName = fileName + ".bpmn";
    }
    console.log(workflowXml);

    // add diagram to the body
    const bpmnFile = new File([workflowXml], fileName, { type: "text/xml" });
    form.append("data", bpmnFile);

    // make the request and wait for the response of the deployment endpoint
    try {
      console.log("Deploying to Camunda Engine: ");
      const response = await fetch(camundaEndpoint + "/deployment/create", {
        method: "POST",
        body: form,
      });
      showToast("Deployment of workflow started ", "info");

      if (response.ok) {
        // retrieve deployment results from response
        const result = await response.json();
        console.info("Deployment provides result: ", result);
        console.info(
          "Deployment successful with deployment id: %s",
          result["id"],
        );
        console.log(result["deployedProcessDefinitions"]);

        // abort if there is not exactly one deployed process definition
        if (
          Object.values(result["deployedProcessDefinitions"] || {}).length !== 1
        ) {
          console.error(
            "Invalid size of deployed process definitions list: " +
              Object.values(result["deployedProcessDefinitions"] || {}).length,
          );
          return { status: "failed" };
        }
        const baseCamundaUrl = camundaEndpoint?.replace(
          /\/engine-rest\/?$/,
          "",
        );
        showToast(
          <>
            Workflow is deployed at{" "}
            <a
              href={`${baseCamundaUrl}/camunda/app/tasklist/default`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Camunda
            </a>
          </>,
          "success",
        );

        return {
          status: "deployed",
          deployedProcessDefinition: Object.values(
            result["deployedProcessDefinitions"] || {},
          )[0],
        };
      } else {
        console.error(
          "Deployment of workflow returned invalid status code: %s",
          response.status,
        );

        return {
          status: "failed",
          message:
            "Deployment of workflow returned invalid response: " + response,
        };
      }
    } catch (error) {
      console.error("Error while executing post to deploy workflow: " + error);
      showToast("Error while executing post to deploy workflow: ", "error");
      return {
        status: "failed",
        message: "Error while executing post to deploy workflow: " + error,
      };
    }
  }

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

  async function createServiceTemplates(
    serviceDeploymentModelsUrl: string,
    namespace: string,
  ): Promise<void> {
    const res = await fetch(serviceDeploymentModelsUrl);
    if (!res.ok)
      throw new Error(
        `Failed to fetch service deployment models: ${res.statusText}`,
      );

    // Load ZIP into JSZip
    const arrayBuffer = await res.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract folder names
    const folderNames = new Set<string>();

    for (const [path] of Object.entries(zip.files)) {
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
        (f) => !f.dir && f.name.endsWith("service.zip"),
      );

      if (!serviceEntry) {
        console.warn(`No service.zip found in ${activityName}`);
        continue;
      }

      // Extract service.zip as Blob
      const serviceArrayBuffer = await serviceEntry.async("arraybuffer");
      const serviceBlob = new Blob([serviceArrayBuffer], {
        type: "application/zip",
      });

      // Create deployment model
      const versionUrl = `http://localhost:8093/winery/servicetemplates/${activityName}`;
      await createDeploymentModel(
        serviceBlob,
        "http://localhost:8093/winery",
        `${activityName}_DA`,
        "http://opentosca.org/artifacttemplates",
        "{http://opentosca.org/artifacttypes}DockerContainerArtifact",
        "service.zip",
        versionUrl,
      );
      const OPENTOSCA_NAMESPACE_NODETYPE = "http://opentosca.org/nodetypes";
      const QUANTME_NAMESPACE_PULL = "http://quantil.org/quantme/pull";

      // Create service template
      let _serviceTemplate = await createServiceTemplate(
        activityName,
        namespace,
      );
      await createNodeType(
        activityName + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE,
      );
      await updateNodeType(
        activityName + "Container",
        OPENTOSCA_NAMESPACE_NODETYPE,
      );
      _serviceTemplate = await updateServiceTemplate(
        activityName,
        QUANTME_NAMESPACE_PULL,
      );
      console.log(`Service template created for: ${activityName}`);
    }
  }

  const onNodesChangeSync = useCallback(
    (changes: NodeChange[]) => {
      console.log("Incoming changes:", changes);

      // 🔒 Build global lock map
      const states = awareness.getStates();
      const lockMap = new Map<string, number>();

      states.forEach((state: any, clientId: number) => {
        if (state?.locks?.nodeIds) {
          state.locks.nodeIds.forEach((nodeId: string) => {
            lockMap.set(nodeId, clientId);
          });
        }
      });

      // 🚫 Filter unauthorized changes safely
      const allowedChanges = changes.filter((change) => {
        if (!hasId(change)) return true;

        // Always allow your own selection changes to proceed without lock blocks
        if (change.type === "select") return true;

        const owner = lockMap.get(change.id);
        return !owner || owner === myClientId;
      });

      // 🧠 Apply changes against the latest React Flow node snapshot.
      const currentNodes = reactFlowInstance?.getNodes?.() ?? nodesI;
      const updatedNodes = applyNodeChanges(allowedChanges, currentNodes);
      console.log(
        "SELECTION STATES AFTER CHANGE",
        updatedNodes.filter((n) => n.selected).map((n) => n.id),
      );

      setNodesI(updatedNodes);
      updatedNodes.forEach((node) =>
        nodesMap.set(node.id, stripTransientNodeState(node)),
      );

      // 🔁 Sync with React Flow
      onNodesChange(allowedChanges);
      // get user name (from cursors) for history
      //const clientUserName = cursors[myClientId]?.name || "unknown";
      // Handle deletions
      const activeName = cursors[myClientId]?.name || userName || "unknown";
      allowedChanges.forEach((change) => {
        if (
          (change.type === "remove" || change.type === "reset") &&
          hasId(change)
        ) {
          console.log("NODES MAP", Array.from(nodesMap.values()));
          const nodeId = change.id;
          const nodeLabel =
            Array.from(nodesMap.values()).find((node) => node.id === nodeId)
              ?.data?.label || "unknown";
          console.log(nodesMap);
          console.log("Node deleted:", nodeId);

          nodesMap.delete(nodeId);

          // remove connected edges
          edgesMap.forEach((edge: Edge, edgeId: string) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edgesMap.delete(edgeId);
            }
          });

          historyArray.push([
            {
              type: "node-deleted",
              nodeId: nodeId,
              label: nodeLabel,
              userId: myClientId,
              user: activeName,
              timestamp: Date.now(),
            },
          ]);
          console.log("REMOVE NODE HISTORY", historyArray.toArray());
          console.log("shared nodes", Array.from(nodesMap.values()));
          console.log("shared edges", Array.from(edgesMap.values()));
        }
      });
    },
    [nodesI, awareness, myClientId, cursors],
  );

  function hasId(
    change: NodeChange | EdgeChange,
  ): change is (NodeChange | EdgeChange) & { id: string } {
    return "id" in change;
  }

  // broadcast selection via awareness
  useEffect(() => {
    if (collaborationModeOn) {
      const randomNames = [
        "Alice",
        "Bob",
        "Charlie",
        "Dana",
        "Eve",
        "Frank",
        "Grace",
        "Hugo",
      ];
      const randomUsername =
        randomNames[Math.floor(Math.random() * randomNames.length)];
      setMyClientId(awareness.clientID);

      const color = "#" + Math.floor(Math.random() * 16777215).toString(16);

      // Initializing the cursor state with localized variables safely bounded to this specific tab instance
      awareness.setLocalStateField("cursor", {
        x: 0,
        y: 0,
        color: color,
        name: randomUsername,
        role: experienceLevel,
        mySelectedNodeId: null, // <-- Track the selection cleanly inside the user's cursor scope
      });

      awareness.setLocalStateField("locks", {
        nodeIds: [],
      });

      setUserName(randomUsername);
    }
  }, [collaborationModeOn]);

  const onConnectSync = useCallback(
    (params: Connection) => {
      console.log(params);
      let type = "classicalEdge";
      let color = "#F5A843"; // default classical color

      // Quantum edge
      if (
        (params.sourceHandle.includes("quantumHandle") ||
          params.sourceHandle.includes("sideQuantumHandle")) &&
        params.targetHandle.includes("quantumHandle")
      ) {
        type = "quantumEdge";
        color = "#93C5FD";
      }

      // Ancilla edge
      if (
        (params.sourceHandle.includes("ancilla") ||
          params.sourceHandle.includes("dirtyAncilla")) &&
        (params.targetHandle.includes("ancilla") ||
          params.targetHandle.includes("dirtyAncilla"))
      ) {
        type = "ancillaEdge";
        color = "#86EFAC";
      }

      const edge: Edge = {
        ...params,
        id: uuid(),
        type,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: color,
        },
        style: { stroke: color },
      };

      // 1. Update local Zustand store (your existing store logic)
      onConnect(params);

      // 2. Save edge to Yjs shared map
      edgesMap.set(edge.id, edge);
      // get user name (from cursors) for history
      //const userName = cursors[myClientId]?.name || "unknown";
      // get source and target node label
      const sourceNode =
        nodes.find((n) => n.id === edge.source)?.data?.label || edge.source;
      const targetNode =
        nodes.find((n) => n.id === edge.target)?.data?.label || edge.target;
      // get target node label

      historyArray.push([
        {
          type: "edge-added",
          source: sourceNode,
          target: targetNode,
          edgeId: edge.id,
          //user: cursor.name,
          userId: myClientId,
          user: userName,
          timestamp: Date.now(),
        },
      ]);
      console.log("ADD EDGE HISTORY", historyArray.toArray());
      console.log("shared nodes", Array.from(nodesMap.values()));
      console.log("shared edges", Array.from(edgesMap.values()));
    },
    [awareness, myClientId, cursors],
  );

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
            primaryColor: "#007bff",
            zIndex: 10000,
          },
        }}
        callback={(data) => {
          const { index, type } = data;
          console.log("HELP");
          console.log(index);
          console.log(type);
          if (type === "step:before" && index === 0) {
            // open both side panels if they're not opened

            setIsPaletteOpen(true);
            setIsPanelOpen(true);

            let fileContent = reactFlowInstance.toObject();
            const validMetadata = {
              ...metadata,
              containsPlaceholder: containsPlaceholder,
              id: `flow-${Date.now()}`,
              timestamp: new Date().toISOString(),
            };

            console.log(validMetadata);
            console.log(metadata);

            const flowWithMetadata = {
              metadata: validMetadata,
              ...fileContent,
            };
            setModeledDiagram(JSON.stringify(flowWithMetadata));
            //setExpanded(true);
          }
          if (type === "step:before" && index === 3) {
            startTour2();
            setExpanded(true);
          }
          if (type === "step:before" && index === 4) {
            const id = "086a4f77-2562-44d3-b0df-7cfe83ae369a";
            const node = nodes.find((n) => n.id === id);
            setSelectedNode(node);
            console.log("NODES", nodes);
            console.log("SELECTED NODE", node);
          }
          if (type === "step:before" && index === 5) {
            setExpanded(false);
            const id = "e2a719bf-516c-4601-84d1-de643b05ea02";
            const node = nodes.find((n) => n.id === id);
            setSelectedNode(node);
            console.log("NODES", nodes);
            console.log("SELECTED NODE", node);
          }
          if (type === "step:before" && index === 6) {
            setExpanded(false);
            setSelectedNode(null);
          }
          if (type === "step:after" && index === 7) {
            startTour3();
          }
          if (["finished", "skipped"].includes(data.status)) {
            setRunTour(false);

            setExpanded(false);
            const toolbar = document.querySelector(".toolbar-container");
            if (toolbar) {
              (toolbar as HTMLElement).style.overflowX = "auto";
            }
            if (modeledDiagram) {
              console.log("Load old diagram.");
              overwriteFlow(JSON.parse(modeledDiagram));
            }
          }
        }}
      />

      <div className="toolbar-container bg-gray-100 w-full">
        <Toolbar
          onSave={handleSaveClick}
          onRestore={handleRestoreClick}
          onSaveAsSVG={handleSaveAsSVG}
          onOpenConfig={handleOpenConfig}
          uploadDiagram={() => uploadToGitHub()}
          uploadPatternSolution={() => setIsPatternModalOpen(true)}
          openPatternSolution={() => setIsPatternImplementationOpen(true)}
          openOpenQASM={handleOpenQASMClick}
          onLoadJson={handleLoadJson}
          sendToBackend={handleOpenValidation}
          createDomainProfile={() => openDomainProfileEditor()}
          startQuantumAlgorithmSelection={startQuantumAlgorithmSelection}
          openHistory={() => openHistoryModal()}
          startTour={() => {
            startTour();
          }}
          onSaveAsTemplate={handleSaveAsTemplate}
          onManageTemplates={handleManageTemplates}
          onGroupSelected={handleGroupSelected}
          generateModel={() => setIsPromptModalOpen(true)}
          isTestingFeatureEnabled={isTestingFeatureEnabled}
          openTesting={() => setIsTestingModalOpen(true)}
        />
      </div>
      {
        <NewDiagramModal
          open={isLoadJsonModalOpen}
          onClose={cancelLoadJson}
          onConfirm={confirmNewDiagram}
        />
      }
      {
        <TestingModal
          open={isTestingModalOpen}
          onClose={() => setIsTestingModalOpen(false)}
          onAddFlowToCanvas={loadFlow}
          validateModel={validateFlow}
          backendEndpoint={lowcodeBackendEndpoint}
        />
      }
      {
        <NewDiagramModal
          open={isLoadJsonModalOpen}
          onClose={cancelLoadJson}
          onConfirm={confirmNewDiagram}
        />
      }

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
        containsWorkflowNodes={containsWorkflowNodes}
        setCompilationTarget={setCompilationTarget}
        sendToBackend={sendToBackend}
      />

      <ConfigModal
        open={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        compactVisualization={compactVisualization}
        completionGuaranteed={completionGuaranteed}
        autoConnectOnEdgeDrop={autoConnectOnEdgeDrop}
        autoConnectOnSameLine={autoConnectOnSameLine}
        experienceLevel={experienceLevel}
        collaborationMode={collaborationModeOn}
        tempCamundaEndpoint={camundaEndpoint}
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
        userName={userName}
        tempMistralToken={mistralToken}
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

      <PromptFlowModal
        open={isPromptModalOpen}
        stepTest={stateTest}
        onClose={handleClosePromptModal}
        showToast={showToast}
        mistralToken={mistralToken}
        loadFlow={loadFlow}
        lowcodeBackendEndpoint={lowcodeBackendEndpoint}
        jobId={selectedJob?.uuid}
        missingValues={selectedJob?.missingValues || []}
        onMissingValuesSubmitted={async (
          jobId: string,
          values: Array<{ id: string; value: any; type: string }>,
        ) => {
          try {
            const response = await fetch(
              `http://localhost:3000/job/${jobId}/submit-missing-values`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missingValues: values }),
              },
            );
            if (!response.ok) {
              throw new Error("Failed to submit missing values");
            }
            showToast(
              "Missing values submitted successfully! Model generation resumed.",
              "success",
            );
            await fetchHistory();
            handleClosePromptModal();
          } catch (error: any) {
            console.error("Error submitting missing values:", error);
            showToast(
              `Failed to submit missing values: ${error.message}`,
              "error",
            );
          }
        }}
        onSubmitPrompt={handleGenerateModel}
      />

      {patternGraph && (
        <Modal
          title="Pattern Graph"
          open={true}
          onClose={() => setPatternGraph(null)}
        >
          <img
            src={patternGraph}
            alt="Pattern graph"
            className="w-full rounded"
          />
        </Modal>
      )}

      <DomainProfileModal
        open={domainProfileOpen}
        onClose={closeDomainProfileEditor}
        onSave={handleSaveDomainProfile}
        initialProfile={editingDomainProfile}
        profiles={allDomainProfiles}
        editingProfileIndex={editingDomainProfileIndex}
        onEditProfile={(index) =>
          openDomainProfileEditor(allDomainProfiles[index] ?? null, index)
        }
        onDeleteProfile={handleDeleteDomainProfile}
        onReorderProfiles={handleReorderDomainProfiles}
        onDuplicateProfile={handleDuplicateDomainProfile}
      />

      <AiModal
        quantumAlgorithmModalStep={quantumAlgorithmModalStep}
        quantumAlgorithms={quantumAlgorithms}
        _isDetectingAlgorithms={isDetectingAlgorithms}
        detectQuantumAlgorithms={detectQuantumAlgorithms}
        handleQuantumAlgorithmModalClose={handleQuantumAlgorithmModalClose}
        setQuantumAlgorithmModalStep={setQuantumAlgorithmModalStep}
        loadFlow={overwriteFlow}
      />

      <HistoryModal
        open={isHistoryOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        loadFlow={loadFlow}
        showToast={showToast}
        lowcodeBackendEndpoint={lowcodeBackendEndpoint}
        fetchHistory={fetchHistory}
        onAddMissingValues={handleAddMissingValues}
        onRefresh={fetchHistory}
        onExecute={async (item) => {
          console.log(item);
          setHistoryOpen(false);

          try {
            // Fetch the model JSON from the request link to check compilation_target
            const requestResponse = await fetch(item.links.request);
            if (!requestResponse.ok)
              throw new Error("Failed to fetch model file");
            const modelData = await requestResponse.json();

            const compilationTarget = modelData?.compilation_target;

            // If the model is a workflow
            if (compilationTarget === "workflow") {
              setWorkflow(modelData);
              const resultResponse = await fetch(item.links.result);
              const workflow = await resultResponse.text();

              if (hasMultipleMappingsInFlow(modelData)) {
                // sendWorkflowForDeployment(workflow);
              }
              await deployWorkflowToCamunda("process-workflow", workflow);

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
                  const QUANTME_NAMESPACE_PULL =
                    "http://quantil.org/quantme/pull";
                  await createServiceTemplates(
                    item.links.serviceDeploymentModels,
                    QUANTME_NAMESPACE_PULL,
                  );
                } catch (err) {
                  console.error("Service template creation failed:", err);
                }
              }
              return;
            }

            setIsQunicornOpen(true);
            const resultResponse = await fetch(item.links.result);
            if (!resultResponse.ok)
              throw new Error("Failed to fetch QASM result");
            const qasmText = await resultResponse.text();
            setOpenQASMCode(qasmText);
          } catch (error) {
            console.error("Error handling execution:", error);
            showToast(`Error executing model: ${error.message}`, "error"); // NEW: Show error toast
          }
        }}
        onSubmitPrompt={handleGenerateModel}
      />

      <main className="flex flex-col lg:flex-row h-[calc(100vh_-_60px)]">
        <div className="relative flex h-[calc(100vh_-_60px)] border-gray-200 border">
          {/* Button zum Aufklappen */}
          {!isPaletteOpen && (
            <button
              onClick={togglePalette}
              style={{ width: "24px", paddingLeft: "4px" }}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-r-lg shadow-md hover:bg-gray-600 z-50 -left-0 ${isValidationOpen ? "hidden" : ""}`}
            >
              →
            </button>
          )}

          <div
            className={`transition-all duration-300 ${isPaletteOpen ? "w-[300px] lg:w-[350px]" : "w-0 overflow-hidden"}`}
          >
            {isPaletteOpen && <Palette onAddNode={addNodeToCanvas} />}
          </div>

          {/* Button zum Einklappen  */}
          {isPaletteOpen && (
            <button
              onClick={togglePalette}
              style={{ width: "24px" }}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 right-0 ${isValidationOpen ? "hidden" : ""}`}
            >
              ←
            </button>
          )}
        </div>

        <div
          className="relative h-[calc(100vh_-_60px)] flex-grow"
          ref={reactFlowWrapper}
        >
          <EdgeHighlightProvider
            highlightedEdgeId={highlightedEdgeId}
            canSplit={splitPreview?.canSplit ?? null}
          >
            <ReactFlow
              ref={ref}
              nodes={collaborationModeOn ? nodesI : nodes}
              edges={collaborationModeOn ? edgesI : edges}
              // Selection
              selectionOnDrag={lassoMode} // ← Lasso nur wenn aktiv
              panOnDrag={!lassoMode} // ← Panning deaktivieren wenn Lasso aktiv
              selectionMode={SelectionMode.Partial} // ← Nodes die teilweise im Lasso sind auch
              deleteKeyCode={["Backspace", "Delete"]}
              multiSelectionKeyCode="Shift"
              selectionKeyCode="Shift"
              onSelectionEnd={onSelectionEnd}
              onSelectionChange={onSelectionChange}
              // Node events
              onNodesChange={
                collaborationModeOn ? onNodesChangeSync : onNodesChange
              } // TODO: onNodesChange if no collab mode
              onNodeContextMenu={onNodeContextMenu}
              onNodeClick={(event: React.MouseEvent, node: Node) => {
                handleClick(event, node);
              }}
              onNodeDragStart={onNodeDragStart}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              onNodesDelete={onNodesDelete} // TODO: weglassen oder onNodesDeleteSync erstellen?
              // Edge events
              onEdgeContextMenu={onEdgeContextMenu}
              onEdgesChange={onEdgesChange} // TODO: onEdgesChangeSync for collab mode (deletion of edge)
              onEdgesDelete={onEdgesDelete} // TODO: weglassen oder onEdgesDeleteSync erstellen?
              onConnect={collaborationModeOn ? onConnectSync : onConnect} // TODO: onConnect if no collab mode
              onConnectEnd={onConnectEnd}
              // Canvas
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onMouseMove={handleMouseMove}
              onClick={onClick}
              fitView
              fitViewOptions={{ maxZoom: 1 }}
              onInit={setReactFlowInstance}
              snapToGrid={true}
              nodeTypes={nodesConfig.nodeTypes}
              edgeTypes={nodesConfig.edgesTypes}
            >
              <EdgeHighlightMarkers />
              {helperLines && (
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
                        pointerEvents: "none",
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
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </>
              )}

              {/* Controls */}
              <Controls />

              {/* Lasso Button – separat positioniert über den Controls */}
              <div
                className="lasso-button"
                style={{
                  position: "absolute",
                  bottom: "130px", // anbinden an Controls nicht möglich, daher Position separat festlegen
                  left: "14px",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.querySelector(
                    ".lasso-tooltip",
                  ) as HTMLElement;
                  if (tooltip) tooltip.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.querySelector(
                    ".lasso-tooltip",
                  ) as HTMLElement;
                  if (tooltip) tooltip.style.opacity = "0";
                }}
              >
                <button
                  onClick={() => setLassoMode((v) => !v)}
                  style={{
                    width: "28px",
                    height: "24px",
                    background: lassoMode ? "#6366f1" : "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    color: lassoMode ? "white" : "#374151",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <ellipse
                      cx="7"
                      cy="6"
                      rx="5"
                      ry="4"
                      strokeDasharray="3 1.5"
                    />
                    <line x1="11" y1="9" x2="13" y2="13" />
                  </svg>
                </button>
                <span
                  style={{
                    position: "absolute",
                    left: "30px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#1f2937",
                    color: "white",
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
                >
                  {lassoMode ? "Cancel grouping" : "Group selection"}
                </span>
              </div>

              <ShortcutHelpModal />
              {Object.entries(cursors).length > 1 &&
                collaborationModeOn &&
                Object.entries(cursors).map(([clientId, cursor]) => {
                  // TODO: only if collaborationMode false
                  const displayName =
                    Number(clientId) === myClientId ? "Me" : cursor.name;
                  return (
                    <div
                      key={clientId}
                      style={{
                        position: "absolute",
                        left: cursor.x,
                        top: cursor.y,
                        pointerEvents: "none",
                        transform: "translate(-50%, -50%)",
                        zIndex: 999,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 4,
                          fontSize: 12,
                          color: "#fff",
                          backgroundColor: cursor.color,
                          padding: "1px 4px",
                          borderRadius: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayName}
                      </div>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: cursor.color,
                          transition: "left 0.05s linear, top 0.05s linear",
                        }}
                      />
                    </div>
                  );
                })}
              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() => setToast(null)}
                  rightOffset={isPanelOpen ? panelWidth + 16 : 24}
                />
              )}

              {isPatternModalOpen && (
                <PatternSelectionModal
                  onClose={() => setIsPatternModalOpen(false)}
                  onConfirm={(
                    patternId,
                    patternName,
                    overwriteImplementationId,
                    solutionId,
                  ) => {
                    setIsPatternModalOpen(false);
                    registerAndUploadToGitHub(
                      patternId,
                      patternName,
                      overwriteImplementationId,
                      solutionId,
                    );
                  }}
                  open={isPatternModalOpen}
                />
              )}

              {isPatternImplementationOpen && (
                <PatternImplementationSelectionModal
                  onClose={() => setIsPatternImplementationOpen(false)}
                  onConfirm={(patternId, patternName, json) => {
                    setIsPatternImplementationOpen(false);
                    loadFlow(json);
                  }}
                  open={isPatternImplementationOpen}
                />
              )}

              {collaborationModeOn && (
                <UserCountPanel provider={yProvider} roomName="demo" />
              )}
              {collaborationModeOn && (
                <VersioningPanel
                  history={versioningHistory}
                  experienceLevel={experienceLevel}
                  myClientID={myClientId}
                />
              )}

              <ExperienceModePanel
                expanded={expanded}
                onToggleExpanded={() => setExpanded(!expanded)}
                experienceLevel={experienceLevel}
                onExperienceLevelChange={onExperienceLevelChange}
                //onExperienceLevelChange={(event) => { setExperienceLevel(event); setExperienceLevelOn(event); }}
                compactVisualization={compactVisualization}
                onCompactVisualizationChange={() => {
                  setCompactVisualization(!compact);
                  setCompact(!compact);
                }}
                completionGuaranteed={completionGuaranteed}
                onCompletionGuaranteedChange={setCompletionGuaranteed}
                domainProfile={domainProfile}
                onDomainProfileChange={(event) => {
                  setDomainProfile(event);
                }}
                domainProfileNames={allDomainProfiles.map((p) => p.name)}
                mathMode={mathMode}
                onToggleMathMode={() => setMathMode((v) => !v)}
                qasmEditorMode={qasmEditorMode}
                onToggleQasmEditorMode={() => setQasmEditorMode((v) => !v)}
                collaborationMode={collaborationModeOn}
                onCollaborationModeChange={onToggleCollaborationMode}
                userName={userName}
                onUserNameChange={onUserNameChange}
              />

              <MiniMap
                nodeClassName={(node) => {
                  let isDataType = node.data.isDataType;

                  if (
                    node.type === "dataTypeNode" ||
                    node.type === "classicalAlgorithmNode" ||
                    node.type === ClassicalOperatorNode ||
                    isDataType
                  )
                    return "minimap-node-circle";
                  if (node.type === "rounded") return "minimap-node-rounded";
                  return "minimap-node-default";
                }}
                nodeColor={(node) => {
                  switch (node.type) {
                    case "editableNode":
                      return node.data.isDataType
                        ? classicalConstructColor
                        : quantumConstructColor;
                    case "dataTypeNode":
                    case "classicalAlgorithmNode":
                    case ClassicalOperatorNode:
                    case "rounded":
                      return classicalConstructColor;
                    case "ancillaNode":
                      return ancillaConstructColor;
                    case "ifElseNode":
                    case "controlStructureNode":
                      return controlFlowConstructColor;
                    default:
                      return quantumConstructColor;
                  }
                }}
                nodeComponent={({ className, x, y, width, height, color }) => {
                  const borderRadius = className.includes("circle")
                    ? 100
                    : className.includes("rounded")
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
          </EdgeHighlightProvider>
          {splitPreview && reactFlowInstance && (
            <svg
              className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
              aria-hidden="true"
            >
              {(() => {
                const viewport = reactFlowInstance.getViewport();
                const toCanvasPoint = (point: { x: number; y: number }) => ({
                  x: point.x * viewport.zoom + viewport.x,
                  y: point.y * viewport.zoom + viewport.y,
                });
                const splitPoint = toCanvasPoint(splitPreview.splitPoint);
                const splitReasons = splitPreview.reasons;
                const lineHeight = 16;
                const reasonOffset = splitPreview.canSplit
                  ? 0
                  : lineHeight * (splitReasons.length - 1);
                const color = splitPreview.canSplit ? "#009035" : "#ff0000";

                return (
                  <>
                    <circle
                      cx={splitPoint.x}
                      cy={splitPoint.y}
                      r={9}
                      fill="white"
                      stroke={color}
                      strokeWidth={3}
                    />

                    <text
                      x={splitPoint.x}
                      y={splitPoint.y + (splitPreview.canSplit ? 6 : 5)}
                      textAnchor="middle"
                      fill={color}
                      fontSize={splitPreview.canSplit ? "14" : "12"}
                      fontWeight="900"
                      paintOrder="stroke"
                      stroke="white"
                      strokeWidth="2"
                    >
                      {splitPreview.canSplit ? "✓" : "✕"}
                    </text>

                    <text
                      x={splitPoint.x}
                      y={splitPoint.y - lineHeight - reasonOffset}
                      textAnchor="middle"
                      fill={color}
                      fontSize="12"
                      fontWeight="600"
                      paintOrder="stroke"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinejoin="round"
                    >
                      {splitPreview.canSplit
                        ? "Drop to split"
                        : splitReasons.map((reason, index) => (
                            <tspan
                              key={reason}
                              x={splitPoint.x}
                              dy={index === 0 ? 0 : lineHeight}
                            >
                              {reason}
                            </tspan>
                          ))}
                    </text>
                  </>
                );
              })()}
            </svg>
          )}
          {contextMenu.visible && contextMenu.componentId && (
            <ContextMenu
              id={contextMenu.componentId}
              top={contextMenu.top}
              left={contextMenu.left}
              onAction={handleAction}
            />
          )}
        </div>

        <div className="relative flex bg-gray-100 h-[calc(100vh_-_60px)] border-gray-200 border">
          {/* Button zum Aufklappen*/}
          {!isPanelOpen && (
            <button
              onClick={togglePanel}
              style={{ width: "24px" }}
              className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white p-2 rounded-l-lg shadow-md hover:bg-gray-600 z-50 right-0 ${isValidationOpen ? "hidden" : ""}`}
            >
              ←
            </button>
          )}

          <div
            className={`transition-all duration-300 relative ${isPanelOpen ? "" : "w-0 overflow-hidden"}`}
            style={isPanelOpen ? { width: `${panelWidth}px` } : {}}
          >
            {/* Drag-Handle */}
            {isPanelOpen && (
              <div
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = panelWidth;
                  const onMove = (e: MouseEvent) => {
                    const newWidth = Math.min(
                      900,
                      Math.max(280, startWidth + (startX - e.clientX)),
                    );
                    setPanelWidth(newWidth);
                  };
                  const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                    document.body.style.cursor = "";
                  };
                  document.body.style.cursor = "ew-resize";
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "6px",
                  height: "100%",
                  cursor: "ew-resize",
                  zIndex: 50,
                  borderLeft: "2px solid #e5e7eb",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#6366f1")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e5e7eb")
                }
              />
            )}

            {/* Button zum Einklappen */}
            {isPanelOpen && (
              <button
                onClick={togglePanel}
                style={{ width: "24px", paddingLeft: "4px" }}
                className={`absolute top-1/2 transform -translate-y-1/2 bg-gray-400 text-white text-center p-2 rounded-r-lg shadow-md hover:bg-gray-600 z-50 -left-0 ${isValidationOpen ? "hidden" : ""}`}
              >
                →
              </button>
            )}

            {isPanelOpen && (
              <CustomPanel
                metadata={metadata}
                onUpdateMetadata={setMetadata}
                mathMode={mathMode}
                onWidthChange={setPanelWidth}
                backendUrl={lowcodeBackendEndpoint}
                compilationTarget={compilationTarget}
                qasmCode={openqasmCode}
                onGetCircuitSvg={getCircuitSvg}
                onSendToBackend={sendToBackend}
                onGetModel={getModel}
                qasmEditorMode={qasmEditorMode}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
