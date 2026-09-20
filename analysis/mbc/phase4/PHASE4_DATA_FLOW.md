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

