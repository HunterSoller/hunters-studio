import ScrollDrift from "@/components/studio/ScrollDrift";
import ScrollLink from "@/components/studio/ScrollLink";
import { NAV, SITE } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/[0.07] bg-ink/90 backdrop-blur-sm">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-10 py-14 font-mono text-[11px] uppercase tracking-[0.16em] lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-white/35">Studio</p>
          <p className="text-white/80">{SITE.shortName}</p>
          <p className="text-white/55">{SITE.city}</p>
        </div>
        <div className="space-y-2">
          <p className="text-white/35">Address</p>
          <p className="text-white/80">{SITE.address}</p>
        </div>
        <nav aria-label="Footer" className="space-y-2">
          <p className="text-white/35">Index</p>
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 text-white/70 transition-colors hover:text-white"
              >
                <span className="text-white/30 group-hover:text-signal">{item.index}</span>
                <span className="link-u">{item.label}</span> ↗
              </a>
            ) : (
              <ScrollLink
                key={item.index}
                href={item.href}
                className="group flex gap-3 text-white/70 transition-colors hover:text-white"
              >
                <span className="text-white/30 group-hover:text-signal">{item.index}</span>
                <span className="link-u">{item.label}</span>
              </ScrollLink>
            )
          )}
        </nav>
        <div className="space-y-2">
          <p className="text-white/35">Contact</p>
          <a href={SITE.phoneHref} className="link-u block w-fit text-white/80 hover:text-white">
            {SITE.phoneDisplay}
          </a>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-u block w-fit text-white/80 hover:text-white"
          >
            {SITE.instagramHandle}
          </a>
          <a href={SITE.url} className="link-u block w-fit normal-case tracking-[0.08em] text-white/55 hover:text-white/80">
            {SITE.domain}
          </a>
        </div>
      </div>

      <div aria-hidden className="shell select-none">
        <ScrollDrift distance={12} settle={0.12}>
          <p className="display text-outline whitespace-nowrap text-[min(7.5vw,8.1rem)] font-[800] uppercase leading-[0.85] py-[0.06em]">
            Hunter’s Studio
          </p>
        </ScrollDrift>
      </div>

      <div className="shell flex flex-col gap-3 border-t border-white/[0.07] py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {year} {SITE.name}
        </span>
        <span className="hidden md:inline">Recording / Production / Mixing</span>
        <ScrollLink href="#top" className="group w-fit text-white/55 transition-colors hover:text-white">
          Back to top{" "}
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5">
            ↑
          </span>
        </ScrollLink>
      </div>
    </footer>
  );
}
