# Contributing

Thanks for your interest in Auto Gitmoji & Docs, a **KueTech Digital** open-source project.

The extension lives in [extension/](extension/). The detailed guide — including how to add keyword-to-emoji mappings, the matching rules, and the pull request checklist — is in **[extension/CONTRIBUTING.md](extension/CONTRIBUTING.md)**.

## Quick start

```bash
cd extension
npm install
npm run build
```

Open the repository root in VS Code or Cursor and press **F5** to launch the Extension Development Host.

## Before opening a pull request

```bash
cd extension
npm run lint
npm run typecheck
npm test
```

All three must pass; CI runs the same commands on Node 20 and 22.

## Ground rules

- Keep the extension **offline**. No network calls, no AI, no telemetry in the matching path.
- Add a test for any change to matching behaviour.
- Never commit secrets. See [SECURITY.md](SECURITY.md) for the ignored credential patterns.
- Be respectful — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Reporting problems

- Bugs and feature ideas: [open an issue](https://github.com/FloKuersten/Gitmoji/issues/new/choose)
- Security vulnerabilities: use [private reporting](https://github.com/FloKuersten/Gitmoji/security/advisories/new), not a public issue
