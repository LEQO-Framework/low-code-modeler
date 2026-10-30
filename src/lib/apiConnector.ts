/**
 * API connector of a custom operator. Mirrors the Camunda http-connector
 * (<camunda:connector> with connectorId "http-connector"):
 *
 * - input parameters:  method, headers, url, payload
 *   The payload contains the values connected to the classical input ports of
 *   the operator (input i = port i). It is built by a script; if no script is
 *   given, one is generated from the connected inputs.
 * - output parameters: one per classical output port of the operator, each with
 *   the logic to extract it from the response (a JSON path or a custom script).
 *
 * In the workflow, the backend turns every API connector into a service task.
 */
import { Edge, Node } from "reactflow";

export const API_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
export const API_DATA_TYPES = [
  "number",
  "array",
  "bit",
  "boolean",
  "string",
  "file",
];
export const SCRIPT_FORMAT = "groovy";

export interface ApiHeader {
  key: string;
  value: string;
}

/** A classical input port of the operator that is sent in the payload. */
export interface ApiInputParameter {
  /** Key of the value in the JSON request body (empty = default key). */
  name: string;
}

export interface ApiPayload {
  /** One entry per classical input port, by port index. */
  inputs: ApiInputParameter[];
  /** Custom script building the request body; empty = generated from the inputs. */
  script: string;
}

export type ExtractionMode = "path" | "script";

/** An operator output that is extracted from the response. */
export interface ApiOutputParameter {
  name: string;
  dataType: string;
  extraction: ExtractionMode;
  /** Path of the value in the JSON response, e.g. "result.labels" (empty = whole response). */
  path: string;
  /** Custom extraction script, used when extraction is "script". */
  script: string;
}

export interface ApiConnector {
  method: string;
  headers: ApiHeader[];
  url: string;
  payload: ApiPayload;
  outputs: ApiOutputParameter[];
}

export const DEFAULT_HEADERS: ApiHeader[] = [
  { key: "Accept", value: "application/json" },
  { key: "Content-Type", value: "application/json" },
];

export const EMPTY_API_CONNECTOR: ApiConnector = {
  method: "POST",
  headers: DEFAULT_HEADERS,
  url: "",
  payload: { inputs: [], script: "" },
  outputs: [],
};

export const NEW_OUTPUT: ApiOutputParameter = {
  name: "",
  dataType: "number",
  extraction: "path",
  path: "",
  script: "",
};

export const isApiConnectorNode = (node: Node | undefined): boolean =>
  node?.data?.implementationMode === "api";

/**
 * Brings stored connector data into the current shape. Earlier versions stored
 * the inputs directly on the connector (with a type and "location") and the
 * outputs with only a response path.
 */
export const normalizeApiConnector = (raw: any): ApiConnector => {
  const data = raw ?? {};
  const payload = data.payload ?? {};
  const inputs: any[] = payload.inputs ?? data.inputs ?? [];
  return {
    method: data.method ?? EMPTY_API_CONNECTOR.method,
    headers: Array.isArray(data.headers)
      ? data.headers
      : EMPTY_API_CONNECTOR.headers,
    url: data.url ?? "",
    payload: {
      inputs: inputs.map((p) => ({ name: p?.name ?? "" })),
      script: payload.script ?? "",
    },
    outputs: (data.outputs ?? []).map((p: any) => ({
      ...NEW_OUTPUT,
      ...p,
      extraction: p?.extraction === "script" ? "script" : "path",
    })),
  };
};

// ===== Inputs: what is connected to the classical input ports =====

/** Where the value of a payload input comes from. */
export type PayloadSource =
  | { kind: "variable"; variable: string; label: string }
  | { kind: "literal"; value: string; dataType: string; label: string }
  | { kind: "unconnected" };

export interface PayloadEntry {
  /** Key in the JSON request body. */
  key: string;
  source: PayloadSource;
}

