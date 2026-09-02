import { describe, expect, it } from "vitest";
import dictionary from "../../data/gitmoji-map.json";
import {
  extractCommitKeyword,
  formatCommitMessage,
  formatDocstringBlock,
  formatDocstringLine,
  hasLeadingGitmoji,
  loadSortedMappings,
  matchGitmoji,
} from "../gitmojiMatcher";
import type { GitmojiDictionary, GitmojiMapping } from "../types";

const mappings = loadSortedMappings(dictionary as GitmojiDictionary);

describe("loadSortedMappings", () => {
  it("sorts entries so the longest keyword is matched first", () => {
    const sorted = loadSortedMappings({
      version: 1,
      mappings: [
        { keywords: ["a"], gitmoji: "1" },
        { keywords: ["documentation"], gitmoji: "2" },
        { keywords: ["fix"], gitmoji: "3" },
      ],
    });

    expect(sorted[0].keywords[0]).toBe("documentation");
  });

  it("does not mutate the source dictionary", () => {
    const source: GitmojiDictionary = {
      version: 1,
      mappings: [
        { keywords: ["a"], gitmoji: "1" },
        { keywords: ["bbbb"], gitmoji: "2" },
      ],
    };

    loadSortedMappings(source);

    expect(source.mappings[0].keywords[0]).toBe("a");
  });

  it("tolerates a mapping with no keywords", () => {
    const empty: GitmojiMapping = { keywords: [], gitmoji: "1" };
    expect(() =>
      loadSortedMappings({ version: 1, mappings: [empty] })
    ).not.toThrow();
  });
});

describe("hasLeadingGitmoji", () => {
  it.each(["✨ feat: x", "🐛 fix", "♻️ refactor", "⏪ revert", "♿ a11y"])(
    "detects %s",
    (input) => {
      expect(hasLeadingGitmoji(input)).toBe(true);
    }
  );

  it("detects emoji after leading whitespace", () => {
    expect(hasLeadingGitmoji("   ✨ feat")).toBe(true);
  });

  it("detects arrow and enclosed emoji the old ranges missed", () => {
    expect(hasLeadingGitmoji("↩️ revert")).toBe(true);
    expect(hasLeadingGitmoji("⬆️ deps")).toBe(true);
  });

  it("detects keycap sequences", () => {
    expect(hasLeadingGitmoji("1️⃣ first")).toBe(true);
  });

  it("returns false for plain text and blank input", () => {
    expect(hasLeadingGitmoji("fix: bug")).toBe(false);
    expect(hasLeadingGitmoji("")).toBe(false);
    expect(hasLeadingGitmoji("   ")).toBe(false);
  });
});

describe("extractCommitKeyword", () => {
  it.each([
    ["fix: crash", "fix"],
    ["feat(scope): add", "feat"],
    ["feat!: breaking", "feat"],
    ["feat(api)!: breaking", "feat"],
    ["docs update readme", "docs"],
    ["chore", "chore"],
    ["refactor:", "refactor"],
  ])("reads %s as %s", (message, expected) => {
    expect(extractCommitKeyword(message)).toBe(expected);
  });

  it("returns null for empty input", () => {
    expect(extractCommitKeyword("")).toBeNull();
    expect(extractCommitKeyword("   \n  ")).toBeNull();
  });
});

describe("formatCommitMessage", () => {
  it.each([
    ["feat: add login", "✨ feat: add login"],
    ["fix: crash on save", "🐛 fix: crash on save"],
    ["docs: api guide", "📚 docs: api guide"],
    ["refactor: auth module", "♻️ refactor: auth module"],
    ["perf: smaller bundle", "⚡️ perf: smaller bundle"],
    ["test: add unit tests", "🧪 test: add unit tests"],
    ["chore: bump deps", "🔧 chore: bump deps"],
    ["security: sanitize input", "🔒 security: sanitize input"],
  ])("formats %s", (input, expected) => {
    expect(formatCommitMessage(input, mappings)).toBe(expected);
  });

  it("supports a conventional scope", () => {
    expect(formatCommitMessage("feat(auth): add sso", mappings)).toBe(
      "✨ feat(auth): add sso"
    );
  });

  it("matches case-insensitively", () => {
    expect(formatCommitMessage("FIX: crash", mappings)).toBe("🐛 FIX: crash");
  });

  it("leaves a message that already has an emoji untouched", () => {
    expect(formatCommitMessage("🐛 fix: crash", mappings)).toBe(
      "🐛 fix: crash"
    );
  });

  it("leaves an unknown keyword untouched", () => {
    expect(formatCommitMessage("banana: peel", mappings)).toBe("banana: peel");
  });

  it("returns empty and whitespace input unchanged", () => {
    expect(formatCommitMessage("", mappings)).toBe("");
    expect(formatCommitMessage("   ", mappings)).toBe("   ");
  });

  it("inserts after the type when position is after-type", () => {
    expect(formatCommitMessage("fix: crash", mappings, "after-type")).toBe(
      "fix: 🐛 crash"
    );
    expect(
      formatCommitMessage("feat(api): add route", mappings, "after-type")
    ).toBe("feat(api): ✨ add route");
  });

  it("falls back to a prefix when after-type has no type prefix", () => {
    expect(formatCommitMessage("fix crash", mappings, "after-type")).toBe(
      "🐛 fix crash"
    );
  });
});

