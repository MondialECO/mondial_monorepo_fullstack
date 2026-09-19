# MONDIAL BUSINESS CREATION (MBC) — DATA OBJECTS CATALOG

**Skill**: `modernize-extract-rules`  
**Date**: September 19, 2026  
**Status**: COMPLETE — ALL CORE ENTITIES CATALOGED WITH DOMAIN OWNERSHIP & MUTATION LINEAGE  

---

## 1. Domain Entities & Database Collections

| Object Name | Domain | MongoDB Collection | Primary Key Type | Owner / Relationship | Lifecycle Status Field | Sensitivity Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CreatorIdea** | Creator | `CreatorIdeas` | `string` (ObjectId) | `UserId` (Guid string) | `Status`: `active`, `archived` | Confidential (Business Idea IP) |
| **CreatorJourney** | Creator | `CreatorJourneys` | `string` (ObjectId) | `UserId` (Guid string, Unique) | Derived (never stored) | Confidential (User Journey IP) |
| **BusinessIdea** | Creator | `BusinessIdeas` | `string` (ObjectId) | `UserId` (Guid string) | `Status`: `Draft`, `Published` | Confidential |
| **ClarifierSession** | AI / Project Intelligence | `ClarifierSessions` | `string` (ObjectId) | `OwnerUserId` (Guid string) | `Status`: `Pending`, `Completed`, `Failed` | Confidential |
| **MarketStudySession** | AI / Project Intelligence | `MarketStudySessions` | `string` (ObjectId) | `OwnerUserId` (Guid string) | `Status`: `Pending`, `Completed`, `Failed` | Confidential |
| **BusinessModelSession** | AI / Project Intelligence | `BusinessModelSessions`| `string` (ObjectId) | `OwnerUserId` (Guid string) | `Status`: `Pending`, `Completed`, `Failed` | Confidential |
| **BusinessPlanSession** | AI / Project Intelligence | `BusinessPlanSessions` | `string` (ObjectId) | `OwnerUserId` (Guid string) | `Status`: `Pending`, `Completed`, `NeedsReview`, `Failed` | Strictly Confidential |
| **ForecastSession** | AI / Project Intelligence | `ForecastSessions` | `string` (ObjectId) | `OwnerUserId` (Guid string) | `Status`: `Pending`, `Completed`, `NeedsReview`, `Failed` | Strictly Confidential |
| **Company** | Entrepreneur | `Companies` | `string` (ObjectId) | `OwnerId` / `FounderId` | `Status`: `Draft`, `Incorporated`, `Fundraising` | Strictly Confidential |
| **Phase4CapTable** | Entrepreneur | `Phase4CapTables` | `string` (ObjectId) | `CompanyId` (ObjectId string) | Versioned (`Version` integer) | Financial Confidential |
| **DealExecution** | Deals | `DealExecutions` | `string` (ObjectId) | `CompanyId`, `CreatedByUserId` | `Status`: `draft`, `term-sheet`, `completed`, `cancelled` | Legal / Financial Secret |
| **Deal** | Deals | `Deals` | `string` (ObjectId) | `CompanyId`, `CreatedByUserId` | `Status`: `Draft`, `Negotiating`, `Executed`, `Disputed` | Legal / Financial Secret |
| **Investor** | Investor | `Investors` | `string` (ObjectId) | `LinkedUserId` (Guid string) | `IsActive`: boolean | Financial PII |
| **InvestorMatch** | Investor | `InvestorMatches` | `string` (ObjectId) | `CompanyId`, `InvestorId` | `Status`: `new`, `accepted`, `passed` | Confidential |
| **InvestorFinanceVerification** | Investor | `InvestorFinanceVerifications` | `string` (ObjectId) | `UserId` (Guid string) | `Status`: `not_started`, `draft`, `under_review`, `verified`, `needs_update` | Financial PII |
| **CompanyPortfolioHolding** | Investor | `CompanyPortfolioHoldings` | `string` (ObjectId) | `InvestorId`, `InvestorUserId` | `Status`: `active`, `completed` | Financial Confidential |
| **Investments** (Legacy) | Investor | `Investments` | `string` (ObjectId) | `InvestorId` (Guid) | `Status`: `Pending`, `Escrowed`, `Active`, `Completed`, `Refunded` | Financial Confidential |
| **ProfessionalProfile** | Service Provider | `ProfessionalProfiles` | `string` (ObjectId) | `UserId` (Guid string) | `Status`: `Draft`, `Published`, `Suspended` | Public / Professional PII |
| **ServiceProviderProfile** | Service Provider | `ServiceProviderProfiles` | `string` (ObjectId) | `UserId` (Guid string) | `VerificationStatus`: `Unverified`, `Pending`, `Verified` | PII / Compliance |
| **ServiceListing** | Service Provider | `ServiceListings` | `string` (ObjectId) | `ProviderId` (Guid string) | `Status`: `Draft`, `Published`, `Paused` | Public Marketplace Data |
| **ClientBrief** | Service Provider | `ClientBriefs` | `string` (ObjectId) | `ClientId` (Guid string) | `Status`: `Open`, `InReview`, `Assigned`, `Closed` | Confidential Business Brief |
| **WorkroomEngagement** | Service Provider | `WorkroomEngagements` | `string` (ObjectId) | `ClientId`, `ProviderId` | `Status`: `Active`, `Delivered`, `Completed` | Work Product IP |
| **Conversation** | Messenger | `Conversations` | `ObjectId` | `Participants` (List of Guids) | `Type`: `Direct`, `Company`, `ProjectDeal` | Private Communications |
| **ChatMessage** | Messenger | `ChatMessages` | `ObjectId` | `SenderId` (Guid), `ConversationId` | Unread / Read status | Private Communications |
| **UniversalIdentityVerification** | Verification | `UniversalIdentityVerifications` | `string` (ObjectId) | `UserId` (Guid string) | `Status`: `Draft`, `Pending`, `Verified`, `Rejected` | Strict PII / Biometrics |
| **MarketplaceProjectAccessGrant** | Marketplace | `MarketplaceProjectAccessGrants` | `string` (ObjectId) | `CreatorId`, `EntrepreneurId`, `IdeaId` | `Status`: `active`, `expired`, `revoked` | Legal Access Right |
| **ProjectInterest** | Marketplace | `ProjectInterests` | `ObjectId` | `CreatorId`, `EntrepreneurId`, `IdeaId` | `Status`: `pending`, `accepted`, `declined` | Commercial Deal Lead |
| **ApplicationUser** | Platform Core | Identity (AspNetUsers) | `Guid` | Self-owned | N/A (always exists) | PII / Auth Credential |

