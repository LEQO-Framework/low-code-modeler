import { useState, useEffect } from "react";
import Modal from "./Modal";

interface ConfigModalProps {
  open: boolean;
  ancillaMode: boolean;
  experienceLevel: string;
  compactVisualization:string;
  completionGuaranteed: boolean;
  onClose: () => void;
  onSave: (values: {
    ancillaMode: boolean;
    experienceLevel: string;
    compactVisualization:string;
    completionGuaranteed: boolean;
    tempNisqAnalyzerEndpoint: string;
    tempQunicornEndpoint: string;
    tempLowcodeBackendEndpoint: string;
    tempPatternAtlasUiEndpoint: string;
    tempPatternAtlasApiEndpoint: string;
    tempQcAtlasEndpoint: string;
    tempGithubRepositoryOwner: string;
    tempGithubRepositoryName: string;
    tempGithubBranch: string;
    tempGithubToken: string;
  }) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Current App state values
  tempNisqAnalyzerEndpoint: string;
  tempQunicornEndpoint: string;
  tempLowcodeBackendEndpoint: string;
  tempPatternAtlasUiEndpoint: string;
  tempPatternAtlasApiEndpoint: string;
  tempQcAtlasEndpoint: string;
  tempGithubRepositoryOwner: string;
  tempGithubRepositoryName: string;
  tempGithubBranch: string;
  tempGithubToken: string;
}

