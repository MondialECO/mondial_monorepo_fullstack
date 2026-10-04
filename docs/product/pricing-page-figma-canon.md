# Mondial Pricing Page Figma Implementation Canon

## 1. Context & Figma Source
- **Figma File:** `Mondial-Dashboard-EDU` (`yLDPLB9hIAIqfYY9uHuJom`)
- **Figma Node ID:** `57424:108`
- **Page Route:** `/pricing` ([src/app/pricing/page.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/pricing/page.tsx))
- **Primary Component:** [FigmaPricingView.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/pricing/FigmaPricingView.tsx)
- **Header & Footer Alignment:** Wrapped between global `<Navbar />` (node `57381:10846`) and `<Footer />` (node `57381:10882`).
- **Layout Model:** Full-screen responsive layout container (`w-full max-w-[1280px] xl:max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16`) aligned with Header & Footer widths.

---

## 2. Navigation Architecture Integration

### Header Navigation ([PublicHeader.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/shared/PublicHeader.tsx))
- Desktop Nav:
  - `How it works` -> `/#how-it-works`
  - `Creator Tools` -> `/#outputs` (with blue indicator dot)
  - `What you get` -> `/#outputs`
  - `Pricing` -> `/pricing` (Direct route navigation)
  - `FAQ` -> `/#faq`
- Mobile Drawer Nav:
  - All items mirror desktop navigation with auto-closing drawer on item selection.
- CTAs:
  - `Sign in` -> `/login`
  - `Start for €0` -> `/signup`

### Footer Navigation ([Footer.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/shared/Footer.tsx))
- Under `PRODUCT`:
  - `Creator` -> `/for-creators`
  - `Creator Tools` -> `/#outputs`
  - `How it works` -> `/#how-it-works`
  - `What you get` -> `/#outputs`
  - `Pricing` -> `/pricing`
- Under `RESOURCES`:
  - `FAQ` -> `/#faq`
  - `Guides` -> `/guides`
  - `Contact` -> `/contact`

---

## 3. Page Structure & Components

### Section 1: Hero Section (Figma 57424:112)
- **Eyebrow Badge:** "Pricing" pill badge.
- **H1 Heading:** "Create your digital company for €0."
- **Subtitle:** "Start with 200 free credits. Buy more only when you need them. No subscription."
- **Primary CTA:** "Start free" -> `/signup`
- **Micro-copy Note:** "Your first business idea is covered by your free credits."

### Section 2: Free Starter Strip (Figma 57424:127)
- **Highlight Card:**
  - Counter badge: **200** credits in bold typography.
  - Subtext: "free credits when you join".
  - Value clarifier: "Enough to take your first idea from clarifier to investor-ready plan."
  - Tag: "Free" emerald pill badge (`#E8F5EE` / `#157A55`).

### Section 3: Credit Packs (Figma 57424:136)
- **Model:** Transparent pay-as-you-go credit system. No subscription entrapment.
- **Packs:**
  1. **Starter top-up:**
     - 100 Credits for **€4.90** (€0.049/credit)
     - Note: "Finish a phase or a few revisions"
     - CTA: "Get started" -> `/signup?pack=starter`
  2. **Main pack (Featured / Most Popular):**
     - 250 Credits for **€9.90** (€0.040/credit)
     - Badges: `Most popular` & `Save 19%`
     - Note: "About 1.8 full business journeys"
     - CTA: "Get started" -> `/signup?pack=main`
  3. **Heavy use:**
     - 500 Credits for **€16.90** (€0.034/credit)
     - Badges: `Save 31%`
     - Note: "About 3.6 full business journeys, great for testing several ideas"
     - CTA: "Get started" -> `/signup?pack=heavy`
- **Payment Trust Note:** "One-time payment. Secure checkout by Stripe."

### Section 4: What Do Credits Do? — Breakdown Table (Figma 57424:196)
Detailed generation cost accounting showing the 138 total credits required for a full cycle (comfortably within the 200 free initial credits):
- **Brand (15 credits total):**
  - Brand direction: 7 credits
  - Logo: 4 credits
  - Colour palette: 2 credits
  - Typography: 2 credits
- **Business (123 credits total):**
  - Clarifier: 20 credits
  - Market study: 20 credits
  - Business model: 18 credits
  - Financial forecast: 32 credits
  - Business plan: 33 credits
- **Total Journey Summary Banner:**
  - "A full journey, start to finish": **138 credits**

### Section 5: "Good to know" FAQ Accordion (Figma 57424:261)
Interactive expand/collapse accordion with questions matching Figma:
1. *Is exporting my files free?* (Yes. Downloading your documents and brand kit is always free.)
2. *Do I need a subscription?* (No. MBC operates on a transparent pay-as-you-go credit model.)
3. *What happens if I run out of credits?* (Top up instantly starting from €4.90. All assets remain permanently saved.)
4. *How many credits do I get for free?* (Every new creator receives 200 free credits upon sign-up.)

### Section 6: Bottom CTA Banner (Figma 57424:298)
- **Heading:** "Ready to build your company?"
- **CTA Button:** "Start free" -> `/signup`

---

## 4. Verification & Automated Test Suite
- Automated test coverage in [figma-pricing-view.test.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/__tests__/pricing/figma-pricing-view.test.tsx):
  - Hero heading & 200 free credits badge verification.
  - Credit packs pricing, savings badges, and CTA verification.
  - Usage breakdown table verification for Brand and Business items.
  - Interactive FAQ accordion toggle testing.
  - Page wrapper integration with `<Navbar />` and `<Footer />` verification.
