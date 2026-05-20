# 🐛 STEP-2 REDIRECT BUG — ROOT CAUSE & FIX REPORT

**Date:** April 29, 2026  
**Status:** ✅ FIXED  
**Severity:** CRITICAL (Complete flow blocker)

---

## 🚨 THE BUG

**Symptom:**
- User completes step-1, clicks "Next"
- Gets redirected to `/dashboard/entrepreneur/phase-2/step-1`
- Cannot access `/dashboard/entrepreneur/phase-2/step-2`
- Infinite redirect loop

**Error Context:**
```
User: /dashboard/entrepreneur/phase-2/step-1
Action: Submit form → moveToNextStep(2, 1)
Navigation: router.push("/dashboard/entrepreneur/phase-2/step-2")
Result: RouteGuard redirects back to step-1 ❌
```

---

## 🔍 ROOT CAUSE ANALYSIS

### The Problem: Multiple State Instances

The custom hook `useEntrepreneurProgress()` was creating a **SEPARATE React state instance** every time it was called:

```ts
// Before Fix:
export function useEntrepreneurProgress() {
  const [progress, setProgress] = useState<EntrepreneurProgress>(() => {
    // ... initialization
  });
  // ... returns hook methods
}
```

**Impact:**
```
Phase2Step1Client calls useEntrepreneurProgress()
├─ Gets State Instance #1
├─ Calls moveToNextStep(2, 1)
└─ Updates State Instance #1 ✅
   currentStep: 1 → 2
   completedSteps: "2-1" added

Phase2Step2Page loads and calls useEntrepreneurProgress()
├─ Gets State Instance #2 (DIFFERENT!)
├─ RouteGuard checks: progress.currentStep
└─ Reads 1 (unmodified!) ❌
   Redirects back to step-1
```

### Timeline of Failure

```
1. T0: User on step-1
   ├ State Instance #1: currentStep=1, completedSteps={}
   └ State Instance #2: currentStep=1, completedSteps={}

2. T1: User clicks "Next"
   ├ Phase2Step1Client calls moveToNextStep(2, 1)
   └ Updates State Instance #1
     ├ currentStep: 1→2 ✅
     └ completedSteps: added "2-1" ✅

3. T2: Router navigates to step-2
   ├ Phase2Step1Client unmounts (keeps Instance #1)
   └ Phase2Step2Page mounts
     └ Calls useEntrepreneurProgress() again
       ├ Gets State Instance #2
       └ currentStep still 1 (never updated!) ❌

4. T3: RouteGuard checks access
   ├ progress.currentStep === 1
   ├ progress.completedSteps === {} (empty!)
   └ Redirects to step-1 ❌
```

---

## 🔧 THE FIX

### Solution: Context-Based Shared State

Instead of each component creating its own state, all components now share **ONE centralized state instance** via React Context:

**Architecture:**
```
RootProviders (in layout.tsx)
└─ EntrepreneurProgressProvider (wrapper)
   ├─ useEntrepreneurProgressState (local state management)
   └─ Context.Provider (distributes to children)
      ├─ Phase2Step1Client
      │  └─ useEntrepreneurProgress() → reads from Context
      ├─ Phase2Step2Page  
      │  └─ useEntrepreneurProgress() → reads from SAME Context
      └─ RouteGuard
         └─ useEntrepreneurProgress() → reads from SAME Context
```

### Files Created

#### 1. **`src/providers/EntrepreneurProgressProvider.tsx`** (NEW)
Context provider that ensures all components share one state instance:

```tsx
const EntrepreneurProgressContext = createContext<...>(undefined);

export function EntrepreneurProgressProvider({ children }) {
  const progressMethods = useEntrepreneurProgressState();
  return (
    <EntrepreneurProgressContext.Provider value={progressMethods}>
      {children}
    </EntrepreneurProgressContext.Provider>
  );
}

export function useEntrepreneurProgress() {
  const context = useContext(EntrepreneurProgressContext);
  if (!context) throw new Error('Must be wrapped in Provider');
  return context; // Always returns SAME instance
}
```

#### 2. **`src/hooks/useEntrepreneurProgressState.ts`** (NEW)
State management logic extracted from the old hook:

```ts
export function useEntrepreneurProgressState() {
  const [progress, setProgress] = useState<EntrepreneurProgress>(...);
  // ... all the old hook logic
  return { progress, moveToNextStep, ... };
}
```

#### 3. **`src/hooks/useEntrepreneurProgress.ts`** (MODIFIED)
Now just re-exports from the provider:

```ts
// Old: created local state
// New: imports from context provider
export { useEntrepreneurProgress } from '@/providers/EntrepreneurProgressProvider';
```

#### 4. **`src/app/_providers/RootProviders.tsx`** (MODIFIED)
Added the provider to the root wrapper:

```tsx
export function RootProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EntrepreneurProgressProvider>  {/* NEW */}
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </EntrepreneurProgressProvider>  {/* NEW */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

---

## ✅ VERIFICATION

### Fix Validation

**State Instance Sharing:**
```
Before:
├─ Phase2Step1Client: useState → Instance #1
├─ Phase2Step2Page: useState → Instance #2 ✗
└─ RouteGuard: useState → Instance #3 ✗

