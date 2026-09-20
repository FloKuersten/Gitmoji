const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, '..', 'extension', 'data', 'gitmoji-map.json');
const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const CATEGORY_MAP = {
  art: 'Refactoring & Hygiene',
  zap: 'Performance',
  fire: 'Refactoring & Hygiene',
  bug: 'Fixes & Bugs',
  ambulance: 'Fixes & Bugs',
  sparkles: 'Features',
  memo: 'Documentation',
  rocket: 'DevOps & CI/CD',
  lipstick: 'UI, UX & Design',
  tada: 'Git & Repository',
  'white-check-mark': 'Testing',
  lock: 'Security & Auth',
  'closed-lock-with-key': 'Security & Auth',
  bookmark: 'Git & Repository',
  'rotating-light': 'Fixes & Bugs',
  construction: 'Features',
  'green-heart': 'DevOps & CI/CD',
  'arrow-down': 'Dependencies',
  'arrow-up': 'Dependencies',
  pushpin: 'Dependencies',
  'construction-worker': 'DevOps & CI/CD',
  'chart-with-upwards-trend': 'Data, AI & Analytics',
  recycle: 'Refactoring & Hygiene',
  'heavy-plus-sign': 'Dependencies',
  'heavy-minus-sign': 'Dependencies',
  wrench: 'Architecture & Infra',
  hammer: 'Architecture & Infra',
  'globe-with-meridians': 'UI, UX & Design',
  pencil2: 'Fixes & Bugs',
  poop: 'Refactoring & Hygiene',
  rewind: 'Git & Repository',
  'twisted-rightwards-arrows': 'Git & Repository',
  package: 'Dependencies',
  alien: 'Architecture & Infra',
  truck: 'Git & Repository',
  'page-facing-up': 'Documentation',
  boom: 'Features',
  bento: 'UI, UX & Design',
  wheelchair: 'UI, UX & Design',
  bulb: 'Documentation',
  beers: 'Git & Repository',
  'speech-balloon': 'UI, UX & Design',
  'card-file-box': 'Data, AI & Analytics',
  'loud-sound': 'DevOps & CI/CD',
  mute: 'DevOps & CI/CD',
  'busts-in-silhouette': 'Git & Repository',
  'children-crossing': 'UI, UX & Design',
  'building-construction': 'Architecture & Infra',
  iphone: 'UI, UX & Design',
  'clown-face': 'Testing',
  egg: 'Features',
  'see-no-evil': 'Git & Repository',
  'camera-flash': 'Testing',
  alembic: 'Testing',
  mag: 'UI, UX & Design',
  label: 'Architecture & Infra',
  seedling: 'Data, AI & Analytics',
  'triangular-flag-on-post': 'Features',
  'goal-net': 'Fixes & Bugs',
  dizzy: 'UI, UX & Design',
  wastebasket: 'Refactoring & Hygiene',
  'passport-control': 'Security & Auth',
  'adhesive-bandage': 'Fixes & Bugs',
  'monocle-face': 'Data, AI & Analytics',
  coffin: 'Refactoring & Hygiene',
  'test-tube': 'Testing',
  necktie: 'Features',
  stethoscope: 'DevOps & CI/CD',
  bricks: 'Architecture & Infra',
  technologist: 'Architecture & Infra',
  'money-with-wings': 'Git & Repository',
  thread: 'Architecture & Infra',
  'safety-vest': 'Testing',
  airplane: 'Features',
  't-rex': 'Architecture & Infra'
};

const EXTRA_KEYWORDS = {
  art: ['biome', 'ruff', 'black', 'codestyle', 'beautify'],
  zap: ['latency', 'speedup', 'boost', 'caching', 'memoise'],
  fire: ['prune', 'strip', 'purge'],
  bug: ['resolve', 'resolved', 'fixup', 'bugfix', 'repair'],
  ambulance: ['emergency', 'urgent', 'sev1', 'blocker'],
  sparkles: ['implement', 'introduce'],
  memo: ['docstring', 'guide', 'changelog', 'manual'],
  lipstick: ['tailwind', 'darkmode', 'lightmode', 'sass', 'scss', 'typography'],
  package: ['crates', 'dist', 'artifact', 'artifacts'],
  'card-file-box': ['sql', 'prisma', 'drizzle', 'orm', 'postgres', 'mysql', 'sqlite', 'mongodb'],
  'passport-control': ['rbac', 'jwt', 'token', 'session', 'oauth'],
  bricks: ['dockerfile', 'compose', 'kustomize'],
  'test-tube': ['vitest', 'jest', 'playwright', 'cypress', 'unit-test', 'e2e-test', 'integration-test'],
  'construction-worker': ['github-actions', 'circleci', 'jenkins'],
  'globe-with-meridians': ['multilingual', 'locales', 'l10n-update']
};

