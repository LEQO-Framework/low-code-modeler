import React from "react";
import { toSvg } from "html-to-image"; // Ensure this library is installed in your project

interface DownloadButtonProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ containerRef }) => {
  const handleExport = async () => {
    if (!containerRef.current) {
      console.error("Container ref is null");
      return;
    }

    try {
      // Generate SVG excluding minimap and controls
      const dataUrl = await toSvg(containerRef.current, {
        filter: (node) =>
          !node?.classList?.contains("react-flow__minimap") &&
          !node?.classList?.contains("react-flow__controls"),
      });

      // Trigger download
      const a = document.createElement("a");
      a.setAttribute("download", "reactflow-diagram.svg");
      a.setAttribute("href", dataUrl);
      a.click();
    } catch (error) {
      console.error("Error exporting SVG:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
      title="Export as SVG"
    >
      <img src="assets/export.png" alt="Export" width="16px" height="16px" />
    </button>
  );
};

export default DownloadButton;
