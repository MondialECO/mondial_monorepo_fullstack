# Phase D Implementation Plan

**Status**: API Layer Complete, UI Integration In Progress

## Summary

Phase D connects the Next.js frontend to the production backend APIs. It replaces all mock data with real API calls, adds proper error handling, loading states, and implements background job polling for async operations.

---

## Part 1: API Integration Layer ✅ COMPLETE

### File: `src/lib/api-entrepreneur.ts`

**40+ typed API functions covering all 9 phases:**

#### Phase Flow
- `getCurrentPhase()` → `CompanyProgressResponse`
- `advancePhase(companyId, phaseNumber, data)` → `CompanyProgressResponse`
- `getPhaseProgress(companyId)` → `CompanyProgressResponse`

#### Phase 1: Identity & Onboarding
- `createCompany(data)` → company object
- `getCompany(companyId)` → company details

#### Phase 2: Legal & Documents
- `updateLegalInfo(companyId, data)` → company
- `uploadDocument(companyId, formData)` → `DocumentStatusResponse`
- `getDocuments(companyId)` → `DocumentStatusResponse[]`
- `updateBeneficialOwners(companyId, data)` → company

#### Phase 3: Financial & KPI
- `saveRevenue(companyId, data)` → company
- `calculateValuation(companyId)` → `FinancialSummaryResponse`
- `saveEquityStructure(companyId, data)` → company
- `saveFundingAsk(companyId, data)` → company
- `getFinancialSummary(companyId)` → `FinancialSummaryResponse`

#### Phase 4: Equity & Dilution
- `getCapTable(companyId)` → equity structure
- `simulateDilution(companyId, data)` → `DilutionSimulationResponse` (3 scenarios)

#### Phase 6: Data Room
- `uploadDataRoomDocument(companyId, formData)` → document
- `getDataRoom(companyId)` → `DataRoomStatusResponse`
- `grantDataRoomAccess(companyId, investorId, accessLevel, days)` → status
- `revokeDataRoomAccess(companyId, investorId)` → status
- `updateNdaRequirement(companyId, required)` → status

#### Phase 7: AI Review
- `runAiReview(companyId)` → `AiReviewResponse` (async)
- `getAiReview(companyId)` → `AiReviewResponse`
- `getRecommendations(companyId)` → `RecommendationDto[]`
- `awardInvestorReadyBadge(companyId)` → status

#### Phase 8: Investor Matching
- `getInvestorMatches(companyId)` → `InvestorMatchResponse[]`
- `recordInvestorInteraction(companyId, matchId, type, details)` → status
- `getMatchingInsights(companyId)` → insights

#### Phase 9: Deal Execution
- `createDeal(companyId, investorId, termSheet)` → `DealStatusResponse`
- `getDeal(dealId)` → `DealStatusResponse`
- `getCompanyDeals(companyId)` → `DealStatusResponse[]`
- `updateTermSheet(dealId, termSheet)` → `DealStatusResponse`
- `progressChecklist(dealId, item)` → `DealStatusResponse`
- `closeDeal(dealId)` → `DealStatusResponse`

#### Background Jobs
- `enqueueAiReview(companyId)` → `JobStatus` (202 Accepted)
- `enqueueInvestorMatching(companyId)` → `JobStatus`
- `enqueueDataRoomAnalysis(companyId)` → `JobStatus`
- `enqueueFinancialProjections(companyId)` → `JobStatus`
- `getJobStatus(jobId)` → `JobStatus` (for polling)

**All functions are fully typed with TypeScript interfaces matching backend DTOs.**

---

## Part 2: Custom React Hooks ✅ COMPLETE

### File: `src/hooks/useEntrepreneurDashboard.ts`

**Hook for phase progression:**
```typescript
const {
  phaseProgress,           // CompanyProgressResponse | undefined
  isPhaseLoading,         // boolean
  phaseError,             // string | null
  advancePhase,           // (companyId, phase, data) => void
  isAdvancing,            // boolean
  advanceError,           // string | null
  clearError,             // () => void
} = useEntrepreneurDashboard();
```

**Uses TanStack Query (React Query) for:**
- Automatic caching (30s TTL)
- Automatic refetching on window focus
- Mutation handling with optimistic updates
- Error state management

### File: `src/hooks/useBackgroundJob.ts`

**Hooks for async job processing:**

```typescript
// Poll a single job by ID
const {
  jobStatus,              // JobStatus | null
  isLoading,             // boolean
  isDone,                // boolean (completed or failed)
  isSuccess,             // boolean
  isFailed,              // boolean
} = useBackgroundJob(jobId);
```

**Polling logic:**
- Polls every 2 seconds when job is queued/processing
- Automatically stops when job completes/fails
- Respects window focus (stops if tab is hidden)

