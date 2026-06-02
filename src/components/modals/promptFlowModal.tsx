import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Toast } from "./toast";

type InputNode = {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "bit" | "statePreparation" | "file";
  options?: string[];
  label: string;
  id: string;
};

interface PromptFlowModalProps {
  open: boolean;
  onClose: () => void;
  showToast: (message: React.ReactNode, type: "success" | "error" | "info") => void;
  mistralToken: string;
  loadFlow: (flow: any) => void;
  lowcodeBackendEndpoint: string;
  jobId?: string;
  missingValues?: any[];
  onMissingValuesSubmitted: (jobId: string, values: Record<string, any>) => Promise<void>;
  onSubmitPrompt: (prompt: string, generationMode: "compact" | "circuit") => Promise<any>;
}

export default function PromptFlowModal({
  open,
  onClose,
  showToast,
  mistralToken,
  loadFlow,
  lowcodeBackendEndpoint,
  jobId,
  missingValues = [],
  onMissingValuesSubmitted,
  onSubmitPrompt,
}: PromptFlowModalProps) {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<"compact" | "circuit">("compact");
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{ message: React.ReactNode; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (missingValues.length > 0) {
      const initialValues: Record<string, any> = {};
      missingValues.forEach((input) => {
        initialValues[input.id] = "";
      });
      setInputValues(initialValues);
    }
  }, [missingValues]);

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      await onSubmitPrompt(prompt, generationMode);
      onClose();
    } catch (err: any) {
      showToast(`Failed to generate model: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMissingValues = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      // Convert inputValues object to an array of { id, value, type }
      const missingValuesArray = Object.entries(inputValues).map(([id, value]) => {
        // Find the type from the missingValues prop
        const missingValue = missingValues.find((mv) => mv.id === id);
        return {
          id,
          value,
          type: missingValue?.type || "string", // Fallback to "string" if type not found
        };
      });
      await onMissingValuesSubmitted(jobId, missingValuesArray);
      onClose();
    } catch (err: any) {
      showToast(`Failed to submit missing values: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setPrompt("");
    setInputValues({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
  if (!open) {
    resetState();
  }
}, [open]);
  const bitOptions = ["0", "1"];
  const statePreparationOptions = [
    "BellPhiPlus",
    "BellPhiMinus",
    "BellPsiPlus",
    "BellPsiMinus",
    "UniformSuperposition",
    "GHZ",
    "W",
  ];

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {open && step === 1 && !missingValues.length && (
        <Modal
          title="Generate Model with AI"
          open={true}
          onClose={handleClose}
          className="max-w-2xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className={`btn ${!prompt.trim() || loading ? "btn-disabled opacity-50 cursor-not-allowed" : "btn-primary"}`}
                onClick={handleSubmitPrompt}
                disabled={!prompt.trim() || loading}
              >
                {loading ? "Processing..." : "Submit Prompt"}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <textarea
              className="w-full border rounded p-2"
              rows={5}
              placeholder="Describe the flow you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="space-y-2">
              <label className="block font-medium">
                Generation Mode:
                <select
                  className="ml-2 border rounded p-1"
                  value={generationMode}
                  onChange={(e) => setGenerationMode(e.target.value as "compact" | "circuit")}
                >
                  <option value="compact">Compact</option>
                  <option value="circuit">Circuit-Level</option>
                </select>
              </label>
            </div>
          </div>
        </Modal>
      )}

        {open && missingValues && missingValues.length > 0 && (
          <Modal
          title="Add Required Values"
          open={true}
          onClose={handleClose}
          className="max-w-2xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className="btn btn-primary"
                onClick={handleSubmitMissingValues}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Generate Model"}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              The following values are required to generate your model. Please provide them below.
            </p>
            {missingValues.map((input) => (
              <div key={input.id} className="space-y-2">
                <label className="block font-medium">
                  {input.label} ({input.type})
                </label>
                {input.type === "bit" && (
                  <select
                    className="w-full border p-2 rounded"
                    value={inputValues[input.id] || ""}
                    onChange={(e) => setInputValues({ ...inputValues, [input.id]: e.target.value })}
                  >
                    <option value="">Select a bit value</option>
                    {bitOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                {input.type === "statePreparation" && (
                  <select
                    className="w-full border p-2 rounded"
                    value={inputValues[input.id] || ""}
                    onChange={(e) => setInputValues({ ...inputValues, [input.id]: e.target.value })}
                  >
                    <option value="">Select a state</option>
                    {statePreparationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                {(input.type === "number" || input.type === "file" || input.type === "string") && (
                  <input
                    type={input.type === "number" ? "number" : "text"}
                    className="w-full border p-2 rounded"
                    placeholder={`Enter ${input.type}`}
                    value={inputValues[input.id] || ""}
                    onChange={(e) => setInputValues({ ...inputValues, [input.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

