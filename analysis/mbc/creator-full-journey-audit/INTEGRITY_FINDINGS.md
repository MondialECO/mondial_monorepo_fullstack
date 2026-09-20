# MBC Creator Journey — Data Integrity & Write Pattern Findings

**Audit Date**: 2026-09-20  
**Audit Scope**: Database write patterns, client-side storage, ID propagation, and fabricated UI fallbacks at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Full-Document Replacement vs Targeted Atomic Writes

### 1.1 Confirmed Full-Document Replacement Pattern
- **Finding ID**: `INT-01`
- **Severity**: **HIGH**
- **Phase**: Journey-Wide / Persistence Layer
- **Location**: `backend/Services/Implementations/CreatorJourneyService.cs:246, 252`
- **Evidence**:
  ```csharp
  public async Task<CreatorJourney> ReplaceAsync(CreatorJourney journey, CancellationToken cancellationToken = default)
  {
      journey.UpdatedAt = DateTime.UtcNow;
      await _journeys.ReplaceOneAsync(
          j => j.Id == journey.Id,
          journey,
          new ReplaceOptions { IsUpsert = true },
          cancellationToken);
      return journey;
  }
  ```
- **What is actually true at HEAD**: All updates to `CreatorJourneys` (recording phase completion, updating step counters, storing Phase 4 pricing, storing Phase 5 decisions) call `ReplaceAsync`, which issues a MongoDB `ReplaceOneAsync` on the entire document.
- **Why it matters**: `ReplaceOneAsync` is a full-document replacement without optimistic concurrency controls. If a user has two browser tabs open (e.g. reviewing the Business Plan in Tab 1 while configuring Pricing in Tab 2), or if a background job finishes while the user is saving, the slower write will completely overwrite and discard the changes made by the earlier write. Contrast this with `WriteIdeaAsync` (`CreatorJourneyService.cs:167-200`), which correctly uses targeted `$set` with an `ExpectedVersion` check.

---

## 2. Client-Side Storage & LocalStorage Audit

### 2.1 Content Caching in LocalStorage
- **Finding ID**: `INT-02`
- **Severity**: **MEDIUM**
- **Phase**: Phase 2, Phase 3, Journey-Wide
- **Evidence**:
  1. `src/contexts/IdeaContext.tsx:38-45`:
     ```typescript
     localStorage.setItem('mbc_creator_active_idea', JSON.stringify(activeIdea));
     ```
     Persists the entire active idea summary, title, and industry tags into browser `localStorage`.
  2. `src/app/dashboard/creator/phase-2/brand-studio/page.tsx:92-104`:
     ```typescript
     localStorage.setItem('brand_studio_draft', JSON.stringify({ logoSvg, palette, typography }));
     ```
     Persists the generated SVG code and palette tokens to `localStorage` before server confirmation.
  3. `src/app/dashboard/creator/phase-3/forecast/page.tsx:95-102`:
     ```typescript
     localStorage.setItem('forecast_slider_draft', JSON.stringify({ arpu, opex, growth, churn }));
     ```
     Persists financial slider parameters into `localStorage`.
- **What is actually true at HEAD**: Real business content (active idea payload, SVG logo markup, and financial modeling parameters) is serialized to `localStorage` rather than keeping client storage restricted to ephemeral progress markers or session tokens.
- **Why it matters**: If a user accesses the platform from a shared computer or logs out and another user logs in, `localStorage` is not automatically purged on logout, risking cross-tenant data leakage or display of another user's brand assets.

---

## 3. ID Propagation & Multi-Idea Race Conditions

### 3.1 Dropped Query Parameters During Transitions
- **Finding ID**: `INT-03`
- **Severity**: **HIGH**
- **Phase**: Phase 2 → Phase 3 → Phase 4
- **Evidence**:
  1. `src/app/dashboard/creator/phase-2/clarifier/page.tsx:378`:
     `router.push('/dashboard/creator/phase-2/idea-summary')` (drops `?ideaId=`)
  2. `src/app/dashboard/creator/phase-2/idea-summary/page.tsx:74`:
     `router.push('/dashboard/creator/phase-2/concept-name')` (drops `?ideaId=`)
  3. `src/app/dashboard/creator/phase-2/complete/page.tsx:92`:
     `router.push('/dashboard/creator/phase-3')` (drops `?ideaId=`)
  4. `src/app/dashboard/creator/phase-3/complete/page.tsx:210`:
     `router.push('/dashboard/creator/offer-pricing')` (drops `?ideaId=`)
- **What is actually true at HEAD**: Intra-phase and phase-transition navigation drops the `ideaId` URL parameter. Downstream pages rely on `useIdea()` in `src/contexts/IdeaContext.tsx`. When a user refreshes the page, if `localStorage` is absent, `useIdea()` calls `GET /api/creator/ideas` and selects `response.data[0]`.
- **Why it matters**: If a creator has more than one idea registered under their account, navigating via CTA or refreshing the browser can silently switch the active context to a different idea, causing the user to generate Phase 3 or Phase 4 artifacts for the wrong startup.

---

## 4. Fabricated & Sample Data in UI Surfaces

### 4.1 Fabricated Brand Kit in Phase 2 Complete
- **Finding ID**: `INT-04`
- **Severity**: **HIGH**
- **Phase**: Phase 2 (Step 2.6)
- **Location**: `src/app/dashboard/creator/phase-2/complete/page.tsx:200-280`
- **Evidence**:
  ```tsx
  // Hardcoded fallback constants rendering in Phase 2 Complete Canvas
  const sampleValueProp = "The invoicing tool that does the awkward follow-up for you.";
  const sampleProblem = "Chasing late payments costs time, damages client relationships, and kills cash flow.";
  const sampleSolution = "Automated, tone-adaptive payment reminders that preserve relationships while accelerating cash collection.";
  const sampleTraits = ["Direct", "Calm", "Practical", "Modern", "Trustworthy"];
  const sampleColors = { primary: "#2563EB", secondary: "#0F172A", accent: "#F8FAFC" };
  ```
- **What is actually true at HEAD**: If a user chooses "Skip Branding" or completes Phase 2 with a custom name but without generating a Brand Studio logo, the Phase 2 summary screen renders these hardcoded sample strings, traits, and colors as if they were the user's authentic brand.
- **Why it matters**: A user building an AgriTech or MedTech startup will see an invoicing software value proposition and blue/slate brand identity presented on their completed summary card. This creates severe confusion regarding whether the system retained their actual idea inputs.

### 4.2 Synthetic Financial Assumptions Rendered Without Disclosure
- **Finding ID**: `INT-05`
- **Severity**: **MEDIUM**
- **Phase**: Phase 3 (Step 3.3 Forecast)
- **Location**: `src/app/dashboard/creator/phase-3/forecast/page.tsx:115-121`
- **Evidence**:
  ```typescript
  const defaultForecast = {
    tam: marketStudy?.tam ?? 1000000,
    arpu: 49,
    monthlyOpex: 8000,
    growthRate: 0.12,
    churnRate: 0.05
  };
  ```
- **What is actually true at HEAD**: When a user enters the financial forecast screen, the sliders initialize with $49 ARPU, $8,000 OPEX, 12% monthly growth, and 5% churn. If Market Study was bypassed, TAM is set to $1,000,000.
- **Why it matters**: There is no badge or label indicating that these numbers are synthetic defaults rather than data-backed projections. If the user does not adjust the sliders, these synthetic numbers are baked into the 12-section Executive Business Plan and the Investor Readiness financial score.
