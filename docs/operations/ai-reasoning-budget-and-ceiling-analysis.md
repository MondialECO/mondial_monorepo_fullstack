# AI Reasoning Budget & Ceiling Analysis: `google/gemini-3.8-flash`

**Date:** 2026-09-14  
**Status:** Documented & Observed  
**Capabilities Evaluated:** Forecast Generation (`C-4`), Prompt Contract v1 Trimmed

---

## 1. Executive Summary & Key Findings

Empirical generation runs against `google/gemini-3.8-flash` across three distinct venture models revealed that **internal reasoning (chain-of-thought) accounts for 60% to 73% of total completion token consumption**, while parsed content JSON remains remarkably stable.

| Metric | Plan 1: Develflow (Middleware) | Plan 2: Mondial AI (Enterprise) | Plan 3: Urban Commuter (Mobility) | Observed Distribution |
| :--- | :--- | :--- | :--- | :--- |
| **Prompt Tokens** | 2,492 | 1,710 | 2,053 | 1,710 – 2,492 |
| **Total Completion Tokens** | **4,383** | **3,082** | **3,386** | 3,082 – 4,383 |
| — *Reasoning Tokens* | **3,204** | **1,851** | **2,157** | **1,851 – 3,204** (Spread: 1,353) |
| — *Content Tokens* | **1,179** | **1,231** | **1,229** | **1,179 – 1,231** (Invariant ~1,200) |
| **Reasoning Share (%)** | **73.1%** | **60.1%** | **63.7%** | **60.1% – 73.1%** |
| **Content Size (Chars)** | 4,036 | 4,125 | 4,419 | 4,036 – 4,419 chars |
| **Finish Reason** | `stop` | `stop` | `stop` | Clean natural completion |
| **Headroom Under 6,000 Ceiling** | **1,617 tokens** | **2,918 tokens** | **2,614 tokens** | **Safe across tested spectrum** |

---

## 2. Architectural Implications

### A. Contract Trimming vs. Reasoning Headroom
- Removing the 24 unread monthly notes fields from `costForecast` and `cashFlowProjection` successfully reduced content output to a fixed band (~1,180–1,230 tokens).
- Content size is **not** what threatens the 6,000 output ceiling.
- Reasoning variance (ranging from 1,850 to 3,200+ tokens depending on domain complexity) consumes the vast majority of the token budget.
- The 1,617 tokens of headroom observed on the most complex run is **headroom against reasoning variance**, not content growth.

### B. Relevance of Step 1 Defensive Fail-Fast Guard
- Because `google/gemini-3.8-flash` dynamically scales reasoning effort based on perceived problem complexity, a pathological prompt or highly ambiguous venture could theoretically cause the model to exhaust the 6,000 token budget in reasoning before emitting a single valid JSON token.
- The Step 1 fail-fast guard (`OpenRouterClient` detecting empty content on `finish_reason == "length"` and throwing non-transient `AiProviderException` to bypass Hangfire retries and route directly to automatic ledger refund) is an active safeguard against paid infinite retry loops on `google/gemini-3.8-flash`.

---

## 3. Provider-Level Configuration Levers (OpenRouter)

OpenRouter supports direct reasoning controls for models that support thinking (including Gemini):

1. **`reasoning.effort`**: Controls thinking level (`"minimal"`, `"low"`, `"medium"`, `"high"`, `"max"`).
   ```json
   "reasoning": {
     "effort": "low"
   }
   ```
2. **`reasoning.max_tokens`**: Hard upper ceiling on reasoning tokens.
   ```json
   "reasoning": {
     "max_tokens": 2500
   }
   ```

