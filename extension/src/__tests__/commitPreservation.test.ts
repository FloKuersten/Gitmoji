import { describe, expect, it } from "vitest";
import {
  formatCommitMessage,
  insertCommitToken,
  isAutoMatchCandidate,
} from "../gitmojiMatcher";
const mappings = [{ keywords: ["fix"], gitmoji: "🐛", code: ":bug:" }];
describe("commit subject preservation", () => {
  it.each(["emoji", "code"] as const)(
    "is idempotent after-type with %s output",
    (format) => {
      const result = formatCommitMessage(
        "fix: crash",
        mappings,
        "after-type",
        format
      );
      expect(formatCommitMessage(result, mappings, "after-type", format)).toBe(
        result
      );
      expect(formatCommitMessage(result, mappings, "prefix", format)).toBe(
        result
      );
      expect(isAutoMatchCandidate(result + " while typing")).toBe(false);
    }
  );
  it.each(["\n", "\r\n"])("preserves body and trailers for %j", (eol) => {
    const message = `  fix: crash  ${eol}${eol}Body  ${eol}Signed-off-by: Name <a@b.test>${eol}`;
    expect(formatCommitMessage(message, mappings)).toBe(
      `  🐛 ${message.slice(2)}`
    );
  });
  it("does not format a body with an empty subject", () => {
    expect(formatCommitMessage("\nfix: body", mappings)).toBe("\nfix: body");
  });
  it("keeps newlines after an empty conventional subject", () => {
    expect(formatCommitMessage("fix:\n\nbody", mappings, "after-type")).toBe(
      "fix: 🐛 \n\nbody"
    );
  });
  it("inserts into empty or unmatched subjects", () => {
    expect(insertCommitToken("", ":bug:")).toBe(":bug: ");
    expect(insertCommitToken("something\n\nbody", ":bug:", "after-type")).toBe(
      ":bug: something\n\nbody"
    );
  });
});
