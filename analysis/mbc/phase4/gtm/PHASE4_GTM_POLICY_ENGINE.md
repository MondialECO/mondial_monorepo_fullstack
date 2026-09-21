# Phase 4.7 — GTM Policy Engine Specifications

## 1. Engine Responsibilities

The `GtmPolicyEngine` is a deterministic rule-based engine responsible for:
1. Deriving the primary launch segment and relevance score.
2. Deriving the overall sales motion using `SalesMotionContext`.
3. Evaluating channel suitability and assigning deterministic reason codes.
4. Reconciling channel effort against founder weekly capacity via `IFounderCapacityResolver`.
5. Designing empirical validation experiments with `NeedsBaseline` targets.
6. Formulating the standardized metrics measurement framework.
7. Deriving budget provenance and spendable cash status.

---

## 2. Multi-Signal Sales Motion Derivation

Sales motion is determined via multi-signal evaluation:
- High trust requirement + multi-stakeholder B2B -> `EnterpriseSales` or `ConsultativePilot`.
- Low buying complexity + consumer/prosumer + self-serve feasibility -> `ProductLedGrowth`.
- Community / peer-recommended B2B -> `CommunityInbound`.
- Standard transactional products with search intent -> `InsideSales` or `DigitalAcquisition`.

A €10,000 self-serve product or a €500 consultative B2B contract are handled accurately because price is only one signal among 9 normalized dimensions.

---

## 3. Capacity Load & Point System

- `FounderLedSales`: 4 effort points (~6h/week)
- `ColdOutreach`: 4 effort points (~6h/week)
- `InboundContent`: 3 effort points (~5h/week)
- `OrganicSocial`: 2 effort points (~3h/week)
- `PaidAdsManagement`: 2 effort points (~3h/week)
- `Partnerships`: 2 effort points (~3h/week)
- `ReferralProgram`: 1 effort point (~1.5h/week)

If total allocated effort points exceed the founder's capacity tier limit, `IsOverloaded = true` is flagged, `overloadMitigationNotice` is populated, and lower-priority channels are deferred to `Later`.
