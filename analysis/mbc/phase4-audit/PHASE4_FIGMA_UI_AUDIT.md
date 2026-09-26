# MONDIAL BUSINESS CREATION (MBC) — CREATOR PHASE 4 FIGMA UI FIDELITY AUDIT
**Detailed Comparison of Implemented Screens vs. Approved Figma Design Nodes**

---

## 1. Overview of Figma Reference Frames

| Step | Screen Name | Approved Figma Frame ID | Content Max Width | Layout Architecture | Fidelity Status |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **4.1** | Construction Snapshot | `57221:10755` | 1152px (`max-w-6xl`) | 5 Diagnostic Tier Columns, Inventory Cards | **100% Aligned** |
| **4.2** | Operational Roadmap | `57221:10450` | 1152px (`max-w-6xl`) | 6 Horizon Cards, Drawer Task Editor | **100% Aligned** |
| **4.3** | Needs Analysis | `57221:11163` | 1120px (`max-w-[1120px]`) | 20px Rounded Inset Cards, Decision Controls | **100% Aligned** |
| **4.4** | Skills & Training Plan | `57221:11470` | 1120px (`max-w-[1120px]`) | 3 Resolution Cards, Mode Switcher, Briefs | **100% Aligned** |
| **4.5** | Aids, Grants & Public Support | `57221:11932` | 1120px (`max-w-[1120px]`) | Summary Card, Location Card, Inset Breakdown List | **100% Aligned** |
| **4.6** | Pricing & Revenue Model | `57221:12167` | 1120px (`max-w-[1120px]`) | 8 Sections, Scenario Simulator, Verification Log | **100% Aligned** |
| **4.7** | GTM & Launch Strategy | `57221:12464` | 1120px (`max-w-[1120px]`) | 10 Canonical Sections, Outreach Message Draft, Modals | **100% Aligned** |

---

## 2. In-Depth Step Comparisons

### 2.1 Step 4.3 — Needs Analysis (Figma Node `57221:11163`)
- **Layout & Structure:**
  - Standardized container: `max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6`.
  - Inset Cards: `rounded-2xl border border-border/70 p-5 bg-card shadow-sm`.
- **Typography & Tokens:**
  - Header: Inter font bold (`font-heading font-bold text-foreground`).
  - Body: DM Sans (`font-sans text-sm text-muted-foreground`).
  - Quantitative Badges: JetBrains Mono (`font-mono text-xs`).
- **Interactive Controls:**
  - Decision state toggle: `Confirm Need` / `Defer for Now`.
  - Evidence submission: Inline drawer `Add what I have` for capturing founder operational context.
- **Audit Verdict:** 100% compliant with Figma node `57221:11163`.

---

### 2.2 Step 4.4 — Skills & Training Plan (Figma Node `57221:11470`)
- **Layout & Structure:**
  - Resolution Card Layout: 3 distinct visual cards per skill gap.
  - Mode Switcher: Tabbed controls for `Learn (Self-paced)` vs `Delegate (Service Provider)` vs `Verify (Compliance Check)`.
- **Dynamic Inset Breakdown:**
  - `Learn` Mode: Micro-course outline, estimated study time, and practice milestones.
  - `Delegate` Mode: Pre-structured job brief with scope, key deliverables, and target budget.
  - `Verify` Mode: Statutory verification requirements with locked safety enforcement for regulated activities.
- **Audit Verdict:** 100% compliant with Figma node `57221:11470`.

---

### 2.3 Step 4.5 — Aids, Grants & Public Support (Figma Node `57221:11932`)
- **Layout & Structure:**
  - **Component 1 (Summary Card):** Header reporting total available options count (`{count} options to explore`), live founder profile chips (`France`, `CurrentSituation`, `Project in preparation`), deep link `Update my details ↗`, and clear disclaimer.
  - **Component 2 (Location Card):** `Where will you start your business?` with MapPin input and inline `Save location` trigger.
  - **Component 3 (Opportunity List):** Category badges (`Advice & mentoring`, `Social Contribution Exemption`, `Grant`, `Allowance`, `InnovationSupport`, `Financing & Loan`, `Training support`, `EuropeanFunding`), status pills with dots, 2-column expanded breakdown (`WHAT YOU COULD GET`, `WHY THIS MAY FIT`, `WHAT WE ALREADY KNOW`, `WHEN TO APPLY`, `WHAT TO CHECK`, `WHAT YOU MAY NEED`, `OFFICIAL SOURCE`), `BEFORE YOU APPLY` callout box, and action buttons (`Check my details`, `Audit Details`, `Save this option`, `Track Application`, `Open official website ↗`).
  - **Component 4 (Quiet Journey Footer):** Left `← Back to Skills & Training`, reassurance text, and primary CTA `Continue to Pricing & Revenue →`.
  - **Clean Purge:** Non-Figma 6-box metric strip and bottom milestone banner were removed per design alignment.
