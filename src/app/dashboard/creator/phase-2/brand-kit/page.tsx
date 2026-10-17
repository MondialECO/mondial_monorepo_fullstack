"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandKit } from "@/types/creator/brand-kit";
import { apiCreatorBrandKit } from "@/lib/api-creator-brand-kit";
import { BrandKitHubView } from "@/components/creator/brand-kit/BrandKitHubView";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

function BrandKitHubContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId") || undefined;

  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBrandKit() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiCreatorBrandKit.getBrandKit(ideaId);
        if (isMounted) {
          setKit(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || t("creator.phase2.brandKit.loadError", "Failed to load Brand Kit."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBrandKit();

    return () => {
      isMounted = false;
    };
  }, [ideaId]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#EFEFF1] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-mono text-muted-foreground">
          {t("creator.phase2.brandKit.loadingHub")}
        </p>
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#EFEFF1] p-6 text-center">
        <div className="p-8 rounded-2xl border border-border bg-card max-w-md space-y-4 shadow-sm">
          <Sparkles className="size-8 text-primary mx-auto" />
          <h2 className="text-lg font-bold text-foreground">
            {t("creator.phase2.brandKit.notInitializedTitle")}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || t("creator.phase2.brandKit.notInitializedDesc")}
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/creator/phase-2/brand-studio")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span>{t("creator.phase2.brandKit.openStudio")}</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return <BrandKitHubView ideaId={ideaId} initialKit={kit} />;
}

export default function BrandKitHubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#EFEFF1]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <BrandKitHubContent />
    </Suspense>
  );
}