describe("matchGitmoji", () => {
  it("returns the mapping for a known keyword", () => {
    expect(matchGitmoji("fix: bug", mappings)?.gitmoji).toBe("🐛");
  });

  it("returns null when an emoji is already present", () => {
    expect(matchGitmoji("🐛 fix: bug", mappings)).toBeNull();
  });

  it("returns null for an unknown keyword", () => {
    expect(matchGitmoji("banana", mappings)).toBeNull();
  });
});

describe("formatDocstringLine", () => {
  it.each([
    ["// fix the parser", "// 🐛 fix the parser"],
    ["# docs for the api", "# 📚 docs for the api"],
    [" * feat description", " * ✨ feat description"],
    ["-- refactor query", "-- ♻️ refactor query"],
  ])("formats %s", (input, expected) => {
    expect(formatDocstringLine(input, mappings)).toBe(expected);
  });

  it("preserves leading indentation", () => {
    expect(formatDocstringLine("    // fix bug", mappings)).toBe(
      "    // 🐛 fix bug"
    );
  });

  it("reads a JSDoc tag name", () => {
    expect(formatDocstringLine(" * @deploy release notes", mappings)).toBe(
      " * 🚀 @deploy release notes"
    );
  });

  it("skips a line that already starts with an emoji", () => {
    expect(formatDocstringLine("🐛 fix bug", mappings)).toBe("🐛 fix bug");
  });

  it("skips a comment whose body already starts with an emoji", () => {
    expect(formatDocstringLine("// 🐛 fix bug", mappings)).toBe(
      "// 🐛 fix bug"
    );
    expect(formatDocstringLine(" * ✨ feat", mappings)).toBe(" * ✨ feat");
  });

  it("keeps the emoji inside a block comment opener", () => {
    expect(formatDocstringLine("/** fix the parser */", mappings)).toBe(
      "/** 🐛 fix the parser */"
    );
  });

  it("returns a marker-only line unchanged", () => {
    expect(formatDocstringLine("//", mappings)).toBe("//");
    expect(formatDocstringLine(" * ", mappings)).toBe(" * ");
  });

  it("returns blank and unknown lines unchanged", () => {
    expect(formatDocstringLine("", mappings)).toBe("");
    expect(formatDocstringLine("// banana", mappings)).toBe("// banana");
  });
});

describe("formatDocstringBlock", () => {
  it("formats only the first non-empty line", () => {
    const input = "\n// fix parser\n// fix again";
    expect(formatDocstringBlock(input, mappings)).toBe(
      "\n// 🐛 fix parser\n// fix again"
    );
  });

  it("preserves CRLF line endings", () => {
    const input = "// fix parser\r\n// second line";
    expect(formatDocstringBlock(input, mappings)).toBe(
      "// 🐛 fix parser\r\n// second line"
    );
  });

  it("preserves LF line endings", () => {
    const input = "// fix parser\n// second line";
    expect(formatDocstringBlock(input, mappings)).toBe(
      "// 🐛 fix parser\n// second line"
    );
  });

  it("returns a block with no content unchanged", () => {
    expect(formatDocstringBlock("\n\n  \n", mappings)).toBe("\n\n  \n");
  });
});

describe("bundled dictionary", () => {
  it("has no duplicate keywords across mappings", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const mapping of mappings) {
      for (const keyword of mapping.keywords) {
        const lower = keyword.toLowerCase();
        const owner = seen.get(lower);
        if (owner && owner !== mapping.gitmoji) {
          duplicates.push(`${lower} (${owner} vs ${mapping.gitmoji})`);
        }
        seen.set(lower, mapping.gitmoji);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("gives every mapping a non-empty emoji and keyword list", () => {
    for (const mapping of mappings) {
      expect(mapping.gitmoji.length).toBeGreaterThan(0);
      expect(mapping.keywords.length).toBeGreaterThan(0);
    }
  });

  it("starts every emoji with a character the matcher recognizes", () => {
    for (const mapping of mappings) {
      expect(hasLeadingGitmoji(mapping.gitmoji)).toBe(true);
    }
  });
});
