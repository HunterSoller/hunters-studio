import type { Metadata } from "next";
import AboutSection from "@/components/studio/AboutSection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About | The Studio | Buffalo, NY",
  description:
    "Focused, professional recording space in Buffalo, NY. Over four years of experience across every genre.",
};

export default function AboutPage() {
  return (
    <>
      <main className="relative z-10 min-h-screen pt-16">
        <AboutSection asPage />
      </main>
      <Footer />
    </>
  );
}
