#!/usr/bin/env python3
"""
Bulk converter for dashboard components to dark mode semantic tokens.
Run from project root.
"""
import re
import sys
from pathlib import Path

# ── Replacement rules ──
# Each rule: (pattern, replacement)
# Patterns are applied in order. More specific patterns first.

STRUCTURAL = [
    # Backgrounds (most specific first)
    (r'(?<![\w-])bg-white/90(?![\w-])', 'bg-dm-bg-primary/90'),
    (r'(?<![\w-])bg-white/80(?![\w-])', 'bg-dm-bg-primary/80'),
    (r'(?<![\w-])bg-white/60(?![\w-])', 'bg-dm-bg-primary/60'),
    (r'(?<![\w-])bg-white/40(?![\w-])', 'bg-dm-bg-primary/40'),
    (r'(?<![\w-])bg-white/25(?![\w-])', 'bg-dm-bg-primary/25'),
    (r'(?<![\w-])bg-white(?![\w-])', 'bg-dm-bg-primary'),

    (r'(?<![\w-])bg-gray-50/80(?![\w-])', 'bg-dm-bg-secondary/80'),
    (r'(?<![\w-])bg-gray-50/60(?![\w-])', 'bg-dm-bg-secondary/60'),
    (r'(?<![\w-])bg-gray-50/40(?![\w-])', 'bg-dm-bg-secondary/40'),
    (r'(?<![\w-])bg-gray-50(?![\w-])', 'bg-dm-bg-secondary'),
    (r'(?<![\w-])bg-gray-100(?![\w-])', 'bg-dm-bg-secondary'),
    (r'(?<![\w-])bg-gray-200(?![\w-])', 'bg-dm-bg-secondary'),

    (r'(?<![\w-])bg-slate-50/80(?![\w-])', 'bg-dm-bg-secondary/80'),
    (r'(?<![\w-])bg-slate-50/60(?![\w-])', 'bg-dm-bg-secondary/60'),
    (r'(?<![\w-])bg-slate-50/40(?![\w-])', 'bg-dm-bg-secondary/40'),
    (r'(?<![\w-])bg-slate-50(?![\w-])', 'bg-dm-bg-secondary'),
    (r'(?<![\w-])bg-slate-100(?![\w-])', 'bg-dm-bg-secondary'),
    (r'(?<![\w-])bg-slate-200(?![\w-])', 'bg-dm-bg-secondary'),

    # Borders
    (r'(?<![\w-])border-gray-200(?![\w-])', 'border-dm-border-primary'),
    (r'(?<![\w-])border-gray-100(?![\w-])', 'border-dm-border-secondary'),
    (r'(?<![\w-])border-gray-300(?![\w-])', 'border-dm-border-primary'),
    (r'(?<![\w-])border-slate-200(?![\w-])', 'border-dm-border-primary'),
    (r'(?<![\w-])border-slate-100(?![\w-])', 'border-dm-border-secondary'),
    (r'(?<![\w-])border-slate-300(?![\w-])', 'border-dm-border-primary'),
    (r'(?<![\w-])border-light-gray(?![\w-])', 'border-dm-border-primary'),

    # Text (gray)
    (r'(?<![\w-])text-gray-900(?![\w-])', 'text-dm-text-primary'),
    (r'(?<![\w-])text-gray-800(?![\w-])', 'text-dm-text-primary'),
    (r'(?<![\w-])text-gray-700(?![\w-])', 'text-dm-text-secondary'),
    (r'(?<![\w-])text-gray-600(?![\w-])', 'text-dm-text-secondary'),
    (r'(?<![\w-])text-gray-500(?![\w-])', 'text-dm-text-muted'),
    (r'(?<![\w-])text-gray-400(?![\w-])', 'text-dm-text-muted'),
    (r'(?<![\w-])text-gray-300(?![\w-])', 'text-dm-text-muted'),

    # Text (slate)
    (r'(?<![\w-])text-slate-900(?![\w-])', 'text-dm-text-primary'),
    (r'(?<![\w-])text-slate-800(?![\w-])', 'text-dm-text-primary'),
    (r'(?<![\w-])text-slate-700(?![\w-])', 'text-dm-text-secondary'),
    (r'(?<![\w-])text-slate-600(?![\w-])', 'text-dm-text-secondary'),
    (r'(?<![\w-])text-slate-500(?![\w-])', 'text-dm-text-muted'),
    (r'(?<![\w-])text-slate-400(?![\w-])', 'text-dm-text-muted'),
    (r'(?<![\w-])text-slate-300(?![\w-])', 'text-dm-text-muted'),

    # Text (misc)
    (r'(?<![\w-])text-medium-gray(?![\w-])', 'text-dm-text-secondary'),

    # Hover states
    (r'(?<![\w-])hover:bg-gray-50(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:bg-gray-100(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:bg-gray-200(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:bg-slate-50(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:bg-slate-100(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:bg-slate-200(?![\w-])', 'hover:bg-dm-bg-hover'),
    (r'(?<![\w-])hover:text-gray-800(?![\w-])', 'hover:text-dm-text-primary'),
    (r'(?<![\w-])hover:text-gray-900(?![\w-])', 'hover:text-dm-text-primary'),
    (r'(?<![\w-])hover:text-slate-800(?![\w-])', 'hover:text-dm-text-primary'),
    (r'(?<![\w-])hover:text-slate-900(?![\w-])', 'hover:text-dm-text-primary'),
]

