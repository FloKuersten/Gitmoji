import { isValidMapping } from "./dictionary";
import type { GitmojiMapping } from "./types";

/**
 * Workspace files that can share team mappings without each person editing
 * User Settings. First existing file wins (relative to each workspace folder).
 */
export const WORKSPACE_MAPPING_FILES = [
  ".vscode/auto-gitmoji.json",
  ".gitmoji-map.json",
] as const;

export function extractRawMappingEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw !== "object" || raw === null) {
    return [];
  }

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.mappings)) {
    return record.mappings;
  }
  if (Array.isArray(record.customMappings)) {
    return record.customMappings;
  }
  return [];
}

/**
 * Parses a workspace config document into mapping entries.
 * Accepts `{ "mappings": [...] }`, `{ "customMappings": [...] }`, or a bare array.
 */
export function parseWorkspaceMappings(raw: unknown): GitmojiMapping[] {
  return extractRawMappingEntries(raw).filter(isValidMapping);
}
