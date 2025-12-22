import Modal from "./Modal";

export interface PatternRef {
  id: string;
  name: string;
}

interface PatternGraphModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  patterns?: PatternRef[];
  patternAtlasPluginEndpoint: string;
}

export const PatternGraphModal = ({
  open,
  onClose,
  imageUrl,
  title = "Pattern Graph",
  patterns = [],
  patternAtlasPluginEndpoint,
}: PatternGraphModalProps) => {
  const makePatternUrl = (patternId: string) =>
    `${patternAtlasPluginEndpoint}/${patternId}/index.html`;
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
      <div className="max-h-[70vh] overflow-auto space-y-4">
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

        <div className="text-sm">
            <span className="font-semibold">Patterns involved:</span>{" "}
            {patterns.length === 0 ? (
              <span className="text-gray-400">—</span>
            ) : (
              <span className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                {patterns.map((p, idx) => (
                  <span key={p.id} className="flex items-center">
                    {idx > 0 && <span className="text-gray-400 mr-2">•</span>}
                    <a
                      href={makePatternUrl(p.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {p.name}
                    </a>
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
    </Modal>
  );
};
