import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import FigmaHero from "@/components/homepage/FigmaHero";
import FigmaMetrics from "@/components/homepage/FigmaMetrics";
import FigmaProblem from "@/components/homepage/FigmaProblem";
import FigmaBeforeAfter from "@/components/homepage/FigmaBeforeAfter";
import FigmaProductShowcase from "@/components/homepage/FigmaProductShowcase";
import FigmaServiceProviders from "@/components/homepage/FigmaServiceProviders";
import FigmaWhyMondial from "@/components/homepage/FigmaWhyMondial";
import FigmaLegalRoadmap from "@/components/homepage/FigmaLegalRoadmap";
import FigmaAlphaRoadmap from "@/components/homepage/FigmaAlphaRoadmap";
import FigmaRoleGateway from "@/components/homepage/FigmaRoleGateway";
import FigmaNewsletter from "@/components/homepage/FigmaNewsletter";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Global Public Header */}
      <Navbar />

      <main className="w-full flex flex-col flex-1">
        {/* 2. Hero Section */}
        <FigmaHero />

        {/* 3. System in Numbers / Closed Alpha Transparency */}
        <FigmaMetrics />

        {/* 4. The Problem / Pain Points */}
        <FigmaProblem />

        {/* 5. Before & After Interactive Comparison */}
        <FigmaBeforeAfter />

        {/* 6. Inside the Product (Dark Showcase) */}
        <FigmaProductShowcase />

        {/* 7. Service Providers */}
        <FigmaServiceProviders />

        {/* 8. Why Mondial (4 Pillars) */}
        <FigmaWhyMondial />

        {/* 9. Legal Wired Into Every Phase */}
        <FigmaLegalRoadmap />

        {/* 10. Closed Alpha Roadmap & Founder Transparency */}
        <FigmaAlphaRoadmap />

        {/* 11. Role Gateway & Get Started Call to Action */}
        <FigmaRoleGateway />

        {/* 12. The Mondial Brief Newsletter */}
        <FigmaNewsletter />
      </main>

      {/* 13. Approved Global Public Footer (Locked) */}
      <Footer />
    </div>
  );
}
