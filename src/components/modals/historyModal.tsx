import { useEffect, useState } from "react";
import Modal from "./Modal";

export interface HistoryItem {
  uuid: string;
  name: string;
  description: string;
  status: string;
  created: string;
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
}

export const HistoryModal = ({ open, onClose, history, onExecute }: HistoryModalProps) => {
  const [noMeasurementMap, setNoMeasurementMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [compilationTargets, setCompilationTargets] = useState<Record<string, string | null>>({});

  const containsMeasurement = (qasm: string) => /\bmeasure\b/i.test(qasm);

  // Check for measurements
  useEffect(() => {
    if (!open) return;

    const checkMeasurements = async () => {
      const result: Record<string, boolean> = {};
      const loading: Record<string, boolean> = {};

      await Promise.all(
        history.map(async (item) => {
          if (!item.links?.result) return;

          loading[item.uuid] = true;

          try {
            const res = await fetch(item.links.result);
            if (!res.ok) return;

            const qasm = await res.text();
            result[item.uuid] = !containsMeasurement(qasm);
          } catch {
            // ignore errors
          } finally {
            loading[item.uuid] = false;
          }
        })
      );

      setNoMeasurementMap(result);
      setLoadingMap(loading);
    };

    checkMeasurements();
  }, [open, history]);

  // Load compilation targets
  useEffect(() => {
    if (!open) return;

    history.forEach((item) => {
      if (!item.links?.request || compilationTargets[item.uuid]) return;

      fetch(item.links.request)
        .then((res) => res.json())
        .then((data) => {
          const target = data?.compilation_target || null;
          setCompilationTargets((prev) => ({ ...prev, [item.uuid]: target }));
        })
        .catch(() => {
          setCompilationTargets((prev) => ({ ...prev, [item.uuid]: null }));
        });
    });
  }, [open, history]);

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
      <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Model File</th>
              <th className="px-4 py-2 border">QRMS</th>
              <th className="px-4 py-2 border">Service Deployment</th>
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Result Status</th>
              <th className="px-4 py-2 border">Result File</th>
              <th className="px-4 py-2 border">Execute</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item, index) => {
              const noMeasurement = noMeasurementMap[item.uuid];
              const loading = loadingMap[item.uuid];
              const target = compilationTargets[item.uuid];

              return (
                <tr key={item.uuid || index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{item.uuid}</td>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border max-w-xs">
                    <div
                      className="truncate"
                      title={item.description}
                    >
                      {item.description}
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    {item.links?.request ? (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => window.open(item.links.request!, "_blank")}
                      >
                        Open
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-2 border">
                    {target === "qasm" ? (
                      <span className="text-gray-400">—</span>
                    ) : item.links?.qrms ? (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => window.open(item.links.qrms!, "_blank")}
                      >
                        Open
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>


                  <td className="px-4 py-2 border">
                    {target === "qasm" ? (
                      <span className="text-gray-400">—</span>
                    ) : item.links?.serviceDeploymentModels ? (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => window.open(item.links.serviceDeploymentModels!, "_blank")}
                      >
                        Open
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>


                  <td className="px-4 py-2 border">{new Date(item.created).toLocaleString()}</td>
                  <td className="px-4 py-2 border">{item.status}</td>

                  <td className="px-4 py-2 border">
                    {item.links?.result ? (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => window.open(item.links.result!, "_blank")}
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
                      <span
                        className="text-yellow-600 cursor-help"
                        title="This OpenQASM program contains no measurements. Execution would produce no meaningful results."
                      >
                        ⚠️
                      </span>
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
                            : "Execute"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {history.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center px-4 py-2">
                  No history available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
