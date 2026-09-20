import * as vscode from "vscode";
import { autoFormatCommitMessage } from "./gitmojiMatcher";
import {
  getActiveCommitMessage,
  setActiveCommitMessage,
} from "./scmIntegration";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
} from "./types";

const POLL_INTERVAL_MS = 900;

/**
 * Optionally rewrites the SCM commit box while the user types, when the message
 * already has a conventional type (`fix: …`). Off by default so it does not
 * fight half-written first words.
 */
export class CommitAutoMatch implements vscode.Disposable {
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastSeen: string | undefined;
  private applying = false;

  constructor(
    private readonly getMappings: () => GitmojiMapping[],
    private readonly getPosition: () => GitmojiPosition,
    private readonly getOutputFormat: () => GitmojiOutputFormat,
    private readonly getEnableScopeMatching: () => boolean = () => true
  ) {}

  public start(): void {
    this.applyEnabledState();
  }

  public applyEnabledState(): void {
    const enabled = vscode.workspace
      .getConfiguration("autoGitmoji")
      .get<boolean>("autoMatch", false);

    if (!enabled) {
      this.stopPolling();
      this.lastSeen = undefined;
      return;
    }

    if (!this.timer) {
      this.timer = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    }

    void this.tick();
  }

  private async tick(): Promise<void> {
    if (this.applying) {
      return;
    }

    const current = await getActiveCommitMessage();
    if (current === undefined) {
      this.lastSeen = undefined;
      return;
    }

    if (current === this.lastSeen) {
      return;
    }
    this.lastSeen = current;

    const formatted = autoFormatCommitMessage(
      current,
      this.getMappings(),
      this.getPosition(),
      this.getOutputFormat(),
      this.getEnableScopeMatching()
    );

    if (formatted === current) {
      return;
    }

    this.applying = true;
    try {
      if (await setActiveCommitMessage(formatted)) {
        this.lastSeen = formatted;
      }
    } finally {
      this.applying = false;
    }
  }

  private stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  public dispose(): void {
    this.stopPolling();
  }
}
