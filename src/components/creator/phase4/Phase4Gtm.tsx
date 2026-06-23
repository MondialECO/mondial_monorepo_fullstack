"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { creatorJourneyApi, type WebPresenceItem, type ChannelMix, type GtmWeek } from "@/lib/api-creator-journey";

const WEB_ITEMS: { id: string; label: string }[] = [
  { id: "domain", label: "Domain Registration" },
  { id: "email-capture", label: "Email capture setup" },
  { id: "landing-page", label: "Landing Page" },
  { id: "social", label: "Social Media Accounts" },
  { id: "waitlist", label: "Email pre-launch waitlist" },
];

export function Phase4Gtm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [web, setWeb] = useState<WebPresenceItem[]>(WEB_ITEMS.map((w) => ({ ...w, done: false })));
  const [channels, setChannels] = useState<ChannelMix[]>([
    { channel: "Content / SEO", percent: 40 }, { channel: "Paid ads", percent: 30 }, { channel: "Community", percent: 30 },
  ]);
  const [audiences, setAudiences] = useState<string[]>(["Early-stage founders"]);
  const [audienceDraft, setAudienceDraft] = useState("");
  const [weeks, setWeeks] = useState<GtmWeek[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doneCount = web.filter((w) => w.done).length;
  const channelSum = channels.reduce((s, c) => s + (c.percent || 0), 0);

  const save = async () => {
    setSaving(true); setError(null);
    if (channelSum !== 100) { setError(`Channel mix must sum to 100 (got ${channelSum}).`); setSaving(false); return; }
    if (audiences.length > 8) { setError("Up to 8 target audiences."); setSaving(false); return; }
    try {
      const res = await creatorJourneyApi.gtmSetup({ webPresence: web, targetAudiences: audiences, channelMix: channels });
      setWeeks(res.aiGtmWeeks);
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
                  try { const m = await creatorJourneyApi.spMatches("branding"); if (m[0]) await creatorJourneyApi.openWorkroom(m[0].spId, "Landing page design"); } catch { /* noop */ }
                }}>Hire SP Designer</Button>
                <Button variant="ghost" size="sm" disabled title="Platform Builder coming soon">Use Platform Builder</Button>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Channel mix */}
      <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold">Channel mix</div><span className={`text-xs ${channelSum === 100 ? "text-primary" : "text-destructive"}`}>{channelSum}%</span></div>
        {channels.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={c.channel} onChange={(e) => setChannels((x) => x.map((y, j) => j === i ? { ...y, channel: e.target.value } : y))} className="flex-1 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
            <input type="number" value={c.percent} onChange={(e) => setChannels((x) => x.map((y, j) => j === i ? { ...y, percent: Number(e.target.value) } : y))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ))}
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
      {weeks && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {weeks.map((w) => (
            <Card key={w.week} className={`rounded-2xl border p-3 ${w.completed ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="text-xs font-bold flex items-center gap-1">Week {w.week} {w.completed && <Check className="h-3.5 w-3.5 text-primary" />}</div>
              <div className="text-sm font-semibold">{w.title}</div>
              <ul className="text-[11px] text-muted-foreground list-disc pl-4 mt-1">{w.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
            </Card>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save GTM</Button>
          <Button onClick={onNext} disabled={!weeks} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
