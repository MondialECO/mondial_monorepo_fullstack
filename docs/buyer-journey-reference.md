# Mondial.eco — Buyer Journey Complete Reference

**Purpose:** Order থেকে payment complete পর্যন্ত পুরো system কীভাবে কাজ
করে — এক জন buyer (Creator/Entrepreneur/Investor role-এ থাকা)
হিসেবে step-by-step।

**Traced from actual code:** `WorkroomService.cs`, `LeadsService.cs`,
frontend order flow + engagement components (post commit `7bd11ca`,
2026-08-02)।

**পুরো journey ২টা major branch-এ যায়:**
- **Auto-accept path** — instant order enabled, সব confirmation-এ pass
- **Manual approval path** — provider এর approval দরকার

দুইটাই merge হয়ে একই workroom flow-এ ঢোকে, তাই phases 3+ common।

---

## Phase 0 — Prerequisites

Buyer-এর account থাকতে হবে (Creator/Entrepreneur/Investor role,
Service Provider না)। Onboarding phase কমপক্ষে 1 হতে হবে।

Buyer login-এ থাকা অবস্থায় dashboard-এ ঢোকে।

---

## Phase 1 — Marketplace browse

**URL:** `/marketplace/services`

**Buyer কী দেখে:**
- Left sidebar-এ filter (Category, Price range, Delivery time)
- 3-column grid-এ services
- প্রতিটা card-এ: cover image, provider name (verified chip সহ),
  service title, category, "From €X · N days"
- Top-এ search bar
- URL-এ deep-link support (`?category=Design&priceRange=Under $500`)

**Buyer কী করে:** একটা service card-এ click করে।

**Screen change:** listing detail page-এ redirect।

---

## Phase 2 — Listing detail + order start

**URL:** `/marketplace/services/[listingId]`

**Buyer কী দেখে:**
- Header: category chip + service title + provider row (avatar,
  verified badge)
- Left column:
  - MediaCarousel (cover video/gallery)
  - Tags
  - "About this service" (description)
  - **Compare packages table** (Basic/Standard/Premium side-by-side,
    ✓/✗ per feature, Choose button per column)
  - FAQ accordion
  - "About the provider" card (bottom)
- Right sticky column:
  - Package selector (Basic/Standard/Premium tabs, Standard-এ
    "Recommended" pill)
  - Price + delivery + revisions
  - "What's included" list (✓ included green, ✗ excluded muted)
  - Add-ons checkboxes (checkbox + name + `+€X`)
  - Total row
  - **"Continue (€X)" button** (this is the order start)
  - "Message provider" button (stub, chat not built yet)

**Buyer কী করে:**
1. Tier select (Basic/Standard/Premium)
2. Optional add-ons check
3. "Continue (€X)" click

**Backend action:** কিছু না এখনো — frontend router push।

**URL change:** `/marketplace/services/[listingId]/order?step=1&packageId={pkgId}&addons=addon1,addon2`

---

## Phase 3 — Order wizard 3-step (buyer side)

**URL pattern:** `/marketplace/services/[listingId]/order?step={1|2|3}&packageId=…&addons=…`

3-step wizard, sticky right-column order summary throughout।

### Step 1 — Review

**Buyer কী দেখে:**
- Left card: "Review your order"
  - Package title, description
  - Selected add-ons list
  - Included features (green checks)
  - "⏱ Estimated delivery: N days"
- Right sticky summary: cover thumbnail, provider name, service
  title, tier badge, line items (base + add-ons), Total, "Provider
  receives €X after 12% Mondial platform fee" info box
- Footer: "Continue to requirements" button

**Buyer কী করে:** Continue click।

### Step 2 — Requirements

**Buyer কী দেখে:**
- Left card: "Provider requirements — Answer the questions..."
- Fields from `pkg.requirementsTemplate` (text/number/date/boolean/
  choice)
- Required fields-এ red asterisk
- Footer: Back + "Continue to confirmation" (disabled until required
  fields filled)

