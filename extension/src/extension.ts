import * as vscode from "vscode";
import * as path from "path";
import { execSync } from "child_process";
import { CommitAutoMatch } from "./autoMatch";
import {
  getBuiltInMappings,
  isValidMapping,
  mergeMappingLayers,
} from "./dictionary";
import { registerGitmojiCompletion } from "./completion";
import {
  formatCommitMessage,
  formatDocstringBlock,
  formatToken,
} from "./gitmojiMatcher";
import {
  getActiveCommitMessage,
  setActiveCommitMessage,
} from "./scmIntegration";
import { CommitStatusBar } from "./statusBar";
import { registerSupportCommand, SupportPanel } from "./supportPanel";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
} from "./types";
import {
  loadWorkspaceMappings,
  watchWorkspaceMappingFiles,
} from "./workspaceConfig";

const WELCOME_KEY = "autoGitmoji.welcomeShown";
const LAST_VERSION_KEY = "autoGitmoji.lastSeenVersion";
const LEGACY_FOCUS_LOSS_KEY = "autoFormatCommitOnSave";

let sortedMappings: GitmojiMapping[] = mergeMappingLayers(getBuiltInMappings());
let workspaceMappingSource: string | undefined;

function getMappings(): GitmojiMapping[] {
  return sortedMappings;
}

function getPosition(): GitmojiPosition {
  const configured = vscode.workspace
    .getConfiguration("autoGitmoji")
    .get<string>("position", "prefix");

  return configured === "after-type" ? "after-type" : "prefix";
}

function getOutputFormat(): GitmojiOutputFormat {
  const configured = vscode.workspace
    .getConfiguration("autoGitmoji")
    .get<string>("outputFormat", "emoji");

  return configured === "code" ? "code" : "emoji";
}

function getEnableScopeMatching(): boolean {
  return vscode.workspace
    .getConfiguration("autoGitmoji")
    .get<boolean>("enableScopeMatching", true);
}

function readExplicitBoolean(
  config: vscode.WorkspaceConfiguration,
  key: string
): boolean | undefined {
  const inspected = config.inspect<boolean>(key);
  const explicit =
    inspected?.workspaceFolderValue ??
    inspected?.workspaceValue ??
    inspected?.globalValue;

  return typeof explicit === "boolean" ? explicit : undefined;
}

/**
 * Honours the deprecated `autoFormatCommitOnSave` key so existing users keep
 * their behaviour until they move to `formatOnFocusLoss`.
 */
function shouldFormatOnFocusLoss(): boolean {
  const config = vscode.workspace.getConfiguration("autoGitmoji");

  return (
    readExplicitBoolean(config, "formatOnFocusLoss") ??
    readExplicitBoolean(config, LEGACY_FOCUS_LOSS_KEY) ??
    false
  );
}

function readSettingsMappings(): {
  valid: GitmojiMapping[];
  rejected: number;
} {
  const configured = vscode.workspace
    .getConfiguration("autoGitmoji")
    .get<unknown[]>("customMappings", []);

  const custom = Array.isArray(configured) ? configured : [];
  const valid = custom.filter(isValidMapping);
  return { valid, rejected: custom.length - valid.length };
}

/**
 * Rebuilds the active dictionary: built-in → workspace file → settings.
 * When `onlyCustomMappings` is on, the bundled list is skipped.
 */
async function loadDictionary(options?: {
  quiet?: boolean;
}): Promise<void> {
  const config = vscode.workspace.getConfiguration("autoGitmoji");
  const onlyCustom = config.get<boolean>("onlyCustomMappings", false);
  const { valid: settingsMappings, rejected: settingsRejected } =
    readSettingsMappings();
  const workspace = await loadWorkspaceMappings();

  const builtIn = onlyCustom ? [] : getBuiltInMappings();
  sortedMappings = mergeMappingLayers(
    builtIn,
    workspace.mappings,
    settingsMappings
  );
  workspaceMappingSource = workspace.source;

  if (options?.quiet) {
    return;
  }

  if (settingsRejected > 0) {
    vscode.window.showWarningMessage(
      `Auto Gitmoji: ignored ${settingsRejected} invalid entry in autoGitmoji.customMappings. Each entry needs a non-empty "gitmoji" and at least one "keywords" value.`
    );
  }

  if (workspace.rejected > 0 && workspace.source) {
    vscode.window.showWarningMessage(
      `Auto Gitmoji: ignored ${workspace.rejected} invalid entry in ${workspace.source}.`
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

function registerFormatCommitCommand(
  context: vscode.ExtensionContext,
  statusBar: CommitStatusBar
): void {
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

        const formatted = formatCommitMessage(
          current,
          sortedMappings,
          getPosition(),
          getOutputFormat(),
          getEnableScopeMatching()
        );
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

        statusBar.refresh();
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
      const formatted = formatDocstringBlock(
        original,
        sortedMappings,
        getOutputFormat()
      );

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

function registerInsertPickerCommand(
  context: vscode.ExtensionContext,
  statusBar: CommitStatusBar
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.insertGitmoji", async () => {
      const outputFormat = getOutputFormat();
      const items = sortedMappings.map((m) => {
        const token = formatToken(m, outputFormat);
        const categoryBadge = m.category ? `[${m.category}] ` : "";
        const semverText = m.semver ? ` · ${m.semver}` : "";
        const desc = m.description ? `${m.description}${semverText}` : (m.semver ? m.semver : "");
        return {
          label: `${m.gitmoji} ${m.name ?? m.keywords[0]}`,
          description: `${categoryBadge}${desc}`,
          detail: [m.code, m.category, ...m.keywords].filter(Boolean).join(", "),
          token,
        };
      });

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a Gitmoji to insert",
        matchOnDetail: true,
        matchOnDescription: true,
      });

      if (!picked) {
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit((builder) => {
          builder.insert(editor.selection.active, `${picked.token} `);
        });
        return;
      }

      const current = await getActiveCommitMessage();
      if (current !== undefined) {
        await setActiveCommitMessage(`${picked.token} ${current}`.trim());
        statusBar.refresh();
      }
    })
  );
}

function registerOpenDictionaryCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.openDictionary", async () => {
      const content = JSON.stringify(
        {
          note: "Active mappings: built-in → workspace file (.vscode/auto-gitmoji.json or .gitmoji-map.json) → autoGitmoji.customMappings.",
          workspaceSource: workspaceMappingSource ?? null,
          count: sortedMappings.length,
          mappings: sortedMappings,
        },
        null,
        2
      );

      const document = await vscode.workspace.openTextDocument({
        content,
        language: "json",
      });

      await vscode.window.showTextDocument(document, { preview: true });
    })
  );
}

function registerAutoFormatOnBlur(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.onDidChangeWindowState(async (state) => {
      if (state.focused || !shouldFormatOnFocusLoss()) {
        return;
      }

      const current = await getActiveCommitMessage();
      if (!current?.trim()) {
        return;
      }

      const formatted = formatCommitMessage(
        current,
        sortedMappings,
        getPosition(),
        getOutputFormat(),
        getEnableScopeMatching()
      );
      if (formatted !== current) {
        await setActiveCommitMessage(formatted);
      }
    })
  );
}

function registerInstallGitHookCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("autoGitmoji.installGitHook", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(git-merge) Install Hook in Current Repository",
            description: "Auto-formats commit messages in VS Code, JetBrains, Visual Studio, Neovim, etc.",
            target: "repo",
          },
          {
            label: "$(globe) Install Hook Globally (All Git Repositories)",
            description: "Applies across every Git repository on this computer",
            target: "global",
          },
        ],
        { placeHolder: "Select Git hook installation scope for all IDEs" }
      );

      if (!choice) {
        return;
      }

      const isGlobal = choice.target === "global";
      const folders = vscode.workspace.workspaceFolders;
      const cwd = (!isGlobal && folders && folders.length > 0)
        ? folders[0].uri.fsPath
        : undefined;

      try {
        const cliPath = path.resolve(context.extensionPath, "..", "cli", "bin", "auto-gitmoji.js");
        const cmd = isGlobal ? `node "${cliPath}" hook install --global` : `node "${cliPath}" hook install`;
        execSync(cmd, { cwd });
        vscode.window.showInformationMessage(
          `Auto Gitmoji: Git hook installed successfully! ${isGlobal ? "(Global)" : "(Repository)"}`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Auto Gitmoji: Failed to install hook: ${msg}`);
      }
    })
  );
}

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = new CommitStatusBar(
    getMappings,
    getOutputFormat,
    getEnableScopeMatching
  );
  const autoMatch = new CommitAutoMatch(
    getMappings,
    getPosition,
    getOutputFormat,
    getEnableScopeMatching
  );
  context.subscriptions.push(statusBar, autoMatch);

  const reloadDictionary = async (quiet = false): Promise<void> => {
    await loadDictionary({ quiet });
    statusBar.refresh();
  };

  void reloadDictionary().then(() => {
    statusBar.start();
    autoMatch.start();
  });

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("autoGitmoji.customMappings") ||
        event.affectsConfiguration("autoGitmoji.onlyCustomMappings")
      ) {
        void reloadDictionary();
      }

      if (event.affectsConfiguration("autoGitmoji.showStatusBar")) {
        statusBar.applyEnabledState();
      }

      if (event.affectsConfiguration("autoGitmoji.autoMatch")) {
        autoMatch.applyEnabledState();
      }

      if (
        event.affectsConfiguration("autoGitmoji.outputFormat") ||
        event.affectsConfiguration("autoGitmoji.position")
      ) {
        statusBar.refresh();
      }
    })
  );

  context.subscriptions.push(
    watchWorkspaceMappingFiles(() => {
      void reloadDictionary(true);
    })
  );

  registerSupportCommand(context);
  registerFormatCommitCommand(context, statusBar);
  registerFormatDocstringCommand(context);
  registerInsertPickerCommand(context, statusBar);
  registerOpenDictionaryCommand(context);
  registerAutoFormatOnBlur(context);
  registerInstallGitHookCommand(context);
  registerGitmojiCompletion(context, getMappings, getOutputFormat);

  void showWelcomeIfNeeded(context);
  void showMajorUpdateReminderIfNeeded(context);
}

export function deactivate(): void {}
