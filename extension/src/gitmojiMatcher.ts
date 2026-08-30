import type { GitmojiDictionary, GitmojiMapping } from "./types";

const LEADING_EMOJI = /^\p{Extended_Pictographic}/u;

const CONVENTIONAL_PREFIX = /^([A-Za-z][\w-]*)(\([^)]*\))?!?:\s*/;

const DOCSTRING_KEYWORD_PATTERNS = [
  /^\*\s*@?([\w-]+)/,
  /^\/\/+\s*([\w-]+)/,
  /^#+\s*([\w-]+)/,
  /^(?:"""|''')\s*([\w-]+)/,
  /^<!--\s*([\w-]+)/,
];

/**
 * Orders mappings so that the longest keyword wins when several entries could
 * match the same token. Sorting once at load time keeps matching allocation-free.
 */
export function loadSortedMappings(
  dictionary: GitmojiDictionary
): GitmojiMapping[] {
  return [...dictionary.mappings]
    .filter((mapping) => mapping.keywords.length > 0 && mapping.gitmoji)
    .sort((a, b) => {
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
  return LEADING_EMOJI.test(trimmed);
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

  let keyword: string | undefined;
  for (const pattern of DOCSTRING_KEYWORD_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      keyword = match[1];
      break;
    }
  }

  keyword ??= trimmed.split(/\s+/)[0]?.replace(/[!?:,.]+$/, "");

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

/**
 * Formats the summary (first non-empty) line of a comment or docstring block,
 * preserving the block's original line endings so Windows files keep CRLF.
 */
export function formatDocstringBlock(
  text: string,
  mappings: GitmojiMapping[]
): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);

  const summaryIndex = lines.findIndex((line) => line.trim().length > 0);
  if (summaryIndex === -1) {
    return text;
  }

  const formatted = formatDocstringLine(lines[summaryIndex], mappings);
  if (formatted === lines[summaryIndex]) {
    return text;
  }

  lines[summaryIndex] = formatted;
  return lines.join(eol);
}
