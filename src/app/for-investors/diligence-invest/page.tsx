import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InvestorDiligenceHero from '@/components/public/investor-diligence/InvestorDiligenceHero';
import ControlledAccessSection from '@/components/public/investor-diligence/ControlledAccessSection';
import EvidenceArchitectureSection from '@/components/public/investor-diligence/EvidenceArchitectureSection';
import FinancialReasoningSection from '@/components/public/investor-diligence/FinancialReasoningSection';
import OwnershipLandscapeSection from '@/components/public/investor-diligence/OwnershipLandscapeSection';
import ClaimEvidenceSection from '@/components/public/investor-diligence/ClaimEvidenceSection';
import DiligenceReasoningSection from '@/components/public/investor-diligence/DiligenceReasoningSection';
import InvestmentStructuresSection from '@/components/public/investor-diligence/InvestmentStructuresSection';
import InterestToExecutionSection from '@/components/public/investor-diligence/InterestToExecutionSection';
import DiligenceJourneySection from '@/components/public/investor-diligence/DiligenceJourneySection';
import InvestorDiligenceFaq from '@/components/public/investor-diligence/InvestorDiligenceFaq';
import InvestorDiligenceNextStage from '@/components/public/investor-diligence/InvestorDiligenceNextStage';

export const metadata: Metadata = {
  title: 'Diligence & Invest for Investors | Mondial',
  description:
    'Learn how Mondial helps Investors move from mutual interest into controlled company access, structured Data Room review, financial and ownership diligence, evidence-based questions, investment structure review, terms and transaction progression.',
  openGraph: {
    title: 'Diligence & Invest for Investors | Mondial',
    description:
      'Learn how Mondial helps Investors move from mutual interest into controlled company access, structured Data Room review, financial and ownership diligence, evidence-based questions, investment structure review, terms and transaction progression.',
    url: 'https://mondialbusiness.eu/for-investors/diligence-invest',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForInvestorsDiligenceInvestPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="investor-diligence-invest-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Investor Journey Page 03: Diligence & Invest (56877:113005) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Story -> Evidence (56877:113007) */}
        <InvestorDiligenceHero />

        {/* Section 02: Controlled Access (56877:113151) */}
        <ControlledAccessSection />

        {/* Section 03: Structured Evidence Architecture (56877:113312) */}
        <EvidenceArchitectureSection />

        {/* Section 04: Financial Reasoning (56909:7481) */}
        <FinancialReasoningSection />

        {/* Section 05: Ownership Landscape (56877:113609) */}
        <OwnershipLandscapeSection />

        {/* Section 06: Test the Claim Against the Record (56909:7482) */}
        <ClaimEvidenceSection />

        {/* Section 07: From Documents to Understanding (56877:113867) */}
        <DiligenceReasoningSection />

        {/* Section 08: Investment Structures (56877:114041) */}
        <InvestmentStructuresSection />

        {/* Section 09: From Interest to Execution (56877:114161) */}
        <InterestToExecutionSection />

        {/* Section 10A: The Diligence & Invest Journey (56877:114314) */}
        <DiligenceJourneySection />

        {/* Section 10B: 5 FAQs (56877:114402) */}
        <InvestorDiligenceFaq />

        {/* Section 10C: Next Stage: Pipeline & Portfolio (56877:114412) */}
        <InvestorDiligenceNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
