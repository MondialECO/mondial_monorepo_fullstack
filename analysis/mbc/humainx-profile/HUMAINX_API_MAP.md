# HumainX API Surface & Endpoint Map

**Track**: Creator & Professional Profile  
**Version**: 1.0 (September 2026)  

---

## 1. Endpoints Overview

| Method | Route | Description | Auth Required | Gate / Guard |
|---|---|---|---|---|
| `GET` | `/api/profile/me/completeness` | Calculates completeness % & Phase 4 readiness | Yes (`Bearer`) | None |
| `GET` | `/api/profile/me` | Fetches caller's full universal profile (includes `completeness`) | Yes (`Bearer`) | None |
| `PUT` | `/api/profile/me` | Updates skills, experiences, education, languages & venture context | Yes (`Bearer`) | None |
| `GET` | `/api/creator/offer/readiness` | Checks Phase 3 completion + Phase 4 profile readiness for an idea | Yes (`Bearer`) | Requires `ideaId` |
| `POST` | `/api/creator/offer/pricing` | Sets Phase 4 offer pricing | Yes (`Bearer`) | **Domain Gate**: Phase 3 + Profile Ready |
| `POST` | `/api/creator/offer/resource-calculation` | Sets Phase 4 team/tools resources | Yes (`Bearer`) | **Domain Gate**: Phase 3 + Profile Ready |
| `POST` | `/api/creator/offer/gtm-setup` | Sets Phase 4 GTM channels & website setup | Yes (`Bearer`) | **Domain Gate**: Phase 3 + Profile Ready |

---

## 2. Request & Response Payloads

### `GET /api/profile/me/completeness`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "profileCompletion": 63,
    "phase4Ready": true,
    "missingForPhase4": []
  }
}
```

When incomplete:
```json
{
  "success": true,
  "data": {
    "profileCompletion": 13,
    "phase4Ready": false,
    "missingForPhase4": [
      "CurrentSituation",
      "WeeklyAvailability",
      "Region",
      "ProgressPreference"
    ]
  }
}
```

---

### `GET /api/creator/offer/readiness?ideaId={ideaId}`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "phase3Complete": true,
    "phase4Ready": true,
    "ready": true,
    "missingForPhase4": [],
    "profileCompletion": 100
  }
}
```

When Phase 3 is incomplete:
```json
{
  "success": true,
  "data": {
    "phase3Complete": false,
    "phase4Ready": true,
    "ready": false,
    "missingForPhase4": [],
    "profileCompletion": 80
  }
}
```

When Profile is incomplete:
```json
{
  "success": true,
  "data": {
    "phase3Complete": true,
    "phase4Ready": false,
    "ready": false,
    "missingForPhase4": [
      "Skills",
      "ProgressPreference"
    ],
    "profileCompletion": 38
  }
}
```

---

### `POST /api/creator/offer/pricing` (and other Phase 4 mutations)

When caller does not meet Phase 4 eligibility criteria:

**Response (`403 Forbidden`)**:
```json
{
  "success": false,
  "message": "Phase 4 personalization gate not met. Profile requires: Skills, CurrentSituation, WeeklyAvailability, Region, ProgressPreference."
}
```
Or when Phase 3 is incomplete:
```json
{
  "success": false,
  "message": "Phase 3 must be completed before entering Phase 4."
}
```

---

## 3. Client API Abstraction (`src/lib/api-creator-profile.ts`)

```typescript
export const creatorProfileApi = {
  getCompleteness(): Promise<ProfileCompletenessResponse>;
  getMyProfile(): Promise<UniversalProfileResponseDto>;
  getPhase4Readiness(ideaId?: string | null): Promise<Phase4ReadinessResponse>;
  saveHumainXProfile(formData: HumainXFormData, existingSkills?: HumainXSkill[]): Promise<any>;
};
```
