# Publishing Auto Gitmoji & Docs

**Publisher / company:** **KueTech Digital** — [kuetech.at](https://kuetech.at)  
**Namespace / publisher ID:** `kuetech`  
**Extension ID:** `kuetech.auto-gitmoji-docs`  
**Open VSX listing:** https://open-vsx.org/extension/kuetech/auto-gitmoji-docs  
**VS Marketplace listing:** https://marketplace.visualstudio.com/items?itemName=kuetech.auto-gitmoji-docs

Cursor installs extensions from [Open VSX](https://open-vsx.org/) by default. VS Code uses the Visual Studio Marketplace. Publish to both if you want the extension in both editors.

Never commit an access token. Use `OVSX_PAT` in your shell or the `OVSX_PAT` GitHub Actions secret.

On Windows PowerShell, `npx` may be blocked by the execution policy. Use `npx.cmd` or `npm.cmd`.

---

## Preflight (no token needed)

```powershell
cd d:\WORK\Gitmoji\extension
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run openvsx:check
npm.cmd run package
```

That produces `auto-gitmoji-docs-1.1.0.vsix`. Install it locally first:

```powershell
code --install-extension auto-gitmoji-docs-1.1.0.vsix
```

Or in Cursor: **Extensions → ⋯ → Install from VSIX…**

---

## Open VSX (required for Cursor)

### One-time account setup

1. Sign in at [https://open-vsx.org](https://open-vsx.org) with GitHub.
2. Open [Access Tokens](https://open-vsx.org/user-settings/tokens).
3. Generate a token named `gitmoji-local` (or `gitmoji-ci` for GitHub Actions).
4. Copy the token once. Store it as a user environment variable or a GitHub secret named `OVSX_PAT`. Do not put it in a file in this repository.

### One-time namespace

The Open VSX namespace must match `"publisher": "kuetech"` in `package.json`.

```powershell
cd d:\WORK\Gitmoji\extension
$env:OVSX_PAT = "paste-token-here-then-clear-it"
npx.cmd ovsx create-namespace kuetech
```

If the namespace already exists and you own it, this command reports that and you can continue. If someone else claimed `kuetech`, change `publisher` in `package.json` to a name you own and re-run the command.

### Publish from your machine

```powershell
cd d:\WORK\Gitmoji\extension
$env:OVSX_PAT = "paste-token-here-then-clear-it"
npm.cmd run publish:ovsx
Remove-Item Env:OVSX_PAT
```

The script packages `kuetech.auto-gitmoji-docs` at the version in `package.json` and uploads it with README image base URLs pointed at this GitHub repository. A duplicate version is skipped instead of failing.

After a successful upload the listing is:

https://open-vsx.org/extension/kuetech/auto-gitmoji-docs

In Cursor, search **Auto Gitmoji & Docs** and install.

### Publish from GitHub Actions

1. Repo **Settings → Secrets and variables → Actions → New repository secret**
2. Name: `OVSX_PAT`
3. Value: a dedicated Open VSX token (not your local one)
4. Either:
   - **Actions → Publish Open VSX → Run workflow**, or
   - Create a GitHub Release. The workflow runs on `release: published`.

The workflow re-runs lint, typecheck, tests, packages the VSIX, then publishes.

---

## Visual Studio Marketplace (optional, for VS Code)

1. Create publisher `kuetech` at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).
2. Create an Azure DevOps PAT with **Marketplace → Manage**.
3. Publish:

```powershell
cd d:\WORK\Gitmoji\extension
npx.cmd vsce login kuetech
npx.cmd vsce publish --no-dependencies
```

Or publish the already-built VSIX:

```powershell
npx.cmd vsce publish --no-dependencies --packagePath auto-gitmoji-docs-1.1.0.vsix
```

---

## Next version

1. Bump `"version"` in `extension/package.json`.
2. Add notes to `extension/CHANGELOG.md`.
3. Commit, push, then run `npm.cmd run publish:ovsx` (and `vsce publish` if you also use the Marketplace).

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `OVSX_PAT is not set` | Set the env var or GitHub secret. Never commit the token. |
| Namespace already exists | If you own it, continue. If not, change `publisher`. |
| `npx` blocked on PowerShell | Use `npx.cmd` / `npm.cmd`, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| README images broken on Open VSX | The publish script sets `--baseContentUrl` / `--baseImagesUrl` to this repo |
| Cursor cannot find the extension | Confirm the Open VSX listing is public, then search `kuetech.auto-gitmoji-docs` |
| Git commit command does nothing | Enable the built-in Git extension |

---

## Links

- Repository: [https://github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji)
- Open VSX wiki: [Publishing Extensions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)
- Open VSX tokens: [https://open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens)
- Website: [https://kuetech.at](https://kuetech.at)
