# Phase 3 Step 2 (Automated Valuation) — Figma Design Audit

## Current Implementation Status

### ✅ Sections Present in Current Code

| Section | Location | Status |
|---------|----------|--------|
| Breadcrumb + Title header | Line 192-195 | ✅ Complete |
| Left sidebar (Ownership/Multiplier/Logic) | Line 199-236 | ✅ Complete |
| Applicant header card | Line 242-253 | ✅ Complete |
| Valuation summary cards (3-col) | Line 256-272 | ✅ Complete |
| Revenue Growth Report Card | Line 275-278 | ✅ Complete |
| Verification + Health cards | Line 281-294 | ✅ Complete |
| Detailed valuation breakdown table | Line 299-337 | ✅ Complete |
| Investor Insights shell | Line 340-345 | ✅ Complete |
| Funding Ask form | Line 348-386 | ✅ Complete |
| Capital allocation | Line 389-426 | ✅ Complete |
| Info callout | Line 428-433 | ✅ Complete |
| Step footer (Back/Continue) | Line 436+ | ✅ Complete |

---

## What Needs Verification Against Figma

To align with Figma design exactly, please confirm these details:

### 1. **Valuation Cards Section (3-col grid)**
```
Current: [Annual Revenue] [Average Growth] [Estimated Valuation]
         MetricTile        MetricTile        Primary background card

Figma:   [?]              [?]               [?]
```
**Check:** Card styling, spacing, typography, color scheme

### 2. **Left Sidebar**
```
Current Layout:
├─ Beneficial Ownership (shell)
├─ Select Multiplier (disabled shell)
└─ Valuation Logic (info card)

Figma Layout: [Verify order and content]
```
**Check:** Section order, spacing, content text

### 3. **Detailed Breakdown Table**
```
Current Rows:
├─ Revenue Multiple (Data unavailable)
├─ Base Valuation (Data unavailable)
├─ Growth Premium (Data unavailable)
├─ Risk Discount (Data unavailable)
└─ Final Valuation (Real value shown)

Figma Rows: [Verify if these metrics match]
```
**Check:** Row labels, colors, tone chips

### 4. **Funding Ask Section**
```
Current Fields:
├─ Raise amount (€)
├─ Pre-money valuation (€)
├─ Round (dropdown: pre_seed/seed/series_a)
└─ Share type (dropdown: preferred/safe/note)

Figma Fields: [Verify same fields exist]
```
**Check:** Field labels, layout (2-col grid)

### 5. **Capital Allocation**
```
Current:
├─ Product (default row)
├─ Sales & marketing (default row)
├─ Operations (default row)
└─ Add category button

Figma: [Verify default rows and structure]
```
**Check:** Default categories, add/remove functionality

---

## Questions for Alignment

**Please answer to confirm Figma parity:**

1. **Valuation cards** — Should they be displayed as 3 separate cards in a grid, or differently?

2. **Left sidebar** — Should Beneficial Ownership / Multiplier / Logic appear on the left, or move elsewhere?

3. **Detailed breakdown table** — Are the 4 intermediate metrics correct, or should the table show different metrics?

4. **Funding Ask section** — Should it appear BEFORE or AFTER the detailed breakdown?

5. **Capital allocation** — Should default categories be Product/Sales/Operations, or different?

6. **Layout** — Is the current left-rail (280px) + right-content layout correct, or should it be full-width?

7. **Colors/Styling** — Are the card colors (primary, neutral, success, destructive) matching Figma's color palette?

---

## If Figma Design Shows Something Different

Common changes might be:
- Reorder sections (e.g., move Funding Ask before Detailed Breakdown)
- Change valuation card layout (2-col instead of 3-col, or vertical stack)
- Update table metrics (replace intermediate rows with different ones)
- Modify sidebar content or position
- Adjust spacing/padding

**Please share:** What specific visual/layout differences do you see between current implementation and Figma?

---

## Next Steps

Once you confirm the Figma design details, I can:
- ✅ Adjust layout/grid structure
- ✅ Reorder sections
- ✅ Update metric labels/values
- ✅ Change colors/styling
- ✅ Modify form fields
- ✅ Update default categories
- ✅ Fix spacing/padding
