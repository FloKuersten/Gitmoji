import type { GitmojiDictionary, GitmojiMapping } from "./types";

const EMOJI_PREFIX =
  /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE0F}\u{200D}]/u;

const CONVENTIONAL_PREFIX = /^(\w+)(\([^)]*\))?!?:\s*/i;

export function loadSortedMappings(
  dictionary: GitmojiDictionary
): GitmojiMapping[] {
  return [...dictionary.mappings].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map((k) => k.length));
    const maxB = Math.max(...b.keywords.map((k) => k.length));
    return maxB - maxA;
  });
}

export function hasLeadingGitmoji(text: string): boolean {
  const trimmed = text.trimStart();
  if (!trimmed) {
    return false;
  }
  return EMOJI_PREFIX.test(trimmed);
}

function findMapping(
  token: string,
  mappings: GitmojiMapping[]
): GitmojiMapping | undefined {
  const lower = token.toLowerCase();
  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => kw.toLowerCase() === lower)) {
      return mapping;
    }
  }
  return undefined;
}

export function extractCommitKeyword(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  const conventional = trimmed.match(CONVENTIONAL_PREFIX);
  if (conventional) {
    return conventional[1];
  }

  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[!?:]+$/, "");
  return firstWord || null;
}

export function matchGitmoji(
  text: string,
  mappings: GitmojiMapping[]
): GitmojiMapping | null {
  if (hasLeadingGitmoji(text)) {
    return null;
  }

  const keyword = extractCommitKeyword(text);
  if (!keyword) {
    return null;
  }

  return findMapping(keyword, mappings) ?? null;
}

export function formatCommitMessage(
  message: string,
  mappings: GitmojiMapping[]
): string {
  const trimmed = message.trim();
  if (!trimmed || hasLeadingGitmoji(trimmed)) {
    return message;
  }

  const mapping = matchGitmoji(trimmed, mappings);
  if (!mapping) {
    return message;
  }

  return `${mapping.gitmoji} ${trimmed}`;
}

export function formatDocstringLine(
  line: string,
  mappings: GitmojiMapping[]
): string {
  const trimmed = line.trimStart();
  if (!trimmed || hasLeadingGitmoji(trimmed)) {
    return line;
  }

  const keyword =
    trimmed.match(/^\*\s*@?(\w+)/)?.[1] ??
    trimmed.match(/^\/\/\s*(\w+)/)?.[1] ??
    trimmed.match(/^#\s*(\w+)/)?.[1] ??
    trimmed.split(/\s+/)[0]?.replace(/[!?:]+$/, "");

  if (!keyword) {
    return line;
  }

  const mapping = findMapping(keyword, mappings);
  if (!mapping) {
    return line;
  }

  const leading = line.slice(0, line.length - trimmed.length);
  return `${leading}${mapping.gitmoji} ${trimmed}`;
}

export function formatDocstringBlock(
  text: string,
  mappings: GitmojiMapping[]
): string {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) {
    return text;
  }

  const summaryIndex = lines.findIndex((l) => l.trim().length > 0);
  if (summaryIndex === -1) {
    return text;
  }

  lines[summaryIndex] = formatDocstringLine(lines[summaryIndex], mappings);
  return lines.join("\n");
}
