import type { Metadata } from "next";
import PricingSection from "@/components/studio/PricingSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing | The Studio | Buffalo, NY",
  description: "$40/hour. Professional recording studio in Buffalo, NY.",
};

export default function PricingPage() {
  return (
    <>
      <main className="relative z-10 min-h-screen pt-16">
        <PricingSection asPage />
      </main>
      <Footer />
    </>
  );
}
