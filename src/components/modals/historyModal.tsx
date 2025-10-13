import Modal from "./Modal";

export interface HistoryItem {
  uuid: string;
  name: string;
  description: string;
  status: string;
  created: string;
  links?: {
    request?: string;
    result?: string;
  };
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
      onClose={onClose}
      className="w-[900px] max-w-[95vw]"
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
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Model File</th>
              <th className="px-4 py-2 border">Created</th>
              <th className="px-4 py-2 border">Result Status</th>
              <th className="px-4 py-2 border">Result File</th>
              <th className="px-4 py-2 border">Execute</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={item.uuid || index} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{item.uuid}</td>
                <td className="px-4 py-2 border">{item.name}</td>
                <td className="px-4 py-2 border">{item.description}</td>

                <td className="px-4 py-2 border">
                  {item.links?.request ? (
                    <span
                      className="text-blue-600 underline cursor-pointer"
                      onClick={() => window.open(item.links.request, "_blank")}
                    >
                      Open
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                <td className="px-4 py-2 border">{new Date(item.created).toLocaleString()}</td>
                <td className="px-4 py-2 border">{item.status}</td>

                <td className="px-4 py-2 border">
                  {item.links?.result ? (
                    <span
                      className="text-blue-600 underline cursor-pointer"
                      onClick={() => window.open(item.links.result, "_blank")}
                    >
                      Open
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                <td className="px-4 py-2 border">
                  <button className="btn btn-primary" onClick={() => onExecute(item)}>
                    Execute
                  </button>
                </td>
              </tr>
            ))}

            {history.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center px-4 py-2">No history available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
