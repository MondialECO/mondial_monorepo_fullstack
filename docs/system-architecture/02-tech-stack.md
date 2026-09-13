# Mondial ECO — Comprehensive Technology Stack Inventory

All versions and components documented below are verified from `package.json`, `next.config.ts`, `backend/WebApp.csproj`, `backend/docker-compose.yml`, `backend/Program.cs`, and `appsettings.Example.json`.

---

## 1. Complete Architecture Matrix

| Layer | Primary Technology | Exact Version | Configuration & Implementation Notes |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `16.0.7` | `reactCompiler: true`, AVIF/WebP image optimization, SSR & RSC enabled |
| **Frontend UI Library** | React & React DOM | `19.2.0` | React 19 Compiler active, Client/Server Component architecture |
| **Frontend Language** | TypeScript | `5.8.2` | Strict typing, target ES2020, baseUrl `@/*` mapping |
| **Frontend Styling** | Tailwind CSS & PostCSS | `4.0.0` | `@tailwindcss/postcss`, CSS variables in `src/styles/globals.css` |
| **Component Primitives** | shadcn/ui (Radix UI) | `New York` Style | `@radix-ui/react-*` primitives, Lucide React icons |
| **Frontend State (Client)** | Zustand | `5.0.11` | Client-side reactive UI state stores |
| **Frontend State (Server)** | TanStack React Query | `5.90.16` | Server cache, background invalidation, mutation workflows |
| **Animations** | Framer Motion | `12.34.4` | Micro-animations, page transitions, accordion/modal motions |
| **Backend Runtime** | .NET 8 (ASP.NET Core) | `net8.0` | C# 12, Kestrel web server, InvariantGlobalization enabled |
| **Primary Database** | MongoDB Atlas | Server 6.0+ / Driver `2.30.0` | 91 collections, multi-document ACID replica-set transactions |
| **Identity & Membership** | ASP.NET Core Identity | MongoDbCore `6.0.0` | `ApplicationUser` stored in `applicationUsers` collection |
| **Distributed Cache** | Redis | `7-alpine` | Shared cache, DataProtection key ring, session state |
| **Realtime Messaging** | ASP.NET Core SignalR | .NET 8 / Client `10.0.0` | Redis backplane (`MondialSignalR`), camelCase JSON contract pin |
| **Background Job Engine** | Hangfire | `1.8.14` | MongoDB storage (`Hangfire.Mongo 1.10.9`), queues: `default`, `ai` |
| **HTTP Resilience** | Polly | `8.0.14` | Transient fault handling, retry on 429/5xx for upstream AI APIs |
| **AI Integration Provider** | OpenRouter AI Gateway | API v1 | Typed `HttpClient<IAiProvider, OpenRouterClient>`, model router |
| **Reverse Proxy & Ingress** | Traefik | `v2.11` | Automated Let's Encrypt TLS, HTTP->HTTPS redirect, `/metrics` IP allowlist |
| **Identity Verification** | Sumsub | API Staging/Prod | Document-only KYC passport/ID OCR (biometrics removed; deferred in MVP), webhook callbacks |
| **Email Delivery** | MailKit / Zoho SMTP | `4.16.0` | In-memory `IEmailQueue` background processor, port 587 TLS |
| **SMS Notifications** | Twilio | `7.14.3` | Optional SMS verification / phone alerts |
| **Web Push Alerts** | WebPush | `1.0.12` | VAPID keys, browser push notifications via service worker |
| **Observability (Metrics)** | Prometheus / OpenTelemetry | `1.15.3` | OpenTelemetry .NET instrumentation, `/metrics` scrape endpoint |
| **Structured Logging** | Serilog | `8.0.3` | JSON formatted console output, correlation ID enrichment |
| **Input Validation** | FluentValidation | `11.11.0` | ASP.NET Core pipeline filter returning unified `ApiResponse` envelope |
| **API Versioning** | Asp.Versioning.Mvc | `8.1.0` | Header `X-Api-Version` & query string support, default v1.0 |
| **Media / Graphics** | SkiaSharp | `4.150.1` | Native Linux server-side image manipulation and watermark generation |
| **Audio/Video Tagging** | TagLibSharp | `2.3.0` | Media file validation and metadata inspection |
| **E2E Testing** | Playwright | `1.58.2` | Headless Chrome/Firefox multi-role scenarios |
| **Frontend Unit Testing** | Vitest | `4.0.18` | React Testing Library 16.3.2, jsdom environment |
| **Backend Testing** | xUnit & FluentAssertions | xUnit 2.8.0, FA 6.12.0 | Unit, calculator, state machine, and integration tests |

