import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import IdentityHero from '@/components/public/creator-identity/IdentityHero';
import TrustArchitectureSection from '@/components/public/creator-identity/TrustArchitectureSection';
import CreatorProfileDemo from '@/components/public/creator-identity/CreatorProfileDemo';
import ContactVerificationSection from '@/components/public/creator-identity/ContactVerificationSection';
import IdentityLivenessSection from '@/components/public/creator-identity/IdentityLivenessSection';
import ProfileReadinessSection from '@/components/public/creator-identity/ProfileReadinessSection';
import PrivacyControlSection from '@/components/public/creator-identity/PrivacyControlSection';
import IdentityCompletionSection from '@/components/public/creator-identity/IdentityCompletionSection';
import IdentityVerificationFaq from '@/components/public/creator-identity/IdentityVerificationFaq';

export const metadata: Metadata = {
  title: 'Identity & Verification for Creators | Mondial.eco',
  description:
    'Learn how Mondial builds a verified Creator foundation through identity, contact verification, profile readiness, privacy controls and liveness verification before project structuring begins.',
  openGraph: {
    title: 'Identity & Verification for Creators | Mondial.eco',
    description:
      'Learn how Mondial builds a verified Creator foundation through identity, contact verification, profile readiness, privacy controls and liveness verification before project structuring begins.',
    url: 'https://mondialbusiness.eu/for-creators/identity-verification',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function CreatorIdentityVerificationPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="creator-identity-verification-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Creator Identity & Verification Experience */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero & Workspace Mockup (56877:90351) */}
        <IdentityHero />

        {/* Section 02: Trust Architecture (56877:90460) */}
        <TrustArchitectureSection />

        {/* Section 03: Creator Profile Form Demo (56877:90565) */}
        <CreatorProfileDemo />

        {/* Section 04: Contact Verification (56877:90632) */}
        <ContactVerificationSection />

        {/* Section 05: Identity & Liveness (56877:90708) */}
        <IdentityLivenessSection />

        {/* Section 06: Profile Readiness (56877:90790) */}
        <ProfileReadinessSection />

        {/* Section 07: Privacy & Control (56877:90895) */}
        <PrivacyControlSection />

        {/* Section 08: Phase 01 Complete & Next Page Preview (56877:90976) */}
        <IdentityCompletionSection />

        {/* Section 09: Identity Verification FAQ (56877:91072) */}
        <IdentityVerificationFaq />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
