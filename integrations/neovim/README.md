# 🚀 Neovim / Vim Integration

Use **Auto Gitmoji & Docs** inside **Neovim** and **Vim**.

---

## Installation

### Using `lazy.nvim`:
```lua
{
  "FloKuersten/Gitmoji",
  dir = "path/to/Gitmoji/integrations/neovim", -- or from GitHub
  ft = { "gitcommit" },
  config = function()
    require("auto-gitmoji").setup({
      auto_format_on_save = true, -- formats COMMIT_EDITMSG upon save
      output_format = "emoji",    -- "emoji" or "code"
    })
  end,
  keys = {
    { "<leader>gf", "<cmd>AutoGitmojiFormat<cr>", desc = "Format with Gitmoji" },
    { "<leader>gp", "<cmd>AutoGitmojiPick<cr>", desc = "Pick Gitmoji" },
  }
}
```

### Alternatively (Zero Plugin Setup):
Install the Universal Git Hook:
```bash
npx auto-gitmoji hook install
```
When you run `git commit` in Neovim (or with `vim-fugitive` / `neogit`), the commit message is formatted automatically!
