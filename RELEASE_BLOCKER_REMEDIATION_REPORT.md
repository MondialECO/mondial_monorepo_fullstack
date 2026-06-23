# RELEASE BLOCKER REMEDIATION REPORT

**Platform:** Mondial.Client (Next.js 16 frontend + .NET / WebApp backend)
**Date:** 2026-06-19
**Scope:** Remediate ONLY the blockers/integrity issues from `RELEASE_CANDIDATE_CERTIFICATION.md`. No unrelated refactors, UX, or features. Backups untouched.
**Source of fixes verified:** Read tool against the live filesystem (authoritative). See "Environment note" for why the build sandbox required manual syncing.

---

## FINAL VERDICT

> # ❌ NOT READY

**All four assigned remediation items are fixed and verified.** However, the codebase has changed since the original certification, and a fresh type-check now surfaces **22 TypeScript errors plus 1 lint error that are NOT part of the four assigned items** and that break `next build`. Per the explicit instruction ("No additional work beyond these 4 remediation items"), these were left untouched. Because the production build still fails on these out-of-scope, newly-present errors, the platform cannot yet be certified for staging.

In short: the four blockers you asked me to fix are resolved; the build is held up by *different*, more recently introduced problems that need a separate go-ahead.

---

## 1. ISSUES FIXED

### TASK 1 — Build failure: `src/types/investor/profile.ts` corruption ✅ FIXED

| | |
|---|---|
| **Exact cause** | 24 trailing **NUL (`0x00`) bytes** appended after the last valid line, parsed by TypeScript as `TS1127 Invalid character` (24 errors). |
| **Exact location** | `src/types/investor/profile.ts`, line 90 (the file has 89 valid lines; byte offsets 2656–2679 were NUL). |
| **Fix** | Rewrote the file with exactly the 89 valid lines + clean trailing newline; no code/logic changed. |
| **Before** | 2679 bytes, 24 NUL bytes, `tsc` → 24× `TS1127` at `profile.ts:90`. |
| **After** | 2655 bytes, **0 NUL bytes**, 89 lines; the 24 `TS1127` errors are gone from `tsc`. |

### TASK 2 — Hooks violation: `entrepreneur/(phases)/phase-2/step-1/client.tsx` ✅ FIXED

| | |
|---|---|
| **Root cause** | `useWatch()` was called at lines 63–64, **after** the `if (!progress) return <Loading/>` early return (line ~49). When `progress` loads (falsy→truthy), the number of hooks changes between renders → `react-hooks/rules-of-hooks` error + React "rendered more hooks than during the previous render" crash risk. |
| **Fix** | Moved both `useWatch` calls (and the dependent `register` / `isFormFilled`) to **above** the early return, immediately after `usePhase2Step1Form()`. Hooks now run unconditionally on every render. No behavior change. |
| **Before** | `useWatch` at lines 63–64 (below the guard); 2× `react-hooks/rules-of-hooks` errors. |
| **After** | `useWatch` at lines 30–34 (above the guard at line 62); the rules-of-hooks errors are cleared. |

### TASK 3 — Fabricated MOIC: `backend/Services/CompanyService.cs` ✅ FIXED

| | |
|---|---|
| **Finding** | `Moic = capitalCommitted > 0 ? 1.44 : 0` — a hardcoded financial figure in the investor pipeline summary. |
| **Fix** | Removed the fabricated value; MOIC is now **`null`** (there is no realized/current-valuation data to compute it honestly). Made the DTO field nullable to represent "not available." |
| **Propagation trace** | **Entity:** `DealExecution` holds no MOIC — it was computed only in the service. **DTO:** `CompanyDtos.cs` `InvestorPipelineSummaryDto.Moic` changed `double` → `double?`. **Service:** both assignments set to `null` (`CompanyService.cs:2999` empty-pipeline case, and `:3070` the computed case). **API → Frontend:** the field now serializes as `null`. **Regression check:** the frontend pipeline type and `KPIStrip.tsx` never read `moic` (KPIs shown are activeDeals / capitalCommitted / averageMatchScore), so removing the value changes no rendered output. |
| **Before** | DTO `public double Moic`; service returned `1.44` whenever capital was committed. |
| **After** | DTO `public double? Moic`; service returns `null` in both code paths; no hardcoded financial metric remains. |

