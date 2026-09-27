# MBC Creator Phase 4.8 — Launch Assets Implementation & Audit Report

**Target Route**: `/dashboard/creator/phase-4/launch-assets?ideaId=...` (Known Alias: `/dashboard/creator/phase-4/assets`)
**Public Website Route**: `/p/launch/[token]` (Durable, unauthenticated public view)
**Repository**: `MondialECO/mondial_monorepo_fullstack`
**Git Source Revision**: `dev-hafiz`
**Approved Figma Reference**: Node `57221:12861` (`Launch Assets · Step 4.8 Workspace`)
**Figma URL**: `https://www.figma.com/design/yLDPLB9hIAIqfYY9uHuJom/Mondial-Dashboard-EDU?node-id=57221-12861&m=dev`
**Verdict**: **VERIFIED WITHIN TESTED SCOPE** (Backend Moq, Frontend jsdom, Vitest, and Static Type Verification)
**Date**: September 2026

---

## 1. Executive Summary & Remediation

In this milestone, Phase 4.8 Launch Assets was completed to generate a **project-specific, MBC-hosted public shareable website**, durable snapshot versioning, standalone HTML source download, and workspace copy alignment, while strictly adhering to the approved Figma workspace design (Node `57221:12861`), pricing resolution precedence, and version history immutability.

### Core Enhancements & Remediation:

1. **Project-Specific Website Generation from Multi-Phase Inputs**:
   - *Sources*: Generates authentic project websites by synthesizing Brand Kit visual identity (colors, typography, logo lockup/mark), project concept details, Step 4.6 Pricing Strategy, and Step 4.7 GTM Strategy.
   - *Brand Palette & Typography*: Dynamically binds brand primary, secondary, accent, background, and text colors with Google Fonts (`displayFontFamily`, `textFontFamily`, heading/body weights).
   - *Luminance & Contrast*: Applies dynamic contrast algorithms to calculate appropriate text and surface colors, ensuring readability on both light (`#FFFFFF`) and dark (`#090A0C`) backgrounds.

2. **Authoritative Section Inclusion & Pricing Precedence**:
   - *Canonical Inclusion*: `Sections["pricing"].IsIncluded` is authoritative whenever present; `PricingExclusion.Excluded` serves only as a legacy fallback when the section structure is absent.
   - *Confirmed Zero vs. Missing Price*: Confirmed zero-price offers (`PriceStatus == "ConfirmedZero"`) cleanly render as `Free` with full billing interval metadata, whereas missing/unconfirmed pricing (`PriceStatus == "Unconfirmed"`) is excluded from public launch display until confirmed.
   - *Founder Resolution Policy & Ambiguous Offers*: When ambiguous or conflicting offer recommendations exist, the workspace enters a review state requiring founder confirmation before public projection.

3. **MBC-Hosted Durable Public Website Page (`/p/launch/[token]`)**:
   - *Behavior*: When the founder clicks **"View website"**, any dirty changes are saved, a durable 32-character hex `ShareToken` is generated/reused for that exact version snapshot, and the website opens in a new browser tab at `/p/launch/{token}`.
   - *Unauthenticated Access*: Anyone with the URL can view the rendered website in incognito windows, other browsers, and mobile devices without logging into MBC.
   - *Clean Shell*: Renders purely the generated project website with full branding, typography, workflow, problem/solution, FAQs, and pricing, completely isolated from the authenticated Creator dashboard shell.
   - *Security & Privacy*: Uses an unguessable `ShareToken`. Private idea IDs, user credentials, and internal dashboard models are never exposed.

4. **Logo Resolution, Lockup Deduplication & Offline HTML Assets**:
   - *Exact Asset Resolution*: Reuses the working logo asset resolution from `LaunchAssetsView.tsx` via `resolveMediaUrl(logoUri)`.
   - *Lockup Deduplication*: When a full logo lockup (`logoLockupUri`) is selected, the adjacent text wordmark is suppressed to eliminate visual duplication. When a standalone logo mark (`logoMarkUri`) is used, the business name is displayed cleanly beside it.
   - *Responsive Sizing*: Header logo is bounded to `max-w-[200px]` (`h-10` to `h-12`), and footer logo to `max-w-[140px]` (`h-8`).
   - *Embedded HTML Source*: Downloaded standalone HTML (`[slug]-launch-page-v[version].html`) embeds local brand logos as base64 data URIs for offline portability. Note: Embedded logos render offline, but remote Google Fonts still require internet connectivity for webfont download.