export const ConfigModal = ({
  open,
  onClose,
  onSave,
  activeTab,
  setActiveTab,
  ancillaMode,
  experienceLevel,
  compactVisualization,
  completionGuaranteed,
  tempNisqAnalyzerEndpoint,
  tempQunicornEndpoint,
  tempLowcodeBackendEndpoint,
  tempPatternAtlasUiEndpoint,
  tempPatternAtlasApiEndpoint,
  tempQcAtlasEndpoint,
  tempGithubRepositoryOwner,
  tempGithubRepositoryName,
  tempGithubBranch,
  tempGithubToken,
}: ConfigModalProps) => {
  // Local state copies
  const [localAncillaMode, setLocalAncillaMode] = useState(ancillaMode);
  const [localExperienceLevel, setLocalExperienceLevel] = useState(experienceLevel);
  const [localCompletionGuaranteed, setLocalCompletionGuaranteed] =
    useState(completionGuaranteed);
 const [localCompactVisualization, setLocalCompactVisualization] =
    useState(compactVisualization);

  const [localNisq, setLocalNisq] = useState(tempNisqAnalyzerEndpoint);
  const [localQunicorn, setLocalQunicorn] = useState(tempQunicornEndpoint);
  const [localLowcode, setLocalLowcode] = useState(tempLowcodeBackendEndpoint);
  const [localPatternUI, setLocalPatternUI] = useState(tempPatternAtlasUiEndpoint);
  const [localPatternAPI, setLocalPatternAPI] = useState(tempPatternAtlasApiEndpoint);
  const [localQcAtlas, setLocalQcAtlas] = useState(tempQcAtlasEndpoint);
  const [localGitOwner, setLocalGitOwner] = useState(tempGithubRepositoryOwner);
  const [localGitRepo, setLocalGitRepo] = useState(tempGithubRepositoryName);
  const [localGitBranch, setLocalGitBranch] = useState(tempGithubBranch);
  const [localGitToken, setLocalGitToken] = useState(tempGithubToken);

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setLocalAncillaMode(ancillaMode);
      setLocalExperienceLevel(experienceLevel);
      setLocalCompletionGuaranteed(completionGuaranteed);
      setLocalCompactVisualization(compactVisualization);

      setLocalNisq(tempNisqAnalyzerEndpoint);
      setLocalQunicorn(tempQunicornEndpoint);
      setLocalLowcode(tempLowcodeBackendEndpoint);
      setLocalPatternUI(tempPatternAtlasUiEndpoint);
      setLocalPatternAPI(tempPatternAtlasApiEndpoint);
      setLocalQcAtlas(tempQcAtlasEndpoint);
      setLocalGitOwner(tempGithubRepositoryOwner);
      setLocalGitRepo(tempGithubRepositoryName);
      setLocalGitBranch(tempGithubBranch);
      setLocalGitToken(tempGithubToken);
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      ancillaMode: localAncillaMode,
      experienceLevel: localExperienceLevel,
      compactVisualization: localCompactVisualization,
      completionGuaranteed: localCompletionGuaranteed,
      tempNisqAnalyzerEndpoint: localNisq,
      tempQunicornEndpoint: localQunicorn,
      tempLowcodeBackendEndpoint: localLowcode,
      tempPatternAtlasUiEndpoint: localPatternUI,
      tempPatternAtlasApiEndpoint: localPatternAPI,
      tempQcAtlasEndpoint: localQcAtlas,
      tempGithubRepositoryOwner: localGitOwner,
      tempGithubRepositoryName: localGitRepo,
      tempGithubBranch: localGitBranch,
      tempGithubToken: localGitToken,
    });
    onClose();
  };

  return (
    <Modal
      title="Configuration"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div>
        <div className="flex border-b mb-4">
          {["editor", "github", "lowCodeEndpoints", "patternEndpoints"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "editor"
                ? "Editor"
                : tab === "github"
                ? "GitHub"
                : tab === "lowCodeEndpoints"
                ? "Low-Code Endpoints"
                : "Pattern Endpoints"}
            </button>
          ))}
        </div>

        {activeTab === "editor" && (
          <div>
            <h3 className="labels">Ancilla Mode</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Ancilla Mode:</td>
                  <td align="left">
                    <input
                      type="checkbox"
                      checked={localAncillaMode}
                      onChange={(e) => setLocalAncillaMode(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">{localAncillaMode ? "On" : "Off"}</span>
                  </td>
                </tr>
              </tbody>
            </table>


            <h3 className="labels mt-4">Compact Visualization</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Compact Visualization:</td>
                  <td align="left">
                     <select
                      className="qwm-input"
                      value={localCompactVisualization}
                      onChange={(e) => setLocalCompactVisualization(e.target.value)}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="labels mt-4">Completion Guaranteed</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Completion Guaranteed:</td>
                  <td align="left">
                    <input
                      type="checkbox"
                      checked={localCompletionGuaranteed}
                      onChange={(e) => setLocalCompletionGuaranteed(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">
                      {localCompletionGuaranteed ? "True" : "False"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
         

           <h3 className="labels mt-4">Experience Level</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Experience Level:</td>
                  <td align="left">
                    <select
                      className="qwm-input"
                      value={localExperienceLevel}
                      onChange={(e) => setLocalExperienceLevel(e.target.value)}
                    >
                      <option value="explorer">Explorer</option>
                      <option value="pioneer">Pioneer</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
             </div>
        )}

        {activeTab === "lowCodeEndpoints" && (
          <div>
            <h3 className="labels">NISQ Analyzer</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">NISQ Analyzer Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localNisq}
                      onChange={(e) => setLocalNisq(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="labels mt-4">Qunicorn</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Qunicorn Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localQunicorn}
                      onChange={(e) => setLocalQunicorn(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="labels mt-4">Low-Code Backend</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Low-Code Backend Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localLowcode}
                      onChange={(e) => setLocalLowcode(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "patternEndpoints" && (
          <div>
            <h3 className="labels">Pattern Atlas UI</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Pattern Atlas UI Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localPatternUI}
                      onChange={(e) => setLocalPatternUI(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="labels mt-4">Pattern Atlas API</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Pattern Atlas API Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localPatternAPI}
                      onChange={(e) => setLocalPatternAPI(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="labels mt-4">QC Atlas</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">QC Atlas Endpoint:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localQcAtlas}
                      onChange={(e) => setLocalQcAtlas(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "github" && (
          <div>
            <h3 className="labels">GitHub Settings</h3>
            <table className="config-table">
              <tbody>
                <tr>
                  <td align="right">Repository Owner:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localGitOwner}
                      onChange={(e) => setLocalGitOwner(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td align="right">Repository Name:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localGitRepo}
                      onChange={(e) => setLocalGitRepo(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td align="right">Branch:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="text"
                      value={localGitBranch}
                      onChange={(e) => setLocalGitBranch(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td align="right">Token:</td>
                  <td align="left">
                    <input
                      className="qwm-input"
                      type="password"
                      value={localGitToken}
                      onChange={(e) => setLocalGitToken(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
