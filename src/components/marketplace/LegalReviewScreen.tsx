import React, { useState } from "react";
import {
  LegalReviewPackage,
  LegalDocument,
  InviteLegalProviderRequest,
  RequestLegalChangesRequest,
  SetJurisdictionRequest,
  ExplainLegalDocumentResponse,
  marketplaceProjectsApi,
} from "@/lib/api-marketplace-projects";
import { DealStageHeader } from "./DealStageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Scale,
  ShieldCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserCheck,
  Globe,
  Building2,
  FileEdit,
  RotateCcw,
  Eye,
  Info,
  ChevronRight,
  ExternalLink,
  Bot,
  HelpCircle,
  Clock,
  Send,
} from "lucide-react";

interface LegalReviewScreenProps {
  dealId: string;
  pkg: LegalReviewPackage;
  currentUserId?: string;
  isCreator?: boolean;
  onApprove: () => Promise<void>;
  onRequestChanges: (req: RequestLegalChangesRequest) => Promise<void>;
  onInviteProvider: (req: InviteLegalProviderRequest) => Promise<void>;
  onSetJurisdiction: (req: SetJurisdictionRequest) => Promise<void>;
  onProceedToSigning?: () => void;
  className?: string;
}

export const LegalReviewScreen: React.FC<LegalReviewScreenProps> = ({
  dealId,
  pkg,
  currentUserId,
  isCreator = false,
  onApprove,
  onRequestChanges,
  onInviteProvider,
  onSetJurisdiction,
  onProceedToSigning,
  className = "",
}) => {
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [explainingDoc, setExplainingDoc] = useState<LegalDocument | null>(null);
  const [aiExplanation, setAiExplanation] = useState<ExplainLegalDocumentResponse | null>(null);
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);

  const [isInvitingProvider, setIsInvitingProvider] = useState(false);
  const [providerIdInput, setProviderIdInput] = useState("");
  const [isSettingJurisdiction, setIsSettingJurisdiction] = useState(false);
  const [jurisdictionInput, setJurisdictionInput] = useState(pkg.jurisdiction || "");

  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");
  const [selectedChangeDocId, setSelectedChangeDocId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Approval state checks
  const userApprovedCurrent = isCreator
    ? pkg.creatorApprovedVersion === pkg.version
    : pkg.entrepreneurApprovedVersion === pkg.version;

  const counterpartyApprovedCurrent = isCreator
    ? pkg.entrepreneurApprovedVersion === pkg.version
    : pkg.creatorApprovedVersion === pkg.version;

  const isProviderReviewComplete = pkg.providerReviewStatus === "REVIEW_COMPLETE";
  const hasJurisdiction = Boolean(pkg.jurisdiction && pkg.jurisdiction.trim().length > 0);

  const isFullyApproved =
    pkg.status === "APPROVED" ||
    (pkg.creatorApprovedVersion === pkg.version &&
      pkg.entrepreneurApprovedVersion === pkg.version &&
      isProviderReviewComplete);

  const handleExplain = async (doc: LegalDocument) => {
    setExplainingDoc(doc);
    setIsExplainingLoading(true);
    setErrorMsg(null);
    try {
      const res = await marketplaceProjectsApi.explainLegalDocument(dealId, doc.id);
      setAiExplanation(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || "Failed to generate AI explanation.");
    } finally {
      setIsExplainingLoading(false);
    }
  };

  const handleInviteSubmit = async () => {
    if (!providerIdInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onInviteProvider({ providerId: providerIdInput.trim() });
      setIsInvitingProvider(false);
      setProviderIdInput("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || "Failed to invite Legal Service Provider.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJurisdictionSubmit = async () => {
    if (!jurisdictionInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSetJurisdiction({ jurisdiction: jurisdictionInput.trim() });
      setIsSettingJurisdiction(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || "Failed to update jurisdiction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChangesSubmit = async () => {
    if (!changeFeedback.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onRequestChanges({
        documentId: selectedChangeDocId || undefined,
        feedback: changeFeedback.trim(),
      });
      setIsRequestingChanges(false);
      setChangeFeedback("");
      setSelectedChangeDocId("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || "Failed to submit change request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onApprove();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message || e.message || "Failed to approve legal package.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 text-foreground ${className}`}>
      {/* 1. Header Pipeline */}
      <DealStageHeader currentStage="LEGAL_REVIEW_PENDING" />

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm">{errorMsg}</div>
        </div>
      )}

      {/* 2. Top Summary & Context Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deal Context Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Venture Context
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Package V{pkg.version}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground truncate">{pkg.projectName}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Creator: <span className="text-foreground">{pkg.creatorName}</span> • Partner:{" "}
              <span className="text-foreground">{pkg.entrepreneurName}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Company Context:</span>
            <span className="font-medium text-foreground">
              {pkg.companyContext === "CASE_B_EXISTING_COMPANY"
                ? `Existing Entity (${pkg.companyName || "Incorporated"})`
                : "Pre-incorporation (Formation Ready)"}
            </span>
          </div>
        </div>

        {/* Governing Jurisdiction Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Governing Jurisdiction
              </span>
              <Globe className="w-4 h-4 text-primary" />
            </div>
            {hasJurisdiction ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-foreground">{pkg.jurisdiction}</span>
                <button
                  onClick={() => {
                    setJurisdictionInput(pkg.jurisdiction || "");
                    setIsSettingJurisdiction(true);
                  }}
                  className="text-xs text-primary hover:underline ml-2"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning/10 border border-warning/30 text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Jurisdiction Required
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Required before final legal approval can be given.
                </p>
              </div>
            )}
          </div>
          {!hasJurisdiction && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSettingJurisdiction(true)}
              className="mt-4 w-full bg-warning/10 border-warning/30 text-warning hover:bg-warning/20"
            >
              Specify Jurisdiction
            </Button>
          )}
        </div>

        {/* Verified Legal Provider Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Human Legal Review
              </span>
              <Scale className="w-4 h-4 text-primary" />
            </div>
            {pkg.assignedLegalProviderName ? (
              <div>
                <div className="flex items-center gap-1.5 text-base font-bold text-foreground">
                  <UserCheck className="w-4 h-4 text-success-strong" />
                  {pkg.assignedLegalProviderName}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      pkg.providerReviewStatus === "REVIEW_COMPLETE"
                        ? "bg-success-light text-success-strong border border-success-strong/30"
                        : pkg.providerReviewStatus === "CHANGES_REQUESTED"
                        ? "bg-destructive/10 text-destructive border border-destructive/30"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {pkg.providerReviewStatus === "REVIEW_COMPLETE"
                      ? "Review Complete"
                      : pkg.providerReviewStatus === "CHANGES_REQUESTED"
                      ? "Changes Requested"
                      : "Review In Progress"}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  No Provider Assigned
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Invite an approved Legal Service Provider to review.
                </p>
              </div>
            )}
          </div>
          {!isFullyApproved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInvitingProvider(true)}
              className="mt-4 w-full bg-background border-border text-foreground hover:bg-muted"
            >
              {pkg.assignedLegalProviderName ? "Reassign Legal Provider" : "Invite Legal Provider"}
            </Button>
          )}
        </div>
      </div>

      {/* 3. Upstream Source Binding Warning/Notice */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span>
            Locked Source Bindings: Offer <strong>Rev #{pkg.acceptedOfferRevisionNumber}</strong> • Role
            Agreement <strong>V{pkg.roleAgreementVersion}</strong> • Cap Table{" "}
            <strong>V{pkg.capTableVersion}</strong> ({pkg.commercialTerms?.equityPercentage}% equity,{" "}
            {pkg.commercialTerms?.vestingMonths}mo vesting / {pkg.commercialTerms?.cliffMonths}mo cliff)
          </span>
        </div>
        <span className="text-muted-foreground/80 font-mono text-[11px]">SHA-256 Verified Immutable Integrity</span>
      </div>

      {/* 4. Categorized Legal Documents List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Legal Review Package Documents ({pkg.documents.length})
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRequestingChanges(true)}
              disabled={isFullyApproved}
              className="bg-background border-border text-foreground hover:bg-muted flex items-center gap-1.5"
            >
              <FileEdit className="w-3.5 h-3.5" />
              Request Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pkg.documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        doc.requirementType === "REQUIRED"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : doc.requirementType === "CONDITIONAL"
                          ? "bg-warning/10 text-warning border border-warning/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc.requirementType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">
                      V{doc.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === "REVIEWED"
                          ? "bg-success-light text-success-strong"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-foreground">{doc.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {doc.contentMarkdown.replace(/[#*`_]/g, "").slice(0, 140)}...
                </p>

                {/* SHA-256 Hash Display */}
                <div className="mt-3 font-mono text-[11px] text-muted-foreground bg-background p-2 rounded-lg border border-border truncate">
                  SHA-256: <span className="text-foreground">{doc.contentHash}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 bg-background border-border text-foreground hover:bg-muted flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Full Document
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExplain(doc)}
                  className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Explain in Simple Language
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Provider Review Feedback Notice */}
      {pkg.providerReviewNotes && (
        <div className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Scale className="w-4 h-4 text-primary" />
            Legal Service Provider Notes ({pkg.assignedLegalProviderName || "Assigned Counsel"})
          </div>
          <p className="text-sm text-foreground bg-background p-3 rounded-xl border border-border">
            {pkg.providerReviewNotes}
          </p>
        </div>
      )}

      {/* 6. Approval & Action Bottom Bar */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Creator:</span>
              {pkg.creatorApprovedVersion === pkg.version ? (
                <span className="flex items-center gap-1 text-success-strong font-semibold text-xs bg-success-light px-2 py-0.5 rounded-full border border-success-strong/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved V{pkg.version}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full">
                  Pending Approval
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Entrepreneur:</span>
              {pkg.entrepreneurApprovedVersion === pkg.version ? (
                <span className="flex items-center gap-1 text-success-strong font-semibold text-xs bg-success-light px-2 py-0.5 rounded-full border border-success-strong/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved V{pkg.version}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full">
                  Pending Approval
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Legal Review:</span>
              {isProviderReviewComplete ? (
                <span className="flex items-center gap-1 text-success-strong font-semibold text-xs bg-success-light px-2 py-0.5 rounded-full border border-success-strong/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Complete
                </span>
              ) : (
                <span className="text-warning font-semibold text-xs bg-warning/10 px-2 py-0.5 rounded-full border border-warning/30">
                  Required
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isFullyApproved
              ? "All legal documents and terms have been mutually approved and verified. Ready to sign."
              : !hasJurisdiction
              ? "Specify governing jurisdiction before legal approval."
              : !isProviderReviewComplete
              ? "A human verified Legal Service Provider must complete the legal review first."
              : userApprovedCurrent
              ? "You have approved the current version. Awaiting partner approval."
              : "Review terms carefully. Approving will lock the legal package for final signature."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isFullyApproved ? (
            <Button
              size="lg"
              onClick={onProceedToSigning}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 shadow-sm flex items-center gap-2"
            >
              Proceed to Sign Agreements
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={
                isSubmitting ||
                userApprovedCurrent ||
                !hasJurisdiction ||
                !isProviderReviewComplete
              }
              onClick={handleApproveSubmit}
              className={`w-full md:w-auto font-bold px-8 flex items-center gap-2 ${
                userApprovedCurrent
                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {userApprovedCurrent ? "Approved by You" : "Approve Legal Terms"}
            </Button>
          )}
        </div>
      </div>

      {/* ======================= MODALS ======================= */}

      {/* Full Document View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedDoc.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Version {selectedDoc.version} • Status: {selectedDoc.status} • SHA-256:{" "}
                  <span className="font-mono text-foreground">{selectedDoc.contentHash.slice(0, 16)}...</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg bg-muted"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-background">
              {selectedDoc.contentMarkdown}
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleExplain(selectedDoc);
                  setSelectedDoc(null);
                }}
                className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              >
                <Bot className="w-4 h-4 mr-1.5" />
                Explain this Document
              </Button>
              <Button size="sm" onClick={() => setSelectedDoc(null)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Plain Language Explanation Modal */}
      {explainingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">AI Plain Language Explanation</h3>
                  <p className="text-xs text-muted-foreground">{explainingDoc.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setExplainingDoc(null);
                  setAiExplanation(null);
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {/* Mandatory Disclaimer Badge */}
              <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>AI-generated explanation — not legal advice.</strong> A verified human Legal
                  Service Provider review is required before deal execution.
                </div>
              </div>

              {isExplainingLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Analyzing legal clauses against deal parameters...</p>
                </div>
              ) : aiExplanation ? (
                <div className="flex flex-col gap-4">
                  {/* Key Takeaways */}
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-success-strong mb-2">
                      Key Takeaways for You
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground">
                      {aiExplanation.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx}>{takeaway}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Markdown Explanation Body */}
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {aiExplanation.explanationMarkdown}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setExplainingDoc(null);
                  setAiExplanation(null);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Legal Service Provider Modal */}
      {isInvitingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                Invite Legal Service Provider
              </h3>
              <button
                onClick={() => setIsInvitingProvider(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Enter the User ID or Profile ID of a verified Legal Service Provider. The provider will
                receive scoped access to review the legal documents.
              </p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Legal Provider ID
                </label>
                <Input
                  value={providerIdInput}
                  onChange={(e) => setProviderIdInput(e.target.value)}
                  placeholder="e.g. 44444444-4444-4444-4444-444444444444"
                  className="bg-background border-border text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsInvitingProvider(false)} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting || !providerIdInput.trim()}
                onClick={handleInviteSubmit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? "Inviting..." : "Send Review Invitation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Set Jurisdiction Modal */}
      {isSettingJurisdiction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Specify Governing Jurisdiction
              </h3>
              <button
                onClick={() => setIsSettingJurisdiction(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Specify the governing jurisdiction for the partnership and co-founder agreements (e.g.,
                Delaware, USA; California, USA; London, UK; Singapore).
              </p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Jurisdiction Name
                </label>
                <Input
                  value={jurisdictionInput}
                  onChange={(e) => setJurisdictionInput(e.target.value)}
                  placeholder="e.g. Delaware, USA"
                  className="bg-background border-border text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsSettingJurisdiction(false)} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting || !jurisdictionInput.trim()}
                onClick={handleJurisdictionSubmit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? "Saving..." : "Save Jurisdiction"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {isRequestingChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-warning" />
                Request Legal Package Changes
              </h3>
              <button
                onClick={() => setIsRequestingChanges(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Requesting changes creates a new package revision (V{pkg.version + 1}) and resets all
                prior approvals.
              </p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Target Document (Optional)
                </label>
                <select
                  value={selectedChangeDocId}
                  onChange={(e) => setSelectedChangeDocId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-background border border-border text-sm text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Documents / General Terms</option>
                  {pkg.documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Change Feedback / Notes
                </label>
                <textarea
                  value={changeFeedback}
                  onChange={(e) => setChangeFeedback(e.target.value)}
                  placeholder="Specify requested modifications..."
                  rows={4}
                  className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsRequestingChanges(false)} className="text-muted-foreground hover:text-foreground">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting || !changeFeedback.trim()}
                onClick={handleRequestChangesSubmit}
                className="bg-destructive hover:bg-destructive/90 text-primary-foreground font-bold"
              >
                {isSubmitting ? "Submitting..." : "Submit Change Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalReviewScreen;

