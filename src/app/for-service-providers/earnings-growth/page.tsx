import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProviderEarningsHero from '@/components/public/provider-earnings-growth/ProviderEarningsHero';
import PaymentJourneySection from '@/components/public/provider-earnings-growth/PaymentJourneySection';
import PlatformEconomicsSection from '@/components/public/provider-earnings-growth/PlatformEconomicsSection';
import PayoutMethodsSection from '@/components/public/provider-earnings-growth/PayoutMethodsSection';
import FinancialRecordsSection from '@/components/public/provider-earnings-growth/FinancialRecordsSection';
import ProviderReviewTrustSection from '@/components/public/provider-earnings-growth/ProviderReviewTrustSection';
import MondialScoreSection from '@/components/public/provider-earnings-growth/MondialScoreSection';
import ProviderLoyaltySection from '@/components/public/provider-earnings-growth/ProviderLoyaltySection';
import ProviderAnalyticsSection from '@/components/public/provider-earnings-growth/ProviderAnalyticsSection';
import ProviderGrowthConclusion from '@/components/public/provider-earnings-growth/ProviderGrowthConclusion';
import ProviderEarningsFaq from '@/components/public/provider-earnings-growth/ProviderEarningsFaq';
import CompleteProviderJourney from '@/components/public/provider-earnings-growth/CompleteProviderJourney';

export const metadata: Metadata = {
  title: 'Earnings & Growth for Service Providers | Mondial',
  description:
    'Learn how Mondial helps Service Providers understand project earnings, platform commission, payout context, financial records, reviews, reputation signals, tier progression, client loyalty and performance analytics after completed work.',
  openGraph: {
    title: 'Earnings & Growth for Service Providers | Mondial',
    description:
      'Learn how Mondial helps Service Providers understand project earnings, platform commission, payout context, financial records, reviews, reputation signals, tier progression, client loyalty and performance analytics after completed work.',
    url: 'https://mondialbusiness.eu/for-service-providers/earnings-growth',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForServiceProvidersEarningsGrowthPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="service-provider-earnings-growth-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Service Provider Earnings & Growth Journey (Final Stage 04) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Provider Growth Loop (56877:107798) */}
        <ProviderEarningsHero />

        {/* Section 02: Payment Journey / Follow the Money (56877:107956) */}
        <PaymentJourneySection />

        {/* Section 03: Platform Economics (56877:108063) */}
        <PlatformEconomicsSection />

        {/* Section 04: Payout Velocity & Methods (56877:108164) */}
        <PayoutMethodsSection />

        {/* Section 05: Financial Records (56877:108277) */}
        <FinancialRecordsSection />

        {/* Section 06: Reputation & Trust / After the Delivery (56877:108411) */}
        <ProviderReviewTrustSection />

        {/* Section 07: Reputation & The Mondial Score (56877:108550) */}
        <MondialScoreSection />

        {/* Section 08: Client Loyalty & Repeat Growth (56877:108666) */}
        <ProviderLoyaltySection />

        {/* Section 09: Actionable Analytics (56877:108788) */}
        <ProviderAnalyticsSection />

        {/* Section 10A: Growth Should Compound (56877:108937) */}
        <ProviderGrowthConclusion />

        {/* Section 10B: 10 FAQs (56877:109039) */}
        <ProviderEarningsFaq />

        {/* Section 10C: Complete Provider Journey (56877:109054) */}
        <CompleteProviderJourney />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
