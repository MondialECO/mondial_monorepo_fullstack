# PHASE 4.4 — SKILLS & TRAINING DATA & TRACEABILITY SOURCE MAP

## Traceability Architecture

Phase 4.4 maintains end-to-end lineage from upstream phases down to individual capability resolutions:

```
[Phase 1 & 2 Inputs] 
       │
[Phase 3 Legal Assessment] ──────┐ (Statutory Requirements)
       │                         │
[Phase 4.1 Construction Snapshot]│
       │                         ▼
[Phase 4.2 Operational Roadmap] ──► [Phase 4.3 Needs Analysis]
                                           │
                                           ├───────────────┐
                                           │ (Active Needs)│ (Covered Needs)
                                           ▼               ▼
      [HumainX Creator Profile] ───► [Phase 4.4 Skills Resolution Engine]
                                           │
                                           ▼
                                    [Phase 4.4 Skills Plan]
                                      ├── Learn Resolutions
                                      ├── Delegate Resolutions
                                      ├── Verify Resolutions
                                      └── Covered Capabilities
```

---

## Source Mapping Matrix

| Phase 4.4 Resolution Attribute | Upstream Source Element | Description / Invariant |
|---|---|---|
| `resolutionKey` | `needKey` in `NeedsAnalysis` | Stable deterministic identifier (`resolve.{needKey}`) |
| `needCategory` | `category` in `NeedsAnalysis` | Inherited verbatim (`Team`, `Services`, `LegalAdmin`, etc.) |
| `priority` | `priority` in `NeedsAnalysis` | Inherited verbatim (`Critical`, `High`, `Medium`, `Low`) |
| `timing` | `timing` in `NeedsAnalysis` | Inherited verbatim (`Now`, `Next30Days`, `BeforeLaunch`, etc.) |
| `blocking` | `blocking` in `NeedsAnalysis` | Inherited verbatim |
| `isMandatoryVerification` | Phase 3 Legal / Statutory Rules | Set strictly from upstream statutory evidence (Correction 2) |
| `resolutionMode` | Policy derivation | Evaluated against HumainX profile & complexity rules (Correction 1) |
| `optionalLearningSupplement` | Policy derivation | Foundational literacy attached to `VERIFY` items (Correction 3) |
| `CoveredCapabilities` | `CoveredRequirements` in 4.3 | Directly passed through without re-evaluation (Correction 4) |
| `learningAction.suggestedTopics` | Curated Taxonomy Catalog | Non-arbitrary, curated learning topics (Correction 5) |
| `founderDecision` | Founder PATCH API | User choice preserved across system refreshes (Correction 6) |
| `sources` | Source entity identifiers | Auditable list of origin records (`Phase4.3Needs`, `Phase3.Legal`, etc.) |

---

## Invalidation & Staleness Graph
- When `CreatorJourney.Phase4Data.NeedsAnalysis.GeneratedAt` updates $\rightarrow$ Phase 4.4 marks `UpdateAvailable = true`.
- When `HumainX` profile skills or availability are modified $\rightarrow$ Phase 4.4 detects hash mismatch and alerts founder.
- Refreshing re-runs the resolution policy while preserving existing founder decisions and notes.
