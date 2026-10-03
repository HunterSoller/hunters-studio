import Image from "next/image";
import Reveal from "./Reveal";
import ScrollDrift from "./ScrollDrift";
import SectionLabel from "./SectionLabel";
import Waveform from "./Waveform";
import { SITE } from "@/lib/site";

const SPECS = [
  ["Experience", "4+ years"],
  ["Genres", "Every genre"],
  ["Services", "Tracking / Mixing"],
  ["Base", SITE.city],
] as const;

export default function AboutSection({ asPage = false }: { asPage?: boolean }) {
  const Heading = asPage ? "h1" : "h2";

  return (
    <section id="about" tabIndex={-1} className="relative scroll-mt-20 py-24 focus:outline-none md:py-36">
      <div className="shell">
        <SectionLabel index="02" label="About" meta="The room" />

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-8">
            <ScrollDrift distance={6}>
              <Heading className="font-mono text-[clamp(1.9rem,4.4vw,4.5rem)] font-light uppercase leading-[1.02] tracking-[-0.04em] text-white">
                A focused room for artists who take their sound{" "}
                <em className="not-italic normal-case text-signal">seriously.</em>
              </Heading>
            </ScrollDrift>
          </Reveal>

          <Reveal delay={150} className="space-y-5 self-end font-mono text-[13px] leading-[1.8] text-white/65 lg:col-span-4">
            <p>
              With over four years of hands-on experience and clients across every genre, I approach each session with
              precision and intention — whether you&apos;re tracking vocals, building a record from scratch, or dialing
              in the final mix.
            </p>
            <p>
              I&apos;ve worked with over 40 artists and clients, specializing in hip-hop and vocal production. From
              building custom vocal chains and presets to recording, mixing, and full production, my goal is to give every
              artist a sound that feels polished, competitive, and uniquely their own.
            </p>
            <p>
              Feel free to call me if you have any questions:{" "}
              <a href={SITE.phoneHref} className="link-u whitespace-nowrap text-white">
                {SITE.phoneDisplay}
              </a>
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-16 grid grid-cols-2 border-t border-white/[0.08] md:grid-cols-4">
          {SPECS.map(([k, v], i) => (
            <div
              key={k}
              className={`border-b border-white/[0.08] py-5 pr-4 md:border-b-0 ${i > 0 ? "md:border-l md:pl-6" : ""} ${i % 2 === 1 ? "border-l pl-4 md:pl-6" : ""}`}
            >
              <p className="label">{k}</p>
              <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.12em] text-white/90">{v}</p>
            </div>
          ))}
        </Reveal>

        <div className="mt-16 grid grid-cols-12 gap-4 md:mt-24 md:gap-8">
          <Reveal className="col-span-12 sm:col-span-7 md:col-span-6 lg:col-span-5">
            <figure className="group">
              <div className="ticks relative aspect-[4/5] overflow-hidden bg-white/[0.03]">
                <Image
                  src="/images/aboutpic.jpg"
                  alt="The Studio — Buffalo, NY"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 40vw"
                  className="object-cover saturate-[0.8] transition-[transform,filter] duration-[1400ms] ease-out-expo group-hover:scale-[1.035] group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              </div>
              <figcaption className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                <span>Fig. 01 — The Studio</span>
                <span>{SITE.city}</span>
              </figcaption>
            </figure>
          </Reveal>
          <Reveal
            delay={120}
            className="col-span-10 col-start-3 sm:col-span-5 sm:col-start-8 sm:mt-32 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-8"
          >
            <figure className="group">
              <div className="ticks relative aspect-[4/5] overflow-hidden bg-white/[0.03]">
                <Image
                  src="/images/aboutpic2.jpg"
                  alt="The Studio — recording space"
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 40vw, 32vw"
                  className="object-cover saturate-[0.8] transition-[transform,filter] duration-[1400ms] ease-out-expo group-hover:scale-[1.035] group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              </div>
              <figcaption className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                <span>Fig. 02 — Recording space</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <Waveform className="mt-24 md:mt-32" />
      </div>
    </section>
  );
}
