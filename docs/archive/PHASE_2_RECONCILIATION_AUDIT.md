# Entrepreneur Phase 2 — Complete Reconciliation Audit (Figma ⇄ Docs ⇄ Frontend ⇄ Backend ⇄ DB)

**Date:** 2026-06-10 · **Mode:** READ-ONLY. Nothing implemented/modified/deleted.
**Sources:** journey doc · Figma `21509:38694` (6 screens, verified via Dev Mode MCP) · `src/app/dashboard/entrepreneur/(phases)/phase-2/*` + `src/components/entrepreneur/*` · `CompanyController` · `Companies` model.
**Goal:** not just functional parity — **visual, layout, spacing, typography, interaction, responsive, and accessibility** parity with Figma. Gaps classified: **Functional / Visual / UX / Accessibility / Backend.**

---

## 1. Executive Summary

Phase 2 is **functionally implemented and backend-authoritative** — the 4-step wizard (Legal → Documents → Ownership/KYC → Final) creates a Company, persists each step, and advances the phase via real `CompanyController` endpoints. **But it is not at Figma parity**, in three material ways:

1. **One Figma screen is effectively missing:** the Phase-2 **Dashboard Overview** (full sidebar shell, stat cards, allocation breakdown, AI-mentor list, expense table) exists in Figma but the code route `phase-2/dashboard/page.tsx` is a **9-line redirect**.
2. **A wizard screen is folded and a KYC capability is absent:** Figma has **5 wizard screens (2.1–2.5)**; code has **4 steps** (Figma 2.3 *table + SUMSUB biometric* and 2.4 *editable form + Security/Privacy* are merged into one `step-3`). Code Step 3 collects **email** where Figma collects **nationality**, and **the SUMSUB "Start Biometric Scan / Start Identity Verification" CTA has no code or backend**.
3. **Visual system drift:** code uses a **left ProgressSidebar on the wizard steps that Figma does not have** (Figma puts progress as a top-right widget inside the card), **gradient** progress bars where Figma uses **solid `#3c61dd`**, **41 raw Tailwind palette colors** instead of theme tokens, and a different **document set** (code: KBIS/Articles/License/Tax; Figma: KBIS/RIB/Tax/Insurance).

The functional spine is solid and reusable; the work to reach Figma parity is **mostly frontend** (build the dashboard, split/redesign Step 3, align fields & doc set, tokenize colors, fix layout), with **three backend gaps** (owner identity-verification/SUMSUB, certificate generation/download, dashboard data aggregation) — two of which (SUMSUB, real KYC) are intentionally postponed.

---

## 2. Complete Gap Report (classified)

### Functional Gaps
- **F1 — Dashboard Overview missing.** Figma `21509:39132` (stat cards, valuation, allocation, AI-mentor, expense table) → code `phase-2/dashboard/page.tsx` is a redirect. *(May overlap `/dashboard/entrepreneur` — verify; absent at this route.)*
- **F2 — Owner field mismatch.** Code collects `email`; Figma collects `Nationality` (dropdown). Backend `beneficial-owners` accepts `nationality` (optional) — FE simply doesn't send it.
- **F3 — Document set mismatch.** Code: KBIS, Articles of Association, Business License, Tax. Figma: KBIS, **Bank RIB**, Tax, **Professional Insurance (RC Pro)**. RIB + Insurance absent; Articles + License extra.
- **F4 — Identity verification absent.** Figma 2.3 SUMSUB "Start Biometric Scan" + 2.4 "Start Identity Verification" + "NOT STARTED" status pill → **no code, no backend**.
- **F5 — Wizard screen folded.** Figma 2.3 + 2.4 (two screens) collapsed into one `step-3`; Figma's ownership **table** (2.3) and **editable rows w/ delete** (2.4) replaced by an add-form + card list.
- **F6 — Certificate.** Figma 2.5 "Verified Company" certificate card + enabled "Download Certificate" → code shows a **disabled** "Certificate (after review)" button, no certificate render/download.
- **F7 — Step-index page (code-only).** `phase-2/page.tsx` (4 step-cards router) has **no Figma counterpart** — extra navigation layer. (Keep or align — not a defect, but flag.)

