# 📜 Sublime Text & Sublime Merge Integration

Use **Auto Gitmoji & Docs** inside **Sublime Text 4** and **Sublime Merge**.

---

## Installation for Sublime Text:
1. Open Sublime Text → **Preferences** → **Browse Packages…**
2. Copy `AutoGitmoji.py` and `Default.sublime-commands` into the `User/` folder.
3. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run:
   - **Auto Gitmoji: Format Commit Message**
   - **Auto Gitmoji: Pick and Insert Gitmoji**

---

## Installation for Sublime Merge:
Install the Universal Git Hook:
```bash
npx auto-gitmoji hook install
```
When you commit from Sublime Merge, the `prepare-commit-msg` hook formats your commit automatically!
