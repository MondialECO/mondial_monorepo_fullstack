"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  FileText,
  Camera,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  ImageIcon
} from "lucide-react";
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from "@/components/admin/shared";

interface KycPendingUserSummary {
  id: string;
  name?: string;
  email?: string;
  userName?: string;
  user?: string; // legacy primary role
  roles?: string[];
  phoneNumber?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  address?: {
    address?: string;
    city?: string;
    country?: string;
  };
  kyc?: {
    status: number | string;
    submittedAt?: string;
    documentType?: string;
    documentUploaded?: boolean;
    faceSubmitted?: boolean;
    identity?: {
      documentType?: string;
      documentUploaded?: boolean;
      status: number | string;
      rejectionReason?: string;
    };
    face?: {
      faceSubmitted?: boolean;
      status: number | string;
      rejectionReason?: string;
    };
  };
  createdOn?: string;
  createdAt?: string;
}

interface AdminKycReviewDetail {
  id: string;
  name?: string;
  email?: string;
  userName?: string;
  user?: string;
  roles?: string[];
  phoneNumber?: string;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  address?: {
    address?: string;
    city?: string;
    country?: string;
  };
  createdAt?: string;
  kyc?: {
    status: number | string;
    submittedAt?: string;
    verifiedAt?: string;
    identity?: {
      documentType?: string;
      documentNumber?: string;
      frontImagePath?: string;
      backImagePath?: string;
      status: number | string;
      rejectionReason?: string;
      submittedAt?: string;
      verifiedAt?: string;
    };
    face?: {
      selfieImagePath?: string;
      status: number | string;
      rejectionReason?: string;
      submittedAt?: string;
      verifiedAt?: string;
    };
  };
}

interface EvidenceItemState {
  url: string | null;
  isPdf: boolean;
  status: "idle" | "loading" | "loaded" | "missing" | "forbidden" | "error";
  errorMessage?: string;
}

function maskDocumentNumber(docNum?: string | null): string {
  if (!docNum || docNum.trim().length === 0) return "—";
  const trimmed = docNum.trim();
  if (trimmed.length <= 4) return "••••" + trimmed;
  const visible = trimmed.slice(-4);
  return "••••••••" + visible;
}

