export const SITE = {
  name: "Hunter’s Studio",
  shortName: "The Studio",
  city: "Buffalo, NY",
  address: "2213 Sweet Home Road",
  instagramUrl: "https://www.instagram.com/hunter.soller",
  instagramHandle: "@hunter.soller",
  phoneDisplay: "(518) 867-9959",
  phoneHref: "tel:+15188679959",
  domain: "huntersstudio.com",
  url: "https://huntersstudio.com",
} as const;

/** Display-only mirror of PRICE_PER_HOUR / MIN_HOURS / MAX_HOURS in components/Booking.tsx — keep in sync. */
export const RATE = {
  perHour: 40,
  minHours: 1,
  maxHours: 6,
} as const;

export const INCLUDED = [
  "Professional microphone & treated recording space",
  "Mixing included",
  "High-quality WAV export",
  "Flexible session scheduling",
] as const;

export type NavItem = {
  index: string;
  label: string;
  short: string;
  href: string;
  external?: boolean;
};

export const NAV: NavItem[] = [
  { index: "01", label: "Book", short: "Book", href: "/#book" },
  { index: "02", label: "About", short: "About", href: "/#about" },
  { index: "03", label: "Pricing", short: "Pricing", href: "/#pricing" },
  { index: "04", label: "Instagram", short: "IG", href: SITE.instagramUrl, external: true },
];
