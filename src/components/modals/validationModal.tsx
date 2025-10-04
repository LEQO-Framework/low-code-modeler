export function ValidationModal({ open, onClose, onConfirm, validationResult }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <h2 className="text-lg font-bold mb-4">Validation Results</h2>

        {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
          <p className="text-green-600">No issues found. You can continue.</p>
        )}

        {validationResult.errors.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-red-600">Errors</h3>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Node ID</th>
                  <th className="border border-gray-300 px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {validationResult.errors.map((err, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-2 py-1">{err.nodeId}</td>
                    <td className="border border-gray-300 px-2 py-1">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-yellow-600">Warnings</h3>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Node ID</th>
                  <th className="border border-gray-300 px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {validationResult.warnings.map((warn, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-2 py-1">{warn.nodeId}</td>
                    <td className="border border-gray-300 px-2 py-1">{warn.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={validationResult.errors.length > 0}
            className={`px-4 py-2 rounded ${
              validationResult.errors.length > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
