"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { InvestorProfile } from "@/types/investor/profile";
import {
  BOARD_PARTICIPATION_OPTIONS,
  EQUITY_TYPE_OPTIONS,
  FOLLOW_ON_OPTIONS,
  GEOGRAPHY_OPTIONS,
  PREFERRED_ROLE_OPTIONS,
  RETURN_MULTIPLE_OPTIONS,
  SECTOR_OPTIONS,
  STAGE_OPTIONS,
  labelFor,
  type Opt,
} from "./options";

function eur(n: number): string {
  if (!n) return "€0";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function Chips({ values, options }: { values: string[]; options: Opt[] }) {
  if (!values.length) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <Badge key={v} variant="secondary">
          {labelFor(options, v)}
        </Badge>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default function ThesisCompletionCard({ profile }: { profile: InvestorProfile }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card className="border-border rounded-2xl">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Investment thesis saved</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your thesis now powers thesis-aligned matching across Discovery.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Thesis summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <Row label="Check size">
              {eur(profile.minCheckSize)} – {eur(profile.maxCheckSize)}
            </Row>
            <Row label="Geographies">
              <Chips values={profile.preferredGeographies} options={GEOGRAPHY_OPTIONS} />
            </Row>
            <Row label="Stages">
              <Chips values={profile.preferredStages} options={STAGE_OPTIONS} />
            </Row>
            <Row label="Sectors">
              <Chips values={profile.preferredSectors} options={SECTOR_OPTIONS} />
            </Row>
            <Row label="Equity preferences">
              <Chips values={profile.preferredEquityTypes} options={EQUITY_TYPE_OPTIONS} />
            </Row>
            <Row label="Board participation">
              {labelFor(BOARD_PARTICIPATION_OPTIONS, profile.boardParticipationLevel)}
            </Row>
            <Row label="Rights">
              {profile.requiresProRataRights ? "Pro-rata required" : "No pro-rata requirement"}
              {" · "}
              {profile.requiresBoardSeat ? "Board seat required" : "No board-seat requirement"}
            </Row>
            <Row label="Target return">
              {labelFor(RETURN_MULTIPLE_OPTIONS, profile.targetReturnMultiple)}
            </Row>
            <Row label="Preferred role">
              {labelFor(PREFERRED_ROLE_OPTIONS, profile.preferredRole)}
            </Row>
            <Row label="Follow-on policy">
              {labelFor(FOLLOW_ON_OPTIONS, profile.followOnPolicy)}
            </Row>
            <Row label="Thesis statement">
              {profile.thesisStatement ? (
                <span className="whitespace-pre-wrap">{profile.thesisStatement}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Row>
          </dl>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <Button onClick={() => router.push("/dashboard/investor/discovery")}>
              Continue to Discovery
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
