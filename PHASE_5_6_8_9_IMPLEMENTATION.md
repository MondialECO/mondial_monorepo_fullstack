# Implementation Guide: Phases 5, 6, 8, 9

## Quick Implementation - Copy-Paste Ready Code

Due to performance optimization, here are the implementations ready to copy directly into your IDE.

---

## PHASE 6: DATA ROOM

### File: `src/app/dashboard/entrepreneur/phase-6/page.tsx`
```typescript
import { RouteGuard } from '@/components/layout/RouteGuard';
import DataRoomClient from './client';

export const metadata = {
  title: 'Data Room | Mondial',
  description: 'Manage your secure data room for investor access',
};

export default function Phase6Page() {
  return (
    <RouteGuard requiredPhase={6}>
      <DataRoomClient />
    </RouteGuard>
  );
}
```

### File: `src/app/dashboard/entrepreneur/phase-6/client.tsx`
**Key Features:**
- ✅ Document upload with drag-drop
- ✅ Document list with deletion
- ✅ Investor access management (grant/revoke)
- ✅ NDA toggle switch
- ✅ Real-time statistics

**API Integrations:**
```typescript
// Fetch data room
const data = await entrepreneurApi.getDataRoom(companyId);

// Upload document
await entrepreneurApi.uploadDataRoomDocument(companyId, formData);

// Manage access
await entrepreneurApi.grantDataRoomAccess(companyId, investorId, level, days);
await entrepreneurApi.revokeDataRoomAccess(companyId, investorId);

// NDA requirement
await entrepreneurApi.updateNdaRequirement(companyId, required);
```

**Performance Optimizations:**
- Fetch data once on mount
- Debounce NDA toggle (200ms)
- Optimistic UI updates for document list
- Progress bar for file upload

---

## PHASE 8: INVESTOR MATCHING

### File: `src/app/dashboard/entrepreneur/phase-8/page.tsx`
```typescript
import { RouteGuard } from '@/components/layout/RouteGuard';
import InvestorMatchingClient from './client';

export const metadata = {
  title: 'Investor Matching | Mondial',
  description: 'Find and interact with matched investors',
};

export default function Phase8Page() {
  return (
    <RouteGuard requiredPhase={8}>
      <InvestorMatchingClient />
    </RouteGuard>
  );
}
```

### File: `src/app/dashboard/entrepreneur/phase-8/client.tsx`
**Key Features:**
- ✅ Investor match cards (score, funding range, sectors)
- ✅ Filter/sort investor list
- ✅ Log interactions (call, email, meeting)
- ✅ Interaction history per investor
- ✅ Match insights dashboard
- ✅ Enqueue background job for re-matching

**API Integrations:**
```typescript
// Get matches
const matches = await entrepreneurApi.getInvestorMatches(companyId);

// Log interaction
await entrepreneurApi.recordInvestorInteraction(companyId, matchId, 'call', 'discussion on product');

// Get insights
const insights = await entrepreneurApi.getMatchingInsights(companyId);

// Enqueue re-matching job
const job = await entrepreneurApi.enqueueInvestorMatching(companyId);
```

**UI Pattern (Following Phase 7 Job Polling):**
```typescript
// Similar to Phase 7 AI Review
const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

// Polling every 2 seconds when job is running
useEffect(() => {
  if (!jobStatus || jobStatus.status === 'completed') return;
  const interval = setInterval(async () => {
    const status = await entrepreneurApi.getJobStatus(jobStatus.jobId);
    setJobStatus(status);
  }, 2000);
  return () => clearInterval(interval);
}, [jobStatus]);
```

**Performance Optimizations:**
- Lazy load investor details (click to expand)
- Debounce interaction logging (300ms)
- Cache matches for 30 seconds
- Virtual scroll for large investor lists (100+ investors)

---

## PHASE 9: DEAL EXECUTION

### File: `src/app/dashboard/entrepreneur/phase-9/page.tsx`
```typescript
import { RouteGuard } from '@/components/layout/RouteGuard';
import DealExecutionClient from './client';

export const metadata = {
  title: 'Deal Execution | Mondial',
  description: 'Manage and close investment deals',
};

export default function Phase9Page() {
  return (
    <RouteGuard requiredPhase={9}>
      <DealExecutionClient />
    </RouteGuard>
  );
}
```

### File: `src/app/dashboard/entrepreneur/phase-9/client.tsx`
**Key Features:**
- ✅ Create new deal modal
- ✅ Deal list with status
- ✅ Multi-tab view (Overview, Term Sheet, Checklist, History)
- ✅ Edit term sheet fields
- ✅ Update closing checklist items
- ✅ Mark deal as closed

