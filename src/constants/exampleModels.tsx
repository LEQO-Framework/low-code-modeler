export const empty_model = {
  "metadata": {
    "version": "1.0.1",
    "name": "Empty model",
    "description": "Start with an empty quantum model and build your workflow from scratch.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084570389",
    "timestamp": "2026-09-22T13:42:50.389Z"
  },
  "nodes": [],
  "edges": [],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}

export const hello_quantum = {
  "metadata": {
    "version": "1.0.0",
    "name": "Hello Quantum",
    "description": "Build and run a minimal quantum circuit with qubits, gates, and measurement.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084120128",
    "timestamp": "2026-09-22T13:35:20.128Z"
  },
  "nodes": [
    {
      "id": "1731b393-641b-4314-aa54-103becd631a0",
      "type": "gateNode",
      "position": {
        "x": -270,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q724086"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -270,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "920d8351-3a7b-45fd-9a24-7ba563150754",
      "type": "gateNode",
      "position": {
        "x": -75,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "1731b393-641b-4314-aa54-103becd631a0",
            "edgeId": "c071dc9a-3205-4521-a761-86ac0f998895",
            "identifiers": [
              "q724086"
            ],
            "targetHandle": "quantumHandleGateInput0920d8351-3a7b-45fd-9a24-7ba563150754"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q724086"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -75,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "920d8351-3a7b-45fd-9a24-7ba563150754",
            "edgeId": "8a7534a5-19a7-4639-afe0-626838edc5d2",
            "identifiers": [
              "q724086"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q724086"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "920d8351-3a7b-45fd-9a24-7ba563150754",
      "sourceHandle": "quantumHandleGateOutput0920d8351-3a7b-45fd-9a24-7ba563150754",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "8a7534a5-19a7-4639-afe0-626838edc5d2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1731b393-641b-4314-aa54-103becd631a0",
      "sourceHandle": "quantumHandleGateOutput01731b393-641b-4314-aa54-103becd631a0",
      "target": "920d8351-3a7b-45fd-9a24-7ba563150754",
      "targetHandle": "quantumHandleGateInput0920d8351-3a7b-45fd-9a24-7ba563150754",
      "type": "quantumEdge",
      "id": "c071dc9a-3205-4521-a761-86ac0f998895",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 367,
    "y": 45,
    "zoom": 1
  }
}


export const first_measurement = {
  "metadata": {
    "version": "1.0.0",
    "name": "First Measurement",
    "description": "Create a simple quantum circuit and observe the resulting measurement distribution.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084190367",
    "timestamp": "2026-09-22T13:36:30.367Z"
  },
  "nodes": [
    {
      "id": "1731b393-641b-4314-aa54-103becd631a0",
      "type": "gateNode",
      "position": {
        "x": -270,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q724086"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -270,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "d0e9b0b8-1590-4030-bffe-0534ed8e871a",
            "edgeId": "f8222a01-8d8c-4cae-8f8c-3f15b971511d",
            "identifiers": [
              "q724086"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q724086"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "d0e9b0b8-1590-4030-bffe-0534ed8e871a",
      "type": "gateNode",
      "position": {
        "x": -75,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "1731b393-641b-4314-aa54-103becd631a0",
            "edgeId": "8db8d992-02ac-4a20-9a5d-25a16a7b6ff2",
            "identifiers": [
              "q724086"
            ],
            "targetHandle": "quantumHandleGateInput0d0e9b0b8-1590-4030-bffe-0534ed8e871a"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q724086"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -75,
        "y": 255
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "d0e9b0b8-1590-4030-bffe-0534ed8e871a",
      "sourceHandle": "quantumHandleGateOutput0d0e9b0b8-1590-4030-bffe-0534ed8e871a",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "f8222a01-8d8c-4cae-8f8c-3f15b971511d",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1731b393-641b-4314-aa54-103becd631a0",
      "sourceHandle": "quantumHandleGateOutput01731b393-641b-4314-aa54-103becd631a0",
      "target": "d0e9b0b8-1590-4030-bffe-0534ed8e871a",
      "targetHandle": "quantumHandleGateInput0d0e9b0b8-1590-4030-bffe-0534ed8e871a",
      "type": "quantumEdge",
      "id": "8db8d992-02ac-4a20-9a5d-25a16a7b6ff2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 367,
    "y": 45,
    "zoom": 1
  }
}

export const ghz = {
  "metadata": {
    "version": "1.0.0",
    "name": "GHZ3",
    "description": "Create a multi-qubit GHZ state and explore multi-qubit entanglement.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790086077958",
    "timestamp": "2026-09-22T14:07:57.958Z"
  },
  "nodes": [
    {
      "id": "39feeae4-3dd6-494a-aaac-185f26bae158",
      "type": "gateNode",
      "position": {
        "x": -225,
        "y": 450
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -225,
        "y": 450
      },
      "dragging": false
    },
    {
      "id": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "type": "gateNode",
      "position": {
        "x": -225,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q225881"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -225,
        "y": 255
      }
    },
    {
      "id": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "type": "gateNode",
      "position": {
        "x": -15,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
            "edgeId": "72fabba8-889f-4b07-953f-97f0b2020b94",
            "identifiers": [
              "q225881"
            ],
            "targetHandle": "quantumHandleGateInput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q225881"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -15,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "gateNode",
      "position": {
        "x": 195,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
            "edgeId": "036a1a60-076d-40ed-9fc1-e36939df288c",
            "identifiers": [
              "q225881"
            ],
            "targetHandle": "quantumHandleGateInput0ddfeb965-964a-43ac-bb01-7e775bafb3c4"
          },
          {
            "id": "39feeae4-3dd6-494a-aaac-185f26bae158",
            "edgeId": "5d92b0c6-33e4-44be-b60a-4b53d1299cfd",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleGateInput1ddfeb965-964a-43ac-bb01-7e775bafb3c4"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Controlled NOT.",
        "icon": [
          "CNOT_palette.png",
          "PaletteIcon_CNOT_Beginner.png"
        ],
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [
          "any",
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 220,
      "positionAbsolute": {
        "x": 195,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "mergerNode",
      "position": {
        "x": 615,
        "y": 330
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Merger",
        "inputs": [
          {
            "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
            "edgeId": "edef5144-6c38-4efd-96a1-ba15cc2266c9",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMergerInput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc"
          },
          {
            "id": "c88386b5-20c3-47da-a8f0-357bb6785b79",
            "edgeId": "7327f6ea-6bf1-4597-943d-1329665cfa1a",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMergerInput1c88d4b7c-a027-4878-a043-ad5ba6e4aecc"
          },
          {
            "id": "c88386b5-20c3-47da-a8f0-357bb6785b79",
            "edgeId": "0375391c-1218-4076-8cb8-f936827c929b",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMergerInput2c88d4b7c-a027-4878-a043-ad5ba6e4aecc"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Merges qubits.",
        "icon": "Merger_palette.png",
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "numberInputs": 3
      },
      "width": 170,
      "height": 205,
      "positionAbsolute": {
        "x": 615,
        "y": 330
      },
      "dragging": false
    },
    {
      "id": "a8296458-9d46-4398-989e-3fde154c0620",
      "type": "measurementNode",
      "position": {
        "x": 855,
        "y": 255
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
            "edgeId": "65c05d30-68aa-458b-99fc-76b19ffa4916",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMeasurementInput0a8296458-9d46-4398-989e-3fde154c0620"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q567334"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 855,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "b5c41281-0d9d-4ba8-807b-6e6f45b54771",
      "type": "gateNode",
      "position": {
        "x": -225,
        "y": 645
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q575305"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -225,
        "y": 645
      },
      "dragging": false
    },
    {
      "id": "c88386b5-20c3-47da-a8f0-357bb6785b79",
      "type": "gateNode",
      "position": {
        "x": 420,
        "y": 435
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "b5c41281-0d9d-4ba8-807b-6e6f45b54771",
            "edgeId": "c27413a7-b7c7-4a15-b41f-c06a895edc6c",
            "identifiers": [
              "q575305"
            ],
            "targetHandle": "quantumHandleGateInput1c88386b5-20c3-47da-a8f0-357bb6785b79"
          },
          {
            "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
            "edgeId": "a82b1bb9-666f-44d0-a47e-5eacbb41cc65",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleGateInput0c88386b5-20c3-47da-a8f0-357bb6785b79"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Controlled NOT.",
        "icon": [
          "CNOT_palette.png",
          "PaletteIcon_CNOT_Beginner.png"
        ],
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [
          "any",
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 220,
      "positionAbsolute": {
        "x": 420,
        "y": 435
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "c88386b5-20c3-47da-a8f0-357bb6785b79",
      "sourceHandle": "quantumHandleGateOutput1c88386b5-20c3-47da-a8f0-357bb6785b79",
      "target": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "targetHandle": "quantumHandleMergerInput2c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "quantumEdge",
      "id": "0375391c-1218-4076-8cb8-f936827c929b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c88386b5-20c3-47da-a8f0-357bb6785b79",
      "sourceHandle": "quantumHandleGateOutput0c88386b5-20c3-47da-a8f0-357bb6785b79",
      "target": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "targetHandle": "quantumHandleMergerInput1c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "quantumEdge",
      "id": "7327f6ea-6bf1-4597-943d-1329665cfa1a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "sourceHandle": "quantumHandleGateOutput0ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "target": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "targetHandle": "quantumHandleMergerInput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "quantumEdge",
      "id": "edef5144-6c38-4efd-96a1-ba15cc2266c9",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "sourceHandle": "quantumHandleGateOutput1ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "target": "c88386b5-20c3-47da-a8f0-357bb6785b79",
      "targetHandle": "quantumHandleGateInput0c88386b5-20c3-47da-a8f0-357bb6785b79",
      "type": "quantumEdge",
      "id": "a82b1bb9-666f-44d0-a47e-5eacbb41cc65",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b5c41281-0d9d-4ba8-807b-6e6f45b54771",
      "sourceHandle": "quantumHandleGateOutput0b5c41281-0d9d-4ba8-807b-6e6f45b54771",
      "target": "c88386b5-20c3-47da-a8f0-357bb6785b79",
      "targetHandle": "quantumHandleGateInput1c88386b5-20c3-47da-a8f0-357bb6785b79",
      "type": "quantumEdge",
      "id": "c27413a7-b7c7-4a15-b41f-c06a895edc6c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "sourceHandle": "quantumHandleMergerOutput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "target": "a8296458-9d46-4398-989e-3fde154c0620",
      "targetHandle": "quantumHandleMeasurementInput0a8296458-9d46-4398-989e-3fde154c0620",
      "type": "quantumEdge",
      "id": "65c05d30-68aa-458b-99fc-76b19ffa4916",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "39feeae4-3dd6-494a-aaac-185f26bae158",
      "sourceHandle": "quantumHandleGateOutput039feeae4-3dd6-494a-aaac-185f26bae158",
      "target": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "targetHandle": "quantumHandleGateInput1ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "quantumEdge",
      "id": "5d92b0c6-33e4-44be-b60a-4b53d1299cfd",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "sourceHandle": "quantumHandleGateOutput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "target": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "targetHandle": "quantumHandleGateInput0ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "quantumEdge",
      "id": "036a1a60-076d-40ed-9fc1-e36939df288c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "sourceHandle": "quantumHandleGateOutput0be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "target": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "targetHandle": "quantumHandleGateInput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "type": "quantumEdge",
      "id": "72fabba8-889f-4b07-953f-97f0b2020b94",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 225.62517220965947,
    "y": 78.26412230906453,
    "zoom": 0.7239999587577036
  }
}


export const uniform_superposition = {
  "metadata": {
    "version": "1.0.0",
    "name": "Uniform Superposition",
    "description": "Prepare 3 qubits in a uniform superposition of computational basis states.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085909351",
    "timestamp": "2026-09-22T14:05:09.351Z"
  },
  "nodes": [
    {
      "id": "e3d8abb2-c1f7-4a16-afcd-b2daf75b7719",
      "type": "qubitNode",
      "position": {
        "x": -60,
        "y": 345
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit",
        "inputs": [],
        "outputs": [
          {
            "identifier": "",
            "size": "3"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Basic unit of quantum information.",
        "icon": "PaletteIcon_Qubit.png",
        "identifiers": [
          "q155265"
        ],
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ],
        "size": 3
      },
      "width": 350,
      "height": 170,
      "dragging": false,
      "positionAbsolute": {
        "x": -60,
        "y": 345
      }
    },
    {
      "id": "19daabc9-2847-4f27-b87b-eabc39679c9d",
      "type": "gateNode",
      "position": {
        "x": 405,
        "y": 375
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "e3d8abb2-c1f7-4a16-afcd-b2daf75b7719",
            "edgeId": "cdb1654d-0153-47da-86cb-a0aa09298b4a",
            "identifiers": [
              "q155265"
            ],
            "targetHandle": "quantumHandleGateInput019daabc9-2847-4f27-b87b-eabc39679c9d",
            "outputIdentifier": ""
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q155265"
        ],
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 405,
        "y": 375
      }
    },
    {
      "id": "8ede2488-4619-4f5c-98e2-23a9e3d74f93",
      "type": "measurementNode",
      "position": {
        "x": 630,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "19daabc9-2847-4f27-b87b-eabc39679c9d",
            "edgeId": "8094f705-ebad-460b-873a-aa453e70ffba",
            "identifiers": [
              "q155265"
            ],
            "targetHandle": "quantumHandleMeasurementInput08ede2488-4619-4f5c-98e2-23a9e3d74f93"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q155265"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 630,
        "y": 240
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "19daabc9-2847-4f27-b87b-eabc39679c9d",
      "sourceHandle": "quantumHandleGateOutput019daabc9-2847-4f27-b87b-eabc39679c9d",
      "target": "8ede2488-4619-4f5c-98e2-23a9e3d74f93",
      "targetHandle": "quantumHandleMeasurementInput08ede2488-4619-4f5c-98e2-23a9e3d74f93",
      "type": "quantumEdge",
      "id": "8094f705-ebad-460b-873a-aa453e70ffba",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "e3d8abb2-c1f7-4a16-afcd-b2daf75b7719",
      "sourceHandle": "quantumHandlequbitNodeOutput0e3d8abb2-c1f7-4a16-afcd-b2daf75b7719",
      "target": "19daabc9-2847-4f27-b87b-eabc39679c9d",
      "targetHandle": "quantumHandleGateInput019daabc9-2847-4f27-b87b-eabc39679c9d",
      "type": "quantumEdge",
      "id": "cdb1654d-0153-47da-86cb-a0aa09298b4a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 256.4,
    "y": 51,
    "zoom": 1
  }
}

export const amplitude_encoding = {
  "metadata": {
    "version": "1.0.0",
    "name": "Amplitude Encoding",
    "description": "Encode a normalized classical vector into the amplitudes of a quantum state.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084418566",
    "timestamp": "2026-09-22T13:40:18.566Z"
  },
  "nodes": [
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "873f5603-a5be-4fa1-8ce7-f46f894be82c",
            "edgeId": "64df49ac-d798-4f51-aeef-d97d6d86a6c4",
            "identifiers": [
              "q868728"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q868728"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
      "type": "dataTypeNode",
      "position": {
        "x": -885,
        "y": 225
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Array",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "A list of values, possibly of varying length.",
        "icon": "PaletteIcon_Array.png",
        "identifiers": [
          "q100581"
        ],
        "dataType": "array",
        "value": "0.6,0.8",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "array"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -885,
        "y": 225
      },
      "dragging": false
    },
    {
      "id": "873f5603-a5be-4fa1-8ce7-f46f894be82c",
      "type": "statePreparationNode",
      "position": {
        "x": -330,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Amplitude Encoding",
        "inputs": [
          {
            "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
            "edgeId": "4b4b9e03-5a1b-4731-8fb1-a0108c18fe01",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput0873f5603-a5be-4fa1-8ce7-f46f894be82c",
            "identifiers": [
              "q100581"
            ]
          },
          {
            "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
            "edgeId": "4b4b9e03-5a1b-4731-8fb1-a0108c18fe01",
            "outputIdentifier": "",
            "identifiers": [
              "q100581"
            ],
            "targetHandle": "classicalHandleStatePreparationInput0873f5603-a5be-4fa1-8ce7-f46f894be82c"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "description": "Encodes a normalized classical vector into quantum state amplitudes.",
        "icon": [
          "PaletteIcon_AmplitudeEncoding.png",
          "PaletteIcon_Ancilla_AmplitudeEncoding.png"
        ],
        "identifiers": [
          "q100581"
        ],
        "inputTypes": [
          "array"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Amplitude Encoding"
      },
      "width": 320,
      "height": 350,
      "positionAbsolute": {
        "x": -330,
        "y": 210
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "69f80af8-2ed0-4225-983d-028c041f28bf",
      "sourceHandle": "classicalHandleDataTypeOutput069f80af8-2ed0-4225-983d-028c041f28bf",
      "target": "873f5603-a5be-4fa1-8ce7-f46f894be82c",
      "targetHandle": "classicalHandleStatePreparationInput0873f5603-a5be-4fa1-8ce7-f46f894be82c",
      "type": "classicalEdge",
      "id": "4b4b9e03-5a1b-4731-8fb1-a0108c18fe01",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "873f5603-a5be-4fa1-8ce7-f46f894be82c",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput0873f5603-a5be-4fa1-8ce7-f46f894be82c",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "64df49ac-d798-4f51-aeef-d97d6d86a6c4",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 803.4000000000007,
    "y": 47,
    "zoom": 1
  }
}


export const basis_encoding = {
  "metadata": {
    "version": "1.0.0",
    "name": "Basis Encoding",
    "description": "Encode classical data into computational basis states.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084289785",
    "timestamp": "2026-09-22T13:38:09.785Z"
  },
  "nodes": [
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "1fca74fd-3742-4a31-bf3a-185387e0e5b2",
            "edgeId": "0b446e8d-9398-401c-8413-6018b5f334bc",
            "identifiers": [
              "q244382"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q244382"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "1fca74fd-3742-4a31-bf3a-185387e0e5b2",
      "type": "statePreparationNode",
      "position": {
        "x": -315,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Basis Encoding",
        "inputs": [
          {
            "id": "9c73c44a-e416-47f8-895c-7f442803cb36",
            "edgeId": "00f1fd63-8359-4577-87cb-b6b214786d26",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput01fca74fd-3742-4a31-bf3a-185387e0e5b2",
            "identifiers": [
              "q788703"
            ]
          },
          {
            "id": "9c73c44a-e416-47f8-895c-7f442803cb36",
            "edgeId": "00f1fd63-8359-4577-87cb-b6b214786d26",
            "outputIdentifier": "",
            "identifiers": [
              "q788703"
            ],
            "targetHandle": "classicalHandleStatePreparationInput01fca74fd-3742-4a31-bf3a-185387e0e5b2"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "description": "Encodes classical bits into computational basis quantum states.",
        "icon": [
          "PaletteIcon_BasisEncoding.png",
          "PaletteIcon_Ancilla_BasisEncoding.png"
        ],
        "identifiers": [
          "q788703"
        ],
        "inputTypes": [
          "number"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Basis Encoding"
      },
      "width": 320,
      "height": 350,
      "positionAbsolute": {
        "x": -315,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "9c73c44a-e416-47f8-895c-7f442803cb36",
      "type": "dataTypeNode",
      "position": {
        "x": -840,
        "y": 195
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q788703"
        ],
        "dataType": "number",
        "value": "2",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -840,
        "y": 195
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "9c73c44a-e416-47f8-895c-7f442803cb36",
      "sourceHandle": "classicalHandleDataTypeOutput09c73c44a-e416-47f8-895c-7f442803cb36",
      "target": "1fca74fd-3742-4a31-bf3a-185387e0e5b2",
      "targetHandle": "classicalHandleStatePreparationInput01fca74fd-3742-4a31-bf3a-185387e0e5b2",
      "type": "classicalEdge",
      "id": "00f1fd63-8359-4577-87cb-b6b214786d26",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "1fca74fd-3742-4a31-bf3a-185387e0e5b2",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput01fca74fd-3742-4a31-bf3a-185387e0e5b2",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "0b446e8d-9398-401c-8413-6018b5f334bc",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 851,
    "y": 47,
    "zoom": 1
  }
}


export const angle_encoding = {
  "metadata": {
    "version": "1.0.0",
    "name": "Angle Encoding",
    "description": "Encode classical numerical data into qubit rotation angles.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084368214",
    "timestamp": "2026-09-22T13:39:28.214Z"
  },
  "nodes": [
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "22743ae8-9ba6-4231-8d82-b222dce2d4ca",
            "edgeId": "5186e943-4549-400f-8435-9c833384e469",
            "identifiers": [
              "q314329"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q314329"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "22743ae8-9ba6-4231-8d82-b222dce2d4ca",
      "type": "statePreparationNode",
      "position": {
        "x": -300,
        "y": 195
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Angle Encoding",
        "inputs": [
          {
            "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
            "edgeId": "d52f5260-1d20-4554-880a-f4f72e902b5b",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput022743ae8-9ba6-4231-8d82-b222dce2d4ca",
            "identifiers": [
              "q100581"
            ]
          },
          {
            "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
            "edgeId": "d52f5260-1d20-4554-880a-f4f72e902b5b",
            "outputIdentifier": "",
            "identifiers": [
              "q100581"
            ],
            "targetHandle": "classicalHandleStatePreparationInput022743ae8-9ba6-4231-8d82-b222dce2d4ca"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "description": "Encodes classical data into qubit rotation angles.",
        "icon": [
          "PaletteIcon_AngleEncoding.png",
          "PaletteIcon_Ancilla_AngleEncoding.png"
        ],
        "identifiers": [
          "q100581"
        ],
        "inputTypes": [
          "array"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Angle Encoding"
      },
      "width": 320,
      "height": 350,
      "positionAbsolute": {
        "x": -300,
        "y": 195
      },
      "dragging": false
    },
    {
      "id": "69f80af8-2ed0-4225-983d-028c041f28bf",
      "type": "dataTypeNode",
      "position": {
        "x": -885,
        "y": 225
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Array",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "A list of values, possibly of varying length.",
        "icon": "PaletteIcon_Array.png",
        "identifiers": [
          "q100581"
        ],
        "dataType": "array",
        "value": "0.6,0.8",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "array"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -885,
        "y": 225
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "69f80af8-2ed0-4225-983d-028c041f28bf",
      "sourceHandle": "classicalHandleDataTypeOutput069f80af8-2ed0-4225-983d-028c041f28bf",
      "target": "22743ae8-9ba6-4231-8d82-b222dce2d4ca",
      "targetHandle": "classicalHandleStatePreparationInput022743ae8-9ba6-4231-8d82-b222dce2d4ca",
      "type": "classicalEdge",
      "id": "d52f5260-1d20-4554-880a-f4f72e902b5b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "22743ae8-9ba6-4231-8d82-b222dce2d4ca",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput022743ae8-9ba6-4231-8d82-b222dce2d4ca",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "5186e943-4549-400f-8435-9c833384e469",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 803.4000000000007,
    "y": 47,
    "zoom": 1
  }
}

export const encode_value = {
  "metadata": {
    "version": "1.0.0",
    "name": "Encode Value",
    "description": "Encode a classical value into a quantum state using a high-level encoding block.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084491789",
    "timestamp": "2026-09-22T13:41:31.789Z"
  },
  "nodes": [
    {
      "id": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "measurementNode",
      "position": {
        "x": 120,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "26fb1ed0-cf45-4b02-9eb0-c679afd2b560",
            "edgeId": "2078f076-b917-4c58-a80a-e937e7324dec",
            "outputIdentifier": "",
            "identifiers": [
              "q917491"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q917491"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 120,
        "y": 180
      },
      "dragging": false,
      "hidden": false
    },
    {
      "id": "26fb1ed0-cf45-4b02-9eb0-c679afd2b560",
      "type": "statePreparationNode",
      "position": {
        "x": -330,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Encode Value",
        "inputs": [
          {
            "id": "85a01afd-9537-436e-8d37-3e5909b40daf",
            "edgeId": "08904630-4180-4e95-845d-37f5ec425033",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput026fb1ed0-cf45-4b02-9eb0-c679afd2b560",
            "identifiers": [
              "q244595"
            ]
          },
          {
            "id": "85a01afd-9537-436e-8d37-3e5909b40daf",
            "edgeId": "08904630-4180-4e95-845d-37f5ec425033",
            "outputIdentifier": "",
            "identifiers": [
              "q244595"
            ],
            "targetHandle": "classicalHandleStatePreparationInput026fb1ed0-cf45-4b02-9eb0-c679afd2b560"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true
        ],
        "description": "Encodes a classical value into a quantum state.",
        "icon": [
          "PaletteIcon_EncodeValue.png",
          "PaletteIcon_Ancilla_EncodeValue.png"
        ],
        "identifiers": [
          "q244595"
        ],
        "encodingType": "Basis Encoding",
        "bound": 0,
        "size": "",
        "outputIdentifier": "",
        "inputTypes": [
          "number"
        ],
        "outputTypes": [
          "quantum register"
        ]
      },
      "width": 320,
      "height": 450,
      "positionAbsolute": {
        "x": -330,
        "y": 180
      },
      "dragging": false
    },
    {
      "id": "85a01afd-9537-436e-8d37-3e5909b40daf",
      "type": "dataTypeNode",
      "position": {
        "x": -900,
        "y": 240
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q244595"
        ],
        "dataType": "number",
        "value": "2",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -900,
        "y": 240
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "85a01afd-9537-436e-8d37-3e5909b40daf",
      "sourceHandle": "classicalHandleDataTypeOutput085a01afd-9537-436e-8d37-3e5909b40daf",
      "target": "26fb1ed0-cf45-4b02-9eb0-c679afd2b560",
      "targetHandle": "classicalHandleStatePreparationInput026fb1ed0-cf45-4b02-9eb0-c679afd2b560",
      "type": "classicalEdge",
      "id": "08904630-4180-4e95-845d-37f5ec425033",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "26fb1ed0-cf45-4b02-9eb0-c679afd2b560",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput026fb1ed0-cf45-4b02-9eb0-c679afd2b560",
      "target": "c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "targetHandle": "quantumHandleMeasurementInput0c3fb1297-86e5-4a4e-a553-76a6a831988b",
      "type": "quantumEdge",
      "id": "2078f076-b917-4c58-a80a-e937e7324dec",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 803.4000000000007,
    "y": 47,
    "zoom": 1
  }
}

export const grover_building_blocks = {
  "metadata": {
    "version": "1.0.0",
    "name": "Grover - Building Blocks",
    "description": "Build Grover search from an oracle, diffuser, encoding, and other reusable building blocks.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084811778",
    "timestamp": "2026-09-22T13:46:51.778Z"
  },
  "nodes": [
    {
      "id": "88108bfd-f27a-4ec6-8620-46cad86f3353",
      "type": "measurementNode",
      "position": {
        "x": 720,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "4ea34479-6b0e-40b3-b675-5ecedf16a520",
            "edgeId": "0d77ebd5-f037-48a2-9d28-18fab3ab6229",
            "identifiers": [
              "q978728"
            ],
            "targetHandle": "quantumHandleMeasurementInput088108bfd-f27a-4ec6-8620-46cad86f3353"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q978728"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 720,
        "y": 240
      },
      "dragging": false
    },
    {
      "id": "8034f88a-b405-463b-819a-98a6e6897d6d",
      "type": "universal-oracle",
      "position": {
        "x": -90,
        "y": 240
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Grover Oracle",
        "inputs": [
          {
            "id": "260f3211-f591-4619-8107-d092c7e8ee35",
            "edgeId": "2837c5f9-82d0-4dc1-8cd8-a7c2504210f3",
            "outputIdentifier": "",
            "identifiers": [
              "q978728"
            ],
            "targetHandle": "quantumHandleInput08034f88a-b405-463b-819a-98a6e6897d6d"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false,
          true
        ],
        "description": "Arbitrary Oracle defined by a Truth Table for Boolean or Phase evaluation.",
        "icon": "PaletteIcon_Oracle.png",
        "identifiers": [
          "q978728"
        ],
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": {
          "0": "quantum register"
        },
        "targetStates": "1"
      },
      "width": 320,
      "height": 420,
      "dragging": false,
      "positionAbsolute": {
        "x": -90,
        "y": 240
      }
    },
    {
      "id": "4ea34479-6b0e-40b3-b675-5ecedf16a520",
      "type": "grover-diffuser",
      "position": {
        "x": 300,
        "y": 300
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Grover Diffuser",
        "inputs": [
          {
            "id": "8034f88a-b405-463b-819a-98a6e6897d6d",
            "edgeId": "d6dff496-d95b-425f-85eb-2382da42e01e",
            "identifiers": [
              "q978728"
            ],
            "targetHandle": "quantumHandleInput04ea34479-6b0e-40b3-b675-5ecedf16a520"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false,
          true
        ],
        "description": "Applies inversion about the mean for amplitude amplification.",
        "icon": "PaletteIcon_GroverDiffuser.png",
        "identifiers": [
          "q978728"
        ],
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": {
          "0": "quantum register"
        }
      },
      "width": 320,
      "height": 250,
      "positionAbsolute": {
        "x": 300,
        "y": 300
      },
      "dragging": false
    },
    {
      "id": "260f3211-f591-4619-8107-d092c7e8ee35",
      "type": "statePreparationNode",
      "position": {
        "x": -525,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "outputs": [
          {
            "identifier": "",
            "size": "3"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Initializes qubits into a specific quantum state.",
        "icon": [
          "PaletteIcon_PrepareState.png",
          "PrepareState.png"
        ],
        "identifiers": [
          "q978728"
        ],
        "quantumStateName": "Uniform Superposition",
        "size": 3,
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ]
      },
      "width": 320,
      "height": 460,
      "positionAbsolute": {
        "x": -525,
        "y": 240
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "4ea34479-6b0e-40b3-b675-5ecedf16a520",
      "sourceHandle": "quantumHandlegrover-diffuserOutput04ea34479-6b0e-40b3-b675-5ecedf16a520",
      "target": "88108bfd-f27a-4ec6-8620-46cad86f3353",
      "targetHandle": "quantumHandleMeasurementInput088108bfd-f27a-4ec6-8620-46cad86f3353",
      "type": "quantumEdge",
      "id": "0d77ebd5-f037-48a2-9d28-18fab3ab6229",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "8034f88a-b405-463b-819a-98a6e6897d6d",
      "sourceHandle": "quantumHandleuniversal-oracleOutput08034f88a-b405-463b-819a-98a6e6897d6d",
      "target": "4ea34479-6b0e-40b3-b675-5ecedf16a520",
      "targetHandle": "quantumHandleInput04ea34479-6b0e-40b3-b675-5ecedf16a520",
      "type": "quantumEdge",
      "id": "d6dff496-d95b-425f-85eb-2382da42e01e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "260f3211-f591-4619-8107-d092c7e8ee35",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput0260f3211-f591-4619-8107-d092c7e8ee35",
      "target": "8034f88a-b405-463b-819a-98a6e6897d6d",
      "targetHandle": "quantumHandleInput08034f88a-b405-463b-819a-98a6e6897d6d",
      "type": "quantumEdge",
      "id": "2837c5f9-82d0-4dc1-8cd8-a7c2504210f3",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 362.75463514846047,
    "y": 92.38515406974189,
    "zoom": 0.5519139859578043
  }
}

export const grover_circuit_level = {
  "metadata": {
    "version": "1.0.0",
    "name": "Grover - Circuit-level",
    "description": "Implement Grover search on the circuit-level.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084687758",
    "timestamp": "2026-09-22T13:44:47.758Z"
  },
  "nodes": [
    {
      "id": "0a3ff8ab-96b8-4465-8560-21e1a3f110d3",
      "type": "gateNode",
      "position": {
        "x": -210,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q668926"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -210,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "9c4730c5-bd1e-45b2-8bfa-e1497abc1bb2",
      "type": "gateNode",
      "position": {
        "x": -210,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q284871"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -210,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "2b7e8f03-7ec7-48d3-9ce1-c546568ba172",
      "type": "gateNode",
      "position": {
        "x": -210,
        "y": 360
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -210,
        "y": 360
      },
      "dragging": false
    },
    {
      "id": "56e95cd8-214b-4faa-ac46-4a8174d5064d",
      "type": "gateNode",
      "position": {
        "x": 45,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "0a3ff8ab-96b8-4465-8560-21e1a3f110d3",
            "edgeId": "59821c54-bd2c-40fe-9f13-42b9986937b6",
            "identifiers": [
              "q668926"
            ],
            "targetHandle": "quantumHandleGateInput056e95cd8-214b-4faa-ac46-4a8174d5064d"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q668926"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 45,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "7c13b55c-f1db-4276-821f-8baa2dab74bb",
      "type": "gateNode",
      "position": {
        "x": 45,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "9c4730c5-bd1e-45b2-8bfa-e1497abc1bb2",
            "edgeId": "9c82930d-7371-4a69-842a-fcd79507bec7",
            "identifiers": [
              "q284871"
            ],
            "targetHandle": "quantumHandleGateInput07c13b55c-f1db-4276-821f-8baa2dab74bb"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q284871"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 45,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
      "type": "gateNode",
      "position": {
        "x": 45,
        "y": 360
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "2b7e8f03-7ec7-48d3-9ce1-c546568ba172",
            "edgeId": "84071655-12d5-4f5c-b55f-7118603207d6",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 45,
        "y": 360
      },
      "dragging": false
    },
    {
      "id": "ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
      "type": "gateNode",
      "position": {
        "x": 300,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "56e95cd8-214b-4faa-ac46-4a8174d5064d",
            "edgeId": "b75663a8-db97-4524-a7de-f6a723b114bd",
            "identifiers": [
              "q668926"
            ],
            "targetHandle": "quantumHandleGateInput0ef7a38f7-224f-4d54-b78c-9b7d4e4fee58"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q668926"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 300,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "5685d6a6-7af6-4e89-aeda-d6851d0af0d9",
      "type": "gateNode",
      "position": {
        "x": 300,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "7c13b55c-f1db-4276-821f-8baa2dab74bb",
            "edgeId": "14f672bc-1b87-43e5-a478-246c5041b413",
            "identifiers": [
              "q284871"
            ],
            "targetHandle": "quantumHandleGateInput05685d6a6-7af6-4e89-aeda-d6851d0af0d9"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q284871"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 300,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "334dbd13-0964-4820-ac3c-5954ebcdf90d",
      "type": "gateNode",
      "position": {
        "x": 300,
        "y": 360
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
            "edgeId": "ca6dc4db-ffbe-4226-9c4e-9b996f01848d",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0334dbd13-0964-4820-ac3c-5954ebcdf90d"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 300,
        "y": 360
      },
      "dragging": false
    },
    {
      "id": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "type": "mcmt-gate",
      "position": {
        "x": 495,
        "y": -15
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "MCMT Gate",
        "inputs": [
          {
            "id": "ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
            "edgeId": "dc103965-5aa8-4f25-bfbf-7d55d48d71db",
            "identifiers": [
              "q668926"
            ],
            "targetHandle": "quantumHandleInput075138862-3ab7-4a94-a018-0f3e30713d38"
          },
          {
            "id": "5685d6a6-7af6-4e89-aeda-d6851d0af0d9",
            "edgeId": "917d1ef3-202e-419e-9abc-ee3152297651",
            "identifiers": [
              "q284871"
            ],
            "targetHandle": "quantumHandleInput175138862-3ab7-4a94-a018-0f3e30713d38"
          },
          {
            "id": "334dbd13-0964-4820-ac3c-5954ebcdf90d",
            "edgeId": "d67eb545-b126-4454-9e5c-c0d46d75325a",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleInput275138862-3ab7-4a94-a018-0f3e30713d38"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false,
          true
        ],
        "description": "Multi-Controlled Multi-Target Gate. Applies a base gate to multiple targets using multiple controls.",
        "icon": "PaletteIcon_MCMT.png",
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "numControls": "2",
        "numTargets": "1",
        "parameter": 0,
        "baseGate": "z"
      },
      "width": 320,
      "height": 558,
      "positionAbsolute": {
        "x": 495,
        "y": -15
      },
      "dragging": false
    },
    {
      "id": "7753ba1a-b882-4bc0-bc27-583bde43c8f2",
      "type": "gateNode",
      "position": {
        "x": 900,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "75138862-3ab7-4a94-a018-0f3e30713d38",
            "edgeId": "a5e7d41b-238c-43bb-80be-e8b69583bfea",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput07753ba1a-b882-4bc0-bc27-583bde43c8f2"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 900,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "ec4e3c41-e102-4df7-80a2-c2eecba78144",
      "type": "gateNode",
      "position": {
        "x": 900,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "75138862-3ab7-4a94-a018-0f3e30713d38",
            "edgeId": "c16d88b3-5c01-45f7-88dc-730611627096",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0ec4e3c41-e102-4df7-80a2-c2eecba78144"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 900,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "3525a778-58ac-4ddf-8682-5f568e258c37",
      "type": "gateNode",
      "position": {
        "x": 900,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "75138862-3ab7-4a94-a018-0f3e30713d38",
            "edgeId": "7cd71e52-05d6-46fc-b663-4868d54bcf67",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput03525a778-58ac-4ddf-8682-5f568e258c37"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 900,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "6c6c8260-f546-451f-b40d-71e02c277503",
      "type": "gateNode",
      "position": {
        "x": 1095,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "7753ba1a-b882-4bc0-bc27-583bde43c8f2",
            "edgeId": "f7fb9191-c75e-462f-ad60-190ac888ff7f",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput06c6c8260-f546-451f-b40d-71e02c277503"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1095,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "9923943a-3845-4ba1-b472-b1883a8a8ce4",
      "type": "gateNode",
      "position": {
        "x": 1095,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "ec4e3c41-e102-4df7-80a2-c2eecba78144",
            "edgeId": "776ed9f0-7e42-41d0-884b-b7735da2268a",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput09923943a-3845-4ba1-b472-b1883a8a8ce4"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1095,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "1731f5bb-304f-41f5-93e4-e2abd40f7a6f",
      "type": "gateNode",
      "position": {
        "x": 1095,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "3525a778-58ac-4ddf-8682-5f568e258c37",
            "edgeId": "9a8734af-a137-4b15-964a-8e1dd84d7a12",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput01731f5bb-304f-41f5-93e4-e2abd40f7a6f"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1095,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "195834ff-e717-49d9-b75d-cfd78141ef99",
      "type": "gateNode",
      "position": {
        "x": 1275,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "6c6c8260-f546-451f-b40d-71e02c277503",
            "edgeId": "9aaf5231-7558-40fb-93e8-29a0927ac37d",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0195834ff-e717-49d9-b75d-cfd78141ef99"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1275,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "1a796c5e-f5b9-4bbc-979b-8073c39e02a4",
      "type": "gateNode",
      "position": {
        "x": 1275,
        "y": 210
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "9923943a-3845-4ba1-b472-b1883a8a8ce4",
            "edgeId": "13319faa-24c2-419a-a374-407f960ea784",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput01a796c5e-f5b9-4bbc-979b-8073c39e02a4"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1275,
        "y": 210
      },
      "dragging": false
    },
    {
      "id": "b0c30475-fbf1-4ce4-b083-c7b828068fee",
      "type": "gateNode",
      "position": {
        "x": 1275,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "1731f5bb-304f-41f5-93e4-e2abd40f7a6f",
            "edgeId": "3e9d60a8-6039-4056-b13f-ec4ccda2414e",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0b0c30475-fbf1-4ce4-b083-c7b828068fee"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1275,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "type": "mcmt-gate",
      "position": {
        "x": 1485,
        "y": 30
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "MCMT Gate",
        "inputs": [
          {
            "id": "195834ff-e717-49d9-b75d-cfd78141ef99",
            "edgeId": "52b6307e-a576-4eb8-9353-d9520a6fca1d",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleInput0cc8b568f-41df-4649-86b8-a4b075f389aa"
          },
          {
            "id": "1a796c5e-f5b9-4bbc-979b-8073c39e02a4",
            "edgeId": "c4325147-b2a1-4298-96a7-4cc0f6448d03",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleInput1cc8b568f-41df-4649-86b8-a4b075f389aa"
          },
          {
            "id": "b0c30475-fbf1-4ce4-b083-c7b828068fee",
            "edgeId": "80e788f5-2ec3-42d0-baf0-ab7382dfcc11",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleInput2cc8b568f-41df-4649-86b8-a4b075f389aa"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false,
          true
        ],
        "description": "Multi-Controlled Multi-Target Gate. Applies a base gate to multiple targets using multiple controls.",
        "icon": "PaletteIcon_MCMT.png",
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "numControls": "2",
        "parameter": 0,
        "baseGate": "z",
        "numTargets": "1"
      },
      "width": 320,
      "height": 558,
      "positionAbsolute": {
        "x": 1485,
        "y": 30
      },
      "dragging": false
    },
    {
      "id": "5261d7a1-6b2e-4af5-969f-16c7241a3f7c",
      "type": "gateNode",
      "position": {
        "x": 1890,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "cc8b568f-41df-4649-86b8-a4b075f389aa",
            "edgeId": "c8f01209-8cea-4c70-b5dd-c0b3eecd96eb",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput05261d7a1-6b2e-4af5-969f-16c7241a3f7c"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1890,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "f9db3b4a-cb9c-4701-8d76-8ca084409689",
      "type": "gateNode",
      "position": {
        "x": 1890,
        "y": 195
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "cc8b568f-41df-4649-86b8-a4b075f389aa",
            "edgeId": "0640ec3f-49cb-4263-8cb9-662739b6b2ff",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0f9db3b4a-cb9c-4701-8d76-8ca084409689"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1890,
        "y": 195
      },
      "dragging": false
    },
    {
      "id": "ea9df284-777e-4f41-9dae-d235d97b5429",
      "type": "gateNode",
      "position": {
        "x": 1890,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "cc8b568f-41df-4649-86b8-a4b075f389aa",
            "edgeId": "aa30f618-7697-4cd1-ab93-b30303e2996b",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0ea9df284-777e-4f41-9dae-d235d97b5429"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1890,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "bac03168-b84e-4418-b976-878e0790a541",
      "type": "gateNode",
      "position": {
        "x": 2115,
        "y": 45
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "5261d7a1-6b2e-4af5-969f-16c7241a3f7c",
            "edgeId": "017921bd-9aa1-4e62-b0e0-b1b1dc10b6a6",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput0bac03168-b84e-4418-b976-878e0790a541"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 2115,
        "y": 45
      },
      "dragging": false
    },
    {
      "id": "18c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
      "type": "gateNode",
      "position": {
        "x": 2115,
        "y": 195
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "f9db3b4a-cb9c-4701-8d76-8ca084409689",
            "edgeId": "ba07b005-c4db-4ed7-afb8-5d171051666a",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput018c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 2115,
        "y": 195
      },
      "dragging": false
    },
    {
      "id": "13b6a27f-4c90-45c9-bc02-c68a1b340df5",
      "type": "gateNode",
      "position": {
        "x": 2115,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "ea9df284-777e-4f41-9dae-d235d97b5429",
            "edgeId": "a8d62817-e3df-4c5b-9dd9-9963e4f280c1",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleGateInput013b6a27f-4c90-45c9-bc02-c68a1b340df5"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 2115,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "35ab1807-45d7-4b1d-aa93-486383748620",
      "type": "mergerNode",
      "position": {
        "x": 2310,
        "y": 120
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Merger",
        "inputs": [
          {
            "id": "bac03168-b84e-4418-b976-878e0790a541",
            "edgeId": "466f4754-bfdc-4f0e-befd-6d2ae90854e0",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleMergerInput035ab1807-45d7-4b1d-aa93-486383748620"
          },
          {
            "id": "18c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
            "edgeId": "a8504693-4dbc-437a-883e-0f92dd545b77",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleMergerInput135ab1807-45d7-4b1d-aa93-486383748620"
          },
          {
            "id": "13b6a27f-4c90-45c9-bc02-c68a1b340df5",
            "edgeId": "d2b80832-ae67-443d-9438-ea9b972539e9",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleMergerInput235ab1807-45d7-4b1d-aa93-486383748620"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Merges qubits.",
        "icon": "Merger_palette.png",
        "identifiers": [
          "q230627"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "numberInputs": 3
      },
      "width": 170,
      "height": 205,
      "positionAbsolute": {
        "x": 2310,
        "y": 120
      },
      "dragging": false
    },
    {
      "id": "2275096b-196a-4fe2-b473-ed91c72b6041",
      "type": "measurementNode",
      "position": {
        "x": 2580,
        "y": 45
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "35ab1807-45d7-4b1d-aa93-486383748620",
            "edgeId": "1fd74abf-c586-4e1c-91c3-aac22b5a326e",
            "identifiers": [
              "q230627"
            ],
            "targetHandle": "quantumHandleMeasurementInput02275096b-196a-4fe2-b473-ed91c72b6041"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q230627"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 2580,
        "y": 45
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "35ab1807-45d7-4b1d-aa93-486383748620",
      "sourceHandle": "quantumHandleMergerOutput035ab1807-45d7-4b1d-aa93-486383748620",
      "target": "2275096b-196a-4fe2-b473-ed91c72b6041",
      "targetHandle": "quantumHandleMeasurementInput02275096b-196a-4fe2-b473-ed91c72b6041",
      "type": "quantumEdge",
      "id": "1fd74abf-c586-4e1c-91c3-aac22b5a326e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "13b6a27f-4c90-45c9-bc02-c68a1b340df5",
      "sourceHandle": "quantumHandleGateOutput013b6a27f-4c90-45c9-bc02-c68a1b340df5",
      "target": "35ab1807-45d7-4b1d-aa93-486383748620",
      "targetHandle": "quantumHandleMergerInput235ab1807-45d7-4b1d-aa93-486383748620",
      "type": "quantumEdge",
      "id": "d2b80832-ae67-443d-9438-ea9b972539e9",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "18c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
      "sourceHandle": "quantumHandleGateOutput018c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
      "target": "35ab1807-45d7-4b1d-aa93-486383748620",
      "targetHandle": "quantumHandleMergerInput135ab1807-45d7-4b1d-aa93-486383748620",
      "type": "quantumEdge",
      "id": "a8504693-4dbc-437a-883e-0f92dd545b77",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "bac03168-b84e-4418-b976-878e0790a541",
      "sourceHandle": "quantumHandleGateOutput0bac03168-b84e-4418-b976-878e0790a541",
      "target": "35ab1807-45d7-4b1d-aa93-486383748620",
      "targetHandle": "quantumHandleMergerInput035ab1807-45d7-4b1d-aa93-486383748620",
      "type": "quantumEdge",
      "id": "466f4754-bfdc-4f0e-befd-6d2ae90854e0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ea9df284-777e-4f41-9dae-d235d97b5429",
      "sourceHandle": "quantumHandleGateOutput0ea9df284-777e-4f41-9dae-d235d97b5429",
      "target": "13b6a27f-4c90-45c9-bc02-c68a1b340df5",
      "targetHandle": "quantumHandleGateInput013b6a27f-4c90-45c9-bc02-c68a1b340df5",
      "type": "quantumEdge",
      "id": "a8d62817-e3df-4c5b-9dd9-9963e4f280c1",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "f9db3b4a-cb9c-4701-8d76-8ca084409689",
      "sourceHandle": "quantumHandleGateOutput0f9db3b4a-cb9c-4701-8d76-8ca084409689",
      "target": "18c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
      "targetHandle": "quantumHandleGateInput018c8f1dc-c9a5-42cd-bbd6-b87fce3cbaa7",
      "type": "quantumEdge",
      "id": "ba07b005-c4db-4ed7-afb8-5d171051666a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "5261d7a1-6b2e-4af5-969f-16c7241a3f7c",
      "sourceHandle": "quantumHandleGateOutput05261d7a1-6b2e-4af5-969f-16c7241a3f7c",
      "target": "bac03168-b84e-4418-b976-878e0790a541",
      "targetHandle": "quantumHandleGateInput0bac03168-b84e-4418-b976-878e0790a541",
      "type": "quantumEdge",
      "id": "017921bd-9aa1-4e62-b0e0-b1b1dc10b6a6",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "sourceHandle": "quantumHandleOutput2cc8b568f-41df-4649-86b8-a4b075f389aa",
      "target": "ea9df284-777e-4f41-9dae-d235d97b5429",
      "targetHandle": "quantumHandleGateInput0ea9df284-777e-4f41-9dae-d235d97b5429",
      "type": "quantumEdge",
      "id": "aa30f618-7697-4cd1-ab93-b30303e2996b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "sourceHandle": "quantumHandleOutput1cc8b568f-41df-4649-86b8-a4b075f389aa",
      "target": "f9db3b4a-cb9c-4701-8d76-8ca084409689",
      "targetHandle": "quantumHandleGateInput0f9db3b4a-cb9c-4701-8d76-8ca084409689",
      "type": "quantumEdge",
      "id": "0640ec3f-49cb-4263-8cb9-662739b6b2ff",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "sourceHandle": "quantumHandleOutput0cc8b568f-41df-4649-86b8-a4b075f389aa",
      "target": "5261d7a1-6b2e-4af5-969f-16c7241a3f7c",
      "targetHandle": "quantumHandleGateInput05261d7a1-6b2e-4af5-969f-16c7241a3f7c",
      "type": "quantumEdge",
      "id": "c8f01209-8cea-4c70-b5dd-c0b3eecd96eb",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b0c30475-fbf1-4ce4-b083-c7b828068fee",
      "sourceHandle": "quantumHandleGateOutput0b0c30475-fbf1-4ce4-b083-c7b828068fee",
      "target": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "targetHandle": "quantumHandleInput2cc8b568f-41df-4649-86b8-a4b075f389aa",
      "type": "quantumEdge",
      "id": "80e788f5-2ec3-42d0-baf0-ab7382dfcc11",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1a796c5e-f5b9-4bbc-979b-8073c39e02a4",
      "sourceHandle": "quantumHandleGateOutput01a796c5e-f5b9-4bbc-979b-8073c39e02a4",
      "target": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "targetHandle": "quantumHandleInput1cc8b568f-41df-4649-86b8-a4b075f389aa",
      "type": "quantumEdge",
      "id": "c4325147-b2a1-4298-96a7-4cc0f6448d03",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "195834ff-e717-49d9-b75d-cfd78141ef99",
      "sourceHandle": "quantumHandleGateOutput0195834ff-e717-49d9-b75d-cfd78141ef99",
      "target": "cc8b568f-41df-4649-86b8-a4b075f389aa",
      "targetHandle": "quantumHandleInput0cc8b568f-41df-4649-86b8-a4b075f389aa",
      "type": "quantumEdge",
      "id": "52b6307e-a576-4eb8-9353-d9520a6fca1d",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1731f5bb-304f-41f5-93e4-e2abd40f7a6f",
      "sourceHandle": "quantumHandleGateOutput01731f5bb-304f-41f5-93e4-e2abd40f7a6f",
      "target": "b0c30475-fbf1-4ce4-b083-c7b828068fee",
      "targetHandle": "quantumHandleGateInput0b0c30475-fbf1-4ce4-b083-c7b828068fee",
      "type": "quantumEdge",
      "id": "3e9d60a8-6039-4056-b13f-ec4ccda2414e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "9923943a-3845-4ba1-b472-b1883a8a8ce4",
      "sourceHandle": "quantumHandleGateOutput09923943a-3845-4ba1-b472-b1883a8a8ce4",
      "target": "1a796c5e-f5b9-4bbc-979b-8073c39e02a4",
      "targetHandle": "quantumHandleGateInput01a796c5e-f5b9-4bbc-979b-8073c39e02a4",
      "type": "quantumEdge",
      "id": "13319faa-24c2-419a-a374-407f960ea784",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "6c6c8260-f546-451f-b40d-71e02c277503",
      "sourceHandle": "quantumHandleGateOutput06c6c8260-f546-451f-b40d-71e02c277503",
      "target": "195834ff-e717-49d9-b75d-cfd78141ef99",
      "targetHandle": "quantumHandleGateInput0195834ff-e717-49d9-b75d-cfd78141ef99",
      "type": "quantumEdge",
      "id": "9aaf5231-7558-40fb-93e8-29a0927ac37d",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "3525a778-58ac-4ddf-8682-5f568e258c37",
      "sourceHandle": "quantumHandleGateOutput03525a778-58ac-4ddf-8682-5f568e258c37",
      "target": "1731f5bb-304f-41f5-93e4-e2abd40f7a6f",
      "targetHandle": "quantumHandleGateInput01731f5bb-304f-41f5-93e4-e2abd40f7a6f",
      "type": "quantumEdge",
      "id": "9a8734af-a137-4b15-964a-8e1dd84d7a12",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ec4e3c41-e102-4df7-80a2-c2eecba78144",
      "sourceHandle": "quantumHandleGateOutput0ec4e3c41-e102-4df7-80a2-c2eecba78144",
      "target": "9923943a-3845-4ba1-b472-b1883a8a8ce4",
      "targetHandle": "quantumHandleGateInput09923943a-3845-4ba1-b472-b1883a8a8ce4",
      "type": "quantumEdge",
      "id": "776ed9f0-7e42-41d0-884b-b7735da2268a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7753ba1a-b882-4bc0-bc27-583bde43c8f2",
      "sourceHandle": "quantumHandleGateOutput07753ba1a-b882-4bc0-bc27-583bde43c8f2",
      "target": "6c6c8260-f546-451f-b40d-71e02c277503",
      "targetHandle": "quantumHandleGateInput06c6c8260-f546-451f-b40d-71e02c277503",
      "type": "quantumEdge",
      "id": "f7fb9191-c75e-462f-ad60-190ac888ff7f",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "sourceHandle": "quantumHandleOutput275138862-3ab7-4a94-a018-0f3e30713d38",
      "target": "3525a778-58ac-4ddf-8682-5f568e258c37",
      "targetHandle": "quantumHandleGateInput03525a778-58ac-4ddf-8682-5f568e258c37",
      "type": "quantumEdge",
      "id": "7cd71e52-05d6-46fc-b663-4868d54bcf67",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "sourceHandle": "quantumHandleOutput175138862-3ab7-4a94-a018-0f3e30713d38",
      "target": "ec4e3c41-e102-4df7-80a2-c2eecba78144",
      "targetHandle": "quantumHandleGateInput0ec4e3c41-e102-4df7-80a2-c2eecba78144",
      "type": "quantumEdge",
      "id": "c16d88b3-5c01-45f7-88dc-730611627096",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "sourceHandle": "quantumHandleOutput075138862-3ab7-4a94-a018-0f3e30713d38",
      "target": "7753ba1a-b882-4bc0-bc27-583bde43c8f2",
      "targetHandle": "quantumHandleGateInput07753ba1a-b882-4bc0-bc27-583bde43c8f2",
      "type": "quantumEdge",
      "id": "a5e7d41b-238c-43bb-80be-e8b69583bfea",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "334dbd13-0964-4820-ac3c-5954ebcdf90d",
      "sourceHandle": "quantumHandleGateOutput0334dbd13-0964-4820-ac3c-5954ebcdf90d",
      "target": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "targetHandle": "quantumHandleInput275138862-3ab7-4a94-a018-0f3e30713d38",
      "type": "quantumEdge",
      "id": "d67eb545-b126-4454-9e5c-c0d46d75325a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "5685d6a6-7af6-4e89-aeda-d6851d0af0d9",
      "sourceHandle": "quantumHandleGateOutput05685d6a6-7af6-4e89-aeda-d6851d0af0d9",
      "target": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "targetHandle": "quantumHandleInput175138862-3ab7-4a94-a018-0f3e30713d38",
      "type": "quantumEdge",
      "id": "917d1ef3-202e-419e-9abc-ee3152297651",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
      "sourceHandle": "quantumHandleGateOutput0ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
      "target": "75138862-3ab7-4a94-a018-0f3e30713d38",
      "targetHandle": "quantumHandleInput075138862-3ab7-4a94-a018-0f3e30713d38",
      "type": "quantumEdge",
      "id": "dc103965-5aa8-4f25-bfbf-7d55d48d71db",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
      "sourceHandle": "quantumHandleGateOutput0da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
      "target": "334dbd13-0964-4820-ac3c-5954ebcdf90d",
      "targetHandle": "quantumHandleGateInput0334dbd13-0964-4820-ac3c-5954ebcdf90d",
      "type": "quantumEdge",
      "id": "ca6dc4db-ffbe-4226-9c4e-9b996f01848d",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7c13b55c-f1db-4276-821f-8baa2dab74bb",
      "sourceHandle": "quantumHandleGateOutput07c13b55c-f1db-4276-821f-8baa2dab74bb",
      "target": "5685d6a6-7af6-4e89-aeda-d6851d0af0d9",
      "targetHandle": "quantumHandleGateInput05685d6a6-7af6-4e89-aeda-d6851d0af0d9",
      "type": "quantumEdge",
      "id": "14f672bc-1b87-43e5-a478-246c5041b413",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "56e95cd8-214b-4faa-ac46-4a8174d5064d",
      "sourceHandle": "quantumHandleGateOutput056e95cd8-214b-4faa-ac46-4a8174d5064d",
      "target": "ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
      "targetHandle": "quantumHandleGateInput0ef7a38f7-224f-4d54-b78c-9b7d4e4fee58",
      "type": "quantumEdge",
      "id": "b75663a8-db97-4524-a7de-f6a723b114bd",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "2b7e8f03-7ec7-48d3-9ce1-c546568ba172",
      "sourceHandle": "quantumHandleGateOutput02b7e8f03-7ec7-48d3-9ce1-c546568ba172",
      "target": "da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
      "targetHandle": "quantumHandleGateInput0da8b0765-b5a3-4aaf-ab6e-e1b9d974bf2f",
      "type": "quantumEdge",
      "id": "84071655-12d5-4f5c-b55f-7118603207d6",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "9c4730c5-bd1e-45b2-8bfa-e1497abc1bb2",
      "sourceHandle": "quantumHandleGateOutput09c4730c5-bd1e-45b2-8bfa-e1497abc1bb2",
      "target": "7c13b55c-f1db-4276-821f-8baa2dab74bb",
      "targetHandle": "quantumHandleGateInput07c13b55c-f1db-4276-821f-8baa2dab74bb",
      "type": "quantumEdge",
      "id": "9c82930d-7371-4a69-842a-fcd79507bec7",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "0a3ff8ab-96b8-4465-8560-21e1a3f110d3",
      "sourceHandle": "quantumHandleGateOutput00a3ff8ab-96b8-4465-8560-21e1a3f110d3",
      "target": "56e95cd8-214b-4faa-ac46-4a8174d5064d",
      "targetHandle": "quantumHandleGateInput056e95cd8-214b-4faa-ac46-4a8174d5064d",
      "type": "quantumEdge",
      "id": "59821c54-bd2c-40fe-9f13-42b9986937b6",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": -175.5,
    "y": 286.75,
    "zoom": 0.5
  }
}

export const grover_algorithm = {
  "metadata": {
    "version": "1.0.0",
    "name": "Grover-Compact",
    "description": "Build Grover search using the compact high-level Grover algorithm block.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084870036",
    "timestamp": "2026-09-22T13:47:50.036Z"
  },
  "nodes": [
    {
      "id": "9366c50d-650a-49ab-afb8-db1871569275",
      "type": "grover",
      "position": {
        "x": 150,
        "y": 255
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Grover's Search Algorithm",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false,
          true
        ],
        "description": "Complete Grover search with integrated Oracle and Diffuser.",
        "icon": "PaletteIcon_GroverAlg.png",
        "identifiers": [
          "q966591"
        ],
        "inputTypes": [],
        "outputTypes": {
          "0": "quantum register"
        },
        "numQubits": 8,
        "targetStates": "1"
      },
      "width": 320,
      "height": 420,
      "dragging": false,
      "positionAbsolute": {
        "x": 150,
        "y": 255
      }
    },
    {
      "id": "88108bfd-f27a-4ec6-8620-46cad86f3353",
      "type": "measurementNode",
      "position": {
        "x": 615,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "9366c50d-650a-49ab-afb8-db1871569275",
            "edgeId": "1ef65b05-c280-4da4-bcf8-fe46bf8a929f",
            "identifiers": [
              "q966591"
            ],
            "targetHandle": "quantumHandleMeasurementInput088108bfd-f27a-4ec6-8620-46cad86f3353"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q966591"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 615,
        "y": 255
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "9366c50d-650a-49ab-afb8-db1871569275",
      "sourceHandle": "quantumHandlegroverOutput09366c50d-650a-49ab-afb8-db1871569275",
      "target": "88108bfd-f27a-4ec6-8620-46cad86f3353",
      "targetHandle": "quantumHandleMeasurementInput088108bfd-f27a-4ec6-8620-46cad86f3353",
      "type": "quantumEdge",
      "id": "1ef65b05-c280-4da4-bcf8-fe46bf8a929f",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": -68.5,
    "y": -84,
    "zoom": 1
  }
}


export const hadamard_test_imaginary_part = {
  "metadata": {
    "version": "1.0.0",
    "name": "Hadamard Test Imaginary Part",
    "description": "The Hadamard Test can be used to determine the imaginary part of the expectation value of a unitary operator. In this version, the circuit starts with a single ancilla qubit initialized to zero. A Hadamard gate is first applied to put the ancilla into an equal superposition. Next, a controlled unitary operation is applied, with the ancilla as the control qubit—for example, a controlled-CNOT. After the controlled operation, an S-dagger (S†) gate is applied to the ancilla, followed by another Hadamard gate. Finally, the ancilla is measured. The measurement outcome of the ancilla now encodes the imaginary part of the expectation value of the unitary operator.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085029626",
    "timestamp": "2026-09-22T13:50:29.626Z"
  },
  "nodes": [
    {
      "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "type": "gateNode",
      "position": {
        "x": 0,
        "y": 150
      },
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 0,
        "y": 150
      },
      "dragging": true
    },
    {
      "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "gateNode",
      "position": {
        "x": 210,
        "y": 150
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
            "edgeId": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 210,
        "y": 150
      },
      "dragging": true
    },
    {
      "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "gateNode",
      "position": {
        "x": 885,
        "y": 165
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "aa4014f8-b448-439b-ba4f-cd72487a6ef6",
            "edgeId": "d96f9594-ebef-4f48-b3a0-abdc195aaaab",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 885,
        "y": 165
      },
      "dragging": true
    },
    {
      "id": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "measurementNode",
      "position": {
        "x": 1155,
        "y": 180
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
            "edgeId": "24246544-6c73-4fc5-8ed7-63c6206c011b",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1155,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "4b231576-09cd-480c-9266-0ee9f9704882",
      "type": "statePreparationNode",
      "position": {
        "x": -75,
        "y": 405
      },
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q601363"
        ],
        "quantumStateName": "Custom State",
        "size": "",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ],
        "outputs": [
          {
            "identifier": "",
            "size": ""
          }
        ]
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": -75,
        "y": 405
      },
      "dragging": true
    },
    {
      "id": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "gateNode",
      "position": {
        "x": 525,
        "y": 495
      },
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "4b231576-09cd-480c-9266-0ee9f9704882",
            "edgeId": "ed61bc1c-2439-475b-a856-c651e48e48f3",
            "identifiers": [
              "q601363"
            ],
            "targetHandle": "quantumHandleGateInput15341534f-ecc9-4a60-b404-947f2e466b25",
            "outputIdentifier": ""
          },
          {
            "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
            "edgeId": "7395d028-439f-42c2-ab24-c7f862fe2e4a",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput05341534f-ecc9-4a60-b404-947f2e466b25"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any",
          "quantum register"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 525,
        "y": 495
      },
      "dragging": true
    },
    {
      "id": "aa4014f8-b448-439b-ba4f-cd72487a6ef6",
      "type": "gateNode",
      "position": {
        "x": 705,
        "y": 165
      },
      "data": {
        "label": "SDG",
        "inputs": [
          {
            "id": "5341534f-ecc9-4a60-b404-947f2e466b25",
            "edgeId": "c0f401e8-aa00-4cf6-afaa-8ec5115b9be0",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0aa4014f8-b448-439b-ba4f-cd72487a6ef6"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 705,
        "y": 165
      },
      "dragging": true
    }
  ],
  "edges": [
    {
      "source": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "sourceHandle": "quantumHandleGateOutput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "target": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "targetHandle": "quantumHandleGateInput05341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "quantumEdge",
      "id": "7395d028-439f-42c2-ab24-c7f862fe2e4a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "sourceHandle": "quantumHandleGateOutput05341534f-ecc9-4a60-b404-947f2e466b25",
      "target": "aa4014f8-b448-439b-ba4f-cd72487a6ef6",
      "targetHandle": "quantumHandleGateInput0aa4014f8-b448-439b-ba4f-cd72487a6ef6",
      "type": "quantumEdge",
      "id": "c0f401e8-aa00-4cf6-afaa-8ec5115b9be0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "aa4014f8-b448-439b-ba4f-cd72487a6ef6",
      "sourceHandle": "quantumHandleGateOutput0aa4014f8-b448-439b-ba4f-cd72487a6ef6",
      "target": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "quantumEdge",
      "id": "d96f9594-ebef-4f48-b3a0-abdc195aaaab",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "4b231576-09cd-480c-9266-0ee9f9704882",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput04b231576-09cd-480c-9266-0ee9f9704882",
      "target": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "targetHandle": "quantumHandleGateInput15341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "quantumEdge",
      "id": "9b63fb3d-cedf-4f08-992f-3907c811d473",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "sourceHandle": "quantumHandleGateOutput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "target": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "quantumEdge",
      "id": "24246544-6c73-4fc5-8ed7-63c6206c011b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "sourceHandle": "quantumHandleGateOutput0717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "target": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "quantumEdge",
      "id": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}

export const hadamard_test_real_part = {
  "metadata": {
    "version": "1.0.0",
    "name": "Hadamard Test Real Part",
    "description": "The Hadamard Test is a quantum algorithm used to determine the real part (or, using a different variant, the imaginary part) of the expectation value of a unitary operator. The circuit begins with a single ancilla qubit, initialized to zero. A Hadamard gate is applied to the ancilla to create an equal superposition of zero and one. Then a controlled unitary operation is applied, with the ancilla as the control qubit—here, a CNOT gate can be used as an example. After this, another Hadamard gate is applied to the ancilla, which is then measured. The depicted version of the circuit gives the real part of the expectation value; if you want to determine the imaginary part, you need to use the other template with a slightly different arrangement.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085012377",
    "timestamp": "2026-09-22T13:50:12.377Z"
  },
  "nodes": [
    {
      "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "type": "gateNode",
      "position": {
        "x": 90,
        "y": 165
      },
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 90,
        "y": 165
      }
    },
    {
      "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "gateNode",
      "position": {
        "x": 330,
        "y": 165
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
            "edgeId": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 330,
        "y": 165
      },
      "dragging": true
    },
    {
      "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "gateNode",
      "position": {
        "x": 795,
        "y": 165
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "5341534f-ecc9-4a60-b404-947f2e466b25",
            "edgeId": "71247cc6-cdb5-404c-aa95-dfad6e940761",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 795,
        "y": 165
      }
    },
    {
      "id": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "measurementNode",
      "position": {
        "x": 1155,
        "y": 180
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
            "edgeId": "24246544-6c73-4fc5-8ed7-63c6206c011b",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1155,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "4b231576-09cd-480c-9266-0ee9f9704882",
      "type": "statePreparationNode",
      "position": {
        "x": -75,
        "y": 405
      },
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q601363"
        ],
        "quantumStateName": "Custom State",
        "size": "",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ],
        "outputs": [
          {
            "identifier": "",
            "size": ""
          }
        ]
      },
      "width": 320,
      "height": 460,
      "positionAbsolute": {
        "x": -75,
        "y": 405
      },
      "dragging": true
    },
    {
      "id": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "gateNode",
      "position": {
        "x": 585,
        "y": 495
      },
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
            "edgeId": "00e56d80-753a-48c1-b339-57ffff700bfd",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput05341534f-ecc9-4a60-b404-947f2e466b25"
          },
          {
            "id": "4b231576-09cd-480c-9266-0ee9f9704882",
            "edgeId": "ed61bc1c-2439-475b-a856-c651e48e48f3",
            "identifiers": [
              "q601363"
            ],
            "targetHandle": "quantumHandleGateInput15341534f-ecc9-4a60-b404-947f2e466b25",
            "outputIdentifier": ""
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any",
          "quantum register"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 220,
      "positionAbsolute": {
        "x": 585,
        "y": 495
      },
      "dragging": true
    }
  ],
  "edges": [
    {
      "source": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "sourceHandle": "quantumHandleGateOutput05341534f-ecc9-4a60-b404-947f2e466b25",
      "target": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "quantumEdge",
      "id": "a3b83169-ca3c-4d17-b2d3-e2834c3b5e11",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "sourceHandle": "quantumHandleGateOutput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "target": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "targetHandle": "quantumHandleGateInput05341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "quantumEdge",
      "id": "aef163d1-146f-4c58-b1df-595464bec3f3",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "4b231576-09cd-480c-9266-0ee9f9704882",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput04b231576-09cd-480c-9266-0ee9f9704882",
      "target": "5341534f-ecc9-4a60-b404-947f2e466b25",
      "targetHandle": "quantumHandleGateInput15341534f-ecc9-4a60-b404-947f2e466b25",
      "type": "quantumEdge",
      "id": "9b63fb3d-cedf-4f08-992f-3907c811d473",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "sourceHandle": "quantumHandleGateOutput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "target": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "quantumEdge",
      "id": "24246544-6c73-4fc5-8ed7-63c6206c011b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "sourceHandle": "quantumHandleGateOutput0717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "target": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "quantumEdge",
      "id": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 91.39624797499266,
    "y": 84.19933170223635,
    "zoom": 0.6306789466120469
  }
}

export const qaoa = {
  "metadata": {
    "version": "1.0.0",
    "name": "QAOA",
    "description": "Ready-to-use QAOA model combining a parameterized quantum circuit with classical optimization.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085091730",
    "timestamp": "2026-09-22T13:51:31.730Z"
  },
  "nodes": [
    {
      "id": "b4f63e67-7ce3-406b-80f4-3294cec75b14",
      "type": "dataTypeNode",
      "position": {
        "x": 0,
        "y": 20
      },
      "data": {
        "label": "Array",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "array0"
        ],
        "inputTypes": [],
        "outputTypes": {
          "0": "Array"
        },
        "dataType": "Array",
        "value": "[[0,1],[0,2],[1,2]]",
        "outputIdentifier": "",
        "numberQuantumInputs": 0,
        "numberQuantumOutputs": 0,
        "numberClassicalInputs": 0,
        "numberClassicalOutputs": 1
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 0,
        "y": 20
      }
    },
    {
      "id": "f1b65b4e-b859-4894-83c7-e95023852979",
      "type": "dataTypeNode",
      "position": {
        "x": 0,
        "y": 330
      },
      "data": {
        "label": "Array",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "array1"
        ],
        "inputTypes": [],
        "outputTypes": {
          "0": "Array"
        },
        "dataType": "Array",
        "value": "0.5",
        "outputIdentifier": "",
        "numberQuantumInputs": 0,
        "numberQuantumOutputs": 0,
        "numberClassicalInputs": 0,
        "numberClassicalOutputs": 1
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 0,
        "y": 330
      }
    },
    {
      "id": "d309349f-24e8-47d3-91fc-4c8ed8836f90",
      "type": "dataTypeNode",
      "position": {
        "x": 0,
        "y": 640
      },
      "data": {
        "label": "Array",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "array2"
        ],
        "inputTypes": [],
        "outputTypes": {
          "0": "Array"
        },
        "dataType": "Array",
        "value": "0.5",
        "outputIdentifier": "",
        "numberQuantumInputs": 0,
        "numberQuantumOutputs": 0,
        "numberClassicalInputs": 0,
        "numberClassicalOutputs": 1
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 0,
        "y": 640
      }
    },
    {
      "id": "792b9f69-1f91-443b-aba3-bba546fdd501",
      "type": "qaoa",
      "position": {
        "x": 570,
        "y": 150
      },
      "data": {
        "label": "QAOA Ansatz",
        "inputs": [
          {
            "id": "b4f63e67-7ce3-406b-80f4-3294cec75b14",
            "edgeId": "bd6b354f-f802-4169-bf05-ebf5385bd9bf",
            "identifiers": [
              "array0"
            ],
            "targetHandle": "classicalHandleQAOAInput0792b9f69-1f91-443b-aba3-bba546fdd501"
          },
          {
            "id": "f1b65b4e-b859-4894-83c7-e95023852979",
            "edgeId": "511065a7-d22c-419e-af96-2874fa498b9c",
            "identifiers": [
              "array1"
            ],
            "targetHandle": "classicalHandleQAOAInput1792b9f69-1f91-443b-aba3-bba546fdd501"
          },
          {
            "id": "d309349f-24e8-47d3-91fc-4c8ed8836f90",
            "edgeId": "0ed31fad-07b5-49e8-8338-059fca1e1cfc",
            "identifiers": [
              "array2"
            ],
            "targetHandle": "classicalHandleQAOAInput2792b9f69-1f91-443b-aba3-bba546fdd501"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "identifiers": [
          "qaoa0"
        ],
        "inputTypes": [
          "array",
          "array",
          "array"
        ],
        "outputTypes": {
          "0": "quantum register"
        },
        "problem": "MaxCut",
        "p": null,
        "gamma": "0.5",
        "beta": "0.5",
        "outputIdentifier": "",
        "outputs": [
          {
            "identifier": "",
            "size": "",
            "type": "quantum"
          }
        ],
        "numberQuantumInputs": 0,
        "numberQuantumOutputs": 1,
        "numberClassicalInputs": 3,
        "numberClassicalOutputs": 0
      },
      "width": 320,
      "height": 550,
      "positionAbsolute": {
        "x": 570,
        "y": 150
      },
      "selected": true,
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "b4f63e67-7ce3-406b-80f4-3294cec75b14",
      "sourceHandle": "classicalHandleDataTypeOutput0b4f63e67-7ce3-406b-80f4-3294cec75b14",
      "target": "792b9f69-1f91-443b-aba3-bba546fdd501",
      "targetHandle": "classicalHandleQAOAInput0792b9f69-1f91-443b-aba3-bba546fdd501",
      "type": "classicalEdge",
      "id": "bd6b354f-f802-4169-bf05-ebf5385bd9bf",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      },
      "hidden": false
    },
    {
      "source": "f1b65b4e-b859-4894-83c7-e95023852979",
      "sourceHandle": "classicalHandleDataTypeOutput0f1b65b4e-b859-4894-83c7-e95023852979",
      "target": "792b9f69-1f91-443b-aba3-bba546fdd501",
      "targetHandle": "classicalHandleQAOAInput1792b9f69-1f91-443b-aba3-bba546fdd501",
      "type": "classicalEdge",
      "id": "511065a7-d22c-419e-af96-2874fa498b9c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      },
      "hidden": false
    },
    {
      "source": "d309349f-24e8-47d3-91fc-4c8ed8836f90",
      "sourceHandle": "classicalHandleDataTypeOutput0d309349f-24e8-47d3-91fc-4c8ed8836f90",
      "target": "792b9f69-1f91-443b-aba3-bba546fdd501",
      "targetHandle": "classicalHandleQAOAInput2792b9f69-1f91-443b-aba3-bba546fdd501",
      "type": "classicalEdge",
      "id": "0ed31fad-07b5-49e8-8338-059fca1e1cfc",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      },
      "hidden": false
    }
  ],
  "viewport": {
    "x": 141.65154226253043,
    "y": 221.61852455050973,
    "zoom": 0.622437117691085
  }
}

export const quantum_fourier_transform = {
  "metadata": {
    "version": "1.0.0",
    "name": "Quantum Fourier Transform",
    "description": "Build a circuit using the Quantum Fourier Transform.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790084950027",
    "timestamp": "2026-09-22T13:49:10.027Z"
  },
  "nodes": [
    {
      "id": "260f3211-f591-4619-8107-d092c7e8ee35",
      "type": "statePreparationNode",
      "position": {
        "x": -525,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "outputs": [
          {
            "identifier": "",
            "size": "3"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Initializes qubits into a specific quantum state.",
        "icon": [
          "PaletteIcon_PrepareState.png",
          "PrepareState.png"
        ],
        "identifiers": [
          "q978728"
        ],
        "quantumStateName": "Uniform Superposition",
        "size": 3,
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ]
      },
      "width": 320,
      "height": 460,
      "positionAbsolute": {
        "x": -525,
        "y": 240
      },
      "dragging": false
    },
    {
      "id": "c9a66677-f3ce-47b4-833b-afa008d4bf68",
      "type": "measurementNode",
      "position": {
        "x": 1620,
        "y": 225
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "1b65c63b-6b1f-49f7-b25c-17709420d303",
            "edgeId": "047b9dc0-053b-47a5-943e-e039fdc0cb66",
            "identifiers": [
              "q999533"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c9a66677-f3ce-47b4-833b-afa008d4bf68"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q999533"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1620,
        "y": 225
      },
      "dragging": false
    },
    {
      "id": "c020d13e-a097-4eba-8cad-be76aabdae31",
      "type": "gateNode",
      "position": {
        "x": 1080,
        "y": 300
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q505320"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 1080,
        "y": 300
      },
      "dragging": false
    },
    {
      "id": "1b65c63b-6b1f-49f7-b25c-17709420d303",
      "type": "qftNode",
      "position": {
        "x": 1290,
        "y": 285
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "QFT",
        "inputs": [
          {
            "id": "c020d13e-a097-4eba-8cad-be76aabdae31",
            "edgeId": "4b0aca4e-cd4b-4424-a1b7-c3d629eedc38",
            "identifiers": [
              "q505320"
            ],
            "targetHandle": "quantumHandleQFTInput01b65c63b-6b1f-49f7-b25c-17709420d303"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Quantum Fourier Transform.",
        "icon": [
          "QFT_palette.png"
        ],
        "identifiers": [
          "q505320"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "numberOutputs": "1",
        "inverse": "false"
      },
      "width": 170,
      "height": 125,
      "positionAbsolute": {
        "x": 1290,
        "y": 285
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "c020d13e-a097-4eba-8cad-be76aabdae31",
      "sourceHandle": "quantumHandleGateOutput0c020d13e-a097-4eba-8cad-be76aabdae31",
      "target": "1b65c63b-6b1f-49f7-b25c-17709420d303",
      "targetHandle": "quantumHandleQFTInput01b65c63b-6b1f-49f7-b25c-17709420d303",
      "type": "quantumEdge",
      "id": "4b0aca4e-cd4b-4424-a1b7-c3d629eedc38",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1b65c63b-6b1f-49f7-b25c-17709420d303",
      "sourceHandle": "quantumHandleQFTOutput01b65c63b-6b1f-49f7-b25c-17709420d303",
      "target": "c9a66677-f3ce-47b4-833b-afa008d4bf68",
      "targetHandle": "quantumHandleMeasurementInput0c9a66677-f3ce-47b4-833b-afa008d4bf68",
      "type": "quantumEdge",
      "id": "047b9dc0-053b-47a5-943e-e039fdc0cb66",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": -668.1902670089896,
    "y": 45.54912406043002,
    "zoom": 0.7081941644204947
  }
}

export const swap_test = {
  "metadata": {
    "version": "1.0.0",
    "name": "SWAP Test",
    "description": "The SWAP Test is a quantum algorithm used to determine how similar two quantum states are. It begins by introducing a single ancilla qubit, which is initialized to zero. A Hadamard gate is applied to this ancilla, putting it into a superposition of zero and one. Next, a sequence of controlled-SWAP operations is applied between the two states, using the ancilla as the control qubit. Each controlled-SWAP exchanges the corresponding qubits of the two states only if the ancilla qubit is in the one state. After all controlled-SWAPs are applied, another Hadamard gate is applied to the ancilla qubit, and it is then measured. If the states are identical, the measurement of the ancilla bit results in 0 with probability 1.\nIn contrast, if the states are orthogonal, the measurement results in 0 or 1 with an equal probability of 0.5.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085056181",
    "timestamp": "2026-09-22T13:50:56.181Z"
  },
  "nodes": [
    {
      "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "type": "gateNode",
      "position": {
        "x": 90,
        "y": 165
      },
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 90,
        "y": 165
      }
    },
    {
      "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "gateNode",
      "position": {
        "x": 330,
        "y": 165
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
            "edgeId": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 330,
        "y": 165
      },
      "dragging": true
    },
    {
      "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "gateNode",
      "position": {
        "x": 795,
        "y": 165
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
            "edgeId": "b9a325a5-f094-4656-9ab9-7c68fc5add8b",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 795,
        "y": 165
      }
    },
    {
      "id": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "measurementNode",
      "position": {
        "x": 1155,
        "y": 180
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "b51187a0-8799-46c1-9814-cfa9355e8684",
            "edgeId": "24246544-6c73-4fc5-8ed7-63c6206c011b",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q444511"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1155,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "4b231576-09cd-480c-9266-0ee9f9704882",
      "type": "statePreparationNode",
      "position": {
        "x": -75,
        "y": 405
      },
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q601363"
        ],
        "quantumStateName": "Custom State",
        "size": "",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ],
        "outputs": [
          {
            "identifier": "",
            "size": ""
          }
        ]
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": -75,
        "y": 405
      },
      "dragging": true
    },
    {
      "id": "38cb5ff9-1a88-450f-842b-80f778c128d6",
      "type": "statePreparationNode",
      "position": {
        "x": -75,
        "y": 825
      },
      "data": {
        "label": "Prepare State",
        "inputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q101698"
        ],
        "quantumStateName": "Custom State",
        "size": "",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "quantum register"
        ],
        "outputs": [
          {
            "identifier": "",
            "size": ""
          }
        ]
      },
      "width": 320,
      "height": 460,
      "positionAbsolute": {
        "x": -75,
        "y": 825
      },
      "dragging": true
    },
    {
      "id": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "type": "gateNode",
      "position": {
        "x": 600,
        "y": 540
      },
      "data": {
        "label": "CSWAP",
        "inputs": [
          {
            "id": "c36c6862-66f1-4494-add1-55b8e1d403a6",
            "edgeId": "2f997def-e014-45ac-a39c-4c338e52449b",
            "identifiers": [
              "q444511"
            ],
            "targetHandle": "quantumHandleGateInput0ccd21611-18e5-4e51-a5bb-ab3dcf07541c"
          },
          {
            "id": "4b231576-09cd-480c-9266-0ee9f9704882",
            "edgeId": "8c0e902a-e423-45ac-8bac-eeff15c0f1fd",
            "identifiers": [
              "q601363"
            ],
            "targetHandle": "quantumHandleGateInput1ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
            "outputIdentifier": ""
          },
          {
            "id": "38cb5ff9-1a88-450f-842b-80f778c128d6",
            "edgeId": "5da12b13-9728-4234-bc94-1eb85fbcbbe2",
            "identifiers": [
              "q101698"
            ],
            "targetHandle": "quantumHandleGateInput2ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
            "outputIdentifier": ""
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q101698"
        ],
        "inputTypes": [
          "any",
          "quantum register",
          "quantum register"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 330,
      "positionAbsolute": {
        "x": 600,
        "y": 540
      },
      "dragging": true
    }
  ],
  "edges": [
    {
      "source": "38cb5ff9-1a88-450f-842b-80f778c128d6",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput038cb5ff9-1a88-450f-842b-80f778c128d6",
      "target": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "targetHandle": "quantumHandleGateInput2ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "type": "quantumEdge",
      "id": "5da12b13-9728-4234-bc94-1eb85fbcbbe2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "4b231576-09cd-480c-9266-0ee9f9704882",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput04b231576-09cd-480c-9266-0ee9f9704882",
      "target": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "targetHandle": "quantumHandleGateInput1ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "type": "quantumEdge",
      "id": "8c0e902a-e423-45ac-8bac-eeff15c0f1fd",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "sourceHandle": "quantumHandleGateOutput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "target": "e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "targetHandle": "quantumHandleMeasurementInput0e5c6702f-36fd-4fc2-b4bb-527b7b302a30",
      "type": "quantumEdge",
      "id": "24246544-6c73-4fc5-8ed7-63c6206c011b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "sourceHandle": "quantumHandleGateOutput0ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "target": "b51187a0-8799-46c1-9814-cfa9355e8684",
      "targetHandle": "quantumHandleGateInput0b51187a0-8799-46c1-9814-cfa9355e8684",
      "type": "quantumEdge",
      "id": "b9a325a5-f094-4656-9ab9-7c68fc5add8b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "sourceHandle": "quantumHandleGateOutput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "target": "ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "targetHandle": "quantumHandleGateInput0ccd21611-18e5-4e51-a5bb-ab3dcf07541c",
      "type": "quantumEdge",
      "id": "2f997def-e014-45ac-a39c-4c338e52449b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "sourceHandle": "quantumHandleGateOutput0717fd33f-b00d-4825-84f7-482b90f6f2f1",
      "target": "c36c6862-66f1-4494-add1-55b8e1d403a6",
      "targetHandle": "quantumHandleGateInput0c36c6862-66f1-4494-add1-55b8e1d403a6",
      "type": "quantumEdge",
      "id": "5322d7a2-56b2-4f22-bc01-8dd1d7c923f0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}


export const classical_clustering = {
  "metadata": {
    "version": "1.0.0",
    "name": "Classical clustering",
    "description": "Build a classical clustering model for comparison with the quantum approach.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085138030",
    "timestamp": "2026-09-22T13:52:18.030Z"
  },
  "nodes": [
    {
      "id": "df15ed02-8181-48b5-88ae-5f0d08806baf",
      "type": "dataTypeNode",
      "position": {
        "x": -180,
        "y": 180
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "File",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "URL or file path to data.",
        "icon": "PaletteIcon_File.png",
        "identifiers": [
          "q974807"
        ],
        "dataType": "file",
        "value": "https://raw.githubusercontent.com/LaviniaStiliadou/bootstrap/4aa81fc91ff1c6b849ae2ed848eb472b62044e61/site/src/content/docs/about/overview.mdx",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "file"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -180,
        "y": 180
      },
      "dragging": false,
      "hidden": false
    },
    {
      "id": "d51e906a-9333-46b6-a55a-230c5304919f",
      "type": "dataTypeNode",
      "position": {
        "x": -180,
        "y": 480
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q651748"
        ],
        "dataType": "number",
        "value": "2",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -180,
        "y": 480
      },
      "dragging": false,
      "hidden": false
    },
    {
      "id": "5fc0119a-0c31-431d-bc23-83d8bbb008da",
      "type": "pluginNode",
      "position": {
        "x": 480,
        "y": 540
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Classical Clustering",
        "inputs": [
          {
            "id": "df15ed02-8181-48b5-88ae-5f0d08806baf",
            "edgeId": "0b127312-601c-440b-b57e-2b97f756b7d9",
            "outputIdentifier": "",
            "identifiers": [
              "q974807"
            ],
            "targetHandle": "classicalHandlePluginInput05fc0119a-0c31-431d-bc23-83d8bbb008da"
          },
          {
            "id": "d51e906a-9333-46b6-a55a-230c5304919f",
            "edgeId": "a90922b0-90d2-4e1e-8cc4-d88ff1cefcdb",
            "outputIdentifier": "",
            "identifiers": [
              "q651748"
            ],
            "targetHandle": "classicalHandlePluginInput15fc0119a-0c31-431d-bc23-83d8bbb008da"
          },
          {
            "id": "bdcbb982-525e-48a0-abb4-705ec1c387b0",
            "edgeId": "35ff4d2d-eb5f-4376-ab5a-74d678dec4e5",
            "outputIdentifier": "",
            "identifiers": [
              "q400257"
            ],
            "targetHandle": "classicalHandlePluginInput25fc0119a-0c31-431d-bc23-83d8bbb008da"
          },
          {
            "id": "3fc94a64-a244-42ed-80dc-c388d8ad681a",
            "edgeId": "aff0ec3b-66c7-4bab-ae79-411cbb94c4e3",
            "outputIdentifier": "",
            "identifiers": [
              "q854691"
            ],
            "targetHandle": "classicalHandlePluginInput35fc0119a-0c31-431d-bc23-83d8bbb008da"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "pluginName": "Classical Clustering",
        "dataInputs": [
          {
            "parameter": "entityPointsUrl",
            "data_type": "entity/vector",
            "content_type": [
              "application/json",
              "text/csv"
            ],
            "required": true
          },
          {
            "parameter": "numberOfClusters",
            "data_type": "int",
            "content_type": [
              "text/plain"
            ],
            "required": true
          },
          {
            "parameter": "relativeResidual",
            "data_type": "float",
            "content_type": [
              "text/plain"
            ],
            "required": true
          },
          {
            "parameter": "maxIterations",
            "data_type": "int",
            "content_type": [
              "text/plain"
            ],
            "required": true
          }
        ],
        "dataOutputs": [
          {
            "name": "Cluster Labels",
            "data_type": "entity/label",
            "content_type": [
              "application/json"
            ],
            "required": true
          },
          {
            "name": "Visualization",
            "data_type": "plot",
            "content_type": [
              "text/html"
            ],
            "required": false
          }
        ],
        "description": "Clusters data using standard algorithms.",
        "icon": "PaletteIcon_ClassicalClustering.png",
        "identifiers": [
          "q854691"
        ],
        "inputTypes": [
          "file",
          "number",
          "number",
          "number"
        ],
        "outputTypes": {
          "0": "array",
          "1": "any"
        },
        "clusteringAlgorithm": "k-means"
      },
      "width": 320,
      "height": 550,
      "positionAbsolute": {
        "x": 480,
        "y": 540
      },
      "dragging": false
    },
    {
      "id": "bdcbb982-525e-48a0-abb4-705ec1c387b0",
      "type": "dataTypeNode",
      "position": {
        "x": -180,
        "y": 795
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q400257"
        ],
        "dataType": "number",
        "value": "0.5",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -180,
        "y": 795
      },
      "dragging": false
    },
    {
      "id": "3fc94a64-a244-42ed-80dc-c388d8ad681a",
      "type": "dataTypeNode",
      "position": {
        "x": -165,
        "y": 1140
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q854691"
        ],
        "dataType": "number",
        "value": "10",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -165,
        "y": 1140
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "3fc94a64-a244-42ed-80dc-c388d8ad681a",
      "sourceHandle": "classicalHandleDataTypeOutput03fc94a64-a244-42ed-80dc-c388d8ad681a",
      "target": "5fc0119a-0c31-431d-bc23-83d8bbb008da",
      "targetHandle": "classicalHandlePluginInput35fc0119a-0c31-431d-bc23-83d8bbb008da",
      "type": "classicalEdge",
      "id": "aff0ec3b-66c7-4bab-ae79-411cbb94c4e3",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "bdcbb982-525e-48a0-abb4-705ec1c387b0",
      "sourceHandle": "classicalHandleDataTypeOutput0bdcbb982-525e-48a0-abb4-705ec1c387b0",
      "target": "5fc0119a-0c31-431d-bc23-83d8bbb008da",
      "targetHandle": "classicalHandlePluginInput25fc0119a-0c31-431d-bc23-83d8bbb008da",
      "type": "classicalEdge",
      "id": "35ff4d2d-eb5f-4376-ab5a-74d678dec4e5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "d51e906a-9333-46b6-a55a-230c5304919f",
      "sourceHandle": "classicalHandleDataTypeOutput0d51e906a-9333-46b6-a55a-230c5304919f",
      "target": "5fc0119a-0c31-431d-bc23-83d8bbb008da",
      "targetHandle": "classicalHandlePluginInput15fc0119a-0c31-431d-bc23-83d8bbb008da",
      "type": "classicalEdge",
      "id": "a90922b0-90d2-4e1e-8cc4-d88ff1cefcdb",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "df15ed02-8181-48b5-88ae-5f0d08806baf",
      "sourceHandle": "classicalHandleDataTypeOutput0df15ed02-8181-48b5-88ae-5f0d08806baf",
      "target": "5fc0119a-0c31-431d-bc23-83d8bbb008da",
      "targetHandle": "classicalHandlePluginInput05fc0119a-0c31-431d-bc23-83d8bbb008da",
      "type": "classicalEdge",
      "id": "0b127312-601c-440b-b57e-2b97f756b7d9",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 261.0662117402597,
    "y": -79.55112011369198,
    "zoom": 0.6651227819634996
  }
}

export const quantum_clustering = {
  "metadata": {
    "version": "1.0.0",
    "name": "Quantum Clustering",
    "description": "Build a clustering model.",
    "author": "",
    "containsPlaceholder": true,
    "id": "flow-1790085456433",
    "timestamp": "2026-09-22T13:57:36.433Z"
  },
  "nodes": [
    {
      "id": "639b28c9-ff7f-4792-aec4-6690c789b2ab",
      "type": "pluginNode",
      "position": {
        "x": 795,
        "y": 375
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Quantum Clustering",
        "inputs": [
          {
            "id": "d5e92286-55c8-4907-81ca-3e49ac5e4588",
            "edgeId": "d2d64c0c-0589-48e8-9073-a60eca0fac3e",
            "outputIdentifier": "",
            "identifiers": [
              "q998055"
            ],
            "targetHandle": "classicalHandlePluginInput0639b28c9-ff7f-4792-aec4-6690c789b2ab"
          },
          {
            "id": "383c4c37-d4ee-4b1b-b667-b585e8c29a5f",
            "edgeId": "c79a0a86-30df-45b1-ac11-86df1300e49e",
            "outputIdentifier": "",
            "identifiers": [
              "q909487"
            ],
            "targetHandle": "classicalHandlePluginInput1639b28c9-ff7f-4792-aec4-6690c789b2ab"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "pluginName": "Quantum Clustering",
        "dataInputs": [
          {
            "parameter": "entityPointsUrl",
            "data_type": "entity/vector",
            "content_type": [
              "application/json",
              "text/csv"
            ],
            "required": true
          },
          {
            "parameter": "numberOfClusters",
            "data_type": "int",
            "content_type": [
              "text/plain"
            ],
            "required": true
          },
          {
            "parameter": "tolerance",
            "data_type": "float",
            "content_type": [
              "text/plain"
            ],
            "required": false
          },
          {
            "parameter": "maxIterations",
            "data_type": "int",
            "content_type": [
              "text/plain"
            ],
            "required": false
          }
        ],
        "dataOutputs": [
          {
            "name": "Cluster Labels",
            "data_type": "entity/label",
            "content_type": [
              "application/json"
            ],
            "required": true
          },
          {
            "name": "Visualization",
            "data_type": "plot",
            "content_type": [
              "text/html"
            ],
            "required": false
          }
        ],
        "description": "Performs clustering using a quantum-enhanced clustering algorithm.",
        "icon": "PaletteIcon_QuantumClustering.png",
        "identifiers": [
          "q909487"
        ],
        "inputTypes": [
          "file",
          "number",
          "number",
          "number"
        ],
        "outputTypes": {
          "0": "array",
          "1": "any"
        },
        "clusteringAlgorithm": "k-means"
      },
      "width": 320,
      "height": 550,
      "positionAbsolute": {
        "x": 795,
        "y": 375
      },
      "dragging": false
    },
    {
      "id": "d5e92286-55c8-4907-81ca-3e49ac5e4588",
      "type": "dataTypeNode",
      "position": {
        "x": 240,
        "y": 360
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "File",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "URL or file path to data.",
        "icon": "PaletteIcon_File.png",
        "identifiers": [
          "q998055"
        ],
        "dataType": "file",
        "value": "https://raw.githubusercontent.com/",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "file"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 240,
        "y": 360
      },
      "dragging": false
    },
    {
      "id": "383c4c37-d4ee-4b1b-b667-b585e8c29a5f",
      "type": "dataTypeNode",
      "position": {
        "x": 225,
        "y": 675
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q909487"
        ],
        "dataType": "number",
        "value": "2",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 225,
        "y": 675
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "383c4c37-d4ee-4b1b-b667-b585e8c29a5f",
      "sourceHandle": "classicalHandleDataTypeOutput0383c4c37-d4ee-4b1b-b667-b585e8c29a5f",
      "target": "639b28c9-ff7f-4792-aec4-6690c789b2ab",
      "targetHandle": "classicalHandlePluginInput1639b28c9-ff7f-4792-aec4-6690c789b2ab",
      "type": "classicalEdge",
      "id": "c79a0a86-30df-45b1-ac11-86df1300e49e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "d5e92286-55c8-4907-81ca-3e49ac5e4588",
      "sourceHandle": "classicalHandleDataTypeOutput0d5e92286-55c8-4907-81ca-3e49ac5e4588",
      "target": "639b28c9-ff7f-4792-aec4-6690c789b2ab",
      "targetHandle": "classicalHandlePluginInput0639b28c9-ff7f-4792-aec4-6690c789b2ab",
      "type": "classicalEdge",
      "id": "d2d64c0c-0589-48e8-9073-a60eca0fac3e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": -248,
    "y": -175,
    "zoom": 1
  }
}

export const bell_state_phi_plus = {
  "metadata": {
    "version": "1.0.0",
    "name": "Bell State Phi Plus",
    "description": "Build a two-qubit Bell state using a Hadamard gate and controlled operation.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085986375",
    "timestamp": "2026-09-22T14:06:26.375Z"
  },
  "nodes": [
    {
      "id": "39feeae4-3dd6-494a-aaac-185f26bae158",
      "type": "gateNode",
      "position": {
        "x": -225,
        "y": 450
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -225,
        "y": 450
      },
      "dragging": false
    },
    {
      "id": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "type": "gateNode",
      "position": {
        "x": -225,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q225881"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -225,
        "y": 255
      }
    },
    {
      "id": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "type": "gateNode",
      "position": {
        "x": -15,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
            "edgeId": "72fabba8-889f-4b07-953f-97f0b2020b94",
            "identifiers": [
              "q225881"
            ],
            "targetHandle": "quantumHandleGateInput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Creates superposition.",
        "icon": [
          "hadamard.png",
          "PaletteIcon_Hadamard_Beginner.png"
        ],
        "identifiers": [
          "q225881"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -15,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "gateNode",
      "position": {
        "x": 195,
        "y": 255
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
            "edgeId": "036a1a60-076d-40ed-9fc1-e36939df288c",
            "identifiers": [
              "q225881"
            ],
            "targetHandle": "quantumHandleGateInput0ddfeb965-964a-43ac-bb01-7e775bafb3c4"
          },
          {
            "id": "39feeae4-3dd6-494a-aaac-185f26bae158",
            "edgeId": "5d92b0c6-33e4-44be-b60a-4b53d1299cfd",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleGateInput1ddfeb965-964a-43ac-bb01-7e775bafb3c4"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Controlled NOT.",
        "icon": [
          "CNOT_palette.png",
          "PaletteIcon_CNOT_Beginner.png"
        ],
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [
          "any",
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 220,
      "positionAbsolute": {
        "x": 195,
        "y": 255
      },
      "dragging": false
    },
    {
      "id": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "mergerNode",
      "position": {
        "x": 375,
        "y": 270
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Merger",
        "inputs": [
          {
            "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
            "edgeId": "47575eb1-d255-4272-8d7b-f03c5716cc79",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMergerInput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc"
          },
          {
            "id": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
            "edgeId": "9d99156f-d237-43ff-a6ad-6460fee626bd",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMergerInput1c88d4b7c-a027-4878-a043-ad5ba6e4aecc"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Merges qubits.",
        "icon": "Merger_palette.png",
        "identifiers": [
          "q567334"
        ],
        "inputTypes": [
          "any",
          "any"
        ],
        "outputTypes": [],
        "numberInputs": "2"
      },
      "width": 170,
      "height": 165,
      "positionAbsolute": {
        "x": 375,
        "y": 270
      },
      "dragging": false
    },
    {
      "id": "a8296458-9d46-4398-989e-3fde154c0620",
      "type": "measurementNode",
      "position": {
        "x": 615,
        "y": 210
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
            "edgeId": "65c05d30-68aa-458b-99fc-76b19ffa4916",
            "identifiers": [
              "q567334"
            ],
            "targetHandle": "quantumHandleMeasurementInput0a8296458-9d46-4398-989e-3fde154c0620"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q567334"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 615,
        "y": 210
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "sourceHandle": "quantumHandleMergerOutput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "target": "a8296458-9d46-4398-989e-3fde154c0620",
      "targetHandle": "quantumHandleMeasurementInput0a8296458-9d46-4398-989e-3fde154c0620",
      "type": "quantumEdge",
      "id": "65c05d30-68aa-458b-99fc-76b19ffa4916",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "sourceHandle": "quantumHandleGateOutput1ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "target": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "targetHandle": "quantumHandleMergerInput1c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "quantumEdge",
      "id": "9d99156f-d237-43ff-a6ad-6460fee626bd",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "sourceHandle": "quantumHandleGateOutput0ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "target": "c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "targetHandle": "quantumHandleMergerInput0c88d4b7c-a027-4878-a043-ad5ba6e4aecc",
      "type": "quantumEdge",
      "id": "47575eb1-d255-4272-8d7b-f03c5716cc79",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "39feeae4-3dd6-494a-aaac-185f26bae158",
      "sourceHandle": "quantumHandleGateOutput039feeae4-3dd6-494a-aaac-185f26bae158",
      "target": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "targetHandle": "quantumHandleGateInput1ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "quantumEdge",
      "id": "5d92b0c6-33e4-44be-b60a-4b53d1299cfd",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "sourceHandle": "quantumHandleGateOutput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "target": "ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "targetHandle": "quantumHandleGateInput0ddfeb965-964a-43ac-bb01-7e775bafb3c4",
      "type": "quantumEdge",
      "id": "036a1a60-076d-40ed-9fc1-e36939df288c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "sourceHandle": "quantumHandleGateOutput0be8ec492-9dad-4893-b97a-bfb4a68f2ba8",
      "target": "d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "targetHandle": "quantumHandleGateInput0d407370f-efd2-4b6f-90a0-2aa5e5c320aa",
      "type": "quantumEdge",
      "id": "72fabba8-889f-4b07-953f-97f0b2020b94",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 431,
    "y": 23,
    "zoom": 1
  }
}

export const conditional_quantum_model = {
  "metadata": {
    "version": "1.0.0",
    "name": "Conditional Quantum Model",
    "description": "Use conditional logic to control a quantum circuit.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085309770",
    "timestamp": "2026-09-22T13:55:09.770Z"
  },
  "nodes": [
    {
      "id": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "type": "ifElseNode",
      "position": {
        "x": 270,
        "y": 345
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "If-Then-Else",
        "inputs": [
          {
            "id": "34f371b0-d32a-4f23-b6b8-18329e6ce40e",
            "edgeId": "77062142-af82-49c2-b4d7-d663739694e9",
            "identifiers": [
              "q650252"
            ],
            "targetHandle": "quantumHandleInputInitialization0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20"
          },
          {
            "id": "4852cb95-cea7-4fdf-b9e5-b177e47aba33",
            "edgeId": "e363e106-2bb1-492d-9d8e-8ff8af17d718",
            "outputIdentifier": "b",
            "identifiers": [
              "q859601"
            ],
            "targetHandle": "classicalHandleInputInitialization0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20"
          },
          {
            "id": "3b0d982c-494f-433b-8eb8-b741e4523257",
            "edgeId": "1c7c37ab-bf9f-4502-a261-03bf4e380e0c",
            "identifiers": [
              "q532049"
            ],
            "targetHandle": "quantumHandleDynamicOutput0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20"
          },
          {
            "id": "ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
            "edgeId": "1bdc7fb0-519d-4b8c-a995-1ffe38708f20",
            "identifiers": [
              "q532049"
            ],
            "targetHandle": "quantumHandleDynamicOutputElse0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": false,
        "compactOptions": [
          true,
          false
        ],
        "description": "Conditional block that branches based on a boolean input.",
        "icon": "PaletteIcon_IfElse.png",
        "identifiers": [
          "q532049"
        ],
        "inputTypes": [
          "array"
        ],
        "outputTypes": [],
        "condition": "b==0"
      },
      "width": 1100,
      "height": 900,
      "dragging": false,
      "positionAbsolute": {
        "x": 270,
        "y": 345
      }
    },
    {
      "id": "34f371b0-d32a-4f23-b6b8-18329e6ce40e",
      "type": "gateNode",
      "position": {
        "x": -195,
        "y": 885
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q650252"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -195,
        "y": 885
      }
    },
    {
      "id": "419f8574-3a94-4199-a203-7e36842ce327",
      "type": "gateNode",
      "position": {
        "x": -660,
        "y": 360
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q129028"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -660,
        "y": 360
      },
      "dragging": false
    },
    {
      "id": "4852cb95-cea7-4fdf-b9e5-b177e47aba33",
      "type": "measurementNode",
      "position": {
        "x": -240,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "419f8574-3a94-4199-a203-7e36842ce327",
            "edgeId": "c7a45f94-407e-478f-9504-bd2985b0db9c",
            "identifiers": [
              "q129028"
            ],
            "targetHandle": "quantumHandleMeasurementInput04852cb95-cea7-4fdf-b9e5-b177e47aba33"
          }
        ],
        "outputs": [
          {
            "identifier": "b",
            "size": "",
            "type": "classical"
          }
        ],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q129028"
        ],
        "indices": "",
        "outputIdentifier": "b",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": -240,
        "y": 240
      },
      "dragging": false
    },
    {
      "id": "3b0d982c-494f-433b-8eb8-b741e4523257",
      "type": "gateNode",
      "position": {
        "x": 780,
        "y": 465
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
            "edgeId": "cd531baf-c0de-4d90-8c55-242ca1572c19",
            "identifiers": [
              "q532049"
            ],
            "targetHandle": "quantumHandleGateInput03b0d982c-494f-433b-8eb8-b741e4523257"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q532049"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 780,
        "y": 465
      }
    },
    {
      "id": "ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
      "type": "gateNode",
      "position": {
        "x": 690,
        "y": 960
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Z",
        "inputs": [
          {
            "id": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
            "edgeId": "12002930-ab6c-4901-bf7e-194fef85ac99",
            "identifiers": [
              "q532049"
            ],
            "targetHandle": "quantumHandleGateInput0ff0c8482-bb0b-4a0d-98cc-db4e67e42d18"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-Z gate: adds phase to |1⟩ state.",
        "icon": [
          "pauliZ.png",
          "PaletteIcon_Z_Beginner.png"
        ],
        "identifiers": [
          "q532049"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 690,
        "y": 960
      }
    },
    {
      "id": "1a3fdfde-a2d2-437f-a2be-29d2c3d61f50",
      "type": "measurementNode",
      "position": {
        "x": 1605,
        "y": 450
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
            "edgeId": "9fea4f6c-58ab-482e-b691-9ba7fafbd4d3",
            "identifiers": [
              "q532049"
            ],
            "targetHandle": "quantumHandleMeasurementInput01a3fdfde-a2d2-437f-a2be-29d2c3d61f50"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q532049"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1605,
        "y": 450
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "419f8574-3a94-4199-a203-7e36842ce327",
      "sourceHandle": "quantumHandleGateOutput0419f8574-3a94-4199-a203-7e36842ce327",
      "target": "4852cb95-cea7-4fdf-b9e5-b177e47aba33",
      "targetHandle": "quantumHandleMeasurementInput04852cb95-cea7-4fdf-b9e5-b177e47aba33",
      "type": "quantumEdge",
      "id": "c7a45f94-407e-478f-9504-bd2985b0db9c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "sourceHandle": "quantumHandleOutputFinal-0",
      "target": "1a3fdfde-a2d2-437f-a2be-29d2c3d61f50",
      "targetHandle": "quantumHandleMeasurementInput01a3fdfde-a2d2-437f-a2be-29d2c3d61f50",
      "type": "quantumEdge",
      "id": "9fea4f6c-58ab-482e-b691-9ba7fafbd4d3",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
      "sourceHandle": "quantumHandleGateOutput0ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
      "target": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "targetHandle": "quantumHandleDynamicOutputElse0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "type": "quantumEdge",
      "id": "1bdc7fb0-519d-4b8c-a995-1ffe38708f20",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "sourceHandle": "quantumHandleSideElse0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "target": "ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
      "targetHandle": "quantumHandleGateInput0ff0c8482-bb0b-4a0d-98cc-db4e67e42d18",
      "type": "quantumEdge",
      "id": "12002930-ab6c-4901-bf7e-194fef85ac99",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "3b0d982c-494f-433b-8eb8-b741e4523257",
      "sourceHandle": "quantumHandleGateOutput03b0d982c-494f-433b-8eb8-b741e4523257",
      "target": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "targetHandle": "quantumHandleDynamicOutput0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "type": "quantumEdge",
      "id": "1c7c37ab-bf9f-4502-a261-03bf4e380e0c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "sourceHandle": "quantumHandleSideThen0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "target": "3b0d982c-494f-433b-8eb8-b741e4523257",
      "targetHandle": "quantumHandleGateInput03b0d982c-494f-433b-8eb8-b741e4523257",
      "type": "quantumEdge",
      "id": "cd531baf-c0de-4d90-8c55-242ca1572c19",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "4852cb95-cea7-4fdf-b9e5-b177e47aba33",
      "sourceHandle": "classicalHandlemeasurementNodeOutput04852cb95-cea7-4fdf-b9e5-b177e47aba33",
      "target": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "targetHandle": "classicalHandleInputInitialization0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "type": "classicalEdge",
      "id": "e363e106-2bb1-492d-9d8e-8ff8af17d718",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "34f371b0-d32a-4f23-b6b8-18329e6ce40e",
      "sourceHandle": "quantumHandleGateOutput034f371b0-d32a-4f23-b6b8-18329e6ce40e",
      "target": "ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "targetHandle": "quantumHandleInputInitialization0ba00b7f7-9f84-4e5b-a2cf-1233e7dc8c20",
      "type": "quantumEdge",
      "id": "77062142-af82-49c2-b4d7-d663739694e9",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 306.4135575556519,
    "y": 28.906143584775123,
    "zoom": 0.5713732726050276
  }
}

export const custom_quantum_operator = {
  "metadata": {
    "version": "1.0.0",
    "name": "Custom Quantum Operator",
    "description": "Create a reusable quantum operation from a custom low-code model.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085546193",
    "timestamp": "2026-09-22T13:59:06.193Z"
  },
  "nodes": [
    {
      "id": "0e4f2e92-cfc2-4f1d-96f3-c18e56603fa8",
      "type": "algorithmNode",
      "position": {
        "x": 150,
        "y": 435
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "W-State",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "OPENQASM 3.0;\ninclude \"stdgates.inc\";\nqubit[1] q;\n\nh q[0];",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Encapsulates a reusable quantum operation defined by the user.",
        "icon": [
          "PaletteIcon_CustomQuantumOperator.png",
          "PaletteIcon_Ancilla_CustomQuantumOperator.png"
        ],
        "identifiers": [
          "q137982"
        ],
        "inputTypes": [],
        "outputTypes": {
          "0": "quantum register"
        },
        "fileName": "circuit.qasm",
        "numberQuantumOutputs": 1
      },
      "width": 360,
      "height": 400,
      "dragging": false,
      "positionAbsolute": {
        "x": 150,
        "y": 435
      }
    }
  ],
  "edges": [],
  "viewport": {
    "x": 77,
    "y": -205,
    "zoom": 1
  }
}


export const multi_controlled_gates = {
  "metadata": {
    "version": "1.0.0",
    "name": "Multi-Controlled Gates",
    "description": "Build a circuit using Toffoli, controlled-SWAP, and multi-controlled multi-target operations.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085802804",
    "timestamp": "2026-09-22T14:03:22.804Z"
  },
  "nodes": [
    {
      "id": "bd924ae3-3be7-4a64-8365-977190dd5c29",
      "type": "gateNode",
      "position": {
        "x": -330,
        "y": 540
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q149978"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -330,
        "y": 540
      },
      "dragging": false
    },
    {
      "id": "7da32fe8-0661-4fd6-b021-ad4d410c004c",
      "type": "gateNode",
      "position": {
        "x": -330,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q994755"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -330,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "b0da1682-43e2-4247-a2be-be337be8074e",
      "type": "gateNode",
      "position": {
        "x": -135,
        "y": 165
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "f6a12c0d-9d1f-4f37-a918-c09b82628203",
            "edgeId": "eae99b90-382c-4e03-b5ee-0a83616c085a",
            "identifiers": [
              "q930277"
            ],
            "targetHandle": "quantumHandleGateInput0b0da1682-43e2-4247-a2be-be337be8074e"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q930277"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -135,
        "y": 165
      },
      "dragging": false
    },
    {
      "id": "f6a12c0d-9d1f-4f37-a918-c09b82628203",
      "type": "gateNode",
      "position": {
        "x": -330,
        "y": 165
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Qubit Circuit",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Represents a single qubit used in the circuit.",
        "icon": [
          "qubit.png",
          "PaletteIcon_Qubit_Beginner.png"
        ],
        "identifiers": [
          "q930277"
        ],
        "inputTypes": [],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -330,
        "y": 165
      },
      "dragging": false
    },
    {
      "id": "1eaf5e84-b39a-4316-a742-bcd7061a9e0d",
      "type": "gateNode",
      "position": {
        "x": -135,
        "y": 345
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "X",
        "inputs": [
          {
            "id": "7da32fe8-0661-4fd6-b021-ad4d410c004c",
            "edgeId": "c00f1cc2-dfa9-46a6-99e2-db946c958443",
            "identifiers": [
              "q994755"
            ],
            "targetHandle": "quantumHandleGateInput01eaf5e84-b39a-4316-a742-bcd7061a9e0d"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Pauli-X gate: flips the state.",
        "icon": [
          "pauliX.png",
          "PaletteIcon_X_Beginner.png"
        ],
        "identifiers": [
          "q994755"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -135,
        "y": 345
      },
      "dragging": false
    },
    {
      "id": "7d06f491-6256-4904-92bc-180df6b1402e",
      "type": "gateNode",
      "position": {
        "x": 90,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Toffoli",
        "inputs": [
          {
            "id": "b0da1682-43e2-4247-a2be-be337be8074e",
            "edgeId": "d695ae46-9fb1-4d70-ace0-7d145fe670fb",
            "identifiers": [
              "q930277"
            ],
            "targetHandle": "quantumHandleGateInput07d06f491-6256-4904-92bc-180df6b1402e"
          },
          {
            "id": "1eaf5e84-b39a-4316-a742-bcd7061a9e0d",
            "edgeId": "d530a047-7685-4568-a859-cb52e96c4f3a",
            "identifiers": [
              "q994755"
            ],
            "targetHandle": "quantumHandleGateInput17d06f491-6256-4904-92bc-180df6b1402e"
          },
          {
            "id": "bd924ae3-3be7-4a64-8365-977190dd5c29",
            "edgeId": "7d01b8ec-2f22-41d4-b60d-b5f8df99951b",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleGateInput27d06f491-6256-4904-92bc-180df6b1402e"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "CCNOT: flips target if both controls are |1⟩.",
        "icon": [
          "Toffoli_palette.png",
          "PaletteIcon_Toffoli_Beginner.png"
        ],
        "identifiers": [
          "q149978"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 330,
      "positionAbsolute": {
        "x": 90,
        "y": 240
      },
      "dragging": false
    },
    {
      "id": "c8e38b20-7bba-4607-a600-768a66688d25",
      "type": "gateNode",
      "position": {
        "x": 285,
        "y": 240
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "CSWAP",
        "inputs": [
          {
            "id": "7d06f491-6256-4904-92bc-180df6b1402e",
            "edgeId": "e6df2e6c-504e-41d5-9e59-f3642cf78612",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleGateInput0c8e38b20-7bba-4607-a600-768a66688d25"
          },
          {
            "id": "7d06f491-6256-4904-92bc-180df6b1402e",
            "edgeId": "ea21fda3-4da3-4b20-a25e-49015b8040b4",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleGateInput1c8e38b20-7bba-4607-a600-768a66688d25"
          },
          {
            "id": "7d06f491-6256-4904-92bc-180df6b1402e",
            "edgeId": "4e9f0895-47cd-477d-b435-cfd724e21214",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleGateInput2c8e38b20-7bba-4607-a600-768a66688d25"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Controlled SWAP: swaps two qubits if control is |1⟩.",
        "icon": [
          "CSWAP_palette.png",
          "PaletteIcon_CSWAP_Beginner.png"
        ],
        "identifiers": [
          "q149978"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "parameter": "0"
      },
      "width": 110,
      "height": 330,
      "positionAbsolute": {
        "x": 285,
        "y": 240
      },
      "dragging": false
    },
    {
      "id": "f3e3718d-d565-49c4-91dc-056d3d480728",
      "type": "mergerNode",
      "position": {
        "x": 495,
        "y": 300
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Merger",
        "inputs": [
          {
            "id": "c8e38b20-7bba-4607-a600-768a66688d25",
            "edgeId": "aaf490aa-4619-40eb-9e19-8552f7b0ebf9",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleMergerInput0f3e3718d-d565-49c4-91dc-056d3d480728"
          },
          {
            "id": "c8e38b20-7bba-4607-a600-768a66688d25",
            "edgeId": "8b05e3b9-2084-4cff-8a4d-7718d498f254",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleMergerInput1f3e3718d-d565-49c4-91dc-056d3d480728"
          },
          {
            "id": "c8e38b20-7bba-4607-a600-768a66688d25",
            "edgeId": "81a24351-f9f6-439a-8d60-c89a0d863737",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleMergerInput2f3e3718d-d565-49c4-91dc-056d3d480728"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Merges qubits.",
        "icon": "Merger_palette.png",
        "identifiers": [
          "q149978"
        ],
        "inputTypes": [
          "any",
          "any",
          "any"
        ],
        "outputTypes": [],
        "numberInputs": 3
      },
      "width": 170,
      "height": 205,
      "positionAbsolute": {
        "x": 495,
        "y": 300
      },
      "dragging": false
    },
    {
      "id": "5928c452-a8f1-4c3a-9779-0fad8b0a7078",
      "type": "measurementNode",
      "position": {
        "x": 735,
        "y": 150
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "f3e3718d-d565-49c4-91dc-056d3d480728",
            "edgeId": "25bcba77-c17e-4119-86b4-e6e323e7c6ca",
            "identifiers": [
              "q149978"
            ],
            "targetHandle": "quantumHandleMeasurementInput05928c452-a8f1-4c3a-9779-0fad8b0a7078"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q149978"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 735,
        "y": 150
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "f3e3718d-d565-49c4-91dc-056d3d480728",
      "sourceHandle": "quantumHandleMergerOutput0f3e3718d-d565-49c4-91dc-056d3d480728",
      "target": "5928c452-a8f1-4c3a-9779-0fad8b0a7078",
      "targetHandle": "quantumHandleMeasurementInput05928c452-a8f1-4c3a-9779-0fad8b0a7078",
      "type": "quantumEdge",
      "id": "25bcba77-c17e-4119-86b4-e6e323e7c6ca",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c8e38b20-7bba-4607-a600-768a66688d25",
      "sourceHandle": "quantumHandleGateOutput2c8e38b20-7bba-4607-a600-768a66688d25",
      "target": "f3e3718d-d565-49c4-91dc-056d3d480728",
      "targetHandle": "quantumHandleMergerInput2f3e3718d-d565-49c4-91dc-056d3d480728",
      "type": "quantumEdge",
      "id": "81a24351-f9f6-439a-8d60-c89a0d863737",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c8e38b20-7bba-4607-a600-768a66688d25",
      "sourceHandle": "quantumHandleGateOutput1c8e38b20-7bba-4607-a600-768a66688d25",
      "target": "f3e3718d-d565-49c4-91dc-056d3d480728",
      "targetHandle": "quantumHandleMergerInput1f3e3718d-d565-49c4-91dc-056d3d480728",
      "type": "quantumEdge",
      "id": "8b05e3b9-2084-4cff-8a4d-7718d498f254",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "c8e38b20-7bba-4607-a600-768a66688d25",
      "sourceHandle": "quantumHandleGateOutput0c8e38b20-7bba-4607-a600-768a66688d25",
      "target": "f3e3718d-d565-49c4-91dc-056d3d480728",
      "targetHandle": "quantumHandleMergerInput0f3e3718d-d565-49c4-91dc-056d3d480728",
      "type": "quantumEdge",
      "id": "aaf490aa-4619-40eb-9e19-8552f7b0ebf9",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7d06f491-6256-4904-92bc-180df6b1402e",
      "sourceHandle": "quantumHandleGateOutput27d06f491-6256-4904-92bc-180df6b1402e",
      "target": "c8e38b20-7bba-4607-a600-768a66688d25",
      "targetHandle": "quantumHandleGateInput2c8e38b20-7bba-4607-a600-768a66688d25",
      "type": "quantumEdge",
      "id": "4e9f0895-47cd-477d-b435-cfd724e21214",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7d06f491-6256-4904-92bc-180df6b1402e",
      "sourceHandle": "quantumHandleGateOutput17d06f491-6256-4904-92bc-180df6b1402e",
      "target": "c8e38b20-7bba-4607-a600-768a66688d25",
      "targetHandle": "quantumHandleGateInput1c8e38b20-7bba-4607-a600-768a66688d25",
      "type": "quantumEdge",
      "id": "ea21fda3-4da3-4b20-a25e-49015b8040b4",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7d06f491-6256-4904-92bc-180df6b1402e",
      "sourceHandle": "quantumHandleGateOutput07d06f491-6256-4904-92bc-180df6b1402e",
      "target": "c8e38b20-7bba-4607-a600-768a66688d25",
      "targetHandle": "quantumHandleGateInput0c8e38b20-7bba-4607-a600-768a66688d25",
      "type": "quantumEdge",
      "id": "e6df2e6c-504e-41d5-9e59-f3642cf78612",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "bd924ae3-3be7-4a64-8365-977190dd5c29",
      "sourceHandle": "quantumHandleGateOutput0bd924ae3-3be7-4a64-8365-977190dd5c29",
      "target": "7d06f491-6256-4904-92bc-180df6b1402e",
      "targetHandle": "quantumHandleGateInput27d06f491-6256-4904-92bc-180df6b1402e",
      "type": "quantumEdge",
      "id": "7d01b8ec-2f22-41d4-b60d-b5f8df99951b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "1eaf5e84-b39a-4316-a742-bcd7061a9e0d",
      "sourceHandle": "quantumHandleGateOutput01eaf5e84-b39a-4316-a742-bcd7061a9e0d",
      "target": "7d06f491-6256-4904-92bc-180df6b1402e",
      "targetHandle": "quantumHandleGateInput17d06f491-6256-4904-92bc-180df6b1402e",
      "type": "quantumEdge",
      "id": "d530a047-7685-4568-a859-cb52e96c4f3a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b0da1682-43e2-4247-a2be-be337be8074e",
      "sourceHandle": "quantumHandleGateOutput0b0da1682-43e2-4247-a2be-be337be8074e",
      "target": "7d06f491-6256-4904-92bc-180df6b1402e",
      "targetHandle": "quantumHandleGateInput07d06f491-6256-4904-92bc-180df6b1402e",
      "type": "quantumEdge",
      "id": "d695ae46-9fb1-4d70-ace0-7d145fe670fb",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7da32fe8-0661-4fd6-b021-ad4d410c004c",
      "sourceHandle": "quantumHandleGateOutput07da32fe8-0661-4fd6-b021-ad4d410c004c",
      "target": "1eaf5e84-b39a-4316-a742-bcd7061a9e0d",
      "targetHandle": "quantumHandleGateInput01eaf5e84-b39a-4316-a742-bcd7061a9e0d",
      "type": "quantumEdge",
      "id": "c00f1cc2-dfa9-46a6-99e2-db946c958443",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "f6a12c0d-9d1f-4f37-a918-c09b82628203",
      "sourceHandle": "quantumHandleGateOutput0f6a12c0d-9d1f-4f37-a918-c09b82628203",
      "target": "b0da1682-43e2-4247-a2be-be337be8074e",
      "targetHandle": "quantumHandleGateInput0b0da1682-43e2-4247-a2be-be337be8074e",
      "type": "quantumEdge",
      "id": "eae99b90-382c-4e03-b5ee-0a83616c085a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 375.0369993041838,
    "y": 129.1136337787585,
    "zoom": 0.6538797864666165
  }
}

export const quantum_arithmetic = {
  "metadata": {
    "version": "1.0.0",
    "name": "Quantum Arithmetic",
    "description": "Build a model using quantum arithmetic and logical operations.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1790085642840",
    "timestamp": "2026-09-22T14:00:42.840Z"
  },
  "nodes": [
    {
      "id": "21f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
      "type": "statePreparationNode",
      "position": {
        "x": 285,
        "y": -15
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Basis Encoding",
        "inputs": [
          {
            "id": "b7213f1f-402a-4010-9519-99a53c77f22a",
            "edgeId": "7505246c-8e59-4809-bc09-44b5bdf20b54",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput021f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
            "identifiers": [
              "q983039"
            ]
          },
          {
            "id": "b7213f1f-402a-4010-9519-99a53c77f22a",
            "edgeId": "7505246c-8e59-4809-bc09-44b5bdf20b54",
            "outputIdentifier": "",
            "identifiers": [
              "q983039"
            ],
            "targetHandle": "classicalHandleStatePreparationInput021f6a13e-830e-4a1b-ab3c-6b84d62d1f45"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "description": "Encodes classical bits into computational basis quantum states.",
        "icon": [
          "PaletteIcon_BasisEncoding.png",
          "PaletteIcon_Ancilla_BasisEncoding.png"
        ],
        "identifiers": [
          "q983039"
        ],
        "inputTypes": [
          "number"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Basis Encoding"
      },
      "width": 320,
      "height": 350,
      "positionAbsolute": {
        "x": 285,
        "y": -15
      },
      "dragging": false
    },
    {
      "id": "8b388b72-a123-465d-bf84-457c9034d37f",
      "type": "statePreparationNode",
      "position": {
        "x": 285,
        "y": 405
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Basis Encoding",
        "inputs": [
          {
            "id": "7db66298-26ba-4df2-a5da-da1fb35c7709",
            "edgeId": "3849d64b-375b-429c-a60b-5ecec0026313",
            "outputIdentifier": "",
            "targetHandle": "classicalHandleStatePreparationInput08b388b72-a123-465d-bf84-457c9034d37f",
            "identifiers": [
              "q497156"
            ]
          },
          {
            "id": "7db66298-26ba-4df2-a5da-da1fb35c7709",
            "edgeId": "3849d64b-375b-429c-a60b-5ecec0026313",
            "outputIdentifier": "",
            "identifiers": [
              "q497156"
            ],
            "targetHandle": "classicalHandleStatePreparationInput08b388b72-a123-465d-bf84-457c9034d37f"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          false
        ],
        "description": "Encodes classical bits into computational basis quantum states.",
        "icon": [
          "PaletteIcon_BasisEncoding.png",
          "PaletteIcon_Ancilla_BasisEncoding.png"
        ],
        "identifiers": [
          "q497156"
        ],
        "inputTypes": [
          "number"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "encodingType": "Basis Encoding"
      },
      "width": 320,
      "height": 350,
      "positionAbsolute": {
        "x": 285,
        "y": 405
      },
      "dragging": false
    },
    {
      "id": "b054b160-42ad-46b1-9713-d51b05b0be17",
      "type": "quantumOperatorNode",
      "position": {
        "x": 780,
        "y": 225
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Quantum Arithmetic Operator",
        "inputs": [
          {
            "id": "8b388b72-a123-465d-bf84-457c9034d37f",
            "edgeId": "43609237-3eba-4b6d-b7dc-3497c9a3f200",
            "identifiers": [
              "q497156"
            ],
            "targetHandle": "quantumHandleOperationInput1b054b160-42ad-46b1-9713-d51b05b0be17"
          },
          {
            "id": "21f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
            "edgeId": "72bacfb4-efbe-43a0-83fb-42efe17b5216",
            "identifiers": [
              "q983039"
            ],
            "targetHandle": "quantumHandleOperationInput0b054b160-42ad-46b1-9713-d51b05b0be17"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Performs quantum arithmetic (add, subtract, etc.).",
        "icon": [
          "PaletteIcon_ArithmeticOperator.png",
          "PaletteIcon_Ancilla_ArithmeticOperator.png"
        ],
        "identifiers": [
          "q983039"
        ],
        "inputTypes": [
          "quantum register",
          "quantum register"
        ],
        "outputTypes": [
          "quantum register"
        ],
        "operator": "+"
      },
      "width": 320,
      "height": 375,
      "positionAbsolute": {
        "x": 780,
        "y": 225
      },
      "dragging": false
    },
    {
      "id": "b7213f1f-402a-4010-9519-99a53c77f22a",
      "type": "dataTypeNode",
      "position": {
        "x": -255,
        "y": 105
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q983039"
        ],
        "dataType": "number",
        "value": "3",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -255,
        "y": 105
      },
      "dragging": false
    },
    {
      "id": "7db66298-26ba-4df2-a5da-da1fb35c7709",
      "type": "dataTypeNode",
      "position": {
        "x": -240,
        "y": 450
      },
      "selected": true,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Number",
        "inputs": [],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Integer value (whole number) or floating-point number (decimal).",
        "icon": "PaletteIcon_Number.png",
        "identifiers": [
          "q497156"
        ],
        "dataType": "number",
        "value": "1",
        "outputIdentifier": "",
        "inputTypes": [],
        "outputTypes": [
          "number"
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -240,
        "y": 450
      },
      "dragging": false
    },
    {
      "id": "deae82a8-43de-4973-bfd8-cf11f8ece4ef",
      "type": "measurementNode",
      "position": {
        "x": 1200,
        "y": 225
      },
      "selected": false,
      "selectable": true,
      "draggable": true,
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "b054b160-42ad-46b1-9713-d51b05b0be17",
            "edgeId": "4bbd7342-3167-4c12-92bc-2c188d3bc7b5",
            "identifiers": [
              "q983039"
            ],
            "targetHandle": "quantumHandleMeasurementInput0deae82a8-43de-4973-bfd8-cf11f8ece4ef"
          }
        ],
        "outputs": [],
        "children": [],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": true,
        "compactOptions": [
          true,
          false
        ],
        "description": "Measures a quantum state and returns its classical information and collapsed quantum state.",
        "icon": "PaletteIcon_Measurement.png",
        "identifiers": [
          "q983039"
        ],
        "indices": "",
        "outputIdentifier": "",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1200,
        "y": 225
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "b054b160-42ad-46b1-9713-d51b05b0be17",
      "sourceHandle": "quantumHandlequantumOperatorNodeOutput0b054b160-42ad-46b1-9713-d51b05b0be17",
      "target": "deae82a8-43de-4973-bfd8-cf11f8ece4ef",
      "targetHandle": "quantumHandleMeasurementInput0deae82a8-43de-4973-bfd8-cf11f8ece4ef",
      "type": "quantumEdge",
      "id": "4bbd7342-3167-4c12-92bc-2c188d3bc7b5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "21f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput021f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
      "target": "b054b160-42ad-46b1-9713-d51b05b0be17",
      "targetHandle": "quantumHandleOperationInput0b054b160-42ad-46b1-9713-d51b05b0be17",
      "type": "quantumEdge",
      "id": "72bacfb4-efbe-43a0-83fb-42efe17b5216",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "8b388b72-a123-465d-bf84-457c9034d37f",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput08b388b72-a123-465d-bf84-457c9034d37f",
      "target": "b054b160-42ad-46b1-9713-d51b05b0be17",
      "targetHandle": "quantumHandleOperationInput1b054b160-42ad-46b1-9713-d51b05b0be17",
      "type": "quantumEdge",
      "id": "43609237-3eba-4b6d-b7dc-3497c9a3f200",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "7db66298-26ba-4df2-a5da-da1fb35c7709",
      "sourceHandle": "classicalHandleDataTypeOutput07db66298-26ba-4df2-a5da-da1fb35c7709",
      "target": "8b388b72-a123-465d-bf84-457c9034d37f",
      "targetHandle": "classicalHandleStatePreparationInput08b388b72-a123-465d-bf84-457c9034d37f",
      "type": "classicalEdge",
      "id": "3849d64b-375b-429c-a60b-5ecec0026313",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "b7213f1f-402a-4010-9519-99a53c77f22a",
      "sourceHandle": "classicalHandleDataTypeOutput0b7213f1f-402a-4010-9519-99a53c77f22a",
      "target": "21f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
      "targetHandle": "classicalHandleStatePreparationInput021f6a13e-830e-4a1b-ab3c-6b84d62d1f45",
      "type": "classicalEdge",
      "id": "7505246c-8e59-4809-bc09-44b5bdf20b54",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }
  ],
  "viewport": {
    "x": 211.1789791715305,
    "y": 193.07998669999222,
    "zoom": 0.6789469972300693
  }
}