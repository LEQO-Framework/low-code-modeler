/**
 * Bridge between QasmDiracPanel and the core logic in utils/qasmToDirac.ts.
 * Exports exactly what QasmDiracPanel.tsx expects:
 *   - the Complex type
 *   - statevectorToDirac(sv, numQubits) -> string (Unicode)
 */

export type { Complex } from "../components/utils/qasmToDirac";
import { statevectorToDirac as _statevectorToDirac } from "../components/utils/qasmToDirac";
import type { Complex } from "../components/utils/qasmToDirac";

/**
 * Converts a statevector into a readable Dirac notation string.
 *
 * @param statevector  array of complex amplitudes; its length must be 2^numQubits
 * @param numQubits    number of qubits
 * @returns            Unicode string, e.g. "1/√2 |00⟩ + 1/√2 |11⟩"
 *
 * @example
 * // Bell state Φ+
 * const sv: Complex[] = [
 *   { re: 1/Math.sqrt(2), im: 0 },  // |00⟩
 *   { re: 0, im: 0 },               // |01⟩
 *   { re: 0, im: 0 },               // |10⟩
 *   { re: 1/Math.sqrt(2), im: 0 },  // |11⟩
 * ];
 * statevectorToDirac(sv, 2);
 * // → "1/√2 |00⟩ + 1/√2 |11⟩"
 */
export function statevectorToDirac(
  statevector: Complex[],
  numQubits: number,
): string {
  const result = _statevectorToDirac(statevector, numQubits);
  return result.unicode;
}
