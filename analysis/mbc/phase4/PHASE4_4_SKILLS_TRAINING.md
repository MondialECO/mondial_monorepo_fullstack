# PHASE 4.4 — SKILLS & TRAINING / LEARN · DELEGATE · VERIFY ENGINE

## Overview & Domain Purpose
Phase 4.4 takes every relevant capability or professional requirement identified in **Phase 4.3 Needs Analysis**, evaluates it deterministically against the Creator's **HumainX profile** (declared skills, experience levels, weekly availability, learning/delegation preferences), and statutory constraints to determine the optimal resolution path:
- **LEARN**: The founder will acquire practical competence to execute the capability.
- **DELEGATE**: External specialists, agencies, or co-founders should handle execution.
- **VERIFY**: Professional or statutory validation/audit is required (founder execution is insufficient or legally prohibited).
- **COVERED**: Existing proven capabilities directly satisfy the requirement without redundant learning.
- **NEEDS_REVIEW**: Ambiguous skill evidence or high-risk mismatch requiring founder decision.

---

## Canonical Phase 4 Architecture & Boundary Enforcement

```text
4.1 Construction Snapshot
    = WHAT is ready / missing / critical

4.2 Operational Roadmap
    = WHEN tasks happen, sequenced, dependencies

4.3 Needs & Requirements
    = WHAT resources / capabilities / services are required

4.4 Skills & Training (THIS MODULE)
    = HOW each capability requirement is resolved:
      LEARN  ·  DELEGATE  ·  VERIFY  ·  COVERED
      + Actionable Skills/Training Plan (curated topics, estimated hours)

4.5 Aids, Grants & Support (STRICTLY FUTURE / READ-ONLY BOUNDARY)
    = WHERE non-dilutive financial and institutional support applies
```

### Strict Non-Negotiable Boundaries:
1. **No Marketplace Matching**: Phase 4.4 suggests generic partner types (`Specialist Freelancer`, `Certified Accountant`, `Boutique Legal Counsel`, `Agency`, `Technical Co-Founder`), but never initiates marketplace bookings or proposals.
2. **Phase 4.5 Separation**: Grants, public subsidies (BPI, France Travail), and institutional aids are strictly deferred to Phase 4.5.
3. **Upstream Immutability**: Phase 4.4 reads Phase 4.3, Phase 4.2, Phase 4.1, Phase 3 Legal Assessment, and HumainX profile data as read-only inputs. It never mutates upstream state.
4. **Zero Dual Persistence**: The skills plan is stored strictly on `CreatorJourney.Phase4Data.SkillsPlan`. Zero dual-writes to `CreatorIdea`.

---

## The 6 Locked Invariant Corrections

1. **Requirement Complexity-Aware Coverage**:
   - `Advanced` + normal requirement $\rightarrow$ `COVERED`
   - `Comfortable` + normal requirement $\rightarrow$ `COVERED`
   - `Comfortable` + complex / critical / launch-blocking requirement $\rightarrow$ `NEEDS_REVIEW` (unless explicit direct domain experience verified)
   - `Beginner` $\rightarrow$ Never automatically `COVERED`
   - `Level == null` or unassessed $\rightarrow$ `NEEDS_REVIEW`
   - *Skill level alone is never sufficient evidence for critical launch requirements.*

2. **Authoritative Statutory Verification**:
   - `IsMandatoryVerification = true` ONLY IF Phase 3 Legal Assessment or another authoritative upstream legal source explicitly flags it as mandatory.
   - Phase 4.4 never invents legal obligations; statutory flags are grounded in upstream legal evidence.

3. **Non-Exclusive Verify with Supporting Learning**:
   - For statutory or professional verification items (`VERIFY`), the primary resolution mode remains `VERIFY`.
   - The engine automatically includes an `OptionalLearningSupplement` (foundational domain literacy) so the founder understands the concepts when interacting with practitioners.

4. **Phase 4.3 Covered Requirements Pass-Through**:
   - Phase 4.3 `CoveredRequirements` pass directly into Phase 4.4 `CoveredCapabilities`.
   - They are never re-analyzed for redundant Learn or Delegate recommendations.

5. **Deterministic & Curated Learning Topics**:
   - The engine maps requirements to a pre-curated capability taxonomy template.
   - Outputs concrete, structured learning topics (e.g., SEO keyword research, on-page optimization, unit testing basics), avoiding arbitrary AI curriculum generation.

6. **Strict Founder Override Decoupling**:
   - `ResolutionMode` represents system truth and engine recommendations.
   - `FounderDecision` captures creator choice (`ChooseLearn`, `ChooseDelegate`, `ConfirmCovered`, `Defer`).
   - Plan refresh preserves `FounderDecision` and `FounderNotes` by stable key.
   - **Safety Lock**: Statutory verification requirements cannot be overridden with `ChooseLearn` or `ChooseDelegate`.

---

## REST API Specification

### Base Path: `/api/creator/phase4/skills-plan`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/creator/phase4/skills-plan?ideaId={ideaId}` | Retrieves current skills plan, staleness status, profile summary, and upstream freshness |
| `POST` | `/api/creator/phase4/skills-plan/generate` | Idempotently generates skills plan from Phase 4.3 and HumainX context |
| `POST` | `/api/creator/phase4/skills-plan/refresh` | Refreshes recommendations against updated sources while preserving founder overrides |
| `PATCH` | `/api/creator/phase4/skills-plan/{resolutionKey}?ideaId={ideaId}` | Records founder override decision (`ChooseLearn`, `ChooseDelegate`, etc.) and notes |

---

## UI Presentation Canon

1. **Resolution Metrics**:
   - Displays clear integer counters: Learn, Delegate, Verify, Covered, Needs Review, and Total Estimated Learning Hours.
   - **No completion percentages** (e.g. no "100% complete"), adhering to the non-arbitrary progress canon.
2. **Profile Context Card**:
   - Displays HumainX parameters evaluated: weekly availability, learning preference, delegation preference, and verified top skills.
3. **Actionable Detail Cards**:
   - **Learn**: Objective, current vs. target level, estimated hours, and curated learning topics.
   - **Delegate**: Suggested partner type, timing, and expected deliverables.
   - **Verify**: Verification type, authority source, required legal evidence, statutory lock, and optional supporting learning supplement.
   - **Covered**: Proven capability note and source reference.
4. **Founder Action Dialog**:
   - Allows creator to adjust resolution path with notes.
   - Prevents non-compliant overrides for statutory verification items.
5. **Phase 4.5 Boundary Banner**:
   - Read-only callout for upcoming Aids, Grants & Subsidies.
