import type { CSSProperties } from "react";

export type PointerState = { x: number; y: number; active: boolean };

const pointer: PointerState = { x: 0, y: 0, active: false };
let bound = false;

/** Shared, normalized (-1..1) mouse position. Touch input is ignored on purpose. */
export function trackPointer(): PointerState {
  if (typeof window === "undefined" || bound) return pointer;
  bound = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true }
  );
  document.documentElement.addEventListener("mouseleave", () => {
    pointer.active = false;
  });
  return pointer;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

const NAV_OFFSET = 72;

/** Eased scroll to an element id. Interruptible by wheel/touch/keys; instant under reduced motion. */
export function smoothScrollTo(id: string) {
  const el = document.getElementById(id) ?? (id === "top" ? document.body : null);
  if (!el) return false;

  // Land on the section's label (its first words), not the padded section edge.
  const anchor = el.querySelector<HTMLElement>("[data-scroll-anchor]") ?? el;
  const gap = anchor === el ? 0 : 28;
  // Re-measured every frame so content resizing above the target (e.g. availability loading) can't throw it off.
  const target = () =>
    id === "top" ? 0 : Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - NAV_OFFSET - gap);

  animateScrollTo(target, { minMs: 700, maxMs: 1600 }, () => {
    if (el.tabIndex >= 0 || el.hasAttribute("tabindex")) el.focus({ preventScroll: true });
  });
  return true;
}

/**
 * Brings a booking step into view after a selection, unless it is already near the top of the viewport.
 * Short delay lets the user see their selection register before the page moves.
 */
export function revealStep(el: HTMLElement | null, offset = NAV_OFFSET + 16) {
  if (!el) return () => {};
  const id = window.setTimeout(() => {
    const top = el.getBoundingClientRect().top;
    if (top >= offset - 4 && top <= window.innerHeight * 0.35) return;
    animateScrollTo(Math.max(0, top + window.scrollY - offset), { minMs: 450, maxMs: 900 });
  }, 160);
  return () => window.clearTimeout(id);
}

function animateScrollTo(
  target: number | (() => number),
  range: { minMs: number; maxMs: number },
  onDone?: () => void
) {
  const getTarget = typeof target === "function" ? target : () => target;
  const root = document.documentElement;

  if (prefersReducedMotion()) {
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, getTarget());
    root.style.scrollBehavior = prev;
    onDone?.();
    return;
  }

  const prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const start = window.scrollY;
  const duration = Math.min(range.maxMs, Math.max(range.minMs, 400 + Math.abs(getTarget() - start) * 0.45));
  const t0 = performance.now();
  let cancelled = false;

  const cancel = () => {
    cancelled = true;
  };
  const cleanup = () => {
    root.style.scrollBehavior = prevBehavior;
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  };
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", cancel);

  const ease = (p: number) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2);

  const step = (now: number) => {
    if (cancelled) return cleanup();
    const p = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + (getTarget() - start) * ease(p));
    if (p < 1) requestAnimationFrame(step);
    else {
      cleanup();
      onDone?.();
    }
  };
  requestAnimationFrame(step);
}
