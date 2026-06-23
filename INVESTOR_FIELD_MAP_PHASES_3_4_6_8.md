# Investor Backend Field Map — Phases 3, 4, 6, 8

**Date:** 2026-06-11 · **Mode:** READ-ONLY
**Grounded in:** `backend/Models/DatabaseModels/Investor.cs`, `…/DealExecution.cs` (`TermSheet`), `backend/Models/Dtos/CompanyDtos.cs` (INVESTOR-SIDE READS), `backend/Models/Dtos/OfferDtos.cs`, and the read projections in `InvestorPhaseController.cs` (`GetProfile`, `GetSettings`). "Available" = field exists in a model/DTO. "Exposed" = the current GET endpoint actually returns it (some `Investor` fields exist but the profile read drops them).

Legend: ✅ real backend field · ⚠️ exists on model but **not surfaced** by current read endpoint (wire-up only) · ❌ backend gap (no field) · 🔁 derivable from existing fields.

---

## PHASE 3 — Investment Thesis

### Backend fields available (`Investor.cs`)
| Field | Type | Exposed by `GET /api/investor/profile`? |
|------|------|----|
| `PreferredSectors` | `List<string>` | ✅ `preferredSectors` |
| `PreferredStages` | `List<string>` (pre_seed…series_c) | ✅ `preferredStages` |
| `MinCheckSize` | `double` | ✅ `minCheckSize` |
| `MaxCheckSize` | `double` | ✅ `maxCheckSize` |
| `PreferredGeographies` | `List<string>` | ✅ `preferredGeographies` |
| `RequiresProRataRights` | `bool` | ⚠️ on model, **not** in profile read |
| `RequiresBoardSeat` | `bool` | ⚠️ on model, **not** in profile read |
| `PreferredEquityTypes` | `List<string>` (preferred/safe/note) | ⚠️ on model, **not** in profile read |
| `ProfileScore` | `int` (0–100) | ✅ `profileScore` |
| `Type` | `string` | ✅ `type` |
| `UpdatedAt` | `DateTime` | ❌ not in read |
Write path exists: `PUT /api/investors/{investorId}` (`InvestorController`) accepts the full `Investor` object.

### SVG element → backend
| SVG element (Phase 3) | Backend |
|---|---|
| Step 1 — Return Expectations / target multiple ("5–10x") | ❌ **gap** — no `TargetReturnMultiple` field |
| Step 2 — Follow-on Policy | ❌ **gap** — no `FollowOnPolicy` field |
| Step 2 — Pro-Rata Right (toggle) | ⚠️ `Investor.RequiresProRataRights` (exists; not in profile read) |
| Step 2 — Board Participation (observer/advisor/seat) | ⚠️ partial — `Investor.RequiresBoardSeat` (bool only; no participation-level enum) |
| Step 3 — Preferred Sectors (chips) | ✅ `Investor.PreferredSectors` |
| Step 3 — Geographic Focus (chips) | ✅ `Investor.PreferredGeographies` |
| Step 3 — Preferred Stage (chips) | ✅ `Investor.PreferredStages` |
| Step 3 — Thesis Statement (free text) | ❌ **gap** — no `ThesisStatement` field |
| Ticket / check-size range | ✅ `Investor.MinCheckSize` / `MaxCheckSize` |
| Equity-type preference (if shown) | ⚠️ `Investor.PreferredEquityTypes` (exists; not in profile read) |
| Step 4 — Completion profile score ("88 / Strong") | ✅ `Investor.ProfileScore` (today: stored int, not a live computed breakdown) |
| Step 4 — "Domains interest" (Social Profile / Deal Discovery / Finance Bridge) | ❌ **gap** — no field |
| Preferred Role / value-add to founders | ❌ **gap** — no `PreferredRole` / `ValueAdd` field |

**Phase 3 verdict:** core thesis (sectors, stages, geographies, check size, pro-rata, board, equity-type) is backed; **5 gaps** — target multiple, follow-on policy, thesis statement, preferred role, domains-interest. Also: pro-rata/board/equity-type need adding to the `GetProfile` projection.

---

## PHASE 4 — Public Profile (view + edit)

### Backend fields available
`Investor.cs`: `Name`, `Type`, `Bio`, `Website`, `LogoUrl`, `SuccessfulExits` (int), `AverageCheckSize` (double), `CompletedDeals` (int), `ActiveInvestments` (int), `LastActiveAt`, `PrimaryContact`, `PrimaryEmail`, `PrimaryPhone`, `IsActive`, `ProfileScore`, + all Phase-3 preference fields.
`GET /api/investor/profile` exposes: `id, userId, name, email, type, bio, website, logoUrl, preferredSectors, preferredStages, minCheckSize, maxCheckSize, preferredGeographies, primaryContact, primaryPhone, profileScore, isActive, linked`.
`GET /api/investor/settings` exposes (from `ApplicationUser`): `name, email, phone, geography, availableTime, address, notifications{emailEnabled,pushEnabled}` (notifications are **MVP defaults**, not stored).