5. **Repeat-Click HTTP 409 Root Cause & Concurrency Repair**:
   - *Root Cause*: On the first "View website" click, `ShareLaunchAssetsAsync` performed an unconditional database write via `_journeys.SetPhase4LaunchAssetsAsync()`, which incremented the database idea version (e.g., from version `5` to `6`). However, the new version was not returned in the share response, `X-Creator-Idea-Version` was omitted from the share response header, and `handleViewWebsite` in the UI issued an unconditional content `PATCH` on every click. On the second click, the client sent stale `expectedVersion: 5` against the database at `6`, causing an HTTP 409 Conflict.
   - *Repair Applied*:
     - `ShareLaunchAssetsAsync` now checks `needsPersist`. If the revision is already shared and unchanged, it reuses the persisted token and returns the stable version without database writes or version increments.
     - When persistence occurs, `ShareLaunchAssetResponse.IdeaVersion` is populated and `CreatorPhase4ConstructionController` exposes the `X-Creator-Idea-Version` response header.
     - Frontend `shareLaunchAssets()` calls `rememberIdeaVersion()` and updates the idea-scoped client version cache.
     - `LaunchAssetsView.tsx` now performs an `isEditorDirty` check; clean repeat clicks bypass unnecessary `PATCH` mutations and open the existing public URL directly.
     - In-flight mutation refs (`inFlightUpdateRef`, `inFlightShareRef`) coordinate rapid double-clicks to prevent race conditions.
   - *User Verification*: Verified by user confirmation that repeated "View website" clicks open the existing public URL smoothly without 409 errors.

6. **Restoration of Original Static-File & CSP Baseline**:
   - All experimental/broadened security header modifications in `backend/Program.cs` and `backend/Middleware/SecurityHeadersMiddleware.cs` were reverted to their original protected baseline. Static files and Next.js asset rewrites work under standard configuration without CORS/CSP loosening.

---

## 2. Public Sharing Architecture & Data Flow

```
Creator Workspace (/dashboard/creator/phase-4/assets)
  │
  ├── [1] "View website" / "Copy link" Click
  │     ├── Checks isEditorDirty
  │     ├── If dirty: saves pending editor changes via UpdateLaunchAssetsAsync
  │     └── If token missing or dirty: calls POST /api/creator/phase4/assets/share
  │
  ├── [2] LaunchAssetsService.ShareLaunchAssetsAsync
  │     ├── Locates snapshot in VersionHistory (or active plan)
  │     ├── Reuses existing ShareToken (or assigns new 32-char hex token)
  │     ├── Checks needsPersist (skips redundant DB writes if unchanged)
  │     ├── Returns { shareToken, publicUrl, sharedAt, version, ideaVersion }
  │     └── Controller sets X-Creator-Idea-Version response header
  │
  └── [3] Public Navigation
        ├── Creator Workspace opens /p/launch/{shareToken} in new tab
        └── Public Visitor (Incognito / External Device)
              ├── Next.js route: /p/launch/[token]/page.tsx
              ├── Anonymous API: GET /api/creator/phase4/assets/public/{shareToken}
              └── Renders Standalone Project Launch Page (Zero Dashboard Shell)
```

---

## 3. API Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/creator/phase4/assets/share` | `POST` | `Authorize` (Creator) | Creates or retrieves durable share token for a specific version snapshot, returning authoritative `IdeaVersion` and header. |
| `/api/creator/phase4/assets/public/{shareToken}` | `GET` | `AllowAnonymous` | Retrieves public launch asset model without exposing internal IDs or mutating version state. |
| `/api/creator/phase4/assets/public/{shareToken}/html` | `GET` | `AllowAnonymous` | Returns standalone HTML representation of the shared snapshot without side effects. |
| `/api/creator/phase4/assets/source` | `GET` | `Authorize` (Creator) | Returns standalone HTML source bundle with base64 embedded logo for authenticated download. |

---

## 4. Files Modified & Added

