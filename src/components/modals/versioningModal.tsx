import React from "react";

interface HistoryPanelProps {
  history: any[];
  experienceLevel: string;
}

const VersioningPanel: React.FC<HistoryPanelProps> = ({ history, experienceLevel }) => {
  return (
    <div
      className="absolute bottom-4 left-1/2 transform translate-x-[-80px] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg w-64 flex flex-col overflow-y-auto z-50 text-lg"
      style={{ fontFamily: "'Times New Roman', serif", height: "50px", // fixed height
        minHeight: "50px",
        maxHeight: "50px",}}
    >
      <h3 className="font-semibold mb-1 text-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
        History
      </h3>

      {history.map((item, index) => (
        <div key={index} className="border-b border-gray-700 py-1">
          {item.type === "node-added" && (
            <>
              <strong>{item.user}</strong> added node {item.label}
            </>
          )}
          {item.type === "node-removed" && (
            <>
              <strong>{item.user}</strong> removed node {item.nodeId}
            </>
          )}
          {item.type === "edge-added" && (
            <>
              <strong>{item.user}</strong> connected {item.source} → {item.target}
            </>
          )}
          {item.type === "edge-removed" && (
            <>
              <strong>{item.user}</strong> removed edge {item.edgeId}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default VersioningPanel;
