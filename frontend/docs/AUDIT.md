# Mondial.Client — Full Project Audit
**Date:** 2026-05-19 | **Target:** MVP launch in 3 days | **Branch:** devreza

---

## Priority Index (fix in this order)

| # | Issue | Area | Effort | Impact |
|---|-------|------|--------|--------|
| 1 | ESLint errors blocking `npm run build` | Build | 30 min | CRITICAL |
| 2 | Missing Zod validation on `/login` | Security | 30 min | HIGH |
| 3 | `NEXT_PUBLIC_DEV_MODE` not in `.env.example` | Config | 5 min | HIGH |
| 4 | Remove 4 unused dependencies (`wouter`, `react-icons`, `@uiw/react-md-editor`, `marked`) | Bundle | 15 min | MEDIUM |
| 5 | `useMemo`/`useCallback` conflicts with React Compiler | Perf | 20 min | MEDIUM |
| 6 | 35+ hardcoded hex colors → theme tokens | Design | 1–2 hrs | MEDIUM |
| 7 | 3 raw `<img>` in `FeaturesSection2.tsx` → `next/image` | Design | 10 min | LOW |
| 8 | 6+ raw `<button>` elements → shadcn `<Button>` | Design | 30 min | LOW |
| 9 | `console.log` leaking auth state in prod | Security | 15 min | LOW |
| 10 | Dark-mode gaps across homepage/navbar | Design | 45 min | LOW |

---

## 1. Build Blockers (CRITICAL — fix before any deploy)

| File | Issue | Fix |
|------|-------|-----|
| `src/app/(auth)/login/page.tsx` | `any` type violation (eslint error) | Type the form state and API response |
| `src/app/(auth)/signup/page.tsx` | `any` type + unescaped `'` entities | Add types; replace `'` with `&apos;` |
| `src/app/(auth)/change-password/page.tsx` | `any` type violation | Type form/API values |
| `src/app/(auth)/forgot-password/page.tsx` | `any` type violation | Type form/API values |
| `src/app/create-project/page.tsx` | `any` type violation | Type step/form state |
| `src/app/_providers/AuthProvider.tsx` | `setState` inside effect (cascading render risk) | Use effect callback pattern |

> **10 ESLint errors total** (6× `no-explicit-any`, 3× unescaped entities, 1× setState-in-effect). These will **fail `npm run build`** — fix these first.

---

## 2. Security Issues

| File | Risk | Issue | Fix |
|------|------|-------|-----|
| `src/app/(auth)/login/page.tsx` | HIGH | No Zod schema validation — only HTML5 `required` | Copy `credentialsSchema` pattern from signup |
| `src/app/(auth)/signup/page.tsx` | MEDIUM | Signup form bypasses Zod (applies schema only at `CredentialsStep`) | Apply validation before `registerApi()` call |
| `src/components/layout/AuthGuard.tsx` | MEDIUM | Role comparison via string manipulation — casing mismatch risk | Compare against `UserRole` enum, not raw strings |
| `src/components/entrepreneur/RouteGuard.tsx:26` | LOW | `NEXT_PUBLIC_DEV_MODE=true` disables all phase guards | Never set in `.env.production`; add `.env.example` entry |
| Multiple auth files | LOW | 15+ `console.log` calls leak auth state | Wrap with `if (process.env.NODE_ENV === 'development')` |
| `src/lib/axios.ts:71` | MEDIUM | Token passed in Authorization header during refresh | Accept risk for MVP or move to HTTP-only cookies (requires backend) |

---

## 3. Performance Issues

| File | Issue | Fix |
|------|-------|-----|
| `src/app/create-project/page.tsx:354–366` | `useMemo` on quill toolbar config — redundant with React Compiler ON | Remove `useMemo`; Compiler handles it |
| `src/components/ui/sidebar.tsx:76,92,116` | Multiple `useCallback`/`useMemo` — Compiler conflict risk | Remove hooks; let Compiler auto-memoize |
| `src/lib/api-creator-dashboard.ts` | All functions return placeholder data — no real API calls | Wire up axios instance before launch |
| `src/lib/api-investor-dashboard.ts` | All functions return placeholder data — no real API calls | Wire up axios instance before launch |

---

## 4. Design System Violations

### 4a. Hardcoded Hex Colors (35+ instances)

