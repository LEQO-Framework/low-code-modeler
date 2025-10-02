import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Modal from "./Modal";

interface QunicornModalProps {
  open: boolean;
  step: number;
  onClose: () => void;
  onStep1Deploy: () => void;
  onStep2CreateJob: (jobData: { device: string; provider: string; numShots: number; accessToken: string }) => void;
  onStep3Execute: () => void;
  selectedDevice: string;
  setSelectedDevice: (device: string) => void;
  provider: string;
  setProvider: (provider: string) => void;
  numShots: number;
  setNumShots: (shots: number) => void;
  accessToken: string;
  setAccessToken: (token: string) => void;
  errorMessage?: string;
  progress?: number;
  chartData?: { register: string; value: number }[];
}

export const QunicornModal = ({
  open,
  step,
  onClose,
  onStep1Deploy,
  onStep2CreateJob,
  onStep3Execute,
  selectedDevice,
  setSelectedDevice,
  provider,
  setProvider,
  numShots,
  setNumShots,
  accessToken,
  setAccessToken,
  errorMessage,
  progress,
  chartData,
}: QunicornModalProps) => {
  const handleCreateJob = () => {
    if (!selectedDevice.trim() || !["IBM", "AWS", "RIGETTI", "QMWARE"].includes(provider)) return;
    onStep2CreateJob({ device: selectedDevice, provider, numShots, accessToken });
  };

  return (
    <Modal
      title={`Qunicorn Deployment (${step}/3)`}
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end space-x-2">
          {step === 1 && (
            <>
              <button className="btn btn-primary" onClick={onStep1Deploy}>Deploy</button>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </>
          )}
          {step === 2 && (
            <>
              <button
                className={`btn ${selectedDevice.trim() && ["IBM", "AWS", "RIGETTI", "QMWARE"].includes(provider) ? "btn-primary" : "btn-secondary"}`}
                onClick={handleCreateJob}
              >
                Create
              </button>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </>
          )}
          {step === 3 && (
            <>
              <button className="btn btn-primary" onClick={onStep3Execute}>Execute</button>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </>
          )}
        </div>
      }
    >
      <div>
        {step === 1 && (
          <p>
            In the first step, the QASM of the model is deployed to Qunicorn.
            Qunicorn serves as a unification layer for execution across IBM, AWS, and other quantum cloud providers.
          </p>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p>
              In the next step, a job is created which can be executed on a quantum device.
              Specify your quantum device, provider, number of shots, and access token.
            </p>

            <div>
              <label className="block font-medium mb-1">Quantum Device</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                placeholder="aer_simulator"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Provider</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="">Select a provider</option>
                <option value="IBM">IBM</option>
                <option value="AWS">AWS</option>
                <option value="RIGETTI">RIGETTI</option>
                <option value="QMWARE">QMWARE</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Number of Shots</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={numShots}
                onChange={(e) => setNumShots(parseInt(e.target.value))}
                placeholder="1024"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Access Token</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Your quantum provider token"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            {errorMessage ? (
              <p className="text-red-600 font-semibold">{errorMessage}</p>
            ) : (
              <p>
                The job is executed on <strong>{selectedDevice || "unknown device"}</strong> with <strong>{numShots || "N/A"}</strong> shots.
              </p>
            )}

            {chartData && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="register" label={{ value: "Register", position: "insideBottom", offset: 5 }} />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: "Probabilities", angle: -90, dx: 0, dy: 30, position: "insideLeft" }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}

            <div style={{ marginTop: "20px" }}>
              <progress value={progress || 0} max={100} style={{ width: "100%" }} />
              <p>{progress || 0}%</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
