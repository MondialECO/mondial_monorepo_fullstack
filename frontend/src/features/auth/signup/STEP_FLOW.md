# Multi-Step Signup Onboarding System

## Overview
Clean, modular multi-step signup flow using React state (no external libs). Steps are isolated, UI-only components. State management happens in `useSignupFlow` hook.

## File Structure
```
src/features/auth/signup/
├── components/         # Layout + UI primitives
├── steps/              # Step page components
│   ├── RoleSelectionStep.tsx       (grid version)
│   ├── RoleSelectionCompactStep.tsx (list version)
│   ├── VerificationStep.tsx         (email verification placeholder)
│   └── index.ts
├── hooks/
│   ├── useSignupFlow.ts           (state management hook)
│   └── index.ts
├── constants/
│   ├── roles.ts                    (4 role definitions)
│   └── index.ts
└── STEP_FLOW.md (this file)
```

## Step Flow Diagram

```
START
  ↓
[Role Selection] ← selected role stored in state
  ↓
[Email Verification] ← shows selected role
  ↓
[Completion] ← ready to redirect
  ↓
END
```

## useSignupFlow Hook

### State Managed
- `currentStep`: "role-selection" | "verification" | "completion"
- `selectedRole`: string | null (role ID from ROLES constant)

### Methods
| Method | Purpose | Returns |
|--------|---------|---------|
| `nextStep()` | Move to next step | void |
| `previousStep()` | Move to previous step (if possible) | void |
| `selectRole(roleId)` | Set selected role | void |
| `resetFlow()` | Reset to start | void |

### Computed Properties
| Property | Purpose |
|----------|---------|
| `canGoPrevious` | Whether previous button should show |
| `stepProgress` | 0-100% progress indicator |

### Example Usage
```tsx
const {
  currentStep,
  selectedRole,
  nextStep,
  previousStep,
  selectRole,
  canGoPrevious
} = useSignupFlow();
```

## Step Components

### 1. RoleSelectionStep (Grid Layout)
- **File**: `steps/RoleSelectionStep.tsx`
- **Props**:
  - `selectedRole`: string | null
  - `onSelectRole`: (roleId: string) => void
  - `onNext`: () => void
  - `onBack?`: () => void
  - `showBack?`: boolean (default: false)
- **Layout**: 2-column grid (responsive: 1-col mobile, 2-col desktop)
- **Display**: 4 role cards with icon + title + description

**When to use**: Initial role selection (primary flow)

### 2. RoleSelectionCompactStep (List Layout)
- **File**: `steps/RoleSelectionCompactStep.tsx`
- **Props**: Same as RoleSelectionStep
- **Layout**: Single-column list (vertical stack)
- **Display**: 4 role cards in a vertical list

**When to use**: Alternative layouts, mobile-first designs

### 3. VerificationStep
- **File**: `steps/VerificationStep.tsx`
- **Props**:
  - `selectedRole`: string | null
  - `onNext`: () => void
  - `onBack`: () => void
- **Layout**: Placeholder UI with checkmark icon
- **Shows**: Selected role + verification message

**When to use**: Email verification step (placeholder, ready for form integration)

## Integration Example

### Minimal Onboarding Page
```tsx
"use client";

import { SignupLayout, SignupHeader } from "@/features/auth/signup/components";
import { RoleSelectionStep, VerificationStep } from "@/features/auth/signup/steps";
import { useSignupFlow } from "@/features/auth/signup/hooks";

export default function SignupOnboarding() {
  const { currentStep, selectedRole, nextStep, previousStep, selectRole, canGoPrevious } = useSignupFlow();

  return (
    <SignupLayout>
      <SignupHeader />

      {currentStep === "role-selection" && (
        <RoleSelectionStep
          selectedRole={selectedRole}
          onSelectRole={selectRole}
          onNext={nextStep}
          showBack={false}
        />
      )}

      {currentStep === "verification" && (
        <VerificationStep
          selectedRole={selectedRole}
          onNext={nextStep}
          onBack={previousStep}
        />
      )}

      {currentStep === "completion" && (
        <div>Success! Redirecting...</div>
      )}
    </SignupLayout>
  );
}
```

## How State Flows Between Steps

```
Step 1: User selects role
  → selectRole("creator")
  → selectedRole = "creator" (stored in hook state)
  → User clicks "Continue"
  → nextStep() called

Step 2: User sees verification
  → Verification step reads selectedRole from hook
  → Displays "Signing up as: Creator"
  → User clicks "I've Verified"
  → nextStep() called

Step 3: Completion page shows
  → Ready to submit to backend
  → selectedRole still available if needed
```

## Key Design Decisions

### 1. No External State Management
- Uses React `useState` only
- Simpler, fewer dependencies
- Perfect for isolated onboarding flow

### 2. Isolated Step Components
- Each step is self-contained
- Props-driven (no direct state access)
- Easy to test and reuse

### 3. Hook-Based State (useSignupFlow)
- Centralized step logic
- Easy to track progress, reset, navigate
- Can be extended with validation later

### 4. UI-Only Steps
- No form submission logic in steps
- No API calls in components
- Clean separation: steps manage UI, parent manages flow

### 5. Flexible Layouts
- RoleSelectionStep (grid) and RoleSelectionCompactStep (list)
- Swap layouts without changing state logic
- Same props interface

## Next Steps (When Building Form Integration)

### To add form submission:
1. Extend `useSignupFlow` with form data state:
   ```ts
   const [formData, setFormData] = useState({ name, email, password });
   ```

2. Update step components to accept form handlers:
   ```tsx
   <RoleSelectionStep {...props} onRoleSelect={selectRole} />
   ```

3. Add form validation (zod + react-hook-form) at parent level

4. Call API on completion step:
   ```ts
   if (currentStep === "completion") {
     submitSignup({ selectedRole, ...formData });
   }
   ```

### To add progress bar:
```tsx
<div className="w-full h-1 bg-muted rounded-full">
  <div
    className="h-full bg-primary rounded-full transition-all"
    style={{ width: `${stepProgress}%` }}
  />
</div>
```

## Testing Checklist

- [ ] Navigate forward through all steps
- [ ] Navigate backward (when available)
- [ ] Selected role persists across steps
- [ ] Can't proceed without selecting role
- [ ] Can reset and start over
- [ ] Mobile responsive (mobile/tablet/desktop)
- [ ] Keyboard navigation works
- [ ] No console errors

## Related Files
- Signup onboarding page: `src/app/(auth)/signup/onboarding/page.tsx`
- Original signup form: `src/app/(auth)/signup/page.tsx` (existing)
- Roles constant: `src/features/auth/signup/constants/roles.ts`
