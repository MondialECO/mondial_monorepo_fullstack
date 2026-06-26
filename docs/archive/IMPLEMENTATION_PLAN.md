# Full-Stack Entrepreneur Dashboard Implementation Plan

**Status**: Enterprise-Grade Design (BEFORE IMPLEMENTATION)

## Executive Summary

Build a complete 9-phase entrepreneur onboarding system with real backend integration, proper state management, and production-ready architecture. Skip paid credential integrations (SUMSUB, Pappers, DocuSign, Stripe, etc.) - user will inject credentials later.

---

## Phase Breakdown & Current Status

| Phase | Name | UI Status | Backend Status | API Required |
|-------|------|-----------|----------------|--------------|
| 1 | Identity & Onboarding | ✅ Implemented | ⚠️ Partial | Yes |
| 2 | Company Verification | ✅ Implemented (4 steps) | ⚠️ Partial | Yes |
| 3 | Financial & KPI | ✅ Implemented (3 steps) | ❌ Missing | Yes |
| 4 | Equity Structure | ✅ Implemented | ❌ Missing | Yes |
| 5 | Funding Analysis | ✅ Implemented | ❌ Missing | Yes |
| 6 | Data Room | ✅ Implemented | ❌ Missing | Yes |
| 7 | AI Expert Review | ✅ Implemented | ❌ Missing | Yes |
| 8 | Investor Matching | ✅ Implemented | ⚠️ Partial | Yes |
| 9 | Deal Execution | ✅ Implemented | ❌ Missing | Yes |

---

## Backend Architecture

### Current State
- **Framework**: ASP.NET Core 8 (.NET)
- **Database**: MongoDB (MongoDbContext exists)
- **Auth**: JWT + Claims-based (ApplicationUser exists)
- **Pattern**: Service layer + Controller pattern
- **Data Models**: Companies.cs with all nested structures exists ✅

### Missing Components
1. **MongoDbContext**: Missing `Companies` collection registration
2. **CompanyController**: Doesn't exist
3. **ICompanyService**: Doesn't exist
4. **DTOs**: Partial (CreateCompanyDto exists, need full CRUD)
5. **Business Logic**: Not implemented

---

## Database Schema (Already Defined - Just Need Collection)

```
Companies Collection (in MongoDbContext)
├── Phase 1: KycVerification (from ApplicationUser)
├── Phase 2: LegalInfo + Documents + BeneficialOwners
├── Phase 3: FinancialSummary + EquityStructure + FundingAsk
├── Phase 4: EquityStructure (detailed)
├── Phase 5: FundingAsk (detailed) + ResourceMap
├── Phase 6: DataRoomInfo + DataRoomDocument
├── Phase 7: AiReview + ScoreBreakdown + Recommendations
├── Phase 8: InvestorMatches (new - need to add)
└── Phase 9: DealExecution (new - need to add)
```

---

## Implementation Breakdown

### BACKEND (C#/.NET)

#### 1. Database & Collections
- [ ] Add `Companies` collection to MongoDbContext
- [ ] Add `InvestorMatches` model & collection
- [ ] Add `DealExecutions` model & collection
- [ ] Add `DocumentUploadRecords` collection (for phase 2/6)
- [ ] Add `PhaseMilestones` collection (audit trail)

**Models to Create:**
```
InvestorMatches
├── CompanyId (ObjectId)
├── InvestorId (Guid)
├── MatchScore (0-100)
├── Investment Preferences
├── Communication History
└── Status (interested, reviewing, matched, etc.)

DealExecution
├── CompanyId (ObjectId)
├── Investors (array)
├── TermSheet
├── ClosingChecklist
├── Milestones
└── Status Tracking
```

