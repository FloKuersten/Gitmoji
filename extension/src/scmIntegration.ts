import * as vscode from "vscode";
import type { GitAPI, GitExtension, GitRepository } from "./types";

/**
 * Resolves the built-in Git extension API, activating the extension when it has
 * not been started yet. Returns undefined when Git is unavailable or disabled.
 */
export async function getGitApi(): Promise<GitAPI | undefined> {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    return undefined;
  }

  try {
    const exports = extension.isActive
      ? extension.exports
      : await extension.activate();
    return exports.getAPI(1);
  } catch {
    return undefined;
  }
}

function isPathInside(parent: string, child: string): boolean {
  const normalizedParent = parent.replace(/[\\/]+$/, "").toLowerCase();
  const normalizedChild = child.toLowerCase();
  return (
    normalizedChild === normalizedParent ||
    normalizedChild.startsWith(`${normalizedParent}/`) ||
    normalizedChild.startsWith(`${normalizedParent}\\`)
  );
}

/**
 * Picks the repository the user most likely means: the one owning the active
 * editor's file, then the one owning any visible editor, then the only
 * repository, then the first repository with a non-empty commit message.
 *
 * Both reads and writes go through this function so a multi-root workspace can
 * never read from one repository and write to another.
 */
export async function getActiveRepository(): Promise<
  GitRepository | undefined
> {
  const api = await getGitApi();
  if (!api?.repositories.length) {
    return undefined;
  }

  const repositories = api.repositories;

  const candidateUris = [
    vscode.window.activeTextEditor?.document.uri,
    ...vscode.window.visibleTextEditors.map((editor) => editor.document.uri),
  ].filter((uri): uri is vscode.Uri => uri !== undefined);

  for (const uri of candidateUris) {
    if (uri.scheme !== "file") {
      continue;
    }

    const owning = repositories
      .filter((repo) => isPathInside(repo.rootUri.fsPath, uri.fsPath))
      .sort((a, b) => b.rootUri.fsPath.length - a.rootUri.fsPath.length)[0];

    if (owning) {
      return owning;
    }
  }

  if (repositories.length === 1) {
    return repositories[0];
  }

  return (
    repositories.find((repo) => repo.inputBox.value.trim().length > 0) ??
    repositories[0]
  );
}

export async function getActiveCommitMessage(): Promise<string | undefined> {
  const repository = await getActiveRepository();
  return repository?.inputBox.value;
}

export async function setActiveCommitMessage(value: string): Promise<boolean> {
  const repository = await getActiveRepository();
  if (!repository) {
    return false;
  }

  repository.inputBox.value = value;
  return true;
}
