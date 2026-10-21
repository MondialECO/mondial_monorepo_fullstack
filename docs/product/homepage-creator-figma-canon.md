# MBC Creator Homepage & Brand Identity Canon (Figma 57554:12800 & 57510:9718)

## 1. Overview & Authority
This document defines the canonical specification and implementation architecture for the **Mondial Business Creation (MBC) Creator Marketing Homepage** (Figma Frame `57554:12800` — *Creator Landing page Upgrade V.3 Final*, `57510:9718` — *Creator Landing page Upgrade V.2*, and Wireframe Deliverables Frame `57480:109`) and the global **MBC Logo Standard** across the entire fullstack monorepo.

- **Figma File:** `yLDPLB9hIAIqfYY9uHuJom` (Mondial-Dashboard-EDU)
- **Primary Design Node (V.3 Final Canonical Canvas):** `57554:12800` (`1440x13376px` — *Creator Landing page Upgrade V.3 Final*)
- **V.2 Canonical Canvas:** `57510:9718` (`1980x14264px` — *Creator Landing page Upgrade V.2*)
- **Wireframe Deliverables Node:** `57480:109` / `57559:14378` / `57559:14241` / `57500:123` (`1440x5260px` — *Wireframe - 1*)
- **Header Navigation Design Node:** `57381:10846` (Public Header with 5-link Nav & Dual CTAs)
- **How It Works Design Node:** `57554:13619` / `57377:9704` (From idea to company in 6 steps with dynamic spine)
- **Trust Sources Design Node:** `57554:13262` / `57424:508` (Official French Sources Trust Section)
- **What's Next Design Node:** `57554:13448` / `57554:13451` / `57381:10444` (Future Network Map, Curved SVG Connectors & Creator Hub)
- **FAQ Design Node:** `57554:13570` / `57354:15800` (What €0 really means — 7-item accordion)
- **Final CTA Design Node:** `57554:13613` / `57354:15832` (Start for €0 banner — 36px radius, linear gradient)
- **Footer Design Node:** `57381:10882` (5-Column Site Footer with Ambient Watermark, 1920px Container)
- **Primary Route:** `src/app/page.tsx`
- **Component Root:** `src/components/homepage/` & `src/components/shared/`

---

## 2. Universal 45px Container Margin Alignment Standard

To ensure mathematical visual consistency and prevent staggered left/right indentations as users scroll down the page, all homepage sections strictly enforce the **Universal 45px Margin Rule**:

```tsx
// Outer section element encapsulates background, vertical rhythm, and horizontal boundary padding:
<section 
  id="section-anchor" 
  className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-[100px] px-4 sm:px-6 md:px-8 lg:px-[45px] bg-... border-b border-[#e8ecf2] dark:border-border"
  data-testid="section-id"
>
  {/* Inner container provides the shared max-width boundary without duplicate horizontal padding: */}
  <div className="w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto">
    {/* Section grid, flex rows, or content components */}
  </div>
</section>
```

### Governing Rules:
1. **Outer `<section>` Element:**
   - Must contain `px-4 sm:px-6 md:px-8 lg:px-[45px]`.
   - On desktop viewports (`lg` breakpoint $\ge 1024\text{px}$), left and right gutters are exactly `45px`.
   - On mobile/tablet viewports, gutters scale down smoothly (`16px`, `24px`, `32px`).
   - Must include `overflow-hidden` to clip background ambient glows, watermark SVGs, and dot grids.
2. **Inner Container Wrapper:**
   - Must contain `w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto`.
   - **Never** add secondary horizontal padding (e.g. `px-4`, `px-8`, `px-[45px]`) to the inner container wrapper; duplicate padding causes jarring 90px double-indents.
3. **Applies Universally Across:**
   - `WireframeHero.tsx`
   - `WireframeDeliverables.tsx` (`deliverable-brand-kit`, `deliverable-business-plan`, etc.)
   - `FigmaHowItWorks.tsx`
   - `FigmaTrustSources.tsx`
   - `FigmaWhatsNext.tsx`
   - `FigmaFaq.tsx`
   - `FigmaFinalCta.tsx`
   - `PublicHeader.tsx` & `Footer.tsx`

---

## 3. MBC Logo Standards & Global Usage
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

## 4. Global Navigation Header (`src/components/shared/PublicHeader.tsx` — Figma Node `57381:10846`)
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

## 5. Homepage Section Architecture (Figma 57554:12800 & 57510:9718)

The Creator homepage consists of 7 structured sections organized linearly, fully aligned with Figma Canvas **`57554:12800` ("Creator Landing page Upgrade V.3 Final")**:

### Section 1: Hero Deck (`src/components/homepage/FigmaHero.tsx` — Figma Node `57554:12801`)
- **Eyebrow Badge (Figma 57554:12803):** `MBC CREATOR · FRANCE` (uppercase, letter-spacing 1.04px) with sapphire indicator dot (`#3c61dd`).
- **Hero Headline (Figma 57554:12808):**
  - Line 1: `MBC` (Inter 700 / Bold, Mondial Royal Blue `#3c61dd`)
  - Line 2: `The Intelligent` (Inter 600 / SemiBold)
  - Line 3: `Toolbox` (Inter 600 / SemiBold)
  - Metric: 54px, lh: 61px, center-aligned.
- **Subheading / Value Proposition (Figma 57554:12809):** `Start your digital business for €0.` (Inter 600, 24px, lh: 31px, center-aligned).
- **Subtitle (Figma 57554:12810):** `One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch.` (DM Sans 400, 16px, relaxed, center-aligned).
- **Dual Responsive CTAs (Figma 57554:12812):**
  - `Start for €0 →` (Primary CTA: `w-full sm:w-auto min-w-[153px] px-6 h-[48px] whitespace-nowrap bg-[#3c61dd]`).
  - `See how it works` (Secondary CTA: `w-full sm:w-auto min-w-[176px] px-6 h-[48px] whitespace-nowrap`, smooth-scrolls to `#how-it-works`).
- **Visual Mockup Deck:**
  - 3D 0€ Atmospheric Background Graphic: `/homepage_figma/0_euro_transparent_background.png` (`996x339px`, transparent backdrop, elevated position behind CTA buttons).
  - Product Dashboard Screenshot: `/homepage_figma/screenshot_2026-10-02_at_3_00_34_am_1_fde9301e.png` (`724x507px`, rounded 14px, elevated shadow).
  - Bottom 15% overflow (`-mb-16 sm:-mb-20 md:-mb-24`) protruding underneath Section 2.
  - *Strict Boundary Note:* This section's visual layout is preserved as canonical and untouched.

### Section 2: Wireframe Deliverables & Video Bleed Showcase (`WireframeHero.tsx` + `WireframeDeliverables.tsx` — Figma Node `57480:109` / `57554:12800`)
- **Anchor Navigation:** Targetable via `id="outputs"` with `scroll-mt-20` for smooth scrolling from Header / Footer links.
- **Hero Intro (`WireframeHero.tsx` — Figma 57480:110):**
  - Eyebrow: `MBC CREATOR · FRANCE`
  - Headline: `Move from “I have an idea” to real business-ready outputs.`
  - Subtitle: `MBC Creator helps you create the documents and structure you need to understand your project, explain it clearly, and know what to do next.`
  - Action CTA: `Start for €0 →` (`w-full sm:w-auto min-w-[153px] px-6 h-[48px] whitespace-nowrap bg-[#3c61dd]`).
- **6 Structured Deliverable Cards with Bleed Videos (`WireframeDeliverables.tsx`):**
  1. `01 · Brand kit` (`BrandKitVisual.tsx` — Figma `57500:123`): Visual tablet canvas with 4 rotated satellite cards, curved dashed SVG arrows, and sparkles. Typography: Syne 800 54px.
  2. `02 · Business plan` (Figma `57500:254`): Video Player 1 (`1263px`, poster `/wireframe_figma/deliverable_02_business_plan.png`, video `/videos/business_plan_walkthrough.mp4`) bleeding into the right edge, copy on left. Typography: Syne 800 54px.
  3. `03 · Financial forecast` (`FinancialForecastVisual.tsx` — Figma `57500:373`): Vector screen with 4 financial satellite cards (`Revenue -8deg`, `Break-even +9deg`, `Cash -7deg`, `Unit economics +7deg`). Typography: Syne 800 54px.
  4. `04 · Market research` (`MarketResearchVisual.tsx` — Figma `57500:912`): Vector screen with 4 market cards (`Market size -8deg`, `Target users +9deg`, `Competitors -7deg`, `Demand +7deg`). Typography: Syne 800 54px.
  5. `05 · Action roadmap` (Figma `57559:14241`): Video Player 2 (`1263px`, poster `/wireframe_figma/deliverable_05_action_roadmap.png`, video `/videos/business_plan_walkthrough.mp4`) bleeding into the left edge, copy on right. Typography: Syne 800 54px.
  6. `06 · Business setup` (Figma `57559:14378`): Video Player 3 (`1281px`, poster `/wireframe_figma/deliverable_06_business_setup.png`, video `/videos/launch-plan-scroll.mp4`) bleeding into the right edge, copy on left. Container width: `max-w-[1980px]`. Typography: Syne 800 54px.