#### 2. Services (Interface + Implementation)
**ICompanyService:**
```
// Phase Flow
- GetCurrentPhaseAsync(userId)
- AdvancePhaseAsync(userId, phaseNumber, data)
- GetPhaseProgressAsync(userId)

// Phase 1: Identity
- (Handled by Auth controller via KYC)

// Phase 2: Company Info
- CreateCompanyAsync(userId, companyDto)
- UpdateLegalInfoAsync(companyId, legalInfo)
- UploadDocumentAsync(companyId, docType, file)
- GetDocumentStatusAsync(companyId)
- UpdateBeneficialOwnersAsync(companyId, owners)

// Phase 3: Financial
- SaveRevenueDataAsync(companyId, quarterly)
- CalculateValuationAsync(companyId) → calls valuation engine
- SaveEquityStructureAsync(companyId, capTable)
- SaveFundingAskAsync(companyId, fundingAsk)
- GetFinancialSummaryAsync(companyId)

// Phase 4-5: (Extension of Phase 3)
- GetCapTableAsync(companyId)
- SimulateDilutionAsync(companyId, scenarios)

// Phase 6: Data Room
- UploadDataRoomDocAsync(companyId, document)
- UpdateNdaSettingsAsync(companyId, settings)
- GrantAccessAsync(companyId, investorId, accessLevel)
- RevokeAccessAsync(companyId, investorId)

// Phase 7: AI Review
- RunAiReviewAsync(companyId) → async job
- GetAiReviewScoreAsync(companyId)
- GetRecommendationsAsync(companyId)
- AwardInvestorReadyBadgeAsync(companyId)

// Phase 8: Matching
- GetMatchedInvestorsAsync(companyId)
- RecordInvestorInteractionAsync(companyId, investorId, action)
- GetMatchingInsightsAsync(companyId)

// Phase 9: Deal
- CreateDealAsync(companyId, investorId, terms)
- UpdateTermsAsync(dealId, newTerms)
- ProgressChecklistAsync(dealId, itemId)
- CloseDealAsync(dealId)
```

#### 3. Controllers

**CompanyController** (NEW)
```
[Route("api/companies")]
[Authorize]
public class CompanyController : ControllerBase
{
    // Phase Flow
    [HttpGet("{companyId}/phase")]
    [HttpPost("{companyId}/phase/{phaseNumber}")]
    
    // Phase 2: Legal & Documents
    [HttpPost("{companyId}/legal")]
    [HttpPost("{companyId}/documents")]
    [HttpGet("{companyId}/documents")]
    [HttpPost("{companyId}/beneficial-owners")]
    
    // Phase 3: Financial
    [HttpPost("{companyId}/revenue")]
    [HttpPost("{companyId}/equity-structure")]
    [HttpPost("{companyId}/funding-ask")]
    [HttpGet("{companyId}/financial-summary")]
    
    // Phase 6: Data Room
    [HttpPost("{companyId}/dataroom")]
    [HttpPost("{companyId}/dataroom/access")]
    
    // Phase 7: AI Review
    [HttpPost("{companyId}/ai-review")]
    [HttpGet("{companyId}/ai-review")]
    
    // Phase 8-9: Investor & Deal
    [HttpGet("{companyId}/investor-matches")]
    [HttpPost("{companyId}/deals")]
    [HttpGet("{companyId}/deals/{dealId}")]
}
```

**InvestorMatchingController** (NEW)
```
[Route("api/matching")]
[Authorize]
public class InvestorMatchingController
{
    [HttpGet("for-company/{companyId}")]
    [HttpPost("{matchId}/interest")]
    [HttpPost("{matchId}/message")]
    [HttpGet("{matchId}/conversation")]
}
```

#### 4. DTOs (Request/Response Models)

**Needed:**
```
// Phase 2
- UpdateLegalInfoRequest
- UploadDocumentRequest
- UpdateBeneficialOwnersRequest
- DocumentStatusResponse

// Phase 3
- SaveRevenueRequest
- EquityStructureRequest
- FundingAskRequest
- FinancialSummaryResponse

// Phase 6
- UploadDataRoomDocRequest
- AccessControlRequest
- DataRoomStatusResponse

// Phase 7
- AiReviewResponse
- RecommendationResponse

// Phase 8-9
- InvestorMatchResponse
- DealCreationRequest
- ChecklistItemUpdateRequest
- DealStatusResponse
```

#### 5. Business Logic (Core Services)

**ValuationEngine** (Called by Phase 3)
```
public interface IValuationEngine
{
    Task<ValuationResult> CalculateValuationAsync(
        double totalRevenue,
        double growthRate,
        string industrySegment,
        int runwayMonths
    );
}
```

**CapTableCalculator** (Phase 4)
```
public interface ICapTableCalculator
{
    DilutionResult SimulateDilution(
        List<EquityEntry> currentCap,
        double raiseAmount,
        double postMoneyValuation
    );
}
```

