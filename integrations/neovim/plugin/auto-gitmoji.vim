" Auto Gitmoji vimscript entrypoint
if exists('g:loaded_auto_gitmoji')
  finish
endif
let g:loaded_auto_gitmoji = 1

command! -nargs=0 AutoGitmojiFormat lua require('auto-gitmoji').format_current_line()
command! -nargs=0 AutoGitmojiPick lua require('auto-gitmoji').pick_gitmoji()
