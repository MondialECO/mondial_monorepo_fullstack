# Phase 9: Deal Execution — Complete System Design

## Business Goal
Enable founders to structure, negotiate, and close investment deals with matched investors. Track deal lifecycle from term sheet through closing, manage stakeholders, documents, and milestones.

---

## Architecture Overview

```
FOUNDER (Phase 9)
  ├─ View matched investor details + deal context
  ├─ Propose deal terms (equity %, valuation, round type)
  ├─ Upload/manage documents (term sheet, agreements, cap table)
  ├─ Track deal progress (pre-negotiation → negotiation → LOI → closing)
  ├─ Communicate with investor (messages, calls logged)
  ├─ Request legal review / compliance check
  └─ Mark deal closed / advance to Phase 10 (Post-Close)

DEAL ENGINE (Backend)
  ├─ Validate term sheet terms (equity % reasonable, valuation sensible)
  ├─ Track deal state transitions (state machine)
  ├─ Calculate cap table impact (dilution, new valuation post-round)
  ├─ Generate audit trail (who-what-when for compliance)
  ├─ Notify investor of incoming terms
  └─ Lock deal state (read-only after closing)

INVESTOR PROFILES (Database)
  ├─ Deal agreement terms (equity, valuation, round size)
  ├─ Document collection (term sheet, SPA, SAFE, advisor agreement)
  ├─ Stakeholder list (founder, lead, co-investors, advisors)
  ├─ Milestone tracking (legal review, board approval, funding transfer)
  └─ Communication log (messages, calls, decisions)
```

---

## Business Logic

### Deal Lifecycle

```
DEAL STATES:
  1. "initial" 
     → Founder just accepted investor match, no terms proposed
     
  2. "proposed"
     → Founder uploaded term sheet, awaiting investor feedback
     
  3. "negotiating"
     → Investor responded with counter-terms, back-and-forth
     
  4. "loi_signed"
     → Letter of Intent signed by both parties
     
  5. "legal_review"
     → Legal counsel reviewing full SPA (Share Purchase Agreement)
     
  6. "board_approved"
     → Company board approved deal terms
     
  7. "investor_approved"
     → Investor board/partners approved terms
     
  8. "closing"
     → Final docs signed, money transferred (optional in MVP)
     
  9. "closed"
     → Deal complete, locked (read-only)
     
  10. "abandoned"
      → Deal terminated by either party

STATE TRANSITIONS:
  initial → proposed (founder submits terms)
  proposed → negotiating (investor responds) OR proposed → loi_signed (quick agreement)
  negotiating → loi_signed (agreement reached)
  loi_signed → legal_review (legal requested)
  legal_review → board_approved OR legal_review → negotiating (legal issues found)
  board_approved → investor_approved
  investor_approved → closing
  closing → closed (transfer confirmed)
  * (any) → abandoned (either party)
```

### Term Sheet Validation Rules

```
EQUITY ALLOCATION:
  • Equity ≥ 5% AND ≤ 40% (startup typically)
  • Post-money valuation = investment amount / equity %
  • Must be ≤ 2x pre-money valuation (sanity check vs. dilution)

VALUATION:
  • Pre-money valuation ≥ $100k (seed min)
  • Post-money valuation ≥ investment amount (basic math)
  • Cannot exceed company's revenue × 5 (heuristic cap, no unicorn overnight)

ROUND TYPE:
  • seed | series_a | series_b | series_c | ...
  • Consistent with company stage & investor preference

INVESTOR ALLOCATION:
  • Lead investor gets majority of round OR minimum % threshold
  • Co-investors participate (tracking separately)
  • Advisor pool reserved (typically 1-2%)
```

### Cap Table Calculation

```
PRE-DEAL STATE (from Phase 2 Capitalization):
  • Founder holdings: X shares @ $Y pre-money valuation
  • Employee option pool: Z shares (typical 10-20% post-new round)
  • Existing investors (if any)
  
POST-DEAL (after new round):
  • New investor receives: investment_amount / post_money_valuation
  • All existing holders diluted proportionally
  • Employee pool updated (if increasing allocation)
  • New post-money valuation locked
  • Founder ownership % after dilution calculated
  
EXAMPLE:
  Pre-deal: 
    • Founder owns 100% of 1M shares = $10M pre-money valuation
    • Series A investor puts in $2M @ $10M pre-money
    • Post-money valuation = $10M + $2M = $12M
    • New investor gets: $2M / $12M = 16.67% ownership
    • Founder diluted to: 100% × (10M/12M) = 83.33%
```

