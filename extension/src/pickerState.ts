import type { GitmojiMapping } from "./types";

export const RECENT_LIMIT = 12;
export const FAVORITES_LIMIT = 64;

export interface PickerState {
  recent: string[];
  favorites: string[];
}

export interface PickerEntry {
  mapping: GitmojiMapping;
  key: string;
  group: "Favorites" | "Recently used" | "All Gitmojis";
  favorite: boolean;
}

/** Store a dictionary identity only, never a commit message or editor text. */
export function mappingKey(mapping: GitmojiMapping): string {
  return mapping.code?.trim() || mapping.name?.trim() || mapping.gitmoji;
}

function boundedKeys(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (key): key is string =>
          typeof key === "string" && key.length > 0 && key.length <= 128
      )
    ),
  ].slice(0, limit);
}

export function readPickerState(value: unknown): PickerState {
  const state =
    value && typeof value === "object" ? (value as Partial<PickerState>) : {};
  return {
    recent: boundedKeys(state.recent, RECENT_LIMIT),
    favorites: boundedKeys(state.favorites, FAVORITES_LIMIT),
  };
}

export function recordRecent(
  state: PickerState,
  mapping: GitmojiMapping
): PickerState {
  return readPickerState({
    ...state,
    recent: [mappingKey(mapping), ...state.recent],
  });
}

export function toggleFavorite(
  state: PickerState,
  mapping: GitmojiMapping
): PickerState {
  const key = mappingKey(mapping);
  return readPickerState({
    ...state,
    favorites: state.favorites.includes(key)
      ? state.favorites.filter((entry) => entry !== key)
      : [key, ...state.favorites],
  });
}

export function mappingCategory(mapping: GitmojiMapping): string {
  return mapping.category?.trim() || "Uncategorized";
}

export function pickerCategories(mappings: GitmojiMapping[]): string[] {
  return [...new Set(mappings.map(mappingCategory))].sort((a, b) =>
    a.localeCompare(b)
  );
}

/** Favorites first, recent in use order, then the remaining dictionary alphabetically. */
export function buildPickerEntries(
  mappings: GitmojiMapping[],
  state: PickerState,
  category?: string
): PickerEntry[] {
  const byKey = new Map<string, GitmojiMapping>();
  for (const mapping of mappings) {
    if (!category || mappingCategory(mapping) === category) {
      byKey.set(mappingKey(mapping), mapping);
    }
  }
  const entries: PickerEntry[] = [];
  const append = (key: string, group: PickerEntry["group"]): void => {
    const mapping = byKey.get(key);
    if (!mapping) return;
    entries.push({
      mapping,
      key,
      group,
      favorite: state.favorites.includes(key),
    });
    byKey.delete(key);
  };
  state.favorites.forEach((key) => append(key, "Favorites"));
  state.recent.forEach((key) => append(key, "Recently used"));
  [...byKey.entries()]
    .sort(([, a], [, b]) =>
      (a.name ?? a.keywords[0] ?? a.gitmoji).localeCompare(
        b.name ?? b.keywords[0] ?? b.gitmoji
      )
    )
    .forEach(([key]) => append(key, "All Gitmojis"));
  return entries;
}

export function pickerSearchText(mapping: GitmojiMapping): string {
  return [
    mapping.code,
    mapping.name,
    mappingCategory(mapping),
    ...mapping.keywords,
    ...(mapping.tags ?? []),
  ]
    .filter(Boolean)
    .join(" · ");
}
