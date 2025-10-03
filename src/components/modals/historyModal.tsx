import Modal from "./Modal";

export interface HistoryItem {
  id: string;
  description: string;
  modelFileUrl: string;
  resultStatus: string;
  resultFileUrl: string;
  createdAt: string;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onExecute: (item: HistoryItem) => void;
}

export const HistoryModal = ({ open, onClose, history, onExecute }: HistoryModalProps) => {
  return (
    <Modal
      title="History"
      open={open}
      className="w-[900px] max-w-[95vw]"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Model ID</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Created When</th>
              <th className="px-4 py-2 border">Model File</th>
              <th className="px-4 py-2 border">Result Status</th>
              <th className="px-4 py-2 border">Result File</th>
              <th className="px-4 py-2 border">Execute</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{item.id}</td>
                <td className="px-4 py-2 border">{item.description}</td>
                <td className="px-4 py-2 border">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 border text-blue-600 underline cursor-pointer"
                    onClick={() => window.open(item.modelFileUrl, "_blank")}>
                  Download
                </td>
                <td className="px-4 py-2 border">{item.resultStatus}</td>
                <td className="px-4 py-2 border text-blue-600 underline cursor-pointer"
                    onClick={() => window.open(item.resultFileUrl, "_blank")}>
                  Download
                </td>
                <td className="px-4 py-2 border">
                  <button
                    className="btn btn-primary"
                    onClick={() => onExecute(item)}
                  >
                    Execute
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center px-4 py-2">No history available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
