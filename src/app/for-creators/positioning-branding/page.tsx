import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import PositioningBrandingHero from '@/components/public/positioning-branding/PositioningBrandingHero';
import PositioningSection from '@/components/public/positioning-branding/PositioningSection';
import ValuePropositionSection from '@/components/public/positioning-branding/ValuePropositionSection';
import DifferentiationSection from '@/components/public/positioning-branding/DifferentiationSection';
import MessagingHierarchySection from '@/components/public/positioning-branding/MessagingHierarchySection';
import BrandDirectionSection from '@/components/public/positioning-branding/BrandDirectionSection';
import ProjectPresentationSection from '@/components/public/positioning-branding/ProjectPresentationSection';
import PositioningCompletionSection from '@/components/public/positioning-branding/PositioningCompletionSection';
import PhaseThreePreviewSection from '@/components/public/positioning-branding/PhaseThreePreviewSection';
import PositioningBrandingFaq from '@/components/public/positioning-branding/PositioningBrandingFaq';
import PositioningFinalCta from '@/components/public/positioning-branding/PositioningFinalCta';

export const metadata: Metadata = {
  title: 'Positioning & Branding for Creators | Mondial.eco',
  description:
    'Learn how Mondial helps Creators turn a structured project into a clear market position, value proposition, differentiation, messaging system, brand direction and coherent project presentation before Project Intelligence.',
  openGraph: {
    title: 'Positioning & Branding for Creators | Mondial.eco',
    description:
      'Learn how Mondial helps Creators turn a structured project into a clear market position, value proposition, differentiation, messaging system, brand direction and coherent project presentation before Project Intelligence.',
    url: 'https://mondialbusiness.eu/for-creators/positioning-branding',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function PositioningBrandingPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="positioning-branding-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Creator Positioning & Branding Experience */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero (56877:91836) */}
        <PositioningBrandingHero />

        {/* Section 02: Step 01 — Positioning (56877:92034) */}
        <PositioningSection />

        {/* Section 03: Step 02 — Value Proposition (56877:92168) */}
        <ValuePropositionSection />

        {/* Section 04: Step 03 — Differentiation (56877:92302) */}
        <DifferentiationSection />

        {/* Section 05: Step 04 — Messaging Hierarchy (56909:7045) */}
        <MessagingHierarchySection />

        {/* Section 06: Step 05 — Brand Direction (56877:92590) */}
        <BrandDirectionSection />

        {/* Section 07: Project Presentation (56877:92775) */}
        <ProjectPresentationSection />

        {/* Section 08 Part A: Phase 02 Complete & Foundation Matrix (56877:92947) */}
        <PositioningCompletionSection />

        {/* Section 08 Part B: What Phase 03 Adds (56877:93022) */}
        <PhaseThreePreviewSection />

        {/* Section 08 Part C: FAQ (56877:93069) */}
        <PositioningBrandingFaq />

        {/* Section 08 Part D: Final CTA (56877:93081) */}
        <PositioningFinalCta />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
