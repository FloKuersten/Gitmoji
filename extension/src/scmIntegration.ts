import * as vscode from "vscode";
import type { GitAPI, GitExtension } from "./types";

export function getGitApi(): GitAPI | undefined {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    return undefined;
  }

  if (!extension.isActive) {
    return undefined;
  }

  try {
    return extension.exports.getAPI(1);
  } catch {
    return undefined;
  }
}

export function getActiveCommitMessage(): string | undefined {
  const api = getGitApi();
  if (!api?.repositories.length) {
    return undefined;
  }

  const repo =
    api.repositories.find((r) => r.inputBox.value.length > 0) ??
    api.repositories[0];

  return repo?.inputBox.value;
}

export function setActiveCommitMessage(value: string): boolean {
  const api = getGitApi();
  if (!api?.repositories.length) {
    return false;
  }

  const repo =
    api.repositories.find((r) => r.inputBox.value.length >= 0) ??
    api.repositories[0];

  if (!repo) {
    return false;
  }

  repo.inputBox.value = value;
  return true;
}