### Milestone Tracking

```
CRITICAL MILESTONES (tracked with dates + status):
  1. Term Sheet Proposed (founder action)
  2. Term Sheet Signed (both parties action)
  3. Legal Review Initiated (legal counsel)
  4. Legal Review Complete (legal counsel)
  5. Board Approval - Company (founder/board action)
  6. Board Approval - Investor (investor action)
  7. Final Docs Signed (legal action)
  8. Funding Transfer (investor banking action)
  9. Closing Confirmed (founder confirmation)

STATUS FOR EACH:
  • pending = not started
  • in_progress = started but not complete
  • complete = done + verified
  • blocked = issue preventing progress (linked to comment)
```

---

## Database Models

### DealAgreement

```csharp
public class DealAgreement
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Foreign keys
    public string CompanyId { get; set; }
    public string InvestorMatchId { get; set; }  // Link back to Phase 8 match
    public string InvestorId { get; set; }       // Link to investor profile

    // Deal Identity
    public string DealName { get; set; }  // e.g., "Series A - Acme VC"
    public string RoundType { get; set; } // "series_a" | "seed" | ...

    // Deal State
    public string Status { get; set; }  // "initial" | "proposed" | "negotiating" | "loi_signed" | "legal_review" | "board_approved" | "investor_approved" | "closing" | "closed" | "abandoned"
    public DateTime? StatusUpdatedAt { get; set; }

    // Terms
    public TermSheet CurrentTerms { get; set; }  // Active terms (latest agreed or proposed)
    public List<TermSheet> TermHistory { get; set; } = new();  // All iterations

    // Documents
    public List<DealDocument> Documents { get; set; } = new();  // Term sheet, SPA, cap table, etc.

    // Stakeholders
    public List<DealStakeholder> Stakeholders { get; set; } = new();

    // Milestones
    public List<DealMilestone> Milestones { get; set; } = new();

    // Communication
    public List<DealMessage> Messages { get; set; } = new();  // Chat log
    public List<DealInteraction> Interactions { get; set; } = new();  // Calls, meetings

    // Cap Table Impact (calculated on term acceptance)
    public CapTableSnapshot PreDealCapTable { get; set; }
    public CapTableSnapshot PostDealCapTable { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
    public string AbandonmentReason { get; set; }
}

public class TermSheet
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Proposed by
    public string ProposedByUserId { get; set; }  // founder or investor
    public DateTime ProposedAt { get; set; } = DateTime.UtcNow;

    // Investment Details
    public decimal InvestmentAmountUsd { get; set; }
    public decimal EquityPercentage { get; set; }  // 0-100
    public decimal PreMoneyValuationUsd { get; set; }
    public decimal PostMoneyValuationUsd { get; set; }

    // Investor Protections
    public List<string> PreferredRights { get; set; } = new();  // "liquidation_preference" | "anti_dilution" | "board_seat" | "information_rights"
    public int BoardSeats { get; set; }  // 0 = no seat; 1 = observer; etc.

    // Additional Terms
    public string Notes { get; set; }  // Free-text negotiation notes
    public bool IsAccepted { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string AcceptedBy { get; set; }  // User ID
}

public class DealDocument
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Type { get; set; }  // "term_sheet" | "spa" | "cap_table" | "safe" | "advisor_agreement" | "board_minutes" | "corporate_docs"
    public string FileName { get; set; }
    public string FileUrl { get; set; }  // S3 or storage URL
    public long FileSizeBytes { get; set; }

    public string UploadedBy { get; set; }  // User ID
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public string Status { get; set; }  // "draft" | "pending_review" | "approved" | "rejected" | "executed"
    public string ReviewNotes { get; set; }  // If rejected, why?
}

public class DealStakeholder
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }  // "founder" | "legal_counsel" | "lead_investor" | "co_investor" | "advisor" | "board_member"

    public string Status { get; set; }  // "invited" | "accepted" | "declined" | "completed_action"
    public DateTime? StatusUpdatedAt { get; set; }
}

public class DealMilestone
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Name { get; set; }  // "Term Sheet Proposed", etc.
    public string Description { get; set; }

    public string Status { get; set; }  // "pending" | "in_progress" | "complete" | "blocked"
    public DateTime? TargetDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string BlockingIssue { get; set; }  // If blocked, description of blocker
}

public class DealMessage
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string FromUserId { get; set; }
    public string FromRole { get; set; }  // "founder" | "investor" | "legal" | "system"

    public string MessageType { get; set; }  // "text" | "status_update" | "document_shared" | "milestone_update"
    public string Content { get; set; }

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public List<string> ReadBy { get; set; } = new();  // User IDs who read it
}

public class DealInteraction
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Type { get; set; }  // "call" | "meeting" | "email" | "video_conference"
    public string Subject { get; set; }
    public string Notes { get; set; }

    public string InitiatedBy { get; set; }  // User ID
    public DateTime OccurredAt { get; set; }
    public int DurationMinutes { get; set; }

    public List<string> Attendees { get; set; } = new();  // User IDs
}

public class CapTableSnapshot
{
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public Dictionary<string, ShareholderEntry> Holdings { get; set; } = new();  // Key: "founder" | "investor_X" | "option_pool"
    public decimal TotalShares { get; set; }
    public decimal PreMoneyValuationUsd { get; set; }
    public decimal PostMoneyValuationUsd { get; set; }

    public DateTime SnapshotAt { get; set; } = DateTime.UtcNow;
}

public class ShareholderEntry
{
    public string Name { get; set; }
    public decimal Shares { get; set; }
    public decimal OwnershipPercentage { get; set; }  // 0-100
    public decimal ValueUsd { get; set; }  // shares × price per share
}
```

