# Contributing to Auto Gitmoji & Docs

Thank you for helping improve this **KueTech Digital** open-source extension — privacy-first and local-only.

## Adding keyword → Gitmoji mappings

All mappings live in a single file:

`extension/data/gitmoji-map.json`

### Format

Each entry in `mappings` must include:

| Field | Required | Description |
|-------|----------|-------------|
| `keywords` | Yes | Lowercase words matched against the first token of a commit message or docstring summary (e.g. `fix`, `docs`, `feat`). |
| `gitmoji` | Yes | A single Unicode emoji inserted at the start of the line. |
| `description` | No | Shown in the Gitmoji picker and useful for reviewers. |

Example:

```json
{
  "keywords": ["fix", "bug", "hotfix"],
  "gitmoji": "🐛",
  "description": "Fix a bug"
}
```

### Matching rules

1. **Commit messages** — The matcher reads the conventional-commit type (`fix: …`, `feat(scope): …`) or the first word before a space.
2. **Docstrings** — The first non-empty line of the selection is treated as the summary line.
3. **No duplicate emoji** — If the line already starts with an emoji, nothing is inserted.
4. **Longest keyword wins** — When multiple entries could match, longer keywords take priority (sorted automatically in code).

### Pull request checklist

- [ ] New keywords are lowercase and commonly used in commit messages.
- [ ] The Gitmoji matches the [gitmoji.dev](https://gitmoji.dev) convention when applicable.
- [ ] No duplicate keyword across entries (avoid ambiguous matches).
- [ ] Run `npm run compile` in `extension/` with zero TypeScript errors.
- [ ] Manually test: `Auto Gitmoji: Format Commit Message` and `Format Docstring`.

## Development setup

```bash
cd extension
npm install
npm run compile
```

Press **F5** in VS Code to launch the Extension Development Host.

## Code style

- TypeScript strict mode is enabled.
- Run `npm run lint` before opening a PR.
- Keep the extension **offline**: no network calls in core logic.

## Questions

Open a GitHub issue with the `question` label if matching behavior should change — that affects all users.
