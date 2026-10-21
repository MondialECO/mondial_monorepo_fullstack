# MBC Creator Homepage & Brand Identity Canon (Figma 57349:8209)

## 1. Overview & Authority
This document defines the canonical specification and implementation architecture for the **Mondial Business Creation (MBC) Creator Marketing Homepage** (Figma Frame `57349:8209` / Nodes `57375:8951`, `57424:508`, `57381:10846`, `57381:10882`) and the global **MBC Logo Standard** across the entire fullstack monorepo.

- **Figma File:** `yLDPLB9hIAIqfYY9uHuJom` (Mondial-Dashboard-EDU)
- **Primary Design Node:** `57349:8209` (Creator Marketing Landing Page)
- **Header Navigation Design Node:** `57381:10846` (Public Header with 5-link Nav & Dual CTAs)
- **Action Roadmap Design Node:** `57375:8951` (Output 05 Schedule Breakdown)
- **Trust Sources Design Node:** `57424:508` (Official French Sources Trust Section)
- **Footer Design Node:** `57381:10882` (5-Column Site Footer with Ambient Watermark)
- **Primary Route:** `src/app/page.tsx`
- **Component Root:** `src/components/homepage/` & `src/components/shared/`

---

## 2. MBC Logo Standards & Global Usage
The platform utilizes the official MBC (Mondial Business Creation) squircle monogram brand asset.

- **Asset Path:** `/images/mbc-logo.png`
- **Standard Dimensions:** Width `95px`, Height `46px` (`w-[95px] h-[46px] p-1`)
- **Presentation Policy:** Shadow-free, clean container, `object-contain`, responsive scaling.

### Standardized Layout Locations:
1. **Public Header (`src/components/shared/PublicHeader.tsx`):** `w-[95px] h-[46px] p-1`, aligned with `CREATOR` pill badge and `MONDIAL BUSINESS CREATION` title.
2. **Public Footer (`src/components/shared/Footer.tsx`):** `w-[95px] h-[46px] p-1` brand lockup with `MBC` header and `MONDIAL BUSINESS CREATION` subtitle.
3. **App Sidebar (`src/components/layout/AppSidebar.tsx`):** Desktop and Mobile headers rendered at `w-[95px] h-[46px] p-1` without outer borders or shadow.
4. **Topbar (`src/components/layout/Topbar.tsx`):** Reduced phase and general headers rendered at `w-[95px] h-[46px] p-1`.
5. **Service Provider Headers (`src/components/serviceprovider/`):** Desktop Topbar and Mobile Header rendered at `w-[95px] h-[46px] p-1`.
6. **Onboarding Layout (`src/app/onboarding/layout.tsx`):** Header logo container rendered at `w-[95px] h-[46px] p-1`.
7. **Dashboard Redirect (`src/app/dashboard/page.tsx`):** Loading brand tile rendered at `w-[95px] h-[46px] p-1`.

---

## 3. Global Navigation Header (`src/components/shared/PublicHeader.tsx` — Figma Node `57381:10846`)
- **Container:** Sticky top navbar (`sticky top-0 z-50`) with glassmorphism `bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-[#e8ecf2] dark:border-border/80`.
  - Active scroll elevation (`isScrolled`): dynamically applies `shadow-xs bg-white/98` when scrolled > 8px.
  - Page wrapper uses `overflow-x-clip` (`src/app/page.tsx`) to ensure flawless sticky tracking without clipping or scroll containment issues.
- **Left (Brand Lockup):**
  - Squircle MBC Monogram (`95x46px`).
  - `CREATOR` badge (`bg-[#e8eeff]`, text `#1f3faf`, font-mono).
  - `MONDIAL BUSINESS CREATION` title (`font-mono`, uppercase, tracking).
- **Center (Main Navigation — 5 Links):**
  1. `How it works` (`#how-it-works`)
  2. `Creator Tools •` (`#outputs` — featuring sapphire indicator dot `#3c61dd`)
  3. `What you get` (`#outputs`)
  4. `Pricing` (`#faq`)
  5. `FAQ` (`#faq`)
- **Right (Dual Conversion CTAs):**
  - Secondary: `Sign in` (clean text link, 14px font-medium, `#667085`).
  - Primary CTA: `Start for €0 →` (`bg-[#3c61dd]`, 14px font-medium, `rounded-[12px]`, shadow-sm, hover slide effect).
