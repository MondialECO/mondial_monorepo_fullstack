"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Briefcase,
  Lightbulb,
  Star,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMarketplaceSummary } from "@/lib/api-admin-marketplace";
import { AdminMarketplaceSummary } from "@/types/admin-marketplace";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminErrorState,
} from "@/components/admin/shared";

export default function AdminMarketplaceOverviewPage() {
  const [summary, setSummary] = useState<AdminMarketplaceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMarketplaceSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load marketplace summary.");
    } finally {
      setLoading(false);
    }
  };

  const totalHidden = (summary?.hiddenServices ?? 0) + (summary?.hiddenCreatorOffers ?? 0) + (summary?.hiddenReviews ?? 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={ShoppingBag}
        title="Marketplace & Content Moderation"
        description="Supervise service catalog listings, creator project offers, and user reviews with auditable moderation controls."
        actions={
          <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading} className="text-xs h-8 gap-1.5 bg-background">
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Metrics
          </Button>
        }
      />

      {error && <AdminErrorState message={error} onRetry={fetchSummary} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatCard
          label="Service Catalog"
          value={summary?.totalServices ?? 0}
          icon={Briefcase}
          variant="blue"
          loading={loading}
          subtitle={
            <span className="flex items-center gap-2">
              <span className="text-emerald-600 font-medium">{summary?.publishedServices ?? 0} published</span>
              <span>•</span>
              <span className="text-rose-600 font-medium">{summary?.hiddenServices ?? 0} hidden</span>
            </span>
          }
        />

        <AdminStatCard
          label="Creator Offers"
          value={summary?.totalCreatorOffers ?? 0}
          icon={Lightbulb}
          variant="purple"
          loading={loading}
          subtitle={
            <span className="flex items-center gap-2">
              <span className="text-emerald-600 font-medium">{summary?.publishedCreatorOffers ?? 0} open</span>
              <span>•</span>
              <span className="text-rose-600 font-medium">{summary?.hiddenCreatorOffers ?? 0} hidden</span>
            </span>
          }
        />

        <AdminStatCard
          label="User Reviews"
          value={summary?.totalReviews ?? 0}
          icon={Star}
          variant="amber"
          loading={loading}
          subtitle={
            <span className="flex items-center gap-2">
              <span className="text-emerald-600 font-medium">{summary?.publicReviews ?? 0} visible</span>
              <span>•</span>
              <span className="text-rose-600 font-medium">{summary?.hiddenReviews ?? 0} hidden</span>
            </span>
          }
        />

        <AdminStatCard
          label="Hidden Items"
          value={totalHidden}
          icon={EyeOff}
          variant={totalHidden > 0 ? "red" : "gray"}
          loading={loading}
          subtitle="Total moderated artifacts"
        />
      </div>

      {/* Operational Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Services Directory */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Briefcase className="size-5" />
              </div>
              <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {summary?.totalServices ?? 0} Listings
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Services Catalog</CardTitle>
            <CardDescription className="text-xs">
              Audit service pricing, scope of work descriptions, provider tags, and toggle visibility for policy compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.publishedServices ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hidden by Admin:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.hiddenServices ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/marketplace/services">
                Inspect Services <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Creator Offers Directory */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Lightbulb className="size-5" />
              </div>
              <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                {summary?.totalCreatorOffers ?? 0} Offers
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Creator Offers</CardTitle>
            <CardDescription className="text-xs">
              Moderate project offers, equity splits, budgets, creator proposals, and enforce marketplace standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open Submissions:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.publishedCreatorOffers ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hidden by Admin:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.hiddenCreatorOffers ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/marketplace/creator-offers">
                Inspect Offers <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reviews Directory */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Star className="size-5" />
              </div>
              <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {summary?.totalReviews ?? 0} Reviews
              </span>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Reviews & Ratings</CardTitle>
            <CardDescription className="text-xs">
              Audit feedback submitted on completed workrooms and hide defamatory, abusive, or fake reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Visible:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.publicReviews ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hidden by Admin:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.hiddenReviews ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/reviews">
                Inspect Reviews <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
