import React from "react";
import { Button } from "./ui";
import {
  FilePlus,
  FolderOpen,
  Save,
  Download,
  UploadCloud,
  Settings,
  Send,
  Server,
} from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onRestore: () => void;
  onSaveAsSVG: () => void;
  onOpenConfig: () => void;
  onLoadJson: () => void;
  sendToBackend:()=> void;
  sendToQunicorn:()=> void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onRestore,
  onSaveAsSVG,
  onOpenConfig,
  onLoadJson,
  sendToBackend,
  sendToQunicorn
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-100 p-4 border-b border-gray-300 h-[56px]">
      <div className="space-x-2 flex">
        <Button size="sm" onClick={onLoadJson}>
          <FilePlus className="w-4 h-4 mr-2" /> New Diagram
        </Button>
        <Button size="sm" onClick={onRestore}>
          <FolderOpen className="w-4 h-4 mr-2" /> Open
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" /> Save
        </Button>
        <Button size="sm" onClick={onSaveAsSVG}>
          <Download className="w-4 h-4 mr-2" /> Save as
        </Button>
        <Button size="sm" onClick={onSaveAsSVG}>
          <UploadCloud className="w-4 h-4 mr-2" /> Upload
        </Button>
        <Button size="sm" onClick={onOpenConfig}>
          <Settings className="w-4 h-4 mr-2" /> Configuration
        </Button>
        <Button size="sm" onClick={sendToBackend}>
          <Send className="w-4 h-4 mr-2" /> Send to Backend
        </Button>
        <Button size="sm" onClick={sendToQunicorn}>
          <img src="/qunicorn.jfif" className="w-5 h-5 mr-2" />
          Send to Qunicorn
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