### SVG element → backend
| SVG element (Phase 4) | Backend |
|---|---|
| Name + verified badge | ✅ `Investor.Name` / `ApplicationUser.Name` (badge state ⚠️ from KYC, not a profile field) |
| Headline / title | ❌ **gap** — no `Headline`/`Title` field |
| Avatar / logo | ✅ `Investor.LogoUrl` (falls back to `ApplicationUser.ImagePath`) |
| Cover / banner photo | ❌ **gap** — no `CoverImageUrl` field |
| Bio / About | ✅ `Investor.Bio` (falls back to `ApplicationUser.Bio`) |
| Thesis-fit score (e.g. "70%") | ✅ `Investor.ProfileScore` |
| Investment Preferences (sectors / stages / check size) | ✅ `PreferredSectors` / `PreferredStages` / `Min`/`MaxCheckSize` |
| Notable Investments | ⚠️ partial — counts only: `CompletedDeals`, `SuccessfulExits`, `ActiveInvestments`, `AverageCheckSize` (exist on model, **not** in profile read); no named-deal list |
| Website | ✅ `Investor.Website` |
| Contact (email / phone) | ✅ `PrimaryEmail` / `PrimaryPhone` |
| Social links (LinkedIn/X/etc.) | ❌ **gap** — no `SocialLinks` field |
| Location / geography | ✅ `ApplicationUser.Geography` (via settings) |
| Public-visibility toggle | ❌ **gap** — `IsActive` is a catalog flag, not a public-profile visibility control |
| Activity & Updates / Recent Posts | ❌ **gap** — no posts/feed (depends on Phase 5; none in backend) |

**Phase 4 verdict:** static view + edit (identity, bio, preferences, contact, website, exits/deals counts) is fully backed by `Investor`; **gaps** — headline, cover image, social links, public-visibility flag, and the activity feed. The exit/deal counts exist but must be added to the read projection.

---

## PHASE 6 — Opportunity Detail + NDA (read-side)

### Backend fields available (`OpportunityDetailResponse`, CompanyDtos.cs)
`CompanyId, CompanyName, Tagline, Industry, Country, FundingRoundType, FundingAskAmount, EquityOfferedPercent, PreMoneyValuation, Valuation, TrustScore, IsInvestorReady, MatchScore, MatchStatus, MatchRationale, ScoreBreakdown{SectorFit,StageFit,GeographyFit,TeamScore}, NdaRequired, NdaAccepted, NdaAcceptedAt, CapTableSummary{TotalShares,EsopPoolPercent,Entries[]}, Team[{Name,Role}], DocumentsCount, AiReviewScore, LastUpdatedAt`.
Cap-table entry (`EquityEntryDto`): `StakeholderName, Type, SharesOwned, VestingMonths, InvestmentAmount`. NDA accept: `POST /companies/{id}/dataroom/nda/accept` (real); `nda/create` is a **DocuSign placeholder**.

### SVG element → backend
| SVG element (Phase 6) | Backend |
|---|---|
| Company name / tagline / industry / country | ✅ `CompanyName` / `Tagline` / `Industry` / `Country` |
| Round type badge | ✅ `FundingRoundType` |
| Investor-Ready badge | ✅ `IsInvestorReady` |
| KPI — Funding Ask | ✅ `FundingAskAmount` |
| KPI — Pre-Money | ✅ `PreMoneyValuation` |
| KPI — Post-Money | ✅ `Valuation` |
| KPI — Equity Offered | ✅ `EquityOfferedPercent` |
| Match score ("88%") | ✅ `MatchScore` |
| Match breakdown — Sector / Stage / Geography / Team | ✅ `ScoreBreakdown.SectorFit/StageFit/GeographyFit/TeamScore` |
| Match rationale text | ✅ `MatchRationale` |
| Overview — problem / solution / why-now narrative | ❌ **gap** — only `Tagline`; no problem/solution/why-now body on the investor DTO |
| Overview — company snapshot | ⚠️ partial — assembled from the KPI/identity fields above |
| Traction — MRR / transaction volume / active customers / churn / NPS | ❌ **gap** — **none on `OpportunityDetailResponse`**; owner-gated, not exposed to investors |
| Traction — bar chart | ❌ **gap** — no time-series data (UI currently substitutes Trust/Match/AI/Ready tiles) |
| Cap Table — ownership donut | ✅ `CapTableSummary.Entries[].SharesOwned` + `TotalShares` (NDA-gated) |
| Cap Table — ESOP pool | ✅ `CapTableSummary.EsopPoolPercent` |
| Cap Table — entries (name/type/shares/vesting/amount) | ✅ `EquityEntryDto` (NDA-gated) |
| Team — members (name/role) | ✅ `Team[].Name/Role` (NDA-gated; no photo/bio/links) |
| Documents — count | ✅ `DocumentsCount` |
| AI Review score | ✅ `AiReviewScore` |
| NDA required / accepted state | ✅ `NdaRequired` / `NdaAccepted` / `NdaAcceptedAt` |
| NDA modal — key terms / doc preview / "See full AI analysis" | ❌ **gap** — key-terms + AI-analysis are hard-coded client text; `nda/create` returns a demo DocuSign link |
| Trust score | ✅ `TrustScore` |

