import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import EntrepreneurCompanyHero from '@/components/public/entrepreneur-company/EntrepreneurCompanyHero';
import EntrepreneurStartingPaths from '@/components/public/entrepreneur-company/EntrepreneurStartingPaths';
import CompanyIdentitySection from '@/components/public/entrepreneur-company/CompanyIdentitySection';
import OfficialCompanyVerification from '@/components/public/entrepreneur-company/OfficialCompanyVerification';
import RepresentativesControlSection from '@/components/public/entrepreneur-company/RepresentativesControlSection';
import FinancialFoundationSection from '@/components/public/entrepreneur-company/FinancialFoundationSection';
import ComplianceIntelligenceSection from '@/components/public/entrepreneur-company/ComplianceIntelligenceSection';
import CompanyPrivacyControlSection from '@/components/public/entrepreneur-company/CompanyPrivacyControlSection';
import CompanyReadinessSection from '@/components/public/entrepreneur-company/CompanyReadinessSection';
import CompanyFoundationCompletion from '@/components/public/entrepreneur-company/CompanyFoundationCompletion';
import EntrepreneurCompanyFaq from '@/components/public/entrepreneur-company/EntrepreneurCompanyFaq';
import EntrepreneurCompanyFinalCta from '@/components/public/entrepreneur-company/EntrepreneurCompanyFinalCta';

export const metadata: Metadata = {
  title: 'Company & Verification for Entrepreneurs | Mondial',
  description:
    'Learn how Mondial helps Entrepreneurs establish a structured company identity, verify registration and representatives, organize financial and compliance context, manage permissions and understand company readiness before execution, equity and funding.',
  openGraph: {
    title: 'Company & Verification for Entrepreneurs | Mondial',
    description:
      'Learn how Mondial helps Entrepreneurs establish a structured company identity, verify registration and representatives, organize financial and compliance context, manage permissions and understand company readiness before execution, equity and funding.',
    url: 'https://mondialbusiness.eu/for-entrepreneurs',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForEntrepreneursPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="entrepreneur-company-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Entrepreneur Company & Verification Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">

        {/* Section 01: Hero / Company Foundation Command Center (56877:95725) */}
        <EntrepreneurCompanyHero />

        {/* Section 02: Two Ways In / Y-Convergence (56877:95919) */}
        <EntrepreneurStartingPaths />

        {/* Section 03: Organization / Company Identity System (56877:96045 + 56877:96192) */}
        <CompanyIdentitySection />

        {/* Section 04: Official Company Verification (56877:96361) */}
        <OfficialCompanyVerification />

        {/* Section 05: Representatives & Control (56914:6706) */}
        <RepresentativesControlSection />

        {/* Section 06: Bank & Financial Foundation (56877:96642) */}
        <FinancialFoundationSection />

        {/* Section 07: Compliance Intelligence (56877:96830) */}
        <ComplianceIntelligenceSection />

        {/* Section 08: Trust Without Overexposure / Privacy Architecture (56909:7049) */}
        <CompanyPrivacyControlSection />

        {/* Section 09: Company Readiness Command Center (56877:97183) */}
        <CompanyReadinessSection />

        {/* Section 10: Foundation Complete -> Build & Execute (56877:97409) */}
        <CompanyFoundationCompletion />

        {/* Section 11: FAQ Accordion (56877:97409) */}
        <EntrepreneurCompanyFaq />

        {/* Section 12: Final CTA (56877:97409) */}
        <EntrepreneurCompanyFinalCta />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