---

## API Endpoints

### Create Deal

**POST** `/api/companies/{companyId}/deals`

**Request:**
```json
{
  "investorMatchId": "xxxxxxx",
  "dealName": "Series A - Acme VC"
}
```

**Response:**
```json
{
  "dealId": "xxxxxxx",
  "companyId": "yyyyyyy",
  "investorMatchId": "zzzzzzz",
  "dealName": "Series A - Acme VC",
  "status": "initial",
  "createdAt": "2026-06-19T10:30:00Z"
}
```

### Propose Terms

**POST** `/api/companies/{companyId}/deals/{dealId}/propose-terms`

**Request:**
```json
{
  "investmentAmountUsd": 2000000,
  "equityPercentage": 16.67,
  "preMoneyValuationUsd": 10000000,
  "preferredRights": ["liquidation_preference", "board_seat"],
  "boardSeats": 1,
  "notes": "Standard Series A terms"
}
```

**Response:**
```json
{
  "dealId": "xxxxxxx",
  "status": "proposed",
  "currentTerms": {
    "investmentAmountUsd": 2000000,
    "equityPercentage": 16.67,
    "postMoneyValuationUsd": 12000000,
    "boardSeats": 1,
    "preMoneyValuationUsd": 10000000,
    "proposedAt": "2026-06-19T10:30:00Z"
  },
  "postDealCapTable": {
    "holdings": {
      "founder": { "shares": 833300, "ownershipPercentage": 83.33 },
      "investor": { "shares": 166700, "ownershipPercentage": 16.67 }
    },
    "totalShares": 1000000,
    "postMoneyValuationUsd": 12000000
  }
}
```

### Get Deal

**GET** `/api/companies/{companyId}/deals/{dealId}`

**Response:**
```json
{
  "dealId": "xxxxxxx",
  "companyId": "yyyyyyy",
  "dealName": "Series A - Acme VC",
  "status": "proposed",
  "investorName": "Acme VC Partners",
  "investmentAmount": 2000000,
  "equityPercentage": 16.67,
  "currentTerms": { ... },
  "termHistory": [ ... ],
  "documents": [ ... ],
  "stakeholders": [ ... ],
  "milestones": [ ... ],
  "messages": [ ... ],
  "createdAt": "2026-06-19T10:30:00Z"
}
```

