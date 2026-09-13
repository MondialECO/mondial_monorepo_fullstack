# Mondial ECO — Test Architecture & Quality Coverage Map

Mondial ECO maintains a comprehensive multi-tier testing suite spanning C# unit and integration tests, React component and layout unit tests (Vitest), and Playwright end-to-end user journey tests.

---

## 1. Test Suite Scale & Technology Inventory

| Test Tier | Framework / Tool | Test File Count | Directory Location | Primary Execution Command |
|---|---|---|---|---|
| **Backend Unit & Integration** | .NET 8, xUnit, FluentAssertions, Moq | 160 files | `backend/tests/WebApp.Tests/` | `dotnet test backend/WebApp.sln` |
| **Backend E2E Fixtures** | ASP.NET Core Test Support Assembly | 3 files | `backend/tests/WebApp.E2eSupport/` | Compiled with `E2E` build configuration |
| **Frontend Unit & Layout** | Vitest, React Testing Library, jsdom | 59 files | `src/__tests__/` | `npm run test` (`vitest run`) |
| **End-to-End Browser Journeys** | Playwright, Node.js Test Runner | 144 files | `tests/` & `scripts/` | `npm run test:e2e:creator` |

---

## 2. Business System Coverage Matrix

| Domain Subsystem | Backend Unit/Integration | Frontend Unit | E2E Browser Journey | Coverage Assessment |
|---|---|---|---|---|
| **Authentication & Session** | `AuthControllerTests.cs`, `AuthRateLimitIntegrationTests.cs`, `MultiRoleJwtAndAuthorizationTests.cs` | `universal-profile.test.tsx` | Full multi-role login & multi-tab test | **HIGH (Thoroughly Tested)** |
| **Creator Phase 1 (Onboarding)**| `OnboardingControllerTests.cs`, `KycStorageServiceTests.cs` | Onboarding stepper tests | Identity & document upload flow | **HIGH** |
| **Creator Phase 2 (Branding/AI)**| `CreatorPhase2ControllerTests.cs`, `ClarifierSessionTests.cs` | Logo tool tests | AI Clarifier generation & prompt test | **HIGH** |
| **Creator Phase 3 (Business Plan)**| `BusinessPlanSessionTests.cs`, `ForecastSessionTests.cs` | Financial forecast form tests | Business plan & 5-year forecast flow | **HIGH** |
| **Creator Phase 4 & 5 (Crossroads)**| `ValuationEngineTests.cs`, `MarketBenchmarkResolverTests.cs` | Crossroads path selection tests | Crossroads decision & buyout pricing | **HIGH** |
| **Creator Phase 6 & Full Buyout**| `BuyoutE2EAcceptanceTests.cs`, `BuyoutAgreementSigningPhase4Tests.cs`, `BuyoutClosingPhase5Tests.cs` | Sales inbox tests | Full buyout negotiation, signing & handover | **VERY HIGH (Extensive Tests)** |
| **Entrepreneur Company Setup** | `CompanyServiceTests.cs`, `CompanyControllerTests.cs` | Step 1-4 validation tests | Company registration flow | **HIGH** |
| **Cap Table & ESOP (Phase 4)** | `CapTableCalculatorTests.cs`, `EquityDealCloseCapTableTests.cs` | Cap table grid tests | Dilution & share grant issuance | **VERY HIGH** |
| **Data Room & Diligence (Phase 6)**| `DiligenceServiceTests.cs`, `Phase6DataRoomTests.cs` | NDA acceptance modal | NDA acceptance & document access | **HIGH** |
| **Smart Matchmaking (Phase 8)** | `InvestorMatcherTests.cs`, `MatchmakingQueueTests.cs` | Match score display | Match queue outbox sweep | **HIGH** |
| **Deal Pipeline & Term Sheets (Phase 9)**| `DealActionPolicyTests.cs`, `Phase9DealExecutionTests.cs` | Term sheet builder tests | Deal state transitions & signatures | **VERY HIGH** |
| **Service Provider Marketplace** | `ServiceCatalogTests.cs`, `LeadsServiceTests.cs` | Catalog filter tests | Browse & order service package | **MEDIUM / HIGH** |
| **Workroom & Milestone Escrow** | `WorkroomServiceTests.cs`, `WorkroomStateMachineTests.cs` | Workroom timeline tests | Milestone delivery & approval | **HIGH** |
| **Realtime Chat & Notifications** | `ChatServiceTests.cs`, `NotificationHubTests.cs` | `NotificationBell` tests | SignalR message dispatch & unread badge | **HIGH** |
| **Platform Administration** | `AdminAuditTests.cs`, `AdminCommerceTests.cs` | Admin user table tests | Verification queue approvals | **MEDIUM** |

---

## 3. Notable Test Infrastructure Assets

1. **`BuyoutE2EAcceptanceTests.cs`**:
   - Comprehensive 400-line C# test verifying the exact lifecycle of Full Buyout deals from initiation through revision, digital signing, payment confirmation, and asset handover.
2. **`EquityDealCloseCapTableTests.cs`**:
   - Rigorous mathematical test suite asserting that post-deal share issuances calculate exact integer share counts, preserve option pools, and update the versioned Cap Table without rounding drift.
3. **`CreatorStabilization02.test.tsx`**:
   - Frontend integration test validating Creator route stability, profile settings persistence, and mock data immunity.
