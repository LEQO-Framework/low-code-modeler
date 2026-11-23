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
      const target = e.target as HTMLElement;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        return;
      }

      const key = e.key?.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey; // CtrlKey Windows/Linux, MetaKey Mac

      switch (true) {
        // preventDefault: otherwise the browser also handles the shortcut
        case ctrlOrMeta && e.shiftKey && key === "z":
        case ctrlOrMeta && key === "y": {
          e.preventDefault();
          redo();
          break;
        }
        case ctrlOrMeta && key === "z": {
          e.preventDefault();
          undo();
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
