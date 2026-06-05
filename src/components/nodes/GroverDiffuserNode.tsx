import { memo, useState, useEffect } from "react";
import { Node, Handle, Position } from "reactflow";
import { useStore } from "@/config/store";
import { shallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import OutputPort from "../utils/outputPort";
import { quantumConstructColor } from "@/constants";
import { awareness } from "@/yjs"; // Imported the room awareness configuration

const selector = (state: any) => ({
  updateNodeValue: state.updateNodeValue,
  nodes: state.nodes,
  edges: state.edges,
  setSelectedNode: state.setSelectedNode,
  experienceLevel: state.experienceLevel
});

export const GroverDiffuserNode = memo((node: Node) => {
  const { id, data, selected } = node;
  const { updateNodeValue, nodes, edges, setSelectedNode, experienceLevel } = useStore(selector, shallow);

  const [outputs, setOutputs] = useState(data.outputs || []);
  const [outputIdentifierError, setOutputIdentifierError] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Added context state tracking for room collaborative view states
  const [mixedView, setMixedView] = useState(false);
  const [hasPioneerUser, setHasPioneerUser] = useState(false);
  const [hasExplorerUser, setHasExplorerUser] = useState(false);

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

  
  const [remoteHighlightColor, setRemoteHighlightColor] = useState<string | null>(null);
  const [selectingUserName, setSelectingUserName] = useState<string | null>(null); // technically not needed, could extend functionality to also show user name next to highlighted node

  useEffect(() => {
    const checkRemoteSelection = () => {
      let foundColor: string | null = null;
      let foundName: string | null = null;

      // Loop through all active client states in the room
      awareness.getStates().forEach((state: any, clientId: number) => {
        // Skip your own client ID so you don't highlight it with your own color
        // if (clientId === awareness.clientID) return;

        // Check if a peer has selected this specific node ID
        if (state.cursor && state.cursor.selectedNodeId === id) {
          foundColor = state.cursor.color;
          foundName = state.cursor.name;
        }
      });

      setRemoteHighlightColor(foundColor);
      setSelectingUserName(foundName);
      console.log("COLOR", foundColor, foundName);
    };

    // Run once immediately on mount
    checkRemoteSelection();

    // 3. Listen to remote awareness updates
    awareness.on("change", checkRemoteSelection);

    // Clean up listener when the node unmounts
    return () => {
      awareness.off("change", checkRemoteSelection);
    };
  }, [id]); // Re-run if node ID changes

  const isConnected = edges.some(edge => edge.target === id);

  return (
    <motion.div
      className="grand-parent"
      initial={false}
      animate={{ width: 320, height: 250 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="grand-parent">
        <div
          className={cn(
            "w-[320px] bg-white border border-solid border-gray-700 shadow-md relative",
            selected && "border-blue-500",
            mixedView && "border-purple-400"
          )}
          style={{
          borderColor: remoteHighlightColor ? remoteHighlightColor : (selected ? "#3B82F6" : "#374151"),
          boxShadow: remoteHighlightColor
            ? `0 0 0 3px ${remoteHighlightColor}40, 0 0 12px ${remoteHighlightColor}` // Glowing aura ring
            : undefined,
          height: `250px`
        }}>
        
          {/* HEADER */}
          <div className="w-full flex items-center" style={{ height: '52px' }}>
            <div className="w-full bg-blue-300 py-1 px-2 flex items-center" style={{ height: 'inherit' }}>
              <img
                src="diffusionIcon.png"
                alt="Grover icon"
                className="w-[40px] h-[40px] object-contain flex-shrink-0"
              />
              <div className="h-full w-[1px] bg-black mx-2" />
              <div className="flex flex-col justify-center pl-2 leading-tight select-none w-full">
                {mixedView ? (
                  <span className="font-semibold text-xs text-blue-900 block">
                    P: Grover Diffuser / E: Emphasize Marked Target(s)
                  </span>
                ) : experienceLevel === "explorer" ? (
                  <span className="font-semibold text-sm">
                    Emphasize Marked Target(s)
                  </span>
                ) : (
                  <span className="font-semibold text-sm">
                    Grover Diffuser
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QUANTUM INPUT PORT */}
          <div className="mt-4 flex flex-col space-y-2">
            <div
              className={cn(
                "relative p-2 flex items-center")}
              style={{ width: "140px", background: quantumConstructColor }}
            >
              <Handle
                type="target"
                id={`quantumHandleInput0${id}`}
                position={Position.Left}
                className={cn(
                  "z-10 circle-port-op !bg-blue-300 !border-gray-400 !absolute !top-1/2 !-translate-y-1/2 -left-[8px]",
                  isConnected
                    ? "!border-solid !border-black !bg-blue-400"
                    : "!border-dashed !bg-gray-200"
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
    </motion.div>
  );
});