*Note:* Currently, no provider reasoning limits are applied (Gemini's dynamic thinking is active). If production monitoring ever identifies runs approaching the ceiling due to reasoning spikes, applying `reasoning: { max_tokens: 2500 }` provides a direct provider-level clamp without modifying application schemas.

---

## 4. Post-Ceiling (8,000 Tokens) Benchmark & Pricing Derivation

Following the increase of `ForecastHandler` output ceiling to 8,000 tokens, a 12-run empirical benchmark was conducted across six distinct venture ideas across three verbosity tiers (Terse, Moderate, Verbose) with production client retries active:

### A. Empirical Performance & Failure Modes
- **Final Success Rate:** 12/12 (100.0%)
- **First-Attempt Success Rate:** 11/12 (91.7%)
- **Ceiling Truncations (`finish_reason == length`):** 0/12 (0.0%)
- **Transport / Gateway Timeouts:** 0/12 (0.0%, latencies ranged between 22s and 31s)
- **Retry Accounting:** Exactly 1 run required a retry due to a transient provider abort (empty content emitted after 5.8s with `finish_reason == error`). The provider billed 0 prompt tokens, 0 completion tokens, and $0.00 on the aborted attempt; the retry succeeded cleanly, resulting in zero wasted tokens for the rescued failure.
- **Tracked Unhandled Failure Mode:** Malformed JSON (unterminated strings/syntax errors) appeared at ~8% across capabilities, unaffected by token ceilings and tracked for subsequent prompt/parser hardening.

### B. Post-Ceiling Token Distribution (N=12)
| Metric | Median | 75th Percentile | 90th Percentile | Observed Range | Mean |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prompt Tokens** | 1,115.5 | 1,131 | 1,148 | 1,104 – 1,148 | 1,120.3 |
| **Completion Tokens** | **3,893** | **4,258** | **4,287** | **3,115 – 5,267** | **3,902.8** |
| — *Reasoning Tokens* | **2,733** | **3,061** | **3,091** | **1,929 – 4,102** | **2,732.8** |
| — *Content Tokens* | **1,173** | **1,197** | **1,222** | **1,102 – 1,237** | **1,169.9** |
| **Reasoning Share (%)** | **69.9%** | **71.9%** | — | **61.9% – 77.9%** | **69.9%** |
| **Total Tokens** | **5,001** | **5,389** | **5,391** | **4,263 – 6,371** | **5,023.1** |
| **Cost per Run (USD)** | $0.0154 | $0.0175 | — | $0.0131 – $0.0206 | $0.0155 |

*Key Takeaway on Reasoning Drift:* Raising the ceiling from 6,000 to 8,000 did **not** invite general reasoning inflation. The model terminates naturally when closing JSON. The extra 2,000 tokens function strictly as a non-intrusive safety buffer for reasoning spikes.

### C. Final Unified Credit Pricing Table
All costs are server-authoritative via `GET /api/ai/credits`:

| Capability | Benchmark Median Total Tokens | Pricing Ratio vs Clarifier | Credit Cost | Status & Provenance |
| :--- | :--- | :--- | :--- | :--- |
| **`IdeaClarifier`** | 3,105 tokens | 1.0000 | **20 credits** | **Locked baseline** (from earlier 36-run benchmark, pre-ceiling) |
| **`BusinessPlan`** | 5,182 tokens | 1.6689 | **33 credits** | **Locked** (from earlier 36-run benchmark, pre-ceiling; exact 33.38) |
| **`Forecast`** | 5,001 tokens | 1.6106 | **32 credits** | **Provisional** (derived from post-8k ceiling 12-run benchmark; exact 32.21) |
| **`IdeaGenerator`** | N/A | 0.0000 | **0 credits** | Unmetered discovery generator |
| **`Probe`** | N/A | 0.0000 | **0 credits** | Operational self-test |

*Note on Benchmark Scope:* The `IdeaClarifier` and `BusinessPlan` medians were measured during the earlier 36-run benchmark before the ceiling increase. Because the ceiling change was strictly scoped to `ForecastHandler`, their measurements and ratios are unaffected.

*Note on Telemetry Attribution:* All reasoning-share and token breakdown figures documented herein were manually captured from API client responses, as reasoning tokens are not yet stored in the `ModelUsage` database telemetry.

