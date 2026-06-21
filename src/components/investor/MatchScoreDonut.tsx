import { cn } from "@/lib/utils";

interface MatchScoreDonutProps {
  score: number;
  /** Pixel size of the SVG square. Defaults to 96. */
  size?: number;
  /** Stroke width relative to size, defaults to 1/9 of size. */
  strokeWidth?: number;
  className?: string;
  /** Hide the inline numeric label centre (e.g. when consumer renders its own). */
  hideLabel?: boolean;
}

// Pure-SVG donut. Theme-aware via `text-primary` (filled arc) and
// `text-muted` (track). No chart library, no client-side state.
export default function MatchScoreDonut({
  score,
  size = 96,
  strokeWidth,
  className,
  hideLabel = false,
}: MatchScoreDonutProps) {
  const sw = strokeWidth ?? Math.round(size / 9);
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${pct} percent`}
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      {!hideLabel ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-foreground text-lg font-bold tabular-nums">{pct}%</span>
        </div>
      ) : null}
    </div>
  );
}
