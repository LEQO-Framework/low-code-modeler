import { Crosshair } from "lucide-react";
import Modal from "./Modal";

interface ValidationItem {
  nodeId: string | null;
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
  /** Resolves a node ID to a human-readable name; returns null if the node no longer exists. */
  getNodeName?: (nodeId: string) => string | null;
  /** Closes the modal and moves the canvas to the given node. */
  onFocusNode?: (nodeId: string) => void;
}

function IssueTable({
  items,
  getNodeName,
  onFocusNode,
}: {
  items: ValidationItem[];
  getNodeName?: (nodeId: string) => string | null;
  onFocusNode?: (nodeId: string) => void;
}) {
  return (
    <table className="min-w-full table-auto border border-gray-300">
      <thead className="bg-gray-100 sticky top-0">
        <tr>
          <th className="px-4 py-2 border">Node</th>
          <th className="px-4 py-2 border">Node Type</th>
          <th className="px-4 py-2 border">Description</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const name = item.nodeId ? getNodeName?.(item.nodeId) : null;
          const canFocus = Boolean(item.nodeId && name !== null && onFocusNode);
          return (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">
                {item.nodeId ? (
                  canFocus ? (
                    <button
                      type="button"
                      onClick={() => onFocusNode!(item.nodeId!)}
                      className="flex items-center gap-1.5 text-left text-blue-600 hover:text-blue-800 hover:underline"
                      title={`Go to node (ID: ${item.nodeId})`}
                    >
                      <Crosshair size={14} className="shrink-0" />
                      <span>{name || item.nodeId}</span>
                    </button>
                  ) : (
                    <span title={item.nodeId}>{name || item.nodeId}</span>
                  )
                ) : (
                  <span className="text-gray-400">–</span>
                )}
              </td>
              <td className="px-4 py-2 border">{item.nodeType}</td>
              <td className="px-4 py-2 border">{item.description}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ValidationModal({
  open,
  onClose,
  onConfirm,
  validationResult,
  getNodeName,
  onFocusNode,
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
            className={`px-4 py-2 rounded ${
              validationResult.errors.length > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
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
            <IssueTable
              items={validationResult.errors}
              getNodeName={getNodeName}
              onFocusNode={onFocusNode}
            />
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div>
            <h3 className="font-semibold text-yellow-600 mb-2">Warnings</h3>
            <IssueTable
              items={validationResult.warnings}
              getNodeName={getNodeName}
              onFocusNode={onFocusNode}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