### TASK 4 — Signature contract hardening: `src/types/deals.ts`, `src/lib/deal-utils.ts` ✅ FIXED

| | |
|---|---|
| **Was the frontend still parsing the activity log?** | Yes — `deriveSignatures()` read `termSheet.status` + parsed `term_sheet_signed` note strings (`"by founder"`, `"by investor"`, `"both"`). |
| **Backend contract present?** | Yes (verified, not invented): `DealStatusResponse.FounderSignature` / `.InvestorSignature` (`CompanyDtos.cs:394–395`), type `SignatureRecordDto { SignedAt, SignedBy }` (`:426–429`), mapped from `DealExecution.Signatures` (`DealExecution.cs`: `FounderSignedAt/By`, `InvestorSignedAt/By`, `BothSigned`). ASP.NET serializes camelCase. |
| **Fix** | Added `SignatureRecord { signedAt, signedBy }` and `founderSignature` / `investorSignature` to the frontend `DealStatus` (matching the existing wire fields). `deriveSignatures()` now uses these **persisted records as the primary source**; the activity-log parsing is retained only as a fallback for legacy payloads that lack the fields. No invented fields. |
| **Verification chain** | `DealExecution` (DB) → `SignatureRecordDto` (DTO) → `DealStatusResponse.founderSignature/investorSignature` (API, camelCase) → `SignatureRecord` on `DealStatus` (frontend) → `deriveSignatures()` reads `deal.founderSignature?.signedAt` / `deal.investorSignature?.signedAt`. |

---

## 2. VERIFICATION EVIDENCE

- **Type-check (authoritative for the build gate):** after syncing the four edited files into the build sandbox, `tsc --noEmit`:
  - The 24 `TS1127` errors in `profile.ts` are **gone** (Task 1 verified).
  - No errors in `client.tsx`, `deals.ts`, or `deal-utils.ts` (Tasks 2 & 4 verified).
- **Read-tool confirmation on the live filesystem (what you ship):**
  - `profile.ts` — 89 clean lines, ends at `export type UpdateInvestorProfileInput …;` with no trailing junk.
  - `client.tsx` — `useWatch` at lines 30–34, above the `if (!progress)` guard at line 62; JSX closes correctly (220 lines).
  - `deals.ts` — `SignatureRecord` interface + `founderSignature` / `investorSignature` on `DealStatus`.
  - `deal-utils.ts` — `deriveSignatures` reads persisted records first, activity-log fallback second.
  - `CompanyService.cs` — both MOIC assignments now `null`; `CompanyDtos.cs` `Moic` now `double?`.
- **Lint:** the Task-2 `react-hooks/rules-of-hooks` errors are resolved by construction (hooks moved above the early return). A full `npm run lint` run could not be completed in-sandbox (see Environment note); one previously-flagged lint error remains but is **out of scope** (see §3).
- **Backend build:** `dotnet build` could not be run (no .NET SDK in this environment). The MOIC change is type-safe (`double` → `double?`, assigning `null`) and `Moic` has no other references in the backend, so no compile regression is expected — but this must be confirmed locally.

**Environment note (important):** the build sandbox mounts a copy of the repo that lagged behind the live filesystem and, during this session, truncated several files mid-write when syncing — producing spurious `tsc` errors until I pushed the complete file contents into the sandbox. The fixes themselves are confirmed correct on the live filesystem via the Read tool. For a definitive CI result, run `npm run lint` and `npm run build` locally (the repo ships `run_lint.ps1` / `run_build.ps1`).

---

## 3. REMAINING BLOCKERS (NOT part of the 4 items — left untouched per scope)

These were **not** present (or not detected) in the original certification and appear to have been introduced by work done between the two certifications. They break `next build`, but fixing them is outside the "4 remediation items only" instruction. Confirmed against the live filesystem where noted.

**A. TypeScript errors that fail `next build` (22):**

