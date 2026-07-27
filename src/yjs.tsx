import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Node, Edge } from "reactflow";

// Create a single shared provider
export const yProvider = new HocuspocusProvider({
  url: import.meta.env.VITE_HOCUSPOCUS_URL,
  name: "reactflow-yjs", // possible TODO for future: different rooms
});

// Shared Yjs document
export const ydoc = yProvider.document;

// Shared maps
export const nodesMap = ydoc.getMap<Node>("nodes");
export const edgesMap = ydoc.getMap<Edge>("edges");
export const awareness = yProvider.awareness;