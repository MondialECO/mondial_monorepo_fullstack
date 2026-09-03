import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CreatorPathHero from '@/components/public/creator-path/CreatorPathHero';
import IdeaComparisonSection from '@/components/public/creator-path/IdeaComparisonSection';
import SixPhasesSection from '@/components/public/creator-path/SixPhasesSection';
import IdentityVerificationSection from '@/components/public/creator-path/IdentityVerificationSection';
import ProjectIntelligenceSection from '@/components/public/creator-path/ProjectIntelligenceSection';
import ResourceSetupSection from '@/components/public/creator-path/ResourceSetupSection';
import OwnershipPathsSection from '@/components/public/creator-path/OwnershipPathsSection';
import FullBuyoutSection from '@/components/public/creator-path/FullBuyoutSection';
import CreatorDualPathSection from '@/components/public/creator-path/CreatorDualPathSection';
import MondialDifferenceSection from '@/components/public/creator-path/MondialDifferenceSection';
import LevelUpSection from '@/components/public/creator-path/LevelUpSection';
import CreatorPathStepper from '@/components/public/creator-path/CreatorPathStepper';
import CreatorPathFaq from '@/components/public/creator-path/CreatorPathFaq';
import CreatorPathFinalCta from '@/components/public/creator-path/CreatorPathFinalCta';

export const metadata: Metadata = {
  title: "Creator Path — 6 Phases Journey | Mondial.eco",
  description:
    "Explore the 6 structured phases from raw idea to project intelligence, offer setup, acquisition buyout, co-founder matching, or Verified Entrepreneur level up.",
  openGraph: {
    title: "Creator Path — 6 Phases Journey | Mondial.eco",
    description:
      "Explore the 6 structured phases from raw idea to project intelligence, offer setup, acquisition buyout, co-founder matching, or Verified Entrepreneur level up.",
    url: "https://mondialbusiness.eu/for-creators",
    siteName: "Mondial.eco",
    type: "website",
  },
};

export default function ForCreatorsPage() {
  return (
    <div className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between" data-testid="creator-path-page">
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Full Public Creator Path Experience */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 1: Hero & NOVA SPACE Preview (56877:90262) */}
        <CreatorPathHero />

        {/* Section 2: Raw Idea vs Structured Project (56877:89183) */}
        <IdeaComparisonSection />

        {/* Section 3: The Six Phases (56877:89261 - id="phases") */}
        <SixPhasesSection />

        {/* Section 4: Phase 01 Identity & Verification (56877:89380 - id="phase-1") */}
        <IdentityVerificationSection />

        {/* Section 5: Phase 03 Project Intelligence & AI (56877:89454 - id="concept") */}
        <ProjectIntelligenceSection />

        {/* Section 6: Phase 04 Offer & Resource Setup (56877:89549 - id="branding") */}
        <ResourceSetupSection />

        {/* Section 7: Phase 05 Three Ownership Paths (56877:89619) */}
        <OwnershipPathsSection />

        {/* Section 8: Full Buyout / Acquisition Deep Dive (56877:89668) */}
        <FullBuyoutSection />

        {/* Section 9: Co-Founder vs Build Yourself (56877:89804) */}
        <CreatorDualPathSection />

        {/* Section 10: The Mondial Difference Hub (56877:89958) */}
        <MondialDifferenceSection />

        {/* Section 11: Phase 06 Verified Entrepreneur Level Up (56877:90014) */}
        <LevelUpSection />

        {/* Section 12: Creator Path Stepper (56877:90145) */}
        <CreatorPathStepper />

        {/* Section 13: Creator FAQ (56877:90218) */}
        <CreatorPathFaq />

        {/* Section 14: Final Call To Action (56877:90232) */}
        <CreatorPathFinalCta />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
