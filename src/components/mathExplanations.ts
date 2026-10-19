/**
 * Explanatory texts for Math Mode, shared by the panel (rendered with ReactMarkdown +
 * KaTeX) and the LaTeX/PDF export (converted with markdownToLatex). Texts are Markdown
 * with $...$ / $$...$$ math; keep them ASCII outside of math so pdflatex can compile them.
 */

import type { Node } from "reactflow";
import type { DiracStep } from "./utils/qasmToDirac";
import { GroverNode, StatePreparationNode } from "@/constants";

export interface MathTopic {
  title: string;
  markdown: string;
}

/** "$|00\rangle, |01\rangle, ...$": the order of the rows and columns of a matrix on n qubits. */
function basisOrder(n: number): string {
  const states = Array.from(
    { length: 2 ** n },
    (_, i) => `|${i.toString(2).padStart(n, "0")}\\rangle`,
  );
  return `$${states.join(", ")}$`;
}

/** Basic concepts needed to read the Math Mode output, tailored to the circuit size. */
export function basicsTopics(numQubits: number): MathTopic[] {
  const n = Math.max(numQubits, 1);
  const dim = 2 ** n;

  return [
    {
      title: "What is a qubit?",
      markdown: `A qubit is the quantum counterpart of a classical bit. A classical bit is either 0 or 1. A qubit can be in the basis state $|0\\rangle$, in the basis state $|1\\rangle$, or in a **superposition** of both:

$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\qquad \\alpha, \\beta \\in \\mathbb{C}, \\qquad |\\alpha|^2 + |\\beta|^2 = 1$$

The complex numbers $\\alpha$ and $\\beta$ are called **amplitudes**. Measuring the qubit gives 0 with probability $|\\alpha|^2$ and 1 with probability $|\\beta|^2$; afterwards the qubit is in the measured basis state. This is why the squared amplitudes must add up to 1 (normalization).

As vectors, the basis states are

$$|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}, \\qquad |1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}, \\qquad |\\psi\\rangle = \\begin{pmatrix} \\alpha \\\\ \\beta \\end{pmatrix}$$

An overall factor $e^{i\\gamma}$ on the whole state (global phase) cannot be measured, so $|\\psi\\rangle$ and $e^{i\\gamma}|\\psi\\rangle$ describe the same physical state.`,
    },
    {
      title: `Why the state has ${dim} entries`,
      markdown: `Every additional qubit doubles the number of basis states. A register of $n$ qubits has $2^n$ basis states $|0\\dots0\\rangle, |0\\dots01\\rangle, \\dots, |1\\dots1\\rangle$, so its state is a vector of $2^n$ complex amplitudes:

$$|\\psi\\rangle = \\sum_{x=0}^{2^n-1} c_x\\,|x\\rangle, \\qquad \\sum_{x} |c_x|^2 = 1$$

States of several qubits are combined with the **tensor product** $\\otimes$, for example $|0\\rangle \\otimes |1\\rangle = |01\\rangle$. The dimensions multiply: $2 \\cdot 2 \\cdots 2 = 2^n$.

This circuit has $n = ${n}$ qubit${n === 1 ? "" : "s"}, so its state has $2^{${n}} = ${dim}$ amplitudes, and a gate acting on the whole register is a matrix of size $${dim} \\times ${dim}$. A gate on a single qubit is extended with identities, e.g. $H_0 \\otimes I_1$. Basis states are written with qubit $q_0$ as the leftmost bit. Only the terms with a non-zero amplitude are shown in the Dirac notation.`,
    },
    {
      title: "How to read a matrix",
      markdown: `A gate on $n$ qubits is a $2^n \\times 2^n$ matrix. Its rows and columns are labeled with the basis states in binary counting order, with qubit $q_0$ as the leftmost bit:${
        n <= 3
          ? ` for this circuit ${basisOrder(n)}.`
          : ` $|0\\dots0\\rangle, |0\\dots01\\rangle, |0\\dots10\\rangle, \\dots, |1\\dots1\\rangle$.`
      }

- **Column $j$ is the input $|j\\rangle$:** the first column belongs to $|0\\rangle$ (or $|00\\rangle$, $|000\\rangle$, ...), the second to $|1\\rangle$ (or $|01\\rangle$), and so on. The column is exactly the state the gate produces from that basis state: $U|j\\rangle$.
- **Row $i$ is the output $|i\\rangle$:** the entry $U_{ij} = \\langle i|U|j\\rangle$ is the amplitude with which the input $|j\\rangle$ ends up in $|i\\rangle$.
- **Multiplying with a state:** $U|\\psi\\rangle = \\sum_j c_j\\,U|j\\rangle$, i.e. every column is weighted with the amplitude of its basis state and the columns are added.

Example: $X|0\\rangle$ is the first column of $X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$, i.e. $\\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix} = |1\\rangle$. For CNOT (control $q_0$, target $q_1$) the columns and rows are $|00\\rangle, |01\\rangle, |10\\rangle, |11\\rangle$:

$$\\mathrm{CNOT} = \\begin{array}{c|cccc} & |00\\rangle & |01\\rangle & |10\\rangle & |11\\rangle \\\\ \\hline \\langle 00| & 1 & 0 & 0 & 0 \\\\ \\langle 01| & 0 & 1 & 0 & 0 \\\\ \\langle 10| & 0 & 0 & 0 & 1 \\\\ \\langle 11| & 0 & 0 & 1 & 0 \\end{array}$$

The third column (input $|10\\rangle$) has its 1 in the row $\\langle 11|$, so $\\mathrm{CNOT}|10\\rangle = |11\\rangle$: the control is 1, so the target is flipped. A gate on fewer qubits than the register is extended with identities, e.g. $H_0 \\otimes I_1$, which gives a $${dim} \\times ${dim}$ matrix for this circuit. A gate on $k$ qubits needs at least $k$ qubits in the register: a Toffoli gate is an $8 \\times 8$ matrix and cannot be applied to a 2-qubit state such as $|00\\rangle$.`,
    },
    {
      title: "How to read the Bloch sphere",
      markdown: `Up to the global phase, every single-qubit state can be written with two angles:

$$|\\psi\\rangle = \\cos\\frac{\\theta}{2}\\,|0\\rangle + e^{i\\varphi}\\sin\\frac{\\theta}{2}\\,|1\\rangle, \\qquad 0 \\le \\theta \\le \\pi, \\quad 0 \\le \\varphi < 2\\pi$$

$\\theta$ and $\\varphi$ are the spherical coordinates of the arrow (Bloch vector) on the unit sphere:

- **North pole** ($\\theta = 0$): $|0\\rangle$. **South pole** ($\\theta = \\pi$): $|1\\rangle$.
- **Height** of the arrow gives the measurement probabilities: $P(0) = \\cos^2(\\theta/2) = (1+z)/2$ and $P(1) = (1-z)/2$.
- **Equator** ($\\theta = \\pi/2$): equal superpositions, 0 and 1 each with probability $1/2$. $|+\\rangle$ lies on the $+x$ axis, $|-\\rangle$ on the $-x$ axis, $|{+i}\\rangle$ on the $+y$ axis.
- **Angle** $\\varphi$ around the $z$ axis is the relative phase. It does not change the probabilities directly, but it changes how later gates interfere.
- **Gates are rotations** of the sphere: $X$ rotates by $\\pi$ around the $x$ axis, $Z$ by $\\pi$ around the $z$ axis, and $H$ swaps the $x$ and $z$ axes.
- **Several qubits:** each qubit gets its own sphere. If a qubit is entangled with others, it has no state of its own and its arrow becomes shorter than 1 (it points into the sphere). For a maximally entangled qubit, e.g. in a Bell state, the arrow shrinks to the center.`,
    },
    {
      title: "Scalar product (inner product)",
      markdown: `The **scalar product** (inner product) of two states $|\\varphi\\rangle$ and $|\\psi\\rangle$ is written $\\langle\\varphi|\\psi\\rangle$. The **bra** $\\langle\\varphi|$ is the conjugate transpose of the **ket** $|\\varphi\\rangle$, i.e. a row vector with complex-conjugated entries. Multiplying row by column gives a single complex number:

$$\\langle\\varphi|\\psi\\rangle = \\sum_{x} \\overline{\\varphi_x}\\,\\psi_x$$

For example, with $|\\varphi\\rangle = |+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$ and $|\\psi\\rangle = |0\\rangle$ we get $\\langle +|0\\rangle = \\frac{1}{\\sqrt{2}}\\cdot 1 + \\frac{1}{\\sqrt{2}}\\cdot 0 = \\frac{1}{\\sqrt{2}}$.

What it tells us:

- **Length of a state:** $\\langle\\psi|\\psi\\rangle = \\sum_x |\\psi_x|^2$ is the squared length of the vector. For every valid quantum state it is exactly 1 (normalization).
- **Orthogonality:** $\\langle\\varphi|\\psi\\rangle = 0$ means the two states are perfectly distinguishable, e.g. $\\langle 0|1\\rangle = 0$. The basis states are orthonormal: $\\langle x|y\\rangle = 1$ if $x = y$, otherwise 0.
- **Measurement probabilities:** the probability of finding $|\\psi\\rangle$ in the basis state $|x\\rangle$ is $|\\langle x|\\psi\\rangle|^2 = |c_x|^2$.
- **Expressions like** $\\langle\\psi|U^\\dagger U|\\psi\\rangle$ are the scalar product of the state $U|\\psi\\rangle$ with itself, i.e. its squared length after the gate $U$ was applied.`,
    },
    {
      title: "Properties of quantum gates: unitarity",
      markdown: `Every quantum gate is described by a **unitary** matrix $U$:

$$U^\\dagger U = U U^\\dagger = I$$

Here $U^\\dagger$ is the conjugate transpose of $U$ (transpose it and replace every entry by its complex conjugate). For example, $X^\\dagger X = I$ and $H^\\dagger H = I$. This has important consequences:

- **Probabilities stay normalized:** $\\langle\\psi|U^\\dagger U|\\psi\\rangle = \\langle\\psi|\\psi\\rangle = 1$, so after every gate the probabilities still add up to 1. The left side is the scalar product of $U|\\psi\\rangle$ with itself (see above).
- **Every gate is reversible:** the inverse of $U$ is $U^\\dagger$. $H$ and $X$ are their own inverse; $S^\\dagger$ undoes $S$.
- **Columns are orthonormal**, all eigenvalues have absolute value 1 (they are of the form $e^{i\\phi}$), and $|\\det U| = 1$.
- **Determinant** $\\det U$: a single number computed from a square matrix. For a $2 \\times 2$ matrix it is $\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$; in general it is the product of all eigenvalues. Geometrically it is the factor by which the matrix scales volumes. $\\det U \\neq 0$ means the matrix is invertible. For unitary matrices $|\\det U| = 1$, so a gate never stretches or shrinks the state space, only rotates or reflects it. Examples: $\\det X = 0 \\cdot 0 - 1 \\cdot 1 = -1$, $\\det H = \\frac{1}{2}(-1 - 1) = -1$, $\\det S = i$.
- **Combining gates:** gates applied one after the other are multiplied, the first gate on the right: $U_2 U_1 |\\psi\\rangle$. Gates on different qubits at the same time are combined with the tensor product, e.g. $H_0 \\otimes X_1$. Products and tensor products of unitary matrices are again unitary.
- **Measurement is not unitary:** it is the only operation in the circuit that cannot be undone.`,
    },
  ];
}

