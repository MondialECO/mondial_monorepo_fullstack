"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Star, MapPin, CheckCircle2, MessageSquare, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi, type Designer as ApiDesigner } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";
import { withIdeaContext } from "@/lib/creator-routes";
import { useTranslation } from "@/hooks/useTranslation";

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

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const mapDesigner = (d: ApiDesigner): Designer => ({
  id: d.spId,
  name: d.name,
  role: d.title,
  initials: initialsOf(d.name),
  tier: d.tier,
  rating: d.rating,
  projects: d.projectCount,
  location: d.location,
  tags: d.sectors || [],
  priceRange: d.estimatedPriceRange,
  delivery: d.estimatedDays,
});

export default function HireDesignerPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { state, setState } = useCreatorProgress();
  const effectiveIdeaId = searchParams.get("ideaId") || state.activeIdeaId;

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookedDesigner, setBookedDesigner] = useState<Designer | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  // Fetch the AI-matched, verified M50 branding designers.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    creatorJourneyApi
      .m50Designers()
      .then((list) => {
        if (cancelled) return;
        setDesigners(list.map(mapDesigner));
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(toAiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBook = async (designer: Designer) => {
    if (bookingId) return;
    setBookError(null);
    setBookingId(designer.id);
    try {
      // Opens a Messenger workroom + auto-sends the brief; marks branding designer-pending.
      await creatorJourneyApi.bookDesigner(designer.id);
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
            brandingMethod: "m50_designer",
          },
          exists: true,
        },
      }));
    } catch (err) {
      setBookError(toAiError(err).message);
    } finally {
      setBookingId(null);
    }
  };

  const handleContinue = () => {
    router.push(withIdeaContext("/dashboard/creator/phase-2/complete", effectiveIdeaId));
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push(withIdeaContext("/dashboard/creator/phase-2/branding", effectiveIdeaId))}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("creator.phase2.hireDesigner.backToOptions")}
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          {t("creator.phase2.hireDesigner.phaseBadge")}
        </div>
      </header>

      {/* Progress Bar (86% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "86%" }} />
      </div>

      <section aria-label="Matched Designers" className="flex-1 max-w-[1140px] mx-auto w-full py-6 space-y-8">

        {/* Title Block */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">{t("creator.phase2.hireDesigner.serviceCategory")}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("creator.phase2.hireDesigner.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("creator.phase2.hireDesigner.subtitle")}
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
                {t("creator.phase2.hireDesigner.workroomOpened")}
              </h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-300">
              {t("creator.phase2.hireDesigner.channelCreated", { name: bookedDesigner.name })}
            </p>
            <div className="bg-card border border-border rounded-xl p-4 text-xs space-y-1">
              <span className="text-badge font-bold text-muted-foreground uppercase tracking-wider block">{t("creator.phase2.hireDesigner.autoSentLabel")}</span>
              <p className="text-foreground font-medium italic">
                &quot;{t("creator.phase2.hireDesigner.autoSentMessage", { name: bookedDesigner.name, project: state.project.name || t("creator.phase2.hireDesigner.defaultProject", "my project") })}&quot;
              </p>
            </div>
            <Button onClick={handleContinue} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-5">
              {t("creator.phase2.hireDesigner.continueReview")}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Directory List */}
        {!bookedDesigner && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-body text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("creator.phase2.hireDesigner.findingDesigners")}
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-body text-destructive">
                {loadError}
              </div>
            ) : designers.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
                <p className="text-body text-muted-foreground">
                  {t("creator.phase2.hireDesigner.noDesignersMatched")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/creator/phase-2/branding")}
                  className="rounded-xl text-button font-bold"
                >
                  {t("creator.phase2.hireDesigner.backToBranding")}
                </Button>
              </div>
            ) : (
              <>
                {bookError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-body text-destructive">
                    {bookError}
                  </div>
                )}
                {designers.map((designer) => (
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
                            <span className="text-badge text-muted-foreground font-medium block mt-0.5">{designer.role}</span>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-0 text-badge font-bold py-0.5 px-2.5 shrink-0">
                            {t("creator.phase2.hireDesigner.tierBadge", { tier: designer.tier })}
                          </Badge>
                        </div>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground font-semibold">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-500" /> {designer.rating}
                          </span>
                          <span>·</span>
                          <span>{t("creator.phase2.hireDesigner.projectsCompleted", { count: designer.projects })}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {designer.location}
                          </span>
                        </div>

                        {/* Tags row */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(designer.tags.length > 0 ? designer.tags : [t("creator.phase2.hireDesigner.allSectors")]).map((tag) => (
                            <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-badge font-bold uppercase tracking-wider text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Bottom CTA Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                            {t("creator.phase2.hireDesigner.priceDelivery", { price: designer.priceRange, delivery: designer.delivery })}
                          </span>
                          <Button
                            onClick={() => handleBook(designer)}
                            disabled={!!bookingId}
                            size="sm"
                            className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
                          >
                            {bookingId === designer.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("creator.phase2.hireDesigner.openingWorkroom")}
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3.5 h-3.5" /> {t("creator.phase2.hireDesigner.bookWorkroom")}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

      </section>
    </div>
  );
}