**যদি package-এ কোনো requirement না থাকে:** "No requirements needed
for this package" message + Back + Continue।

**Buyer কী করে:** required fields fill + Continue।

### Step 3 — Confirm + place order

**Buyer কী দেখে:**
- Left card: "Place your order"
- 3 checkboxes:
  1. "I have reviewed the final summary" (reviewedSummary)
  2. "I confirm this order" (explicitlyConfirmed)
  3. "No outstanding compliance issues" (noComplianceHold)
- Payment simulation notice: "This is a development environment.
  No real payment is processed; escrow authorization is simulated."
- Right summary: same as Step 1
- Footer: Back + "Place order · €X" (disabled until all 3 checked)

**Buyer কী করে:** ৩টা checkbox check + "Place order · €X" click।

---

## Phase 4 — Backend PurchasePackageAsync (decision moment)

**Endpoint:** `POST /api/leads/package-purchases`

**Backend কী করে (LeadsService.cs:290):**

1. Package + listing fetch করে
2. Provider + client verify করে (ServiceProviderProfile থাকতে হবে
   provider-এর)
3. Selected add-ons snapshot নেয়
4. Requirements complete কিনা check করে
5. **10টা failure condition check করে:**
   - Listing status = Published?
   - Package status = Published?
   - InstantOrderEnabled && !ManualApprovalRequired?
   - Provider verified + available?
   - MaximumActiveOrders ছুঁয়েনি?
   - Client onboarding phase ≥ 1?
   - Requirements complete?
   - PaymentMethodVerified?
   - ExplicitlyConfirmed?
   - EscrowAuthorized?
   - !ComplianceHold?
   - FinalSummaryShown?

**Decision:**
- **`failures.Count == 0` → `auto = true`** → Path A (Auto-accept)
- **`failures.Count > 0` → `auto = false`** → Path B (Manual approval)

**Both paths-এ Proposal record create হয়:**
- `Status = Accepted` (auto) বা `Submitted` (manual)
- `AcceptanceMode = RuleBasedInstantOrder` (auto) বা
  `ManualClientAcceptance` (manual)
- `EscrowStatus = Authorized` (auto) বা `AuthorizationPending`
  (manual)
- `PurchaseSnapshot` জমা হয় (immutable record of purchase context)

**Auto path-এ:** Background job enqueue —
`WorkroomConversionJob.ConvertAsync(proposalId)`।
**Manual path-এ:** provider-কে notification — "Provider approval
required"।

---

## Phase 5A — Auto-accept path (buyer polling)

**Buyer কী দেখে:**
- Result panel: "Order accepted" (green CheckCircle icon)
- "Your payment is authorised in escrow and the provider has been
  notified. We're setting up your workroom..."
- Small spinner: "Setting up your workroom..."
- Polling starts (`useProposalConversionPoll`, 15 attempts, ~30 sec)

**Backend background job (`WorkroomService.ConvertProposalAsync`):**

1. Proposal check করে: Status=Accepted, ConversionStatus=AwaitingModule4
2. Milestone plan থেকে WorkroomMilestone list বানায় (single default
   milestone if plan empty)
3. Contract create করে (ContractStatus=Draft)
4. WorkroomEngagement create করে:
   - Status: `ContractPending`
   - EscrowStatus: `NotFunded`
   - Milestones: Status=`FundingRequired`, EscrowStatus=`NotFunded`
5. Transaction-safe insert সব records-এর
6. Proposal update: `Status=ConvertedToProject`, `ConversionStatus=Converted`
7. Notify:
   - Provider: "Workroom created" (contract confirmation-এর জন্য
     ready)
   - Client: "Contract ready" (confirm-এর জন্য)

**Frontend polling-এ:** engagement resolve হলে redirect
`/dashboard/{role}/engagements/{engagementId}`।

**যদি polling timeout (~30 sec):** warning panel — "Your order is
being set up. You can check progress in My Engagements." + button
to engagements page।

---

## Phase 5B — Manual approval path

**Buyer কী দেখে:**
- Result panel: "Awaiting provider approval" (Clock icon, muted
  tone)
