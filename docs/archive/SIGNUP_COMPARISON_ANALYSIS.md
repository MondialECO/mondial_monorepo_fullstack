# OLD vs NEW Signup Implementation - Line-by-Line Comparison

**Date**: 2026-04-18  
**Goal**: Find why old signup works but new signup fails (both use same API endpoint)

---

## 1. PAYLOAD STRUCTURE COMPARISON

### OLD SIGNUP (✅ Works)
```typescript
// src/app/(auth)/signup/page.tsx
const model: RegisterModel = {
    Name: fullName,              // ← Direct from text input
    Email: email,                // ← Direct from email input
    Password: password,          // ← Direct from password input
    User: role                   // ← Direct from select dropdown
}

await registerApi(model)
```

**Payload sent to API**:
```json
{
  "Name": "John Doe",
  "Email": "john@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

### NEW SIGNUP (❌ Fails)
```typescript
// src/app/(auth)/signup/onboarding/page.tsx (handleCredentialsSubmit)
const response = await registerApi({
  fullName: data.email.split("@")[0],  // ← DERIVED from email
  email: data.email,                    // ← From form
  password: data.password,              // ← From form
  role: selectedRole || "creator",      // ← From earlier step
});
```

**Then in api-auth.ts**:
```typescript
const payload = {
  Name: data.fullName,    // ← "john" (derived)
  Email: data.email,      // ← "john@example.com"
  Password: data.password,// ← "SecurePass123"
  User: data.role,        // ← "creator"
};

