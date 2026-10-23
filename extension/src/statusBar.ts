import * as vscode from "vscode";
import { formatToken, matchGitmoji } from "./gitmojiMatcher";
import { getActiveCommitMessage } from "./scmIntegration";
import type { GitmojiMapping, GitmojiOutputFormat } from "./types";

const POLL_INTERVAL_MS = 2000;

/**
 * Shows the gitmoji that the format command would apply to the current commit
 * message, and hides itself when there is nothing to suggest.
 *
 * The Git extension API exposes no change event for its commit input box, so
 * the value is polled. Each tick only compares a string and, when it changed,
 * runs the same in-memory matcher used by the commands.
 */
export class CommitStatusBar {
  private readonly item: vscode.StatusBarItem;
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastMessage: string | undefined;
  private getMappings: () => GitmojiMapping[];
  private getOutputFormat: () => GitmojiOutputFormat;
  private getEnableScopeMatching: () => boolean;
  private enabled = false;
  private disposed = false;
  private generation = 0;

  constructor(
    getMappings: () => GitmojiMapping[],
    getOutputFormat: () => GitmojiOutputFormat = () => "emoji",
    getEnableScopeMatching: () => boolean = () => true
  ) {
    this.getMappings = getMappings;
    this.getOutputFormat = getOutputFormat;
    this.getEnableScopeMatching = getEnableScopeMatching;
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = "autoGitmoji.formatCommitMessage";
    this.item.name = "Auto Gitmoji";
  }

  public start(): void {
    this.applyEnabledState();
  }

  /** Forces a refresh, for example after the dictionary changed. */
  public refresh(): void {
    this.generation++;
    this.lastMessage = undefined;
    void this.update();
  }

  public applyEnabledState(): void {
    if (this.disposed) return;
    const enabled = vscode.workspace
      .getConfiguration("autoGitmoji")
      .get<boolean>("showStatusBar", true);

    this.enabled = enabled;
    this.generation++;

    if (!enabled) {
      this.stopPolling();
      this.item.hide();
      return;
    }

    if (!this.timer) {
      this.timer = setInterval(() => void this.update(), POLL_INTERVAL_MS);
    }

    this.refresh();
  }

  private async update(): Promise<void> {
    if (!this.enabled || this.disposed) return;
    const generation = this.generation;
    const message = await getActiveCommitMessage();
    if (!this.enabled || this.disposed || generation !== this.generation)
      return;

    if (message === undefined) {
      this.lastMessage = undefined;
      this.item.hide();
      return;
    }

    if (message === this.lastMessage) {
      return;
    }
    this.lastMessage = message;

    const mapping = matchGitmoji(
      message,
      this.getMappings(),
      this.getEnableScopeMatching()
    );
    if (!mapping) {
      this.item.hide();
      return;
    }

    const token = formatToken(mapping, this.getOutputFormat());
    this.item.text = `${mapping.gitmoji} Gitmoji`;
    this.item.tooltip = mapping.description
      ? `Auto Gitmoji: apply ${token} (${mapping.description})`
      : `Auto Gitmoji: apply ${token}`;
    this.item.show();
  }

  private stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.generation++;
    this.stopPolling();
    this.item.dispose();
  }
}
