import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing | The Studio | Buffalo, NY",
  description: "$40/hour. Professional recording studio in Buffalo, NY.",
};

export default function PricingPage() {
  const features = [
    "Professional microphone & treated recording space",
    "Mixing included",
    "High-quality WAV export",
    "Flexible session scheduling",
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a] pt-16">
        <section className="py-24 md:py-32">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="mb-12">
              <span className="text-7xl sm:text-8xl md:text-9xl font-light text-white tracking-tighter">
                $40
              </span>
              <p className="text-2xl text-white/60 mt-2">per hour</p>
            </div>

            <ul className="space-y-3 text-white/70 text-base mb-14">
              {features.map((item) => (
                <li key={item} className="flex items-center justify-center gap-2">
                  <span className="text-white/40">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/#book"
              className="group inline-block px-10 py-4 text-base font-medium text-[#111] bg-[#e8e8e8] rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-[6px] hover:scale-[1.04] active:translate-y-0.5 active:scale-[1.02] active:shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200"
            >
              Book
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
