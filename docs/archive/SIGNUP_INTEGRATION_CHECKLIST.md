# Signup API Integration Checklist

## Current Status: Pre-Integration
**Dependencies Installed**: ✅ react-hook-form, zod, @hookform/resolvers
**CredentialsStep Component**: ✅ Created and wired
**useSignupFlow Hook**: ✅ Updated with credentials state
**Onboarding Flow**: ✅ Added credentials step
**API Service**: ⏳ READY TO CREATE

---

## FLOW DIAGRAM: Request → Response → Action

```
┌─────────────────────────────────────────────────────┐
│ USER: Credentials Step Form Submit                  │
└────────────────────┬────────────────────────────────┘
                     ↓
            ┌────────────────────┐
            │ Validate with Zod  │
            └────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │ Valid?               │
          └──┬──────────────┬────┘
             │              │
           YES              NO
             │              │
             ↓              ↓
        ┌────────┐    ┌──────────────────────┐
        │CALL    │    │ Show validation      │
        │registerApi  │ errors inline        │
        └────┬───┘    │ (red text below      │
             │        │  each field)         │
             ↓        └──────────────────────┘
     POST /auth/register
     {
       Name: "???" (MISSING)
       Email: "user@example.com"
       Password: "SecurePass123"
       User: "creator"
     }
             │
             ↓
     ┌──────────────────────┐
     │ Backend Response?    │
     └──┬──────────────┬────┘
        │              │
      200/201        4xx/5xx
        │              │
        YES              NO
        ↓              ↓
     ┌────────────────┐  ┌──────────────────┐
     │ Success!       │  │ Error Response   │
     │ response.data  │  │ response.data    │
     │   .message OR  │  │   .message       │
     │   .token       │  └─────┬────────────┘
     └────┬──────────┘         │
          ↓                    ↓
    Option A:            ┌──────────────────┐
    Token in response    │ Display error in │
    ├─ setCredentials()  │ state            │
    ├─ Store token to LS │ Do NOT advance   │
    ├─ nextStep()        │ to next step     │
    └─→ Verification     └──────────────────┘
    
    Option B:
    No token in response
    ├─ setCredentials()
    ├─ nextStep()
    └─→ Verification
        (user will login after verification)
```

---

## INTEGRATION STEPS (In Order)

### Step 1: Create API Service File ✅ Ready
**File**: `src/lib/api-auth.ts`
**Action**: Extract registerApi from old service + add to new file

```typescript
import api from "@/lib/axios";

export type RegisterRequest = {
  Name: string;
  Email: string;
  Password: string;
  User: string;
};

export type RegisterResponse = {
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    roles: string[];
  };
};

export const registerApi = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register", data);
  return response.data;
};
```

---

### Step 2: Update CredentialsStep Component ⏳ Ready to Implement
**File**: `src/features/auth/signup/steps/CredentialsStep.tsx`
**Change**: Add registerApi() call in onSubmit handler

```typescript
// In CredentialsStep.tsx, update the onSubmit handler:

const [apiError, setApiError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

const onSubmit = async (data: CredentialsFormData) => {
  setApiError(null);
  setIsLoading(true);

  try {
    // QUESTION: Does backend require Name? Use email as fallback?
    const registerData = {
      Name: "", // ⚠️ MISSING — need to decide
      Email: data.email,
      Password: data.password,
      User: selectedRole || "creator", // From parent state
    };

    const response = await registerApi(registerData);
    
    // If response includes token, store it
    if (response.token) {
      localStorage.setItem("token", response.token);
      // Optionally parse and store user
    }

    // Proceed to next step
    onNext?.(data);
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message || "Registration failed. Please try again.";
    setApiError(errorMsg);
    console.error("Registration error:", error);
  } finally {
    setIsLoading(false);
  }
};

// In JSX, show error above form:
{apiError && (
  <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
    {apiError}
  </div>
)}

// Disable submit while loading:
<Button type="submit" disabled={!isValid || isLoading} size="lg">
  {isLoading ? "Creating Account..." : "Create Account"}
</Button>
```

---

### Step 3: Wire Up selectedRole to CredentialsStep ⏳ Ready to Implement
**File**: `src/app/(auth)/signup/onboarding/page.tsx`
**Change**: Pass selectedRole as prop to CredentialsStep

```typescript
{currentStep === "credentials" && (
  <CredentialsStep
    selectedRole={selectedRole}  // ← NEW: pass role
    onBack={previousStep}
    onNext={handleCredentialsSubmit}
    initialData={credentials || undefined}
  />
)}
```

**File**: `src/features/auth/signup/steps/CredentialsStep.tsx`
**Change**: Accept selectedRole prop

```typescript
interface CredentialsStepProps {
  selectedRole?: string | null;  // ← NEW: accept role
  onBack?: () => void;
  onNext?: (data: CredentialsFormData) => void;
  initialData?: Partial<CredentialsFormData>;
}

export function CredentialsStep({
  selectedRole,  // ← NEW
  onBack,
  onNext,
  initialData,
}: CredentialsStepProps) {
  // ...
  // Use selectedRole in registerApi call
}
```

