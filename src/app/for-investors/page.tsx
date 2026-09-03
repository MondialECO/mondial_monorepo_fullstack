import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InvestorProfileHero from '@/components/public/investor-profile/InvestorProfileHero';
import InvestorTrustFoundations from '@/components/public/investor-profile/InvestorTrustFoundations';
import InvestorIdentitySection from '@/components/public/investor-profile/InvestorIdentitySection';
import InvestorFinancialVerification from '@/components/public/investor-profile/InvestorFinancialVerification';
import InvestmentThesisSection from '@/components/public/investor-profile/InvestmentThesisSection';
import MultiDimensionalFit from '@/components/public/investor-profile/MultiDimensionalFit';
import DealStructureFit from '@/components/public/investor-profile/DealStructureFit';
import InvestorRiskContext from '@/components/public/investor-profile/InvestorRiskContext';
import InvestorVisibilityPrivacy from '@/components/public/investor-profile/InvestorVisibilityPrivacy';
import InvestorFoundationSummary from '@/components/public/investor-profile/InvestorFoundationSummary';
import InvestorProfileFaq from '@/components/public/investor-profile/InvestorProfileFaq';
import InvestorNextStage from '@/components/public/investor-profile/InvestorNextStage';

export const metadata: Metadata = {
  title: 'Investor Profile & Thesis | Mondial',
  description:
    'Learn how Mondial helps Investors establish verified identity and financial context, define sector, stage, geography, ticket-size and deal-structure preferences, control profile visibility and build a structured investment thesis before opportunity discovery.',
  openGraph: {
    title: 'Investor Profile & Thesis | Mondial',
    description:
      'Learn how Mondial helps Investors establish verified identity and financial context, define sector, stage, geography, ticket-size and deal-structure preferences, control profile visibility and build a structured investment thesis before opportunity discovery.',
    url: 'https://mondialbusiness.eu/for-investors',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForInvestorsPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="investor-profile-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Investor Journey Page 01: Profile & Thesis (56877:110243) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Investor Profile & Thesis (56877:110244) */}
        <InvestorProfileHero />

        {/* Section 02: Two Foundations of Investor Trust (56877:110374) */}
        <InvestorTrustFoundations />

        {/* Section 03: Identity Before Access (56877:110498) */}
        <InvestorIdentitySection />

        {/* Section 04: Financial Verification (56877:110611) */}
        <InvestorFinancialVerification />

        {/* Section 05: Defining the Investment Thesis (56877:110740) */}
        <InvestmentThesisSection />

        {/* Section 06: Multi-Dimensional Fit (56877:110821) */}
        <MultiDimensionalFit />

        {/* Section 07: Deal Structure Fit (56877:110915) */}
        <DealStructureFit />

        {/* Section 08: Investment Approach & Risk Context (56877:111018) */}
        <InvestorRiskContext />

        {/* Section 09: Investor Visibility & Privacy Architecture (56877:111135) */}
        <InvestorVisibilityPrivacy />

        {/* Section 10A: The Investor Foundation (56877:111281) */}
        <InvestorFoundationSummary />

        {/* Section 10B: 9 FAQs (56877:111388) */}
        <InvestorProfileFaq />

        {/* Section 10C: Next Stage: Discover & Match (56877:111402) */}
        <InvestorNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
