import { describe, expect, it } from "vitest";
import type { Uri } from "vscode";
import type { GitRepository } from "../types";
import { applyCommitMessage, selectRepository } from "../repositorySelection";
const uri = (path: string, authority = "", scheme = "file") =>
  ({
    path,
    authority,
    scheme,
    toString: () => `${scheme}://${authority}${path}`,
  }) as Uri;
const repo = (path: string, value = ""): GitRepository => ({
  rootUri: uri(path),
  inputBox: { value },
});
describe("repository targeting", () => {
  it("honors toolbar context over selection and editor", () => {
    const a = repo("/a"),
      b = repo("/b");
    a.ui = { selected: true };
    expect(selectRepository([a, b], [uri("/a/file")], b.rootUri)).toBe(b);
    expect(selectRepository([a, b], [], uri("/missing"))).toBeUndefined();
  });
  it("honors SCM selection over the editor", () => {
    const a = repo("/a"),
      b = repo("/b");
    b.ui = { selected: true };
    expect(selectRepository([a, b], [uri("/a/file")])).toBe(b);
  });
  it("selects nested roots but not sibling prefixes", () => {
    const a = repo("/a"),
      b = repo("/a/nested");
    expect(selectRepository([a, b], [uri("/a/nested/file")])).toBe(b);
    expect(selectRepository([a, b], [uri("/another/file")])).toBeUndefined();
  });
  it("distinguishes remote authorities and schemes", () => {
    expect(
      selectRepository(
        [repo("/a"), repo("/b")],
        [uri("/a/file", "remote", "vscode-remote")]
      )
    ).toBeUndefined();
  });
  it("requires an unambiguous fallback", () => {
    const a = repo("/a", "fix: a"),
      b = repo("/b", "fix: b");
    expect(selectRepository([a, b], [])).toBeUndefined();
    b.inputBox.value = "";
    expect(selectRepository([a, b], [])).toBe(a);
  });
  it("writes only to the captured repository", () => {
    const a = repo("/a", "fix: a"),
      b = repo("/b", "fix: b");
    const target = { repository: a, original: a.inputBox.value };
    b.ui = { selected: true };
    expect(applyCommitMessage(target, "formatted")).toBe(true);
    expect(a.inputBox.value).toBe("formatted");
    expect(b.inputBox.value).toBe("fix: b");
  });
  it("refuses to overwrite a newer draft", () => {
    const a = repo("/a", "fix: a"),
      target = { repository: a, original: a.inputBox.value };
    a.inputBox.value = "new draft";
    expect(applyCommitMessage(target, "old draft")).toBe(false);
    expect(a.inputBox.value).toBe("new draft");
  });
});
