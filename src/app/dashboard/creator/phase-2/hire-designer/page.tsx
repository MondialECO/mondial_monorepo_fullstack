"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, MapPin, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creatorJourneyApi, type Designer } from "@/lib/api-creator-journey";

export default function HireDesignerPage() {
  const router = useRouter();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedWorkroom, setBookedWorkroom] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    creatorJourneyApi.m50Designers()
      .then(setDesigners)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load designers."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleBook = async (spId: string) => {
    setBookingId(spId);
    try {
      const { workroomId } = await creatorJourneyApi.bookDesigner(spId);
      setBookedWorkroom(workroomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open the workroom.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/branding")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> M50 Designers
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-6 space-y-4">
        {bookedWorkroom && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-5 w-5" /> Workroom opened — your brief was sent.
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/creator/messages")}>Open Messenger</Button>
              <Button size="sm" onClick={() => router.push("/dashboard/creator/phase-2/complete")}>Continue</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Finding the best designers…</div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {!loading && !error && designers.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No verified designers available right now.</p>
        )}

        {!loading && !error && designers.map((d) => (
          <Card key={d.spId} className={`rounded-2xl border bg-card p-5 ${d.isBestMatch ? "border-primary" : "border-border"}`}>
            <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{d.name}</h3>
                  {d.isBestMatch && <Badge className="bg-primary text-primary-foreground">Best Match</Badge>}
                  <Badge variant="outline">Tier {d.tier}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{d.title}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-warning" /> {d.rating.toFixed(1)}</span>
                  <span>{d.projectCount} projects</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.location}</span>
                  <span>{d.estimatedPriceRange} · {d.estimatedDays}</span>
                </div>
              </div>
              <Button onClick={() => handleBook(d.spId)} disabled={bookingId === d.spId} className="shrink-0">
                {bookingId === d.spId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book · Open Workroom"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