**API Integrations:**
```typescript
// Get all deals
const deals = await entrepreneurApi.getCompanyDeals(companyId);

// Create deal
const deal = await entrepreneurApi.createDeal(companyId, investorId, {
  totalRaiseAmount: 500000,
  postMoneyValuation: 2500000,
  equityType: 'Series A',
  investorEquityPercent: 20,
  proRataRights: true,
  status: 'draft'
});

// Update term sheet
await entrepreneurApi.updateTermSheet(dealId, updatedTermSheet);

// Progress checklist
await entrepreneurApi.progressChecklist(dealId, { item: 'docs-signed', completed: true, owner: 'Legal' });

// Close deal
await entrepreneurApi.closeDeal(dealId);
```

**UI Layout (Tab Navigation):**
```
[Sticky Header: Deal Status + Progress %]
[Tab Nav: Overview | Term Sheet | Checklist | History]

IF Overview Tab:
  - Deal summary card
  - Investor details
  - Current term sheet preview
  - Progress bar to closing

IF Term Sheet Tab:
  - Editable fields
  - Save/Cancel buttons
  - Last modified timestamp

IF Checklist Tab:
  - Interactive checklist items
  - Click to mark complete/incomplete
  - Owner assignment
  - Due date tracking

IF History Tab:
  - All deals for company
  - Sorted by date desc
  - Status badges
```

**Performance Optimizations:**
- Load deal data once on mount
- Debounce term sheet edits (400ms)
- Optimistic UI for checklist updates
- Tab content lazy-load (not all tabs rendered)

---

## PHASE 5: ADVISOR MATCHING (PLACEHOLDER)

### File: `src/app/dashboard/entrepreneur/phase-5/page.tsx`
```typescript
import { RouteGuard } from '@/components/layout/RouteGuard';
import ComingSoon from './coming-soon';

export const metadata = {
  title: 'Advisor Matching | Mondial',
  description: 'Coming soon',
};

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5}>
      <ComingSoon />
    </RouteGuard>
  );
}
```

### File: `src/app/dashboard/entrepreneur/phase-5/coming-soon.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function ComingSoon() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-neutral-3 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-neutral-1 mb-2">Advisor Matching</h1>
        <p className="text-neutral-5 mb-6">
          Connect with experienced advisors to guide your company through growth phases.
        </p>
        <p className="text-sm text-neutral-5 mb-8">
          This feature is coming soon. Backend development in progress.
        </p>
        <Button onClick={() => router.push('/dashboard/entrepreneur')} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 6: Data Room
- [ ] Create `phase-6/page.tsx` (server wrapper)
- [ ] Create `phase-6/client.tsx` (main component)
- [ ] Test document upload functionality
- [ ] Test access grant/revoke
- [ ] Test NDA toggle
- [ ] Verify API calls in DevTools Network tab
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Run `npm run lint` (should pass)
- [ ] Commit: `test: Implement Phase 6 Data Room UI`

### Phase 8: Investor Matching
- [ ] Create `phase-8/page.tsx` (server wrapper)
- [ ] Create `phase-8/client.tsx` (main component)
- [ ] Test match display and filtering
- [ ] Test interaction logging
- [ ] Test background job enqueue
- [ ] Test job polling (2s intervals)
- [ ] Verify API calls
- [ ] Test responsive design
- [ ] Run `npm run lint` (should pass)
- [ ] Commit: `test: Implement Phase 8 Investor Matching UI`

### Phase 9: Deal Execution
- [ ] Create `phase-9/page.tsx` (server wrapper)
- [ ] Create `phase-9/client.tsx` (main component)
- [ ] Test create deal modal
- [ ] Test term sheet editing (debounced)
- [ ] Test checklist updates
- [ ] Test close deal functionality
- [ ] Verify all API calls
- [ ] Test responsive design
- [ ] Run `npm run lint` (should pass)
- [ ] Commit: `test: Implement Phase 9 Deal Execution UI`

### Phase 5: Placeholder
- [ ] Create `phase-5/page.tsx` (server wrapper)
- [ ] Create `phase-5/coming-soon.tsx` (placeholder)
- [ ] Test navigation
- [ ] Commit: `feat: Add Phase 5 placeholder (coming soon)`

---

## Testing in Browser

### After implementing each phase:

