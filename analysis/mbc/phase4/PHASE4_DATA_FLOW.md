# Phase 4 Data Flow & Idempotency Rules

## Request Lifecycle

```text
1. GET /api/creator/phase4/construction-snapshot?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted snapshot from Phase4Data
   ├── Compare source references with live DB versions (Project, Forecast, Profile, etc.)
   └── Return ConstructionSnapshotResponse:
       { snapshot, updateAvailable, changedSources }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/construction-snapshot/generate
   ├── Idempotent Initial Generation
   ├── Gate Check: User Authenticated + Project Owned + Phase 3 Completed + HumainX Phase4Ready
   ├── If snapshot already exists: Return existing snapshot immediately (No silent overwrite!)
   └── If fresh:
       Normalize ConstructionContext
       Evaluate Deterministic Rules across 15 Categories
       Synthesize OverallSummary
       Persist snapshot & Phase4SourceVersions in Phase4Data
       Return ConstructionSnapshotResponse

3. POST /api/creator/phase4/construction-snapshot/refresh
   ├── Explicit User-Initiated Refresh
   ├── Gate Check
   ├── Reload authoritative source documents
   ├── Normalize ConstructionContext
   ├── Re-run deterministic categorization and capability matching
   ├── Persist updated snapshot & fresh Phase4SourceVersions
   └── Return ConstructionSnapshotResponse with updateAvailable = false
```

## UpdateAvailable & ChangedSources Computation

- `UpdateAvailable` and `ChangedSources` are computed dynamically on response generation by comparing stored `Phase4SourceVersions` against active documents:
  - `MarketStudySession.CurrentVersion` != `stored.MarketStudyVersion`
  - `BusinessModelSession.CurrentVersion` != `stored.BusinessModelVersion`
  - `ForecastSession.CurrentVersion` != `stored.ForecastVersion`
  - `BusinessPlanSession.CurrentVersion` != `stored.BusinessPlanVersion`
  - `ProfessionalProfileRecord.UpdatedAt` > `stored.ProfessionalProfileUpdatedAt`
  - `Project.UpdatedAt` > `stored.ProjectUpdatedAt`
- They are **not persisted** inside the `ConstructionSnapshot` document itself.

---

## Phase 4.2 Operational Roadmap Request Lifecycle

```text
1. GET /api/creator/phase4/roadmap?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted roadmap from Phase4Data.Roadmap
   ├── Compare source references with active source versions (Snapshot, Availability, Forecast, Legal)
   └── Return OperationalRoadmapResponse { roadmap, updateAvailable, changedSources, counts }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/roadmap/generate
   ├── Idempotent Initial Generation
   ├── Gate Check: User Authenticated + Project Owned + Phase 3 Completed + HumainX Phase4Ready + ConstructionSnapshot exists
   ├── If roadmap already exists: Return existing roadmap immediately (Idempotent, no regeneration)
   └── If fresh:
       Normalize RoadmapContext
       Generate Task Candidates from Snapshot, Legal, Formation & Forecast
       Wire DAG Dependencies (DFS Cycle Detection)
       Schedule into Canonical Stages (pacing by WeeklyAvailability capacity)
       Select single NextBestAction
       Persist roadmap in Phase4Data.Roadmap
       Return OperationalRoadmapResponse

3. POST /api/creator/phase4/roadmap/refresh
   ├── Explicit User-Initiated Refresh
   ├── Gate Check
   ├── Reload active sources (Snapshot, Profile, Forecast, Legal)
   ├── Re-evaluate Candidates & Scheduler
   ├── Reconcile with existing tasks using stable Keys
   ├── Preserve Founder-Controlled State (Status, FounderNotes, FounderEdited)
   ├── Persist updated roadmap
   └── Return OperationalRoadmapResponse with updateAvailable = false

4. PATCH /api/creator/phase4/roadmap/task?ideaId={ideaId}
   ├── Updates Founder Task State (Status: NotStarted/InProgress/Blocked/Done, FounderNotes)
   ├── Automatically re-evaluates single NextBestAction if current NBA completed/blocked
   └── Persists without regenerating the entire roadmap
```

---

## Phase 4.3 Needs & Requirements Request Lifecycle

