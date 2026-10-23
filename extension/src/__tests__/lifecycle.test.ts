import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  enabled: true,
  item: { show: vi.fn(), hide: vi.fn(), dispose: vi.fn() },
  target: vi.fn(),
  message: vi.fn(),
}));
vi.mock("vscode", () => ({
  workspace: { getConfiguration: () => ({ get: () => mock.enabled }) },
  window: { createStatusBarItem: () => mock.item },
  StatusBarAlignment: { Left: 1 },
}));
vi.mock("../scmIntegration", () => ({
  getCommitMessageTarget: mock.target,
  getActiveCommitMessage: mock.message,
}));
import { CommitAutoMatch } from "../autoMatch";
import { CommitStatusBar } from "../statusBar";
import type { CommitMessageTarget } from "../repositorySelection";
const mappings = [{ keywords: ["fix"], gitmoji: "🐛" }];
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mock.enabled = true;
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("background lifecycle", () => {
  it.each(["disable", "dispose"])(
    "does not write after %s during a pending lookup",
    async (action) => {
      let resolve!: (target: CommitMessageTarget) => void;
      mock.target.mockReturnValue(
        new Promise<CommitMessageTarget>((done) => {
          resolve = done;
        })
      );
      const auto = new CommitAutoMatch(
        () => mappings,
        () => "prefix",
        () => "emoji"
      );
      auto.start();
      if (action === "dispose") auto.dispose();
      else {
        mock.enabled = false;
        auto.applyEnabledState();
      }
      const inputBox = { value: "fix: draft" };
      resolve({
        repository: { inputBox } as CommitMessageTarget["repository"],
        original: inputBox.value,
      });
      await vi.advanceTimersByTimeAsync(3000);
      expect(inputBox.value).toBe("fix: draft");
      expect(mock.target).toHaveBeenCalledTimes(1);
      auto.dispose();
    }
  );
  it.each(["disable", "dispose"])(
    "does not show a pending status hint after %s",
    async (action) => {
      let resolve!: (message: string) => void;
      mock.message.mockReturnValue(
        new Promise<string>((done) => {
          resolve = done;
        })
      );
      const status = new CommitStatusBar(() => mappings);
      status.start();
      if (action === "dispose") status.dispose();
      else {
        mock.enabled = false;
        status.applyEnabledState();
      }
      status.refresh();
      resolve("fix: draft");
      await vi.advanceTimersByTimeAsync(3000);
      expect(mock.item.show).not.toHaveBeenCalled();
      expect(mock.message).toHaveBeenCalledTimes(1);
      status.dispose();
    }
  );
});