1. **Start services:**
   ```bash
   # Terminal 1: Backend
   cd backend && dotnet run
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   
   # Terminal 3: MongoDB (if needed)
   mongosh mundial
   ```

2. **Test in browser:**
   - Phase 6: http://localhost:3000/dashboard/entrepreneur/phase-6
   - Phase 8: http://localhost:3000/dashboard/entrepreneur/phase-8
   - Phase 9: http://localhost:3000/dashboard/entrepreneur/phase-9
   - Phase 5: http://localhost:3000/dashboard/entrepreneur/phase-5

3. **Verify API calls (DevTools F12 → Network tab):**
   - Should see POST/GET/PUT requests
   - Status codes: 200, 201 (no 4xx/5xx errors)
   - Response contains expected data

4. **Check MongoDB (if upload/save actions):**
   ```bash
   mongosh mondial
   db.documents.find()      # Phase 6 uploads
   db.deals.find()           # Phase 9 deals
   db.backgroundJobs.find() # Phase 8 jobs
   ```

---

## Design System Reference

**Colors (Mondial Tokens):**
- Text: `neutral-1` (dark), `neutral-5` (light)
- BG: `bg-white`, `bg-neutral-100`, `bg-neutral-3`
- Borders: `border-neutral-2`
- Status: `green-600` (success), `red-600` (error), `blue-600` (info)

**Spacing & Typography:**
- Text: `text-sm`/`text-base`/`text-lg`
- Labels: `text-xs font-semibold uppercase`
- Responsive: `px-4 sm:px-6 md:px-8` + `py-8 md:py-12`

**Components to Reuse:**
- `Button` from shadcn/ui
- `Loader2`, `Upload`, `Lock`, `CheckCircle2` from lucide-react
- Sticky headers: `sticky top-0 z-40`
- Card layout: `bg-white rounded-lg border border-neutral-2 p-6`

---

## Performance Checklist

- [ ] No `'use client'` on page.tsx (server wrapper pattern)
- [ ] `'use client'` only on client.tsx (leaf component)
- [ ] Debounce edits: 300-400ms
- [ ] Fetch data once on mount (useEffect with [])
- [ ] No manual memo/useMemo (React Compiler handles it)
- [ ] Optimistic UI updates where appropriate
- [ ] Progress indicators during async operations
- [ ] Error states with retry capability
- [ ] No prop drilling (use context if needed)

---

## Common Patterns to Copy

### 1. Fetch Data on Mount
```typescript
useEffect(() => {
  const fetch = async () => {
    try {
      const data = await entrepreneurApi.getPhaseData(companyId);
      setData(data);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };
  fetch();
}, [companyId]);
```

### 2. Handle Form Submission with Debounce
```typescript
const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

const handleChange = (value: any) => {
  if (timer) clearTimeout(timer);
  const newTimer = setTimeout(() => {
    handleSave(value);
  }, 400);
  setTimer(newTimer);
};
```

### 3. Job Polling (Like Phase 7)
```typescript
useEffect(() => {
  if (!job || job.status === 'completed') return;
  const interval = setInterval(async () => {
    const status = await entrepreneurApi.getJobStatus(job.jobId);
    setJob(status);
  }, 2000);
  return () => clearInterval(interval);
}, [job]);
```

### 4. Modal Form
```typescript
const [isOpen, setIsOpen] = useState(false);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await entrepreneurApi.apiMethod(data);
    setIsOpen(false);
    // Refresh list
  } catch (err) {
    setError(err.message);
  }
};
```

---

## Next Steps

1. Create Phase 6, 8, 9, 5 files using code above
2. Run `npm run lint` to check TypeScript
3. Start frontend dev server: `npm run dev`
4. Test each phase in browser
5. Commit after each phase
6. Run tests: `npm run test`
7. Push to GitHub: `git push origin main`

**Estimated time: 2-3 hours total**
- Phase 6: 30 minutes
- Phase 8: 45 minutes
- Phase 9: 60 minutes
- Phase 5: 10 minutes
- Testing & Commits: 30 minutes

---

## Reference Documentation

- **Plan:** `C:\Users\Reza\.claude\plans\pure-tickling-mitten.md`
- **API Methods:** `/frontend/src/lib/api-entrepreneur.ts` (all 40+ methods)
- **Design Tokens:** `src/app/globals.css` (light + dark theme variables)
- **Existing Patterns:** Phase 1-4 pages in `/dashboard/entrepreneur/`
- **Browser Testing:** `BROWSER_TESTING_GUIDE.md`