### Section 3: How It Works (`src/components/homepage/FigmaHowItWorks.tsx` — Figma Node `57554:13619` / `57377:9704`)
- **Headline:** `From idea to company in 6 steps.`
- **Subline:** `Go one step at a time. Everything you make is saved and feeds the next step.`
- **Container Architecture:** Aligned to outer `lg:px-[45px]` with inner `max-w-[1350px] 2xl:max-w-[1520px] mx-auto`.
- **Dynamic 6-Step Spine Stepper & Scrollspy:**
  - Viewport scroll tracking (`useEffect` scroll listener + `IntersectionObserver`): automatically highlights current active step (1 to 6).
  - Spine track with Royal Blue active fill expanding from Step 01 down to current active node.
  - Spine and card container spacing: `gap-6` (24px) with card column `flex-1 min-w-0`, preventing horizontal double-offsets.
  - Node States:
    - `Active Step (s === activeStep)`: Solid Royal Blue (`bg-[#3c61dd] text-white`), outer glow ring (`ring-4 ring-[#3c61dd]/20`), scale transition.
    - `Completed Steps (s < activeStep)`: Soft blue pill (`bg-[#e8eeff] text-[#1f3faf]`) with checkmark.
    - `Upcoming Steps (s > activeStep)`: Clean white tile (`bg-white border-[#e3e8f2] text-[#667085]`).
- **6 Step Progression Cards (P1 to P6):**
  - Phase 1: `Start with you` (`PHASE 01 · YOU` — Builder profile)
  - Phase 2: `Shape your idea and brand` (`PHASE 02 · PROJECT & BRAND` — Brand Kit & Bento tiles)
  - Phase 3: `Build the business behind your idea` (`PHASE 03 · BUSINESS PLAN` — Core Phase Centerpiece & 7-step Intelligence)
  - Phase 4: `Get ready to build and launch` (`PHASE 04 · BUILD & LAUNCH PREP` — 90-day horizon & Launch website)
  - Phase 5: `Create your company` (`PHASE 05 · COMPANY` — SAS/SAS-U French registration guide)
  - Phase 6: `See what you built, and keep going` (`PHASE 06 · NEXT CHAPTER` — Milestone dashboard & Next Move)
- **Interactive Breadcrumb Sequence:** Clickable bottom breadcrumbs (`You` → `Brand` → `Business plan` → `Launch plan` → `Company` → `Next chapter`).

### Section 4: Where The Facts Come From (`src/components/homepage/FigmaTrustSources.tsx` — Figma Node `57554:13262` / `57424:508`)
- **Location:** Anchored via `id="trust-sources"`.
- **Eyebrow Badge:** `WHERE THE FACTS COME FROM` (`bg-[#e8eeff]`, text `#1f3faf`, dot `#3c61dd`).
- **Headline:** `We don't guess.` + `<span class="text-[#3c61dd]">We check.</span>` (Inter 700 / 54px).
- **Subline:** `AI helps explain things in plain words. But the rules, the grants and the paperwork? Those come straight from official French sources.`
- **Left Column (5 Cols / Max 446px):**
  - Interactive Proof Card: Legal checklist example ("*Declare who owns your company*") with official source link `Source: service-public.fr` and metadata.
  - Curved Dotted Annotation: Exact Figma vector path (SVG `57424:544`) with callout pill "*See? It tells you where it got that.*" positioned below the proof card with comfortable breathing room.
- **Right Column (7 Cols / 3 Grouped Source Panels):**
  - **Panel 1 (*Setting up your company* - Scale SVG):** `Service Public Entreprendre` (`• OFFICIAL`) and `INPI Guichet unique` (`• OFFICIAL`).
  - **Panel 2 (*Money and help you can apply for* - Coins SVG):** `Aides-entreprises / data.gouv.fr ↗` (`• OPEN DATA`, soft blue highlight card `bg-[#f2f5ff]`), `Bpifrance Création` (`• OFFICIAL`), `France Travail` (`• OFFICIAL`).
  - **Panel 3 (*Checking other companies* - Building SVG):** `API Recherche d'entreprises` (`• OPEN DATA`) and `SIRENE` (`COMING SOON`).
- **Bottom Trust Strip (1184px rounded 16px container):**
  - Item 1: `You can always see where info came from.` (`#00c896` check in soft green circle)
  - Item 2: `Grants say 'you can apply', never 'you'll get it'.` (`#00c896` check in soft green circle)
  - Item 3: `Your changes stay yours. Nothing gets overwritten.` (`#00c896` check in soft green circle)

