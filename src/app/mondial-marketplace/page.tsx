import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import MarketplaceHero from '@/components/public/mondial-marketplace/MarketplaceHero';
import MarketplaceValueTypes from '@/components/public/mondial-marketplace/MarketplaceValueTypes';
import CreatorMarketplaceOpportunities from '@/components/public/mondial-marketplace/CreatorMarketplaceOpportunities';
import MarketplaceProfessionalServices from '@/components/public/mondial-marketplace/MarketplaceProfessionalServices';
import EntrepreneurMarketplaceOpportunities from '@/components/public/mondial-marketplace/EntrepreneurMarketplaceOpportunities';
import MarketplaceEcosystemProfiles from '@/components/public/mondial-marketplace/MarketplaceEcosystemProfiles';
import MarketplaceDiscoveryLogic from '@/components/public/mondial-marketplace/MarketplaceDiscoveryLogic';
import MarketplaceProgressiveAccess from '@/components/public/mondial-marketplace/MarketplaceProgressiveAccess';
import MarketplaceRelationshipRouting from '@/components/public/mondial-marketplace/MarketplaceRelationshipRouting';
import MarketplaceJourneyStory from '@/components/public/mondial-marketplace/MarketplaceJourneyStory';
import MarketplaceFaq from '@/components/public/mondial-marketplace/MarketplaceFaq';
import MarketplaceRoleGateway from '@/components/public/mondial-marketplace/MarketplaceRoleGateway';

export const metadata: Metadata = {
  title: 'Mondial Marketplace | Projects, Companies, Services & Profiles',
  description:
    'Discover how the Mondial Marketplace connects structured Creator projects, Entrepreneur companies and funding opportunities, professional services and trusted ecosystem profiles through contextual discovery, matching and controlled access.',
  openGraph: {
    title: 'Mondial Marketplace | Projects, Companies, Services & Profiles',
    description:
      'Discover how the Mondial Marketplace connects structured Creator projects, Entrepreneur companies and funding opportunities, professional services and trusted ecosystem profiles through contextual discovery, matching and controlled access.',
    url: 'https://mondialbusiness.eu/mondial-marketplace',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function MondialMarketplacePage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="public-mondial-marketplace-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Mondial Marketplace Page (56784:4031) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Where structured needs meet structured opportunities (56781:3777) */}
        <MarketplaceHero />

        {/* Section 02: One Marketplace, Different Types of Value (56784:3845) */}
        <MarketplaceValueTypes />

        {/* Section 03: Creator Project Opportunities (56788:78191) */}
        <CreatorMarketplaceOpportunities />

        {/* Section 04: Professional Services (56788:78371) */}
        <MarketplaceProfessionalServices />

        {/* Section 05: Entrepreneur Opportunities (56788:78509) */}
        <EntrepreneurMarketplaceOpportunities />

        {/* Section 06: Ecosystem Profiles (56788:78694) */}
        <MarketplaceEcosystemProfiles />

        {/* Section 07: Discovery Logic (56788:78816) */}
        <MarketplaceDiscoveryLogic />

        {/* Section 08: Progressive Access (56788:78957) */}
        <MarketplaceProgressiveAccess />

        {/* Section 09: Relationship Routing (56788:79161) */}
        <MarketplaceRelationshipRouting />

        {/* Section 10A: 7-Step Marketplace Story & Value Stack (56788:79833) */}
        <MarketplaceJourneyStory />

        {/* Section 10B: 10 FAQs (56788:79736) */}
        <MarketplaceFaq />

        {/* Section 10C: Role Entry & Ecosystem Map (56788:79944) */}
        <MarketplaceRoleGateway />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
