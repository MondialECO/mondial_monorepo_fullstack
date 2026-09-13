# Mondial ECO — Legacy, Duplicate & Transition Systems Map

This catalog identifies historical, transitional, duplicate, and stub subsystems across the repository. Per architectural rules, **no legacy code has been removed**. Each entry details its current status and identifies the canonical modern subsystem that replaces it.

---

## 1. Comprehensive Component Classification

| Subsystem / Path | Classification | Modern Canonical Replacement | Why It Exists & Current Operational Role |
|---|---|---|---|
| **`BusinessIdeas` Entity & Repo**<br/>`backend/Models/DatabaseModels/BusinessIdeas.cs` | **LEGACY** | `CreatorIdea`<br/>(`CreatorIdeas` Collection) | Original single-idea data model. Replaced by multi-idea architecture (`CreatorIdeas`). Retained for backward API compatibility. *Note: `CreatorIdeaBackfillMigration` migrates `CreatorJourneys` -> `CreatorIdeas`, not `BusinessIdeas`.* |
| **`BusinessIdeaController.cs`**<br/>`backend/Controllers/BusinessIdeaController.cs` | **LEGACY** | `CreatorIdeasController.cs`<br/>(`/api/creator/ideas`) | Early prototype API endpoints for idea CRUD. Deprecated in favor of multi-idea lifecycle routes. |
| **`SubmmitdataRepository.cs`**<br/>`backend/Services/Repository/SubmmitdataRepository.cs` | **LEGACY / DEPRECATED** | Domain Repositories (`CompanyRepository`, etc.) | Early form submission sink. Noted in `Program.cs`: `// need removed after using dashboard`. Retained to avoid DI resolution errors. |
| **`frontend/` Root Folder**<br/>`frontend/package.json` | **LEGACY WRAPPER** | Root Monorepo (`src/`) | Earlier monorepo directory layout. `package.json` now delegates directly to root (`npm --prefix .. run ...`). |
| **`service/auth/auth.ts`**<br/>`service/auth/auth.ts` | **DEAD / STUB** | `src/lib/axios.ts` + `AuthProvider.tsx` | Legacy frontend authentication helper client. Replaced by unified Axios bearer interceptor and React Context provider. |
| **`StubPaymentGatewayService.cs`**<br/>`backend/Services/Implementations/StubPaymentGatewayService.cs` | **STUB** | Real Payment Gateway (Stripe/SEPA) | Explicit production-ready stub implementing `IPaymentGatewayService` for Module 4 Workroom and Escrow operations. Models state and returns deterministic `stub_*` identifiers; no actual funds move. |
| **`StubFileSecurityScanner.cs`**<br/>`backend/Services/Implementations/StubFileSecurityScanner.cs` | **STUB** | Antivirus/Malware Scanner (ClamAV) | Mock implementation of `IFileSecurityScanner` providing MIME-type validation until an external security daemon is integrated. |
| **`NoOpProbeHandler.cs`**<br/>`backend/Services/Ai/Jobs/NoOpProbeHandler.cs` | **DIAGNOSTIC STUB** | Concrete AI Handlers (`IdeaClarifierHandler`, etc.) | Diagnostic handler used to verify Hangfire `ai` queue dispatching and latency during integration tests. |
| **Embedded Role Profiles on `ApplicationUser`**<br/>`ApplicationUser.CreatorProfile`<br/>`ApplicationUser.EntrepreneurProfile` | **LEGACY EMBEDDED** | `ProfessionalProfiles`, `CreatorJourneys`, `Companies` | Universal public/professional profile now lives in `ProfessionalProfiles`. SP operational concerns split into `ServiceProviderProfiles`. Entrepreneur ventures live in `Companies`. Creator journeys live in `CreatorJourneys`. Embedded user fields remain as legacy/identity records. |
| **`mondial-baseline/`**<br/>`mondial-baseline/backend` | **ARCHIVE** | Active `backend/` | Read-only historical snapshot used for regression and drift auditing. Excluded from compilation. |

---

## 2. Safe Evolution & Decommissioning Guidelines

1. **Do Not Delete `BusinessIdeas`**:
   - The legacy `BusinessIdeas` collection and endpoints must remain active until all mobile or third-party API clients are updated. The `CreatorIdeaBackfillMigration` guarantees bidirectional data fidelity.
2. **Payment & Security Stubs**:
   - `StubPaymentGatewayService` and `StubFileSecurityScanner` should be replaced via dependency injection configuration (`AddScoped<IPaymentGatewayService, RealPaymentGateway>()`) without altering the core `WorkroomService` state machine.
3. **Frontend Legacy Directory**:
   - Developers must execute commands from the workspace root, not from `frontend/`. The root `package.json` owns the verified dependencies and build scripts.
