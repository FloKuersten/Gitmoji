import * as vscode from "vscode";
import {
  getBuiltInMappings,
  isValidMapping,
  mergeMappings,
} from "./dictionary";
import { formatCommitMessage, formatDocstringBlock } from "./gitmojiMatcher";
import {
  getActiveCommitMessage,
  setActiveCommitMessage,
} from "./scmIntegration";
import { registerSupportCommand, SupportPanel } from "./supportPanel";
import type { GitmojiMapping } from "./types";

const WELCOME_KEY = "autoGitmoji.welcomeShown";
const LAST_VERSION_KEY = "autoGitmoji.lastSeenVersion";

let sortedMappings: GitmojiMapping[] = mergeMappings(getBuiltInMappings(), []);

/**
 * Rebuilds the active dictionary from the bundled data plus any user-defined
 * mappings. Invalid user entries are reported once and skipped so a typo in
 * settings cannot disable the extension.
 */
function loadDictionary(): void {
  const configured = vscode.workspace
    .getConfiguration("autoGitmoji")
    .get<unknown[]>("customMappings", []);

  const custom = Array.isArray(configured) ? configured : [];
  const valid = custom.filter(isValidMapping);
  sortedMappings = mergeMappings(getBuiltInMappings(), valid);

  const rejected = custom.length - valid.length;
  if (rejected > 0) {
    vscode.window.showWarningMessage(
      `Auto Gitmoji: ignored ${rejected} invalid entry in autoGitmoji.customMappings. Each entry needs a non-empty "gitmoji" and at least one "keywords" value.`
    );
  }
}

async function showWelcomeIfNeeded(
  context: vscode.ExtensionContext
): Promise<void> {
  const alreadyShown = context.globalState.get<boolean>(WELCOME_KEY, false);
  if (alreadyShown) {
    return;
  }

  await context.globalState.update(WELCOME_KEY, true);

  const support = "Support";
  const choice = await vscode.window.showInformationMessage(
    "Thanks for installing Auto Gitmoji & Docs from KueTech Digital! ❤️ If this saves you time, consider buying me a coffee.",
    support
  );

  if (choice === support) {
    SupportPanel.createOrShow(context.extensionUri, context);
  }
}

async function showMajorUpdateReminderIfNeeded(
  context: vscode.ExtensionContext
): Promise<void> {
  const config = vscode.workspace.getConfiguration("autoGitmoji");
  if (!config.get<boolean>("notifyOnMajorUpdates", true)) {
    return;
  }

  const current = context.extension.packageJSON.version as string;
  const lastSeen = context.globalState.get<string>(LAST_VERSION_KEY);

  if (!lastSeen) {
    await context.globalState.update(LAST_VERSION_KEY, current);
    return;
  }

  if (lastSeen === current) {
    return;
  }

  const [lastMajor] = lastSeen.split(".").map(Number);
  const [currentMajor] = current.split(".").map(Number);

  await context.globalState.update(LAST_VERSION_KEY, current);

  if (currentMajor <= lastMajor) {
    return;
  }

  const support = "Support";
  const choice = await vscode.window.showInformationMessage(
    "Auto Gitmoji & Docs was updated! KueTech Digital — thanks to supporters, this stays free.",
    support
  );

  if (choice === support) {
    SupportPanel.createOrShow(context.extensionUri, context);
  }
}

function registerFormatCommitCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "autoGitmoji.formatCommitMessage",
      async () => {
        const current = await getActiveCommitMessage();
        if (current === undefined) {
          vscode.window.showWarningMessage(
            "Open the Source Control view and ensure the Git extension is enabled."
          );
          return;
        }

        const formatted = formatCommitMessage(current, sortedMappings);
        if (formatted === current) {
          vscode.window.showInformationMessage(
            "No matching keyword found, or a Gitmoji is already present."
          );
          return;
        }

        if (!(await setActiveCommitMessage(formatted))) {
          vscode.window.showErrorMessage(
            "Could not update the commit message."
          );
          return;
        }
      }
    )
  );
}

function registerFormatDocstringCommand(
  context: vscode.ExtensionContext
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.formatDocstring", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Open a file to format a docstring.");
        return;
      }

      const document = editor.document;
      const selection = editor.selection;

      let range: vscode.Range;
      if (selection.isEmpty) {
        range = document.lineAt(selection.active.line).range;
      } else {
        range = new vscode.Range(
          selection.start.line,
          0,
          selection.end.line,
          document.lineAt(selection.end.line).text.length
        );
      }

      const original = document.getText(range);
      const formatted = formatDocstringBlock(original, sortedMappings);

      if (formatted === original) {
        vscode.window.showInformationMessage(
          "No keyword match for a Gitmoji on the summary line."
        );
        return;
      }

      await editor.edit((builder) => {
        builder.replace(range, formatted);
      });
    })
  );
}

function registerInsertPickerCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.insertGitmoji", async () => {
      const items = sortedMappings.map((m) => ({
        label: `${m.gitmoji} ${m.keywords[0]}`,
        description: m.description,
        detail: m.keywords.join(", "),
        gitmoji: m.gitmoji,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a Gitmoji to insert",
        matchOnDetail: true,
      });

      if (!picked) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit((builder) => {
          builder.insert(editor.selection.active, `${picked.gitmoji} `);
        });
        return;
      }

      const current = await getActiveCommitMessage();
      if (current !== undefined) {
        await setActiveCommitMessage(`${picked.gitmoji} ${current}`.trim());
      }
    })
  );
}

function registerAutoFormatOnBlur(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.onDidChangeWindowState(async (state) => {
      if (state.focused) {
        return;
      }

      const config = vscode.workspace.getConfiguration("autoGitmoji");
      if (!config.get<boolean>("autoFormatCommitOnSave", false)) {
        return;
      }

      const current = await getActiveCommitMessage();
      if (!current?.trim()) {
        return;
      }

      const formatted = formatCommitMessage(current, sortedMappings);
      if (formatted !== current) {
        await setActiveCommitMessage(formatted);
      }
    })
  );
}

export function activate(context: vscode.ExtensionContext): void {
  loadDictionary();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("autoGitmoji.customMappings")) {
        loadDictionary();
      }
    })
  );

  registerSupportCommand(context);
  registerFormatCommitCommand(context);
  registerFormatDocstringCommand(context);
  registerInsertPickerCommand(context);
  registerAutoFormatOnBlur(context);

  void showWelcomeIfNeeded(context);
  void showMajorUpdateReminderIfNeeded(context);
}

export function deactivate(): void {}
