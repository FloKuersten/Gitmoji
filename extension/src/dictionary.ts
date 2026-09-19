import bundledDictionary from "../data/gitmoji-map.json";
import { loadSortedMappings } from "./gitmojiMatcher";
import type { GitmojiMapping } from "./types";

/**
 * Minimal dictionary used only if the bundled data is somehow unusable, so a
 * broken build degrades to a working subset instead of failing activation.
 */
const FALLBACK_MAPPINGS: GitmojiMapping[] = [
  {
    keywords: ["feat", "feature", "add"],
    gitmoji: "✨",
    code: ":sparkles:",
    name: "sparkles",
  },
  {
    keywords: ["fix", "bug"],
    gitmoji: "🐛",
    code: ":bug:",
    name: "bug",
  },
  {
    keywords: ["docs", "doc"],
    gitmoji: "📝",
    code: ":memo:",
    name: "memo",
  },
  {
    keywords: ["refactor"],
    gitmoji: "♻️",
    code: ":recycle:",
    name: "recycle",
  },
  {
    keywords: ["test", "tests"],
    gitmoji: "🧪",
    code: ":test_tube:",
    name: "test-tube",
  },
  {
    keywords: ["chore"],
    gitmoji: "🔧",
    code: ":wrench:",
    name: "wrench",
  },
];

export function isValidMapping(value: unknown): value is GitmojiMapping {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<GitmojiMapping>;
  return (
    typeof candidate.gitmoji === "string" &&
    candidate.gitmoji.trim().length > 0 &&
    Array.isArray(candidate.keywords) &&
    candidate.keywords.length > 0 &&
    candidate.keywords.every(
      (keyword) => typeof keyword === "string" && keyword.trim().length > 0
    )
  );
}

export function getBuiltInMappings(): GitmojiMapping[] {
  const mappings = Array.isArray(bundledDictionary?.mappings)
    ? (bundledDictionary.mappings as GitmojiMapping[]).filter(isValidMapping)
    : [];

  return mappings.length > 0 ? mappings : FALLBACK_MAPPINGS;
}

/**
 * Merges user-defined entries over the built-in dictionary. Later entries win
 * for a given keyword, so a user mapping always overrides the bundled one.
 */
export function mergeMappings(
  builtIn: GitmojiMapping[],
  custom: GitmojiMapping[]
): GitmojiMapping[] {
  if (custom.length === 0) {
    return loadSortedMappings({ version: 1, mappings: builtIn });
  }

  const overridden = new Set(
    custom.flatMap((mapping) =>
      mapping.keywords.map((keyword) => keyword.toLowerCase())
    )
  );

  const kept = builtIn
    .map((mapping) => ({
      ...mapping,
      keywords: mapping.keywords.filter(
        (keyword) => !overridden.has(keyword.toLowerCase())
      ),
    }))
    .filter((mapping) => mapping.keywords.length > 0);

  return loadSortedMappings({ version: 1, mappings: [...custom, ...kept] });
}
