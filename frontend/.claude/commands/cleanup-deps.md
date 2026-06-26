---
description: Remove unused/redundant dependencies from package.json.
allowed-tools: Read, Edit, Grep, Glob, Bash(git diff:*), Bash(git status:*)
model: claude-haiku-4-5-20251001
---

Remove unused deps from `package.json`. Candidates flagged in CLAUDE.md:
- `wouter` (Next.js native routing is used everywhere)
- `react-icons` (lucide-react is the standard)
- `@uiw/react-md-editor` (unused; react-quill-new is the editor)
- `marked` (unused)

Steps:
1. For each candidate, run a Grep for its import/package name across `src/`. If ZERO hits, remove from `package.json`.
2. If any candidate is actually used, keep it and report which file uses it.
3. After edits, show the `git diff` of `package.json` only.
4. Report: "Removed N deps: [list]. Estimated bundle save: ~X KB." Do NOT run `npm install`.
