/**
 * Validates the contents of files referenced by File data nodes that feed
 * plugin (machine learning) inputs. Unlike the structural validation this
 * needs to download the files, so it is asynchronous.
 *
 * Checks:
 *  - the file can be retrieved (HTTP errors are errors, network/CORS failures
 *    are warnings because the backend may still be able to fetch the file)
 *  - the content is a data file in an accepted format (JSON or well-formed CSV),
 *    not e.g. an HTML or Markdown page
 *  - data and label files of the same plugin hold the same number of records
 */
import {
  DATA_TYPE_NODE_TYPE,
  PLUGIN_NODE_TYPE,
  normalizeDataType,
} from "./nodeSpecs";
import type { ModelValidationResult } from "./modelValidation";

interface FileInfo {
  /** Problem that makes the file unusable, if any. */
  error?: string;
  /** Problem retrieving the file that the backend might not have. */
  warning?: string;
  format?: "json" | "csv";
  /** Number of records (JSON array entries or CSV data rows). */
  records?: number;
}

/** Data inputs whose number of records must match. */
const MATCHING_INPUTS: [string, string][] = [
  ["trainingDataUrl", "trainingLabelsUrl"],
  ["testDataUrl", "testLabelsUrl"],
];

const FETCH_TIMEOUT_MS = 10000;

function isFetchable(value: string): boolean {
  return /^(https?:\/\/|data:)/i.test(value);
}

function splitCsvRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === delimiter && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += c;
    }
  }
  cells.push(cell);
  return cells;
}

const isNumeric = (s: string) => s.trim() !== "" && Number.isFinite(Number(s));

/** Checks CSV content; returns the number of data rows or an error. */
export function analyzeCsv(text: string): { records?: number; error?: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { error: "the CSV file is empty" };
  const delimiter = [",", ";", "\t"].reduce((best, d) =>
    lines[0].split(d).length > lines[0].split(best).length ? d : best,
  );
  const rows = lines.map((l) => splitCsvRow(l, delimiter));
  const columns = rows[0].length;
  const bad = rows.findIndex((r) => r.length !== columns);
  if (bad >= 0) {
    return {
      error: `malformed CSV: row ${bad + 1} has ${rows[bad].length} columns, but row 1 has ${columns}`,
    };
  }
  // A header is a first row with text cells above purely numeric rows.
  const hasHeader =
    rows.length > 1 &&
    rows[0].some((c) => !isNumeric(c)) &&
    rows.slice(1).every((r) => r.every(isNumeric));
  return { records: rows.length - (hasHeader ? 1 : 0) };
}

function looksLikeMarkup(text: string): string | null {
  const start = text.trimStart().slice(0, 500).toLowerCase();
  if (start.startsWith("<!doctype html") || start.startsWith("<html")) {
    return "an HTML page";
  }
  if (
    /^---\s*\n[\s\S]*?\n---/.test(text.trimStart()) ||
    /^#{1,6} /m.test(start)
  ) {
    return "a Markdown document";
  }
  return null;
}

/** Downloads and inspects one file. */
export async function inspectFile(
  url: string,
  acceptedTypes: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<FileInfo> {
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    response = await fetchImpl(url, { signal: controller.signal });
  } catch (e) {
    return {
      warning: `could not be retrieved (${(e as Error).message || "network or CORS error"}), so its content was not checked`,
    };
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    return { error: `could not be retrieved (HTTP ${response.status})` };
  }

  const text = await response.text();
  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType === "text/html") {
    return { error: "is an HTML page, not a data file" };
  }
  const markup = looksLikeMarkup(text);
  if (markup) return { error: `is ${markup}, not a data file` };

  const acceptsJson = acceptedTypes.includes("application/json");
  const acceptsCsv = acceptedTypes.includes("text/csv");
  if (acceptsJson || contentType === "application/json") {
    try {
      const json = JSON.parse(text);
      if (!acceptsJson) return { error: "is JSON, but only CSV is accepted" };
      return {
        format: "json",
        records: Array.isArray(json) ? json.length : undefined,
      };
    } catch {
      if (contentType === "application/json" || !acceptsCsv) {
        return { error: "is not valid JSON" };
      }
    }
  }
  if (acceptsCsv) {
    const csv = analyzeCsv(text);
    return csv.error
      ? { error: csv.error }
      : { format: "csv", records: csv.records };
  }
  return {};
}

export async function validateFileContents(
  flow: any,
  fetchImpl: typeof fetch = fetch,
): Promise<ModelValidationResult> {
  const errors: ModelValidationResult["errors"] = [];
  const warnings: ModelValidationResult["warnings"] = [];
  const nodes: any[] = flow?.nodes ?? [];
  const edges: any[] = flow?.edges ?? flow?.initialEdges ?? [];
  const nodesById = new Map<string, any>(nodes.map((n) => [n.id, n]));
  const cache = new Map<string, Promise<FileInfo>>();

  for (const node of nodes.filter((n) => n.type === PLUGIN_NODE_TYPE)) {
    const records = new Map<string, { count: number; label: string }>();
    const inputs: any[] = node.data?.dataInputs ?? [];

    await Promise.all(
      inputs.map(async (input, index) => {
        const edge = edges.find(
          (e) =>
            e.target === node.id &&
            e.targetHandle === `classicalHandlePluginInput${index}${node.id}`,
        );
        const source = edge && nodesById.get(edge.source);
        if (
          source?.type !== DATA_TYPE_NODE_TYPE ||
          normalizeDataType(source.data?.dataType) !== "file"
        ) {
          return;
        }
        const url = String(source.data?.value ?? "").trim();
        if (!isFetchable(url)) return; // placeholders and plain file names
        const accepted: string[] = input.content_type ?? [];
        const key = `${url}|${accepted.join(",")}`;
        let pending = cache.get(key);
        if (!pending) {
          pending = inspectFile(url, accepted, fetchImpl);
          cache.set(key, pending);
        }
        const info = await pending;

        const name = `File for input "${input.parameter}" of "${node.data?.label ?? node.type}"`;
        if (info.error) {
          errors.push({
            nodeId: source.id,
            nodeType: source.type,
            description: `${name} ${info.error}.`,
          });
        } else if (info.warning) {
          warnings.push({
            nodeId: source.id,
            nodeType: source.type,
            description: `${name} ${info.warning}.`,
          });
        } else if (info.records !== undefined) {
          records.set(input.parameter, {
            count: info.records,
            label: input.parameter,
          });
        }
      }),
    );

    MATCHING_INPUTS.forEach(([data, labels]) => {
      const d = records.get(data);
      const l = records.get(labels);
      if (d && l && d.count !== l.count) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          description: `"${node.data?.label}": "${labels}" has ${l.count} labels, but "${data}" has ${d.count} records.`,
        });
      }
    });
  }
  return { errors, warnings };
}
