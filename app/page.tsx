import LandingHero from "@/components/studio/LandingHero";
import BookingSection from "@/components/studio/BookingSection";
import AboutSection from "@/components/studio/AboutSection";
import PricingSection from "@/components/studio/PricingSection";
import SectionRail from "@/components/studio/SectionRail";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SectionRail />
      <main className="relative z-10">
        <LandingHero />
        <BookingSection />
        <AboutSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
