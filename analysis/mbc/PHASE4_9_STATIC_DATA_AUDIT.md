# MBC Creator Phase 4.9 — Construction Readiness Static Data Audit & Remediation Report

**Document Status:** Final Verified  
**Date:** 2026-09-27  
**Audited Target:** `/dashboard/creator/phase-4/readiness?ideaId=...`  
**Git HEAD SHA:** `6850969743a30e32ee670e157aa9ff9bec4301ca`  
**Working Tree State:** Modified (contains uncommitted audit documents, Phase 4.9 implementation, and test suites)  
**Audit & Remediation Scope:** Verification and complete elimination of static business data fallbacks, fabricated effort estimates, synthetic task identities, and misleading summary fallbacks across frontend UI, React components, Next.js page, client API layer, backend ASP.NET Core controllers, C# service implementation, domain models, and MongoDB persistence.

---

## 1. Executive Summary & Remediation Verdict

All previously identified fallback discrepancies and static business-data vulnerabilities have been **fully resolved and verified**.

### Summary of Corrections Applied:
1. **Fabricated Effort Estimate Removed**: Production default `"1.5 hours"` was completely eliminated. Missing task estimates remain `null`, and the effort badge is honestly omitted in the UI.
2. **Synthetic Task Identity Removed**: The fallback task ID `"task-tech-delivery-1"` and synthetic `"Prepare technical delivery brief"` were eliminated. When no connected roadmap task exists, the system presents an honest `"Suggested action"` without attaching a synthetic task ID to deep-links or fabricating connected work.
3. **Artifact-Count Loading Guarded**: In `ConstructionReadinessView.tsx`, `{review?.savedArtifactsCount ?? 6}` was replaced with `{isLoading || !review ? '...' : `${review.savedArtifactsCount ?? review.artifacts?.filter((a) => a.status !== 'Missing').length ?? 0} saved artefacts`}`. Unknown counts display a loading placeholder (`...`) and genuine zero counts (`0 saved artefacts`) are accurately preserved.
4. **Dynamic Pricing Wording & Evidence Grounding**:
   - Pricing description now dynamically formats currency symbol (`€`, `$`, `£`), price amount, and billing frequency/revenue model (`per business / month`, `per year`, `one-off`, `per project`, `usage-based`, `per hour`, `per month retainer`).
   - Customer payment evidence clause dynamically inspects recorded evidence and empirical market evidence (`Customer payment evidence is recorded.` vs `Customer payment evidence is not yet recorded.`).
5. **Independent Website Draft & CTA Evaluation**:
   - Version selection and CTA destination configuration are evaluated independently.
   - An unselected draft with a configured CTA accurately states: `"Version {N} draft is available with CTA configured. Version selection is still needed."` and does not raise a false CTA issue.
6. **Summary Fallback Neutrality**:
   - Section 1 summary headline and guidance lines do not invent an available website draft or a technical blocker when data is missing or evaluating.

---

## 2. Complete Data Path & Provenance

```
[MongoDB Database]
   ├── CreatorIdea.Project (Name, Branding, BrandKitId)
   ├── CreatorIdea.Phase3Data (ForecastSessionId, OutputSnapshots)
   ├── CreatorIdea.Phase4Data
   │     ├── Roadmap (Stages, Tasks [Id, Title, EstimatedEffort, Status])
   │     ├── NeedsAnalysis (Requirements, Categories, Status)
   │     ├── SkillsPlan (Resolutions, ResolutionMode, FounderDecision)
   │     ├── SupportPlan (Grants, Status)
   │     ├── PricingStrategy (Status, Offers [Price, Currency, BillingFrequency, PricingModel, RecordedEvidence])
   │     ├── GtmStrategy (Status, BudgetPlan [TotalAvailableBudget, SpendableStatus])
   │     ├── LaunchAssets (Version, SelectedVersion, Sections, CTA Destination)
   │     └── ConstructionReadiness (ReviewedAt, SourceFingerprint, Saved Review)
   ▼
[ConstructionReadinessService.cs]
   ├── EvaluateAssessmentAsync(userId, ideaId, journey)
   │     ├── Evaluates 6 Artifact Cards against active phase records
   │     ├── Evaluates Critical & Secondary Attention Issues
   │     ├── Resolves Next Action Task & Estimated Effort (null if unknown) from Roadmap
   │     ├── Formats Pricing Currency, Billing Period, and Real Payment Evidence
   │     ├── Evaluates Website Draft Revision & CTA Destination Independently
   │     ├── Determines Status ("Ready for construction" / "Preparation in progress" / "Review in progress")
   │     ├── Keeps OverallScore null ("Score not yet calculated")
   │     └── Computes SHA-256 SourceFingerprint across active inputs
   ▼
[CreatorPhase4ConstructionController.cs]
   ├── GET  /api/creator/phase4/readiness?ideaId={ideaId} -> 200 Ok(ApiResponse.Ok(..., result))
   └── POST /api/creator/phase4/readiness/save            -> 200 Ok(ApiResponse.Ok(..., result))
   │     └── Emits X-Creator-Idea-Version response header & enforces optimistic concurrency
   ▼
[src/lib/api-creator-readiness.ts]
   ├── getReadinessAssessment(ideaId)
   └── saveReadinessReview(ideaId, explicitVersion, sourceFingerprint)
   ▼
[src/app/dashboard/creator/phase-4/readiness/page.tsx]
   └── Reads ideaId from useSearchParams / useCreatorProgress, fetches dynamic data via getReadinessAssessment(ideaId)
   ▼
[src/components/creator/phase4/ConstructionReadinessView.tsx]
   └── Renders 7 canonical sections dynamically bound to ConstructionReadinessReview props
```

