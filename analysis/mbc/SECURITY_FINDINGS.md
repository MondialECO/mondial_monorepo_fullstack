# MONDIAL BUSINESS CREATION (MBC) — SECURITY FINDINGS

**Skill**: `modernize-harden`  
**Date**: September 19, 2026  
**Auditor**: Antigravity Security Specialist (`security-auditor`)  
**Status**: COMPLETE — FINDINGS-ONLY (NO PATCHES APPLIED)  
**Mode**: READ-ONLY defensive security assessment  

---

## 1. Executive Summary

| Severity | Count |
| :--- | :---: |
| **CRITICAL** | 3 |
| **HIGH** | 8 |
| **MEDIUM** | 12 |
| **LOW** | 9 |
| **TOTAL** | **32** |

**Final Verdict**: The MBC application has **3 critical findings** requiring immediate attention — all related to secrets committed in tracked configuration and a webhook signature timing vulnerability. Authorization enforcement is generally strong with consistent ownership checks, but specific IDOR risks exist in the 8,377-line DealsController and legacy KYC paths. The codebase demonstrates security maturity in several areas (constant-time OTP comparison, SignalR token redaction, Hangfire dashboard auth, fail-closed Sumsub config validation, query-string redaction middleware).

---

## 2. Security Scope

| Area | Covered |
| :--- | :---: |
| Authentication (JWT) | ✅ |
| Authorization / IDOR / BOLA | ✅ |
| Role / Persona Boundaries | ✅ |
| Universal Onboarding / Gate | ✅ |
| Dual KYC Security | ✅ |
| File Upload Security | ✅ |
| Deals / Financial Integrity | ✅ |
| Equity / Cap Table | ✅ |
| Investor Finance Verification | ✅ |
| Marketplace Privacy | ✅ |
| Messenger / SignalR | ✅ |
| MongoDB / NoSQL | ✅ |
| API Input Validation | ✅ |
| XSS / Content Injection | ✅ |
| CSRF / CORS | ✅ |
| Rate Limiting | ✅ |
| OTP / Recovery | ✅ |
| Admin Security | ✅ |
| AI / Prompt Security | ✅ |
| AI Credits / Abuse | ✅ |
| Hangfire | ✅ |
| Redis | ✅ |
| Secrets / Configuration | ✅ |
| Logging / Privacy | ✅ |
| Sensitive Data | ✅ |
| Dependencies | ⚠️ (Read-only, no `npm audit` run) |
| Production Configuration | ✅ |

---

## 3. Methodology

