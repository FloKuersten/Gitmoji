import * as vscode from "vscode";
import type { GitmojiMapping } from "./types";
import {
  WORKSPACE_MAPPING_FILES,
  extractRawMappingEntries,
  parseWorkspaceMappings,
} from "./workspaceMappings";

export {
  WORKSPACE_MAPPING_FILES,
  parseWorkspaceMappings,
} from "./workspaceMappings";

function decodeJson(bytes: Uint8Array): unknown {
  const text = Buffer.from(bytes).toString("utf8");
  return JSON.parse(text) as unknown;
}

/**
 * Loads the first present workspace mapping file across all folders.
 * Returns an empty list when none exist or all are invalid.
 */
export async function loadWorkspaceMappings(): Promise<{
  mappings: GitmojiMapping[];
  source?: string;
  rejected: number;
}> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    return { mappings: [], rejected: 0 };
  }

  for (const folder of folders) {
    for (const relative of WORKSPACE_MAPPING_FILES) {
      const uri = vscode.Uri.joinPath(folder.uri, relative);
      try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const parsed = decodeJson(bytes);
        const rawEntries = extractRawMappingEntries(parsed);
        const mappings = parseWorkspaceMappings(parsed);
        return {
          mappings,
          source: uri.fsPath,
          rejected: rawEntries.length - mappings.length,
        };
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (code === "FileNotFound" || code === "ENOENT") {
          continue;
        }
        // Malformed JSON or unexpected IO — skip this file, try the next.
        continue;
      }
    }
  }

  return { mappings: [], rejected: 0 };
}

/**
 * Watches the known workspace config paths and invokes `onChange` when any
 * candidate is created, edited, or deleted.
 */
export function watchWorkspaceMappingFiles(
  onChange: () => void
): vscode.Disposable {
  const watchers = WORKSPACE_MAPPING_FILES.map((relative) => {
    const watcher = vscode.workspace.createFileSystemWatcher(`**/${relative}`);
    watcher.onDidChange(onChange);
    watcher.onDidCreate(onChange);
    watcher.onDidDelete(onChange);
    return watcher;
  });

  return {
    dispose: () => {
      for (const watcher of watchers) {
        watcher.dispose();
      }
    },
  };
}
