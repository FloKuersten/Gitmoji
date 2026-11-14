import { formatCommitMessage } from "./gitmojiMatcher";
import type {
  GitmojiMapping,
  GitmojiOutputFormat,
  GitmojiPosition,
} from "./types";

export interface CommitComposerFields {
  type: string;
  scope: string;
  summary: string;
  breaking: boolean;
  breakingDescription: string;
  issueReferences: string;
}

export const COMMIT_TYPES = [
  { type: "feat", description: "A new feature" },
  { type: "fix", description: "A bug fix" },
  { type: "docs", description: "Documentation" },
  { type: "style", description: "Formatting or code style" },
  { type: "refactor", description: "Restructuring without changing behavior" },
  { type: "perf", description: "A performance improvement" },
  { type: "test", description: "Tests and coverage" },
  { type: "build", description: "Build tools and dependencies" },
  { type: "ci", description: "Continuous integration" },
  { type: "chore", description: "Maintenance" },
  { type: "revert", description: "Revert a previous change" },
] as const;

function removeLeadingToken(value: string, mappings: GitmojiMapping[]): string {
  const tokens = mappings
    .flatMap((mapping) => [mapping.gitmoji, mapping.code ?? ""])
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  const token = tokens.find((candidate) => value.startsWith(candidate));
  if (token) return value.slice(token.length).trimStart();
  // Keep existing drafts editable even when their emoji is no longer in the dictionary.
  return value.replace(
    /^(?::[a-z0-9_+-]+:|\p{Extended_Pictographic}[\uFE0F\uFE0E]?\p{Emoji_Modifier}?(?:\u200D\p{Extended_Pictographic}[\uFE0F\uFE0E]?\p{Emoji_Modifier}?)*|[0-9#*]\uFE0F?\u20E3)[\t ]*/iu,
    ""
  );
}

export function hasBreakingFooter(message: string): boolean {
  return /(?:^|\r?\n)BREAKING[ -]CHANGE:[\t ]*\S/m.test(message);
}

export function parseCommitDraft(
  message: string,
  mappings: GitmojiMapping[] = []
): CommitComposerFields {
  const subject = removeLeadingToken(
    (message.match(/^[^\r\n]*/)?.[0] ?? "").trim(),
    mappings
  );
  const conventional = subject.match(
    /^([a-z][a-z0-9-]*)(?:\(([^()\r\n]*)\))?(!)?:[\t ]*(.*)$/i
  );
  return {
    type: conventional?.[1] ?? "feat",
    scope: conventional?.[2] ?? "",
    summary: removeLeadingToken(conventional?.[4] ?? subject, mappings),
    breaking: conventional?.[3] === "!" || hasBreakingFooter(message),
    breakingDescription: "",
    issueReferences: "",
  };
}

export function validateCommitSummary(value: string): string | undefined {
  if (!value.trim()) return "Describe the change in a short summary.";
  if (/[\r\n]/.test(value)) return "Keep the summary on a single line.";
  return undefined;
}

export function validateCommitScope(value: string): string | undefined {
  return /[():!\r\n]/.test(value)
    ? "Use a scope without parentheses, colons, exclamation marks, or newlines."
    : undefined;
}

export function validateIssueReferences(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return value
    .trim()
    .split(/[\s,]+/)
    .every((reference) => /^(?:[\w.-]+\/[\w.-]+)?#[1-9]\d*$/.test(reference))
    ? undefined
    : "Use issue numbers such as #123 or owner/repo#456, separated by spaces or commas.";
}

function appendParagraph(
  message: string,
  paragraph: string,
  eol: string
): string {
  const separator = message.endsWith(`${eol}${eol}`)
    ? ""
    : message.endsWith(eol)
      ? eol
      : `${eol}${eol}`;
  return `${message}${separator}${paragraph}`;
}

/** Replaces only the subject and appends explicitly requested new trailers. */
export function buildCommitMessage(
  original: string,
  fields: CommitComposerFields,
  mappings: GitmojiMapping[],
  position: GitmojiPosition = "prefix",
  outputFormat: GitmojiOutputFormat = "emoji",
  enableScopeMatching: boolean = true
): string {
  const error =
    validateCommitSummary(fields.summary) ??
    validateCommitScope(fields.scope) ??
    validateIssueReferences(fields.issueReferences);
  if (error) throw new Error(error);
  if (!/^[a-z][a-z0-9-]*$/i.test(fields.type)) {
    throw new Error("Choose a valid conventional commit type.");
  }
  if (/[\r\n]/.test(fields.breakingDescription)) {
    throw new Error("Keep the breaking change note on a single line.");
  }
  const scope = fields.scope.trim();
  const breaking = fields.breaking || hasBreakingFooter(original);
  const subject = `${fields.type}${scope ? `(${scope})` : ""}${breaking ? "!" : ""}: ${fields.summary.trim()}`;
  const originalSubject = original.match(/^[^\r\n]*/)?.[0] ?? "";
  let message = `${formatCommitMessage(subject, mappings, position, outputFormat, enableScopeMatching)}${original.slice(originalSubject.length)}`;
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  if (breaking && fields.breakingDescription.trim()) {
    message = appendParagraph(
      message,
      `BREAKING CHANGE: ${fields.breakingDescription.trim()}`,
      eol
    );
  }
  if (fields.issueReferences.trim()) {
    const references = [
      ...new Set(fields.issueReferences.trim().split(/[\s,]+/)),
    ];
    message = appendParagraph(message, `Refs: ${references.join(", ")}`, eol);
  }
  return message;
}