- **Mobile Responsive Drawer:** Collapsible hamburger drawer with all 5 navigation links and dual action buttons.

---

## 4. Homepage Section Architecture

The Creator homepage consists of 7 structured sections organized linearly:

### Section 1: Hero Deck (`src/components/homepage/FigmaHero.tsx` — Figma Node `57449:112`)
- **Eyebrow Badge (Figma 57449:113):** `MBC CREATOR · FRANCE` (uppercase, letter-spacing 1.04px) with sapphire indicator dot (`#3c61dd`).
- **Hero Headline (Figma 57449:120):**
  - Line 1: `MBC` (Inter 700 / Bold, Mondial Royal Blue `#3c61dd`)
  - Line 2: `The Intelligent` (Inter 600 / SemiBold)
  - Line 3: `Toolbox` (Inter 600 / SemiBold)
  - Metric: 54px, lh: 61px, center-aligned.
- **Subheading / Value Proposition (Figma 57449:1584):** `Start your digital business for €0.` (Inter 600, 24px, lh: 31px, center-aligned).
- **Subtitle (Figma 57449:121):** `One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch.` (DM Sans 400, 16px, relaxed, center-aligned).
- **Dual CTA (Figma 57449:122):**
  - `Start for €0 →` (`bg-[#3c61dd]`, 153x48px, r: 13px).
  - `See how it works` (white card, border `#e6eaf2`, smooth-scrolls to `#how-it-works`).
- **Visual Mockup Deck:**
  - 3D 0€ Atmospheric Background Graphic (`996x339px`, elevated position behind CTA buttons).
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

### Section 3: How It Works (`src/components/homepage/FigmaHowItWorks.tsx` — Figma Node `57377:9704`)
- **Headline:** `From idea to company in 6 steps.`
- **Subline:** `Go one step at a time. Everything you make is saved and feeds the next step.`
- **Dynamic 6-Step Spine Stepper & Scrollspy:**
  - Dynamic viewport tracking (`useEffect` scroll listener + `IntersectionObserver` threshold): automatically updates the active step (1 to 6) as the user scrolls through the 6 phase cards.
  - **Node States:**
    - `Active Step (s === activeStep)`: Solid Royal Blue (`bg-[#3c61dd] text-white`), outer glow ring (`ring-4 ring-[#3c61dd]/20`), scale transition.
    - `Completed Steps (s < activeStep)`: Soft blue pill (`bg-[#e8eeff] text-[#1f3faf]`) with green checkmark badge (`✓` `#00c896`).
    - `Upcoming Steps (s > activeStep)`: Clean white tile (`bg-white border-[#e3e8f2] text-[#667085]`).
  - **Dynamic Connector Track:** Unbroken vertical rail; Royal Blue active fill expands down from Step 01 to the current active step node.
  - **Click-to-Scroll Navigation:** Clicking any spine node (01–06) or bottom breadcrumb button smooth-scrolls directly to that phase card.
- **6 Step Progression Cards (P1 to P6):**
  - Phase 1: `Start with you` (`PHASE 01 · YOU` — Builder profile)
  - Phase 2: `Shape your idea and brand` (`PHASE 02 · PROJECT & BRAND` — Brand Kit & Bento tiles)
  - Phase 3: `Build the business behind your idea` (`PHASE 03 · BUSINESS PLAN` — Core Phase Centerpiece & 7-step Intelligence)
  - Phase 4: `Get ready to build and launch` (`PHASE 04 · BUILD & LAUNCH PREP` — 90-day horizon & Launch website)
  - Phase 5: `Create your company` (`PHASE 05 · COMPANY` — SAS/SAS-U French registration guide)
  - Phase 6: `See what you built, and keep going` (`PHASE 06 · NEXT CHAPTER` — Milestone dashboard & Next Move)
- **Interactive Breadcrumb Sequence:** Clickable bottom breadcrumbs (`You` → `Brand` → `Business plan` → `Launch plan` → `Company` → `Next chapter`) reflecting active scroll state.

