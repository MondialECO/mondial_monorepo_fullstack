# AI Credit Metering, Visibility & Fault-Tolerant Refund Architecture

**Document Version:** 1.0  
**Date:** 2026-09-14  
**Status:** Production Ready & Verified  
**Scope:** AI Model Routing, Ledger Accounting, Credit Visibility, Fault-Tolerant Compensation  

---

## 1. Executive Summary

The Mondial AI credit subsystem establishes an authoritative, fault-tolerant metering and balance visibility layer across all Creator and Entrepreneur AI capabilities (`IdeaClarifier`, `BusinessPlan`, `Forecast`, `IdeaGenerator`, `Probe`).

Key architectural guarantees:
1. **Zero-Unfair-Debit Guarantee:** Any AI job that terminates in failure or unusable output automatically restores the debited credits to the user's available balance with gross spent accounting preserved.
2. **Deterministic Race Prevention:** Credit refunds are committed to the MongoDB ledger *before* the session document is transitioned to `Failed`. Client polling hooks that detect terminal failure will *always* observe the restored balance on subsequent query invalidation.
3. **Single Source of Truth:** `GET /api/ai/credits` is the sole authoritative endpoint for credit balance, lifetime statistics, and per-capability costs. The frontend never hardcodes costs or executes balance arithmetic locally.
4. **Live Real-Time Feedback Without Reload:** The topbar `AiCreditBadge` reflects debits immediately upon generation dispatch and reflects refunds upon job completion or failure dynamically without page reloads.
5. **Reasoning-Aware Capacity Headroom:** All capabilities route to `google/gemini-3.8-flash`. Output contracts are trimmed (e.g. redundant Forecast monthly notes removed) to reserve 1,600+ tokens of headroom specifically for Gemini internal chain-of-thought variance under the 8,000 token ceiling.

---

## 2. Capability Costs & Model Routing

All capabilities route authoritatively to `google/gemini-3.8-flash` in base configuration (`backend/appsettings.json`), enforced by physical-file binding tests (`ModelRouterTests.cs`):

| Capability | Model | Credit Cost | Output Token Ceiling | Description |
|---|---|---|---|---|
| **`IdeaClarifier`** (`C-2`) | `google/gemini-3.8-flash` | **20 credits** | **3,500 tokens** | Problem, audience, alternative analysis, clarity scoring (locked baseline; pre-ceiling benchmark median 3,105 tokens) |
| **`MarketStudy`** (`3.1`) | `google/gemini-3.8-flash` | **20 credits** | **7,500 tokens** | TAM/SAM/SOM market sizing funnel, validated gap, competitor benchmarking, demand signals, sizing sensitivity risks |
| **`BusinessModel`** (`3.2`) | `google/gemini-3.8-flash` | **18 credits** | **8,500 tokens** | Canonical 9-block Osterwalder canvas, pricing tier architecture, modelled unit economics (ARPU/CAC/LTV/Payback) |
| **`BusinessPlan`** (`C-3`) | `google/gemini-3.8-flash` | **33 credits** | **7,500 tokens** | 9-section enterprise business plan (pre-ceiling benchmark median 5,182 tokens) |
| **`Forecast`** (`C-4`) | `google/gemini-3.8-flash` | **32 credits** *(Provisional)* | **8,000 tokens** | 36-month projections (12 AI + 24 algorithmic projection; post-8k ceiling, post-trim benchmark median 5,001 tokens, ratio 1.6106) |
| **`DirectionGeneration`** | `google/gemini-3.8-flash` | **7 credits** | **4,500 tokens** | 4-candidate strategic brand direction generator (archetypes, motifs, rationales; observed peak 2,827 tokens) |
| **`LogoParameterSelection`**| `google/gemini-3.8-flash` | **4 credits** | **3,000 tokens** | 6-concept parametric logo batch generator across 6 mark families (observed peak 1,649 tokens) |
| **`LogoConceptRegenerate`** | — | **0 credits** | — | Single logo concept regeneration (free deterministic in-memory SVG parametric redraw) |
| **`ColorGeneration`** | `google/gemini-3.8-flash` | **2 credits** | **4,500 tokens** | 5-role colour palette regeneration (contrast, harmony, and luminance enforcement; observed peak 3,228 tokens) |
| **`TypographyGeneration`** | `google/gemini-3.8-flash` | **2 credits** | **2,000 tokens** | 4-role typography system regeneration (distinct pairing validation; observed peak 457 tokens) |
| **`IdeaGenerator`** | `google/gemini-3.8-flash` | **0 credits** | **3,500 tokens** | Unmetered discovery generator |
| **`Probe`** | `google/gemini-3.8-flash` | **0 credits** | **500 tokens** | Operational health self-test |
| **Deterministic Derivations** | — | **0 credits** | — | Free initial color/typography derivations, derived variations, section patches |

