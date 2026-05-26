# 🔒 Security Policy — Auto Gitmoji & Docs

**Maintainer:** [KueTech Digital](https://kuetech.at)  
**Repository:** [github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji)

## 🎯 Scope

This policy covers the **Auto Gitmoji & Docs** VS Code / Cursor extension in `/extension`.

## ✅ Security model (summary)

| Area | Behavior |
|------|----------|
| **Core Gitmoji matching** | Fully **offline** — reads `data/gitmoji-map.json` and runs regex in-process |
| **Source code analysis** | **None** — extension does not read or upload your project files for matching |
| **AI / LLM** | **Not used** |
| **Telemetry** | **None** implemented by this extension |
| **Network** | **Only** when you explicitly open external links (Buy Me a Coffee, kuetech.at) from the Support webview |
| **Secrets** | **No** API keys, tokens, or credentials in source — only configurable public URLs |

## 🛡️ What we do not do

- ❌ Send commit messages or docstrings to remote servers  
- ❌ Call third-party APIs for emoji suggestions  
- ❌ Execute arbitrary remote code  
- ❌ Store credentials in the repository  

## 📦 Dependencies

Dev/build tools (`typescript`, `eslint`, `@vscode/vsce`, etc.) are used **only** when developing or packaging the extension — not at runtime for end users in the packaged `.vsix`.

Run locally:

```bash
cd extension
npm audit
```

Last checked: **0 moderate+ vulnerabilities** (dev dependencies).

## 🌐 External links (user-initiated)

| URL | When opened |
|-----|-------------|
| `https://www.buymeacoffee.com/kuetech` | User clicks **Buy Me a Coffee** in Support panel |
| `https://kuetech.at` | User clicks **KueTech Digital** / website in Support panel |

You can override URLs in VS Code settings (`autoGitmoji.buyMeACoffeeUrl`, `autoGitmoji.websiteUrl`).

## 🐛 Reporting a vulnerability

If you find a security issue:

1. **Do not** open a public issue for sensitive reports  
2. Email or contact via [kuetech.at](https://kuetech.at) with:
   - Description of the issue  
   - Steps to reproduce  
   - Impact assessment (if known)  
3. We aim to respond within **7 business days**

## 📋 Recommended user practices

- ✅ Install from the [official Marketplace listing](https://marketplace.visualstudio.com/) or this GitHub repo only  
- ✅ Review `data/gitmoji-map.json` if you fork the project  
- ✅ Keep VS Code / Cursor updated  

## 📄 License

MIT — see [extension/LICENSE](extension/LICENSE)
