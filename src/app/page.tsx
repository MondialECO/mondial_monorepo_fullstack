import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navbar from "@/components/shared/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import AllProfileSection from "@/components/homepage/AllProfileSection";

// Lazy load below-fold sections
const TrustedPartners = dynamic(() => import("@/components/homepage/TrustedPartners"), {
  loading: () => <div className="h-64 bg-muted animate-pulse" />,
});

const RolesSection = dynamic(() => import("@/components/homepage/rolesSection"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
});

const FeaturesSection2 = dynamic(() => import("@/components/homepage/FeaturesSection2"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
});

const PricingPage = dynamic(() => import("@/components/homepage/Pricing"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
});

const ImpactSection = dynamic(() => import("@/components/homepage/ImpactSection"), {
  loading: () => <div className="h-64 bg-muted animate-pulse" />,
});

const FAQPage = dynamic(() => import("@/components/homepage/FAQ"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
});

export default function Home() {
  return (
    <div className="w-full">
      <Navbar />
      <main id="concept">
        <HeroSection />
      </main>
      <section id="profiles">
        <AllProfileSection />
      </section>
      <section id="partners">
        <TrustedPartners />
      </section>
      <section id="roles">
        <RolesSection />
      </section>
      <section id="features">
        <FeaturesSection2 />
      </section>
      <section id="pricing">
        <PricingPage />
      </section>
      <section id="impact">
        <ImpactSection />
      </section>
      <section id="faq">
        <FAQPage />
      </section>
    </div>
  );
}