---

## 3. Section-by-Section Binding & Verdict Table

| Section & UI Element | Backend DTO Field | Upstream Persisted Source | Fallback / Dynamic Behavior | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **S1: Status Badge** | `review.status` | Evaluated from critical issues & missing artifacts | `"Ready for construction"` / `"Preparation in progress"` / `"Review in progress"` | **Dynamic (Accurate)** |
| **S1: Headline** | `review.positionHeadline` | Evaluated based on active assets & technical readiness | Evaluates presence of assets and critical blocker; loading state uses neutral evaluating message | **Dynamic (Accurate)** |
| **S1: Guidance Lines** | `review.currentActionGuidance`, `dependencyGuidance` | Dynamic strings from backend evaluation | Rendered conditionally; omitted if null/empty | **Dynamic (Accurate)** |
| **S1: Overall Score** | `review.overallScore` | Nullable `double?` (`null`) | Renders `"Score not yet calculated"` | **Approved Canon State** |
| **S2: Artifact 1 (Brand Kit)** | `review.artifacts[0]` | `Project.Branding` / `IBrandKitStore` | `"Available"` / `"Missing"` | **Dynamic (Accurate)** |
| **S2: Artifact 2 (Forecast)** | `review.artifacts[1]` | `Phase3Data.ForecastSessionId` / snapshots | `"Generated"` / `"Missing"` | **Dynamic (Accurate)** |
| **S2: Artifact 3 (Roadmap)** | `review.artifacts[2]` | `Phase4Data.Roadmap.Status` | `"Active"` / `"Missing"` | **Dynamic (Accurate)** |
| **S2: Artifact 4 (Pricing)** | `review.artifacts[3]` | `PricingStrategy.Offers[0]` | Formats real currency (`€`, `$`, `£`), unit/frequency (`per business / month`, `per year`, etc.), and evidence status | **Dynamic (Accurate)** |
| **S2: Artifact 5 (GTM)** | `review.artifacts[4]` | `Phase4Data.GtmStrategy.Status` | `"Saved"` / `"Missing"` | **Dynamic (Accurate)** |
| **S2: Artifact 6 (Website)** | `review.artifacts[5]` | `LaunchAssets.Version`, `SelectedVersion`, CTA | Formats draft revision and CTA configuration status independently | **Dynamic (Accurate)** |
| **S2: Saved Count Badge** | `review.savedArtifactsCount` | `artifacts.Count(a => a.Status != "Missing")` | Displays `'...'` during loading; renders real count `0..6` when loaded | **Dynamic (Accurate)** |
| **S3: Tech Blocker Issue** | `review.issues.find(i => i.priority === 'critical')` | `SkillsPlan.Resolutions` (Delegate mode) | Bound to real uncompleted task; omits connected work if no task exists | **Dynamic (Accurate)** |
| **S3: Secondary Issues** | `review.issues.filter(i => i.priority !== 'critical')` | CTA destination, version selection, GTM budget, pricing terms | Added only when specific condition is unconfigured | **Dynamic (Accurate)** |
| **S4: Next Action Task** | `review.nextAction.title`, `taskId` | `Roadmap.Stages.Tasks` | Uses real task and deep-link if present; uses `"Suggested action"` without `taskId` if absent | **Dynamic (Accurate)** |
| **S4: Next Action Effort** | `review.nextAction.estimatedEffort` | `RoadmapTask.EstimatedEffort` | `null` when not recorded; effort pill is hidden | **Dynamic (Accurate)** |
| **S5: Why this assessment?** | Static principles (1, 2, 3) | Approved Figma canonical policy copy | Explanatory methodology copy | **Legitimate Static UI** |
| **S6: Continuing Panel** | Static dashboard guidance | Approved Figma navigational guidance | Explanatory dashboard copy | **Legitimate Static UI** |
| **S7: Footer Actions** | Back link & Save action | `saveReadinessReview(ideaId, ...)` | Transmits SHA-256 fingerprint & version | **Dynamic (Accurate)** |

