# ✨ Auto Gitmoji & Docs

![KueTech Digital](media/logo.png)

<p align="center">
  <strong>A <a href="https://kuetech.at">KueTech Digital</a> product</strong><br/>
  Free · Local · Privacy-first · No AI
</p>

Insert [Gitmojis](https://gitmoji.dev) into **Git commit messages** and **docstrings** from a JSON dictionary on your machine — **no AI, no backend, no API calls** for core features.

<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Compatible-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code"/>
  <img src="https://img.shields.io/badge/Cursor-Compatible-000000?style=flat-square" alt="Cursor"/>
  <img src="https://img.shields.io/badge/Offline-Yes-success?style=flat-square" alt="Offline"/>
  <img src="https://img.shields.io/badge/AI-No-red?style=flat-square" alt="No AI"/>
</p>

---

## 🎯 Features

| Feature | Emoji | Description |
|---------|-------|-------------|
| **Offline matching** | 📋 | `data/gitmoji-map.json` + regex — `fix` → 🐛, `feat` → ✨, `docs` → 📚 |
| **Format commit** | 💬 | Git SCM input box — one command |
| **Format docstring** | 📝 | First line of selection or current line |
| **Quick-pick** | 🎨 | Choose any Gitmoji from the full dictionary |
| **Support panel** | ☕ | QR donate image + Buy Me a Coffee + [kuetech.at](https://kuetech.at) |
| **First-install welcome** | 👋 | One-time thank-you (not spam) |

---

## 🏢 KueTech Digital

| | |
|---|---|
| 🏷️ **Company** | [KueTech Digital](https://kuetech.at) |
| 🌐 **Website** | [kuetech.at](https://kuetech.at) |
| 📦 **GitHub** | [FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji) |
| ☕ **Support** | [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech) |

---

## 🖥️ Works in Cursor?

**✅ Yes.** Cursor uses the same VS Code extension host.

1. Install from the **Visual Studio Marketplace** (search **Auto Gitmoji & Docs**)
2. Or install from a `.vsix` file
3. Enable the built-in **Git** extension if commit formatting does nothing

📖 [PUBLISHING.md](./PUBLISHING.md) — install & publish guide

---

## ⌨️ Commands

| Command | What it does |
|---------|----------------|
| `Auto Gitmoji: Format Commit Message` | 💬 Add Gitmoji to Git commit box |
| `Auto Gitmoji: Format Docstring / Comment` | 📝 Add Gitmoji to comment/doc line |
| `Auto Gitmoji: Pick and Insert Gitmoji` | 🎨 Choose emoji from list |
| `Auto Gitmoji: Support the Developer` | ☕ KueTech Digital support webview |

**SCM toolbar:** Git commit icon in the Source Control title bar (when Git is active).

---

## 📖 Examples

| Before | After |
|--------|-------|
| `feat: add login` | `✨ feat: add login` |
| `fix: crash on save` | `🐛 fix: crash on save` |
| `docs: api guide` | `📚 docs: api guide` |
| `refactor: auth module` | `♻️ refactor: auth module` |
| `perf: reduce bundle size` | `⚡️ perf: reduce bundle size` |
| `test: add unit tests` | `🧪 test: add unit tests` |
| `chore: bump deps` | `🔧 chore: bump deps` |
| `security: sanitize input` | `🔒 security: sanitize input` |

Supports **Conventional Commits**: `type(scope): message` and simple `type: message` formats.

---

## ⚙️ Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autoGitmoji.buyMeACoffeeUrl` | [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech) | ☕ Support link |
| `autoGitmoji.websiteUrl` | [kuetech.at](https://kuetech.at) | 🌐 Company website |
| `autoGitmoji.autoFormatCommitOnSave` | `false` | Format commit when window loses focus |
| `autoGitmoji.notifyOnMajorUpdates` | `true` | One-time reminder after major updates |

---

## 🔒 Privacy & security

| Question | Answer |
|----------|--------|
| Does it send my code to the cloud? | **❌ No** — matching is 100% local |
| Does it use AI? | **❌ No** |
| Does it need API keys? | **❌ No** |
| When does it use the network? | **Only** if you click Buy Me a Coffee or visit kuetech.at in the Support panel |
| Where is data stored? | `gitmoji-map.json` ships with the extension — you can extend it |

See [SECURITY.md](../SECURITY.md) in the repository root.

---

## 🧠 How matching works

1. 📋 Read keywords from `data/gitmoji-map.json`
2. 🔍 Parse commit type (`fix:`, `feat(scope):`, or first word)
3. 🚫 Skip if a Gitmoji is already at the start
4. ✨ Prepend the best match (longest keyword wins)

**No network. No ML. No surprises.**

---

## 🛠️ Development

```bash
npm install
npm run compile
npm run lint
```

Press **F5** to run the Extension Development Host.

```bash
npm run package   # builds .vsix
```

---

## 🚀 Publish

Publisher: **kuetech** (KueTech Digital) — [PUBLISHING.md](./PUBLISHING.md)

---

## 🤝 Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md) — add keyword → Gitmoji mappings via pull request.

---

## 📄 License

MIT © **[KueTech Digital](https://kuetech.at)**

---

<p align="center">
  ⭐ <a href="https://github.com/FloKuersten/Gitmoji">Star on GitHub</a> ·
  ☕ <a href="https://www.buymeacoffee.com/kuetech">Buy me a coffee</a> ·
  🌐 <a href="https://kuetech.at">kuetech.at</a>
</p>
