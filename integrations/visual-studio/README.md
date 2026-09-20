# 🏢 Visual Studio 2022 Integration

Use **Auto Gitmoji & Docs** inside **Visual Studio 2022** (Enterprise, Professional, Community).

---

## Method 1: Git Hook (Zero Effort)

Visual Studio 2022 uses your repository's local Git configuration.

1. Open your solution terminal (`Ctrl+` `) or PowerShell:
   ```bash
   npx auto-gitmoji hook install
   ```
2. Open the **Git Changes** window (`Ctrl+0, Ctrl+G`).
3. Type your commit message:
   ```
   feat: add responsive navbar
   ```
4. Click **Commit All**.
5. Git automatically prepends the Gitmoji:
   `✨ feat: add responsive navbar`!

---

## Method 2: External Tools

1. Go to **Tools** → **External Tools…**
2. Click **Add**:
   - **Title**: `Auto Gitmoji Format`
   - **Command**: `npx`
   - **Arguments**: `auto-gitmoji format "$(CurText)"`
   - **Initial Directory**: `$(SolutionDir)`
   - Check **Use Output window**.
3. Now you can assign a shortcut or run it from the **Tools** menu!
