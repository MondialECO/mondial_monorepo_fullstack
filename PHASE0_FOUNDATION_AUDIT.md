# Phase 0 — Foundation Audit & Preparation

**Completed:** 2026-06-13  
**Purpose:** Identify reusable components, design patterns, and foundation requirements

---

## ✅ Available UI Components (shadcn/ui)

All required components are already available:

```
src/components/ui/
├── alert.tsx          ✅ For info/warning messages
├── badge.tsx          ✅ For mandatory badges, status chips
├── button.tsx         ✅ For all actions
├── card.tsx           ✅ For cards/sections
├── checkbox.tsx       ✅ For checkboxes
├── dialog.tsx         ✅ For modals
├── input.tsx          ✅ For text inputs
├── label.tsx          ✅ For form labels
├── progress.tsx       ✅ For progress bars
├── select.tsx         ✅ For Country dropdown (NEEDED for Step 1)
├── separator.tsx      ✅ For dividers
├── textarea.tsx       ✅ For Address textarea (NEEDED for Step 1)
└── ... (others)
```

**No new dependencies needed.**

---

## ✅ Existing Entrepreneur Components

```
src/components/entrepreneur/
├── EntrepreneurLayout.tsx      ✅ Main layout wrapper with sidebar
├── ProgressSidebar.tsx         ✅ Left progress sidebar (maybe repositioned)
├── PhaseHeader.tsx             ✅ Header with title + progress
├── StepFooter.tsx              ✅ Footer with Back/Next buttons
├── PhaseTemplate.tsx           ✅ Generic phase template
├── PhaseFormWrapper.tsx         ✅ Form wrapper
├── FormTemplates.tsx           ✅ Reusable form components
├── PhaseCompletionScreen.tsx   ✅ Completion screen
├── LegalIdentityForm.tsx        ✅ Legal identity form (reference)
├── JobProgressIndicator.tsx    ✅ Progress indicator
├── RouteGuard.tsx              ✅ Route protection
└── [subdirs]
    ├── phase3/                 ✅ Phase 3 components (reference)
    ├── dataroom/               ✅ Phase 6 components
    ├── deals/                  ✅ Phase 9 components
    └── equity/                 ✅ Phase 4 components
```

**All key components exist and can be reused.**

---

## 🔍 Current Phase 2 Implementation Structure

### Step 1 (Legal Identity) — `step-1/client.tsx`
**Current:**
- Text Input for Company Name
- Text Input for Registration Number (SIRET)
- Select for Legal Form
- Date Input for Incorporation Date
- Text Input for Country ← **NEEDS: Change to Select dropdown**
- Text Input for Address ← **NEEDS: Change to Textarea**
- Text Input for Industry Code (NAF)

**Layout:**
- Stacked vertically
- Wrapped in `EntrepreneurLayout` with `ProgressSidebar`
- Uses existing `PhaseHeader` and `StepFooter`

**Business Logic:**
- Uses `usePhase2Step1Form` hook ✅ DO NOT MODIFY
- Form validation via react-hook-form ✅ PRESERVE
- API calls via `entrepreneurApi` ✅ PRESERVE

### Step 2 (Document Upload) — `step-2/page.tsx`
**Current:**
- Simple button list for uploads
- File input refs for each document
- Upload state tracking
- "X of 4 uploaded" counter

**Layout:**
- Vertical list of upload buttons
- Status shown via icons

**Business Logic:**
- Uses `useEntrepreneurProgress` hook ✅ PRESERVE
- File upload API calls ✅ PRESERVE
- State management ✅ PRESERVE

### Step 3 (Beneficial Owners) — `step-3/page.tsx`
**Current:**
- Cards displaying owner info
- Add Owner form
- Delete buttons

**Business Logic:**
- Uses existing dialogs ✅ PRESERVE
- Form state management ✅ PRESERVE
- API calls for CRUD ✅ PRESERVE

### Step 4 (Final Review) — `step-4/page.tsx`
**Current:**
- Summary display
- Action buttons

**Business Logic:**
- Submit/completion flow ✅ PRESERVE

---

## 🎨 Design System Analysis

### Colors Currently Used
- Primary actions: `bg-primary`, `text-primary`
- Neutral grays: `bg-neutral-1` through `bg-neutral-5`
- Success: `text-green-600`, `bg-green-50`
- Errors: `text-red-600`, `bg-red-50`
- Borders: `border-neutral-2`, `border-neutral-4`

