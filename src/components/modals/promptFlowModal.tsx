import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Toast } from "./toast";

type InputNode = {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "bit" | "statePreparation" | "file" | "size";
  options?: string[];
  label: string;
  id: string;
  isBellState?: boolean;
};

interface PromptFlowModalProps {
  open: boolean;
  onClose: () => void;
  stepTest: number;
  showToast: (message: React.ReactNode, type: "success" | "error" | "info") => void;
  mistralToken: string;
  loadFlow: (flow: any) => void;
  lowcodeBackendEndpoint: string;
  jobId?: string;
  missingValues?: any[];
  onMissingValuesSubmitted: (jobId: string, values: Array<{ id: string; value: any; type: string }>) => Promise<void>;
  onSubmitPrompt: (prompt: string, generationMode: "compact" | "circuit") => Promise<any>;
}

export default function PromptFlowModal({
  open,
  onClose,
  showToast,
  stepTest,
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
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  // Validation helper for size inputs
  const validateSizeInput = (value: string): { isValid: boolean; message: string } => {
    if (!value) return { isValid: false, message: "Please enter a value." };
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: "Must be a number." };
    if (!Number.isInteger(num)) return { isValid: false, message: "Must be an integer." };
    if (num <= 1) return { isValid: false, message: "Must be greater than 1." };
    return { isValid: true, message: "" };
  };

  useEffect(() => {
    if (missingValues.length > 0) {
      const initialValues: Record<string, any> = {};
      const initialErrors: Record<string, string> = {};
      missingValues.forEach((input) => {
        initialValues[`${input.id}-${input.type}`] = "";
        initialErrors[`${input.id}-${input.type}`] = "";
      });
      setInputValues(initialValues);
      setInputErrors(initialErrors);
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
      const missingValuesArray = Object.entries(inputValues).map(([compoundKey, value]) => {
        const [id, type] = compoundKey.split("-");
        return {
          id,
          value,
          type: type || "string",
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
    setInputErrors({});
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

  const onlyBellOptions = [
    "BellPhiPlus",
    "BellPhiMinus",
    "BellPsiPlus",
    "BellPsiMinus",
  ];

  // Helper: Checks if a Bell State option is selected by using the specific compound key
  const isCurrentlyBellSelected = (targetId: string): boolean => {
    const chosenState = inputValues[`${targetId}-statePreparation`];
    if (!chosenState) return false;
    return onlyBellOptions.includes(chosenState);
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {open && stepTest === 1 && !missingValues.length && (
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

      {open && stepTest === 2 && missingValues && missingValues.length > 0 && (
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
                disabled={loading || Object.values(inputErrors).some((error) => error)}
              >
                {loading ? "Submitting..." : "Generate Model"}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
            </div>
          }        >
          <div className="space-y-4">
            <p className="text-gray-600">
              The following values are required to generate your model. Please provide them below.
            </p>
            {missingValues.map((input) => {
              const itemKey = `${input.id}-${input.type}`;

              if (input.type === "size" && (input.isBellState || isCurrentlyBellSelected(input.id))) {
                return null;
              }

              return (
                <div key={itemKey} className="space-y-2">
                  <label className="block font-medium">
                    {input.question || input.label} ({input.type})
                  </label>
                  
                  {input.type === "bit" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) => setInputValues({ ...inputValues, [itemKey]: e.target.value })}
                    >
                      <option value="">Select a bit value</option>
                      {bitOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {input.type === "statePreparation" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) => setInputValues({ ...inputValues, [itemKey]: e.target.value })}
                    >
                      <option value="">Select a state</option>
                      {input.isBellState
                        ? onlyBellOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))
                        : statePreparationOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))
                      }
                    </select>
                  )}

                  {input.type === "size" && (
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={2}
                        step={1}
                        className={`w-full border p-2 rounded ${
                          inputErrors[itemKey] ? "border-red-500 bg-red-50" : "border-gray-300"
                        }`}
                        placeholder="Enter number of qubits (e.g. 3)"
                        value={inputValues[itemKey] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setInputValues({ ...inputValues, [itemKey]: value });
                          const { isValid, message } = validateSizeInput(value);
                          setInputErrors({ ...inputErrors, [itemKey]: isValid ? "" : message });
                        }}
                        onBlur={(e) => {
                          const { isValid, message } = validateSizeInput(e.target.value);
                          setInputErrors({ ...inputErrors, [itemKey]: isValid ? "" : message });
                        }}
                      />
                      {inputErrors[itemKey] && (
                        <p className="text-red-500 text-sm mt-1">{inputErrors[itemKey]}</p>
                      )}
                    </div>
                  )}

                  {(input.type === "number" || input.type === "file" || input.type === "string") && (
                    <input
                      type={input.type === "number" ? "number" : "text"}
                      className="w-full border p-2 rounded"
                      placeholder={`Enter ${input.type}`}
                      value={inputValues[itemKey] || ""}
                      onChange={(e) => setInputValues({ ...inputValues, [itemKey]: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}