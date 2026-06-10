# Phase 3 — Visual Parity Gap Audit (READ-ONLY)

**Date:** 2026-06-10 · **Mode:** AUDIT ONLY — no code changed.
**Compares:** current Phase 3 screen (`/dashboard/entrepreneur/phase-3/step-3` → `Phase3FinancialDashboard` + `FinancialWidgets`) **vs** Figma `21595:9284` (3.2 KPI Tracker `21509:39370`, 3.3 Valuation calculator `21509:39268`).
**Scope:** visual, layout, interaction, responsive, typography, spacing, accessibility, design-system **only**. Backend functionality explicitly ignored — where a Figma element has no backend field, the gap measured is whether its **visual shell** is rendered, not whether data exists.
**Basis note:** pixel/typography values are from the captured Figma spec; confirm pixel-exact items (font family, 20-vs-28px padding, shadow) against the live frame.

---

## Remaining visual parity gaps

| # | Component | Current state | Figma state | Parity impact | Frontend-only? |
|---|---|---|---|---:|---|
| 1 | **Font family** | App `font-sans` (Geist) | Inter throughout | ~3% | **Yes** (next/font global config) |
| 2 | **Metric label casing** | `MetricCard` forces `uppercase` on all labels | Mixed/title case ("Monthly Recurring Revenue") | ~1.5% | **Yes** |
| 3 | **3.2 status-ring card sub-stats** | `StatusRing` = ring + label + sublabel only | Ring + "System Health: Optimal", "Data Throughput", inner "DATA INTEGRATION" sub-card w/ connect buttons | ~2.5% | **Yes** (render shells as "Data unavailable") |
| 4 | **3.2 Burn Rate card** | Flat "Burn rate — Data unavailable" tile | Dedicated card w/ 8-bar gradient mini-chart, footer delta, verified shield | ~2.5% | **Yes** (render chart shell + unavailable overlay) |
| 5 | **3.3 multiplier / ownership card** | Single muted "Valuation multiplier — Not yet configured" card | "Select Multiplier" dropdown (SaaS/B2B 4x) + Beneficial Ownership row (owner 60%) + "Valuation Logic" info box | ~3% | **Yes** (render disabled control + ownership + info shells) |
| 6 | **Per-screen chrome (3.3)** | Uses shared `PhaseHeader` + `StepFooter` | Applicant header ("Sarh Janiks · Director"), "View Audit Details →" link, footer "Save For Later / Cancel / Next: KPI Metrics" | ~2% | **Yes** (layout/product decision) |
| 7 | **Combined view vs separate frames** | 3.2 + 3.3 displays + input forms stacked on one scroll page | 3.1 / 3.2 / 3.3 are distinct screens | ~2% | **Yes** (structural — may be intentional) |
| 8 | **Positive-value color** | Metric values all `text-foreground`; green only on status chips | Positive values/deltas rendered green (#067231) (e.g. LTV green) | ~1% | **Yes** (`text-success-text` on positive values) |
| 9 | **Bar-chart fill** | `QuarterBars` flat `bg-primary/80` | Gradient fills (blue revenue / red burn `#711d1f→#ffc4c6`) | ~1% | **Yes** |
| 10 | **Card shadow** | `shadow-sm` | `0 2px 20px rgba(0,0,0,0.02)` (softer/wider) | ~0.5% | **Yes** (token/custom shadow) |
| 11 | **3.2 Revenue-trend card** | One quarterly chart (in 3.3 only) | 3.2 has its own Revenue-trend card + "+60.56% YoY" badge | ~1% | **Yes** |
| 12 | **Estimated-valuation chip** | Primary card, no sector chip | Solid blue card + "B2B SaaS Sector" chip | ~0.5% | **Yes** |
| 13 | **StatusRing center value size** | `text-[28px]`, 10px stroke | Larger center number, thicker ring | ~0.5% | **Yes** |
| 14 | **Hover states (rows/cards)** | `MetricCard` hover only | (Figma static; minor row affordances) | ~0.5% | **Yes** |
| 15 | **Exact padding/gap rhythm** | `p-5` (20px), `gap-4/5` | Mostly 20px; some outer containers 28px | ~0.5% | **Yes** |
| 16 | **A11y contrast verification** | Token chips + muted italic states | n/a (verify WCAG AA on `warning`/`success`/muted) | ~0.5% | **Yes** (verify/adjust) |

**Already at parity (no gap):** 32px/40 metric-number scale; 13px/20 labels; rounded-xl(12px)/rounded-lg(8px) radii; 260px left rail; breakdown-table category chip colors (blue/grey/green/red/solid); success/warning/destructive token chips; loading skeletons; per-element empty states; `role`/`aria`/`scope`/`progressbar`/`sr-only` (a11y **exceeds** Figma); responsive sm/lg grids (**exceeds** desktop-only Figma); Recalculate interaction; verification-progress 4-step rail.

---

## Final parity score

**≈ 89%** (visual / layout / interaction / responsive / typography / spacing / a11y / design-system).
Drivers of the remaining ~11%: font family (#1), the three under-built card shells (#3 burn, #4/#5 multiplier+ownership, status-ring sub-stats), per-screen chrome (#6), and a set of small finish items (#8–#16).

**Every remaining gap is frontend-only** — none depend on backend data (backend-blocked elements are scored on their visual shell, which is frontend-renderable with honest states). So **95%+ is achievable frontend-only.**

---

## Frontend-only tasks to reach 95%+ (prioritized by impact)

1. **Switch Phase-3 typography to Inter** (next/font, global) — ~3%.
2. **Build the 3.3 multiplier / beneficial-ownership / Valuation-Logic card** as disabled control + ownership row + info-box shells — ~3%.
3. **Build the 3.2 Burn Rate card** (gradient mini bar-chart shell + verified shield + "Data unavailable" overlay) — ~2.5%.
4. **Expand the 3.2 status-ring card** with the System Health / Data Throughput / Data Integration sub-blocks (honest states) — ~2.5%.
5. **Add 3.3 per-screen chrome** (applicant header, "View Audit Details" link, footer action row) or formally accept the merged-view decision — ~2%.
6. **Stop forcing uppercase** metric labels; match Figma title case — ~1.5%.
7. **Green positive values** (`text-success-text`) + **gradient bar fills** + **sector chip** on estimated valuation — ~2.5% combined.
8. **Finish items:** exact `0 2px 20px/0.02` shadow, 28px outer padding where Figma uses it, ring sizing, optional row hover, **WCAG AA contrast check** on chips/muted states — ~2% combined.

Reaching ≥95% needs roughly tasks 1–6 (the structural shells + font); tasks 7–8 push toward ~97–98%. The last ~2% (pixel-exact spacing/typography) requires a side-by-side render against the live frame.
