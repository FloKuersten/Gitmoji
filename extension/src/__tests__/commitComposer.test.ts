import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import type { GitRepository } from "../types";

interface StepPlan {
  value?: string | boolean;
  action?: "back" | "cancel";
  before?: () => void;
}

const mock = vi.hoisted(() => {
  const state = {
    plans: [] as StepPlan[],
    register: vi.fn(),
    git: vi.fn(),
    repositoryPicker: vi.fn(),
    information: vi.fn(),
    warning: vi.fn(),
    disposed: vi.fn(),
  };
  const createInput = (kind: "input" | "pick") => {
    const listeners = new Map<string, (value?: string) => void>();
    const event = (name: string) => (listener: (value?: string) => void) => {
      listeners.set(name, listener);
      return { dispose: vi.fn() };
    };
    const input = {
      value: "",
      items: [] as { value: string | boolean }[],
      selectedItems: [] as { value: string | boolean }[],
      onDidAccept: event("accept"),
      onDidChangeValue: event("change"),
      onDidTriggerButton: event("back"),
      onDidHide: event("hide"),
      hide: () => listeners.get("hide")?.(),
      dispose: state.disposed,
      show: () => {
        queueMicrotask(() => {
          const plan = state.plans.shift();
          if (!plan) throw new Error("No scripted composer step remains");
          plan.before?.();
          if (kind === "input" && plan.value !== undefined) {
            input.value = String(plan.value);
          }
          if (plan.action === "cancel") listeners.get("hide")?.();
          else if (plan.action === "back") listeners.get("back")?.();
          else {
            if (kind === "pick") {
              input.selectedItems = input.items.filter(
                (item) => item.value === plan.value
              );
            }
            listeners.get("accept")?.();
          }
        });
      },
    };
    return input;
  };
  return { ...state, createInput };
});

vi.mock("vscode", () => ({
  commands: { registerCommand: mock.register },
  QuickInputButtons: { Back: {} },
  window: {
    createInputBox: () => mock.createInput("input"),
    createQuickPick: () => mock.createInput("pick"),
    showQuickPick: mock.repositoryPicker,
    showInformationMessage: mock.information,
    showWarningMessage: mock.warning,
  },
}));
vi.mock("../scmIntegration", () => ({ getGitApi: mock.git }));
import { registerCommitComposer } from "../commitComposer";

function repository(name: string, draft = ""): GitRepository {
  return {
    rootUri: {
      path: `/workspace/${name}`,
      fsPath: `/workspace/${name}`,
      toString: () => `file:///workspace/${name}`,
    } as vscode.Uri,
    inputBox: { value: draft },
  };
}

function setup(repositories: GitRepository[]): {
  run: (context?: vscode.SourceControl) => Promise<void>;
  onApplied: ReturnType<typeof vi.fn>;
} {
  mock.git.mockResolvedValue({ repositories });
  const onApplied = vi.fn();
  registerCommitComposer(
    { subscriptions: [] } as unknown as vscode.ExtensionContext,
    () => [{ keywords: ["feat"], gitmoji: "✨" }],
    () => "prefix",
    () => "emoji",
    onApplied
  );
  const run = mock.register.mock.calls[0][1] as (
    context?: vscode.SourceControl
  ) => Promise<void>;
  return { run, onApplied };
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.plans.length = 0;
  mock.plans.push(
    { value: "feat" },
    { value: "editor" },
    { value: "compose a message" },
    { value: false },
    { value: "#123" }
  );
  mock.information.mockResolvedValue("Apply to Source Control");
});

