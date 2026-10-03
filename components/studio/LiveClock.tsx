"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Studio-local (Buffalo) time. Renders a placeholder on the server to avoid hydration mismatch. */
export default function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`tabular-nums ${className ?? ""}`} suppressHydrationWarning>
      {now ?? "--:--:--"}
    </span>
  );
}
