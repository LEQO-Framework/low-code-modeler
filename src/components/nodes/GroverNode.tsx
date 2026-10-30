import { memo, useState, useEffect } from "react";
import { Node, useReactFlow } from "reactflow";
import { appendHistory, useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import OutputPort from "../utils/outputPort";
import { awareness } from "@/yjs";
import { AlertCircle } from "lucide-react";
import {
  expandGroverToSubprocess,
  readGroverSettings,
} from "@/lib/expandGrover";

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
  setContainsPlaceholder: state.setContainsPlaceholder,
});

export const GroverNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const {
    updateNodeValue,
    nodes,
    edges,
    setSelectedNode,
    setContainsPlaceholder,
  } = useStore(selector, shallow);

  const [numQubitsStr, setNumQubitsStr] = useState(
    data.numQubits !== undefined &&
      data.numQubits !== null &&
      data.numQubits !== ""
      ? String(data.numQubits)
      : "",
  );

  const [targetStates, setTargetStates] = useState(data.targetStates || "");

  const [iterationsStr, setIterationsStr] = useState(
    data.numIterations !== undefined &&
      data.numIterations !== null &&
      data.numIterations !== ""
      ? String(data.numIterations)
      : "",
  );

  const [outputs, setOutputs] = useState(data.outputs || []);
  const reactFlow = useReactFlow();
  const expandSettings = readGroverSettings(data);

  // Opens this node as a subprocess: a "Grover Search Algorithm" group with the palette
  // blocks it is made of, Prepare State (uniform superposition) followed by
  // Grover Oracle → Grover Diffuser for every iteration. Collapsing the group restores it.
  const expand = () => {
    if (typeof expandSettings === "string") return;
    const currentNodes = reactFlow.getNodes();
    const currentEdges = reactFlow.getEdges();
    const self = currentNodes.find((n) => n.id === id);
    if (!self) return;
    const result = expandGroverToSubprocess(
      self,
      currentNodes,
      currentEdges,
      expandSettings,
    );
    // keep the compact version in the undo history
    useStore.setState((state: any) => ({
      ...appendHistory(state.history, state.historyIndex, {
        nodes: structuredClone(currentNodes),
        edges: structuredClone(currentEdges),
      }),
      redoStack: [],
    }));
    setSelectedNode(null);
    reactFlow.setNodes(result.nodes);
    reactFlow.setEdges(result.edges);
  };
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Dynamic context state tracking for room collaborative view states
  const [mixedView, setMixedView] = useState(false);
  const [hasPioneerUser, setHasPioneerUser] = useState(false);
  const [hasExplorerUser, setHasExplorerUser] = useState(false);

  const [missingQubitsError, setMissingQubitsError] = useState(false);
  const [missingTargetStatesError, setMissingTargetStatesError] =
    useState(false);
  const [targetStateOutOfBoundsError, setTargetStateOutOfBoundsError] =
    useState(false);

  useEffect(() => {
    setMissingQubitsError(String(numQubitsStr).trim() === "");
    setMissingTargetStatesError(targetStates.trim() === "");
  }, [numQubitsStr, targetStates]);

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (data.numQubits !== undefined && data.numQubits !== null) {
      setNumQubitsStr(String(data.numQubits));
    }

    if (data.targetStates !== undefined && data.targetStates !== null) {
      const hasLetters = /[a-zA-Z]/.test(data.targetStates);
      setContainsPlaceholder(hasLetters);
      setTargetStates(data.targetStates);
    }

    if (
      data.numIterations !== undefined &&
      data.numIterations !== null &&
      data.numIterations !== ""
    ) {
      setIterationsStr(String(data.numIterations));
    } else {
      setIterationsStr("");
    }
  }, [
    data.numQubits,
    data.targetStates,
    data.numIterations,
    setContainsPlaceholder,
  ]);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;

      awareness.getStates().forEach((state: any) => {
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
        }
      });

      setRemoteHighlightColor(foundColor);
    };

    checkRemoteSelection();
    awareness.on("change", checkRemoteSelection);

    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]);

  // Monitor awareness states for active users and their selected roles
  useEffect(() => {
    const checkUserRoles = () => {
      const states = awareness.getStates();
      let hasPioneer = false;
      let hasExplorer = false;

      states.forEach((state: any) => {
        if (state.cursor && state.cursor.role) {
          if (state.cursor.role === "pioneer") hasPioneer = true;
          if (state.cursor.role === "explorer") hasExplorer = true;
        }
      });

      setHasPioneerUser(hasPioneer);
      setHasExplorerUser(hasExplorer);
      setMixedView(hasPioneer && hasExplorer);
    };

    checkUserRoles();
    awareness.on("change", checkUserRoles);

    return () => {
      awareness.off("change", checkUserRoles);
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  const parsedNumQubits = parseInt(numQubitsStr, 10);

  const maxIndex =
    !isNaN(parsedNumQubits) && parsedNumQubits > 0
      ? (1 << parsedNumQubits) - 1
      : 0;

  useEffect(() => {
    if (targetStates.trim() === "") {
      setTargetStateOutOfBoundsError(false);
      return;
    }

    // Do not validate bounds while placeholders/letters are being used.
    if (/[a-zA-Z]/.test(targetStates)) {
      setTargetStateOutOfBoundsError(false);
      return;
    }

    const states = targetStates
      .split(",")
      .map((state) => state.trim())
      .filter((state) => state !== "");

    const hasOutOfBoundsState = states.some((state) => {
      const parsedState = parseInt(state, 10);

      return !isNaN(parsedState) && parsedState > maxIndex;
    });

    setTargetStateOutOfBoundsError(hasOutOfBoundsState);
  }, [targetStates, maxIndex]);

  return (
    <div className="grand-parent" style={{ width: 320, height: 420 }}>
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500",
            mixedView && "border-purple-400",
          )}
          style={{
            borderColor: remoteHighlightColor
              ? remoteHighlightColor
              : selected
                ? "#3B82F6"
                : "#374151",
            boxShadow: remoteHighlightColor
              ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}`
              : undefined,
            height: `420px`,
          }}
        >
          {missingQubitsError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />

              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap">
                Number of elements is required.
              </div>
            </div>
          )}

          {missingTargetStatesError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />

              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[150px] whitespace-nowrap"
                style={{
                  top: missingQubitsError ? "50px" : "35px",
                }}
              >
                Marked states are required.
              </div>
            </div>
          )}

          {targetStateOutOfBoundsError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />

              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[180px] whitespace-nowrap"
                style={{
                  top: missingQubitsError
                    ? missingTargetStatesError
                      ? "95px"
                      : "50px"
                    : missingTargetStatesError
                      ? "80px"
                      : "35px",
                }}
              >
                Marked state is outside the maximum index.
              </div>
            </div>
          )}

          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: "52px" }}>
            <div
              className="w-full bg-blue-300 py-1 px-2 flex items-center"
              style={{ height: "inherit" }}
            >
              <img
                src="groverIcon.png"
                alt="Grover icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />

              <div className="h-full w-[1px] bg-black mx-2" />

              <div className="flex flex-col justify-center pl-2 leading-tight select-none w-full">
                {mixedView ? (
                  <span className="font-semibold text-xs text-blue-900 block">
                    P: Grover's Algorithm / E: Search Element(s)
                  </span>
                ) : !hasPioneerUser && hasExplorerUser ? (
                  <span className="font-semibold text-sm">
                    Search Element(s)
                  </span>
                ) : (
                  <span className="font-semibold text-sm">
                    Grover's Algorithm
                  </span>
                )}
              </div>

              <button
                onClick={expand}
                disabled={typeof expandSettings === "string"}
                className="nodrag flex-shrink-0 ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-700 text-blue-900 bg-white/70 hover:bg-white transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  typeof expandSettings === "string"
                    ? expandSettings
                    : `Open as subprocess: Prepare State (uniform superposition) → ${expandSettings.iterations} × (Grover Oracle → Grover Diffuser). Collapse the subprocess to get this block back.`
                }
              >
                ▸ Expand
              </button>
            </div>
          </div>

          {/* CONFIGURATION BODY */}
          <div className="px-4 py-1 mt-3">
            {/* QUBITS / ELEMENTS FIELD */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                {mixedView
                  ? "Number of Qubits / Number of Elements:"
                  : !hasPioneerUser && hasExplorerUser
                    ? "Number of Elements:"
                    : "Number of Qubits:"}
              </label>

              <input
                type="text"
                placeholder="e.g. 3"
                inputMode="numeric"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={numQubitsStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");

                  setNumQubitsStr(val);

                  const parsed = parseInt(val, 10);

                  if (!isNaN(parsed)) {
                    handleChange("numQubits", parsed);
                  }
                }}
              />
            </div>

            {/* TARGET STATES / ELEMENTS TO SEARCH FIELD */}
            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">
                {mixedView
                  ? "Marked States / Element(s) to Search:"
                  : !hasPioneerUser && hasExplorerUser
                    ? "Element(s) to Search:"
                    : "Marked States (Comma-separated indices):"}
              </label>

              <input
                type="text"
                placeholder="e.g. 0, 3, 7"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={targetStates}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9,\s]/g, "");

                  setTargetStates(val);
                  handleChange("targetStates", val);

                  const hasLetters = /[a-zA-Z]/.test(val);
                  setContainsPlaceholder(hasLetters);
                }}
              />

              <p className="text-[10px] text-gray-500 mt-1 text-center">
                Max index: {maxIndex}
              </p>
            </div>

            <div className="mt-2">
              <label className="text-xs font-semibold text-gray-700">
                Iterations (Oracle + Diffusion):
              </label>

              <input
                type="text"
                placeholder="Auto"
                className="w-full p-1 mt-1 text-sm text-center text-black border-2 border-dashed border-blue-200 rounded-full outline-none focus:border-blue-400 transition-colors"
                value={iterationsStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");

                  setIterationsStr(val);

                  handleChange(
                    "numIterations",
                    val === "" ? "" : parseInt(val, 10),
                  );
                }}
              />
            </div>
          </div>

          {/* NATIVE OUTPUT PORT */}
          <div className="custom-node-port-out absolute bottom-4 right-0">
            <OutputPort
              node={node}
              index={0}
              type={"quantum"}
              nodes={nodes}
              outputs={outputs}
              setOutputs={setOutputs}
              edges={edges}
              sizeError={sizeError}
              outputIdentifierError={outputIdentifierError}
              updateNodeValue={updateNodeValue}
              setOutputIdentifierError={setOutputIdentifierError}
              setSizeError={setSizeError}
              setSelectedNode={setSelectedNode}
              active={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
