# Entrepreneur Stabilization — Step 1 Build Verification Report

**Date:** 2026-06-10 · **Scope:** Entrepreneur only.

## What was run
- `next build` — **cannot run in this environment.** Only the Windows SWC binary is installed (`node_modules/@next/swc-win32-*`); there is **no Linux `@next/swc-linux-*`**, so `next build` cannot compile in the Linux sandbox. (Confirmed by inspection.)
- `tsc --noEmit --skipLibCheck -p tsconfig.json` — **runs** (TypeScript is pure JS), but reads through the **mounted filesystem**, which under `tsc`'s bulk concurrent reads returns **truncated/stale file content**. This produces *phantom* parser errors ("unterminated string literal", "JSX element has no closing tag") on files that are **actually intact** — verified by re-reading the same files through the authoritative file tools (e.g. `FinancialWidgets.tsx`, `phase-8/client.tsx` are complete on disk but `tsc`/bash saw them truncated). **So the sandbox `tsc` output is not trustworthy here.**
- `npm run lint` — not run (same mount-read unreliability; ESLint would read the same racing mount).

## Real issues found and FIXED (genuine, persisted on disk)
Two files were genuinely corrupted with a **trailing block of NUL bytes** appended after the valid code:
- `src/app/dashboard/entrepreneur/(phases)/phase-6/page.tsx` — 539 NUL bytes after line 423.
- `src/app/dashboard/entrepreneur/(phases)/phase-7/page.tsx` — 1673 NUL bytes after line 272.

**Root cause:** on this mounted filesystem, when a file is **rewritten shorter** (here: an `Edit` that *removed* a block — phase-6's duplicate stats card, phase-7's duplicate recommendations block), the leftover tail of the previous longer file is **not truncated — it is zero-padded**, leaving NUL bytes that break the TypeScript/Next parser (`TS1127 Invalid character`). This would have **broken the production build.**

**Fix applied:** stripped the trailing NULs, normalised CRLF→LF, truncated to exact length. Verified via the authoritative file tools that both files now end cleanly at their final `}` with **0 NUL bytes** remaining.

## State of the rest of the entrepreneur tree
- A full NUL scan of `src/app/dashboard/entrepreneur`, `src/components/entrepreneur`, `src/app/onboarding` found **no other corrupted files** (only the two above, now fixed).
- The Write-created components and additively-edited files (phase-3/4/5/8/9 clients, all `equity`/`deals`/`dataroom`/`phase3` widgets) are **intact on disk** per file-tools reads; the `tsc` errors against them were mount-read artifacts, not real defects.

## BUILD STATUS (honest)
- **Cannot be certified from this environment.** `next build` is impossible (no Linux SWC) and `tsc`/`eslint` read an unstable mount.
- **Two real build-breaking corruptions were found and fixed.** With those repaired and all other files confirmed intact, the project is expected to build, but this **must be confirmed by running `npm run build && npm run lint` on the developer's machine** (Windows, where SWC is present and the filesystem is stable).

## Important caveat for further stabilization work
The mount **actively corrupts file-shortening edits** (zero-padding) and **returns unreliable reads**. Steps 3 (completion screens) and 4 (dashboard finalization) require editing the flow/logic files (`phase-5/6/7` clients, `overview.tsx`). Performing those edits here — unable to run the build, on a mount that just corrupted two files — risks introducing the very instability this sprint exists to remove. **Recommended:** run the local build first to get an authoritative error list, then implement Steps 3–4 against a verified, stable checkout (each new file is a full `Write`, which is reliable; the risk is specifically in shortening-edits to existing logic files).

---

# Step 1b — Local build run (developer machine) + fix

**Local `npm run build` result:** ✓ Compiled successfully (101s) · ✓ TypeScript passed (35.3s) · ✓ page data collected — then **one** error, during static prerender/export:

```
Error occurred prerendering page "/onboarding/documents/income".
Error: Functions cannot be passed directly to Client Components unless you explicitly
expose it by marking it with "use server"... {$$typeof, render, displayName}
```

This confirms: **the phase-6/7 NUL fixes worked** (TS compiled clean), there are **no TS / import / API-contract / route errors**, and the only blocker is one Next.js issue.

## Error classification + fix
| Error | Type | Cause | Fix |
|---|---|---|---|
| Prerender of `/onboarding/documents/income` (+ `license`, `residence`, `tax`) | **Next.js (RSC serialization)** | Each page was a **Server Component** importing a lucide icon and passing it as `icon={Icon}` (a `forwardRef` component = function) to the **Client Component** `DocumentUploadStep`. React can't serialize a component across the server→client boundary during static prerender. | Added **`'use client'`** to all four pages so the icon is passed within the client boundary. No redesign, no refactor, no prop/contract change. |