/** A run of intermediate steps that belongs together (one canvas node or one Grover component). */
export interface StepGroup {
  type: "group";
  label: string;
  description: string;
  children: StepTreeItem[];
  /** Index of the first and last step of the group (inclusive). */
  first: number;
  last: number;
}

export type StepTreeItem = { type: "step"; index: number } | StepGroup;

/** Short explanation of a Grover component, keyed by the label from groverSegments.ts. */
function groverComponentDescription(component: string): string {
  if (component.startsWith("Uniform superposition")) {
    return "A Hadamard gate on every qubit of the register: $H^{\\otimes n}|0\\dots0\\rangle = \\frac{1}{\\sqrt{N}} \\sum_x |x\\rangle$. Every basis state gets the same amplitude $1/\\sqrt{N}$, so the search starts without preferring any state.";
  }
  if (component.startsWith("Oracle")) {
    return "The oracle marks the searched states by flipping their sign: $O|x\\rangle = -|x\\rangle$ if $x$ is marked, otherwise $O|x\\rangle = |x\\rangle$. The probabilities do not change yet, only the phase of the marked states.";
  }
  if (component.startsWith("Diffusion operator")) {
    return "The diffusion operator reflects all amplitudes about their mean: $D = 2|s\\rangle\\langle s| - I = H^{\\otimes n}(2|0\\rangle\\langle 0| - I)H^{\\otimes n}$, built from H, X, a multi-controlled Z, X and H. The marked states (negative amplitude) grow, all others shrink.";
  }
  return "";
}