- FailedConditions list দেখানো হয় verbatim (backend সরাসরি strings
  send করে):
  - "Instant order is disabled"
  - "Provider is unavailable or at capacity"
  - "Package capacity is full"
  - ইত্যাদি
- Button: "View my orders" → engagements page

**Provider পক্ষ থেকে কী হবে:**
- Provider dashboard-এ notification: "Provider approval required"
- Provider Leads page-এ proposal দেখে, review করে
- Provider `LeadsService.AcceptAsync(clientId, proposalId, r)` call
  করে (via approve button)
- Backend proposal update: `Status=Accepted`, background job enqueue

**তারপর same as Phase 5A** — buyer এসে check করলে "Pending your
action" section-এ proposal দেখবে (M2b feature), "Complete your
order" click করবে, দুই checkbox confirm, polling → engagement
redirect।

---

## Phase 6 — Workroom entry (contract sign)

**URL:** `/dashboard/{role}/engagements/{engagementId}` (client-side
buyer view)

**Buyer কী দেখে:**
- Header: back link + service title (h1) + status chip
  (ContractPending)
- Left column:
  - Contract panel: contract details (terms, price, delivery,
    revisions), **"Sign contract" button**
  - Milestones panel: milestone cards (Status=FundingRequired,
    Fund button visible কিন্তু disabled)
  - Files & deliverables panel
  - Review panel (Completed engagement-এই সক্রিয়, এখন empty)
- Right sticky summary: Contract value, Escrow (NotFunded), Started
  date (null এখন), Expected end, Quick actions (Pause/Complete —
  Complete disabled কারণ contract sign হয়নি)

**Buyer কী করে:** "Sign contract" click → confirmation dialog →
approve।

**Backend (`SignContractAsync`, WorkroomService.cs:195):**
- Contract status update (ClientSigned/ProviderSigned/Signed)
- যদি **দুই party sign করে থাকে**, Contract status = `Signed`
- Engagement status: still `ContractPending` until এই moment,
  তারপর `EscrowPending`-এ যায় (কোন milestone fund হয়নি এখনো)

**Provider পক্ষ থেকে সমান্তরাল কাজ:** SP Workroom-এ same contract
sign করে (SP UI different, provider perspective)।

**Both signed হলে:**
- Contract Status = Signed
- Engagement Status = EscrowPending
- Fund button এখন enabled buyer-এর side-এ

---

## Phase 7 — Fund first milestone (money enters escrow)

**Buyer কী দেখে:**
- Milestone card-এ "Fund escrow" button now enabled
- Amount: €X, Escrow: NotFunded
- Button click করলে confirmation dialog

**Buyer কী করে:** "Fund escrow" → confirm dialog → submit।

**Backend (`FundMilestoneAsync`, WorkroomService.cs:216):**
1. Precondition check করে:
   - Contract Status = Signed
   - Milestone Status = FundingRequired
2. `PaymentOperation` record বানায় (idempotency key:
   `escrow:{milestoneId}`)
3. **Gateway call:** `_gateway.AuthorizeEscrowAsync(key, amount,
   currency)` — এই মুহূর্তে StubPaymentGateway; ভবিষ্যতে Stripe
4. Gateway success হলে stored reference persist করে
   (`PaymentOperation.GatewayReference`)
5. Transaction-safe update:
   - Milestone: `EscrowStatus=Funded`, `Status=Funded`
   - Engagement: `EscrowStatus=Funded`, `Status=ReadyToStart`
   - **FinancialTransaction record** create: `Type=EscrowFunded`,
     `Status=Completed`, gross=milestone amount
6. Notify provider: "Milestone funded"

**Buyer পক্ষে UI update হয় polling (30 sec) বা refresh-এ:**
- Milestone status chip: "Funded"
- Engagement status: "Ready to Start"
- Fund button gone, waiting for provider to activate

---

## Phase 8 — Provider execution (buyer waits, monitors)

এই phase-এ buyer শুধু status change দেখে; direct action করার কিছু
নেই। কিন্তু বোঝা দরকার backend-এ কী হচ্ছে।

