---
description: Review a UI component/page against the Mondial design system. Cheap, targeted.
argument-hint: <path or glob, e.g. src/components/homepage/HeroSection.tsx>
allowed-tools: Read, Grep, Glob
model: claude-haiku-4-5-20251001
---

Review $ARGUMENTS against these rules (from CLAUDE.md):

1. Zero hardcoded hex colors or `bg-[#...]` / `text-[#...]`. Flag every instance with file:line.
2. Icons: `lucide-react` only — flag `react-icons` imports.
3. Images: `next/image` only — flag `<img`.
4. Primitives: pages should use `components/ui/*` — flag raw `<button>`, `<input>`, `<a>` (allow `next/link` `<Link>`).
5. Dark mode: flag any component using fixed grays (`text-gray-800`, `bg-white`) without a dark: variant or theme token.
6. `"use client"` scope: if the file is "use client", check whether the interactivity is at a leaf that could be split out.
7. Accessibility: flag buttons without labels, images without alt, inputs without associated labels.

Output format — one table, no preamble:

| File:Line | Issue | Fix |
|---|---|---|

End with a 1-line verdict: "Clean" or "N issues — fix in order listed."

Do NOT rewrite the file. Do NOT explain the rules back. Do NOT paste code.
