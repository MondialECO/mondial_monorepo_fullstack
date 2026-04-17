# Mondial.Client — Claude Project Guide

Next.js 16 + React 19 + Tailwind 4 + shadcn/ui app. Multi-role dashboard SaaS (admin, advisor, creator, founder, investor) with a marketing homepage.

Keep this file short. Read it, act, don't re-explain it back to me.

## Stack (versions pinned, don't suggest upgrades unless asked)

- Next.js 16 (App Router, React Compiler ON via `next.config.ts`)
- React 19.2, TypeScript 5, ES2020 target
- Tailwind 4 (via `@tailwindcss/postcss`), shadcn/ui "new-york" style, neutral base
- State: Zustand (global), TanStack Query (server), Context (auth only)
- Animations: framer-motion. Icons: lucide-react ONLY.
- HTTP: axios (`src/lib/axios.ts` — shared interceptor)
- Themes: next-themes, class strategy, default "light"

## File map (source of truth)

```
src/
  app/
    (auth)/              Login / signup / password flows
    dashboard/           Role-based dashboards; layout.tsx wraps with AuthGuard
    create-project/      Multi-step form (uses react-quill-new, dynamic import)
    _providers/          RootProviders, AuthProvider, ReactQueryProvider
    layout.tsx           Root layout — has metadata + viewport
    error.tsx / not-found.tsx
    globals.css          Theme tokens live here (light + .dark blocks)
  components/
    ui/                  shadcn primitives — ALWAYS reuse before creating new
    layout/              AppSidebar, Topbar, AuthGuard
    homepage/            Marketing sections
    auth/, billing/, founder/, messages/, shared/
  context/AuthContext.tsx
  hooks/                 useBreadcrumb, use-mobile
  lib/                   axios, roles, menu config, utils (cn)
  types/                 TS interfaces
  styles/fonts.css
```

## Design system rules (hard rules — do not violate)

1. **Colors: only theme tokens.** Never write `#hex` or `bg-[#xxxxxx]` in components. If you need a color, add it to `src/app/globals.css` in both `:root` and `.dark` as a CSS var, then reference `bg-primary`, `text-foreground`, etc.
2. **Icons: lucide-react only.** Never `react-icons` (being removed). Never SVG with hardcoded fills — use `currentColor` or a theme var.
3. **Primitives: use `components/ui/` before building new.** Never raw `<button>`, `<input>`, `<a>` inside pages — use `Button`, `Input`, `Link` (next/link) or the shadcn wrapper.
4. **Images: always `next/image`.** Never `<img>`. Check `ImageWithFallback.tsx` for the reusable wrapper.
5. **Dark mode: every new component must work in both themes.** Sanity-check by reading the `.dark` block in `globals.css` and avoiding fixed grays.
6. **Radius scale:** use `rounded-md/lg/xl/2xl` — they're wired to `--radius` in globals.css.

## Perf rules (hard rules)

1. **Default to Server Components.** Only add `"use client"` when you need state, effects, browser APIs, or event handlers. Push the boundary as DEEP as possible (wrap only the interactive leaf, not the whole page).
2. **Dynamic import heavy client libs** (`react-quill-new`, `@uiw/react-md-editor`, chart libs) with `ssr: false` where appropriate.
3. **Scroll / resize / mousemove handlers** must use `requestAnimationFrame` + `useTransition` (see `HeroSection.tsx` for the pattern). Never `setState` on every scroll frame.
4. **React Compiler is ON** — do NOT add `useMemo` / `useCallback` defensively. Only when profiling shows a need.
5. **Avoid importing large JSON into client components.** Fetch via Server Component or route handler.
6. **Fonts:** use `next/font` or `@fontsource/*` already installed; never Google font `<link>` tags.

## Code conventions

- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`.
- `cn()` from `@/lib/utils` for class merging.
- API calls go through `src/lib/axios.ts` — don't spawn new clients.
- Auth gating: wrap protected trees in `AuthGuard` (already in dashboard layout).
- Forms: prefer shadcn `Form` + zod when you need validation.
- Error boundaries exist at `app/error.tsx` and `app/dashboard/error.tsx`.

## Known issues to fix on sight (cleanup backlog)

- **Unused deps** in `package.json`: `wouter`, `react-icons`, `@uiw/react-md-editor`, `marked`. Remove if you touch package.json.
- **Hardcoded hex colors** in `components/homepage/HeroSection.tsx` (`#FAFAFA`, `#070707`), `components/homepage/FeaturesSection.tsx` (`#3C61DD`), `components/shared/ProjectCard.tsx` (SVG `fill="#2563EB"`). Move to theme tokens.
- **Raw `<img>`** in `components/shared/ProjectCard.tsx`. Convert to `next/image`.
- **Over-broad `"use client"`** in `components/homepage/FeaturesSection.tsx`, `ProfileCard.tsx`, `layout/Topbar.tsx`, `dashboard/creator/settings/page.tsx`. Push boundary inward.

## Cost & token discipline (read this)

- **Be terse.** No preamble. No "I will now...", no recap of my request. Edit, then report in <=3 lines.
- **Never paste whole files back at me.** Use `Edit` for targeted changes. Only re-show hunks I'd need to review.
- **Don't re-read files you just edited.** The tool errors if the edit failed; trust it.
- **Use Grep/Glob before Read.** Don't Read a file "to explore" — search for the symbol or pattern you need.
- **Parallelize independent reads** in one tool-call block.
- **Don't run `npm install`, `npm run build`, or `next dev` unless I ask.** These are expensive and slow.
- **Delegate big scans** to a subagent (`Explore`) so the context stays out of the main turn.
- **Ask before big refactors.** A 10-file change should get one confirming question first.

## Workflow for common tasks

- **New UI screen** → check `components/ui/`, then sections in `components/homepage/` or `components/layout/` for the pattern. Build as Server Component by default. Client boundary only at the interactive leaf.
- **New shadcn component** → `npx shadcn@latest add <name>`, don't hand-roll.
- **Styling** → Tailwind utilities + theme tokens. No CSS files except globals.css and fonts.css.
- **Data fetching** → Server Component with `fetch` (cached by default) OR TanStack Query on the client.
- **Forms** → shadcn `Form` + `react-hook-form` + `zod`.

## Commands

- `npm run dev` — dev server (don't run without being asked)
- `npm run build` — production build (don't run without being asked)
- `npm run lint` — eslint (safe to run)

## Reference docs on disk

- `PERFORMANCE_AUDIT_FIXES.md` — historical audit record (March 2026). Don't duplicate its fixes.
