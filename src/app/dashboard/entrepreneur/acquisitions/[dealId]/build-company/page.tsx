"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import marketplaceProjectsApi, { EquityDeal } from "@/lib/api-marketplace-projects";
import entrepreneurApi, {
  BuildAcquisitionCompanyRequest,
} from "@/lib/api-entrepreneur";
import { useEntrepreneurProgress } from "@/providers/EntrepreneurProgressProvider";
import {
  CompanyPlanningCard,
  OwnershipEntry,
  validateOwnershipSplit,
} from "@/components/company-formation/CompanyPlanningCard";
import {
  FundingPreparationCard,
  UseOfFunds,
} from "@/components/company-formation/FundingPreparationCard";

export default function BuildAcquiredCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.dealId as string;

  const { refreshCompanies, switchCompany } = useEntrepreneurProgress();

  const [deal, setDeal] = useState<EquityDeal | null>(null);
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tagline, setTagline] = useState("");
  const [legalStructure, setLegalStructure] = useState("SAS");
  const [ownership, setOwnership] = useState<OwnershipEntry[]>([
    { holder: "Buyer (You)", percent: 100, isFounder: true, isEsop: false },
  ]);

  // Optional Funding State
  const [totalAsk, setTotalAsk] = useState<number>(0);
  const [useOfFunds, setUseOfFunds] = useState<UseOfFunds[]>([]);
  const [investorTypes, setInvestorTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!dealId) return;
    const loadDeal = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await marketplaceProjectsApi.getDeal(dealId);
        setDeal(res);

        let proj: any = null;
        if (res.ideaId) {
          try {
            proj = await marketplaceProjectsApi.getPrivateProject(res.ideaId);
            setProject(proj);
          } catch {
            // optional
          }
        }

        // Pre-fill from transferred project
        const pName = res.projectName || proj?.projectName || proj?.title || "Acquired Venture";
        const pIndustry = proj?.sector || proj?.targetMarket || "Technology";
        const pTagline = proj?.tagline || proj?.solution || proj?.problem || "";

        setCompanyName(pName);
        setIndustry(pIndustry);
        setTagline(pTagline);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load acquisition deal."
        );
      } finally {
        setLoading(false);
      }
    };
    loadDeal();
  }, [dealId]);

  const handleBuildCompany = async () => {
    if (!dealId) return;

    // Validate ownership
    const { isValid, total } = validateOwnershipSplit(ownership);
    if (!isValid) {
      setError(`Total ownership must equal exactly 100% (currently ${total}%).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: BuildAcquisitionCompanyRequest = {
        companyName: companyName.trim() || undefined,
        industry: industry.trim() || undefined,
        tagline: tagline.trim() || undefined,
        legalStructure,
        ownership,
        totalAsk: totalAsk > 0 ? totalAsk : undefined,
        useOfFunds: useOfFunds.length > 0 ? useOfFunds : undefined,
        investorTypesTargeted: investorTypes.length > 0 ? investorTypes : undefined,
      };

      const result = await entrepreneurApi.buildCompanyFromAcquisition(dealId, payload);

      // Refresh companies context and activate new company
      if (result.companyId) {
        await switchCompany(result.companyId);
        await refreshCompanies();
      }

      // Route directly into Phase 2 Company Verification
      router.push("/dashboard/entrepreneur/phase-2");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to build company from acquisition."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading acquisition details...</p>
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-bold text-foreground">Acquisition Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/entrepreneur/acquisitions/${dealId}`)}
          >
            Back to Acquisition
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href={`/dashboard/entrepreneur/acquisitions/${dealId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Acquisition Workspace
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Build Your Acquired Project
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Full Buyout
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your initial company structure and launch your operating company workspace.
          </p>
        </div>
      </div>

      {/* 1. Transferred Project Review */}
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="text-sm font-bold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Acquired Intellectual Property Summary
          </div>
          <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Ownership Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Project Name
            </span>
            <p className="text-sm font-medium text-foreground">
              {deal?.projectName || project?.title || "Acquired Project"}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Market / Sector
            </span>
            <p className="text-sm font-medium text-foreground">
              {project?.targetMarket || "Technology"}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Purchase Price
            </span>
            <p className="text-sm font-medium text-foreground">
              €{deal?.buyoutSaleRecord?.purchasePrice?.toLocaleString() || deal?.buyoutClosing?.purchasePrice?.toLocaleString() || deal?.buyoutTerms?.purchasePrice?.toLocaleString() || "—"}
            </p>
          </div>
        </div>

        {project?.solution && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Solution Description
            </span>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {project.solution}
            </p>
          </div>
        )}

        {deal?.buyoutSaleRecord?.transferredAssets && deal.buyoutSaleRecord.transferredAssets.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Transferred Assets Included
            </span>
            <div className="flex flex-wrap gap-1.5">
              {deal.buyoutSaleRecord.transferredAssets.map((asset, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs text-foreground font-medium"
                >
                  <ShieldCheck className="h-3 w-3 text-primary" /> {asset}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 2. Company Identity & Planning Form */}
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="text-sm font-bold flex items-center gap-2 border-b border-border/60 pb-3">
          <Building2 className="h-4 w-4 text-primary" /> Operating Company Details
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operating Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter official company name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Industry Sector
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Fintech, SaaS, Health"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tagline / Value Proposition
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A concise summary of your business"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </Card>

      {/* 3. Extracted Company Planning Card (Legal Structure + Ownership) */}
      <CompanyPlanningCard
        type={legalStructure}
        onTypeChange={setLegalStructure}
        ownership={ownership}
        onOwnershipChange={setOwnership}
        title="Legal Structure & Ownership Plan"
        description="Planned initial cap table split (defaults to Buyer 100%)"
        showSaveButton={false}
      />

      {/* 4. Extracted Funding Preparation Card (Optional) */}
      <FundingPreparationCard
        totalAsk={totalAsk}
        onTotalAskChange={setTotalAsk}
        useOfFunds={useOfFunds}
        onUseOfFundsChange={setUseOfFunds}
        investorTypes={investorTypes}
        onInvestorTypesChange={setInvestorTypes}
        title="Seed Funding Preparation"
        description="Set initial funding targets for Phase 5 investor outreach. This step is optional and can be completed or updated later in Phase 5."
        showSaveButton={false}
        isOptional={true}
      />

      {error && (
        <Card className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {/* Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/entrepreneur/acquisitions/${dealId}`)}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          onClick={handleBuildCompany}
          disabled={submitting}
          size="lg"
          className="gap-2 font-bold px-8 shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating Operating Company...
            </>
          ) : (
            <>
              Create Company &amp; Continue to Phase 2 <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