const NEW_GITMOJIS = [
  {
    keywords: ['robot', 'ai', 'llm', 'prompt', 'prompts', 'agent', 'agents', 'copilot', 'gpt', 'model', 'ml', 'machinelearning', 'embedding', 'rag'],
    gitmoji: '🤖',
    code: ':robot:',
    name: 'robot',
    description: 'AI, LLM prompts, model integrations, and agent workflows.',
    category: 'Data, AI & Analytics',
    semver: 'minor'
  },
  {
    keywords: ['jigsaw', 'plugin', 'plugins', 'extension', 'extensions', 'addon', 'addons', 'module', 'modular'],
    gitmoji: '🧩',
    code: ':jigsaw:',
    name: 'jigsaw',
    description: 'Add or update plugins, extensions, or modular features.',
    category: 'Architecture & Infra',
    semver: 'minor'
  },
  {
    keywords: ['card-index-dividers', 'monorepo', 'workspace', 'workspaces', 'pnpm-workspace', 'turbo', 'turborepo', 'nx', 'lerna'],
    gitmoji: '🗂️',
    code: ':card_index_dividers:',
    name: 'card-index-dividers',
    description: 'Manage monorepos, subprojects, and workspace configurations.',
    category: 'Architecture & Infra',
    semver: null
  },
  {
    keywords: ['shield', 'audit', 'compliance', 'policy', 'cve-patch', 'hardening', 'vulnerability-fix'],
    gitmoji: '🛡️',
    code: ':shield:',
    name: 'shield',
    description: 'Security audits, compliance policies, and system hardening.',
    category: 'Security & Auth',
    semver: 'patch'
  },
  {
    keywords: ['magic-wand', 'codegen', 'generate', 'generator', 'scaffold-gen', 'macro', 'automation'],
    gitmoji: '🪄',
    code: ':magic_wand:',
    name: 'magic-wand',
    description: 'Code generation, template synthesis, and developer automations.',
    category: 'Architecture & Infra',
    semver: 'minor'
  },
  {
    keywords: ['electric-plug', 'mcp', 'webhook', 'webhooks', 'external-service', 'adapter', 'connector'],
    gitmoji: '🔌',
    code: ':electric_plug:',
    name: 'electric-plug',
    description: 'Connect external services, webhooks, or Model Context Protocol (MCP) servers.',
    category: 'Architecture & Infra',
    semver: 'minor'
  },
  {
    keywords: ['broom', 'tidy', 'hygiene', 'tidyup', 'housekeeping', 'code-hygiene'],
    gitmoji: '🧹',
    code: ':broom:',
    name: 'broom',
    description: 'Routine code hygiene, housekeeping, and tidying up.',
    category: 'Refactoring & Hygiene',
    semver: null
  },
  {
    keywords: ['arrows-counterclockwise', 'sync', 'synchronize', 'rebase', 'upstream', 'pull-upstream'],
    gitmoji: '🔄',
    code: ':arrows_counterclockwise:',
    name: 'arrows-counterclockwise',
    description: 'Synchronize with upstream, rebase branches, or refresh mirrors.',
    category: 'Git & Repository',
    semver: null
  },
  {
    keywords: ['bar-chart', 'dashboard', 'grafana', 'opentelemetry', 'otel', 'datadog', 'prometheus', 'reporting'],
    gitmoji: '📊',
    code: ':bar_chart:',
    name: 'bar-chart',
    description: 'Add or update dashboards, reporting, or OpenTelemetry metrics.',
    category: 'Data, AI & Analytics',
    semver: null
  },
  {
    keywords: ['dart', 'target', 'precision', 'strict', 'scope-fix'],
    gitmoji: '🎯',
    code: ':dart:',
    name: 'dart',
    description: 'Pinpoint accuracy, targeted fix, or strict typing constraint.',
    category: 'Fixes & Bugs',
    semver: 'patch'
  }
];

// Filter out NEW_GITMOJIS from previous runs
const baseMappings = raw.mappings.filter(m => !NEW_GITMOJIS.some(n => n.name === m.name));

// Update existing mappings
const updatedMappings = baseMappings.map(mapping => {
  const name = mapping.name;
  const category = CATEGORY_MAP[name] || 'Other';
  const extras = EXTRA_KEYWORDS[name] || [];
  
  // Combine unique keywords preserving order
  const existingLower = new Set(mapping.keywords.map(k => k.toLowerCase()));
  const newKeywords = [...mapping.keywords];
  for (const kw of extras) {
    if (!existingLower.has(kw.toLowerCase())) {
      newKeywords.push(kw);
      existingLower.add(kw.toLowerCase());
    }
  }

  return {
    keywords: newKeywords,
    gitmoji: mapping.gitmoji,
    code: mapping.code,
    name: mapping.name,
    description: mapping.description,
    category,
    semver: mapping.semver
  };
});

// Append new entries if not already present
for (const newEntry of NEW_GITMOJIS) {
  if (!updatedMappings.some(m => m.name === newEntry.name)) {
    updatedMappings.push(newEntry);
  }
}

const finalData = {
  version: 4,
  mappings: updatedMappings
};

fs.writeFileSync(mapPath, JSON.stringify(finalData, null, 2) + '\n', 'utf8');
console.log(`Updated gitmoji-map.json: ${updatedMappings.length} total entries.`);
