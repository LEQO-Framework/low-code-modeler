import { User } from "lucide-react";
import React from "react";

interface HistoryPanelProps {
  history: any[];
  experienceLevel: string;
  myClientID?: number;
}

const VersioningPanel: React.FC<HistoryPanelProps> = ({ history, experienceLevel, myClientID }) => {
  console.log(history)
  console.log(myClientID)
  return (
    <div
      className="absolute bottom-4 left-1/2 transform translate-x-[-80px] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg w-64 flex flex-col overflow-y-auto z-50 text-lg"
      style={{ fontFamily: "'Times New Roman', serif", height: "100px", // fixed height
        minHeight: "50px",
        maxHeight: "100px",}}
    >
      <h3 className="font-semibold mb-1 text-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
        History
      </h3>

      {history.map((item, index) => {
        const displayName = Number(myClientID) === item.userId? "Me" : item.user;
        console.log("USER ID", item.userId)
        console.log("DISPLAY NAME", displayName)
        return (
          <div key={index} className="border-b border-gray-700 py-1">
            {item.type === "node-added" && (
              <>
                <strong>{displayName}</strong> added node {item.label}
              </>
            )}
            {item.type === "node-removed" && (
              <>
                <strong>{displayName}</strong> removed node {item.nodeId}
              </>
            )}
            {item.type === "edge-added" && (
              <>
                <strong>{displayName}</strong> connected {item.source} → {item.target}
              </>
            )}
            {item.type === "edge-removed" && (
              <>
                <strong>{displayName}</strong> removed edge {item.edgeId}
              </>
            )}
          </div>
        )
    })}
    </div>
  );
};

export default VersioningPanel;
