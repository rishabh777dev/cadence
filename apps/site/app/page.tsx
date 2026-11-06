import { AppGrid } from "@/components/AppGrid";
import { BentoFeatures } from "@/components/BentoFeatures";
import { ComparisonTable } from "@/components/ComparisonTable";
import { DownloadSection } from "@/components/DownloadSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { Navbar } from "@/components/Navbar";
import { ShortcutsShowcase } from "@/components/ShortcutsShowcase";
import { Testimonials } from "@/components/Testimonials";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#11100E] text-[#1A1815] dark:text-[#EDE9DF] selection:bg-[#C15F3D]/20 selection:text-[#C15F3D]">
      <Navbar />
      <Hero />
      <AppGrid />
      <InteractiveDemo />
      <BentoFeatures />
      <ComparisonTable />
      <ShortcutsShowcase />
      <DownloadSection />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
