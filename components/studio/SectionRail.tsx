"use client";

import { useEffect, useRef, useState } from "react";
import ScrollLink from "./ScrollLink";

const ITEMS = [
  { id: "top", index: "00", label: "Index" },
  { id: "book", index: "01", label: "Book" },
  { id: "about", index: "02", label: "About" },
  { id: "pricing", index: "03", label: "Pricing" },
];

/** Edge-of-viewport section index + scroll progress (xl screens only). */
export default function SectionRail() {
  const [active, setActive] = useState("top");
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <nav
        aria-label="Sections"
        className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 xl:flex"
      >
        {ITEMS.map((item) => {
          const on = active === item.id;
          return (
            <ScrollLink
              key={item.id}
              href={`/#${item.id}`}
              aria-current={on ? "true" : undefined}
              className="group flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em]"
            >
              <span
                className={`max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,color] duration-500 ease-out-expo group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100 ${
                  on ? "text-white/70" : "text-white/50"
                }`}
              >
                {item.label}
              </span>
              <span className={`transition-colors ${on ? "text-signal" : "text-white/30 group-hover:text-white/70"}`}>
                {item.index}
              </span>
              <span
                aria-hidden
                className={`h-px transition-[width,background-color] duration-500 ease-out-expo ${on ? "w-5 bg-signal" : "w-2.5 bg-white/25"}`}
              />
            </ScrollLink>
          );
        })}
      </nav>

      <div aria-hidden className="fixed left-7 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 xl:flex">
        <span className="relative block h-28 w-px overflow-hidden bg-white/10">
          <span ref={barRef} className="absolute inset-0 origin-top scale-y-0 bg-signal" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35 [writing-mode:vertical-rl]">
          Recording / Production
        </span>
      </div>
    </>
  );
}
