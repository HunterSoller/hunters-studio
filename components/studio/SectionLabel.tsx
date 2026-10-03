import Reveal from "./Reveal";
import { cssVars } from "@/lib/motion";

type Props = {
  index: string;
  label: string;
  meta?: string;
  className?: string;
};

export default function SectionLabel({ index, label, meta, className = "" }: Props) {
  return (
    <Reveal variant="trigger" className={className}>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
        <span className="slide-x text-signal">{index}</span>
        <span className="slide-x text-white/25" style={cssVars({ "--slide-delay": "60ms" })}>
          /
        </span>
        <span className="slide-x text-white/85" style={cssVars({ "--slide-delay": "120ms" })}>
          {label}
        </span>
        <span aria-hidden className="rule-draw h-px flex-1 bg-gradient-to-r from-white/25 via-white/10 to-transparent" />
        {meta && (
          <span className="slide-x hidden text-white/40 sm:inline" style={cssVars({ "--slide-delay": "300ms" })}>
            {meta}
          </span>
        )}
      </div>
    </Reveal>
  );
}
