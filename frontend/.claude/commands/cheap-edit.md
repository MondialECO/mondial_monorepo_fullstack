---
description: Make a small, surgical edit with Haiku — no re-reads, no preamble, no tests.
argument-hint: <describe the change in one sentence>
allowed-tools: Read, Edit, Grep, Glob
model: claude-haiku-4-5-20251001
---

Task: $ARGUMENTS

Rules:
- Use Grep/Glob to find the target. At most ONE Read call before editing.
- Use `Edit` with the smallest possible `old_string` / `new_string` diff.
- Do NOT re-read the file after editing.
- Do NOT run tests, lint, or build.
- Do NOT explain the change beyond a single line: "Edited <path>: <what changed>."
- If the task is ambiguous or spans >2 files, STOP and ask 1 question instead.
