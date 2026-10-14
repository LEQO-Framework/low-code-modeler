import { ReactNode, useState } from "react";
import { Edge, Node } from "reactflow";
import { shallow } from "zustand/shallow";
import { useStore } from "@/config/store";
import {
  API_DATA_TYPES,
  API_METHODS,
  ApiConnector,
  ApiOutputParameter,
  NEW_OUTPUT,
  PayloadSource,
  generateExtractionScript,
  getPayloadEntries,
  normalizeApiConnector,
  payloadScript,
  toCamundaConnectorXml,
} from "@/lib/apiConnector";

/**
 * How a custom (quantum or classical) operator is implemented:
 * - "file": an uploaded implementation file plus an optional requirements file
 * - "api": an external service that is called via HTTP (API connector)
 */
export type ImplementationMode = "file" | "api";

interface CustomOperatorImplementationProps {
  selectedNode: Node;
  /** Stores a value of any shape in the node data. */
  updateField: (field: string, value: any) => void;
  /** Fields for uploading/editing the implementation file itself. */
  implementationFields: ReactNode;
}

const inputClass =
  "border block w-full border-gray-300 rounded-md sm:text-sm p-2 bg-white";
const labelClass = "block text-sm font-medium text-start text-gray-700";
const smallInputClass =
  "border border-gray-300 rounded-md text-xs p-1 bg-white min-w-0 flex-1";
const scriptClass =
  "border block w-full border-gray-300 rounded-md p-2 bg-white font-mono text-xs h-28";

export const CustomOperatorImplementation = ({
  selectedNode,
  updateField,
  implementationFields,
}: CustomOperatorImplementationProps) => {
  const mode: ImplementationMode =
    selectedNode.data.implementationMode === "api" ? "api" : "file";
  const connector = normalizeApiConnector(selectedNode.data.apiConnector);

  const updateConnector = (changes: Partial<ApiConnector>) =>
    updateField("apiConnector", { ...connector, ...changes });

  const handleRequirementsUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField("requirements", (e.target?.result as string) ?? "");
      updateField("requirementsFileName", file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-2 mt-3 border border-gray-200 rounded-md bg-gray-50">
      <label className={labelClass}>Implementation</label>

      <div className="mt-2 flex gap-4 text-sm" role="radiogroup">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name={`implementationMode-${selectedNode.id}`}
            checked={mode === "file"}
            onChange={() => updateField("implementationMode", "file")}
          />
          Implementation file
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name={`implementationMode-${selectedNode.id}`}
            checked={mode === "api"}
            onChange={() => updateField("implementationMode", "api")}
          />
          API connector
        </label>
      </div>

      {mode === "file" && (
        <>
          <div className="mt-2">{implementationFields}</div>

          <label className={`${labelClass} mt-3`} htmlFor="requirementsFile">
            Upload Requirements File
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Python dependencies of the implementation, e.g. requirements.txt.
          </p>
          <div className="mt-1">
            <input
              type="file"
              id="requirementsFile"
              accept=".txt,text/plain"
              onChange={handleRequirementsUpload}
              className={inputClass}
            />
          </div>
          {selectedNode.data.requirementsFileName && (
            <div className="mt-1 text-xs text-gray-500">
              File: {selectedNode.data.requirementsFileName}
            </div>
          )}

          <label className={`${labelClass} mt-2`} htmlFor="requirements">
            Requirements
          </label>
          <textarea
            id="requirements"
            value={selectedNode.data.requirements ?? ""}
            onChange={(e) => updateField("requirements", e.target.value)}
            className={`${inputClass} h-24 font-mono text-xs`}
            placeholder={"numpy==1.26.4\nqiskit>=1.0"}
          />
        </>
      )}

      {mode === "api" && (
        <ApiConnectorFields
          node={selectedNode}
          connector={connector}
          updateConnector={updateConnector}
        />
      )}
    </div>
  );
};

const describeSource = (source: PayloadSource) => {
  switch (source.kind) {
    case "variable":
      return `${source.variable} (${source.label})`;
    case "literal":
      return `${source.value || '""'} (${source.label})`;
    default:
      return "not connected";
  }
};

