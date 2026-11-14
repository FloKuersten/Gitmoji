import * as vscode from "vscode";
import { WORKSPACE_MAPPING_FILES } from "./workspaceMappings";

/** Open existing team configuration, or create a starter without overwriting it. */
export function registerWorkspaceSetup(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "autoGitmoji.openProjectMappings",
      async () => {
        const folders = vscode.workspace.workspaceFolders ?? [];
        if (!folders.length) {
          vscode.window.showInformationMessage(
            "Open a project folder to configure team Gitmojis."
          );
          return;
        }
        const folder =
          folders.length === 1
            ? folders[0]
            : await vscode.window.showWorkspaceFolderPick({
                placeHolder: "Choose the project to configure",
              });
        if (!folder) return;
        try {
          for (const relative of WORKSPACE_MAPPING_FILES) {
            const uri = vscode.Uri.joinPath(folder.uri, relative);
            try {
              await vscode.workspace.fs.stat(uri);
            } catch (error) {
              if (
                error instanceof vscode.FileSystemError &&
                error.code === "FileNotFound"
              )
                continue;
              throw error;
            }
            await vscode.window.showTextDocument(
              await vscode.workspace.openTextDocument(uri)
            );
            return;
          }
          const uri = vscode.Uri.joinPath(
            folder.uri,
            WORKSPACE_MAPPING_FILES[0]
          );
          await vscode.workspace.fs.createDirectory(
            vscode.Uri.joinPath(folder.uri, ".vscode")
          );
          const edit = new vscode.WorkspaceEdit();
          edit.createFile(uri, { overwrite: false, ignoreIfExists: false });
          edit.insert(
            uri,
            new vscode.Position(0, 0),
            JSON.stringify(
              {
                mappings: [
                  {
                    keywords: ["team"],
                    gitmoji: "🤝",
                    code: ":handshake:",
                    description: "Team collaboration",
                    category: "Team",
                  },
                ],
              },
              null,
              2
            ) + "\n"
          );
          if (!(await vscode.workspace.applyEdit(edit)))
            throw new Error(
              "The mapping file could not be created. It may already exist."
            );
          const document = await vscode.workspace.openTextDocument(uri);
          if (!(await document.save())) {
            throw new Error(
              "The mapping file could not be saved. Check the folder's write permissions."
            );
          }
          await vscode.window.showTextDocument(document);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Auto Gitmoji: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    )
  );
}
