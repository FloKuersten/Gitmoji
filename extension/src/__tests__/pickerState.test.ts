import { describe, expect, it } from "vitest";
import {
  buildPickerEntries,
  FAVORITES_LIMIT,
  mappingKey,
  pickerCategories,
  pickerSearchText,
  readPickerState,
  RECENT_LIMIT,
  recordRecent,
  toggleFavorite,
} from "../pickerState";
import type { GitmojiMapping } from "../types";

const bug: GitmojiMapping = {
  gitmoji: "🐛",
  code: ":bug:",
  name: "bug",
  keywords: ["fix", "bug"],
  description: "Fix a bug",
  category: "Quality",
  tags: ["regression", "repair"],
};
const feature: GitmojiMapping = {
  gitmoji: "✨",
  code: ":sparkles:",
  name: "sparkles",
  keywords: ["feat"],
  category: "Features",
};
const docs: GitmojiMapping = {
  gitmoji: "📝",
  code: ":memo:",
  name: "memo",
  keywords: ["docs"],
};

describe("picker preferences", () => {
  it("recovers from malformed storage and bounds deduplicated identities", () => {
    expect(readPickerState(null)).toEqual({ recent: [], favorites: [] });
    const keys = Array.from({ length: 100 }, (_, index) => `:${index}:`);
    const state = readPickerState({
      recent: [null, 1, "", "x".repeat(129), ...keys, ...keys],
      favorites: keys,
    });
    expect(state.recent).toEqual(keys.slice(0, RECENT_LIMIT));
    expect(state.favorites).toEqual(keys.slice(0, FAVORITES_LIMIT));
  });

  it("moves successful selections to the front without mutating the previous state", () => {
    const original = { recent: [":bug:", ":memo:"], favorites: [":sparkles:"] };
    const updated = recordRecent(original, docs);
    expect(updated).toEqual({
      recent: [":memo:", ":bug:"],
      favorites: [":sparkles:"],
    });
    expect(original.recent).toEqual([":bug:", ":memo:"]);
  });

  it("toggles favorites independently from recent history", () => {
    const state = { recent: [":memo:"], favorites: [] };
    const favorite = toggleFavorite(state, bug);
    expect(favorite).toEqual({ recent: [":memo:"], favorites: [":bug:"] });
    expect(toggleFavorite(favorite, bug)).toEqual(state);
  });

  it("keeps code-less custom mappings distinct using name or emoji", () => {
    expect(
      mappingKey({ gitmoji: "custom", name: "team", keywords: ["team"] })
    ).toBe("team");
    expect(mappingKey({ gitmoji: "custom", keywords: ["team"] })).toBe(
      "custom"
    );
  });
});

describe("picker grouping and discovery", () => {
  it("shows favorites once, orders recent by use, and ignores missing mappings", () => {
    const entries = buildPickerEntries([bug, docs, feature], {
      favorites: [":sparkles:", ":removed:"],
      recent: [":memo:", ":sparkles:", ":unknown:"],
    });
    expect(entries.map(({ key, group }) => [key, group])).toEqual([
      [":sparkles:", "Favorites"],
      [":memo:", "Recently used"],
      [":bug:", "All Gitmojis"],
    ]);
    expect(entries.map(({ favorite }) => favorite)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("filters favorites and recent with the same category as the rest of the dictionary", () => {
    const entries = buildPickerEntries(
      [bug, docs, feature],
      {
        favorites: [":sparkles:"],
        recent: [":memo:", ":bug:"],
      },
      "Quality"
    );
    expect(entries.map(({ key }) => key)).toEqual([":bug:"]);
    expect(pickerCategories([bug, feature, docs, bug])).toEqual([
      "Features",
      "Quality",
      "Uncategorized",
    ]);
  });

  it("sorts remaining entries by display name, independent of keyword length", () => {
    expect(
      buildPickerEntries([feature, docs, bug], {
        recent: [],
        favorites: [],
      }).map(({ key }) => key)
    ).toEqual([":bug:", ":memo:", ":sparkles:"]);
  });

  it("includes all search metadata, including tags", () => {
    const text = pickerSearchText(bug);
    for (const term of [
      ":bug:",
      "bug",
      "fix",
      "Quality",
      "regression",
      "repair",
    ]) {
      expect(text).toContain(term);
    }
  });
});
