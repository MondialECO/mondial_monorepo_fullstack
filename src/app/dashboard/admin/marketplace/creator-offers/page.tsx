"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Shield,
  User,
  DollarSign,
  Briefcase,
  Share2,
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
import {
  getCreatorOffers,
  getCreatorOfferDetail,
  moderateCreatorOffer,
} from "@/lib/api-admin-marketplace";
import {
  AdminCreatorOfferItem,
  AdminCreatorOfferDetail,
} from "@/types/admin-marketplace";

export default function AdminCreatorOffersModerationPage() {
  const [items, setItems] = useState<AdminCreatorOfferItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [dealMode, setDealMode] = useState<string>("all");
  const [moderationStatus, setModerationStatus] = useState<string>("all");

  // Selected Offer Detail Modal
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [offerDetail, setOfferDetail] = useState<AdminCreatorOfferDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Moderation Dialog State
  const [actionItem, setActionItem] = useState<AdminCreatorOfferItem | null>(null);
  const [actionType, setActionType] = useState<"hide" | "restore" | null>(null);
  const [moderationReason, setModerationReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [page, dealMode, moderationStatus]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCreatorOffers({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        dealMode: dealMode !== "all" ? dealMode : undefined,
        moderationStatus: moderationStatus !== "all" ? moderationStatus : undefined,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load creator offers.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOffers();
  };

  const handleOpenDetail = async (ideaId: string) => {
    try {
      setSelectedIdeaId(ideaId);
      setDetailLoading(true);
      const detail = await getCreatorOfferDetail(ideaId);
      setOfferDetail(detail);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load offer details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenModeration = (item: AdminCreatorOfferItem, type: "hide" | "restore") => {
    setActionItem(item);
    setActionType(type);
    setModerationReason("");
    setActionError(null);
  };

  const handleExecuteModeration = async () => {
    if (!actionItem || !actionType) return;
    if (actionType === "hide" && !moderationReason.trim()) {
      setActionError("A reason is mandatory when hiding a creator offer from the marketplace.");
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);
      await moderateCreatorOffer(actionItem.ideaId, actionType, moderationReason);
      setActionItem(null);
      setActionType(null);
      fetchOffers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Moderation action failed.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Creator Offers Moderation"
        description="Supervise Full Buyout and Co-founder / Equity deal modes. Deal valuation and asking prices are read-only."
        badge="MARKETPLACE"
        icon={Lightbulb}
        backHref="/dashboard/admin/marketplace"
        backLabel="Back to Marketplace Hub"
        actions={
          <Button variant="outline" size="sm" onClick={fetchOffers} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load creator offers"
          message={error}
          onRetry={fetchOffers}
        />
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder="Search project, tagline, creator..."
        hasActiveFilters={Boolean(search.trim() || dealMode !== "all" || moderationStatus !== "all")}
        onClearFilters={() => {
          setSearch("");
          setDealMode("all");
          setModerationStatus("all");
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={dealMode} onValueChange={(val) => { setDealMode(val); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Deal Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deal Modes</SelectItem>
                <SelectItem value="full_buyout">Full Buyout</SelectItem>
                <SelectItem value="equity_partnership">Equity / Co-founder</SelectItem>
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

      {/* Shared Offers Table */}
      <AdminTable
        title="Creator Marketplace Offers"
        description="Full buyout and equity partnership proposals."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={items.length === 0}
        emptyTitle="No creator offers found"
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
            const ideaId = item.ideaId;
            const isHidden = item.isModerationHidden;

            return (
              <div
                key={ideaId}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isHidden ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/30"
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground text-base truncate">
                      {item.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {item.sector}
                    </Badge>
                    <AdminStatusBadge status={item.status} size="sm" />
                    {isHidden ? (
                      <Badge variant="destructive" className="text-[11px] bg-amber-600 hover:bg-amber-700">
                        Hidden by Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/30">
                        Live on Marketplace
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <Link
                      href={`/dashboard/admin/users/${item.creatorId}`}
                      className="flex items-center gap-1 hover:text-purple-600 hover:underline"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{item.creatorName || "Creator"}</span>
                    </Link>
                    <span>•</span>
                    <span>Mode: {item.dealModes?.join(", ") || item.saleType}</span>
                    {item.askingPrice && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          Ask: €{item.askingPrice.toLocaleString()}
                        </span>
                      </>
                    )}
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetail(ideaId)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect Terms
                  </Button>

                  {isHidden ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => handleOpenModeration(item, "restore")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-600 hover:bg-amber-50"
                      onClick={() => handleOpenModeration(item, "hide")}
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Hide
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminTable>

      {/* Detailed Offer Inspection Dialog */}
      <Dialog open={!!selectedIdeaId} onOpenChange={(open) => !open && setSelectedIdeaId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              Creator Deal Offer Inspection (Read Only)
            </DialogTitle>
            <DialogDescription>
              Admin audit inspection of creator project summary, buyout/equity deal terms, and moderation history.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
              <p className="text-xs">Loading offer details...</p>
            </div>
          ) : offerDetail ? (
            <div className="space-y-6 text-sm">
              {/* Header Details */}
              <div className="p-4 bg-muted/40 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">{offerDetail.title}</h2>
                  <Badge variant={offerDetail.isModerationHidden ? "destructive" : "default"}>
                    {offerDetail.isModerationHidden ? "Hidden by Moderation" : offerDetail.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{offerDetail.description}</p>
                <div className="flex items-center gap-4 text-xs pt-2">
                  <Link
                    href={`/dashboard/admin/users/${offerDetail.creatorId}`}
                    className="text-purple-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <User className="h-3.5 w-3.5" />
                    Creator: {offerDetail.creatorName} ({offerDetail.creatorEmail})
                  </Link>
                  <span>•</span>
                  <span>Sector: {offerDetail.sector}</span>
                </div>
              </div>

              {/* Deal Terms (Read-Only) */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  Deal Structure & Offering (Read Only)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-xs text-muted-foreground">Supported Deal Modes</span>
                    <div className="font-semibold text-foreground">
                      {offerDetail.dealModes?.join(", ") || offerDetail.saleType}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-xs text-muted-foreground">Asking Price (Buyout)</span>
                    <div className="font-semibold text-foreground">
                      {offerDetail.askingPrice ? `€${offerDetail.askingPrice.toLocaleString()}` : "Not Specified / Open"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-xs text-muted-foreground">Audience Scope</span>
                    <div className="font-semibold text-foreground capitalize">
                      {offerDetail.audience}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-xs text-muted-foreground">NDA Gating</span>
                    <div className="font-semibold text-foreground">
                      {offerDetail.ndaRequired ? "Required Before Diligence" : "Public Pitch Deck"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation History */}
              {offerDetail.moderatedBy && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <div className="font-semibold text-amber-700 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Moderated by: {offerDetail.moderatedBy} on{" "}
                    {new Date(offerDetail.moderatedAt || "").toLocaleDateString()}
                  </div>
                  {offerDetail.moderationReason && (
                    <p className="text-muted-foreground">
                      Reason: {offerDetail.moderationReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIdeaId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Decision Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "hide" ? (
                <>
                  <EyeOff className="h-5 w-5 text-amber-600" />
                  Hide Creator Deal Offer
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Restore Creator Deal Offer
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "hide"
                ? "Hiding this offer will remove it from the public marketplace. The creator retains their project and workspace access."
                : "Restoring this offer will return it to the live marketplace."}
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
                placeholder="Specify reason for hiding this creator offer..."
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