### Visual Gaps
- **V1 — Layout: ProgressSidebar.** Code wraps wizard steps in `EntrepreneurLayout` + left **ProgressSidebar** timeline. Figma wizard screens (2.1–2.5) have **no left sidebar** — progress is a top-right widget within the card; the 264px sidebar shell appears **only** on the Dashboard. Inverted vs Figma.
- **V2 — Progress bars.** Code uses `bg-gradient-to-r from-primary to-primary/60`; Figma uses **solid `#3c61dd`** bars (8px / 12px / 4px variants).
- **V3 — Status colors.** Code uses raw `bg-green-50 / border-green-200 / text-green-600` for success; Figma uses tokens `#067231` text / `#e9fff2` bg (and yellow `#985b07/#f9f2e8` for "Mandatory"). **41 raw palette colors** total (0 hex).
- **V4 — Document cards.** Figma: 2×2 **dashed dropzone** cards (h-188) + yellow **"Mandatory"** chip + "0 of 4 Required". Code: upload buttons, green-on-success, no dashed dropzone, no Mandatory chip.
- **V5 — Ownership table.** Figma 2.3 renders a **table** (Full Name / Ownership / Nationality / Actions, row h-80); code renders green owner **cards**.
- **V6 — Certificate card.** Figma 2.5 certificate panel (logo, "Mondial.eco Certified Business", issued date) not rendered in code.
- **V7 — Typography (verify at px).** Figma scale: head/XXL 32/40 medium, head/L 20/24, body 14/16/18, Inter. Code uses app font + Tailwind sizes — likely close but **not pixel-verified**; confirm heading sizes/weights match.
- **V8 — Spacing (verify).** Figma rhythm: card padding 24px, section gaps 24px, input `14px 16px` r-8, container widths 1072/1020/1028/860/1128px. Code uses Tailwind scale + `max-w-7xl` — verify container widths and paddings vs these.

### UX Gaps
- **U1 — Drag-and-drop.** Figma 2.2 dropzones support drag-and-drop; code is click-to-upload only.
- **U2 — KYC flow.** Figma's biometric/identity-verification step + "NOT STARTED→…" status progression has no code UX.
- **U3 — Save behavior.** Figma footers show "Save Draft" / "Save For Later" / "Save draft"; code Step 1 uses **auto-save** (400ms debounce) + a Save Draft button — acceptable but diverges from the explicit-save Figma pattern.
- **U4 — Country/address inputs.** Figma 2.1: Country = **dropdown**, Address = **textarea**; code uses plain text inputs.
- **U5 — Certificate download** disabled in code vs enabled in Figma.

### Accessibility Gaps
- **A1 — No `aria-live`** on async/error/auto-save/upload status regions across all steps (error banners are plain divs).
- **A2 — Auto-save indicator is visual-only** (Step 1) — not announced.
- **A3 — Upload status** conveyed by icon/color change only (Step 2) — needs text/ARIA for SR users.
- **A4 — Status color reliance** (green cards) — ensure non-color cues (icons/text) exist (mostly do, via CheckCircle).
- *(Positive: inputs are labelled via RHF `Label`/`htmlFor`; hidden file inputs are keyboard-reachable via buttons; heading hierarchy present.)*

### Backend Gaps
- **B1 — Owner identity verification / SUMSUB:** no `CompanyController` (or wired `VarificationController`) endpoint to start/track owner biometric KYC. **Postponed (SUMSUB).**
- **B2 — Certificate:** no certificate generation/download endpoint for the 2.5 "Verified Company" certificate.
- **B3 — Dashboard aggregation:** the Figma dashboard needs target-raised, trust score, investor matches, valuation, **allocation breakdown**, **AI-mentor suggestions**, and an **expense/transactions table** — sources are partial (`progress`/`valuation`/`InvestorMatch`/`AiController insights`/`Transactions`) and not aggregated for this view; expense-table source unconfirmed.
- *(No backend gap for legal info, documents, beneficial owners core, or phase advancement — all exist. `nationality` is already accepted.)*

---

## 3. Screen-by-Screen Audit

