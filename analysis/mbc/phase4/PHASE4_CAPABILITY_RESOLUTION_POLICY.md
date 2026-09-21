# PHASE 4.4 — CAPABILITY RESOLUTION POLICY & INVARIANTS

## Domain Objective
The `ICapabilityResolutionPolicy` provides a deterministic evaluation engine that maps capability gaps to action resolutions (`LEARN`, `DELEGATE`, `VERIFY`, `COVERED`, `NEEDS_REVIEW`). It completely eliminates arbitrary heuristic guesswork through rigorous rule precedence and invariant constraints.

---

## The 6 Canonical Evaluation Rules

```mermaid
flowchart TD
    Start[Input Requirement from Phase 4.3] --> R4{Is Requirement already Covered in Phase 4.3?}
    R4 -- Yes --> Covered[Mode: COVERED]
    R4 -- No --> R2{Is Statutory Verification Required by Upstream Source?}
    R2 -- Yes --> Verify[Mode: VERIFY + Optional Learning Supplement]
    R2 -- No --> R1{Check Founder Skill Level}
    
    R1 -- Advanced --> R1_Adv[Mode: COVERED]
    R1 -- Comfortable --> R1_Crit{Is Requirement Critical / Blocking?}
    R1_Crit -- No --> R1_Norm[Mode: COVERED]
    R1_Crit -- Yes --> R1_Exp{Has Direct Domain Experience?}
    R1_Exp -- Yes --> R1_ExpCov[Mode: COVERED]
    R1_Exp -- No --> R1_Review[Mode: NEEDS_REVIEW]
    
    R1 -- Beginner or None --> R_LearnCheck{Evaluate Learning vs Delegation}
    
    R_LearnCheck -- Founder Preference Delegate OR Weekly Hours < 10 OR Critical Timing --> Delegate[Mode: DELEGATE]
    R_LearnCheck -- Feasible Learning Curve & Budget Available --> Learn[Mode: LEARN]
    R_LearnCheck -- Ambiguous / High Complexity --> NeedsReview[Mode: NEEDS_REVIEW]
```

### Rule 1: Complexity-Aware Skill Coverage
- **Advanced Level**: The founder possesses deep subject matter expertise. Requirement is resolved as `COVERED`.
- **Comfortable Level**:
  - For normal/low/medium priority requirements: resolved as `COVERED`.
  - For critical or launch-blocking requirements: resolved as `NEEDS_REVIEW` unless the founder's job title or direct role history explicitly supports it.
- **Beginner Level**: Never automatically `COVERED`. Must be directed to `LEARN`, `DELEGATE`, or `NEEDS_REVIEW`.
- **Unassessed / Null Level**: Resolved as `NEEDS_REVIEW`.

### Rule 2: Authoritative Statutory Verification
- Applied when Phase 3 Legal Assessment or authoritative legal evidence mandates professional certification, statutory filing, or regulated audit.
- Examples:
  - Corporate share capital escrow deposit (`Attestation de dépôt`).
  - Regulated profession compliance filings.
  - Certified annual financial audit requirements.
- Primary resolution mode is strictly `VERIFY`.
- `isMandatoryVerification` is set to `true`.
- **Safety Lock**: Cannot be overridden by founder with `ChooseLearn` or `ChooseDelegate`.

### Rule 3: Non-Exclusive Verify with Supporting Learning
- When `VERIFY` is selected, an `OptionalLearningSupplement` is attached.
- Enables the creator to understand core concepts, terminology, and governance criteria when reviewing deliverables with attorneys or certified accountants.

### Rule 4: Phase 4.3 Covered Requirements Pass-Through
- If a requirement was already categorized under `CoveredRequirements` in Phase 4.3 Needs Analysis, it is directly ingested as `COVERED` with reason `PHASE_4_3_COVERED_PASS_THROUGH`.
- Eliminates redundant processing and preserves upstream consistency.

### Rule 5: Deterministic & Curated Learning Topics
- Curated taxonomies provide standard learning curricula:
  - **SEO & Inbound**: Keyword research, search intent mapping, on-page optimization, technical crawl health.
  - **B2B Sales**: Prospecting cadence, qualification framework (BANT), demo structuring, negotiation.
  - **Product Strategy**: User story mapping, sprint prioritization, unit economics modeling.
  - **Software Engineering**: RESTful API design, database schema modeling, automated testing.

### Rule 6: Decoupled Founder Decision & Safety Guard
- System recommendation (`ResolutionMode`) remains preserved as audit truth.
- Founder choice is stored in `FounderDecision` (`ChooseLearn`, `ChooseDelegate`, `ConfirmCovered`, `Defer`).
- Refresh re-evaluates system recommendations while preserving `FounderDecision` and `FounderNotes`.
- If `isMandatoryVerification` is true, the API rejects `ChooseLearn` and `ChooseDelegate` with HTTP 400 Bad Request.
