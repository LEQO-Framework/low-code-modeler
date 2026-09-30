export const QAOA_NODE_TYPE = "qaoaNode";
export const EDITABLE_NODE_TYPE = "editableNode";
export const STATE_PREPARATION_NODE_TYPE = "statePreparationNode";
export const TEST_EDGE_TYPE: string | undefined = undefined;
export const CLASSICAL_OPERATOR_NODE_TYPE = "classicalOperatorNode";
export const PLUGIN_NODE_TYPE = "pluginNode";

export type ValuePoolContext = Record<string, string | number | boolean>;
export type ValuePool = string[] | ((ctx: ValuePoolContext) => string[]);

export const dataTypeValuePools: Record<string, ValuePool> = {
  array: ["0,1", "0.1", "0.1, 0.2, 0.1"],
  "array:edgeArray": ["0,1", "[0,1],[1,0]", "[1,2],[1,1],[0,2]"], // for QAOA Operator edge input, TODO FIX
  number: ["0", "1", "-1", "3.14"],
  bit: ["0", "1"],
  boolean: ["true", "false"],
  string: ["<string_placeholder>"],
  file: ["<file_placeholder.txt>"],

  // "any" pool creates distinct test cases covering all 6 data types
  any: [
    "type:array|0,1,2",
    "type:number|3.14",
    "type:bit|1",
    "type:boolean|true",
    "type:file|<file_placeholder.txt>",
    "type:string|<string_placeholder>",
  ],
  // Derived pool ensuring array length matches 'p' parameter
  "array:length=p": (ctx) => {
    const p = Math.max(1, Number(ctx.p) || 1);
    return [
      Array.from({ length: p }, (_, i) => ((i + 1) * 0.1).toFixed(2)).join(","),
    ];
  },
};

export function resolvePool(key: string, ctx: ValuePoolContext): string[] {
  const pool = dataTypeValuePools[key];
  if (!pool) return [""];
  return typeof pool === "function" ? pool(ctx) : pool;
}

export interface TestableOption {
  key: string;
  label: string;
  values: (string | number)[];
}

export interface TestableInputPort {
  key: string;
  label: string;
  labelFor?: (optionValues: Record<string, string | number>) => string;
  dataTypeKey: string;
  targetHandle: (nodeId: string) => string;
}

export interface TestableNodeSpec {
  id: string;
  label: string;
  nodeType: string;
  defaultData: Record<string, any>;
  width: number;
  height: number;
  options: TestableOption[];
  inputs: TestableInputPort[];
}

