# PHASE 4.2 — OPERATIONAL ROADMAP ENGINE

## Overview & Domain Purpose
Phase 4.2 translates the Creator's static diagnostic state (**Phase 4.1 Construction Snapshot**) and verified business intelligence into an executable, ordered, capacity-paced action roadmap.

### Strict Domain Separation
- **Phase 4.1 Construction Snapshot**: Answers **WHAT** is ready, partial, missing, or critical before building.
- **Phase 4.2 Operational Roadmap**: Answers **WHEN** and in **WHAT ORDER** work should happen.
- **Phase 4.3 Needs & Requirements**: Answers **WHAT RESOURCES** (people, tools, services) are required. (Unimplemented / Preserved).
- **Phase 4.4 Skills & Training**: Answers **HOW** to acquire capabilities (Learn, Delegate, Verify). (Unimplemented / Preserved).

---

## Architecture & Data Flow

```text
Phase 4.1 Construction Snapshot
        +
Legal Assessment (Temporal Stages)
        +
Financial Forecast (Runway & Milestones)
        +
Formation & Team Context
        +
Business Plan
        +
Weekly Availability (HumainX Venture Context)
        ↓
Normalized RoadmapContext
        ↓
Task Candidates Generation (Deduplicated, Stable Keys)
        ↓
Deterministic Dependency Graph (DAG + Cycle Detection)
        ↓
Capacity-Aware Scheduler (Pacing: Very Light → Intensive)
        ↓
Operational Roadmap
        ↓
Single Prominent Next Best Action
```

---

## Canonical Models

### Canonical Roadmap Stages
- `NOW`: Immediate focus (capacity-bounded).
- `NEXT_30_DAYS`: Secondary immediate priorities.
- `DAYS_30_TO_60`: Month 2 milestones.
- `DAYS_60_TO_90`: Month 3 prerequisites.
- `BEFORE_LAUNCH`: Mandatory launch gates (statutory certifications, formation, final GTM prep).
- `POST_LAUNCH`: Post-incorporation & ongoing compliance (annual filings, audits).

### Canonical Task Status
- `NotStarted`
- `InProgress`
- `Blocked`
- `Done`
- `Skipped`
- `NeedsReview`

### Canonical Task Priority
- `Critical`
- `High`
- `Medium`
- `Low`
- `Optional`

---

## Capacity Pacing Engine
Weekly availability dictates the density of tasks assigned to the `NOW` stage:
- `<5 hours/week`: Very Light (max 2 active NOW tasks)
- `5–10 hours/week`: Light (max 3 active NOW tasks)
- `10–20 hours/week`: Standard (max 5 active NOW tasks)
- `20–30 hours/week`: Accelerated (max 7 active NOW tasks)
- `30+ hours/week / Full-time`: Intensive (max 9 active NOW tasks)
- `Unspecified`: Conservative (max 3 active NOW tasks)

Tasks exceeding capacity without explicit blocking urgency are automatically shifted to `NEXT_30_DAYS` to avoid founder burnout and cognitive paralysis.

---

## Next Best Action Algorithm
Exactly one primary action is selected deterministically:
1. Unresolved `Critical` + `Blocking` task (dependency unblocked)
2. Unresolved `Critical` task (dependency unblocked)
3. `High` priority dependency-unblocked task in earliest stage
4. Earliest-stage unresolved unblocked task
5. Fallback: Any active task (e.g. `NeedsReview`)

---

## Founder-State Preservation & Staleness
- Stable task keys (e.g. `tech.execution`, `legal.professional-licence`, `formation.confirm-structure`) ensure that founder edits (`Status`, `FounderNotes`, `UpdatedAt`) survive explicit refreshes.
- If upstream sources (Snapshot, Weekly Availability, Forecast, Legal Checklist) change, `updateAvailable = true` is reported alongside `changedSources[]`.
- Founder can choose **Refresh Roadmap** (re-sequences with state preservation) or **Keep Current Version** (dismisses warning without state modification).
