import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import EquityReadinessHero from '@/components/public/entrepreneur-equity/EquityReadinessHero';
import OwnershipClaritySection from '@/components/public/entrepreneur-equity/OwnershipClaritySection';
import CapTableClaritySection from '@/components/public/entrepreneur-equity/CapTableClaritySection';
import OwnershipEvolutionSection from '@/components/public/entrepreneur-equity/OwnershipEvolutionSection';
import ScenarioThinkingSection from '@/components/public/entrepreneur-equity/ScenarioThinkingSection';
import ValuationContextSection from '@/components/public/entrepreneur-equity/ValuationContextSection';
import StructuredFundingAskSection from '@/components/public/entrepreneur-equity/StructuredFundingAskSection';
import EquityReviewWall from '@/components/public/entrepreneur-equity/EquityReviewWall';
import EquityReadinessSummary from '@/components/public/entrepreneur-equity/EquityReadinessSummary';
import EquityReadinessFaq from '@/components/public/entrepreneur-equity/EquityReadinessFaq';
import EquityReadinessNextStage from '@/components/public/entrepreneur-equity/EquityReadinessNextStage';

export const metadata: Metadata = {
  title: 'Equity & Readiness for Entrepreneurs | Mondial',
  description:
    'Learn how Mondial helps Entrepreneurs understand ownership, cap-table structure, dilution scenarios, valuation context, funding needs, use of funds and readiness gaps before entering investor discussions.',
  openGraph: {
    title: 'Equity & Readiness for Entrepreneurs | Mondial',
    description:
      'Learn how Mondial helps Entrepreneurs understand ownership, cap-table structure, dilution scenarios, valuation context, funding needs, use of funds and readiness gaps before entering investor discussions.',
    url: 'https://mondialbusiness.eu/for-entrepreneurs/equity-readiness',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForEntrepreneursEquityReadinessPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="entrepreneur-equity-readiness-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Entrepreneur Equity & Readiness Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Ownership Before & After (56877:99211) */}
        <EquityReadinessHero />

        {/* Section 02: Ownership Clarity (56877:99335) */}
        <OwnershipClaritySection />

        {/* Section 03: Cap Table / Ownership Made Legible (56877:99429) */}
        <CapTableClaritySection />

        {/* Section 04: Ownership Evolution (56877:99560) */}
        <OwnershipEvolutionSection />

        {/* Section 05: Scenario Thinking (56877:99698) */}
        <ScenarioThinkingSection />

        {/* Section 06: Valuation Context (56877:99837) */}
        <ValuationContextSection />

        {/* Section 07: Structured Funding Ask (56877:99969) */}
        <StructuredFundingAskSection />

        {/* Section 08/09: Review Wall (56877:100097) */}
        <EquityReviewWall />

        {/* Section 10: Final Summary (56877:100262) */}
        <EquityReadinessSummary />

        {/* Section 11: 2 FAQ Items (56877:100345) */}
        <EquityReadinessFaq />

        {/* Section 12: Next Stage & Final CTA (56877:100352) */}
        <EquityReadinessNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
