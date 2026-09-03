import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProjectConceptHero from '@/components/public/project-concept/ProjectConceptHero';
import ConceptTransformationSection from '@/components/public/project-concept/ConceptTransformationSection';
import ProjectNameConceptSection from '@/components/public/project-concept/ProjectNameConceptSection';
import ProblemDefinitionSection from '@/components/public/project-concept/ProblemDefinitionSection';
import SolutionDefinitionSection from '@/components/public/project-concept/SolutionDefinitionSection';
import TargetCustomerSection from '@/components/public/project-concept/TargetCustomerSection';
import ConceptSynthesisSection from '@/components/public/project-concept/ConceptSynthesisSection';
import ProjectConceptCompletionSection from '@/components/public/project-concept/ProjectConceptCompletionSection';
import ProjectConceptFaq from '@/components/public/project-concept/ProjectConceptFaq';

export const metadata: Metadata = {
  title: 'Project Identity & Concept — Creator Phase 02 | Mondial.eco',
  description:
    'Turn a rough idea into a structured project identity, clear problem definition, core solution pillars, and defined target customer on Mondial.',
  openGraph: {
    title: 'Project Identity & Concept — Creator Phase 02 | Mondial.eco',
    description:
      'Turn a rough idea into a structured project identity, clear problem definition, core solution pillars, and defined target customer on Mondial.',
    url: 'https://mondialbusiness.eu/for-creators/project-identity-concept',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ProjectIdentityConceptPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="project-identity-concept-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Project Identity & Concept Experience */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero & Workspace Preview (56877:91084) */}
        <ProjectConceptHero />

        {/* Section 02: Structure Before Strategy (56877:91156) */}
        <ConceptTransformationSection />

        {/* Section 03: Name The Project & One-Line Concept (56877:91253) */}
        <ProjectNameConceptSection />

        {/* Section 04: Problem Definition (56877:91314) */}
        <ProblemDefinitionSection />

        {/* Section 05: Solution & Value Pillars (56877:91372) */}
        <SolutionDefinitionSection />

        {/* Section 06: Target Customer (56877:91435) */}
        <TargetCustomerSection />

        {/* Section 07: Concept Synthesis Bento (56877:91530) */}
        <ConceptSynthesisSection />

        {/* Section 08: Phase 02 Complete & Next Preview (56877:91675) */}
        <ProjectConceptCompletionSection />

        {/* Section 09: FAQ (56877:91675) */}
        <ProjectConceptFaq />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
