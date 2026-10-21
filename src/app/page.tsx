import type { Metadata } from 'next';
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import WireframeHero from "@/components/homepage/wireframe/WireframeHero";
import WireframeDeliverables from "@/components/homepage/wireframe/WireframeDeliverables";

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
        {/* Hero: Move from "I have an idea" to real business-ready outputs (Figma 57480:110) */}
        <WireframeHero />

        {/* 6 Business-Ready Deliverables Showcase with 3 Videos (Figma 57480:109) */}
        <WireframeDeliverables />
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>
  );
}


