import { toJpeg } from "html-to-image";
import { getNodesBounds, getViewportForBounds, type Node } from "reactflow";

/** Icon that templates got before they had a preview image of their model. */
export const DEFAULT_TEMPLATE_ICON = "QAOA.png";

const PREVIEW_WIDTH = 480;
const PREVIEW_HEIGHT = 300;

/**
 * Renders the model on the canvas into a small JPEG data URL, fitted to the nodes. Returns `undefined` if the canvas
 * is empty or can't be rendered.
 */
export async function captureFlowPreview(
  container: HTMLElement | null,
  nodes: Node[],
): Promise<string | undefined> {
  const viewport = container?.querySelector<HTMLElement>(
    ".react-flow__viewport",
  );
  if (!viewport || nodes.length === 0) return undefined;

  const { x, y, zoom } = getViewportForBounds(
    getNodesBounds(nodes),
    PREVIEW_WIDTH,
    PREVIEW_HEIGHT,
    0.05,
    2,
    0.1,
  );

  try {
    return await toJpeg(viewport, {
      backgroundColor: "#ffffff",
      quality: 0.85,
      pixelRatio: 1,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      style: {
        width: `${PREVIEW_WIDTH}px`,
        height: `${PREVIEW_HEIGHT}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    });
  } catch (error) {
    console.warn("Could not render the template preview.", error);
    return undefined;
  }
}

/**
 * A schematic SVG of a saved model (nodes as boxes, edges as lines), for templates that have no preview image, e.g.
 * templates saved by an older version.
 */
export function flowSchematic(flowData: any): string | undefined {
  const nodes: any[] = flowData?.nodes ?? [];
  if (nodes.length === 0) return undefined;

  const byId = new Map<string, any>(nodes.map((n) => [n.id, n]));
  const box = (n: any) => {
    // Child nodes are positioned relative to their group.
    let { x, y } = n.positionAbsolute ?? n.position ?? { x: 0, y: 0 };
    if (!n.positionAbsolute && n.parentNode && byId.has(n.parentNode)) {
      const parent = box(byId.get(n.parentNode));
      x += parent.x;
      y += parent.y;
    }
    return {
      x,
      y,
      w: n.width ?? n.style?.width ?? 150,
      h: n.height ?? n.style?.height ?? 80,
    };
  };

  const boxes = new Map(nodes.map((n) => [n.id, box(n)]));
  const all = [...boxes.values()];
  const minX = Math.min(...all.map((b) => b.x));
  const minY = Math.min(...all.map((b) => b.y));
  const maxX = Math.max(...all.map((b) => b.x + b.w));
  const maxY = Math.max(...all.map((b) => b.y + b.h));
  const pad = Math.max(maxX - minX, maxY - minY) * 0.05 + 10;
  const stroke = Math.max(maxX - minX, maxY - minY) / 200 + 1;

  const isGroup = (n: any) => n.type === "group" || /group/i.test(n.type ?? "");

  const groups = nodes
    .filter(isGroup)
    .map((n) => {
      const b = boxes.get(n.id)!;
      return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${stroke * 4}" fill="none" stroke="#94a3b8" stroke-width="${stroke}" stroke-dasharray="${stroke * 4}"/>`;
    })
    .join("");

  const edges = (flowData?.edges ?? [])
    .map((e: any) => {
      const s = boxes.get(e.source);
      const t = boxes.get(e.target);
      if (!s || !t) return "";
      return `<line x1="${s.x + s.w}" y1="${s.y + s.h / 2}" x2="${t.x}" y2="${t.y + t.h / 2}" stroke="#93c5fd" stroke-width="${stroke * 1.5}"/>`;
    })
    .join("");

  const boxesSvg = nodes
    .filter((n) => !isGroup(n))
    .map((n) => {
      const b = boxes.get(n.id)!;
      return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${stroke * 4}" fill="#eff6ff" stroke="#3b82f6" stroke-width="${stroke}"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}" preserveAspectRatio="xMidYMid meet"><rect x="${minX - pad}" y="${minY - pad}" width="${maxX - minX + 2 * pad}" height="${maxY - minY + 2 * pad}" fill="#ffffff"/>${groups}${edges}${boxesSvg}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The image to show for a template: its own icon, or else a schematic of its model. */
export function templateIconSrc(template: any): string {
  const icon: string | undefined = template?.icon;
  if (icon && icon !== DEFAULT_TEMPLATE_ICON) {
    return icon.startsWith("data:") ? icon : `/${icon}`;
  }
  return flowSchematic(template?.flowData) ?? `/${DEFAULT_TEMPLATE_ICON}`;
}
