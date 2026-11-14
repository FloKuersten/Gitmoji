// Run in an isolated VS Code Extension Development Host with two Git workspace
// folders under extension/.cache, using this file as --extensionTestsPath.
// No external test dependencies or access to the user's ordinary workspace.
/* eslint-disable @typescript-eslint/no-require-imports -- VS Code loads extension tests as CommonJS. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const vscode = require("vscode");

const cacheRoot = path.resolve(__dirname, "../.cache");
const reportPath = path.resolve(
  process.env.GITMOJI_SMOKE_RESULT ||
    path.join(cacheRoot, "integration-result.json")
);

function assertFixturePath(candidate) {
  const relative = path.relative(cacheRoot, path.resolve(candidate));
  assert(
    relative &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `Integration fixtures must be inside ${cacheRoot}: ${candidate}`
  );
}

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withTimeout(promise, label, milliseconds = 10000) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${milliseconds}ms`)),
          milliseconds
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function waitForRepositories(api, folders) {
  const deadline = Date.now() + 30000;
  do {
    const repositories = folders.map((folder) =>
      api.repositories.find(
        (repository) => repository.rootUri.toString() === folder.uri.toString()
      )
    );
    if (repositories.every(Boolean)) return repositories;
    await delay(100);
  } while (Date.now() < deadline);
  throw new Error(
    "The built-in Git extension did not open both fixture repositories."
  );
}

async function run() {
  assertFixturePath(reportPath);
  const startedAt = new Date().toISOString();
  const checks = [];
  const report = { status: "running", startedAt, checks };
  const saveReport = () => {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  };
  const check = async (name, action) => {
    await action();
    checks.push(name);
    saveReport();
  };
  saveReport();

  try {
    const folders = vscode.workspace.workspaceFolders;
    assert.equal(folders?.length, 2, "Open exactly two isolated Git fixtures.");
    for (const folder of folders) {
      assert.equal(folder.uri.scheme, "file");
      assertFixturePath(folder.uri.fsPath);
      assert(fs.existsSync(path.join(folder.uri.fsPath, ".git")));
    }
    assert(
      vscode.workspace.workspaceFile,
      "Use an isolated .code-workspace file."
    );
    assertFixturePath(vscode.workspace.workspaceFile.fsPath);

    const config = vscode.workspace.getConfiguration("autoGitmoji");
    for (const [key, value] of Object.entries({
      autoMatch: false,
      showStatusBar: false,
      formatOnFocusLoss: false,
      notifyOnMajorUpdates: false,
      position: "prefix",
      outputFormat: "emoji",
      onlyCustomMappings: false,
      customMappings: [],
    })) {
      await config.update(key, value, vscode.ConfigurationTarget.Workspace);
    }

    const extension = vscode.extensions.getExtension(
      "kuetech.auto-gitmoji-docs"
    );
    await check("extension activates in a real VS Code host", async () => {
      assert(extension, "Extension development build was not discovered.");
      await withTimeout(extension.activate(), "Extension activation");
      assert.equal(extension.isActive, true);
      report.extensionVersion = extension.packageJSON.version;
      report.vscodeVersion = vscode.version;
    });

    await check("new and existing commands are registered", async () => {
      const commands = await vscode.commands.getCommands(true);
      for (const command of [
        "autoGitmoji.composeCommit",
        "autoGitmoji.openProjectMappings",
        "autoGitmoji.clearRecent",
        "autoGitmoji.insertCommitGitmoji",
        "autoGitmoji.formatCommitMessage",
        "autoGitmoji.formatDocstring",
      ]) {
        assert(commands.includes(command), `Missing command ${command}`);
      }
    });

    const git = vscode.extensions.getExtension("vscode.git");
    assert(git, "The built-in Git extension is required.");
    const gitExports = await withTimeout(git.activate(), "Git activation");
    const api = gitExports.getAPI(1);
    const [first, second] = await waitForRepositories(api, folders);
    const firstDraft = "fix: repair parser\n\nKeep this body.  \n\nRefs: #42\n";
    const secondDraft = "docs: explain setup\n\nSecond repository body.\n";
    first.inputBox.value = firstDraft;
    second.inputBox.value = secondDraft;

    await check(
      "explicit repository formatting preserves other drafts and the body",
      async () => {
        await vscode.commands.executeCommand(
          "autoGitmoji.formatCommitMessage",
          {
            rootUri: first.rootUri,
          }
        );
        assert.equal(first.inputBox.value, `🐛 ${firstDraft}`);
        assert.equal(second.inputBox.value, secondDraft);
      }
    );

    await check(
      "after-type shortcode formatting is idempotent in the Git input",
      async () => {
        await config.update(
          "position",
          "after-type",
          vscode.ConfigurationTarget.Workspace
        );
        await config.update(
          "outputFormat",
          "code",
          vscode.ConfigurationTarget.Workspace
        );
        await vscode.commands.executeCommand(
          "autoGitmoji.formatCommitMessage",
          {
            rootUri: second.rootUri,
          }
        );
        const expected = secondDraft.replace("docs: ", "docs: :memo: ");
        assert.equal(second.inputBox.value, expected);
        await vscode.commands.executeCommand(
          "autoGitmoji.formatCommitMessage",
          {
            rootUri: second.rootUri,
          }
        );
        assert.equal(second.inputBox.value, expected);
        assert.equal(first.inputBox.value, `🐛 ${firstDraft}`);
      }
    );

    for (const command of [
      "autoGitmoji.composeCommit",
      "autoGitmoji.insertCommitGitmoji",
    ]) {
      await check(
        `${command} cancels without changing either repository`,
        async () => {
          const before = api.repositories.map(
            (repository) => repository.inputBox.value
          );
          const pending = vscode.commands.executeCommand(command, {
            rootUri: first.rootUri,
          });
          await delay(300);
          await vscode.commands.executeCommand(
            "workbench.action.closeQuickOpen"
          );
          await withTimeout(pending, `${command} cancellation`, 5000);
          assert.deepEqual(
            api.repositories.map((repository) => repository.inputBox.value),
            before
          );
        }
      );
    }

    await check(
      "clear recent command completes in isolated extension storage",
      async () => {
        await withTimeout(
          vscode.commands.executeCommand("autoGitmoji.clearRecent"),
          "Clear recent history"
        );
      }
    );

    await check(
      "docstring command edits the real editor and preserves CRLF",
      async () => {
        await config.update(
          "outputFormat",
          "emoji",
          vscode.ConfigurationTarget.Workspace
        );
        const fixture = path.join(folders[0].uri.fsPath, "smoke-docstring.js");
        assertFixturePath(fixture);
        fs.writeFileSync(
          fixture,
          "/** fix the parser */\r\n// second line\r\n"
        );
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.file(fixture)
        );
        const editor = await vscode.window.showTextDocument(document);
        editor.selection = new vscode.Selection(0, 0, 0, 0);
        await vscode.commands.executeCommand("autoGitmoji.formatDocstring");
        assert.equal(
          document.getText(),
          "/** 🐛 fix the parser */\r\n// second line\r\n"
        );
        assert.equal(await document.save(), true);
      }
    );

    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.error = error instanceof Error ? error.stack : String(error);
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport();
  }
}

module.exports = { run };
