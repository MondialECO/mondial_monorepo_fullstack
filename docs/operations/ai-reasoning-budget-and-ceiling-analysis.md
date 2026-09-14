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

*Note:* Currently, no provider reasoning limits are applied (Gemini's dynamic thinking is active). If production monitoring ever identifies runs approaching the 6,000 ceiling due to reasoning spikes, applying `reasoning: { max_tokens: 2500 }` provides a direct provider-level clamp without modifying application schemas.
