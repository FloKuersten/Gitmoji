import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import dictionary from "../../data/gitmoji-map.json";
import { formatCommitMessage } from "../gitmojiMatcher";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
} from "../types";

interface CliOptions {
  mappings?: GitmojiMapping[];
  position?: GitmojiPosition;
  outputFormat?: GitmojiOutputFormat;
  enableScopeMatching?: boolean;
}

const cli = createRequire(resolve("../cli/package.json"))(
  "./src/matcher.js"
) as {
  formatCommitMessage(message: string, options?: CliOptions): string;
  matchGitmoji(message: string): GitmojiMapping | null;
};
const mappings = dictionary.mappings as GitmojiMapping[];
const positions: GitmojiPosition[] = ["prefix", "after-type"];
const formats: GitmojiOutputFormat[] = ["emoji", "code"];

describe("CLI and extension commit formatting parity", () => {
  it.each([
    "fix: repair parser",
    "\t  feat(api)!: add endpoint  \r\n\r\nBody with whitespace.  \r\n\r\nBREAKING CHANGE: use v2\r\nSigned-off-by: Developer <dev@example.test>\r\n",
    "docs: write guide\n\nBody\r\nMixed line endings stay intact.\n",
    "fix:crash",
    "fix:\tcrash",
    "fix:\n\nThe body is not part of the type prefix.\n",
    "fix crash",
    "chore(deps): bump tooling",
    "banana: leave this alone\nfix: body is not the subject\n",
    "\r\nfix: no subject\r\n",
    "   \nfeat: blank subject\n",
    "",
    "   ",
  ])("produces the same result for %j", (message) => {
    for (const position of positions) {
      for (const outputFormat of formats) {
        for (const enableScopeMatching of [true, false]) {
          const options = {
            position,
            outputFormat,
            enableScopeMatching,
            mappings,
          };
          const formatted = cli.formatCommitMessage(message, options);
          expect(formatted).toBe(
            formatCommitMessage(
              message,
              mappings,
              position,
              outputFormat,
              enableScopeMatching
            )
          );
          expect(cli.formatCommitMessage(formatted, options)).toBe(formatted);
        }
      }
    }
  });

  it.each([
    "  🐛 fix: crash\n\nBody\n",
    "\t:bug: fix: crash  \r\n",
    " fix(api)!: 🐛 crash\n",
    "fix: :bug: crash\r\n\r\nBody\r\n",
    "feat:✨ feature\n",
    "fix:\t:bug: crash",
  ])("keeps existing Gitmoji in either position unchanged: %j", (message) => {
    for (const position of positions) {
      for (const outputFormat of formats) {
        expect(
          cli.formatCommitMessage(message, { position, outputFormat })
        ).toBe(message);
      }
    }
    expect(cli.matchGitmoji(message)).toBeNull();
  });

  it("preserves indentation, trailing spaces, trailers and the final newline", () => {
    const message =
      "\t fix: crash  \r\n\r\nDetailed body.  \r\n\r\nRefs: #42\r\n";
    expect(cli.formatCommitMessage(message)).toBe(
      "\t 🐛 fix: crash  \r\n\r\nDetailed body.  \r\n\r\nRefs: #42\r\n"
    );
  });

  it("inserts after a type without consuming the next line", () => {
    expect(
      cli.formatCommitMessage("fix:\r\nBody\r\n", {
        position: "after-type",
      })
    ).toBe("fix: 🐛 \r\nBody\r\n");
  });

  it("limits formatting to the subject even with standalone CR line endings", () => {
    const message = "fix: crash\r\rBody  \r";
    expect(cli.formatCommitMessage(message)).toBe("🐛 fix: crash\r\rBody  \r");
    expect(cli.formatCommitMessage("\rfix: body\r")).toBe("\rfix: body\r");
  });

  it("does not infer a match from a body after an empty subject", () => {
    expect(cli.matchGitmoji("\nfix: this is body text")).toBeNull();
    expect(cli.matchGitmoji("\r\nfeat: this is body text")).toBeNull();
  });
});