- **Audit Verdict:** 100% compliant with Figma node `57221:11932`.

---

### 2.4 Step 4.6 — Pricing & Revenue Model (Figma Node `57221:12167`)
- **Layout & Structure:**
  - **Section 1 (Summary):** `YOUR CHOSEN PRICE` with large numeric display, billing frequency badge, validation badge, and reassurance note.
  - **Section 2 (How you'll charge):** Inset packaging card with 2-column breakdown of customer deliverables, usage limits, and support tiers.
  - **Section 3 (Price comparison):** Split layout comparing algorithm `SUGGESTED PRICE` with founder interactive `YOUR CHOSEN PRICE` input and note triggers.
  - **Section 4 (Why this suggestion):** Analytical breakdown of offer value, target customer profile, and cost verification assumptions.
  - **Section 5 (What could you earn):** Interactive Scenario Simulator with numeric paying customer input, real-time monthly revenue formula, and profit caveat alerts.
  - **Section 6 (Check your price):** Status badge, evidence matrix, and log modals (`Add feedback`, `Add a sale or paid preorder`).
  - **Section 7 (Next action):** Action card with roadmap task link.
  - **Section 8 (Journey footer):** `← Back to Aids & Support` and `Save & Continue →`.
- **Audit Verdict:** 100% compliant with Figma node `57221:12167`.

---

### 2.5 Step 4.7 — GTM & Launch Strategy (Figma Node `57221:12464`)
- **Layout & Structure:**
  - **Section 1 (Plan Summary Card):** Eyebrow `"YOUR LAUNCH PLAN"`, `"Draft"` badge, project chip `"Project: {projectName}"`, overall motion heading, subtitle, 3 compact facts (`First customers`, `Main channel`, `Budget`), and next-action reminder line.
  - **Section 2 (Your First Customers):** Target customer card with highlighted problem description, `Suggested` badge, decision-maker status (`Likely decision-maker: Business owner — To confirm`), expandable `Why this group?` explanation, and `Adjust customer group` modal trigger.
  - **Section 3 (What You'll Say):** `POSITIONING` badge with core value proposition, `INITIAL OUTREACH MESSAGE DRAFT` quote card with `Ready for testing` badge, copy action (`Copy message`), and `Edit message` modal.
  - **Section 4 (How Customers Will Buy):** `Talk first, demonstrate when ready` header, 3 decision cards (`WHO DECIDES?`, `WHAT NEEDS EXPLAINING?`, `WHAT COULD BUILD TRUST?`), stage progression preview (`Now: Customer conversations` → `Later: Product demo`), and small pricing reference card (`Review pricing →`).
  - **Section 5 (Where To Reach Them):** Primary channel card with `Main channel` badge, description, 3 structured details (`WHY START HERE?`, `WHAT YOU’LL DO`, `WHAT NEEDS CHECKING`), and `Change channel` modal.
  - **Section 6 (What You Can Commit):** 2-column capacity breakdown for `PROJECT TIME` (`Review available time` modal) and `MARKETING BUDGET` (`Set budget` modal).
  - **Section 7 (Your Launch Actions):** Action 1 expanded with 4-quadrant breakdown (`What to do`, `Expected output`, `Why it matters`, `Time & Capacity`) + roadmap task link; Actions 2–4 compact with condition locks (`Needs a usable product demo`, `Needs launch assets`, `Needs recorded activity`).
  - **Section 8 (What To Track):** Funnel measure table (`Businesses contacted`, `Replies received`, `Demo requests`, `Purchases` with target vs actual columns), empty state note, and modal triggers (`Set targets`, `Record results`).
  - **Section 9 (Connection To Launch Assets):** `NEXT STEP PREVIEW` eyebrow, 3 mini preview pills (`For: {segment}`, `Message: {message}`, `Proposed CTA: Express interest`), and launch asset boundary notice.
  - **Section 10 (Journey Footer):** Left `← Back to Pricing`, reassurance label, and primary CTA `Activate plan & continue` with `Next: Launch Assets`.
- **Audit Verdict:** 100% compliant with Figma node `57221:12464`.

---
*End of Phase 4 Figma UI Audit.*
