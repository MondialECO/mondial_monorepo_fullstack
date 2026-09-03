import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import BuildExecuteHero from '@/components/public/entrepreneur-build/BuildExecuteHero';
import OpportunityDiscoverySection from '@/components/public/entrepreneur-build/OpportunityDiscoverySection';
import PathsToExecutionSection from '@/components/public/entrepreneur-build/PathsToExecutionSection';
import StructuredDiscoverySection from '@/components/public/entrepreneur-build/StructuredDiscoverySection';
import PeopleResourcesSection from '@/components/public/entrepreneur-build/PeopleResourcesSection';
import ProviderBriefSection from '@/components/public/entrepreneur-build/ProviderBriefSection';
import ExecutionStructureSection from '@/components/public/entrepreneur-build/ExecutionStructureSection';
import ActivityEvidenceSection from '@/components/public/entrepreneur-build/ActivityEvidenceSection';
import ConnectedEntrepreneurJourney from '@/components/public/entrepreneur-build/ConnectedEntrepreneurJourney';
import BuildExecuteStorySection from '@/components/public/entrepreneur-build/BuildExecuteStorySection';
import BuildExecuteFaq from '@/components/public/entrepreneur-build/BuildExecuteFaq';
import BuildExecuteNextStage from '@/components/public/entrepreneur-build/BuildExecuteNextStage';

export const metadata: Metadata = {
  title: 'Build & Execute for Entrepreneurs | Mondial',
  description:
    'See how Mondial helps Entrepreneurs turn company priorities into structured project opportunities, resource decisions, people, provider briefs, milestones, dependencies and execution evidence before Equity & Readiness.',
  openGraph: {
    title: 'Build & Execute for Entrepreneurs | Mondial',
    description:
      'See how Mondial helps Entrepreneurs turn company priorities into structured project opportunities, resource decisions, people, provider briefs, milestones, dependencies and execution evidence before Equity & Readiness.',
    url: 'https://mondialbusiness.eu/for-entrepreneurs/build-execute',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForEntrepreneursBuildExecutePage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="entrepreneur-build-execute-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Entrepreneur Build & Execute Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Build & Execute Command Center (56877:97663) */}
        <BuildExecuteHero />

        {/* Section 02: Opportunity Discovery (56877:97830) */}
        <OpportunityDiscoverySection />

        {/* Section 03: Paths to Execution (56914:79249 / 56877:98082) */}
        <PathsToExecutionSection />

        {/* Section 04: Structured Discovery (56877:98233) */}
        <StructuredDiscoverySection />

        {/* Section 05: People & Resources (56914:79250 / 56877:98443) */}
        <PeopleResourcesSection />

        {/* Section 06: From Need to Expertise / Structured Brief (56914:79251 / 56877:98550) */}
        <ProviderBriefSection />

        {/* Section 07: Execution Structure / Workstreams & Critical Path (56914:79252 / 56877:98672) */}
        <ExecutionStructureSection />

        {/* Section 08: From Activity to Evidence (56877:98779) */}
        <ActivityEvidenceSection />

        {/* Section 09: One Connected Entrepreneur Journey (56877:98923) */}
        <ConnectedEntrepreneurJourney />

        {/* Section 10: 5-Step Narrative & Execution Equation (56877:99051) */}
        <BuildExecuteStorySection />

        {/* Section 11: 8 FAQ Accordion Items (56877:99051) */}
        <BuildExecuteFaq />

        {/* Section 12: Next Stage & Final CTA (56877:99051) */}
        <BuildExecuteNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
