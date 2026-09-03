import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import InvestorDiscoveryHero from '@/components/public/investor-discovery/InvestorDiscoveryHero';
import OpportunityOriginsSection from '@/components/public/investor-discovery/OpportunityOriginsSection';
import TransparentMatchingSection from '@/components/public/investor-discovery/TransparentMatchingSection';
import FirstLookCompanyContext from '@/components/public/investor-discovery/FirstLookCompanyContext';
import OpportunityComparisonSection from '@/components/public/investor-discovery/OpportunityComparisonSection';
import FounderContextSection from '@/components/public/investor-discovery/FounderContextSection';
import TwoSidedFitSection from '@/components/public/investor-discovery/TwoSidedFitSection';
import MatchConversationSection from '@/components/public/investor-discovery/MatchConversationSection';
import ProgressiveAccessSection from '@/components/public/investor-discovery/ProgressiveAccessSection';
import InvestorDiscoveryJourney from '@/components/public/investor-discovery/InvestorDiscoveryJourney';
import InvestorDiscoveryFaq from '@/components/public/investor-discovery/InvestorDiscoveryFaq';
import InvestorDiscoveryNextStage from '@/components/public/investor-discovery/InvestorDiscoveryNextStage';

export const metadata: Metadata = {
  title: 'Discover & Match for Investors | Mondial',
  description:
    'Learn how Mondial helps Investors use a defined investment thesis to discover structured companies and projects, understand transparent fit signals, compare relevant opportunity context, review founder context and move through mutual interest toward controlled diligence access.',
  openGraph: {
    title: 'Discover & Match for Investors | Mondial',
    description:
      'Learn how Mondial helps Investors use a defined investment thesis to discover structured companies and projects, understand transparent fit signals, compare relevant opportunity context, review founder context and move through mutual interest toward controlled diligence access.',
    url: 'https://mondialbusiness.eu/for-investors/discover-match',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForInvestorsDiscoverMatchPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="investor-discover-match-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Investor Journey Page 02: Discover & Match (56877:111500) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Thesis -> Opportunities (56909:7422) */}
        <InvestorDiscoveryHero />

        {/* Section 02: Opportunity Origins (56877:111657) */}
        <OpportunityOriginsSection />

        {/* Section 03: Transparent Matching Logic (56877:111832) */}
        <TransparentMatchingSection />

        {/* Section 04: First-Look Company Context (56877:111991) */}
        <FirstLookCompanyContext />

        {/* Section 05: Opportunity Comparison (56909:7478) */}
        <OpportunityComparisonSection />

        {/* Section 06: Behind the Company (56877:112319) */}
        <FounderContextSection />

        {/* Section 07: Two-Sided Fit (56877:112465) */}
        <TwoSidedFitSection />

        {/* Section 08: From Match to Conversation (56877:112582) */}
        <MatchConversationSection />

        {/* Section 09: Progressive Information Access (56909:7479) */}
        <ProgressiveAccessSection />

        {/* Section 10A: The Discovery Journey (56877:112828) */}
        <InvestorDiscoveryJourney />

        {/* Section 10B: 6 FAQs (56877:112903) */}
        <InvestorDiscoveryFaq />

        {/* Section 10C: Next Stage: Diligence & Invest (56877:112914) */}
        <InvestorDiscoveryNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
