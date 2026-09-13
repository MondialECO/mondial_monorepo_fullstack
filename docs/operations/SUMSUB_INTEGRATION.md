# Sumsub Identity Verification Integration Guide

## Overview

Mondial ECO integrates with **Sumsub** strictly for **Automated Identity Document Verification (KYC)**. 
Facial verification, selfie comparison, liveness detection, and video identification are permanently excluded from this integration.

### Canonical Architecture Features

- ✅ **Document-Only Verification**: Passport, National ID (CNI), Residence Permit (Titre de séjour).
- ✅ **Secure Token Minting**: Short-lived (15-minute) WebSDK tokens via `POST /api/identity/session`.
- ✅ **Automated Webhook Ingress**: Real-time webhook processing via `POST /api/identity/webhook/sumsub`.
- ✅ **HMAC-SHA256 Signature Verification**: Cryptographic validation against raw incoming request bodies.
- ✅ **Idempotent Delivery Tracking**: Deduplication via `ProcessedEventIds` and `IdentityWebhookDeliveryLogs`.
- ✅ **Durable Audit Trail**: Transition logging in `IdentityDecisionAuditLogs`.
- ✅ **Universal Phase 1 Promotion Gate**: Automated promotion to `Onboarding.Phase = 1` upon document verification + email OTP + phone verification.

---

## Configuration & Environment Variables

Sumsub credentials are read by `SumsubService.cs` and validated at startup in `Program.cs`:

```json
{
  "Sumsub": {
    "AppToken": "<your-sumsub-app-token>",
    "BaseUrl": "https://api.sumsub.com",
    "WebhookSecret": "<your-sumsub-webhook-signing-secret>",
    "LevelName": "id-document-only"
  },
  "FeatureFlags": {
    "IdentityV2Enabled": true,
    "AllowLegacyIdentityUpload": false
  }
}
```

### Environment Variable Format

```bash
Sumsub__AppToken="<app-token>"
Sumsub__BaseUrl="https://api.sumsub.com"
Sumsub__WebhookSecret="<webhook-secret>"
Sumsub__LevelName="id-document-only"
FeatureFlags__IdentityV2Enabled=true
FeatureFlags__AllowLegacyIdentityUpload=false
```

---

## API Endpoints

### 1. Document Configuration (`GET /api/identity/config`)
* **Access**: Public / Anonymous
* **Parameters**: `?country=FR`
* **Response**: Returns supported document types for the country (e.g. `national_id`, `passport`, `residence_permit` for France).

### 2. Start / Resume Verification Session (`POST /api/identity/session`)
* **Access**: Authenticated (`Authorization: Bearer <jwt>`)
* **Request Body**:
  ```json
  {
    "documentType": "national_id",
    "countryCode": "FR",
    "issuingCountry": "FR",
    "nationality": "FR"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "<short_lived_sumsub_websdk_token>",
      "applicantId": "<sumsub_applicant_id>",
      "status": "pending",
      "verificationId": "<universal_verification_id>"
    }
  }
  ```