---

### Step 4: Handle Name Field ⏳ DECISION NEEDED
**Options**:

#### Option A: Collect Name in CredentialsStep
```typescript
// Add name field to form
<div className="flex flex-col gap-3">
  <label htmlFor="fullName">Full Name</label>
  <Input
    id="fullName"
    placeholder="John Doe"
    {...register("fullName")}
  />
</div>

// Update schema:
const credentialsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
  // ...
});

// Update CredentialsFormData type:
export type CredentialsFormData = {
  fullName: string;  // ← NEW
  email: string;
  password: string;
  confirmPassword: string;
};
```

#### Option B: Add Separate Name Step
```
Role Selection → Name Entry → Credentials → Verification → Completion
```

#### Option C: Skip Name / Auto-Generate
```typescript
Name: data.email.split("@")[0]; // Use email prefix as name
```

**Recommendation**: Option A (collect in CredentialsStep) — simplest, maintains 2-step flow

---

### Step 5: Test Registration Flow ⏳ After Implementation
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to signup
# http://localhost:3000/signup/onboarding

# 3. Select a role → click Next

# 4. Fill credentials form
# Email: test@example.com
# Password: SecurePass123 (uppercase, lowercase, number, 8+)
# Confirm: SecurePass123

# 5. Submit form
# - Check browser console for registerApi call
# - Verify POST request to /auth/register
# - Check request body structure
# - Inspect response

# 6. Success: Should advance to Verification step
# OR Error: Should display inline error message

# 7. Refresh credentials page
# - sessionStorage should persist credentials
# - Form fields should be populated from initialData
```

---

## CRITICAL QUESTIONS FOR BACKEND TEAM

| Question | Impact | Resolution |
|----------|--------|-----------|
| Does POST /auth/register return token? | Token storage, auto-login flow | Need API spec |
| Is Name field required? | CredentialsStep design | Add field or skip |
| Should password meet strict requirements (8+, upper, lower, number)? | Validation rules | Align with BE |
| Does registration auto-login or require manual login? | Post-signup flow | Affects redirect |
| Can user skip verification or is it mandatory? | Flow gating | Affects completion step |
| What's the user object structure in response? | Token parsing, state storage | Need API spec |

---

## ERROR HANDLING MATRIX

| Scenario | Old Code | New Code | Action |
|----------|----------|---------|--------|
| **Invalid email format** | HTML5 validation | Zod validation | Show inline error ✅ |
| **Password too short** | No validation | Zod validation | Show inline error ✅ |
| **Passwords don't match** | No validation | Zod refine | Show inline error ✅ |
| **Email already registered** | 400 from server | response.data.message | Show inline error ✅ |
| **Network error** | Basic catch | try/catch with error | Show inline error ✅ |
| **Server 500 error** | Basic catch | try/catch with error | Show inline error ✅ |
| **Invalid role** | Dropdown only | Flow state | Should not happen |

---

## FILE CHANGES SUMMARY

```
src/
├── lib/
│   └── api-auth.ts                          [CREATE]
│       ├── registerApi() service
│       ├── RegisterRequest type
│       └── RegisterResponse type
│
└── features/auth/signup/
    ├── steps/
    │   └── CredentialsStep.tsx              [MODIFY]
    │       ├── Add selectedRole prop
    │       ├── Add API error state
    │       ├── Add isLoading state
    │       ├── Call registerApi in onSubmit
    │       ├── Display error message
    │       └── Disable button while loading
    │
    └── constants/
        └── credentials-validation.ts        [UPDATE]
            └── Add fullName field? (if Option A)
```

---

## IMPLEMENTATION PRIORITY

**Must-Have** (Blocking)
- [ ] Create src/lib/api-auth.ts
- [ ] Call registerApi in CredentialsStep
- [ ] Display error messages
- [ ] Handle loading state

**Should-Have** (Important)
- [ ] Collect name field (resolve with BE)
- [ ] Test with real backend
- [ ] Verify token handling

**Nice-to-Have** (Polish)
- [ ] Success toast message
- [ ] Loading skeleton on verification step
- [ ] Retry failed registration

---

## ROLLBACK PLAN

If registration API integration fails:
1. Remove registerApi() call from CredentialsStep
2. Keep form validation (zod) — useful for UX
3. Skip to Verification step without API call
4. Store credentials in sessionStorage (already done)
5. Manual backend integration later

**No breaking changes** — flow still works without API.

---

## NEXT SESSION TODO

```
1. ✅ Create src/lib/api-auth.ts
2. ✅ Update CredentialsStep.tsx with registerApi call
3. ✅ Wire selectedRole to CredentialsStep
4. ⏳ Decide on name field approach (A/B/C)
5. ✅ Test registration with dev backend
6. ✅ Handle success/error flows
7. ✅ Update onboarding page if needed
```
