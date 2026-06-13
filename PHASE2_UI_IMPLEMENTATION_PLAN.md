# Phase 2 UI/UX Implementation Plan

**Date:** 2026-06-13  
**Objective:** Match Figma design while preserving 100% business logic  
**Scope:** UI/Layout changes only (no API, validation, or business logic changes)

---

## Figma Design Analysis

### Available Frames
- **2.1 Legal info** (23357:53067) — Step 1
- **2.2 Document upload** (23357:52872) — Step 2
- **2.3 Ownership & KYC Verification** (23357:52912) — Step 3
- **2.4 Ownership & KYC** (23357:52986) — Step 4 (alternative view)
- **2.5 Company verification** (23357:53105) — Final/Summary

### Key Layout Observations

#### Global Layout
- Container: 1072-1440px width (responsive)
- Top Header: 68px (existing TopHeader component)
- Bottom Footer: 84px (existing BottomFooter component)
- Main Content: 184-210px horizontal padding
- Content area: ~1000-1072px usable width

#### Header Section (All Steps)
- Header Section height: 136px
- Header Content: 24px padding, 665-980px width
- Progress Section: Right-aligned, 122-188px width, 48px height
- Progress area: Document icon + "Step X of 4" text

#### Main Content Card
- Frame: x=0, y=168, containing content
- Card styling: Likely light background with border/shadow

#### Footer Section
- Button Footer: 92px height
- Content area: 24px padding sides, 44px button height
- Layout: Back button (left) + Action buttons (right)

---

## Current Implementation Analysis

### Current Files
```
src/app/dashboard/entrepreneur/(phases)/phase-2/
├── page.tsx                          → Step index/router
├── step-1/
│   ├── page.tsx                      → Wrapper
│   └── client.tsx                    → Main form (170+ lines)
├── step-2/page.tsx                   → Document upload (~200 lines)
├── step-3/page.tsx                   → Beneficial owners (~150 lines)
└── step-4/page.tsx                   → Final review

src/components/entrepreneur/
├── EntrepreneurLayout.tsx            → Main layout wrapper
├── ProgressSidebar.tsx               → Left progress sidebar
├── PhaseHeader.tsx                   → Header component
├── StepFooter.tsx                    → Footer component
└── ... (other components)
```

### Current Architecture
1. **EntrepreneurLayout** — Wraps with sidebar + main content
2. **ProgressSidebar** — Shows progress, step list
3. **PhaseHeader** — Title + subtitle + progress info
4. **StepFooter** — Back/Next buttons
5. **Step-specific client components** — Form content

### Existing Components Used
- `Input` from shadcn/ui
- `Button` from shadcn/ui
- `Alert` (future)
- `Select` (future)
- `Textarea` (future)
- Icons from lucide-react

### Business Logic (MUST PRESERVE)
- Form state via `usePhase2Step1Form` hook
- Progress tracking via `useEntrepreneurProgress` hook
- API calls via `entrepreneurApi`
- File uploads with upload state tracking
- Navigation logic (moveToNextStep, router.push)
- Validation (existing, do NOT remove)
- Data persistence (localStorage + MongoDB)

---

## Step-by-Step Figma Changes

### STEP 1 — Legal Identity (2.1)

#### Current Implementation
- Text inputs for all fields
- Stacked layout
- Rounded card with border

#### Figma Changes
1. **Country field** → Change from text input to `<Select>` dropdown
   - Options: France, Germany, Netherlands, Belgium, Luxembourg, Spain, Italy, etc.
   - Styling: Match Input component height (12px height = 48px)
   
2. **Address field** → Change from text input to `<Textarea>`
   - Height: 76px (multiple lines)
   - Placeholder: "Full registered address"

3. **Layout adjustments**
   - Group fields logically (2 columns on desktop)
   - Better spacing between groups
   - Maintain all label styling

4. **Typography**
   - Keep existing label sizes
   - Ensure consistency across steps

#### Files to Modify
- `step-1/client.tsx` — Replace Input with Select/Textarea, adjust layout

#### Risk
- **Low** — No business logic change, purely UI swapping

#### Estimated Effort
- **1-2 hours**

---

### STEP 2 — Document Upload (2.2)