const GROVER_DESCRIPTION =
  "Grover's search algorithm: a uniform superposition, followed by repeated iterations of the oracle and the diffusion operator. Open it to see the individual components.";

const BASIS_ENCODING_DESCRIPTION =
  "Basis encoding writes a classical number into the qubits as its binary representation: an X gate flips every qubit whose bit is 1, e.g. $5 = 101_2 \\mapsto |101\\rangle$. Qubits whose bit is 0 stay in $|0\\rangle$, and no superposition is created.";

function encodingName(node: Node): string | undefined {
  if (node.type !== StatePreparationNode) return undefined;
  return node.data?.label === "Encode Value"
    ? node.data?.encodingType
    : node.data?.label;
}

function describeNode(
  node: Node | undefined,
  hasGroverComponents: boolean,
): { label: string; description: string } | null {
  if (hasGroverComponents || node?.type === GroverNode) {
    return { label: "Grover operator", description: GROVER_DESCRIPTION };
  }
  if (!node) return null;
  const encoding = encodingName(node);
  if (encoding === "Basis Encoding") {
    return { label: "Basis encoding", description: BASIS_ENCODING_DESCRIPTION };
  }
  const label = encoding ?? node.data?.label ?? node.type ?? "Node";
  return {
    label: String(label),
    description: `The gates generated by the node "${label}".`,
  };
}

