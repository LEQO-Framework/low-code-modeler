/**
 * "Load from repository" for the Domain Profile dialog.
 *
 * Domain profiles are otherwise created by hand or imported file by file, which
 * means every user keeps their own copy and nobody can tell which revision a
 * profile came from. This reads them from a shared repository instead, see
 * `services/domainProfileRepository`.
 *
 * Renders nothing at all when no repository is configured, so an install that
 * does not use one is unaffected.
 */

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  compareVersionsDescending,
  fetchProfile,
  fetchProfileIndex,
  isProfileRepositoryConfigured,
  ProfileIndexEntry,
  RepositoryDomainProfile,
} from "../../services/domainProfileRepository";

export function DomainProfileRepositoryPicker({
  onLoad,
}: {
  /** Called with the fetched revision so the dialog can show it in its editor. */
  onLoad: (profile: RepositoryDomainProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<ProfileIndexEntry[]>([]);
  const [directory, setDirectory] = useState("");
  const [version, setVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The index is read when the panel is opened rather than on mount, so a dialog
  // that is never used for this costs no request.
  useEffect(() => {
    if (!open || domains.length > 0) return;
    let cancelled = false;

    setBusy(true);
    fetchProfileIndex()
      .then((entries) => {
        if (cancelled) return;
        setDomains(entries);
        setError(null);
        const first = entries[0];
        if (first) {
          setDirectory(first.directory);
          setVersion(first.latest || [...first.versions].sort(compareVersionsDescending)[0] || "");
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, domains.length]);

  if (!isProfileRepositoryConfigured()) return null;

  const selected = domains.find((entry) => entry.directory === directory);
  const versions = selected ? [...selected.versions].sort(compareVersionsDescending) : [];

  const load = async () => {
    if (!directory || !version) return;
    setBusy(true);
    setError(null);
    try {
      onLoad(await fetchProfile(directory, version));
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((previous) => !previous)}
        className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
        title="Load a domain profile from the shared repository"
      >
        <Download size={14} /> Load from Repository
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-300 bg-white p-3 shadow-lg">
          <div className="mb-2 text-xs font-semibold text-slate-600">
            LOAD DOMAIN PROFILE
          </div>

          <label className="mb-1 block text-xs text-slate-500">Domain</label>
          <select
            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={directory}
            disabled={busy || domains.length === 0}
            onChange={(event) => {
              const next = domains.find((entry) => entry.directory === event.target.value);
              setDirectory(event.target.value);
              setVersion(next?.latest ?? "");
            }}
          >
            {domains.map((entry) => (
              <option key={entry.directory} value={entry.directory}>
                {entry.name}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-xs text-slate-500">Revision</label>
          <select
            className="mb-3 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={version}
            disabled={busy || versions.length === 0}
            onChange={(event) => setVersion(event.target.value)}
          >
            {versions.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
                {selected?.latest === candidate ? " (latest)" : ""}
              </option>
            ))}
          </select>

          {error && <div className="mb-2 text-xs text-red-700">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              className="rounded px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={busy || !directory || !version}
              onClick={() => void load()}
            >
              {busy ? "Loading…" : "Load"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
