"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ExternalLink,
  Shield,
  Clock,
  User,
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
  getModerationServices,
  getServiceDetail,
  moderateService,
} from "@/lib/api-admin-marketplace";
import {
  AdminServiceModerationItem,
  AdminServiceDetail,
} from "@/types/admin-marketplace";

export default function AdminServicesModerationPage() {
  const [items, setItems] = useState<AdminServiceModerationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [moderationStatus, setModerationStatus] = useState<string>("all");

  // Selected Service Detail Modal
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceDetail, setServiceDetail] = useState<AdminServiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Moderation Dialog State
  const [actionItem, setActionItem] = useState<AdminServiceModerationItem | null>(null);
  const [actionType, setActionType] = useState<"hide" | "restore" | null>(null);
  const [moderationReason, setModerationReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [page, category, moderationStatus]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getModerationServices({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        category: category !== "all" ? category : undefined,
        moderationStatus: moderationStatus !== "all" ? moderationStatus : undefined,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const handleOpenDetail = async (id: string) => {
    try {
      setSelectedServiceId(id);
      setDetailLoading(true);
      const detail = await getServiceDetail(id);
      setServiceDetail(detail);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load service detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenModeration = (item: AdminServiceModerationItem, type: "hide" | "restore") => {
    setActionItem(item);
    setActionType(type);
    setModerationReason("");
    setActionError(null);
  };

  const handleExecuteModeration = async () => {
    if (!actionItem || !actionType) return;
    if (actionType === "hide" && !moderationReason.trim()) {
      setActionError("A reason is mandatory when hiding a service from the marketplace.");
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);
      await moderateService(actionItem.id, actionType, moderationReason);
      setActionItem(null);
      setActionType(null);
      fetchServices();
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
        title="Service Catalog Moderation"
        description="Inspect published packages, search across providers, and enforce reversible content moderation."
        badge="MARKETPLACE"
        icon={Briefcase}
        backHref="/dashboard/admin/marketplace"
        backLabel="Back to Marketplace Hub"
        actions={
          <Button variant="outline" size="sm" onClick={fetchServices} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load services"
          message={error}
          onRetry={fetchServices}
        />
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        searchPlaceholder="Search title, description, provider..."
        hasActiveFilters={Boolean(search.trim() || category !== "all" || moderationStatus !== "all")}
        onClearFilters={() => {
          setSearch("");
          setCategory("all");
          setModerationStatus("all");
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
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

      {/* Shared Services Table */}
      <AdminTable
        title="Service Listings"
        description="Public and moderated provider service offerings."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={items.length === 0}
        emptyTitle="No service listings found"
        emptyDescription="Try adjusting your search query or filter criteria."
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
            const itemId = item.id;
            const isHidden = item.isModerationHidden;

            return (
              <div
                key={itemId}
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
                      {item.category}
                    </Badge>
                    <AdminStatusBadge status={item.status} size="sm" />
                    {isHidden ? (
                      <Badge variant="destructive" className="text-[11px] bg-amber-600 hover:bg-amber-700">
                        Hidden by Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/30">
                        Public
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <Link
                      href={`/dashboard/admin/users/${item.providerId}`}
                      className="flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{item.providerName || "Service Provider"}</span>
                    </Link>
                    <span>•</span>
                    <span>{item.packagesCount} package(s)</span>
                    <span>•</span>
                    <span className="font-medium text-foreground">
                      From {item.currency} {item.startingPrice}
                    </span>
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
                    onClick={() => handleOpenDetail(itemId)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect
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

      {/* Detailed Service Inspection Dialog */}
      <Dialog open={!!selectedServiceId} onOpenChange={(open) => !open && setSelectedServiceId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Service Listing Review (Read Only)
            </DialogTitle>
            <DialogDescription>
              Admin audit inspection of service packages, pricing, FAQ, and provider metadata.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <p className="text-xs">Loading service details...</p>
            </div>
          ) : serviceDetail ? (
            <div className="space-y-6 text-sm">
              {/* Header Details */}
              <div className="p-4 bg-muted/40 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">{serviceDetail.title}</h2>
                  <Badge variant={serviceDetail.isModerationHidden ? "destructive" : "default"}>
                    {serviceDetail.isModerationHidden ? "Hidden by Moderation" : serviceDetail.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceDetail.description}</p>
                <div className="flex items-center gap-4 text-xs pt-2">
                  <Link
                    href={`/dashboard/admin/users/${serviceDetail.providerId}`}
                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <User className="h-3.5 w-3.5" />
                    Provider: {serviceDetail.providerName} ({serviceDetail.providerEmail})
                  </Link>
                  <span>•</span>
                  <span>Category: {serviceDetail.category}</span>
                  <span>•</span>
                  <span>Rating: ★ {serviceDetail.averageRating?.toFixed(1) ?? "0.0"} ({serviceDetail.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Packages Table (Read-Only) */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Service Packages ({serviceDetail.packages?.length || 0})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {serviceDetail.packages?.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-3 rounded-lg border border-border/60 bg-card space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{pkg.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {pkg.currency} {pkg.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pkg.description}
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Delivery: {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation History */}
              {serviceDetail.moderatedBy && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <div className="font-semibold text-amber-700 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Moderated by: {serviceDetail.moderatedBy} on{" "}
                    {new Date(serviceDetail.moderatedAt || "").toLocaleDateString()}
                  </div>
                  {serviceDetail.moderationReason && (
                    <p className="text-muted-foreground">
                      Reason: {serviceDetail.moderationReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedServiceId(null)}>
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
                  Hide Service Listing
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Restore Service Listing
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "hide"
                ? "Hiding this service will exclude it from public search and marketplace catalog. The provider will retain access to their dashboard."
                : "Restoring this service will make it publicly accessible on the marketplace again."}
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
                placeholder="Specify violation or justification for hiding this service..."
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
