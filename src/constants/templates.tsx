export const swap_test_algorithm =
{
nodes: [
    {
      "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "type": "gateNode",
      "position": {
        "x": -60,
        "y": 120
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
          "q909422"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -60,
        "y": 120
      },
      "dragging": true
    },
    {
      "id": "49f48037-854e-4161-8073-28af734d338f",
      "type": "statePreparationNode",
      "position": {
        "x": -270,
        "y": 300
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
          "q782317"
        ],
        "quantumStateName": "Custom State",
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
        "y": 300
      },
      "dragging": true
    },
    {
      "id": "19cd159d-187e-4f2a-bc5f-f71dbb7a5eea",
      "type": "statePreparationNode",
      "position": {
        "x": -270,
        "y": 735
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
          "q541195"
        ],
        "quantumStateName": "Custom State",
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
        "y": 735
      },
      "dragging": true
    },
    {
      "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
      "type": "gateNode",
      "position": {
        "x": 390,
        "y": 450
      },
      "data": {
        "label": "CSWAP",
        "inputs": [
          {
            "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
            "identifiers": [
              "q909422"
            ]
          },
          {
            "id": "49f48037-854e-4161-8073-28af734d338f",
            "identifiers": [
              "q782317"
            ],
            "outputIdentifier": ""
          },
          {
            "id": "19cd159d-187e-4f2a-bc5f-f71dbb7a5eea",
            "identifiers": [
              "q541195"
            ],
            "outputIdentifier": ""
          },
          {
            "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
            "identifiers": [
              "q136470"
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
          "q240223"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 390,
        "y": 450
      }
    },
    {
      "id": "345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "measurementNode",
      "position": {
        "x": 945,
        "y": 330
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
            ]
          },
          {
            "id": "31831e00-1abf-4112-b272-e1d8db8432df",
            "identifiers": [
              "q380011"
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
          "q947170"
        ],
        "indices": "",
        "outputIdentifier": ""
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 945,
        "y": 330
      },
      "dragging": true
    },
    {
      "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "gateNode",
      "position": {
        "x": 180,
        "y": 180
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
            "identifiers": [
              "q909422"
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
          "q136470"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 180,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "31831e00-1abf-4112-b272-e1d8db8432df",
      "type": "gateNode",
      "position": {
        "x": 660,
        "y": 435
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
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
          "q380011"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 660,
        "y": 435
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "31831e00-1abf-4112-b272-e1d8db8432df",
      "sourceHandle": "quantumHandleGateOutput031831e00-1abf-4112-b272-e1d8db8432df",
      "target": "345da37d-e075-490e-995f-df27db8b0fd2",
      "targetHandle": "quantumHandleMeasurementInput0345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "quantumEdge",
      "id": "f61d306e-bf55-41f6-ba55-5ebb0f5495b5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "6be1dca3-f128-4991-b962-4b0b22842dc0",
      "sourceHandle": "quantumHandleGateOutput06be1dca3-f128-4991-b962-4b0b22842dc0",
      "target": "31831e00-1abf-4112-b272-e1d8db8432df",
      "targetHandle": "quantumHandleGateInput031831e00-1abf-4112-b272-e1d8db8432df",
      "type": "quantumEdge",
      "id": "536d7b4e-70a5-4530-9258-6307ad3cb2dc",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "sourceHandle": "quantumHandleGateOutput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "target": "6be1dca3-f128-4991-b962-4b0b22842dc0",
      "targetHandle": "quantumHandleGateInput06be1dca3-f128-4991-b962-4b0b22842dc0",
      "type": "quantumEdge",
      "id": "09990469-29ad-44ba-9287-d2074d83660e",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "sourceHandle": "quantumHandleGateOutput00074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "target": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "targetHandle": "quantumHandleGateInput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "quantumEdge",
      "id": "245ba376-c18a-4c3f-a949-8637728efb19",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "19cd159d-187e-4f2a-bc5f-f71dbb7a5eea",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput019cd159d-187e-4f2a-bc5f-f71dbb7a5eea",
      "target": "6be1dca3-f128-4991-b962-4b0b22842dc0",
      "targetHandle": "quantumHandleGateInput26be1dca3-f128-4991-b962-4b0b22842dc0",
      "type": "quantumEdge",
      "id": "57b9b8ea-b174-400c-8545-5d29f6165856",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "49f48037-854e-4161-8073-28af734d338f",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput049f48037-854e-4161-8073-28af734d338f",
      "target": "6be1dca3-f128-4991-b962-4b0b22842dc0",
      "targetHandle": "quantumHandleGateInput16be1dca3-f128-4991-b962-4b0b22842dc0",
      "type": "quantumEdge",
      "id": "b8a1874b-8b1a-407a-a933-48116fc1a129",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  viewport: [ {
    "x": -86.61945935962045,
    "y": 127.58746057432953,
    "zoom": 0.6998936216571533
  }]
}


export const hadamard_test_real_part_algorithm =
{
  nodes: [
    {
      "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "type": "gateNode",
      "position": {
        "x": -60,
        "y": 120
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
          "q909422"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -60,
        "y": 120
      },
      "dragging": true
    },
    {
      "id": "49f48037-854e-4161-8073-28af734d338f",
      "type": "statePreparationNode",
      "position": {
        "x": -270,
        "y": 300
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
          "q782317"
        ],
        "quantumStateName": "Custom State",
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
        "y": 300
      },
      "dragging": true
    },
    {
      "id": "345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "measurementNode",
      "position": {
        "x": 945,
        "y": 330
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
            ]
          },
          {
            "id": "31831e00-1abf-4112-b272-e1d8db8432df",
            "identifiers": [
              "q380011"
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
          "q947170"
        ],
        "indices": "",
        "outputIdentifier": ""
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 945,
        "y": 330
      },
      "dragging": true
    },
    {
      "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "gateNode",
      "position": {
        "x": 180,
        "y": 180
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
            "identifiers": [
              "q909422"
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
          "q136470"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 180,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "31831e00-1abf-4112-b272-e1d8db8432df",
      "type": "gateNode",
      "position": {
        "x": 660,
        "y": 435
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
            ]
          },
          {
            "id": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
            "identifiers": [
              "q298005",
              "q936261"
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
          "q380011"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 660,
        "y": 435
      },
      "dragging": true
    },
    {
      "id": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "gateNode",
      "position": {
        "x": 405,
        "y": 375
      },
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
            "identifiers": [
              "q136470"
            ]
          },
          {
            "id": "49f48037-854e-4161-8073-28af734d338f",
            "identifiers": [
              "q782317"
            ],
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
          "q298005",
          "q936261"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 405,
        "y": 375
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "sourceHandle": "quantumHandleGateOutput0aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "target": "31831e00-1abf-4112-b272-e1d8db8432df",
      "targetHandle": "quantumHandleGateInput031831e00-1abf-4112-b272-e1d8db8432df",
      "type": "quantumEdge",
      "id": "c196aec2-8a7e-4c59-a676-f49d12def4fb",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "49f48037-854e-4161-8073-28af734d338f",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput049f48037-854e-4161-8073-28af734d338f",
      "target": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "targetHandle": "quantumHandleGateInput1aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "quantumEdge",
      "id": "a33d7642-7124-49e5-a3e9-459dcaab8d1a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "sourceHandle": "quantumHandleGateOutput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "target": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "targetHandle": "quantumHandleGateInput0aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "quantumEdge",
      "id": "f629b7ca-0545-471f-a8af-48987419c758",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "31831e00-1abf-4112-b272-e1d8db8432df",
      "sourceHandle": "quantumHandleGateOutput031831e00-1abf-4112-b272-e1d8db8432df",
      "target": "345da37d-e075-490e-995f-df27db8b0fd2",
      "targetHandle": "quantumHandleMeasurementInput0345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "quantumEdge",
      "id": "f61d306e-bf55-41f6-ba55-5ebb0f5495b5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "sourceHandle": "quantumHandleGateOutput00074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "target": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "targetHandle": "quantumHandleGateInput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "quantumEdge",
      "id": "245ba376-c18a-4c3f-a949-8637728efb19",
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
    "x": -172.61945935962046,
    "y": 83.5874605743295,
    "zoom": 0.6998936216571533
  }]
}

export const hadamard_test_imaginary_part_algorithm =
{
  nodes: [
    {
      "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "type": "gateNode",
      "position": {
        "x": -60,
        "y": 120
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
          "q909422"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": -60,
        "y": 120
      },
      "dragging": true
    },
    {
      "id": "49f48037-854e-4161-8073-28af734d338f",
      "type": "statePreparationNode",
      "position": {
        "x": -270,
        "y": 300
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
          "q782317"
        ],
        "quantumStateName": "Custom State",
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
        "y": 300
      },
      "dragging": true
    },
    {
      "id": "345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "measurementNode",
      "position": {
        "x": 1020,
        "y": 300
      },
      "data": {
        "label": "Measurement",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
            ]
          },
          {
            "id": "31831e00-1abf-4112-b272-e1d8db8432df",
            "identifiers": [
              "q380011"
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
          "q947170"
        ],
        "indices": "",
        "outputIdentifier": ""
      },
      "width": 320,
      "height": 440,
      "positionAbsolute": {
        "x": 1020,
        "y": 300
      },
      "dragging": true
    },
    {
      "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "gateNode",
      "position": {
        "x": 180,
        "y": 180
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
            "identifiers": [
              "q909422"
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
          "q136470"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 180,
        "y": 180
      },
      "dragging": true
    },
    {
      "id": "31831e00-1abf-4112-b272-e1d8db8432df",
      "type": "gateNode",
      "position": {
        "x": 810,
        "y": 360
      },
      "data": {
        "label": "H",
        "inputs": [
          {
            "id": "6be1dca3-f128-4991-b962-4b0b22842dc0",
            "identifiers": [
              "q240223"
            ]
          },
          {
            "id": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
            "identifiers": [
              "q298005",
              "q936261"
            ]
          },
          {
            "id": "64a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
            "identifiers": [
              "q951957"
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
          "q380011"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 810,
        "y": 360
      },
      "dragging": true
    },
    {
      "id": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "gateNode",
      "position": {
        "x": 405,
        "y": 375
      },
      "data": {
        "label": "CNOT",
        "inputs": [
          {
            "id": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
            "identifiers": [
              "q136470"
            ]
          },
          {
            "id": "49f48037-854e-4161-8073-28af734d338f",
            "identifiers": [
              "q782317"
            ],
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
          "q298005",
          "q936261"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 405,
        "y": 375
      },
      "dragging": true
    },
    {
      "id": "64a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
      "type": "gateNode",
      "position": {
        "x": 600,
        "y": 360
      },
      "data": {
        "label": "S",
        "inputs": [
          {
            "id": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
            "identifiers": [
              "q298005",
              "q936261"
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
          "q951957"
        ],
        "parameter": "0"
      },
      "width": 110,
      "height": 110,
      "positionAbsolute": {
        "x": 600,
        "y": 360
      },
      "dragging": true
    }
  ],
  initialEdges: [
    {
      "source": "64a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
      "sourceHandle": "quantumHandleGateOutput064a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
      "target": "31831e00-1abf-4112-b272-e1d8db8432df",
      "targetHandle": "quantumHandleGateInput031831e00-1abf-4112-b272-e1d8db8432df",
      "type": "quantumEdge",
      "id": "d1ad23a7-5eac-4f72-9267-a3a355637019",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "sourceHandle": "quantumHandleGateOutput0aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "target": "64a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
      "targetHandle": "quantumHandleGateInput064a0122d-408f-4a7e-9cc5-8b9c6cfb77fe",
      "type": "quantumEdge",
      "id": "01ed6d46-f719-414f-9209-f9177b58a5ed",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "49f48037-854e-4161-8073-28af734d338f",
      "sourceHandle": "quantumHandlestatePreparationNodeOutput049f48037-854e-4161-8073-28af734d338f",
      "target": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "targetHandle": "quantumHandleGateInput1aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "quantumEdge",
      "id": "a33d7642-7124-49e5-a3e9-459dcaab8d1a",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "sourceHandle": "quantumHandleGateOutput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "target": "aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "targetHandle": "quantumHandleGateInput0aeca9e58-c648-42b9-a66b-7dd1555d0b40",
      "type": "quantumEdge",
      "id": "f629b7ca-0545-471f-a8af-48987419c758",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "31831e00-1abf-4112-b272-e1d8db8432df",
      "sourceHandle": "quantumHandleGateOutput031831e00-1abf-4112-b272-e1d8db8432df",
      "target": "345da37d-e075-490e-995f-df27db8b0fd2",
      "targetHandle": "quantumHandleMeasurementInput0345da37d-e075-490e-995f-df27db8b0fd2",
      "type": "quantumEdge",
      "id": "f61d306e-bf55-41f6-ba55-5ebb0f5495b5",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    },
    {
      "source": "0074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "sourceHandle": "quantumHandleGateOutput00074ed5a-20b9-49b5-843e-4497e2dc4b3f",
      "target": "d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "targetHandle": "quantumHandleGateInput0d75d79a8-4d8b-45ce-ad23-9c30ee8bf43d",
      "type": "quantumEdge",
      "id": "245ba376-c18a-4c3f-a949-8637728efb19",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#93C5FD",
        "hidden": false
      }
    }
  ],
  viewport:[ {
    "x": 233.59744329434386,
    "y": 131.8922392453337,
    "zoom": 0.5014595907119066
  }
]
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
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff"
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
      "width": 1500,
      "height": 930,
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
        "y": 405
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
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff"
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
        "y": 660
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
      "id": "022f6fad-cc55-40d0-8319-f94798a36150",
      "type": "classicalAlgorithmNode",
      "position": {
        "x": 990,
        "y": 60
      },
      "data": {
        "label": "Optimizer",
        "inputs": [
          {
            "id": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
            "identifiers": [
              "q695436"
            ],
            "outputIdentifier": "measurements",
            "label": "measurements"
          },
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
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff"
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
          "q908288"
        ],
        "position": {
          "x": 1035,
          "y": 180
        },
        "scope": "if",
        "numberClassicalInputs": 4,
        "numberClassicalOutputs": 2,
        "outputIdentifier": "beta ",
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
        ]
      },
      "width": 320,
      "height": 740,
      "positionAbsolute": {
        "x": 1560,
        "y": 315
      },
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent",
      "selected": false
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
        "x": 600,
        "y": 390
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
          }
        ],
        "children": [
          "e75184d3-1085-4110-bcbf-3f7f1a667072",
          "d6a500df-16f6-40fe-a293-19430e54a8cd",
          "c163f878-1c71-4c89-99f8-8ddda21aa86b",
          "022f6fad-cc55-40d0-8319-f94798a36150",
          "ac4a4cdf-555c-48f3-8b83-e1beb68228ff"
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
        "x": 1170,
        "y": 645
      },
      "dragging": true,
      "parentNode": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "extent": "parent"
    }
  
  ],
  initialEdges: [
   {
      "source": "022f6fad-cc55-40d0-8319-f94798a36150",
      "sourceHandle": "classicalHandle0022f6fad-cc55-40d0-8319-f94798a36150",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "type": "classicalEdge",
      "id": "7b15630e-412b-4728-adc8-cb819c74870c",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "022f6fad-cc55-40d0-8319-f94798a36150",
      "sourceHandle": "classicalHandle1022f6fad-cc55-40d0-8319-f94798a36150",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-1",
      "type": "classicalEdge",
      "id": "27e868f2-aaff-49e5-addc-6bd00b04b91d",
      "markerEnd": {
        "type": "arrowclosed",
        "width": 20,
        "height": 20,
        "color": "#F5A843",
        "hidden": false
      }
    },
    {
      "source": "022f6fad-cc55-40d0-8319-f94798a36150",
      "sourceHandle": "classicalHandle022f6fad-cc55-40d0-8319-f94798a36150",
      "target": "8cf10732-dd4d-4a82-9592-2e8808b5d82f",
      "targetHandle": "classicalHandleInputDynamic8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "type": "classicalEdge",
      "id": "27568d19-444e-4f02-a360-4018f5a838f4",
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
      "source": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "sourceHandle": "classicalHandlec163f878-1c71-4c89-99f8-8ddda21aa86b",
      "target": "022f6fad-cc55-40d0-8319-f94798a36150",
      "targetHandle": "classicalHandleOperationInput0022f6fad-cc55-40d0-8319-f94798a36150",
      "type": "classicalEdge",
      "id": "9b1208e3-7e20-4f0a-8a31-710ec7c66b1a",
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
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-0",
      "target": "022f6fad-cc55-40d0-8319-f94798a36150",
      "targetHandle": "classicalHandleOperationInput1022f6fad-cc55-40d0-8319-f94798a36150",
      "type": "classicalEdge",
      "id": "74310d53-8683-4a94-b7f8-49a709173ab9",
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
      "sourceHandle": "classicalHandleOutputInitialization8cf10732-dd4d-4a82-9592-2e8808b5d82f-2",
      "target": "022f6fad-cc55-40d0-8319-f94798a36150",
      "targetHandle": "classicalHandleOperationInput3022f6fad-cc55-40d0-8319-f94798a36150",
      "type": "classicalEdge",
      "id": "1fd405ee-910f-4425-a1c1-8e7e70effb2b",
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
      "target": "022f6fad-cc55-40d0-8319-f94798a36150",
      "targetHandle": "classicalHandleOperationInput2022f6fad-cc55-40d0-8319-f94798a36150",
      "type": "classicalEdge",
      "id": "d5570886-b69c-4d6e-8909-3dbd1e1ed310",
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
      "source": "e75184d3-1085-4110-bcbf-3f7f1a667072",
      "sourceHandle": "quantumHandlealgorithmNodeOutput0e75184d3-1085-4110-bcbf-3f7f1a667072",
      "target": "c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "targetHandle": "quantumHandleMeasurementInput0c163f878-1c71-4c89-99f8-8ddda21aa86b",
      "type": "quantumEdge",
      "id": "f7bec9ef-52da-4fa7-9dd5-c7b5a063600d",
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
    }
  ],
  viewport: [{
    "x": 322.2505861282349,
    "y": 74,
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
      "width": 1500,
      "height": 600,
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