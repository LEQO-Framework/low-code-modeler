import { useStore } from "@/config/store";
import { ArrowLeft } from "lucide-react";
import { Node } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: {
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
}) => ({
  selectedNode: state.selectedNode,
  setSelectedNode: state.setSelectedNode,
});

export const MetadataPanel = ({
  metadata,
  onUpdateMetadata,
}: {
  metadata: any;
  onUpdateMetadata: (updatedMetadata: any) => void;
}) => {
  const { setSelectedNode } = useStore(selector, shallow);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { id, value } = event.target;

    const updatedMetadata = {
      ...metadata,
      [id]: value,
    };

    onUpdateMetadata(updatedMetadata);

  }

  function handlePositiveNumberChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { id, value } = event.target;
    console.log(value)
    if (value === "") {
      onUpdateMetadata({ ...metadata, [id]: "" });
      return;
    }

    const numericValue = parseInt(value, 10);

    if (!isNaN(numericValue) && numericValue >= 1) {
      onUpdateMetadata({ ...metadata, [id]: numericValue });
    }
  }


  function handleCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { id, checked } = event.target;

    const updatedMetadata = {
      ...metadata,
      [id]: checked ? true : false,
    };

    onUpdateMetadata(updatedMetadata);
  }

  return (
    <>
      <aside className="flex flex-col w-full h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-2 font-semibold flex">
          <button
            onClick={() => {
              setSelectedNode(null);
            }}
          >
          </button>
          <h2 className="flex-grow text-center">Model Information</h2>
        </div>
        <hr />

        <div className="p-2 mt-3 space-y-4">
          {metadata ? (
            <>
              {["version", "name", "author", "description"].map((field) => (
                <div key={field}>
                  <label
                    className="block text-sm font-medium text-gray-700"
                    htmlFor={field}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  {field === "description" ? (
                    <textarea
                      id={field}
                      rows={4}
                      value={metadata[field] || ""}
                      onChange={handleChange}
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    />
                  ) : (
                    <input
                      type="text"
                      id={field}
                      value={metadata[field] || ""}
                      onChange={handleChange}
                      className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                    />
                  )}
                </div>
              ))}

              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-700">Optimization</h3>
                <div className="space-y-4">

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        id="optimizeWidth"
                        checked={metadata.optimizeWidth || false}
                        onChange={handleCheckboxChange}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Width Optimization</span>
                    </label>
                    {metadata.optimizeWidth && (
                      <div className="mt-2">
                        <label
                          className="block text-sm font-medium text-gray-700"
                          htmlFor="width"
                        >
                          Width
                        </label>
                        <input
                          type="number"
                          id="width"
                          min="1"
                          value={metadata.width || ""}
                          onChange={handlePositiveNumberChange}
                          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        id="optimizeDepth"
                        checked={metadata.optimizeDepth || false}
                        onChange={handleCheckboxChange}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Depth Optimization</span>
                    </label>
                    {metadata.optimizeDepth && (
                      <div className="mt-2">
                        <label
                          className="block text-sm font-medium text-gray-700"
                          htmlFor="depth"
                        >
                          Depth
                        </label>
                        <input
                          type="number"
                          id="depth"
                          min="1"
                          value={metadata.depth || ""}
                          onChange={handlePositiveNumberChange}
                          className="border block w-full border-gray-300 rounded-md sm:text-sm p-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No metadata available.</p>
          )}
        </div>
      </aside>
    </>
  );
};
