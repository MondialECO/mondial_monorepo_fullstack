# MONDIAL BUSINESS CREATION (MBC) — Phase 4.6 Pricing API Contract

## 1. Endpoints Specification

Base Path: `/api/creator/phase4/pricing`

### 1.1 `GET /api/creator/phase4/pricing`
- **Query Params**: `ideaId` (optional, falls back to active idea)
- **Headers**: `Authorization: Bearer <jwt>`
- **Response**: `200 OK` -> `ApiResponse<PricingStrategyResponse>`
  - `pricingStrategy`: Current persisted strategy (or null if not yet generated)
  - `updateAvailable`: boolean (true if upstream critical or consumed sources changed)
  - `changedSources`: string[] (list of changed sources)
- **Error Codes**:
  - `401 Unauthorized`: Missing or invalid JWT
  - `404 Not Found`: Creator journey not found

---

### 1.2 `POST /api/creator/phase4/pricing/generate`
- **Body**: `{ "ideaId": "string" }`
- **Headers**: `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- **Gate Checks**:
  - Phase 3 Status must be `completed` (`422 Unprocessable Entity`)
  - HumainX Profile must have `Phase4Ready == true` (`422 Unprocessable Entity`)
  - Phase 4.1 Snapshot must exist and not be stale (`409 Conflict`)
  - Phase 4.2 Roadmap must exist and not be stale (`409 Conflict`)
  - Phase 4.3 Needs must exist and not be stale (`409 Conflict`)
  - Phase 4.4 Skills must exist and not be stale (`409 Conflict`)
  - Phase 4.5 SupportPlan is OPTIONAL: Generation succeeds with `SupportPlan = null`. Consumed only when explicitly relevant.
- **Offer Structure (Four-Price Separation Invariant)**:
  - `recommendedPrice`: Deterministic MBC recommendation
  - `founderSelectedPrice`: Creator chosen price (may equal recommendedPrice if accepted)
  - `marketReferencePrice`: Observed competitor or desk-research reference (may equal recommendedPrice)
  - `validatedMarketPrice`: Empirically validated price (null if no empirical transactions; may equal founderSelectedPrice)
  - `marketPriceEvidenceType`: e.g. `CompetitorObserved`, `HistoricalSale`, `PaidPilot`, etc.
  - `marketPriceValidationLevel`: `EmpiricallyValidated`, `Supported`, `Indicative`, `Unvalidated`
  - *Note*: Fields are semantically independent with separate provenance; they may contain identical numeric values without violating the invariant.
- **Response**: `200 OK` -> `ApiResponse<PricingStrategyResponse>` with generated strategy

---

### 1.3 `POST /api/creator/phase4/pricing/refresh`
- **Body**: `{ "ideaId": "string" }`
- **Headers**: `Authorization: Bearer <jwt>`, `Content-Type: application/json`
- **Behavior**: Re-evaluates costs, competitors, and forecast benchmarks while preserving founder overrides (`FounderPrice`, `LaunchDiscountPercentage`, `FeaturesIncluded`, `FounderNotes`)
- **Response**: `200 OK` -> `ApiResponse<PricingStrategyResponse>`

---

### 1.4 `PATCH /api/creator/phase4/pricing/{offerKey}`
- **Route Params**: `offerKey` (string)
- **Query Params**: `ideaId` (optional)
- **Body**:
  ```json
  {
    "founderPrice": 39.0,
    "launchDiscountPercentage": 15.0,
    "featuresIncluded": ["Core", "Priority Support"],
    "founderNotes": "Early adopter promotion"
  }
  ```
- **Behavior (Correction #6)**:
  1. Applies founder override
  2. Immediately recalculates contribution margins and unit economics
  3. Immediately recalculates forecast variance and alignment
  4. Immediately re-evaluates risk flags and price floor breaches
  5. If features change without available cost impact, sets `EconomicsValidation = NeedsReview`
- **Response**: `200 OK` -> `ApiResponse<PricingStrategyResponse>`
