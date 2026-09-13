# Mondial ECO — Frontend Architecture & Route Hierarchy

The frontend is a Next.js 16 App Router application engineered with React 19, TypeScript 5, Tailwind CSS 4, and shadcn/ui. It manages 198 distinct client and server routes across 11 functional domains.

---

## 1. App Router Hierarchy & Layout Tree

```
src/app/layout.tsx (Root HTML, Fonts, Global Meta, Viewport)
└── _providers/RootProviders
    └── _providers/AuthProvider (Token hydration, multi-tab sync, /auth/me verification)
        └── _providers/ReactQueryProvider (TanStack Query client)
            ├── (auth)/layout.tsx (Public Auth Container)
            │   ├── /login
            │   ├── /register
            │   ├── /forgot-password
            │   └── /reset-password
            │
            ├── (marketing)/ (Public Root & Informational Portals)
            │   ├── / (Homepage)
            │   ├── /pricing
            │   ├── /for-creators/* (Concept, Positioning, Verification)
            │   ├── /for-entrepreneurs/* (Build, Equity, Funding)
            │   ├── /for-investors/* (Discovery, Diligence, Portfolio)
            │   ├── /for-service-providers/* (Opportunities, Delivery, Earnings)
            │   ├── /marketplace/* (Public listings for Projects & Services)
            │   └── /profile/[slug] (Universal Public Profile)
            │
            ├── onboarding/ (Universal Phase 1 Onboarding & Verification Gate)
            │   ├── /onboarding (Onboarding Hub & State Router)
            │   ├── /onboarding/identity (Sumsub KYC / ID Upload)
            │   ├── /onboarding/documents/* (Income, License, Residence, Tax)
            │   ├── /onboarding/email & /phone (Contact Verification)
            │   ├── /onboarding/face-verification (Biometric Liveness)
            │   └── /onboarding/complete (Completion Handoff)
            │
            └── dashboard/layout.tsx (Role-Protected Dashboard Shell)
                └── components/layout/AuthGuard (Enforces Backend Verification & Phase 1 Gate)
                    ├── components/layout/AppSidebar (Role-Dynamic Navigation via menu.ts)
                    ├── components/layout/Topbar (Active Role, Profile, Notifications Bell)
                    │
                    ├── /dashboard/creator/* (45 Routes: Phases 1–6, Studio, AI, Deals)
                    ├── /dashboard/entrepreneur/* (38 Routes: Phases 1–10, Cap Table, Diligence)
                    ├── /dashboard/investor/* (20 Routes: Diligence Dataroom, Term Sheets, Portfolio)
                    ├── /dashboard/serviceprovider/* (13 Routes: Services, Workroom, Leads, Earnings)
                    ├── /dashboard/admin/* (35 Routes: Verification, Marketplace, Commerce, Audits)
                    └── /dashboard/profile & /dashboard/privacy
```

---

## 2. Authentication & Route Guard Engine (`AuthGuard.tsx`)

1. **Hydration Phase**:
   - `AuthProvider` reads `localStorage.getItem("token")`.
   - Before backend verification completes (`isBackendVerified === false`), all protected dashboard routes display the loading shell.
2. **Backend Verification Phase**:
   - `api.get("/auth/me")` is executed.
   - The user's role list (`roles[]`) and onboarding phase (`onboardingPhase`) are parsed from the response.
   - If invalid or unauthenticated, the user is redirected to `/login`.
3. **Universal Phase 1 Gate**:
   - If `user.onboardingPhase === 0`, any attempt to navigate to `/dashboard/*` (except legacy whitelist paths) triggers an immediate redirect to `/onboarding`.
4. **Role Gating & Route Protection**:
   - URL path role is extracted: `/dashboard/[role]/*`.
   - Case-normalization redirects uppercase paths (e.g. `/dashboard/Entrepreneur` -> `/dashboard/entrepreneur`).
   - If the user does not hold the path's role in their verified `roles[]` list, they are redirected to their canonical primary role dashboard.

---

## 3. Domain Route Inventories

### Domain Summary Table

| Domain Module | Total Routes | Path Prefix | Authentication Required? | Primary Persona |
|---|---|---|---|---|
| **PUBLIC** | 23 | `/`, `/pricing`, `/for-*` | No | Visitors, prospective users |
| **AUTH** | 4 | `/(auth)/*` | No | Unauthenticated users |
| **ONBOARDING** | 10 | `/onboarding/*` | Yes | All new users (Phase 0) |
| **CREATOR** | 45 | `/dashboard/creator/*` | Yes (Role: Creator) | Creators / Idea Owners |
| **ENTREPRENEUR** | 38 | `/dashboard/entrepreneur/*` | Yes (Role: Entrepreneur) | Founders / Builders |
| **INVESTOR** | 20 | `/dashboard/investor/*` | Yes (Role: Investor) | Angel / VC Investors |
| **SERVICE PROVIDER** | 13 | `/dashboard/serviceprovider/*`| Yes (Role: ServiceProvider)| Designers, Engineers, Legal |
| **ADMIN** | 35 | `/dashboard/admin/*` | Yes (Role: Admin/SuperAdmin) | Platform Operators |
| **MARKETPLACE** | 5 | `/marketplace/*` | Mixed (Public browse, Private buy) | All Personas |
| **PROFILE** | 3 | `/profile/*`, `/dashboard/profile` | Mixed | Public & Authenticated |
| **DASHBOARD SHELL**| 2 | `/dashboard`, `/dashboard/privacy` | Yes | All Authenticated Users |
| **TOTAL** | **198** | — | — | — |

---

## 4. Key Reusable Component Layers

```
src/components/
├── ui/                     # 38 Primitive Shadcn components (Button, Dialog, Input, Table, etc.)
├── layout/                 # AppSidebar, Topbar, AuthGuard, MobileNav, Breadcrumbs
├── creator/                # AI Clarifier modal, Phase progress stepper, Branding palette editor
├── entrepreneur/           # Cap Table grid, ESOP calculator, Diligence room upload, KPI tracker
├── investor/               # Term sheet interactive builder, Match score card, Portfolio card
├── serviceprovider/ui/     # Custom SP design system (SpCard, SpMetricCard, SpPage, SpStatusBadge)
├── marketplace/            # ProjectCard, ServiceListingCard, FilterBar, BuyoutOfferModal
└── shared/                 # NotificationBell, MessageDrawer, RichTextDisplay, DocumentPreview
```

### Component Integrity Flags
- **Custom Design System**: The Service Provider dashboard strictly enforces its own UI design system located at `src/components/serviceprovider/ui/` (`SpCard`, `SpMetricCard`, `SpPage`). Raw shadcn cards are bypassed in SP views to preserve visual consistency with Figma specifications.
- **Dynamic Imports**: Heavy third-party UI dependencies such as `react-quill-new` (rich-text document editor in `/create-project` and business plan tools) use `next/dynamic` with `ssr: false` to avoid React hydration mismatches.
