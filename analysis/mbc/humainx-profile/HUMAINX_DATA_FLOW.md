# HumainX Data Flow & Architectural Topology

**Mondial ECO** — Creator Track / HumainX Engine  
**Document**: Data Flow Specification  

---

## 1. End-to-End Data Pipeline

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16)"]
        UI["/dashboard/creator/profile (HumainX Form)"]
        DASH["/dashboard/creator (Dashboard Card)"]
        GUARD["Phase4ProfileGuard Component"]
        CLIENT_API["src/lib/api-creator-profile.ts"]
    end

    subgraph Server ["Backend (.NET 8 WebApp)"]
        CTRL_PROF["ProfileController"]
        CTRL_PHASE4["CreatorPhase4Controller"]
        RESOLVER["IProfileCompletenessResolver"]
        REPO["MongoRepository<ProfessionalProfileRecord>"]
    end

    subgraph Database ["MongoDB (Atlas)"]
        COLL_PROF[("ProfessionalProfiles Collection")]
        COLL_JOURNEY[("CreatorJourney / Ideas")]
    end

    subgraph FutureEngines ["Future Phase 4 Engines"]
        GAP_ENGINE["Skill Gap Engine (Skills + Phase 3 YouNeed)"]
        ACTION_ENGINE["Progress Engine (Skill Gap + Preference -> Learn/Delegate)"]
        PACING_ENGINE["Roadmap Pacing Engine (Availability + Timeline)"]
        AIDS_ENGINE["Aids Matching Engine (Situation + Region)"]
    end

    UI -->|"Save Profile Payload"| CLIENT_API
    CLIENT_API -->|"PUT /api/profile/me"| CTRL_PROF
    CTRL_PROF -->|"Persist Record"| REPO
    REPO --> COLL_PROF

    DASH -->|"GET /api/profile/me/completeness"| CTRL_PROF
    CTRL_PROF -->|"Resolve Status"| RESOLVER
    RESOLVER -->|"Read Document"| REPO

    GUARD -->|"GET /api/creator/offer/readiness"| CTRL_PHASE4
    CTRL_PHASE4 -->|"Check Phase 3 Status"| COLL_JOURNEY
    CTRL_PHASE4 -->|"Check Phase 4 Ready"| RESOLVER

    RESOLVER -->|"Outputs: phase4Ready, missingForPhase4"| GUARD

    COLL_PROF -.-> GAP_ENGINE
    COLL_PROF -.-> ACTION_ENGINE
    COLL_PROF -.-> PACING_ENGINE
    COLL_PROF -.-> AIDS_ENGINE
```

---

## 2. Model Persistence Structure

### `ProfessionalProfiles` Document

```json
{
  "_id": "60d5ecb8b392d72f10b8e1a1",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "skills": [
    {
      "name": "Full-Stack Development",
      "level": "Expert",
      "source": "SelfDeclared",
      "verification": null
    },
    {
      "name": "UI/UX Prototyping",
      "level": "Comfortable",
      "source": "SelfDeclared",
      "verification": null
    },
    {
      "name": "Legacy C#",
      "level": null,
      "source": "LegacyMigration",
      "verification": null
    }
  ],
  "experiences": [
    {
      "id": "exp_01",
      "jobTitle": "Lead Developer",
      "companyName": "TechVenture Studio",
      "experienceType": "Job",
      "skillsUsed": ["TypeScript", "Next.js", "Docker"],
      "startDate": "2023-01",
      "endDate": null,
      "isCurrent": true,
      "description": "Building early-stage MVP products."
    }
  ],
  "education": [
    {
      "id": "edu_01",
      "institution": "University of Tech",
      "degree": "Master",
      "fieldOfStudy": "Software Engineering",
      "startYear": 2019,
      "endYear": 2021
    }
  ],
  "languages": [
    {
      "id": "lang_01",
      "language": "French",
      "proficiency": "Native"
    }
  ],
  "ventureContext": {
    "currentSituation": "EmployedFullTime",
    "weeklyAvailability": "10to20Hours",
    "region": "Ile-de-France",
    "previousEntrepreneurialExperience": "FirstTimeFounder",
    "learningPreference": "HandsOn",
    "delegationPreference": "DelegateWherePossible"
  },
  "updatedAt": "2026-09-21T00:30:00Z"
}
```

---

## 3. Completeness vs. Readiness Matrix

| Criterion | Affects Completion (0–100%)? | Required for Phase 4 Ready? | Machine Key if Missing |
|---|---|---|---|
| **Skills (≥ 1 declared)** | Yes (12.5%) | **YES** | `"Skills"` |
| **Current Situation** | Yes (12.5%) | **YES** | `"CurrentSituation"` |
| **Weekly Availability** | Yes (12.5%) | **YES** | `"WeeklyAvailability"` |
| **Region** | Yes (12.5%) | **YES** | `"Region"` |
| **Progress Preference (Learning OR Delegation)** | Yes (12.5%) | **YES** | `"ProgressPreference"` |
| **Experiences (≥ 1)** | Yes (12.5%) | No (Optional) | - |
| **Education (≥ 1)** | Yes (12.5%) | No (Optional) | - |
| **Languages (≥ 1)** | Yes (12.5%) | No (Optional) | - |

**Example State Scenarios:**
- A student founder with **no formal job/internship** and **no university degree**, but who declared skills, availability, and progress preference:
  - **Completion**: 63%
  - **Phase 4 Ready**: **TRUE** (Unblocked!)
- A seasoned executive who entered 10 years of experiences and degrees, but **skipped their weekly availability**:
  - **Completion**: 88%
  - **Phase 4 Ready**: **FALSE** (Blocked until availability is declared so roadmap pacing can be computed).

---

## 4. Downstream Phase 4 Engine Data Binding

When Phase 4 execution begins, the HumainX profile data powers 5 distinct automation systems:

1. **Skill Gap Engine**:
   - Compares founder's declared `Skills` with the requirements mined during Phase 3 ("You Need" list).
   - Identifies uncovered skills without human assumptions.
2. **Personalized Action Engine**:
   - Uses `LearningPreference` vs `DelegationPreference` to recommend:
     - *Self-Taught*: Guided modules, tutorials, documentation.
     - *Delegation*: Service Provider marketplace matchmaking, RFQ generation.
     - *Hybrid*: AI co-pilot + external review.
3. **Roadmap Pacing Engine**:
   - Integrates `WeeklyAvailability` (e.g. 5–10 hrs vs Full-time) to generate realistic milestone dates and sprint schedules.
4. **Local Support & Grants Engine**:
   - Matches `CurrentSituation` and `Region` against French/European entrepreneurial aid programs (e.g. ACRE, ARCE, Bpifrance, French Tech grants).
