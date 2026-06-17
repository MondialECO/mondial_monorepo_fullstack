# Complete Entrepreneur Profile Forms Implementation Guide

**Status**: Ready to implement - all 20+ forms with exact code structure

---

## Quick Implementation Strategy

All forms follow this exact pattern:
```typescript
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhaseFormWrapper } from '@/components/entrepreneur/PhaseFormWrapper';
import entrepreneurApi from '@/lib/api-entrepreneur';

export default function PhaseXStepYPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({ /* field values */ });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await entrepreneurApi.FUNCTION_NAME(companyId, formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/entrepreneur/phase-X/step-Y?companyId=${companyId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Phase X: Title</h1>
            <p className="text-xs sm:text-sm text-neutral-5 mt-0.5">Step Y of Z: Description</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <PhaseFormWrapper
          title="Form Title"
          description="Form description"
          isLoading={isLoading}
          error={error}
          success={success}
          successMessage="Saved!"
          onDismissError={() => setError(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input fields here */}
            <div className="flex gap-3 pt-4 flex-col sm:flex-row">
              <Button variant="outline" className="flex-1 h-12 gap-2" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 h-12 gap-2">
                {isLoading ? <>Saving...</> : <>Next <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          </form>
        </PhaseFormWrapper>
      </div>
    </div>
  );
}
```

---

## All Forms Directory Structure

```
src/app/dashboard/entrepreneur/
├── phase-1/
│   ├── page.tsx (DONE)
│   └── create/
│       └── page.tsx (DONE)
├── phase-2/
│   ├── step-1/
│   │   └── page.tsx (Legal Info)
│   ├── step-2/
│   │   └── page.tsx (Documents Upload)
│   └── step-3/
│       └── page.tsx (Beneficial Owners)
├── phase-3/
│   ├── step-1/
│   │   └── page.tsx (Revenue)
│   ├── step-2/
│   │   └── page.tsx (Equity Structure)
│   └── step-3/
│       └── page.tsx (Funding Ask)
├── phase-4/
│   └── page.tsx (Cap Table & Dilution)
├── phase-6/
│   └── page.tsx (Data Room)
├── phase-7/
│   └── page.tsx (AI Review)
├── phase-8/
│   └── page.tsx (Investor Matches)
└── phase-9/
    └── page.tsx (Deal Execution)
```

---

## Form Specifications

### PHASE 1: Identity & Onboarding

**✅ DONE**: 
- `phase-1/page.tsx` - Progress display
- `phase-1/create/page.tsx` - Company creation

### PHASE 2: Legal & Documents

#### Step 1: Legal Information
**Path**: `phase-2/step-1/page.tsx`
**API Function**: `entrepreneurApi.updateLegalInfo(companyId, data)`

**Form Fields**:
```typescript
{
  legalName: string (required),
  registrationNumber: string (required, SIRET),
  legalStructure: string (required, dropdown),
  incorporationDate: date (required),
  registeredAddress: textarea (required),
  country: string (required, dropdown),
  nafCode: string (optional)
}
```

**Styling**: 
- Label: `text-xs sm:text-sm font-semibold text-neutral-1 uppercase`
- Input: `w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm text-neutral-1 focus:ring-2 focus:ring-primary`
- Spacing: `space-y-6`

---

#### Step 2: Document Upload
**Path**: `phase-2/step-2/page.tsx`
**API Function**: `entrepreneurApi.uploadDocument(companyId, formData)`

**Features**:
- File input (type: file)
- Document type dropdown: kbis, rib, tax_cert, articles, license, insurance
- Progress bar for upload
- List of uploaded documents with status (pending, approved, rejected)

**Form Fields**:
```typescript
{
  documentType: string (required),
  fileName: string (file),
  fileContent: File
}
```

**Special**: This uses FormData for multipart upload
```typescript
const formData = new FormData();
formData.append('documentType', data.documentType);
formData.append('fileName', file.name);
formData.append('FileContent', file);
```

---