---

## 2. Core Data Object Detail Sheets

### 2.1 `CreatorIdea`
- **Owning Domain**: Creator
- **MongoDB Collection**: `CreatorIdeas`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: `UserId` represents `ApplicationUser.Id` (Guid string). Multiple ideas per user.
- **Canonical Structure**:
  - `Project`: Canonical idea core (`Name`, `Tagline`, `Concept`, `Problem`, `Solution`, `MarketGap`, `CreatorEdge`, `WhyNow`, `RiskiestAssumption`, `TargetMarket`, `Geography`, `Sector`).
  - `Phase2Data`: Clarifier session link (`ClarifierSessionId`), discovery concepts.
  - `Phase3Data`: Market study, business model, business plan session links (`MarketStudySessionId`, `BusinessModelSessionId`, `BusinessPlanSessionId`, `ForecastSessionId`).
  - `Phase4Data`: Offers, tiers, resource calculations (`ResourceCalculation`), GTM mix (`GtmSetup`).
  - `Phase5Data`: Marketplace listing (`MarketplaceListing`), seed funding ask (`CreatorSeedFunding`).
  - `Documents`: Array of produced file assets (`CreatorIdeaDocument`).
- **Writers**: `CreatorIdeasController`, `CreatorPhase4Controller`, `CreatorPhase5Controller`, AI background handlers (`BusinessPlanHandler`, `ClarifierHandler`).
- **Readers**: All Creator controllers, `MarketplaceProjectsController`, `SmartMatchingService`.
- **Classification**: High Value IP.

### 2.2 `Company`
- **Owning Domain**: Entrepreneur
- **MongoDB Collection**: `Companies`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: `OwnerId` / `FounderId` maps to `ApplicationUser.Id`.
- **Key Fields**:
  - `CompanyName`, `LegalStructure` (`SAS`, `SAS-U`, `SARL`).
  - `TotalShares`: Base share volume (defaults to 1,000,000 if unspecified).
  - `EquityStructure`: Array of `EquityEntryDto` (stakeholders, share counts, percentages).
  - `EsopPoolPercent`, `EsopVestingMonths`.
  - `CurrentPhase` (1–10), `CompletedPhases` (List of ints).
  - `AmountRaised`: Aggregate sum of committed capital across all completed deals.
  - `Industry`, `FundingRoundType`, `FundingAskAmount`, `Country`, `Tagline`.
