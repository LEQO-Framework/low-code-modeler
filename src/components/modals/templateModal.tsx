import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Download, Upload, Trash2, ImageIcon } from "lucide-react";
import { templateIconSrc } from "@/lib/templatePreview";

interface ManageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: any[];
  onSave: (updatedTemplates: any[]) => void;
}

export const ManageTemplateModal = ({
  open,
  onClose,
  templates,
  onSave,
}: ManageTemplateModalProps) => {
  const [localTemplates, setLocalTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // Inside ManageTemplateModal
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredTemplates = localTemplates.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Copy the templates when the dialog opens, so that Cancel discards all changes made in the dialog.
  useEffect(() => {
    if (open) {
      setLocalTemplates(JSON.parse(JSON.stringify(templates))); // deep copy
    }
  }, [open]);

  const updateLocal = (id: string, field: string, value: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => {
        if (id !== t.id) return t;
        let updatedTemplate = { ...t, [field]: value };
        if (updatedTemplate.flowData && updatedTemplate.flowData.metadata) {
          updatedTemplate.flowData.metadata = {
            ...t.flowData.metadata,
            name: field === "name" ? value : updatedTemplate.name,
            description:
              field === "description" ? value : updatedTemplate.description,
            author:
              field === "author"
                ? value
                : updatedTemplate.author ||
                  updatedTemplate.flowData.metadata.author,
          };
        }
        return updatedTemplate;
      }),
    );
  };

  // Like all other changes, deleting only takes effect with Save Changes; Cancel restores the template.
  const removeTemplate = (id: string) => {
    setLocalTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const isValidTemplate = (json: any): boolean => {
    // Check basic root properties
    console.log("json", json);
    const hasRootFields =
      json &&
      typeof json === "object" &&
      typeof json.id === "string" &&
      typeof json.name === "string" &&
      typeof json.description === "string" &&
      typeof json.completionGuaranteed === "boolean" &&
      typeof json.icon === "string" &&
      json.compactOptions &&
      json.type === "Templates" &&
      typeof json.label === "string" &&
      json.label.startsWith("Custom Template") &&
      json.flowData &&
      typeof json.flowData === "object";
    console.log("has root fields", hasRootFields);
    if (!hasRootFields) return false;

    // Check flowData internals
    const hasFlowDataFields =
      Array.isArray(json.flowData.nodes) && Array.isArray(json.flowData.edges);

    return hasFlowDataFields;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("importing templates");
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const results = {
      added: 0,
      duplicateFiles: [] as string[],
      invalidFiles: [] as string[],
    };

    // 1. Process all files
    const allFileData = await Promise.all(
      fileList.map(async (file) => {
        try {
          console.log("try");
          const text = await file.text();
          const json = JSON.parse(text);
          const templates = Array.isArray(json) ? json : [json];

          // check if valid json format
          const valid = templates.filter((item) => isValidTemplate(item));
          console.log(templates);
          console.log("valid", valid);

          if (valid.length === 0) {
            results.invalidFiles.push(file.name);
            return { fileName: file.name, data: [] };
          }
          return { fileName: file.name, data: valid };
        } catch {
          results.invalidFiles.push(file.name);
          return { fileName: file.name, data: [] };
        }
      }),
    );

    // Check for duplicates
    const existingIds = new Set(localTemplates.map((t) => t.id));
    const uniqueFromBatch = new Map();

    allFileData.forEach((fileObj) => {
      if (fileObj.data.length === 0) return;

      let fileHasNewContent = false;

      fileObj.data.forEach((item) => {
        if (!existingIds.has(item.id) && !uniqueFromBatch.has(item.id)) {
          uniqueFromBatch.set(item.id, item);
          fileHasNewContent = true;
          results.added++;
        }
      });

      if (!fileHasNewContent) {
        console.log(fileHasNewContent);
        results.duplicateFiles.push(fileObj.fileName);
      }
    });
    setLocalTemplates((prev) => {
      return [...prev, ...Array.from(uniqueFromBatch.values())];
    });
    console.log("results", results);
    console.log(results.duplicateFiles.length);

    // Toast message
    let msg = `Imported ${results.added} template(s).`;

    if (results.duplicateFiles.length > 0) {
      console.log("has duplicates");
      msg += `\nSkipped duplicate files: ${results.duplicateFiles.join(", ")}`;
    }

    if (results.invalidFiles.length > 0) {
      msg += `\nSkipped invalid files: ${results.invalidFiles.join(", ")}`;
    }

    const statusType =
      results.invalidFiles.length > 0 || results.duplicateFiles.length > 0
        ? "error"
        : "success";
    setToast({ message: msg, type: statusType });
    console.log(msg);
    e.target.value = "";
  };

  // Auslagern zu App.tsx?
  const handleExport = (template: any) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template_${template.id}.json`;
    link.click();
  };

  const handleIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    templateId: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLocal(templateId, "icon", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input
    e.target.value = "";
  };

  const hasUnsavedChanges =
    JSON.stringify(localTemplates) !== JSON.stringify(templates);

  const close = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      title="User Templates"
      open={open}
      onClose={close}
      className="w-[92vw] max-w-5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            {`${localTemplates.length} template${
              localTemplates.length === 1 ? "" : "s"
            }${hasUnsavedChanges ? " (unsaved changes)" : ""}`}
          </div>

          <div className="space-x-2">
            <button
              className={`btn ${
                hasUnsavedChanges
                  ? "btn-primary"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!hasUnsavedChanges}
              onClick={() => {
                onSave(localTemplates);
                close();
              }}
            >
              Save Changes
            </button>
            <button className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col min-h-0">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-10 right-10 z-[100] px-4 py-3 rounded-lg shadow-2xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 max-w-md ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
            />
            <div className="flex-1 text-left">
              <p className="text-xs font-medium whitespace-pre-line leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2">
          <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Saved Templates
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Edit, export, import or delete the models you saved as
                  templates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="border rounded-md px-3 py-2 text-sm bg-white min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <label className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".json"
                    onChange={handleImport}
                  />
                  <Upload size={16} />
                  Import
                </label>
              </div>
            </div>

            {localTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                <div className="text-sm font-medium text-gray-700">
                  No saved templates
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Use Save Diagram ▾ → Save as Template to see a model here.
                </p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                <div className="text-sm font-medium text-gray-700">
                  No templates match "{searchQuery}"
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300"
                  >
                    {/* Preview of the model; click to replace it with an own image */}
                    <label
                      className="relative group w-40 h-24 shrink-0 overflow-hidden rounded border border-gray-200 bg-white cursor-pointer"
                      title="Change image"
                    >
                      <img
                        src={templateIconSrc(template)}
                        className="w-full h-full object-contain"
                        alt={`Preview of ${template.name || "the template"}`}
                      />
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleIconUpload(e, template.id)}
                      />
                    </label>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase">
                            Name
                          </label>
                          <input
                            className="w-full border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={template.name || ""}
                            onChange={(e) =>
                              updateLocal(template.id, "name", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase">
                            Author
                          </label>
                          <input
                            className="w-full border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={
                              template.author ||
                              template.flowData?.metadata?.author ||
                              ""
                            }
                            onChange={(e) =>
                              updateLocal(template.id, "author", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border rounded px-2 py-1 text-xs bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={template.description || ""}
                          onChange={(e) =>
                            updateLocal(
                              template.id,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        onClick={() => handleExport(template)}
                      >
                        <Download size={14} />
                        Export
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        onClick={() => removeTemplate(template.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Modal>
  );
};
