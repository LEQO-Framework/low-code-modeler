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
  nodes: [
    {
      "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "type": "controlStructureNode",
      "position": {
        "x": 570,
        "y": 255
      },
      "data": {
        "label": "Repeat",
        "inputs": [
          {
            "id": "6e292ea7-333b-41a5-9b9e-c4cfcc3a6229",
            "identifiers": [
              "q291123"
            ],
            "outputIdentifier": ""
          },
          {
            "id": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
            "identifiers": [
              "q593946"
            ],
            "outputIdentifier": "iterations"
          },
          {
            "id": "d6a500df-16f6-40fe-a293-19430e54a8cd",
            "identifiers": [
              "q629486"
            ]
          },
          {
            "id": "503ee073-f62d-4c3e-a804-efc0eb2b7a5d",
            "identifiers": [
              "q521810"
            ],
            "outputIdentifier": "beta"
          },
          {
            "id": "d4275843-406e-4ab3-ab95-5083fd00a55c",
            "identifiers": [
              "q971459"
            ],
            "outputIdentifier": "gamma"
          },
          {
            "id": "022f6fad-cc55-40d0-8319-f94798a36150",
            "identifiers": [
              "q908288"
            ],
            "outputIdentifier": "beta ",
            "label": "beta "
          },
          {
            "id": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
            "outputIdentifier": "beta ",
            "identifiers": [
              "q360922"
            ],
            "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-0"
          },
          {
            "id": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
            "outputIdentifier": "gamma ",
            "identifiers": [
              "q360922"
            ],
            "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-1"
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff",
          "5cad42e8-eb9f-4745-acfa-c27e826b24b5",
          "0b4fa2c4-f974-4d10-b336-7c0c6536d851"
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
          "q410358"
        ],
        "condition": "iterations < 20",
        "numberQuantumInputs": 1,
        "numberClassicalInputs": 3
      },
      "width": 1700,
      "height": 1160,
      "positionAbsolute": {
        "x": 570,
        "y": 255
      },
      "dragging": true
    },
    {
      "id": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "algorithmNode",
      "position": {
        "x": 225,
        "y": 600
      },
      "data": {
        "label": "QAOA Operator",
        "inputs": [
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ]
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff",
          "5cad42e8-eb9f-4745-acfa-c27e826b24b5",
          "0b4fa2c4-f974-4d10-b336-7c0c6536d851"
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
          "q969237"
        ],
        "numberQuantumInputs": 0,
        "numberQuantumOutputs": 1,
        "position": {
          "x": 225,
          "y": 105
        },
        "scope": "if",
        "numberClassicalInputs": 2,
        "outputIdentifier": "circuit",
        "outputs": [
          {
            "identifier": "circuit",
            "size": "",
            "type": "quantum"
          }
        ]
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 795,
        "y": 855
      },
      "selected": false,
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    },
    {
      "id": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "type": "dataTypeNode",
      "position": {
        "x": -390,
        "y": 120
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
          "q593946"
        ],
        "dataType": "Number",
        "value": "",
        "outputIdentifier": "iterations",
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
        "x": -390,
        "y": 120
      },
      "dragging": true
    },
    {
      "id": "503ee073-f62d-4c3e-a804-efc0eb2b7a5d",
      "type": "dataTypeNode",
      "position": {
        "x": -375,
        "y": 465
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
          "q521810"
        ],
        "dataType": "Array",
        "value": "",
        "outputIdentifier": "beta",
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
        "x": -375,
        "y": 465
      },
      "dragging": true
    },
    {
      "id": "d4275843-406e-4ab3-ab95-5083fd00a55c",
      "type": "dataTypeNode",
      "position": {
        "x": -375,
        "y": 810
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
          "q971459"
        ],
        "dataType": "Array",
        "value": "",
        "outputIdentifier": "gamma",
        "outputs": [
          {
            "identifier": "gamma",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -375,
        "y": 810
      },
      "dragging": true
    },
    {
      "id": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "type": "measurementNode",
      "position": {
        "x": 660,
        "y": 510
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "e75184d3-1085-4110-bcbf-3f7f1a667072",
            "identifiers": [
              "q969237"
            ],
            "outputIdentifier": "circuit"
          },
          {
            "id": "e75184d3-1085-4110-bcbf-3f7f1a667072",
            "outputIdentifier": "circuit",
            "identifiers": [
              "q969237"
            ],
            "targetHandle": "quantumHandleMeasurementInput0c163f878-1c71-4c89-99f8-8ddda21aa86b"
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff",
          "5cad42e8-eb9f-4745-acfa-c27e826b24b5",
          "0b4fa2c4-f974-4d10-b336-7c0c6536d851"
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
          "q695436"
        ],
        "indices": "",
        "outputIdentifier": "measurements",
        "position": {
          "x": 615,
          "y": 75
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
        "x": 1230,
        "y": 765
      },
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    },
    {
      "id": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "type": "classicalAlgorithmNode",
      "position": {
        "x": 1050,
        "y": 150
      },
      "data": {
        "label": "Optimizer",
        "inputs": [
          {
            "id": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
            "outputIdentifier": "measurements",
            "identifiers": [
              "q695436"
            ],
            "targetHandle": "classicalHandleOperationInput00b4fa2c4-f974-4d10-b336-7c0c6536d851"
          },
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ],
            "targetHandle": "classicalHandleOperationInput10b4fa2c4-f974-4d10-b336-7c0c6536d851"
          },
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ],
            "targetHandle": "classicalHandleOperationInput20b4fa2c4-f974-4d10-b336-7c0c6536d851"
          },
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ],
            "targetHandle": "classicalHandleOperationInput30b4fa2c4-f974-4d10-b336-7c0c6536d851"
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff",
          "5cad42e8-eb9f-4745-acfa-c27e826b24b5",
          "0b4fa2c4-f974-4d10-b336-7c0c6536d851"
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
          "q360922"
        ],
        "numberClassicalInputs": 4,
        "numberClassicalOutputs": 2,
        "outputs": [
          {
            "identifier": "beta ",
            "size": "",
            "type": "classical"
          },
          {
            "identifier": "gamma ",
            "size": "",
            "type": "classical"
          }
        ],
        "outputIdentifier": "gamma ",
        "position": {
          "x": 1050,
          "y": 150
        },
        "scope": "if"
      },
      "width": 320,
      "height": 740,
      "positionAbsolute": {
        "x": 1620,
        "y": 405
      },
      "selected": true,
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    }
  ],
  initialEdges: [
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "target": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "targetHandle": "classicalHandleOperationInput30b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "type": "classicalEdge",
      "id": "06717921-c96a-4cf8-bf7f-5f2e09ba2650",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-1",
      "target": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "targetHandle": "classicalHandleOperationInput20b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "type": "classicalEdge",
      "id": "9c637601-e506-4ad0-a7db-0895ddffc852",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "target": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "targetHandle": "classicalHandleOperationInput10b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "type": "classicalEdge",
      "id": "718e8e50-c4f7-4397-bf1b-6c5ac6b9f641",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "sourceHandle": "classicalHandlemeasurementNodeOutput0c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "target": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "targetHandle": "classicalHandleOperationInput00b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "type": "classicalEdge",
      "id": "9d923ff8-092b-4974-ba31-a7d8286a726b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "sourceHandle": "classicalHandleclassicalAlgorithmNodeOutput10b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-1",
      "type": "classicalEdge",
      "id": "5acf8c67-a020-4eef-b3f9-1d0fcc4ad049",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "0b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "sourceHandle": "classicalHandleclassicalAlgorithmNodeOutput00b4fa2c4-f974-4d10-b336-7c0c6536d851",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "classicalEdge",
      "id": "406c1d86-b2d0-4667-92be-4ef8b1fc8c32",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "sourceHandle": "quantumHandlealgorithmNodeOutput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "target": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "targetHandle": "quantumHandleMeasurementInput0c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "type": "quantumEdge",
      "id": "69bf3209-2d56-4ca8-a5ca-81f47419c901",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "target": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "targetHandle": "classicalHandleOperationInput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "classicalEdge",
      "id": "64958de5-e62e-4ee7-96bc-ba316039c580",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-1",
      "target": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "targetHandle": "classicalHandleOperationInput1e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "classicalEdge",
      "id": "db023e27-710e-481e-8d3c-2a63a7431ad5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      },
      "selected": false
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "target": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "targetHandle": "classicalHandleOperationInput2e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "classicalEdge",
      "id": "02acb5cc-c11f-401c-844a-a1df88ac5bb0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      },
      "selected": false
    },
    {
      "source": "d4275843-406e-4ab3-ab95-5083fd00a55c",
      "sourceHandle": "classicalHandleDataTypeOutput0d4275843-406e-4ab3-ab95-5083fd00a55c",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "type": "classicalEdge",
      "id": "0e15e3c4-b6c0-4482-a488-a8e713e2e0f2",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "503ee073-f62d-4c3e-a804-efc0eb2b7a5d",
      "sourceHandle": "classicalHandleDataTypeOutput0503ee073-f62d-4c3e-a804-efc0eb2b7a5d",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-1",
      "type": "classicalEdge",
      "id": "37e2d0cc-0cec-4f0f-adaa-36f5321933f0",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "quantumHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "target": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "targetHandle": "quantumHandleOperationInput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "quantumEdge",
      "id": "91e9ca20-4d36-4e59-a61d-ca41e7b3323b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "sourceHandle": "classicalHandleDataTypeOutput0d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "classicalEdge",
      "id": "9649dd7d-09ea-46d4-ab0d-9e8d4538a413",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    }
  ],
  "viewport": [{
    "x": -201.5,
    "y": 44.25,
    "zoom": 0.5
  }]
}

