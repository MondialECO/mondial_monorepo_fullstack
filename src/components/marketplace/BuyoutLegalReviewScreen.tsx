"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  UserCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  Send,
  Loader2,
  Check,
  Scale,
  RefreshCw,
  Eye,
  FileCode,
  Globe,
  Briefcase,
  HelpCircle,
  FileCheck2,
} from "lucide-react";
import {
  BuyoutLegalPackage,
  BuyoutLegalDocument,
  BuyoutAssetEntry,
  InviteBuyoutLegalProviderRequest,
  ReviewBuyoutLegalPackageRequest,
  RequestBuyoutLegalChangesRequest,
  ReviseBuyoutDocumentRequest,
  marketplaceProjectsApi,
} from "@/lib/api-marketplace-projects";

interface BuyoutLegalReviewScreenProps {
  pkg: BuyoutLegalPackage;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onApprove: () => Promise<void>;
  onRequestChanges: (req: RequestBuyoutLegalChangesRequest) => Promise<void>;
  onInviteProvider?: (req: InviteBuyoutLegalProviderRequest) => Promise<void>;
  onProviderReview?: (req: ReviewBuyoutLegalPackageRequest) => Promise<void>;
  onReviseDocument?: (docId: string, req: ReviseBuyoutDocumentRequest) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const BuyoutLegalReviewScreen: React.FC<BuyoutLegalReviewScreenProps> = ({
  pkg,
  dealId,
  isCreator,
  currentUserId = "",
  onApprove,
  onRequestChanges,
  onInviteProvider,
  onProviderReview,
  onReviseDocument,
  onRefresh,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<BuyoutLegalDocument | null>(null);
  const [explainDoc, setExplainDoc] = useState<{ title: string; explanation: string; disclaimer: string } | null>(null);
  const [explainingDocId, setExplainingDocId] = useState<string | null>(null);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [changesComment, setChangesComment] = useState("");
  const [changesError, setChangesError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteProviderId, setInviteProviderId] = useState("");
  const [editingDoc, setEditingDoc] = useState<BuyoutLegalDocument | null>(null);
  const [editingMarkdown, setEditingMarkdown] = useState("");
  const [providerNotes, setProviderNotes] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasAssignedProvider = Boolean(pkg.assignedLegalProviderId);
  const isAssignedProvider =
    Boolean(pkg.assignedLegalProviderId) && Boolean(currentUserId) && pkg.assignedLegalProviderId === currentUserId;

  const hasMissingBlockers = pkg.blockers && pkg.blockers.length > 0;
  const isProviderReviewed = pkg.providerReviewStatus === "REVIEW_COMPLETE";
  const isProviderRequirementSatisfied = !hasAssignedProvider || isProviderReviewed;
  const myApprovalVersion = isCreator ? pkg.creatorApprovedVersion : pkg.entrepreneurApprovedVersion;
  const isMyApproved = myApprovalVersion === pkg.version;
  const isBothApproved = pkg.creatorApprovedVersion === pkg.version && pkg.entrepreneurApprovedVersion === pkg.version;

  const handleExplain = async (doc: BuyoutLegalDocument) => {
    try {
      setExplainingDocId(doc.id);
      const res = await marketplaceProjectsApi.explainBuyoutLegalDocument(dealId, doc.id);
      setExplainDoc({
        title: doc.title,
        explanation: res.explanation,
        disclaimer: res.disclaimer,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || e.message || "Failed to explain document.");
    } finally {
      setExplainingDocId(null);
    }
  };

  const handleSendChanges = async () => {
    if (!changesComment.trim()) return;
    setChangesError(null);
    setLoadingAction("changes");
    try {
      await onRequestChanges({ comment: changesComment.trim() });
      setShowChangesDialog(false);
      setChangesComment("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setChangesError(e.response?.data?.message || e.message || "Failed to submit wording change request.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteProviderId.trim() || !onInviteProvider) return;
    setLoadingAction("invite");
    try {
      await onInviteProvider({ providerId: inviteProviderId.trim() });
      setShowInviteDialog(false);
      setInviteProviderId("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || e.message || "Failed to assign legal provider.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompleteProviderReview = async (status: "REVIEW_COMPLETE" | "CHANGES_REQUESTED") => {
    if (!onProviderReview) return;
    setLoadingAction(`provider_${status}`);
    try {
      await onProviderReview({
        status,
        notes: providerNotes.trim() || undefined,
      });
      setProviderNotes("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || e.message || "Failed to update provider review.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveDocRevision = async () => {
    if (!editingDoc || !onReviseDocument) return;
    setLoadingAction("revise_doc");
    try {
      await onReviseDocument(editingDoc.id, { contentMarkdown: editingMarkdown });
      setEditingDoc(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || e.message || "Failed to revise document.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrimaryApprove = async () => {
    setActionError(null);
    setLoadingAction("approve");
    try {
      await onApprove();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || e.message || "Failed to approve buyout legal package.");
    } finally {
      setLoadingAction(null);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "IP_RIGHTS":
        return <Scale className="w-4 h-4 text-primary" />;
      case "SOURCE_CODE":
        return <FileCode className="w-4 h-4 text-primary" />;
      case "DOMAIN":
        return <Globe className="w-4 h-4 text-primary" />;
      case "BRAND_ASSETS":
        return <Sparkles className="w-4 h-4 text-primary" />;
      default:
        return <Briefcase className="w-4 h-4 text-primary" />;
    }
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE_IN_PLATFORM":
        return (
          <Badge className="bg-success-light text-success-strong border border-success-strong/30 text-xs py-0.5 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Available in Platform
          </Badge>
        );
      case "EXTERNAL_TRANSFER_REQUIRED":
        return (
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs py-0.5 font-semibold">
            <Globe className="w-3 h-3 mr-1" /> External Transfer (DNS/Registrar)
          </Badge>
        );
      case "MISSING":
        return (
          <Badge className="bg-warning/10 text-warning border border-warning/30 text-xs py-0.5 font-semibold">
            <AlertTriangle className="w-3 h-3 mr-1" /> Verification Needed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border border-border text-xs py-0.5">
            N/A
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* 1. Header & Stage Breadcrumb */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
                Full Buyout • Stage 2
              </Badge>
              <Badge className="bg-muted text-muted-foreground border border-border text-xs">
                Package V{pkg.version}
              </Badge>
              <Badge
                className={
                  pkg.status === "APPROVED"
                    ? "bg-success-light text-success-strong border-success-strong/30"
                    : pkg.status === "CHANGES_REQUESTED"
                    ? "bg-warning/10 text-warning border-warning/30"
                    : "bg-primary/10 text-primary border-primary/20"
                }
              >
                {pkg.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Legal &amp; Asset Transfer Review
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review transfer schedules and contracts generated strictly from accepted commercial buyout terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Stage Header */}
        <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground overflow-x-auto py-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-success-strong">Terms Agreed ✓</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-bold text-primary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Legal &amp; Transfer Review
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Sign</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Payment</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Handover</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="text-[11px] text-muted-foreground shrink-0">
            Binding: Revision #{pkg.acceptedBuyoutRevisionNumber} • Manifest V{pkg.assetManifestVersion}
          </div>
        </div>
      </div>

      {/* 2. Commercial Terms Summary (LOCKED READ-ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-background border border-border p-3.5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Agreed Purchase Price</span>
            <span title="Locked by accepted commercial agreement">
              <Lock className="w-3.5 h-3.5 text-primary" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              €{pkg.purchasePrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">EUR</span>
          </div>
          <div className="text-[10px] text-success-strong mt-1 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3" /> Locked &amp; contractually binding
          </div>
        </Card>

        <Card className="bg-background border border-border p-3.5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Handover Duration</span>
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {pkg.handoverPeriodWeeks} {pkg.handoverPeriodWeeks === 1 ? "Week" : "Weeks"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Operational handover schedule
          </div>
        </Card>

        <Card className="bg-background border border-border p-3.5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Transition Support</span>
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {pkg.transitionSupportWeeks > 0
              ? `${pkg.transitionSupportWeeks} Weeks`
              : "None"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Post-closing advisory support
          </div>
        </Card>

        <Card className="bg-background border border-border p-3.5 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Legal Review Support</span>
            <Scale className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-foreground truncate">
              {hasAssignedProvider ? (pkg.assignedLegalProviderName || "Assigned Provider") : "Optional (Not Invited)"}
            </div>
            <Badge
              className={`mt-1 text-[10px] py-0.2 ${
                !hasAssignedProvider
                  ? "bg-muted text-muted-foreground border-border"
                  : pkg.providerReviewStatus === "REVIEW_COMPLETE"
                  ? "bg-success-light text-success-strong border-success-strong/30"
                  : pkg.providerReviewStatus === "CHANGES_REQUESTED"
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              {!hasAssignedProvider
                ? "Optional — Not invited"
                : pkg.providerReviewStatus === "REVIEW_COMPLETE"
                ? "Review Complete"
                : "Required before signing"}
            </Badge>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {pkg.jurisdiction || "Standard Commercial"}
          </div>
        </Card>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3 text-destructive text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">{actionError}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionError(null)}
            className="text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Blocker Alert Banner */}
      {hasMissingBlockers && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3 text-warning text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning">Legal Review Blocker Detected</div>
            <p className="text-xs mt-0.5">
              {(pkg.blockers || []).join(" ")}
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Accepted assets cannot be removed from the deal. Please verify or upload missing asset references before final legal approval.
            </p>
          </div>
        </div>
      )}
      {/* 3. Asset Transfer Manifest Checklist */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Asset Transfer Manifest</h3>
            <Badge className="bg-muted text-muted-foreground border border-border text-xs">
              V{pkg.assetManifestVersion}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {pkg.assetManifest?.assets?.length || 0} Assets Contractually Included
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pkg.assetManifest?.assets?.map((asset, idx) => (
            <div
              key={idx}
              className="bg-background border border-border rounded-lg p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-muted border border-border">
                    {getAssetIcon(asset.assetType)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{asset.displayName}</h4>
                    <span className="text-[11px] text-muted-foreground block">{asset.assetType}</span>
                  </div>
                </div>
                {getAvailabilityBadge(asset.availabilityStatus)}
              </div>

              {asset.description && (
                <p className="text-[11px] text-muted-foreground mt-2 bg-muted/40 p-2 rounded border border-border">
                  {asset.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Legal Documents Package */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Legal Documents &amp; Schedules</h3>
            <Badge className="bg-muted text-muted-foreground border border-border text-xs">
              {pkg.documents?.length || 0} Documents
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {(!pkg.assignedLegalProviderId && (isCreator || !isCreator)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteDialog(true)}
                className="text-xs"
              >
                <Scale className="w-3.5 h-3.5 mr-1.5" /> Invite Legal Provider
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangesDialog(true)}
              className="text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Request Wording Changes
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {pkg.documents?.map((doc) => (
            <div
              key={doc.id}
              className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-foreground">{doc.title}</span>
                  <Badge className="bg-muted text-muted-foreground border border-border text-[10px]">
                    V{doc.version}
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground border border-border text-[10px] font-mono">
                    SHA256: {doc.contentHash?.substring(0, 10)}...
                  </Badge>
                  <Badge
                    className={`text-[10px] ${
                      doc.status === "APPROVED"
                        ? "bg-success-light text-success-strong border-success-strong/30"
                        : doc.status === "REVIEWED"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {doc.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>Type: {doc.documentType}</span>
                  <span>•</span>
                  <span>Requirement: {doc.requirementType}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc(doc)}
                  className="text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExplain(doc)}
                  disabled={explainingDocId === doc.id}
                  className="text-xs"
                >
                  {explainingDocId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                  )}
                  Explain Simply
                </Button>
                {isAssignedProvider && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDoc(doc);
                      setEditingMarkdown(doc.contentMarkdown);
                    }}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Provider Review Action Area (If assigned provider is logged in) */}
      {isAssignedProvider && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Legal Service Provider Review Controls</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            As the assigned verified legal provider, review the generated agreements against the accepted buyout terms. You may add review notes or request wording revisions. Commercial terms cannot be modified.
          </p>
          <div className="space-y-3">
            <textarea
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder="Add legal review notes, recommendations or feedback..."
              rows={3}
              className="w-full rounded-lg bg-background border border-border p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleCompleteProviderReview("REVIEW_COMPLETE")}
                disabled={loadingAction === "provider_REVIEW_COMPLETE"}
                className="text-xs"
              >
                {loadingAction === "provider_REVIEW_COMPLETE" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                )}
                Mark Review Complete (Approve Wording)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCompleteProviderReview("CHANGES_REQUESTED")}
                disabled={loadingAction === "provider_CHANGES_REQUESTED"}
                className="text-xs"
              >
                {loadingAction === "provider_CHANGES_REQUESTED" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Request Legal Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bilateral Approval Status & Action */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-2 w-full md:w-auto">
          <h4 className="text-sm font-semibold text-foreground">Stage Completion Checklist</h4>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  !hasMissingBlockers ? "bg-success-strong" : "bg-warning"
                }`}
              />
              <span className="text-muted-foreground">
                Manifest: {!hasMissingBlockers ? "Complete ✓" : "Verification Needed"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  pkg.creatorApprovedVersion === pkg.version ? "bg-success-strong" : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">
                Creator:{" "}
                {pkg.creatorApprovedVersion === pkg.version
                  ? `Approved V${pkg.version}`
                  : "Pending Approval"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  pkg.entrepreneurApprovedVersion === pkg.version ? "bg-success-strong" : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">
                Buyer:{" "}
                {pkg.entrepreneurApprovedVersion === pkg.version
                  ? `Approved V${pkg.version}`
                  : "Pending Approval"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  !hasAssignedProvider || isProviderReviewed
                    ? "bg-success-strong"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="text-muted-foreground">
                Legal Provider:{" "}
                {!hasAssignedProvider
                  ? "Optional"
                  : isProviderReviewed
                  ? "Approved"
                  : "Pending Review"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isMyApproved ? (
            <Badge className="bg-success-light text-success-strong border border-success-strong/30 px-4 py-2 text-sm flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-success-strong" /> You Approved V{pkg.version}
            </Badge>
          ) : (
            <Button
              size="lg"
              variant="default"
              onClick={handlePrimaryApprove}
              disabled={
                loadingAction === "approve" ||
                hasMissingBlockers
              }
              className="font-semibold px-6 text-sm"
            >
              {loadingAction === "approve" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Approve Buyout Legal Terms (V{pkg.version})
            </Button>
          )}
        </div>
      </div>

      {/* Modal: Document Viewer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-card border border-border rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedDoc.title}</h3>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  SHA-256 Hash: {selectedDoc.contentHash}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-lg bg-background border border-border font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedDoc.contentMarkdown}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Explanation */}
      {explainDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Plain Language Explanation</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExplainDoc(null)}
              >
                ✕
              </Button>
            </div>
            <div className="my-4 space-y-3">
              <div className="text-xs font-semibold text-foreground">{explainDoc.title}</div>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
                {explainDoc.explanation}
              </p>
              <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>{explainDoc.disclaimer}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setExplainDoc(null)}
                className="text-xs"
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Changes Dialog */}
      {showChangesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">Request Legal Wording Changes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangesDialog(false)}
              >
                ✕
              </Button>
            </div>
            <div className="my-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Explain the contractual or wording adjustments required. Submitting this creates revision V{pkg.version + 1} and resets approvals.
              </p>
              <div className="p-2 rounded bg-warning/10 border border-warning/30 text-[11px] text-warning flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Commercial terms (Price, Handover, Included Assets) cannot be altered here and require commercial renegotiation.</span>
              </div>
              <textarea
                value={changesComment}
                onChange={(e) => setChangesComment(e.target.value)}
                placeholder="Detail the requested legal wording modifications..."
                rows={4}
                className="w-full rounded-lg bg-background border border-border p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {changesError && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                  {changesError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangesDialog(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSendChanges}
                disabled={loadingAction === "changes" || !changesComment.trim()}
                className="text-xs"
              >
                {loadingAction === "changes" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite Legal Provider */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">Assign Legal Service Provider</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteDialog(false)}
              >
                ✕
              </Button>
            </div>
            <div className="my-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter the User ID or Provider ID of a verified legal partner to review this asset transfer package.
              </p>
              <input
                type="text"
                value={inviteProviderId}
                onChange={(e) => setInviteProviderId(e.target.value)}
                placeholder="Provider User ID / Provider ID"
                className="w-full rounded-lg bg-background border border-border p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteDialog(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleInviteSubmit}
                disabled={loadingAction === "invite" || !inviteProviderId.trim()}
                className="text-xs"
              >
                {loadingAction === "invite" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                Assign Provider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Document Editor for Assigned Provider */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-card border border-border rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground text-base">Edit Document Wording: {editingDoc.title}</h3>
                <span className="text-xs text-muted-foreground font-mono">Document ID: {editingDoc.id}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDoc(null)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 my-4 flex flex-col gap-2">
              <textarea
                value={editingMarkdown}
                onChange={(e) => setEditingMarkdown(e.target.value)}
                rows={14}
                className="w-full flex-1 rounded-lg bg-background border border-border p-4 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDoc(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveDocRevision}
                disabled={loadingAction === "revise_doc"}
                className="text-xs"
              >
                {loadingAction === "revise_doc" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                Save Document Revision
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