### 8.1 — Provider activates milestone

**SP action (`ActivateMilestoneAsync`, WorkroomService.cs:256):**
- Contract=Signed + Escrow=Funded verify
- Previous milestone Paid/Approved check (parallel না হলে)
- Milestone: `Status=Active`, StartDate=now, DueDate computed
- Engagement: `Status=Active`, first activation হলে
  ActiveOrderCount +1 provider-এর জন্য

**Buyer এই মুহূর্তে দেখে:**
- Milestone chip: "In progress" (Active)
- Started date populate হয়
- Expected end date visible

### 8.2 — Provider submits deliverable

**SP action (`SubmitDeliverableAsync`, WorkroomService.cs:281):**
- Files scanned + Ready, ৪টা confirmation checkbox required
- `Deliverable` record create with version number
- Previous deliverable (revision case-এ) → Superseded
- Milestone: `Status=ClientReviewing` (first) বা `Resubmitted`
  (revision cycle)
- **`SubmittedAt`, `ReviewWindowEndsAt`, `AutoReleaseAt` set**
  (এই মুহূর্তে 7-day auto-release clock শুরু)
- Engagement: `Status=MilestoneReview`

**Buyer এই মুহূর্তে দেখে (30s polling বা refresh):**
- Milestone chip: "Client reviewing"
- Files & deliverables panel-এ new delivery visible
- Milestone card-এ ৩টা action button:
  - **"Approve & release payment"** (primary blue)
  - "Request revision" (outline)
  - "Open dispute" (destructive outline)

---

## Phase 9 — Buyer approval decision (3 branches)

এই সবচেয়ে important decision point। Buyer ৩টা path বেছে নিতে পারে।

### 9.1 — Approve & release payment (happy path)

**Buyer click:** "Approve & release payment" → confirmation dialog
→ submit।

**Backend (`ReleaseMilestoneAsync`, WorkroomService.cs:703):**
1. Precondition:
   - Milestone Status = ClientReviewing OR Resubmitted
   - `DisputeOutcome != Open` (BUG-1 fix)
   - CanTransition to Paid allowed
2. **Stored `PaymentOperation.GatewayReference` retrieve** (BUG-3
   fix; আগে fabricated string ছিল)
3. `PaymentOperation` new for release (key: `release:{milestoneId}`)
4. **Gateway call:** `_gateway.ReleaseEscrowAsync(key, storedReference,
   amount, currency)`
5. **Commission calculation:**
   - `commission = amount × 12%` (rounded up)
   - `net = amount - commission`
6. Transaction-safe update:
   - Milestone: `Status=Paid`, `EscrowStatus=Released`,
     ApprovedAt=now
   - Engagement: `CompletionPercentage` recomputed, `EscrowStatus=Released`
   - **FinancialTransaction** create: `Type=PaymentReleased`,
     GrossAmount, CommissionAmount, NetAmount
   - **Invoice** create: `MDL-YYYYMMDD-XXXXXX` format, tax snapshot
     captured
7. Trust score refresh for provider
8. Notify provider: "Payment released — €{net} available after 12%
   commission"

**Buyer এই মুহূর্তে দেখে:**
- Milestone chip: "Paid" (success tone)
- Amount shown as normal (strikethrough না, সেটা Refunded-এর জন্য)
- Approve/Revise/Dispute buttons gone
- এটা happy path — money released to provider

**যদি এটাই ছিল একমাত্র milestone:** engagement completion-এ যাও
(Phase 11)।

**যদি আরো milestones আছে:** repeat from Phase 7 (Fund next
milestone)।

### 9.2 — Request revision (correction cycle)

**Buyer click:** "Request revision" → revision request form
(list of requested changes, "consolidated feedback" checkbox
required) → submit।

**Backend (`RequestRevisionAsync`, WorkroomService.cs:330):**
- `RevisionRequest` record create
- Milestone Status → `RevisionRequested`
- Revision count check করে (`IncludedRevisionCount` exceed করলে
  extra revision-এর জন্য charge — future feature)