**Enqueue mutation hooks:**
```typescript
const { mutate: enqueueAiReview, isPending } = useEnqueueAiReview();
const { mutate: enqueueInvestorMatching, isPending } = useEnqueueInvestorMatching();
// ... etc
```

---

## Part 3: Reusable UI Components ✅ COMPLETE

### File: `src/components/entrepreneur/PhaseFormWrapper.tsx`

**Wrapper component for phase forms:**

```typescript
<PhaseFormWrapper
  title="Phase 2: Legal Info"
  description="Complete your company legal details"
  isLoading={isLoading}
  error={error}
  success={success}
  successMessage="Legal info saved!"
  onRetry={handleRetry}
  onDismissError={clearError}
>
  {/* Form content */}
</PhaseFormWrapper>
```

**Features:**
- Loading spinner overlay
- Error banner with retry button
- Success banner with custom message
- Responsive design
- Automatic error dismissal

### File: `src/components/entrepreneur/JobProgressIndicator.tsx`

**Component for monitoring background jobs:**

```typescript
<JobProgressIndicator
  jobId={jobId}
  title="AI Review in Progress"
  description="Analyzing your company profile..."
  onComplete={(success, result, error) => {
    if (success) console.log(result);
    else console.error(error);
  }}
/>
```

**Features:**
- Real-time status display (queued → processing → completed/failed)
- Animated progress bar
- Status icons (clock, spinner, checkmark, error)
- Result/error messages
- Auto-notification on completion

---

## Part 4: Phase Pages Update (In Progress)

### Phase 1: Identity & Onboarding ✅ UPDATED

**Changes:**
- Replaced `useEntrepreneurProgress` with `useEntrepreneurDashboard`
- Added loading state with spinner
- Added error state with retry button
- Real data from `phaseProgress` object
- Ready for implementation of company creation form

**Next: Implement company creation form that:**
1. Calls `entrepreneurApi.createCompany()`
2. Shows loading/error/success states via `PhaseFormWrapper`
3. Navigates to Phase 2 on success

---

## Part 5: Forms & Data Binding (To Be Implemented)

### Pattern for All Phase Forms

**Example: Phase 2 - Legal Info Form**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhaseFormWrapper } from "@/components/entrepreneur/PhaseFormWrapper";
import entrepreneurApi from "@/lib/api-entrepreneur";