```text
1. GET /api/creator/phase4/needs?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted needs from Phase4Data.NeedsAnalysis (Single Source of Truth)
   ├── Compare source references with active source versions (Snapshot, Roadmap, Forecast, Profile, Legal)
   └── Return NeedsAnalysisResponse { needsAnalysis, updateAvailable, changedSources, counts }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/needs/generate
   ├── Idempotent Initial Generation
   ├── Gate Check:
   │   ├── User Authenticated + Project Owned
   │   ├── Phase 3 Completed
   │   ├── HumainX Phase4Ready
   │   ├── ConstructionSnapshot exists AND NOT STALE (rejects with SNAPSHOT_REFRESH_REQUIRED)
   │   └── OperationalRoadmap exists AND NOT STALE (rejects with ROADMAP_REFRESH_REQUIRED)
   ├── If needs analysis already exists: Return existing analysis immediately (Idempotent)
   └── If fresh:
       Normalize NeedsContext
       Generate Raw Requirement Candidates from Snapshot Gaps, Roadmap Tasks, Legal Prereqs & Forecast
       Match capabilities against HumainX founder profile and team to suppress false positives
       Deduplicate into stable keys
       Separate ActiveNeeds from CoveredRequirements (prevents list inflation)
       Persist strictly on CreatorJourney.Phase4Data.NeedsAnalysis (ZERO dual-writing)
       Return NeedsAnalysisResponse

3. POST /api/creator/phase4/needs/refresh
   ├── Explicit User-Initiated Refresh
   ├── Upstream Freshness Gate Check (Snapshot + Roadmap must be current)
   ├── Re-evaluate Candidates & Capability Coverage
   ├── Reconcile with existing needs using stable Keys
   ├── Preserve FounderState, Notes, CustomBudget, CustomTiming
   ├── Persist updated needs analysis on CreatorJourney
   └── Return NeedsAnalysisResponse with updateAvailable = false

4. PATCH /api/creator/phase4/needs/{needKey}?ideaId={ideaId}
   ├── Single Canonical PATCH endpoint
   ├── Updates FounderState (Unreviewed, Confirmed, InProgress, Deferred, ClaimedSatisfied)
   ├── Updates Founder Notes, CustomBudget, or CustomTiming
   └── Persists directly on CreatorJourney without mutating SystemStatus
```

---

## Phase 4.4 Skills & Training Request Lifecycle

```text
1. GET /api/creator/phase4/skills-plan?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted skills plan from Phase4Data.SkillsPlan (Single Source of Truth)
   ├── Compare source references with active source versions (NeedsAnalysis, HumainX Profile)
   └── Return SkillsPlanResponse { plan, updateAvailable, changedSources, summary, profileSummary }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/skills-plan/generate
   ├── Idempotent Initial Generation
   ├── Gate Check:
   │   ├── User Authenticated + Project Owned
   │   ├── Phase 3 Completed
   │   ├── HumainX Phase4Ready
   │   └── NeedsAnalysis exists AND NOT STALE (rejects with NEEDS_REFRESH_REQUIRED)
   ├── If skills plan already exists: Return existing plan immediately (Idempotent)
   └── If fresh:
       Normalize SkillsResolutionContext from NeedsAnalysis & HumainX Profile
       Directly pass through Phase 4.3 CoveredRequirements to CoveredCapabilities (Correction 4)
       Evaluate Unresolved Needs against 6 Invariant Resolution Rules (Correction 1, 2, 3, 5)
       Generate Actionable Curricula for LEARN and Outcomes for DELEGATE / VERIFY
       Persist strictly on CreatorJourney.Phase4Data.SkillsPlan (ZERO dual-writing)
       Return SkillsPlanResponse

3. POST /api/creator/phase4/skills-plan/refresh
   ├── Explicit User-Initiated Refresh
   ├── Gate Check (NeedsAnalysis must be current)
   ├── Re-evaluate Capability Resolution Policy
   ├── Reconcile with existing resolutions using stable ResolutionKeys
   ├── Preserve FounderDecision, FounderNotes, and FounderEdited (Correction 6)
   ├── Persist updated skills plan on CreatorJourney
   └── Return SkillsPlanResponse with updateAvailable = false

4. PATCH /api/creator/phase4/skills-plan/{resolutionKey}?ideaId={ideaId}
   ├── Single Canonical Resolution Override endpoint
   ├── Statutory Safety Lock: Rejects override if isMandatoryVerification == true (Correction 6)
   ├── Records FounderDecision (ChooseLearn, ChooseDelegate, ConfirmCovered, Defer)
   ├── Updates FounderNotes and marks FounderEdited = true
   └── Persists directly on CreatorJourney without mutating System ResolutionMode
```

