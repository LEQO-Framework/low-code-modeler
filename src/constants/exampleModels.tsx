
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