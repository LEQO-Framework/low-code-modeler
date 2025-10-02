import Modal from "./Modal";

interface SendRequestModalProps {
  open: boolean;
  onClose: () => void;
  compilationTarget: string;
  setCompilationTarget: (target: string) => void;
  sendToBackend: () => void;
}

export const SendRequestModal = ({
  open,
  onClose,
  compilationTarget,
  setCompilationTarget,
  sendToBackend,
}: SendRequestModalProps) => {
  return (
    <Modal
      title="Send Request To Low-Code Backend"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button
            className={`btn ${
              //compilationTarget === "workflow"
                //? "btn-disabled opacity-50 cursor-not-allowed":
              "btn-primary"
            }`}
            onClick={sendToBackend}
            disabled={compilationTarget === "workflow"}
          >
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
            <option value="qasm">QASM</option>
             {/* <option value="workflow">Workflow</option> */}
          </select>
        </div>

       {/* {compilationTarget === "workflow" && (
          <p className="text-sm text-gray-500">
            Workflow compilation is not supported yet. Will come in the future.
          </p>
        )} */}
      </div>
    </Modal>
  );
};
