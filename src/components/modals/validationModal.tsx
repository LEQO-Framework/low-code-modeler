import Modal from "./Modal";

interface ValidationItem {
  nodeId: string;
  nodeType: string;
  description: string;
}

interface ValidationResult {
  warnings: ValidationItem[];
  errors: ValidationItem[];
}

interface ValidationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validationResult: ValidationResult;
}

export function ValidationModal({
  open,
  onClose,
  onConfirm,
  validationResult,
}: ValidationModalProps) {
  return (
    <Modal
      title="Validation"
      open={open}
      onClose={onClose}
      className="w-[900px] max-w-[95vw]"
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={validationResult.errors.length > 0}
            className={`px-4 py-2 rounded ${validationResult.errors.length > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>

            Continue
          </button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto overflow-x-auto space-y-6">
        {validationResult.errors.length === 0 &&
          validationResult.warnings.length === 0 && (
            <p className="text-green-600 font-medium">
              No issues found. You can continue.
            </p>
          )}

        {validationResult.errors.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-600 mb-2">Errors</h3>
            <table className="min-w-full table-auto border border-gray-300">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 border">Node ID</th>
                  <th className="px-4 py-2 border">Node Type</th>
                  <th className="px-4 py-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                {validationResult.errors.map((err, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{err.nodeId}</td>
                    <td className="px-4 py-2 border">{err.nodeType}</td>
                    <td className="px-4 py-2 border">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div>
            <h3 className="font-semibold text-yellow-600 mb-2">Warnings</h3>
            <table className="min-w-full table-auto border border-gray-300">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 border">Node ID</th>
                  <th className="px-4 py-2 border">Node Type</th>
                  <th className="px-4 py-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                {validationResult.warnings.map((warn, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{warn.nodeId}</td>
                    <td className="px-4 py-2 border">{warn.nodeType}</td>
                    <td className="px-4 py-2 border">{warn.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
