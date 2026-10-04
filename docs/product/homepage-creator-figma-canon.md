# MBC Creator Homepage & Brand Identity Canon (Figma 57349:8209)

## 1. Overview & Authority
This document defines the canonical specification and implementation architecture for the **Mondial Business Creation (MBC) Creator Marketing Homepage** (Figma Frame `57349:8209` / Node `57375:8951`) and the global **MBC Logo Standard** across the entire fullstack monorepo.

- **Figma File:** `yLDPLB9hIAIqfYY9uHuJom` (Mondial-Dashboard-EDU)
- **Primary Design Node:** `57349:8209` (Creator Marketing Landing Page)
- **Action Roadmap Design Node:** `57375:8951` (Output 05 Schedule Breakdown)
- **Primary Route:** `src/app/page.tsx`
- **Component Root:** `src/components/homepage/`

---

## 2. MBC Logo Standards & Global Usage
The platform utilizes the official MBC (Mondial Business Creation) squircle monogram brand asset.

- **Asset Path:** `/images/mbc-logo.png`
- **Standard Dimensions:** Width `95px`, Height `46px` (`w-[95px] h-[46px] p-1`)
- **Presentation Policy:** Shadow-free, clean container, `object-contain`, responsive scaling.

### Standardized Layout Locations:
1. **Public Header (`src/components/shared/PublicHeader.tsx`):** `w-[95px] h-[46px] p-1`, aligned with `CREATOR` pill badge and `MONDIAL BUSINESS CREATION` title.
2. **Public Footer (`src/components/shared/Footer.tsx`):** `w-[95px] h-[46px] p-1` brand lockup.
3. **App Sidebar (`src/components/layout/AppSidebar.tsx`):** Desktop and Mobile headers rendered at `w-[95px] h-[46px] p-1` without outer borders or shadow.
4. **Topbar (`src/components/layout/Topbar.tsx`):** Reduced phase and general headers rendered at `w-[95px] h-[46px] p-1`.
5. **Service Provider Headers (`src/components/serviceprovider/`):** Desktop Topbar and Mobile Header rendered at `w-[95px] h-[46px] p-1`.
6. **Onboarding Layout (`src/app/onboarding/layout.tsx`):** Header logo container rendered at `w-[95px] h-[46px] p-1`.
7. **Dashboard Redirect (`src/app/dashboard/page.tsx`):** Loading brand tile rendered at `w-[95px] h-[46px] p-1`.

---

## 3. Homepage Section Architecture

The Creator homepage consists of 6 structured sections organized linearly:

### Section 1: Hero Deck (`src/components/homepage/FigmaHero.tsx`)
- **Eyebrow Badge:** `MBC Creator · France` with sapphire indicator dot.
- **Hero Headline:** `Start your digital business for €0.` (Inter 600, 54px, lh: 65px).
- **Subtitle:** `One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch.` (18px, relaxed).
- **Dual CTA:**
  - `Start for €0 →` (`bg-[#3c61dd]`, 153x48px, r: 13px).
  - `See how it works` (white card, border `#e6eaf2`, smooth-scrolls to `#how-it-works`).
- **Visual Mockup Deck:**
  - 3D 0€ Atmospheric Background Graphic (`996x339px`, high elevation right behind CTA buttons).
  - Product Dashboard Screenshot (`724x507px`, rounded 14px, elevated shadow `0 25px 60px -15px rgba(0,0,0,0.3)`).
  - Bottom 15% overflow (`-mb-16 sm:-mb-20 md:-mb-24`) protruding underneath Section 2.

