# Security Policy — Auto Gitmoji & Docs

**Maintainer:** [KueTech Digital](https://kuetech.at)  
**Repository:** [github.com/FloKuersten/Gitmoji](https://github.com/FloKuersten/Gitmoji)

## Reporting a vulnerability

Please report security issues **privately** through GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/FloKuersten/Gitmoji/security/advisories/new)**

Do not open a public issue for a security report. If GitHub reporting is unavailable to you, contact us through [kuetech.at](https://kuetech.at) instead.

Please include:

- A description of the issue and its impact
- Steps to reproduce, ideally with a minimal example
- The extension version and your editor (VS Code or Cursor) and version

### What to expect

| Stage | Target |
|-------|--------|
| Acknowledgement of your report | Within 7 days |
| Initial assessment and severity triage | Within 14 days |
| Fix released for confirmed high-severity issues | Within 30 days |

We will keep you updated during triage and credit you in the release notes unless you prefer to stay anonymous.

## Supported versions

Only the latest published release receives security fixes. Please upgrade before reporting an issue against an older build.

## Security model

| Area | Behavior |
|------|----------|
| Gitmoji matching | Fully **offline** — reads a bundled JSON dictionary and runs regular expressions in-process |
| Source code analysis | **None** — no project files are read or uploaded for matching |
| AI / LLM | **Not used** |
| Telemetry | **None** implemented by this extension |
| Network access | **Only** when you explicitly open an external link from the Support panel |
| Runtime dependencies | **Zero** — the packaged extension ships no third-party runtime packages |
| Secrets | **None** in source; all URLs are public and user-configurable |

### What the extension does not do

- Send commit messages or docstrings to remote servers
- Call third-party APIs for emoji suggestions
- Execute remote code
- Store credentials in the repository

### Webview hardening

The Support panel is a local webview with a restrictive Content Security Policy: no remote scripts, images limited to the extension's own resources and HTTPS, and scripts limited to the extension's own origin. Navigation happens through `vscode.env.openExternal`, so links open in your system browser rather than inside the editor.

## Automated checks

This repository runs the following on every push and pull request to `main`, plus a weekly schedule:

| Workflow | Purpose |
|----------|---------|
| [ci.yml](.github/workflows/ci.yml) | Lint, typecheck, tests on Node 20 and 22, then VSIX packaging |
| [codeql.yml](.github/workflows/codeql.yml) | CodeQL static analysis with the security-and-quality query suite |
| [security.yml](.github/workflows/security.yml) | Gitleaks secret scan over full history and `npm audit` |
| [dependabot.yml](.github/dependabot.yml) | Weekly dependency and GitHub Actions updates |

Production dependency advisories fail the build. Development-tooling advisories are reported without blocking, since build tools do not ship to users.

Run the same checks locally:

```bash
cd extension
npm ci
npm run lint
npm run typecheck
npm test
npm audit --omit=dev
```

## Public repository contents

This repository is intentionally public. The following are published on purpose and are not secrets:

- `extension/assets/donate-qr.png` — a Buy Me a Coffee donation QR code
- `https://kuetech.at` and `https://www.buymeacoffee.com/kuetech` — public links

Credentials are never committed. Marketplace publishing uses a Personal Access Token supplied at publish time from the maintainer's machine or from a repository secret, never from a file in the repository. See [.gitignore](.gitignore) for the ignored credential patterns, including `.npmrc`, `.vsce`, `*.pem`, and `*.key`.

## Recommended practices for users

- Install from the official Marketplace listing or this repository only
- Review `extension/data/gitmoji-map.json` if you fork the project
- Keep VS Code or Cursor up to date

## License

MIT — see [LICENSE](LICENSE)