SEMANTIC = [
    # Emerald
    (r'(?<![\w-])bg-emerald-50(?![\w-])', 'bg-emerald-50 dark:bg-emerald-950/30'),
    (r'(?<![\w-])text-emerald-600(?![\w-])', 'text-emerald-600 dark:text-emerald-400'),
    (r'(?<![\w-])text-emerald-700(?![\w-])', 'text-emerald-700 dark:text-emerald-300'),
    (r'(?<![\w-])text-emerald-800(?![\w-])', 'text-emerald-800 dark:text-emerald-300'),

    # Rose
    (r'(?<![\w-])bg-rose-50(?![\w-])', 'bg-rose-50 dark:bg-rose-950/30'),
    (r'(?<![\w-])text-rose-600(?![\w-])', 'text-rose-600 dark:text-rose-400'),

    # Amber
    (r'(?<![\w-])bg-amber-50(?![\w-])', 'bg-amber-50 dark:bg-amber-950/30'),
    (r'(?<![\w-])text-amber-500(?![\w-])', 'text-amber-500 dark:text-amber-400'),
    (r'(?<![\w-])text-amber-600(?![\w-])', 'text-amber-600 dark:text-amber-400'),
    (r'(?<![\w-])text-amber-700(?![\w-])', 'text-amber-700 dark:text-amber-300'),
    (r'(?<![\w-])text-amber-800(?![\w-])', 'text-amber-800 dark:text-amber-300'),
    (r'(?<![\w-])text-amber-900(?![\w-])', 'text-amber-900 dark:text-amber-200'),

    # Red
    (r'(?<![\w-])bg-red-50(?![\w-])', 'bg-red-50 dark:bg-red-950/30'),
    (r'(?<![\w-])bg-red-100(?![\w-])', 'bg-red-100 dark:bg-red-900/40'),
    (r'(?<![\w-])text-red-500(?![\w-])', 'text-red-500 dark:text-red-400'),
    (r'(?<![\w-])text-red-600(?![\w-])', 'text-red-600 dark:text-red-400'),
    (r'(?<![\w-])text-red-700(?![\w-])', 'text-red-700 dark:text-red-300'),
    (r'(?<![\w-])text-red-800(?![\w-])', 'text-red-800 dark:text-red-300'),
    (r'(?<![\w-])text-red-900(?![\w-])', 'text-red-900 dark:text-red-200'),

    # Green
    (r'(?<![\w-])bg-green-50(?![\w-])', 'bg-green-50 dark:bg-green-950/30'),
    (r'(?<![\w-])bg-green-100(?![\w-])', 'bg-green-100 dark:bg-green-900/40'),
    (r'(?<![\w-])text-green-600(?![\w-])', 'text-green-600 dark:text-green-400'),
    (r'(?<![\w-])text-green-700(?![\w-])', 'text-green-700 dark:text-green-300'),
    (r'(?<![\w-])text-green-800(?![\w-])', 'text-green-800 dark:text-green-300'),

    # Blue
    (r'(?<![\w-])bg-blue-50(?![\w-])', 'bg-blue-50 dark:bg-blue-950/30'),
    (r'(?<![\w-])bg-blue-100(?![\w-])', 'bg-blue-100 dark:bg-blue-900/40'),
    (r'(?<![\w-])text-blue-600(?![\w-])', 'text-blue-600 dark:text-blue-400'),
    (r'(?<![\w-])text-blue-700(?![\w-])', 'text-blue-700 dark:text-blue-300'),
    (r'(?<![\w-])text-blue-800(?![\w-])', 'text-blue-800 dark:text-blue-300'),

    # Yellow
    (r'(?<![\w-])bg-yellow-100(?![\w-])', 'bg-yellow-100 dark:bg-yellow-900/40'),
    (r'(?<![\w-])text-yellow-600(?![\w-])', 'text-yellow-600 dark:text-yellow-400'),
    (r'(?<![\w-])text-yellow-700(?![\w-])', 'text-yellow-700 dark:text-yellow-300'),
    (r'(?<![\w-])text-yellow-800(?![\w-])', 'text-yellow-800 dark:text-yellow-300'),

    # Orange
    (r'(?<![\w-])bg-orange-50(?![\w-])', 'bg-orange-50 dark:bg-orange-950/30'),
    (r'(?<![\w-])bg-orange-100(?![\w-])', 'bg-orange-100 dark:bg-orange-900/40'),
    (r'(?<![\w-])text-orange-600(?![\w-])', 'text-orange-600 dark:text-orange-400'),
    (r'(?<![\w-])text-orange-800(?![\w-])', 'text-orange-800 dark:text-orange-300'),

    # Indigo
    (r'(?<![\w-])bg-indigo-50(?![\w-])', 'bg-indigo-50 dark:bg-indigo-950/30'),
    (r'(?<![\w-])bg-indigo-100(?![\w-])', 'bg-indigo-100 dark:bg-indigo-900/40'),
    (r'(?<![\w-])text-indigo-500(?![\w-])', 'text-indigo-500 dark:text-indigo-400'),
    (r'(?<![\w-])text-indigo-600(?![\w-])', 'text-indigo-600 dark:text-indigo-400'),
    (r'(?<![\w-])text-indigo-700(?![\w-])', 'text-indigo-700 dark:text-indigo-300'),
    (r'(?<![\w-])text-indigo-800(?![\w-])', 'text-indigo-800 dark:text-indigo-300'),

    # Violet
    (r'(?<![\w-])bg-violet-50(?![\w-])', 'bg-violet-50 dark:bg-violet-950/30'),
    (r'(?<![\w-])text-violet-600(?![\w-])', 'text-violet-600 dark:text-violet-400'),

    # Cyan
    (r'(?<![\w-])bg-cyan-50(?![\w-])', 'bg-cyan-50 dark:bg-cyan-950/30'),
    (r'(?<![\w-])text-cyan-600(?![\w-])', 'text-cyan-600 dark:text-cyan-400'),
]

ALL_RULES = STRUCTURAL + SEMANTIC


def convert_file(path: Path) -> int:
    """Apply replacements to a single file. Returns number of changes."""
    content = path.read_text(encoding='utf-8')
    original = content

    for pattern, replacement in ALL_RULES:
        content = re.sub(pattern, replacement, content)

    if content != original:
        path.write_text(content, encoding='utf-8')
        return 1
    return 0


def main():
    target_dir = Path('src/features/dashboard')
    if not target_dir.exists():
        print(f"Directory not found: {target_dir}")
        sys.exit(1)

    files = list(target_dir.rglob('*.tsx'))
    changed = 0
    for f in files:
        changed += convert_file(f)

    print(f"Modified {changed}/{len(files)} files in {target_dir}")


if __name__ == '__main__':
    main()
