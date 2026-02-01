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
  // Inside ManageTemplateModal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const isValidTemplate = (json: any): boolean => {
    // Check basic root properties
    console.log("json", json)
    const hasRootFields = 
      json &&
      typeof json === 'object' &&
      typeof json.id === 'string' &&
      typeof json.name === 'string' &&
      typeof json.description === 'string' &&
      typeof json.completionGuaranteed === 'boolean' &&
      typeof json.icon === 'string' &&
      json.compactOptions &&
      json.type === "Templates" &&
      typeof json.label === 'string' && json.label.startsWith("Custom Template") && 
      json.flowData && typeof json.flowData === 'object';
    console.log("has root fields", hasRootFields)
    if (!hasRootFields) return false;

    // Check flowData internals
    const hasFlowDataFields = 
      Array.isArray(json.flowData.nodes) && 
      Array.isArray(json.flowData.edges);

    return hasFlowDataFields;
  };


  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("importing templates")
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);
    const results = { 
      added: 0, 
      duplicateFiles: [] as string[], 
      invalidFiles: [] as string[] 
    };

    // 1. Process all files
    const allFileData = await Promise.all(
      fileList.map(async (file) => {
        try {
          console.log("try")
          const text = await file.text();
          const json = JSON.parse(text);
          const templates = Array.isArray(json) ? json : [json];
          
          // check if valid json format
          const valid = templates.filter(item => isValidTemplate(item)
          );
          console.log(templates)
          console.log("valid", valid)

          if (valid.length === 0) {
            results.invalidFiles.push(file.name);
            return { fileName: file.name, data: [] };
          }
          return { fileName: file.name, data: valid };
        } catch (err) {
          results.invalidFiles.push(file.name);
          return { fileName: file.name, data: [] };
        }
      })
    );

    // Check for duplicates
    const existingIds = new Set(localTemplates.map(t => t.id));
    const uniqueFromBatch = new Map();

    allFileData.forEach(fileObj => {
      if (fileObj.data.length === 0) return;

      let fileHasNewContent = false;

      fileObj.data.forEach(item => {
        if (!existingIds.has(item.id) && !uniqueFromBatch.has(item.id)) {
          uniqueFromBatch.set(item.id, item);
          fileHasNewContent = true;
          results.added++;
        }
      });

      if (!fileHasNewContent) {
        console.log(fileHasNewContent)
        results.duplicateFiles.push(fileObj.fileName);
      }
    });
    setLocalTemplates((prev) => {
      return [...prev, ...Array.from(uniqueFromBatch.values())];
    });
    console.log("results", results)
    console.log(results.duplicateFiles.length)

    // Toast message
    let msg = `Imported ${results.added} template(s).`;
    
    if (results.duplicateFiles.length > 0) {
      console.log("has duplicates")
      msg += `\nSkipped duplicate files: ${results.duplicateFiles.join(', ')}`;
    }
    
    if (results.invalidFiles.length > 0) {
      msg += `\nSkipped invalid files: ${results.invalidFiles.join(', ')}`;
    }
    
    const statusType = (results.invalidFiles.length > 0 || results.duplicateFiles.length > 0) ? 'error' : 'success';
    setToast({ message: msg, type: statusType });
    console.log(msg)
    e.target.value = ""; 
  };

  // Auslagern zu App.tsx?
  const handleExport = (template: any) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template_${template.id}.json`;
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
        {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-10 right-10 z-[100] px-4 py-3 rounded-lg shadow-2xl border flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 max-w-md ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1 text-left">
                <p className="text-xs font-medium whitespace-pre-line leading-relaxed">
                  {toast.message}
                </p>
              </div>
            </div>
          )}
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