**InvestorMatcher** (Phase 8)
```
public interface IInvestorMatcher
{
    Task<List<InvestorMatch>> FindMatchesAsync(
        companies company,
        List<investor> investorPool
    );
}
```

**AiReviewEngine** (Phase 7)
```
public interface IAiReviewEngine
{
    Task<AiReviewResult> RunReviewAsync(companies company);
}
```

#### 6. Document Management
- Add S3/Cloud storage abstraction (currently has SaveFile)
- Handle file upload validation (size, type)
- Generate presigned URLs for downloads
- Track document versioning

---

### FRONTEND (React/Next.js)

#### 1. State Management Updates

**Hooks:**
```typescript
// hooks/useEntrepreneurProgress.ts (ALREADY EXISTS - just needs API integration)
- Replace mock data with API calls
- Add mutation functions for phase updates

// hooks/useCompanyData.ts (NEW)
- Fetch company info
- Manage form state
- Track unsaved changes

// hooks/usePhaseFlow.ts (NEW)
- Handle phase progression
- Validate step completion
- Track progress
```

**API Integration:**
```typescript
// lib/api/entrepreneur.ts (NEW)
export const entrepreneurApi = {
  // Phase progression
  getCurrentPhase: (companyId) => api.get(`/companies/${companyId}/phase`),
  advancePhase: (companyId, phaseNum, data) => api.post(`/companies/${companyId}/phase/${phaseNum}`, data),
  
  // Phase 2: Legal
  updateLegalInfo: (companyId, data) => api.post(`/companies/${companyId}/legal`, data),
  uploadDocument: (companyId, data) => api.post(`/companies/${companyId}/documents`, data),
  
  // Phase 3: Financial
  saveRevenue: (companyId, data) => api.post(`/companies/${companyId}/revenue`, data),
  saveEquity: (companyId, data) => api.post(`/companies/${companyId}/equity-structure`, data),
  saveFundingAsk: (companyId, data) => api.post(`/companies/${companyId}/funding-ask`, data),
  
  // ... etc
};
```

#### 2. Form Components Updates

Replace `window.location.href` with proper navigation:
```typescript
// From:
window.location.href = '/dashboard/entrepreneur/phase-2/step-1';

// To:
import { useRouter } from 'next/navigation';
const router = useRouter();
await savePhaseData(); // API call
router.push('/dashboard/entrepreneur/phase-2/step-1');
```

#### 3. Data Fetching

All data-fetching components need to use:
```typescript
const { data: phaseData, isLoading, error } = useQuery({
  queryKey: ['entrepreneur', 'phase', companyId],
  queryFn: () => entrepreneurApi.getCurrentPhase(companyId),
});
```

---

## Implementation Sequence (Recommended Order)

### Phase A: Foundation (Week 1)
- [ ] Add Companies collection to MongoDbContext
- [ ] Create ICompanyService interface
- [ ] Implement CompanyService basic CRUD
- [ ] Create CompanyController with all endpoints stubbed
- [ ] Create all necessary DTOs

### Phase B: Core Business Logic (Week 2)
- [ ] Implement Phase 2 business logic (legal info + docs)
- [ ] Implement Phase 3 business logic (revenue + equity + funding)
- [ ] Create ValuationEngine
- [ ] Create CapTableCalculator

### Phase C: Advanced Features (Week 3)
- [ ] Implement InvestorMatcher
- [ ] Implement AiReviewEngine (placeholder - will integrate with OpenAI later)
- [ ] Implement Phase 6-9 logic

### Phase D: Frontend Integration (Week 4)
- [ ] Update useEntrepreneurProgress hook
- [ ] Create entrepreneur API integration layer
- [ ] Replace mock data with API calls in all 9 phases
- [ ] Replace window.location.href with proper routing
- [ ] Add loading states and error handling
- [ ] Add form validation with backend sync

### Phase E: Testing & Polish (Week 5)
- [ ] Unit tests for services
- [ ] Integration tests for API flows
- [ ] E2E tests for complete phase progression
- [ ] Performance optimization
- [ ] Error handling edge cases

---

## Error Handling & Validation Strategy

### Backend
```csharp
public class CompanyValidationException : Exception { }

// In service methods:
if (!await ValidatePhaseCompletionAsync(userId, previousPhase))
    throw new CompanyValidationException("Cannot advance: previous phase incomplete");

// Return standardized ApiResponse
return ApiResponse.Success(data, "Phase updated successfully");
return ApiResponse.Failure("Validation error", 400);
```

