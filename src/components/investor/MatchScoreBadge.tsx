import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  className?: string;
}

// Tier thresholds chosen to match the Figma "Excellent / Strong / Good"
// language for the same score ranges (>= 90 / >= 80 / else).
function tier(score: number): { label: string; tone: string } {
  if (score >= 90) {
    return {
      label: "Excellent Match",
      tone: "bg-primary/10 text-primary border-primary/30",
    };
  }
  if (score >= 80) {
    return {
      label: "Strong Match",
      tone:
        "bg-secondary text-secondary-foreground border-border",
    };
  }
  return {
    label: "Match",
    tone: "bg-muted text-muted-foreground border-border",
  };
}

export default function MatchScoreBadge({ score, className }: MatchScoreBadgeProps) {
  const { label, tone } = tier(score);
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone,
        className
      )}
      aria-label={`${label}: ${pct} percent`}
    >
      <span className="font-semibold">{pct}%</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}
