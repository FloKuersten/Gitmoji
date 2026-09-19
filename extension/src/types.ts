import type { Uri } from "vscode";

export type GitmojiSemver = "major" | "minor" | "patch";

export type GitmojiOutputFormat = "emoji" | "code";

export type GitmojiPosition = "prefix" | "after-type";

export interface GitmojiMapping {
  keywords: string[];
  gitmoji: string;
  /** Official shortcode including colons, e.g. `:bug:`. */
  code?: string;
  /** Official gitmoji name without colons, e.g. `bug`. */
  name?: string;
  description?: string;
  semver?: GitmojiSemver | null;
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
