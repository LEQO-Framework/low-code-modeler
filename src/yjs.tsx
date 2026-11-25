import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import type { Node, Edge } from "reactflow";

export const DEFAULT_COLLABORATION_ENDPOINT =
  import.meta.env.VITE_COLLABORATION_ENDPOINT || "ws://127.0.0.1:1234";

// The socket only connects when collaboration mode is switched on, using the
// server address from the configuration (see connectCollaboration).
const yWebsocket = new HocuspocusProviderWebsocket({
  url: DEFAULT_COLLABORATION_ENDPOINT,
  autoConnect: false,
});

// Create a single shared provider
export const yProvider = new HocuspocusProvider({
  websocketProvider: yWebsocket,
  name: "reactflow-yjs",
});
yProvider.attach();

/** Connects to the collaboration server at the given address. */
export function connectCollaboration(url: string) {
  const target = url.trim() || DEFAULT_COLLABORATION_ENDPOINT;
  if (yWebsocket.configuration.url !== target) {
    yWebsocket.disconnect();
    yWebsocket.setConfiguration({ url: target });
    // The handshake with the new server is still pending.
    yProvider.synced = false;
  }
  yWebsocket.shouldConnect = true;
  yWebsocket.connect().catch((error) => {
    console.warn("Collaboration server not reachable:", error);
  });
}

/** Closes the connection to the collaboration server. */
export function disconnectCollaboration() {
  yWebsocket.disconnect();
}

// Shared Yjs document
export const ydoc = yProvider.document;

// Shared maps
export const nodesMap = ydoc.getMap<Node>("nodes");
export const edgesMap = ydoc.getMap<Edge>("edges");
export const awareness = yProvider.awareness;
