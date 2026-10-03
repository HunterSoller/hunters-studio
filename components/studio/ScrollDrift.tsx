"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Total horizontal travel in vw across the element's pass through the viewport. Negative drifts right. */
  distance?: number;
  className?: string;
};

/** Slides its content sideways as it scrolls through the viewport. */
export default function ScrollDrift({ children, distance = 8, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      el.style.transform = `translate3d(${((0.5 - p) * distance).toFixed(3)}vw, 0, 0)`;
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
  }, [distance]);

  return (
    <div className={className}>
      <div ref={ref} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
