import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import FigmaPricingView from '@/components/pricing/FigmaPricingView';

export const metadata: Metadata = {
  title: 'Pricing — Create your digital company for €0 | Mondial',
  description:
    'Start with 200 free credits. Buy more only when you need them. No subscription. Transparent pay-as-you-go credit packs for digital company creation in France.',
  openGraph: {
    title: 'Pricing — Create your digital company for €0 | Mondial',
    description:
      'Start with 200 free credits. Buy more only when you need them. No subscription. Transparent pay-as-you-go credit packs for digital company creation in France.',
    url: 'https://mondialbusiness.eu/pricing',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <div
      className="w-full min-h-screen bg-[#F4F5F7] dark:bg-background text-foreground flex flex-col justify-between overflow-x-hidden"
      data-testid="public-pricing-page"
    >
      {/* 1. Global Public Header (Figma 57381:10846) */}
      <Navbar />

      {/* 2. Public Pricing Page Content (Figma 57424:108) */}
      <main className="w-full flex-1 flex flex-col items-center">
        <FigmaPricingView />
      </main>

      {/* 3. Global Public Footer (Figma 57381:10882) */}
      <Footer />
    </div>
  );
}
