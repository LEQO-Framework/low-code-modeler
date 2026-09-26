import { 
  FilePlus, 
  FolderOpen, 
  Save, 
  UploadCloud, 
  Settings, 
  Send, 
  HelpCircle, 
  Clock, 
  ChevronDown, 
  FileJson, 
  ImageIcon, 
  LayoutTemplate, 
  Search, 
  BadgeCheck, 
} from "lucide-react"; 
 
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
} from "./ui"; 
 
interface ToolbarProps { 
  onSave: () => void; 
  onRestore: () => void; 
  onSaveAsSVG: () => void; 
  onOpenConfig: () => void; 
  uploadDiagram: () => void; 
  onLoadJson: () => void; 
  createDomainProfile: () => void; 
  sendToBackend: () => void; 
  startQuantumAlgorithmSelection: () => void; 
  uploadPatternSolution: () => void; 
  openPatternSolution: () => void; 
  openHistory: () => void; 
  startTour: () => void; 
  onSaveAsTemplate: () => void; 
  onManageTemplates: () => void; 
  onGroupSelected: () => void; 
  generateModel: () => void; 
  openOpenQASM: () => void; 
} 
 
export default function Toolbar({ 
  onSave, 
  onRestore, 
  onSaveAsSVG, 
  onOpenConfig, 
  uploadDiagram, 
  onLoadJson, 
  createDomainProfile, 
  sendToBackend, 
  startQuantumAlgorithmSelection, 
  uploadPatternSolution, 
  openPatternSolution, 
  openHistory, 
  startTour, 
  onSaveAsTemplate, 
  onManageTemplates, 
  openOpenQASM, 
}: ToolbarProps) { 
  return ( 
    <div className="bg-gray-100 border-b border-gray-300 px-4 h-[70px] overflow-hidden"> 
      <div className="flex items-center h-full"> 
 
        {/* Qonstruct */} 
        <div className="flex items-center gap-2 shrink-0"> 
          <img src="Logo2.png" alt="Qonstruct" className="h-8 w-16" /> 
 
          <span className="text-lg font-semibold text-gray-800"> 
            Qonstruct 
          </span> 
        </div> 
 
        <div className="h-full flex items-center text-gray-400 text-xl shrink-0 ml-[20px]"> 
          | 
        </div> 
 
        {/* Toolbar categories */} 
        <div className="ml-[20px] flex items-start gap-3 h-full overflow-x-auto"> 
 
          {/* Start */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              Start 
            </span> 
 
            <div className="flex items-center gap-1"> 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRestore} 
                title="Open New Diagram" 
                className="border border-gray-300 hover:bg-gray-200" 
              > 
                <FilePlus className="h-4 w-4 mr-1" /> 
              </Button> 
 
              <DropdownMenu> 
                <DropdownMenuTrigger asChild> 
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Open Diagram" 
                    className="border border-gray-300 hover:bg-gray-200" 
                  > 
                    <FolderOpen className="h-4 w-4 mr-1" /> 
                    <ChevronDown className="h-3 w-3 ml-1" /> 
                  </Button> 
                </DropdownMenuTrigger> 
 
                <DropdownMenuContent> 
                  <DropdownMenuItem onClick={uploadDiagram}> 
                    <FolderOpen className="h-4 w-4 mr-2" /> 
                    Open Diagram 
                  </DropdownMenuItem> 
 
                  <DropdownMenuItem onClick={onLoadJson}> 
                    <FileJson className="h-4 w-4 mr-2" /> 
                    Open JSON 
                  </DropdownMenuItem> 
 
                  <DropdownMenuItem onClick={openOpenQASM}> 
                    <FileJson className="h-4 w-4 mr-2" /> 
                    Open OpenQASM 
                  </DropdownMenuItem> 
                </DropdownMenuContent> 
              </DropdownMenu> 
 
              <DropdownMenu> 
                <DropdownMenuTrigger asChild> 
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Save Diagram" 
                    className="border border-gray-300 hover:bg-gray-200" 
                  > 
                    <Save className="h-4 w-4 mr-1" /> 
                    <ChevronDown className="h-3 w-3 ml-1" /> 
                  </Button> 
                </DropdownMenuTrigger> 
 
                <DropdownMenuContent> 
                  <DropdownMenuItem onClick={onSave}> 
                    <Save className="h-4 w-4 mr-2" /> 
                    Save Diagram 
                  </DropdownMenuItem> 
 
                  <DropdownMenuItem onClick={onSaveAsSVG}> 
                    <ImageIcon className="h-4 w-4 mr-2" /> 
                    Save as SVG 
                  </DropdownMenuItem> 
 
                  <DropdownMenuItem onClick={onSaveAsTemplate}> 
                    <LayoutTemplate className="h-4 w-4 mr-2" /> 
                    Save as Template 
                  </DropdownMenuItem> 
                </DropdownMenuContent> 
              </DropdownMenu> 
 
              <DropdownMenu> 
                <DropdownMenuTrigger asChild> 
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Upload to GitHub" 
                    className="border border-gray-300 hover:bg-gray-200" 
                  > 
                    <UploadCloud className="h-4 w-4 mr-1" /> 
                    <ChevronDown className="h-3 w-3 ml-1" /> 
                  </Button> 
                </DropdownMenuTrigger> 
 
                <DropdownMenuContent> 
                  <DropdownMenuItem onClick={uploadPatternSolution}> 
                    <UploadCloud className="h-4 w-4 mr-2" /> 
                    Upload File 
                  </DropdownMenuItem> 
 
                  <DropdownMenuItem onClick={openPatternSolution}> 
                    <FolderOpen className="h-4 w-4 mr-2" /> 
                    Upload Pattern Solution 
                  </DropdownMenuItem> 
                </DropdownMenuContent> 
              </DropdownMenu> 
 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenConfig} 
                title="Configuration" 
                className="border border-gray-300 hover:bg-gray-200" 
              > 
                <Settings className="h-4 w-4 mr-1" /> 
              </Button> 
            </div> 
          </div> 
 
          {/* Separator */} 
          <div className="h-full flex items-center text-gray-400 text-xl shrink-0"> 
            | 
          </div> 
 
          {/* User Templates */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              User Templates 
            </span> 
 
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onManageTemplates} 
              title="Manage Templates" 
              className="border border-gray-300 hover:bg-gray-200" 
            > 
              <LayoutTemplate className="h-4 w-4 mr-1" /> 
              Template Library 
            </Button> 
          </div> 
 
          {/* Separator */} 
          <div className="h-full flex items-center text-gray-400 text-xl shrink-0"> 
            | 
          </div> 
 
          {/* Domain Profiles */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              Domain Profiles 
            </span> 
 
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={createDomainProfile} 
              title="Manage Domain Profiles" 
              className="border border-gray-300 hover:bg-gray-200" 
            > 
              <BadgeCheck className="h-4 w-4 mr-1" /> 
              Profile Manager 
            </Button> 
          </div> 
 
          {/* Separator */} 
          <div className="h-full flex items-center text-gray-400 text-xl shrink-0"> 
            | 
          </div> 
 
          {/* Transformation & Execution */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              Transformation &amp; Execution 
            </span> 
 
            <div className="flex items-center gap-1"> 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={sendToBackend} 
                title="Transformation of the model into a quantum circuit or workflow" 
                className="border border-gray-300 hover:bg-gray-200" 
              > 
                <Send className="h-4 w-4 mr-1" /> 
                Model Transformation 
              </Button> 
 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={openHistory} 
                title="Execute the transformed models" 
                className="border border-gray-300 hover:bg-gray-200" 
              > 
                <Clock className="h-4 w-4 mr-1" /> 
                History 
              </Button> 
            </div> 
          </div> 
 
          {/* Separator */} 
          <div className="h-full flex items-center text-gray-400 text-xl shrink-0"> 
            | 
          </div> 
 
          {/* AI Features */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              AI Features 
            </span> 
 
            <div className="flex items-center gap-1"> 
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={startQuantumAlgorithmSelection} 
                title="Detects from a natural language description which low-code model can be used" 
                className="border border-gray-300 hover:bg-gray-200" 
              > 
                <Search className="h-4 w-4 mr-1" /> 
                Algorithm Detection 
              </Button> 
 
            </div> 
          </div> 
 
          {/* Separator */} 
          <div className="h-full flex items-center text-gray-400 text-xl shrink-0"> 
            | 
          </div> 
 
          {/* Help */} 
          <div className="flex flex-col items-center justify-center h-full shrink-0"> 
            <span className="text-[11px] font-semibold text-gray-600 mb-1"> 
              Help 
            </span> 
 
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={startTour} 
              title="Help" 
              className="border border-gray-300 hover:bg-gray-200" 
            > 
              <HelpCircle className="h-4 w-4 mr-1" /> 
            </Button> 
          </div> 
 
        </div> 
      </div> 
    </div> 
  ); 
}