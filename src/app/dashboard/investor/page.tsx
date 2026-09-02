"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Building2,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { useInvestorStats, useInvestorPortfolio } from "@/hooks/queries/investor";
import { useInvestorFinanceVerification } from "@/hooks/queries/investor-finance";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompanyPortfolioHolding, Investment } from "@/types/investor/dashboard";

export default function InvestorDashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useInvestorStats();
  const { data: portfolio, isLoading: portfolioLoading, isError: portfolioError } = useInvestorPortfolio();
  const { data: financeVer } = useInvestorFinanceVerification();

  const [activeTab, setActiveTab] = useState<"companies" | "ideas">("companies");

  const loading = statsLoading || portfolioLoading;
  const isError = statsError || portfolioError;

  if (loading) {
    return <LoadingState message="Loading your portfolio..." />;
  }

  if (isError) {
    return <ErrorState title="Portfolio Error" message="Failed to load investor dashboard data." />;
  }

  const isFinanceVerified = financeVer?.financeVerified || financeVer?.status === 'verified';
  const isFinanceUnderReview = financeVer?.status === 'under_review' || financeVer?.status === 'submitted';
  const isFinanceNeedsUpdate = financeVer?.status === 'needs_update';

  const companyHoldings: CompanyPortfolioHolding[] = portfolio?.companyHoldings || stats?.companyHoldings || [];
  const ideaInvestments: Investment[] = portfolio?.ideaInvestments || stats?.investments || [];

  const totalInvested = portfolio?.totalInvested ?? stats?.totalInvested ?? 0;
  const distinctCompaniesCount = portfolio?.distinctCompaniesCount ?? stats?.companiesInvested ?? companyHoldings.length;
  const activeHoldingsCount = companyHoldings.filter(h => h.status === 'active').length + ideaInvestments.filter(i => i.status === 'active').length;

  const instrumentBreakdown = stats?.instrumentBreakdown || {
    equity: companyHoldings.filter(h => h.instrumentType === 'equity').length,
    safe: companyHoldings.filter(h => h.instrumentType === 'safe').length,
    convertible_note: companyHoldings.filter(h => h.instrumentType === 'convertible_note').length,
    debt: companyHoldings.filter(h => h.instrumentType === 'debt').length,
  };

  const getInstrumentBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equity':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs">Equity</Badge>;
      case 'safe':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs">SAFE</Badge>;
      case 'convertible_note':
      case 'convertible':
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs">Convertible Note</Badge>;
      case 'debt':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">Debt</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize text-xs">{type.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">Investor Portfolio</h1>
        <p className="text-sm font-normal text-muted-foreground">
          Track and manage your verified company holdings and deal provenance.
        </p>
      </div>

      {/* Finance Verification Banner */}
      <div className="rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all bg-card">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl ${
              isFinanceVerified
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : isFinanceUnderReview
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                : isFinanceNeedsUpdate
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isFinanceVerified ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isFinanceUnderReview ? (
              <Clock className="w-6 h-6" />
            ) : isFinanceNeedsUpdate ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Phase 2: Finance Verification
              </span>
              {isFinanceVerified && (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]">
                  Verified
                </Badge>
              )}
              {isFinanceUnderReview && (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[11px]">
                  Under Review
                </Badge>
              )}
              {isFinanceNeedsUpdate && (
                <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[11px]">
                  Action Needed
                </Badge>
              )}
              {!isFinanceVerified && !isFinanceUnderReview && !isFinanceNeedsUpdate && (
                <Badge variant="outline" className="text-slate-500 text-[11px]">
                  Not Started
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              {isFinanceVerified
                ? 'Your investment capacity has been verified. You can submit binding term sheets to founders.'
                : isFinanceUnderReview
                ? 'Your verification documents are being reviewed by the Mondial Compliance Team.'
                : isFinanceNeedsUpdate
                ? 'Please update your verification documents to complete your finance review.'
                : 'Verify your investment capacity and source of funds to unlock binding offer submissions.'}
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant={isFinanceVerified ? 'outline' : 'default'} className="shrink-0">
          <Link href="/dashboard/investor/phase-2">
            {isFinanceVerified
              ? 'View Verification'
              : isFinanceUnderReview
              ? 'Check Status'
              : isFinanceNeedsUpdate
              ? 'Update Documents'
              : 'Start Verification'}
          </Link>
        </Button>
      </div>

      {/* Recommended Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
          <CardDescription>
            Accelerate your deal flow by reviewing qualified companies and active term sheet negotiations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/investor/pipeline">
              Review Deal Pipeline
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard/investor/discovery">Discover Companies</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Real Portfolio Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="text-muted-foreground text-sm font-medium">Total Capital Deployed</div>
            </div>
            <div className="text-foreground text-[28px] font-bold">
              ${totalInvested.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-muted-foreground text-sm font-medium">Companies Invested</div>
            </div>
            <div className="text-foreground text-[28px] font-bold">
              {distinctCompaniesCount.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="text-muted-foreground text-sm font-medium">Active Holdings</div>
            </div>
            <div className="text-foreground text-[28px] font-bold">
              {activeHoldingsCount.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div className="text-muted-foreground text-sm font-medium">Instrument Types</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                Equity: <strong>{instrumentBreakdown.equity}</strong>
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                SAFE: <strong>{instrumentBreakdown.safe}</strong>
              </span>
              {(instrumentBreakdown.convertible_note > 0 || instrumentBreakdown.debt > 0) && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  Note/Debt: <strong>{instrumentBreakdown.convertible_note + instrumentBreakdown.debt}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Section with Tab Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "companies" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("companies")}
              className="gap-2"
            >
              <Building2 className="w-4 h-4" />
              Company Holdings ({companyHoldings.length})
            </Button>
            {ideaInvestments.length > 0 && (
              <Button
                variant={activeTab === "ideas" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("ideas")}
                className="gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Idea Investments ({ideaInvestments.length})
              </Button>
            )}
          </div>
        </div>

        {activeTab === "companies" && (
          <div>
            {companyHoldings.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No company holdings yet"
                message="When you sign term sheets and close deals with companies in your pipeline, your holdings will automatically appear here."
              />
            ) : (
              <div className="space-y-4" data-testid="company-holdings-list">
                {companyHoldings.map((holding) => {
                  const isEquity = holding.instrumentType === 'equity';
                  const isSafe = holding.instrumentType === 'safe';
                  const isNote = holding.instrumentType === 'convertible_note';
                  const isDebt = holding.instrumentType === 'debt';

                  const holdingKey = holding.holdingId || holding.id || holding.companyId;

                  return (
                    <Card key={holdingKey} className="overflow-hidden hover:border-primary/40 transition-all duration-200" data-testid={`holding-card-${holdingKey}`}>
                      <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 min-w-[240px]">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-bold text-foreground">
                              {holding.companyName}
                            </h3>
                            {getInstrumentBadge(holding.instrumentType)}
                            <Badge variant="outline" className="text-xs text-muted-foreground capitalize">
                              {holding.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {holding.industry && (
                              <span>Industry: <strong className="text-foreground">{holding.industry}</strong></span>
                            )}
                            <span>
                              Closed: {holding.investmentDate ? new Date(holding.investmentDate).toLocaleDateString() : 'N/A'}
                            </span>
                            {holding.dealExecutionId && (
                              <span className="font-mono text-[11px]">
                                Deal #{holding.dealExecutionId.substring(0, 8)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial and Terms Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left md:text-right w-full md:w-auto">
                          <div>
                            <div className="text-xs text-muted-foreground">Investment Amount</div>
                            <div className="text-sm font-bold text-foreground">
                              ${holding.investmentAmount.toLocaleString()} {holding.currency}
                            </div>
                          </div>

                          {isEquity && (
                            <div>
                              <div className="text-xs text-muted-foreground">Confirmed Equity</div>
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {holding.equityPercentage != null ? `${holding.equityPercentage}%` : 'N/A'}
                              </div>
                            </div>
                          )}

                          {isEquity && holding.entryValuation != null && (
                            <div>
                              <div className="text-xs text-muted-foreground">Entry Valuation</div>
                              <div className="text-sm font-medium text-foreground">
                                ${holding.entryValuation.toLocaleString()}
                              </div>
                            </div>
                          )}

                          {isSafe && (
                            <div>
                              <div className="text-xs text-muted-foreground">Valuation Cap</div>
                              <div className="text-sm font-medium text-foreground">
                                {holding.valuationCap != null ? `$${holding.valuationCap.toLocaleString()}` : 'Uncapped'}
                              </div>
                            </div>
                          )}

                          {isSafe && holding.discountRate != null && (
                            <div>
                              <div className="text-xs text-muted-foreground">Discount Rate</div>
                              <div className="text-sm font-medium text-foreground">
                                {holding.discountRate}%
                              </div>
                            </div>
                          )}

                          {(isNote || isDebt) && holding.interestRate != null && (
                            <div>
                              <div className="text-xs text-muted-foreground">Interest Rate</div>
                              <div className="text-sm font-medium text-foreground">
                                {holding.interestRate}% p.a.
                              </div>
                            </div>
                          )}

                          {(isNote || isDebt) && holding.maturityDate && (
                            <div>
                              <div className="text-xs text-muted-foreground">Maturity Date</div>
                              <div className="text-sm font-medium text-foreground">
                                {new Date(holding.maturityDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t md:border-t-0 md:pt-0 w-full md:w-auto justify-end shrink-0">
                          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                            <Link href={`/dashboard/investor/discovery/${holding.companyId}`}>
                              View Company
                            </Link>
                          </Button>
                          {holding.dealExecutionId && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
                              <Link href={`/dashboard/investor/deals?d=${holding.dealExecutionId}`}>
                                View Deal
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "ideas" && (
          <div>
            {ideaInvestments.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="No idea investments"
                message="Investments made into creator ideas will be listed here."
              />
            ) : (
              <div className="space-y-4" data-testid="idea-investments-list">
                {ideaInvestments.map((inv) => (
                  <Card key={inv.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="text-foreground font-semibold">{inv.ideaName}</div>
                      <div className="text-muted-foreground text-sm">by {inv.creatorName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground font-semibold">${inv.investedAmount.toLocaleString()}</div>
                      <div className="text-muted-foreground text-sm">{inv.equityOwned}% equity</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
