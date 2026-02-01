import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Download, Upload, Trash2, FileEdit, User, Type, AlignLeft } from "lucide-react";
import { Button } from "../ui";

interface ManageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: any[]; 
  onSave: (updatedTemplates: any[]) => void;
}

export const ManageTemplateModal = ({ open, onClose, templates, onSave }: ManageTemplateModalProps) => {
  const [localTemplates, setLocalTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setLocalTemplates(JSON.parse(JSON.stringify(templates))); // deep copy
    }
  }, [open, templates]);

  const updateLocal = (id: string, field: string, value: string) => {
    setLocalTemplates( prev => prev.map( t => {
      if (id !== t.id) return t;
      let updatedTemplate = {... t, [field]: value};
      if (updatedTemplate.flowData && updatedTemplate.flowData.metadata){
        updatedTemplate.flowData.metadata = {
          ...t.flowData.metadata,
          name: field === 'name' ? value : updatedTemplate.name,
          description: field === 'description' ? value : updatedTemplate.description,
          author: field === 'author' ? value : (updatedTemplate.author || updatedTemplate.flowData.metadata.author)
        };
      } 
      return updatedTemplate;
    }));
  };

  const removeLocal = (id: string) => {
    setLocalTemplates(prev => prev.filter(t => t.id !== id));
  };

  // TODO: test
  // TODO: auslagern zu App.tsx?
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const imported = Array.isArray(json) ? json : [json];
          // Check if one of the imported templates are already part of userTemplates 
          const existingIds = new Set(localTemplates.map((t) => t.id));
          const newTemplates: any[] = [];
          const duplicateNames: string[] = [];

          imported.forEach((temp) => {
            if (existingIds.has(temp.id)) {
              duplicateNames.push(temp.name || temp.id);
            } else {
              newTemplates.push(temp);
            }
          });

          // only import non-duplicate templates
          if (newTemplates.length > 0) {
            setLocalTemplates((prev) => [...prev, ...newTemplates]);
          }

          // alert user about duplated
          if (duplicateNames.length > 0) {
            alert(
              `Imported ${newTemplates.length} templates. Skipped ${duplicateNames.length} duplicate templates: (${duplicateNames.join(", ")}).`
            );
          }
          } catch (err) { alert("Invalid JSON"); }
        };
        reader.readAsText(file);
    });
        
      // Reset input
      e.target.value = "";
  };

  // TODO: test
  // Auslagern zu App.tsx?
  const handleExport = (template: any) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.flowData.metadata.name || 'template'}.json`;
    link.click();
  };

  // TODO: Update UI
  return (
    <Modal
      title="Manage User Templates"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={() => { onSave(localTemplates); onClose(); }}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="p-4 w-[600px]">
        <div className="flex justify-between items-center mb-6">
          <label className="cursor-pointer">
            <input 
              type="file" 
              multiple
              className="hidden" 
              accept=".json" 
              onChange={handleImport} />
            <Button variant="outline" size="sm" asChild>
              <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import</span>
            </Button>
          </label>
        </div>

        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
          {localTemplates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group">
              <div className="absolute top-2 right-2 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleExport(template)}>
                  <Download className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeLocal(template.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            {/* Upload Icon */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] uppercase text-gray-400 font-bold">Icon</label>
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  id={`icon-upload-${template.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateLocal(template.id, "icon", reader.result as string);
                      };
                      reader.readAsDataURL(file); // Converts to Base64
                    }
                  }}
                />
                <label htmlFor={`icon-upload-${template.id}`} className="cursor-pointer">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-white group-hover:border-blue-400 transition-colors">
                    {template.icon ? (
                      <img 
                        src={template.icon.startsWith('data:') ? template.icon : `/icons/${template.icon}`} 
                        className="w-full h-full object-contain" 
                        alt="Template Icon" 
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300 group-hover:text-blue-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity">
                    <span className="text-[10px] text-white font-medium">Change</span>
                  </div>
                </label>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Name field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold flex items-center gap-1">
                    <Type className="w-3 h-3" /> Name
                  </label>
                  <input
                    className="qwm-input w-full"
                    value={template.flowData.metadata.name || ""}
                    onChange={(e) => updateLocal(template.id, "name", e.target.value)}
                  />
                </div>

                {/* Author field */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-gray-400 font-bold flex items-center gap-1">
                    <User className="w-3 h-3" /> Author
                  </label>
                  <input
                    className="qwm-input w-full"
                    value={template.flowData.metadata.author || ""}
                    onChange={(e) => updateLocal(template.id, "author", e.target.value)}
                  />
                </div>

                {/* Description field */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase text-gray-400 font-bold flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" /> Description
                  </label>
                  <textarea
                    className="qwm-input w-full resize-none"
                    rows={2}
                    value={template.flowData.metadata.description || ""}
                    onChange={(e) => updateLocal(template.id, "description", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2 text-[9px] text-gray-400">ID: {template.id} • Created: {new Date(template.timestamp).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};