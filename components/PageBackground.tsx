"use client";

import { useState } from "react";
import Image from "next/image";

export default function PageBackground() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden>
      {!imageError ? (
        <div className="absolute inset-0">
          <Image
            src="/images/studio.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-80"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#111]" />
      )}

      {/* Grade: deepen the room, keep the amber/violet light */}
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_0%,rgba(6,6,8,0.55)_55%,rgba(6,6,8,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,8,0.55)_0%,transparent_30%,transparent_70%,rgba(6,6,8,0.7)_100%)]" />

      {/* Structural grid */}
      <div className="shell absolute inset-y-0 left-1/2 grid -translate-x-1/2 grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`border-l border-white/[0.035] ${i === 3 ? "border-r" : ""} ${i >= 2 ? "hidden md:block" : ""} ${i === 1 ? "border-r md:border-r-0" : ""}`}
          />
        ))}
      </div>

      <div className="grain" />

      {imageError && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-sm">
          Add /public/images/studio.jpg
        </div>
      )}
    </div>
  );
}
