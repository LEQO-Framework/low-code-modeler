import { HocuspocusProvider } from "@hocuspocus/provider";
import React, { useEffect, useState } from "react";

interface UserCountPanelProps {
  provider: HocuspocusProvider;
  roomName: string;
}

const UserCountPanel: React.FC<UserCountPanelProps> = ({ provider, roomName }) => {
  const [userCount, setUserCount] = useState(1);

  useEffect(() => {
  if (!provider) return;

  const updateUserCount = () => {
    const states = provider.awareness.getStates();
    setUserCount(states.size);
  };

  // Initial count
  updateUserCount();

  // Add listener only once
  provider.awareness.on("change", updateUserCount);

  return () => {
    // Remove listener on unmount
    provider.awareness.off("change", updateUserCount);
  };
}, [provider]); // only run when provider changes


  return (
    <div
      className="absolute bottom-4 left-1/2 transform translate-x-[-330px] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-4 z-50 text-lg"
      style={{ fontFamily: "'Times New Roman', serif" , minHeight: "50px",
        maxHeight: "50px"}}
    >
      <span className="font-semibold">Room:</span>
      <span>{roomName}</span>
      <span className="ml-4 font-semibold">Users:</span>
      <span>{userCount}</span>
    </div>
  );
};

export default UserCountPanel;
