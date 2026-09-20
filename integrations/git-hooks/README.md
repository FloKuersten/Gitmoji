# 🪝 Universal Git Hook Integration

The Universal Git Hook allows **Auto Gitmoji & Docs** to work seamlessly across **every single code editor, IDE, and Git GUI**:

- 💻 **JetBrains** (IntelliJ IDEA, WebStorm, PyCharm, GoLand, Rider, CLion, Android Studio)
- ⚡ **VS Code & Cursor & Windsurf**
- 🏢 **Visual Studio 2022** (Git Changes window)
- 🍏 **Xcode**
- 🚀 **Neovim / Vim & Emacs**
- 📜 **Sublime Text & Sublime Merge**
- 🐙 **GitHub Desktop, GitKraken, SourceTree**
- ⌨️ **Terminal CLI** (`git commit -m "..."`)

---

## ⚡ Quick Install

### In Current Repository:
```bash
npx auto-gitmoji hook install
```
Or via script:
- Linux / macOS: `bash integrations/git-hooks/install.sh`
- Windows PowerShell: `.\integrations\git-hooks\install.ps1`

### Globally (All Repositories):
```bash
npx auto-gitmoji hook install --global
```

---

## 🎯 How It Works

When you trigger a commit in **any** IDE or terminal:
1. Git invokes `prepare-commit-msg` before creating the commit.
2. The hook inspects the commit message line.
3. If a conventional type/keyword is detected (e.g. `feat: ...` or `chore(deps): ...`), Auto Gitmoji prepends the matching emoji.
4. If an emoji is already present, or if it is an automatic merge/squash, it leaves the message untouched.
5. Zero latency, 100% offline, privacy-first!