---

## Phase 4.5 Aids, Grants & Support Request Lifecycle

```text
1. GET /api/creator/phase4/support?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted support plan from Phase4Data.SupportPlan (Single Source of Truth)
   ├── Compare source references with active source versions (NeedsAnalysis, Legal, Profile)
   └── Return SupportPlanResponse { plan, updateAvailable, changedSources, summary }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/support/generate
   ├── Idempotent Initial Generation
   ├── Gate Check: NeedsAnalysis must exist and be fresh
   ├── Normalize SupportContext from Needs, Legal, Profile
   ├── Run Deterministic Support Matcher across Registry (Bpifrance, France Travail, Regional)
   ├── Persist strictly on CreatorJourney.Phase4Data.SupportPlan (ZERO dual-writing)
   └── Return SupportPlanResponse

3. POST /api/creator/phase4/support/refresh
   ├── Explicit User-Initiated Refresh
   ├── Re-evaluate opportunities against fresh sources
   ├── Preserve FounderStatus, CustomAmounts, and FounderNotes
   ├── Persist updated plan
   └── Return SupportPlanResponse with updateAvailable = false

4. PATCH /api/creator/phase4/support/{supportKey}?ideaId={ideaId}
   ├── Founder Decision Override (Planned, Applied, Secured, Rejected, Ignored)
   ├── Updates FounderNotes and CustomAmount
   └── Persists directly on CreatorJourney
```

---

## Phase 4.6 Pricing & Revenue Model Request Lifecycle

```text
1. GET /api/creator/phase4/pricing?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted strategy from Phase4Data.PricingStrategy (Single Source of Truth)
   ├── Compare source references with active source versions (MarketStudy, BusinessModel, Forecast, Needs, Support)
   │   * Note: SupportPlan only triggers staleness if consumed by pricing (Correction 7) *
   └── Return PricingStrategyResponse { strategy, updateAvailable, changedSources, summary, activeOffersCount, warningsCount }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/pricing/generate
   ├── Idempotent Initial Generation
   ├── Gate Check:
   │   ├── User Authenticated + Project Owned
   │   ├── Phase 3 Completed (MarketStudy, BusinessModel, Forecast)
   │   ├── HumainX Profile Phase4Ready
   │   ├── ConstructionSnapshot exists & current (Phase 4.1)
   │   ├── OperationalRoadmap exists & current (Phase 4.2)
   │   ├── NeedsAnalysis exists & current (Phase 4.3)
   │   ├── SkillsPlan exists & current (Phase 4.4)
   │   └── SupportPlan is OPTIONAL (Phase 4.5; consumed only when explicitly relevant)
   ├── If pricing strategy already exists: Return existing strategy immediately (Idempotent)
   └── If fresh:
       Normalize PricingContext from Phase 3 & Phase 4 sources (ZERO mutation of upstream documents)
       Synthesize PrimaryRevenueModel, RevenueModels[], Offers[] (Enforces Four-Price Separation Invariant)
       Calculate Mathematically Rigorous Floor: P_min = VC / (1 - m) or VC + A (Correction 2)
       Normalize ARPU & Forecast Alignment Basis: Periodic/Transactional (Correction 3)
       Apply Configurable Materiality Policy (Correction 4)
       Configure PricePresentation & French Tax Mode (HT/TTC) (Correction 5)
       Generate Empirical Validation Experiments (Smoke test, pre-order, concierge, etc.)
       Persist strictly on CreatorJourney.Phase4Data.PricingStrategy (ZERO dual-writing)
       Return PricingStrategyResponse

3. POST /api/creator/phase4/pricing/refresh
   ├── Explicit User-Initiated Refresh
   ├── Gate Check
   ├── Reload authoritative source documents
   ├── Re-run pricing policy and floor calculations
   ├── Reconcile with existing offers using stable OfferKey
   ├── Preserve FounderSelectedPrice, FounderPriceRationale, SelectedByFounder (Correction 6)
   ├── Recompute Contribution Margin, Forecast Alignment, Materiality Flags immediately
   ├── Persist updated strategy on CreatorJourney
   └── Return PricingStrategyResponse with updateAvailable = false

4. PATCH /api/creator/phase4/pricing/{offerKey}?ideaId={ideaId}
   ├── Single Canonical Offer Adjustment endpoint
   ├── Sets FounderSelectedPrice, FounderPriceRationale, SelectedByFounder = true
   ├── Immediately Recalculates:
   │   ├── ContributionMarginAmount & ContributionMarginPercent
   │   ├── Floor Violated Flag (if FounderSelectedPrice < MinimumViablePrice)
   │   ├── Forecast Alignment Variance & Materiality Flag (NeedsReview if unit economics unknown)
   ├── Updates Strategy Level Summaries (BlendedMargin, ForecastAlignmentState, WarningsCount)
   └── Persists directly on CreatorJourney without mutating RecommendedPrice or MarketPrice (3 distinct prices preserved)
```

