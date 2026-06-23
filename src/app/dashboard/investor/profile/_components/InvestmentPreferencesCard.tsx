import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import { Target } from "lucide-react";
import {
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
  GEOGRAPHY_OPTIONS,
  EQUITY_TYPE_OPTIONS,
  RETURN_MULTIPLE_OPTIONS,
  FOLLOW_ON_OPTIONS,
  PREFERRED_ROLE_OPTIONS,
  BOARD_PARTICIPATION_OPTIONS,
  labelFor,
  type Opt,
} from "@/app/dashboard/investor/thesis/_components/options";
import type { InvestorProfile } from "@/types/investor/profile";

function ChipRow({ label, values, opts }: { label: string; values: string[]; opts: Opt[] }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary">
            {labelFor(opts, v)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function fmtUsd(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function InvestmentPreferencesCard({ profile }: { profile: InvestorProfile }) {
  const hasCheckRange = profile.minCheckSize > 0 || profile.maxCheckSize > 0;
  const hasAny =
    profile.preferredSectors.length > 0 ||
    profile.preferredStages.length > 0 ||
    profile.preferredGeographies.length > 0 ||
    profile.preferredEquityTypes.length > 0 ||
    hasCheckRange ||
    !!profile.thesisStatement ||
    !!profile.targetReturnMultiple ||
    !!profile.followOnPolicy ||
    !!profile.preferredRole ||
    !!profile.boardParticipationLevel;

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle>Investment Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasAny ? (
          <EmptyState
            icon={Target}
            title="No thesis set yet"
            message="Set your sectors, stages, and check size in Investment Thesis to show them here."
          />
        ) : (
          <>
            {profile.thesisStatement ? (
              <p className="text-sm leading-relaxed text-foreground">
                {profile.thesisStatement}
              </p>
            ) : null}

            <ChipRow label="Sectors" values={profile.preferredSectors} opts={SECTOR_OPTIONS} />
            <ChipRow label="Stages" values={profile.preferredStages} opts={STAGE_OPTIONS} />
            <ChipRow
              label="Geographies"
              values={profile.preferredGeographies}
              opts={GEOGRAPHY_OPTIONS}
            />
            <ChipRow
              label="Equity types"
              values={profile.preferredEquityTypes}
              opts={EQUITY_TYPE_OPTIONS}
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {hasCheckRange ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Check size
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {fmtUsd(profile.minCheckSize)} – {fmtUsd(profile.maxCheckSize)}
                  </div>
                </div>
              ) : null}
              {profile.targetReturnMultiple ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Target return
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {labelFor(RETURN_MULTIPLE_OPTIONS, profile.targetReturnMultiple)}
                  </div>
                </div>
              ) : null}
              {profile.followOnPolicy ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Follow-on
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {labelFor(FOLLOW_ON_OPTIONS, profile.followOnPolicy)}
                  </div>
                </div>
              ) : null}
              {profile.preferredRole ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Preferred role
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {labelFor(PREFERRED_ROLE_OPTIONS, profile.preferredRole)}
                  </div>
                </div>
              ) : null}
              {profile.boardParticipationLevel ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Board involvement
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {labelFor(BOARD_PARTICIPATION_OPTIONS, profile.boardParticipationLevel)}
                  </div>
                </div>
              ) : null}
            </div>

            {(profile.requiresProRataRights || profile.requiresBoardSeat) && (
              <div className="flex flex-wrap gap-1.5">
                {profile.requiresProRataRights ? (
                  <Badge variant="outline">Requires pro-rata rights</Badge>
                ) : null}
                {profile.requiresBoardSeat ? (
                  <Badge variant="outline">Requires board seat</Badge>
                ) : null}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
