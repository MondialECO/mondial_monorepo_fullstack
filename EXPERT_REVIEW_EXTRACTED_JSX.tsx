/**
 * EXPERT REVIEW PAGE - EXTRACTED JSX STRUCTURE
 * Source: Figma "AI Expert Review" design
 * Status: Render structure only (no asset URLs, no inline styles)
 *
 * Use this as a reference to rebuild with shadcn/ui + lucide-react
 */

// ============================================================================
// 1. COMPONENT HIERARCHY & HELPER COMPONENTS
// ============================================================================

/**
 * ItemContainer - Reusable list item with icon + text
 * Used: badge/benefit lists, requirements
 */
function ItemContainer({ className }: { className?: string }) {
  return (
    <div className={className || "flex gap-2 items-center px-2 rounded-md"}>
      {/* Icon: tick-circle */}
      <div className="shrink-0 size-4" />
      {/* Text label */}
      <p className="flex-1 text-sm font-medium text-neutral-900">
        {/* Dynamic text content */}
      </p>
    </div>
  );
}

/**
 * Frame2147225863 - Score breakdown row with progress bar
 * Used: Pitch deck analysis, section scores
 */
function Frame2147225863({ className, children = null }: { className?: string; children?: React.ReactNode | null }) {
  return (
    <div className={className || "flex flex-col gap-2 items-end justify-center w-full"}>
      {/* Score header row */}
      <div className="flex items-start justify-between w-full">
        <div className="flex gap-2 items-center">
          <p className="text-sm text-neutral-600">
            {/* Category label: "Clarity & Narrative", "Market Size Proof", etc. */}
          </p>
        </div>
        <p className="text-sm font-medium text-neutral-900">
          {/* Score display: "8/10", "6/10", "9/10" */}
        </p>
      </div>
      {/* Progress bar container */}
      <div className="h-1 w-full relative rounded-full bg-neutral-200">
        {children || (
          <>
            {/* Background track */}
            <div className="absolute inset-0 rounded-full bg-neutral-200 border border-neutral-200" />
            {/* Filled progress (width varies by score) */}
            <div className="absolute bottom-0 left-0 top-0 rounded-full bg-blue-600 border border-neutral-200" />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Frame2147228407 - Recommendation/action card
 * Used: AI recommendations section
 */
function Frame2147228407({ className }: { className?: string }) {
  return (
    <div className={className || "flex items-center justify-between p-4 w-full border-b"}>
      {/* Left: Icon + content */}
      <div className="flex gap-3 items-center flex-1">
        {/* Circular icon container (gray background) */}
        <div className="bg-neutral-100 rounded-full p-2.5 shrink-0 size-10">
          {/* Icon: document, monitor, edit, etc. */}
        </div>
        {/* Text container */}
        <div className="flex flex-col gap-1 flex-1">
          {/* Title + points badge */}
          <div className="flex gap-2 items-center">
            <p className="text-sm font-semibold text-neutral-900">
              {/* Action title: "Upload Business Plan", "Upload 3-Year Financial Projections", etc. */}
            </p>
            <div className="bg-blue-50 px-1 py-0.5 rounded-full">
              <p className="text-xs font-semibold text-blue-600">+5 pts</p>
            </div>
          </div>
          {/* Description text */}
          <p className="text-xs text-neutral-600">
            {/* Recommendation text */}
          </p>
        </div>
      </div>
      {/* Right: Action button */}
      <button className="flex gap-1 items-center px-4 py-2 border rounded-md">
        {/* Icon */}
        {/* Text: "Fix Now", "Apply Suggestion", etc. */}
      </button>
    </div>
  );
}

/**
 * Frame2147225890 - Stage progress row (table/tracker)
 * Used: Multi-stage progress table
 */
function Frame2147225890({ className }: { className?: string }) {
  return (
    <div className={className || "flex h-16 items-center justify-between px-4 w-full border-b"}>
      {/* Stage info (icon + label) */}
      <div className="flex gap-3 items-center w-40">
        {/* Icon */}
        <div className="shrink-0 size-5" />
        {/* Stage name */}
        <p className="text-sm font-medium text-neutral-900">
          {/* "Verification", "Equity & Cap Table", "Financials", "Funding Ask", "Data Room" */}
        </p>
      </div>

      {/* Progress indicator (bar + percentage) */}
      <div className="flex gap-2 items-center w-40">
        <div className="flex-1 h-1 relative bg-neutral-200 rounded-full">
          {/* Filled progress bar (color varies by status) */}
          <div className="absolute inset-0 rounded-full" style={{ width: '100%' }} />
        </div>
        <p className="text-sm font-medium text-neutral-600 text-right w-12">
          {/* Percentage: "100%", "88%", "80%", "72%" */}
        </p>
      </div>

      {/* Status badge */}
      <div className="w-32">
        <div className="bg-green-100 px-3 py-1 rounded-full inline-block">
          <p className="text-xs font-medium text-green-700">Completed</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MAIN PAGE STRUCTURE
// ============================================================================

export default function ExpertReviewPage() {
  return (
    <div className="bg-neutral-200 min-h-screen flex">

      {/* ===================== LEFT SIDEBAR ===================== */}
      <aside className="w-64 bg-neutral-100 border-r border-white/50 px-3 py-5 flex flex-col">
        {/* Logo section */}
        <div className="flex gap-2 items-center mb-4 pb-4 border-b border-black/6">
          <div className="bg-blue-600 rounded-lg w-11 h-11" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-neutral-900">Mondial</p>
            <p className="text-xs text-neutral-600 font-normal">EcoSphere Solutions SAS</p>
          </div>
        </div>

        {/* Navigation sections */}
        <nav className="flex flex-col gap-4 flex-1">
          {/* MAIN section */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-neutral-600 px-3 py-1">MAIN</p>
            <NavItem icon="element-3" label="Dashboard" />
            <NavItem icon="diagram" label="KPI Tracker" />
            <NavItem icon="calculator" label="Valuation" />
          </div>

          {/* FUNDING section */}
          <div className="flex flex-col gap-1 border-t border-black/6 pt-4">
            <p className="text-xs font-medium text-neutral-600 px-3 py-1">FUNDING</p>
            <NavItem icon="graph" label="Equity Setup" />
            <NavItem icon="briefcase" label="Cap Table" />
            <NavItem icon="people" label="Stakeholders" />
            <NavItem icon="status-up" label="Fundraising" />
          </div>
        </nav>

        {/* Account section (bottom) */}
        <div className="border-t border-black/6 pt-4">
          {/* User profile section would go here */}
        </div>
      </aside>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 bg-neutral-200">

        {/* TOP HEADER */}
        <header className="bg-neutral-100/50 backdrop-blur-md border-b-2 border-white px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          {/* Breadcrumb + back button */}
          <div className="flex gap-2 items-center">
            <button className="bg-white border rounded-lg p-2 size-8">
              {/* Icon: arrow-left */}
            </button>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-neutral-600">Dashboards</span>
              <span className="text-sm text-neutral-600">/</span>
              <span className="text-sm font-normal text-neutral-900">AI Expert Review</span>
            </div>
          </div>

          {/* Right actions: notifications, theme, etc. */}
          <div className="flex gap-4 items-center">
            <button className="bg-white border rounded-full size-9 flex items-center justify-center relative">
              {/* Icon: message */}
              <div className="absolute top-1 right-1 bg-red-500 rounded-full size-2" />
            </button>
            <button className="bg-white border rounded-full size-9 flex items-center justify-center">
              {/* Icon: notification */}
            </button>
            <button className="bg-white border rounded-full size-9 flex items-center justify-center">
              {/* Icon: sun/theme */}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT WRAPPER */}
        <div className="p-6 space-y-6">

          {/* ========== SECTION 1: PAGE HEADER ========== */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <h1 className="text-4xl font-semibold text-neutral-900">AI Expert Review</h1>
              <div className="bg-pink-100 border rounded-full px-3 py-1 flex gap-1 items-center w-fit">
                <div className="size-2 bg-pink-400 rounded-full" />
                <p className="text-sm font-semibold text-pink-700">AI-Powered</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600">
              Define your cap table, record stakeholders, setup ESOP, and simulate future funding rounds
            </p>
          </div>

          {/* ========== SECTION 2: KPI CARDS (4-COLUMN GRID) ========== */}
          <div className="grid grid-cols-4 gap-6">
            {/* Card 1: Readiness Score */}
            <KPICard
              title="Readiness Score"
              value="90"
              subtext="/100"
              badge="↑ Top 5% of startups"
              badgeColor="green"
            />
            {/* Card 2: Actions Remaining */}
            <KPICard
              title="Actions Remaining"
              value="4"
              badge="+10 pts available"
              badgeColor="yellow"
            />
            {/* Card 3: Missing Documents */}
            <KPICard
              title="Missing Documents"
              value="2"
              badge="Data Room incomplete"
              badgeColor="red"
            />
            {/* Card 4: Pitch Deck Grade */}
            <KPICard
              title="Pitch Deck Grade"
              value="B+"
              badge="Avg. score 7.5 / 10"
              badgeColor="blue"
            />
          </div>

          {/* ========== SECTION 3: INVESTOR-READY PROFILE (Large card + side chart) ========== */}
          <div className="grid grid-cols-3 gap-6">
            {/* Main content card (2 cols) */}
            <div className="col-span-2 bg-neutral-100 border border-white rounded-2xl p-6 shadow-sm">
              <div className="flex gap-6">
                {/* Large score circle visualization */}
                <div className="bg-blue-50 rounded-3xl size-36 flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-blue-600">90</p>
                    <p className="text-sm text-neutral-900">SCORE</p>
                  </div>
                </div>

                {/* Content section */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold text-neutral-900">Investor-Ready Profile</h2>
                    <p className="text-sm text-neutral-900">
                      Your profile is in the top 5% on Mondial.eco. Complete 4 remaining actions to reach 100/100 and unlock Phase 8.
                    </p>
                  </div>

                  {/* Badge section */}
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="bg-yellow-50 px-2 py-1 rounded-full">
                      <p className="text-xs font-semibold text-yellow-900">↑ Top 5% of startups</p>
                    </div>
                    <div className="bg-green-100 px-2 py-1 rounded-full">
                      <p className="text-xs font-semibold text-green-700">+ 10 Pts</p>
                    </div>
                    <div className="bg-blue-50 px-2 py-1 rounded-full">
                      <p className="text-xs font-semibold text-blue-600">Phase 7 of 9</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar: Pitch Deck Analysis (1 col) */}
            <div className="bg-neutral-100 border border-white rounded-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  {/* Icon: diagram */}
                  <p className="text-sm font-medium text-neutral-900">Pitch Deck Analysis</p>
                </div>
                <div className="bg-white border rounded-full px-3 py-1">
                  <p className="text-sm font-semibold text-blue-600">B+</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-7">
                {/* Average Score */}
                <div className="text-center">
                  <p className="text-sm text-neutral-600 mb-2">Average Score</p>
                  <p className="text-2xl font-semibold text-orange-600">6/10</p>
                </div>

                {/* Score breakdown rows */}
                <div className="space-y-5">
                  <Frame2147225863>
                    {/* Custom for: Clarity & Narrative - 8/10 */}
                  </Frame2147225863>
                  <Frame2147225863>
                    {/* Custom for: Market Size Proof - 6/10 (purple bar) */}
                  </Frame2147225863>
                  <Frame2147225863>
                    {/* Custom for: Traction & Metrics - 9/10 (green bar) */}
                  </Frame2147225863>
                  <Frame2147225863>
                    {/* Custom for: Team Pedigree - 7/10 (yellow bar) */}
                  </Frame2147225863>
                </div>
              </div>
            </div>
          </div>

          {/* ========== SECTION 4: STAGE PROGRESS TABLE ========== */}
          <div className="bg-neutral-100 border border-white rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="bg-blue-50 flex items-center justify-between px-4 py-3">
              <div className="w-40">
                <p className="text-sm font-medium text-neutral-600">Stage</p>
              </div>
              <div className="w-40">
                <p className="text-sm font-medium text-neutral-600">Progress</p>
              </div>
              <div className="w-32 text-right">
                <p className="text-sm font-medium text-neutral-600">Status</p>
              </div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-neutral-200">
              <Frame2147225890 />
              {/* Row: Verification - 100% - Completed */}
              {/* Row: Equity & Cap Table - 100% - Completed */}
              {/* Row: Financials - 88% - Completed */}
              {/* Row: Funding Ask - 80% - Completed */}
              {/* Row: Data Room - 72% - ⚠ 2 docs missing */}
            </div>
          </div>

          {/* ========== SECTION 5: AI RECOMMENDATIONS ========== */}
          <div className="bg-neutral-100 border border-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-blue-50 flex items-center justify-between px-4 py-3">
              <div className="flex gap-2 items-center">
                {/* Icon: lamp-on */}
                <p className="font-medium text-neutral-900">AI Recommendations</p>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-md flex gap-2 items-center">
                <div className="size-2 bg-blue-400 rounded-full" />
                <p className="text-sm font-semibold text-blue-600">4 Actions</p>
              </div>
            </div>

            {/* Recommendation items */}
            <div className="divide-y divide-neutral-200">
              {/* Item 1: Upload Business Plan (+5 pts) - "Fix Now" button */}
              <Frame2147228407 />

              {/* Item 2: Upload 3-Year Financial Projections (+3 pts) - "Fix Now" button */}
              <Frame2147228407 />

              {/* Item 3: Refine Pitch Deck Headline (+2 pts) - "Apply Suggestion" button (blue) */}
              <Frame2147228407 />

              {/* Item 4: Cap Table is Clean (+5 pts) - "Done" button (green) */}
              <Frame2147228407 />
            </div>
          </div>

          {/* ========== SECTION 6: BADGE UNLOCK ========== */}
          <div className="bg-neutral-100 border border-white rounded-2xl p-6 space-y-4">
            {/* Icon + score */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-neutral-200 rounded-full size-20 flex items-center justify-center">
                {/* Icon: cup */}
              </div>
              <p className="text-2xl font-semibold text-neutral-900">
                90<span className="text-sm text-neutral-600">/100</span>
              </p>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-neutral-900">Investor-Ready Badge</h3>
              <p className="text-xs text-neutral-600">
                You have achieved a 90/100 readiness score. Claiming this badge unlocks direct submission to our premier VC network and Phase 8 (Matchmaking).
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-2 py-4">
              <ItemContainer className="flex gap-2 px-2 py-1 rounded-md w-full" />
              {/* Item: Priority listing in Marketplace */}
              {/* Item: "Verified Investor Ready" tag */}
              {/* Item: Unlock Phase 8: Capital Matchmaking */}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button className="w-full bg-green-700 text-white px-4 py-2.5 rounded-md font-semibold text-sm flex gap-2 items-center justify-center">
                {/* Icon */}
                Claim Investor Ready Badge
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md font-semibold text-sm flex gap-2 items-center justify-center">
                {/* Icon */}
                Claim Badge & Unlock Phase 8
                {/* Arrow icon */}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 3. HELPER COMPONENTS
// ============================================================================

/**
 * NavItem - Sidebar navigation item
 */
function NavItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex gap-2 items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-neutral-200/50">
      <div className="size-5 flex items-center justify-center">
        {/* Icon from lucide-react */}
      </div>
      <p className="flex-1 text-sm text-neutral-600 font-normal">
        {label}
      </p>
    </div>
  );
}

/**
 * KPICard - Metric card with score, badge, and optional subtext
 */
function KPICard({
  title,
  value,
  subtext,
  badge,
  badgeColor = 'blue',
}: {
  title: string;
  value: string;
  subtext?: string;
  badge: string;
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue';
}) {
  const badgeStyles = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-900',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="bg-neutral-100 border border-white rounded-xl p-4 space-y-3">
      <p className="text-xs font-medium text-neutral-900">{title}</p>
      <div className="text-center space-y-2">
        <p className="text-2xl font-semibold text-neutral-900">
          {value}
          {subtext && <span className="text-sm text-neutral-600 font-normal ml-1">{subtext}</span>}
        </p>
        <div className={`px-2 py-1 rounded-full inline-block ${badgeStyles[badgeColor]}`}>
          <p className="text-xs font-medium">{badge}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. TAILWIND CLASSES REFERENCE
// ============================================================================
/*
  Grid/Layout:
  - grid grid-cols-4 / grid-cols-3 / col-span-2
  - flex flex-col / flex-row
  - gap-2 / gap-3 / gap-4 / gap-6
  - items-center / items-start / items-end / justify-between / justify-center
  - w-full / w-64 / w-40 / w-11
  - h-1 / h-8 / h-9 / h-16 / h-36
  - px-2 / px-3 / px-4 / py-1 / py-2.5
  - absolute / relative / sticky
  - inset-0 / inset-[0_18px_0_0] / left-1/2 / top-1/2
  - shrink-0 / flex-1 / flex-shrink-0
  - min-h-screen / overflow-hidden / overflow-clip

  Colors (theme variables):
  - bg-neutral-{100,200,600,900}
  - text-neutral-{600,900} + text-{blue,green,yellow,red}-{600,700,900}
  - bg-{blue,green,yellow,red}-{50,100,700} + text-{blue,green,yellow,red}-{600,700,900}
  - border-white / border-black/6 / border-white/50
  - bg-white

  Typography:
  - text-{xs,sm,lg,2xl,4xl,5xl}
  - font-{normal,medium,semibold,bold}
  - leading-0 / leading-[...] / line-height from CSS variables

  Borders & Radius:
  - border / border-b / border-t / border-r
  - rounded-{full,lg,xl,2xl,3xl}
  - shadow-sm / drop-shadow-[...]

  Effects:
  - backdrop-blur-md
  - opacity / z-10
  - pointer-events-none / cursor-pointer
  - object-cover
*/

// ============================================================================
// 5. DATA DISPLAY AREAS - KEY SECTIONS
// ============================================================================
/*
  SCORES & CATEGORIES:
  - Overall readiness score: 90/100 (green badge: "Top 5%")
  - Actions remaining: 4 (+10 pts available)
  - Missing documents: 2 (red, "Data Room incomplete")
  - Pitch deck grade: B+ (avg 7.5/10)

  MULTI-STAGE PROGRESS (Stage table):
  - Verification: 100% - Completed (green)
  - Equity & Cap Table: 100% - Completed (green)
  - Financials: 88% - Completed (green)
  - Funding Ask: 80% - Completed (green)
  - Data Room: 72% - ⚠ 2 docs missing (red)

  PITCH DECK BREAKDOWN (Right sidebar):
  - Average Score: 6/10
  - Clarity & Narrative: 8/10
  - Market Size Proof: 6/10 (purple bar)
  - Traction & Metrics: 9/10 (green bar)
  - Team Pedigree: 7/10 (yellow bar)

  AI RECOMMENDATIONS (Actions list):
  1. Upload Business Plan (+5 pts) - "Fix Now"
  2. Upload 3-Year Financial Projections (+3 pts) - "Fix Now"
  3. Refine Pitch Deck Headline (+2 pts) - "Apply Suggestion" (blue button)
  4. Cap Table is Clean (+5 pts) - "Done" (green button)

  BADGE UNLOCK:
  - Score: 90/100
  - Benefits:
    * Priority listing in Marketplace
    * "Verified Investor Ready" tag
    * Unlock Phase 8: Capital Matchmaking
  - Action: "Claim Badge & Unlock Phase 8"
*/
