# Mondial Pricing Page Figma Implementation Canon

## 1. Context & Figma Source
- **Figma File:** `Mondial-Dashboard-EDU` (`yLDPLB9hIAIqfYY9uHuJom`)
- **Figma Node ID:** `57424:108`
- **Page Route:** `/pricing` ([src/app/pricing/page.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/app/pricing/page.tsx))
- **Primary Component:** [FigmaPricingView.tsx](file:///e:/17-07-2026/mondial_monorepo_fullstack/src/components/pricing/FigmaPricingView.tsx)
- **Header & Footer Alignment:** Wrapped between global `<Navbar />` (node `57381:10846`) and `<Footer />` (node `57381:10882`).

---

## 2. Page Structure & Components

### Section 1: Hero Section
- **Eyebrow Badge:** "CREDIT PACKS — NO SUBSCRIPTION"
- **H1 Heading:** "Create your digital company for €0."
- **Subtitle:** "Sign up and get 200 free credits immediately. That covers a full investor-ready company generation from start to finish. Top up only when you need more — no monthly fees, no commitments."
- **CTA Button:** "Start free — 200 credits" -> links to `/creator/register`.

### Section 2: Free Starter Strip
- **Highlight Card:**
  - Counter badge: **200** credits in bold typography.
  - Value clarifier: "Covers full generation from idea to investor-ready plan — company name, logo, blueprint, financials & AI business plan."
  - Tag: "Free" green badge.

### Section 3: Credit Packs (Top-up pricing)
- **Model:** Transparent pay-as-you-go credit system. No subscription entrapment.
- **Packs:**
  1. **Starter top-up:**
     - 100 Credits for **€4.90** (€0.049/credit)
     - Best for: Quick iterations & extra assets.
     - CTA: "Buy 100 credits"
  2. **Main pack (Featured / Most Popular):**
     - 250 Credits for **€9.90** (€0.040/credit)
     - Badges: `Most popular` & `Save 19%`
     - Best for: Full additional company or heavy iteration.
     - CTA: "Buy 250 credits" (Primary green button)
  3. **Heavy use:**
     - 500 Credits for **€16.90** (€0.034/credit)
     - Badges: `Save 31%`
     - Best for: Power users & multiple venture builds.
     - CTA: "Buy 500 credits"
- **Payment Trust Note:** "All payments processed securely via Stripe. Credits never expire."

### Section 4: Credit Usage Breakdown Table
Detailed generation cost accounting showing the 138 total credits required for a full cycle (comfortably within the 200 free initial credits):
- **Brand (15 credits total):**
  - Company name generation: 7 credits
  - Logo creation & variations: 4 credits
  - Brand identity guide: 2 credits
  - Social media starter kit: 2 credits
- **Business (123 credits total):**
  - Business blueprint: 20 credits
  - Market analysis & competitor map: 20 credits
  - Financial projections (3-year): 18 credits
  - AI business plan (export-ready): 32 credits
  - Investor deck & executive summary: 33 credits
- **Total Journey Summary Banner:**
  - Full company generation total: **138 credits**
  - "Your 200 free credits leave you with 62 credits for revisions and extras."

### Section 5: "Good to know" FAQ Accordion
Interactive expand/collapse accordion with questions matching Figma:
1. *How do credits work?*
2. *Do credits expire?* (No, purchased credits never expire)
3. *Can I generate more than one company?* (Yes, any remaining credits can be used for new ventures)
4. *What happens when my free credits run out?* (Top up instantly with credit packs)
5. *Is there really no subscription?* (100% pay as you go, no recurring recurring charges)

### Section 6: Bottom CTA Banner
- **Heading:** "Ready to build your company?"
- **Subtext:** "Sign up in 30 seconds. 200 free credits waiting. No card required."
- **CTA Button:** "Start free now" -> `/creator/register`

---

## 3. Verification & Compliance
- Full screen width responsive layout container max `1280px` / `1440px`.
- High-contrast accessible design tokens, dark background theme `#000000` / `#0a0a0a` with emerald green accents `#22c55e`.
- Unit and integration tests aligned.
