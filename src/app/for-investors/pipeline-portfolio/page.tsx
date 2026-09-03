import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InvestorPipelinePortfolioHero from '@/components/public/investor-pipeline-portfolio/InvestorPipelinePortfolioHero';
import ActiveDealContextSection from '@/components/public/investor-pipeline-portfolio/ActiveDealContextSection';
import DecisionOutcomeSection from '@/components/public/investor-pipeline-portfolio/DecisionOutcomeSection';
import ProspectToOwnershipSection from '@/components/public/investor-pipeline-portfolio/ProspectToOwnershipSection';
import OwnershipDynamicsSection from '@/components/public/investor-pipeline-portfolio/OwnershipDynamicsSection';
import PortfolioUpdateTimeline from '@/components/public/investor-pipeline-portfolio/PortfolioUpdateTimeline';
import PortfolioPerformanceSection from '@/components/public/investor-pipeline-portfolio/PortfolioPerformanceSection';
import FollowOnCapitalSection from '@/components/public/investor-pipeline-portfolio/FollowOnCapitalSection';
import InvestorRelationshipContext from '@/components/public/investor-pipeline-portfolio/InvestorRelationshipContext';
import PipelinePortfolioJourney from '@/components/public/investor-pipeline-portfolio/PipelinePortfolioJourney';
import InvestorPipelinePortfolioFaq from '@/components/public/investor-pipeline-portfolio/InvestorPipelinePortfolioFaq';
import CompleteInvestorJourney from '@/components/public/investor-pipeline-portfolio/CompleteInvestorJourney';

export const metadata: Metadata = {
  title: 'Pipeline & Portfolio for Investors | Mondial',
  description:
    'Learn how Mondial helps Investors track active opportunities through review and decision, preserve investment context, understand ownership, follow company updates and relevant metrics, and evaluate future follow-on decisions after an investment.',
  openGraph: {
    title: 'Pipeline & Portfolio for Investors | Mondial',
    description:
      'Learn how Mondial helps Investors track active opportunities through review and decision, preserve investment context, understand ownership, follow company updates and relevant metrics, and evaluate future follow-on decisions after an investment.',
    url: 'https://mondialbusiness.eu/for-investors/pipeline-portfolio',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForInvestorsPipelinePortfolioPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="investor-pipeline-portfolio-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Investor Journey Page 04: Pipeline & Portfolio (56877:114549) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Pipeline -> Decision -> Portfolio (56877:114550) */}
        <InvestorPipelinePortfolioHero />

        {/* Section 02: Active Deal Context (56877:114734) */}
        <ActiveDealContextSection />

        {/* Section 03: Decision Is the Outcome (56877:114838) */}
        <DecisionOutcomeSection />

        {/* Section 04: From Prospect to Ownership (56877:114988) */}
        <ProspectToOwnershipSection />

        {/* Section 05: Ownership Dynamics (56877:115155) */}
        <OwnershipDynamicsSection />

        {/* Section 06: After the Investment / Update Timeline (56877:115301) */}
        <PortfolioUpdateTimeline />

        {/* Section 07: Portfolio Performance Context (56877:115424) */}
        <PortfolioPerformanceSection />

        {/* Section 08: Follow-On Capital Logic (56877:115612) */}
        <FollowOnCapitalSection />

        {/* Section 09: Relationship Context (56877:115782) */}
        <InvestorRelationshipContext />

        {/* Section 10A: Pipeline + Portfolio Journey (56877:115923) */}
        <PipelinePortfolioJourney />

        {/* Section 10B: 2 FAQs (56877:116117) */}
        <InvestorPipelinePortfolioFaq />

        {/* Section 10C: Complete Investor Journey (56877:116071) */}
        <CompleteInvestorJourney />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
