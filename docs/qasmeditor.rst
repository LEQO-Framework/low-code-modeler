QASM Code Editor
----------------


The QASM Code Editor provides a text-based view of the modeled circuit in
OpenQASM.

The editor is disabled by default. To enable it, open the **Experience Mode**
panel and set **QASM Editor** to *On*. The **QASM** tab then becomes available
in the panel on the right-hand side of the modeler, next to **Properties** and
**Math Mode**.

The editor supports both directions between the visual model and its textual
representation:

- **From model to code**: The OpenQASM code generated from the current model is
  displayed in the editor. The code view is updated through the **Refresh**
  button, which sends the current model to the backend and displays the
  generated code.

- **From code to model**: OpenQASM code can be entered or pasted directly into
  the editor. The **Apply to Canvas** button parses the code locally in the
  frontend and creates the corresponding visual model on the canvas. No backend
  call is required for this step.

Changes are not transferred automatically while typing. Both directions are
triggered explicitly by the user, which avoids continuous translation calls
during text input and keeps it visible when a change has actually been applied.
