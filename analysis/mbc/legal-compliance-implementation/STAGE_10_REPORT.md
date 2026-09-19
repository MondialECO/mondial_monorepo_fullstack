# Stage 10 — Change Detection, Dependency Tracking & Stale-State Hardening Report

**Mondial Business Creation (MBC) — Creator Phase 3 Legal & Compliance Intelligence**  
**Jurisdiction:** France (`FR-2026.1`)  
**Status:** Completed & Verified  

---

## 1. Executive Summary

Stage 10 implements enterprise-grade, deterministic change detection, cross-module dependency tracking, and stale-state hardening for Creator Phase 3 Legal & Compliance Intelligence (`3.4`). It ensures that downstream outputs across the canonical 7-step sequence:
```text
3.1 Market Intelligence → 3.2 Business Model → 3.3 Financial Forecast → 3.4 Legal & Compliance → 3.5 Company Formation & Team → 3.6 Executive Business Plan → 3.7 Investor Readiness
```
never silently appear current after relevant upstream business changes occur, while strictly preventing false positives from cosmetic or non-material edits (such as branding palettes or logos).

---

## 2. Core Architecture & Mechanisms

### 2.1 Deterministic Snapshot Hashing & Selective Invalidation
- **Snapshot Fingerprinting (`BusinessSnapshotHash`):** Built via SHA-256 over normalized, canonical JSON representation of business profile signals (`IsSaaS`, `IsB2B`, `IsB2C`, `HasSubscription`, `HasOnlinePayments`, `CollectsPersonalData`, `IsMarketplace`, `HasPhysicalGoods`, `OperatesInRegulatedSector`, etc.).
- **Selective Invalidation (Zero False Positives):**
  - Non-material changes (e.g. brand logo, color palette, tagline, non-business text) do **NOT** invalidate the legal assessment.
  - Material business model mutations (e.g. pivoting B2B $\to$ B2C, adding subscriptions, introducing user profiling/personal data, enabling marketplace features) trigger immediate, deterministic staleness.
- **Rules Version Tracking (`RulesVersion`):** Staleness is also triggered if the underlying France regulatory catalogue is bumped (`RulesUpdated`), comparing stored assessment catalogue version against active engine catalogue version.

### 2.2 Human-Readable Signal Diffing (`LegalChangeDetector`)
- Signal dictionary maps boolean profile signals to human-safe labels:
  - `IsB2C = true` $\to$ `+ Consumer customers`
  - `HasSubscription = true` $\to$ `+ Subscription revenue model`
  - `CollectsPersonalData = true` $\to$ `+ Personal-data processing`
  - `IsMarketplace = true` $\to$ `+ Marketplace platform`
  - `HasPhysicalGoods = false` $\to$ `- Physical goods delivery`
- Centralized `ComputeDiffs(prev, curr)` returns structured diff objects with change types (`added`, `removed`, `modified`) and human descriptions.

### 2.3 Non-Destructive Requirement Reconciliation (`ReconcileAndEvaluate`)
- **Unchanged Requirements:** Status (`completed`, `in_progress`, etc.), user notes, and evidence links (`EvidenceDocumentId`, `EvidenceFileName`) are preserved without disruption.
- **Newly Applicable Requirements:** Inserted into the active checklist and marked with `IsNewRequirement = true` (rendered as a `+ NEW` badge in the UI).
- **No Longer Applicable Requirements:** Soft-retired to `status = not_applicable` and excluded from active checklist metrics, while historical evidence links and notes remain preserved for institutional audit trails.
- **Physical Evidence Safety:** Files stored in `CreatorIdea.Documents` are **never** deleted.
- **Idempotency:** Executing reconciliation multiple times without intervening signal mutations produces identical checklist state with zero duplicate requirements.

### 2.4 Cross-Module Dependency & Freshness Authority
- **Centralized Endpoint (`GET /api/creator/phase-3/freshness`):**
  - Evaluates freshness across Legal (`3.4`), Financial Forecast TAM (`3.3`), Executive Business Plan sections (`3.6`), and Investor Readiness (`3.7`).
- **Section 12 Legal & Regulatory Protection:**
  - Consumes authoritative assessment staleness and displays reason-aware alert banners with detected change pills.
  - Protects manual founder narrative edits: if the founder customized legal narrative (`isEdited = true`), the custom text is preserved and flagged with a `"Review suggested"` badge rather than being silently overwritten.
- **Financial Forecast (Step 3.3):**
  - Detects if upstream Step 3.1 Market Study TAM differs from the forecast TAM (`IsTamOverridden = true`) while preserving custom models with explicit provenance.
- **Investor Readiness (Step 3.7):**
  - Flags `"Readiness update available"` whenever upstream modules have updated since score calculation, offering a 1-click re-evaluation.

---

## 3. Test Suite Verification

A dedicated unit test suite was implemented in `backend/tests/WebApp.Tests/Unit/LegalChangeDetectionTests.cs` and executed via VSTest:

| Test ID | Test Description | Status |
|---|---|:---:|
| **Test A** | Identical business data $\to$ Not stale (`LegalStaleReasons.None`) | **PASSED** |
| **Test B** | Brand-only change $\to$ Legal not stale (Selective Invalidation verified) | **PASSED** |
| **Test C** | B2B $\to$ B2C change $\to$ Legal stale (`BusinessDataChanged`, `+ Consumer customers`) | **PASSED** |
| **Test D** | Subscription added $\to$ Legal stale (`+ Subscription revenue model`) | **PASSED** |
| **Test E** | Personal data added $\to$ Legal stale (`+ Personal-data processing`) | **PASSED** |
| **Test F** | Marketplace added $\to$ Legal stale (`+ Marketplace platform`) | **PASSED** |
| **Test G** | Rules version bump $\to$ Legal stale (`RulesUpdated`, `FR-2024.1` $\to$ `FR-2026.1`) | **PASSED** |
| **Test H** | Refresh preserves completed unchanged requirements & notes | **PASSED** |
| **Test I** | Refresh preserves evidence document links | **PASSED** |
| **Test J** | New applicable requirement added and marked `IsNewRequirement = true` (`+ NEW`) | **PASSED** |
| **Test K** | No-longer-applicable requirement marked `not_applicable`, removed from active roadmap | **PASSED** |
| **Test L** | Historical data & evidence links retained for retired requirements | **PASSED** |
| **Test M** | Refresh idempotency (two successive refreshes yield identical count & zero duplicates) | **PASSED** |
| **Test N** | Section 12 becomes current after refresh | **PASSED** |
| **Test O** | Wrong-user access denied (tenant isolation enforced) | **PASSED** |
| **Forecast** | Custom forecast TAM preserved with discrepancy detection against Market Study TAM | **PASSED** |
| **Business Plan** | Section 12 preserves manual founder narrative edits when edited | **PASSED** |
| **Readiness** | Upstream changes trigger `UpdateAvailable = true`, cleared upon re-evaluation | **PASSED** |

**Summary of Unit Test Runs:**
- `LegalChangeDetectionTests`: **18 passed, 0 failed, 0 skipped (61ms)**
- All Legal unit tests in test runner: **120 passed, 0 failed, 0 skipped (1.0s)**
- Monorepo `src/` TypeScript compile check: **0 errors**

---

## 4. Statutory & Regulatory Boundaries Maintained

In accordance with system policy and French regulatory compliance standards:
- The system generates structured legal compliance planning intelligence and evidence tracking.
- It explicitly disclaims statutory certification, lawyer representation, and formal legal advice.
- It does **not** attempt automated filing with INPI / Guichet Unique or automatic CNIL registrations.