/** Index of a handle id like "classicalHandleOperationInput2<nodeId>". */
const handleIndex = (handle: string | null | undefined, nodeId: string) => {
  if (!handle?.endsWith(nodeId)) return undefined;
  const match = handle.slice(0, -nodeId.length).match(/(\d+)$/);
  return match ? Number(match[1]) : undefined;
};

const isClassicalHandle = (handle: string | null | undefined) =>
  !!handle?.startsWith("classicalHandle");

const nodeName = (node: Node) => node.data?.label || node.id;

/** Process variable / value that a source output port provides at runtime. */
const resolveSource = (
  source: Node,
  sourceHandle: string | null | undefined,
): PayloadSource => {
  const index = handleIndex(sourceHandle, source.id) ?? 0;
  if (source.type === "dataTypeNode") {
    return {
      kind: "literal",
      value: String(source.data?.value ?? ""),
      dataType: String(source.data?.dataType ?? "string"),
      label: nodeName(source),
    };
  }
  if (isApiConnectorNode(source)) {
    // outputs of an API connector are process variables named like the output
    const output = normalizeApiConnector(source.data.apiConnector).outputs[
      index
    ];
    if (output?.name.trim()) {
      return {
        kind: "variable",
        variable: output.name.trim(),
        label: nodeName(source),
      };
    }
  }
  const variable =
    source.data?.outputs?.[index]?.identifier ||
    source.data?.outputIdentifier ||
    `${source.id}_output${index}`;
  return { kind: "variable", variable, label: nodeName(source) };
};

/** Number of classical input ports of a custom operator. */
const classicalInputCount = (node: Node, edges: Edge[]) =>
  Math.max(
    Number(node.data?.numberClassicalInputs) || 0,
    ...edges
      .filter((e) => e.target === node.id && isClassicalHandle(e.targetHandle))
      .map((e) => (handleIndex(e.targetHandle, node.id) ?? -1) + 1),
  );

/** Payload entries of the node: one per classical input port. */
export const getPayloadEntries = (
  node: Node,
  nodes: Node[],
  edges: Edge[],
): PayloadEntry[] => {
  const connector = normalizeApiConnector(node.data?.apiConnector);
  return Array.from({ length: classicalInputCount(node, edges) }, (_, i) => {
    const edge = edges.find(
      (e) =>
        e.target === node.id &&
        isClassicalHandle(e.targetHandle) &&
        handleIndex(e.targetHandle, node.id) === i,
    );
    const sourceNode = edge && nodes.find((n) => n.id === edge.source);
    const source: PayloadSource = sourceNode
      ? resolveSource(sourceNode, edge.sourceHandle)
      : { kind: "unconnected" };
    return { key: defaultKey(connector.payload.inputs[i], source, i), source };
  });
};

const defaultKey = (
  input: ApiInputParameter | undefined,
  source: PayloadSource,
  index: number,
) =>
  input?.name.trim() ||
  (source.kind === "variable" ? source.variable : `input${index}`);

// ===== Scripts =====

