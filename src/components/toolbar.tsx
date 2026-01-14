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
  HelpCircle,
  Clock
} from "lucide-react";

interface ToolbarProps {
  onSave: (upload) => void;
  onRestore: () => void;
  onSaveAsSVG: () => void;
  onOpenConfig: () => void;
  uploadDiagram: () => void;
  onLoadJson: () => void;
  sendToBackend: () => void;
  //sendToQunicorn: () => void;
  openHistory: () => void;
  startTour: (tour) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onRestore,
  onSaveAsSVG,
  uploadDiagram,
  onOpenConfig,
  onLoadJson,
  sendToBackend,
  //sendToQunicorn,
  openHistory,
  startTour
}) => {
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
          <Button size="sm" onClick={onSave} title="Save the current diagram">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button size="sm" onClick={onSaveAsSVG} title="Save the current diagram as SVG">
            <Download className="w-4 h-4 mr-2" /> Save as SVG
          </Button>
          <Button size="sm" onClick={uploadDiagram} title="Upload the current diagram to GitHub">
            <UploadCloud className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button size="sm" onClick={onOpenConfig} title="Configure the editor and the endpoints">
            <Settings className="w-4 h-4 mr-2" /> Configuration
          </Button>
          <Button className="backend-button" size="sm" onClick={sendToBackend} title="Send the diagram to the backend">
            <Send className="w-4 h-4 mr-2" /> Send to Backend
          </Button>
          {/**<Button size="sm" onClick={sendToQunicorn} title="Execute the current model">
            <img src="qunicorn.jfif" className="w-5 h-5 mr-2" />
            Send to Qunicorn
          </Button>**/}
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
