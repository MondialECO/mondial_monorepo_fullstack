import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ToolboxHomepage from "@/components/homepage/ToolboxHomepage";

export const metadata: Metadata = {
  title: "MBC — The Intelligent Toolbox | Mondial Business Creation",
  description:
    "Create your Creator Profile, access your dashboard and use connected generators to turn your project into concrete, reusable business outputs.",
  openGraph: {
    title: "MBC — The Intelligent Toolbox",
    description:
      "One profile. One dashboard. Connected generators for your project, brand, finances, CV, website and roadmap.",
    url: "https://mondialbusiness.eu",
    siteName: "MBC — Mondial Business Creation",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white text-foreground">
      <Navbar />
      <main>
        <ToolboxHomepage />
      </main>
      <Footer />
    </div>
  );
}
