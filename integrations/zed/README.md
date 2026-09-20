# ⚡ Zed Editor Integration

Use **Auto Gitmoji & Docs** inside **Zed Editor**.

---

## Setup Options

### 1. Universal Git Hook (Recommended)
Run:
```bash
npx auto-gitmoji hook install
```
Every commit made inside Zed's built-in Git assistant or terminal will automatically be formatted with Gitmoji!

### 2. Zed Tasks
Add the tasks from `integrations/zed/tasks.json` to `~/.config/zed/tasks.json` or `.zed/tasks.json`.
You can then run `task: spawn` (`Ctrl+Alt+Space`) → **Auto Gitmoji: Format Selection**.
