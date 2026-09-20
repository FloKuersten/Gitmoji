-- ✨ Auto Gitmoji & Docs for Neovim
-- Native Lua plugin providing automatic commit message formatting and gitmoji picker

local M = {}

local default_opts = {
  auto_format_on_save = true,
  output_format = "emoji", -- "emoji" or "code"
  position = "prefix",     -- "prefix" or "after-type"
  enable_scope_matching = true,
}

M.options = vim.deepcopy(default_opts)

-- Fallback essential gitmoji dictionary if CLI is not present
M.mappings = {
  { emoji = "✨", code = ":sparkles:", name = "sparkles", keywords = { "feat", "feature", "add" }, desc = "Introduce new features" },
  { emoji = "🐛", code = ":bug:", name = "bug", keywords = { "fix", "bug", "hotfix", "patch" }, desc = "Fix a bug" },
  { emoji = "📝", code = ":memo:", name = "memo", keywords = { "docs", "doc", "documentation", "readme" }, desc = "Add or update documentation" },
  { emoji = "🎨", code = ":art:", name = "art", keywords = { "style", "format", "lint", "prettier" }, desc = "Improve structure/format" },
  { emoji = "♻️", code = ":recycle:", name = "recycle", keywords = { "refactor", "cleanup", "clean" }, desc = "Refactor code" },
  { emoji = "⚡️", code = ":zap:", name = "zap", keywords = { "perf", "performance", "optimize", "speed" }, desc = "Improve performance" },
  { emoji = "🧪", code = ":test_tube:", name = "test-tube", keywords = { "test", "tests", "unit", "e2e" }, desc = "Add or update tests" },
  { emoji = "🔧", code = ":wrench:", name = "wrench", keywords = { "chore", "config", "env" }, desc = "Configuration or chore" },
  { emoji = "⬆️", code = ":arrow_up:", name = "arrow-up", keywords = { "deps", "bump", "upgrade" }, desc = "Upgrade dependencies" },
  { emoji = "🤖", code = ":robot:", name = "robot", keywords = { "ai", "llm", "prompt", "agent" }, desc = "AI, LLM prompts and agents" },
  { emoji = "🔒️", code = ":lock:", name = "lock", keywords = { "sec", "security", "vuln" }, desc = "Fix security issues" },
  { emoji = "🚀", code = ":rocket:", name = "rocket", keywords = { "deploy", "release", "ship" }, desc = "Deploy stuff" },
  { emoji = "⏪️", code = ":rewind:", name = "rewind", keywords = { "revert", "rollback" }, desc = "Revert changes" },
  { emoji = "👷", code = ":construction_worker:", name = "construction-worker", keywords = { "ci", "build", "gha" }, desc = "CI build system" },
}

function M.format_text(text)
  if not text or text:match("^%s*$") then
    return text
  end

  -- Check if already starts with emoji or code
  if text:match("^:[%w_+-]+:") or text:match("^%p") then
    -- simple check; CLI has full Unicode regex
  end

  -- Try calling auto-gitmoji CLI if installed for 100% full dictionary
  if vim.fn.executable("auto-gitmoji") == 1 then
    local cmd = string.format("auto-gitmoji format %s", vim.fn.shellescape(text))
    local output = vim.fn.system(cmd)
    if vim.v.shell_error == 0 and output and output ~= "" then
      return vim.trim(output)
    end
  end

  -- Pure Lua fallback matching
  local type_kw, scope = text:match("^([%w_-]+)%(([^)]*)%)%!?%:%s*")
  if not type_kw then
    type_kw = text:match("^([%w_-]+)%!?%:%s*")
  end
  if not type_kw then
    type_kw = text:match("^([%w_-]+)")
  end

  if not type_kw then
    return text
  end

  local token = nil
  -- Check scope if generic
  if scope and (type_kw == "chore" or type_kw == "build" or type_kw == "ci") then
    for _, item in ipairs(M.mappings) do
      for _, kw in ipairs(item.keywords) do
        if kw == scope:lower() then
          token = (M.options.output_format == "code") and item.code or item.emoji
          break
        end
      end
      if token then break end
    end
  end

  if not token then
    for _, item in ipairs(M.mappings) do
      for _, kw in ipairs(item.keywords) do
        if kw == type_kw:lower() then
          token = (M.options.output_format == "code") and item.code or item.emoji
          break
        end
      end
      if token then break end
    end
  end

  if token then
    return token .. " " .. text
  end

  return text
end

function M.format_current_line()
  local line = vim.api.nvim_get_current_line()
  local formatted = M.format_text(line)
  if formatted ~= line then
    vim.api.nvim_set_current_line(formatted)
  end
end

function M.pick_gitmoji()
  local items = {}
  for _, item in ipairs(M.mappings) do
    table.insert(items, string.format("%s  %-20s %s", item.emoji, item.code, item.desc))
  end

  vim.ui.select(items, { prompt = "Select Gitmoji: " }, function(choice, idx)
    if choice and idx then
      local selected = M.mappings[idx]
      local token = (M.options.output_format == "code") and selected.code or selected.emoji
      local row, col = unpack(vim.api.nvim_win_get_cursor(0))
      local line = vim.api.nvim_get_current_line()
      local new_line = line:sub(1, col) .. token .. " " .. line:sub(col + 1)
      vim.api.nvim_set_current_line(new_line)
    end
  end)
end

function M.setup(opts)
  M.options = vim.tbl_deep_extend("force", M.options, opts or {})

  vim.api.nvim_create_user_command("AutoGitmojiFormat", function()
    M.format_current_line()
  end, { desc = "Format current line with Auto Gitmoji" })

  vim.api.nvim_create_user_command("AutoGitmojiPick", function()
    M.pick_gitmoji()
  end, { desc = "Pick and insert a Gitmoji" })

  if M.options.auto_format_on_save then
    local group = vim.api.nvim_create_augroup("AutoGitmoji", { clear = true })
    vim.api.nvim_create_autocmd("BufWritePre", {
      group = group,
      pattern = { "COMMIT_EDITMSG", "*.git/COMMIT_EDITMSG" },
      callback = function()
        local lines = vim.api.nvim_buf_get_lines(0, 0, 1, false)
        if #lines > 0 and lines[1] and not lines[1]:match("^#") then
          lines[1] = M.format_text(lines[1])
          vim.api.nvim_buf_set_lines(0, 0, 1, false, lines)
        end
      end,
    })
  end
end

return M
