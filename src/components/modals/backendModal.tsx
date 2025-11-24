import Modal from "./Modal";
import { useEffect } from "react";

interface SendRequestModalProps {
  open: boolean;
  onClose: () => void;
  compilationTarget: string;
  containsPlaceholder: boolean;
  setCompilationTarget: (target: string) => void;
  sendToBackend: () => void;
}

export const SendRequestModal = ({
  open,
  onClose,
  compilationTarget,
  containsPlaceholder,
  setCompilationTarget,
  sendToBackend,
}: SendRequestModalProps) => {
  useEffect(() => {
    if (containsPlaceholder && compilationTarget === "qasm") {
      setCompilationTarget("workflow");
    }
  }, [containsPlaceholder, compilationTarget, setCompilationTarget]);

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
          <label className="block mb-1 font-semibold">
            Compilation Target
          </label>
          <select
            className="select select-bordered w-full"
            value={compilationTarget}
            onChange={(e) => setCompilationTarget(e.target.value)}
          >
            <option value="qasm" disabled={containsPlaceholder}>
              OpenQASM3 {containsPlaceholder ? "(not available, placeholder present)" : ""}
            </option>
            <option value="workflow">Workflow</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};