### Update Deal Status

**PATCH** `/api/companies/{companyId}/deals/{dealId}/status`

**Request:**
```json
{
  "status": "loi_signed"
}
```

**Response:** Updated deal object

### Upload Document

**POST** `/api/companies/{companyId}/deals/{dealId}/documents`

**Request:** (multipart/form-data)
```
file: <binary>
type: "term_sheet"
```

**Response:**
```json
{
  "documentId": "xxxxxxx",
  "type": "term_sheet",
  "fileName": "Series A Term Sheet.pdf",
  "fileUrl": "s3://bucket/...",
  "status": "draft",
  "uploadedAt": "2026-06-19T10:30:00Z"
}
```

### Send Message

**POST** `/api/companies/{companyId}/deals/{dealId}/messages`

**Request:**
```json
{
  "messageType": "text",
  "content": "Investor has approved our counter-proposal"
}
```

**Response:**
```json
{
  "messageId": "xxxxxxx",
  "fromRole": "founder",
  "content": "Investor has approved our counter-proposal",
  "sentAt": "2026-06-19T10:30:00Z"
}
```

### List Deals

**GET** `/api/companies/{companyId}/deals`

**Query Params:**
- `status`: "initial" | "proposed" | "negotiating" | "loi_signed" | "closed"
- `limit`: 20
- `offset`: 0

**Response:**
```json
{
  "deals": [
    { deal1... },
    { deal2... }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

### Close Deal

**POST** `/api/companies/{companyId}/deals/{dealId}/close`

**Request:**
```json
{
  "fundingTransferConfirmed": true,
  "closingDate": "2026-06-20"
}
```

**Response:**
```json
{
  "dealId": "xxxxxxx",
  "status": "closed",
  "closedAt": "2026-06-20T10:30:00Z",
  "message": "Deal closed successfully. Cap table updated. Phase 10 available."
}
```

### Abandon Deal

**POST** `/api/companies/{companyId}/deals/{dealId}/abandon`

**Request:**
```json
{
  "reason": "Investor decided not to proceed"
}
```

**Response:**
```json
{
  "dealId": "xxxxxxx",
  "status": "abandoned",
  "abandonedAt": "2026-06-19T10:30:00Z",
  "reason": "Investor decided not to proceed"
}
```

---

## Frontend Types (TypeScript)

```typescript
// api-entrepreneur.ts

export interface DealAgreementResponse {
  dealId: string;
  companyId: string;
  investorMatchId: string;
  dealName: string;
  status: 'initial' | 'proposed' | 'negotiating' | 'loi_signed' | 'legal_review' | 'board_approved' | 'investor_approved' | 'closing' | 'closed' | 'abandoned';
  investorName?: string;
  investorType?: string;
  investmentAmount?: number;
  equityPercentage?: number;
  currentTerms?: TermSheetResponse;
  termHistory?: TermSheetResponse[];
  documents?: DealDocumentResponse[];
  stakeholders?: DealStakeholderResponse[];
  milestones?: DealMilestoneResponse[];
  messages?: DealMessageResponse[];
  postDealCapTable?: CapTableResponse;
  createdAt?: string;
  closedAt?: string;
}

export interface TermSheetResponse {
  id: string;
  investmentAmountUsd: number;
  equityPercentage: number;
  preMoneyValuationUsd: number;
  postMoneyValuationUsd: number;
  preferredRights: string[];
  boardSeats: number;
  notes?: string;
  isAccepted: boolean;
  proposedAt: string;
  acceptedAt?: string;
  proposedBy?: string;
}

export interface DealDocumentResponse {
  documentId: string;
  type: 'term_sheet' | 'spa' | 'cap_table' | 'safe' | 'advisor_agreement' | 'board_minutes';
  fileName: string;
  fileUrl: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'executed';
  uploadedAt: string;
  reviewNotes?: string;
}

export interface DealStakeholderResponse {
  stakeholderId: string;
  name: string;
  email: string;
  role: 'founder' | 'legal_counsel' | 'lead_investor' | 'co_investor' | 'advisor' | 'board_member';
  status: 'invited' | 'accepted' | 'declined' | 'completed_action';
}

