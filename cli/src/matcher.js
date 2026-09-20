const fs = require('fs');
const path = require('path');

let cachedMappings = null;

function loadMappings() {
  if (cachedMappings) {
    return cachedMappings;
  }
  const dataPath = path.join(__dirname, '..', 'data', 'gitmoji-map.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  cachedMappings = raw.mappings;
  return cachedMappings;
}

const EMOJI_PREFIX = /^(?:\p{Extended_Pictographic}|[0-9#*]\uFE0F?\u20E3)/u;
const CODE_PREFIX = /^:[a-z0-9_+-]+:/i;
const CONVENTIONAL_PREFIX = /^(\w+)(\([^)]*\))?(!)?:\s*/;

function hasLeadingGitmoji(text) {
  const trimmed = text.trimStart();
  if (!trimmed) {
    return false;
  }
  return EMOJI_PREFIX.test(trimmed) || CODE_PREFIX.test(trimmed);
}

function extractCommitKeyword(message) {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }
  const conventional = trimmed.match(CONVENTIONAL_PREFIX);
  if (conventional) {
    return conventional[1];
  }
  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[!?:,.]+$/, '');
  return firstWord || null;
}

function extractCommitScope(message) {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }
  const conventional = trimmed.match(CONVENTIONAL_PREFIX);
  if (conventional && conventional[2]) {
    return conventional[2].replace(/^\(|\)$/g, '').trim();
  }
  return null;
}

function findMapping(token, mappings) {
  const lower = token.toLowerCase().replace(/^:|:$/g, '');
  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => kw.toLowerCase() === lower)) {
      return mapping;
    }
    if (mapping.name?.toLowerCase() === lower) {
      return mapping;
    }
    if (mapping.code?.toLowerCase().replace(/^:|:$/g, '') === lower) {
      return mapping;
    }
  }
  return undefined;
}

function matchGitmoji(text, mappings = loadMappings(), enableScopeMatching = true) {
  if (hasLeadingGitmoji(text)) {
    return null;
  }

  const keyword = extractCommitKeyword(text);
  if (!keyword) {
    return null;
  }

  const typeMapping = findMapping(keyword, mappings);

  if (enableScopeMatching) {
    const scope = extractCommitScope(text);
    if (scope) {
      const scopeMapping = findMapping(scope, mappings);
      if (scopeMapping) {
        const genericTypes = new Set(['chore', 'build', 'ci', 'misc', 'other', 'repo']);
        if (!typeMapping || genericTypes.has(keyword.toLowerCase())) {
          return scopeMapping;
        }
      }
    }
  }

  return typeMapping ?? null;
}

function formatToken(mapping, outputFormat = 'emoji') {
  if (outputFormat === 'code') {
    if (mapping.code?.trim()) {
      return mapping.code.trim();
    }
    if (mapping.name?.trim()) {
      return `:${mapping.name.trim()}:`;
    }
  }
  return mapping.gitmoji;
}

function applyPosition(message, token, position) {
  if (position === 'after-type') {
    const conventional = message.match(CONVENTIONAL_PREFIX);
    if (conventional) {
      const prefix = conventional[0];
      return `${prefix}${token} ${message.slice(prefix.length)}`;
    }
  }
  return `${token} ${message}`;
}

function formatCommitMessage(
  message,
  options = {}
) {
  const {
    position = 'prefix',
    outputFormat = 'emoji',
    enableScopeMatching = true,
    mappings = loadMappings()
  } = options;

  const trimmed = message.trim();
  if (!trimmed || hasLeadingGitmoji(trimmed)) {
    return message;
  }

  const mapping = matchGitmoji(trimmed, mappings, enableScopeMatching);
  if (!mapping) {
    return message;
  }

  return applyPosition(trimmed, formatToken(mapping, outputFormat), position);
}

function filterMappings(filter, mappings = loadMappings()) {
  const needle = filter.toLowerCase().replace(/^:|:$/g, '');
  if (!needle) {
    return mappings;
  }
  return mappings.filter((mapping) => {
    if (mapping.name?.toLowerCase().includes(needle)) {
      return true;
    }
    if (mapping.code?.toLowerCase().includes(needle)) {
      return true;
    }
    if (mapping.description?.toLowerCase().includes(needle)) {
      return true;
    }
    if (mapping.category?.toLowerCase().includes(needle)) {
      return true;
    }
    return mapping.keywords.some((keyword) =>
      keyword.toLowerCase().includes(needle)
    );
  });
}

function getCategoryList(mappings = loadMappings()) {
  const categories = new Set();
  for (const m of mappings) {
    if (m.category) {
      categories.add(m.category);
    }
  }
  return Array.from(categories).sort();
}

function getMappingsByCategory(category, mappings = loadMappings()) {
  return mappings.filter(
    (m) => m.category?.toLowerCase() === category.toLowerCase()
  );
}

module.exports = {
  loadMappings,
  hasLeadingGitmoji,
  extractCommitKeyword,
  extractCommitScope,
  matchGitmoji,
  formatCommitMessage,
  filterMappings,
  getCategoryList,
  getMappingsByCategory
};
