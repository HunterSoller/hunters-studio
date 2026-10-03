import Reveal from "./Reveal";
import ScrollDrift from "./ScrollDrift";
import ScrollLink from "./ScrollLink";
import SectionLabel from "./SectionLabel";
import { INCLUDED, RATE } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

export default function PricingSection({ asPage = false }: { asPage?: boolean }) {
  const hours = Array.from({ length: RATE.maxHours - RATE.minHours + 1 }, (_, i) => RATE.minHours + i);
  const Heading = asPage ? "h1" : "h2";

  return (
    <section id="pricing" tabIndex={-1} className="relative scroll-mt-20 py-24 focus:outline-none md:py-36">
      <div className="shell">
        <SectionLabel index="03" label="Pricing" meta="Rate card" />

        <div className="mt-12 grid gap-16 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <p className="label text-white/60">Studio rate</p>
            <ScrollDrift distance={-6}>
              <Heading className="mt-4 flex items-start">
                <span className="sr-only">
                  ${RATE.perHour} per hour
                </span>
                <span aria-hidden className="display text-[clamp(7rem,17vw,15rem)] font-[800] leading-[0.78] text-white">
                  ${RATE.perHour}
                </span>
                <span aria-hidden className="ml-3 mt-[0.6em] whitespace-nowrap font-mono text-sm uppercase tracking-[0.2em] text-white/50 sm:text-base">
                  / hr
                </span>
              </Heading>
            </ScrollDrift>
            <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-white/60">
              One flat hourly rate. Book {RATE.minHours}–{RATE.maxHours} hours per session — your quote is calculated
              live as you pick times in the calendar.
            </p>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-6 lg:col-start-7">
            <div className="flex items-baseline justify-between border-b border-white/15 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              <span>Session length</span>
              <span>Total</span>
            </div>
            <ul>
              {hours.map((h) => (
                <li
                  key={h}
                  className="group flex items-baseline border-b border-white/[0.07] py-4 font-mono text-[13px] uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-white/[0.025] sm:text-sm"
                >
                  <span className="w-8 text-white/30 transition-colors group-hover:text-signal">{pad(h)}</span>
                  <span className="text-white/85">
                    {h} {h > 1 ? "hours" : "hour"}
                  </span>
                  <span aria-hidden className="leader opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="tabular-nums text-white transition-colors group-hover:text-signal">
                    ${h * RATE.perHour}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <p className="label mb-4 text-white/60">Included</p>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 border-t border-white/[0.07] py-3 text-[14px] leading-snug text-white/70"
                  >
                    <span aria-hidden className="font-mono text-signal">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <ScrollLink href="/#book" className="btn-signal group mt-12 w-full justify-between sm:w-auto">
              <span>Book a session</span>
              <span className="arrow-swap" aria-hidden>
                <span>→</span>
                <span>→</span>
              </span>
            </ScrollLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
