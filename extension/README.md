# Auto Gitmoji & Docs

![KueTech Digital](media/logo.png)

**Free, local, privacy-first** Gitmoji helper for **VS Code** and **Cursor**.  
Inserts emojis into Git commit messages and docstrings from a JSON dictionary on your machine — **no AI, no backend, no API calls** for core features.

Built by **[KueTech Digital](https://kuetech.at)** · [GitHub](https://github.com/FloKuersten/Gitmoji) · [Buy me a coffee](https://www.buymeacoffee.com/kuetech)

---

## Features

- **Offline matching** — `data/gitmoji-map.json` + regex (e.g. `fix` → 🐛, `feat` → ✨, `docs` → 📚)
- **Format commit message** — SCM / Git input box
- **Format docstring** — first line of selection or current line
- **Quick-pick** — any Gitmoji from the dictionary
- **Support panel** — QR donate image, Buy Me a Coffee, link to [kuetech.at](https://kuetech.at)

## Works in Cursor?

**Yes.** Cursor uses the same extension format as VS Code. Install from the Marketplace (after publish) or from a `.vsix` file. See [PUBLISHING.md](./PUBLISHING.md) for Cursor install steps.

## Commands

| Command | Description |
|---------|-------------|
| `Auto Gitmoji: Format Commit Message` | Add Gitmoji to Git commit box |
| `Auto Gitmoji: Format Docstring / Comment` | Add Gitmoji to comment/doc line |
| `Auto Gitmoji: Pick and Insert Gitmoji` | Choose emoji from list |
| `Auto Gitmoji: Support the Developer` | Support webview |

**SCM:** Git commit icon in the Source Control title bar (when Git is active).

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

See **[PUBLISHING.md](./PUBLISHING.md)** for Marketplace upload, versioning, and Cursor notes.

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md) — add keyword mappings to `data/gitmoji-map.json`.

## License

MIT © [KueTech Digital](https://kuetech.at)