/**
 * Groups the intermediate steps into collapsible blocks: every run of at least two
 * consecutive steps from the same canvas node becomes one group (e.g. a Grover operator
 * or a basis encoding). Grover groups are further split into their components
 * (uniform superposition, oracle, diffusion operator). Single steps stay ungrouped.
 */
export function buildStepTree(
  steps: DiracStep[],
  nodes: Node[],
): StepTreeItem[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const items: StepTreeItem[] = [];

  let i = 0;
  while (i < steps.length) {
    const nodeId = steps[i].nodeId;
    let j = i + 1;
    while (nodeId && j < steps.length && steps[j].nodeId === nodeId) j++;

    const hasComponents = steps.slice(i, j).some((s) => s.component);
    const info =
      nodeId && (j - i >= 2 || hasComponents)
        ? describeNode(nodeById.get(nodeId), hasComponents)
        : null;

    if (!info) {
      items.push({ type: "step", index: i });
      i++;
      continue;
    }

    const children: StepTreeItem[] = [];
    let k = i;
    while (k < j) {
      const component = steps[k].component;
      let m = k + 1;
      while (component && m < j && steps[m].component === component) m++;
      if (component) {
        children.push({
          type: "group",
          label: component,
          description: groverComponentDescription(component),
          children: Array.from({ length: m - k }, (_, d) => ({
            type: "step" as const,
            index: k + d,
          })),
          first: k,
          last: m - 1,
        });
      } else {
        children.push({ type: "step", index: k });
      }
      k = m;
    }

    items.push({ type: "group", ...info, children, first: i, last: j - 1 });
    i = j;
  }

  return items;
}

/**
 * Converts Markdown text into LaTeX-compatible text.
 */
