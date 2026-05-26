# Auto Gitmoji & Docs

![KueTech Digital](media/logo.png)

A **KueTech Digital** product — free, local, privacy-first Gitmoji helper for **VS Code** and **Cursor**.

Inserts emojis into Git commit messages and docstrings from a JSON dictionary on your machine — **no AI, no backend, no API calls** for core features.

| | |
|---|---|
| **Company** | [KueTech Digital](https://kuetech.at) |
| **Website** | [kuetech.at](https://kuetech.at) |
| **GitHub** | [FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji) |
| **Support** | [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech) |

---

## Features

- **Offline matching** — `data/gitmoji-map.json` + regex (e.g. `fix` → 🐛, `feat` → ✨, `docs` → 📚)
- **Format commit message** — SCM / Git input box
- **Format docstring** — first line of selection or current line
- **Quick-pick** — any Gitmoji from the dictionary
- **Support panel** — QR code, Buy Me a Coffee, [KueTech Digital](https://kuetech.at)

## Works in Cursor?

**Yes.** See [PUBLISHING.md](./PUBLISHING.md).

## Commands

| Command | Description |
|---------|-------------|
| `Auto Gitmoji: Format Commit Message` | Add Gitmoji to Git commit box |
| `Auto Gitmoji: Format Docstring / Comment` | Add Gitmoji to comment/doc line |
| `Auto Gitmoji: Pick and Insert Gitmoji` | Choose emoji from list |
| `Auto Gitmoji: Support the Developer` | KueTech Digital support webview |

## Examples

```
feat: add login     →  ✨ feat: add login
fix: crash on save  →  🐛 fix: crash on save
docs: api guide     →  📚 docs: api guide
```

## Settings

| Setting | Default |
|---------|---------|
| `autoGitmoji.buyMeACoffeeUrl` | `https://www.buymeacoffee.com/kuetech` |
| `autoGitmoji.websiteUrl` | `https://kuetech.at` |
| `autoGitmoji.autoFormatCommitOnSave` | `false` |
| `autoGitmoji.notifyOnMajorUpdates` | `true` |

## Development

```bash
npm install
npm run compile
```

Press **F5** to run the Extension Development Host.

## Publish

[PUBLISHING.md](./PUBLISHING.md) — Marketplace upload under publisher **kuetech** (KueTech Digital).

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT © **KueTech Digital** — [kuetech.at](https://kuetech.at)
