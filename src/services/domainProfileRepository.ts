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
 * URL can be provided via `VITE_DOMAIN_PROFILES_URL` or supplied at runtime by
 * the user. There is deliberately no hard-coded default: a repository is only
 * useful once it is publicly readable, and a hard-coded URL would make every
 * install run into an authentication failure.
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

function resolveBaseUrl(repositoryUrl?: string): string {
  const candidate = (repositoryUrl ?? PROFILES_REPO_URL ?? "").trim();
  if (!candidate) {
    throw new Error("No profile repository configured or provided");
  }
  return candidate.replace(/\/+$/, "");
}

/** Discover the available domains and their revisions. */
export async function fetchProfileIndex(repositoryUrl?: string): Promise<ProfileIndexEntry[]> {
  const response = await fetch(`${resolveBaseUrl(repositoryUrl)}/index.json`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Could not find index.json at the specified repository URL. Please check the URL and make sure the repository contains an index.json. (HTTP ${response.status})`
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Access to the profile repository was denied. Please make sure the repository is publicly accessible. (HTTP ${response.status})`
      );
    }

    if (response.status >= 500 && response.status < 600) {
      throw new Error(
        `The profile repository is currently unavailable. Please try again later. (HTTP ${response.status})`
      );
    }

    throw new Error(
      `Could not read the profile repository (HTTP ${response.status}).`
    );
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
  version: string,
  repositoryUrl?: string
): Promise<RepositoryDomainProfile> {
  const response = await fetch(
    `${resolveBaseUrl(repositoryUrl)}/${directory}/${version}.json`
  );
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
