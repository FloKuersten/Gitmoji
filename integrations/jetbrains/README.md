# 🧠 JetBrains Integration Guide

Use **Auto Gitmoji & Docs** inside **IntelliJ IDEA, WebStorm, PyCharm, PhpStorm, GoLand, CLion, Rider, Android Studio, RustRover, Fleet**.

---

## Method 1: Universal Git Hook (Recommended — Zero Setup)

The cleanest way to use Auto Gitmoji in JetBrains IDEs is via the Universal Git Hook. The JetBrains Git Commit tool window natively triggers Git hooks upon commit.

```bash
# In your project:
npx auto-gitmoji hook install

# Or globally for all your repos:
npx auto-gitmoji hook install --global
```

Now, whenever you write `feat: add user profile` in the JetBrains Commit window and hit **Commit**, Git automatically saves:
`✨ feat: add user profile`!

---

## Method 2: Live Templates (Autocomplete in Commit Editor)

Speed up commit writing with instant abbreviations!

### How to Install:
1. Open your JetBrains IDE Settings (`Ctrl+Alt+S` or `Cmd+,`).
2. Go to **Editor** → **Live Templates**.
3. Click the **+** button (or **Import Settings**) and select `integrations/jetbrains/Gitmoji.xml`.
4. Alternatively, copy `Gitmoji.xml` to your JetBrains configuration directory:
   - **Windows**: `%APPDATA%\JetBrains\<IDE><version>\templates\`
   - **macOS**: `~/Library/Application Support/JetBrains/<IDE><version>/templates/`
   - **Linux**: `~/.config/JetBrains/<IDE><version>/templates/`

### Usage:
In any commit message or docstring, type:
- `gfeat<Tab>` → `✨ feat(): `
- `gfix<Tab>` → `🐛 fix(): `
- `gdocs<Tab>` → `📝 docs(): `
- `gdeps<Tab>` → `⬆️ chore(deps): bump ...`
- `gai<Tab>` → `🤖 ai(): `
- `gsec<Tab>` → `🔒️ sec(): `
- `grefactor<Tab>` → `♻️ refactor(): `
- `gperf<Tab>` → `⚡️ perf(): `
- `gtest<Tab>` → `🧪 test(): `
