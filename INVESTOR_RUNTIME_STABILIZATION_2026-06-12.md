# Investor Sprint — Runtime Stabilization (pre-UI)

**Date:** 2026-06-12 · **Scope:** fix ONLY the 5 runtime blockers from the live audit. No UI redesign, no new features, no Phase 3/4/6-finisher/8-builder work, no Entrepreneur/Admin changes.
**Status:** code changes complete and self-reviewed. **Live verification is pending a backend rebuild + demo-DB re-seed** (see §5/§6). The backend changes don't take effect until you rebuild + restart the API, and the seed/data changes don't appear until `MondialEcoInvestorDemo` is dropped and re-seeded.

---

## 1. Root cause of each issue

**1) Data Room download 403 ("No data-room access grant for this investor").**
Two compounding causes. (a) **Identity-keying mismatch:** the download/track endpoints passed the *ApplicationUser id* into the access policy, but NDA acceptances, access logs and grants are all keyed on the *catalogue Investor id* (`InvestorProfile.InvestorId`) — so even the NDA check (`n.InvestorId == callerUserId`) could never match. (b) **No grant is ever created:** `AcceptDataRoomNdaAsync` only wrote the `Phase6NdaAcceptance`; the `DataRoomAccessRecord` that `EnsureDataRoomAccessAsync` requires was only ever created by an owner-side endpoint, and the seed wrote NDAs without grants. Net: an NDA-signed investor had no grant under the id the policy checked → 403 on every download and view/download-track.

**2) Deal Negotiation realtime "Offline".**
`NegotiationWorkspace` imported `useAuth` from the **legacy `@/context/AuthContext`** (a stub provider that is not mounted, so it returns `{ user: null, token: null }` and logs "Called outside AuthProvider"). The app is actually wrapped in `@/app/_providers/AuthProvider` (which `MessagingWorkspace` and `NotificationBell` use). With `user` null, `useDealRealtime(!!user)` stayed disabled → the deal hook never started the (shared, per-user) notifications hub → status stuck at "idle" → "Offline". (`dealRoleForUser(user?.role)` was silently broken for the same reason.) This is the same auth-provider-scope class FIX_06 addressed for ChatHub.

**3) Fake legal terms in the term-sheet preview.**
The read-only term-sheet route is **not bound to a real `DealExecution`/`TermSheet`** (that binding is the out-of-scope Phase-8 builder). `src/lib/term-sheet-derivation.ts` fabricated instrument, investor rights, governance and "key conditions" — including a hardcoded **"Governing law: France · Jurisdiction: Paris Commercial Court"** — purely from the round type, and `DealTermsSection` rendered them as if real. The live deal payload has no `governingLaw`/`jurisdiction` at all, confirming these were invented.

**4) Counterparty-name resolution.**
*Deals:* `DealStatusResponse` carried no company name, and `MapDealToResponse` didn't set one, so the investor-facing inbox/detail fell back to `Founder · {shortId(dealId)}`. *Messages:* the resolution code is correct (`ConversationDto` resolves `Name` from `ApplicationUser`); the live `Entrepreneur · {id}` came from **stale runtime test conversations** whose counterparties had no resolvable name — the seeded conversations use real named users, so a re-seed fixes it.

**5a) NovaPay pre-money == post-money.**
Seed data bug: four of five companies in `companies.json` had `PreMoneyValuation == Valuation`. The opportunity detail shows `Valuation` as post-money and `PreMoneyValuation` as pre-money, so they rendered identical. Rousseau was the only correct row (`pre = Valuation − ask`).

**5b) Negotiation without an NDA.**
The investor offer path (`CreateInvestorOfferAsync`, behind `POST /api/investor/term-sheet/{companyId}/create`) never checked NDA acceptance, so an offer could push a deal into "negotiation" while the opportunity still read "NDA Required". The live NovaPay deal was created this way at runtime (it is not seeded).

