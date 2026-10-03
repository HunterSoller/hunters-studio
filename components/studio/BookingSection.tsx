import Booking from "@/components/Booking";
import Reveal from "./Reveal";
import { RATE, SITE } from "@/lib/site";

const STEPS = [
  ["01", "Pick a date"],
  ["02", "Choose hours"],
  ["03", "Set start / end"],
  ["04", "Your details"],
  ["05", "Request booking"],
] as const;

/** Presentational frame around the existing booking component. */
export default function BookingSection() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="shell grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,46rem)]">
        <aside className="hidden pt-14 lg:block" aria-label="How booking works">
          <Reveal className="sticky top-28">
            <div aria-hidden className="display text-outline select-none text-[11rem] font-[800] leading-[0.8]">
              01
            </div>
            <div className="mt-10 max-w-xs">
              <p className="label mb-4 text-white/70">Sequence</p>
              <ol className="border-t border-white/[0.08]">
                {STEPS.map(([n, label]) => (
                  <li
                    key={n}
                    className="flex items-center gap-4 border-b border-white/[0.08] py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55"
                  >
                    <span className="text-signal/80">{n}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <dl className="mt-10 space-y-4 font-mono text-[11px] uppercase tracking-[0.16em]">
                <div className="flex items-baseline">
                  <dt className="text-white/40">Rate</dt>
                  <span aria-hidden className="leader" />
                  <dd className="text-white">${RATE.perHour} / hr</dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="text-white/40">Session</dt>
                  <span aria-hidden className="leader" />
                  <dd className="text-white">
                    {RATE.minHours}–{RATE.maxHours} hrs
                  </dd>
                </div>
                <div className="flex items-baseline">
                  <dt className="text-white/40">Where</dt>
                  <span aria-hidden className="leader" />
                  <dd className="text-right text-white">{SITE.city}</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </aside>
        <div className="min-w-0">
          <Booking />
        </div>
      </div>
    </div>
  );
}