After:
├─ Phase2Step1Client: useContext → Instance #1
├─ Phase2Step2Page: useContext → Instance #1 ✓
└─ RouteGuard: useContext → Instance #1 ✓
```

**State Update Flow:**
```
Phase2Step1Client.moveToNextStep(2, 1)
│
├─ setProgress( { ..., currentStep: 2, completedSteps: {"2-1"} } )
│
└─ Updates SHARED state in Context ✅

Route Navigation
│
├─ router.push("/dashboard/entrepreneur/phase-2/step-2")
│
└─ All components see updated state ✅

RouteGuard Check
│
├─ progress.currentStep === 2 ✅
├─ progress.completedSteps has "2-1" ✅
└─ Access GRANTED → step-2 loads ✅
```

---

## 🧪 TEST CASES

### Test 1: Complete Step-1 → Access Step-2 ✅
```
1. Login as Entrepreneur
2. Navigate to /dashboard/entrepreneur/phase-2/step-1
3. Fill form, click "Next"
4. Expected: Navigate to /dashboard/entrepreneur/phase-2/step-2
5. Actual: ✅ WORKS (state shared via Context)
```

### Test 2: Refresh on Step-2 ✅
```
1. On /dashboard/entrepreneur/phase-2/step-2
2. Refresh page (F5)
3. Expected: Stay on step-2
4. Actual: ✅ WORKS (state persists in localStorage, syncs on load)
```

### Test 3: Direct URL to Step-2 After Completion ✅
```
1. Complete step-1
2. Direct URL to /dashboard/entrepreneur/phase-2/step-2
3. Expected: Allow access (next step after completed)
4. Actual: ✅ WORKS (RouteGuard sees correct state)
```

### Test 4: Block Skipped Steps ✅
```
1. On step-1 (not completed)
2. Try direct URL: /dashboard/entrepreneur/phase-2/step-3
3. Expected: Redirect to step-1
4. Actual: ✅ WORKS (RouteGuard blocks access)
```

### Test 5: Progress Sidebar Updates ✅
```
1. Complete step-1
2. Navigate to step-2
3. Expected: Sidebar shows step-1 as "completed", step-2 as "current"
4. Actual: ✅ WORKS (components read from shared state)
```

---

## 📊 BEFORE & AFTER

### Before Fix
```
Phase2Step1Client: currentStep=1
                   ↓ moveToNextStep
State #1: currentStep=2 ✓

Phase2Step2Page: currentStep=1 ❌
                 ↓ RouteGuard
Redirect to step-1 ❌
```

### After Fix
```
RootProviders
└─ EntrepreneurProgressProvider
   └─ State (shared): currentStep=2
      ├─ Phase2Step1Client: sees currentStep=2 ✓
      ├─ Phase2Step2Page: sees currentStep=2 ✓
      └─ RouteGuard: sees currentStep=2 ✓
         ↓
Access Step-2 ✅
```

---

## 🎯 IMPACT

### Fixed Issues
- ✅ Cannot access step-2 after completing step-1
- ✅ State not syncing between components
- ✅ RouteGuard reading stale progress
- ✅ Redirect loops

### Side Effects
- ✅ None! Context is transparent to existing code
- ✅ All imports still work (useEntrepreneurProgress)
- ✅ All functionality preserved
- ✅ localStorage sync unchanged

### Performance
- ✅ No performance degradation
- ✅ Context updates are atomic (React batched)
- ✅ Fewer state instances = less memory

---

## 📋 CHECKLIST

### Code Changes
- ✅ Created `EntrepreneurProgressProvider.tsx`
- ✅ Created `useEntrepreneurProgressState.ts`
- ✅ Modified `useEntrepreneurProgress.ts` (re-export)
- ✅ Modified `RootProviders.tsx` (added provider)

### Testing
- ✅ Flow: Complete step-1 → navigate to step-2
- ✅ RouteGuard: correctly reads shared state
- ✅ Persistence: localStorage saves/restores state
- ✅ Backward Compatibility: all imports work

### Documentation
- ✅ Root cause analysis
- ✅ Fix explanation
- ✅ Test cases
- ✅ Before/after comparison

---

## 🚀 DEPLOYMENT NOTES

### No Breaking Changes
- All existing code continues to work
- `useEntrepreneurProgress()` import unchanged
- Component code unchanged
- Just wraps with provider

### How to Verify
```
1. npm run dev
2. Login as Entrepreneur
3. Navigate to phase-2/step-1
4. Complete form, click Next
5. Should land on phase-2/step-2 ✅
6. Breadcrumb shows current progress ✅
7. Refresh page - state persists ✅
```

---

## ✅ SIGN-OFF

**Root Cause:** Multiple useState instances in custom hook  
**Fix:** Context-based shared state provider  
**Status:** VERIFIED WORKING  
**Risk Level:** LOW (transparent refactor)  

**Test Results:**
- ✅ Step progression works
- ✅ RouteGuard allows access
- ✅ State syncs across components
- ✅ localStorage persistence intact
- ✅ No performance impact

**Ready for:** Production deployment
