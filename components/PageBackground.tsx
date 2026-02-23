"use client";

import { useState } from "react";

export default function PageBackground() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      {!imageError ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(/images/studio.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <img
            src="/images/studio.jpg"
            alt=""
            className="hidden"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#111]" />
      )}
      {imageError && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-sm">
          Add /public/images/studio.jpg
        </div>
      )}
    </div>
  );
}
