import { cn } from "@/lib/utils";

export interface OwnershipSegment {
  label: string;
  /** Absolute weight (e.g. shares). Proportions are computed from the sum. */
  value: number;
}

interface OwnershipDonutProps {
  segments: OwnershipSegment[];
  /** Pixel size of the SVG square. Defaults to 168. */
  size?: number;
  /** Stroke width relative to size, defaults to 1/7 of size. */
  strokeWidth?: number;
  className?: string;
}

// Pure-SVG, theme-aware multi-segment donut. Every segment shares the
// `primary` token and is differentiated only by descending opacity (largest
// holder = most opaque) — so there are no hardcoded colours and no dependency
// on chart-N tokens. Mirrors the single-arc MatchScoreDonut pattern and is
// reusable for any ownership/equity breakdown.
export default function OwnershipDonut({
  segments,
  size = 168,
  strokeWidth,
  className,
}: OwnershipDonutProps) {
  const sw = strokeWidth ?? Math.round(size / 7);
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);

  const fracs = segments.map((seg) =>
    total > 0 ? Math.max(0, seg.value) / total : 0
  );
  const arcs = segments.map((seg, i) => {
    const frac = fracs[i];
    // Cumulative offset = sum of preceding fractions (no render-scope mutation).
    const offset = fracs.slice(0, i).reduce((s, f) => s + f, 0);
    return {
      label: seg.label,
      frac,
      dash: frac * c,
      offset: offset * c,
      opacity: Math.max(0.25, 1 - i * 0.16),
    };
  });

  const top = arcs.reduce(
    (m, a) => (a.frac > m.frac ? a : m),
    { frac: 0, label: "" } as { frac: number; label: string }
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6",
        className
      )}
    >
      <div
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Ownership distribution by stakeholder"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={sw}
            className="stroke-muted"
          />
          {arcs.map((a, i) => (
            <circle
              key={`${a.label}-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={sw}
              strokeLinecap="butt"
              strokeOpacity={a.opacity}
              strokeDasharray={`${a.dash} ${c - a.dash}`}
              strokeDashoffset={-a.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="stroke-primary transition-[stroke-dashoffset] duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {Math.round(top.frac * 100)}%
          </span>
          <span className="max-w-full truncate text-[11px] text-muted-foreground">
            {top.label}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {arcs.map((a, i) => (
          <li
            key={`${a.label}-legend-${i}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary"
                style={{ opacity: a.opacity }}
                aria-hidden
              />
              <span className="truncate text-foreground">{a.label}</span>
            </span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {(a.frac * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