export function markdownToLatex(md: string): string {
  // step 1: protect the math blocks first
  const mathBlocks: string[] = [];
  let out = md
    .replace(/\$\$[\s\S]*?\$\$/g, (m) => {
      mathBlocks.push(m);
      return `%%MATH${mathBlocks.length - 1}%%`;
    })
    .replace(/\$[^$\n]+\$/g, (m) => {
      mathBlocks.push(m);
      return `%%MATH${mathBlocks.length - 1}%%`;
    });

  // step 2: headers (before bold/italic)
  out = out
    .replace(
      /^#{4}\s+(.+)$/gm,
      (_: string, t: string) => `\\subsubsection*{${t}}`,
    )
    .replace(
      /^#{3}\s+(.+)$/gm,
      (_: string, t: string) => `\\subsubsection*{${t}}`,
    )
    .replace(/^#{2}\s+(.+)$/gm, (_: string, t: string) => `\\subsection*{${t}}`)
    .replace(/^#{1}\s+(.+)$/gm, (_: string, t: string) => `\\section*{${t}}`);

  // step 3: bold and italic
  out = out
    .replace(
      /\*\*\*([^*\n]+)\*\*\*/g,
      (_: string, t: string) => `\\textbf{\\textit{${t}}}`,
    )
    .replace(/\*\*([^*\n]+)\*\*/g, (_: string, t: string) => `\\textbf{${t}}`)
    .replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      (_: string, t: string) => `\\textit{${t}}`,
    );

  // step 4: lists
  out = out
    .replace(/^[-*]\s+(.+)$/gm, (_: string, t: string) => `\\item ${t}`)
    .replace(
      /((?:\\item .+\n?)+)/g,
      (_: string, items: string) =>
        `\\begin{itemize}\n${items}\\end{itemize}\n`,
    );

  // step 5: miscellaneous
  out = out
    .replace(/^---$/gm, "\\hrule\\vspace{0.5em}")
    .replace(/`([^`]+)`/g, (_: string, t: string) => `\\texttt{${t}}`)
    .replace(/→/g, "$\\rightarrow$")
    .replace(/←/g, "$\\leftarrow$")
    .replace(/₀/g, "$_0$")
    .replace(/₁/g, "$_1$")
    .replace(/₂/g, "$_2$");

  // step 6: bra-ket outside of math
  out = out.replace(/\|([^|\n⟩%%]{0,20})⟩/g, (_: string, s: string) => {
    const inner = s.replace(/ψ/g, "\\psi").replace(/φ/g, "\\phi");
    return `$|${inner}\\rangle$`;
  });

  // step 7: restore the math blocks
  out = out.replace(/%%MATH(\d+)%%/g, (_: string, i: string) => {
    const block = mathBlocks[parseInt(i)];
    if (block.startsWith("$$")) {
      const inner = block.slice(2, -2).trim();
      return `\\begin{equation}\n${inner}\n\\end{equation}`;
    }
    return block;
  });

  return out;
}

export interface LearningTerm {
  term: string;
  /** Markdown with $...$ math, ASCII outside of math. */
  definition: string;
}

export interface LearningContext {
  numQubits: number;
  entangled: boolean;
  /** QASM gate names of the intermediate steps, e.g. ["h", "cx"]. */
  gateNames: string[];
  /** Labels of the step groups, e.g. "Grover operator" or "Basis encoding". */
  groupLabels: string[];
}

/**
 * The terms a reader learns from the learning material of this model, as a word list for
 * the beginning of the PDF. Core terms are always listed; terms such as entanglement,
 * Grover's algorithm or rotation gates only when the model uses them.
 */
export function learningTerms({
  numQubits,
  entangled,
  gateNames,
  groupLabels,
}: LearningContext): LearningTerm[] {
  const gates = new Set(gateNames.map((g) => g.toLowerCase()));
  const has = (...names: string[]) => names.some((n) => gates.has(n));
  const hasGroup = (label: string) =>
    groupLabels.some((l) => l.toLowerCase().includes(label.toLowerCase()));
  const terms: LearningTerm[] = [
    {
      term: "Qubit",
      definition:
        "the quantum counterpart of a bit, a superposition $\\alpha|0\\rangle + \\beta|1\\rangle$ of the basis states.",
    },
    {
      term: "Basis state",
      definition:
        "one of the $2^n$ classical bit strings of the register, e.g. $|00\\rangle$ or $|01\\rangle$.",
    },
    {
      term: "Superposition",
      definition: "a weighted sum of several basis states at the same time.",
    },
    {
      term: "Amplitude",
      definition:
        "the complex weight $c_x$ of a basis state; $|c_x|^2$ is its measurement probability.",
    },
    {
      term: "Normalization",
      definition: "the measurement probabilities always add up to 1.",
    },
    {
      term: "Dirac (bra-ket) notation",
      definition:
        "writing states as kets $|\\psi\\rangle$ and their conjugate transposes as bras $\\langle\\psi|$.",
    },
    {
      term: "State vector",
      definition: `the list of all $2^n$ amplitudes; here $2^{${numQubits}} = ${2 ** numQubits}$ entries.`,
    },
    {
      term: "Tensor product",
      definition:
        "combines the states and gates of several qubits, e.g. $|0\\rangle \\otimes |1\\rangle = |01\\rangle$.",
    },
    {
      term: "Quantum gate",
      definition:
        "an operation on qubits, described by a unitary matrix that multiplies the state vector.",
    },
    {
      term: "Reading a matrix",
      definition:
        "column $j$ belongs to the input basis state $|j\\rangle$ (the first column to $|0\\rangle$ or $|00\\rangle$), row $i$ to the output $|i\\rangle$.",
    },
    {
      term: "Unitarity",
      definition:
        "$U^\\dagger U = I$: every gate is reversible and keeps the state normalized.",
    },
    {
      term: "Scalar product",
      definition:
        "$\\langle\\varphi|\\psi\\rangle$, measures the overlap of two states; $|\\langle x|\\psi\\rangle|^2$ is a measurement probability.",
    },
    {
      term: "Determinant",
      definition:
        "a number computed from a square matrix; $|\\det U| = 1$ for every gate.",
    },
    {
      term: "Global phase",
      definition:
        "an overall factor $e^{i\\gamma}$ of the state that cannot be measured.",
    },
    {
      term: "Measurement",
      definition:
        "yields a basis state with probability $|c_x|^2$ and is the only non-reversible operation.",
    },
  ];

  if (gateNames.length > 0) {
    terms.push({
      term: "State evolution",
      definition:
        "following the state step by step, $|\\psi_{k+1}\\rangle = U_k|\\psi_k\\rangle$, through the intermediate steps.",
    });
  }
  if (
    has(
      "cx",
      "cnot",
      "cy",
      "cz",
      "ch",
      "crx",
      "cry",
      "crz",
      "cp",
      "ccx",
      "toffoli",
      "cswap",
    ) ||
    gateNames.some((g) => g.startsWith("mc_"))
  ) {
    terms.push({
      term: "Controlled gate",
      definition:
        "a gate that acts on its target only if the control qubit(s) are $|1\\rangle$, e.g. CNOT or Toffoli.",
    });
  }
  if (has("rx", "ry", "rz", "crx", "cry", "crz", "p", "u1", "u2", "u3")) {
    terms.push({
      term: "Rotation gate",
      definition:
        "rotates the state on the Bloch sphere by an angle $\\theta$ around an axis.",
    });
  }
  if (numQubits === 1) {
    terms.push({
      term: "Bloch sphere",
      definition:
        "pictures a single-qubit state as a point on the unit sphere, with $|0\\rangle$ at the north pole.",
    });
  }
  if (numQubits >= 2) {
    terms.push({
      term: entangled ? "Entanglement" : "Separability and entanglement",
      definition: entangled
        ? "the state of the qubits cannot be written as a tensor product of single-qubit states, as in this model."
        : "a state is separable if it is a tensor product of single-qubit states (as in this model), otherwise entangled.",
    });
  }
  if (entangled) {
    terms.push({
      term: "Persistence",
      definition:
        "the minimum number of qubits that must be measured until the remaining state is separable.",
    });
  }
  if (hasGroup("Basis encoding")) {
    terms.push({
      term: "Basis encoding",
      definition:
        "writes a classical number into the qubits as its binary representation, e.g. $5 \\mapsto |101\\rangle$.",
    });
  }
  if (hasGroup("Grover")) {
    terms.push(
      {
        term: "Grover's algorithm",
        definition:
          "searches marked states by repeatedly amplifying their amplitudes.",
      },
      {
        term: "Oracle",
        definition: "marks the searched states by flipping their sign.",
      },
      {
        term: "Diffusion operator",
        definition:
          "reflects all amplitudes about their mean, so the marked states grow.",
      },
    );
  }
  return terms;
}

/** LaTeX word list of the terms learned, placed at the beginning of the export. */
export function buildLearningTermsLatexSection(
  context: LearningContext,
): string {
  const items = learningTerms(context)
    .map((t) => `  \\item[${t.term}] ${markdownToLatex(t.definition)}`)
    .join("\n");
  return `\\section*{What you will learn}
\\addcontentsline{toc}{section}{What you will learn}

This document explains the following terms using the model as an example:

\\begin{description}
${items}
\\end{description}

`;
}

/** True for the Bloch sphere topic, which the export places in its own Bloch sphere section. */
export function isBlochTopic(topic: MathTopic): boolean {
  return topic.title.includes("Bloch");
}

/**
 * LaTeX section with the basic concepts, used by the single and the "Export all" export.
 * The Bloch sphere topic is left out, the export shows it next to the sphere (single qubit only).
 */
export function buildBasicsLatexSection(numQubits: number): string {
  const topics = basicsTopics(numQubits)
    .filter((t) => !isBlochTopic(t))
    .map((t) => `\\subsection{${t.title}}\n\n${markdownToLatex(t.markdown)}\n`)
    .join("\n");
  return `\\section{Basics}\n\n${topics}\n`;
}
