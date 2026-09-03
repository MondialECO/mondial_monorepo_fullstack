import type { Metadata } from 'next';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProviderProjectDeliveryHero from '@/components/public/provider-project-delivery/ProviderProjectDeliveryHero';
import ProposalAnatomySection from '@/components/public/provider-project-delivery/ProposalAnatomySection';
import AlignmentNegotiationSection from '@/components/public/provider-project-delivery/AlignmentNegotiationSection';
import ProjectPreparationSection from '@/components/public/provider-project-delivery/ProjectPreparationSection';
import TrustBeforeDeliverySection from '@/components/public/provider-project-delivery/TrustBeforeDeliverySection';
import ContextualMessengerSection from '@/components/public/provider-project-delivery/ContextualMessengerSection';
import DeliveryWorkflowSection from '@/components/public/provider-project-delivery/DeliveryWorkflowSection';
import DeliveryReviewCycle from '@/components/public/provider-project-delivery/DeliveryReviewCycle';
import DisputeResolutionSection from '@/components/public/provider-project-delivery/DisputeResolutionSection';
import ProviderProjectJourney from '@/components/public/provider-project-delivery/ProviderProjectJourney';
import ProjectDeliveryFaq from '@/components/public/provider-project-delivery/ProjectDeliveryFaq';
import ProjectDeliveryNextStage from '@/components/public/provider-project-delivery/ProjectDeliveryNextStage';

export const metadata: Metadata = {
  title: 'Projects & Delivery for Service Providers | Mondial',
  description:
    'Learn how Mondial helps Service Providers move from client opportunity and proposal through scope alignment, agreement, project preparation, structured delivery, milestone review, revisions and completion.',
  openGraph: {
    title: 'Projects & Delivery for Service Providers | Mondial',
    description:
      'Learn how Mondial helps Service Providers move from client opportunity and proposal through scope alignment, agreement, project preparation, structured delivery, milestone review, revisions and completion.',
    url: 'https://mondialbusiness.eu/for-service-providers/project-delivery',
    siteName: 'Mondial.eco',
    type: 'website',
  },
};

export default function ForServiceProvidersProjectDeliveryPage() {
  return (
    <div
      className="w-full min-h-screen bg-white text-foreground flex flex-col justify-between"
      data-testid="service-provider-project-delivery-page"
    >
      {/* 1. Global Public Header (Locked) */}
      <Navbar />

      {/* 2. Public Service Provider Project & Delivery Journey */}
      <main className="w-full flex-1 flex flex-col items-center overflow-x-hidden">
        {/* Section 01: Hero / Project Delivery Journey (56877:106325) */}
        <ProviderProjectDeliveryHero />

        {/* Section 02: Strategic Proposal Anatomy (56877:106454) */}
        <ProposalAnatomySection />

        {/* Section 03: Alignment & Negotiation (56877:106568) */}
        <AlignmentNegotiationSection />

        {/* Section 04: Project Preparation & Booking (Definitive visible version of 56877:106743 / 56877:106810 rendered ONCE) */}
        <ProjectPreparationSection />

        {/* Section 05: Trust Before Delivery (56877:106877) */}
        <TrustBeforeDeliverySection />

        {/* Section 06: Conversation with Context / Messenger (56877:106997) */}
        <ContextualMessengerSection />

        {/* Section 07: Delivery Workflow Logic (56877:107168) */}
        <DeliveryWorkflowSection />

        {/* Section 08: Delivery & Review Cycle (56877:107318) */}
        <DeliveryReviewCycle />

        {/* Section 09: Structured Dispute Resolution (56877:107458) */}
        <DisputeResolutionSection />

        {/* Part A: The Project Journey (56877:107594) */}
        <ProviderProjectJourney />

        {/* FAQ Section: 10 Unique Items (56877:107771) */}
        <ProjectDeliveryFaq />

        {/* Part C & Bottom Context: Next Stage Transition (56877:107701 + 56877:107587) */}
        <ProjectDeliveryNextStage />
      </main>

      {/* 3. Global Approved Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
