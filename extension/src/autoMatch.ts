import * as vscode from "vscode";
import { autoFormatCommitMessage } from "./gitmojiMatcher";
import { getCommitMessageTarget } from "./scmIntegration";
import { applyCommitMessage } from "./repositorySelection";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
  GitRepository,
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
  private lastRepository: GitRepository | undefined;
  private generation = 0;
  private disposed = false;

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
    if (this.disposed) return;
    this.generation++;
    const enabled = vscode.workspace
      .getConfiguration("autoGitmoji")
      .get<boolean>("autoMatch", false);

    if (!enabled) {
      this.stopPolling();
      this.lastSeen = undefined;
      this.lastRepository = undefined;
      return;
    }

    if (!this.timer) {
      this.timer = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    }

    void this.tick();
  }

  private async tick(): Promise<void> {
    if (this.applying || this.disposed || !this.timer) {
      return;
    }

    this.applying = true;
    const generation = this.generation;
    try {
      const target = await getCommitMessageTarget();
      if (generation !== this.generation || this.disposed) return;
      if (!target) {
        this.lastSeen = undefined;
        this.lastRepository = undefined;
        return;
      }

      const current = target.original;
      if (
        current === this.lastSeen &&
        target.repository === this.lastRepository
      ) {
        return;
      }
      this.lastSeen = current;
      this.lastRepository = target.repository;

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

      if (applyCommitMessage(target, formatted)) {
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
    this.disposed = true;
    this.generation++;
    this.stopPolling();
  }
}
