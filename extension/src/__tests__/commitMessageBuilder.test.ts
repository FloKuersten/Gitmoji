import { describe, expect, it } from "vitest";
import {
  buildCommitMessage,
  parseCommitDraft,
  validateCommitScope,
  validateCommitSummary,
  validateIssueReferences,
  type CommitComposerFields,
} from "../commitMessageBuilder";

const mappings = [
  { keywords: ["feat"], gitmoji: "✨", code: ":sparkles:" },
  { keywords: ["fix"], gitmoji: "🐛", code: ":bug:" },
];
const fields: CommitComposerFields = {
  type: "feat",
  scope: "editor",
  summary: "add a commit composer",
  breaking: false,
  breakingDescription: "",
  issueReferences: "",
};

describe("commit composer prefill", () => {
  it.each([
    "🐛 fix(api)!: reject invalid input",
    ":bug: fix(api)!: reject invalid input",
    "fix(api)!: 🐛 reject invalid input",
    "fix(api)!: :bug: reject invalid input",
  ])("reads existing conventional subject %s", (message) => {
    expect(parseCommitDraft(message, mappings)).toMatchObject({
      type: "fix",
      scope: "api",
      summary: "reject invalid input",
      breaking: true,
    });
  });

  it("retains plain subjects and recognizes existing breaking trailers", () => {
    expect(
      parseCommitDraft("update the config\n\nBREAKING CHANGE: rename oldKey")
    ).toMatchObject({
      type: "feat",
      summary: "update the config",
      breaking: true,
      breakingDescription: "",
    });
  });

  it("removes an emoji sequence absent from the active dictionary", () => {
    expect(parseCommitDraft("👩🏽‍💻 feat: pair programming").summary).toBe(
      "pair programming"
    );
  });
});

describe("commit composition", () => {
  it.each(["\n", "\r\n"])(
    "preserves the exact existing body and trailers with %j line endings",
    (eol) => {
      const tail = `${eol}${eol}Keep  spacing.  ${eol}${eol}Signed-off-by: Example <example@example.test>${eol}`;
      expect(buildCommitMessage(`old summary${tail}`, fields, mappings)).toBe(
        `✨ feat(editor): add a commit composer${tail}`
      );
    }
  );

  it("honors shortcode and after-type preferences", () => {
    expect(buildCommitMessage("", fields, mappings, "after-type", "code")).toBe(
      "feat(editor): :sparkles: add a commit composer"
    );
  });

  it("adds requested breaking details and deduplicated references after existing text", () => {
    expect(
      buildCommitMessage(
        "old summary\r\n\r\nKeep this body.\r\n",
        {
          ...fields,
          breaking: true,
          breakingDescription: "Replace the old configuration.",
          issueReferences: "#12, owner/repo#34 #12",
        },
        mappings
      )
    ).toBe(
      "✨ feat(editor)!: add a commit composer\r\n\r\nKeep this body.\r\n\r\nBREAKING CHANGE: Replace the old configuration.\r\n\r\nRefs: #12, owner/repo#34"
    );
  });

  it("preserves existing breaking semantics without adding a duplicate footer", () => {
    expect(
      buildCommitMessage(
        "fix: old\n\nBREAKING-CHANGE: keep me",
        fields,
        mappings
      )
    ).toBe(
      "✨ feat(editor)!: add a commit composer\n\nBREAKING-CHANGE: keep me"
    );
  });

  it("works with an empty custom dictionary", () => {
    expect(buildCommitMessage("", { ...fields, scope: "" }, [])).toBe(
      "feat: add a commit composer"
    );
  });

  it("honors disabled scope matching", () => {
    const custom = [
      { keywords: ["chore"], gitmoji: "🔧" },
      { keywords: ["deps"], gitmoji: "⬆️" },
    ];
    expect(
      buildCommitMessage(
        "",
        { ...fields, type: "chore", scope: "deps" },
        custom,
        "prefix",
        "emoji",
        false
      )
    ).toBe("🔧 chore(deps): add a commit composer");
  });

  it.each(["", "  ", "summary\nforged body", "summary\rforged body"])(
    "rejects an invalid summary %j",
    (summary) => {
      expect(validateCommitSummary(summary)).toBeTypeOf("string");
      expect(() =>
        buildCommitMessage("", { ...fields, summary }, [])
      ).toThrow();
    }
  );

  it("rejects structural injection in scope, trailers and breaking notes", () => {
    expect(validateCommitScope("api): injected")).toBeTypeOf("string");
    expect(validateIssueReferences("#12\nCloses: #13")).toBeTypeOf("string");
    expect(validateIssueReferences("https://example.test")).toBeTypeOf(
      "string"
    );
    expect(() =>
      buildCommitMessage("", { ...fields, breakingDescription: "one\ntwo" }, [])
    ).toThrow();
    expect(validateCommitScope("api/client")).toBeUndefined();
    expect(validateIssueReferences("#12, owner/repo#34")).toBeUndefined();
  });
});