describe("native commit composer", () => {
  it("targets the explicit SCM repository and applies only after preview confirmation", async () => {
    const first = repository("one", "keep first");
    const second = repository("two", "old\n\nKeep my body.");
    const { run, onApplied } = setup([first, second]);
    mock.information.mockImplementation(async () => {
      expect(second.inputBox.value).toBe("old\n\nKeep my body.");
      return "Apply to Source Control";
    });
    await run({ rootUri: second.rootUri } as vscode.SourceControl);
    expect(mock.repositoryPicker).not.toHaveBeenCalled();
    expect(first.inputBox.value).toBe("keep first");
    expect(second.inputBox.value).toBe(
      "✨ feat(editor): compose a message\n\nKeep my body.\n\nRefs: #123"
    );
    expect(onApplied).toHaveBeenCalledOnce();
    expect(mock.disposed).toHaveBeenCalledTimes(5);
  });

  it("captures drafts before the repository chooser opens and keeps a newer draft", async () => {
    const first = repository("one", "original");
    const second = repository("two", "other");
    const { run, onApplied } = setup([first, second]);
    mock.repositoryPicker.mockImplementation(async (choices) => {
      first.inputBox.value = "a newer draft";
      return choices[0];
    });
    await run();
    expect(first.inputBox.value).toBe("a newer draft");
    expect(second.inputBox.value).toBe("other");
    expect(onApplied).not.toHaveBeenCalled();
    expect(mock.warning).toHaveBeenCalledWith(
      expect.stringContaining("newer draft was kept")
    );
  });

  it("cancels at an intermediate step without touching the draft", async () => {
    const repo = repository("one", "original");
    mock.plans.splice(2, 1, { action: "cancel" });
    const { run, onApplied } = setup([repo]);
    await run();
    expect(repo.inputBox.value).toBe("original");
    expect(onApplied).not.toHaveBeenCalled();
    expect(mock.information).not.toHaveBeenCalled();
  });

  it("cancels the final preview without touching the draft", async () => {
    const repo = repository("one", "original");
    mock.information.mockResolvedValue(undefined);
    const { run, onApplied } = setup([repo]);
    await run();
    expect(repo.inputBox.value).toBe("original");
    expect(onApplied).not.toHaveBeenCalled();
  });

  it("keeps an edit made while the final preview is visible", async () => {
    const repo = repository("one", "original");
    mock.information.mockImplementation(async () => {
      repo.inputBox.value = "edit made while reviewing";
      return "Apply to Source Control";
    });
    const { run, onApplied } = setup([repo]);
    await run();
    expect(repo.inputBox.value).toBe("edit made while reviewing");
    expect(onApplied).not.toHaveBeenCalled();
    expect(mock.warning).toHaveBeenCalledOnce();
  });

  it("does not fall back to a different repository for stale SCM context", async () => {
    const repo = repository("one", "original");
    const { run, onApplied } = setup([repo]);
    await run({
      rootUri: repository("closed").rootUri,
    } as vscode.SourceControl);
    expect(repo.inputBox.value).toBe("original");
    expect(mock.plans).toHaveLength(5);
    expect(mock.repositoryPicker).not.toHaveBeenCalled();
    expect(onApplied).not.toHaveBeenCalled();
    expect(mock.warning).toHaveBeenCalledWith(
      expect.stringContaining("no longer available")
    );
  });

  it("supports Back from issue references across the skipped breaking-detail step", async () => {
    const repo = repository("one");
    mock.plans.splice(
      4,
      1,
      { action: "back" },
      { value: true },
      { value: "Rename the old API." },
      { value: "" }
    );
    const { run } = setup([repo]);
    await run();
    expect(repo.inputBox.value).toBe(
      "✨ feat(editor)!: compose a message\n\nBREAKING CHANGE: Rename the old API."
    );
  });

  it("retains a typed summary when going Back to scope and forward again", async () => {
    const repo = repository("one", "feat: old summary");
    mock.plans.splice(
      2,
      1,
      { value: "keep my newly typed summary", action: "back" },
      { value: "api" },
      {}
    );
    const { run } = setup([repo]);
    await run();
    expect(repo.inputBox.value).toBe(
      "✨ feat(api): keep my newly typed summary\n\nRefs: #123"
    );
  });
});
