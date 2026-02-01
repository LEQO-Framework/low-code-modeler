import React, { useState } from "react";
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger } from "./ui";

import {
  FilePlus,
  FolderOpen,
  Save,
  Download,
  UploadCloud,
  Settings,
  Send,
  HelpCircle,
  Clock,
  ChevronDown,
  FileJson,
  ImageIcon,
  LayoutTemplate,
} from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onRestore: () => void;
  onSaveAsSVG: () => void;
  onOpenConfig: () => void;
  uploadDiagram: () => void;
  onLoadJson: () => void;
  sendToBackend: () => void;
  startQuantumAlgorithmSelection: ()=> void;
  //sendToQunicorn: () => void;
  openHistory: () => void;
  startTour: () => void;
  onSaveAsTemplate: () => void;
  onManageTemplates: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onRestore,
  onSaveAsSVG,
  uploadDiagram,
  onOpenConfig,
  onLoadJson,
  sendToBackend,
  startQuantumAlgorithmSelection,
  //sendToQunicorn,
  openHistory,
  startTour,
  onSaveAsTemplate,
  onManageTemplates
}) => {
  const [saveIsOpen, setSaveIsOpen] = useState(false);
  return (
    <div className="flex items-center justify-between bg-gray-100 p-4 border-b border-gray-300 h-[56px]">
      <div className="flex items-center">
        <img src="Logo.png" alt="Logo" className="h-8 w-20" />
        <span className="font-semibold text-lg">Qonstruct</span>
        <div className="ml-[170px] flex gap-2">
          <Button size="sm" onClick={onLoadJson} title="Open a new diagram">
            <FilePlus className="w-4 h-4 mr-2" /> New Diagram
          </Button>
          <Button size="sm" onClick={onRestore} title="Open a diagram">
            <FolderOpen className="w-4 h-4 mr-2" /> Open
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" className="focus:ring-0 focus-visible:ring-0 outline-none">
                <Save className="w-4 h-4 mr-2" />
                Save
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={onSave} title="Download the current diagram as JSON">
                <FileJson className="w-4 h-4 mr-2" />
                <span>as JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSaveAsSVG} title="Download the current diagram as SVG">
                <ImageIcon className="w-4 h-4 mr-2" />
                <span>as SVG</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSaveAsTemplate} title="Save the current diagram as a custom user template">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                <span>as User Template</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={uploadDiagram} title="Upload the current diagram to GitHub">
            <UploadCloud className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button size="sm" onClick={onManageTemplates} title="Manage all custom user templates">
            <Settings className="w-4 h-4 mr-2" /> Manage Templates
          </Button>
          <Button size="sm" onClick={onOpenConfig} title="Configure the editor and the endpoints">
            <Settings className="w-4 h-4 mr-2" /> Configuration
          </Button>
          <Button className="backend-button" size="sm" onClick={sendToBackend} title="Send the diagram to the backend">
            <Send className="w-4 h-4 mr-2" /> Send to Backend
          </Button>
             <Button size="sm" onClick={startQuantumAlgorithmSelection}>
          <Settings className="w-4 h-4 mr-2" /> Detect Algorithm
        </Button>
          <Button size="sm" onClick={openHistory} title="Display the history">
            <Clock className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button size="sm" onClick={startTour} title="Start guided tour">
           <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>
    </div>
  );
};


export default Toolbar;