**Files modified (4, additive one-line prepend):** `src/app/onboarding/documents/{income,license,residence,tax}/page.tsx`.
- The build exits on the first prerender error (only `income` was reported), but `license`/`residence`/`tax` share the identical pattern and would fail next — all four fixed in one pass.
- The other five onboarding pages (`email`, `identity`, `phone`, `complete`, root `page`) were **already `'use client'`** — no change needed.
- **No entrepreneur dashboard/phase file touched** (these are universal Phase-1 onboarding document pages).

## BUILD CLEAN REPORT
- **Build status:** the one reported prerender error (and its 3 identical siblings) is **fixed**. Compilation + TypeScript were already green. **Re-run `npm run build` to confirm fully green** (the build aborts on the first error, so a clean pass must be reconfirmed locally).
- **Lint status:** no ESLint errors were present in the provided output. (Re-run `npm run lint` to confirm; nothing in scope to fix.)
- **Remaining warnings:** `npm audit` reports 8 dependency vulnerabilities (1 low / 5 moderate / 2 critical). These are **dependency advisories, not build errors** — out of scope for this sprint (don't `audit fix` without a deliberate dependency review).
- **Entrepreneur impact:** **none** — no entrepreneur route/component/contract changed. The Phase-1 onboarding document pages (supplementary KYC docs) now prerender correctly, which keeps the journey entry intact.

---

# Step 1c — BUILD CLEAN REPORT (build now GREEN)

**Local `npm run build`:** ✅ **GREEN** — ✓ Compiled (38.3s) · ✓ TypeScript (26.5s) · ✓ **71/71 static pages generated** · all entrepreneur routes built (`/dashboard/entrepreneur` + `phase-1…phase-10` + `deals`/`messages`). The earlier onboarding prerender error is gone.

**Local `npm run lint`:** **142 problems = 1 error + 141 warnings.** The single **error** is the only real defect; fixed.

## The one ESLint error — fixed
| Error | Type | File | Cause | Fix |
|---|---|---|---|---|
| `Cannot reassign variable after render completes` (`react-hooks/immutability`) | **ESLint (React Compiler)** | `src/components/entrepreneur/equity/EquityWidgets.tsx:55` | `OwnershipDonut` reassigned a `let acc` inside the segment `.map()` during render (to accumulate the donut start-offset). The React Compiler forbids in-render reassignment. | Moved the cumulative-offset computation into a **module-scope helper** `cumulativeStarts(data)` (a plain function, where `let` is allowed) and read `starts[i]` purely in the map. **No visual/behavioral change** — the donut renders identically. |

Verified: 0 remaining `acc` references; the only error was in a file I authored; no other source error existed.

## Warnings (141 — NOT fixed, by instruction "fix ONLY real errors")
All are non-blocking lint **warnings**, none in the components built this program:
- `@typescript-eslint/no-unused-vars` (unused imports/vars), `@next/next/no-img-element` + `jsx-a11y/alt-text` (raw `<img>`), `react-hooks/exhaustive-deps`, `import/no-anonymous-default-export`, unused `eslint-disable`.
- **~half are duplicates from the dead `frontend/` tree** still being linted (`frontend/src/...` mirrors `src/...`). Deleting `frontend/` (already a pending Wave-0 SAFE-DELETE) would roughly halve the warning count.
- The entrepreneur warnings in `src/` are pre-existing unused-import noise (`phase-3/page` `Zap`, `phase-2/step-1` `Button`, `ProgressSidebar`, `RouteGuard` unused props, `menu.ts` `Briefcase`, etc.) — cosmetic, out of scope (no refactor / don't touch unrelated files).

## Final status
- **Build status:** ✅ GREEN (compiles, TypeScript passes, all 71 pages prerender).
- **Lint status:** ✅ **0 errors** after the `EquityWidgets` fix (re-run `npm run lint` to confirm); 141 non-blocking warnings remain (out of scope).
- **Remaining warnings:** 141, cosmetic; ~half from the dead `frontend/` tree.
- **Entrepreneur impact:** one internal, behavior-neutral fix to the ownership-donut offset math; nothing else changed.

**Total fixes across Step 1:** phase-6/phase-7 NUL corruption (build-breaking) + 4 onboarding pages `'use client'` (prerender) + 1 `EquityWidgets` immutability error (lint). **Build is green; stopping here per the stop condition.**