### Section 5: What's Next & Ecosystem (`src/components/homepage/FigmaWhatsNext.tsx` — Figma Node `57554:13448` / `57554:13451`)
- **Location:** Anchored via `id="whats-next"`.
- **Atmosphere:** 48px dot grid pattern fading outwards and radial center ambient glow (`700x700px`, `radial-gradient(circle, rgba(60, 97, 221, 0.12) 0%, transparent 70%)`).
- **Intro Stack (Max 785px):**
  - Eyebrow Badge: `WHAT'S NEXT` (`bg-[#e8eeff]`, text `#1f3faf`, blue dot).
  - Headline (Syne 700 54px): `Creator is just the` + `<span class="text-[#3c61dd]">beginning.</span>`.
  - Subline: `Build your project today. Soon, MBC connects you to the people who help it grow.`.
- **Orbital Network Diagram (1152x470px):**
  - Exact Figma curved SVG connector paths with linear gradient stops (`paint0`–`paint3`) and sapphire dots.
  - **4 Satellite Cards (`260x148px`, `rounded-[20px]`, `p-6`):**
    1. Top-Left: `Entrepreneur` (Briefcase icon, `SOON` pill badge, `Run your company once it's registered.`).
    2. Bottom-Left: `Investor` (TrendingUp line chart icon, `SOON` pill badge, `Show your project to people who fund.`).
    3. Top-Right: `Service Provider` (UserCog icon, `SOON` pill badge, hover border `#3c61dd/40`, `Hire experts when you need help.`).
    4. Bottom-Right: `Marketplace` (LayoutGrid 4-box icon, `SOON` pill badge, `Projects, people and services in one place.`).
  - **Central Creator Hub (`340px` wide, `rounded-[24px]`, `p-7/p-8`, `bg-[#3c61dd]`):**
    - Top row: `CREATOR` overline badge and `Available now` white pill with pulsating green status dot (`#00c896`).
    - Title: `Your project starts here` (Inter 600 26px).
    - White Inset Project Card: `CF` avatar, `CampusFlow`, `Student teams app`, `Phase 3 of 6`, `50%` progress bar.
    - Bottom row: `Free to start` with checkmark icon.
- **Bottom CTA Row:**
  - Primary button: `Start free` + ArrowRight icon (`min-w-[200px] h-[52px] rounded-[14px] bg-[#3c61dd] text-white`).
  - Helper metadata: `No card needed. New profiles roll out one by one.`.

### Section 6: FAQ (`src/components/homepage/FigmaFaq.tsx` — Figma Node `57554:13570`)
- **Location:** Anchored via `id="faq"`.
- **2-Column Split Layout (1180px wide):**
  - **Left Column (5 Cols / Max 450px):**
    - Eyebrow Badge: `FAQ` (`bg-[#e8eeff]`, text `#1f3faf`, blue dot).
    - Headline: `What “start for €0” really means.` (Inter 600 54px lh:60px).
    - Subline: `Keep the promise simple, but be clear about what is free inside MBC and what may cost money outside the platform.` (DM Sans 400 18px).
  - **Right Column (7 Cols / Max 674px):**
    - 7 Accordion items with Question 1 open by default:
      1. *Can I really start with MBC for €0?*
      2. *Does €0 mean every external business cost is free?*
      3. *What happens when I reach my AI usage limit?*
      4. *Can I download what I create?*
      5. *Will MBC register my company for me?*
      6. *What happens to my project information?*
      7. *What is the future MBC network?*
    - Blue `+` and `–` toggle indicators in `#3c61dd`, smooth animation.

### Section 7: Final CTA Banner (`src/components/homepage/FigmaFinalCta.tsx` — Figma Node `57554:13613`)
- **Location:** Anchored via `id="final-cta"`.
- **Banner Container (1080x306px, `rounded-[36px]`):**
  - Linear gradient: `bg-gradient-to-br from-[#1f3faf] via-[#2445b8] to-[#3c61dd]`.
  - Padding: `p-8 sm:p-12 lg:p-[64px]` with subtle decorative radial blur.
  - Alignment: `items-start lg:items-center justify-between gap-8 lg:gap-[46px]`.
- **Left Text Block (Max 700px):**
  - Headline: `Your business starts with a first step.` (Inter 600 56px lh:57.12px).
  - Description: `Create your free MBC Creator profile and start turning your idea into a structured digital business.` (Inter 400 16px).
- **Right Action Button (White Pill Button):**
  - Dimensions: `min-w-[175px] h-[48px] px-6 rounded-[13px] bg-white text-[#1f3faf] font-bold text-base`.
  - Text: `Start for €0 →` (French: `Démarrer pour 0 € →`).
  - Active / hover transition: `hover:bg-white/95 shadow-lg active:scale-[0.98]`.

