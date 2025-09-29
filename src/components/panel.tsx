import { Node } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import { AddNodePanel, TextPanel, MetadataPanel } from "./panels";

const selector = (state: { selectedNode: Node | null }) => ({
  selectedNode: state.selectedNode,
});

export const CustomPanel = ({
  metadata,
  onUpdateMetadata,
}: {
  metadata: any;
  onUpdateMetadata: any;
}) => {
  const { selectedNode } = useStore(selector, shallow);
  const CurrentPanel = selectedNode
    ? getPanel(selectedNode?.type || "")
    : MetadataPanel;
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    console.log(event);

    // Update the metadata field dynamically
    //const updatedMetadata = {
    //...metadata,
    //[name]: value,
    //};

    // Trigger the callback to update the parent
    onUpdateMetadata(event);
  }

  return (
    <div className="currentPanel-container bg-gray-100 h-full border-gray-200 border text-black">
      <CurrentPanel
        metadata={metadata}
        onUpdateMetadata={handleChange}
      />
    </div>
  );
};

const getPanel = (type: string) => {
  return TextPanel;
};