---

## 2. Layer-by-Layer Technology Breakdown

### A. Frontend Runtime
- **Entrypoint**: `src/app/layout.tsx`
- **Providers Pipeline**:
  ```tsx
  <RootProviders>
    <AuthProvider>
      <ReactQueryProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ReactQueryProvider>
    </AuthProvider>
  </RootProviders>
  ```
- **HTTP Transport**: `src/lib/axios.ts`
  - Base URL resolved via `NEXT_PUBLIC_API_BASE_URL` with fallback to `http://localhost:5093/api`.
  - Injects `Authorization: Bearer <token>` from `localStorage`.
  - Intercepts 401 errors, queuing failed requests while attempting refresh against `/auth/refresh-token`.
- **Theme Engine**: `next-themes` with `class` strategy supporting high-contrast dark and light modes.

### B. Backend Pipeline
- **Entrypoint**: `backend/Program.cs`
- **Fail-Fast Boot Guard**: `StartupConfigValidation.ValidateRequiredConfiguration` refuses startup if `MongoDbSettings`, `JwtSettings:Key` (<32 bytes), `Mongo:TransactionsEnabled`, or `OpenRouter:ApiKey` are missing.
- **Middleware Execution Order**:
  1. `ForwardedHeadersMiddleware` (Trusts RFC1918 / Traefik proxy IPs)
  2. `CorrelationIdMiddleware` (Generates or propagates `X-Correlation-ID`)
  3. `ExceptionHandlingMiddleware` (Returns standardized `ApiResponse.Error`)
  4. `SecurityHeadersMiddleware` (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
  5. `SerilogRequestLogging` (Enriched with correlation ID and user claims)
  6. `ResponseCompression` (Brotli & Gzip for JSON payloads)
  7. `Cors` (`AllowAll` with strict allowed origins and exposed `X-Creator-Idea-Version` header)
  8. `UploadPathSecurityDeny` (Denies direct static serving of `/uploads/documents` and `/uploads/identity`)
  9. `UseStaticFiles` (Serves public branding and media uploads)
  10. `UseRateLimiter` (IP-based global and auth-specific rate limits, user-based AI limits)
  11. `UseAuthentication` & `UseAuthorization`
  12. `UseHangfireDashboard` (`/hangfire`, gated by `HangfireDashboardAuthorizationFilter`)
  13. `MapHub` (`/hubs/notifications`, `/hubs/chat` without request timeout limits)
  14. `MapControllers` (51 API controllers)
  15. `MapHealthChecks` (`/health/live`, `/health/ready`)
  16. `MapPrometheusScrapingEndpoint` (`/metrics`)

### C. Data & State Storage
- **MongoDB Atlas**:
  - Connection Pool: Min 10, Max 200 connections.
  - Timeouts: Server selection 5s, Connect 10s, Socket 30s.
  - Transactions: Required for Module 4 Workroom and Financial Operations (`Mongo:TransactionsEnabled=true`).
- **Redis 7**:
  - Host: `localhost:6379` (Docker internal: `redis:6379`).
  - Key namespaces:
    - DataProtection: `Mondial-DataProtection-Keys`
    - SignalR: `MondialSignalR`
    - Distributed Cache: `Mondial:*`
  - Resilience: `AbortOnConnectFail=false`, 5 retries, 5s connect timeout. Falls back to in-memory in local dev if Redis is absent.
- **File System / Persistent Volume**:
  - Docker named volume `uploads-data` mounted at `/app/wwwroot/uploads`.
  - Subdirectories: `media/`, `branding/`, `profile/`, `documents/`, `identity/`.
  - Sensitive KYC documents migrated to isolated secure folder outside public wwwroot via `KycStorageService`.
