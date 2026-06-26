# Signup API Integration Extraction
**Date**: 2026-04-18  
**Source**: Old signup implementation (commit a096766) + current AuthContext + axios config  
**Status**: Analysis only — no code modifications

---

## 1. API CONTRACT EXTRACTION

### Endpoint
- **Method**: POST
- **Path**: `/auth/register`
- **Base URL**: `https://api.mondialbusiness.eu/api`
- **Full URL**: `https://api.mondialbusiness.eu/api/auth/register`

### Request Payload Structure
```typescript
type RegisterModel = {
  Name: string;        // Full name
  Email: string;       // Email address
  Password: string;    // Password (no format validation in old code)
  User: string;        // Role: "creator", "investor", etc.
};
```

### Request Example
```json
{
  "Name": "John Doe",
  "Email": "john@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

### Response Structure
```typescript
// Response from POST /auth/register
type RegisterResponse = {
  // Not explicitly typed in old code
  // Inferred: success/error object
  // Expected response after successful registration:
  // - Status 200/201: Registration successful
  // - Status 400+: Error object with message
};
```

### Response Handling
- **Success**: Registration completes, user can proceed (response status 200/201)
- **Error**: Response includes `response.data.message` (used as fallback error text)

---

## 2. VALIDATION LOGIC

### Email Validation
```
- HTML5 type="email" validation only
- Required field
- No custom regex or format rules in old signup
```

### Password Rules (OLD)
```
- No validation in old signup
- Plain text field, no strength requirements
- Confirm password NOT collected in old signup
```

### Role Validation
```
- Dropdown select only
- Valid values: "creator", "investor"
- Set as default "creator"
```

### Name/Full Name
```
- Plain text input
- Required field
- No length or format restrictions
```

### NEW Requirements (Current CredentialsStep)
```
✅ Email: valid email address
✅ Password: 8+ chars, uppercase + lowercase + number
✅ Confirm Password: must match password
```

**Migration Note**: New validation is STRICTER than old. Backend may need to accept both old + new password formats during transition period.

---

## 3. BUSINESS LOGIC FLOW

### Old Signup Flow (Single Page)
```
User visits /signup
  ↓
Fills form (Full Name, Email, Password, Role)
  ↓
Clicks "Sign Up"
  ↓
POST /auth/register with RegisterModel
  ↓
SUCCESS (200/201):
  └─ Role === "creator" → router.push("/my-profile")
  └─ Role !== "creator" → router.push("/investors")
  ↓
ERROR:
  └─ Display inline error message: response.data.message || "Registration failed"
```

### NEW Multi-Step Flow (Proposed)
```
User visits /signup/onboarding
  ↓
Step 1: Role Selection
  ├─ Select role (creator, entrepreneur, investor, service-provider)
  └─ Click "Initialize Account" → nextStep()
  ↓
Step 2: Credentials (NEW)
  ├─ Enter email
  ├─ Enter password (8+, uppercase, lowercase, number)
  ├─ Confirm password (must match)
  └─ Click "Create Account" → POST /auth/register + nextStep()
  ↓
Step 3: Verification (Identity Verification)
  ├─ Start identity verification process
  └─ Click "Start Verification" → nextStep()
  ↓
Step 4: Completion
  ├─ Show success message
  └─ Auto-redirect to /dashboard after 1500ms
```

### When to Call registerApi
```
Location: CredentialsStep.onSubmit() handler
Timing: After credentials form validation passes
Data: {
  Name: ???  // NOT COLLECTED IN CREDENTIALS STEP
  Email: credentials.email
  Password: credentials.password
  User: selectedRole (from flow state)
}
```

### ⚠️ ISSUE: Name Field Missing
**Old signup collected**: Full Name, Email, Password, Role
**New multi-step collects**: Email, Password (Role selected earlier)
**Missing**: Full Name

**Options**:
1. Add name field to CredentialsStep
2. Add separate name step
3. Backend auto-generates name from email
4. Leave name empty/null for now

---

## 4. AUTH SIDE EFFECTS

### Token Storage
```
Location: localStorage
Key: "token"
Format: Plain string (JWT or opaque token)
Set after: Successful login (not signup in old code)
```

### User Object Storage
```
Location: localStorage
Key: "user"
Format: JSON serialized object
Structure: {
  id: string;
  name: string;
  role: UserRole;  // One of: Admin, Creator, Investor, Entrepreneur, ServiceProvider, Advisor
}
```

### Session Setup in AuthContext
```typescript
// After login (from AuthContext.login):
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));
setUser(user);
setToken(token);
```

### ⚠️ SIGNUP vs LOGIN
- **Old signup**: Calls registerApi() but does NOT set token/user
- **Login**: Calls POST /auth/login, gets token/user, stores them
- **Implication**: After registration, does user auto-login or redirect to /login?

### Redirect Logic
```typescript
// Old signup redirects based on role:
if (role === "creator") {
  router.push("/my-profile");
} else {
  router.push("/investors");
}

