import * as vscode from "vscode";
import { getGitApi } from "./scmIntegration";
import {
  applyCommitMessage,
  type CommitMessageTarget,
} from "./repositorySelection";
import {
  buildCommitMessage,
  COMMIT_TYPES,
  hasBreakingFooter,
  parseCommitDraft,
  validateCommitScope,
  validateCommitSummary,
  validateIssueReferences,
} from "./commitMessageBuilder";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
} from "./types";

const BACK = Symbol("back");
type Answer<T> = T | typeof BACK | undefined;
const TOTAL_STEPS = 6;

function inputStep(
  step: number,
  title: string,
  value: string,
  prompt: string,
  validate?: (value: string) => string | undefined,
  remember?: (value: string) => void
): Promise<Answer<string>> {
  return new Promise((resolve) => {
    const input = vscode.window.createInputBox();
    input.title = title;
    input.step = step;
    input.totalSteps = TOTAL_STEPS;
    input.value = value;
    input.prompt = prompt;
    input.ignoreFocusOut = true;
    input.buttons = [vscode.QuickInputButtons.Back];
    let finished = false;
    const subscriptions: vscode.Disposable[] = [];
    const finish = (answer: Answer<string>): void => {
      if (finished) return;
      finished = true;
      input.hide();
      subscriptions.forEach((subscription) => subscription.dispose());
      input.dispose();
      resolve(answer);
    };
    subscriptions.push(
      input.onDidAccept(() => {
        const error = validate?.(input.value);
        input.validationMessage = error;
        if (!error) finish(input.value);
      }),
      input.onDidChangeValue((next) => {
        input.validationMessage = validate?.(next);
      }),
      input.onDidTriggerButton(() => {
        remember?.(input.value);
        finish(BACK);
      }),
      input.onDidHide(() => finish(undefined))
    );
    input.show();
  });
}

interface Choice<T> extends vscode.QuickPickItem {
  value: T;
}

function pickStep<T>(
  step: number,
  title: string,
  placeholder: string,
  choices: Choice<T>[],
  activeValue?: T
): Promise<Answer<T>> {
  return new Promise((resolve) => {
    const picker = vscode.window.createQuickPick<Choice<T>>();
    picker.title = title;
    picker.step = step;
    picker.totalSteps = TOTAL_STEPS;
    picker.placeholder = placeholder;
    picker.ignoreFocusOut = true;
    picker.matchOnDescription = true;
    picker.items = choices;
    picker.activeItems = choices.filter(
      (choice) => choice.value === activeValue
    );
    if (step > 1) picker.buttons = [vscode.QuickInputButtons.Back];
    let finished = false;
    const subscriptions: vscode.Disposable[] = [];
    const finish = (answer: Answer<T>): void => {
      if (finished) return;
      finished = true;
      picker.hide();
      subscriptions.forEach((subscription) => subscription.dispose());
      picker.dispose();
      resolve(answer);
    };
    subscriptions.push(
      picker.onDidAccept(() => {
        const selection = picker.selectedItems[0];
        if (selection) finish(selection.value);
      }),
      picker.onDidTriggerButton(() => finish(BACK)),
      picker.onDidHide(() => finish(undefined))
    );
    picker.show();
  });
}

async function chooseTarget(
  sourceControl?: vscode.SourceControl
): Promise<CommitMessageTarget | undefined> {
  const api = await getGitApi();
  // Capture every draft before the repository picker can yield to another edit.
  const targets = (api?.repositories ?? []).map((repository) => ({
    repository,
    original: repository.inputBox.value,
  }));
  if (sourceControl?.rootUri) {
    const target = targets.find(
      ({ repository }) =>
        repository.rootUri.toString() === sourceControl.rootUri?.toString()
    );
    if (!target) {
      void vscode.window.showWarningMessage(
        "Auto Gitmoji: this repository is no longer available."
      );
    }
    return target;
  }
  if (targets.length === 1) return targets[0];
  if (targets.length === 0) {
    void vscode.window.showInformationMessage(
      "Auto Gitmoji: open a Git repository to compose a commit message."
    );
    return undefined;
  }
  const picked = await vscode.window.showQuickPick(
    targets.map((target) => ({
      label:
        target.repository.rootUri.path.split("/").filter(Boolean).pop() ??
        target.repository.rootUri.toString(),
      description: target.repository.rootUri.fsPath,
      detail: target.original.split(/\r?\n/, 1)[0] || "Empty commit draft",
      target,
    })),
    {
      title: "Compose Commit · Repository",
      placeHolder: "Choose the repository whose commit draft you want to edit",
      ignoreFocusOut: true,
    }
  );
  return picked?.target;
}

