"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Shield,
  User,
  MessageSquare,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getReviews, moderateReview } from "@/lib/api-admin-marketplace";
import { AdminReviewItem } from "@/types/admin-marketplace";

export default function AdminReviewsModerationPage() {
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [rating, setRating] = useState<string>("all");
  const [moderationStatus, setModerationStatus] = useState<string>("all");

  // Moderation Dialog State
  const [actionItem, setActionItem] = useState<AdminReviewItem | null>(null);
  const [actionType, setActionType] = useState<"hide" | "restore" | null>(null);
  const [moderationReason, setModerationReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [page, rating, moderationStatus]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const ratingVal = rating !== "all" ? parseInt(rating, 10) : undefined;
      const res = await getReviews({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        rating: ratingVal,
        moderationStatus: moderationStatus !== "all" ? moderationStatus : undefined,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleOpenModeration = (item: AdminReviewItem, type: "hide" | "restore") => {
    setActionItem(item);
    setActionType(type);
    setModerationReason("");
    setActionError(null);
  };

  const handleExecuteModeration = async () => {
    if (!actionItem || !actionType) return;
    if (actionType === "hide" && !moderationReason.trim()) {
      setActionError("A reason is mandatory when hiding a review from public reputation.");
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);
      await moderateReview(actionItem.id, actionType, moderationReason);
      setActionItem(null);
      setActionType(null);
      fetchReviews();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Moderation action failed.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center text-amber-500 gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= count ? "text-amber-500 font-bold" : "text-muted-foreground/30"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Reviews & Ratings Moderation"
        description="Audit client reviews across provider engagements. Hiding a review excludes it from public display and provider aggregate ratings."
        badge="MARKETPLACE"
        icon={Star}
        backHref="/dashboard/admin/marketplace"
        backLabel="Back to Marketplace Hub"
        actions={
          <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load reviews"
          message={error}
          onRetry={fetchReviews}
        />
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder="Search review text, client, provider..."
        hasActiveFilters={Boolean(search.trim() || rating !== "all" || moderationStatus !== "all")}
        onClearFilters={() => {
          setSearch("");
          setRating("all");
          setModerationStatus("all");
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={rating} onValueChange={(val) => { setRating(val); setPage(1); }}>
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Rating Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings (1 - 5)</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={moderationStatus} onValueChange={(val) => { setModerationStatus(val); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Moderation State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moderation States</SelectItem>
                <SelectItem value="visible">Publicly Visible Only</SelectItem>
                <SelectItem value="hidden">Hidden by Moderation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Reviews Table */}
      <AdminTable
        title="Client Reviews Directory"
        description="Public and moderated client feedback."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={items.length === 0}
        emptyTitle="No reviews found"
        emptyDescription="Try adjusting your search terms or filters."
        pagination={
          totalPages > 1 || totalCount > 0 ? (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={10}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <div className="divide-y divide-border/40">
          {items.map((item) => {
            const reviewId = item.id;
            const isHidden = item.isModerationHidden;

            return (
              <div
                key={reviewId}
                className={`p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors ${
                  isHidden ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/30"
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {renderStars(item.overallRating)}
                    <span className="font-semibold text-foreground text-sm">
                      {item.overallRating} / 5
                    </span>
                    {isHidden ? (
                      <Badge variant="destructive" className="text-[11px] bg-amber-600 hover:bg-amber-700">
                        Hidden by Moderation
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/30">
                        Public
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border border-border/40 font-normal italic">
                    "{item.writtenReview || "No written review text provided."}"
                  </p>

                  {item.providerResponse && (
                    <div className="p-2.5 rounded bg-blue-500/5 border border-blue-500/10 text-xs space-y-1 ml-4">
                      <span className="font-semibold text-blue-700">Provider Response:</span>
                      <p className="text-muted-foreground">{item.providerResponse}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <Link
                      href={`/dashboard/admin/users/${item.clientId}`}
                      className="flex items-center gap-1 hover:text-primary hover:underline font-medium"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Client: {item.clientName || item.clientId}</span>
                    </Link>
                    <span>→</span>
                    <Link
                      href={`/dashboard/admin/users/${item.providerId}`}
                      className="flex items-center gap-1 hover:text-primary hover:underline font-medium"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Provider: {item.providerName || item.providerId}</span>
                    </Link>
                    {isHidden && item.moderationReason && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-medium">
                          Reason: {item.moderationReason}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                  {isHidden ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => handleOpenModeration(item, "restore")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Restore Review
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-600 hover:bg-amber-50"
                      onClick={() => handleOpenModeration(item, "hide")}
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Hide Review
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminTable>

      {/* Moderation Decision Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "hide" ? (
                <>
                  <EyeOff className="h-5 w-5 text-amber-600" />
                  Hide Review
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Restore Review
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "hide"
                ? "Hiding this review will remove it from public display and exclude its score from the provider's aggregate rating."
                : "Restoring this review will include it back in public rating calculations and profile display."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {actionError}
            </div>
          )}

          {actionType === "hide" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Moderation Reason (Required)
              </label>
              <Textarea
                placeholder="Specify violation or justification for hiding this review..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={actionSubmitting}
              onClick={() => setActionType(null)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "hide" ? "destructive" : "default"}
              disabled={actionSubmitting}
              onClick={handleExecuteModeration}
            >
              {actionSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === "hide" ? "Confirm Hide" : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
