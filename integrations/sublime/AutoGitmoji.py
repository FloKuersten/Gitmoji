import sublime
import sublime_plugin
import subprocess
import re

MAPPINGS = [
    {"gitmoji": "✨", "code": ":sparkles:", "keywords": ["feat", "feature", "add", "implement"]},
    {"gitmoji": "🐛", "code": ":bug:", "keywords": ["fix", "bug", "hotfix", "patch", "repair"]},
    {"gitmoji": "📝", "code": ":memo:", "keywords": ["docs", "doc", "documentation", "readme"]},
    {"gitmoji": "🎨", "code": ":art:", "keywords": ["style", "format", "lint", "prettier"]},
    {"gitmoji": "♻️", "code": ":recycle:", "keywords": ["refactor", "cleanup", "clean"]},
    {"gitmoji": "⚡️", "code": ":zap:", "keywords": ["perf", "performance", "optimize", "speed"]},
    {"gitmoji": "🧪", "code": ":test_tube:", "keywords": ["test", "tests", "unit", "e2e"]},
    {"gitmoji": "🔧", "code": ":wrench:", "keywords": ["chore", "config", "settings", "env"]},
    {"gitmoji": "⬆️", "code": ":arrow_up:", "keywords": ["deps", "bump", "upgrade"]},
    {"gitmoji": "🤖", "code": ":robot:", "keywords": ["ai", "llm", "prompt", "agent", "copilot"]},
    {"gitmoji": "🔒️", "code": ":lock:", "keywords": ["security", "sec", "vuln", "cve"]},
    {"gitmoji": "🚀", "code": ":rocket:", "keywords": ["deploy", "release", "ship"]},
    {"gitmoji": "⏪️", "code": ":rewind:", "keywords": ["revert", "rollback"]},
    {"gitmoji": "🗂️", "code": ":card_index_dividers:", "keywords": ["monorepo", "workspace"]},
    {"gitmoji": "🧩", "code": ":jigsaw:", "keywords": ["plugin", "extension", "addon"]},
]

def format_message(text):
    if not text or not text.strip():
        return text

    # Try CLI if available
    try:
        proc = subprocess.Popen(
            ["auto-gitmoji", "format", text],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
        out, _ = proc.communicate(timeout=2)
        if proc.returncode == 0 and out:
            return out.decode("utf-8").strip()
    except Exception:
        pass

    # Built-in regex fallback
    match = re.match(r"^(\w+)(?:\(([^)]*)\))?(!)?:\s*", text)
    if match:
        kw = match.group(1).lower()
        scope = match.group(2).lower() if match.group(2) else None
        
        # Check scope if generic
        if scope and kw in ["chore", "build", "ci", "misc"]:
            for m in MAPPINGS:
                if scope in m["keywords"]:
                    return f"{m['gitmoji']} {text}"

        for m in MAPPINGS:
            if kw in m["keywords"]:
                return f"{m['gitmoji']} {text}"

    return text

class AutoGitmojiFormatCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        for region in self.view.sel():
            if region.empty():
                line_region = self.view.line(region)
                line_text = self.view.substr(line_region)
                new_text = format_message(line_text)
                if new_text != line_text:
                    self.view.replace(edit, line_region, new_text)
            else:
                selected_text = self.view.substr(region)
                new_text = format_message(selected_text)
                if new_text != selected_text:
                    self.view.replace(edit, region, new_text)

class AutoGitmojiPickCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        items = [f"{m['gitmoji']}  {m['code']} ({', '.join(m['keywords'][:3])})" for m in MAPPINGS]
        
        def on_done(index):
            if index != -1:
                selected = MAPPINGS[index]["gitmoji"]
                self.view.run_command("insert", {"characters": selected + " "})
                
        self.view.window().show_quick_panel(items, on_done)
