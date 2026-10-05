import { Panel } from "reactflow";

interface ExperienceModePanelProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  experienceLevel: string;
  onExperienceLevelChange: (level: string) => void;
  compactVisualization: boolean;
  onCompactVisualizationChange: () => void;
  completionGuaranteed: boolean;
  onCompletionGuaranteedChange: (value: boolean) => void;
  domainProfile: string;
  onDomainProfileChange: (profile: string) => void;
  domainProfileNames: string[];
  mathMode: boolean;
  onToggleMathMode: () => void;
  qasmEditorMode: boolean;
  onToggleQasmEditorMode: () => void;
  onCollaborationModeChange: () => void;
  collaborationMode: boolean;
  userName: string;
  onUserNameChange: (name: string) => void;
}

export default function ExperienceModePanel({
  expanded,
  onToggleExpanded,
  experienceLevel,
  onExperienceLevelChange,
  compactVisualization,
  onCompactVisualizationChange,
  completionGuaranteed,
  onCompletionGuaranteedChange,
  domainProfile,
  onDomainProfileChange,
  domainProfileNames,
  mathMode,
  onToggleMathMode,
  qasmEditorMode,
  onToggleQasmEditorMode,
  onCollaborationModeChange,
  collaborationMode,
  userName,
  onUserNameChange,
}: ExperienceModePanelProps) {
  return (
    <Panel position="top-left" className="p-2 z-50">
      <div className="experience-mode w-70">
        <div
          onClick={onToggleExpanded}
          className={`cursor-pointer px-4 py-2 rounded text-white transition-all duration-300 flex justify-between items-center ${
            expanded ? "bg-blue-600" : "bg-gray-400"
          }`}
        >
          <span>Experience Mode</span>
          <div className="flex items-center space-x-2">
            <span
              className={`transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}
            >
              ▼
            </span>
          </div>
        </div>

        <div
          className={`origin-top transition-all duration-300 overflow-hidden ${
            expanded
              ? "max-h-screen opacity-100 scale-y-100 mt-2"
              : "max-h-0 opacity-0 scale-y-0"
          } bg-gray-100 rounded p-4`}
          style={{ transformOrigin: "top" }}
        >
          <table className="config-table w-full">
            <tbody>
              <tr>
                <td align="right">
                  <span title="Choose your domain profile.">
                    Domain Profile
                  </span>
                </td>
                <td align="left">
                  <select
                    value={domainProfile}
                    onChange={(e) => onDomainProfileChange(e.target.value)}
                    className="mt-1 px-2 py-1 border rounded"
                  >
                    <option value="none">None</option>
                    {domainProfileNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td align="right">
                  <span title="Choose your quantum computing experience.">
                    Experience Level
                  </span>
                </td>
                <td align="left">
                  <select
                    value={experienceLevel}
                    onChange={(e) => {
                      const level = e.target.value;

                      onExperienceLevelChange(level);

                      if (level === "pioneer" && !compactVisualization) {
                        onCompactVisualizationChange();
                      }

                      if (level === "explorer" && compactVisualization) {
                        onCompactVisualizationChange();
                      }
                    }}
                    className="mt-1 px-2 py-1 border rounded"
                  >
                    <option
                      value="explorer"
                      title="New to quantum computing, curious and starting the journey."
                    >
                      Explorer
                    </option>
                    <option
                      value="pioneer"
                      title="Advanced understanding, pushing the frontier of quantum computing."
                    >
                      Pioneer
                    </option>
                  </select>
                </td>
              </tr>
              <tr>
                <td align="right">
                  <span title="Compact Visualization reduces visual space by compressing nodes. Recommended for advanced users.">
                    Compact Visualization
                  </span>
                </td>
                <td align="left">
                  <button
                    onClick={onCompactVisualizationChange}
                    className={`px-2 py-1 rounded text-white ${
                      compactVisualization || experienceLevel === "pioneer"
                        ? "bg-blue-600"
                        : "bg-gray-400"
                    }`}
                  >
                    <span title="Compact Visualization reduces visual space by compressing nodes. Recommended for advanced users.">
                      {compactVisualization ? "On" : "Off"}
                    </span>
                  </button>
                </td>
              </tr>
              <tr>
                <td align="right">
                  <span title="Completion Guaranteed ensures that the backend has a suitable implementation.">
                    Completion Guaranteed
                  </span>
                </td>
                <td align="left">
                  <select
                    value={completionGuaranteed ? "Yes" : "No"}
                    onChange={(e) =>
                      onCompletionGuaranteedChange(e.target.value === "Yes")
                    }
                    className="px-2 py-1 border rounded"
                  >
                    <option title="The backend has suitable implementations for all nodes available.">
                      Yes
                    </option>
                    <option title="The backend does not have suitable implementations for all nodes available.">
                      No
                    </option>
                  </select>
                </td>
              </tr>

              {/* Math Mode Toggle */}
              <tr>
                <td align="right">
                  <span title="Shows the Dirac notation of the latest QASM output in the Properties panel.">
                    Math Mode
                  </span>
                </td>
                <td align="left">
                  <button
                    onClick={onToggleMathMode}
                    className={`px-2 py-1 rounded text-white ${
                      mathMode ? "bg-blue-600" : "bg-gray-400"
                    }`}
                  >
                    {mathMode ? "On" : "Off"}
                  </button>
                </td>
              </tr>

              {/* QASM Editor Toggle */}
              <tr>
                <td align="right">
                  <span title="Shows a QASM code editor in the Properties panel.">
                    QASM Editor
                  </span>
                </td>
                <td align="left">
                  <button
                    onClick={onToggleQasmEditorMode}
                    className={`px-2 py-1 rounded text-white ${
                      qasmEditorMode ? "bg-blue-600" : "bg-gray-400"
                    }`}
                  >
                    {qasmEditorMode ? "On" : "Off"}
                  </button>
                </td>
              </tr>

              <tr>
                <td align="right">
                  <span title="Collaboration Mode enables collaborative editing of diagrams among multiple users.">
                    Collaboration Mode
                  </span>
                </td>
                <td align="left" className="flex items-center gap-2">
                  <button
                    onClick={onCollaborationModeChange}
                    className={`px-2 py-1 rounded text-white ${
                      collaborationMode ? "bg-blue-600" : "bg-gray-400"
                    }`}
                  >
                    <span title="Collaboration Mode enables collaborative editing of diagrams among multiple users.">
                      {collaborationMode ? "On" : "Off"}
                    </span>
                  </button>
                  <input
                    className="qwm-input"
                    type="text"
                    value={userName}
                    onChange={(e) => onUserNameChange(e.target.value)}
                    disabled={!collaborationMode}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="mt-6 mb-2 text-lg font-semibold">
            Recommended Settings
          </h3>
          <table className="mt-4 border border-collapse w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Experience Level</th>
                <th className="border px-3 py-2 text-left">
                  Compact Visualization
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2">Explorer</td>
                <td className="border px-3 py-2">Off</td>
              </tr>
              <tr>
                <td className="border px-3 py-2">Pioneer</td>
                <td className="border px-3 py-2">On</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}