const graphSelector = (state: { nodes: Node[]; edges: Edge[] }) => ({
  nodes: state.nodes,
  edges: state.edges,
});

const ApiConnectorFields = ({
  node,
  connector,
  updateConnector,
}: {
  node: Node;
  connector: ApiConnector;
  updateConnector: (changes: Partial<ApiConnector>) => void;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const { nodes, edges } = useStore(graphSelector, shallow);
  const entries = getPayloadEntries(node, nodes, edges);
  const { payload } = connector;
  const hasCustomPayloadScript = payload.script.trim() !== "";

  const setInputKey = (index: number, name: string) => {
    const inputs = Array.from(
      { length: Math.max(entries.length, payload.inputs.length) },
      (_, i) => payload.inputs[i] ?? { name: "" },
    );
    inputs[index] = { name };
    updateConnector({ payload: { ...payload, inputs } });
  };

  const updateOutput = (index: number, changes: Partial<ApiOutputParameter>) =>
    updateConnector({
      outputs: connector.outputs.map((o, i) =>
        i === index ? { ...o, ...changes } : o,
      ),
    });

  return (
    <>
      <label className={`${labelClass} mt-3`} htmlFor="apiMethod">
        Method
      </label>
      <select
        id="apiMethod"
        value={connector.method}
        onChange={(e) => updateConnector({ method: e.target.value })}
        className={`${inputClass} mt-1`}
      >
        {API_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <SectionHeader
        title="Headers"
        onAdd={() =>
          updateConnector({
            headers: [...connector.headers, { key: "", value: "" }],
          })
        }
      />
      {connector.headers.length === 0 && <Empty text="No headers." />}
      {connector.headers.map((header, index) => (
        <div key={index} className="mt-1 flex gap-1 items-center">
          <input
            aria-label="Header name"
            value={header.key}
            placeholder="Accept"
            onChange={(e) =>
              updateConnector({
                headers: connector.headers.map((h, i) =>
                  i === index ? { ...h, key: e.target.value } : h,
                ),
              })
            }
            className={smallInputClass}
          />
          <input
            aria-label="Header value"
            value={header.value}
            placeholder="application/json"
            onChange={(e) =>
              updateConnector({
                headers: connector.headers.map((h, i) =>
                  i === index ? { ...h, value: e.target.value } : h,
                ),
              })
            }
            className={smallInputClass}
          />
          <RemoveButton
            label="Remove header"
            onClick={() =>
              updateConnector({
                headers: connector.headers.filter((_, i) => i !== index),
              })
            }
          />
        </div>
      ))}

      <label className={`${labelClass} mt-3`} htmlFor="apiUrl">
        URL
      </label>
      <input
        id="apiUrl"
        value={connector.url}
        onChange={(e) => updateConnector({ url: e.target.value })}
        className={`${inputClass} mt-1`}
        placeholder="https://example.org/execution-service"
      />

      {/* Payload: the values connected to the classical input ports */}
      <div className="mt-3 p-2 border border-gray-200 rounded-md bg-white">
        <label className={labelClass}>Payload</label>
        <p className="text-xs text-gray-500 mt-1">
          The values connected to the classical inputs of the operator, sent as
          JSON body. Set the key under which each value is sent.
          {connector.method === "GET" && " GET requests send no payload."}
        </p>
        {entries.length === 0 && (
          <Empty text="No classical inputs. Add inputs to the operator to send values." />
        )}
        {entries.map((entry, index) => (
          <div key={index} className="mt-1 flex gap-1 items-center">
            <input
              aria-label={`Key of input ${index + 1}`}
              value={payload.inputs[index]?.name ?? ""}
              placeholder={entry.key}
              onChange={(e) => setInputKey(index, e.target.value)}
              className={smallInputClass}
            />
            <span
              className={`text-xs flex-1 min-w-0 truncate ${
                entry.source.kind === "unconnected"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
              title={describeSource(entry.source)}
            >
              ← {describeSource(entry.source)}
            </span>
          </div>
        ))}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Payload script ({hasCustomPayloadScript ? "custom" : "generated"})
          </span>
          {hasCustomPayloadScript && (
            <button
              type="button"
              className="text-xs text-blue-600 underline"
              onClick={() =>
                updateConnector({ payload: { ...payload, script: "" } })
              }
            >
              Reset to generated
            </button>
          )}
        </div>
        <textarea
          aria-label="Payload script"
          value={payloadScript(connector, entries)}
          onChange={(e) =>
            updateConnector({ payload: { ...payload, script: e.target.value } })
          }
          className={`${scriptClass} mt-1`}
          spellCheck={false}
        />
      </div>

      {/* Outputs: extracted from the response */}
      <SectionHeader
        title="Outputs"
        onAdd={() =>
          updateConnector({
            outputs: [...connector.outputs, { ...NEW_OUTPUT }],
          })
        }
      />
      <p className="text-xs text-gray-500 mt-1">
        Values extracted from the response, either by a JSON path or a custom
        script. Output 1 is the first classical output of the operator, and so
        on. Each output becomes a process variable with its name.
      </p>
      {connector.outputs.length === 0 && <Empty text="No outputs." />}
      {connector.outputs.map((output, index) => (
        <div
          key={index}
          className="mt-2 p-2 border border-gray-200 rounded-md bg-white"
        >
          <div className="flex gap-1 items-center">
            <input
              aria-label="Output name"
              value={output.name}
              placeholder="counts"
              onChange={(e) => updateOutput(index, { name: e.target.value })}
              className={smallInputClass}
            />
            <TypeSelect
              value={output.dataType}
              onChange={(dataType) => updateOutput(index, { dataType })}
            />
            <RemoveButton
              label="Remove output"
              onClick={() =>
                updateConnector({
                  outputs: connector.outputs.filter((_, i) => i !== index),
                })
              }
            />
          </div>
          <div className="mt-1 flex gap-3 text-xs" role="radiogroup">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={output.extraction === "path"}
                onChange={() => updateOutput(index, { extraction: "path" })}
              />
              Response path
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={output.extraction === "script"}
                onChange={() =>
                  updateOutput(index, {
                    extraction: "script",
                    // start from the script of the current path
                    script:
                      output.script.trim() ||
                      generateExtractionScript(output.path),
                  })
                }
              />
              Script
            </label>
          </div>
          {output.extraction === "path" ? (
            <input
              aria-label="Response path"
              value={output.path}
              placeholder="result.counts (empty = whole response)"
              onChange={(e) => updateOutput(index, { path: e.target.value })}
              className={`${smallInputClass} mt-1 w-full`}
            />
          ) : (
            <textarea
              aria-label="Extraction script"
              value={output.script}
              onChange={(e) => updateOutput(index, { script: e.target.value })}
              className={`${scriptClass} mt-1`}
              spellCheck={false}
            />
          )}
        </div>
      ))}

      <button
        type="button"
        className="mt-3 text-xs text-blue-600 underline"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? "Hide" : "Show"} Camunda connector
      </button>
      {showPreview && (
        <pre className="mt-1 p-2 border border-gray-200 rounded-md bg-white text-[10px] overflow-x-auto whitespace-pre">
          {toCamundaConnectorXml(connector, entries)}
        </pre>
      )}
    </>
  );
};

const SectionHeader = ({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) => (
  <div className="mt-3 flex items-center justify-between">
    <label className={labelClass}>{title}</label>
    <button
      type="button"
      className="text-xs text-blue-600 underline"
      onClick={onAdd}
    >
      + Add
    </button>
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="text-xs text-gray-400 mt-1">{text}</div>
);

const TypeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <select
    aria-label="Type"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={smallInputClass}
  >
    {API_DATA_TYPES.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
  </select>
);

const RemoveButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    className="text-gray-400 hover:text-red-600 px-1"
    onClick={onClick}
  >
    ×
  </button>
);
