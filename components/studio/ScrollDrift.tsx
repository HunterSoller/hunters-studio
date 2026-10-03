"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Starting horizontal offset in vw as the element enters. Negative starts it to the left. */
  distance?: number;
  /** Fraction of the viewport height the element travels before it has fully settled into alignment. */
  settle?: number;
  className?: string;
};

/** Slides its content sideways into alignment as it scrolls into view; it rests perfectly aligned once settled. */
export default function ScrollDrift({ children, distance = 8, settle = 0.55, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let raf = 0;
    let last = "";
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh * settle)));
      const offset = (1 - p) ** 3 * distance;
      const next = offset === 0 ? "" : `translate3d(${offset.toFixed(3)}vw, 0, 0)`;
      if (next !== last) el.style.transform = last = next;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [distance, settle]);

  return (
    <div className={className}>
      <div ref={ref}>{children}</div>
    </div>
  );
}
