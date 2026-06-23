# MAIN SYNC EXECUTION PLAN

**Date:** 2026-06-22
**State:** branch `main`, HEAD `9749b44`, **9 commits behind** `origin/main` `b2ea2ae` (clean fast-forward), **747 uncommitted working-tree changes**.
**Method:** real `git status` / `git diff` + set intersection with the 76 files changed on main. No destructive command was run.

---

## 1. CLASSIFICATION OF THE 747 LOCAL CHANGES

| Class | Count | Paths | Recommendation |
|---|---|---|---|
| **SAFE TO DISCARD** (generated/IDE) | ~23 | `.vs/`, `.vscode/`, `.claude/`, `.next/`, `bin/`, `obj/` | Don't commit. Add to `.gitignore`; `git checkout --` or let pull overwrite. |
| **SAFE TO DISCARD** (stale duplicate tree) | ~280 | `frontend/**` (the obsolete second copy of the app — not the running app, already excluded from tsconfig) | Discard; ideally delete `frontend/` entirely in a separate commit. |
| **LIKELY GENERATED / low-risk** | ~104 | `docs/**` (75, incl. the many audit/report `.md`s), `public/**` assets (29) | Review briefly; most are generated reports. Commit or discard deliberately. |
| **USER WORK** (active app source) | ~262 | `src/**` (components/app/lib/types/hooks) — includes the investor UI WIP and my prior build-gate fixes | **Keep.** Commit before syncing. |
| **USER WORK** (backend source) | ~18 | `backend/**` (Models, etc.) | **Keep.** Commit before syncing. |
| **HIGH RISK** (local edit ∧ changed on main) | **22** | see below | **Conflict-prone** — must be reconciled, not blindly overwritten. |

## 2. HIGH-RISK FILES — modified locally **AND** changed on main (a pull will conflict here)

```
backend/Controllers/CompanyController.cs
backend/Models/Dtos/CompanyDtos.cs
backend/Program.cs
backend/Services/CompanyService.cs
backend/Services/ICompanyService.cs
backend/appsettings.json
src/app/dashboard/entrepreneur/(phases)/phase-2/step-1/client.tsx
src/app/dashboard/entrepreneur/(phases)/phase-2/step-2/page.tsx
src/app/dashboard/entrepreneur/(phases)/phase-2/step-3/page.tsx
src/app/dashboard/entrepreneur/(phases)/phase-2/step-4/page.tsx
src/app/dashboard/entrepreneur/(phases)/phase-3/page.tsx
src/app/dashboard/entrepreneur/(phases)/phase-3/step-1/revenue-input-client.tsx
src/app/dashboard/entrepreneur/(phases)/phase-3/step-2/page.tsx
src/app/dashboard/entrepreneur/(phases)/phase-3/step-3/page.tsx
src/components/entrepreneur/EntrepreneurLayout.tsx
src/components/entrepreneur/PhaseHeader.tsx
src/components/entrepreneur/ProgressSidebar.tsx
src/components/entrepreneur/StepFooter.tsx
src/hooks/usePhase2Step1Form.ts
src/lib/api-entrepreneur.ts
src/lib/entrepreneur.ts
src/types/entrepreneur.ts
```

All 22 are **backend core + entrepreneur Phase-2/Phase-3** — exactly the area main rewrote. **No investor file is in this set** (investor work is safe). Note `phase-2/step-1/client.tsx` is here — my earlier `useWatch` build-gate fix will conflict with main's version of that file; main's is newer and likely supersedes it.

## 3. EXACT EXECUTION STEPS (run by you — terminal input is blocked for me)

> Do **not** `git pull` directly — with 747 dirty files it will abort ("local changes would be overwritten") or clobber the 22 high-risk files.

1. **Snapshot first (safety net):** `git stash push -u -m "pre-main-sync-2026-06-22"` — this stashes ALL 747 changes (tracked + untracked) so nothing is lost.
2. **Fast-forward to main (now clean):** `git pull --ff-only origin main` → advances `9749b44 → b2ea2ae`.
3. **Reapply your work selectively:** `git stash pop`. Git will auto-merge the non-overlapping ~725 files and flag conflicts only on the 22 high-risk files.
4. **Resolve the 22 conflicts** — for the entrepreneur Phase-2/3 files and backend core, **prefer main's version** (it's the newer Phase-2/3 implementation) unless you have a local change you specifically need. For `appsettings.json`, keep your local connection/secret values.
5. **Drop the junk:** discard `.vs/ .vscode/ .claude/ .next/ bin/ obj/` and the `frontend/` duplicate from the popped set; add them to `.gitignore`.
6. **Rebuild:** `npm install` (root) → `dotnet build` (backend). Restart Mongo + backend + frontend.
7. **Verify:** `git status` clean-ish, `GET /health/ready` → 200, app loads.

## 4. ALTERNATIVE (cleaner, if the 747 changes aren't precious)

If most of the 747 are generated/experimental and you don't need them:
1. `git stash push -u -m backup` (keep a recoverable copy).
2. `git reset --hard origin/main` (after `git fetch`) — hard sync to latest main, discarding local changes.
3. Cherry-pick back only what you need from the stash: `git checkout stash@{0} -- <path>`.

This avoids 22 conflict resolutions but **discards local work by default** — only choose it if you're sure.

---

*Source: live `git`. No pull/stash/reset was executed by me; these are the steps for you to run.*
