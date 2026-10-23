import type { Uri } from "vscode";
import type { GitRepository } from "./types";

function containsUri(root: Uri, candidate: Uri): boolean {
  if (
    root.scheme !== candidate.scheme ||
    root.authority !== candidate.authority
  ) {
    return false;
  }
  const normalize = (value: string): string =>
    process.platform === "win32" && root.scheme === "file"
      ? value.toLowerCase()
      : value;
  const parent = normalize(root.path).replace(/\/+$/, "");
  const child = normalize(candidate.path);
  return child === parent || child.startsWith(`${parent}/`);
}

/** Explicit SCM toolbar context wins; ambiguous workspaces are left untouched. */
export function selectRepository(
  repositories: GitRepository[],
  candidates: Uri[],
  explicitRoot?: Uri
): GitRepository | undefined {
  if (explicitRoot) {
    return repositories.find(
      (repo) => repo.rootUri.toString() === explicitRoot.toString()
    );
  }

  const selected = repositories.filter((repo) => repo.ui?.selected);
  if (selected.length === 1) return selected[0];

  for (const candidate of candidates) {
    const owning = repositories
      .filter((repo) => containsUri(repo.rootUri, candidate))
      .sort((a, b) => b.rootUri.path.length - a.rootUri.path.length)[0];
    if (owning) return owning;
  }

  if (repositories.length === 1) return repositories[0];
  const drafts = repositories.filter((repo) => repo.inputBox.value.trim());
  return drafts.length === 1 ? drafts[0] : undefined;
}

export interface CommitMessageTarget {
  repository: GitRepository;
  original: string;
}

/** Keep the original repository and refuse to overwrite a newer draft. */
export function applyCommitMessage(
  target: CommitMessageTarget,
  value: string
): boolean {
  if (target.repository.inputBox.value !== target.original) return false;
  target.repository.inputBox.value = value;
  return true;
}
