"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ScrollLink from "./ScrollLink";
import ScrambleText from "./ScrambleText";
import LiveClock from "./LiveClock";
import { NAV, SITE } from "@/lib/site";

export default function StudioNavigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const [book, ...rest] = NAV;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ${
          scrolled || open ? "border-white/[0.07] bg-ink/75 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <div className="shell flex h-16 items-center justify-between gap-6">
          <ScrollLink href="/#top" className="group flex items-center gap-3" aria-label="Hunter’s Studio — home">
            <span className="grid h-8 min-w-[2.75rem] place-items-center border border-white/25 px-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-white transition-colors duration-300 group-hover:border-signal group-hover:text-signal">
              H/S
            </span>
            <ScrambleText
              text="HUNTER’S STUDIO"
              className="hidden font-mono text-[11px] tracking-[0.2em] text-white/75 transition-colors group-hover:text-white sm:inline"
            />
          </ScrollLink>

          <div className="hidden items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 xl:flex">
            <span className="flex items-center gap-2 text-white/70">
              [ <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" /> Online ]
            </span>
            <span>Buffalo / NY</span>
            <LiveClock className="text-white/70" />
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            <ScrollLink
              href={book.href}
              className="group relative mr-3 flex items-center gap-2.5 border border-signal/60 bg-signal/[0.08] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:bg-signal hover:text-black"
            >
              <span className="text-signal transition-colors group-hover:text-black">{book.index}</span>
              <ScrambleText text={book.label.toUpperCase()} />
              <span className="arrow-swap" aria-hidden>
                <span>→</span>
                <span>→</span>
              </span>
            </ScrollLink>
            {rest.map((item) =>
              item.external ? (
                <a
                  key={item.index}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white"
                >
                  <span className="text-white/30 transition-colors group-hover:text-signal">{item.index}</span>
                  <ScrambleText text={item.short.toUpperCase()} className="link-u" />
                  <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                    ↗
                  </span>
                </a>
              ) : (
                <ScrollLink
                  key={item.index}
                  href={item.href}
                  className="group flex items-center gap-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white"
                >
                  <span className="text-white/30 transition-colors group-hover:text-signal">{item.index}</span>
                  <ScrambleText text={item.label.toUpperCase()} className="link-u" />
                </ScrollLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ScrollLink
              href={book.href}
              className="border border-signal/70 bg-signal px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-black"
            >
              Book
            </ScrollLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85"
            >
              {open ? "Close" : "Menu"}
              <span aria-hidden className="relative block h-2 w-3">
                <span
                  className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ${open ? "translate-y-1 rotate-45" : ""}`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fade-in fixed inset-0 z-40 flex flex-col bg-ink/95 pt-16 backdrop-blur-xl md:hidden"
        >
          <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-center gap-1">
            {NAV.map((item, i) => {
              const inner = (
                <>
                  <span className="font-mono text-[11px] tracking-[0.2em] text-signal">{item.index}</span>
                  <span className="display text-[clamp(2rem,9.5vw,4rem)] font-[800] uppercase leading-none">
                    {item.label}
                  </span>
                  {item.external && <span className="font-mono text-lg text-white/50">↗</span>}
                </>
              );
              const cls =
                "fade-in flex items-baseline gap-4 border-b border-white/[0.08] py-4 text-white active:text-signal";
              return item.external ? (
                <a
                  key={item.index}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
                  {inner}
                </a>
              ) : (
                <ScrollLink
                  key={item.index}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cls}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
                  {inner}
                </ScrollLink>
              );
            })}
          </nav>
          <div className="shell flex items-center justify-between gap-4 pb-[4.5rem] font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            <span>{SITE.address}</span>
            <LiveClock />
          </div>
        </div>
      )}
    </>
  );
}
