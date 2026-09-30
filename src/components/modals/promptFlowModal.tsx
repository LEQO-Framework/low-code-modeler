import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Toast } from "./toast";

interface PromptFlowModalProps {
  open: boolean;
  onClose: () => void;
  stepTest: number;
  showToast: (
    message: React.ReactNode,
    type: "success" | "error" | "info",
  ) => void;
  mistralToken: string;
  loadFlow: (flow: any) => void;
  lowcodeBackendEndpoint: string;
  jobId?: string;
  missingValues?: any[];
  onMissingValuesSubmitted: (
    jobId: string,
    values: Array<{ id: string; value: any; type: string }>,
  ) => Promise<void>;
  onSubmitPrompt: (
    prompt: string,
    generationMode: "compact" | "circuit",
  ) => Promise<any>;
}

export default function PromptFlowModal({
  open,
  onClose,
  showToast,
  stepTest,
  jobId,
  missingValues = [],
  onMissingValuesSubmitted,
  onSubmitPrompt,
}: PromptFlowModalProps) {
  const [_step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<"compact" | "circuit">(
    "compact",
  );

  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{
    message: React.ReactNode;
    type: "success" | "error" | "info";
  } | null>(null);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  // Validation helper for size inputs
  const validateSizeInput = (
    value: string,
    isBellState: boolean = false,
  ): { isValid: boolean; message: string } => {
    if (!value) return { isValid: false, message: "Please enter a value." };
    const num = Number(value);
    if (isNaN(num)) return { isValid: false, message: "Must be a number." };
    if (!Number.isInteger(num))
      return { isValid: false, message: "Must be an integer." };
    if (isBellState && num !== 2)
      return { isValid: false, message: "Bell states must have size 2." };
    if (num < 1) return { isValid: false, message: "Must be at least 1." }; // Allow 1 for uniform superpositions
    return { isValid: true, message: "" };
  };

  // Detects whether a generic `number` input is asking for the number of clusters, so it can be
  // validated the same way as the uniform-superposition size field: a positive integer of 1 or more.
  const isClusterCountInput = (input: any): boolean => {
    if (input.type !== "number") return false;
    const text =
      `${input.question ?? ""} ${input.label ?? ""} ${input.name ?? ""}`.toLowerCase();
    return text.includes("cluster");
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

  // The backend rejects prompts that are insulting, malicious or not about modeling a quantum
  // program ("Prompt rejected"). Nothing polls a generation job otherwise, so watch this one job
  // until it reaches a final status and tell the user why nothing was generated. Deliberately
  // fire-and-forget and free of component state: the modal closes right after submitting, and
  // showToast belongs to the page, so it still works once this modal is gone.
  const watchForRejectedPrompt = (jobIdToWatch: string) => {
    const intervalMs = 1500;
    const deadline = Date.now() + 60_000;

    const poll = async () => {
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        const response = await fetch(
          `http://localhost:3000/job/${jobIdToWatch}`,
        );
        if (!response.ok) return;

        const job = await response.json();
        if (job?.status === "Prompt rejected") {
          // The backend stores the reason in `result`; fall back only if it is missing.
          const reason =
            typeof job.result === "string" && job.result.trim()
              ? job.result
              : "Your prompt was rejected because it is insulting, malicious, or not about creating a quantum algorithm, circuit, workflow or program.";
          showToast(reason, "error");
          return;
        }
        if (
          ["completed", "failed", "User input required"].includes(job?.status)
        )
          return;
      }
    };

    poll().catch((err) =>
      console.error("Error while watching generation job:", err),
    );
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const job = await onSubmitPrompt(prompt, generationMode);
      const newJobId = job?.jobId ?? job?.id;
      if (newJobId) watchForRejectedPrompt(newJobId);
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
      const missingValuesArray = Object.entries(inputValues).map(
        ([compoundKey, value]) => {
          const [id, type] = compoundKey.split("-");
          return {
            id,
            value,
            type: type || "string",
          };
        },
      );

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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
                  onChange={(e) =>
                    setGenerationMode(e.target.value as "compact" | "circuit")
                  }
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
                disabled={
                  loading || Object.values(inputErrors).some((error) => error)
                }
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
              The following values are required to generate your model. Please
              provide them below.
            </p>
            {missingValues.map((input) => {
              const itemKey = `${input.id}-${input.type}`;

              if (
                input.type === "size" &&
                (input.isBellState || isCurrentlyBellSelected(input.id))
              ) {
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
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
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
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a state</option>
                      {input.isBellState
                        ? onlyBellOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))
                        : statePreparationOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                    </select>
                  )}

                  {input.type === "boolean" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a value</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  )}

                  {input.type === "oracleType" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a behaviour</option>
                      <option value="balanced">Balanced</option>
                      <option value="constant">Constant</option>
                    </select>
                  )}

                  {input.type === "constantValue" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a constant value</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  )}

                  {input.type === "qaoaProblem" && (
                    <select
                      className="w-full border p-2 rounded"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a problem type</option>
                      <option value="MaxCut">MaxCut</option>
                      <option value="Max-2-SAT">Max-2-SAT</option>
                      <option value="GraphColoring">GraphColoring</option>
                    </select>
                  )}

                  {input.type === "angle" && (
                    // Own input: an angle may be decimal and negative, so it must not use the
                    // positive-integer validation of the size/numQubits field below.
                    <input
                      type="number"
                      step="any"
                      className="w-full border p-2 rounded"
                      placeholder="Enter the rotation angle (e.g. 90 or 1.5708)"
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    />
                  )}

                  {(input.type === "size" ||
                    input.type === "numQubits" ||
                    input.type === "repeatCount" ||
                    input.type === "balancedMask") && (
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={1} // Allow 1 as the minimum
                        step={1}
                        className={`w-full border p-2 rounded ${
                          inputErrors[itemKey]
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        placeholder={
                          input.type === "repeatCount"
                            ? "Enter number of repetitions (e.g. 3)"
                            : input.type === "balancedMask"
                              ? "Enter the balanced mask (e.g. 5)"
                              : "Enter number of qubits (e.g. 1, 2, 3)"
                        }
                        value={inputValues[itemKey] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setInputValues({ ...inputValues, [itemKey]: value });
                          // Pass the isBellState flag from the input block
                          const isBellState =
                            input.type === "size" &&
                            (input.isBellState ||
                              isCurrentlyBellSelected(input.id));
                          const { isValid, message } = validateSizeInput(
                            value,
                            isBellState,
                          );
                          setInputErrors({
                            ...inputErrors,
                            [itemKey]: isValid ? "" : message,
                          });
                        }}
                        onBlur={(e) => {
                          const isBellState =
                            input.type === "size" &&
                            (input.isBellState ||
                              isCurrentlyBellSelected(input.id));
                          const { isValid, message } = validateSizeInput(
                            e.target.value,
                            isBellState,
                          );
                          setInputErrors({
                            ...inputErrors,
                            [itemKey]: isValid ? "" : message,
                          });
                        }}
                      />
                      {inputErrors[itemKey] && (
                        <p className="text-red-500 text-sm mt-1">
                          {inputErrors[itemKey]}
                        </p>
                      )}
                    </div>
                  )}

                  {input.type === "number" && !isClusterCountInput(input) && (
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      placeholder={`Enter ${input.type}`}
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    />
                  )}

                  {input.type === "number" && isClusterCountInput(input) && (
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className={`w-full border p-2 rounded ${
                          inputErrors[itemKey]
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter number of clusters (e.g. 1, 2, 3)"
                        value={inputValues[itemKey] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setInputValues({ ...inputValues, [itemKey]: value });
                          const { isValid, message } = validateSizeInput(
                            value,
                            false,
                          );
                          setInputErrors({
                            ...inputErrors,
                            [itemKey]: isValid ? "" : message,
                          });
                        }}
                        onBlur={(e) => {
                          const { isValid, message } = validateSizeInput(
                            e.target.value,
                            false,
                          );
                          setInputErrors({
                            ...inputErrors,
                            [itemKey]: isValid ? "" : message,
                          });
                        }}
                      />
                      {inputErrors[itemKey] && (
                        <p className="text-red-500 text-sm mt-1">
                          {inputErrors[itemKey]}
                        </p>
                      )}
                    </div>
                  )}

                  {input.type === "file" && (
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder={`Enter ${input.type}`}
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    />
                  )}

                  {input.type === "string" && (
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder={`Enter ${input.type}`}
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
                    />
                  )}

                  {(input.type === "array" ||
                    input.type === "targetStates" ||
                    input.type === "condition") && (
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder={
                        input.type === "array"
                          ? "e.g. 1,3.4,6,2,4.5"
                          : input.type === "targetStates"
                            ? "e.g. 0,3,5,9 (comma-separated)"
                            : "e.g. bit_0 == 1"
                      }
                      value={inputValues[itemKey] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [itemKey]: e.target.value,
                        })
                      }
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
