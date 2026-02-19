"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  const showDark = !isHome || scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showDark ? "bg-[#0a0a0a]/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="relative text-sm text-white/80 hover:text-white transition-colors group"
        >
          HUNTER&apos;S STUDIO
          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-200" />
        </Link>
        <span className="text-sm text-white/70 hidden sm:inline">
          100 Alamosa Way Unit 402
        </span>
        <div className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative text-sm text-white/80 hover:text-white transition-colors group"
            >
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-200" />
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