**Status:** Using semantic tokens but some hardcoded colors exist.

### Typography
- Headings: Via `PhaseHeader` component (h1, h2)
- Body text: `text-sm`, `text-base`, `text-lg`
- Labels: `text-sm font-semibold`
- Helper text: `text-xs text-neutral-5`

**Status:** Consistent, no changes needed.

### Spacing
- Card padding: `p-4 sm:p-6 md:p-8`
- Vertical gaps: `space-y-4 md:space-y-6`
- Horizontal gaps: `space-x-2`, `gap-2`, `gap-4`

**Status:** Consistent Tailwind spacing, follows design system.

### Border Radius
- Cards: `rounded-2xl`, `rounded-xl`
- Buttons/Inputs: `rounded-lg`

**Status:** Consistent, matches Figma.

### Shadows
- Cards: `shadow-sm` or none
- Buttons: None (uses background color for elevation)

**Status:** Minimal shadows, matches modern design.

---

## 📋 Reusable Patterns Identified

### 1. Form Input Groups
Pattern used in Step 1:
```jsx
<div>
  <label>Label</label>
  <Input />
  <p>Helper text</p>
</div>
```

**Recommendation:** Keep as-is (no separate component needed).

### 2. Grid Layouts
- Two-column layout for form fields
- Used in Step 1 registration details

**Recommendation:** Use Tailwind grid (`grid grid-cols-1 md:grid-cols-2`).

### 3. Status Display
- Showing completed/pending/current states
- Used in Step 3 table

**Recommendation:** Use Badge component from shadcn/ui.

### 4. Upload/Action Cards
Pattern used in Step 2 (documents):
```jsx
<card>
  <icon />
  <name />
  <status />
  <action-buttons />
</card>
```

**Recommendation:** Extract as `DocumentUploadCard` component (optional, can inline).

### 5. Table Layouts
Pattern for ownership table (Step 3):
- Header row
- Data rows
- Action buttons per row

**Recommendation:** Use semantic HTML `<table>` with Tailwind styling (no separate Table component required for this use case).

---

## 🚀 Foundation Checklist

### Phase 0.1 — Verify Components
- [x] shadcn/ui components available (Select, Textarea, Badge, Button, Card, etc.)
- [x] Entrepreneur layout components exist
- [x] Form management hooks exist
- [x] API integration is functional

### Phase 0.2 — Design System Check
- [x] Colors use semantic tokens (mostly)
- [x] Typography is consistent
- [x] Spacing follows Tailwind conventions
- [x] Border radius is consistent
- [x] No new design tokens needed

### Phase 0.3 — Ready to Implement?
- [x] All required UI components available
- [x] No breaking changes needed
- [x] Business logic can be preserved 100%
- [x] Reusable patterns identified

---

## ⚠️ Constraints Reminder

**DO NOT:**
- ❌ Modify hooks (usePhase2Step1Form, useEntrepreneurProgress)
- ❌ Change API calls or contracts
- ❌ Modify validation logic
- ❌ Change routing or navigation
- ❌ Add new dependencies
- ❌ Rewrite unrelated components

**DO:**
- ✅ Update JSX and Tailwind classes only
- ✅ Reuse existing components
- ✅ Preserve all business logic
- ✅ Maintain API contracts
- ✅ Test thoroughly

---

## 📊 Implementation Readiness

| Area | Status | Notes |
|------|--------|-------|
| **UI Components** | ✅ Ready | All needed components available |
| **Hooks & Logic** | ✅ Ready | Zero changes needed |
| **API Integration** | ✅ Ready | Zero changes needed |
| **Design System** | ✅ Ready | Mostly uses tokens, minor cleanup possible |
| **Reusable Patterns** | ✅ Ready | Patterns identified, can proceed |
| **Type Safety** | ✅ Ready | No DTO changes planned |
| **Tests** | ✅ Ready | No business logic changes = fewer test updates |

---

## ✅ Foundation Ready

**Status: APPROVED FOR PHASE 1**

All prerequisites met. Ready to implement Step 1 UI changes.

Next: Implement Step 1 (Legal Identity) with Select dropdown and Textarea.

---

**Phase 0 Completion Time:** 1 hour  
**Foundation Status:** ✅ Complete  
**Ready to proceed:** YES
