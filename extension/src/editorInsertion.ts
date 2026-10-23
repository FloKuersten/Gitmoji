import type { TextEditor } from "vscode";

/** Freeze the destination before opening a picker; reject stale selections. */
export function captureEditorInsertion(editor: TextEditor) {
  const version = editor.document.version;
  const selections = [...editor.selections];
  return async (token: string): Promise<boolean> => {
    if (editor.document.isClosed || editor.document.version !== version) {
      return false;
    }
    return editor.edit((builder) => {
      for (const selection of selections) {
        builder.replace(selection, `${token} `);
      }
    });
  };
}