#### Current Implementation
- Simple file upload buttons
- Uploaded docs shown as list items
- "X of 4 uploaded" counter

#### Figma Changes
1. **Document Cards Layout** → 2×2 grid of upload cards
   - Each card: 500px width (24px padding between)
   - Height: 392px
   - Dashed border dropzone
   - Document type icon in center
   - "Mandatory" yellow chip (top-right)

2. **Upload Dropzone Styling**
   - Dashed border (2px, `border-dashed`)
   - Light background color
   - Hover state: highlight on drag

3. **Document Status**
   - Icon change on upload (from upload icon to check icon)
   - Green success state
   - File name display below icon

4. **Counter**
   - Display: "3 of 4 documents uploaded"
   - Styling: Muted text, below cards

5. **Doc Set Alignment**
   - Figma expects: KBIS, RIB, Tax, Insurance
   - Current code has: KBIS, Articles, License, Tax
   - **Note:** Change doc types to match Figma

#### Reusable Components
- `DocumentDropzone` (NEW) — Card with dashed border, icon, status
- `UploadProgress` (extract/refactor)

#### Files to Modify
- `step-2/page.tsx` — Redesign layout to 2×2 grid, update styling

#### Risk
- **Medium** — Need to verify drag-drop is preserved for accessibility
- Upload API logic must not change

#### Estimated Effort
- **2-3 hours** (layout, styling, potential drag-drop implementation)

---

### STEP 3 — Beneficial Owners & KYC (2.3)

#### Current Implementation
- Cards showing owner details
- "Add Owner" button
- Simple form to add owners

#### Figma Changes
1. **Ownership Section** → Replace cards with TABLE layout
   - Table header: Full Name | Ownership % | Nationality | Actions
   - Rows: 80px height each
   - Columns: ~250px / ~150px / ~150px / ~100px (Actions)
   - Actions: Edit, Delete icons/buttons

2. **Table Styling**
   - Header: Light gray background
   - Rows: Alternating subtle background
   - Borders: Subtle dividers between rows
   - Hover: Slight highlight on row

3. **Add Owner Button** → Above table
   - Button size: 162×40px

4. **KYC Card** (Optional section)
   - Card with logo/icon
   - "Start Identity Verification" button
   - Info text about KYC process

#### Reusable Components
- `BeneficialOwnersTable` (NEW) — Table component
- `TableHeader`, `TableRow` (NEW) — Reusable table parts

#### Files to Modify
- `step-3/page.tsx` — Replace card layout with table layout

#### Risk
- **Medium** — Table interactions (edit/delete) must stay functional
- Form integration for adding/editing owners must be preserved

#### Estimated Effort
- **2-3 hours** (table layout, styling, interaction preservation)

---

### STEP 4 — Final Review & Certification (2.4/2.5)

#### Current Implementation
- Summary information display
- Action buttons

#### Figma Changes
1. **Certificate Card**
   - Display Mondial.eco logo
   - "Company Verified" text
   - Issue date info
   - "Download Certificate" button (gated on backend)

2. **Summary Layout**
   - Better grouping of sections
   - Clearer visual hierarchy
   - Icons for different section types

3. **Features Unlocked Section**
   - 3 feature cards: Investor Visibility, Data Room, Funding Portal
   - Icon + title + description for each

#### Files to Modify
- `step-4/page.tsx` — Update layout, add certificate card styling

#### Risk
- **Low** — Mostly visual updates
- Button logic preserved

#### Estimated Effort
- **1-2 hours**

---

## Design System Updates

### Colors (Tokenization)
- Ensure all colors use semantic tokens
- Replace hardcoded Tailwind colors with `text-primary`, `bg-success`, etc.
- Update border colors to use `border-neutral-2`

### Typography
- Verify heading sizes match Figma (40px, 24px, 20px, 16px, 14px)
- Ensure consistent line-height
- Labels: 14px font-medium
- Helper text: 12px text-muted

### Spacing
- Card padding: 24px
- Section gaps: 24px
- Between input groups: 16px
- Within groups: 8-12px

### Components Used
- Keep existing `Input` component
- Add/use `Select` component (if not present)
- Add/use `Textarea` component (if not present)
- Use `Button` variants consistently

---

## Implementation Order

