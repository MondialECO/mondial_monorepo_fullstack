interface FeedHeaderProps {
  totalMatches: number;
  newMatchesToday: number;
}

function pluralise(n: number, singular: string, plural?: string) {
  return n === 1 ? singular : plural ?? `${singular}s`;
}

export default function FeedHeader({ totalMatches, newMatchesToday }: FeedHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px]">
            Deal Discovery
          </h1>
          <p className="text-sm text-muted-foreground">
            Thesis-aligned opportunities ranked by your match score.
          </p>
        </div>
        {newMatchesToday > 0 ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {newMatchesToday} new {pluralise(newMatchesToday, "match", "matches")} today
          </span>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {totalMatches} {pluralise(totalMatches, "deal", "deals")} matched to your thesis
      </p>
    </div>
  );
}