---

## 6. Global Site Footer (`src/components/shared/Footer.tsx` — Figma Node `57381:10882`)
- **Container Architecture:** Aligned to outer `lg:px-[45px]` standard:
  ```tsx
  <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[45px] pt-16 lg:pt-20 pb-12">
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

## 7. Button Responsive & i18n Wrap-Prevention Standards
To prevent buttons from breaking into double lines when translated into longer languages (such as French, Spanish, or Bengali):
- **Dynamic Sizing Policy:**
  - Avoid rigid fixed pixel widths (e.g. `w-[153px]`, `sm:w-[176px]`).
  - Use responsive min-width and horizontal padding: `w-full sm:w-auto min-w-[153px] px-6 h-[48px]`.
- **Wrap Prevention (`whitespace-nowrap`):**
  - All button links (`<Link>`, `<a>`, `<button>`) must include `whitespace-nowrap` to enforce single-line rendering.
  - Apply `inline-flex items-center justify-center text-center` to ensure vertical and horizontal text balance.
  - Buttons in horizontal flexbars include `shrink-0` to avoid being compressed by adjacent elements.
- **Components Standardized:**
  1. `FigmaHero.tsx`: Primary CTA (`min-w-[153px] px-6`) & Secondary CTA (`min-w-[176px] px-6`).
  2. `WireframeHero.tsx`: Section 2 CTA (`min-w-[153px] px-6`).
  3. `FigmaFinalCta.tsx`: Final banner CTA (`min-w-[175px] px-6`).
  4. `FigmaWhatsNext.tsx`: Hub CTA (`min-w-[200px] px-8`).
  5. `PublicHeader.tsx`: Desktop and mobile navigation CTAs (`whitespace-nowrap shrink-0`).
  6. `FigmaHowItWorks.tsx`: Phase jump buttons (`whitespace-nowrap shrink-0`).

---

## 8. Verification & Testing Matrix

The entire Creator homepage and its components are verified by a comprehensive Vitest test suite running under React Testing Library with real DOM assertions:

| Test File | Covered Area / Canonical Node | Key Validations |
|---|---|---|
| `how-it-works-figma-57554-13619.test.tsx` | How It Works (`57554:13619`) | 45px padding, 6 spine steps, active scroll tracking, EN/FR copy |
| `trust-sources-figma-57554-13262.test.tsx` | Where The Facts Come From (`57554:13262`) | 45px padding, proof card, official sources, trust strip, EN/FR copy |
| `whats-next-figma-57554-13451.test.tsx` | What's Next (`57554:13448` / `13451`) | 45px padding, 4 satellite cards, center hub, SVG connectors, EN/FR |
| `faq-figma-57554-13570.test.tsx` | FAQ (`57554:13570`) | 45px padding, 7 questions, Question 1 open default, accordion toggle |
| `final-cta-figma-57554-13613.test.tsx` | Final CTA (`57554:13613`) | 45px padding, 36px radius, headline, min-w-[175px] button, EN/FR |
| `homepage-full-responsive.test.tsx` | Full Homepage Responsiveness | Desktop (1440px), Tablet (768px), Mobile (375px), drawer navigation |
| `buttons-responsive-i18n.test.tsx` | Global CTA Buttons | `whitespace-nowrap`, `min-w` scaling, no double-line breakage |
| `brand-kit-figma-57500-123.test.tsx` | Deliverable 01: Brand Kit | Visual tablet, 4 satellite cards, sparkles, Syne 800 |
| `business-plan-figma-57500-254.test.tsx` | Deliverable 02: Business Plan | Video 1 bleed layout, copy left, 1263px container |
| `financial-forecast-figma-57500-373.test.tsx` | Deliverable 03: Financial Forecast | Vector screen, 4 financial cards (-8deg to +7deg) |
| `market-research-figma-57500-912.test.tsx` | Deliverable 04: Market Research | Vector screen, 4 market research insight cards |
| `action-roadmap-figma-57559-14241.test.tsx` | Deliverable 05: Action Roadmap | Video 2 bleed layout, copy right, 1263px container |
| `business-setup-figma-57559-14378.test.tsx` | Deliverable 06: Business Setup | Video 3 bleed layout, blueprint poster, 1980px max-width |

- **Execution Command:** `cmd /c npx vitest run src/__tests__/homepage` (13 test files, 26 tests, 100% passing).
- **TypeScript Typecheck:** `cmd /c npx tsc --noEmit` (0 errors).
- **Production Build:** `cmd /c npm run build` (Turbopack optimized production build certified green).
