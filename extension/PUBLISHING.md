# Publishing Auto Gitmoji & Docs

Guide for the [Visual Studio Marketplace](https://marketplace.visualstudio.com/) and for **Cursor IDE** users.

**Developer:** [KueTech Digital](https://kuetech.at)  
**Support:** [buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech)

---

## Does it work in Cursor?

**Yes.** Cursor is built on the VS Code extension host. This extension uses only standard APIs (`vscode.*`, Git SCM input, webviews, commands) — no VS Code–exclusive insider features.

| Feature | VS Code | Cursor |
|--------|---------|--------|
| Format commit message (Git SCM) | Yes | Yes (enable built-in Git) |
| Format docstring / comment | Yes | Yes |
| Gitmoji quick-pick | Yes | Yes |
| Support webview (QR + coffee + website) | Yes | Yes |
| Local dictionary (offline) | Yes | Yes |

### Install in Cursor

**Option A — From a `.vsix` file (recommended before Marketplace listing)**

1. Build the package (see below).
2. In Cursor: **Extensions** → **⋯** menu → **Install from VSIX…**
3. Select `auto-gitmoji-docs-1.0.0.vsix`.
4. Reload when prompted.

**Option B — From source (development)**

1. Open the `extension` folder in Cursor.
2. Terminal: `npm install` then `npm run compile`.
3. Press **F5** (Run Extension) — uses `.vscode/launch.json` at repo root.

**Option C — After Marketplace publish**

1. Open **Extensions** in Cursor.
2. Search **Auto Gitmoji & Docs**.
3. Click **Install** (Cursor pulls from the same Open VSX / VS Code marketplace ecosystem depending on your Cursor version and settings).

If commit formatting does nothing, ensure the **Git** extension is enabled: **Extensions** → search `@builtin git` → enable.

---

## Prerequisites for Marketplace publish

1. **Microsoft account** — same one you use for Azure DevOps / Marketplace.
2. **Publisher ID** — create at [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).  
   This project uses `"publisher": "kuetech"` in `package.json`. Your Marketplace publisher name **must match** exactly, or change `publisher` in `package.json` to your real ID.
3. **Personal Access Token (PAT)** with **Marketplace → Manage** scope:
   - [https://dev.azure.com](https://dev.azure.com) → User settings → Personal access tokens → New token → **Custom defined** → **Marketplace** → **Manage**
4. **Node.js 20+** on your machine.

---

## One-time: install publishing tools

```powershell
cd d:\WORK\Gitmoji\extension
npm install
```

`@vscode/vsce` is already a devDependency.

Login once (stores PAT securely on your machine):

```powershell
npx vsce login kuetech
```

Paste the PAT when prompted. Use your real publisher ID if it is not `kuetech`.

---

## Pre-publish checklist

- [ ] `npm run compile` — zero errors  
- [ ] `npm run lint` — zero errors  
- [ ] `CHANGELOG.md` updated for the version in `package.json`  
- [ ] `README.md` (this folder) reads well on the Marketplace page  
- [ ] `media/icon.png` is **128×128** PNG (resize if needed)  
- [ ] `repository.url` in `package.json` points to [github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji)  
- [ ] No secrets in the repo (only public URLs like kuetech.at and Buy Me a Coffee)

---

## Build the `.vsix` package

```powershell
cd d:\WORK\Gitmoji\extension
npm run compile
npm run package
```

Output example: `auto-gitmoji-docs-1.0.0.vsix`

Test locally before publishing:

```powershell
code --install-extension auto-gitmoji-docs-1.0.0.vsix
```

Or in Cursor: **Install from VSIX…**

---

## Publish to Visual Studio Marketplace

First release:

```powershell
cd d:\WORK\Gitmoji\extension
npx vsce publish
```

This runs `vscode:prepublish` (compile), packages, and uploads.

**Subsequent releases:**

1. Bump `"version"` in `package.json` (semver: `1.0.1`, `1.1.0`, etc.).
2. Add notes under `CHANGELOG.md`.
3. Run:

```powershell
npx vsce publish
```

Or publish an existing VSIX without rebuilding:

```powershell
npx vsce publish --packagePath auto-gitmoji-docs-1.0.0.vsix
```

After approval (usually minutes to a few hours), the extension appears at:

`https://marketplace.visualstudio.com/items?itemName=kuetech.auto-gitmoji-docs`

(Replace `kuetech` with your publisher ID.)

---

## Marketplace listing copy (short)

Use this in the publisher portal if asked for a short description:

> Insert Gitmojis into Git commits and docstrings offline. Local dictionary, no AI, no cloud. Built by KueTech Digital.

**Category:** Other  
**Tags:** gitmoji, git, commit, emoji, conventional commits, docstring  

**Q&A — Privacy:** No code is sent to any server for matching. Optional Support panel opens buymeacoffee.com or kuetech.at only when you click a button.

---

## Open VSX (optional)

Some tools (including some Cursor setups) use [Open VSX](https://open-vsx.org/). After VS Code Marketplace publish, you can additionally publish with:

```powershell
npx ovsx publish auto-gitmoji-docs-1.0.0.vsix -p <OPEN_VSX_TOKEN>
```

Requires a separate Open VSX account and token. Not required for standard VS Code or many Cursor installs.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `vsce publish` — publisher mismatch | Align `publisher` in `package.json` with Marketplace publisher ID |
| Commit command does nothing | Enable Git extension; open Source Control; type a message like `fix: bug` |
| Icon rejected | Use 128×128 PNG, &lt; 1 MB |
| Cursor does not find extension | Install via `.vsix` until Marketplace listing is live |

---

## Links

- Repository: [https://github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji)
- Website: [https://kuetech.at](https://kuetech.at)
- Buy Me a Coffee: [https://www.buymeacoffee.com/kuetech](https://www.buymeacoffee.com/kuetech)
- VS Code Marketplace manage: [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
- vsce docs: [https://code.visualstudio.com/api/working-with-extensions/publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
