#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const {
  formatCommitMessage,
  loadMappings,
  filterMappings,
  getCategoryList,
  getMappingsByCategory,
  hasLeadingGitmoji
} = require('../src/matcher');

const pkg = require('../package.json');

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'help';

function printHelp() {
  console.log(`
\x1b[1m\x1b[36m✨ Auto Gitmoji & Docs CLI v${pkg.version}\x1b[0m
\x1b[90mUniversal Gitmoji engine & Git Hook for all IDEs and tools\x1b[0m

\x1b[1mUsage:\x1b[0m
  auto-gitmoji <command> [options]

\x1b[1mCommands:\x1b[0m
  \x1b[32mformat <message>\x1b[0m          Format a commit message with matching Gitmoji
  \x1b[32mhook install [--global]\x1b[0m   Install Git hook for automatic formatting in all IDEs
  \x1b[32mhook uninstall [--global]\x1b[0m Remove the Git hook
  \x1b[32mhook run <file>\x1b[0m           Format commit message file directly (used by git hook)
  \x1b[32mcommit\x1b[0m                    Interactive commit wizard with live preview
  \x1b[32msearch <query>\x1b[0m            Search gitmojis by keyword, name, or description
  \x1b[32mlist [--category <cat>]\x1b[0m   List all gitmojis and categories
  \x1b[32msetup <ide>\x1b[0m               Instructions & configs for JetBrains, Neovim, Sublime, etc.

\x1b[1mOptions for format:\x1b[0m
  --format <emoji|code>     Output format: Unicode emoji or :shortcode: (default: emoji)
  --position <prefix|after-type>
                            Position: prefix or after-type (default: prefix)
  --no-scope                Disable scope-aware matching

\x1b[1mExamples:\x1b[0m
  $ auto-gitmoji format "feat: add user authentication"
    \x1b[90m→ ✨ feat: add user authentication\x1b[0m
  $ auto-gitmoji format "chore(deps): bump vite to 6.0"
    \x1b[90m→ ⬆️ chore(deps): bump vite to 6.0\x1b[0m
  $ auto-gitmoji format "ai: add rag embedding pipeline"
    \x1b[90m→ 🤖 ai: add rag embedding pipeline\x1b[0m
  $ auto-gitmoji hook install
    \x1b[90m→ Auto-formats commits across VS Code, JetBrains, Visual Studio, Neovim, etc.!\x1b[0m
`);
}

function findGitDir() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    return path.resolve(gitDir);
  } catch {
    return null;
  }
}

function getOptionsFromArgs(argList) {
  let outputFormat = 'emoji';
  let position = 'prefix';
  let enableScopeMatching = true;

  for (let i = 0; i < argList.length; i++) {
    if (argList[i] === '--format' && argList[i + 1]) {
      outputFormat = argList[i + 1];
    } else if (argList[i] === '--position' && argList[i + 1]) {
      position = argList[i + 1];
    } else if (argList[i] === '--no-scope') {
      enableScopeMatching = false;
    }
  }

  return { outputFormat, position, enableScopeMatching };
}

function handleFormat() {
  const options = getOptionsFromArgs(args);
  const remainingArgs = args.slice(1).filter(a => !a.startsWith('--'));

  if (remainingArgs.length > 0) {
    const message = remainingArgs.join(' ');
    console.log(formatCommitMessage(message, options));
    return;
  }

  // Check stdin
  if (!process.stdin.isTTY) {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      console.log(formatCommitMessage(input.trim(), options));
    });
    return;
  }

  console.error('\x1b[31mError: Please provide a commit message to format.\x1b[0m\nExample: auto-gitmoji format "feat: add login"');
  process.exit(1);
}

function handleHookRun(commitMsgFilePath) {
  if (!commitMsgFilePath || !fs.existsSync(commitMsgFilePath)) {
    process.exit(0);
  }

  try {
    const content = fs.readFileSync(commitMsgFilePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Find the first non-comment, non-empty line
    let targetIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#')) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex !== -1) {
      const originalLine = lines[targetIndex];
      const formatted = formatCommitMessage(originalLine);
      if (formatted !== originalLine) {
        lines[targetIndex] = formatted;
        fs.writeFileSync(commitMsgFilePath, lines.join('\n'), 'utf8');
      }
    }
  } catch (err) {
    // Fail silently in git hook so we never block commits
  }
}

