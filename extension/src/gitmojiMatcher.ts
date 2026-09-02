import type {
  GitmojiDictionary,
  GitmojiMapping,
  GitmojiPosition,
} from "./types";

/**
 * Matches any leading emoji, including ranges the previous explicit ranges
 * missed (arrows, enclosed symbols, dingbats). Keycap sequences start with an
 * ASCII character, so they need a separate alternative.
 */
const EMOJI_PREFIX = /^(?:\p{Extended_Pictographic}|[0-9#*]\uFE0F?\u20E3)/u;

const CONVENTIONAL_PREFIX = /^(\w+)(\([^)]*\))?(!)?:\s*/;

/**
 * Comment openers recognized on a summary line. The emoji is inserted after the
 * marker so it stays inside the comment instead of breaking the surrounding
 * code, and the list is ordered so longer openers win over their prefixes.
 */
const DOCSTRING_MARKERS = [
  /^\/\*+\s*/,
  /^\/{2,}\s*/,
  /^<!--\s*/,
  /^(?:"""|''')\s*/,
  /^\*\s*/,
  /^#+\s*/,
  /^--\s*/,
  /^;+\s*/,
  /^%\s*/,
];

const DOCSTRING_KEYWORD = /^@?([A-Za-z_][\w-]*)/;

export function loadSortedMappings(
  dictionary: GitmojiDictionary
): GitmojiMapping[] {
  return [...dictionary.mappings].sort((a, b) => {
    const maxA = Math.max(0, ...a.keywords.map((k) => k.length));
    const maxB = Math.max(0, ...b.keywords.map((k) => k.length));
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

  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[!?:,.]+$/, "");
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

/**
 * Inserts the gitmoji after the conventional-commit type when the caller asked
 * for `after-type` and the message actually has a type prefix. Falls back to a
 * plain prefix otherwise, so the setting can never drop the emoji.
 */
function applyPosition(
  message: string,
  gitmoji: string,
  position: GitmojiPosition
): string {
  if (position === "after-type") {
    const conventional = message.match(CONVENTIONAL_PREFIX);
    if (conventional) {
      const prefix = conventional[0];
      return `${prefix}${gitmoji} ${message.slice(prefix.length)}`;
    }
  }

  return `${gitmoji} ${message}`;
}

export function formatCommitMessage(
  message: string,
  mappings: GitmojiMapping[],
  position: GitmojiPosition = "prefix"
): string {
  const trimmed = message.trim();
  if (!trimmed || hasLeadingGitmoji(trimmed)) {
    return message;
  }

  const mapping = matchGitmoji(trimmed, mappings);
  if (!mapping) {
    return message;
  }

  return applyPosition(trimmed, mapping.gitmoji, position);
}

function splitCommentMarker(text: string): { marker: string; body: string } {
  for (const pattern of DOCSTRING_MARKERS) {
    const match = text.match(pattern);
    if (match) {
      return { marker: match[0], body: text.slice(match[0].length) };
    }
  }

  return { marker: "", body: text };
}

export function formatDocstringLine(
  line: string,
  mappings: GitmojiMapping[]
): string {
  const trimmed = line.trimStart();
  if (!trimmed) {
    return line;
  }

  const indent = line.slice(0, line.length - trimmed.length);
  const { marker, body } = splitCommentMarker(trimmed);

  if (!body || hasLeadingGitmoji(body)) {
    return line;
  }

  const keyword = body.match(DOCSTRING_KEYWORD)?.[1];
  if (!keyword) {
    return line;
  }

  const mapping = findMapping(keyword, mappings);
  if (!mapping) {
    return line;
  }

  return `${indent}${marker}${mapping.gitmoji} ${body}`;
}

/**
 * Formats the first non-empty line of a block while keeping the document's
 * original line endings, so editing a CRLF file does not rewrite every line.
 */
export function formatDocstringBlock(
  text: string,
  mappings: GitmojiMapping[]
): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);

  const summaryIndex = lines.findIndex((l) => l.trim().length > 0);
  if (summaryIndex === -1) {
    return text;
  }

  lines[summaryIndex] = formatDocstringLine(lines[summaryIndex], mappings);
  return lines.join(eol);
}
