import type { Metadata } from 'next';
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WireframeHero from "@/components/homepage/wireframe/WireframeHero";
import WireframeDeliverables from "@/components/homepage/wireframe/WireframeDeliverables";
import FigmaHero from '@/components/homepage/FigmaHero';

import FigmaOutputsShowcase from "@/components/homepage/FigmaOutputsShowcase";
import FigmaHowItWorks from "@/components/homepage/FigmaHowItWorks";
import FigmaTrustSources from "@/components/homepage/FigmaTrustSources";
import FigmaWhatsNext from "@/components/homepage/FigmaWhatsNext";
import FigmaFaq from "@/components/homepage/FigmaFaq";
import FigmaFinalCta from "@/components/homepage/FigmaFinalCta";

export const metadata: Metadata = {
  title: "MBC — Start your digital business for €0 | Mondial.eco",
  description:
    "One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch. 6 structured phases from raw idea to French company formation.",
  openGraph: {
    title: "MBC — Start your digital business for €0 | Mondial.eco",
    description:
      "One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch. 6 structured phases from raw idea to French company formation.",
    url: "https://mondialbusiness.eu",
    siteName: "Mondial.eco",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-background text-foreground flex flex-col justify-between overflow-x-clip" data-testid="homepage-root">
      {/* 1. Global Public Header */}
      <Navbar />

      <main className="w-full flex-1 flex flex-col">

        {/* Section 1: Hero — MBC The Intelligent Toolbox */}
        <FigmaHero />

        {/* Section 2: Hero — Move from "I have an idea" to real business-ready outputs */}
        <WireframeHero />

        {/* 6 Business-Ready Deliverables Showcase with 3 Videos */}
        <WireframeDeliverables />

        {/* <FigmaOutputsShowcase /> */}

        {/* Section 3: How It Works — From Idea to Company in 6 Steps */}
        <FigmaHowItWorks />

        {/* Section 4: Where The Facts Come From — Official French Sources */}
        <FigmaTrustSources />

        {/* Section 5: What's Next — Creator is Just the Beginning */}
        <FigmaWhatsNext />

        {/* Section 5: FAQ — What "Start for €0" Really Means */}
        <FigmaFaq />

        {/* Section 6: Final Call to Action Banner */}
        <FigmaFinalCta />
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>
  );
}


