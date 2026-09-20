# MBC Creator Journey — Security, Tenancy & Auth Audit Findings

**Audit Date**: 2026-09-20  
**Audit Scope**: Tenancy checks, object-level authorization, and Phase 1 identity verification at HEAD  
**Status**: CONFIRMED at HEAD  

---

## 1. Tenancy & Object-Level Ownership Enforcement

### 1.1 Endpoint Tenancy Matrix across Creator Controllers

All Creator controllers inherit from `BaseApiController` and require JWT authentication via `[Authorize]`. Ownership is enforced via the authenticated user's claim (`User.FindFirst(ClaimTypes.NameIdentifier)` or `User.GetUserId()`).

| Controller | Route | Ownership / Tenancy Check at HEAD | Result |
| :--- | :--- | :--- | :--- |
| `CreatorJourneyController` | `GET /api/creator/journey` | Scoped to authenticated `userId`. Queries `CreatorJourneys.Find(j => j.UserId == userId)`. | **ENFORCED** |
| `CreatorJourneyController` | `POST /api/creator/journey/reset` | Resets journey matching authenticated `userId`. | **ENFORCED** |
| `CreatorPhase2Controller` | `POST /api/creator/phase-2/chat-message` | Scoped to `userId` and verifies `idea.UserId == userId`. | **ENFORCED** |
| `CreatorPhase2Controller` | `POST /api/creator/phase-2/finalize-clarifier` | Scoped to `userId` and verifies `idea.UserId == userId`. | **ENFORCED** |
| `CreatorPhase2Controller` | `POST /api/creator/phase-2/name-suggestions` | Scoped to `userId` and rate-limited per user in Redis. | **ENFORCED** |
| `CreatorPhase2Controller` | `POST /api/creator/phase-2/brand-studio/*` | Scoped to `userId` and verifies `idea.UserId == userId`. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/market-study/generate` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/business-model/generate` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/forecast/generate` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/legal-compliance/evaluate` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/formation/select-type` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `POST /api/creator/phase-3/business-plan/generate` | Scoped to `userId` and checks idea ownership. | **ENFORCED** |
| `CreatorPhase3Controller` | `PATCH /api/creator/masterplan/complete` | Validates `idea.UserId == userId` (`CreatorPhase3Controller.cs:642`). Returns `Forbid()` if mismatch. | **ENFORCED** |
| `CreatorPhase3Controller` | `GET /api/creator/workroom/open` | Validates `match.CreatorId == userId` (`CreatorPhase3Controller.cs:795`). Returns `Forbid()` if mismatch. | **ENFORCED** |
| `CreatorPhase4Controller` | `GET /api/creator/phase-4/benchmark` | Unscoped reference data lookup (returns industry aggregates by sector). | **SAFE** |
| `CreatorPhase4Controller` | `POST /api/creator/phase-4/pricing` | Scoped to `userId` and verifies journey ownership. | **ENFORCED** |
| `CreatorPhase4Controller` | `POST /api/creator/phase-4/resource-calculator` | Scoped to `userId` and verifies journey ownership. | **ENFORCED** |
| `CreatorPhase4Controller` | `POST /api/creator/phase-4/gtm-setup` | Scoped to `userId` and verifies journey ownership. | **ENFORCED** |
| `CreatorPhase4Controller` | `PATCH /api/creator/phase-4/complete` | Scoped to `userId` and verifies journey ownership. | **ENFORCED** |
| `CreatorPhase5Controller` | `POST /api/creator/phase-5/ip-valuation` | Scoped to `userId` and verifies journey ownership. | **ENFORCED** |
| `CreatorPhase5Controller` | `POST /api/creator/phase-5/marketplace/publish` | Scoped to `userId` and verifies idea ownership. | **ENFORCED** |
| `CreatorPhase5Controller` | `GET /api/creator/phase-5/marketplace/interests` | Scoped to `listing.CreatorId == userId`. | **ENFORCED** |
| `CreatorPhase5Controller` | `POST /api/creator/phase-5/marketplace/interests/{id}/accept` | Checks interest belongs to a listing owned by `userId`. | **ENFORCED** |
| `CreatorPhase6Controller` | `GET /api/creator/phase-6/readiness` | Scoped to `userId`. | **ENFORCED** |
| `CreatorPhase6Controller` | `POST /api/creator/phase-6/level-up` | Scoped to `userId`. Atomic transaction verifies journey state. | **ENFORCED** |

### 1.2 Tenancy Summary
- **No Insecure Direct Object References (IDOR)** were found across the Creator journey endpoints.
- All endpoints either directly filter by `userId` from claims or verify that target documents (`CreatorIdeas`, `CreatorJourneys`, `MarketplaceListings`, `ServiceMatches`) belong to the requesting `userId` before mutating or returning state.

---

## 2. Phase 1 Identity Verification State

### 2.1 Implementation Audit: Real, Stubbed, or Bypassed?
- **Finding ID**: `SEC-01`
- **Status at HEAD**: **REAL (Vendor API Integration)**
- **Evidence**:
  1. `backend/Controllers/IdentityController.cs:45-160`
  2. `backend/Services/Implementations/SumsubService.cs:42-120`
  3. `backend/Services/Implementations/IdentityVerificationService.cs:30-85`

### 2.2 Mechanism & Failsafe Audit
1. **SDK Token Issuance**:
   - `POST /api/identity/sumsub/access-token` calls `SumsubService.CreateAccessTokenAsync(userId, levelName)`.
   - Sends an authenticated HTTP request to `https://api.sumsub.com/resources/accessTokens/sdk`.
   - **Fail-Closed Verification**: If `Sumsub:AppToken` or `Sumsub:SecretKey` are unset or contain placeholder strings (`"your-app-token"`), the service throws an `InvalidOperationException` and returns HTTP 503 Service Unavailable. It does **not** bypass verification or grant automatic approval.
2. **Webhook Ingress & Cryptographic Signature Verification**:
   - `POST /api/identity/sumsub/webhook` validates incoming webhook payloads.
   - Computes HMAC-SHA256 of the raw request body using `Sumsub:SecretKey`:
     ```csharp
     var calculatedSignature = ComputeHmacSha256(rawBody, _secretKey);
     if (!CryptographicOperations.FixedTimeEquals(
             Encoding.UTF8.GetBytes(calculatedSignature),
             Encoding.UTF8.GetBytes(receivedSignature)))
     {
         return Unauthorized("Invalid webhook signature");
     }
     ```
   - Uses `FixedTimeEquals` to prevent timing attacks.
3. **State Mutation**:
   - Only on receiving a verified webhook with `reviewResult.reviewAnswer == "GREEN"` does the backend set `user.Onboarding.Phase = 1` and `user.IdentityStatus = "verified"`.
   - Any other status (`RED`, `requires_action`) sets status accordingly and keeps Phase 2 locked.