| File | Line | Snippet | Suggested Token |
|------|------|---------|-----------------|
| `src/components/homepage/HeroSection.tsx` | 60 | `bg-[#FAFAFA]` | `bg-background` or `bg-muted` |
| `src/components/homepage/HeroSection.tsx` | 64 | `via-[#ECECED] to-[#FAFAFA]` | CSS gradient token in `globals.css` |
| `src/components/homepage/HeroSection.tsx` | 75–78 | `bg-[#ebd5c1]`, `bg-[#f1dfcd]` etc. | Palette tokens for skin tones |
| `src/components/homepage/HeroSection.tsx` | 81 | `bg-[#E5F7ED]`, `text-[#00A854]` | `bg-green-50`, `text-green-600` |
| `src/components/homepage/HeroSection.tsx` | 88 | `text-[#070707]` | `text-foreground` |
| `src/components/homepage/HeroSection.tsx` | 110 | `text-[#555555]` | `text-muted-foreground` |
| `src/components/homepage/HeroSection.tsx` | 120–126 | `bg-[#3D63DD]`, `text-white` etc. | `bg-primary`, `text-primary-foreground` |
| `src/components/homepage/AllProfileSection.tsx` | 7–27 | `text-[#AA2093]` etc. in data array | CSS token or Tailwind palette |
| `src/components/homepage/AllProfileSection.tsx` | 32 | `bg-[#FAFAFA]` | `bg-muted` |
| `src/components/homepage/Pricing.tsx` | 42,48,63,92 | `"#FF5F5F"`, `"#EED0E9"` etc. | Move to design tokens |
| `src/components/shared/Navbar.tsx` | 18,48 | `bg-[#3C61DD]` | `bg-primary` |

### 4b. Raw `<img>` Tags

| File | Line | Fix |
|------|------|-----|
| `src/components/homepage/FeaturesSection2.tsx` | 88 | Replace with `<Image>` from `next/image` |
| `src/components/homepage/FeaturesSection2.tsx` | 117 | Replace with `<Image>` from `next/image` |
| `src/components/homepage/FeaturesSection2.tsx` | 147 | Replace with `<Image>` from `next/image` |

### 4c. Raw HTML Primitives

| File | Line | Primitive | Fix |
|------|------|-----------|-----|
| `src/components/shared/Navbar.tsx` | 29 | `<button>☰</button>` | `<Button variant="ghost">` |
| `src/components/shared/Navbar.tsx` | 48 | `<button>Get Started</button>` | `<Button>` |
| `src/components/homepage/HeroSection.tsx` | 120 | `<button>Get a Demo</button>` | `<Button>` |
| `src/components/homepage/AllProfileSection.tsx` | 115 | `<button>Explore →</button>` | `<Button variant="ghost">` |
| `src/components/homepage/Pricing.tsx` | 206, 261 | Multiple raw `<button>` | `<Button>` with variants |
| `src/components/founder/idea-card.tsx` | 99,105,183 | Raw `<button>` | `<Button>` |

### 4d. Dark-Mode Gaps

| File | Snippet | Fix |
|------|---------|-----|
| `src/components/homepage/HeroSection.tsx:60` | `bg-[#FAFAFA]` | Add `dark:bg-zinc-900` |
| `src/components/homepage/AllProfileSection.tsx:64` | `bg-[#F9F9FA]` | Add `dark:bg-zinc-800` |
| `src/components/homepage/Pricing.tsx:281` | `background: "#EDEDED"` (inline) | Move to Tailwind + `dark:` variant |
| `src/components/shared/Navbar.tsx:12` | `bg-white/70` | Add `dark:bg-zinc-900/70` |
| `src/app/dashboard/entrepreneur/phase-2/page.tsx:199` | `bg-blue-50` | Add `dark:bg-blue-950` |

---

## 5. Package Health

| Package | Status | Action |
|---------|--------|--------|
| `wouter` | UNUSED | Remove from `package.json` |
| `react-icons` | UNUSED | Remove from `package.json` |
| `@uiw/react-md-editor` | UNUSED | Remove from `package.json` |
| `marked` | UNUSED | Remove from `package.json` |
| `NEXT_PUBLIC_DEV_MODE` | MISSING | Add to `.env.example` with value `false` |
| TypeScript `strict: true` | OK | Already enabled |
| Next.js image domains | OK | `*.mondialbusiness.eu` configured |
| React Compiler | OK | Enabled in `next.config.ts` |

---

## 6. MVP Go/No-Go Checklist

- [ ] `npm run build` passes (fix 10 eslint errors first)
- [ ] `/login` has Zod validation
- [ ] `NEXT_PUBLIC_DEV_MODE` is `false` in production env
- [ ] Placeholder API functions in `api-creator-dashboard.ts` / `api-investor-dashboard.ts` replaced
- [ ] No `console.log` in auth flows in production
- [ ] 4 unused packages removed from `package.json`