---

## 4. Remediation Details & Code Diffs

### Item 1: `ConstructionReadinessService.cs`
- **Estimated Effort:** Changed to `string? taskEffort = !string.IsNullOrWhiteSpace(connectedTask?.EstimatedEffort) ? connectedTask.EstimatedEffort : null;`
- **Roadmap Task Identity:** If `connectedTask != null`, binds real `taskId`, `taskTitle`, `taskEffort`, and deep-link `&taskId={taskId}`. If `connectedTask == null`, sets `nextAction.Type = "Suggested action"`, `nextAction.TaskId = null`, `PrimaryActionRoute = "/dashboard/creator/phase-4/roadmap?ideaId={ideaId}"`, and sets `techIssue.ConnectedWork = null`.
- **Pricing Formatting:** Added `FormatCurrencySymbol` and `FormatPricingUnitAndPeriod` supporting all models (`Annual`, `OneOff`, `Hourly`, `PerUse`, `Retainer`, `Milestone`, `ProjectBased`, `UsageBased`, `Monthly`).
- **Payment Evidence:** Detects genuine payment evidence (`RecordedEvidence`, `HistoricalSale`, `PaidPilot`, `QuoteAccepted`) vs unrecorded evidence.
- **Website Evaluation:** Evaluates `ctaConfigured` and `isAssetsSelected` independently.

### Item 2: `ConstructionReadinessView.tsx`
- **Artifacts Count Badge:** `{isLoading || !review ? '...' : `${review.savedArtifactsCount ?? review.artifacts?.filter((a) => a.status !== 'Missing').length ?? 0} saved artefacts`}`
- **Section 1 Position Headline & Status:** Neutral loading states (`'Evaluating...'`, `'Evaluating saved project work and requirements...'`) rather than assuming a technical blocker and available website.
- **Guidance Rendering:** Renders guidance container and rows only if `currentActionGuidance` or `dependencyGuidance` is actually populated.

---

## 5. Verification & Test Results

### Backend Automated Tests
- Command: `dotnet test backend/tests/WebApp.Tests/WebApp.Tests.csproj --filter "FullyQualifiedName~CreatorPhase4"`
- Results: **240 / 240 Passed** (0 Failures, 0 Skipped).
- Readiness specific suite: **20 / 20 Passed** (`CreatorPhase4ConstructionReadinessTests.cs`), including new regression tests:
  - `GetReadinessAssessment_WhenTaskHasNoEffortEstimate_LeavesEstimatedEffortNull`
  - `GetReadinessAssessment_WhenNoRoadmapOrTask_UsesSuggestedActionWithoutFabricatingTaskId`
  - `GetReadinessAssessment_Pricing_FormatsFrequenciesAndModelsCorrectly`
  - `GetReadinessAssessment_Pricing_RecognizesPaidEvidence`
  - `GetReadinessAssessment_LaunchAssets_UnselectedWithConfiguredCta_AccuratelyReportsDraftState`
  - `GetReadinessAssessment_MissingLaunchAssets_SummaryDoesNotFabricateWebsiteDraft`

### Frontend Automated Tests
- Command: `npx.cmd vitest run src/__tests__/creator/phase4-`
- Results: **95 / 95 Passed** across 9 test suites.
- Readiness specific suite: **9 / 9 Passed** (`phase4-construction-readiness.test.tsx`), including new regression tests:
  - `renders loading placeholder for count and neutral status during loading`
  - `renders genuine zero count accurately when review has 0 saved artifacts`
  - `omits estimated effort badge when task effort is null`

### Static Analysis & Typecheck
- Command: `npx.cmd tsc --noEmit`
- Result: **0 Type Errors**.

---

## 6. Audit Sign-Off

- **Result:** Complete resolution of all static business data fallbacks. Zero hardcoded business data or fabricated estimates remain in production code paths.