| Figma screen | Code | Functional | Visual | UX | A11y | Backend |
|---|---|---|---|---|---|---|
| **2.1 Legal Info** | `step-1/client.tsx` | ✅ fields match (name, reg#, legal form, incorp date, country, address, NAF); legal-form options differ slightly | ProgressSidebar added (V1), gradient bar (V2), token drift (V3), verify type/spacing (V7/V8) | Country should be dropdown, address textarea (U4); auto-save vs Save-Draft (U3) | no aria-live on auto-save (A1/A2) | ✅ `legal` endpoint |
| **2.2 Document Upload** | `step-2/page.tsx` | **doc set mismatch** (F3) | no dashed dropzone, no Mandatory chip (V4) | **no drag-drop** (U1) | upload status not announced (A3) | ✅ `documents/{type}` (flexible) |
| **2.3 Ownership & KYC (table + SUMSUB)** | `step-3` (top) | **table→cards** (V5/F5); **email vs nationality** (F2); **no SUMSUB biometric** (F4) | table layout, SUMSUB card, certs row missing (V5) | no biometric flow (U2) | error divs no aria-live (A1) | ✅ `beneficial-owners`; ❌ **SUMSUB (B1)** |
| **2.4 Ownership & KYC (editable + Security/Privacy)** | `step-3` (folded) | **screen folded** (F5); no "Start Identity Verification" / "NOT STARTED" pill (F4); no per-row delete + nationality (F2) | Security/Privacy panel + ISO/GDPR/SOC2 certs vs code's 3 generic cards | no status-pill progression (U2) | A1 | ❌ **identity verification (B1)** |
| **2.5 Company Verification (final)** | `step-4/page.tsx` | ✅ roadmap + score + features-unlocked (Investor Visibility/Data Room/Funding Portal) + continue | **certificate card missing** (V6); trust-score chip style differs | certificate download disabled (U5) | heading ok; no aria-live (A1) | ✅ `phase/{n}`; ❌ **certificate (B2)** |
| **Dashboard Overview** | `dashboard/page.tsx` (9L redirect) | **MISSING** (F1) | entire screen absent | n/a | n/a | partial aggregation needed (B3) |
| — | `phase-2/page.tsx` (step index) | **code-only**, no Figma (F7) | — | extra nav layer | — | none |

---

## 4. Reusable Components (exist — reuse, don't rebuild)
- `src/components/entrepreneur/`: **EntrepreneurLayout**, **PhaseHeader**, **ProgressSidebar**, **StepFooter**, **RouteGuard**, **PhaseFormWrapper**, **FormTemplates**, **LegalIdentityForm**, **PhaseTemplate**, **JobProgressIndicator**.
- `src/components/ui/`: **Button**, **Input** (already used; no raw `<button>/<input>/<img>` in phase-2 — good). For new Figma parity: add shadcn **Table**, **Badge** (chips), **Checkbox**, **Select** (dropdowns), **Progress**, possibly **Accordion** (data-room style) via `npx shadcn add`.
- Hooks: **useEntrepreneurProgress**, **usePhase2Step1Form**.

## 5. Reusable APIs (exist — `CompanyController`)
`createCompany` (POST `/companies`) · `updateLegalInfo` (POST `/companies/{id}/legal`) · `uploadDocument` (POST `/companies/{id}/documents`, multipart) · `getDocuments` (GET) · `updateBeneficialOwners` (POST `/companies/{id}/beneficial-owners` — accepts `nationality`) · `advancePhase` (POST `/companies/{id}/phase/{n}`) · `getCurrentPhase` (GET) · `{id}/progress`. **Needed-new:** owner identity/SUMSUB (B1), certificate (B2), dashboard aggregation (B3).

## 6. Reusable Models (Mongo)
`Companies` (denormalized) holds legal info, embedded **documents**, embedded **beneficial owners** (with optional `nationality`), phase/progress, valuation/revenue (`Phase3Models`). No schema change needed for the implemented steps. Dashboard would read `Companies` + `InvestorMatch` + (likely) `Transactions` for the expense table — confirm an expense/transactions source exists.

---

## 7. Risk Assessment
| Area | Risk | Why |
|---|---|---|
| 2.1 Legal | **Low** | fields + backend present; mostly visual/UX polish |
| 2.2 Documents | **Low–Med** | doc-set realignment + dropzone/drag-drop + chips |
| 2.3/2.4 Ownership & KYC | **High** | table redesign + nationality + **SUMSUB identity verification (no backend; postponed)** + un-folding into 2 screens |
| 2.5 Final | **Medium** | certificate card + **certificate backend (B2)** |
| Dashboard Overview | **High** | entire rich screen unbuilt + **aggregation backend (B3)**; may duplicate main entrepreneur dashboard |
| Design system | **Medium** | 41 raw colors + gradient bars + sidebar-layout inversion across all steps |
| A11y | **Low–Med** | add `aria-live`/announcements; otherwise labelled |

## 8. Recommended Implementation Plan (no code yet)
1. **Decide the Dashboard's home (F1/B3) first.** Determine whether Figma's "Phase-2 Dashboard Overview" *is* the main `/dashboard/entrepreneur` (likely) or a distinct post-phase-2 view. Don't build a duplicate. Then scope the aggregation endpoint(s).
2. **Step 3 → split + correct fields (F2/F4/F5/V5).** Restore Figma 2.3 (ownership **table** + SUMSUB card) and 2.4 (editable rows + Security/Privacy); swap **email→nationality** (backend already supports it); add the identity-verification CTA as a **dev/postponed stub** (SUMSUB later, per the "no Sumsub yet" rule).
3. **Step 2 doc set + dropzone (F3/V4/U1).** Align to KBIS/RIB/Tax/Insurance; add dashed drag-drop dropzones + "Mandatory" chips + "n of 4".
4. **Step 5/2.5 certificate (F6/V6/U5/B2).** Render the certificate card; gate "Download" on a new backend certificate endpoint.
5. **Step 1 inputs + layout (U4/V1).** Country dropdown + address textarea; reconcile the ProgressSidebar-vs-top-right-progress layout to match Figma on wizard screens.
6. **Design-system pass (V2/V3).** Tokenize the 41 raw palette colors → `--primary/--destructive/--success/...`; replace gradient progress with solid token bars; verify typography/spacing (V7/V8) at px.
7. **A11y pass (A1–A4).** Add `role="status"`/`aria-live` to auto-save, upload, and error regions.
8. **Verify after each:** run locally (`npm run build`), reach Phase 2 with a Phase-1-complete entrepreneur account, confirm persistence + advancement, then re-screenshot vs Figma.

**Sequencing note:** items 2–7 are **frontend-only and reuse all existing APIs/models**, except the three flagged backend gaps (B1 SUMSUB — postponed; B2 certificate; B3 dashboard aggregation). Universal Phase-1 dev completion is a prerequisite for live end-to-end testing.

*Read-only audit. No invention: every gap is grounded in a verified Figma frame or a read code file; nothing was changed.*