const groovyString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$")}"`;

/** Groovy expression of a literal connected to an input port. */
const groovyLiteral = (value: string, dataType: string): string => {
  if (dataType === "string" || dataType === "file") return groovyString(value);
  for (const text of [value, `[${value}]`]) {
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === "object" && parsed !== null
        ? `new groovy.json.JsonSlurper().parseText(${groovyString(JSON.stringify(parsed))})`
        : JSON.stringify(parsed);
    } catch {
      // try the next representation
    }
  }
  return groovyString(value);
};

const groovyValue = (source: PayloadSource): string => {
  switch (source.kind) {
    case "variable":
      return `execution.getVariable(${groovyString(source.variable)})`;
    case "literal":
      return groovyLiteral(source.value, source.dataType);
    default:
      return "null";
  }
};

/** Script that builds the JSON request body from the connected inputs. */
export const generatePayloadScript = (entries: PayloadEntry[]): string =>
  [
    "import groovy.json.JsonBuilder",
    "",
    "def request = [:];",
    ...entries.map(
      (e) => `request.put(${groovyString(e.key)}, ${groovyValue(e.source)});`,
    ),
    "",
    "return new JsonBuilder(request).toPrettyString();",
  ].join("\n");

/** Script that reads a value from the JSON response by its path. */
export const generateExtractionScript = (path: string): string => {
  const access = path
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) =>
      /^\d+$/.test(s) ? `?.getAt(${s})` : `?.get(${groovyString(s)})`,
    )
    .join("");
  return [
    'def resp = connector.getVariable("response");',
    "resp = new groovy.json.JsonSlurperClassic().parseText(resp);",
    `return resp${access};`,
  ].join("\n");
};

export const payloadScript = (
  connector: ApiConnector,
  entries: PayloadEntry[],
): string => connector.payload.script.trim() || generatePayloadScript(entries);

export const extractionScript = (output: ApiOutputParameter): string =>
  output.extraction === "script"
    ? output.script
    : generateExtractionScript(output.path);

// ===== Export =====

/** Connector as sent to the backend (ApiConnectorNode without id/label). */
export const toBackendApiConnector = (
  connector: ApiConnector,
  entries: PayloadEntry[],
) => ({
  method: connector.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: connector.url.trim(),
  headers: Object.fromEntries(
    connector.headers
      .filter((h) => h.key.trim())
      .map((h) => [h.key.trim(), h.value]),
  ),
  payload:
    connector.method === "GET" ? null : payloadScript(connector, entries),
  outputs: connector.outputs
    .filter((o) => o.name.trim())
    .map((o) => ({ name: o.name.trim(), script: extractionScript(o) })),
  scriptFormat: SCRIPT_FORMAT,
});

/** Escapes element text; scripts keep their quotes readable. */
const xmlText = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Escapes attribute values. */
const xmlAttr = (value: string) => xmlText(value).replace(/"/g, "&quot;");

/**
 * The <camunda:connector> element of the service task, as generated by the
 * backend (shown as a preview in the properties panel).
 */
export const toCamundaConnectorXml = (
  connector: ApiConnector,
  entries: PayloadEntry[],
): string => {
  const api = toBackendApiConnector(connector, entries);
  const lines = [
    "<camunda:connector>",
    "  <camunda:inputOutput>",
    `    <camunda:inputParameter name="method">${xmlText(api.method)}</camunda:inputParameter>`,
  ];
  const headers = Object.entries(api.headers);
  if (headers.length > 0) {
    lines.push(
      '    <camunda:inputParameter name="headers">',
      "      <camunda:map>",
      ...headers.map(
        ([key, value]) =>
          `        <camunda:entry key="${xmlAttr(key)}">${xmlText(value)}</camunda:entry>`,
      ),
      "      </camunda:map>",
      "    </camunda:inputParameter>",
    );
  }
  lines.push(
    `    <camunda:inputParameter name="url">${xmlText(api.url)}</camunda:inputParameter>`,
  );
  if (api.payload !== null) {
    lines.push(
      '    <camunda:inputParameter name="payload">',
      `      <camunda:script scriptFormat="${SCRIPT_FORMAT}">${xmlText(api.payload)}</camunda:script>`,
      "    </camunda:inputParameter>",
    );
  }
  api.outputs.forEach((o) =>
    lines.push(
      `    <camunda:outputParameter name="${xmlAttr(o.name)}">`,
      `      <camunda:script scriptFormat="${SCRIPT_FORMAT}">${xmlText(o.script)}</camunda:script>`,
      "    </camunda:outputParameter>",
    ),
  );
  lines.push(
    "  </camunda:inputOutput>",
    "  <camunda:connectorId>http-connector</camunda:connectorId>",
    "</camunda:connector>",
  );
  return lines.join("\n");
};
