'use client';

import React, { useState, useEffect, useCallback } from 'react';
import marketplaceProjectsApi, {
  BuyoutSigningPackage,
  SigningDocumentRef,
  FinalBuyoutSignedPackage,
} from '@/lib/api-marketplace-projects';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  Edit3,
  Lock,
  ArrowRight,
  Copy,
  Check,
  Scale,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface BuyoutAgreementSigningScreenProps {
  dealId: string;
  currentUserId?: string;
  isCreator?: boolean;
  onCompleted?: (signingPkg: BuyoutSigningPackage) => void;
  onNavigateToClosing?: () => void;
}

export const BuyoutAgreementSigningScreen: React.FC<BuyoutAgreementSigningScreenProps> = ({
  dealId,
  currentUserId,
  isCreator = true,
  onCompleted,
  onNavigateToClosing,
}) => {
  const [pkg, setPkg] = useState<BuyoutSigningPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Signing state
  const [consentChecked, setConsentChecked] = useState(false);
  const [signing, setSigning] = useState(false);

  // Document view modal state
  const [selectedDoc, setSelectedDoc] = useState<SigningDocumentRef | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Request changes modal state
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState('');
  const [submittingChanges, setSubmittingChanges] = useState(false);

  // Final package view
  const [finalPackage, setFinalPackage] = useState<FinalBuyoutSignedPackage | null>(null);
  const [loadingFinalPkg, setLoadingFinalPkg] = useState(false);

  const loadSigningPackage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceProjectsApi.getBuyoutSigningPackage(dealId);
      setPkg(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load buyout signing package.');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    loadSigningPackage();
  }, [loadSigningPackage]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSign = async () => {
    if (!pkg || !consentChecked) return;
    try {
      setSigning(true);
      setError(null);
      setSuccessMsg(null);

      const updated = await marketplaceProjectsApi.signBuyoutAgreement(dealId, {
        manifestHash: pkg.manifestHash,
        expectedLegalPackageVersion: pkg.buyoutLegalPackageVersion,
        consentStatement:
          'I confirm that I reviewed and agree to the Full Buyout agreements, asset transfer schedule, purchase price and handover terms listed above.',
      });

      setPkg(updated);
      if (updated.status === 'AGREEMENT_SIGNED') {
        setSuccessMsg('Both parties have signed the Full Buyout agreement! Deal progressed to Closing.');
        if (onCompleted) onCompleted(updated);
      } else {
        setSuccessMsg('Your signature was recorded successfully. Waiting for counterparty signature.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to sign buyout agreement.');
    } finally {
      setSigning(false);
    }
  };

  const handleRequestLegalChanges = async () => {
    if (!changeFeedback.trim()) return;
    try {
      setSubmittingChanges(true);
      setError(null);
      await marketplaceProjectsApi.requestBuyoutSigningLegalChange(dealId, {
        feedback: changeFeedback.trim(),
        requestedChangeType: 'LEGAL_WORDING',
      });
      setShowChangesModal(false);
      setSuccessMsg('Legal change requested. Deal returned to Legal Review.');
      await loadSigningPackage();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to submit legal change request.');
    } finally {
      setSubmittingChanges(false);
    }
  };

  const handleLoadFinalPackage = async () => {
    try {
      setLoadingFinalPkg(true);
      const data = await marketplaceProjectsApi.getFinalBuyoutSignedPackage(dealId);
      setFinalPackage(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load finalized agreement package.');
    } finally {
      setLoadingFinalPkg(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading Full Buyout Agreement Signing Package...</p>
      </Card>
    );
  }

  if (error && !pkg) {
    const errorTitle =
      error.toLowerCase().includes('stage') || error.toLowerCase().includes('not available')
        ? 'Agreement Signing Not Available Yet'
        : error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('authorized')
        ? 'You are not authorized to sign this agreement'
        : 'Signing Package Unavailable';

    return (
      <Card className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-foreground shadow-sm">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{errorTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={loadSigningPackage}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </Card>
    );
  }

  if (!pkg) return null;

  const isCreatorSigned = !!pkg.creatorSignature;
  const isBuyerSigned = !!pkg.entrepreneurSignature;
  const isFullySigned = pkg.status === 'AGREEMENT_SIGNED';
  const hasUserSigned = isCreator ? isCreatorSigned : isBuyerSigned;

  return (
    <div className="space-y-6 text-foreground">
      {/* 1. Header & Stage Breadcrumb */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider">
                Full Buyout • Stage 3 of 6
              </Badge>
              <Badge variant="outline" className="text-xs">
                Package V{pkg.buyoutLegalPackageVersion}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  isFullySigned
                    ? 'bg-success-light text-success-strong border-success-strong/30 font-bold'
                    : 'bg-warning/10 text-warning border-warning/30 font-semibold'
                }`}
              >
                {pkg.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Full Buyout Agreement Signing
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and electronically execute the transfer agreements and asset manifests generated from accepted terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSigningPackage}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stage Header */}
        <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground overflow-x-auto py-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-success-strong flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Offer
            </span>
            <span>→</span>
            <span className="font-semibold text-success-strong flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Legal
            </span>
            <span>→</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                isFullySigned ? 'text-success-strong' : 'text-primary'
              }`}
            >
              {isFullySigned ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              {isFullySigned ? 'Sign ✓' : 'Sign ●'}
            </span>
            <span>→</span>
            <span className={isFullySigned ? 'font-bold text-warning flex items-center gap-1' : ''}>
              Closing
            </span>
            <span>→</span>
            <span>Handover</span>
            <span>→</span>
            <span>Completed</span>
          </div>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-success-light border border-success-strong/30 rounded-xl text-xs text-success-strong flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Commercial Terms Summary (LOCKED READ-ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Agreed Purchase Price</span>
            <span title="Locked by accepted commercial agreement">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              €{pkg.purchasePrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">EUR</span>
          </div>
          <div className="text-[10px] text-success-strong mt-1 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3" /> Agreed Commercial Term 🔒
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Handover Duration</span>
            <span title="Locked handover timeline">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{pkg.handoverPeriodWeeks}</span>
            <span className="text-xs text-muted-foreground">Weeks</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Asset delivery protocol
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Transition Advisory</span>
            <span title="Locked transition terms">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{pkg.transitionSupportWeeks}</span>
            <span className="text-xs text-muted-foreground">Weeks</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Post-closing advisory support
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Legal Provider</span>
            <Scale className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-foreground truncate">
              {pkg.assignedLegalProviderName || 'Global Tech Legal LLP'}
            </div>
            <div className="text-[10px] text-success-strong mt-0.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Review Complete
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Included Assets in Sale */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Assets Included in Sale</h3>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            Manifest V{pkg.assetManifestVersion} 🔒
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pkg.assetManifest?.assets && pkg.assetManifest.assets.length > 0 ? (
            pkg.assetManifest.assets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-background border border-border rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-foreground">{asset.displayName}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {asset.assetType.replace(/_/g, ' ')}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    asset.availabilityStatus === 'AVAILABLE_IN_PLATFORM'
                      ? 'bg-success-light text-success-strong border-success-strong/30'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
                  {asset.availabilityStatus === 'AVAILABLE_IN_PLATFORM'
                    ? 'Platform Vault'
                    : 'External Transfer'}
                </Badge>
              </div>
            ))
          ) : (
            pkg.includedAssets.map((assetName, idx) => (
              <div
                key={idx}
                className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="text-xs font-semibold text-foreground">{assetName}</div>
                <Badge variant="outline" className="text-[10px] bg-success-light text-success-strong border-success-strong/30">
                  Included ✓
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 4. Documents You Are Signing */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Documents You Are Signing</h3>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {pkg.documents.length} Legal Agreements
          </Badge>
        </div>

        <div className="space-y-2.5">
          {pkg.documents.map((doc) => (
            <div
              key={doc.documentId}
              className="bg-background border border-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 hover:border-primary/40 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{doc.title}</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                    V{doc.documentVersion}
                  </Badge>
                  <Badge className="bg-success-light text-success-strong border border-success-strong/30 text-[10px]">
                    Approved ✓
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>SHA-256: {doc.documentHash.substring(0, 16)}...</span>
                  <button
                    onClick={() => handleCopy(doc.documentHash, doc.documentId)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy full SHA-256 fingerprint"
                  >
                    {copiedHash === doc.documentId ? (
                      <Check className="w-3 h-3 text-success-strong" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDoc(doc)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Deterministic Manifest Fingerprint */}
      <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            Canonical Buyout Manifest Fingerprint
          </div>
          <div className="text-[11px] font-mono text-muted-foreground select-all break-all">
            {pkg.manifestHash}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(pkg.manifestHash, 'manifest')}
          className="h-8 text-xs gap-1.5"
        >
          {copiedHash === 'manifest' ? (
            <>
              <Check className="w-3.5 h-3.5 text-success-strong" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy Manifest Hash
            </>
          )}
        </Button>
      </div>

      {/* 6. Signatures & Execution Section */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Signatures &amp; Execution Status</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Platform electronic signature with tamper-evident audit record.
          </span>
        </div>

        {/* Parties status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creator Status */}
          <div
            className={`p-4 rounded-xl border ${
              isCreatorSigned
                ? 'bg-success-light/40 border-success-strong/30'
                : 'bg-background border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Creator / Seller</span>
              {isCreatorSigned ? (
                <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[10px]">
                  Signed ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                  Pending Signature
                </Badge>
              )}
            </div>
            <div className="text-xs text-foreground font-medium">{pkg.creatorName || 'Creator'}</div>
            {isCreatorSigned && pkg.creatorSignature && (
              <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
                <div>Signed: {new Date(pkg.creatorSignature.signedAt).toLocaleString()}</div>
                <div className="truncate">Sig: {pkg.creatorSignature.signatureHash.substring(0, 20)}...</div>
              </div>
            )}
          </div>

          {/* Buyer Status */}
          <div
            className={`p-4 rounded-xl border ${
              isBuyerSigned
                ? 'bg-success-light/40 border-success-strong/30'
                : 'bg-background border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Buyer / Entrepreneur</span>
              {isBuyerSigned ? (
                <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[10px]">
                  Signed ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                  Pending Signature
                </Badge>
              )}
            </div>
            <div className="text-xs text-foreground font-medium">{pkg.entrepreneurName || 'Entrepreneur'}</div>
            {isBuyerSigned && pkg.entrepreneurSignature && (
              <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5 border-t border-border pt-2 font-mono">
                <div>Signed: {new Date(pkg.entrepreneurSignature.signedAt).toLocaleString()}</div>
                <div className="truncate">Sig: {pkg.entrepreneurSignature.signatureHash.substring(0, 20)}...</div>
              </div>
            )}
          </div>
        </div>

        {/* Signing Controls */}
        {!hasUserSigned && !isFullySigned && (
          <div className="pt-3 border-t border-border space-y-4">
            <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-xl border border-border">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
              />
              <label htmlFor="consent-checkbox" className="text-xs text-foreground leading-relaxed cursor-pointer">
                I confirm that I reviewed and agree to the Full Buyout agreements, asset transfer schedule, purchase price and handover terms listed above.
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangesModal(true)}
                className="text-xs gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Request Legal Change
              </Button>

              <Button
                size="sm"
                onClick={handleSign}
                disabled={!consentChecked || signing}
                className="font-bold text-xs gap-1.5 shadow-sm"
              >
                {signing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Signing Buyout Agreement...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Sign Buyout Agreement
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {hasUserSigned && !isFullySigned && (
          <div className="p-4 bg-success-light border border-success-strong/30 rounded-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-success-strong font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> You have signed this Buyout Agreement
            </div>
            <p className="text-xs text-muted-foreground">
              Waiting for the other party to complete execution. Once both signatures are recorded, the deal will advance to Closing.
            </p>
          </div>
        )}

        {/* If Fully Executed */}
        {isFullySigned && (
          <div className="pt-3 border-t border-border space-y-4">
            <Card className="p-5 bg-success-light border border-success-strong/30 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-success-strong font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" /> Full Buyout Agreement Fully Executed
                </div>
                <Badge className="bg-success-light text-success-strong border-success-strong/30 text-xs font-bold">
                  AGREEMENT SIGNED ✓
                </Badge>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Both parties have electronically executed the Buyout Agreement and Transfer Schedules. All signing fingerprints have been immutably committed to the deal audit log.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoadFinalPackage}
                  disabled={loadingFinalPkg}
                  className="text-xs gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {loadingFinalPkg ? 'Loading Package...' : 'View Final Executed Package'}
                </Button>

                {onNavigateToClosing && (
                  <Button
                    size="sm"
                    onClick={onNavigateToClosing}
                    className="text-xs font-bold gap-1.5"
                  >
                    Proceed to Closing <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* 7. Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="rounded-2xl border border-border bg-card w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-foreground">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">{selectedDoc.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Version {selectedDoc.documentVersion} · SHA-256: {selectedDoc.documentHash.substring(0, 16)}...
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </Button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-background">
              {selectedDoc.contentMarkdown}
            </div>
          </Card>
        </div>
      )}

      {/* 8. Request Legal Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="rounded-2xl border border-border bg-card w-full max-w-lg p-5 space-y-4 shadow-2xl text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-warning" /> Request Legal Wording Change
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChangesModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Submitting a legal change request will invalidate the current signing package and return the deal to Legal Review. Commercial terms (Price: €{pkg.purchasePrice.toLocaleString()}, Handover timeline) remain locked and cannot be altered here.
            </p>

            <Textarea
              placeholder="Describe the requested legal wording modifications or clarifications..."
              value={changeFeedback}
              onChange={(e) => setChangeFeedback(e.target.value)}
              className="bg-background border-border text-foreground text-xs min-h-[100px]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangesModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestLegalChanges}
                disabled={!changeFeedback.trim() || submittingChanges}
                className="text-xs font-bold"
              >
                {submittingChanges ? 'Submitting...' : 'Confirm & Invalidate Package'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 9. Final Executed Package Modal */}
      {finalPackage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="rounded-2xl border border-border bg-card w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl p-5 space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-strong" /> Final Buyout Agreement Package
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Audit Ref: {finalPackage.auditReference}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFinalPackage(null)}
              >
                Close
              </Button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-foreground">
              <div className="grid grid-cols-2 gap-3 bg-background p-3 rounded-lg border border-border">
                <div>
                  <span className="text-muted-foreground">Purchase Price:</span>{' '}
                  <strong className="text-foreground">€{finalPackage.purchasePrice.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Handover:</span>{' '}
                  <strong className="text-foreground">{finalPackage.handoverPeriodWeeks} Weeks</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Legal Package:</span>{' '}
                  <strong className="text-foreground">V{finalPackage.legalPackageVersion}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Asset Manifest:</span>{' '}
                  <strong className="text-foreground">V{finalPackage.assetManifestVersion}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-semibold">Manifest Hash:</span>
                <div className="p-2 bg-background font-mono text-[11px] rounded border border-border break-all select-all">
                  {finalPackage.manifestHash}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-foreground font-semibold">Executed Signatures</span>
                {finalPackage.creatorSignature && (
                  <div className="bg-background p-2.5 rounded border border-border text-[11px] space-y-0.5">
                    <div className="font-bold text-foreground">
                      Creator: {finalPackage.creatorSignature.signerName} ({finalPackage.creatorSignature.signerRole})
                    </div>
                    <div className="text-muted-foreground">
                      Signed At: {new Date(finalPackage.creatorSignature.signedAt).toLocaleString()}
                    </div>
                    <div className="font-mono text-muted-foreground truncate">
                      Sig Hash: {finalPackage.creatorSignature.signatureHash}
                    </div>
                  </div>
                )}
                {finalPackage.entrepreneurSignature && (
                  <div className="bg-background p-2.5 rounded border border-border text-[11px] space-y-0.5">
                    <div className="font-bold text-foreground">
                      Buyer: {finalPackage.entrepreneurSignature.signerName} ({finalPackage.entrepreneurSignature.signerRole})
                    </div>
                    <div className="text-muted-foreground">
                      Signed At: {new Date(finalPackage.entrepreneurSignature.signedAt).toLocaleString()}
                    </div>
                    <div className="font-mono text-muted-foreground truncate">
                      Sig Hash: {finalPackage.entrepreneurSignature.signatureHash}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BuyoutAgreementSigningScreen;
