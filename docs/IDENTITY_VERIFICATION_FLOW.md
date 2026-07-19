# Identity Verification Flow - Updated Implementation

## Overview
Identity verification is a **2-part process**:
1. **Identity Document Upload** - User uploads government ID (Passport/National ID/Driver's License)
2. **Face Verification** - Live face verification using **Sumsub** (not photo upload)

---

## Part 1: Identity Document Upload

### Frontend Flow
```
User navigates to /onboarding/identity
  ↓
Step 1: Select Document Type (Passport, National ID, Driver's License)
  ↓
Step 2: Upload Front Photo + Back Photo (optional for Passport)
  ↓
API POST /onboarding/identity/upload
```

### Backend Endpoint
```
POST /onboarding/identity/upload
Headers: Content-Type: multipart/form-data

Request:
  - documentType: "passport" | "national_id" | "drivers_license"
  - frontPhoto: File (required)
  - backPhoto: File (optional)

Response:
{
  "success": true,
  "message": "Identity documents uploaded for review",
  "data": {
    "documentType": "passport",
    "frontPath": "/uploads/identity/documents/...",
    "backPath": "/uploads/identity/documents/...",
    "message": "Your documents are being reviewed. You'll receive an update shortly."
  }
}

Backend Actions:
  - Saves files to disk (identity/documents/)
  - Stores paths in Onboarding record:
    * IdentityDocumentType
    * IdentityDocumentFront
    * IdentityDocumentBack (if provided)
    * IdentityDocumentUploadedAt
  - Sets IdentityDocumentVerified = false (awaiting manual review)
  - Audits the upload
```

### Data Persistence
```csharp
user.Onboarding.IdentityDocumentType = "passport";
user.Onboarding.IdentityDocumentFront = "/uploads/identity/documents/abc123.jpg";
user.Onboarding.IdentityDocumentBack = "/uploads/identity/documents/abc124.jpg"; // nullable
user.Onboarding.IdentityDocumentUploadedAt = DateTime.UtcNow;
user.Onboarding.IdentityDocumentVerified = false;
```

---

## Part 2: Face Verification (Sumsub)

### Frontend Flow
```
After identity upload successful
  ↓
Step 3: Face Verification (Sumsub Widget)
  ↓
1. Frontend calls GET /onboarding/sumsub/token
2. Loads Sumsub SDK from CDN
3. Initializes widget with access token
4. User performs live face verification
5. Sumsub SDK triggers "idensic:completed" event
6. Frontend calls POST /onboarding/face/verify-sumsub
```

### Backend Endpoints

#### 1. Get Sumsub Access Token
```
GET /onboarding/sumsub/token
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Access token generated",
  "data": {
    "accessToken": "exampleAccessToken123..."
  }
}

Backend Actions:
  - Reads Sumsub:AppToken from configuration
  - TODO: Call Sumsub API to generate applicant token
  - Returns token to frontend for widget initialization
```

#### 2. Confirm Face Verification
```
POST /onboarding/face/verify-sumsub
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Face verification complete"
}

Backend Actions:
  - TODO: Verify with Sumsub API that verification is complete
  - Sets FaceVerified = true
  - Updates Onboarding record
  - Calls PromotePhaseIfCompleteAsync()
  - Audits the verification
```

### Sumsub Widget Integration
```javascript
// Frontend code in IdentityVerification.tsx

const sdk = SumsubWebSdk.init({
  accessToken,                    // From /onboarding/sumsub/token
  applicantEmail: userEmail,
  containerId: 'sumsub-container',
  onMessage: (msg) => console.log(msg),
  onError: (error) => setError('Face verification failed'),
});

// Listen for completion
sdk.on('idensic:completed', () => {
  setFaceVerified(true);  // Enable "Complete Verification" button
});

sdk.on('idensic:failed', () => {
  setError('Face verification failed. Please try again.');
});
```

### Data Persistence
```csharp
user.Onboarding.FaceVerified = true;
// Sumsub handles all face photo data internally
// We only track verification status, not raw photos
```

---

## Complete Verification Flow

### Sequence Diagram
```
User                Frontend              Backend            Sumsub
  |                   |                     |                 |
  |--Step 1: Select doc type-->|
  |                   |                     |
  |--Step 2: Upload identity photos-->|
  |                   |--POST /identity/upload-->|
  |                   |                     |--Save files
  |                   |<--Success-----------|
  |                   |
  |--Step 3: Face verification-->|
  |                   |--GET /sumsub/token-->|
  |                   |<--Access token---|
  |                   |--Load Sumsub SDK-->|
  |                   |                     |         Initialize
  |--Live face scan-->|--Sumsub Widget---->|-------->|
  |                   |                     |         |--Liveness check
  |                   |                     |         |--Face matching
  |                   |<----Completed------|<--------|
  |                   |--POST /face/verify-sumsub-->|
  |                   |                     |--Set FaceVerified
  |                   |<--Success-----------|
  |                   |
  |--Step 4: Complete-->|
  |--Redirect to dashboard-->|
```

---

## API Integration Checklist

### Frontend (/onboarding/identity)
- [x] Document type selection UI
- [x] Document photo upload (multipart/form-data)
- [x] Sumsub SDK loader
- [x] Sumsub widget initialization with access token
- [x] Face verification completion handler
- [x] Success/error states
- [x] Back navigation

### Backend
- [x] POST /onboarding/identity/upload endpoint
- [x] File storage logic
- [x] Database persistence
- [x] GET /onboarding/sumsub/token endpoint
- [ ] TODO: Sumsub API integration (token generation)
- [x] POST /onboarding/face/verify-sumsub endpoint
- [ ] TODO: Sumsub API verification (confirm completion)
- [x] Phase promotion logic

### Configuration Required
```
appsettings.json:
{
  "Sumsub": {
    "AppToken": "your_sumsub_app_token",
    "BaseUrl": "https://api.sumsub.com"  // or staging URL
  }
}
```

---

## Sumsub Integration TODO

### Before Production
1. **Get Sumsub Credentials**
   - App Token (for server-side API calls)
   - Add /onboarding/sumsub/token real implementation

2. **Implement Token Generation**
   - Call Sumsub API: `POST /resources/applicants/{applicantId}/accessTokens`
   - Create applicant if doesn't exist
   - Return access token to frontend

3. **Implement Verification Check**
   - Call Sumsub API: `GET /resources/applicants/{applicantId}/status`
   - Verify "face" verification status is "approved"
   - Update database accordingly

4. **Add Webhook Handler**
   - Sumsub sends webhook when verification completes
   - Endpoint: POST /onboarding/sumsub/webhook
   - Verify webhook signature
   - Update user verification status

5. **Testing**
   - Test with Sumsub staging environment first
   - Test with real devices (mobile camera needed)
   - Test various document types
   - Test edge cases (poor lighting, etc.)

---

## File Structure
```
Frontend:
  src/components/onboarding/IdentityVerification.tsx  (UI component)
  src/app/onboarding/identity/page.tsx                (Page wrapper)

Backend:
  backend/Controllers/OnboardingController.cs         (Endpoints)
  backend/Models/Onboarding.cs                        (Database model)

Config:
  appsettings.json                                    (Sumsub credentials)
```

---

## Error Handling

### Common Errors
```javascript
// File size exceeded
"Image must be smaller than 5MB"

// Invalid file type
"Please upload an image file"

// Sumsub SDK failed to load
"Failed to load face verification SDK"

// Face verification failed
"Face verification failed. Please try again."

// Sumsub not configured
"Face verification not configured" (500)
```

---

## Security Considerations

1. **File Validation**
   - Check MIME type
   - Check file size (< 5MB)
   - Store in isolated directory

2. **API Security**
   - All endpoints require authentication (Bearer token)
   - Rate limiting enabled on auth endpoints
   - Audit logging for all verification attempts

3. **Sumsub Integration**
   - Access tokens are short-lived (typically 15-30 min)
   - Verify webhook signatures
   - Use HTTPS for all Sumsub API calls
   - Never log or store access tokens

4. **Data Privacy**
   - Identity photos stored securely
   - GDPR compliant (user can request deletion)
   - Face data handled by Sumsub (not stored locally)
   - Audit trail maintained

---

## Testing Credentials
```
Development:
  Sumsub Staging: https://api.staging.sumsub.com
  Test documents: Use Sumsub test images
  Test credentials: Available in Sumsub dashboard

Production:
  Sumsub Production: https://api.sumsub.com
  Real documents only
  Proper error handling required
```

---

## Troubleshooting

### "Face verification not configured"
- Check `Sumsub:AppToken` in appsettings.json
- Verify Sumsub account is active
- Check API credentials

### "Sumsub widget won't load"
- Check browser console for SDK errors
- Verify CDN is accessible: https://sdk.sumsub.com/idensic.min.js
- Check CORS settings

### "Face verification not completing"
- Check Sumsub dashboard for user status
- Verify camera permissions are granted
- Test with different browsers/devices
- Check lighting conditions

---

## References

- [Sumsub SDK Documentation](https://docs.sumsub.com/api-reference/web-sdk/web-sdk)
- [Sumsub API Reference](https://docs.sumsub.com/api-reference)
- [Mondial Onboarding System](./README.md)
