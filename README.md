# ✨ Auto Gitmoji & Docs

[![CI](https://github.com/FloKuersten/Gitmoji/actions/workflows/ci.yml/badge.svg)](https://github.com/FloKuersten/Gitmoji/actions/workflows/ci.yml)
[![Security](https://github.com/FloKuersten/Gitmoji/actions/workflows/security.yml/badge.svg)](https://github.com/FloKuersten/Gitmoji/actions/workflows/security.yml)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-kuetech.auto--gitmoji--docs-blue.svg)](https://open-vsx.org/extension/kuetech/auto-gitmoji-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/FloKuersten/Gitmoji?style=social)](https://github.com/FloKuersten/Gitmoji)

**Auto Gitmoji & Docs** is a free **VS Code** and **Cursor** extension by **[KueTech Digital](https://kuetech.at)**.

Turn plain commit messages into expressive, standardized Git history — **🚀 locally**, **🔒 privately**, and **⚡ instantly**. No AI. No backend. No API keys.

<p align="center">
  <code>fix: login bug</code> &nbsp;→&nbsp; <code>🐛 fix: login bug</code><br/>
  <code>feat: dark mode</code> &nbsp;→&nbsp; <code>✨ feat: dark mode</code><br/>
  <code>docs: readme</code> &nbsp;→&nbsp; <code>📝 docs: readme</code>
</p>

---

## 🎯 Why this extension?

| Problem | How we help |
|--------|-------------|
| 😶 Boring commit messages | Auto-insert the right [Gitmoji](https://gitmoji.dev) from ~75 official entries (+ conventional aliases) |
| 🐢 Slow cloud tools | **Zero latency** — everything runs on your machine |
| 🔐 Privacy concerns | **No code leaves your editor** for matching |
| 🤖 AI you don't need | **No AI** — predictable dictionary + regex only |
| 🧩 Missing your keyword | Add your own with `autoGitmoji.customMappings` |

---

## 🏢 KueTech Digital

| | |
|---|---|
| 🏷️ **Company** | [KueTech Digital](https://kuetech.at) |
| 🌐 **Website** | [https://kuetech.at](https://kuetech.at) |
| ☕ **Support** | [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech) |
| 📦 **Repository** | [github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji) |

---

## ⚡ Quick start

```powershell
cd extension
npm install
npm run compile
```

1. Open this repo in **VS Code** or **Cursor**
2. Press **F5** to launch the Extension Development Host
3. Open **Source Control** → type `fix: something` → run **Auto Gitmoji: Format Commit Message**

📦 **Install from a `.vsix`:**

```powershell
cd extension
npm run package
```

Then: **Extensions** → **⋯** → **Install from VSIX…**

---

## 🖥️ Cursor IDE

✅ **Yes — fully supported.** Cursor uses the same extension host as VS Code.

- Install from [Open VSX](https://open-vsx.org/extension/kuetech/auto-gitmoji-docs) after publish, or from a `.vsix`
- Enable the built-in **Git** extension for commit formatting

📖 Details: **[extension/PUBLISHING.md](extension/PUBLISHING.md)**

---

## 🛠️ What’s inside the repo?

```
Gitmoji/
├── extension/          📂 VS Code extension source
│   ├── data/           📋 gitmoji-map.json (keyword → emoji)
│   ├── src/            💻 TypeScript logic
│   ├── assets/         🖼️ Donate QR code
│   └── media/          🎨 Marketplace icon & logo
└── README.md           📖 You are here
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [extension/README.md](extension/README.md) | 📣 Marketplace listing (long form) |
| [extension/PUBLISHING.md](extension/PUBLISHING.md) | 🚀 Publish to Open VSX and the VS Marketplace |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 🤝 How to contribute |
| [extension/CONTRIBUTING.md](extension/CONTRIBUTING.md) | 📋 Add new Gitmoji mappings |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 💬 Community standards |
| [SECURITY.md](SECURITY.md) | 🔒 Security & privacy model |

---

## 🔒 Security at a glance

- ✅ **Offline core** — matching uses local JSON + regex only
- ✅ **No secrets in repo** — only public URLs (website, Buy Me a Coffee)
- ✅ **Optional links** — Support panel opens external URLs **only when you click**
- ✅ **`npm audit`** — dev dependencies checked regularly

Full details: **[SECURITY.md](SECURITY.md)**

---

## 🤝 Contributing

Want to add `deploy` → 🚀 or more keywords? See **[extension/CONTRIBUTING.md](extension/CONTRIBUTING.md)**.

---

## 📄 License

MIT © **KueTech Digital** — [extension/LICENSE](extension/LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://kuetech.at"><strong>KueTech Digital</strong></a><br/>
  ⭐ Star us on <a href="https://github.com/FloKuersten/Gitmoji">GitHub</a> · ☕ <a href="https://www.buymeacoffee.com/kuetech">Buy me a coffee</a>
</p>
