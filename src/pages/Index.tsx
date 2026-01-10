import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
