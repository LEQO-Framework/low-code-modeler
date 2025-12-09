import { Panel } from "reactflow";

interface ExperienceModePanelProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  ancillaModelingOn: boolean;
  onToggleAncilla: () => void;
  experienceLevel: string;
  onExperienceLevelChange: (level: string) => void;
  compactVisualization: boolean;
  onCompactVisualizationChange: () => void;
  completionGuaranteed: boolean;
  onCompletionGuaranteedChange: (value: boolean) => void;
}

export default function ExperienceModePanel({
  expanded,
  onToggleExpanded,
  ancillaModelingOn,
  onToggleAncilla,
  experienceLevel,
  onExperienceLevelChange,
  compactVisualization,
  onCompactVisualizationChange,
  completionGuaranteed,
  onCompletionGuaranteedChange,
}: ExperienceModePanelProps) {
  return (
    <Panel position="top-left" className="p-2 z-50">
  <div
    className="experience-mode w-70"
    style={{ fontFamily: "'Times New Roman', serif", fontSize: "16px" }} // Times New Roman + slightly larger
  >
    <div
      onClick={onToggleExpanded}
      className={`cursor-pointer px-4 py-2 rounded text-white transition-all duration-300 flex justify-between items-center ${
        expanded ? "bg-blue-600" : "bg-gray-400"
      }` }
       style={{ fontFamily: "'Times New Roman', serif", fontSize: "18px", fontWeight: 600 }}
    >
      <span>Experience Mode</span>
      <div className="flex items-center space-x-2">
        <span
          className={`transition-transform duration-300 ${
            expanded ? "rotate-90" : ""
          }`}
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
              <span title="Ancilla qubits are helper qubits...">
                Ancilla Modeling
              </span>
            </td>
            <td align="left">
              <button
                onClick={onToggleAncilla}
                className={`px-2 py-1 rounded text-black text-lg`}
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                {ancillaModelingOn ? "On" : "Off"}
              </button>
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
                onChange={(e) => onExperienceLevelChange(e.target.value)}
                className="mt-1 px-2 py-1 border rounded text-lg"
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                <option value="explorer" title="New to quantum computing...">
                  Explorer
                </option>
                <option value="pioneer" title="Advanced understanding...">
                  Pioneer
                </option>
              </select>
            </td>
          </tr>

          <tr>
            <td align="right">
              <span title="Compact Visualization reduces visual space...">
                Compact Visualization
              </span>
            </td>
            <td align="left">
              <button
                onClick={onCompactVisualizationChange}
                className={`px-2 py-1 rounded text-black text-lg`}
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                {compactVisualization ? "On" : "Off"}
              </button>
            </td>
          </tr>

          <tr>
            <td align="right">
              <span title="Completion Guaranteed ensures backend support.">
                Completion Guaranteed
              </span>
            </td>
            <td align="left">
              <select
                value={completionGuaranteed ? "Yes" : "No"}
                onChange={(e) =>
                  onCompletionGuaranteedChange(e.target.value === "Yes")
                }
                className="px-2 py-1 border text-black rounded text-lg"
                style={{ fontFamily: "'Times New Roman', serif" }}
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="mt-6 mb-2 text-lg font-semibold" style={{ fontFamily: "'Times New Roman', serif" }}>
        Recommended Settings
      </h3>
      <table className="mt-4 border border-collapse w-full text-sm" style={{ fontFamily: "'Times New Roman', serif" }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">Experience Level</th>
            <th className="border px-3 py-2 text-left">Compact Visualization</th>
            <th className="border px-3 py-2 text-left">Ancilla Mode</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-3 py-2">Explorer</td>
            <td className="border px-3 py-2">No</td>
            <td className="border px-3 py-2">Off</td>
          </tr>
          <tr>
            <td className="border px-3 py-2">Pioneer</td>
            <td className="border px-3 py-2">Yes</td>
            <td className="border px-3 py-2">On</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</Panel>

  );
}
