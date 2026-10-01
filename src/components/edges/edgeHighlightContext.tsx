import React, { createContext, useContext } from "react";

type EdgeHighlightState = {
  highlightedEdgeId: string | null;
  canSplit: boolean | null;
};

const EdgeHighlightContext = createContext<EdgeHighlightState>({
  highlightedEdgeId: null,
  canSplit: null,
});

export function EdgeHighlightProvider({
  highlightedEdgeId,
  canSplit,
  children,
}: EdgeHighlightState & { children: React.ReactNode }) {
  return (
    <EdgeHighlightContext.Provider value={{ highlightedEdgeId, canSplit }}>
      {children}
    </EdgeHighlightContext.Provider>
  );
}

export function useEdgeMarkerEnd(
  edgeId: string,
  markerEnd: string | undefined,
): string | undefined {
  const { highlightedEdgeId, canSplit } = useContext(EdgeHighlightContext);

  if (edgeId !== highlightedEdgeId || canSplit === null) {
    return markerEnd;
  }

  return canSplit
    ? "url(#low-code-modeler-arrow-highlighted)"
    : "url(#low-code-modeler-arrow-highlighted-invalid)";
}

export function EdgeHighlightMarkers() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <marker
          id="low-code-modeler-arrow-highlighted"
          markerWidth="20"
          markerHeight="20"
          refX="10"
          refY="5"
          viewBox="0 0 10 10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0caa67" />
        </marker>
        <marker
          id="low-code-modeler-arrow-highlighted-invalid"
          markerWidth="20"
          markerHeight="20"
          refX="10"
          refY="5"
          viewBox="0 0 10 10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#e64427" />
        </marker>
      </defs>
    </svg>
  );
}