import React from "react";

interface HistoryPanelProps {
  history: any[];
}

const VersioningPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform translate-x-[100px] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg w-64 max-h-48 overflow-y-auto z-50">
      <h3 className="font-semibold mb-1 text-sm">History</h3>

      {history.length === 0 && (
        <div className="text-xs opacity-70">Nothing yet…</div>
      )}

      {history.map((item, index) => (
        <div key={index} className="text-xs border-b border-gray-700 py-1">
          {item.type === "node-added" && (
            <> <strong>{item.user}</strong> added node {item.label}</>
          )}
          {item.type === "node-removed" && (
            <> <strong>{item.user}</strong> removed node {item.nodeId}</>
          )}
          {item.type === "edge-added" && (
            <> <strong>{item.user}</strong> connected {item.source} → {item.target}</>
          )}
          {item.type === "edge-removed" && (
            <> <strong>{item.user}</strong> removed edge {item.edgeId}</>
          )}
        </div>
      ))}
    </div>
  );
};

export default VersioningPanel;
