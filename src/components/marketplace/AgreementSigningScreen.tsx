import React, { useState, useEffect } from "react";
import {
  AgreementSigningPackage,
  FinalAgreementPackage,
  SigningDocumentRef,
  SignAgreementRequest,
  RequestSigningLegalChangeRequest,
} from "@/lib/api-marketplace-projects";
import marketplaceProjectsApi from "@/lib/api-marketplace-projects";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Lock,
  Download,
  Eye,
  AlertCircle,
  RefreshCw,
  Edit3,
  Copy,
  Check,
  ArrowRight,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AgreementSigningScreenProps {
  dealId: string;
  currentUserId?: string;
  userRole?: string; // 'Creator' | 'Entrepreneur' | 'Legal' | 'Admin'
  onCompleted?: (pkg: AgreementSigningPackage) => void;
  onNavigateToActivation?: () => void;
}

export const AgreementSigningScreen: React.FC<AgreementSigningScreenProps> = ({
  dealId,
  currentUserId = "",
  userRole = "Creator",
  onCompleted,
  onNavigateToActivation,
}) => {
  const [pkg, setPkg] = useState<AgreementSigningPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState<boolean>(false);
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<SigningDocumentRef | null>(null);
  const [showChangesModal, setShowChangesModal] = useState<boolean>(false);
  const [changeFeedback, setChangeFeedback] = useState<string>("");
  const [submittingChanges, setSubmittingChanges] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [finalPackage, setFinalPackage] = useState<FinalAgreementPackage | null>(null);
  const [loadingFinalPkg, setLoadingFinalPkg] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSigningPackage = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getSigningPackage(dealId);
      setPkg(res);
      if (res.status === "AGREEMENT_SIGNED") {
        onCompleted?.(res);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load agreement signing package.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) {
      loadSigningPackage();
    }
  }, [dealId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadDoc = (doc: SigningDocumentRef) => {
    const element = document.createElement("a");
    const file = new Blob([doc.contentMarkdown || ""], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, "_")}_V${doc.documentVersion}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSign = async () => {
    if (!pkg) return;
    if (!consentChecked) {
      setError("You must review the terms and check the agreement confirmation box to sign.");
      return;
    }

    try {
      setSigning(true);
      setError(null);
      const updated = await marketplaceProjectsApi.signAgreement(dealId, {
        manifestHash: pkg.manifestHash,
        legalPackageVersion: pkg.legalPackageVersion,
        consentStatement: "I confirm that I have reviewed and agree to execute these binding agreements electronically.",
      });
      setPkg(updated);
      setSuccessMsg("Your digital signature has been recorded successfully.");

      if (updated.status === "AGREEMENT_SIGNED") {
        onCompleted?.(updated);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to execute electronic signature.");
    } finally {
      setSigning(false);
    }
  };

  const handleRequestLegalChanges = async () => {
    if (!changeFeedback.trim()) return;

    try {
      setSubmittingChanges(true);
      setError(null);
      await marketplaceProjectsApi.requestSigningLegalChange(dealId, {
        feedback: changeFeedback,
      });
      setShowChangesModal(false);
      setChangeFeedback("");
      await loadSigningPackage();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to request legal changes.");
    } finally {
      setSubmittingChanges(false);
    }
  };

  const handleLoadFinalPackage = async () => {
    try {
      setLoadingFinalPkg(true);
      const res = await marketplaceProjectsApi.getFinalSignedPackage(dealId);
      setFinalPackage(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load final package.");
    } finally {
      setLoadingFinalPkg(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-muted-foreground space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading Agreement Signing Package...</p>
      </div>
    );
  }

  if (error && !pkg) {
    return (
      <Card className="p-6 bg-destructive/10 border-destructive/30 rounded-2xl text-destructive space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <h3 className="font-semibold text-destructive text-base">Unable to Load Signing Package</h3>
        </div>
        <p className="text-sm text-destructive/90">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSigningPackage}
          className="text-xs"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  if (!pkg) return null;

  const isCreator = currentUserId === pkg.creatorId || userRole === "Creator";
  const isEntrepreneur = currentUserId === pkg.entrepreneurId || userRole === "Entrepreneur";
  const isPrincipal = isCreator || isEntrepreneur;
  const isFullySigned = pkg.status === "AGREEMENT_SIGNED";

  const hasMySigned = isCreator
    ? !!pkg.creatorSignature
    : isEntrepreneur
    ? !!pkg.entrepreneurSignature
    : false;

  return (
    <div className="space-y-6 text-foreground max-w-5xl mx-auto p-4 sm:p-6 font-sans" data-testid="agreement-signing-screen">
      {/* HEADER */}
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider">
                Phase 7 • Screen 05
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isFullySigned
                    ? "bg-success-light text-success-strong border-success-strong/30 font-bold"
                    : pkg.status === "INVALIDATED"
                    ? "bg-destructive/10 text-destructive border-destructive/30 font-semibold"
                    : "bg-warning/10 text-warning border-warning/30 font-semibold"
                }`}
              >
                {isFullySigned ? "FULLY SIGNED" : pkg.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 font-syne">
              Agreement Signing
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review approved legal agreements and execute binding digital signatures for{" "}
              <span className="font-semibold text-foreground">{pkg.projectName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSigningPackage}
              className="text-xs gap-1.5 border-border bg-background hover:bg-muted"
              title="Refresh package"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* SUMMARY GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border text-xs">
          <div className="p-3 bg-background rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Creator</span>
            <span className="font-semibold text-foreground">{pkg.creatorName}</span>
          </div>
          <div className="p-3 bg-background rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Entrepreneur</span>
            <span className="font-semibold text-foreground">{pkg.entrepreneurName}</span>
          </div>
          <div className="p-3 bg-background rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Governing Law</span>
            <span className="font-semibold text-foreground">{pkg.jurisdiction || "Delaware, USA"}</span>
          </div>
          <div className="p-3 bg-background rounded-xl border border-border">
            <span className="text-muted-foreground block mb-1">Legal Package</span>
            <span className="font-semibold text-primary">Version V{pkg.legalPackageVersion}</span>
          </div>
        </div>

        {/* MANIFEST FINGERPRINT */}
        <div className="mt-4 p-3 bg-background border border-border rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground font-sans">Package Manifest SHA-256:</span>
            <span className="text-foreground font-semibold truncate max-w-[240px] sm:max-w-md">
              {pkg.manifestHash}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(pkg.manifestHash, "manifest")}
            className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
          >
            {copiedHash === "manifest" ? <Check className="w-3.5 h-3.5 text-success-strong" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedHash === "manifest" ? "Copied" : "Copy Hash"}
          </Button>
        </div>
      </Card>

      {/* MESSAGES */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/30 rounded-xl text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </Card>
      )}
      {successMsg && (
        <Card className="p-4 bg-success-light border-success-strong/30 rounded-xl text-success-strong text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </Card>
      )}

      {/* SIGNATURE STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CREATOR SIGNATURE CARD */}
        <Card className={`p-5 rounded-2xl border transition ${
          pkg.creatorSignature
            ? "bg-success-light/30 border-success-strong/40"
            : "bg-card border-border"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                pkg.creatorSignature ? "bg-success-light text-success-strong border border-success-strong/30" : "bg-muted text-muted-foreground"
              }`}>
                CR
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{pkg.creatorName}</h3>
                <span className="text-[11px] text-muted-foreground">Creator Principal</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs flex items-center gap-1 ${
                pkg.creatorSignature
                  ? "bg-success-light text-success-strong border-success-strong/30 font-bold"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {pkg.creatorSignature ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {pkg.creatorSignature ? "SIGNED" : "PENDING"}
            </Badge>
          </div>

          {pkg.creatorSignature ? (
            <div className="space-y-1.5 text-xs text-foreground font-mono bg-background p-3 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Timestamp:</span>
                <span>{new Date(pkg.creatorSignature.signedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-sans">Signature Hash:</span>
                <span className="truncate max-w-[180px] text-primary" title={pkg.creatorSignature.signatureHash}>
                  {pkg.creatorSignature.signatureHash.slice(0, 16)}...
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Awaiting electronic signature from Creator.</p>
          )}
        </Card>

        {/* ENTREPRENEUR SIGNATURE CARD */}
        <Card className={`p-5 rounded-2xl border transition ${
          pkg.entrepreneurSignature
            ? "bg-success-light/30 border-success-strong/40"
            : "bg-card border-border"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                pkg.entrepreneurSignature ? "bg-success-light text-success-strong border border-success-strong/30" : "bg-muted text-muted-foreground"
              }`}>
                EN
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{pkg.entrepreneurName}</h3>
                <span className="text-[11px] text-muted-foreground">Entrepreneur Principal</span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs flex items-center gap-1 ${
                pkg.entrepreneurSignature
                  ? "bg-success-light text-success-strong border-success-strong/30 font-bold"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {pkg.entrepreneurSignature ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {pkg.entrepreneurSignature ? "SIGNED" : "PENDING"}
            </Badge>
          </div>

          {pkg.entrepreneurSignature ? (
            <div className="space-y-1.5 text-xs text-foreground font-mono bg-background p-3 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Timestamp:</span>
                <span>{new Date(pkg.entrepreneurSignature.signedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-sans">Signature Hash:</span>
                <span className="truncate max-w-[180px] text-primary" title={pkg.entrepreneurSignature.signatureHash}>
                  {pkg.entrepreneurSignature.signatureHash.slice(0, 16)}...
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Awaiting electronic signature from Entrepreneur.</p>
          )}
        </Card>
      </div>

      {/* LEGAL PROVIDER VERIFICATION BADGE */}
      <Card className="rounded-xl p-4 flex items-center justify-between text-xs border-border bg-card">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <span className="font-semibold text-foreground">Legal Review Complete</span>
            <span className="text-muted-foreground block">
              Reviewed and verified by legal counsel{" "}
              <span className="text-foreground font-medium">{pkg.assignedLegalProviderName || "Verified Legal Counsel"}</span>.
            </span>
          </div>
        </div>
        <Badge variant="outline" className="bg-success-light text-success-strong border-success-strong/30 text-[11px] font-bold">
          REVIEW_COMPLETE
        </Badge>
      </Card>

      {/* DOCUMENTS LIST */}
      <Card className="rounded-2xl p-6 border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-syne">
            <FileText className="w-4 h-4 text-primary" />
            Binding Agreements to Execute ({pkg.documents.length})
          </h2>
          <span className="text-xs text-muted-foreground">All required documents must be executed</span>
        </div>

        <div className="divide-y divide-border">
          {pkg.documents.map((doc) => (
            <div key={doc.documentId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground text-sm">{doc.title}</h4>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    V{doc.documentVersion}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase bg-primary/10 text-primary border-primary/20">
                    {doc.requirementType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="font-sans">SHA-256:</span>
                  <span className="truncate max-w-[200px] sm:max-w-xs text-foreground">{doc.documentHash}</span>
                  <button
                    onClick={() => handleCopy(doc.documentHash, doc.documentId)}
                    className="hover:text-foreground p-0.5"
                    title="Copy SHA-256"
                  >
                    {copiedHash === doc.documentId ? <Check className="w-3 h-3 text-success-strong" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc(doc)}
                  className="text-xs gap-1.5 border-border bg-background hover:bg-muted"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDoc(doc)}
                  className="text-xs gap-1.5 border-border bg-background hover:bg-muted"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SIGNING ACTION PANEL */}
      {!isFullySigned ? (
        <Card className="rounded-2xl p-6 border-border bg-card shadow-sm space-y-4">
          {hasMySigned ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-success-strong shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm font-syne">Your Signature is Recorded</h3>
                  <p className="text-xs text-muted-foreground">
                    Awaiting counterparty signature to complete execution. You will be notified once complete.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangesModal(true)}
                className="text-xs"
              >
                Request Changes Instead
              </Button>
            </div>
          ) : isPrincipal ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 font-syne">Execute Your Digital Signature</h3>
                <p className="text-xs text-muted-foreground">
                  By executing this document package, you establish legal agreement under {pkg.jurisdiction || "Delaware, USA"} law.
                </p>
              </div>

              {/* EXPLICIT CONSENT CHECKBOX */}
              <label className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border cursor-pointer hover:border-primary/50 transition">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  data-testid="consent-checkbox"
                />
                <span className="text-xs text-foreground leading-relaxed select-none">
                  I confirm that I have reviewed and agree to the documents listed in this signing package, and agree to execute these binding agreements electronically.
                </span>
              </label>

              {/* NOTICE */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Platform electronic signature with tamper-evident audit record.</span>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangesModal(true)}
                  className="text-xs gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Request Legal Changes
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSign}
                  disabled={!consentChecked || signing}
                  data-testid="sign-agreement-btn"
                  className="gap-2 text-xs font-semibold"
                >
                  {signing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Sign Agreement
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic text-center py-2">
              Viewing in observer / counsel mode. Signatures must be executed directly by Creator or Entrepreneur principals.
            </div>
          )}
        </Card>
      ) : (
        /* FULLY SIGNED COMPLETION BANNER */
        <Card className="rounded-2xl p-6 border-success-strong/30 bg-success-light/20 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-light text-success-strong border border-success-strong/40 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base font-syne">Agreement Fully Executed!</h3>
                <p className="text-xs text-muted-foreground">
                  Both parties have signed identical Manifest SHA-256. Deal stage advanced to ACTIVATION_PENDING.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadFinalPackage}
                disabled={loadingFinalPkg}
                className="text-xs gap-1.5 border-border bg-background hover:bg-muted"
              >
                <Eye className="w-3.5 h-3.5" />
                {finalPackage ? "Package Loaded" : "View Final Package"}
              </Button>

              {onNavigateToActivation && (
                <Button
                  size="sm"
                  onClick={onNavigateToActivation}
                  className="gap-1.5 text-xs font-semibold"
                >
                  Proceed to Activation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* FINAL PACKAGE DETAILS */}
          {finalPackage && (
            <div className="mt-4 p-4 bg-card rounded-xl border border-border text-xs space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Audit Reference:</span>
                <span className="font-mono text-primary font-bold">{finalPackage.auditReference}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Finalized At:</span>
                <span className="text-foreground">{new Date(finalPackage.finalizedAt).toLocaleString()}</span>
              </div>
              <div className="pt-2 text-[11px] text-muted-foreground italic">
                Notice: Real venture shares, legal shareholder registry, and corporate entity updates will be finalized in Screen 06 (Company / Project Activation).
              </div>
            </div>
          )}
        </Card>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="border border-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-base font-syne">{selectedDoc.title}</h3>
                <span className="text-xs text-muted-foreground font-mono">Version V{selectedDoc.documentVersion} • {selectedDoc.documentHash}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDoc(null)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-background flex-1">
              {selectedDoc.contentMarkdown || "# Document preview not available."}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-card">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadDoc(selectedDoc)}
                className="text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Document
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedDoc(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* REQUEST LEGAL CHANGES MODAL */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2 font-syne">
                <Edit3 className="w-4 h-4 text-warning" />
                Request Legal Modifications
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangesModal(false)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Requesting modifications will <strong className="text-warning">invalidate the current signing package</strong>, return the deal to <strong className="text-foreground">Legal Review</strong>, and reset approvals so that all parties review the revised documents.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Feedback &amp; Required Adjustments
              </label>
              <textarea
                rows={4}
                value={changeFeedback}
                onChange={(e) => setChangeFeedback(e.target.value)}
                placeholder="Specify the terms, clauses, or details that need amendment..."
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowChangesModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRequestLegalChanges}
                disabled={!changeFeedback.trim() || submittingChanges}
                className="text-xs gap-1.5"
              >
                {submittingChanges && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Return to Legal Review
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AgreementSigningScreen;
