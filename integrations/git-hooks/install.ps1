$ErrorActionPreference = "Stop"

$gitDir = (git rev-parse --git-dir).Trim()
$hooksDir = Join-Path $gitDir "hooks"
$target = Join-Path $hooksDir "prepare-commit-msg"
$source = Join-Path $PSScriptRoot "prepare-commit-msg"

if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Force -Path $hooksDir | Out-Null
}

Copy-Item $source $target -Force

Write-Host "✨ Auto Gitmoji hook successfully installed into $target!" -ForegroundColor Green
Write-Host "Any commit made in VS Code, JetBrains, Visual Studio, Neovim, Sublime, or Terminal will now auto-format with Gitmoji!" -ForegroundColor Cyan
