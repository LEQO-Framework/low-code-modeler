import { useState } from "react";
import Modal from "./Modal";
import { categories } from "../panels/categories";

interface EditableNodeProfile {
  label: string;
  description: string;
  icon: string | string[];
  visible: boolean;

  originalLabel: string;
  originalDescription: string;
  originalIcon: string | string[];
}

function extractNodes(content: any): EditableNodeProfile[] {
  const nodes: EditableNodeProfile[] = [];

  const walk = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach((n) => {
        if (n?.label && n?.description) {
          nodes.push({
            label: n.label,
            description: n.description,
            icon: n.icon,
            visible: true,

            originalLabel: n.label,
            originalDescription: n.description,
            originalIcon: n.icon,
          });
        }
      });
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(walk);
    }
  };

  walk(content);
  return nodes;
}

export default function DomainProfileTableModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (profile: any) => void;
}) {
  const [profileName, setProfileName] = useState("My Domain Profile");

  const [profile, setProfile] = useState(() => {
    const result: Record<string, EditableNodeProfile[]> = {};
    Object.entries(categories).forEach(([categoryName, entry]: any) => {
      result[categoryName] = extractNodes(entry.content);
    });
    return result;
  });

  const updateNode = (
    category: string,
    index: number,
    field: keyof EditableNodeProfile,
    value: any
  ) => {
    setProfile((prev) => {
      const copy:any = structuredClone(prev);
      copy[category][index][field] = value;
      return copy;
    });
  };

  const resetNode = (category: string, index: number) => {
    setProfile((prev) => {
      const copy = structuredClone(prev);
      const node = copy[category][index];

      node.label = node.originalLabel;
      node.description = node.originalDescription;
      node.icon = node.originalIcon;
      node.visible = true;

      return copy;
    });
  };

  const handleIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      updateNode(category, index, "icon", reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      title="Domain Profile"
      open={open}
      onClose={onClose}
      className="max-w-6xl"
      footer={
        <div className="flex justify-between items-center">
          <input
            className="border rounded px-2 py-1"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />

          <div className="space-x-2">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                onSave({
                  name: profileName,
                  categories: profile,
                })
              }
            >
              Save Profile
            </button>
          </div>
        </div>
      }
    >

      <div className="max-h-[70vh] overflow-y-auto space-y-8">
        {Object.entries(profile).map(([categoryName, nodes]) => (
          <div key={categoryName}>
            <h3 className="font-semibold text-lg mb-2">
              {categoryName}
            </h3>

            <div className="overflow-x-auto">
              <table className="table-auto w-full border border-gray-300 rounded-md">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="p-2 border w-56">Name</th>
                    <th className="p-2 border w-24">Icon</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border w-20 text-center">
                      Visible
                    </th>
                    <th className="p-2 border w-24">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {nodes.map((node, idx) => (
                    <tr
                      key={`${node.originalLabel}-${idx}`}
                      className="align-top"
                    >
                      <td className="p-2 border">
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={node.label}
                          onChange={(e) =>
                            updateNode(
                              categoryName,
                              idx,
                              "label",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="p-2 border text-center">
                        <img
                          src={
                            Array.isArray(node.icon)
                              ? node.icon[0]
                              : node.icon
                          }
                          className="w-10 h-10 mx-auto object-contain mb-1"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="text-xs"
                          onChange={(e) =>
                            handleIconUpload(e, categoryName, idx)
                          }
                        />
                      </td>

                      <td className="p-2 border">
                        <textarea
                          className="w-full border rounded p-2 text-sm"
                          rows={3}
                          value={node.description}
                          onChange={(e) =>
                            updateNode(
                              categoryName,
                              idx,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td className="p-2 border text-center">
                        <input
                          type="checkbox"
                          checked={node.visible}
                          onChange={(e) =>
                            updateNode(
                              categoryName,
                              idx,
                              "visible",
                              e.target.checked
                            )
                          }
                        />
                      </td>

                      <td className="p-2 border text-center">
                        <button
                          className="btn btn-xs btn-secondary"
                          onClick={() =>
                            resetNode(categoryName, idx)
                          }
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
