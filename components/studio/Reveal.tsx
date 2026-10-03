"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cssVars } from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** "slide" wipes the whole block in from the left; "trigger" only toggles `.is-in` for children (labels, rules, waveforms). */
  variant?: "slide" | "trigger";
  delay?: number;
  id?: string;
};

export default function Reveal({ children, className, variant = "slide", delay = 0, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      data-reveal={variant}
      className={className}
      style={delay ? cssVars({ "--reveal-delay": `${delay}ms` }) : undefined}
    >
      {children}
    </div>
  );
}
