import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Studio | Buffalo, NY",
  description:
    "Professional recording studio in Buffalo, NY. $40/hour. Book your session.",
  openGraph: {
    title: "The Studio | Buffalo, NY",
    description: "Professional recording studio in Buffalo, NY. $40/hour.",
    url: "https://huntersstudio.com",
  },
  metadataBase: new URL("https://huntersstudio.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} font-sans min-h-screen`}>
        {children}
        <a
          href="https://www.instagram.com/hunter.soller"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-4 z-50 text-sm text-white/80 hover:text-white transition-colors"
        >
          DM on insta
        </a>
        <span
          aria-hidden
          className="fixed bottom-4 right-4 z-0 text-sm text-white/30 pointer-events-none"
        >
          Buffalo, NY
        </span>
      </body>
    </html>
  );
}