export interface DealMilestoneResponse {
  milestoneId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'blocked';
  targetDate?: string;
  completedAt?: string;
  blockingIssue?: string;
}

export interface DealMessageResponse {
  messageId: string;
  fromRole: 'founder' | 'investor' | 'legal' | 'system';
  messageType: 'text' | 'status_update' | 'document_shared' | 'milestone_update';
  content: string;
  sentAt: string;
  readBy?: string[];
}

export interface CapTableResponse {
  holdings: Record<string, ShareholderEntryResponse>;
  totalShares: number;
  preMoneyValuationUsd: number;
  postMoneyValuationUsd: number;
}

export interface ShareholderEntryResponse {
  name: string;
  shares: number;
  ownershipPercentage: number;
  valueUsd: number;
}
```

---

## Validation Gates

| Gate | Trigger | Requirement |
|------|---------|---|
| **Create Deal** | Click "Start Deal" on investor match | Match score ≥ 40 AND match status = "accepted" |
| **Propose Terms** | Founder submits term sheet | Investment ≥ $100k AND equity 5-40% AND post-money ≥ investment amount |
| **Accept Terms** | Either party accepts term sheet | Current terms valid (see above) |
| **Close Deal** | Founder clicks "Close Deal" | Status ≥ "closing" AND all milestone statuses ≥ "in_progress" |
| **Advance to Phase 10** | Deal closed | At least ONE deal status = "closed" |

---

## Business Rules

### Term Sheet Arithmetic

```
POST-MONEY VALUATION = PRE-MONEY + INVESTMENT
equity % = INVESTMENT / POST-MONEY
post-money must be >= investment (basic sanity)
founder ownership after = (prev founder ownership) × (pre-money / post-money)
new investor ownership = equity %
```

### Cap Table Dilution

```
All existing shareholders diluted by the dilution factor:
  dilution_factor = pre_money / post_money
  new_owner_pct = old_owner_pct × dilution_factor
  
Example:
  Pre: Founder 100%, valuation $10M
  New round: $2M @ $10M pre (post = $12M)
  Dilution = $10M / $12M = 0.833
  Founder new ownership = 100% × 0.833 = 83.3%
  Investor new ownership = 1 - 0.833 = 16.7%
```

### Document Audit Trail

```
Every document:
  • Tracked by upload timestamp + uploader ID
  • Status workflow: draft → pending_review → approved (or rejected)
  • Legal review adds review_notes if rejected
  • Executed docs locked (no deletion)
  • CSV export of full history available
```

### State Machine Enforcement

```
Valid transitions only:
  initial → proposed
  proposed → negotiating (investor counter-proposes)
  proposed → loi_signed (accepted by both)
  negotiating → loi_signed (agreement)
  loi_signed → legal_review
  legal_review → negotiating (issues found) OR board_approved (cleared)
  board_approved → investor_approved
  investor_approved → closing
  closing → closed (or failed)
  * → abandoned (any state)

Enforce via database:
  • Only allow patch to valid next states
  • Return 409 Conflict if invalid transition attempted
```

---

## Performance Targets

- **Create deal:** ≤1s
- **Propose/accept terms:** ≤1s (validate arithmetic)
- **Upload document:** ≤5s (file storage I/O)
- **List deals:** ≤2s (100-1000 deals)
- **Calculate cap table:** ≤1s (Math only)

---

## Future Enhancements

- [ ] Investor message notifications (email, SMS)
- [ ] Integrated e-signature (DocuSign, HelloSign)
- [ ] Automated cap table generation (PDF export)
- [ ] Board resolution templates
- [ ] Legal review workflow (integrate with legal counsel portal)
- [ ] Equity calculator (live equity % as you adjust terms)
- [ ] Multiple investor round management (co-investors)
- [ ] Advisor equity grants tracker
- [ ] Post-close milestone tracking (revenue targets, product milestones)

---

## Success Metrics

- % of Phase 8 founders who initiate a deal
- Avg time from deal creation to close
- % of deals that close (conversion rate)
- % of deals with ≥1 counter-proposal (negotiation depth)
- Founder satisfaction with deal terms (post-close survey)

