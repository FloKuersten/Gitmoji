import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractCommitKeyword } from "../gitmojiMatcher";

describe("keyword parser security", () => {
  it.each([
    ["fix!?:,.", "fix"],
    ["!!!", null],
    ["fix!!!x details", "fix!!!x"],
    ["fix(api)!: details", "fix"],
  ])("preserves keyword semantics for %s", (input, expected) => {
    expect(extractCommitKeyword(input!)).toBe(expected);
  });

  it("handles a long internal punctuation sequence in the extension", () => {
    const input = "!".repeat(100_000) + "x";
    expect(extractCommitKeyword(input)).toBe(input);
  });

  it("bounds the CLI regression with a subprocess timeout", () => {
    const script = `
      const assert = require('node:assert/strict');
      const {extractCommitKeyword} = require(process.argv[1]);
      const input = '!'.repeat(100000) + 'x';
      assert.equal(extractCommitKeyword(input), input);
      assert.equal(extractCommitKeyword('fix!?:,.'), 'fix');
      assert.equal(extractCommitKeyword('!!!'), null);
      assert.equal(extractCommitKeyword('fix(api)!: details'), 'fix');
    `;
    execFileSync(
      process.execPath,
      ["-e", script, resolve("../cli/src/matcher.js")],
      { timeout: 5000 }
    );
  });
});
