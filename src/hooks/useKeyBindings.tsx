import { useEffect } from "react";

export default function useKeyBindings({
  undo,
  redo,
}: {
  undo: () => void;
  redo: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();

      switch (true) {
        case e.ctrlKey && key === "z": {
          console.log("registered");
          undo();
          break;
        }
        case e.ctrlKey && key === "y": {
          console.log("registered");
          redo();
          break;
        }
        default: {
          break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  return null;
}
