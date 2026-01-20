export const swap_test_algorithm =
{
  metadata: [
    {
      "version": "1.0.0",
      "name": "My Model",
      "description": "The SWAP Test is a quantum algorithm used to determine how similar two quantum states are. It begins by introducing a single ancilla qubit, which is initialized to zero. A Hadamard gate is applied to this ancilla, putting it into a superposition of zero and one. Next, a sequence of controlled-SWAP operations is applied between the two states, using the ancilla as the control qubit. Each controlled-SWAP exchanges the corresponding qubits of the two states only if the ancilla qubit is in the one state. After all controlled-SWAPs are applied, another Hadamard gate is applied to the ancilla qubit, and it is then measured. If the states are identical, the measurement of the ancilla bit results in 0 with probability 1.\nIn contrast, if the states are orthogonal, the measurement results in 0 or 1 with an equal probability of 0.5.",
      "author": "",
      "containsPlaceholder": false,
      "id": "flow-1768912302534",
      "timestamp": "2026-01-20T12:31:42.534Z"
    },
  ],
  nodes: [
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
      "height": 373,
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
      "height": 110,
      "positionAbsolute": {
        "x": 600,
        "y": 540
      },
      "dragging": true
    }
  ],
  initialEdges: [
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
  "viewport": [{
    "x": 141.46394066338155,
    "y": 73.19424562877867,
    "zoom": 0.5815169387892968
  }]
}


export const hadamard_test_real_part_algorithm =
{
  metadata:[{
  "version": "1.0.0",
    "name": "My Model",
    "description": "The Hadamard Test is a quantum algorithm used to determine the real part (or, using a different variant, the imaginary part) of the expectation value of a unitary operator. The circuit begins with a single ancilla qubit, initialized to zero. A Hadamard gate is applied to the ancilla to create an equal superposition of zero and one. Then a controlled unitary operation is applied, with the ancilla as the control qubit—here, a CNOT gate can be used as an example. After this, another Hadamard gate is applied to the ancilla, which is then measured. The depicted version of the circuit gives the real part of the expectation value; if you want to determine the imaginary part, you need to use the other template with a slightly different arrangement.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1768912989094",
    "timestamp": "2026-01-20T12:43:09.094Z"
  }],
  nodes: [
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
      "height": 110,
      "positionAbsolute": {
        "x": 585,
        "y": 495
      },
      "dragging": true
    }
  ],
  initialEdges: [
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
  viewport: [{
    "x": 84.5,
    "y": 71.25,
    "zoom": 0.5
  }]
}

