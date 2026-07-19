# Sumsub API Integration Guide

## Overview

Complete Sumsub integration for face verification and KYC in the Mondial identity verification flow.

### Features Implemented

- ✅ Token generation for Sumsub SDK
- ✅ Applicant creation and management
- ✅ Verification status checks
- ✅ Webhook handling for completion notifications
- ✅ Secure signature verification
- ✅ Audit logging for all verification events

---

## Setup Instructions

### 1. Create Sumsub Account

1. Visit [Sumsub](https://sumsub.com/)
2. Sign up for a Sumsub account
3. Set up your application in the dashboard

### 2. Get Credentials

From Sumsub Dashboard → Settings → API:

- **App Token**: Your API authentication token (keep secret!)
- **Base URL**: `https://api.staging.sumsub.com` (staging) or `https://api.sumsub.com` (production)
- **Webhook Secret**: Generate in Webhooks section

### 3. Configure Environment

Update `appsettings.json` or set environment variables:

```json
{
  "Sumsub": {
    "AppToken": "YOUR_APP_TOKEN_HERE",
    "BaseUrl": "https://api.staging.sumsub.com",
    "WebhookSecret": "YOUR_WEBHOOK_SECRET"
  }
}
```

**Or use environment variables:**
```bash
export Sumsub__AppToken=YOUR_APP_TOKEN
export Sumsub__BaseUrl=https://api.staging.sumsub.com
export Sumsub__WebhookSecret=YOUR_WEBHOOK_SECRET
```

### 4. Set Up Webhook

Configure in Sumsub Dashboard → Webhooks:

**Endpoint URL:**
```
https://yourdomain.com/api/onboarding/sumsub/webhook
```

**Events to subscribe to:**
- Applicant Review (all statuses)

**Authentication:**
- Sumsub will send `X-Sumsub-Signature` header with HMAC-SHA256 signature
- Server verifies using configured WebhookSecret

---

## API Endpoints

### 1. Get Sumsub Access Token

**Request:**
```
GET /api/onboarding/sumsub/token
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Access token generated",
  "data": {
    "accessToken": "exampleAccessToken123..."
  }
}
```

**What it does:**
- Creates/retrieves Sumsub applicant for the user
- Generates short-lived (15 min) access token
- Returns token for frontend SDK initialization

---

### 2. Confirm Face Verification

**Request:**
```
POST /api/onboarding/face/verify-sumsub
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Face verification complete"
}
```

**What it does:**
- Checks current verification status with Sumsub API
- Verifies face verification is approved
- Updates user record if approved
- Triggers phase promotion if complete

**Error Cases:**
- Face not yet approved → 400 "Face verification not approved yet"
- Status check failed → 500 "Unable to verify status"

---

### 3. Webhook Handler (Sumsub → Backend)

**Endpoint:**
```
POST /api/onboarding/sumsub/webhook
X-Sumsub-Signature: {hmac_signature}
Content-Type: application/json
```

**Payload:**
```json
{
  "applicantId": "620a0aa234d6e1001e4a4e3a",
  "externalUserId": "user-mongodb-id",
  "reviewStatus": "APPROVED",
  "createdAt": 1234567890,
  "clientId": "xxx",
  "inspectionId": "xxx",
  "applicantEmail": "user@example.com"
}
```

**Review Status Values:**
- `APPROVED` - All verifications passed
- `REJECTED` - Verification failed
- `PENDING` - Still under review

**Webhook Behavior:**

| Status | Action |
|--------|--------|
| APPROVED | Mark both identity & face as verified, promote phase |
| REJECTED | Mark both as unverified |
| PENDING | Log event, no state change |

---

## Frontend Integration

### Loading Sumsub SDK

```javascript
// In IdentityVerification.tsx
const response = await api.get('/onboarding/sumsub/token');
const { accessToken } = response.data?.data;

// Load SDK
const script = document.createElement('script');
script.src = 'https://sdk.sumsub.com/idensic.min.js';
script.onload = () => initSumsubWidget(accessToken);
```

### Initializing Widget

```javascript
const sdk = SumsubWebSdk.init({
  accessToken,                  // From /sumsub/token endpoint
  applicantEmail: userEmail,
  containerId: 'sumsub-container',
  onMessage: (msg) => console.log(msg),
  onError: (error) => handleError(error),
});

// Listen for completion
sdk.on('idensic:completed', () => {
  // Call POST /onboarding/face/verify-sumsub
  // Then redirect to dashboard
});

sdk.on('idensic:failed', () => {
  // Handle failure
});
```

---

## Service Architecture

### SumsubService (backend/Services/SumsubService.cs)

**Public Methods:**

1. **GenerateAccessTokenAsync(userId, email)**
   - Creates/retrieves applicant
   - Generates 15-minute access token
   - Returns token for SDK

2. **GetVerificationStatusAsync(externalUserId)**
   - Queries Sumsub API for current status
   - Parses identity, face, phone, email verification states
   - Returns SumsubVerificationStatus object

3. **VerifyWebhookSignature(body, signature)**
   - Validates HMAC-SHA256 signature
   - Returns true if valid, false otherwise

**Private Methods:**

- EnsureApplicantAsync(): Creates applicant if not exists
- CreateApplicantAsync(): Calls Sumsub API to create new applicant
- GetVerificationState(): Extracts verification state for specific check type
- AddAuthHeaders(): Adds X-App-Token and signature headers
- GenerateSignature(): Creates HMAC-SHA256 signature for requests

---

## Security

### Authentication

**API Calls:**
- Header: `X-App-Token: {AppToken}`
- POST/PUT/DELETE also include HMAC signature
- Signature: `HMAC-SHA256(AppToken, "METHOD|path|timestamp")`

**Webhooks:**
- Sumsub sends HMAC-SHA256 signature in `X-Sumsub-Signature` header
- Server verifies using WebhookSecret
- Invalid signatures rejected with 401 Unauthorized

### Data Protection

- AppToken stored in secure configuration (environment variables)
- Face photos stored in Sumsub (not in Mondial database)
- Webhook secret stored securely
- HTTPS enforced for all API calls
- Short-lived tokens (15 minutes)
- Audit logging for all verification events

---

## Testing

### Development/Staging

1. **Use Sumsub Staging Environment:**
   ```
   BaseUrl: https://api.staging.sumsub.com
   ```

2. **Test with Demo Documents:**
   - Sumsub provides test images on their dashboard
   - Use for testing without real documents

3. **Webhook Testing:**
   - Use Sumsub's webhook test/replay feature in dashboard
   - Or trigger manually via their API

### Production

1. **Switch to Production URLs:**
   ```
   BaseUrl: https://api.sumsub.com
   ```

2. **Real Documents Only:**
   - Production only accepts real government IDs

3. **Monitor Webhook Delivery:**
   - Check Sumsub dashboard for webhook logs
   - Verify user records update correctly

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "AppToken not configured" | Missing Sumsub:AppToken | Set in appsettings.json or env var |
| "Invalid signature" | Webhook signature mismatch | Verify WebhookSecret is correct |
| "User not found" | Invalid userId | Ensure user exists before calling endpoint |
| "Face verification not approved" | Sumsub still reviewing | User must complete verification in widget |
| 500 - Status check failed | Sumsub API unreachable | Check network, Sumsub status page |

### Retry Logic

**Frontend:**
- Automatic retry on 500 errors
- User can retry manually on 400 errors
- Max 3 attempts before showing error

**Webhook:**
- Sumsub retries webhook if server returns 500
- Returns 200 OK immediately to prevent retries
- Processes asynchronously in background

---

## Audit Logging

All verification events are logged for compliance:

```csharp
_audit.Record("face_sumsub_verify", user.Email, true);
_audit.Record("sumsub_webhook_approved", user.Email, true);
_audit.Record("sumsub_webhook_rejected", user.Email, false);
```

Logged information:
- User email
- Event type
- Success/failure
- Timestamp
- Any additional context

---

## Troubleshooting

### Token Generation Fails

1. Check AppToken in config
2. Verify user record exists
3. Check Sumsub API status page
4. Review application logs for specific error

### Webhook Not Received

1. Verify webhook URL is accessible
2. Check webhook configuration in Sumsub dashboard
3. Verify WebhookSecret matches
4. Test webhook delivery in Sumsub dashboard
5. Check firewall/security groups allow inbound

### Verification Status Wrong

1. Check Sumsub applicant status in dashboard
2. Verify user email matches applicant
3. Ensure user completed all required steps
4. Check audit logs for webhook receipt

---

## Next Steps

1. **Get Sumsub Account**: [sumsub.com](https://sumsub.com/)
2. **Configure Credentials**: Set AppToken, BaseUrl, WebhookSecret
3. **Set Up Webhook**: Configure in Sumsub dashboard
4. **Test Staging**: Verify flow works end-to-end
5. **Switch to Production**: When ready to go live

---

## References

- [Sumsub API Docs](https://docs.sumsub.com/api-reference)
- [Sumsub Web SDK](https://docs.sumsub.com/docs/web-sdk)
- [Sumsub Webhook Events](https://docs.sumsub.com/webhooks)
- Integration Code: `backend/Services/SumsubService.cs`
- Controller: `backend/Controllers/OnboardingController.cs`
- Frontend: `src/components/onboarding/IdentityVerification.tsx`
