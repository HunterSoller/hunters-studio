import type { Metadata } from "next";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About | The Studio | Buffalo, NY",
  description:
    "Focused, professional recording space in Buffalo, NY. Over four years of experience across every genre.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a] pt-16">
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-12 text-center">
              About
            </h1>

            <div className="space-y-6 text-white/80 text-lg leading-relaxed mb-16">
              <p>
                The Studio is a focused, professional recording space in Buffalo, NY
                designed for artists who take their sound seriously.
              </p>
              <p>
                With over four years of hands-on experience and clients across every
                genre, I approach each session with precision and intention — whether
                you&apos;re tracking vocals, building a record from scratch, or
                dialing in the final mix.
              </p>
              <p>
                As a student at the University at Buffalo, I&apos;ve built this space
                to balance creativity with technical discipline.
              </p>
              <p>
                Feel free to call me if you have any questions:{" "}
                <a
                  href="tel:+15188679959"
                  className="text-white underline underline-offset-2 hover:no-underline"
                >
                  (518) 867-9959
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white/5">
                <Image
                  src="/images/aboutpic.jpg"
                  alt="The Studio — Buffalo, NY"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white/5">
                <Image
                  src="/images/aboutpic2.jpg"
                  alt="The Studio — recording space"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
