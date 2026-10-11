export type ShortcutCategory = {
  id: string;
  category: string;
  shortcuts: Shortcut[];
};

export type Shortcut = {
  id: string;
  keys: string;
  description: string;
};

export const shortcuts: ShortcutCategory[] = [
  {
    id: "selection",
    category: "Selection",
    shortcuts: [
      {
        id: "multi-select",
        keys: "Shift + Click",
        description: "Select multiple nodes",
      },
      {
        id: "select-all",
        keys: "Ctrl + A",
        description: "Select all nodes",
      },
      {
        id: "clear-selection",
        keys: "Esc",
        description: "Clear selection",
      },
    ],
  },
  {
    id: "editing",
    category: "Editing",
    shortcuts: [
      {
        id: "copy",
        keys: "Ctrl + C",
        description: "Copy selected nodes",
      },
      {
        id: "paste",
        keys: "Ctrl + V",
        description: "Paste copied nodes",
      },
      {
        id: "cut",
        keys: "Ctrl + X",
        description: "Cut selected nodes",
      },
      {
        id: "duplicate",
        keys: "Ctrl + D",
        description: "Duplicate selected nodes",
      },
      {
        id: "delete",
        keys: "Delete / Backspace",
        description: "Delete selected nodes",
      },
      {
        id: "enter",
        keys: "Enter",
        description: "Add top search result to canvas",
      },
    ],
  },
  {
    id: "history",
    category: "History",
    shortcuts: [
      {
        id: "undo",
        keys: "Ctrl + Z",
        description: "Undo last action",
      },
      {
        id: "redo",
        keys: "Ctrl + Y",
        description: "Redo last action",
      },
    ],
  },
  {
    id: "movement",
    category: "Movement",
    shortcuts: [
      {
        id: "move",
        keys: "Arrow Keys",
        description: "Move selected nodes",
      },
      {
        id: "move-large-step",
        keys: "Shift + Arrow Keys",
        description: "Move selected nodes in larger steps",
      },
    ],
  },
];
