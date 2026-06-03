import { useEffect, useState } from "react";
import Modal from "./Modal";
import PromptFlowModal from "./promptFlowModal";
import { RefreshCw } from "lucide-react";

export interface HistoryItem {
  uuid: string;
  name: string;
  description: string;
  status: string;
  created: string;
  type?: "generation" | "execution";
  result?: string;
  validationScore?: number;
  missingValues?: Array<{
    id: string;
    type: string;
    label: string;
    question?: string; // Add this line
  }>;
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
  loadFlow: (flow: any) => void;
  showToast: (message: React.ReactNode, type: "success" | "error" | "info") => void;
  lowcodeBackendEndpoint: string;
  onAddMissingValues: (job: HistoryItem) => void;
  fetchHistory: () => Promise<void>;
  onSubmitPrompt: (prompt: string, generationMode: "compact" | "circuit") => Promise<any>;
  onRefresh: () => void | Promise<void>;
}

export const HistoryModal = ({
  open,
  onClose,
  history,
  onExecute,
  loadFlow,
  showToast,
  lowcodeBackendEndpoint,
  onAddMissingValues,
  fetchHistory,
  onSubmitPrompt,
  onRefresh
}: HistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<"generation" | "execution">("generation");
  const [selectedJob, setSelectedJob] = useState<HistoryItem | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const createJsonLink = (data: any) => {
    if (!data) return null;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    return URL.createObjectURL(blob);
  };


  const handleLoadModel = (job: HistoryItem) => {
    if (job.result) {
      try {
        const parsed = typeof job.result === "string" ? JSON.parse(job.result) : job.result;
        loadFlow(parsed);
        onClose();
      } catch (e) {
        showToast("Failed to load model: Invalid JSON", "error");
      }
    }
  };

  const handleMissingValuesSubmitted = async (jobId: string, values: Record<string, any>) => {
    try {
      const response = await fetch(`http://localhost:3000/job/${jobId}/submit-missing-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missingValues: Object.entries(values).map(([id, value]) => ({
            id,
            value,
            type: selectedJob?.missingValues?.find((m: any) => m.id === id)?.type,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit missing values");
      }
      console.log("Submitting missing values for job:", jobId, selectedJob);
      console.log("Submitting values:", values);
      showToast("Missing values submitted. Model generation resumed.", "success");
      await fetchHistory();
      setIsPromptModalOpen(false);
      setSelectedJob(null);
    } catch (error: any) {
      showToast(`Failed to submit missing values: ${error.message}`, "error");
    }
  };


  return (
    <>
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
        <>
          <div className="relative">
            <button
              className="btn btn-primary btn-sm absolute top-0 right-0"
              onClick={onRefresh}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="flex gap-2 mb-3 border-b pb-2">

            <button
              className={`px-3 py-1 ${activeTab === "generation" ? "font-bold underline" : ""}`}
              onClick={() => setActiveTab("generation")}
            >
              Generation
            </button>
            <button
              className={`px-3 py-1 ${activeTab === "execution" ? "font-bold underline" : ""}`}
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
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Validation Score</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .filter((item) => item.type === "generation")
                    .map((item) => (
                      <tr key={item.uuid}>
                        <td className="px-4 py-2 border">{item.uuid}</td>
                        <td className="px-4 py-2 border max-w-xs truncate" title={item.description}>
                          {item.description}
                        </td>
                        <td className="px-4 py-2 border">
                          {item.status === "User input required" ? (
                            <span className="text-yellow-600 font-medium">User input required</span>
                          ) : (
                            item.status
                          )}
                        </td>
                        <td className="px-4 py-2 border">
                          {item.validationScore !== undefined ? `${Math.round(item.validationScore)}%` : "N/A"}
                        </td>
                        <td className="px-4 py-2 border text-center space-x-2">
                          {item.status === "User input required" ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => onAddMissingValues(item)}
                            >
                              Add Required Values
                            </button>
                          ) : item.result ? (
                            <>
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  const url = createJsonLink(item.result);
                                  if (url) window.open(url, "_blank");
                                }}
                              >
                                View Model
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleLoadModel(item)}
                              >
                                Load Model
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      </Modal>

      {isPromptModalOpen && selectedJob && (
        <PromptFlowModal
          open={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          showToast={showToast}
          mistralToken={""}
          loadFlow={loadFlow}
          lowcodeBackendEndpoint={lowcodeBackendEndpoint}
          jobId={selectedJob.uuid}
          missingValues={selectedJob.missingValues || []}
          onMissingValuesSubmitted={handleMissingValuesSubmitted}
          onSubmitPrompt={onSubmitPrompt} // <-- Pass the prop from HistoryModalProps
        />
      )}
    </>
  );
};