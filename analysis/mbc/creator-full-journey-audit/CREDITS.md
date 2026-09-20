# MBC Creator Journey — AI Credits & Economy Audit

**Audit Date**: 2026-09-20  
**Audit Scope**: Credit debit actions, costs, starter grants, full-journey sum, and zero-balance handling at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Credit Cost Table by Action & Phase

The AI credit ledger is managed by `backend/Services/Implementations/AiCreditService.cs` using rates defined in `backend/appsettings.Example.json:AiCreditSettings` (and overridden in environment configuration).

| Phase / Step | Action / Endpoint | AI Operation Description | Cost (Credits) | Deterministic vs AI |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Identity Verification | Sumsub ID verification check | **0** | Deterministic (Vendor API) |
| **Phase 2** (Step 2.1) | `POST /api/creator/phase-2/finalize-clarifier` | Synthesis of 6-question chat into structured idea concept | **20** | AI (OpenAI / Claude) |
| **Phase 2** (Step 2.3) | `POST /api/creator/phase-2/name-suggestions` | Generation of 5 branded concept names | **0** (Rate-limited to 3 calls/lifetime via Redis) | AI (Included in Phase 2) |
| **Phase 2** (Step 2.5) | `POST /api/creator/phase-2/brand-studio/direction` | Visual brand direction and moodboard tokens | **7** | AI |
| **Phase 2** (Step 2.5) | `POST /api/creator/phase-2/brand-studio/logo-param` | SVG icon vector geometry generation | **4** | AI |
| **Phase 2** (Step 2.5) | `POST /api/creator/phase-2/brand-studio/color` | Semantic color palette generation | **2** | AI |
| **Phase 2** (Step 2.5) | `POST /api/creator/phase-2/brand-studio/typography` | Font pairings and typographic scale | **2** | AI |
| **Phase 2** (Step 2.5) | `POST /api/creator/phase-2/branding/skip` | Skip branding to complete Phase 2 | **0** | User Action |
| **Phase 3** (Step 3.1) | `POST /api/creator/phase-3/market-study/generate` | Deep market analysis (TAM, SAM, SOM, trends, competitors) | **20** | AI |
| **Phase 3** (Step 3.2) | `POST /api/creator/phase-3/business-model/generate` | 9-box Business Model Canvas generation | **18** | AI |
| **Phase 3** (Step 3.3) | `POST /api/creator/phase-3/forecast/generate` | 36-month P&L, break-even, and runway projection | **32** | AI |
| **Phase 3** (Step 3.4) | `POST /api/creator/phase-3/legal-compliance/evaluate` | Regulatory risk checklist evaluation | **0** | Deterministic Rules Engine |
| **Phase 3** (Step 3.5) | `POST /api/creator/phase-3/formation/select-type` | Corporate structure recommendation (SAS, SAS-U, SARL) | **0** | Deterministic Rules Engine |
| **Phase 3** (Step 3.6) | `POST /api/creator/phase-3/business-plan/generate` | Full 12-section Executive Business Plan synthesis | **33** | AI |
| **Phase 3** (Step 3.6) | `POST /api/creator/phase-3/business-plan/rewrite-section` | Single section rewrite / refinement (Optional) | **5** (per rewrite) | AI |
| **Phase 3** (Step 3.7) | `PATCH /api/creator/masterplan/complete` | Masterplan finalization & Investor Readiness scoring | **0** | Deterministic Scoring |
| **Phase 4** | Services & Pricing, Resource Calc, GTM Setup | Pricing tiers, resource model, launch task checklist | **0** | Deterministic (Benchmark Data) |
| **Phase 5** | Crossroads (Valuation, Marketplace, SP Match) | IP valuation multiple, marketplace listing, formation | **0** | Deterministic Calculations |
| **Phase 6** | Investor Matchmaking & Level-Up | Investor matchmaking, company seeding, role elevation | **0** | Deterministic Transaction |

---

## 2. Full-Journey Cost & Starter Balance Analysis

### 2.1 Complete Journey Total (Phase 1 → Phase 6)
- **Minimum Journey Cost** (Branding skipped or M50 Designer hired, zero business plan section rewrites):  
  $$20 + 20 + 18 + 32 + 33 = \mathbf{123\text{ credits}}$$
- **Standard Journey Cost** (Using Brand Studio for full AI logo & identity generation, zero rewrites):  
  $$123 + (7 + 4 + 2 + 2) = 123 + 15 = \mathbf{138\text{ credits}}$$
- **Extended Journey Cost** (Standard journey + 2 section rewrites):  
  $$138 + 10 = \mathbf{148\text{ credits}}$$

### 2.2 Starter Grant & Net Balance
- **Starter Grant at HEAD**: **200 credits**  
  - Evidence: `backend/appsettings.Example.json:AiCreditSettings:StarterGrant = 200` and `AiCreditService.cs:48`.
- **Remaining Balance After One Complete Standard Journey**:  
  $$200 - 138 = \mathbf{62\text{ credits remaining}}$$
- **Remaining Balance After Minimum Journey**:  
  $$200 - 123 = \mathbf{77\text{ credits remaining}}$$

---

## 3. Refill, Top-Up & Zero-Balance Behavior

### 3.1 Refill / Purchase Path Audit
- **Findings at HEAD**: **ABSENT**.
  - There is **no** payment gateway integration (Stripe, LemonSqueezy, PayPal) for credit purchases in the codebase.
  - There is **no** controller, route, or service method for users to top up or purchase credits (`AiCreditController` does not exist).
  - The only mechanism in code to alter a user's credit balance is direct database manipulation or internal admin service calls.

### 3.2 Zero-Balance Behavior
- **Backend Behavior**:
  - In `AiCreditService.cs:DebitAsync(string userId, int amount, string operation)`:
    - If `currentBalance < amount`, the service throws `InsufficientCreditsException`.
    - The exception filter intercepts this and returns an **HTTP 402 Payment Required** response:
      ```json
      {
        "status": 402,
        "error": "INSUFFICIENT_CREDITS",
        "message": "Insufficient AI credits to perform this operation.",
        "required": 33,
        "available": 12
      }
      ```
- **Frontend Behavior**:
  - Caught by `src/lib/api/error-handler.ts:toAiError`.
  - Maps HTTP 402 to user message: `"You've used all your AI credits. Contact support to request additional credits."`
  - Rendered as a high-visibility toast and sticky banner at the top of the generation view.
  - **Verdict**: The block is a **clear message**, not a silent failure. However, because no purchase route exists, a user who exhausts their credits is hard-blocked from progressing through AI-gated steps until an administrator manually increases their balance in MongoDB.
