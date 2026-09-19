import * as vscode from "vscode";
import {
  filterMappingsForCompletion,
  formatToken,
} from "./gitmojiMatcher";
import type { GitmojiMapping, GitmojiOutputFormat } from "./types";

/**
 * Colon-triggered IntelliSense for the Source Control commit box (`scminput`)
 * and for COMMIT_EDITMSG buffers. Completely local — no network.
 */
export class GitmojiCompletionProvider
  implements vscode.CompletionItemProvider
{
  constructor(
    private readonly getMappings: () => GitmojiMapping[],
    private readonly getOutputFormat: () => GitmojiOutputFormat
  ) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const linePrefix = document
      .lineAt(position.line)
      .text.slice(0, position.character);

    const match = linePrefix.match(/:([a-z0-9_+-]*)$/i);
    if (!match) {
      return [];
    }

    const filter = match[1] ?? "";
    const start = position.character - match[0].length;
    const replaceRange = new vscode.Range(
      position.line,
      start,
      position.line,
      position.character
    );

    const outputFormat = this.getOutputFormat();
    const mappings = filterMappingsForCompletion(filter, this.getMappings());

    return mappings.map((mapping) => {
      const token = formatToken(mapping, outputFormat);
      const shortName = mapping.name ?? mapping.keywords[0] ?? token;
      const item = new vscode.CompletionItem(
        `${mapping.gitmoji} ${shortName}`,
        vscode.CompletionItemKind.EnumMember
      );
      item.detail = mapping.code ?? token;
      item.documentation = mapping.description;
      item.filterText = [
        mapping.gitmoji,
        mapping.code,
        mapping.name,
        mapping.description,
        ...mapping.keywords,
      ]
        .filter(Boolean)
        .join(" ");
      item.insertText = `${token} `;
      item.range = replaceRange;
      item.sortText = shortName;
      return item;
    });
  }
}

export function registerGitmojiCompletion(
  context: vscode.ExtensionContext,
  getMappings: () => GitmojiMapping[],
  getOutputFormat: () => GitmojiOutputFormat
): void {
  const provider = new GitmojiCompletionProvider(getMappings, getOutputFormat);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "scminput" },
      provider,
      ":"
    ),
    vscode.languages.registerCompletionItemProvider(
      { scheme: "file", pattern: "**/COMMIT_EDITMSG" },
      provider,
      ":"
    )
  );
}
