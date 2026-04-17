---
description: Audit a page/component for perf issues specific to Next 16 + React 19.
argument-hint: <path, e.g. src/app/dashboard/creator/profile/page.tsx>
allowed-tools: Read, Grep, Glob
model: claude-haiku-4-5-20251001
---

Audit $ARGUMENTS for these perf issues (React Compiler is ON, so manual memo is usually WRONG):

1. Unnecessary `"use client"` — could this be a Server Component? If only a child needs state, recommend extracting.
2. Defensive `useMemo` / `useCallback` — React Compiler handles these. Flag each one and suggest removal unless used for referential stability in a non-React dep array.
3. Scroll / resize / mousemove handlers that `setState` directly — require `requestAnimationFrame` + `useTransition`.
4. Heavy client-only imports that aren't dynamic (`react-quill-new`, `@uiw/*`, chart libs). Recommend `next/dynamic` with `ssr: false`.
5. Raw `<img>` — must be `next/image`.
6. Large JSON / data files imported into client components — should fetch server-side.
7. `useEffect` with missing/incorrect deps or no cleanup on subscribe-style effects.
8. Synchronous parent re-renders caused by passing unstable props (inline object/array literals where it matters for deep children).

Output format — table, no preamble:

| File:Line | Severity (🔴/🟡/🟢) | Issue | Fix |
|---|---|---|---|

End with: "Est. bundle impact" in KB and "Est. CWV impact" (LCP/INP/CLS). Keep under 200 words total.
