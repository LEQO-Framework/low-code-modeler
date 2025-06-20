Use Case: GHZ State
-------------------

The first use case illustrates the modeling of a GHZ state with 7 qubits. This maximally entangled state is created by applying a Hadamard gate to the first qubit, followed by a series of CNOT gates that entangle the remaining qubits in a linear sequence, resulting in a linear circuit depth.


.. container:: images-side-by-side

   .. figure:: images/ghz7.png
      :alt: GHZ state modeled with gate-level nodes
      :width: 78%
      :align: center

      GHZ state modeled with gate-level nodes

Modeling such a circuit at the gate level requires a certain level of expertise and can be time-consuming. To reduce complexity and support users with less quantum experience, the *Prepare State* block can be used. It allows users to select the GHZ state and define the desired output size (e.g., 7 qubits), without having to manually construct the circuit.

   .. figure:: images/ghz7preparestate.png
      :alt: GHZ state modeled using Prepare State block
      :width: 48%
      :align: center

      GHZ state modeled using Prepare State block
