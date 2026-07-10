import { useEffect } from "react";

export default function useKeyBindings({
  undo,
  redo,
  copy,
  paste,
  cut,
  selectAll,
  duplicate,
  clearSelection,
}: {
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  cut: () => void;
  selectAll: () => void;
  duplicate: () => void;
  clearSelection: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey; // CtrlKKey Windows/Linux, MetaKey Mac

      switch (true) {
        case ctrlOrMeta && key === "z": {
          console.log("registered");
          undo();
          break;
        }
        case ctrlOrMeta && key === "y": {
          console.log("registered");
          redo();
          break;
        }
        case ctrlOrMeta && key === "c": {
          e.preventDefault();
          copy();
          break;
        }
        case ctrlOrMeta && key === "v": {
          e.preventDefault();
          paste();
          break;
        }
        case ctrlOrMeta && key === "x": {
          e.preventDefault();
          cut();
          break;
        }
        case ctrlOrMeta && key === "a": {
          e.preventDefault();
          selectAll();
          break;
        }
        case ctrlOrMeta && key === "d": {
          e.preventDefault();
          duplicate();
          break;
        }
        case key === "escape": {
          clearSelection();
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
  }, [undo, redo, copy, paste, cut, selectAll, duplicate, clearSelection]);

  return null;
}
