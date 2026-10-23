import * as vscode from "vscode";
import type { GitAPI, GitExtension, GitRepository } from "./types";
import {
  selectRepository,
  type CommitMessageTarget,
} from "./repositorySelection";

export async function getGitApi(): Promise<GitAPI | undefined> {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) return undefined;
  try {
    const exports = extension.isActive
      ? extension.exports
      : await extension.activate();
    return exports.getAPI(1);
  } catch {
    return undefined;
  }
}

export async function getActiveRepository(
  sourceControl?: vscode.SourceControl
): Promise<GitRepository | undefined> {
  // Capture editor context before awaiting Git extension activation.
  const candidates = [
    vscode.window.activeTextEditor?.document.uri,
    ...vscode.window.visibleTextEditors.map((editor) => editor.document.uri),
  ].filter((uri): uri is vscode.Uri => uri !== undefined);
  const api = await getGitApi();
  return selectRepository(
    api?.repositories ?? [],
    candidates,
    sourceControl?.rootUri
  );
}

export async function getCommitMessageTarget(
  sourceControl?: vscode.SourceControl
): Promise<CommitMessageTarget | undefined> {
  const repository = await getActiveRepository(sourceControl);
  return repository
    ? { repository, original: repository.inputBox.value }
    : undefined;
}

export async function getActiveCommitMessage(): Promise<string | undefined> {
  return (await getCommitMessageTarget())?.original;
}