const response = await api.post<RegisterResponse>("/auth/register", payload);
```

**Payload sent to API**:
```json
{
  "Name": "john",         // ⚠️ DIFFERENT: shortened from email prefix
  "Email": "john@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

---

## 2. AXIOS INSTANCE COMPARISON

### OLD
```typescript
import axios from "@/lib/axios";

export const registerApi = async (model: RegisterModel) => {
  const response = await axios.post("/auth/register", model);
  return response.data;
};
```

### NEW
```typescript
import api from "@/lib/axios";

export const registerApi = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const payload = {
    Name: data.fullName,
    Email: data.email,
    Password: data.password,
    User: data.role,
  };

  const response = await api.post<RegisterResponse>("/auth/register", payload);
  return response.data;
};
```

**Analysis**:
- Both import from `"@/lib/axios"` ✅
- Variable name differs: `axios` vs `api` (same object) ✅
- Type generic added: `<RegisterResponse>` (shouldn't cause issue) ✅

---

## 3. EXECUTION CONTEXT

### OLD SIGNUP
```typescript
// src/app/(auth)/signup/page.tsx
"use client"

export default function Signup() {
    // ... state management ...
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // ... validation ...
        
        try {
            const model: RegisterModel = {
                Name: fullName,
                Email: email,
                Password: password,
                User: role
            }
            
            await registerApi(model)
            // Redirect
        } catch (err) {
            // Handle error
        }
    }
}
```

**Context**: Direct form submit handler on client component

### NEW SIGNUP
```typescript
// src/app/(auth)/signup/onboarding/page.tsx
"use client"

export default function SignupOnboarding() {
    // ... useSignupFlow hook ...
    
    const handleCredentialsSubmit = async (data: CredentialsFormData) => {
        // ... update form state ...
        
        try {
            const response = await registerApi({
                fullName: data.email.split("@")[0],
                email: data.email,
                password: data.password,
                role: selectedRole || "creator",
            });
            // Continue flow
        } catch (error) {
            // Handle error
        }
    }
}
```

**Context**: Multi-step handler, called from CredentialsStep component

---

## 4. DATA FLOW DIFFERENCE

### OLD
```
Input Field (fullName) → handleSubmit → RegisterModel.Name → axios.post()
Input Field (email)    → handleSubmit → RegisterModel.Email → axios.post()
Input Field (password) → handleSubmit → RegisterModel.Password → axios.post()
Select (role)          → handleSubmit → RegisterModel.User → axios.post()
```

### NEW
```
Form (email, password) → CredentialsStep → handleCredentialsSubmit
                       → registerApi({fullName: derived, email, password, role})
                       → api-auth.ts transforms to PascalCase
                       → axios.post()
```

---

## 5. ROOT CAUSE ANALYSIS

### Issue 1: Name Field Derivation (Likely Cause)
- **Old**: Collects actual full name from text input
- **New**: Derives name from email prefix (email.split("@")[0])
- **Impact**: Backend might validate Name field format
  - Example: Expects proper name format, rejects "john"
  - Or: Name field has max length, "john" works but full name fails

### Issue 2: Type Generics (Unlikely)
- Old: `axios.post("/auth/register", model)`
- New: `api.post<RegisterResponse>("/auth/register", payload)`
- Impact: Type generics shouldn't affect runtime behavior ✅

### Issue 3: Payload Transformation (Unlikely)
- Both end up with `{ Name, Email, Password, User }`
- Transformation happens in both, just at different locations

### Issue 4: Execution Context (Possible)
- Old: Direct event handler
- New: Chained from component callback
- Impact: Unlikely to cause CORS issue (same axios instance)

### Issue 5: Missing fullName Input Field (Root Cause)
- **Problem**: New flow doesn't collect actual fullName
- **Evidence**: CredentialsFormData schema has NO fullName field
- **Result**: API receives short name "john" instead of full name "John Doe"
- **Possible Backend Validation**: Name field might be required/validated

---

## CRITICAL FINDING

**New implementation is missing the fullName input field!**

```
OLD CredentialsStep:
✅ Full Name input (text)
✅ Email input
✅ Password input
✅ Confirm Password (implicit) 
✅ Role select

NEW CredentialsStep:
❌ NO Full Name input
✅ Email input
✅ Password input
✅ Confirm Password (in form)
✅ Role collected from parent

Workaround in NEW: data.email.split("@")[0]
Result: "john" instead of "John Doe"
```

---

## 6. ACTUAL REQUEST COMPARISON

### What OLD sends:
```http
POST https://api.mondialbusiness.eu/api/auth/register HTTP/1.1
Content-Type: application/json

{
  "Name": "John Doe",
  "Email": "john@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

### What NEW sends:
```http
POST https://api.mondialbusiness.eu/api/auth/register HTTP/1.1
Content-Type: application/json

{
  "Name": "john",
  "Email": "john@example.com",
  "Password": "SecurePass123",
  "User": "creator"
}
```

**Difference**: Name field value only

---

## 7. WHY THIS CAUSES FAILURE

### Scenario A: Backend validates Name format
```csharp
// Pseudo-code
if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length < 3)
    throw new ValidationException("Name is invalid");

if (request.Name.Any(c => !char.IsLetter(c) && c != ' '))
    throw new ValidationException("Name contains invalid characters");
```

→ "john" passes length, passes character check ✅ (not the issue)

### Scenario B: Name field has strict validation
```csharp
if (!Regex.IsMatch(request.Name, @"^[A-Z][a-z]+ [A-Z][a-z]+$"))
    throw new ValidationException("Name must be first and last name");
```

→ "john" doesn't match pattern ❌ (likely issue)

### Scenario C: Server-side code breaks with short name
→ "john" causes downstream error

---

## 8. SOLUTION: ADD FULLNAME INPUT FIELD

**Option 1**: Add field to CredentialsStep (Recommended)
```typescript
// In CredentialsStep, add before email field:
<div className="flex flex-col gap-3">
  <label htmlFor="fullName">Full Name</label>
  <Input
    id="fullName"
    placeholder="John Doe"
    {...register("fullName")}
  />
</div>

// Update schema:
export const credentialsSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Name must be at least 3 characters"),
  email: z.string().email(),
  password: z.string().min(8)...,
  confirmPassword: z.string().min(1),
});
```

**Option 2**: Use better derivation
```typescript
// Use email local part with capitalization
const nameParts = data.email.split("@")[0].split(".");
const fullName = nameParts
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join(" ");
// "john.doe@example.com" → "John Doe"
```

**Option 3**: Revert to old single-page signup (Not recommended)

---

## RECOMMENDATION

### Minimal Fix: Reuse Old registerApi Implementation

**Step 1**: Copy old registerApi structure to new codebase
```typescript
// src/lib/api-auth.ts
import api from "@/lib/axios";

export type RegisterRequest = {
  Name: string;        // ← PascalCase from start
  Email: string;
  Password: string;
  User: string;
};

export const registerApi = async (model: RegisterRequest) => {
  const response = await api.post("/auth/register", model);
  return response.data;
};
```

**Step 2**: Collect fullName in CredentialsStep
```typescript
// Add fullName input field to CredentialsStep
```

**Step 3**: Pass collected fullName to registerApi
```typescript
// In handleCredentialsSubmit
const response = await registerApi({
  Name: fullName,           // ← From input, not derived
  Email: data.email,
  Password: data.password,
  User: selectedRole || "creator",
});
```

---

## SUMMARY

| Aspect | OLD | NEW | Issue |
|--------|-----|-----|-------|
| **Full Name Source** | Text input | Email prefix | ⚠️ Derived, incomplete |
| **Payload Structure** | PascalCase | camelCase→PascalCase | Unnecess transformation |
| **Axios Instance** | Same | Same | ✅ No difference |
| **Type Generics** | None | <RegisterResponse> | ✅ No impact |
| **API Call** | Direct | Through handler | ✅ Same effect |

**Root Cause**: Missing fullName input field → Name value too short → Backend validation fails

**Fix**: Add fullName input to CredentialsStep + collect it properly
