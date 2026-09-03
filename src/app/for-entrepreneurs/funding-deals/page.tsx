import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FundingDealsHero from '@/components/public/entrepreneur-funding/FundingDealsHero';
import InvestorDiscoverySection from '@/components/public/entrepreneur-funding/InvestorDiscoverySection';
import InformationJourneySection from '@/components/public/entrepreneur-funding/InformationJourneySection';
import SensitiveAccessSection from '@/components/public/entrepreneur-funding/SensitiveAccessSection';
import StructuredDataRoomSection from '@/components/public/entrepreneur-funding/StructuredDataRoomSection';
import InvestigativeDiligenceSection from '@/components/public/entrepreneur-funding/InvestigativeDiligenceSection';
import FounderMeetingSection from '@/components/public/entrepreneur-funding/FounderMeetingSection';
import TermSheetSection from '@/components/public/entrepreneur-funding/TermSheetSection';
import DealProcessSection from '@/components/public/entrepreneur-funding/DealProcessSection';
import FundingDealsStorySection from '@/components/public/entrepreneur-funding/FundingDealsStorySection';
import FundingDealsFaq from '@/components/public/entrepreneur-funding/FundingDealsFaq';
import CompleteEntrepreneurJourney from '@/components/public/entrepreneur-funding/CompleteEntrepreneurJourney';

export const metadata: Metadata = {
  title: 'Funding & Deals for Entrepreneurs | Mondial',
  description:
    'Learn how Mondial helps Entrepreneurs move from investor discovery and controlled access through Data Room diligence, founder meetings, term discussions, negotiation and structured deal progression.',
  openGraph: {
    title: 'Funding & Deals for Entrepreneurs | Mondial',
    description:
      'Learn how Mondial helps Entrepreneurs move from investor discovery and controlled access through Data Room diligence, founder meetings, term discussions, negotiation and structured deal progression.',
    url: 'https://mondialbusiness.eu/for-entrepreneurs/funding-deals',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForEntrepreneursFundingDealsPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="entrepreneur-funding-deals-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Entrepreneur Funding & Deals Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Funding & Deals (56877:100412) */}
        <FundingDealsHero />

        {/* Section 02: Investor Discovery (56877:100550) */}
        <InvestorDiscoverySection />

        {/* Section 03: Control the Information Journey (56877:100657) */}
        <InformationJourneySection />

        {/* Section 04: Trust & Sensitive Access (56877:100915) */}
        <SensitiveAccessSection />

        {/* Section 05: Structured Data Room (56877:101044) */}
        <StructuredDataRoomSection />

        {/* Section 06: Investigative Diligence (56877:101211) */}
        <InvestigativeDiligenceSection />

        {/* Section 07: From Data to Conversation (56877:101381) */}
        <FounderMeetingSection />

        {/* Section 08: From Interest to Terms (56877:101504) */}
        <TermSheetSection />

        {/* Section 09: The Deal Is A Process (56877:101649) */}
        <DealProcessSection />

        {/* Section 10A: Funding & Deals Story (56877:101815) */}
        <FundingDealsStorySection />

        {/* Section 10B: 10 FAQ Items (56877:101815) */}
        <FundingDealsFaq />

        {/* Section 10C: Complete Entrepreneur Journey (56877:101815) */}
        <CompleteEntrepreneurJourney />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