async function composeCommit(
  sourceControl: vscode.SourceControl | undefined,
  getMappings: () => GitmojiMapping[],
  getPosition: () => GitmojiPosition,
  getOutputFormat: () => GitmojiOutputFormat,
  onApplied: () => void,
  getEnableScopeMatching: () => boolean
): Promise<void> {
  const target = await chooseTarget(sourceControl);
  if (!target) return;
  const mappings = getMappings();
  const position = getPosition();
  const outputFormat = getOutputFormat();
  const enableScopeMatching = getEnableScopeMatching();
  const fields = parseCommitDraft(target.original, mappings);
  const existingBreakingFooter = hasBreakingFooter(target.original);
  const repositoryName =
    target.repository.rootUri.path.split("/").filter(Boolean).pop() ?? "Commit";
  const title = `Compose Commit · ${repositoryName}`;
  let step = 1;
  while (step <= TOTAL_STEPS) {
    let answer: Answer<string | boolean>;
    if (step === 1) {
      const choices: Choice<string>[] = COMMIT_TYPES.map((choice) => ({
        label: choice.type,
        description: choice.description,
        value: choice.type,
      }));
      if (!choices.some((choice) => choice.value === fields.type)) {
        choices.unshift({
          label: fields.type,
          description: "Existing custom type",
          value: fields.type,
        });
      }
      answer = await pickStep(
        step,
        title,
        "What kind of change is this?",
        choices,
        fields.type
      );
      if (typeof answer === "string") fields.type = answer;
    } else if (step === 2) {
      answer = await inputStep(
        step,
        title,
        fields.scope,
        "Scope (optional), for example api, editor, or deps",
        validateCommitScope,
        (value) => {
          fields.scope = value;
        }
      );
      if (typeof answer === "string") fields.scope = answer;
    } else if (step === 3) {
      answer = await inputStep(
        step,
        title,
        fields.summary,
        "Describe the change; aim for a concise summary under 72 characters",
        validateCommitSummary,
        (value) => {
          fields.summary = value;
        }
      );
      if (typeof answer === "string") fields.summary = answer;
    } else if (step === 4) {
      const choices: Choice<boolean>[] = [
        {
          label: "Regular change",
          description: "Compatible with existing behavior",
          value: false,
        },
        {
          label: "Breaking change",
          description: "Adds ! to the subject; document migration details next",
          value: true,
        },
      ];
      answer = await pickStep(
        step,
        title,
        existingBreakingFooter
          ? "The existing BREAKING CHANGE footer will be preserved"
          : "Does this change require users to migrate?",
        existingBreakingFooter ? choices.slice(1) : choices,
        fields.breaking
      );
      if (typeof answer === "boolean") fields.breaking = answer;
    } else if (step === 5 && fields.breaking) {
      answer = await inputStep(
        step,
        title,
        fields.breakingDescription,
        existingBreakingFooter
          ? "Additional breaking change note (optional); the original footer is retained"
          : "Breaking change note (optional), for example rename config key oldName to newName",
        (value) =>
          /[\r\n]/.test(value)
            ? "Keep the breaking change note on a single line."
            : undefined,
        (value) => {
          fields.breakingDescription = value;
        }
      );
      if (typeof answer === "string") fields.breakingDescription = answer;
    } else if (step === 5) {
      step++;
      continue;
    } else {
      answer = await inputStep(
        step,
        title,
        fields.issueReferences,
        "Issue references (optional), for example #123 or owner/repo#456; existing trailers are retained",
        validateIssueReferences,
        (value) => {
          fields.issueReferences = value;
        }
      );
      if (typeof answer === "string") fields.issueReferences = answer;
    }
    if (answer === undefined) return;
    if (answer === BACK) {
      step -= step === 6 && !fields.breaking ? 2 : 1;
      continue;
    }
    step++;
    if (step > TOTAL_STEPS) {
      const message = buildCommitMessage(
        target.original,
        fields,
        mappings,
        position,
        outputFormat,
        enableScopeMatching
      );
      const choice = await vscode.window.showInformationMessage(
        `Apply commit message to ${repositoryName}?`,
        {
          modal: true,
          detail: `${message}\n\nThis updates the Source Control draft. Review and commit it when ready.`,
        },
        "Apply to Source Control",
        "Edit details"
      );
      if (choice === "Edit details") {
        step = 1;
        continue;
      }
      if (choice !== "Apply to Source Control") return;
      if (!applyCommitMessage(target, message)) {
        void vscode.window.showWarningMessage(
          "Auto Gitmoji: the commit draft changed while the composer was open. Your newer draft was kept; run Compose Commit again."
        );
        return;
      }
      onApplied();
    }
  }
}

export function registerCommitComposer(
  context: vscode.ExtensionContext,
  getMappings: () => GitmojiMapping[],
  getPosition: () => GitmojiPosition,
  getOutputFormat: () => GitmojiOutputFormat,
  onApplied: () => void,
  getEnableScopeMatching: () => boolean = () => true
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "autoGitmoji.composeCommit",
      (sourceControl?: vscode.SourceControl) =>
        composeCommit(
          sourceControl,
          getMappings,
          getPosition,
          getOutputFormat,
          onApplied,
          getEnableScopeMatching
        )
    )
  );
}
