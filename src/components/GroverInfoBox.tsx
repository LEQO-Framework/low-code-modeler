import { useState } from "react";

interface GroverInfoBoxProps {
  /** Qubits of the Grover register; the search space is 2^numQubits. */
  numQubits: number;
  /** Iterations actually present in the circuit. */
  iterations: number;
  /** Basis states marked by the oracle, restricted to the Grover register's bits. */
  markedStates: string[];
}

/**
 * Explanatory box shown in Math Mode when a Grover node is part of the model.
 * Links the textbook description of the algorithm to the values of the concrete
 * circuit currently displayed. N and M are both derived from the circuit itself:
 * N from the size of the Grover register, M from replaying the oracle.
 */
export function GroverInfoBox({ numQubits, iterations, markedStates }: GroverInfoBoxProps) {
  const [open, setOpen] = useState(false);

  const searchSpace = 2 ** numQubits;
  const marked = markedStates.length;
  // Without a usable M the optimum cannot be stated, so the comparison is omitted.
  const exactOptimum = marked > 0 ? (Math.PI / 4) * Math.sqrt(searchSpace / marked) : null;
  const optimum = exactOptimum !== null ? Math.round(exactOptimum) : null;

  return (
    <div className="flex-shrink-0 mb-2 rounded-lg border border-indigo-200 bg-indigo-50/40">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700"
      >
        <span>About Grover's algorithm</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3 text-xs leading-relaxed text-gray-700">
          <p>
            Grover's algorithm starts with a unitary transformation that puts the register
            into an equal superposition of all basis states. An oracle and a diffusion
            operator are then applied repeatedly: the oracle marks the searched states by
            inverting their phase, and the diffusion operator amplifies the amplitude of the
            marked states at the expense of all others.
          </p>

          <p>
            The two operators are applied approximately{" "}
            <span className="whitespace-nowrap font-mono">(π/4)·√(N/M)</span> times, where{" "}
            <span className="font-mono">N</span> is the number of elements in the search
            space and <span className="font-mono">M</span> the number of marked elements.
          </p>

          <div className="rounded border border-indigo-200 bg-white px-3 py-2 font-mono">
            <div>
              N = 2<sup>{numQubits}</sup> = {searchSpace}
              {"   "}M = {marked}
            </div>
            {markedStates.length > 0 && (
              <div className="mt-1 text-gray-600">
                Marked: {markedStates.map((s) => `|${s}⟩`).join(", ")}
              </div>
            )}
            {exactOptimum !== null && (
              <div className="mt-1">
                (π/4)·√({searchSpace}/{marked}) ≈ {exactOptimum.toFixed(2)} → {optimum} iteration
                {optimum === 1 ? "" : "s"}
              </div>
            )}
            <div className="mt-1 text-gray-500">
              This circuit contains {iterations} iteration{iterations === 1 ? "" : "s"}.
            </div>
          </div>

          {optimum !== null && iterations !== optimum && (
            <p className="text-amber-700">
              Note: the number of iterations differs from the theoretical optimum. Too many
              iterations rotate the state past the marked subspace and reduce the success
              probability again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