> [!NOTE]
> **Dynamic Configuration & Safe Fallback Degradation**: Token ceilings are configurable via `appsettings.json` under `Ai:OutputTokenLimits` (or `AI__OUTPUTTOKENLIMITS__<JOBTYPE>` env vars). Job handlers inject `IOptions<AiSettings>` and resolve the active ceiling at runtime. If a configuration key is absent or zero, the handler degrades safely to an internal `DefaultMaxOutputTokens` constants rather than 0 or unbounded requests.

> [!NOTE]
> **Free-Tier Starter Credit Eligibility & Option A Failure Handling**: All billed Brand Kit AI operations (`DirectionGeneration`, `LogoParameterSelection`, `ColorGeneration`, `TypographyGeneration`) are fully eligible for consumption against the user's standard 200 starter credit grant (`Ai:StarterCredits = 200`). Under Option A, any AI model failure or validation failure immediately propagates an honest HTTP 500 error, automatically refunds debited credits via `IAiCreditService.RefundForJobAsync`, preserves regenerate caps, and never substitutes deterministic fallbacks. Single logo concept regeneration is fully local and free (0 credits).


---

## 3. Credit Ledger & Accounting Model

### A. Document Schema (`AiCreditLedger`)
Storage collection: `AICredits` (MongoDB).

```json
{
  "_id": "ObjectId(...)",
  "OwnerUserId": "user-guid-string",
  "Balance": 189,
  "LifetimeGranted": 200,
  "LifetimeSpent": 11,
  "Debits": [
    {
      "OperationId": "6aa821414c09fc5641f2c8e8",
      "Amount": 5,
      "Reason": "Forecast",
      "Refunded": false,
      "At": "2026-09-14T16:31:01Z"
    }
  ],
  "PeriodStart": null,
  "PeriodEnd": null,
  "PeriodCreditsSpent": null,
  "CarryOverCeiling": null,
  "CreatedAt": "2026-09-01T00:00:00Z",
  "UpdatedAt": "2026-09-14T16:31:01Z"
}
```

### B. Gross Spent Accounting
- **Debits**: Decrement `Balance`, increment `LifetimeSpent`, push debit subdocument to `Debits`.
- **Refunds**: Increment `Balance`, set `Debits.$.Refunded = true`, set `Debits.$.RefundedAt = now`. `LifetimeSpent` remains immutable lifetime consumption history (no revisionist ledger history).
- **Idempotency**: Every refund specifies the original `OperationId` and expected amount. Subsequent refund attempts return `CreditRefundResult.AlreadyRefunded` and make no state modifications.
- **Period Tracking**: The dormant measurement period schema (`PeriodStart`, `PeriodEnd`, `PeriodCreditsSpent`, `CarryOverCeiling`) enables atomic per-cycle usage tracking without altering lifetime balance behavior until business activation.

### C. Starter Credit Lifecycle & Guarantees
- **Configured Starter Balance**: **200 credits** (`Ai:StarterCredits = 200` in `AiSettings.cs`, `appsettings.json`, and `appsettings.Development.json`).
- **Lazy Initialization (Dashboard Mount)**: The physical `AICredits` ledger is **not** created during `POST /api/auth/register` or during onboarding. When a Creator navigates to their dashboard, `<AiCreditBadge />` mounts and queries `GET /api/ai/credits`. `AiCreditService.GetBalanceAsync` invokes `AiCreditLedgerRepository.TryGrantInitialAsync(ownerUserId, 200)` to initialize the document.
- **Guaranteed Fallback (First AI Debit)**: If a user executes a paid AI action directly before any credit-balance request, `AiCreditService.DebitForJobAsync` calls `TryGrantInitialAsync(ownerUserId, 200)` before evaluating `TryDebitAsync`. New users are guaranteed 200 starter AI credits before their first paid AI operation.
- **Atomic Upsert & Idempotency**: Creation uses MongoDB `UpdateOneAsync` with `IsUpsert = true` and `.SetOnInsert` for all initial fields (`Balance = 200`, `LifetimeGranted = 200`, `LifetimeSpent = 0`, `Debits = []`). An existing ledger is never touched by repeat queries, and a user who spends their balance to zero is never re-granted starter credits.
- **Duplicate Protection**: Guarded by a unique index on `OwnerUserId` (`OwnerUserId_Unique`). Concurrent initialization requests safely resolve to a single ledger.
- **Creator AI Journey Economics**:
  - **Standard Path (Skipping Brand Studio)**: Idea Clarifier (20) + Market Study (20) + Business Model (18) + Financial Forecast (32) + Business Plan (33) = **123 credits consumed** across 7 AI provider calls. **77 credits remaining**.
  - **Brand Studio Path**: Standard Path (123) + Visual Direction (7) + Logo Concepts (4) = **134 credits consumed** across 9 AI provider calls. **66 credits remaining**.
  - **Phase 4**: 0 AI credits across all current Phase 4 tools (100% deterministic).
  - The standard Creator journey easily completes within the initial 200-credit grant without requiring balance top-ups.