export const grover_algorithm =
{
  nodes: [
    {
      "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "type": "controlStructureNode",
      "position": {
        "x": 345,
        "y": 300
      },
      "data": {
        "label": "Repeat",
        "inputs": [
          {
            "id": "6e292ea7-333b-41a5-9b9e-c4cfcc3a6229",
            "identifiers": [
              "q291123"
            ],
            "outputIdentifier": ""
          },
          {
            "id": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
            "identifiers": [
              "q593946"
            ],
            "outputIdentifier": "N"
          },
          {
            "id": "d6a500df-16f6-40fe-a293-19430e54a8cd",
            "identifiers": [
              "q629486"
            ]
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd"
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
          "q410358"
        ],
        "condition": "N"
      },
      "width": 2000,
      "height": 800,
      "positionAbsolute": {
        "x": 345,
        "y": 300
      }
    },
    {
      "id": "6e292ea7-333b-41a5-9b9e-c4cfcc3a6229",
      "type": "statePreparationNode",
      "position": {
        "x": -270,
        "y": 450
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
          "q291123"
        ],
        "quantumStateName": "Uniform Superposition",
        "size": "",
        "outputIdentifier": "",
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
        "x": -270,
        "y": 450
      },
      "dragging": true
    },
    {
      "id": "2faf70a5-4451-450d-b305-f02b4d6c6b45",
      "type": "measurementNode",
      "position": {
        "x": 2160,
        "y": 375
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ]
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
          "q587370"
        ],
        "indices": "",
        "outputIdentifier": ""
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 2160,
        "y": 375
      },
      "dragging": true
    },
    {
      "id": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "algorithmNode",
      "position": {
        "x": 225,
        "y": 105
      },
      "data": {
        "label": "Oracle",
        "inputs": [
          {
            "id": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
            "identifiers": [
              "q410358"
            ]
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd"
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
          "q969237"
        ],
        "numberQuantumInputs": 1,
        "numberQuantumOutputs": 1,
        "position": {
          "x": 225,
          "y": 105
        },
        "scope": "if"
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 570,
        "y": 405
      },
      "selected": false,
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    },
    {
      "id": "d6a500df-16f6-40fe-a293-19430e54a8cd",
      "type": "algorithmNode",
      "position": {
        "x": 795,
        "y": 90
      },
      "data": {
        "label": "Diffusion Operator",
        "inputs": [
          {
            "id": "e75184d3-1085-4110-bcbf-3f7f1a667072",
            "identifiers": [
              "q969237"
            ]
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd"
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
          "q629486"
        ],
        "numberQuantumInputs": 1,
        "numberQuantumOutputs": 1,
        "position": {
          "x": 630,
          "y": 105
        },
        "scope": "if"
      },
      "width": 320,
      "height": 373,
      "positionAbsolute": {
        "x": 1140,
        "y": 390
      },
      "selected": true,
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    },
    {
      "id": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "type": "dataTypeNode",
      "position": {
        "x": -375,
        "y": 120
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
          "q593946"
        ],
        "dataType": "Number",
        "value": "",
        "outputIdentifier": "N",
        "outputs": [
          {
            "identifier": "N",
            "size": "",
            "type": "classical"
          }
        ]
      },
      "width": 450,
      "height": 270,
      "positionAbsolute": {
        "x": -375,
        "y": 120
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "quantumHandleOutputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "target": "2faf70a5-4451-450d-b305-f02b4d6c6b45",
      "targetHandle": "quantumHandleMeasurementInput02faf70a5-4451-450d-b305-f02b4d6c6b45",
      "type": "quantumEdge",
      "id": "2151d77c-45d7-416e-88aa-7c092ee2f140",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d6a500df-16f6-40fe-a293-19430e54a8cd",
      "sourceHandle": "quantumHandlealgorithmNodeOutput0d6a500df-16f6-40fe-a293-19430e54a8cd",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "quantumHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "quantumEdge",
      "id": "091d51fc-f106-473e-8d27-5b398a4d119c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "sourceHandle": "quantumHandlealgorithmNodeOutput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "target": "d6a500df-16f6-40fe-a293-19430e54a8cd",
      "targetHandle": "quantumHandleOperationInput0d6a500df-16f6-40fe-a293-19430e54a8cd",
      "type": "quantumEdge",
      "id": "b4280487-3cd9-4147-a871-e094af269262",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "sourceHandle": "quantumHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "target": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "targetHandle": "quantumHandleOperationInput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "type": "quantumEdge",
      "id": "91e9ca20-4d36-4e59-a61d-ca41e7b3323b",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "sourceHandle": "classicalHandleDataTypeOutput0d76d8e7c-c641-4956-90cc-fc67c8c7224a",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "classicalEdge",
      "id": "9649dd7d-09ea-46d4-ab0d-9e8d4538a413",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "6e292ea7-333b-41a5-9b9e-c4cfcc3a6229",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput06e292ea7-333b-41a5-9b9e-c4cfcc3a6229",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "quantumHandleInputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "quantumEdge",
      "id": "29349e03-a63f-479b-a937-48cd14a7d592",
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
    "x": 322.2505861282349,
    "y": 74,
    "zoom": 0.5
  }]
}