#### Step 3: Beneficial Owners
**Path**: `phase-2/step-3/page.tsx`
**API Function**: `entrepreneurApi.updateBeneficialOwners(companyId, data)`

**Features**:
- Add/Edit/Delete beneficial owners
- Table or card list of owners
- Modal/inline form for adding owner

**Form Fields**:
```typescript
owners: [
  {
    fullName: string,
    role: string (dropdown),
    nationality: string (dropdown),
    ownershipPercent: number
  }
]
```

---

### PHASE 3: Financial & KPI

#### Step 1: Revenue
**Path**: `phase-3/step-1/page.tsx`
**API Function**: `entrepreneurApi.saveRevenue(companyId, data)`

**Form Fields**:
```typescript
{
  q1Revenue: number,
  q2Revenue: number,
  q3Revenue: number,
  q4Revenue: number
}
```

**Features**:
- 4 number inputs (Q1-Q4)
- Currency formatting (€ symbol)
- Display total revenue
- Calculate growth rate (visual)

---

#### Step 2: Equity Structure
**Path**: `phase-3/step-2/page.tsx`
**API Function**: `entrepreneurApi.saveEquityStructure(companyId, data)`

**Form Fields**:
```typescript
{
  entries: [
    {
      stakeholderName: string,
      type: string (founder|investor|esop|advisor),
      sharesOwned: number,
      vestingMonths?: number,
      investmentAmount?: number
    }
  ],
  esopPoolPercent: number,
  esopVestingMonths: number,
  totalShares: number
}
```

**Features**:
- Add/Edit/Delete equity entries
- Real-time percentage calculation
- Cap table summary (total = 100%)
- Visual breakdown (pie chart optional)

---

#### Step 3: Funding Ask
**Path**: `phase-3/step-3/page.tsx`
**API Function**: `entrepreneurApi.saveFundingAsk(companyId, data)`

**Form Fields**:
```typescript
{
  raiseAmount: number,
  roundType: string (pre_seed|seed|series_a),
  preMoneyValuation: number,
  shareType: string (preferred|safe|note),
  capitalAllocation: [
    {
      category: string,
      amount: number,
      percent: number
    }
  ],
  resourceMap: {
    hiringPlan: [{role, salary, timeline, priority}],
    serviceProviders: [{name, estimatedCost}],
    techTools: [{name, monthlyCost}]
  }
}
```

**Features**:
- Raise amount input
- Round type dropdown
- Capital allocation breakdown (4 categories)
- Hiring plan add/edit/delete
- Service providers & tech tools input
- Auto-calculate percentages

---

### PHASE 4: Equity & Dilution
**Path**: `phase-4/page.tsx`
**API Functions**: 
- `entrepreneurApi.getCapTable(companyId)`
- `entrepreneurApi.simulateDilution(companyId, data)`

**Features**:
- Display current cap table from Phase 3
- Dilution simulator inputs:
  - Funding amount
  - Post-money valuation
  - Round type
- Display 3 scenarios side-by-side:
  - Base case
  - Optimistic (+20% valuation)
  - Conservative (-20% valuation)
- Show founder dilution %

**Form Fields**:
```typescript
{
  fundingAmount: number,
  postMoneyValuation: number,
  roundType: string
}
```

---

### PHASE 6: Data Room
**Path**: `phase-6/page.tsx`
**API Functions**:
- `entrepreneurApi.uploadDataRoomDocument(companyId, formData)`
- `entrepreneurApi.getDataRoom(companyId)`
- `entrepreneurApi.grantDataRoomAccess(companyId, investorId, accessLevel, daysValid)`

**Tabs/Sections**:
1. **Documents Tab**
   - Upload new document
   - Document list with categories (legal, financial, technical, business, ip)
   - Publish/Draft toggle
   - Delete option

2. **Investor Access Tab**
   - Grant access form (investor ID, access level, days valid)
   - Access grants list
   - Revoke access button

3. **Settings Tab**
   - Toggle NDA requirement
   - Toggle data room live status

