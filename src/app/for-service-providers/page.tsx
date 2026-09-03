import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProviderVerifyHero from '@/components/public/provider-verify/ProviderVerifyHero';
import ContextualTrustSection from '@/components/public/provider-verify/ContextualTrustSection';
import TwoStageVerificationSection from '@/components/public/provider-verify/TwoStageVerificationSection';
import EvidenceExpertiseSection from '@/components/public/provider-verify/EvidenceExpertiseSection';
import ProviderTrustTiersSection from '@/components/public/provider-verify/ProviderTrustTiersSection';
import OptionalSkillEvidenceSection from '@/components/public/provider-verify/OptionalSkillEvidenceSection';
import ProviderCaseStudiesSection from '@/components/public/provider-verify/ProviderCaseStudiesSection';
import ProviderDiscoverabilitySection from '@/components/public/provider-verify/ProviderDiscoverabilitySection';
import ProviderReputationSection from '@/components/public/provider-verify/ProviderReputationSection';
import ProviderTrustJourney from '@/components/public/provider-verify/ProviderTrustJourney';
import ProviderVerificationFaq from '@/components/public/provider-verify/ProviderVerificationFaq';
import ProviderNextStage from '@/components/public/provider-verify/ProviderNextStage';

export const metadata: Metadata = {
  title: 'Verify & Profile for Service Providers | Mondial',
  description:
    'Learn how Mondial helps Service Providers establish a trusted professional identity through identity verification, credentials, category-relevant work evidence, progressive verification tiers, availability and reputation context before accessing opportunities.',
  openGraph: {
    title: 'Verify & Profile for Service Providers | Mondial',
    description:
      'Learn how Mondial helps Service Providers establish a trusted professional identity through identity verification, credentials, category-relevant work evidence, progressive verification tiers, availability and reputation context before accessing opportunities.',
    url: 'https://mondialbusiness.eu/for-service-providers',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForServiceProvidersPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="service-provider-verify-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Service Provider Verify & Profile Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Trust Foundation (56877:103320) */}
        <ProviderVerifyHero />

        {/* Section 02: Professional Trust is Contextual (56877:103452) */}
        <ContextualTrustSection />

        {/* Section 03: Two-Stage Verification (56877:103653) */}
        <TwoStageVerificationSection />

        {/* Section 04: Evidence & Expertise (56877:103770) */}
        <EvidenceExpertiseSection />

        {/* Section 05: Progressive Trust Tiers (56877:103894) */}
        <ProviderTrustTiersSection />

        {/* Section 06: Optional Skill Evidence (56877:104037) */}
        <OptionalSkillEvidenceSection />

        {/* Section 07: Work with Context / Case Studies (56877:104162) */}
        <ProviderCaseStudiesSection />

        {/* Section 08: Discoverability & Capacity (56877:104310) */}
        <ProviderDiscoverabilitySection />

        {/* Section 09: Reputation Architecture (56877:104421) */}
        <ProviderReputationSection />

        {/* Section 10A: Trust Journey (56877:104557) */}
        <ProviderTrustJourney />

        {/* Section 10B: 4 FAQ Items (56877:104664) */}
        <ProviderVerificationFaq />

        {/* Section 10C: Next Stage (56877:104673) */}
        <ProviderNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
