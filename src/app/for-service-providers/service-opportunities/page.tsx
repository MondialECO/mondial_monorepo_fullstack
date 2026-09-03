import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProviderServicesHero from '@/components/public/provider-services/ProviderServicesHero';
import ProfileToOfferSection from '@/components/public/provider-services/ProfileToOfferSection';
import ProviderPricingSection from '@/components/public/provider-services/ProviderPricingSection';
import PackageClaritySection from '@/components/public/provider-services/PackageClaritySection';
import ClientRequirementsSection from '@/components/public/provider-services/ClientRequirementsSection';
import DemandPathsSection from '@/components/public/provider-services/DemandPathsSection';
import JourneyDemandSection from '@/components/public/provider-services/JourneyDemandSection';
import OpportunitySourcesSection from '@/components/public/provider-services/OpportunitySourcesSection';
import OpportunityFitSection from '@/components/public/provider-services/OpportunityFitSection';
import ServicesOpportunitiesStory from '@/components/public/provider-services/ServicesOpportunitiesStory';
import ServicesOpportunitiesFaq from '@/components/public/provider-services/ServicesOpportunitiesFaq';
import ProviderServicesNextStage from '@/components/public/provider-services/ProviderServicesNextStage';

export const metadata: Metadata = {
  title: 'Services & Opportunities for Service Providers | Mondial',
  description:
    'Learn how Mondial helps Service Providers turn expertise into structured services, choose suitable pricing models, define packages and requirements, become discoverable through Marketplace demand, and review relevant ecosystem opportunities.',
  openGraph: {
    title: 'Services & Opportunities for Service Providers | Mondial',
    description:
      'Learn how Mondial helps Service Providers turn expertise into structured services, choose suitable pricing models, define packages and requirements, become discoverable through Marketplace demand, and review relevant ecosystem opportunities.',
    url: 'https://mondialbusiness.eu/for-service-providers/service-opportunities',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForServiceProvidersServicesOpportunitiesPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="service-provider-services-opportunities-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Service Provider Services & Opportunities Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Service to Opportunity (56877:104762) */}
        <ProviderServicesHero />

        {/* Section 02: From Profile to Offer (56877:104942) */}
        <ProfileToOfferSection />

        {/* Section 03: Pricing the Work (56877:105074) */}
        <ProviderPricingSection />

        {/* Section 04: Package Clarity (56877:105217) */}
        <PackageClaritySection />

        {/* Section 05: Clear Inputs / Client Requirements (56877:105398) */}
        <ClientRequirementsSection />

        {/* Section 06: Two Paths to Demand (56877:105561) */}
        <DemandPathsSection />

        {/* Section 07: Demand Inside the Journey (56877:105686) */}
        <JourneyDemandSection />

        {/* Section 08: Opportunity Sources (56877:105853) */}
        <OpportunitySourcesSection />

        {/* Section 09: Relevance Before Response (56877:105977) */}
        <OpportunityFitSection />

        {/* Section 10A: Services & Opportunities Story (56877:106151) */}
        <ServicesOpportunitiesStory />

        {/* Section 10B: 9 FAQ Items (56877:106238) */}
        <ServicesOpportunitiesFaq />

        {/* Section 10C: Next Stage (56877:106252) */}
        <ProviderServicesNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
