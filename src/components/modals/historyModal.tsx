import { useEffect, useState } from "react";
import Modal from "./Modal";

export interface HistoryItem {
  uuid: string;
  name: string;
  description: string;
  status: string;
  created: string;
  type?: "generation" | "execution";
  result?: string;
  links?: {
    request?: string;
    result?: string;
    qrms?: string;
    serviceDeploymentModels?: string;
  };
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onExecute: (item: HistoryItem) => void;
  onLoadModel?: (item: HistoryItem) => void;
  loadFlow: (flow: any) => void;
}

export const HistoryModal = ({
  open,
  onClose,
  history,
  onExecute,
  onLoadModel,
  loadFlow,
}: HistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<"generation" | "execution">(
    "generation"
  );

  const [noMeasurementMap, setNoMeasurementMap] = useState<
    Record<string, boolean>
  >({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [compilationTargets, setCompilationTargets] = useState<
    Record<string, string | null>
  >({});

  const containsMeasurement = (qasm: string) =>
    /\bmeasure\b/i.test(qasm);

  // Convert JSON to blob URL
  const createJsonLink = (data: any) => {
    if (!data) return null;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    return URL.createObjectURL(blob);
  };

  console.log(history)

  // Check for measurements
  useEffect(() => {
    if (!open) return;

    const checkMeasurements = async () => {
      const result: Record<string, boolean> = {};
      const loading: Record<string, boolean> = {};

      await Promise.all(
        history.map(async (item) => {
          if (item.type === "generation") return;
          if (!item.links?.result) return;

          loading[item.uuid] = true;

          try {

            const res = await fetch(item.links.result);
            if (!res.ok) return;

            if (compilationTargets[item.uuid] === "qasm") {
              const qasm = await res.text();
              result[item.uuid] = !containsMeasurement(qasm);
            }
          } catch {
            // ignore
          } finally {
            loading[item.uuid] = false;
          }
        })
      );

      setNoMeasurementMap(result);
      setLoadingMap(loading);
    };

    checkMeasurements();
  }, [open, history, compilationTargets]);

  // Load compilation targets
  useEffect(() => {
    if (!open) return;

    history.forEach((item) => {
      if (!item.links?.request || compilationTargets[item.uuid]) return;

      fetch(item.links.request)
        .then((res) => res.json())
        .then((data) => {
          const target = data?.compilation_target || null;
          setCompilationTargets((prev) => ({
            ...prev,
            [item.uuid]: target,
          }));
        })
        .catch(() => {
          setCompilationTargets((prev) => ({
            ...prev,
            [item.uuid]: null,
          }));
        });
    });
  }, [open, history, compilationTargets]);

  return (
    <Modal
      title="History"
      open={open}
      onClose={onClose}
      className="w-[900px] max-w-[95vw]"
      footer={
        <div className="flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >

      <div className="flex gap-2 mb-3 border-b pb-2">
        <button
          className={`px-3 py-1 ${activeTab === "generation" ? "font-bold underline" : ""
            }`}
          onClick={() => setActiveTab("generation")}
        >
          Generation
        </button>

        <button
          className={`px-3 py-1 ${activeTab === "execution" ? "font-bold underline" : ""
            }`}
          onClick={() => setActiveTab("execution")}
        >
          Execution
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">

        {activeTab === "generation" && (
          <table className="min-w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Prompt</th>
                <th className="px-4 py-2 border">Result</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {history
                .filter((item) => item.type === "generation")
                .map((item) => (
                  <tr key={item.uuid}>
                    <td className="px-4 py-2 border">{item.uuid}</td>

                    <td className="px-4 py-2 border max-w-xs">
                      <div className="truncate" title={item.description}>
                        {item.description}
                      </div>
                    </td>

                    {/* ✅ FIXED RESULT VIEW */}
                    <td className="px-4 py-2 border">
                      {item.links?.result || item.result ? (
                        <span
                          className="text-blue-600 underline cursor-pointer"
                          onClick={() => {
                            try {
                              console.log("CLICK WORKS");

                              const raw = item.result ?? item.links?.result;

                              const parsed =
                                typeof raw === "string"
                                  ? JSON.parse(raw)
                                  : raw;

                              const url = createJsonLink(parsed);

                              console.log("URL:", url);

                              if (url) window.open(url, "_blank");
                            } catch (e) {
                              console.error("Invalid result JSON", e);
                            }
                          }}
                        >
                          View Model
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 border text-center">
                      <button
                        className="btn btn-primary"
                        onClick={() => { loadFlow(JSON.parse(item.result ?? item.links?.result)); onClose(); }}
                      >
                        Load Model
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {activeTab === "execution" && (
          <table className="min-w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Model File</th>
                <th className="px-4 py-2 border">Created</th>
                <th className="px-4 py-2 border">Result Status</th>
                <th className="px-4 py-2 border">Result File</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {history
                .filter((item) => item.type !== "generation")
                .map((item, index) => {
                  const noMeasurement = noMeasurementMap[item.uuid];
                  const loading = loadingMap[item.uuid];
                  const target = compilationTargets[item.uuid];

                  return (
                    <tr key={item.uuid || index}>
                      <td className="px-4 py-2 border">{item.uuid}</td>
                      <td className="px-4 py-2 border">{item.name}</td>

                      <td className="px-4 py-2 border max-w-xs">
                        <div className="truncate" title={item.description}>
                          {item.description}
                        </div>
                      </td>

                      <td className="px-4 py-2 border">
                        {item.links?.request ? (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() =>
                              window.open(item.links!.request!, "_blank")
                            }
                          >
                            Open
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-2 border">
                        {new Date(item.created).toLocaleString()}
                      </td>

                      <td className="px-4 py-2 border">{item.status}</td>

                      <td className="px-4 py-2 border">
                        {item.links?.result ? (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() =>
                              window.open(item.links!.result!, "_blank")
                            }
                          >
                            Open
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-2 border text-center">
                        {item.status.toLowerCase() === "failed" ? (
                          <span className="text-gray-400">—</span>
                        ) : loading ? (
                          <span className="text-gray-400">…</span>
                        ) : noMeasurement ? (
                          <span className="text-yellow-600">⚠️</span>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => onExecute(item)}
                            disabled={target === undefined}
                          >
                            {target === undefined
                              ? "Loading..."
                              : target === "workflow"
                                ? "Deploy Workflow"
                                : "Execute Circuit"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
};