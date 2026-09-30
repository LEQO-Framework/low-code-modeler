import { memo, useState, useEffect } from "react";
import { Node, Handle, Position } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import OutputPort from "../utils/outputPort";
import { AlertCircle } from "lucide-react";
import { quantumConstructColor } from "@/constants";
import { awareness } from "@/yjs"; // Ensure this import points to your Yjs awareness configuration

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
  experienceLevel: state.experienceLevel,
  setContainsPlaceholder: state.setContainsPlaceholder,
});

export const UniversalOracleNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const {
    updateNodeValue,
    nodes,
    edges,
    setSelectedNode,
    experienceLevel,
    setContainsPlaceholder,
  } = useStore(selector, shallow);

  const [mode, setMode] = useState(data.mode || "phase");
  const [targetStates, setTargetStates] = useState(data.targetStates || "");
  const [formatError, setFormatError] = useState(false);

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [missingTargetStatesError, setMissingTargetStatesError] =
    useState(false);

  // Dynamic user role tracking states
  const [mixedView, setMixedView] = useState(false);
  const [_hasPioneerUser, setHasPioneerUser] = useState(false);
  const [_hasExplorerUser, setHasExplorerUser] = useState(false);

  useEffect(() => {
    setMissingTargetStatesError(targetStates.trim() === "");
  }, [targetStates]);

  // Monitor room workspace users and roles
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

  // Get the size from the connected input register.
  // If no upstream node provides a size, return undefined so that
  // numeric marked states are not considered out of bounds.
  const getRegisterSize = (
    currentNodeId: string,
    visited = new Set<string>(),
  ): number | undefined => {
    if (visited.has(currentNodeId)) return undefined;
    visited.add(currentNodeId);

    const incomingEdge = edges.find((e) => e.target === currentNodeId);
    if (!incomingEdge) return undefined;

    const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
    if (!sourceNode) return undefined;

    if (sourceNode.data?.size !== undefined && sourceNode.data?.size !== "") {
      const parsedSize = parseInt(sourceNode.data.size, 10);

      if (!Number.isNaN(parsedSize)) {
        return parsedSize;
      }
    }

    return getRegisterSize(sourceNode.id, visited);
  };

  const inferredQubits = getRegisterSize(id);

  // Only calculate a maximum index when the input register has a size.
  const maxAllowedIndex =
    inferredQubits !== undefined && inferredQubits >= 0
      ? (1 << inferredQubits) - 1
      : undefined;

  const handleChange = (field: string, value: any) => {
    data[field] = value;
    updateNodeValue(id, field, value);
    setSelectedNode(node);
  };

  useEffect(() => {
    if (!targetStates.trim()) {
      setFormatError(false);
      return;
    }

    // Allow letters, numbers, underscores, and commas
    const isValidFormat = /^[a-zA-Z0-9_]+(?:\s*,\s*[a-zA-Z0-9_]+)*$/.test(
      targetStates.trim(),
    );

    if (!isValidFormat) {
      setFormatError(true);
      return;
    }

    // Only check bounds for pure numeric states
    const values = targetStates.split(",").map((x) => x.trim());

    const numericValues = values.filter((v) => /^\d+$/.test(v));

    // Only perform the out-of-bounds check when the connected
    // input register actually provides a size.
    const hasOutOfBounds =
      maxAllowedIndex !== undefined &&
      numericValues.some(
        (idx) =>
          parseInt(idx, 10) < 0 ||
          parseInt(idx, 10) > maxAllowedIndex,
      );

    // Check for duplicate marked states
    const normalizedValues = values.map((value) => value.toLowerCase());
    const hasDuplicateStates =
      new Set(normalizedValues).size !== normalizedValues.length;

    setFormatError(hasOutOfBounds || hasDuplicateStates);
  }, [targetStates, maxAllowedIndex]);

  const isConnected = edges.some((edge) => edge.target === id);

  const [remoteHighlightColor, setRemoteHighlightColor] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any) => {
        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.mySelectedNodeId === id) {
          foundColor = state.cursor.color;
        }
      });

      setRemoteHighlightColor(foundColor);
    };

    // Run once immediately on mount
    checkRemoteSelection();

    // Listen to remote awareness updates
    awareness.on("change", checkRemoteSelection);

    // Clean up listener when the node unmounts
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]);

  // Check whether the marked states contain duplicates for the error message.
  const hasDuplicateStates = (() => {
    if (!targetStates.trim()) return false;

    const values = targetStates.split(",").map((value) => value.trim());
    const normalizedValues = values.map((value) => value.toLowerCase());

    return new Set(normalizedValues).size !== normalizedValues.length;
  })();

  // Check whether a numeric marked state is outside the input register size.
  const hasOutOfBoundsState = (() => {
    if (!targetStates.trim() || maxAllowedIndex === undefined) {
      return false;
    }

    const values = targetStates.split(",").map((value) => value.trim());

    return values
      .filter((value) => /^\d+$/.test(value))
      .some(
        (value) =>
          parseInt(value, 10) < 0 ||
          parseInt(value, 10) > maxAllowedIndex,
      );
  })();

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
          {/* VALIDATION ALERT */}
          {missingTargetStatesError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />
              <div className="absolute top-5 left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[220px] whitespace-nowrap">
                Marked states are required.
              </div>
            </div>
          )}

          {formatError && (
            <div className="absolute top-2 right-[-40px] group z-20">
              <AlertCircle className="text-red-600 w-5 h-5" />

              <div
                className="absolute left-[30px] z-10 bg-white text-xs text-red-600 border border-red-400 px-3 py-1 rounded shadow min-w-[220px] whitespace-nowrap"
                style={{
                  top: missingTargetStatesError ? "50px" : "35px",
                }}
              >
                {hasDuplicateStates
                  ? "The same marked state cannot be specified more than once."
                  : hasOutOfBoundsState
                    ? "Marked state is out of bounds for the input register size."
                    : "Invalid format or out-of-bounds state index."}
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
                src="oracleIcon.png"
                alt="Oracle icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />

              <div className="h-full w-[1px] bg-black mx-2" />

              <div className="flex flex-col justify-center pl-2 leading-tight select-none w-full">
                {mixedView ? (
                  <span className="font-semibold text-xs text-blue-900 block">
                    P: Universal Oracle / E: Mark the Target(s)
                  </span>
                ) : experienceLevel === "explorer" ? (
                  <span className="font-semibold text-sm">
                    Mark the Target(s)
                  </span>
                ) : (
                  <span className="font-semibold text-sm">
                    Universal Oracle
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONFIGURATION PROPERTIES */}
          <div className="px-4 py-1 mt-1">
            <div>
              <label className="text-xs font-normal text-gray-700">
                Oracle Mode:
              </label>

              <select
                className="w-full p-1 mt-1 bg-white rounded-full text-center text-sm text-black border-2 border-blue-200 outline-none focus:border-blue-400 transition-colors"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  handleChange("mode", e.target.value);
                }}
              >
                <option value="boolean">Boolean (Target Qubit Flip)</option>
                <option value="phase">Phase (Phase Kickback)</option>
              </select>
            </div>

            <div className="mt-3">
              <label className="text-xs font-normal text-gray-700">
                Marked States:
              </label>

              <input
                type="text"
                placeholder="e.g. 0, 3, A"
                className={cn(
                  "w-full p-1 mt-1 text-sm text-center text-black border-2 rounded-full outline-none transition-colors",
                  formatError
                    ? "border-red-400 focus:border-red-500"
                    : "border-blue-200 focus:border-blue-400",
                )}
                value={node.data.targetStates || targetStates}
                onChange={(e) => {
                  const val = e.target.value.replace(
                    /[^a-zA-Z0-9,\s]/g,
                    "",
                  );

                  setTargetStates(val);
                  updateNodeValue(node.id, "targetStates", val);

                  const hasLetters = /[a-zA-Z]/.test(val);
                  setContainsPlaceholder(hasLetters);
                }}
              />
            </div>
          </div>

          {/* QUANTUM INPUT PORT */}
          <div className="mt-2 flex flex-col space-y-2">
            <div
              className={cn("relative p-2 flex items-center")}
              style={{
                width: "140px",
                background: quantumConstructColor,
              }}
            >
              <Handle
                type="target"
                id={`quantumHandleInput0${id}`}
                position={Position.Left}
                className={cn(
                  "z-10 circle-port-op !bg-blue-300 !border-gray-400 !absolute !top-1/2 !-translate-y-1/2 -left-[8px]",
                  isConnected
                    ? "!border-solid !border-black !bg-blue-300"
                    : "!border-dashed !bg-gray-200",
                )}
                style={{ width: 12, height: 12 }}
                isConnectable={!isConnected}
              />

              <div className="flex flex-col w-full text-center leading-tight">
                <span className="text-black text-sm truncate">
                  {node.data.inputs?.[0]?.outputIdentifier || "Register"}
                </span>

                <span className="text-[10px] text-gray-600">
                  type: quantum register
                </span>
              </div>
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