---

## Phase 4.7 Go-To-Market & Launch Strategy Request Lifecycle

```text
1. GET /api/creator/phase4/gtm?ideaId={ideaId}
   ├── Read-Only Idempotent Read
   ├── Load persisted strategy from Phase4Data.GtmStrategy (Single Source of Truth)
   ├── Check prerequisite gate (Phase 4.6 PricingStrategy required)
   ├── Evaluate consumed-source staleness against CurrentSourceVersions:
   │   ├── Checks PricingStrategyUpdatedAt and PricingOffersFingerprint
   │   ├── Checks ConsumedWeeklyAvailability against founder HumainX profile
   │   ├── Checks ConsumedForecastMarketingBudget and ConsumedForecastCac
   │   └── Checks MarketStudy and BusinessModel versions
   │   * Unconsumed forecast changes (tax, opex) do NOT stale GTM *
   └── Return GtmStrategyResponse { strategy, updateAvailable, changedSources, prerequisiteGate }
   * NEVER generates or mutates database state on GET *

2. POST /api/creator/phase4/gtm/generate
   ├── Idempotent Initial Generation
   ├── Gate Check:
   │   ├── User Authenticated + Project Owned
   │   ├── Phase 3 Completed (MarketStudy, BusinessModel, Forecast)
   │   ├── HumainX Profile Phase4Ready
   │   └── PricingStrategy exists (Phase 4.6 mandatory prerequisite)
   ├── If GTM strategy already exists: Return existing strategy immediately (Idempotent)
   └── If fresh:
       Normalize GtmContext from Phase 3, Phase 4.2-4.6, and Founder Profile
       Derive Multi-Signal Sales Motion via SalesMotionContext (not raw price alone)
       Prioritize Channels with Deterministic Reason Codes (GtmRecommendationReason enum)
       Reconcile Capacity via Shared FounderCapacityResolver using effort points (High=4, Med=2, Low=1)
       Design Empirical Experiments with NeedsBaseline thresholds (Zero invented CAC/conversion benchmarks)
       Derive Budget Provenance (Forecast planned spend vs confirmed cash; potential grants excluded)
       Assemble Stable Funnel Metrics Framework Contract
       Persist strictly on CreatorJourney.Phase4Data.GtmStrategy (ZERO dual-writing)
       Return GtmStrategyResponse

3. POST /api/creator/phase4/gtm/refresh
   ├── Explicit User-Initiated Refresh
   ├── Reload authoritative upstream documents
   ├── Re-evaluate channels, capacity, and recommendations
   ├── Reconcile with existing channels preserving Founder Priority Overrides and Notes
   ├── Carry forward all completed ExperimentRun records immutably
   ├── Update SourceVersions to latest consumed versions
   ├── Persist updated strategy on CreatorJourney
   └── Return GtmStrategyResponse with updateAvailable = false

4. PATCH /api/creator/phase4/gtm/channels/{channelKey}
   ├── Founder Channel Override Endpoint
   ├── Updates Channel Priority (Primary, Secondary, Later, NotRecommended)
   ├── Stores Founder Notes and sets founderEdited = true
   └── Persists directly on CreatorJourney

5. POST /api/creator/phase4/gtm/experiments/{experimentKey}/runs
   ├── Immutable Evidence Recording Endpoint
   ├── Records actual spend, actual effort, qualitative observations, metrics, and outcome
   ├── Appends Run to Experiment.Runs[]
   └── Persists directly on CreatorJourney (Preserved across all future refreshes)
```
