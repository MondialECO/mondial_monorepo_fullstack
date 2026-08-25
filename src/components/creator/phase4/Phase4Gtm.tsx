"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { creatorJourneyApi, type WebPresenceItem, type ChannelMix, type GtmWeek, type GtmSetup, type MarketBenchmark } from "@/lib/api-creator-journey";

const WEB_ITEMS: { id: string; label: string }[] = [
  { id: "domain", label: "Domain Registration" },
  { id: "email-capture", label: "Email capture setup" },
  { id: "landing-page", label: "Landing Page" },
  { id: "social", label: "Social Media Accounts" },
  { id: "waitlist", label: "Email pre-launch waitlist" },
];

type ValueSource = "saved" | "benchmark" | "manual" | "unavailable";

function SourceBadge({ source, benchmark }: { source: ValueSource; benchmark?: MarketBenchmark | null }) {
  const label = source === "saved"
    ? "Saved value"
    : source === "manual"
      ? "Manual entry"
      : source === "unavailable"
        ? "Reference unavailable"
      : benchmark?.matchType === "sector"
        ? `Benchmark: ${benchmark.resolvedBenchmarkSector}`
        : benchmark?.displayLabel ?? "Benchmark";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
      source === "benchmark" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      {label}
    </span>
  );
}

export function Phase4Gtm({ ideaId, initial, benchmark, onSaved, onNext, onBack }: {
  ideaId: string | null;
  initial?: GtmSetup | null;
  benchmark?: MarketBenchmark | null;
  onSaved?: (gtm: GtmSetup) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Saved GTM values and benchmark defaults are both ready before mount. Audiences
  // remain verbatim when a saved block exists (a deliberate empty list stays empty).
  const [web, setWeb] = useState<WebPresenceItem[]>(() =>
    initial?.webPresence?.length ? initial.webPresence : WEB_ITEMS.map((w) => ({ ...w, done: false })),
  );
  const hasSavedChannels = Boolean(initial?.channelMix?.length);
  const hasSavedWeeks = Boolean(initial?.benchmarkGtmWeeks?.length);
  const [channels, setChannels] = useState<ChannelMix[]>(() =>
    hasSavedChannels
      ? initial!.channelMix
      : benchmark?.gtmDefaults.channelSplit.map((channel) => ({ ...channel })) ?? [],
  );
  const [audiences, setAudiences] = useState<string[]>(() =>
    initial ? initial.targetAudiences ?? [] : [],
  );
  const [audienceDraft, setAudienceDraft] = useState("");
  const [weeks, setWeeks] = useState<GtmWeek[] | null>(() =>
    hasSavedWeeks
      ? initial!.benchmarkGtmWeeks
      : benchmark?.gtmDefaults.benchmarkGtmWeeks.map((week) => ({ ...week, tasks: [...week.tasks] })) ?? null,
  );
  const [channelSource, setChannelSource] = useState<ValueSource>(hasSavedChannels ? "saved" : benchmark ? "benchmark" : "manual");
  const [weeksSource, setWeeksSource] = useState<ValueSource>(hasSavedWeeks ? "saved" : benchmark ? "benchmark" : "unavailable");
  const [gtmSaved, setGtmSaved] = useState(hasSavedWeeks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const doneCount = web.filter((w) => w.done).length;
  const channelSum = channels.reduce((s, c) => s + (c.percent || 0), 0);

  const editChannels = (update: (items: ChannelMix[]) => ChannelMix[]) => {
    setChannels((items) => update(items));
    setChannelSource("manual");
    setGtmSaved(false);
  };

  const save = async () => {
    setSaving(true); setError(null);
    if (channelSum !== 100) { setError(`Channel mix must sum to 100 (got ${channelSum}).`); setSaving(false); return; }
    if (audiences.length > 8) { setError("Up to 8 target audiences."); setSaving(false); return; }
    try {
      const res = await creatorJourneyApi.gtmSetup(
        { webPresence: web, targetAudiences: audiences, channelMix: channels },
        ideaId,
      );
      setWeeks(res.benchmarkGtmWeeks);
      setChannelSource("saved");
      setWeeksSource("saved");
      setGtmSaved(true);
      onSaved?.(res); // keep the host's saved snapshot current for Back-navigation
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : "Couldn't save GTM."));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Web presence */}
      <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Web presence</div>
          <span className="text-xs text-muted-foreground">{doneCount}/5</span>
        </div>
        {web.map((w, i) => (
          <div key={w.id} className="flex items-center justify-between">
            <button onClick={() => setWeb((x) => x.map((y, j) => j === i ? { ...y, done: !y.done } : y))} className="flex items-center gap-2 text-sm">
              <span className={`h-5 w-5 rounded-md border flex items-center justify-center ${w.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>{w.done && <Check className="h-3.5 w-3.5" />}</span>
              {w.label}
            </button>
            {w.id === "landing-page" && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  setProviderError(null);
                  try {
                    const matches = await creatorJourneyApi.spMatches("branding", ideaId);
                    if (!matches[0]) { setProviderError("No verified branding providers are available right now."); return; }
                    await creatorJourneyApi.openWorkroom(matches[0].spId, "Landing page design", ideaId);
                  } catch (caught) {
                    const message = (caught as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    setProviderError(message ?? (caught instanceof Error ? caught.message : "Couldn't open a workroom."));
                  }
                }}>Hire SP Designer</Button>
                <Button variant="ghost" size="sm" disabled title="Platform Builder coming soon">Use Platform Builder</Button>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Channel mix */}
      <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">Channel mix</div>
            <SourceBadge source={channelSource} benchmark={benchmark} />
          </div>
          <span className={`text-xs ${channelSum === 100 ? "text-primary" : "text-destructive"}`}>{channelSum}%</span>
        </div>
        {channels.length === 0 && <p className="text-xs text-muted-foreground">Add channels and make the percentages total 100%.</p>}
        {channels.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={c.channel} onChange={(e) => editChannels((x) => x.map((y, j) => j === i ? { ...y, channel: e.target.value } : y))} className="flex-1 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" placeholder="Channel" />
            <input type="number" value={c.percent} onChange={(e) => editChannels((x) => x.map((y, j) => j === i ? { ...y, percent: Number(e.target.value) } : y))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
            <span className="text-xs text-muted-foreground">%</span>
            <button type="button" onClick={() => editChannels((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${c.channel || "channel"}`}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => editChannels((x) => [...x, { channel: "", percent: 0 }])} className="inline-flex items-center gap-1 text-xs text-primary">
          <Plus className="h-3 w-3" /> Add channel
        </button>
      </Card>

      {/* Audiences */}
      <Card className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="text-sm font-semibold">Target audiences <span className="text-xs text-muted-foreground">({audiences.length}/8)</span></div>
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">{a}<button onClick={() => setAudiences((x) => x.filter((y) => y !== a))}><X className="h-3 w-3" /></button></span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={audienceDraft} onChange={(e) => setAudienceDraft(e.target.value)} placeholder="Add audience" className="flex-1 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
          <Button variant="outline" size="sm" onClick={() => { if (audienceDraft.trim() && audiences.length < 8) { setAudiences((x) => [...x, audienceDraft.trim()]); setAudienceDraft(""); } }}><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>

      {/* GTM weeks */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold">GTM weekly plan</div>
          <SourceBadge source={weeksSource} benchmark={benchmark} />
        </div>
        {weeks ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {weeks.map((w) => (
              <Card key={w.week} className={`rounded-2xl border p-3 ${w.completed ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="text-xs font-bold flex items-center gap-1">Week {w.week} {w.completed && <Check className="h-3.5 w-3.5 text-primary" />}</div>
                <div className="text-sm font-semibold">{w.title}</div>
                <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1">{w.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
            The weekly plan will be generated when you save your GTM setup.
          </Card>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {providerError && <p className="text-sm text-destructive">{providerError}</p>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save GTM</Button>
          <Button onClick={onNext} disabled={!gtmSaved} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