### Phase 1: Setup (30 min)
1. Verify all required shadcn/ui components exist
2. Create any missing reusable components
3. Establish design system tokens

### Phase 2: Step 1 (1-2 hours)
1. Update Step 1 form layout
2. Add Select dropdown for Country
3. Change Address to Textarea
4. Test form submission

### Phase 3: Step 2 (2-3 hours)
1. Create DocumentDropzone component
2. Redesign upload layout to 2×2 grid
3. Add styling for dashed border
4. Update document types (KBIS → RIB change)
5. Test file upload

### Phase 4: Step 3 (2-3 hours)
1. Create BeneficialOwnersTable component
2. Replace card layout with table
3. Test add/edit/delete functionality
4. Verify form integration

### Phase 5: Step 4 (1-2 hours)
1. Add certificate card styling
2. Update final review layout
3. Add feature unlock cards

### Phase 6: Polish & Testing (1-2 hours)
1. Responsive design verification
2. Dark mode testing
3. Accessibility audit
4. Console error check

---

## Testing Checklist

### Functional Testing
- [ ] Step 1 form validates and submits
- [ ] Step 1 Country select works
- [ ] Step 1 Address textarea resizes properly
- [ ] Step 2 file uploads work
- [ ] Step 2 drag-drop works (if implemented)
- [ ] Step 2 document status updates
- [ ] Step 3 beneficiary table renders
- [ ] Step 3 add owner form works
- [ ] Step 3 edit/delete buttons work
- [ ] Step 4 displays all data correctly
- [ ] Navigation between steps works

### Visual Testing
- [ ] Layout matches Figma on desktop (1440px)
- [ ] Layout is responsive on tablet (768px)
- [ ] Layout is responsive on mobile (375px)
- [ ] Colors match design tokens
- [ ] Typography matches Figma
- [ ] Spacing matches Figma rhythm
- [ ] Dark mode works (if applicable)

### Code Quality
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] No console errors/warnings
- [ ] All imports resolve
- [ ] Accessibility passes (WAVE/axe)

### Business Logic
- [ ] Data persistence works (localStorage + API)
- [ ] Form validation unchanged
- [ ] API calls unchanged
- [ ] Progress tracking unchanged
- [ ] Navigation logic unchanged

---

## Files Summary

### To Modify
1. `src/app/dashboard/entrepreneur/(phases)/phase-2/step-1/client.tsx`
2. `src/app/dashboard/entrepreneur/(phases)/phase-2/step-2/page.tsx`
3. `src/app/dashboard/entrepreneur/(phases)/phase-2/step-3/page.tsx`
4. `src/app/dashboard/entrepreneur/(phases)/phase-2/step-4/page.tsx`

### To Create (Reusable Components)
1. `src/components/entrepreneur/DocumentDropzone.tsx` (optional)
2. `src/components/entrepreneur/BeneficialOwnersTable.tsx` (optional)

### No Changes Needed
- Hook files (usePhase2Step1Form, useEntrepreneurProgress)
- API integration files
- Types/DTOs
- Route configurations
- Backend integration

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|-----------|-----------|
| Input type changes (Select/Textarea) | **Low** | Test form submission thoroughly |
| Document upload 2×2 grid | **Medium** | Verify drag-drop accessibility |
| Table layout for owners | **Medium** | Ensure add/edit/delete work |
| Certificate card addition | **Low** | No logic changes, styling only |
| **Overall Risk** | **Low-Medium** | All changes are UI-focused |

---

## Timeline Estimate

- **Phase 1 (Setup):** 30 min
- **Phase 2 (Step 1):** 1-2 hours
- **Phase 3 (Step 2):** 2-3 hours
- **Phase 4 (Step 3):** 2-3 hours
- **Phase 5 (Step 4):** 1-2 hours
- **Phase 6 (Polish):** 1-2 hours

**Total: 8-14 hours**

---

## Sign-Off Criteria

✅ All steps match Figma design visually  
✅ All functionality preserved (forms, uploads, navigation)  
✅ No business logic changed  
✅ No API contracts modified  
✅ No TypeScript/ESLint errors  
✅ Responsive design works  
✅ Dark mode works (if applicable)  
✅ All tests pass  