### Frontend
```typescript
// Centralized error handling
const handlePhaseError = (error) => {
  if (error.response?.status === 400) {
    // Validation error - show field-level errors
    setValidationErrors(error.response.data.errors);
  } else if (error.response?.status === 409) {
    // Conflict - data changed elsewhere
    showToast.error("Another user updated this. Refreshing...");
    refetch();
  }
};
```

---

## Enterprise Requirements (Non-Functional)

### Security
- [ ] All endpoints require authentication (Bearer token)
- [ ] Row-level security: users can only see their own companies
- [ ] Rate limiting on file uploads
- [ ] Audit logging for sensitive changes (phase progression, document upload)

### Performance
- [ ] Cache phase progress (30s TTL)
- [ ] Pagination for investor lists (Phase 8)
- [ ] Async processing for AI review (background job)
- [ ] Document upload handled via multipart/form-data with progress tracking

### Scalability
- [ ] Async methods for long-running operations
- [ ] Background jobs for AI review, valuation calculations
- [ ] Connection pooling for MongoDB
- [ ] Stateless services (no session affinity)

### Monitoring
- [ ] Log all phase transitions
- [ ] Track API response times
- [ ] Monitor failed uploads
- [ ] Track incomplete phases (for user research)

---

## Paid Credentials (To Be Injected by User)

These require external APIs - user will provide credentials:

1. **SUMSUB** (Phase 1: KYC)
   - ApplicantId generation
   - Face verification

2. **Pappers** (Phase 2: Company Verification)
   - SIRET validation
   - Company registry lookup

3. **DocuSign** (Phase 2: Document Management)
   - Digital signature
   - Document audit trail

4. **Stripe** (Phase 9: Payment)
   - Fund transfer
   - Escrow (if needed)

5. **OpenAI** (Phase 7: AI Review)
   - Pitch analysis
   - Recommendation generation

**Placeholder Strategy:**
```csharp
// In production, inject actual service
public interface IKycService
{
    Task<KycResult> VerifyAsync(KycData data);
}

public class MockKycService : IKycService
{
    public async Task<KycResult> VerifyAsync(KycData data)
    {
        // Mock implementation
        return new KycResult { Status = "verified" };
    }
}

// User will swap MockKycService with SumsubKycService in DI
```

---

## Database Indexes (MongoDB)

```javascript
db.companies.createIndex({ "OwnerId": 1 });
db.companies.createIndex({ "VerificationStatus": 1 });
db.companies.createIndex({ "Phase.Current": 1 });
db.companies.createIndex({ "CreatedAt": -1 });
db.investormatches.createIndex({ "CompanyId": 1, "InvestorId": 1 }, { unique: true });
```

---

## API Response Format (Standardized)

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "timestamp": "2024-05-20T12:00:00Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "email": ["Email is required"] }
  },
  "timestamp": "2024-05-20T12:00:00Z"
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Phase progression data loss | Enable transaction support, add soft deletes |
| Concurrent phase updates | Optimistic concurrency (version field) |
| Large document uploads | Chunked upload, resume capability, virus scan |
| AI review cost (Phase 7) | Rate limiting, caching results, batch processing |
| Investor data privacy | Encryption at rest, row-level security |

---

## Success Criteria

- ✅ All 9 phases fully functional with real data flow
- ✅ 100% backend coverage (create, read, update, delete for each phase)
- ✅ Frontend properly integrated with backend APIs
- ✅ Error handling graceful with user-friendly messages
- ✅ Full audit trail of phase progression
- ✅ Performance: API response < 200ms, UI renders < 1s
- ✅ Security: All endpoints authenticated, row-level security enforced
- ✅ Ready for credential injection without code changes

---

## Questions for User

1. **Background Jobs**: Should we use Hangfire/Quartz for async processing (AI review, valuation)?
2. **File Storage**: Cloud storage for documents (S3, Azure Blob, or local with backup)?
3. **Notifications**: Real-time (WebSocket via SignalR) or polling for phase updates?
4. **Analytics**: Track user drop-off per phase? (helps identify friction)
5. **Timeline**: Can we prioritize certain phases first or build all in parallel?