export default function Phase2Step1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    legalName: "",
    registrationNumber: "",
    // ... other fields
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const companyId = "..."; // Get from URL params or state
      await entrepreneurApi.updateLegalInfo(companyId, formData);
      setSuccess(true);

      // Navigate after 1 second
      setTimeout(() => {
        router.push("/dashboard/entrepreneur/phase-2/step-2");
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PhaseFormWrapper
      title="Phase 2, Step 1: Legal Information"
      isLoading={isLoading}
      error={error}
      success={success}
      successMessage="Legal info saved! Continuing..."
      onDismissError={() => setError(null)}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Legal Name *
          </label>
          <input
            type="text"
            required
            value={formData.legalName}
            onChange={(e) =>
              setFormData({ ...formData, legalName: e.target.value })
            }
            className="w-full border-2 border-neutral-2 rounded-lg px-4 py-2"
          />
        </div>
        {/* ... other form fields */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold"
        >
          Save & Continue
        </button>
      </form>
    </PhaseFormWrapper>
  );
}
```

---

## Part 6: Phase 7 (AI Review) - Special Case

**Uses background job pattern:**

```typescript
"use client";

import { useState } from "react";
import { useEnqueueAiReview, useBackgroundJob } from "@/hooks/useBackgroundJob";
import { JobProgressIndicator } from "@/components/entrepreneur/JobProgressIndicator";

export default function Phase7() {
  const [jobId, setJobId] = useState<string | null>(null);
  const { mutate: enqueueReview, isPending } = useEnqueueAiReview();

  const handleStartReview = () => {
    enqueueReview(companyId, {
      onSuccess: (data) => setJobId(data.jobId),
    });
  };

  return (
    <div>
      <button
        onClick={handleStartReview}
        disabled={isPending || jobId !== null}
      >
        {isPending ? "Starting..." : "Run AI Review"}
      </button>

      {jobId && (
        <JobProgressIndicator
          jobId={jobId}
          title="AI Review in Progress"
          description="Our AI is analyzing your company profile..."
          onComplete={(success, result, error) => {
            if (success) {
              // Fetch review results and navigate
              router.push("/dashboard/entrepreneur/phase-7/results");
            }
          }}
        />
      )}
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Identity & Onboarding
- [x] API integration layer created
- [x] `useEntrepreneurDashboard` hook created
- [ ] Create company form (new step, since companies don't exist yet)
- [ ] Company info display

### Phase 2: Legal & Documents
- [ ] Legal info form with API integration
- [ ] Document upload with progress tracking
- [ ] Beneficial owners form
- [ ] Document status list

### Phase 3: Financial & KPI
- [ ] Revenue input form
- [ ] Valuation calculation trigger
- [ ] Equity structure form
- [ ] Funding ask form
- [ ] Financial summary display

### Phase 4: Equity & Dilution
- [ ] Display cap table
- [ ] Dilution scenario simulator (3 scenarios side-by-side)

### Phase 5: (Combined with Phase 3 in UI)
- [ ] Capital allocation breakdown
- [ ] Hiring plan input
- [ ] Resource map

### Phase 6: Data Room
- [ ] Data room document upload
- [ ] Document list with filters
- [ ] Investor access management
- [ ] NDA toggle

### Phase 7: AI Review
- [ ] Trigger AI review (enqueue job)
- [ ] Job progress indicator
- [ ] Display review scores (5 categories + overall)
- [ ] Display recommendations
- [ ] Award investor-ready badge

### Phase 8: Investor Matching
- [ ] Display matched investors
- [ ] Record interactions (view, message, call, proposal_sent)
- [ ] Matching insights visualization

### Phase 9: Deal Execution
- [ ] Create deal form
- [ ] Term sheet builder
- [ ] Closing checklist progress
- [ ] Deal status timeline

---

## Error Handling Strategy

**All forms follow this pattern:**

```typescript
try {
  setIsLoading(true);
  await API_CALL();
  setSuccess(true);
  setTimeout(() => navigateToNextStep(), 1000);
} catch (err: any) {
  const errorMsg = err.response?.data?.error 
    || err.response?.data?.message
    || "An error occurred. Please try again.";
  setError(errorMsg);
} finally {
  setIsLoading(false);
}
```

**Validation errors from backend:**
- Server sends 400 with `{ error: "Can't advance: Phase X validation failed" }`
- Display in `PhaseFormWrapper` error banner
- Offer retry button

**Network errors:**
- Server sends 500 with `{ error: "Internal server error" }`
- Display generic "Server error. Please try again." message
- Offer retry button

**Auth errors:**
- Server sends 401 with `{ error: "Unauthorized" }`
- Axios interceptor redirects to login
- Session expires handled gracefully

---

## Testing Before Going Live

### Manual Testing Checklist

- [ ] Phase 1: Create company → success → navigate to Phase 2
- [ ] Phase 2: Upload document → pending status → admin approves → refreshes
- [ ] Phase 3: Save revenue → calculate valuation → compare with expected formula
- [ ] Phase 4: View cap table → simulate dilution → 3 scenarios correct math
- [ ] Phase 6: Upload data room doc → publish → grant investor access
- [ ] Phase 7: Trigger AI review → job queued → polling works → results displayed
- [ ] Phase 8: View investor matches → record interaction → interaction saved
- [ ] Phase 9: Create deal → update term sheet → close deal → complete
- [ ] Error case: Invalid input → backend returns 400 → error displayed → retry works
- [ ] Loading state: Large upload → spinner shows → responsive during load
- [ ] Success state: Any form → success banner shows → auto-dismisses after nav

---

## Build & Deploy

**Verify before push:**
```bash
npm run lint
npm run build
npm run type-check
```

**No console errors or warnings in dev tools**

**API calls use Bearer token from localStorage**

---

## What's Ready vs. What Remains

✅ **Ready NOW:**
- API integration layer (all endpoints typed)
- Custom React hooks (useEntrepreneurDashboard, useBackgroundJob)
- Reusable components (PhaseFormWrapper, JobProgressIndicator)
- Phase 1 page skeleton updated to use real data

🚧 **Remaining (Similar pattern for all):**
- Phase 1: Company creation form
- Phases 2-6: Step-by-step forms for each phase
- Phase 7: AI review trigger + job polling
- Phase 8: Investor matching + interaction recording
- Phase 9: Deal lifecycle management

Each remaining phase follows the same pattern, so development is fast & consistent.

---

## Success Criteria

- ✅ All 40+ API calls return typed data
- ✅ No mock data in any component
- ✅ Loading spinners show during API calls
- ✅ Error messages display from backend
- ✅ Forms validate against phase requirements
- ✅ Navigation uses useRouter (no window.location.href)
- ✅ Background jobs poll correctly
- ✅ Emails sent on phase completion
- ✅ Full 9-phase funnel works end-to-end

---

## Timeline Estimate

- **API Layer**: ✅ Done (1 file)
- **Hooks**: ✅ Done (2 files)
- **Components**: ✅ Done (2 files)
- **Phase forms**: ~2-3 days (9 phases × 1-3 steps per phase, similar patterns)
- **Testing & polish**: ~1 day
- **Total**: ~3-4 days for complete frontend integration

Current state: API ready, UI skeleton in place. Forms just need to be wired up following the established pattern.
