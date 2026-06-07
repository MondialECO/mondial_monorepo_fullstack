# Fix 01 — Entrepreneur dashboard crash (P0)

Scope: this one defect only. No features added; matching/escrow/reputation untouched.

## SECTION A — Root Cause
`EntrepreneurOverview` (`src/app/dashboard/entrepreneur/overview.tsx`, line 195) calls
`useEntrepreneurProgress()`, which throws if it isn't rendered inside
`EntrepreneurProgressProvider`.

The provider was declared **only** in the `(phases)` route-group layout
(`src/app/dashboard/entrepreneur/(phases)/layout.tsx`). The overview is served at
the entrepreneur **root** (`/dashboard/entrepreneur` → `page.tsx` re-exports
`./overview`), which is **outside** the `(phases)` group, so it rendered with no
provider in its tree → hook throws → caught by the dashboard `ErrorBoundaryHandler`
→ "Dashboard Error". Because the boundary sat at the section level, sidebar
navigation to Deals/Messages was also trapped.

The entrepreneur root layout (`src/app/dashboard/entrepreneur/layout.tsx`) was a
pass-through (`return children`) and supplied no provider.

## SECTION B — Files Modified
1. `src/app/dashboard/entrepreneur/layout.tsx` — wrap children in `EntrepreneurProgressProvider`.
2. `src/app/dashboard/entrepreneur/(phases)/layout.tsx` — remove the now-redundant nested provider (kept `AuthGuard` / `SidebarProvider` / `Topbar`).

This hoists the provider to the entrepreneur root so the overview, all `(phases)`
routes, Deals and Messages share **one** instance, and avoids a double-mounted
second state instance (which would double-fetch and race the localStorage draft
on phase routes). Safe because the parent `dashboard/layout.tsx` already supplies
`AuthGuard`, and the state hook seeds `INITIAL_PROGRESS` (non-null) so the overview
renders immediately, then hydrates from the backend.

## SECTION C — Exact Fix

`src/app/dashboard/entrepreneur/layout.tsx`
```tsx
import { EntrepreneurProgressProvider } from "@/providers/EntrepreneurProgressProvider";

export default function EntrepreneurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EntrepreneurProgressProvider>{children}</EntrepreneurProgressProvider>;
}
```

`src/app/dashboard/entrepreneur/(phases)/layout.tsx` — removed the
`EntrepreneurProgressProvider` import and wrapper; the rest is unchanged:
```tsx
import { SidebarProvider } from "@/components/ui/sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function PhaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
```

## SECTION D — Build Results
- Next.js dev server hot-recompiled both layouts with no compile error / overlay; modified routes served successfully.
- Full production `next build` and a complete `eslint` pass were **not** run (lint timed out on cold start; repo guidance is not to run heavy builds unprompted). Changes are 2 small layout files with no new types/deps. Recommend running `npm run build` in CI before release.

## SECTION E — Tests (live, browser)
- `/dashboard/entrepreneur` via in-app nav → renders full overview (Trust Score 78/100, "6 of 9 phases complete", phase cards). `crash:false`.
- `/dashboard/entrepreneur` hard reload (deep-link) → renders, `crash:false`.
- Regression — phase route `/dashboard/entrepreneur/phase-7` → renders ("Automated Readiness Review"), **no console errors** after clearing the buffer.
- Provider now loads real backend progress (Phase 7), confirming a single working instance across overview + phases.
- Pre-fix `useEntrepreneurProgress must be used within…` errors in the console are stale (timestamps predate the edit); none recur post-fix.

## SECTION F — Remaining Risks
- Deep-link/refresh on entrepreneur **sub-routes** (e.g. `/phase-1`) still bounces to the overview via the global dashboard auth-guard hydration race — pre-existing, separate from this crash, now lands on a working overview instead of a crash.
- `GET /api/entrepreneur/dashboard/stats` still 404s — not used by this overview (it reads progress via the company-progress API), so no impact here; flag separately.
- The `(phases)` layout still renders its own `Topbar`/`SidebarProvider` in addition to the parent `dashboard/layout.tsx` (pre-existing double-chrome); untouched to keep this fix minimal.
- Verified in dev only; confirm with a production build in CI.
