import { SITE } from "@/lib/site";

export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
    </svg>
  );
}

/** Persistent bottom-left Instagram shortcut. */
export function InstagramFloating() {
  return (
    <a
      href={SITE.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="DM on Instagram"
      className="group fixed bottom-4 left-4 z-[60] flex h-10 items-center gap-0 overflow-hidden border border-white/15 bg-ink/70 pl-2.5 pr-2.5 text-white/80 backdrop-blur-md transition-[gap,padding,border-color,color] duration-500 ease-out-expo hover:gap-2.5 hover:border-signal/70 hover:pr-3.5 hover:text-white sm:bottom-5 sm:left-5"
    >
      <InstagramGlyph className="h-[18px] w-[18px] shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] transition-[max-width] duration-500 ease-out-expo group-hover:max-w-[10rem]">
        DM {SITE.instagramHandle}
      </span>
    </a>
  );
}
