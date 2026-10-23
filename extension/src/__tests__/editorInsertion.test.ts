import { describe, expect, it, vi } from "vitest";
import type { TextEditor, TextEditorEdit } from "vscode";
import { captureEditorInsertion } from "../editorInsertion";
function fixture() {
  const replace = vi.fn();
  const editor = {
    document: { version: 1, isClosed: false },
    selections: ["first", "second"],
    edit: vi.fn(async (callback: (builder: TextEditorEdit) => void) => {
      callback({ replace } as unknown as TextEditorEdit);
      return true;
    }),
  };
  return {
    editor,
    replace,
    insert: captureEditorInsertion(editor as unknown as TextEditor),
  };
}
describe("editor picker destination", () => {
  it("uses the captured selections even after cursors move", async () => {
    const { editor, replace, insert } = fixture();
    editor.selections = ["elsewhere"];
    expect(await insert(":bug:")).toBe(true);
    expect(replace.mock.calls).toEqual([
      ["first", ":bug: "],
      ["second", ":bug: "],
    ]);
  });
  it.each(["changed", "closed"])("refuses a %s document", async (state) => {
    const { editor, insert } = fixture();
    if (state === "closed") editor.document.isClosed = true;
    else editor.document.version++;
    expect(await insert(":bug:")).toBe(false);
    expect(editor.edit).not.toHaveBeenCalled();
  });
  it("reports an editor that rejected the edit", async () => {
    const { editor, insert } = fixture();
    editor.edit.mockResolvedValue(false);
    expect(await insert(":bug:")).toBe(false);
  });
});
