/**
 * Loads domain profiles from a profile repository instead of file-by-file imports.
 *
 * A repository is a plain static tree, an `index.json` naming the domains and
 * their revisions plus one JSON file per revision:
 *
 *   index.json                   { "domains": [{ name, directory, versions, latest }] }
 *   <directory>/<version>.json   the profile itself
 *
 * Because it is read with plain HTTP GET, any raw Git host, GitHub Pages or a
 * static file server works and no server-side component is required. The base
 * URL is configured with `VITE_DOMAIN_PROFILES_URL`. There is deliberately no
 * default: a repository is only useful once it is publicly readable, and a
 * hard-coded URL would make every install run into an authentication failure.
 */

/** A property declared on a domain block. */
export interface DomainProfileProperty {
  name: string;
  type: string;
}

/** A constraint on a property (required, min, max, allowed_values, …). */
export interface DomainProfileConstraint {
  propertyName: string;
  constraint: string;
  value?: string;
}

export interface DomainProfileBlock {
  label: string;
  description?: string;
  properties?: DomainProfileProperty[];
  constraints?: DomainProfileConstraint[];
}

/**
 * A profile revision as stored in the repository. Blocks are grouped by
 * category, which is the same grouping the editor uses.
 */
export interface RepositoryDomainProfile {
  name: string;
  version: string;
  domainBlocks: Record<string, DomainProfileBlock[]>;
}

/** One domain as listed in the repository index. */
export interface ProfileIndexEntry {
  name: string;
  directory: string;
  versions: string[];
  latest: string;
}

export const PROFILES_REPO_URL: string | undefined = import.meta.env
  .VITE_DOMAIN_PROFILES_URL;

/** Whether a repository is configured. If not, the UI keeps quiet about it. */
export function isProfileRepositoryConfigured(): boolean {
  return typeof PROFILES_REPO_URL === "string" && PROFILES_REPO_URL.length > 0;
}

function baseUrl(): string {
  if (!isProfileRepositoryConfigured()) {
    throw new Error("No profile repository configured (VITE_DOMAIN_PROFILES_URL is unset)");
  }
  return (PROFILES_REPO_URL as string).replace(/\/+$/, "");
}

/** Discover the available domains and their revisions. */
export async function fetchProfileIndex(): Promise<ProfileIndexEntry[]> {
  const response = await fetch(`${baseUrl()}/index.json`);
  if (!response.ok) {
    throw new Error(`Could not read the profile index (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data?.domains)) {
    throw new Error("The profile index does not list any domains");
  }
  return data.domains;
}

/** Fetch a single profile revision. */
export async function fetchProfile(
  directory: string,
  version: string
): Promise<RepositoryDomainProfile> {
  const response = await fetch(`${baseUrl()}/${directory}/${version}.json`);
  if (!response.ok) {
    throw new Error(`Could not read ${directory} ${version} (${response.status})`);
  }
  return response.json();
}

/** Descending version order, so the newest revision is offered first. */
export function compareVersionsDescending(a: string, b: string): number {
  const left = a.split(".").map((part) => parseInt(part, 10) || 0);
  const right = b.split(".").map((part) => parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (right[i] ?? 0) - (left[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