| File | Change Summary |
| :--- | :--- |
| [`backend/Models/DatabaseModels/Phase4/LaunchAssetModels.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Models/DatabaseModels/Phase4/LaunchAssetModels.cs) | Added `ShareToken` and `SharedAt` to `LaunchAssetsPlanSnapshot` and `LaunchAssetsPlan`. Added `IdeaVersion` to `ShareLaunchAssetResponse`. Added `ShareLaunchAssetRequest` and `PublicLaunchAssetResponse` DTOs. |
| [`backend/Services/Interface/ILaunchAssetsService.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Interface/ILaunchAssetsService.cs) | Added `ShareLaunchAssetsAsync`, `GetPublicLaunchAssetAsync`, and `GetPublicSourceCodeBundleAsync`. |
| [`backend/Services/Implementations/LaunchAssetsService.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Services/Implementations/LaunchAssetsService.cs) | Implemented durable share token generation, version snapshot mapping, memory cache + MongoDB persistence, `needsPersist` check to prevent redundant version bumps, public DTO projection, and standalone HTML builder. |
| [`backend/Controllers/CreatorPhase4ConstructionController.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/Controllers/CreatorPhase4ConstructionController.cs) | Added `POST /api/creator/phase4/assets/share` with `X-Creator-Idea-Version` response header, `GET /api/creator/phase4/assets/public/{shareToken}` (`[AllowAnonymous]`), and `GET /api/creator/phase4/assets/public/{shareToken}/html` (`[AllowAnonymous]`). |
| [`backend/tests/WebApp.Tests/Unit/CreatorPhase4LaunchAssetsTests.cs`](file:///e:/17-07-2026/mondial_monorepo_fullstack/backend/tests/WebApp.Tests/Unit/CreatorPhase4LaunchAssetsTests.cs) | Unit test suite covering share token creation, idempotency/token reuse, unauthenticated public resolution, standalone HTML generation, and invalid token handling (**23 tests**). |
| [`src/types/creator/launch-assets.ts`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/types/creator/launch-assets.ts) | Added `shareToken`, `sharedAt`, `sharedVersion`, `ideaVersion`, and exported public request/response types. |
| [`src/lib/api-creator-launch-assets.ts`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/lib/api-creator-launch-assets.ts) | Added `shareLaunchAssets` with `rememberIdeaVersion` and client cache update, `getPublicLaunchAsset`, and `getPublicSourceCode`. |
| [`src/app/p/launch/[token]/page.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/p/launch/[token]/page.tsx) | Created durable public unauthenticated launch website page without dashboard shell. Reused workspace logo resolution, removed `crossOrigin`, fixed lockup deduplication, and bound brand palette dynamically. |
| [`src/app/dashboard/creator/phase-4/assets/page.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/dashboard/creator/phase-4/assets/page.tsx) | Wired `handleShareWebsite` with in-flight ref guards (`inFlightUpdateRef`, `inFlightShareRef`), updated `handleDownloadSource` with versioned filename `[slug]-launch-page-v[version].html`. |
| [`src/components/creator/phase4/LaunchAssetsView.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/creator/phase4/LaunchAssetsView.tsx) | Added `isEditorDirty` computation, updated "View website" to only save dirty changes and reuse existing tokens when clean, added "Copy link" button with feedback, updated status copy to `"Anyone with the link can view this website."`, and unified lockup logo presentation. |
| [`src/__tests__/creator/phase4-launch-assets.test.tsx`](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/__tests__/creator/phase4-launch-assets.test.tsx) | Unit tests covering dirty save/share, clean repeat-click URL reopening, clipboard copying, updated status copy, and public page logo & lockup rendering (**14 tests**). |

---

## 5. Verification Evidence & Test Breakdown

### 5.1 Backend Unit Test Verification
- **Targeted Test Suite**: `backend/tests/WebApp.Tests/Unit/CreatorPhase4LaunchAssetsTests.cs`
- **Execution Command**: `dotnet test tests/WebApp.Tests/WebApp.Tests.csproj --filter "FullyQualifiedName~CreatorPhase4LaunchAssetsTests"`
- **Results**: **23 / 23 PASS** (Duration: 233 ms, 0 failed, 0 skipped).
- **Coverage**: Founder precedence, unconfirmed recommendation distinction, conflicting flags, legacy fallback, version history snapshots, durable share token generation, token reuse, unauthenticated public resolution, and HTML export.

### 5.2 Frontend Vitest & DOM Verification
- **Targeted Test Suite**: `src/__tests__/creator/phase4-launch-assets.test.tsx`
- **Execution Command**: `npx vitest run src/__tests__/creator/phase4-launch-assets.test.tsx`
- **Results**: **14 / 14 PASS** (Duration: 1.78s, 0 failed).
- **Full Creator Test Suite**: `npx vitest run src/__tests__/creator/`
- **Results**: **169 / 169 PASS** across 13 test files (0 failed).

### 5.3 Static Type & Compiler Verification
- **Execution Command**: `npx tsc --noEmit`
- **Results**: **0 Errors** (Clean TypeScript compilation).

### 5.4 Out-of-Scope / Deferred Verifications
- **Step 4.9 Construction Readiness Handoff**: **Pending** (remains pending until Step 4.9 is formally implemented).
- **Live Multi-Instance / Production Cloud Deployment**: **Not verified** on live public cloud deployment; verified via localhost dev server, node automated fetch suites, backend unit tests, and jsdom tests.

---

## 6. Scoped Verdicts

| Scope Area | Status | Evidence |
| :--- | :--- | :--- |
| **Logo & Brand Identity Parity** | **Verified within tested scope** | Real SVG logo rendered with natural aspect ratio; lockup avoids duplicate business-name text; lettermark only as fallback. |
| **Public Website Route (`/p/launch/[token]`)** | **Verified within tested scope** | Anonymous public route renders full branding, hero, workflow, problem/solution, and pricing without dashboard shell. |
| **Durable Token Persistence & Reuse** | **Verified within tested scope** | Re-sharing existing version reuses durable token; edits do not overwrite previously shared snapshots. |
| **Workspace Copy & Link Sharing** | **Verified within tested scope** | "View website" opens new tab; "Copy link" copies public link; status shows "Anyone with the link can view this website." |
| **Repeat-Click 409 Resolution** | **Verified within tested scope** | Verified via dirty-only saves, token reuse, `X-Creator-Idea-Version` response header, cache sync, and user verification. |
| **Standalone HTML Source Download** | **Verified within tested scope** | Downloads `[project-slug]-launch-page-v[version].html` with base64 embedded assets for offline image durability. |
| **Founder Resolution & Pricing Precedence** | **Verified within tested scope** | `Sections["pricing"].IsIncluded` is canonical; confirmed zero price renders as Free. |
| **Type Safety & Compiler Integrity** | **Verified within tested scope** | `tsc --noEmit` completed with 0 errors. |
