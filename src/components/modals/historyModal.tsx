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
  const [compilationTargets, setCompilationTargets] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!open) return; // only load when modal is open

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
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
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
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Result Status</th>
              <th className="px-4 py-2 border">Result File</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const target = compilationTargets[item.uuid];

              return (
                <tr key={item.uuid || index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{item.uuid}</td>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border">{item.description}</td>

                  <td className="px-4 py-2 border">
                    {item.links?.request ? (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => window.open(item.links.request, "_blank")}
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
                        onClick={() => window.open(item.links.result, "_blank")}
                      >
                        Open
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-2 border text-center">
                    {item.status.toLowerCase() !== "failed" ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => onExecute(item)}
                        disabled={target === undefined} // disable until target is loaded
                      >
                        {target === undefined
                          ? "Loading..."
                          : target === "workflow"
                            ? "Deploy Workflow"
                            : "Execute"}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {history.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center px-4 py-2">No history available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