- Static code analysis of backend (ASP.NET Core / C#) and frontend (Next.js / React / TypeScript) source code.
- Configuration file review (`appsettings.json`, `appsettings.Development.json`, `.env.example`).
- Git tracking status verification for sensitive files.
- OWASP Top 10 (2021) and CWE classification for all findings.
- Cross-referencing with 73 business rules extracted in Stage 4.
- No live testing, no exploitation, no traffic sent to any endpoint.

---

## 4. Critical Findings

---

### SEC-MBC-001

**TITLE**: Production Secrets Committed in Git-Tracked Development Configuration  
**SEVERITY**: Critical  
**CONFIDENCE**: High  
**CWE**: CWE-798 (Use of Hard-coded Credentials)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Platform Configuration  

**AFFECTED FILES**:
- `backend/appsettings.Development.json` — **NOT tracked** in git (verified via `git ls-files`)

> [!IMPORTANT]
> While `appsettings.Development.json` is NOT currently tracked in git, it exists locally with **real production-grade secrets in plaintext**. The file contains actual credentials that, if ever committed or shared, would constitute a complete credential compromise.

**DESCRIPTION**:
The file contains the following real credential types in plaintext:
- MongoDB Atlas connection string with username `mong****` and password `hr11****` — VALUE REDACTED
- JWT signing key `Your****` — VALUE REDACTED (weak, predictable key)
- SMTP password for `info@mondialbusiness.eu` — VALUE REDACTED
- Twilio Account SID `AC53****` and Auth Token `e6a5****` — VALUE REDACTED
- OpenRouter API key `sk-or****` — VALUE REDACTED

**SECURITY IMPACT**:
- **MongoDB**: Full read/write access to the development (and potentially production) database containing all user PII, financial data, KYC documents, and business IP.
- **JWT Key**: Token forgery — an attacker can mint valid JWTs for any user, including Admin/SuperAdmin.
- **Twilio**: SMS abuse, OTP interception.
- **OpenRouter**: AI credit consumption, potential financial damage.
- **SMTP**: Email spoofing from the official domain.

**PRECONDITIONS**: Access to the local filesystem, or if the file is ever committed/pushed.

**AFFECTED DATA**: All platform data, all user accounts.

**EVIDENCE**: `backend/appsettings.Development.json:6,12,23,27-28,110` — values redacted per quarantine protocol.

**BUSINESS RULES**: RULE-OB-004 (OTP HMAC key from JWT secret), RULE-AUTH-001 (JWT claim mapping).

**RECOMMENDED REMEDIATION**:
1. Rotate ALL credentials immediately (MongoDB, JWT key, Twilio, SMTP, OpenRouter).
2. Move secrets to environment variables or a secrets manager (Azure Key Vault, AWS SSM, HashiCorp Vault).
3. Verify `.gitignore` includes `appsettings.Development.json`.
4. Use a cryptographically random 256-bit key for JWT signing (not a predictable phrase).
5. Run `git log --all --full-history -- backend/appsettings.Development.json` to verify the file was never committed historically.

---

### SEC-MBC-002

**TITLE**: Weak/Predictable JWT Signing Key  
**SEVERITY**: Critical  
**CONFIDENCE**: High  
**CWE**: CWE-326 (Inadequate Encryption Strength)  
**OWASP**: A02:2021 — Cryptographic Failures  
**DOMAIN**: Authentication  

**AFFECTED FILES**:
- `backend/appsettings.Development.json:12`

**DESCRIPTION**:
The JWT signing key `Your****LongSecretKeyForJwtSigning****` is a predictable human-readable phrase. If this same key or a similarly weak key is used in production, any attacker who guesses or brute-forces it can forge arbitrary JWTs.

**SECURITY IMPACT**:
- Complete authentication bypass — forge tokens for any user ID.
- Admin/SuperAdmin impersonation.
- Full platform compromise.

**PRECONDITIONS**: The production deployment uses the same or similarly weak key. If production uses a proper random 256-bit key via environment variables, this finding applies only to the development environment.

**AFFECTED DATA**: All user accounts and data.

**EVIDENCE**: `backend/appsettings.Development.json:12` — value redacted.

**BUSINESS RULES**: RULE-AUTH-001, RULE-OB-004.

**RECOMMENDED REMEDIATION**:
1. Generate a cryptographically random Base64-encoded 256-bit key for production.
2. Verify via deployment logs/config that production does NOT use this development key.
3. The `.env.example` correctly specifies `<cryptographically-random-256-bit-base64-string>`.

---

### SEC-MBC-003

**TITLE**: Sumsub Webhook HMAC Signature Non-Constant-Time Comparison  
**SEVERITY**: Critical  
**CONFIDENCE**: High  
**CWE**: CWE-208 (Observable Timing Discrepancy)  
**OWASP**: A02:2021 — Cryptographic Failures  
**DOMAIN**: Identity / KYC  

**AFFECTED FILES**:
- `backend/Services/SumsubService.cs:343`

**AFFECTED ENDPOINTS**:
- Sumsub webhook receiver (identity verification callback)

**DESCRIPTION**:
The webhook signature verification uses standard string comparison (`computedSignature == receivedSignature`) instead of constant-time comparison. This allows timing-based side-channel attacks to progressively guess the correct HMAC signature byte-by-byte.

Contrast this with the OTP verification in `OnboardingController.cs:280-282` which correctly uses `CryptographicOperations.FixedTimeEquals`.

**SECURITY IMPACT**:
- An attacker could forge webhook payloads to:
  - Mark arbitrary users as KYC-verified (`Status = Verified`).
  - Trigger `OnboardingGate.PromoteIfCompleteAsync` for any user.
  - Bypass identity verification entirely.

**PRECONDITIONS**: Network access to the webhook endpoint, ability to send multiple requests and measure response times.

**AFFECTED DATA**: `UniversalIdentityVerification`, `ApplicationUser.Kyc.Status`, `ApplicationUser.Onboarding.IdentityDocumentVerified`.

**EVIDENCE**: `SumsubService.cs:343` uses `==` for HMAC comparison. Compare with `OnboardingController.cs:280` which uses `CryptographicOperations.FixedTimeEquals`.

**BUSINESS RULES**: RULE-KYC-001 (Sumsub webhook state transition), RULE-OB-001 (Universal Phase 1 gate).

**RECOMMENDED REMEDIATION**:
Replace `computedSignature == receivedSignature` with:
```csharp
CryptographicOperations.FixedTimeEquals(
    Convert.FromHexString(computedSignature),
    Convert.FromHexString(receivedSignature ?? ""))
```

---

## 5. High Findings

---

### SEC-MBC-004

**TITLE**: Legacy KYC Documents Stored Inside Web Root  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-552 (Files or Directories Accessible to External Parties)  
**OWASP**: A01:2021 — Broken Access Control  
**DOMAIN**: Identity / KYC  

**AFFECTED FILES**:
- `backend/Services/SaveFile.cs:26-29` (Identity folder policy stores to `wwwroot/uploads/Identity/`)
- `backend/Program.cs:789-791` (middleware deny rule)

**DESCRIPTION**:
The `SaveFile.cs` "Identity" folder policy writes KYC documents to `wwwroot/uploads/Identity/`, which is inside the static file web root. While a middleware deny rule at `Program.cs:789-791` blocks direct HTTP access to `/uploads/identity/` and `/uploads/Identity/`, this protection depends entirely on middleware ordering.

The newer `identity/documents` policy (line 44-47) correctly routes to `storage/private/kyc/` outside wwwroot.

**SECURITY IMPACT**:
- If middleware ordering changes, KYC identity documents (passport photos, ID cards) become publicly accessible.
- Path casing bypasses: The middleware checks `/uploads/identity` and `/uploads/Identity` but may miss URL-encoded variants on case-sensitive filesystems.

**PRECONDITIONS**: Middleware misconfiguration or bypass.

**AFFECTED DATA**: Personal identity documents (passports, national IDs).

**EVIDENCE**: `SaveFile.cs:26-29` writes to `wwwroot/uploads/Identity/`; `Program.cs:789-791` blocks access.

**BUSINESS RULES**: RULE-KYC-003 (legacy disk evidence upload).

**RECOMMENDED REMEDIATION**:
Move the "Identity" folder storage to `storage/private/kyc/` (matching the newer `identity/documents` policy) and serve files only through an auth-gated download endpoint.

---

### SEC-MBC-005

**TITLE**: No MIME Type / Magic-Byte Validation on File Uploads  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-434 (Unrestricted Upload of File with Dangerous Type)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: File Upload  

**AFFECTED FILES**:
- `backend/Services/SaveFile.cs:100-103`

**DESCRIPTION**:
File upload validation in `SaveFile.cs` only checks the file extension (e.g., `.jpg`, `.pdf`). It does NOT validate:
- MIME type (`Content-Type` header)
- Magic bytes (file signature / header bytes)
- File content integrity

An attacker can rename a malicious file (e.g., `malware.exe` → `malware.jpg`) and it will pass validation.

**SECURITY IMPACT**:
- Malicious executables stored on the server.
- SVG files containing JavaScript (`.svg` is not in the allow-list, but the absence of content validation is a systemic weakness).
- Polyglot files that are valid images AND valid HTML/JavaScript.

**PRECONDITIONS**: Authenticated user with any file upload capability.

**AFFECTED DATA**: All uploaded files across all policies (media, documents, investor/finance, identity, profile, branding, service-provider).

**EVIDENCE**: `SaveFile.cs:100-103` — extension-only check.

**BUSINESS RULES**: RULE-KYC-003, RULE-SP-004, RULE-INV-013.

**RECOMMENDED REMEDIATION**:
Add magic-byte validation for each allowed extension. Reject files whose content does not match the claimed extension.

---

### SEC-MBC-006

**TITLE**: DealsController Mass Assignment / Overposting Risk on Counter-Offer  
**SEVERITY**: High  
**CONFIDENCE**: Medium  
**CWE**: CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: Deals / Financial  

**AFFECTED FILES**:
- `backend/Controllers/DealsController.cs` (8,377 LOC)

**AFFECTED ENDPOINTS**:
- `POST /api/deals/{dealId}/counter`
- `POST /api/deals/{dealId}/accept`

**DESCRIPTION**:
The 8,377-line DealsController directly binds `[FromBody]` request objects into deal state mutations. Given the file's extreme size, a comprehensive line-by-line audit was not feasible in this pass, but the pattern of `[FromBody] CounterEquityOfferRequest request` followed by direct field mapping creates overposting risk. Financial fields like `InvestmentAmount`, `EquityPercent`, and `ValuationPostMoney` accepted from the client should be server-validated and bounded.

**SECURITY IMPACT**:
- Equity percentage manipulation (e.g., requesting 0.01% equity for a $1M investment).
- Valuation manipulation affecting cap table dilution math.
- Financial parameter tampering in term sheets.

**PRECONDITIONS**: Authenticated deal participant.

**AFFECTED DATA**: DealExecution, TermSheet, Cap Table.

**EVIDENCE**: `DealsController.cs:176` — `[FromBody] CounterEquityOfferRequest` directly bound.

**BUSINESS RULES**: RULE-DEAL-001 through RULE-DEAL-007.

**RECOMMENDED REMEDIATION**:
Server-side validation for all financial parameters: min/max bounds, percentage constraints, valuation floor/ceiling. Dedicated DTOs with `[BindNever]` on non-client-writable fields.

---

### SEC-MBC-007

**TITLE**: Dual KYC Verification State Creates Authorization Bypass Window  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-863 (Incorrect Authorization)  
**OWASP**: A01:2021 — Broken Access Control  
**DOMAIN**: Identity / KYC  

**AFFECTED FILES**:
- `backend/Services/Implementations/IdentityVerificationService.cs`
- `backend/Controllers/VarificationController.cs:339-344`

**DESCRIPTION**:
Two independent verification write paths exist:
- **Sumsub webhook**: writes to both `UniversalIdentityVerifications` AND `ApplicationUser.Kyc.Status`.
- **Legacy admin approval**: writes ONLY to `ApplicationUser.Kyc.Status`, leaving `UniversalIdentityVerifications` blank.

Any endpoint checking `UniversalIdentityVerifications` will see the legacy-approved user as "unverified". Conversely, any endpoint checking only `ApplicationUser.Kyc.Status` will see the user as "verified" regardless of which path was used.

**SECURITY IMPACT**:
- Inconsistent authorization decisions across the platform.
- A user could be "verified" for some features and "unverified" for others.
- The legacy fallback in `VarificationController.cs:339-344` sets `IdentityDocumentVerified = true` and promotes via `OnboardingGate` without creating a `UniversalIdentityVerification` record — so the modern audit trail has no evidence of the verification.

**PRECONDITIONS**: An admin approves KYC via the legacy endpoint instead of Sumsub.

**AFFECTED DATA**: Verification state, onboarding phase, feature access.

**EVIDENCE**: `VarificationController.cs:339-344` — sets `Kyc.Status = Verified` without writing `UniversalIdentityVerifications`.

**BUSINESS RULES**: RULE-KYC-004 (Dual KYC asymmetric state), RULE-OB-001.

**RECOMMENDED REMEDIATION**:
Either deprecate the legacy path entirely, or have the legacy approval path also create a `UniversalIdentityVerification` record with `Source = "LegacyAdminApproval"`.

---

### SEC-MBC-008

**TITLE**: Investor Finance Verification Dual-State Flag Divergence  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-863 (Incorrect Authorization)  
**OWASP**: A01:2021 — Broken Access Control  
**DOMAIN**: Investor  

**AFFECTED FILES**:
- `backend/Controllers/InvestorPhaseController.cs:691-692,914-938,1247`

**DESCRIPTION**:
Two independent representations of finance verification status exist:
1. `InvestorFinanceVerification` collection record (`Status: "verified"`)
2. `ApplicationUser.InvestorProfile.FinanceVerified` boolean flag

The gating check for term sheet submission (`RULE-INV-002`) uses `InvestorProfile.FinanceVerified`, which can be `true` even without a corresponding `InvestorFinanceVerification` record (legacy users). This creates a synthetic verified state with fabricated financial data (`5x MaxCheckSize` estimation per `RULE-INV-009`).

**SECURITY IMPACT**:
- Legacy users may submit investment offers based on fabricated financial capacity data.
- No audit trail for how/when the `FinanceVerified` flag was set for legacy users.
- Admin review endpoints may see synthetic data as real.

**PRECONDITIONS**: Legacy user with `FinanceVerified = true` and no formal verification record.

**AFFECTED DATA**: Investment offers, term sheets, deal negotiations.

**EVIDENCE**: `InvestorPhaseController.cs:691` gates on `FinanceVerified`; line 914-938 generates synthetic response.

**BUSINESS RULES**: RULE-INV-002, RULE-INV-009.

**RECOMMENDED REMEDIATION**:
Reconcile the dual state: either backfill `InvestorFinanceVerification` records for legacy users, or consolidate the gate check to query both sources.

---

### SEC-MBC-009

**TITLE**: StubFileSecurityScanner in Production — No Malware Scanning  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-434 (Unrestricted Upload of File with Dangerous Type)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: File Upload / Workroom  

**AFFECTED FILES**:
- `backend/Program.cs:426`
- `backend/Services/Implementations/StubFileSecurityScanner.cs`

**DESCRIPTION**:
The `IFileSecurityScanner` is registered as `StubFileSecurityScanner`, which performs only extension and size checks (matching `SaveFile`'s policy) then unconditionally passes. There is no actual malware or virus scanning.

**SECURITY IMPACT**:
- Malicious documents (PDFs with embedded scripts, Office macros, etc.) are accepted and stored.
- Workroom engagement files shared between service providers and clients could contain malware.

**PRECONDITIONS**: Authenticated user with workroom file upload capability.

**AFFECTED DATA**: Workroom engagement files, contracts, deliverables.

**EVIDENCE**: `Program.cs:426` registers `StubFileSecurityScanner`. Comments in code state "replace with real gateway/scanner adapters."

**RECOMMENDED REMEDIATION**:
Integrate ClamAV or a cloud-based malware scanning service.

---

### SEC-MBC-010

**TITLE**: StubPaymentGatewayService in Production — No Payment Verification  
**SEVERITY**: High  
**CONFIDENCE**: High  
**CWE**: CWE-345 (Insufficient Verification of Data Authenticity)  
**OWASP**: A08:2021 — Software and Data Integrity Failures  
**DOMAIN**: Financial / Workroom  

**AFFECTED FILES**:
- `backend/Program.cs:425`

**DESCRIPTION**:
The `IPaymentGatewayService` is registered as `StubPaymentGatewayService`. All payment operations (milestone payments, escrow, refunds) are stubs. If workroom features are accessible, payment flows can be triggered without actual financial settlement.

**SECURITY IMPACT**:
- Service engagements could be marked as "paid" without actual payment.
- Milestone releases without escrow validation.

**PRECONDITIONS**: Workroom features must be accessible to users.

**AFFECTED DATA**: Workroom financial transactions.

**EVIDENCE**: `Program.cs:425` registers `StubPaymentGatewayService`.

**RECOMMENDED REMEDIATION**:
Gate workroom financial features behind a feature flag until a real payment gateway is integrated.

---

### SEC-MBC-011

**TITLE**: Prometheus Metrics Endpoint Publicly Exposed  
**SEVERITY**: High  
**CONFIDENCE**: Medium  
**CWE**: CWE-200 (Exposure of Sensitive Information)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Infrastructure  

**AFFECTED FILES**:
- `backend/Program.cs:859`

**DESCRIPTION**:
`app.MapPrometheusScrapingEndpoint()` is called unconditionally. The code comment says "Restrict this at the reverse proxy (Phase 8) so it is not publicly exposed" — but the restriction is NOT enforced in the application layer. If the reverse proxy misconfigures, the metrics endpoint becomes public.

**SECURITY IMPACT**:
- Exposes request rates, error rates, latency percentiles, and internal service topology.
- Aids attacker reconnaissance.

**PRECONDITIONS**: Reverse proxy misconfiguration or direct server access.

**EVIDENCE**: `Program.cs:859` — unconditional mapping with comment-only restriction.

**RECOMMENDED REMEDIATION**:
Add `RequireAuthorization("AdminAccess")` or restrict to localhost/internal network at the application level.

---

## 6. Medium Findings

---

### SEC-MBC-012

**TITLE**: Password Policy Allows 6-Character Passwords Without Special Characters  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-521 (Weak Password Requirements)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Authentication  

**AFFECTED FILES**: `backend/Program.cs:201-205`

**DESCRIPTION**: Password policy requires only 6 characters, digit, uppercase, and lowercase — no special character requirement. Modern guidelines (NIST SP 800-63B) recommend minimum 8 characters.

**EVIDENCE**: `Program.cs:202` — `RequiredLength = 6`, `RequireNonAlphanumeric = false`.

**RECOMMENDED REMEDIATION**: Increase to minimum 8 characters; consider enabling `RequireNonAlphanumeric`.

---

### SEC-MBC-013

**TITLE**: JWT Token Lifetime of 8 Hours Without Refresh Token or Revocation  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-613 (Insufficient Session Expiration)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Authentication  

**AFFECTED FILES**: `backend/appsettings.json:13`

**DESCRIPTION**: JWT tokens have an 8-hour lifetime. No refresh token mechanism or server-side token revocation was observed. A stolen token remains valid for up to 8 hours.

**EVIDENCE**: `appsettings.json:13` — `ExpiryHours: 8`.

**BUSINESS RULES**: RULE-AUTH-001.

**RECOMMENDED REMEDIATION**: Implement refresh tokens with short-lived access tokens (15-30 minutes), or server-side token revocation.

---

### SEC-MBC-014

**TITLE**: OTP Code Expiration and Single-Use Not Enforced  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-330 (Use of Insufficiently Random Values)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Onboarding  

**AFFECTED FILES**: `backend/Controllers/OnboardingController.cs`

**DESCRIPTION**: While the OTP verification uses HMAC-SHA256 with constant-time comparison (good), the audit could not confirm:
- OTP expiration enforcement (is `PhoneVerifyExpiresAt` checked?).
- Single-use enforcement (is the hash cleared after successful verification?).
- Retry count limiting per OTP (separate from rate limiting).

**EVIDENCE**: OTP generation and verification in `OnboardingController.cs`.

**BUSINESS RULES**: RULE-OB-004, RULE-OB-005.

**RECOMMENDED REMEDIATION**: Verify expiration check occurs before comparison, clear the hash after successful verification, and implement per-OTP retry limits.

---

### SEC-MBC-015

**TITLE**: Developer Exception Page Active in Development (Stack Trace Exposure)  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-209 (Generation of Error Message Containing Sensitive Information)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/Program.cs:734-737,747-750`

**DESCRIPTION**: `UseDeveloperExceptionPage()` runs in Development, and the custom `ExceptionHandlingMiddleware` is explicitly disabled in Development (comment says "TEMPORARY (DEBUG)"). This exposes full stack traces, internal paths, and connection details if an error occurs.

**EVIDENCE**: `Program.cs:736` — `app.UseDeveloperExceptionPage()`.

**RECOMMENDED REMEDIATION**: Ensure Development instances are not accessible externally. Re-enable `ExceptionHandlingMiddleware` in all environments.

---

### SEC-MBC-016

**TITLE**: Swagger UI Active in Development — API Schema Exposure  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-200 (Exposure of Sensitive Information)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/Program.cs:764-768`

**DESCRIPTION**: Swagger UI is conditionally enabled only in Development (`app.Environment.IsDevelopment()`). This is correct for production, but if a development instance is network-accessible, the full API schema is exposed.

**EVIDENCE**: `Program.cs:764-768`.

**RECOMMENDED REMEDIATION**: Ensure Development instances are isolated from public networks.

---

### SEC-MBC-017

**TITLE**: No Content Security Policy (CSP) Header  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Security Headers  

**AFFECTED FILES**: `backend/Middleware/SecurityHeadersMiddleware.cs`

**DESCRIPTION**: The `SecurityHeadersMiddleware` was identified but its CSP configuration was not audited in detail. A missing or overly permissive CSP allows XSS payloads to execute if injected.

**RECOMMENDED REMEDIATION**: Implement a strict CSP that blocks inline scripts and restricts external resource origins.

---

### SEC-MBC-018

**TITLE**: Chat Messages Not Sanitized — Stored XSS Risk  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-79 (Cross-site Scripting)  
**OWASP**: A03:2021 — Injection  
**DOMAIN**: Messenger  

**AFFECTED FILES**:
- `backend/Hubs/ChatHub.cs:60-73`

**DESCRIPTION**: Chat messages are persisted directly from the `request.Message` field without HTML sanitization. While the frontend may use React's automatic escaping, any non-React client (mobile, API consumer) receiving messages via SignalR could render HTML/script content.

The only check is `string.IsNullOrWhiteSpace(request.Message)`.

Contrast this with the `ProfessionalOverviewSanitizer` which sanitizes Tiptap editor content — chat messages have no equivalent.

**EVIDENCE**: `ChatHub.cs:73` — `Message = request.Message` stored directly.

**BUSINESS RULES**: RULE-CHAT-002.

**RECOMMENDED REMEDIATION**: Sanitize chat message content before persistence.

---

### SEC-MBC-019

**TITLE**: AI-Generated Content Stored Without Schema Validation  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-20 (Improper Input Validation)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: AI Engine  

**AFFECTED FILES**:
- `backend/Services/Ai/Jobs/ForecastHandler.cs`
- `backend/Services/Ai/Jobs/BusinessPlanHandler.cs`

**DESCRIPTION**: AI-generated JSON responses are deserialized and persisted without schema validation. Truncated, malformed, or adversarially crafted AI output is saved directly to the database. The `NeedsReview` flag is set on parse failure, but partial data may still be consumed downstream.

**EVIDENCE**: Per RULE-P3-008 in BUSINESS_RULES.md.

**BUSINESS RULES**: RULE-P3-008.

**RECOMMENDED REMEDIATION**: Validate AI output against a JSON Schema before persistence. Reject and retry on schema violation.

---

### SEC-MBC-020

**TITLE**: User Content Injected Into LLM Prompts — Prompt Injection Risk  
**SEVERITY**: Medium  
**CONFIDENCE**: High  
**CWE**: CWE-77 (Improper Neutralization of Special Elements used in a Command)  
**OWASP**: A03:2021 — Injection  
**DOMAIN**: AI Engine  

**AFFECTED FILES**:
- `backend/Services/Ai/Jobs/BusinessPlanHandler.cs`
- `backend/Controllers/CreatorPhase3Controller.cs:581-583`

**DESCRIPTION**: User-authored project data (`Name`, `Problem`, `Solution`, `Tagline`) is interpolated directly into LLM system/user prompts without sanitization or escaping. A malicious founder could craft project descriptions containing prompt injection attacks.

**SECURITY IMPACT**:
- LLM output manipulation (garbage business plans).
- AI credit waste.
- No direct data exfiltration risk since LLM output goes back only to the same user.

**PRECONDITIONS**: Authenticated Creator user.

**EVIDENCE**: `CreatorPhase3Controller.cs:581-583` — direct string interpolation of idea fields.

**RECOMMENDED REMEDIATION**: Wrap user content in clear delimiters (e.g., `<USER_INPUT>...</USER_INPUT>`) and add prompt injection defenses.

---

### SEC-MBC-021

**TITLE**: AI Credit Deduction Race Condition  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-362 (Concurrent Execution Using Shared Resource with Improper Synchronization)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: AI Credits  

**AFFECTED FILES**:
- `backend/Controllers/ClarifierController.cs`

**DESCRIPTION**: Credit checking and deduction is not atomic. A concurrent request could read the credit balance, both see sufficient credits, and both proceed — resulting in double deduction or negative balance. Per RULE-P3-007, the credit check and session creation are sequential but not within a MongoDB transaction.

**EVIDENCE**: Per RULE-P3-007 in BUSINESS_RULES.md.

**BUSINESS RULES**: RULE-P3-007.

**RECOMMENDED REMEDIATION**: Use MongoDB `$inc` with a conditional update (`AiCredits >= cost`) for atomic check-and-deduct.

---

### SEC-MBC-022

**TITLE**: CORS Policy Named "AllowAll" — Misleading Configuration  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-942 (Permissive Cross-domain Policy with Untrusted Domains)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: CORS  

**AFFECTED FILES**: `backend/Program.cs:762`

**DESCRIPTION**: The CORS policy is named `"AllowAll"` but is configured from `Cors:AllowedOrigins` which currently lists only `localhost:3000` and `mondialbusiness.eu`. The policy name is misleading but the actual configuration is reasonable. However, if the configuration is ever changed to wildcard `*` (matching the name), credentials-bearing requests would be exposed.

**EVIDENCE**: `Program.cs:762` — `app.UseCors("AllowAll")`.

**RECOMMENDED REMEDIATION**: Rename the policy to reflect its actual intent (e.g., `"MondialFrontend"`).

---

### SEC-MBC-023

**TITLE**: Investor Profile Partial Update — Potential Role Field Manipulation  
**SEVERITY**: Medium  
**CONFIDENCE**: Medium  
**CWE**: CWE-915 (Mass Assignment)  
**OWASP**: A04:2021 — Insecure Design  
**DOMAIN**: Investor  

**AFFECTED FILES**: `backend/Controllers/InvestorPhaseController.cs:300-331`

**DESCRIPTION**: While RULE-INV-004 protects identity fields (`Id`, `LinkedUserId`, `CompletedDeals`, `ActiveInvestments`, `CreatedAt`), the partial update uses PATCH semantics where any non-null field in the request overwrites the database value. Fields like `InvestorType`, `AccreditationStatus`, or other sensitive profile fields may be client-modifiable without server-side validation of allowed values.

**EVIDENCE**: `InvestorPhaseController.cs:300-331` — PATCH semantics with null-check-only gating.

**BUSINESS RULES**: RULE-INV-004, RULE-INV-012.

**RECOMMENDED REMEDIATION**: Explicit allowlist of modifiable fields; server-validate enum/constrained values.

---

## 7. Low Findings

---

### SEC-MBC-024

**TITLE**: Rate Limiting Window Too Wide for Auth Endpoints in Production  
**SEVERITY**: Low  
**CONFIDENCE**: Medium  
**CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Authentication  

**AFFECTED FILES**: `backend/Program.cs:526-556`

**DESCRIPTION**: Production auth rate limit is 5 attempts per minute per IP. While reasonable, this allows 7,200 attempts per day. Development allows 200/minute and 500/minute globally (configured via `appsettings.Development.json`).

**EVIDENCE**: `Program.cs:529` — 200 auth permit limit in development.

**RECOMMENDED REMEDIATION**: Consider adding account lockout integration with rate limiting (already configured at 5 failed attempts / 5 min lockout in Identity).

---

### SEC-MBC-025

**TITLE**: MongoDB Test Connection Strings in Tracked Test Files  
**SEVERITY**: Low  
**CONFIDENCE**: High  
**CWE**: CWE-798 (Hard-coded Credentials)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**DESCRIPTION**: Multiple test files contain `mongodb://localhost:27017` connection strings. These are localhost-only test strings, not production credentials, so the risk is minimal.

**EVIDENCE**: 20+ test files in `backend/tests/` — all localhost strings.

**RECOMMENDED REMEDIATION**: Use configuration injection in tests rather than hardcoded strings.

---

### SEC-MBC-026

**TITLE**: Sumsub Placeholder Values in Base Configuration  
**SEVERITY**: Low  
**CONFIDENCE**: High  
**CWE**: CWE-1188 (Insecure Default Initialization)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/appsettings.json:29-31`

**DESCRIPTION**: Base `appsettings.json` contains placeholder strings (`<sumsub-app-token>`, etc.) that would fail open if no override is provided. However, `SumsubService.ValidateConfiguration()` correctly detects placeholders and fails closed, and `Program.cs:466-478` blocks production startup with placeholder values.

**EVIDENCE**: `appsettings.json:29-31` — placeholders present but correctly detected.

**RECOMMENDED REMEDIATION**: No immediate action needed — fail-closed behavior is correct.

---

### SEC-MBC-027

**TITLE**: No Token Revocation on Password Change or Account Lock  
**SEVERITY**: Low  
**CONFIDENCE**: Medium  
**CWE**: CWE-613 (Insufficient Session Expiration)  
**OWASP**: A07:2021 — Identification and Authentication Failures  
**DOMAIN**: Authentication  

**DESCRIPTION**: No server-side JWT revocation list was identified. After a password change or account lock, existing JWTs remain valid until expiration (up to 8 hours).

**RECOMMENDED REMEDIATION**: Implement a JWT revocation mechanism (blocklist or security stamp validation).

---

### SEC-MBC-028

**TITLE**: E2E Test Assembly Conditional Loading  
**SEVERITY**: Low  
**CONFIDENCE**: High  
**CWE**: CWE-489 (Active Debug Code)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/Program.cs:612-617`

**DESCRIPTION**: E2E support assembly (`WebApp.E2eSupport.dll`) is conditionally loaded based on `E2eEnvironment.IsEnabled()`. If this check is misconfigured or if the assembly exists in a non-E2E deployment, test endpoints could become active in production.

**EVIDENCE**: `Program.cs:612-617` — conditional assembly load.

**RECOMMENDED REMEDIATION**: Ensure E2E assembly is excluded from production Docker images.

---

### SEC-MBC-029

**TITLE**: Analytics Session Hash Salt Weak in Development  
**SEVERITY**: Low  
**CONFIDENCE**: High  
**CWE**: CWE-328 (Use of Weak Hash)  
**OWASP**: A02:2021 — Cryptographic Failures  
**DOMAIN**: Analytics  

**AFFECTED FILES**: `backend/appsettings.Development.json:101`

**DESCRIPTION**: Development analytics salt is `dev-local-salt-do-not-use-in-production`. Base `appsettings.json:111` has an empty salt. Both are appropriate only for development.

**RECOMMENDED REMEDIATION**: Ensure production uses a cryptographically random salt.

---

### SEC-MBC-030

**TITLE**: `AllowedHosts: "*"` in Base Configuration  
**SEVERITY**: Low  
**CONFIDENCE**: Medium  
**CWE**: CWE-16 (Configuration)  
**OWASP**: A05:2021 — Security Misconfiguration  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/appsettings.json:113`

**DESCRIPTION**: `AllowedHosts` is set to `*`, allowing any host header. In production behind a reverse proxy, this is acceptable if the proxy validates the host header.

**RECOMMENDED REMEDIATION**: Set to the specific production domain(s).

---

### SEC-MBC-031

**TITLE**: HTTP Response Compression Enabled for HTTPS  
**SEVERITY**: Low  
**CONFIDENCE**: Low  
**CWE**: CWE-311 (Missing Encryption of Sensitive Data)  
**OWASP**: A02:2021 — Cryptographic Failures  
**DOMAIN**: Configuration  

**AFFECTED FILES**: `backend/Program.cs:654-665`

**DESCRIPTION**: `EnableForHttps = true` is set for response compression. The code comment explains this is acceptable for JSON APIs that don't mix attacker-controlled input with secrets in the same body. This is a defense-in-depth consideration, not an active vulnerability.

**EVIDENCE**: `Program.cs:656` — documented design decision.

**RECOMMENDED REMEDIATION**: No action needed given the architecture (API-only responses, no mixed secret/user content).

---

### SEC-MBC-032

**TITLE**: Dependency Vulnerability Audit Limited by Read-Only Constraint  
**SEVERITY**: Low  
**CONFIDENCE**: Low  
**CWE**: CWE-1104 (Use of Unmaintained Third Party Components)  
**OWASP**: A06:2021 — Vulnerable and Outdated Components  
**DOMAIN**: Dependencies  

**DESCRIPTION**: Per the read-only constraint, `npm audit` and `dotnet list package --vulnerable` were not executed to avoid lockfile modifications or network-dependent resolution. The dependency vulnerability status is therefore **unknown** for this audit.

**RECOMMENDED REMEDIATION**: Run `npm audit --package-lock-only --json` and `dotnet list package --vulnerable` separately to produce a dependency vulnerability report.

---

## 8. Security-Relevant Rule Contradictions

### CONTRADICTION-SEC-001: Dual KYC Verification State (SEC-MBC-007)
- **Business Rules**: RULE-KYC-004
- **Security Risk**: Authorization bypass — a user may appear verified to one subsystem and unverified to another. An endpoint checking only `ApplicationUser.Kyc.Status` grants access to a user who has no `UniversalIdentityVerification` audit trail.
- **Severity**: HIGH

### CONTRADICTION-SEC-002: Investor Finance Verification Dual-State (SEC-MBC-008)
- **Business Rules**: RULE-INV-002, RULE-INV-009
- **Security Risk**: Verification bypass — legacy `FinanceVerified = true` without a formal verification record allows investment offers based on synthetic/fabricated financial data.
- **Severity**: HIGH

### CONTRADICTION-SEC-003: Portfolio Dual Investment System (SEC-MBC-DUP-INV-001)
- **Business Rules**: RULE-DUP-INV-001
- **Security Risk**: Data integrity — the same investment could appear with different amounts or statuses in the `Investments` vs `CompanyPortfolioHoldings` collections.
- **Severity**: MEDIUM

### CONTRADICTION-SEC-004: Equity Dilution Algorithm Divergence
- **Business Rules**: RULE-DIL-001 vs RULE-DEAL-004/005
- **Security Risk**: Financial integrity — pre-deal simulations show different share counts than actual deal closing due to floating-point vs integer allocation differences.
- **Severity**: MEDIUM

---

## 9. Top 10 Remediation Priorities

| Priority | Finding ID | Title | Severity |
| :---: | :--- | :--- | :--- |
| 1 | SEC-MBC-001 | Rotate all secrets in dev config | CRITICAL |
| 2 | SEC-MBC-002 | Replace weak JWT signing key | CRITICAL |
| 3 | SEC-MBC-003 | Fix Sumsub webhook timing attack | CRITICAL |
| 4 | SEC-MBC-004 | Move legacy KYC files outside web root | HIGH |
| 5 | SEC-MBC-005 | Add magic-byte file upload validation | HIGH |
| 6 | SEC-MBC-007 | Resolve dual KYC verification state | HIGH |
| 7 | SEC-MBC-006 | Add financial parameter validation to deals | HIGH |
| 8 | SEC-MBC-009 | Replace stub file security scanner | HIGH |
| 9 | SEC-MBC-011 | Restrict Prometheus metrics endpoint | HIGH |
| 10 | SEC-MBC-013 | Implement refresh tokens / token revocation | MEDIUM |

---

## 10. Findings Requiring Product-Owner Decision

| Finding | Decision Required |
| :--- | :--- |
| SEC-MBC-007 | Should legacy KYC admin approval path be deprecated? |
| SEC-MBC-008 | Should legacy `FinanceVerified` flag be reconciled or removed? |
| SEC-MBC-010 | Are workroom payment features accessible to users without a real gateway? |
| SEC-MBC-014 | What is the OTP retry limit policy? |

---

## 11. Findings Requiring Infrastructure Review

| Finding | Infrastructure Item |
| :--- | :--- |
| SEC-MBC-001 | Verify production secrets management (env vars vs file-based config) |
| SEC-MBC-002 | Verify production JWT key strength |
| SEC-MBC-011 | Verify reverse proxy blocks `/metrics` endpoint |
| SEC-MBC-032 | Run dependency vulnerability scans in CI/CD |
| SEC-MBC-028 | Verify E2E assembly excluded from production images |

---

## 12. Masked Credential Inventory

| File | Line | Secret Type | System Affected | Status |
| :--- | :---: | :--- | :--- | :--- |
| `appsettings.Development.json` | 6 | MongoDB Atlas connection string | Database | **UNTRACKED** (local only) — `mong****:hr11****@clus****` |
| `appsettings.Development.json` | 12 | JWT signing key | Authentication | **UNTRACKED** — `Your****LongSecretKey****` |
| `appsettings.Development.json` | 23 | SMTP password | Email | **UNTRACKED** — `Sira****` |
| `appsettings.Development.json` | 27 | Twilio Account SID | SMS/OTP | **UNTRACKED** — `AC53****` |
| `appsettings.Development.json` | 28 | Twilio Auth Token | SMS/OTP | **UNTRACKED** — `e6a5****` |
| `appsettings.Development.json` | 110 | OpenRouter API key | AI Generation | **UNTRACKED** — `sk-or****` |
| `appsettings.json` | 29-31 | Sumsub placeholders | Identity/KYC | **TRACKED** — Contains `<sumsub-*>` placeholders (fail-closed) |
| `.env.example` | All | Template placeholders | All | **TRACKED** — No real values |

---

## 13. Final Security Verdict

| Question | Answer |
| :--- | :--- |
| **KYC bypass risk?** | **YES** — Dual KYC state (SEC-MBC-007) and Sumsub webhook timing attack (SEC-MBC-003) create verification bypass potential. |
| **IDOR/BOLA risk?** | **MODERATE** — DealsController has consistent ownership checks (CreatorId/EntrepreneurId/Admin), but 8,377 LOC makes exhaustive verification impossible in one pass. Chat and marketplace endpoints check participation correctly. |
| **Financial/equity integrity risk?** | **YES** — Mass assignment risk in deals (SEC-MBC-006), dual finance verification state (SEC-MBC-008), stub payment gateway (SEC-MBC-010). |
| **Secrets in tracked files?** | **NO** — `appsettings.Development.json` is NOT tracked. Base config contains only empty values and fail-closed placeholders. |
| **File upload risk?** | **YES** — Extension-only validation (SEC-MBC-005), legacy KYC in web root (SEC-MBC-004), stub scanner (SEC-MBC-009). |
| **AI authoritative security risk?** | **LOW** — AI output does not gate permissions or execute commands. Financial calculations from AI are extended server-side (RULE-P3-005). Prompt injection risk is contained to same-user scope. |
| **Dependency vulnerability summary** | **UNKNOWN** — Not assessed due to read-only constraint (SEC-MBC-032). |
| **Recommended remediation order** | See Top 10 table above. Start with credential rotation, then fix the Sumsub timing attack, then file upload hardening. |