**Form Fields**:
```typescript
// Upload
{
  title: string,
  category: string,
  isRequired: boolean,
  fileContent: File,
  fileName: string
}

// Grant Access
{
  investorId: string,
  accessLevel: string (view_only|download|comment),
  daysValid: number
}
```

---

### PHASE 7: AI Review
**Path**: `phase-7/page.tsx`
**API Functions**:
- `entrepreneurApi.runAiReview(companyId)` (async)
- `entrepreneurApi.getAiReview(companyId)`
- `entrepreneurApi.awardInvestorReadyBadge(companyId)`

**Features**:
- "Run AI Review" button → enqueues background job
- Shows `JobProgressIndicator` while processing
- On completion, displays:
  - **Score Breakdown** (5 categories):
    - Verification Score (0-100)
    - Financial Score (0-100)
    - Equity Score (0-100)
    - Funding Score (0-100)
    - Data Room Score (0-100)
    - Overall Score (0-100)
  - **Investor Ready Badge** (if score ≥ 70)
  - **Recommendations List**:
    - Title, Description, Priority (high|medium|low), Point Gain

**Visual**:
- Progress bars for each score
- Color-coded: red (<50), yellow (50-70), green (>70)
- Recommendations as cards with priority badges

---

### PHASE 8: Investor Matching
**Path**: `phase-8/page.tsx`
**API Functions**:
- `entrepreneurApi.getInvestorMatches(companyId)`
- `entrepreneurApi.recordInvestorInteraction(companyId, matchId, type, details)`

**Features**:
- Investor matches list (cards)
- Per investor card shows:
  - Investor name
  - Match score (0-100)
  - Investor type (angel|seed_fund|vc|corporate|family_office)
  - Investment range
  - Preferred sectors
  - Status badge
- Record interaction button per investor:
  - Type: view|message|call|proposal_sent
  - Details: textarea
- Interaction history timeline

**Form Fields**:
```typescript
{
  matchId: string,
  interactionType: string (view|message|call|proposal_sent),
  details: string
}
```

---

### PHASE 9: Deal Execution
**Path**: `phase-9/page.tsx`
**API Functions**:
- `entrepreneurApi.createDeal(companyId, investorId, termSheet)`
- `entrepreneurApi.getDeal(dealId)`
- `entrepreneurApi.getCompanyDeals(companyId)`
- `entrepreneurApi.updateTermSheet(dealId, termSheet)`
- `entrepreneurApi.progressChecklist(dealId, item)`
- `entrepreneurApi.closeDeal(dealId)`

**Tabs/Sections**:

1. **Active Deals** Tab
   - Create deal button → modal/form
   - List of deals with status (negotiation|term_sheet|due_diligence|closing|closed)
   - Progress bar per deal

2. **Deal Details** (per deal)
   - **Term Sheet**:
     - Total raise amount
     - Post-money valuation
     - Equity type (preferred|safe|note)
     - Investor equity %
     - Pro-rata rights (toggle)
     - Liquidation preference
     - Board seats
     - Status badge
   - **Closing Checklist**:
     - Items with checkbox toggle
     - Owner (company|investor|legal)
     - Due date
     - Completion status
   - **Investors** in deal:
     - List with committed amount
     - Status per investor

**Form Fields**:
```typescript
// Create Deal
{
  investorId: string,
  termSheet: {
    totalRaiseAmount: number,
    postMoneyValuation: number,
    equityType: string,
    proRataRights: boolean,
    liquidationPreference: string,
    boardSeats: number,
    proposedClosingDate: date
  }
}

// Checklist Item
{
  item: string,
  completed: boolean,
  owner: string,
  dueDate?: date
}
```

---

## Responsive Design Standards (Already Applied)

