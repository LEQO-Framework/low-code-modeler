import React from "react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { AddNodePanel } from "./panels";

type PanelProps = {
  ancillaMode: any;
  onAddNode?: (
    def: any,
    customPosition?: { x: number; y: number },
    pluginData?: any,
  ) => void;
};

const selector = (state: { selectedNode: Node | null }) => ({
  selectedNode: state.selectedNode,
});

export const Palette = ({ ancillaMode, onAddNode }: PanelProps) => {
  const { selectedNode } = useStore(selector, shallow);
  const CurrentPanel = getPanel(selectedNode?.type || "");

  return (
    <div className="bg-gray-100 border-gray-200 ">
      <CurrentPanel ancillaMode={ancillaMode} onAddNode={onAddNode} />
    </div>
  );
};

const getPanel = (_type: string): React.ComponentType<PanelProps> => {
  return AddNodePanel;
};