**5c) Equity % differs across surfaces.**
Per your decision, this is **not a bug to "align"**: the opportunity detail shows the company's *advertised equity-for-ask* while the deals list shows the *specific offer's* `investorEquityPercent`. They are two legitimately different numbers. Left as-is; only the genuine pre/post bug (5a) was fixed.

---

## 2. Files modified (12)

**Backend (.NET):**
- `backend/Controllers/CompanyController.cs` — download + track-view + track-download now resolve the caller's catalogue Investor id (for non-owners) and pass it to the access policy.
- `backend/Services/CompanyService.cs` — `AcceptDataRoomNdaAsync` now also upserts a download-level `DataRoomAccessRecord`; `CreateInvestorOfferAsync` now enforces NDA before opening an offer thread and snapshots the company name; `CreateDealAsync` snapshots the company name; `MapDealToResponse` returns `CompanyName`.
- `backend/Models/DatabaseModels/DealExecution.cs` — new `CompanyNameSnapshot` field.
- `backend/Models/Dtos/CompanyDtos.cs` — `DealStatusResponse.CompanyName`.
- `backend/Extensions/SeedingExtensions.cs` — NDA seed now also creates the matching access grant; seeded Rousseau deal sets `CompanyNameSnapshot`.
- `backend/Configuration/SeedData/companies.json` — `PreMoneyValuation` corrected to `Valuation − FundingAsk` for Atomica (→9.6M), NovaPay (→6.8M), Helio (→5.0M), Veris (→5.4M).

**Frontend (Next.js):**
- `src/components/deals/NegotiationWorkspace.tsx` — import `useAuth` from `@/app/_providers/AuthProvider`; gate deal realtime on `!!token`.
- `src/lib/term-sheet-derivation.ts` — deleted `instrumentForRound`, `investorRightsForRound`, `governanceForRound`, `KEY_CONDITIONS` (kept `roundNameFromType` + stage logic).
- `src/app/dashboard/investor/discovery/[companyId]/term-sheet/_components/DealTermsSection.tsx` — shows only the real round stage + an honest "terms agreed during negotiation" note.
- `src/types/deals.ts` — `DealStatus.companyName`.
- `src/components/deals/DealInboxItem.tsx` — render `deal.companyName` (fallback preserved).
- `src/components/deals/DealDetailPanel.tsx` — header uses the real counterparty name (company for investor, investor for founder; fallback preserved).

---

## 3. APIs affected (no new endpoints, no URL/verb changes)

- `GET /api/companies/{id}/dataroom/documents/{docId}` — now **200 + file** for an NDA-signed investor (was 403).
- `POST /api/companies/{id}/dataroom/track-view` · `…/track-download` — now authorize correctly (counters can move off 0).
- `POST /api/companies/{id}/dataroom/nda/accept` — unchanged contract, new side-effect: also creates the download grant.
- `POST /api/investor/term-sheet/{companyId}/create` — now returns **403** if the investor hasn't accepted the company's NDA.
- `GET /api/companies/deals/{id}`, `GET /api/deals`, and every deal mutation response — `DealStatusResponse` now includes `companyName`.

---

## 4. Mongo impact (all additive; schemaless, no migration script)

- **`companies.DataRoomAccessRecords`** — now populated on NDA acceptance (and in the seed) with a `download`-level grant keyed on the catalogue Investor id.
- **`dealExecutions.CompanyNameSnapshot`** — new field; existing deals read it as null and the client falls back gracefully.
- **`companies`** — seeded `PreMoneyValuation` values change for four companies (data correction).
- **Re-seed required** to see the seed/data fixes: the demo seed is idempotent-guarded ("already populated → skip"), so existing `MondialEcoInvestorDemo` data is untouched until you drop it. The stray no-NDA NovaPay deal is runtime data and is cleared by the drop.

---

## 5. Verification steps (run after §6)

