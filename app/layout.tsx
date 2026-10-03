import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import PageBackground from "@/components/PageBackground";
import StudioNavigation from "@/components/studio/StudioNavigation";
import { InstagramFloating } from "@/components/studio/InstagramLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
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

export const viewport: Viewport = {
  themeColor: "#060608",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Every full load / reload starts on the landing hero, not a restored position or #section. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);var t=function(){window.scrollTo({top:0,left:0,behavior:"instant"})},u=0,m=function(){u=1};t();["wheel","touchstart","keydown","pointerdown"].forEach(function(e){addEventListener(e,m,{once:true,passive:true})});addEventListener("load",function(){setTimeout(function(){if(!u)t()},0)})}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${instrumentSerif.variable} font-sans min-h-screen`}
      >
        <noscript>
          <style>{`[data-reveal="slide"]>*,.slide-x,.rule-draw{opacity:1!important;transform:none!important}[data-reveal="slide"]>*,.wipe-line{clip-path:none!important}`}</style>
        </noscript>
        <PageBackground />
        <StudioNavigation />
        {children}
        <InstagramFloating />
      </body>
    </html>
  );
}