export const TESTABLE_NODE_REGISTRY: TestableNodeSpec[] = [
  // --- Operator Nodes ---
  {
    id: "qaoa",
    label: "QAOA",
    nodeType: QAOA_NODE_TYPE,
    defaultData: { outputs: [] },
    width: 320,
    height: 550,
    options: [
      {
        key: "problem",
        label: "Problem",
        values: ["MaxCut", "Max2SAT", "GraphColoring"],
      },
      {
        key: "optimizer",
        label: "Optimizer",
        values: ["COBYLA", "SPSA", "NELDER_MEAD"],
      },
      { key: "p", label: "Layers (p)", values: [1, 3] },
    ],
    inputs: [
      {
        key: "edges",
        label: "Edges",
        labelFor: (opts) => (opts.problem === "Max2SAT" ? "Clauses" : "Edges"),
        dataTypeKey: "array:edgeArray",
        targetHandle: (id) => `classicalHandleQAOAInput0${id}`,
      },
      {
        key: "gamma",
        label: "Gamma (γ)",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleQAOAInput1${id}`,
      },
      {
        key: "beta",
        label: "Beta (β)",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleQAOAInput2${id}`,
      },
    ],
  },

  // --- Classical Operator Nodes ---
  {
    id: "classicalArithmetic",
    label: "Classical Arithmetic Operator",
    nodeType: CLASSICAL_OPERATOR_NODE_TYPE,
    defaultData: {
      label: "Classical Arithmetic Operator",
      operator: "+",
      outputs: [{ identifier: "a", type: "classical" }],
      outputTypes: ["any"],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "operator",
        label: "Operator",
        values: ["+", "-", "/", "*", "**"],
      },
    ],
    inputs: [
      {
        key: "input0",
        label: "Input 1",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
      {
        key: "input1",
        label: "Input 2",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleOperationInput1${id}`,
      },
    ],
  },

  {
    id: "classicalBitwise",
    label: "Classical Bitwise Operator",
    nodeType: CLASSICAL_OPERATOR_NODE_TYPE,
    defaultData: {
      label: "Classical Bitwise Operator",
      operator: "|",
      outputs: [{ identifier: "a", type: "classical" }],
      outputTypes: ["bit"],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "operator",
        label: "Operator",
        values: ["|", "&", "~", "^"],
      },
    ],
    inputs: [
      {
        key: "input0",
        label: "Input 1",
        dataTypeKey: "bit",
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
      {
        key: "input1",
        label: "Input 2",
        dataTypeKey: "bit",
        targetHandle: (id) => `classicalHandleOperationInput1${id}`,
      },
    ],
  },

  {
    id: "classicalComparison",
    label: "Classical Comparison Operator",
    nodeType: CLASSICAL_OPERATOR_NODE_TYPE,
    defaultData: {
      label: "Classical Comparison Operator",
      operator: "<",
      outputs: [{ identifier: "a", type: "classical" }],
      outputTypes: ["boolean"],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "operator",
        label: "Operator",
        values: ["<", ">", "<=", ">=", "==", "!="],
      },
    ],
    inputs: [
      {
        key: "input0",
        label: "Input 1",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
      {
        key: "input1",
        label: "Input 2",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleOperationInput1${id}`,
      },
    ],
  },

  {
    id: "classicalMinMax",
    label: "Classical Min & Max Operator",
    nodeType: CLASSICAL_OPERATOR_NODE_TYPE,
    defaultData: {
      label: "Classical Min & Max Operator",
      operator: "min",
      outputs: [{ identifier: "a", type: "classical" }],
      outputTypes: ["number"],
    },
    width: 320,
    height: 400,
    options: [
      {
        key: "operator",
        label: "Operator",
        values: ["min", "max"],
      },
    ],
    inputs: [
      {
        key: "input0",
        label: "Input 1",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleOperationInput0${id}`,
      },
    ],
  },

  // --- Encoding Nodes ---
  {
    id: "basisEncoding",
    label: "Basis Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Basis Encoding",
      encodingType: "Basis Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "decimalPrecision",
        label: "Decimal Precision",
        values: [2, -1], // Valid precision vs Invalid negative precision
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "angleEncoding",
    label: "Angle Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Angle Encoding",
      encodingType: "Angle Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "amplitudeEncoding",
    label: "Amplitude Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Amplitude Encoding",
      encodingType: "Amplitude Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.5, -0.5],
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "customEncoding",
    label: "Custom Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Custom Encoding",
      encodingType: "Custom Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.8, 1.5], // Valid bound vs Invalid bound (> 1)
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "any",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },
  {
    id: "matrixEncoding",
    label: "Matrix Encoding",
    nodeType: STATE_PREPARATION_NODE_TYPE,
    defaultData: {
      label: "Matrix Encoding",
      encodingType: "Matrix Encoding",
      outputs: [{ identifier: "q0", size: "1", type: "quantum" }],
      outputTypes: ["quantum"],
    },
    width: 320,
    height: 450,
    options: [
      {
        key: "bound",
        label: "Bound",
        values: [0.2, -1.0], // Valid bound vs Invalid negative bound
      },
    ],
    inputs: [
      {
        key: "value",
        label: "Input Value",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandleStatePreparationInput0${id}`,
      },
    ],
  },

  // --- Plugin Nodes ---
  {
    id: "quantumClustering",
    label: "Quantum Clustering",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Quantum Clustering",
      pluginName: "Quantum Clustering",
      clusteringAlgorithm: "k-means",
      variant: "negative_rotation",
      outputs: [{ identifier: "clusters", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "data",
          data_type: "array",
          content_type: ["text/csv"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "clusters",
          data_type: "array",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 340,
    height: 520,
    options: [
      {
        key: "variant",
        label: "Quantum Variant",
        values: [
          "destructive_interference",
          "positive_correlation",
          "negative_rotation",
          "state_prepartion",
        ],
      },
    ],
    inputs: [
      {
        key: "data",
        label: "Input Data",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
    ],
  },
  {
    id: "quantumNeuralNetwork",
    label: "Quantum Neural Network",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Quantum Neural Network",
      pluginName: "Quantum Neural Network",
      outputs: [{ identifier: "Predicted Labels", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "epochs",
          data_type: "int",
          content_type: ["text/plain"],
          required: false,
        },
      ],
      dataOutputs: [
        {
          name: "pred",
          data_type: "entity/label",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 530,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "testDataUrl",
        label: "Test Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
      {
        key: "testLabelsUrl",
        label: "Test Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput3${id}`,
      },
      {
        key: "epochs",
        label: "Epochs",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput4${id}`,
      },
    ],
  },
  {
    id: "quantumKNearestNeighbours",
    label: "Quantum K-Nearest Neighbours",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Quantum K-Nearest Neighbours",
      pluginName: "Quantum K-Nearest Neighbours",
      outputs: [{ identifier: "Predicted Labels", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "k",
          data_type: "int",
          content_type: ["text/plain"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "Predicted Labels",
          data_type: "entity/label",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 490,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "testDataUrl",
        label: "Test Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
      {
        key: "k",
        label: "K",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput3${id}`,
      },
    ],
  },
  {
    id: "quantumParzenWindows",
    label: "Quantum Parzen Windows",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Quantum Parzen Windows",
      pluginName: "Quantum Parzen Windows",
      outputs: [{ identifier: "Predicted Labels", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "variant",
          data_type: "string",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "windowSize",
          data_type: "int",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "testDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: false,
        },
      ],
      dataOutputs: [
        {
          name: "Predicted Labels",
          data_type: "entity/label",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 570,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "variant",
        label: "Variant",
        dataTypeKey: "string",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
      {
        key: "windowSize",
        label: "Window Size",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput3${id}`,
      },
      {
        key: "testDataUrl",
        label: "Test Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput4${id}`,
      },
      {
        key: "testLabelsUrl",
        label: "Test Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput5${id}`,
      },
    ],
  },
  {
    id: "quantumKernelEstimator",
    label: "Quantum Kernel Estimator",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Quantum Kernel Estimator",
      pluginName: "Quantum Kernel Estimator",
      outputs: [{ identifier: "Kernel Matrix", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "entityPointsUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "featureMap",
          data_type: "string",
          content_type: ["text/plain"],
          required: false,
        },
      ],
      dataOutputs: [
        {
          name: "Kernel Matrix",
          data_type: "entity/matrix",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 410,
    options: [
      {
        key: "featureMap",
        label: "Feature Map",
        values: ["ZFeatureMap", "ZZFeatureMap", "PauliFeatureMap"],
      },
    ],
    inputs: [
      {
        key: "entityPointsUrl",
        label: "Entity Points",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "featureMap",
        label: "Feature Map",
        dataTypeKey: "string",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
    ],
  },
  {
    id: "variationalQuantumClassifier",
    label: "Variational Quantum Classifier",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Variational Quantum Classifier",
      pluginName: "Variational Quantum Classifier",
      outputs: [{ identifier: "Predicted Labels", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "Predicted Labels",
          data_type: "entity/label",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 450,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "testDataUrl",
        label: "Test Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
    ],
  },
  {
    id: "hybridAutoencoder",
    label: "Hybrid Autoencoder",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Hybrid Autoencoder",
      pluginName: "Hybrid Autoencoder",
      outputs: [{ identifier: "Reduced Data", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingPointsUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "embeddingSize",
          data_type: "integer",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "qnnName",
          data_type: "string",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "trainingSteps",
          data_type: "int",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "numberOfQubits ",
          data_type: "int",
          content_type: ["text/plain"],
          required: true,
        },
        {
          parameter: "testPointsUrl",
          data_type: "string",
          content_type: ["text/plain"],
          required: false,
        },
      ],
      dataOutputs: [
        {
          name: "Reduced Data",
          data_type: "entity/vector",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 570,
    options: [],
    inputs: [
      {
        key: "trainingPointsUrl",
        label: "Training Points",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "embeddingSize",
        label: "Embedding Size",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "qnnName",
        label: "QNN Name",
        dataTypeKey: "string",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
      {
        key: "trainingSteps",
        label: "Training Steps",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput3${id}`,
      },
      {
        key: "numberOfQubits",
        label: "Number of Qubits",
        dataTypeKey: "number",
        targetHandle: (id) => `classicalHandlePluginInput4${id}`,
      },
      {
        key: "testPointsUrl",
        label: "Test Points",
        dataTypeKey: "string",
        targetHandle: (id) => `classicalHandlePluginInput5${id}`,
      },
    ],
  },
  // --- Classical Plugin Nodes ---
  {
    id: "classicalClustering",
    label: "Classical Clustering",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Classical Clustering",
      pluginName: "Classical Clustering",
      clusteringAlgorithm: "k-medoids",
      initializationMethod: "random",
      algorithm: "pam",
      outputs: [{ identifier: "clusters", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "data",
          data_type: "array",
          content_type: ["text/csv"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "clusters",
          data_type: "array",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 340,
    height: 520,
    options: [
      {
        key: "clusteringAlgorithm",
        label: "Algorithm",
        values: ["k-medoids", "optics", "k-means"],
      },
      {
        key: "initializationMethod",
        label: "Initialization Method",
        values: ["random", "k-medoids++"],
      },
      {
        key: "metric",
        label: "Metric",
        values: ["dice", "minkowski", "euclidean"],
      },
    ],
    inputs: [
      {
        key: "data",
        label: "Input Data",
        dataTypeKey: "array",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
    ],
  },
  {
    id: "supportVectorMachine",
    label: "Support Vector Machine",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Support Vector Machine",
      pluginName: "Support Vector Machine",
      outputs: [{ identifier: "Predicted Labels", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "testDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "Predicted Labels",
          data_type: "entity/label",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 450,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
      {
        key: "testDataUrl",
        label: "Test Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput2${id}`,
      },
    ],
  },
  {
    id: "neuralNetwork",
    label: "Neural Network",
    nodeType: PLUGIN_NODE_TYPE,
    defaultData: {
      label: "Neural Network",
      pluginName: "Neural Network",
      outputs: [{ identifier: "Model", type: "classical" }],
      outputTypes: ["array"],
      dataInputs: [
        {
          parameter: "trainingDataUrl",
          data_type: "entity/vector",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
        {
          parameter: "trainingLabelsUrl",
          data_type: "entity/label",
          content_type: ["application/json", "text/csv"],
          required: true,
        },
      ],
      dataOutputs: [
        {
          name: "Model",
          data_type: "model",
          content_type: ["application/json"],
          required: true,
        },
      ],
    },
    width: 320,
    height: 410,
    options: [],
    inputs: [
      {
        key: "trainingDataUrl",
        label: "Training Data",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput0${id}`,
      },
      {
        key: "trainingLabelsUrl",
        label: "Training Labels",
        dataTypeKey: "file",
        targetHandle: (id) => `classicalHandlePluginInput1${id}`,
      },
    ],
  },
];
