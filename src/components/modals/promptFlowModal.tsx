import { useState } from "react";
import Modal from "./Modal";

type InputNode = {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  options?: string[];
};

export default function PromptFlowModal({
  open,
  onClose,
  sendToMistral,
  generateFlow,
  mistralToken,
}: {
  open: boolean;
  onClose: (flow?: any) => void;
  sendToMistral: (prompt: string, token: string) => Promise<any>;
  generateFlow: (data: any, token: string) => Promise<any>;
  mistralToken: string;
}) {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [inputNodes, setInputNodes] = useState<InputNode[]>([]);
  const [nodeValues, setNodeValues] = useState<Record<string, any>>({});

  const [error, setError] = useState<string | null>(null);

  // clarification support
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setClarifyingQuestions([]);

    try {
      const result = await sendToMistral(prompt, mistralToken);

      // handle clarification mode
      if (result?.needs_clarification) {
        setStep(1);
        setInputNodes([]);
        setNodeValues({});
        setClarifyingQuestions(result.questions || []);
        return;
      }

      const extractedInputs: InputNode[] = result?.inputs || [];

      if (!Array.isArray(extractedInputs)) {
        throw new Error("Invalid response format");
      }

      if (extractedInputs.length === 0) {
        setError("No input nodes detected. Try a more detailed prompt.");
        setStep(1);
        setInputNodes([]);
        setNodeValues({});
        return;
      }

      setInputNodes(extractedInputs);

      const initialValues: Record<string, any> = {};
      extractedInputs.forEach((node) => {
        initialValues[node.name] = "";
      });

      setNodeValues(initialValues);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError("Failed to process prompt. Check your API key or input.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlow = async () => {
    setLoading(true);
    setError(null);

    try {
      const flow = await generateFlow(
        {
          prompt,
          inputs: nodeValues,
        },
        mistralToken
      );

      if (!flow) throw new Error("No flow returned");

      onClose(flow);
      resetState();
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate flow.");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setPrompt("");
    setInputNodes([]);
    setNodeValues({});
    setError(null);
    setClarifyingQuestions([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <>
      {open && step === 1 && (
        <Modal
          title="Generate Model with AI (1/2)"
          open={true}
          onClose={handleClose}
          className="max-w-2xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className={`btn ${
                  !prompt.trim() || loading
                    ? "btn-disabled btn-secondary opacity-50 cursor-not-allowed"
                    : "btn-primary"
                }`}
                onClick={handleSubmitPrompt}
                disabled={loading || !prompt.trim()}
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
            {error && (
              <div className="bg-red-100 text-red-800 p-2 rounded whitespace-pre-line">
                {error}
              </div>
            )}

            {clarifyingQuestions.length > 0 && (
              <div className="bg-yellow-100 text-yellow-900 p-3 rounded">
                <p className="font-semibold mb-2">Clarify your request:</p>
                <ul className="list-disc ml-5 space-y-1">
                  {clarifyingQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <textarea
              className="w-full border rounded p-2"
              rows={5}
              placeholder="Describe the flow you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {open && step === 2 && (
        <Modal
          title="Provide Input Data (2/2)"
          open={true}
          onClose={handleClose}
          className="max-w-2xl"
          footer={
            <div className="flex justify-end space-x-2">
              <button
                className="btn btn-primary"
                onClick={handleGenerateFlow}
                disabled={
                  loading ||
                  inputNodes.length === 0 ||
                  Object.keys(nodeValues).length === 0
                }
              >
                {loading ? "Generating..." : "Generate Flow"}
              </button>

              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-800 p-2 rounded">
                {error}
              </div>
            )}

            {inputNodes.map((node) => (
              <div key={node.name}>
                <label className="block font-medium mb-1">
                  {node.name} ({node.type})
                </label>

                {node.type === "string" && (
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={nodeValues[node.name] || ""}
                    onChange={(e) =>
                      setNodeValues({
                        ...nodeValues,
                        [node.name]: e.target.value,
                      })
                    }
                  />
                )}

                {node.type === "number" && (
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={nodeValues[node.name] || ""}
                    onChange={(e) =>
                      setNodeValues({
                        ...nodeValues,
                        [node.name]: Number(e.target.value),
                      })
                    }
                  />
                )}

                {node.type === "boolean" && (
                  <select
                    className="w-full border p-2 rounded"
                    value={String(nodeValues[node.name])}
                    onChange={(e) =>
                      setNodeValues({
                        ...nodeValues,
                        [node.name]: e.target.value === "true",
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                )}

                {node.type === "select" && node.options && (
                  <select
                    className="w-full border p-2 rounded"
                    value={nodeValues[node.name] || ""}
                    onChange={(e) =>
                      setNodeValues({
                        ...nodeValues,
                        [node.name]: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    {node.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}