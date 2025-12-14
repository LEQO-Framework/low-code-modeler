# Overview of the Modeling Language

This document provides an overview of the modeling language for the quantum low-code platform.

## Boundary Nodes

| Block            | Properties                              | Description                                               |
| ---------------- | --------------------------------------- | --------------------------------------------------------- |
| **EncodeValue**  | `encodingType`, `bound` | Encodes a classical value into a quantum state.           |
| **PrepareState** | `quantumStateName`      | Generates a predefined quantum state such as Bell or GHZ. |
| **Measurement**  | `measurementBasis`, `qubitSelection`    | Measures selected qubits to produce classical output.     |

---

## Operators

| Block                   | Properties  | Description                                                               |
| ----------------------- | ----------- | ------------------------------------------------------------------------- |
| **ArithmeticOperation** | `operation` | Performs arithmetic operations (add, subtract, multiply, divide, modulo). |
| **BitwiseOperation**    | `operation` | Performs bitwise operations (and, or, xor, not).                          |
| **ComparisonOperation** | `operation` | Compares values (equality, inequality, ordering).                         |
| **MinMax**              | `operation` | Selects minimum or maximum based on the chosen operation.                 |

---

## Circuit Nodes

| Block             | Properties  | Description                                         |           
| ----------------- | ----------- | --------------------------------------------------- | 
| **Qubit Circuit** | -           | Represents a single qubit used in the circuit.      |           
| **H**             | -           | Hadamard gate: puts a qubit into superposition.     |           
| **RX(θ)**         | `parameter` | Rotates qubit around X-axis by θ radians.           |           
| **RY(θ)**         | `parameter` | Rotates qubit around Y-axis by θ radians.           |           
| **RZ(θ)**         | `parameter` | Rotates qubit around Z-axis by θ radians.           |           
| **T**             | -           | T gate: a π/4 phase shift.                          |           
| **X**             | -           | Pauli-X gate: flips the state (like a NOT gate).    |           
| **Y**             | -           | Pauli-Y gate: flips and phases the qubit state.     |           
| **Z**             | -           | Pauli-Z gate: adds a π phase shift to               |  
| **S**             | -           | S gate: a π/2 phase shift.                          |           
| **SX**            | -           | Square root of X gate (√X).                         |           
| **SDG**           | -           | S† gate: inverse of the S gate.                     |           
| **TDG**           | -           | T† gate: inverse of the T gate.                     |           
| **CNOT**          | -           | Controlled-X gate: flips target qubit if control is |       
| **SWAP**          | -           | Swaps the states of two qubits.                     |           
| **CY**            | -           | Controlled-Y gate.                                  |           
| **CZ**            | -           | Controlled-Z gate.                                  |           
| **CH**            | -           | Controlled-Hadamard gate.                           |           
| **CRX(θ)**        | `parameter` | Controlled rotation by θ around X-axis.             |          
| **CRY(θ)**        | `parameter` | Controlled rotation by θ around Y-axis.             |           
| **CRZ(θ)**        | `parameter` | Controlled rotation by θ around Z-axis.             |           
| **Toffoli**       | -           | CCNOT: flips target if both controls are            |      
| **CSWAP**         | -           | Controlled SWAP: swaps two qubits if control is     |       
| **Splitter**      | -           | Splits a quantum register into individual qubits.   |           
| **Merger**        | -           | Merges multiple qubits into one register.           |           

---

## Data Type Nodes

| Block       | Properties | Description                                     |
| ----------- | ---------- | ----------------------------------------------- |
| **Number**  | `value`    | Integer value (whole number).                   |
| **Array**   | `value`    | A list of values, possibly of varying length.   |
| **Ancilla** | `value`    | Helper qubit used temporarily in a computation. |
| **Qubit**   | `value`    | Basic unit of quantum information.              |

---

## Control Structure Nodes

| Block            | Properties  | Description                                               |
| ---------------- | ----------- | --------------------------------------------------------- |
| **If-Then-Else** | `condition` | Conditional block that branches based on a boolean input. |
| **While**        | `condition` | Repeats a block of operations while a condition is true.  |

---

## Custom Nodes

| Block          | Properties                                                               | Description                                                     |
| -------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **CustomNode** | `classicalInputs`, `quantumInputs`, `classicalOutputs`, `quantumOutputs` | User-defined node with custom classical and quantum interfaces. |

---
