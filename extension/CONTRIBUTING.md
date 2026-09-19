# Contributing to Auto Gitmoji & Docs

Thank you for helping improve this **KueTech Digital** open-source extension — privacy-first and local-only.

## Adding keyword → Gitmoji mappings

All mappings live in a single file:

`extension/data/gitmoji-map.json`

Before proposing a change to the defaults, note that you can already add your own entries locally with the `autoGitmoji.customMappings` setting. Pull requests to the bundled dictionary are for keywords that most developers would benefit from.

### Format

Each entry in `mappings` should include:

| Field | Required | Description |
|-------|----------|-------------|
| `keywords` | Yes | Lowercase words matched against the first token of a commit message or docstring summary (e.g. `fix`, `docs`, `feat`). Prefer official gitmoji names plus conventional aliases on the same row. |
| `gitmoji` | Yes | A single Unicode emoji inserted into the line. |
| `code` | Yes (bundled) | Official shortcode including colons, e.g. `:bug:` (used when `autoGitmoji.outputFormat` is `code`). |
| `name` | Yes (bundled) | Official gitmoji name without colons, e.g. `bug`. |
| `description` | No | Shown in the Gitmoji picker and useful for reviewers. |
| `semver` | No | Official impact: `major`, `minor`, `patch`, or `null`. |

Example:

```json
{
  "keywords": ["bug", "fix", "hotfix", "patch"],
  "gitmoji": "🐛",
  "code": ":bug:",
  "name": "bug",
  "description": "Fix a bug.",
  "semver": "patch"
}
```

### Matching rules

1. **Commit messages** — The matcher reads the conventional-commit type (`fix: …`, `feat(scope): …`, `feat!: …`) or the first word before a space.
2. **Docstrings** — The first non-empty line of the selection is the summary line. The emoji is inserted after the comment marker, so `// fix parser` becomes `// 🐛 fix parser`.
3. **No duplicate emoji / shortcode** — If the line's content already starts with an emoji or an official `:shortcode:`, nothing is inserted.
4. **Longest keyword wins** — When multiple entries could match, the entry with the longest keyword takes priority (sorted automatically in code).
5. **User mappings win** — Entries from `autoGitmoji.customMappings` override bundled entries for the same keyword.

### Pull request checklist

- [ ] New keywords are lowercase and commonly used in commit messages.
- [ ] The Gitmoji matches the [gitmoji.dev](https://gitmoji.dev) convention when applicable.
- [ ] No duplicate keyword across entries (`npm test` enforces this).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` all pass.
- [ ] Manually tested: `Auto Gitmoji: Format Commit Message` and `Format Docstring / Comment`.

## Development setup

```bash
cd extension
npm install
npm run build
```

Press **F5** in VS Code or Cursor to launch the Extension Development Host. Use `npm run watch` for incremental rebuilds.

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production bundle with esbuild |
| `npm run watch` | Rebuild on change |
| `npm run lint` | ESLint |
| `npm run format` | Apply Prettier |
| `npm run typecheck` | TypeScript, including tests |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run package` | Build the `.vsix` |

## Testing

Matching logic lives in pure functions in [src/gitmojiMatcher.ts](src/gitmojiMatcher.ts) and [src/dictionary.ts](src/dictionary.ts), so it is unit tested without a VS Code host. Any change to matching behaviour needs a test in [src/\_\_tests\_\_](src/__tests__).

## Code style

- TypeScript strict mode is enabled.
- Prettier and ESLint are enforced in CI; run `npm run format` before opening a PR.
- Keep the extension **offline**: no network calls, no AI, and no telemetry in the matching path.
- Comments explain constraints, not what the next line does.

## Questions

Open a GitHub issue if matching behaviour should change — that affects all users.
