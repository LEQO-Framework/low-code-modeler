/**
 * Circuit editor inside Math Mode: change the initial state, add, remove, reorder or
 * replace steps (i.e. switch the matrix of a step) and preview the resulting states.
 * "Apply" writes the edited circuit back as OpenQASM, which updates the QASM output and
 * rebuilds the low-code canvas.
 */

import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import { qasmToDiracSteps } from "./utils/qasmToDirac";
import {
  GATE_CATALOG,
  circuitFromQasm,
  circuitToQasm,
  defaultQubits,
  emptyCircuit,
  formatAngle,
  gateArity,
  gateDisplayLabel,
  gateSpec,
  labeledMatrixLatex,
  localMatrix,
  parseAngle,
  registerMatrix,
  validateGate,
  type EditableCircuit,
  type EditableGate,
} from "./utils/circuitEdit";

const MAX_QUBITS = 8;
/** Up to this size the full register matrix is shown with basis-state labels. */
const MAX_REGISTER_MATRIX_QUBITS = 3;

function Tex({ latex, display = false }: { latex: string; display?: boolean }) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
      }),
    [latex, display],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function newGate(name: string, numQubits: number, previous?: number[]) {
  const spec = gateSpec(name);
  const arity = spec?.arity ?? 1;
  // keep the qubits of the replaced gate where possible, fill up with unused ones
  const qubits = (previous ?? []).slice(0, arity);
  for (
    let q = 0;
    qubits.length < arity && q < Math.max(numQubits, arity);
    q++
  ) {
    if (!qubits.includes(q)) qubits.push(q);
  }
  return {
    name,
    qubits: qubits.length === arity ? qubits : defaultQubits(arity),
    params: spec?.hasParam ? [Math.PI / 2] : [],
  };
}

export type EditorMode = "current" | "new";

interface Props {
  /** QASM of the current model; without it only "Start new" is available. */
  qasm?: string;
  initialMode?: EditorMode;
  /** Applies the edited OpenQASM to the QASM output and the canvas; omitted = preview only. */
  onApply?: (qasm: string) => void;
  /** Omitted when the editor cannot be closed (empty canvas). */
  onClose?: () => void;
}

