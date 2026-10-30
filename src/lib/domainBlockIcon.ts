/**
 * Palette pictures of domain profile blocks. Blocks without an uploaded icon used the
 * generic pictures "Custom Data Type", "Custom Classical Operator" and "Custom Quantum
 * Operator"; instead, a picture in the same style is drawn with the name, the
 * properties and the ports of the block itself.
 */

type BlockKind = "dataType" | "classical" | "quantum";

interface BlockPort {
  name?: string;
  type?: string;
  kind?: string;
}

export interface DomainBlockLike {
  label?: string;
  icon?: string | string[];
  /** Category of the profile editor ("dataTypes", "Classical Operators", ...). */
  category?: string;
  isDataType?: boolean;
  operatorKind?: string;
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  inputPorts?: BlockPort[];
  outputPorts?: BlockPort[];
  properties?: { name?: string; type?: string; required?: boolean }[];
}

/** Pictures that are not uploads, i.e. stand for any block of their category. */
const GENERIC_ICONS = [
  "PaletteIcon_CustomDataType.svg",
  "PaletteIcon_CustomClassicalOperator.png",
  "PaletteIcon_CustomQuantumOperator.png",
  "QAOA.png",
];

/**
 * The icon uploaded for the upper left box of the block header, or null if the block
 * uses the symbol of its category. As in editableNode.tsx, only uploads (data URLs)
 * count; the generic pictures and file names of older profiles do not.
 */
export function uploadedHeaderIcon(
  icon: string | string[] | undefined,
): string | null {
  const src = Array.isArray(icon) ? icon[0] : icon;
  if (!src || GENERIC_ICONS.some((name) => src.endsWith(name))) return null;
  return src.startsWith("data:") ? src : null;
}

function kindOf(block: DomainBlockLike): BlockKind {
  if (block.isDataType || block.category === "dataTypes") return "dataType";
  if (
    block.operatorKind === "quantum" ||
    block.category === "Quantum Operators"
  ) {
    return "quantum";
  }
  return "classical";
}

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Text that fits `width` pixels: smaller font for long names, cut off if needed. */
function fit(text: string, width: number, maxSize: number, minSize = 16) {
  const charWidth = 0.58; // average glyph width in em
  const size = Math.max(
    minSize,
    Math.min(maxSize, width / (charWidth * Math.max(1, text.length))),
  );
  const maxChars = Math.floor(width / (charWidth * size));
  const shown =
    text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
  return { text: escape(shown), size: Math.round(size) };
}

const FONT = `font-family="Segoe UI, Arial, sans-serif"`;

const COLORS = {
  dataType: { header: "#fdba74", port: "#ffedd5", handle: "#fdba74" },
  classical: { header: "#fdba74", port: "#ffedd5", handle: "#fdba74" },
  quantum: { header: "#93c5fd", port: "#dbeafe", handle: "#93c5fd" },
};