1. **Data Room download** — log in as `demo.investor@mondial.local`, open Rousseau → Data Room → click **Download** on any doc → expect the file (HTTP 200). API: `GET /api/companies/{rousseauId}/dataroom/documents/{docId}` → 200.
2. **NDA enforcement** — attempt an offer on a company whose NDA you haven't signed → expect **403** "NDA acceptance is required before making an offer". Confirm no NovaPay deal exists in Deals after re-seed.
3. **Realtime** — open **Deals** → status badge reads **"Live"** (not "Offline"); `dealRoleForUser` resolves (offer actions show correctly).
4. **Term sheet** — open Rousseau → Term Sheet → "Deal Terms" shows only **Round Stage** + the honest note; **no** "Governing law: France · Jurisdiction: Paris", no fabricated governance/instrument.
5. **Names** — Deals inbox/detail show **"Rousseau Technologies SAS"** (not "Founder · 2916"); Messages show real participant names.
6. **Pre/post money** — NovaPay opportunity detail shows **Pre €6.8M / Post €8M** (not €8M/€8M); spot-check the others (Atomica €9.6M/€12M, Helio €5M/€6.5M, Veris €5.4M/€7.2M).

I can re-run the full live browser walk to confirm 1–6 once the API is rebuilt and the DB re-seeded.

---

## 6. Build status

- **Backend:** not built here — this sandbox has no .NET SDK. Changes were self-reviewed for compile-correctness; one real error I introduced (a duplicate `InvestorNameSnapshot` initializer in the seed) was caught and removed. **Action:** run `dotnet build backend/WebApp.csproj`, then restart the API.
- **Frontend:** a standalone `tsc --noEmit` on the mounted filesystem proved unreliable here (intermittent truncated/NUL reads produced false cascades — e.g. it mis-read the untouched, valid `AuthProvider.tsx`). The clean portion of the typecheck showed **no errors attributable to the changed files**, and the changes are small and type-consistent on review. **Action:** run `npm run build` (or rely on the dev server's hot reload, which picks these up immediately).
- **To apply the data/seed fixes:** stop the API → drop the `MondialEcoInvestorDemo` database → start the API with `SeedDemoData=true` so it re-seeds.

---

## 7. Updated Investor readiness %

These are **projected pending the live re-verification in §5** (code is in place; not yet re-walked against a re-seeded DB).

- **Built deal-funnel slice (Discovery → Detail → NDA → Data Room → Term Sheet → Pipeline → Deals/Messages):** ~65% → **~76%**. All five runtime blockers that were dragging it down are resolved (data-room downloads work, realtime connects, no fabricated legal terms, real counterparty names, consistent valuations, NDA-gated negotiation).
- **VERIFIED readiness:** ~60% at audit time; will be re-measured after the §5 walk. The previously-blocked paths (data-room download, realtime) are now expected to pass; write paths (offer create/counter/sign) remain unverified by choice (no mutations were exercised).
- **Full redesigned vision (Phases 2–9):** ~35% → **~38%** (these were funnel-stability fixes; the profile/community half — Accreditation, Thesis, Public Profile, Feed — is unchanged and still the long pole).

---

## Out-of-scope items observed (NOT changed)

- `MakeOfferButton.tsx` and `MessageFounderButton.tsx` also import the legacy `@/context/AuthContext` (same latent null-auth bug as §2). Left untouched to stay within the 5-blocker scope — recommend a follow-up to repoint them at `@/app/_providers/AuthProvider`.
- The term-sheet route's `InvestmentSummaryGrid` still renders the company ask as the "Offer Amount" and the route remains read-only — that's the Phase-8 builder rebuild, explicitly out of scope.
- `MapDealToResponse` still doesn't populate `DealParticipantStatusDto.InvestorName` (founder-facing); left alone per "no Entrepreneur changes".

*Runtime stabilization only. No Phase 3/4/6-finisher/8-builder work performed.*