- **Writers**: `CompanyService` (121 methods), `CompanyController`, `DealsController` (direct mutation on deal close).
- **Readers**: `CompaniesController`, `DealsController`, `DataRoomController`, `InvestorMatchesController`, `MarketplaceProjectsController`, `InvestorPhaseController`.
- **Classification**: High Value Corporate Record.

### 2.3 `DealExecution` & `Deal`
- **Owning Domain**: Deals
- **MongoDB Collection**: `DealExecutions` / `Deals`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: Multi-tenant; maps `CompanyId`, `CreatedByUserId`, `EntrepreneurId`, and `Investors` (List of `DealParticipant`).
- **Key Fields**:
  - `Status`: `draft`, `term-sheet`, `completed`, `cancelled`.
  - `TermSheet`: `TotalRaiseAmount`, `PostMoneyValuation`, `InvestorEquityPercent`, `EquityType` (`common`, `preferred`, `safe`), `AntiDilutionProtection`.
  - `Signatures`: `FounderSigned`, `InvestorSigned`, `BothSigned`, `SignedAt`.
  - `CapTableApplied`: Boolean flag preventing duplicate cap table equity dilution.
- **Writers**: `DealsController` (8,376 LOC fat controller), `CompanyService.CreateInvestorOfferAsync`.
- **Readers**: `DealsController`, `CompanyService` (for reconciliation and timeline seeding), `InvestorPhaseController`.
- **Classification**: Strictly Confidential Legal & Financial Instrument.

### 2.4 `UniversalIdentityVerification`
- **Owning Domain**: Verification & Compliance
- **MongoDB Collection**: `UniversalIdentityVerifications`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: `UserId` maps 1:1 with `ApplicationUser.Id`.
- **Key Fields**:
  - `ApplicantId`: Sumsub external identifier.
  - `InspectionId`: Sumsub inspection run ID.
  - `Status`: `Draft`, `Pending`, `Verified`, `Rejected`.
  - `ReviewAnswer`: `GREEN`, `RED`.
  - `ReviewRejectType`: `FINAL`, `RETRY`.
  - `ClientIp`: IP audit record.
- **Writers**: `IdentityVerificationService` (Sumsub webhook handler & admin decision recorder).
- **Readers**: `IdentityController`, `OnboardingGate`.
- **Classification**: Highest Privacy Risk (PII / Biometric audit state).

### 2.5 `InvestorFinanceVerification`
- **Owning Domain**: Investor
- **MongoDB Collection**: `InvestorFinanceVerifications`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: `UserId` maps 1:1 with `ApplicationUser.Id`.
- **Key Fields**:
  - `InvestorId`: Linked catalog investor ID.
  - `InvestorType`: `angel`, `vc`, `family_office`, etc.
  - `DeclaredAvailableCapital`: Total investment capital declared.
  - `MinTicket`, `MaxTicket`: Investment range.
  - `SourceOfFunds`: List of fund source categories.
  - `Status`: `not_started`, `draft`, `under_review`, `verified`, `needs_update`.
  - `Documents`: List of `InvestorFinanceDocument` (embedded array).
  - `SubmittedAt`, `ReviewedAt`, `DecisionReason`.
- **Writers**: `InvestorPhaseController` (save draft, submit, upload document, delete document).
- **Readers**: `InvestorPhaseController`, Admin finance review endpoints.
- **Classification**: Financial PII / AML Compliance Record.

### 2.6 `CompanyPortfolioHolding`
- **Owning Domain**: Investor
- **MongoDB Collection**: `CompanyPortfolioHoldings`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: Dual key: `InvestorId` (catalog) + `InvestorUserId` (platform user ID).
- **Key Fields**:
  - `CompanyId`, `CompanyName`.
  - `InvestmentAmount`, `Currency` (default `EUR`).
  - `InstrumentType`: `equity`, `safe`, `convertible_note`, `debt`.
  - `EquityPercentage` (only for equity-type instruments).
  - `EntryValuation`, `ValuationCap`, `DiscountRate`, `InterestRate`, `MaturityDate`.
  - `DealExecutionId`, `MatchId`.
  - `InvestmentDate`, `ClosedAt`, `Status` (default `active`).
