# Phase 4.5 Support Freshness & Invalidation Policy

## 1. Refresh Cadences & Invalidation Triggers

1. **National Statutory Schemes (ACRE, ARCE, ARE)**:
   - Cadence: Weekly rolling check.
   - Triggers: Regulatory modifications to Code du Travail or URSSAF bulletins.

2. **Competitive & Innovation Calls (Bourse French Tech, Innov'Up)**:
   - Cadence: Bi-weekly check.
   - Triggers: Opening/closing of call for projects, annual budget pool adjustments.

3. **Regional Schemes (Île-de-France, Hauts-de-France, etc.)**:
   - Cadence: Bi-weekly check via `IRegionalSupportAdapter`.
   - Triggers: Regional council deliberation updates, quota fulfillment.

4. **Bulk Catalog Baseline (Aides-entreprises Open Data)**:
   - Cadence: Monthly bulk dataset sync.
   - Triggers: New official release of open data archive.

---

## 2. Invalidation & Staleness Detection

A Creator's generated `SupportPlan` is flagged as stale (`updateAvailable: true`) when:
- `ConstructionSnapshot.GeneratedAt` > `SupportPlan.SourceVersions.SnapshotGeneratedAt`
- `OperationalRoadmap.GeneratedAt` > `SupportPlan.SourceVersions.RoadmapGeneratedAt`
- `NeedsAnalysis.UpdatedAt` > `SupportPlan.SourceVersions.NeedsGeneratedAt`
- `SkillsPlan.UpdatedAt` > `SupportPlan.SourceVersions.SkillsGeneratedAt`
- `ProfessionalProfile.UpdatedAt` > `SupportPlan.SourceVersions.ProfileUpdatedAt`
- `CatalogueRuleVersion` changed in database (e.g. from "1.0" to "1.1").

**Reconciliation Policy**:
Refreshing a support plan MUST preserve founder application tracking states (`FounderApplicationState` and `FounderNotes`) matched by stable key (`support.{sourceId}.{externalOpportunityId}`).