function EvidenceBox({
  title,
  evidence,
  icon: Icon,
  missingLabel = "Document not provided / not required"
}: {
  title: string;
  evidence: EvidenceItemState;
  icon: React.ElementType;
  missingLabel?: string;
}) {
  return (
    <div className="p-2.5 bg-muted/20 border rounded-md space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
          <Icon className="w-3.5 h-3.5 text-blue-500" /> {title}
        </span>
        {evidence.status === "loaded" && evidence.url && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {evidence.isPdf ? "Open PDF" : "Full Size"} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {evidence.status === "loading" ? (
        <div className="rounded border border-dashed border-border p-5 text-center text-muted-foreground text-[11px]">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1.5"></div>
          Loading document...
        </div>
      ) : evidence.status === "loaded" && evidence.url ? (
        evidence.isPdf ? (
          <div className="p-4 bg-muted/40 border border-border/80 rounded-md text-center space-y-2">
            <FileText className="w-7 h-7 mx-auto text-rose-500" />
            <div className="text-[11px] font-medium text-foreground">PDF Document Ready</div>
            <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1">
                <ExternalLink className="w-3 h-3" /> View Full Document
              </Button>
            </a>
          </div>
        ) : (
          <div className="relative rounded overflow-hidden border border-border/80 bg-muted/40 aspect-[4/3] flex items-center justify-center">
            <img
              src={evidence.url}
              alt={title}
              className="object-contain w-full h-full max-h-40"
            />
          </div>
        )
      ) : evidence.status === "forbidden" ? (
        <div className="rounded border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-center text-rose-700 dark:text-rose-300 text-[11px] space-y-1">
          <AlertTriangle className="w-4 h-4 mx-auto text-rose-600" />
          <p className="font-semibold">Access Denied</p>
          <p className="text-[10px] text-muted-foreground">{evidence.errorMessage || "Admin authorization required."}</p>
        </div>
      ) : evidence.status === "error" ? (
        <div className="rounded border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-center text-rose-700 dark:text-rose-300 text-[11px] space-y-1">
          <XCircle className="w-4 h-4 mx-auto text-rose-600" />
          <p className="font-semibold">Unable to load document</p>
        </div>
      ) : (
        <div className="rounded border border-dashed border-border p-5 text-center text-muted-foreground text-[11px]">
          <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
          {missingLabel}
        </div>
      )}
    </div>
  );
}

export default function AdminKycQueuePage() {
  const [users, setUsers] = useState<KycPendingUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Review modal & detail state
  const [selectedUserSummary, setSelectedUserSummary] = useState<KycPendingUserSummary | null>(null);
  const [reviewDetail, setReviewDetail] = useState<AdminKycReviewDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showDocumentNumber, setShowDocumentNumber] = useState(false);

  // Authenticated Evidence States
  const [frontEvidence, setFrontEvidence] = useState<EvidenceItemState>({ url: null, isPdf: false, status: "idle" });
  const [backEvidence, setBackEvidence] = useState<EvidenceItemState>({ url: null, isPdf: false, status: "idle" });
  const [selfieEvidence, setSelfieEvidence] = useState<EvidenceItemState>({ url: null, isPdf: false, status: "idle" });

  // Store active Object URLs in ref to avoid async state cleanup race conditions
  const activeBlobUrlsRef = useRef<string[]>([]);

  const revokeActiveBlobs = useCallback(() => {
    activeBlobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Failed to revoke blob URL", err);
      }
    });
    activeBlobUrlsRef.current = [];
  }, []);

  // Clean up blob URLs ONLY on unmount
  useEffect(() => {
    return () => {
      revokeActiveBlobs();
    };
  }, [revokeActiveBlobs]);

  // Decision states
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const fetchPendingKyc = useCallback(async (page = currentPage, querySearch = search) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/varification/pending", {
        params: {
          page,
          pageSize,
          search: querySearch.trim() || undefined,
        },
      });
      if (res.data?.data?.items) {
        setUsers(res.data.data.items);
        setTotalItems(res.data.data.totalItems || 0);
        setTotalPages(res.data.data.totalPages || 0);
        setCurrentPage(res.data.data.page || page);
      } else if (Array.isArray(res.data?.data)) {
        setUsers(res.data.data);
        setTotalItems(res.data.data.length);
        setTotalPages(1);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
        setTotalItems(res.data.length);
        setTotalPages(1);
      } else {
        setUsers([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err: unknown) {
      console.error("Error loading pending KYC users:", err);
      setError("Failed to load pending KYC queue.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    fetchPendingKyc(1, search);
  }, [search]);

  const fetchSingleEvidence = async (
    endpointUrl: string | undefined | null
  ): Promise<EvidenceItemState> => {
    if (!endpointUrl) {
      return { url: null, isPdf: false, status: "missing" };
    }

    try {
      const res = await api.get(endpointUrl, { responseType: "blob" });
      const blob: Blob = res.data;
      const isPdf =
        blob.type === "application/pdf" ||
        endpointUrl.toLowerCase().endsWith(".pdf");
      const objectUrl = URL.createObjectURL(blob);
      activeBlobUrlsRef.current.push(objectUrl);
      return { url: objectUrl, isPdf, status: "loaded" };
    } catch (err: any) {
      const statusCode = err.response?.status;
      if (statusCode === 403) {
        return { url: null, isPdf: false, status: "forbidden", errorMessage: "Access restricted: admin authorization required." };
      }
      if (statusCode === 404) {
        return { url: null, isPdf: false, status: "missing", errorMessage: "Document file unavailable in storage." };
      }
      return { url: null, isPdf: false, status: "error", errorMessage: "Unable to load document evidence." };
    }
  };

  const handleOpenReview = async (userSummary: KycPendingUserSummary) => {
    // 1. Revoke existing blobs
    revokeActiveBlobs();
    setFrontEvidence({ url: null, isPdf: false, status: "loading" });
    setBackEvidence({ url: null, isPdf: false, status: "loading" });
    setSelfieEvidence({ url: null, isPdf: false, status: "loading" });

    setSelectedUserSummary(userSummary);
    setReviewDetail(null);
    setDetailError(null);
    setShowDocumentNumber(false);
    setIsRejecting(false);
    setRejectReason("");
    setIsReviewModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const res = await api.get(`/varification/${userSummary.id}`);
      const detailData: AdminKycReviewDetail = res.data && res.data.data ? res.data.data : res.data;
      setReviewDetail(detailData);

      // Fetch front, back, and selfie in parallel
      const frontPath = detailData?.kyc?.identity?.frontImagePath;
      const backPath = detailData?.kyc?.identity?.backImagePath;
      const selfiePath = detailData?.kyc?.face?.selfieImagePath;

      const [frontRes, backRes, selfieRes] = await Promise.all([
        fetchSingleEvidence(frontPath),
        fetchSingleEvidence(backPath),
        fetchSingleEvidence(selfiePath),
      ]);

      setFrontEvidence(frontRes);
      setBackEvidence(backRes);
      setSelfieEvidence(selfieRes);
    } catch (err: any) {
      console.error("Error loading KYC review detail:", err);
      setDetailError(err.response?.data?.message || "Failed to load KYC review details for selected user.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseReviewModal = () => {
    revokeActiveBlobs();
    setFrontEvidence({ url: null, isPdf: false, status: "idle" });
    setBackEvidence({ url: null, isPdf: false, status: "idle" });
    setSelfieEvidence({ url: null, isPdf: false, status: "idle" });
    setIsReviewModalOpen(false);
    setSelectedUserSummary(null);
    setReviewDetail(null);
    setDetailError(null);
    setShowDocumentNumber(false);
    setIsRejecting(false);
    setRejectReason("");
  };

  const handleApprove = async () => {
    const targetId = reviewDetail?.id || selectedUserSummary?.id;
    if (!targetId) return;

    setIsSubmittingDecision(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/varification/approve/${targetId}`);
      const displayName = reviewDetail?.name || selectedUserSummary?.name || reviewDetail?.email || selectedUserSummary?.email;
      setActionSuccess(`KYC approved for ${displayName}. User promoted to Phase 1.`);
      handleCloseReviewModal();
      // Refresh queue
      await fetchPendingKyc();
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 404) {
        setActionError("This submission has already been processed by another administrator.");
        await fetchPendingKyc();
      } else {
        setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to approve KYC.");
      }
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleReject = async () => {
    const targetId = reviewDetail?.id || selectedUserSummary?.id;
    if (!targetId) return;

    if (!rejectReason.trim()) {
      setActionError("A clear rejection reason is mandatory.");
      return;
    }

    setIsSubmittingDecision(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/varification/reject/${targetId}`, { reason: rejectReason.trim() });
      const displayName = reviewDetail?.name || selectedUserSummary?.name || reviewDetail?.email || selectedUserSummary?.email;
      setActionSuccess(`KYC submission rejected for ${displayName}. Notification dispatched.`);
      handleCloseReviewModal();
      // Refresh queue
      await fetchPendingKyc();
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 404) {
        setActionError("This submission has already been processed by another administrator.");
        await fetchPendingKyc();
      } else {
        setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to reject KYC.");
      }
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.id && u.id.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="Universal Identity / KYC Queue"
        description="Review submitted government ID documents and face authentication to unlock Phase 1 capabilities."
        badge="IDENTITY"
        icon={BadgeCheck}
        backHref="/dashboard/admin/verifications"
        backLabel="Back to Verification Hub"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPendingKyc(currentPage, search)}
            disabled={isLoading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
        }
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load KYC queue"
          message={error}
          onRetry={() => fetchPendingKyc(currentPage, search)}
        />
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm rounded-lg border border-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm rounded-lg border border-rose-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            {actionError}
          </span>
          <button onClick={() => setActionError(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        searchPlaceholder="Filter by applicant name, email, or user ID..."
        hasActiveFilters={Boolean(search.trim())}
        onClearFilters={() => setSearch("")}
      />

      {/* Shared Admin Table with Pagination */}
      <AdminTable
        title="Pending KYC Applicants"
        description="Submitted identity documents awaiting verification."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-blue-300">
            Pending: <span className="ml-1 text-foreground font-bold">{totalItems}</span>
          </Badge>
        }
        loading={isLoading}
        loadingRowsCount={5}
        empty={filteredUsers.length === 0}
        emptyTitle="No KYC submissions awaiting review"
        emptyDescription="All applicant identity verifications have been processed or none match the search filter."
        pagination={
          totalPages > 1 || totalItems > 0 ? (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => {
                setCurrentPage(p);
                fetchPendingKyc(p, search);
              }}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3.5">Applicant</th>
                <th scope="col" className="px-4 py-3.5">Country</th>
                <th scope="col" className="px-4 py-3.5">Document Status</th>
                <th scope="col" className="px-4 py-3.5">Face Match</th>
                <th scope="col" className="px-4 py-3.5">Submitted</th>
                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40 transition">
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-sm shrink-0">
                        {(u.name || u.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate max-w-xs">
                          {u.name || u.userName || "Unnamed User"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="px-4 py-4 text-muted-foreground">
                    {u.address?.country || "—"}
                  </td>

                  {/* Document Status */}
                  <td className="px-4 py-4">
                    <AdminStatusBadge status="pending" size="sm" />
                  </td>

                  {/* Face Match */}
                  <td className="px-4 py-4">
                    <AdminStatusBadge status="pending" size="sm" />
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {u.kyc?.submittedAt
                      ? new Date(u.kyc.submittedAt).toLocaleDateString()
                      : u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "Recently"}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(u)}
                      className="text-xs h-8 px-3"
                    >
                      Review KYC
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* KYC REVIEW MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => { if (!open) handleCloseReviewModal(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              KYC Evidence Review — {selectedUserSummary?.name || selectedUserSummary?.email}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verify submitted identity credentials before making an authoritative approval or rejection decision.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Fetching confidential KYC review record...</span>
              </div>
            </div>
          ) : detailError ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs rounded-lg border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{detailError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (selectedUserSummary) handleOpenReview(selectedUserSummary); }}
                className="text-xs h-7"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              {/* Applicant Identity Card */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-semibold text-foreground">
                    {reviewDetail?.name || selectedUserSummary?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Address:</span>
                  <span className="font-semibold text-foreground">
                    {reviewDetail?.email || selectedUserSummary?.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country / City:</span>
                  <span className="font-semibold text-foreground">
                    {reviewDetail?.address?.country || selectedUserSummary?.address?.country || "—"},{" "}
                    {reviewDetail?.address?.city || selectedUserSummary?.address?.city || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Unified Profile:</span>
                  <Link
                    href={`/dashboard/admin/users/${reviewDetail?.id || selectedUserSummary?.id}`}
                    target="_blank"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Inspect Full User Account <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Document Details & Masking */}
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <div className="font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Document Identification</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {reviewDetail?.kyc?.identity?.documentType || "Government ID"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded border border-border/60">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Document Number:</div>
                    <div className="font-mono text-xs font-semibold text-foreground mt-0.5">
                      {showDocumentNumber
                        ? reviewDetail?.kyc?.identity?.documentNumber || "Not Provided"
                        : maskDocumentNumber(reviewDetail?.kyc?.identity?.documentNumber)}
                    </div>
                  </div>
                  {reviewDetail?.kyc?.identity?.documentNumber && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDocumentNumber(!showDocumentNumber)}
                      className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showDocumentNumber ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Reveal Full
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Document Images Evidence Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Front Image / PDF */}
                  <EvidenceBox
                    title="Front ID Photo / Document"
                    evidence={frontEvidence}
                    icon={FileText}
                    missingLabel="Front document not provided"
                  />

                  {/* Back Image / PDF */}
                  <EvidenceBox
                    title="Back ID Photo / Document"
                    evidence={backEvidence}
                    icon={FileText}
                    missingLabel="Back document not required / not uploaded"
                  />
                </div>
              </div>

              {/* Face Authentication Evidence Card */}
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <div className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Face / Biometric Verification Evidence
                </div>
                
                {selfieEvidence.status === "loaded" && selfieEvidence.url ? (
                  <EvidenceBox
                    title="Selfie Authentication Photo"
                    evidence={selfieEvidence}
                    icon={Camera}
                    missingLabel="Selfie photo not uploaded"
                  />
                ) : (
                  <div className="p-2.5 bg-muted/20 border rounded-md flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Camera className="w-4 h-4 text-indigo-500" />
                      Biometric Session Verified
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                      Live Session Recorded
                    </Badge>
                  </div>
                )}
              </div>

              {/* Reject Reason Form if Rejecting */}
              {isRejecting ? (
                <div className="space-y-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-lg">
                  <label className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Mandatory Rejection Reason:
                  </label>
                  <Textarea
                    placeholder="e.g. Document image is blurry, expired identification, name mismatch..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="text-xs bg-background"
                    rows={3}
                  />
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {isRejecting ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejecting(false)}
                  disabled={isSubmittingDecision}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isSubmittingDecision || !rejectReason.trim()}
                >
                  {isSubmittingDecision ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseReviewModal}
                  disabled={isSubmittingDecision}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmittingDecision || isLoadingDetail}
                >
                  Reject...
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isSubmittingDecision || isLoadingDetail}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isSubmittingDecision ? "Approving..." : "Approve KYC"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