**Buyer এই মুহূর্তে দেখে:**
- Milestone chip: "Revision requested"
- Waiting for provider

**Provider পরে:**
- `StartRevisionAsync` → Milestone Status = `RevisionInProgress`
- কাজ শেষে `SubmitDeliverableAsync` (2nd version) →
  Status=`Resubmitted`

**Buyer আবার ৩টা option পায়** (approve/revise/dispute) —
same Phase 9 decision cycle।

### 9.3 — Open dispute (conflict path)

**Buyer click:** "Open dispute" → reason textarea → submit।

**Backend (`OpenDisputeAsync`, WorkroomService.cs:365):**
- Milestone Status = `Disputed`
- `DisputeOpenedAt = now`, `DisputeOutcome = Open`,
  `DisputeReviewEndsAt = now + review window`
- Engagement Status = `Disputed`
- Escrow frozen (auto-release sweeper skip করবে)

**Buyer এই মুহূর্তে দেখে (BLOCK-2 fix-এর পরে):**
- Dispute open banner: "Dispute in review"
- Milestone chip: "Disputed"
- All milestone action buttons hidden
- Copy: "Mondial support-কে review-এর জন্য পাঠানো হয়েছে"

**Provider পক্ষে:**
- Red error banner: "payment release blocked"
- Same milestone action-locked

**Admin resolves** (via `/dashboard/admin/disputes`, BLOCK-1 UI):
- **Provider-favored** → milestone `Status=ClientReviewing` (back
  to buyer approve decision), `DisputeOutcome=ProviderFavored`,
  escrow unfrozen, banner turns "info" tone (BLOCK-4)
- **Client-favored (BUG-2 fix)** → milestone `Status=Paid` +
  `RefundedAt=now`, refund FinancialTransaction, engagement stays
  Active for completion

---

## Phase 10 — Auto-release (buyer inaction fallback)

**Scenario:** Provider deliverable submit করে, buyer কিছু করে না।

**Hangfire background job:** `SweepTimedRulesAsync`
(WorkroomService.cs:140), periodic।

- সব milestones scan করে where `AutoReleaseAt < now` AND
  `DisputeOutcome != Open`
- Each matched milestone-এ `ReleaseMilestoneAsync(systemId, id,
  autoRelease=true)` call করে
- Same commission/net calculation, same Invoice creation
- Audit event: "Milestone.AutoReleased" (System actor, not Client)
- Provider notify: "Milestone auto-released after seven days"

**Buyer এই মুহূর্তে দেখে (next refresh):**
- Milestone Paid (approve না করেই)
- এটাই canon §10.7-এর 7-day auto-release invariant

---

## Phase 11 — Engagement completion (all milestones done)

**যখন সব milestones Paid (বা Refunded — BUG-2 semantic):**

**Buyer কী দেখে:**
- Engagement summary card-এ "Complete engagement" button enabled
- Progress: 100%

**Buyer click:** "Complete engagement" → confirmation → submit।

**Backend (`CompleteEngagementAsync`, WorkroomService.cs:460):**
- Precondition: all milestones Paid, no open disputes
- Engagement Status = `Completed`, ActualEndDate = now
- Provider ActiveOrderCount -1
- Trust score refresh
- Repeat coupon check (if eligible for future services)

**Buyer এই মুহূর্তে দেখে:**
- Engagement status chip: "Completed"
- Review panel এখন enabled
- All action buttons gone

---

## Phase 12 — Review + response

### 12.1 — Buyer submits review

**Buyer কী দেখে:** Review panel:
- 6 category star rating (Overall, Quality, Communication, ইত্যাদি)
- Written review textarea
- Submit button

**Buyer click:** submit।

**Backend (`SubmitReviewAsync`, WorkroomService.cs:481):**
- Engagement must be Completed OR Archived
- `Review` record create with ratings + text
- Trust score refresh for provider

### 12.2 — Provider responds

