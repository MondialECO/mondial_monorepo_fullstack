"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles, Star, MapPin, CheckCircle2, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

interface Designer {
  id: string;
  name: string;
  role: string;
  initials: string;
  tier: number;
  rating: number;
  projects: number;
  location: string;
  tags: string[];
  priceRange: string;
  delivery: string;
}

const DESIGNERS: Designer[] = [
  {
    id: "designer-1",
    name: "Ahmed Karim",
    role: "Brand Designer · UI/UX Specialist",
    initials: "AK",
    tier: 3,
    rating: 4.9,
    projects: 47,
    location: "Paris, FR",
    tags: ["FinTech", "SaaS", "Startup Branding"],
    priceRange: "€280–380",
    delivery: "4 days",
  },
  {
    id: "designer-2",
    name: "Marie Laurent",
    role: "Brand & Visual Strategist",
    initials: "ML",
    tier: 2,
    rating: 4.7,
    projects: 31,
    location: "Lyon, FR",
    tags: ["Creator Economy", "Brand Strategy"],
    priceRange: "€220–320",
    delivery: "5 days",
  },
  {
    id: "designer-3",
    name: "Sara Roux",
    role: "Identity Designer",
    initials: "SR",
    tier: 2,
    rating: 4.8,
    projects: 58,
    location: "Remote",
    tags: ["All sectors", "Fast turnaround"],
    priceRange: "€200–280",
    delivery: "3 days",
  },
];

export default function HireDesignerPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();
  const [bookedDesigner, setBookedDesigner] = useState<Designer | null>(null);

  const handleBook = (designer: Designer) => {
    setBookedDesigner(designer);
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        branding: {
          logoType: "designer",
          logoAsset: null, // Indicates designer engaged
          colorPalette: [],
          paletteName: "Designer engaged — awaiting delivery",
          typographyPairing: "Awaiting Designer Delivery",
        },
        exists: true,
      },
    }));
  };

  const handleContinue = () => {
    router.push("/dashboard/creator/phase-2/complete");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/branding")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Verified Designers
        </div>
      </header>

      {/* Progress Bar (86% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "86%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Title Block */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">M50 Service Provider · Branding</div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Matched Designers for Your Project
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-matched verified M50 designers specialized in branding for your venture sector. Work directly inside the platform.
          </p>
        </div>

        {/* Success Workroom Banner */}
        {bookedDesigner && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-green-700 dark:text-green-400 text-lg">
                Service Workroom opened!
              </h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-300">
              A private channel with <span className="font-extrabold">{bookedDesigner.name}</span> has been created in your Messenger.
            </p>
            <div className="bg-card border border-border rounded-xl p-4 text-xs space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Auto-sent to designer</span>
              <p className="text-foreground font-medium italic">
                "Hi {bookedDesigner.name}, I would like to book you for the branding design of my concept: {state.project.name || "AutoInvoice"}. Let's discuss requirements."
              </p>
            </div>
            <Button onClick={handleContinue} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-5">
              Continue — I'll review designs when ready
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Directory List */}
        {!bookedDesigner && (
          <div className="space-y-4">
            {DESIGNERS.map((designer) => (
              <Card key={designer.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all duration-200 shadow-xs">
                <CardContent className="p-0 flex flex-col sm:flex-row gap-5">
                  {/* Left Avatar */}
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-base shrink-0 select-none">
                    {designer.initials}
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-foreground leading-tight">{designer.name}</h4>
                        <span className="text-xs text-muted-foreground font-medium block mt-0.5">{designer.role}</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-0 text-[10px] font-bold py-0.5 px-2.5 shrink-0">
                        Tier {designer.tier} ✓
                      </Badge>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-500" /> {designer.rating}
                      </span>
                      <span>·</span>
                      <span>{designer.projects} projects completed</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {designer.location}
                      </span>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {designer.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                        {designer.priceRange} est. · {designer.delivery} delivery
                      </span>
                      <Button onClick={() => handleBook(designer)} size="sm" className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Book · Open Workroom
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