function handleHookInstall(isGlobal) {
  const cliScriptPath = path.resolve(__dirname, 'auto-gitmoji.js').replace(/\\/g, '/');

  if (isGlobal) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const globalHooksDir = path.join(homeDir, '.git-templates', 'hooks');
    fs.mkdirSync(globalHooksDir, { recursive: true });

    const hookFile = path.join(globalHooksDir, 'prepare-commit-msg');
    const hookScript = `#!/bin/sh
# Auto Gitmoji Universal Hook (Global)
node "${cliScriptPath}" hook run "$1"
`;
    fs.writeFileSync(hookFile, hookScript, { mode: 0o755 });
    try {
      execSync(`git config --global core.hooksPath "${globalHooksDir.replace(/\\/g, '/')}"`);
      console.log(`\x1b[32m✔ Global Git hook installed successfully!\x1b[0m`);
      console.log(`\x1b[90mLocation: ${hookFile}\x1b[0m`);
      console.log(`\x1b[36mEvery Git repository on your machine in any IDE will now auto-format commit messages with Gitmoji!\x1b[0m`);
    } catch (e) {
      console.error(`\x1b[31mFailed to configure global hooks: ${e.message}\x1b[0m`);
    }
    return;
  }

  const gitDir = findGitDir();
  if (!gitDir) {
    console.error('\x1b[31mError: Not inside a Git repository. Run "git init" first or use --global.\x1b[0m');
    process.exit(1);
  }

  const hooksDir = path.join(gitDir, 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });

  const hookFile = path.join(hooksDir, 'prepare-commit-msg');
  const hookScript = `#!/bin/sh
# Auto Gitmoji Universal Hook (Repository)
node "${cliScriptPath}" hook run "$1"
`;

  fs.writeFileSync(hookFile, hookScript, { mode: 0o755 });
  console.log(`\x1b[32m✔ Git hook installed successfully in active repository!\x1b[0m`);
  console.log(`\x1b[90mLocation: ${hookFile}\x1b[0m`);
  console.log(`\x1b[36mCommit messages written in VS Code, JetBrains, Visual Studio, Neovim, Sublime, or Terminal will now automatically receive matching Gitmojis.\x1b[0m`);
}

function handleHookUninstall(isGlobal) {
  if (isGlobal) {
    try {
      execSync('git config --global --unset core.hooksPath');
      console.log('\x1b[32m✔ Global Git hook uninstalled.\x1b[0m');
    } catch {
      console.log('\x1b[33mNo global hook configuration found.\x1b[0m');
    }
    return;
  }

  const gitDir = findGitDir();
  if (!gitDir) {
    console.error('\x1b[31mError: Not inside a Git repository.\x1b[0m');
    process.exit(1);
  }

  const hookFile = path.join(gitDir, 'hooks', 'prepare-commit-msg');
  if (fs.existsSync(hookFile)) {
    fs.unlinkSync(hookFile);
    console.log('\x1b[32m✔ Repository Git hook uninstalled.\x1b[0m');
  } else {
    console.log('\x1b[33mNo hook file found at: ' + hookFile + '\x1b[0m');
  }
}

