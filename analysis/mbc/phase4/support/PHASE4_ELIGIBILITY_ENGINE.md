# Phase 4.5 Deterministic Support Eligibility Engine

## 1. Evaluation Pipeline

```text
SupportEligibilityContext + SupportOpportunity
                     │
                     ▼
1. Active Dates & Deadlines Check
   ├── Expired? ──> Status = Expired (Reason: DEADLINE_EXPIRED)
   └── Valid ─────> Continue
                     │
                     ▼
2. Geographic & Locality Scope Check
   ├── Regional mismatch? ──> Status = NotEligible (Reason: LOCATION_MISMATCH, REGION_NOT_ELIGIBLE)
   └── National / Matched ──> Continue
                     │
                     ▼
3. Stage, Legal Form, Sector Prefilter
   ├── Sector excluded? ───> Status = NotEligible (Reason: SECTOR_EXCLUDED)
   ├── Legal form mismatch? > Status = NotYetEligible
   └── Valid ───────────────> Continue
                     │
                     ▼
4. Rule Normalization Evaluation
   ├── Rule Status == Ambiguous? ──> Status = NeedsReview (Reason: AMBIGUOUS_PARSED_RULE)
   ├── Rule Status == Rejected? ───> Status = NeedsReview
   └── Rule Status in [VerifiedStructured, HumanValidated]:
           ├── Rule evaluated with Operator:
           │     Equals, NotEquals, In, NotIn, GreaterThan, LessThan,
           │     Between, Exists, LocationWithin, Contains
           ├── Missing field value? ──> ConditionsMissing.Add
           ├── Failed expectation? ───> ConditionsFailed.Add
           └── Met expectation? ──────> ConditionsMet.Add
                     │
                     ▼
5. Final Match Resolution
   ├── Failed critical rules ────────> Status = NotEligible
   ├── Has missing conditions ───────> Status = PotentiallyEligible / NeedsInformation
   └── All conditions met ───────────> Status = Eligible
                     │
                     ▼
6. Selection Mode Output Formatting
   ├── Competitive / CreditAssessment:
   │     RecommendedNextStep = "Eligible to Apply: ..." (Never "Approved" or "Granted")
   └── Entitlement:
         RecommendedNextStep = "Statutory Entitlement: Complete application within statutory window."
```

---

## 2. Invariant Safety Guarantees

1. **Deterministic Execution**: Given the same `SupportEligibilityContext` and versioned rules, evaluation produces identical results without heuristics or probabilistic drift.
2. **Ambiguity Quarantine**: No ambiguous parser output is promoted to authoritative eligibility.
3. **No Fake Probabilities**: Never fabricates success rates ("87% chance") for competitive programmes.
4. **Transparent Traceability**: Every condition evaluated is documented in `WhyMatched`, `ConditionsMet`, `ConditionsMissing`, and `ConditionsFailed`.
