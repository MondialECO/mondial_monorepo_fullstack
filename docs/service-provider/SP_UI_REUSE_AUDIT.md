# Service Provider UI Reuse Audit

## Purpose

The Service Provider experience must inherit the current Mondial.eco UI. The Stitch pack defines flow, hierarchy, and state coverage only. It does not define a new visual theme.

## Existing UI Sources To Reuse

- Dashboard shell: existing `/dashboard/*` layout, sidebar, topbar, page width, and muted canvas.
- Tokens: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `text-primary`, `border-border`, and semantic badge variants.
- Components: shadcn `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Tabs`, `Progress`, `Avatar`, `Dialog`, `Separator`, and existing empty/loading/error patterns.
- Typography: Geist Sans via `font-sans`; no Stitch font imports.
- Icons: `lucide-react` only.
- Comparable screens: creator dashboard, creator marketplace, creator messenger, investor discovery/pipeline, entrepreneur phase pages, and the existing service provider profile workspace.

## Module Mapping

| SP module | Existing UI pattern | Implementation direction |
| --- | --- | --- |
| SP dashboard | Creator/investor dashboard cards and KPI strips | Compact operational overview with cards, progress, next actions, and locked states |
| Phase 2 verification | Existing service provider profile and Universal Phase 1 verification | Sequential card-based wizard using badges, progress, and category-specific credential rows |
| Service builder | Creator phase setup and form cards | Six-step wizard in existing card/form language with pricing/package preview |
| My Services | Creator marketplace and dashboard lists | Service cards with analytics, status badges, and row actions |
| Profile and availability | Existing `ProfileWorkspace` and `PortfolioSection` | Keep current profile API-backed editor and extend visually with availability/capacity states later |
| Leads and briefs | Investor discovery list and creator hire-provider patterns | Two inbox tabs with match score, response timer, role badge, and clear CTA |
| Proposals and contracts | Investor pipeline/deals patterns | Kanban-style status cards and escrow/contract gate cards |
| Messenger | Creator messenger hierarchy | Three-column SP messenger adapted to current card, avatar, badge, button, and token system |
| Workroom | Creator messenger workroom and investor data-room details | Project tabs/cards for milestones, files, timer, revisions, and disputes |
| Earnings and analytics | Investor KPI and entrepreneur financial dashboards | KPI tiles, payout status, invoice rows, growth analytics |
| Tier and reputation | Existing score/progress cards | Tier progress, Mondial Score breakdown, upgrade requirements |
| Notifications/settings | Creator notification/settings surfaces | Filter tabs, notification rows, and horizontal settings groups |

## Visual Acceptance Guardrails

- No inline hex colors in new SP components.
- No raw `<button>` or `<img>` in new SP pages.
- No duplicate sidebar or alternate dashboard shell.
- No copied Stitch CSS, font choices, shadows, or hardcoded layout palette.
- All new visible UI copy is English.
- Light and dark mode use existing semantic tokens.

## Current Implementation Baseline

- `/dashboard/serviceprovider/profile` already exists and uses `ProfileWorkspace`.
- `ProfileWorkspace` already uses shadcn cards, badges, progress, inputs, textareas, and existing service provider profile hooks.
- `src/types/service-provider.ts` currently supports profile, verification, portfolio, categories, and pricing models.
- The first implementation pass should add SP navigation and route scaffolds around the existing profile surface without replacing the profile API workflow.