**Phase 6 verdict:** identity, valuation KPIs, match score + breakdown, cap table, team, documents-count, AI score are all backed. **Real gaps:** the Overview narrative body and **all live traction KPIs / time-series** (not exposed to investors today), plus a real NDA/e-sign + server-driven key-terms.

---

## PHASE 8 — Term Sheet Builder

### Backend fields available (`DealExecution.TermSheet` + `OfferTermsRequest`)
**`TermSheet` (persisted):** `TotalRaiseAmount, PostMoneyValuation, PreMoneyValuation, EquityType, InvestorEquityPercent, ProRataRights, LiquidationPreference, BoardSeats, AntiDilutionProtection, VestingYears (=4), CliffMonths (=12), InvestorRights[], InfoRightsTermination, ProposedClosingDate, Status (draft…), SignedAt, SignedDocumentId`.
**`OfferTermsRequest` (create/counter input):** `TotalRaiseAmount, PreMoneyValuation, PostMoneyValuation, EquityType, InvestorEquityPercent, ProRataRights, LiquidationPreference, BoardSeats, AntiDilutionProtection, Note`.
Endpoints: `POST /api/investor/term-sheet/{companyId}/create` + revision/sign flow (`DealSignatures`, `TermSheetRevision`).

### SVG element → backend
| SVG element (Phase 8) | Backend |
|---|---|
| Investment amount ($450K) | ✅ `TermSheet.TotalRaiseAmount` |
| Pre-money valuation | ✅ `TermSheet.PreMoneyValuation` |
| Post-money valuation | ✅ `TermSheet.PostMoneyValuation` |
| Equity offered (%) | ✅ `TermSheet.InvestorEquityPercent` |
| Equity donut (88%) | 🔁 derived from `InvestorEquityPercent` |
| Share class — Preferred Seed / Common / SAFE / Conv. Note | ⚠️ partial — `EquityType` enum is only `preferred/safe/note` (no "common", no "seed" qualifier, "conv note"≈note) |
| Price per share ($2.40) | ❌ **gap** / 🔁 derivable (raise ÷ new shares) — not stored |
| New shares issued (187,500) | ❌ **gap** / 🔁 derivable — not stored |
| Existing shares outstanding | ❌ **gap** on `TermSheet` (company-side `CapTableSummary.TotalShares` exists but isn't on the deal) |
| Pro-rata rights | ✅ `TermSheet.ProRataRights` |
| Information rights | ✅ `TermSheet.InvestorRights[]` + `InfoRightsTermination` |
| Anti-dilution | ✅ `TermSheet.AntiDilutionProtection` |
| ROFR / Co-sale | ❌ **gap** — no typed field (only free-string `InvestorRights[]`) |
| Founder vesting (4yr / 1yr cliff) | ✅ `TermSheet.VestingYears` / `CliffMonths` |
| Liquidation preference | ✅ `TermSheet.LiquidationPreference` |
| Board seats | ✅ `TermSheet.BoardSeats` |
| Closing date (April 20 2026) | ✅ `TermSheet.ProposedClosingDate` |
| Due-diligence period (30 days) | ❌ **gap** / 🔁 derivable from `ProposedClosingDate − now` |
| Governing law (French Law) | ❌ **gap** — no `GoverningLaw` field |
| Jurisdiction (Paris Commercial Court) | ❌ **gap** — no `Jurisdiction` field |
| Auto-saved / "All terms valid" | ✅ `TermSheet.Status` (draft) |
| Export PDF | ❌ **gap** — no PDF generation; `SignedDocumentId` holds only the signed artefact |
| Send / Investor signature | ✅ create endpoint + `DealSignatures.InvestorSignedAt/…DocumentId` |

**Phase 8 verdict:** the economic core (amounts, valuations, equity, pro-rata, anti-dilution, board, liq-pref, vesting, closing date, status, signatures) is **fully backed** and writable via the existing create/revision/sign endpoints. **Gaps:** governing law, jurisdiction, ROFR/co-sale (typed), full share-class enum, and the derivable price-per-share / new-shares / existing-shares + PDF export.

---

## Consolidated gap list (the only backend additions needed)

| Phase | Add to backend |
|------|----------------|
| 3 | `TargetReturnMultiple`, `FollowOnPolicy`, `ThesisStatement`, `PreferredRole`/value-add, board-participation level; + expose `RequiresProRataRights`/`RequiresBoardSeat`/`PreferredEquityTypes` in `GetProfile` |
| 4 | `Headline`, `CoverImageUrl`, `SocialLinks`, public-visibility flag, named notable-investments list; + expose exits/deals counts in `GetProfile`; activity feed (Phase 5 dependency) |
| 6 | Investor-visible **traction KPIs + time-series** (MRR, customers, churn, NPS, tx volume), Overview narrative body, server-driven NDA key-terms + real e-sign |
| 8 | `GoverningLaw`, `Jurisdiction`, ROFR/co-sale (typed), full share-class enum; PDF export service; (price-per-share / new-shares / existing-shares are derivable) |

Everything else in Phases 3, 4, 6, 8 maps to a field that **already exists** — the work there is frontend wiring, not new backend.

*Read-only — no code modified.*
