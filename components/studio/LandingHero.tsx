"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import ScrollLink from "./ScrollLink";
import { RATE, SITE } from "@/lib/site";
import { cssVars, smoothScrollTo } from "@/lib/motion";

const HeroVisual = dynamic(() => import("./HeroVisual"), { ssr: false });

export default function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    // Arriving from another page via /#section: settle on the section once layout is in place.
    const hash = window.location.hash.slice(1);
    if (hash) requestAnimationFrame(() => smoothScrollTo(hash));
    const el = ref.current;
    if (!el) return () => cancelAnimationFrame(id);

    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, el.offsetHeight)));
      el.style.setProperty("--hero-p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      id="top"
      ref={ref}
      aria-label="Hunter’s Studio"
      className={`relative isolate flex min-h-screen flex-col overflow-hidden supports-[height:100lvh]:min-h-[100lvh] ${ready ? "is-in" : ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ opacity: "calc(1 - var(--hero-p, 0))" }}
      >
        <HeroVisual />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>

      <div
        className="shell flex min-h-screen flex-col justify-between pb-8 pt-24 supports-[height:100svh]:min-h-[100svh] sm:pb-10 sm:pt-28"
        style={{ opacity: "calc(1 - var(--hero-p, 0) * 1.4)" }}
      >
        {/* Top meta row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="fade-in space-y-1.5" style={{ animationDelay: "200ms" }}>
            <p className="label text-white/80">{SITE.city}</p>
            <p className="label">Recording / Production</p>
          </div>
          <div className="fade-in space-y-1.5 text-right" style={{ animationDelay: "440ms" }}>
            <p className="label">Rate</p>
            <p className="label text-white/80">${RATE.perHour} / HR</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative my-10 sm:my-12">
          <h1 className="select-none font-mono text-[clamp(2.2rem,6vw,6.5rem)] font-light uppercase leading-[0.95] tracking-[-0.04em] text-white">
            <span className="wipe-line hero-slide-l" style={cssVars({ "--d": "60ms" })}>
              Hunter’s
            </span>
            <span className="hero-slide-r flex items-start gap-[2vw] pl-[6vw]">
              <span className="wipe-line" style={cssVars({ "--d": "180ms" })}>
                Studio
              </span>
              <span
                aria-hidden
                className="fade-in mt-[1.4vw] hidden flex-col gap-2 font-mono text-[10px] font-normal normal-case leading-none tracking-[0.2em] text-white/55 sm:flex"
                style={{ animationDelay: "650ms" }}
              >
                <span className="flex items-center gap-2 uppercase text-white/80">
                  <span className="blink h-1.5 w-1.5 rounded-full bg-[#ff3b30]" /> Rec
                </span>
                <span className="uppercase">Tracking</span>
                <span className="uppercase">Mixing</span>
              </span>
            </span>
          </h1>
        </div>

        {/* Bottom action row */}
        <div className="grid items-end gap-8 md:grid-cols-12">
          <p
            className="fade-in max-w-sm font-mono text-[13px] leading-relaxed text-white/65 md:col-span-4"
            style={{ animationDelay: "900ms" }}
          >
            A focused, professional recording space designed for artists who take their sound seriously.
          </p>

          <div
            className="fade-in flex flex-wrap items-center gap-3 md:col-span-5 md:justify-center"
            style={{ animationDelay: "1050ms" }}
          >
            <ScrollLink href="/#book" className="btn-signal group w-full justify-between sm:w-auto">
              <span>Book a session</span>
              <span className="arrow-swap" aria-hidden>
                <span>→</span>
                <span>→</span>
              </span>
            </ScrollLink>
            <ScrollLink href="/#pricing" className="btn-line group hidden sm:inline-flex">
              <span className="link-u">Rates</span>
            </ScrollLink>
          </div>

          <div
            className="fade-in hidden items-end justify-end gap-4 md:col-span-3 md:flex"
            style={{ animationDelay: "1200ms" }}
          >
            <span className="label">Scroll</span>
            <span className="relative block h-14 w-px overflow-hidden bg-white/10">
              <span className="scroll-cue absolute inset-0 bg-white/70" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
