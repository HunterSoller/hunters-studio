"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_+=#";

/** Mono label that briefly decodes from random glyphs when its parent link/button is hovered or focused. */
export default function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = (el.closest("a,button") as HTMLElement | null) ?? el;
    const node = el.firstChild;
    if (!node) return;
    let raf = 0;

    const run = () => {
      if (prefersReducedMotion()) return;
      cancelAnimationFrame(raf);
      const start = performance.now();
      const duration = 160 + text.length * 32;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const settled = Math.floor(p * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          out += i < settled || ch === " " || ch === "/" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        node.nodeValue = out;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    host.addEventListener("mouseenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("mouseenter", run);
      host.removeEventListener("focus", run);
      node.nodeValue = text;
    };
  }, [text]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden>
        {text}
      </span>
    </span>
  );
}
