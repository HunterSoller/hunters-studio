import Reveal from "./Reveal";

/** Deterministic pseudo-audio waveform; draws in when scrolled into view. */
function buildPath(width: number, height: number, points: number, seed: number) {
  const mid = height / 2;
  let d = `M0 ${mid}`;
  for (let i = 1; i <= points; i++) {
    const x = (i / points) * width;
    const t = i / points;
    const env = Math.sin(Math.PI * t) ** 0.6;
    const s =
      Math.sin(i * 0.9 + seed) * 0.55 +
      Math.sin(i * 0.31 + seed * 2.1) * 0.3 +
      Math.sin(i * 2.7 + seed * 0.7) * 0.15;
    const y = mid + s * env * (height * 0.46) * (i % 2 ? 1 : -1);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export default function Waveform({ className = "", seed = 1.3 }: { className?: string; seed?: number }) {
  const w = 1200;
  const h = 64;
  return (
    <Reveal variant="trigger" className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="wave-draw block h-12 w-full sm:h-16">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path
          d={buildPath(w, h, 220, seed)}
          pathLength={1}
          fill="none"
          stroke="url(#wf-grad)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id="wf-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.35" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="0.6" stopColor="rgba(255,138,61,0.8)" />
            <stop offset="1" stopColor="rgba(157,123,255,0)" />
          </linearGradient>
        </defs>
      </svg>
    </Reveal>
  );
}
