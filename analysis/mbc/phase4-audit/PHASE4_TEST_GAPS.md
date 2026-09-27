# MONDIAL BUSINESS CREATION (MBC) — CREATOR PHASE 4 TEST GAPS
**Current Test Coverage, Discovered Tests, and Recommended Quality Assertions**

---

## 1. Existing Test Execution Summary

### 1.1 Backend Unit & Integration Tests (C# .NET 8)
- **Test Project:** `backend/tests/WebApp.Tests/WebApp.Tests.csproj`
- **Phase 4 Filter:** `FullyQualifiedName~CreatorPhase4`
- **Total Discovered Tests:** **179**
- **Passing Tests:** **179** (100% Pass)
- **Failed Tests:** **0**
- **Test Files & Coverage:**
  1. `CreatorPhase4SnapshotTests.cs`: 28 tests (prerequisite gate, 15 categories, 5 diagnostic tiers, item deduplication, optimistic version header).
  2. `CreatorPhase4RoadmapTests.cs`: 33 tests (horizon distribution, founder capacity bounds, statutory INPI/Guichet Unique prerequisite wiring, customization persistence across refresh).
  3. `CreatorPhase4NeedsTests.cs`: 16 tests (decision vs fulfillment independence, founder note persistence, `KeepCurrent` synchronization).
  4. `CreatorPhase4SkillsTests.cs`: 14 tests (Learn/Delegate/Verify paths, statutory mandatory `VERIFY` locking, profile competency mapping).
  5. `CreatorPhase4SupportTests.cs`: 23 tests (prerequisite gate checks, location fact updates, official scheme matching, unawarded cash exclusion).
  6. `CreatorPhase4PricingTests.cs`: 32 tests (13 revenue models, 4-price independence, contribution margin floor formula, explicit tax modes).
  7. `CreatorPhase4GtmTests.cs`: 33 tests (channel scoring, founder availability guardrails, experiment logging).

---

### 1.2 Frontend Unit & Integration Tests (Vitest + React Testing Library)
- **Test Directory:** `src/__tests__/creator/`
- **Total Test Files:** **12**
- **Total Passing Tests:** **150** (100% Pass)
- **Failed Tests:** **0**
- **Phase 4 Test Files:**
  1. `phase4-construction-snapshot.test.tsx`: 11 / 11 PASS
  2. `phase4-operational-roadmap.test.tsx`: 11 / 11 PASS
  3. `phase4-needs-analysis.test.tsx`: 11 / 11 PASS
  4. `phase4-skills-plan.test.tsx`: 11 / 11 PASS
  5. `phase4-support-plan.test.tsx`: 8 / 8 PASS
  6. `phase4-pricing-strategy.test.tsx`: 11 / 11 PASS
  7. `phase4-gtm-strategy.test.tsx`: 6 / 6 PASS
  8. Supporting suites (`legacy-phase4-removal`, `humainx-quick-start`, `humainx-profile-builder`, `phase3-legal-assessment-ui`, `creator-dashboard`): 71 / 71 PASS

---

## 2. Identified Test Gaps & Recommended Additions

### Gap 1: Step 4.6 Concurrency Conflict (HTTP 409) Assertion
- **Current State:** `CreatorPhase4PricingTests.cs` tests pricing calculations and model overrides, but lacks a test asserting that passing an outdated `expectedVersion` returns `HTTP 409 Conflict`.
- **Recommended Test:**
  ```csharp
  [Fact]
  public async Task GeneratePricing_WithStaleExpectedVersion_Returns409Conflict()
  ```

### Gap 2: Step 4.5 Multi-Tab Fact Update Race Condition
- **Current State:** `phase4-support-plan.test.tsx` tests inline location fact submission, but does not simulate two tabs dispatching different location facts concurrently.
- **Recommended Test:** Integration test verifying that the server rejects outdated version mutations and prompts the client to refresh.

### Gap 3: Act Warning Cleanup in Support Unit Test (Finding P4-004)
- **Current State:** `phase4-support-plan.test.tsx:95` updates React state outside of `act(...)` during asynchronous promise resolution.
- **Recommended Fix:** Wrap the fact submission promise in `act(async () => { ... })`.

### Gap 4: Offline Reconnect & Upstream Staleness Alert E2E Test
- **Current State:** Component tests verify the rendering of `Support Engine Unavailable` and `Upstream Milestone Updates Detected` banners.
- **Recommended Test:** End-to-end Cypress/Playwright flow simulating modifying a Phase 3 deliverable, navigating forward to Phase 4, observing the banner, clicking `"Keep Current"`, and verifying automatic state reconciliation.

---
*End of Phase 4 Test Gaps Report.*