export function MathCircuitEditor({
  qasm,
  initialMode = "current",
  onApply,
  onClose,
}: Props) {
  const hasModel = !!qasm?.trim();
  const [mode, setMode] = useState<EditorMode>(hasModel ? initialMode : "new");
  const isNew = mode === "new" || !hasModel;
  // "Edit current model" starts from the compiled model, "Start new" from |0...0⟩ without steps
  const original = useMemo(
    () => (!isNew && qasm ? circuitFromQasm(qasm) : emptyCircuit()),
    [isNew, qasm],
  );
  const [circuit, setCircuit] = useState<EditableCircuit>(original);
  const [newGateName, setNewGateName] = useState("h");
  const [openMatrix, setOpenMatrix] = useState<number | null>(null);
  const [angleDrafts, setAngleDrafts] = useState<Record<number, string>>({});
  const [applied, setApplied] = useState(false);

  // a new QASM (recompiled model) resets the editor
  useEffect(() => {
    setCircuit(original);
    setAngleDrafts({});
    setOpenMatrix(null);
  }, [original]);

  const { numQubits, initialBits, gates } = circuit;
  const errors = gates.map((g) => validateGate(g, numQubits));
  const hasErrors = errors.some((e) => e !== null);
  const multiControlled = gates.some((g) => g.name.startsWith("mc_"));
  const changed =
    isNew ||
    circuitToQasm(circuit) !== circuitToQasm(original) ||
    numQubits !== original.numQubits;

  const preview = useMemo(() => {
    if (hasErrors) return null;
    return qasmToDiracSteps(circuitToQasm(circuit, false), initialBits);
  }, [circuit, hasErrors, initialBits]);

  const update = (fn: (c: EditableCircuit) => EditableCircuit) => {
    setApplied(false);
    setCircuit(fn);
  };

  const setGate = (index: number, gate: EditableGate) =>
    update((c) => ({
      ...c,
      gates: c.gates.map((g, i) => (i === index ? gate : g)),
    }));

  const setQubitCount = (n: number) =>
    update((c) => ({
      ...c,
      numQubits: n,
      initialBits:
        n > c.numQubits
          ? c.initialBits.padEnd(n, "0")
          : c.initialBits.slice(0, n),
    }));

  const usedByGates = (q: number) => gates.some((g) => g.qubits.includes(q));
  const canRemoveQubit =
    numQubits > 1 && !usedByGates(numQubits - 1) && initialBits.at(-1) !== "1";

  const toggleInitialBit = (q: number) =>
    update((c) => ({
      ...c,
      initialBits: c.initialBits
        .split("")
        .map((b, i) => (i === q ? (b === "1" ? "0" : "1") : b))
        .join(""),
    }));

  const moveGate = (index: number, delta: number) =>
    update((c) => {
      const target = index + delta;
      if (target < 0 || target >= c.gates.length) return c;
      const next = [...c.gates];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...c, gates: next };
    });

  const removeGate = (index: number) => {
    setOpenMatrix(null);
    update((c) => ({ ...c, gates: c.gates.filter((_, i) => i !== index) }));
  };

  const addSpec = gateSpec(newGateName);
  const addArity = addSpec?.arity ?? 1;
  const addMissing = Math.max(0, addArity - numQubits);

  const addGate = (extendRegister: boolean) =>
    update((c) => {
      const n = extendRegister ? Math.max(c.numQubits, addArity) : c.numQubits;
      return {
        numQubits: n,
        initialBits: c.initialBits.padEnd(n, "0"),
        gates: [...c.gates, newGate(newGateName, n)],
      };
    });

  const psi = (i: number) => `|\\psi_{${i}}\\rangle`;

  return (
    <div className="flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50/30 px-3 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Edit circuit
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600"
            title="Close the editor"
          >
            ✕
          </button>
        )}
      </div>

      {/* Edit the current model or start a new one */}
      <div className="flex items-center gap-1.5 text-xs">
        {(["current", "new"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setApplied(false);
              setMode(m);
            }}
            disabled={m === "current" && !hasModel}
            className={`px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${
              (m === "new") === isNew
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "border-gray-300 hover:bg-gray-100 text-gray-600"
            }`}
            title={
              m === "current"
                ? hasModel
                  ? "Edit the circuit of the current model"
                  : "The canvas is empty, there is no model to edit yet"
                : "Start from |00⟩ without steps and build a new circuit"
            }
          >
            {m === "current" ? "Edit current model" : "Start new"}
          </button>
        ))}
      </div>

      {/* Register size and initial state */}
      <div className="flex flex-col gap-2 rounded border border-blue-100 bg-white px-2 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-semibold">Qubits:</span>
          <button
            onClick={() => setQubitCount(numQubits - 1)}
            disabled={!canRemoveQubit}
            className="px-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            title={
              canRemoveQubit
                ? `Remove q${numQubits - 1}`
                : `q${numQubits - 1} is still used by a step or starts in |1⟩`
            }
          >
            −
          </button>
          <span className="font-mono">{numQubits}</span>
          <button
            onClick={() => setQubitCount(numQubits + 1)}
            disabled={numQubits >= MAX_QUBITS}
            className="px-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            title={`Add q${numQubits}`}
          >
            +
          </button>
          <span className="text-gray-400">
            state vector with 2<sup>{numQubits}</sup> = {2 ** numQubits}{" "}
            entries, gates are {2 ** numQubits}×{2 ** numQubits} matrices
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
          <span className="font-semibold">Initial state:</span>
          {initialBits.split("").map((bit, q) => (
            <button
              key={q}
              onClick={() => toggleInitialBit(q)}
              className={`font-mono px-1.5 py-0.5 rounded border transition-colors ${
                bit === "1"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
              title={`Click to start q${q} in |${bit === "1" ? 0 : 1}⟩`}
            >
              q{q}=|{bit}⟩
            </button>
          ))}
          <span className="font-mono text-gray-800">
            <Tex latex={`${psi(0)} = |${initialBits}\\rangle`} />
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">
          Every qubit physically starts in |0⟩. A qubit that starts in |1⟩ is
          prepared with an X gate when the circuit is applied to the canvas.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-600">
          Steps ({gates.length})
        </p>
        {gates.length === 0 && (
          <p className="text-xs text-gray-400">
            No steps yet. Add a gate below.
          </p>
        )}
        {gates.map((gate, index) => {
          const spec = gateSpec(gate.name);
          const error = errors[index];
          const arity = gateArity(gate);
          return (
            <div
              key={index}
              className={`rounded border px-2 py-1.5 bg-white ${
                error ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-gray-400 font-mono w-5">
                  {index + 1}.
                </span>
                {spec ? (
                  <select
                    value={spec.name}
                    onChange={(e) =>
                      setGate(
                        index,
                        newGate(e.target.value, numQubits, gate.qubits),
                      )
                    }
                    className="border border-gray-300 rounded px-1 py-0.5 bg-white"
                    title="Switch the gate (and with it the matrix) of this step"
                  >
                    {GATE_CATALOG.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-gray-700">
                    {gateDisplayLabel(gate)}
                  </span>
                )}
                {spec?.roles.map((role, r) => (
                  <label
                    key={r}
                    className="flex items-center gap-0.5 text-gray-500"
                  >
                    {role}
                    <select
                      value={gate.qubits[r] ?? 0}
                      onChange={(e) => {
                        const qubits = [...gate.qubits];
                        qubits[r] = Number(e.target.value);
                        setGate(index, { ...gate, qubits });
                      }}
                      className="border border-gray-300 rounded px-1 py-0.5 bg-white font-mono"
                    >
                      {Array.from(
                        { length: Math.max(numQubits, arity) },
                        (_, q) => (
                          <option key={q} value={q} disabled={q >= numQubits}>
                            q{q}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ))}
                {spec?.hasParam && (
                  <label className="flex items-center gap-0.5 text-gray-500">
                    θ
                    <input
                      value={
                        angleDrafts[index] ?? formatAngle(gate.params[0] ?? 0)
                      }
                      onChange={(e) => {
                        const text = e.target.value;
                        setAngleDrafts((d) => ({ ...d, [index]: text }));
                        const value = parseAngle(text);
                        if (value !== null)
                          setGate(index, { ...gate, params: [value] });
                      }}
                      onBlur={() =>
                        setAngleDrafts((d) => {
                          const next = { ...d };
                          delete next[index];
                          return next;
                        })
                      }
                      className={`w-16 border rounded px-1 py-0.5 font-mono ${
                        angleDrafts[index] !== undefined &&
                        parseAngle(angleDrafts[index]) === null
                          ? "border-red-400"
                          : "border-gray-300"
                      }`}
                      title="Angle in radians, e.g. pi/2, π/4, 0.5, or in degrees, e.g. 90°"
                    />
                  </label>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() =>
                      setOpenMatrix((m) => (m === index ? null : index))
                    }
                    disabled={!!error}
                    className={`px-1.5 rounded border transition-colors disabled:opacity-40 ${
                      openMatrix === index
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                    title="Show the matrix of this step"
                  >
                    Matrix
                  </button>
                  <button
                    onClick={() => moveGate(index, -1)}
                    disabled={index === 0}
                    className="px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveGate(index, 1)}
                    disabled={index === gates.length - 1}
                    className="px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeGate(index)}
                    className="px-1 text-red-400 hover:text-red-600"
                    title="Remove this step"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-1 flex items-start gap-2 text-xs text-red-600">
                  <span>⚠ {error}</span>
                  {arity > numQubits && arity <= MAX_QUBITS && (
                    <button
                      onClick={() => setQubitCount(arity)}
                      className="flex-shrink-0 px-1.5 rounded border border-red-300 hover:bg-red-50"
                    >
                      + Add {arity - numQubits} qubit
                      {arity - numQubits === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              )}

              {openMatrix === index && !error && (
                <StepMatrix gate={gate} numQubits={numQubits} />
              )}

              {preview?.steps[index] && (
                <div className="mt-1 font-mono text-xs text-gray-700 overflow-x-auto whitespace-nowrap">
                  <span className="text-gray-400">
                    |ψ{subscript(index + 1)}⟩ ={" "}
                  </span>
                  {preview.steps[index].unicode}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add a step */}
      <div className="flex flex-col gap-1 rounded border border-dashed border-blue-300 bg-white px-2 py-2">
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="font-semibold text-gray-600">Add step:</span>
          <select
            value={newGateName}
            onChange={(e) => setNewGateName(e.target.value)}
            className="border border-gray-300 rounded px-1 py-0.5 bg-white"
          >
            {GATE_CATALOG.map((g) => (
              <option key={g.name} value={g.name}>
                {g.label} · {2 ** g.arity}×{2 ** g.arity}
              </option>
            ))}
          </select>
          <button
            onClick={() => addGate(false)}
            disabled={addMissing > 0}
            className="px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-40"
          >
            + Add
          </button>
        </div>
        {addMissing > 0 && (
          <div className="flex items-start gap-2 text-xs text-red-600">
            <span>
              ⚠ {addSpec?.label} acts on {addArity} qubits: its matrix is{" "}
              {2 ** addArity}×{2 ** addArity}, so it needs {addArity} qubits.
              The current state |{initialBits}⟩ has only {numQubits} qubit
              {numQubits === 1 ? "" : "s"} ({2 ** numQubits} entries).
            </span>
            <button
              onClick={() => addGate(true)}
              className="flex-shrink-0 px-1.5 rounded border border-red-300 hover:bg-red-50"
            >
              Add {addMissing} qubit{addMissing === 1 ? "" : "s"} and the gate
            </button>
          </div>
        )}
      </div>

      {/* Result of the edited circuit */}
      {preview && (
        <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-xs overflow-x-auto whitespace-nowrap">
          <span className="text-gray-400">
            Result: |ψ{subscript(gates.length)}⟩ ={" "}
          </span>
          {preview.steps.at(-1)?.unicode ?? preview.initial.unicode}
        </div>
      )}
      {hasErrors && (
        <p className="text-xs text-red-600">
          Fix the marked steps to see the resulting state.
        </p>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500">
          Generated OpenQASM
        </summary>
        <pre className="mt-1 p-2 rounded bg-white border border-gray-200 overflow-x-auto font-mono text-[11px]">
          {circuitToQasm(circuit)}
        </pre>
      </details>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => update(() => original)}
          disabled={!changed}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
          title={isNew ? "Start over from |00⟩" : "Discard all edits"}
        >
          Reset
        </button>
        {onApply && (
          <button
            onClick={() => {
              onApply(circuitToQasm(circuit));
              setApplied(true);
            }}
            disabled={!changed || hasErrors || multiControlled}
            className="text-xs px-2.5 py-1 rounded-full border border-blue-300 hover:bg-blue-50 text-blue-600 disabled:opacity-40"
            title="Write the edited circuit to OpenQASM and rebuild the low-code canvas"
          >
            {isNew
              ? hasModel
                ? "↙ Replace circuit with new one"
                : "↙ Create on canvas"
              : "↙ Apply to OpenQASM & canvas"}
          </button>
        )}
        {applied && (
          <span className="text-xs text-green-600">
            ✓ Applied, recompiling…
          </span>
        )}
      </div>
      {multiControlled && onApply && (
        <p className="text-[11px] text-amber-700">
          This circuit contains multi-controlled gates (e.g. from a Grover
          operator) that have no single gate node on the canvas, so it can be
          explored here but not applied.
        </p>
      )}
      {!onApply && (
        <p className="text-[11px] text-gray-400">
          Preview only: open Math Mode from the side panel to apply changes to
          the canvas.
        </p>
      )}
    </div>
  );
}

function subscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])
    .join("");
}

function StepMatrix({
  gate,
  numQubits,
}: {
  gate: EditableGate;
  numQubits: number;
}) {
  const arity = gateArity(gate);
  const local = useMemo(() => localMatrix(gate), [gate]);
  const full = useMemo(
    () =>
      numQubits <= MAX_REGISTER_MATRIX_QUBITS && numQubits > arity
        ? registerMatrix(gate, numQubits)
        : null,
    [gate, numQubits, arity],
  );
  const name =
    gateSpec(gate.name)?.label.replace(/\s*\(.*\)$/, "") ?? gate.name;

  return (
    <div className="mt-1.5 rounded bg-blue-50/40 border border-blue-100 px-2 py-1.5 text-xs text-gray-700 overflow-x-auto">
      <p className="mb-1">
        {name} on its own {arity === 1 ? "qubit" : `${arity} qubits`} (
        {2 ** arity}×{2 ** arity}). Column <em>j</em> is the image of the basis
        state |j⟩, row <em>i</em> the amplitude of |i⟩:
      </p>
      <Tex display latex={labeledMatrixLatex(local, arity)} />
      {full && (
        <>
          <p className="mt-1 mb-1">
            On the whole {numQubits}-qubit register ({2 ** numQubits}×
            {2 ** numQubits}, identity on the other qubits):
          </p>
          <Tex display latex={labeledMatrixLatex(full, numQubits)} />
        </>
      )}
      {!full && numQubits > MAX_REGISTER_MATRIX_QUBITS && (
        <p className="mt-1 text-gray-400">
          On the whole register this is a {2 ** numQubits}×{2 ** numQubits}{" "}
          matrix (too large to display).
        </p>
      )}
    </div>
  );
}
