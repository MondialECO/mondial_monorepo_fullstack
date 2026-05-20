---
description: Full design-system audit across the codebase. Delegates to a subagent.
allowed-tools: Task, Read, Grep, Glob
model: claude-sonnet-4-6
---

Run a design-system audit across `src/`. Delegate the scan to an `Explore` subagent so the findings don't bloat this context.

Subagent instructions:
> Thoroughness: medium. Check src/app/** and src/components/**. Produce a report with:
> 1. Hardcoded hex colors / `bg-[#..]` / `text-[#..]` (file:line, suggested token).
> 2. Raw `<img>` tags still present (file:line).
> 3. `react-icons` imports (file:line — should be lucide-react).
> 4. Raw `<button>`, `<input>`, `<a>` (not `<Link>`) in `app/` pages (file:line — suggest shadcn primitive).
> 5. Dark-mode gaps: components using fixed colors (`text-gray-*`, `bg-white`) without `dark:` variant.
> 6. Inconsistent spacing / radius (one-off values not on the Tailwind scale).
>
> Output as a markdown table grouped by category. Max 300 words.

After the subagent returns, produce a prioritized 5-item action list: top wins ordered by `impact / effort`. No code changes in this command — that's what `/cheap-edit` is for.
