#!/usr/bin/env bash
set -e

HOOK_DIR="$(git rev-parse --git-dir)/hooks"
TARGET="$HOOK_DIR/prepare-commit-msg"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$HOOK_DIR"
cp "$SCRIPT_DIR/prepare-commit-msg" "$TARGET"
chmod +x "$TARGET"

echo "✨ Auto Gitmoji hook successfully installed into $TARGET!"
echo "Any commit made in VS Code, JetBrains, Visual Studio, Neovim, Sublime, or Terminal will now auto-format with Gitmoji!"