- **Legacy 100-Credit Accounts**: Accounts created under the earlier 100-credit configuration can be normalized to 200 via `AiCreditLedgerRepository.TryNormalizeLegacyStarterCreditsForUserAsync(userId, 100, 200)`, which adds +100 to `Balance` and `LifetimeGranted` only when `LifetimeGranted == 100`, preserving spent history. Brand-new accounts are initialized directly with 200.

---

## 4. Fault Tolerance & Automatic Compensation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Creator / Entrepreneur
    participant UI as Frontend Client
    participant API as ForecastController
    participant Ledger as AiCreditService (MongoDB)
    participant Runner as AiJobRunner (Hangfire)
    participant Provider as OpenRouter (Gemini Flash)

    User->>UI: Click "Generate forecast (32 credits)"
    UI->>API: POST /api/ai/forecast
    API->>Ledger: DebitForJobAsync(owner, Forecast, opId)
    Ledger-->>API: Applied (Balance: 200 -> 168)
    API-->>UI: 200 OK { sessionId, jobId }
    UI->>UI: Invalidate ["ai", "credits"] -> Topbar updates to "168 credits"
    
    API->>Runner: Enqueue job to 'ai' queue
    Runner->>Provider: CompleteAsync(model, messages, maxTokens=8000)
    
    alt Provider Fails / Model Error / Exhaustion
        Provider-->>Runner: 4xx/5xx or Empty Content on Length
        Note over Runner: Catch Block Triggered
        Runner->>Ledger: TryAutomaticRefundAsync(opId, reason)
        Ledger-->>Runner: Refund Applied (Balance: 168 -> 200)
        Runner->>API: MarkSessionFailedAsync(sessionId, error)
        Note over Runner: Session document in DB is now "Failed"
        Runner-->>Runner: StopRetryOnPermanentAiFailure (no Hangfire retry)
    end

    loop Session Poller
        UI->>API: GET /api/ai/forecast/{sessionId}
        API-->>UI: { status: "Failed", error: "..." }
    end

    Note over UI: useTimedSession detects terminal "Failed"
    UI->>API: GET /api/ai/credits (invalidated query)
    API-->>UI: { balance: 200, ... }
    UI->>UI: Topbar badge dynamically restores to "200 credits" (NO RELOAD)
    UI->>User: Displays honest error card with "Adjust inputs & retry"
```

### In-Flight Duplicate Click Guard
`ForecastSession` and `BusinessPlanSession` utilize an atomic unique index on `InFlightKey` (`{OwnerUserId}:{JobType}:{ParentId}`). Rapid duplicate clicks join the already running active session rather than executing duplicate credit debits.

---

## 5. Frontend Visibility & Component Contract

### A. Authoritative Endpoint: `GET /api/ai/credits`
Response format:
```json
{
  "success": true,
  "message": "Credits retrieved",
  "data": {
    "balance": 189,
    "lifetimeGranted": 200,
    "lifetimeSpent": 11,
    "costs": {
      "BusinessPlan": 33,
      "Forecast": 32,
      "IdeaClarifier": 20,
      "IdeaGenerator": 0,
      "Probe": 0
    }
  }
}
```

### B. UI Elements & Integration
1. **`AiCreditBadge` (`src/components/layout/AiCreditBadge.tsx`)**:
   - Mounted in topbar header for Creator and Entrepreneur roles.
   - Reads exclusively from `useAiCredits()` (cached with 60s stale time + focus refetch).
   - Hidden until data resolves (prevents flashing zero).
   - Renders: `✦ {balance} credits` with tooltip: `Lifetime: {granted} granted, {spent} spent`.
2. **Generate Button Labels**:
   - Dynamic server-authoritative cost suffix:
     - `Generate plan (33 credits)`
     - `Generate forecast (32 credits)`
     - `Run Idea Clarifier (20 credits)`
3. **Insufficient Balance State**:
   - When `balance < capabilityCost`:
     - Button disabled state (`disabled={true}`).
     - Inline notification: `Insufficient credits: requires {cost} credits (you have {balance}).`
     - **Dead-end copy absent**: No unsupported "Contact support" actions.

---

## 6. Verification Trace & Browser Evidence

Full automated browser verification executed across all surfaces:
- **Baseline Funded State**: Verified topbar rendered `✦ 189 credits`, tooltip `Lifetime: 200 granted, 11 spent`.
- **Dispatch & Debit**: Verified topbar immediately decremented to `✦ 184 credits` upon `POST /api/ai/forecast` dispatch without reload.
- **Failure & Refund**: Forced model failure (`google/invalid-forecast-model-trigger-refund`), observed automatic refund committed in MongoDB, session marked failed, poller detected terminal failure, and topbar returned to `✦ 189 credits` without page reload.
- **Insufficient Balance State**: Simulated balance 2 < cost 32: button disabled, inline shortfall warning rendered, contact support copy verified absent.
