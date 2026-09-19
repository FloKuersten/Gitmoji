# Changelog

All releases by **KueTech Digital** — [kuetech.at](https://kuetech.at)

## 1.3.0

### Added

- `autoGitmoji.autoMatch` (off by default): as-you-type insert in the Source Control box once a conventional type is present (`fix: …`)
- Project-local mapping files: `.vscode/auto-gitmoji.json` or `.gitmoji-map.json` (merge order: built-in → workspace file → `customMappings`)
- `autoGitmoji.onlyCustomMappings` to hide the bundled official list for company icon sets

## 1.2.0

### Added

- `autoGitmoji.outputFormat` setting: insert a Unicode emoji (`🐛`) or an official shortcode (`:bug:`) — useful for GitLab and plain-text logs
- Colon completion in the Source Control commit box (`scminput`) and `COMMIT_EDITMSG` files — type `:bug` or `:memo` for local IntelliSense
- Official gitmoji shortcodes (`code`), names, and optional `semver` on every bundled mapping
- Dictionary aligned with the official [gitmoji](https://github.com/carloscuesta/gitmoji) list (~75 entries), including `:ambulance:`, `:white_check_mark:`, `:package:`, `:bookmark:`, and more

### Changed

- Documentation emoji follows the official list: `docs` / `memo` → 📝 (`:memo:`) instead of 📚
- Quick-pick shows official names, shortcodes, and semver hints; insert text respects `outputFormat`

## 1.1.0

### Added

- `autoGitmoji.customMappings` setting for your own keyword-to-emoji entries, merged over the built-in dictionary
- Status bar item showing the emoji that would be applied to the current commit message; click it to apply. Toggle with `autoGitmoji.showStatusBar`
- `autoGitmoji.position` setting to place the emoji at the start (`🐛 fix: message`) or after the commit type (`fix: 🐛 message`)
- Keyboard shortcuts: `Ctrl+Alt+G` to format the commit message, `Ctrl+Alt+M` to pick an emoji (`Cmd` on macOS)
- New command **Auto Gitmoji: Open Dictionary** to inspect the active mappings
- Dictionary expanded from 29 to 63 entries, including Docker, Kubernetes, types, assets, license, SEO, snapshots, dependency changes, feature flags, and keyboard shortcuts

### Fixed

- Commit message reads and writes now target the same repository, so a multi-root workspace no longer formats the wrong commit box
- The Git extension is activated on demand instead of silently doing nothing on a cold start
- Emoji detection covers arrows, enclosed symbols, and keycap sequences, so an existing emoji is no longer duplicated
- Docstring formatting keeps the emoji inside the comment (`// 🐛 fix`) instead of placing it before the comment marker
- Docstring formatting preserves CRLF line endings
- A malformed dictionary or an invalid custom mapping no longer breaks activation

### Changed

- `autoGitmoji.autoFormatCommitOnSave` is deprecated in favour of `autoGitmoji.formatOnFocusLoss`, which describes when it actually runs. The old value is still honoured until the new one is set
- The extension is bundled with esbuild; the package dropped from 388 KB across 21 files to 245 KB across 9

## 1.0.1

- Richer README with emojis and security documentation
- KueTech Digital branding across UI and docs

## 1.0.0

- Initial release by KueTech Digital
- Local JSON + regex Gitmoji matching for commit messages and docstrings
- SCM commit formatter, docstring formatter, and Gitmoji quick-pick
- Support webview with QR code, Buy Me a Coffee, and KueTech website link
- First-install welcome notification
- Works in VS Code and Cursor (VS Code–compatible extension host)
