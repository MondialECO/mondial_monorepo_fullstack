import type { Metadata } from 'next';
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import FigmaHero from "@/components/homepage/FigmaHero";
import FigmaOutputsShowcase from "@/components/homepage/FigmaOutputsShowcase";
import FigmaHowItWorks from "@/components/homepage/FigmaHowItWorks";
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
    <div className="w-full min-h-screen bg-white dark:bg-background text-foreground flex flex-col justify-between overflow-x-hidden" data-testid="homepage-root">
      {/* 1. Global Public Header */}
      <Navbar />

      <main className="w-full flex-1 flex flex-col">
        {/* Section 1: Hero — Start your digital business for €0 (Figma 57354:15959) */}
        <FigmaHero />

        {/* Section 2: Real Deliverables Showcase — 6 Business-Ready Outputs (Figma 57360:15973) */}
        <FigmaOutputsShowcase />

        {/* Section 3: How It Works — From Idea to Company in 6 Steps (Figma 57377:9704) */}
        <FigmaHowItWorks />

        {/* Section 4: What's Next — Creator is Just the Beginning (Figma 57381:10328) */}
        <FigmaWhatsNext />

        {/* Section 5: FAQ — What "Start for €0" Really Means (Figma 57354:15783) */}
        <FigmaFaq />

        {/* Section 6: Final Call to Action Banner (Figma 57354:15831) */}
        <FigmaFinalCta />
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>
  );
}


