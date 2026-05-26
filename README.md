# Auto Gitmoji & Docs

[![GitHub](https://img.shields.io/github/stars/FloKuersten/Gitmoji?style=social)](https://github.com/FloKuersten/Gitmoji)

VS Code / **Cursor** extension by **[KueTech Digital](https://kuetech.at)**.

Insert [Gitmojis](https://gitmoji.dev) into commits and docstrings using a **local dictionary** — no AI, no cloud, no latency.

- **Website:** [https://kuetech.at](https://kuetech.at)
- **Support:** [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech)

## Quick start

```powershell
cd extension
npm install
npm run compile
```

Open the repo in **VS Code** or **Cursor** → press **F5** to run the extension.

## Cursor IDE

This extension **works in Cursor** the same way as in VS Code (shared extension host).

1. **Dev:** `cd extension` → `npm run compile` → **F5**
2. **Install .vsix:** `npm run package` → Cursor → Extensions → **Install from VSIX…**
3. **After Marketplace publish:** search **Auto Gitmoji & Docs** in Extensions

Enable the built-in **Git** extension if commit formatting does nothing.

Full details: **[extension/PUBLISHING.md](extension/PUBLISHING.md)**

## Docs

| File | Purpose |
|------|---------|
| [extension/README.md](extension/README.md) | Marketplace listing readme |
| [extension/PUBLISHING.md](extension/PUBLISHING.md) | Upload to VS Marketplace + Cursor install |
| [extension/CONTRIBUTING.md](extension/CONTRIBUTING.md) | Add Gitmoji mappings |

## License

MIT — see [extension/LICENSE](extension/LICENSE)
