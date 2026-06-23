# MAIN SYNC REPORT

**Date:** 2026-06-22
**Repo:** `MondialECO/mondial_monorepo_fullstack` (origin = GitHub)
**Method:** Real `git` against your actual working tree's `.git` (fetched live). No assumptions.

---

## 1. Branch & commit state

| | |
|---|---|
| Current branch | `main` |
| Current HEAD | `9749b44` — "added all files at once - removed header" |
| Latest `origin/main` | `b2ea2ae` — "update business logic and UI for phase 3" |
| Position | **9 commits behind** origin/main, **0 ahead** |
| Relationship | **Clean fast-forward** (HEAD is an ancestor of origin/main) — no divergence |

## 2. Commits that main is ahead by (newest → oldest)

```
b2ea2ae update business logic and UI for phase 3
b22930f update phase 3
68463a2 update phase 3
d4a7f94 phase 2 done
a84562e update docker setup
63fe4a1 fix build error hook
d6669de fix build error
5b4a3ae fix entrepreneur phase 2 error
9ab9c65 fix jwt token error
```

These are **Phase 2 + Phase 3 (entrepreneur) business-logic/UI work**, a docker-setup change, two build-error fixes, a React-hook fix, and a **JWT-token fix**.

## 3. Files changed on main (HEAD → origin/main): **76 files, 0 deletions, 0 renames** (purely additive/modify)

By area:

| Area | Files |
|---|---|
| `backend/uploads` (artifacts, not code) | 28 |
| `src/app` | 9 |
| `backend/Services` | 7 |
| `src/components` | 6 |
| `backend/Models` | 3 |
| `src/lib` | 2 |
| `backend/tests` | 2 |
| `src/types`, `src/hooks` | 1 each |
| `backend/Controllers` (CompanyController.cs) | 1 |
| `backend/Program.cs`, `Middleware`, `DbContext`, `appsettings.json` | 1 each |
| docker/traefik, phase report `.md`s | several |

### Changed investor files
- **Frontend:** **none** under `src/app/dashboard/investor/**`, `src/components/investor`, `src/components/deals`, `src/lib/api-deals.ts`, or `src/types/deals.ts`. The only `src/lib` + `src/types` changes are **entrepreneur** files (`api-entrepreneur.ts`, `entrepreneur.ts`, `types/entrepreneur.ts`).
- **Backend (shared, affects investor surface):** `CompanyController.cs`, `CompanyDtos.cs`, `CompanyService.cs`, `Companies.cs`, `Phase3Models.cs`, `ICompanyService.cs`, `ValuationEngine.cs` + new `ValuationContext.cs`, `Phase3CompletionEvents.cs`, `PhaseValidator.cs`. (See `INVESTOR_API_DIFF_REPORT.md` — investor-facing contracts are unchanged.)

### Changed backend files (full)
`Controllers/CompanyController.cs`, `Models/DatabaseModels/Companies.cs`, `Models/DatabaseModels/Phase3Models.cs`, `Models/Dtos/CompanyDtos.cs`, `Services/CompanyService.cs`, `Services/ICompanyService.cs`, `Services/IValuationEngine.cs`, `Services/Implementations/ValuationEngine.cs`, `Services/Implementations/PhaseValidator.cs`, **new** `Services/Implementations/Phase3CompletionEvents.cs`, **new** `Services/ValuationContext.cs`, `Program.cs`, `Middleware/*`, `DbContext/*`, `appsettings.json`, `docker-compose.yml`, `traefik-dynamic.yml`, `backend/tests/*`.

## 4. Pull status — **NOT executed** (deliberate)

**Commits pulled: 0. Merge conflicts: none (no merge attempted).**

I did **not** run `git pull` on your real working tree, on purpose:

- The working tree has **744 uncommitted modified files** (heaviest: `frontend/src` 216 — the stale duplicate tree, `src/components` 104, `src/app` 85, docs, `src/lib`/`src/types`/`src/hooks`, plus live **investor UI WIP** like `OpportunityHeader.tsx`, `CapTableTabPanel.tsx`, term-sheet components).
- The 9 incoming commits touch backend + some `src/app`/`src/components` files that overlap those uncommitted edits, so a fast-forward pull would **abort** with "local changes would be overwritten" — or, if forced, **lose uncommitted work**.
- The frontend dev server is currently running off these files; pulling mid-run can break it.
- This is your real repo — a destructive sync without first understanding 744 local changes would be reckless.

### Safe sync procedure (for you to run — I can't type in your terminal)
1. Decide what to keep: `git status` → review the 744 changes. Much is IDE/CI noise (`.vs/`, `.vscode/`, `.claude/`, build artifacts) and the stale `frontend/` tree.
2. Commit or stash deliberately: `git add -A && git commit -m "WIP before main sync"` **or** `git stash push -u -m "pre-sync"`.
3. `git pull --ff-only origin main` (will fast-forward cleanly once the tree is clean).
4. If you stashed: `git stash pop` and resolve any conflicts in the investor/entrepreneur files.
5. Reinstall/rebuild as needed: `npm install`, `dotnet build`, then restart backend + frontend.

---

*Source: live `git fetch` + `git diff` against your repo. No fabricated values.*