**Provider পক্ষে later:**
- Review notification পায়
- Response textarea via UI
- `RespondToReviewAsync` — এই action **engagement termination-এর
  পরেও চলে** (এটাই DeliveriesPanel readOnly bug-এর discovery ছিল)

---

## Phase 13 — Provider payout (separate flow, later)

Buyer flow এখানেই শেষ। কিন্তু provider পক্ষে payment cycle
সম্পূর্ণ হতে আরো একটা step:

- Net amount (gross - 12% commission) provider account-এ available
  balance-এ যোগ হয়
- Provider `PayoutRequest` create করে UI থেকে (Earnings page)
- Backend gateway call → StubPayoutGateway (future: Stripe Connect)
- Success হলে FinancialTransaction (`Type=PayoutCompleted`)
- Provider bank/card-এ money reach করে (real gateway-এ)

Buyer এই phase-এ কোনো interaction নেই।

---

## Money flow summary (100 EUR order example)

```
Buyer pays 100 EUR
        │
        ▼
[Phase 7: FundMilestone]
    Escrow authorized: 100 EUR
    FinancialTransaction: EscrowFunded, Gross=100
        │
        ▼ (work happens, provider submits, buyer approves)
        │
[Phase 9.1: ReleaseMilestone]
    Escrow released: 100 EUR
    Commission (12%): 12 EUR → Mondial
    Net: 88 EUR → provider available balance
    FinancialTransaction: PaymentReleased, Gross=100, Commission=12, Net=88
    Invoice: MDL-20260802-XXXXXX
        │
        ▼ (provider requests payout, later)
        │
[Phase 13: Payout]
    Provider account: +88 EUR
    FinancialTransaction: PayoutCompleted, Gross=88
```

---

## States quick reference

**EngagementStatus lifecycle (happy path):**
```
ContractPending → EscrowPending → ReadyToStart → Active → MilestoneReview → ReadyToStart (next milestone) → ... → FinalDelivery → Completed
```

**MilestoneStatus lifecycle (happy path):**
```
FundingRequired → Funded → Active → ClientReviewing → Paid
                                       │
                                       ├─ (revision) → RevisionRequested → RevisionInProgress → Resubmitted → Paid
                                       │
                                       └─ (dispute) → Disputed → [admin resolves] → ClientReviewing (prov-fav) OR Paid+RefundedAt (client-fav)
```

**EscrowStatus lifecycle:**
```
NotFunded → Funded → Released (via approve/auto-release) OR Refunded (via client-fav dispute)
```

---

## Real-world timing expectations

- **Phase 3 (order wizard):** buyer time-dependent, typically 2-5 min
- **Phase 4 (backend decision):** instant, <500ms
- **Phase 5A (auto-accept):** proposal conversion ~1-5 sec background,
  frontend polling picks up in 15-30 sec
- **Phase 5B (manual approval):** provider time-dependent, minutes to
  hours
- **Phase 6 (contract sign):** both parties needed, minutes to hours
- **Phase 7 (fund):** instant once buyer decides, gateway ~1-2 sec
- **Phase 8 (work execution):** days to weeks depending on scope
- **Phase 9 (review):** buyer time-dependent, or 7-day auto-release
- **Phase 10 (auto-release):** exactly 7 days after
  `AutoReleaseAt`
- **Phase 11 (completion):** instant on button click
- **Phase 13 (payout):** provider time-dependent, gateway hours to
  days in real gateway

---

## Currently unsupported / limitations (documented gaps)

- **File download absent** — buyer delivery listed দেখে, open
  করতে পারে না (highest user-value gap, backend endpoint missing)
- **`completionCriteria` + `autoReleaseAt` buyer visibility** —
  approve করে unseen criteria-এর against, unknown 7-day clock
- **Real payment gateway** — এখন StubPaymentGateway, M8-এ
  Stripe swap হবে (BUG-3 fix সেই swap-এর prerequisite)
- **Chat/Message provider** — button আছে UI-এ but stub, actual
  chat backend built না
- **Provider display name** — engagement list card + detail
  header-এ absent (backend DTO gap)