### Section 4: Where The Facts Come From (`src/components/homepage/FigmaTrustSources.tsx` — Figma Node `57424:508`)
- **Location:** Placed directly between Section 3 (*From idea to company in 6 steps*) and Section 5 (*What's Next*).
- **Eyebrow Badge:** `WHERE THE FACTS COME FROM` (`bg-[#e8eeff]`, text `#1f3faf`, dot `#3c61dd`).
- **Headline:** `We don't guess.` + `<span class="text-[#3c61dd]">We check.</span>` (Inter 700 / 54px).
- **Subline:** `AI helps explain things in plain words. But the rules, the grants and the paperwork? Those come straight from official French sources.`
- **Left Column:**
  - Interactive Proof Card: Legal checklist example ("*Declare who owns your company*") with official source link `Source: service-public.fr` and metadata.
  - Curved Dotted Annotation: Exact Figma vector path (SVG `57424:544`) with callout pill "*See? It tells you where it got that.*" positioned below the proof card with comfortable breathing room.
- **Right Column (3 Grouped Source Panels with 20px gap):**
  - **Panel 1 (*Setting up your company* - Scale SVG `57424:554`):**
    - `Service Public Entreprendre`: *The government's own guide to the legal stuff.* (`• OFFICIAL`)
    - `INPI Guichet unique`: *Where you actually register your company.* (`• OFFICIAL`)
  - **Panel 2 (*Money and help you can apply for* - Coins SVG `57424:589`):**
    - `Aides-entreprises / data.gouv.fr ↗`: *Public grants and support, all in one list.* (`• OPEN DATA`, soft blue highlight card `bg-[#f2f5ff]`)
    - `Bpifrance Création`: *Practical guides for starting out.* (`• OFFICIAL`)
    - `France Travail`: *ARCE and ACRE, if you qualify.* (`• OFFICIAL`)
  - **Panel 3 (*Checking other companies* - Building SVG `57424:638`):**
    - `API Recherche d'entreprises`: *Look up any French company in seconds.* (`• OPEN DATA`)
    - `SIRENE`: *Show your company is officially registered.* (`COMING SOON`)
    - Layout styling: `opacity-70` with `hover:opacity-100` transition.
- **Bottom Trust Strip (1184px rounded 16px container):**
  - Item 1: `You can always see where info came from.` (`#00c896` check in soft green circle)
  - Item 2: `Grants say 'you can apply', never 'you'll get it'.` (`#00c896` check in soft green circle)
  - Item 3: `Your changes stay yours. Nothing gets overwritten.` (`#00c896` check in soft green circle)

### Section 5: What's Next & Ecosystem (`src/components/homepage/FigmaWhatsNext.tsx` — Figma Node `57381:10328`)
- **Eyebrow Badge:** `WHAT'S NEXT`
- **Headline:** `Creator is just the beginning.`
- **Subtitle:** `Once your project is structured, Mondial opens doors to funding, services, and growth.`
- **Central Hub Node:** `Project Built (Creator Hub)`
- **4 Satellite Pathways:**
  - `Sell on Marketplace` (Full buyout or equity transfer)
  - `Find a Co-Founder / Investor` (Venture matching)
  - `Hire Verified Service Providers` (Lawyers, accountants, developers)
  - `Level Up to Entrepreneur` (Full operating business)

### Section 6: FAQ (`src/components/homepage/FigmaFaq.tsx` — Figma Node `57354:15783`)
- **Headline:** `What "Start for €0" really means`
- **Interactive Accordion:** Category filtering (All, Pricing, IP & Ownership, Launch), full-text search, expandable items.

### Section 7: Final CTA (`src/components/homepage/FigmaFinalCta.tsx` — Figma Node `57354:15831`)
- **Headline:** `Start your digital business for €0.`
- **Action:** Primary `Start for €0 →` button with subtle trust markers.

---

## 4.1 Wireframe Deliverables & Video Bleed Showcase (Figma Node `57480:109`)
For high-conversion visual storytelling, the platform incorporates the canonical Wireframe Showcase architecture (`src/components/homepage/wireframe/`):
- **Hero Canvas (`WireframeHero.tsx` — Figma 57480:110):** `min-h-[560px] lg:h-[740px]`, background `#F7F9FC`, Inter 600 headline with `32px/44px/54px`, and primary CTA `Start for €0 →`.
- **01 · Brand Kit (`BrandKitVisual.tsx` — Figma 57500:123):** Tablet canvas with 4 rotated satellite cards (`Logo -6deg`, `Colours +4.5deg`, `Typography -3.5deg`, `Brand kit +3deg`), official SVG curved dashed connectors, and sparkles.
- **02 · Business Plan (`WireframeDeliverables.tsx` — Figma 57500:254):** Video Player 1 (`1263px`) overflowing to the right edge with `w-[1263px]`, clipped by `overflow-hidden`.
- **03 · Financial Forecast (`FinancialForecastVisual.tsx` — Figma 57500:373):** Vector dashboard screen with 4 metric satellite cards (`Revenue -8deg`, `Break-even +9deg`, `Cash -7deg`, `Unit economics +7deg`).
- **04 · Market Research (`MarketResearchVisual.tsx` — Figma 57500:912):** Vector analysis screen with 4 insight cards (`Market size -8deg`, `Target users +9deg`, `Competitors -7deg`, `Demand +7deg`).
- **05 · Action Roadmap (`WireframeDeliverables.tsx` — Figma 57501:1033):** Video Player 2 (`1263px`) overflowing to the left edge with `2xl:-ml-[116px]`, copy on right.
- **06 · Business Setup (`WireframeDeliverables.tsx` — Figma 57503:9257):** Video Player 3 (`1281px`) overflowing to the right edge, blueprint poster, copy on left. Container width: `max-w-[1980px]`.

---

## 5. Global Site Footer (`src/components/shared/Footer.tsx` — Figma Node `57381:10882`)
- **Container Architecture:** Aligned to the 1980px wireframe layout standard:
  ```tsx
  <div className="relative z-10 w-full max-w-[1980px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-[100px] 2xl:px-[190px] pt-16 lg:pt-20 pb-12">
  ```
- **Background & Theme:** `bg-[#F7F9FC] dark:bg-[#070b14] border-t border-[#e3e8f2] dark:border-border/80 transition-colors`.
- **Ambient Watermark Graphic:** Native Figma Progress / Network motif (SVG `57381:10884`) positioned subtly on the top-right side.
- **Responsive 5-Column Grid (`grid-cols-2 md:grid-cols-12 gap-8 lg:gap-8 xl:gap-12`):**
  - **Column 1 (Brand & Socials — `col-span-2 md:col-span-12 lg:col-span-4`):** MBC Logo (`95x46px`), `MBC` title, `MONDIAL BUSINESS CREATION` overline, supporting copy ("*Build your digital business from idea to launch. Start building for €0.*"), paragraph, and outline social icon boxes (LinkedIn, Instagram, X).
  - **Column 2 (PRODUCT — `col-span-1 md:col-span-3 lg:col-span-2`):** `Creator •` (active sapphire dot indicator), `Creator Tools`, `How it works`, `What you get`, `Pricing`.
  - **Column 3 (RESOURCES — `col-span-1 md:col-span-3 lg:col-span-2`):** `FAQ`, `Guides`, `Contact`.
  - **Column 4 (MBC NETWORK — `col-span-1 md:col-span-3 lg:col-span-2`):** `Entrepreneur`, `Investor`, `Service Provider` (each styled with a `Coming soon` badge with `shrink-0 whitespace-nowrap`).
  - **Column 5 (LEGAL — `col-span-1 md:col-span-3 lg:col-span-2`):** `Terms of Use`, `Privacy Policy`, `Cookie Policy`.
- **Bottom Bar:**
  - Copyright: `© 2026 Mondial Business Création. All rights reserved.`
  - Tagline & Origin: Emerald green indicator dot + `Made for the next generation of founders. | Paris, France | LanguageSwitcher`.

---

## 6. Verification & Testing
- **Test Suite:** `src/__tests__/app/homepage-figma-57349-8209.test.tsx` (Homepage wireframe, hero, deliverables validation)
- **Footer Suite:** `src/__tests__/shared/footer-i18n.test.tsx` (Footer bilingual rendering, accessibility, and link verification)
- **Header Suite:** `src/__tests__/shared/header-i18n.test.tsx` (Public header navigation, dropdowns, and i18n testing)
- **Coverage:** 100% passing tests across unit, integration, and production builds (`npm run build`).
