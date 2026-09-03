import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import PricingHero from '@/components/public/pricing/PricingHero';
import RolePricingGrid from '@/components/public/pricing/RolePricingGrid';
import PricingComparison from '@/components/public/pricing/PricingComparison';
import ProviderCommission from '@/components/public/pricing/ProviderCommission';
import PricingClarification from '@/components/public/pricing/PricingClarification';
import PricingRoleGateway from '@/components/public/pricing/PricingRoleGateway';

export const metadata: Metadata = {
  title: 'Pricing | Mondial',
  description:
    'Explore Mondial pricing by role: free access for Creators and Entrepreneurs, €9.99/month for Service Providers and Investors, plus tier-based Service Provider commission on eligible paid work.',
  openGraph: {
    title: 'Pricing | Mondial',
    description:
      'Explore Mondial pricing by role: free access for Creators and Entrepreneurs, €9.99/month for Service Providers and Investors, plus tier-based Service Provider commission on eligible paid work.',
    url: 'https://mondialbusiness.eu/pricing',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="public-pricing-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Pricing Body (56939:79716) */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero (56939:79254) */}
        <PricingHero />

        {/* Section 01: 2-Column Role Pricing Grid + Closing Note (56939:79273) */}
        <RolePricingGrid />

        {/* Section 02 Part A: Quick Comparison Table (56939:79430) */}
        <PricingComparison />

        {/* Section 02 Part B: Service Provider Commission & €1,000 Project (56939:79506) */}
        <ProviderCommission />

        {/* Section 02 Part C: Important Clarification (56939:79572) */}
        <PricingClarification />

        {/* Section 02 Part E: Final Role CTA & Pricing Strip (56939:79643) */}
        <PricingRoleGateway />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