// Current AuthContext (login) redirects based on role:
const roleRoutes: Record<UserRole, string> = {
  Admin: "/dashboard/admin",
  Creator: "/dashboard/creator",
  Investor: "/dashboard/investor",
  Entrepreneur: "/dashboard/entrepreneur",
  ServiceProvider: "/dashboard/serviceprovider",
  Advisor: "/dashboard/advisor",
};
router.push(roleRoutes[user.role]);
```

**Question**: Does /auth/register return a token? If not, need to redirect to /login after signup.

---

## 5. HTTP INTERCEPTOR & TOKEN INJECTION

### Request Interceptor
```typescript
// Runs before every request
config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
```
- Automatically adds token to all API requests
- Safe check: localStorage available (SSR-aware)

### Response Interceptor
- **401 Response**: Attempts token refresh via POST /auth/refresh-token
- **Refresh Fails**: Clears localStorage, redirects to /login?reason=session_expired
- **Other Errors**: Passed through

### Implication for Signup
- Signup request likely doesn't need Authorization header (user not authenticated yet)
- If signup response returns token, it's automatically available for next request

---

## 6. DEPENDENCIES & SERVICES

### Hooks
- `useRouter()` from "next/navigation" — for redirects
- `useAuth()` from "@/context/AuthContext" — for login/logout/user state

### Services
- `registerApi(model: RegisterModel)` from "@/service/auth/auth"
- `api` (axios instance) from "@/lib/axios"

### Utilities
- None specific to signup

### Components
- `<Button />` from "@/components/ui/button"
- Plain HTML inputs/selects (no controlled form library in old signup)

---

## 7. INTEGRATION PLAN FOR NEW MULTI-STEP SYSTEM

### High-Level Integration
```
CredentialsStep.onSubmit()
  ↓
validateCredentials(zod schema)
  ↓
if valid:
  ├─ Collect: email, password from form
  ├─ Collect: selectedRole from flow state
  ├─ Call registerApi({
  │    Name: ??? (MISSING — need to add or skip)
  │    Email: email,
  │    Password: password,
  │    User: selectedRole
  │  })
  ├─ On Success:
  │  ├─ Option A: setCredentials() + nextStep() (stores in session, continues flow)
  │  ├─ Option B: Auto-login if register returns token
  │  └─ Option C: Redirect to /login (user logs in manually)
  └─ On Error:
      ├─ Show inline validation error
      ├─ Log error to console
      └─ Do NOT proceed to next step
```

### Files to Modify
1. **CredentialsStep.tsx** — Add registerApi() call
2. **useSignupFlow.ts** — Optional: track registration state
3. **Create service file**: `src/lib/api-auth.ts` — Move registerApi from old service
4. **Update axios config** — Ensure it handles signup requests

### Questions for Backend Team
1. Does POST /auth/register return { token, user } like login?
2. Is Name field required? If yes, where do we collect it?
3. Does registration auto-login the user?
4. What happens if user registers but doesn't complete verification?
5. Can verification step be skipped or does it block dashboard access?

---

## 8. VALIDATION SCHEMA COMPARISON

### Old Validation
```typescript
// No validation library used
// Only HTML5 built-in validation
- required: name, email, password
- type="email": basic email check
- No password strength requirements
```

### New Validation (Current)
```typescript
// Using zod + react-hook-form
import { z } from "zod";

export const credentialsSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

### Compatibility Check
- ✅ Email validation: More strict (good)
- ⚠️ Password validation: NEW requirement (backend must support or error)
- ⚠️ Confirm password: NEW field (old signup didn't collect)

---

## SUMMARY TABLE

| Aspect | Old Implementation | New Multi-Step | Status |
|--------|-------------------|-----------------|--------|
| **Endpoint** | POST /auth/register | POST /auth/register | ✅ Same |
| **Fields** | Name, Email, Password, Role | Email, Password, Role (separate) | ⚠️ Name missing |
| **Validation** | HTML5 only | Zod + RHF | ✅ Better |
| **Flow** | Single page | 4-step flow | ✅ Improved UX |
| **Token Return** | Unknown | Unknown | ❓ Verify with BE |
| **Redirect** | /my-profile or /investors | /dashboard/[role] | ✅ Updated |
| **Error Handling** | Inline message | Inline message | ✅ Same |
| **Storage** | N/A (no token after signup) | sessionStorage (flow), localStorage (token) | ✅ Improved |

---

## NEXT STEPS

### Before Implementing registerApi Call in CredentialsStep
1. ✅ Clarify with backend: Does /auth/register return token?
2. ✅ Resolve name field: Collect or skip?
3. ✅ Verify password format: Does backend accept new strict format?
4. ✅ Define post-signup flow: Auto-login, manual login, or verify first?

### Implementation Checklist
- [ ] Create `src/lib/api-auth.ts` with registerApi
- [ ] Add registerApi call to CredentialsStep.onSubmit()
- [ ] Handle success: store credentials state OR auto-redirect
- [ ] Handle error: show inline validation errors
- [ ] Test: register → verification → completion → dashboard

---

## CODE REFERENCES

**Old Signup Page**: `src/app/(auth)/signup/page.tsx` (commit a096766)
**Old Auth Service**: `src/service/auth/auth.ts` (commit a096766)
**Current AuthContext**: `src/context/AuthContext.tsx`
**Axios Config**: `src/lib/axios.ts`
**New CredentialsStep**: `src/features/auth/signup/steps/CredentialsStep.tsx`
**New useSignupFlow**: `src/features/auth/signup/hooks/useSignupFlow.ts`