- **Writers**: `CompanyService.ReconcileClosedDealPortfolioHoldingsAsync`.
- **Readers**: `InvestorPhaseController` (portfolio, stats).
- **Classification**: Financial Confidential.

### 2.7 `InvestorMatch`
- **Owning Domain**: Investor Matching
- **MongoDB Collection**: `InvestorMatches`
- **Primary Identifier**: `Id` (`ObjectId` formatted string)
- **Tenancy Relationship**: `CompanyId` + `InvestorId`.
- **Key Fields**:
  - `MatchScore`: Numeric relevance score.
  - `MatchRationale`: Text explanation of match.
  - `EntrepreneurInterest`: `new`, `interested`, `passed`.
  - `InvestorInterest`: `new`, `interested`, `passed`.
  - `Status`: `new`, `accepted`, `passed`.
  - `HandshakeConfirmedAt`: Timestamp when mutual interest confirmed.
  - `ScheduledMeeting`, `Phase7IntelligenceSnapshot`, `ScoreComponents`.
- **Writers**: `InvestorPhaseController.RespondToMatch` (investor side), `CompanyController` (entrepreneur side).
- **Readers**: `InvestorPhaseController` (investor incoming matches).
- **Classification**: Confidential Deal Lead.

### 2.8 `ApplicationUser` (Onboarding Subset)
- **Owning Domain**: Platform Core
- **Storage**: ASP.NET Identity (backed by MongoDB via `AspNetUsers`)
- **Key Onboarding Fields**:
  - `Onboarding.Phase`: Current onboarding phase (0 = incomplete, 1 = verified).
  - `Onboarding.PhoneVerified`, `Onboarding.EmailOtpVerified`, `Onboarding.IdentityDocumentVerified`.
  - `Onboarding.PhoneVerifyHash`, `Onboarding.EmailOtpHash` (HMAC-SHA256 hashes of OTP codes).
  - `Onboarding.PhoneVerifyExpiresAt`, `Onboarding.EmailOtpExpiresAt`.
  - `Onboarding.CompletedAt`.
  - `Onboarding.FaceVerified` (biometric, separate from identity document).
  - `Onboarding.Residence`, `Onboarding.Income`, `Onboarding.Tax`, `Onboarding.License` (supplementary `DocumentRecord`).
- **Key Investor Fields**:
  - `InvestorProfile.InvestorId`: Link to `Investors` catalog collection.
  - `InvestorProfile.FinanceVerified`: Boolean shortcut for finance verification status.
  - `InvestorProfile.FinanceVerificationSubmittedAt`.
- **Writers**: `OnboardingController`, `OnboardingGate.PromoteIfCompleteAsync`, `IdentityVerificationService`, `InvestorPhaseController`.
- **Readers**: All authenticated controllers (identity resolution), `OnboardingGate` (phase gate).
- **Classification**: PII / Authentication Credential.

---

## 3. Data Flow & Mutation Matrix

| Business Rule Group | CreatorIdea | Company | CapTable | DealExecution | UniversalIdentity | ChatMessage | InvestorFinanceVerification | CompanyPortfolioHolding | InvestorMatch | ApplicationUser |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Creator Phase 2–3** | **WRITE** | Read | - | - | - | - | - | - | - | - |
| **AI Project Intelligence** | **WRITE** | - | - | - | - | - | - | - | - | - |
| **Company Incorporation (Phase 5B)** | Read | **WRITE** | **WRITE** | - | - | - | - | - | - | - |
| **Equity Deal Closing** | - | **WRITE** | **WRITE** | **WRITE** | - | - | - | **WRITE** | - | - |
| **Marketplace Exploration** | Read | Read | - | Read | - | - | - | - | - | - |
| **Sumsub Webhook Processing** | - | - | - | - | **WRITE** | - | - | - | - | **WRITE** |
| **Direct Messaging** | - | - | - | - | - | **WRITE** | - | - | - | - |
| **Universal Onboarding (Phase 1)** | - | - | - | - | - | - | - | - | - | **WRITE** |
| **Investor Finance Verification** | - | - | - | - | - | - | **WRITE** | - | - | **WRITE** |
| **Investor Matching (Handshake)** | - | Read | - | - | - | - | - | - | **WRITE** | - |
| **Investor Offer (Term Sheet)** | - | Read | - | **WRITE** | - | - | - | - | - | - |
| **Portfolio Reconciliation** | - | Read | - | Read | - | - | - | **WRITE** | - | - |