### 3. Verification Status Query (`GET /api/identity/status`)
* **Access**: Authenticated (`Authorization: Bearer <jwt>`)
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "Verified",
      "documentType": "national_id",
      "isCurrent": true,
      "reviewReason": null,
      "canRetry": false
    }
  }
  ```

### 4. Retry Verification (`POST /api/identity/retry`)
* **Access**: Authenticated (`Authorization: Bearer <jwt>`)
* **Response**: Archives current attempt (`IsCurrent = false`) and enables the user to start a fresh attempt.

### 5. Canonical Webhook Ingress (`POST /api/identity/webhook/sumsub`)
* **Access**: Public (Authenticated by HMAC-SHA256 signature header)
* **Headers**:
  * `X-Payload-Digest`: Hex-encoded HMAC-SHA256 signature of the raw body using `Sumsub:WebhookSecret`.
  * `X-Sumsub-Event-Id`: Unique provider event identifier.
* **Payload**: Sumsub applicant review status notification (`applicantReviewed`).
* **Processing Actions**:
  1. Validates signature against raw body bytes.
  2. Records operational log in `IdentityWebhookDeliveryLogs`.
  3. Updates `UniversalIdentityVerifications` record with new state (`Verified`, `Rejected`, `ManualReview`).
  4. Records transition in `IdentityDecisionAuditLogs`.
  5. Updates `ApplicationUser.Onboarding.IdentityDocumentVerified = true` upon approval (`GREEN`).
  6. Evaluates `OnboardingGate.PromoteIfCompleteAsync`.

*Note: Legacy forwarder `POST /api/onboarding/sumsub/webhook` has been completely removed.*

---

## Data Models & Collections

| Collection Name | Entity Model | Purpose |
| :--- | :--- | :--- |
| `UniversalIdentityVerifications` | `UniversalIdentityVerification` | Authoritative domain record for identity attempts and provider applicant mappings. |
| `IdentityWebhookDeliveryLogs` | `IdentityWebhookDeliveryLog` | Ingress delivery audit log (contains payload SHA256 digest; zero raw PII). |
| `IdentityDecisionAuditLogs` | `IdentityDecisionAuditLog` | State machine transition history (`PreviousState` $\to$ `NewState`). |
| `applicationUsers` | `ApplicationUser` | User document holding `Onboarding.IdentityDocumentVerified` projection and gate status. |

---

## Explicit Verification Level Binding & Fail-Closed Policy

* **Configured Level**: `Sumsub:LevelName = "id-document-only"`
* **SDK Token Endpoint**: `POST /resources/accessTokens/sdk`
  - **Request Headers**: `X-App-Token`, `X-App-Access-Ts`, `X-App-Access-Sig`
  - **JSON Body**:
    ```json
    {
      "userId": "<user_id>",
      "levelName": "id-document-only",
      "ttlInSecs": 900
    }
    ```
* **Applicant Creation Endpoint**: `POST /resources/applicants?levelName=id-document-only`
  - **JSON Body**:
    ```json
    {
      "externalUserId": "<user_id>",
      "email": "<email>"
    }
    ```
* **Cryptographic Request Signing (Outbound)**:
  - Format: `HMAC-SHA256(SecretKey, timestamp + HTTP_METHOD + URI_WITH_QUERY + EXACT_SERIALIZED_BODY)`
  - Exact body bytes are used for both signature computation and HTTP transmission to prevent whitespace/encoding drift.
* **Fail-Closed Protection**: If `Sumsub:LevelName` is missing, blank, or unconfigured, token generation and applicant creation throw an `InvalidOperationException` immediately.
* **Zero Account Default Fallback**: The system strictly refuses to rely on the Sumsub Account Default Level, guaranteeing that dashboard default changes cannot silently activate biometric steps.

---

## France MVP Document Rules

| Document Type Code | Name | Front Photo Required | Back Photo Required |
| :--- | :--- | :--- | :--- |
| `national_id` | Carte Nationale d'Identité (CNI) | **Yes** | **Yes** |
| `passport` | Passeport | **Yes** | **No** |
| `residence_permit` | Titre de séjour | **Yes** | **Yes** |

*Driver's license is strictly excluded from France KYC.*

---

## Architectural Limitation (Document-Only KYC)

* MBC uses **document-only** identity verification.
* It validates provider-approved document authenticity and identity-document validity state.
* It does **NOT** perform biometric owner matching because:
  - **Selfie** is disabled
  - **Liveness** is disabled
  - **Face Match** is disabled
* The system does not purport to prove physical document ownership beyond provider-side document inspection and live capture enforcement.

---

## Verification Status & Operational Status

* **WEBHOOK CODE-PATH TEST RESULT**: **PASS** (20 automated unit and integration tests executing HMAC-SHA256 signature verification, idempotency deduplication, out-of-order protection, deterministic signing, route regressions, and Phase 1 gate promotion).
* **REAL CANONICAL WEBHOOK DELIVERY**: **VERIFIED** (Confirmed delivery of provider-generated `applicantReviewed` event to `https://mondialbusiness.eu/api/identity/webhook/sumsub` with `200 OK`).
* **LEGACY SUMSUB WEBHOOK**: **REMOVED**
* **UNIVERSAL IDENTITY PRODUCTION STATUS**: **PRODUCTION READY** / **FROZEN**


