import Modal from "./Modal";
import { useEffect } from "react";

interface SendRequestModalProps {
  open: boolean;
  onClose: () => void;
  compilationTarget: string;
  containsPlaceholder: boolean;
  containsWorkflowNodes: boolean;
  containsPythonNodes: boolean;
  setCompilationTarget: (target: string) => void;
  sendToBackend: () => void;
}

export const SendRequestModal = ({
  open,
  onClose,
  compilationTarget,
  containsPlaceholder,
  containsWorkflowNodes,
  containsPythonNodes,
  setCompilationTarget,
  sendToBackend,
}: SendRequestModalProps) => {
  const qasmUnavailable =
    containsPlaceholder || containsWorkflowNodes || containsPythonNodes;

  useEffect(() => {
    if (
      qasmUnavailable &&
      (compilationTarget === "qasm" || compilationTarget === "qiskit")
    ) {
      setCompilationTarget("workflow");
    }
  }, [qasmUnavailable, compilationTarget, setCompilationTarget]);

  return (
    <Modal
      title="Send Request To Low-Code Backend"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={sendToBackend}>
            Send
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Compilation Target</label>
          <select
            className="select select-bordered w-full"
            value={compilationTarget}
            onChange={(e) => setCompilationTarget(e.target.value)}
          >
            <option value="workflow">Workflow</option>
            <option value="qasm" disabled={qasmUnavailable}>
              OpenQASM3{" "}
              {containsPlaceholder
                ? "(not available, placeholder present)"
                : containsWorkflowNodes
                  ? "(not available, Machine Learning, File or String node present)"
                  : containsPythonNodes
                    ? "(not available, Python implementation present)"
                    : ""}
            </option>
          </select>
        </div>
        {containsPythonNodes && (
          <p className="text-sm text-gray-600">
            The model contains a block with a Python implementation. Python
            code runs on a classical computer and cannot be expressed as an
            OpenQASM circuit, so the model can only be transformed into a
            workflow. The Python code is then executed as a service task by a
            generated service.
          </p>
        )}
      </div>
    </Modal>
  );
};