export const hadamard_test_imaginary_part_algorithm =
{
  metadata: [{
    "version": "1.0.0",
    "name": "My Model",
    "description": "The Hadamard Test can be used to determine the imaginary part of the expectation value of a unitary operator. In this version, the circuit starts with a single ancilla qubit initialized to zero. A Hadamard gate is first applied to put the ancilla into an equal superposition. Next, a controlled unitary operation is applied, with the ancilla as the control qubit—for example, a controlled-CNOT. After the controlled operation, an S-dagger (S†) gate is applied to the ancilla, followed by another Hadamard gate. Finally, the ancilla is measured. The measurement outcome of the ancilla now encodes the imaginary part of the expectation value of the unitary operator.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1768913275508",
    "timestamp": "2026-01-20T12:47:55.508Z"
  }],
  nodes: [
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
  initialEdges: [
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
  viewport: [{
    "x": 89.9801025390625,
    "y": 148,
    "zoom": 0.5
  }]
}

export const qaoa_algorithm =
{
  metadata: [{
    "version": "1.0.0",
    "name": "My Model",
    "description": "QAOA (Quantum Approximate Optimization Algorithm) is a hybrid quantum-classical algorithm for solving combinatorial optimization problems. The algorithm starts by putting all qubits into a uniform superposition. It then applies alternating layers of two operations: a problem unitary parameterized by gamma, which encodes the objective function, and a mixing unitary parameterized by beta, which spreads the amplitudes. These layers are repeated multiple times, and the parameters beta and gamma are optimized classically to maximize the probability of measuring a good solution.",
    "author": "",
    "containsPlaceholder": false,
    "id": "flow-1768915632962",
    "timestamp": "2026-01-20T13:27:12.962Z"
  }],
  nodes: [
   {
      "id": "0faacff4-754c-426f-8f9b-8a454897a741",
      "type": "dataTypeNode",
      "position": {
        "x": -105,
        "y": 15
      },
      "data": {
        "label": "Number",
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
          "q448625"
        ],
        "dataType": "Number",
        "value": "",
        "outputIdentifier": "iterations",
        "inputTypes": [],
        "outputTypes": {
          "0": "Number"
        },
        "outputs": [
          {
            "identifier": "iterations",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -105,
        "y": 15
      },
      "dragging": true
    },
    {
      "id": "a15ea0d4-111e-4ca4-9368-07a3994bfca4",
      "type": "dataTypeNode",
      "position": {
        "x": -105,
        "y": 360
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
          "q230739"
        ],
        "dataType": "Array",
        "value": "",
        "outputIdentifier": "beta",
        "inputTypes": [],
        "outputTypes": {
          "0": "Array"
        },
        "outputs": [
          {
            "identifier": "beta",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -105,
        "y": 360
      },
      "dragging": true
    },
    {
      "id": "bd2e32e0-b4cf-401a-b90f-77ba6429d8e1",
      "type": "dataTypeNode",
      "position": {
        "x": -105,
        "y": 720
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
          "q912842"
        ],
        "dataType": "Array",
        "value": "",
        "outputIdentifier": "gamma ",
        "inputTypes": [],
        "outputTypes": {
          "0": "Array"
        },
        "outputs": [
          {
            "identifier": "gamma ",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -105,
        "y": 720
      },
      "dragging": true
    },
    {
      "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "type": "controlStructureNode",
      "position": {
        "x": 690,
        "y": -15
      },
      "data": {
        "label": "Repeat",
        "inputs": [
          {
            "id": "0faacff4-754c-426f-8f9b-8a454897a741",
            "edgeId": "26f2ff02-0d07-4b08-b55b-bc4acaae499c",
            "outputIdentifier": "iterations",
            "identifiers": [
              "q448625"
            ],
            "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-0"
          },
          {
            "id": "a15ea0d4-111e-4ca4-9368-07a3994bfca4",
            "edgeId": "b165a965-98e6-4bc9-8f71-3569890044a2",
            "outputIdentifier": "beta",
            "identifiers": [
              "q230739"
            ],
            "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-1"
          },
          {
            "id": "bd2e32e0-b4cf-401a-b90f-77ba6429d8e1",
            "edgeId": "4405111f-aa75-4d28-8bf1-5d882d5070f6",
            "outputIdentifier": "gamma ",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-2"
          },
          {
            "id": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
            "edgeId": "91e7b3f3-56e3-433f-8bd1-d796fbfb5aee",
            "outputIdentifier": "gamma",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleInputDynamic9c1b0b6b-b354-4c17-8856-de7f9544bd7c-0"
          }
        ],
        "children": [
          "4d61dc54-a297-4671-a896-2245b9c064ad",
          "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
          "1713c56c-7f46-4c52-bbfa-00fcec55bd70"
        ],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": false,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q912842"
        ],
        "inputTypes": [
          "Number"
        ],
        "outputTypes": [],
        "numberClassicalInputs": 3,
        "condition": "iterations < 20"
      },
      "width": 1700,
      "height": 1160,
      "positionAbsolute": {
        "x": 690,
        "y": -15
      },
      "dragging": true
    },
    {
      "id": "4d61dc54-a297-4671-a896-2245b9c064ad",
      "type": "algorithmNode",
      "position": {
        "x": 315,
        "y": 585
      },
      "data": {
        "label": "QAOA Operator",
        "inputs": [
          {
            "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
            "edgeId": "3aa0f81f-8c1e-4d90-829c-e97001fafc32",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput04d61dc54-a297-4671-a896-2245b9c064ad"
          },
          {
            "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
            "edgeId": "3dddf00d-957c-423d-9822-9ee6ccf13187",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput14d61dc54-a297-4671-a896-2245b9c064ad"
          }
        ],
        "children": [
          "4d61dc54-a297-4671-a896-2245b9c064ad",
          "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
          "1713c56c-7f46-4c52-bbfa-00fcec55bd70"
        ],
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
          "q912842"
        ],
        "inputTypes": [
          "any",
          "any"
        ],
        "outputTypes": {
          "0": "quantum register"
        },
        "numberClassicalInputs": 2,
        "numberQuantumOutputs": 1,
        "position": {
          "x": 330,
          "y": 615
        },
        "scope": "if",
        "outputs": [
          {
            "identifier": "circuit",
            "size": "",
            "type": "quantum"
          }
        ],
        "outputIdentifier": "circuit"
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 1005,
        "y": 570
      },
      "dragging": true,
      "parentNode": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "extent": "parent"
    },
    {
      "id": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "type": "classicalAlgorithmNode",
      "position": {
        "x": 1155,
        "y": 270
      },
      "data": {
        "label": "Optimizer",
        "inputs": [
          {
            "id": "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
            "edgeId": "b53f8579-e695-4cb3-a4bb-11b49098c459",
            "outputIdentifier": "measurements",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput01713c56c-7f46-4c52-bbfa-00fcec55bd70"
          },
          {
            "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
            "edgeId": "059b635b-4564-43a1-95d3-17c3461ccc07",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput11713c56c-7f46-4c52-bbfa-00fcec55bd70"
          },
          {
            "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
            "edgeId": "95e7d018-428d-4041-a82e-ae39c461c18f",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput21713c56c-7f46-4c52-bbfa-00fcec55bd70"
          },
          {
            "id": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
            "edgeId": "4c3ccf35-e957-4ca3-a1bf-752b62a685cf",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "classicalHandleOperationInput31713c56c-7f46-4c52-bbfa-00fcec55bd70"
          }
        ],
        "children": [
          "4d61dc54-a297-4671-a896-2245b9c064ad",
          "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
          "1713c56c-7f46-4c52-bbfa-00fcec55bd70"
        ],
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
          "q912842"
        ],
        "inputTypes": [
          "array",
          "any",
          "any",
          "any"
        ],
        "outputTypes": {
          "0": "any",
          "1": "any"
        },
        "numberClassicalInputs": 4,
        "numberClassicalOutputs": 2,
        "outputs": [
          {
            "identifier": "beta ",
            "size": "",
            "type": "classical"
          },
          {
            "identifier": "gamma",
            "size": "",
            "type": "classical"
          }
        ],
        "outputIdentifier": "beta ",
        "position": {
          "x": 1245,
          "y": 270
        },
        "scope": "if"
      },
      "width": 320,
      "height": 740,
      "positionAbsolute": {
        "x": 1845,
        "y": 255
      },
      "dragging": true,
      "parentNode": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "extent": "parent"
    },
    {
      "id": "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
      "type": "measurementNode",
      "position": {
        "x": 720,
        "y": 525
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "4d61dc54-a297-4671-a896-2245b9c064ad",
            "edgeId": "1cf12182-6277-4ac0-87d7-bba4db3385f2",
            "outputIdentifier": "circuit",
            "identifiers": [
              "q912842"
            ],
            "targetHandle": "quantumHandleMeasurementInput0b6be33f6-e910-46a3-97ac-29bc14b55dd6"
          }
        ],
        "children": [
          "4d61dc54-a297-4671-a896-2245b9c064ad",
          "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
          "1713c56c-7f46-4c52-bbfa-00fcec55bd70"
        ],
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
          "q912842"
        ],
        "indices": "",
        "outputIdentifier": "measurements",
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [
          "array",
          "quantum register"
        ],
        "position": {
          "x": 705,
          "y": 690
        },
        "scope": "if",
        "outputs": [
          {
            "identifier": "measurements",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1410,
        "y": 510
      },
      "dragging": true,
      "parentNode": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "extent": "parent"
    }
  
  ],
  initialEdges: [
    {
      "source": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "sourceHandle": "classicalHandleclassicalAlgorithmNodeOutput11713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "target": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "targetHandle": "classicalHandleInputDynamic9c1b0b6b-b354-4c17-8856-de7f9544bd7c-1",
      "type": "classicalEdge",
      "id": "3fc74f7f-7a08-4ad5-ad4e-7eeb35fcd7f8",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "sourceHandle": "classicalHandleclassicalAlgorithmNodeOutput01713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "target": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "targetHandle": "classicalHandleInputDynamic9c1b0b6b-b354-4c17-8856-de7f9544bd7c-0",
      "type": "classicalEdge",
      "id": "91e7b3f3-56e3-433f-8bd1-d796fbfb5aee",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "sourceHandle": "classicalHandleOutputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-2",
      "target": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "targetHandle": "classicalHandleOperationInput31713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "type": "classicalEdge",
      "id": "4c3ccf35-e957-4ca3-a1bf-752b62a685cf",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "sourceHandle": "classicalHandleOutputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-1",
      "target": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "targetHandle": "classicalHandleOperationInput21713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "type": "classicalEdge",
      "id": "95e7d018-428d-4041-a82e-ae39c461c18f",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "sourceHandle": "classicalHandleOutputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-0",
      "target": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "targetHandle": "classicalHandleOperationInput11713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "type": "classicalEdge",
      "id": "059b635b-4564-43a1-95d3-17c3461ccc07",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
      "sourceHandle": "classicalHandlemeasurementNodeOutput0b6be33f6-e910-46a3-97ac-29bc14b55dd6",
      "target": "1713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "targetHandle": "classicalHandleOperationInput01713c56c-7f46-4c52-bbfa-00fcec55bd70",
      "type": "classicalEdge",
      "id": "b53f8579-e695-4cb3-a4bb-11b49098c459",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "4d61dc54-a297-4671-a896-2245b9c064ad",
      "sourceHandle": "quantumHandlealgorithmNodeOutput04d61dc54-a297-4671-a896-2245b9c064ad",
      "target": "b6be33f6-e910-46a3-97ac-29bc14b55dd6",
      "targetHandle": "quantumHandleMeasurementInput0b6be33f6-e910-46a3-97ac-29bc14b55dd6",
      "type": "quantumEdge",
      "id": "1cf12182-6277-4ac0-87d7-bba4db3385f2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "sourceHandle": "classicalHandleOutputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-2",
      "target": "4d61dc54-a297-4671-a896-2245b9c064ad",
      "targetHandle": "classicalHandleOperationInput14d61dc54-a297-4671-a896-2245b9c064ad",
      "type": "classicalEdge",
      "id": "3dddf00d-957c-423d-9822-9ee6ccf13187",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "sourceHandle": "classicalHandleOutputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-1",
      "target": "4d61dc54-a297-4671-a896-2245b9c064ad",
      "targetHandle": "classicalHandleOperationInput04d61dc54-a297-4671-a896-2245b9c064ad",
      "type": "classicalEdge",
      "id": "3aa0f81f-8c1e-4d90-829c-e97001fafc32",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "bd2e32e0-b4cf-401a-b90f-77ba6429d8e1",
      "sourceHandle": "classicalHandleDataTypeOutput0bd2e32e0-b4cf-401a-b90f-77ba6429d8e1",
      "target": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-2",
      "type": "classicalEdge",
      "id": "4405111f-aa75-4d28-8bf1-5d882d5070f6",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "a15ea0d4-111e-4ca4-9368-07a3994bfca4",
      "sourceHandle": "classicalHandleDataTypeOutput0a15ea0d4-111e-4ca4-9368-07a3994bfca4",
      "target": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-1",
      "type": "classicalEdge",
      "id": "b165a965-98e6-4bc9-8f71-3569890044a2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "0faacff4-754c-426f-8f9b-8a454897a741",
      "sourceHandle": "classicalHandleDataTypeOutput00faacff4-754c-426f-8f9b-8a454897a741",
      "target": "9c1b0b6b-b354-4c17-8856-de7f9544bd7c",
      "targetHandle": "classicalHandleInputInitialization9c1b0b6b-b354-4c17-8856-de7f9544bd7c-0",
      "type": "classicalEdge",
      "id": "26f2ff02-0d07-4b08-b55b-bc4acaae499c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }
  ],
  viewport: [{
    "x": 99.72900963432562,
    "y": 136.73691807572823,
    "zoom": 0.5
  }]
}

export const grover_algorithm =
{
 metadata: [{
    "version": "1.0.0",
    "name": "My Model",
    "description": "Grover’s Algorithm is a quantum search algorithm designed to find a marked item in an unsorted database with quadratic speedup over classical search. It starts by putting all qubits into an equal superposition, then repeatedly applies a combination of an oracle (which marks the desired state) and a diffusion operator (which amplifies the probability of the marked state). After a few iterations, measuring the qubits yields the target state with high probability.",
    "author": "",
    "containsPlaceholder": true,
    "id": "flow-1768914868108",
    "timestamp": "2026-01-20T13:14:28.108Z"
  }],
  nodes: [
    {
      "id": "9900bcb4-811d-4308-9362-e838b85c19ec",
      "type": "dataTypeNode",
      "position": {
        "x": 60,
        "y": 60
      },
      "data": {
        "label": "Number",
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
          "q951356"
        ],
        "dataType": "Number",
        "value": "N",
        "outputIdentifier": "iterations",
        "inputTypes": [],
        "outputTypes": {
          "0": "Number"
        },
        "outputs": [
          {
            "identifier": "iterations",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 60,
        "y": 60
      },
      "dragging": true,
      "hidden": false
    },
    {
      "id": "7ee95b8f-261f-4788-9991-91df9e171f5d",
      "type": "dataTypeNode",
      "position": {
        "x": 45,
        "y": 435
      },
      "data": {
        "label": "Number",
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
          "q649623"
        ],
        "dataType": "Number",
        "value": "",
        "outputIdentifier": "element",
        "inputTypes": [],
        "outputTypes": {
          "0": "Number"
        },
        "outputs": [
          {
            "identifier": "element",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": 45,
        "y": 435
      },
      "dragging": true,
      "hidden": false
    },
    {
      "id": "8bfb9329-1007-41dc-8449-90a896778fd5",
      "type": "statePreparationNode",
      "position": {
        "x": 135,
        "y": 765
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
          "q877539"
        ],
        "quantumStateName": "Uniform Superposition",
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
        "x": 135,
        "y": 765
      },
      "dragging": true,
      "hidden": false
    },
    {
      "id": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "type": "controlStructureNode",
      "position": {
        "x": 855,
        "y": 90
      },
      "data": {
        "label": "Repeat",
        "inputs": [
          {
            "id": "8bfb9329-1007-41dc-8449-90a896778fd5",
            "edgeId": "3a106742-cbd7-4f31-adc0-144caec36d10",
            "outputIdentifier": "",
            "identifiers": [
              "q877539"
            ],
            "targetHandle": "quantumHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-0"
          },
          {
            "id": "9900bcb4-811d-4308-9362-e838b85c19ec",
            "edgeId": "22d291e3-ebf1-45be-85d0-f0d2f28a7f2c",
            "outputIdentifier": "iterations",
            "identifiers": [
              "q951356"
            ],
            "targetHandle": "classicalHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-0"
          },
          {
            "id": "7ee95b8f-261f-4788-9991-91df9e171f5d",
            "edgeId": "741180b1-8eb8-40e4-a522-a2a0a724af85",
            "outputIdentifier": "element",
            "identifiers": [
              "q649623"
            ],
            "targetHandle": "classicalHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-1"
          },
          {
            "id": "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
            "edgeId": "7c53cb3b-a04d-45fc-a18c-5caf09eb30d2",
            "identifiers": [
              "q558227"
            ],
            "targetHandle": "quantumHandleInputDynamice18bb8b0-952b-46ed-8a4b-769bce767a9f-0"
          }
        ],
        "children": [
          "85a1ac30-f089-4271-afb1-fb98bdaae174",
          "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f"
        ],
        "implementation": "",
        "implementationType": "",
        "uncomputeImplementationType": "",
        "uncomputeImplementation": "",
        "completionGuaranteed": false,
        "compactOptions": [
          true,
          false
        ],
        "identifiers": [
          "q558227"
        ],
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": [],
        "numberClassicalInputs": 2,
        "condition": "N"
      },
      "width": 1900,
      "height": 1330,
      "positionAbsolute": {
        "x": 855,
        "y": 90
      },
      "dragging": true
    },
    {
      "id": "85a1ac30-f089-4271-afb1-fb98bdaae174",
      "type": "algorithmNode",
      "position": {
        "x": 375,
        "y": 330
      },
      "data": {
        "label": "Oracle",
        "inputs": [
          {
            "id": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
            "edgeId": "fbb6b130-4336-47f7-8dde-c20832fcc88c",
            "identifiers": [
              "q649623"
            ],
            "targetHandle": "classicalHandleOperationInput085a1ac30-f089-4271-afb1-fb98bdaae174"
          }
        ],
        "children": [
          "85a1ac30-f089-4271-afb1-fb98bdaae174",
          "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f"
        ],
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
          "q558227"
        ],
        "inputTypes": [
          "any"
        ],
        "outputTypes": {
          "0": "quantum register"
        },
        "numberClassicalInputs": 1,
        "numberQuantumInputs": 1,
        "position": {
          "x": 375,
          "y": 330
        },
        "scope": "if",
        "numberQuantumOutputs": 1
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 1230,
        "y": 420
      },
      "dragging": true,
      "parentNode": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "extent": "parent"
    },
    {
      "id": "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
      "type": "algorithmNode",
      "position": {
        "x": 1020,
        "y": 315
      },
      "data": {
        "label": "Diffusion Operator",
        "inputs": [
          {
            "id": "85a1ac30-f089-4271-afb1-fb98bdaae174",
            "edgeId": "c081ddaf-fe2a-4679-b6ad-0a16eaa09c4e",
            "identifiers": [
              "q558227"
            ],
            "targetHandle": "quantumHandleOperationInput0b72693a0-69a6-4d3a-b2d1-a686e2a9f25f"
          }
        ],
        "children": [
          "85a1ac30-f089-4271-afb1-fb98bdaae174",
          "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f"
        ],
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
          "q558227"
        ],
        "inputTypes": [
          "quantum register"
        ],
        "outputTypes": {
          "0": "quantum register"
        },
        "numberQuantumInputs": 1,
        "numberQuantumOutputs": 1,
        "position": {
          "x": 1020,
          "y": 315
        },
        "scope": "if"
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 1875,
        "y": 405
      },
      "dragging": true,
      "parentNode": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "extent": "parent"
    },
    {
      "id": "dd7bd0e3-c2a7-4b95-9058-7558aff8fed6",
      "type": "measurementNode",
      "position": {
        "x": 3015,
        "y": 525
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
            "edgeId": "745f78f7-8dc8-4b5a-aac8-64460d3c12d4",
            "identifiers": [
              "q558227"
            ],
            "targetHandle": "quantumHandleMeasurementInput0dd7bd0e3-c2a7-4b95-9058-7558aff8fed6"
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
          "q558227"
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
        "x": 3015,
        "y": 525
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "sourceHandle": "quantumHandleOutputDynamice18bb8b0-952b-46ed-8a4b-769bce767a9f-0",
      "target": "dd7bd0e3-c2a7-4b95-9058-7558aff8fed6",
      "targetHandle": "quantumHandleMeasurementInput0dd7bd0e3-c2a7-4b95-9058-7558aff8fed6",
      "type": "quantumEdge",
      "id": "745f78f7-8dc8-4b5a-aac8-64460d3c12d4",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
      "sourceHandle": "quantumHandlealgorithmNodeOutput0b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
      "target": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "targetHandle": "quantumHandleInputDynamice18bb8b0-952b-46ed-8a4b-769bce767a9f-0",
      "type": "quantumEdge",
      "id": "7c53cb3b-a04d-45fc-a18c-5caf09eb30d2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "85a1ac30-f089-4271-afb1-fb98bdaae174",
      "sourceHandle": "quantumHandlealgorithmNodeOutput085a1ac30-f089-4271-afb1-fb98bdaae174",
      "target": "b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
      "targetHandle": "quantumHandleOperationInput0b72693a0-69a6-4d3a-b2d1-a686e2a9f25f",
      "type": "quantumEdge",
      "id": "c081ddaf-fe2a-4679-b6ad-0a16eaa09c4e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "sourceHandle": "classicalHandleOutputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-1",
      "target": "85a1ac30-f089-4271-afb1-fb98bdaae174",
      "targetHandle": "classicalHandleOperationInput085a1ac30-f089-4271-afb1-fb98bdaae174",
      "type": "classicalEdge",
      "id": "fbb6b130-4336-47f7-8dde-c20832fcc88c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "7ee95b8f-261f-4788-9991-91df9e171f5d",
      "sourceHandle": "classicalHandleDataTypeOutput07ee95b8f-261f-4788-9991-91df9e171f5d",
      "target": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "targetHandle": "classicalHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-1",
      "type": "classicalEdge",
      "id": "741180b1-8eb8-40e4-a522-a2a0a724af85",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "9900bcb4-811d-4308-9362-e838b85c19ec",
      "sourceHandle": "classicalHandleDataTypeOutput09900bcb4-811d-4308-9362-e838b85c19ec",
      "target": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "targetHandle": "classicalHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-0",
      "type": "classicalEdge",
      "id": "22d291e3-ebf1-45be-85d0-f0d2f28a7f2c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "8bfb9329-1007-41dc-8449-90a896778fd5",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput08bfb9329-1007-41dc-8449-90a896778fd5",
      "target": "e18bb8b0-952b-46ed-8a4b-769bce767a9f",
      "targetHandle": "quantumHandleInputInitializatione18bb8b0-952b-46ed-8a4b-769bce767a9f-0",
      "type": "quantumEdge",
      "id": "3a106742-cbd7-4f31-adc0-144caec36d10",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  viewport: [{
    "x": -7.5,
    "y": 62.5,
    "zoom": 0.5
  }]
}