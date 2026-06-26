"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, MessageSquare, Loader2, Rocket, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { creatorJourneyApi, type SmartMatch } from "@/lib/api-creator-journey";
import { useCreateConversation } from "@/hooks/queries/chat";
import { LevelUpCelebration } from "@/components/creator/phase6/LevelUpCelebration";

function MatchCard({ m, featured }: { m: SmartMatch; featured?: boolean }) {
  const router = useRouter();
  const createConversation = useCreateConversation();
  const [error, setError] = useState<string | null>(null);
  // Demo/admin catalog investors have no chat-addressable user (LinkedUserId null).
  const reachable = !!m.linkedUserId;

  const startConversation = async () => {
    if (!reachable || createConversation.isPending) return;
    setError(null);
    try {
      // Real chat path (same as MessageFounderButton): open/get the thread with the
      // investor's linked user, then land in the live /messages workspace.
      const convo = await createConversation.mutateAsync({ targetUserId: m.linkedUserId! });
      router.push(`/dashboard/creator/messages?c=${convo.id}`);
    } catch {
      setError("Couldn't open the conversation. Please try again.");
    }
  };

  const startButton = (
    <Button variant="outline" size="sm" onClick={startConversation} disabled={!reachable || createConversation.isPending} className="gap-1.5">
      {createConversation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />} Start Conversation
    </Button>
  );

  return (
    <Card className={`rounded-2xl border bg-card p-5 ${featured ? "border-primary" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{m.name}</h3>
            {featured && <Badge className="bg-primary text-primary-foreground gap-1"><Star className="h-3 w-3" /> Featured</Badge>}
            <Badge variant="outline" className="capitalize">{m.type?.replace(/_/g, " ")}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Match {m.finalScore}%</div>
        </div>
        {reachable ? startButton : (
          // Honest "not reachable yet" — never a fake thread or silent no-op.
          <Tooltip>
            <TooltipTrigger asChild><span tabIndex={0} className="inline-flex">{startButton}</span></TooltipTrigger>
            <TooltipContent className="max-w-[220px]">This investor isn&apos;t reachable for messaging yet.</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {([["Sector", m.breakdown.sectorMatch], ["Stage", m.breakdown.stageMatch], ["Geo", m.breakdown.geographyMatch], ["Ticket", m.breakdown.ticketMatch]] as const).map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border p-2 text-center"><div className="text-[10px] text-muted-foreground">{l}</div><div className="text-sm font-bold">{v}</div></div>
        ))}
      </div>
      {!reachable && <p className="text-xs text-muted-foreground mt-2">Not reachable for messaging yet.</p>}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </Card>
  );
}

export default function InvestorsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ featured: SmartMatch | null; qualified: SmartMatch[]; matchingTip: string; isEmpty: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leveling, setLeveling] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    creatorJourneyApi.getInvestors().then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load matches."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (leveling) return <LevelUpCelebration onDone={(redirect) => router.push(redirect)} onCancel={() => setLeveling(false)} />;

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-sm font-bold">Phase 6 — Smart Matchmaking</h1>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Investor matching
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-6 space-y-5">
        {data?.matchingTip && !loading && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground"><Info className="h-4 w-4 text-primary" /> {data.matchingTip}</div>
        )}

        {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Finding your investor matches…</div>}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-12"><p className="text-destructive text-sm">{error}</p><Button variant="outline" size="sm" onClick={load}>Retry</Button></div>
        )}

        {!loading && !error && data?.isEmpty && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No matches yet — check back as investors join the network.</p>
          </div>
        )}

        {!loading && !error && data && !data.isEmpty && (
          <div className="space-y-4">
            {data.featured && <MatchCard m={data.featured} featured />}
            {data.qualified.map((m) => <MatchCard key={m.candidateId} m={m} />)}
          </div>
        )}

        {/* Level Up CTA */}
        <Card className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between">
          <div>
            <div className="font-bold flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Ready to go all in?</div>
            <p className="text-sm text-muted-foreground">Level up to Entrepreneur to unlock the full deal room and equity tools.</p>
          </div>
          <Button onClick={() => setLeveling(true)} className="gap-2"><Rocket className="h-4 w-4" /> Level Up</Button>
        </Card>
      </main>
    </div>
  );
}