function handleList() {
  const mappings = loadMappings();
  const catArg = args.findIndex(a => a === '--category');
  const targetCat = catArg !== -1 ? args[catArg + 1] : null;
  const isJson = args.includes('--json');

  if (isJson) {
    const list = targetCat ? getMappingsByCategory(targetCat, mappings) : mappings;
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log(`\x1b[1m\x1b[36m✨ Available Gitmojis (${mappings.length} total)\x1b[0m\n`);

  const categories = getCategoryList(mappings);
  for (const cat of categories) {
    if (targetCat && cat.toLowerCase() !== targetCat.toLowerCase()) {
      continue;
    }
    console.log(`\x1b[1m\x1b[33m▶ ${cat}\x1b[0m`);
    const inCat = getMappingsByCategory(cat, mappings);
    for (const m of inCat) {
      console.log(`  ${m.gitmoji}  \x1b[32m${m.code.padEnd(26)}\x1b[0m \x1b[1m${m.name.padEnd(22)}\x1b[0m \x1b[90m${m.description}\x1b[0m`);
    }
    console.log('');
  }
}

function handleSearch(query) {
  if (!query) {
    console.error('\x1b[31mError: Please provide a search query.\x1b[0m\nExample: auto-gitmoji search ai');
    process.exit(1);
  }

  const results = filterMappings(query);
  console.log(`\x1b[1m\x1b[36mFound ${results.length} matching gitmojis for "${query}":\x1b[0m\n`);

  for (const m of results) {
    console.log(`  ${m.gitmoji}  \x1b[32m${m.code.padEnd(24)}\x1b[0m \x1b[1m${m.name.padEnd(20)}\x1b[0m [${m.category || 'Other'}]`);
    console.log(`     \x1b[90m${m.description}\x1b[0m`);
    console.log(`     \x1b[34mKeywords:\x1b[0m \x1b[90m${m.keywords.slice(0, 8).join(', ')}${m.keywords.length > 8 ? '...' : ''}\x1b[0m\n`);
  }
}

function handleCommit() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  (async () => {
    console.log('\x1b[1m\x1b[36m✨ Auto Gitmoji Interactive Commit Wizard\x1b[0m\n');
    console.log('\x1b[90mConventional types: feat, fix, docs, refactor, perf, test, chore, ai, security, style, revert\x1b[0m\n');

    const type = (await question('\x1b[1mCommit Type\x1b[0m (e.g. feat, fix, chore, ai): ')).trim();
    if (!type) {
      console.log('\x1b[31mAborted: commit type is required.\x1b[0m');
      rl.close();
      return;
    }

    const scope = (await question('\x1b[1mScope\x1b[0m (optional, e.g. auth, deps, ui): ')).trim();
    const msg = (await question('\x1b[1mMessage\x1b[0m: ')).trim();
    if (!msg) {
      console.log('\x1b[31mAborted: commit message is required.\x1b[0m');
      rl.close();
      return;
    }

    const rawCommit = scope ? `${type}(${scope}): ${msg}` : `${type}: ${msg}`;
    const formatted = formatCommitMessage(rawCommit);

    console.log(`\n\x1b[1mResult:\x1b[0m \x1b[32m${formatted}\x1b[0m\n`);
    const confirm = (await question('Proceed with git commit? [Y/n]: ')).trim().toLowerCase();
    rl.close();

    if (confirm === '' || confirm === 'y' || confirm === 'yes') {
      try {
        execSync(`git commit -m "${formatted.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      } catch (err) {
        console.error('\x1b[31mCommit failed.\x1b[0m');
      }
    } else {
      console.log('\x1b[33mCommit cancelled.\x1b[0m');
    }
  })();
}

function handleSetup(ide) {
  const target = ide ? ide.toLowerCase() : 'all';
  console.log(`\n\x1b[1m\x1b[36m✨ Auto Gitmoji Multi-IDE Setup Guide\x1b[0m\n`);

  if (target === 'all' || target === 'jetbrains' || target === 'intellij') {
    console.log(`\x1b[1m\x1b[33m[JetBrains IDEs: IntelliJ, WebStorm, PyCharm, GoLand, Rider]\x1b[0m`);
    console.log(`  Option 1: Universal Git Hook (Recommended)`);
    console.log(`    Run: \x1b[32mnpx auto-gitmoji hook install\x1b[0m`);
    console.log(`    The JetBrains Git Commit dialog automatically applies Gitmojis to every commit!\n`);
    console.log(`  Option 2: Live Templates`);
    console.log(`    Import \x1b[34mintegrations/jetbrains/Gitmoji.xml\x1b[0m into Settings → Editor → Live Templates`);
    console.log(`    Type \x1b[32mgfeat<tab>\x1b[0m or \x1b[32mgfix<tab>\x1b[0m for instant emojis.\n`);
  }

  if (target === 'all' || target === 'neovim' || target === 'vim') {
    console.log(`\x1b[1m\x1b[33m[Neovim / Vim]\x1b[0m`);
    console.log(`  Add \x1b[34mintegrations/neovim/lua/auto-gitmoji.lua\x1b[0m to your config:`);
    console.log(`  \x1b[32mrequire('auto-gitmoji').setup({ auto_format_on_save = true })\x1b[0m`);
    console.log(`  Commands: :AutoGitmojiFormat, :AutoGitmojiPick\n`);
  }

  if (target === 'all' || target === 'sublime') {
    console.log(`\x1b[1m\x1b[33m[Sublime Text / Sublime Merge]\x1b[0m`);
    console.log(`  Copy \x1b[34mintegrations/sublime/AutoGitmoji.py\x1b[0m to Packages/User/`);
    console.log(`  Press Ctrl+Alt+G / Cmd+Alt+G or use Command Palette: "Auto Gitmoji: Format Commit"\n`);
  }

  if (target === 'all' || target === 'visualstudio') {
    console.log(`\x1b[1m\x1b[33m[Visual Studio 2022]\x1b[0m`);
    console.log(`  Run: \x1b[32mnpx auto-gitmoji hook install\x1b[0m`);
    console.log(`  The Git Changes window in Visual Studio automatically formats via the Git hook.\n`);
  }

  if (target === 'all' || target === 'zed') {
    console.log(`\x1b[1m\x1b[33m[Zed Editor]\x1b[0m`);
    console.log(`  Import tasks from \x1b[34mintegrations/zed/tasks.json\x1b[0m or install the Git hook.\n`);
  }
}

// Router
switch (command) {
  case 'format':
    handleFormat();
    break;

  case 'hook': {
    const sub = args[1] ? args[1].toLowerCase() : '';
    const isGlobal = args.includes('--global');
    if (sub === 'install') {
      handleHookInstall(isGlobal);
    } else if (sub === 'uninstall') {
      handleHookUninstall(isGlobal);
    } else if (sub === 'run') {
      handleHookRun(args[2]);
    } else {
      console.log('Usage: auto-gitmoji hook [install|uninstall|run] [--global]');
    }
    break;
  }

  case 'commit':
    handleCommit();
    break;

  case 'search':
    handleSearch(args.slice(1).join(' '));
    break;

  case 'list':
    handleList();
    break;

  case 'setup':
    handleSetup(args[1]);
    break;

  case '-v':
  case '--version':
    console.log(pkg.version);
    break;

  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp();
    break;
}
