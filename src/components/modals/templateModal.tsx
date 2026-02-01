import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Download, Upload, Trash2, FileEdit, User, Type, AlignLeft, ImageIcon } from "lucide-react";
import { Button } from "../ui";

interface ManageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templates: any[]; 
  onSave: (updatedTemplates: any[]) => void;
}

export const ManageTemplateModal = ({ open, onClose, templates, onSave }: ManageTemplateModalProps) => {
  const [localTemplates, setLocalTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = localTemplates.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>, templateId: string) => {
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

  // TODO: Update UI
  return (
    <Modal
      title="Manage User Templates"
      open={open}
      onClose={() => {setSearchQuery(""); onClose();}}
      footer={
        <div className="flex justify-end space-x-2 pr-6">
          <button className="btn btn-primary" onClick={() => { setSearchQuery(""); onSave(localTemplates); onClose(); }}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={() => {setSearchQuery(""); onClose();}}>
            Cancel
          </button>
        </div>
      }
      className="max-w-4xl"
    >
      <div className="pt-4 px-4 pb-0 w-full">
        <div className="flex items-center gap-2 mb-4 w-full pr-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search user templates..."
              className="w-full h-9 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Import Button */}
          <label className="cursor-pointer">
            <input 
              type="file" 
              multiple
              className="hidden" 
              accept=".json" 
              onChange={handleImport} 
            />
            <Button variant="outline" size="sm" asChild className="h-9">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Import
              </span>
            </Button>
          </label>
        </div>

        {/* Filtered Template List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                
                {/* column 1: Icon */}
                <div className="relative group w-48 h-48 bg-white border rounded shrink-0 overflow-hidden">
                  <img 
                    src={template.icon?.startsWith('data:') ? template.icon : `/public/${template.icon}`} 
                    className="w-full h-full object-contain p-1" 
                    alt="icon"
                  />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleIconUpload(e, template.id)} />
                    <ImageIcon className="w-5 h-5 text-white" />
                  </label>
                </div>

                {/* column 2*/}
                <div className="flex flex-col justify-between h-48 flex-1 min-w-0">
                <div className="flex gap-4 w-full">
                  {/* Name */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-small text-gray-700 flex items-center gap-0.5">Name</label>
                    <input 
                      className="qwm-input w-0.5full h-8 text-sm gap-1" 
                      value={template.name || ""} 
                      onChange={e => updateLocal(template.id, "name", e.target.value)} 
                    />
                  </div>
                  {/* Author */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-small text-gray-700 flex items-center gap-0.5">Author</label>
                    <input 
                      className="qwm-input w-full h-8 text-sm gap-1" 
                      value={template.author || template.flowData?.metadata?.author || ""} 
                      onChange={e => updateLocal(template.id, "author", e.target.value)} 
                    />
                  </div>
                </div>
                {/* Description */}
                <div className="flex flex-col h-32 gap-1 pt-0">
                  <label className="text-[10px] font-small text-gray-700 flex items-center gap-1">
                    Description
                  </label>
                  <textarea 
                    rows={2} 
                    className="qwm-input h-28 resize-none w-full text-sm" 
                    value={template.description || ""} 
                    onChange={e => updateLocal(template.id, "description", e.target.value)} 
                  />
                </div>
              </div>
              </div>

              
              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 hover:bg-gray-200" 
                  onClick={() => handleExport(template)}
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4"/> Export
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 hover:bg-gray-200" 
                  onClick={() => removeLocal(template.id)}
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4"/> Delete
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};