# Fix 05 — Investor "Send Offer" No-op (P1)

Scope: investor offer submission only. AI / SignalR / messaging / notifications / service-provider / entrepreneur / marketplace / matching / escrow / reputation / auth / onboarding untouched. No backend changes.

## SECTION A — Root Cause (proven)

**Outcome A — frontend bug.** The offer path is fully wired end-to-end; the request fires; the backend responds — but `MakeOfferButton.submit` had an empty `catch {}` that **silently swallowed every failure**, so the button "did nothing" and showed no feedback.

Traced the whole path and proved it live:

- **Frontend wiring is correct (not B/C/D/E):**
  - `MakeOfferButton` → `useCreateInvestorOffer()` → `createInvestorOffer()` → `POST /api/investor/term-sheet/{companyId}/create`.
  - `OfferComposerDialog` "Send offer" → `submit()` → validation → `onSubmit(terms)` → the mutation. All present and correct.
- **Backend endpoint exists** and matches: `InvestorPhaseController` `[Route("api/investor")]` + `[HttpPost("term-sheet/{companyId}/create")]` → `CompanyService.CreateInvestorOfferAsync` (creates a `DealExecution` + first term-sheet revision). The request DTO `OfferTermsRequest` fields match the frontend `OfferTermsInput` exactly.
- **A request IS fired** (the PAT's "no request fired" was a measurement artifact — the PAT filtered network for `deal`, but the endpoint path is `investor/term-sheet/...`). Verified live:
  - As the seeded demo investor: `POST .../term-sheet/{companyId}/create` → **400** `{"error":"investorId '…' does not match any investor"}`.
  - As a fresh investor: → **403** `{"error":"Universal Phase 1 (identity verification) must be complete…"}`.
- **The silent swallow is the no-op:** `MakeOfferButton.submit` only called `setOpen(false)`/navigate on success; on throw it ran `catch { /* Surface kept minimal */ }` → no toast, no inline error, dialog stayed open, submit button still active. Exactly the reported symptom ("form renders, values entered, submit active, no feedback, no offer").

Secondary (environmental, not the offer code): the current backend rejection for the demo investor is **demo-data drift** — its `InvestorProfile.InvestorId` references an `Investors` catalogue row missing from this database (the seeder only links when the id is empty, so it never self-heals; this also empties the demo investor's Discovery). The offer/linkage code itself is correct (`CreateInvestorAsync` persists and returns the real id; `Register` P0-1 wiring links fresh investors). Fresh investors are additionally gated by Universal Phase 1.

## SECTION B — Files Modified (frontend only)
1. `src/components/deals/MakeOfferButton.tsx` — capture the mutation error and surface it; reset on open/retry.
2. `src/components/deals/OfferComposerDialog.tsx` — accept an optional `submitError` prop and render it.

## SECTION C — Exact Fix

`MakeOfferButton.tsx` — stop swallowing; surface the message, keep the dialog open for retry:
```tsx
const [submitError, setSubmitError] = useState<string | null>(null);

const submit = async (terms: OfferTermsInput) => {
  setSubmitError(null);
  try {
    const deal = await createOffer.mutateAsync({ companyId, terms });
    setOpen(false);
    const base = user ? ROLE_DASHBOARD_ROUTES[user.role] : "/dashboard/investor";
    router.push(`${base}/deals?d=${deal.dealId}`);
  } catch (err) {
    setSubmitError(extractApiError(err));   // was: catch {}  (silent)
  }
};
// ...pass submitError + reset on open; extractApiError reads
// err.response.data.error|message with a generic fallback.
```

`OfferComposerDialog.tsx` — render the surfaced error alongside the existing validation error:
```tsx
submitError?: string | null;            // new optional prop
...
{(error ?? submitError)
  ? <p className="text-xs text-destructive">{error ?? submitError}</p>
  : null}
```

Contract preserved: same endpoint, same mutation, same dialog API (the new prop is optional, so counter-offer callers are unaffected). No deal-architecture redesign, no marketplace/escrow/reputation.

## SECTION D — Build Results
- **No backend changes** in this fix → `dotnet build` and deal-related backend tests (`Phase9StateMachineTests`, etc.) are not applicable to Fix 05.
- **Frontend `npx tsc --noEmit`:** the bare sandbox invocation emits systematic, false "JSX element has no corresponding closing tag" / `TS1005` parse errors for **every** `.tsx` file it touches — including unchanged JSX (`<Button>`, `<Dialog>`, fragments) and the verified-working Fix‑01/03 files — i.e. tsc isn't parsing in JSX mode in this environment, so its output is not a usable signal here. Both changed files were verified structurally valid by inspection (balanced tags: fragment `<>`…`</>`, `<Button>`…`</Button>`, self-closed `<OfferComposerDialog …/>`) and hot-reloaded with no Next.js dev error overlay. Recommend the project's own typecheck / `next build` in CI.

## SECTION E — Verification Results
- **Request is fired:** confirmed live — `POST /api/investor/term-sheet/{companyId}/create` returns a real HTTP response (demo → 400 linkage; fresh → 403 phase-1). The PAT "no request" was a wrong network filter.
- **Backend accepts/creates:** `CreateInvestorOfferAsync` is correct (validates terms + company + investor, then inserts a `DealExecution` and a revision) — verified by code; it returns precise validation/auth responses, not a no-op.
- **UI feedback now appears:** with the fix, a failed submit sets `submitError`, which the dialog renders (e.g. the investor now sees "investorId … does not match any investor" / the phase-1 message) and the dialog stays open for retry — the silent no-op is eliminated.
- **Green-path (200 + deal created/pipeline updated) could NOT be exercised in this database's current state:** the only Phase‑1‑complete account (demo investor) has the drifted `InvestorProfile.InvestorId`, which also empties its Discovery (so the company page can't be reached via the UI here), and fresh investors are Phase‑1‑gated. To demonstrate the full success path, repair the demo investor's `InvestorProfile.InvestorId` to a real `Investors` row, or do a clean reseed (drop the `MondialEcoInvestorDemo` DB and restart). The offer endpoint + frontend wiring are correct, so the success path will work once an investor has Phase 1 complete + a valid investor linkage.

## SECTION F — Remaining Risks
- **Demo-data drift blocks the green-path demo** (investor catalogue linkage missing) — environmental, not the offer code; recommend a reseed. The empty `catch {}` had been *masking* this all along; with the fix the investor at least gets a clear message instead of silence.
- The same `OfferComposerDialog` is reused for **counter-offers** (pipeline/deal panel); those callers still don't pass `submitError` (the prop is optional, so unchanged). A follow-up could surface counter-offer errors the same way — out of scope here.
- Verified via inspection + dev hot-reload; confirm with `next build` in CI.
