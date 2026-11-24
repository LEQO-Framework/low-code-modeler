const DEFAULT_GENERATION_BACKEND: string =
  import.meta.env.VITE_GENERATION_BACKEND || "http://localhost:3000";

export type JobStatus = "queued" | "running" | "done" | "failed";

export type JobResponse = {
  id: string;
  prompt: string;
  status: JobStatus;
  result?: string | null;
};

/**
 * Create a generation job
 */
export async function createGenerationJob(
  prompt: string,
  generationMode: string,
  baseUrl: string = DEFAULT_GENERATION_BACKEND,
): Promise<{ jobId: string }> {
  const res = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, generationMode }),
  });

  if (!res.ok) {
    throw new Error("Failed to create job");
  }

  return res.json();
}

/**
 * Fetch job status
 */
export async function getJob(
  jobId: string,
  baseUrl: string = DEFAULT_GENERATION_BACKEND,
): Promise<JobResponse> {
  const res = await fetch(`${baseUrl}/job/${jobId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch job");
  }

  return res.json();
}

/**
 * Poll job until completion
 */
export function waitForJob(
  jobId: string,
  onUpdate?: (job: JobResponse) => void,
  intervalMs = 1000,
  baseUrl: string = DEFAULT_GENERATION_BACKEND,
): Promise<JobResponse> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const job = await getJob(jobId, baseUrl);

        if (onUpdate) onUpdate(job);

        if (job.status === "done") {
          clearInterval(interval);
          resolve(job);
        }

        if (job.status === "failed") {
          clearInterval(interval);
          reject(new Error("Job failed"));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
}

export async function generate(
  prompt: string,
  generationMode: string,
  _onUpdate?: (job: JobResponse) => void,
  baseUrl: string = DEFAULT_GENERATION_BACKEND,
) {
  const { jobId } = await createGenerationJob(prompt, generationMode, baseUrl);
  return jobId;
}