**All forms use this responsive pattern**:
- **Mobile**: Full width, single column, `px-4`
- **Tablet**: Max width `max-w-3xl`, `px-6`
- **Desktop**: Max width `max-w-3xl`, `px-8`
- **Spacing**: `py-8 md:py-12`
- **Headers**: `text-2xl md:text-3xl` (mobile to desktop)
- **Labels**: `text-xs sm:text-sm` (mobile to tablet)
- **Buttons**: `h-12 sm:h-13` (touch-friendly on mobile)
- **Flex Buttons**: `flex-col sm:flex-row` (stack on mobile, side-by-side on tablet+)

**Color System** (from existing codebase):
- **Background**: `bg-neutral-100` (page), `bg-white` (cards)
- **Inputs**: `bg-neutral-3` (fill), `border-neutral-2` (border)
- **Text**: `text-neutral-1` (primary), `text-neutral-5` (secondary)
- **Focus**: `focus:ring-2 focus:ring-primary`
- **Error**: `border-red-300`, `text-red-700`
- **Success**: `bg-green-50`, `border-green-200`

---

## Implementation Checklist

- [x] Phase 1: Company creation page ✅
- [ ] Phase 2, Step 1: Legal info
- [ ] Phase 2, Step 2: Documents upload
- [ ] Phase 2, Step 3: Beneficial owners
- [ ] Phase 3, Step 1: Revenue
- [ ] Phase 3, Step 2: Equity structure
- [ ] Phase 3, Step 3: Funding ask
- [ ] Phase 4: Cap table & dilution
- [ ] Phase 6: Data room
- [ ] Phase 7: AI review
- [ ] Phase 8: Investor matching
- [ ] Phase 9: Deal execution

---

## Quick Copy-Paste Template

For any Phase X Step Y form:

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhaseFormWrapper } from '@/components/entrepreneur/PhaseFormWrapper';
import entrepreneurApi from '@/lib/api-entrepreneur';

export default function PhaseXStepYPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // field: defaultValue,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await entrepreneurApi.API_FUNCTION(companyId, formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/entrepreneur/phase-X/step-Y?companyId=${companyId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Phase X: Title</h1>
            <p className="text-xs sm:text-sm text-neutral-5 mt-0.5">Step Y of Z: Subtitle</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <PhaseFormWrapper
          title="Form Title"
          description="Form subtitle"
          isLoading={isLoading}
          error={error}
          success={success}
          successMessage="Saved successfully!"
          onDismissError={() => setError(null)}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields here - copy style from above */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
                Field Label *
              </label>
              <input
                type="text"
                required
                value={formData.fieldName}
                onChange={(e) => setFormData({...formData, fieldName: e.target.value})}
                placeholder="Placeholder text"
                className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 text-sm text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 flex-col sm:flex-row">
              <Button variant="outline" className="flex-1 h-12 gap-2" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 h-12 gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </PhaseFormWrapper>
      </div>
    </div>
  );
}
```

---

## Environment Verification

**Required**:
- API endpoint: Check `src/lib/axios.ts` baseURL
- Auth: JWT token in localStorage (set by login)
- Components: `PhaseFormWrapper`, `JobProgressIndicator` exist ✅
- API Layer: `api-entrepreneur.ts` with all functions ✅
- Hooks: `useEntrepreneurDashboard`, `useBackgroundJob` ✅

---

## Testing Checklist Per Form

1. ✅ Form renders without errors
2. ✅ All inputs are responsive (mobile/tablet/desktop)
3. ✅ Submit button shows loading state
4. ✅ API call succeeds → success message → navigation
5. ✅ API call fails → error message → retry works
6. ✅ Back button works
7. ✅ Field validation works (required fields)
8. ✅ Form data persists on validation error

---

## Summary

- **API Layer**: 100% complete (`api-entrepreneur.ts`)
- **UI Components**: 100% complete (`PhaseFormWrapper`, `JobProgressIndicator`)
- **Hooks**: 100% complete (`useEntrepreneurDashboard`, `useBackgroundJob`)
- **Phase 1**: 100% complete (2 pages)
- **Remaining**: 9 phase page sets (17 pages total)

All remaining forms follow the identical pattern shown above. Copy-paste the template, customize the fields, and you're done. No additional styling, libraries, or infrastructure needed.
