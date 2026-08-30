import type { Uri } from "vscode";

export interface GitmojiMapping {
  keywords: string[];
  gitmoji: string;
  description?: string;
}

export interface GitmojiDictionary {
  version: number;
  mappings: GitmojiMapping[];
}

export interface GitAPI {
  repositories: GitRepository[];
}

export interface GitRepository {
  rootUri: Uri;
  inputBox: {
    value: string;
  };
}

export interface GitExtension {
  getAPI(version: 1): GitAPI;
}

export type GitmojiPosition = "prefix" | "after-type";