/** The symbol in the header box: braces, a gear or an atom. */
function symbol(kind: BlockKind, cx: number, cy: number): string {
  if (kind === "dataType") {
    return `<text x="${cx}" y="${cy + 10}" text-anchor="middle" ${FONT} font-size="28" font-weight="600" fill="#000">{ }</text>`;
  }
  if (kind === "classical") {
    return `<circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="#000" stroke-width="9" stroke-dasharray="6.3 5.5"/>
  <circle cx="${cx}" cy="${cy}" r="12" fill="#000"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#fff"/>`;
  }
  return [0, 60, 120]
    .map(
      (angle) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="21" ry="8" fill="none" stroke="#000" stroke-width="3" transform="rotate(${angle} ${cx} ${cy})"/>`,
    )
    .concat(`<circle cx="${cx}" cy="${cy}" r="4" fill="#000"/>`)
    .join("\n  ");
}

interface BlockProperty {
  name?: string;
  type?: string;
  required?: boolean;
}

/** Space around the node, so that the handles on its edge are not cut off. */
const MARGIN = 14;
const PORT_HEIGHT = 60;
const PORT_GAP = 16;
const PROPERTY_HEIGHT = 84;

/**
 * A port row: a tinted box with the name and type (inside the node, `box`), and its
 * handle on the edge of the node (`handle`, drawn on top of the border).
 */
function portRow(
  port: BlockPort,
  side: "left" | "right",
  y: number,
  kind: BlockKind,
  width: number,
): { box: string; handle: string } {
  const quantum = port.kind === "quantum";
  const colors = quantum
    ? COLORS.quantum
    : COLORS[kind === "quantum" ? "classical" : kind];
  const boxWidth = 250;
  const x = side === "left" ? 9 : width - 9 - boxWidth;
  const name = fit(
    port.name || (side === "left" ? "Input" : "Output"),
    200,
    20,
    13,
  );
  const type = fit(`type: ${port.type || "any"}`, 200, 14, 11);
  const textX = side === "left" ? x + 26 : x + boxWidth - 26;
  const anchor = side === "left" ? "start" : "end";
  const handleX = side === "left" ? 9 : width - 9;
  return {
    box: `<rect x="${x}" y="${y}" width="${boxWidth}" height="${PORT_HEIGHT}" fill="${colors.port}"/>
  <text x="${textX}" y="${y + 27}" text-anchor="${anchor}" ${FONT} font-size="${name.size}" font-weight="600" fill="#000">${name.text}</text>
  <text x="${textX}" y="${y + 48}" text-anchor="${anchor}" ${FONT} font-size="${type.size}" fill="#4b5563">${type.text}</text>`,
    handle: `<circle cx="${handleX}" cy="${y + PORT_HEIGHT / 2}" r="11" fill="${quantum ? COLORS.quantum.handle : colors.handle}" stroke="#000" stroke-width="2"/>`,
  };
}

/** A property as in the node: its name above an input field (dashed if optional). */
function propertyRow(
  prop: BlockProperty,
  y: number,
  kind: BlockKind,
  width: number,
): string {
  const border = kind === "quantum" ? COLORS.quantum.header : "#fdba74";
  const label = fit(
    `${prop.name?.trim() || "Property"}${prop.required ? "" : " (optional)"}`,
    width - 200,
    20,
    13,
  );
  const fieldWidth = Math.min(380, width - 160);
  return `<text x="${width / 2}" y="${y + 20}" text-anchor="middle" ${FONT} font-size="${label.size}" fill="#000">${label.text}</text>
  <rect x="${(width - fieldWidth) / 2}" y="${y + 30}" width="${fieldWidth}" height="40" rx="20" fill="#fff" stroke="${border}" stroke-width="3"${prop.required ? "" : ` stroke-dasharray="8 5"`}/>`;
}

/** SVG picture of a block, in the style of the generic palette pictures. */
export function domainBlockSvg(block: DomainBlockLike): string {
  const kind = kindOf(block);
  const width = 668;
  const inputs =
    kind === "dataType" ? [] : (block.inputPorts ?? block.inputs ?? []);
  const outputs = block.outputPorts ?? block.outputs ?? [];
  const properties: BlockProperty[] = block.properties ?? [];
  const radius = kind === "dataType" ? 110 : kind === "classical" ? 60 : 0;
  const { header } = COLORS[kind];
  const title = fit(block.label?.trim() || "Domain Block", width - 300, 34);

  // header, properties, then the ports (inputs left, outputs right)
  const propertiesTop = 116;
  const portsTop = propertiesTop + properties.length * PROPERTY_HEIGHT + 14;
  const rows = Math.max(inputs.length, outputs.length);
  const portsBottom = portsTop + rows * (PORT_HEIGHT + PORT_GAP);
  // the rounded corners of the data type must not cut into the last row
  const height = Math.max(
    kind === "dataType" ? 360 : 300,
    portsBottom + Math.max(30, radius * 0.6),
  );

  const props = properties
    .map((p, i) =>
      propertyRow(p, propertiesTop + i * PROPERTY_HEIGHT, kind, width),
    )
    .join("\n  ");
  const portRows = [
    ...inputs.map((p, i) =>
      portRow(p, "left", portsTop + i * (PORT_HEIGHT + PORT_GAP), kind, width),
    ),
    ...outputs.map((p, i) =>
      portRow(p, "right", portsTop + i * (PORT_HEIGHT + PORT_GAP), kind, width),
    ),
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-MARGIN} 0 ${width + 2 * MARGIN} ${height}">
  <defs><clipPath id="node"><rect x="9" y="9" width="${width - 18}" height="${height - 18}" rx="${radius}"/></clipPath></defs>
  <rect x="9" y="9" width="${width - 18}" height="${height - 18}" rx="${radius}" fill="#fff"/>
  <rect x="0" y="0" width="${width}" height="100" fill="${header}" clip-path="url(#node)"/>
  <g clip-path="url(#node)">
  ${props}
  ${portRows.map((r) => r.box).join("\n  ")}
  </g>
  <rect x="9" y="9" width="${width - 18}" height="${height - 18}" rx="${radius}" fill="none" stroke="#374151" stroke-width="2"/>
  ${portRows.map((r) => r.handle).join("\n  ")}
  <rect x="${radius > 60 ? 150 : 50}" y="22" width="66" height="60" rx="${kind === "quantum" ? 0 : 14}" fill="#fff" stroke="#1f2937" stroke-width="3"/>
  ${headerContent(block, kind, radius > 60 ? 183 : 83, 52)}
  <line x1="${radius > 60 ? 236 : 136}" y1="20" x2="${radius > 60 ? 236 : 136}" y2="84" stroke="#000" stroke-width="2"/>
  <text x="${radius > 60 ? 260 : 160}" y="${52 + title.size * 0.35}" ${FONT} font-size="${title.size}" font-weight="700" fill="#000">${title.text}</text>
</svg>`;
}

/**
 * Palette picture of a domain block, with its name, properties and ports, and its
 * uploaded icon (if any) in the upper left box of the header.
 */
export function domainBlockIcon(block: DomainBlockLike): string {
  return toDataUrl(domainBlockSvg(block));
}

const toDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Content of the upper left header box: the uploaded icon, or the category symbol. */
function headerContent(
  block: DomainBlockLike,
  kind: BlockKind,
  cx: number,
  cy: number,
): string {
  const uploaded = uploadedHeaderIcon(block.icon);
  if (!uploaded) return symbol(kind, cx, cy);
  return `<image href="${escape(uploaded)}" x="${cx - 27}" y="${cy - 24}" width="54" height="48" preserveAspectRatio="xMidYMid meet"/>`;
}

/**
 * The upper left header icon of a block on its own (for the profile editor): the
 * uploaded icon, or the symbol of its category in its box.
 */
export function domainBlockHeaderIcon(block: DomainBlockLike): string {
  const uploaded = uploadedHeaderIcon(block.icon);
  if (uploaded) return uploaded;
  const kind = kindOf(block);
  return toDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 64">
  <rect x="2" y="2" width="66" height="60" rx="${kind === "quantum" ? 0 : 14}" fill="#fff" stroke="#1f2937" stroke-width="3"/>
  ${symbol(kind, 35, 32)}
</svg>`);
}