1. **`trustScore` removed from `CompanyProgressResponse` but still referenced (4 errors) — CONFIRMED real.** The type (`src/lib/api-entrepreneur.ts:5`) no longer declares `trustScore`, yet it is read in:
   - `src/app/dashboard/entrepreneur/overview.tsx:259`
   - `src/components/entrepreneur/equity/Phase5FundingVisuals.tsx:164` and `:175`
   - `src/components/entrepreneur/phase3/Phase3FinancialDashboard.tsx:312`
2. **`founderName` not on `OpportunityDetail` but still referenced (2 errors) — CONFIRMED real.** `src/app/dashboard/investor/discovery/[companyId]/_components/OpportunityHeader.tsx:71` and `:73`.
3. **`OfferDiffCard.tsx` formatter type mismatch (3 errors)** — `src/components/deals/OfferDiffCard.tsx:16, 84, 92` (a `(v: string|number)=>string` formatter prop is being given `formatCurrency`, whose signature is `(n: number|null|undefined)=>string`). Pre-existing; unrelated to the Task-4 edit (`formatCurrency` was not changed).
4. **`backups/**` folder is inside the type-check scope (13 errors) — CONFIRMED.** `tsconfig.json` excludes `frontend/**`, `e2e/**`, and tests, but **not** `backups/`. The dated snapshots `backups/investor-baseline-2026-06-19/**` and `backups/investor-premium-ui-batch1-2026-06-19/**` contain stale code referencing removed props (`moic`, `profileScore`, `founderName`) and therefore fail compilation. Excluding `backups/**` in `tsconfig.json` (one line) would remove all 13.

**B. Lint (1 error, out of scope):**

5. `src/components/investor/OwnershipDonut.tsx:44` — `react-hooks/immutability` ("Cannot reassign variable after render completes"). The original certification flagged this as MEDIUM; it was **not** one of the four assigned remediation items, so it remains.

**C. Verification gaps:**

6. **Backend not compiled** — `dotnet build` unavailable in this environment.
7. **No live E2E / full `next build`** completed in-sandbox (mount limitation described above).

---

## 4. STAGING READINESS

**Not ready for staging.** The four assigned blockers are resolved, but `next build` still fails on the 22 type errors in §3.A. A green frontend build plus a confirmed backend build are prerequisites for staging.

Path to staging from here (small, well-defined):
- Clear §3.A items 1–2 (delete or guard the dangling `trustScore` / `founderName` references — they are leftovers from a prior field removal).
- Fix the `OfferDiffCard` formatter typing (§3.A item 3).
- Add `"backups/**"` to `tsconfig.json` `exclude` (§3.A item 4).
- Run `npm run build` and `dotnet build` locally to confirm green.

If you authorize expanding the scope beyond the original four items, these are quick to clear and I can do them next.

## 5. PRODUCTION READINESS

**Low / blocked at the build gate.** Production readiness cannot improve past the certification's prior ~75% until the build compiles. The architecture, journeys, data-integrity model, and signature/closing safety remain sound (and the signature contract is now hardened to use persisted records), but a non-building release candidate is not production-eligible. Re-assess after §3.A is cleared and the backend compiles.

---

## SUMMARY TABLE

| Item | Status |
|---|---|
| Task 1 — `profile.ts` NUL corruption | ✅ Fixed & verified (24 `TS1127` cleared) |
| Task 2 — `useWatch` hooks violation | ✅ Fixed & verified (hooks above early return) |
| Task 3 — fabricated MOIC `1.44` | ✅ Removed (now `null`, DTO `double?`) |
| Task 4 — signature contract hardening | ✅ Switched to persisted `founderSignature`/`investorSignature` |
| `next build` overall | ❌ Fails on 22 out-of-scope type errors (§3.A) |
| `npm run lint` overall | ❌ 1 out-of-scope error remains (OwnershipDonut) |
| `dotnet build` | ⛔ Not run (no SDK) |

# FINAL VERDICT: ❌ NOT READY

*Remediation limited to the four assigned items. Remaining blockers are itemized above and were left untouched per instruction. Backups were not modified.*
