# ✨ Auto Gitmoji CLI

Universal command-line tool and Git hook engine for [**Auto Gitmoji & Docs**](https://github.com/FloKuersten/Gitmoji).

Works with **every IDE**: VS Code, Cursor, JetBrains (IntelliJ, WebStorm, PyCharm), Neovim, Sublime Text, Visual Studio 2022, Zed, and Terminal.

---

## ⚡ Installation

### Use via npx (no install needed):
```bash
npx auto-gitmoji <command>
```

### Or install globally:
```bash
npm install -g auto-gitmoji
```

---

## 🚀 Commands

### Format a commit message:
```bash
auto-gitmoji format "feat: add user authentication"
# Output: ✨ feat: add user authentication

auto-gitmoji format "chore(deps): bump vite to 6.0"
# Output: ⬆️ chore(deps): bump vite to 6.0

auto-gitmoji format "ai: implement rag agent"
# Output: 🤖 ai: implement rag agent
```

### Install Universal Git Hook:
```bash
# In active repository:
auto-gitmoji hook install

# Globally for all repositories:
auto-gitmoji hook install --global
```

### Interactive Commit Wizard:
```bash
auto-gitmoji commit
```

### Search & List Emojis:
```bash
# Search by keyword or category:
auto-gitmoji search "ai"
auto-gitmoji search "security"

# List all categories and emojis:
auto-gitmoji list
auto-gitmoji list --category "Features"
```

---

## 📄 License
MIT © KueTech Digital
