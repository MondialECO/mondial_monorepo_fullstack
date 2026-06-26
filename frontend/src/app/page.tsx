import AllProfileSection from "@/components/homepage/AllProfileSection";
import FAQPage from "@/components/homepage/FAQ";
import FeaturesSection2 from "@/components/homepage/FeaturesSection2";
import HeroSection from "@/components/homepage/HeroSection";
import ImpactSection from "@/components/homepage/ImpactSection";
import PricingPage from "@/components/homepage/Pricing";
import RolesSection from "@/components/homepage/rolesSection";
import TrustedPartners from "@/components/homepage/TrustedPartners";
import Navbar from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div className=" ">
      {/* <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black"> */}
      <Navbar />
      <HeroSection />
      <AllProfileSection />
      <TrustedPartners />
      <RolesSection />
      {/* <FeaturesSection /> */}
      <FeaturesSection2 />
      <PricingPage />
      <ImpactSection />
      <FAQPage />
    </div>
  );
}
