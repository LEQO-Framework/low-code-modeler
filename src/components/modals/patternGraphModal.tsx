import Modal from "./Modal";

interface PatternGraphModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export const PatternGraphModal = ({
  open,
  onClose,
  imageUrl,
  title = "Pattern Graph",
}: PatternGraphModalProps) => {
  return (
    <Modal
      title={title}
      open={open}
      onClose={onClose}
      className="w-[800px] max-w-[95vw]"
      footer={
        <div className="flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="flex justify-center items-center max-h-[70vh] overflow-auto">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Pattern Graph"
            className="max-w-full max-h-full object-contain border rounded"
          />
        ) : (
          <span className="text-gray-400">No pattern graph available</span>
        )}
      </div>
    </Modal>
  );
};