### Section 2: Outputs Showcase (`src/components/homepage/FigmaOutputsShowcase.tsx`)
- **Headline:** `Move from “I have an idea” to real business-ready outputs.`
- **Layer Stacking:** `relative z-10 bg-[#f7f9fc]` overlaying the Hero screenshot overflow.
- **6 Structured Output Cards:**
  1. `01 / Business Concept Sheet`: Concept validation and viability scoring.
  2. `02 / Brand Identity & Visual Asset Pack`: Logo variations, typography, color codes.
  3. `03 / AI Strategy & Financial Model`: 3-year projection models, unit economics.
  4. `04 / Construction Snapshot & Offer Setup`: GTM strategy, product architecture.
  5. `05 / Execution Schedule & Action Roadmap` (Figma Node `57375:8951`):
     - 4 balanced columns: `NOW` (active blue card), `NEXT 30 D`, `30–60 D`, `60–90 D`.
     - Exact status labels: `Priority 1`, `On Track`, `Scheduled`, `Future`.
  6. `06 / Investor Deck & Deal Room`: Executive summary and investor matching.

### Section 3: How It Works (`src/components/homepage/FigmaHowItWorks.tsx`)
- **Headline:** `From your first idea to your project launch.`
- **6 Step Progression Cards (P1 to P6):**
  - Phase 1: `Describe your idea`
  - Phase 2: `Brand & Visual Identity`
  - Phase 3: `Market Study & Financials`
  - Phase 4: `Construction Engine`
  - Phase 5: `Marketplace & Buyout`
  - Phase 6: `Legal Structuring & Launch`

### Section 4: Where The Facts Come From (`src/components/homepage/FigmaTrustSources.tsx` — Figma Node `57424:508`)
- **Eyebrow Badge:** `WHERE THE FACTS COME FROM`
- **Headline:** `We don't guess. We check.`
- **Subline:** `AI helps explain things in plain words. But the rules, the grants and the paperwork? Those come straight from official French sources.`
- **Left Column:**
  - Interactive Proof Card: Legal checklist example ("Declare who owns your company") with official source link `Source: service-public.fr`.
  - Curved Dotted Annotation: "See? It tells you where it got that."
- **Right Column (3 Grouped Source Panels):**
  - Panel 1 (*Setting up your company*): `Service Public Entreprendre` (OFFICIAL), `INPI Guichet unique` (OFFICIAL).
  - Panel 2 (*Money and help you can apply for*): `Aides-entreprises / data.gouv.fr` (OPEN DATA), `Bpifrance Création` (OFFICIAL), `France Travail` (OFFICIAL).
  - Panel 3 (*Checking other companies*): `API Recherche d'entreprises` (OPEN DATA), `SIRENE` (COMING SOON).
- **Bottom Trust Strip:**
  - `You can always see where info came from.`
  - `Grants say 'you can apply', never 'you'll get it'.`
  - `Your changes stay yours. Nothing gets overwritten.`

### Section 5: What's Next & Ecosystem (`src/components/homepage/FigmaWhatsNext.tsx`)
- **Headline:** `Take your project wherever it needs to go.`
- **Central Node:** `Project Built (Creator Hub)`
- **4 Satellite Pathways:**
  - `Sell on Marketplace` (Full buyout or equity transfer)
  - `Find a Co-Founder / Investor` (Venture matching)
  - `Hire Verified Service Providers` (Lawyers, accountants, developers)
  - `Level Up to Entrepreneur` (Full operating business)

### Section 6: FAQ (`src/components/homepage/FigmaFaq.tsx`)
- **Headline:** `Frequently Asked Questions`
- **Interactive Accordion:** Category filtering (All, Pricing, IP & Ownership, Launch), full-text search, expandable items.

### Section 7: Final CTA (`src/components/homepage/FigmaFinalCta.tsx`)
- **Headline:** `Turn your idea into a business project today.`
- **Action:** Primary `Start for €0 →` button with subtle trust markers.

---

## 4. Verification & Testing
- **Test Suite:** `src/__tests__/app/homepage-figma-57349-8209.test.tsx`
- **Layout Suite:** `src/__tests__/layout/`
- **Coverage:** All headline texts, CTA buttons, output cards, logo alt-attributes, responsive viewports, and navigation anchors are covered by automated unit tests.
