"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  ExternalLink
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminErrorState,
} from "@/components/admin/shared";

interface VerificationSummary {
  pendingKycCount: number;
  pendingSpCount: number;
  pendingInvestorFinanceCount: number;
  verifiedKycCount: number;
  verifiedSpCount: number;
  verifiedInvestorFinanceCount: number;
  rejectedKycCount: number;
  rejectedSpCount: number;
  rejectedInvestorFinanceCount: number;
}

export default function AdminVerificationHubPage() {
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<VerificationSummary>("/admin/verifications/summary");
        if (res.data) {
          setSummary(res.data);
        }
      } catch (err: unknown) {
        console.error("Error loading verification summary:", err);
        setError("Failed to fetch verification metrics.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, []);

  const totalPending =
    (summary?.pendingKycCount ?? 0) +
    (summary?.pendingSpCount ?? 0) +
    (summary?.pendingInvestorFinanceCount ?? 0);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <AdminPageHeader
        icon={ShieldCheck}
        title="Verification Hub"
        description="Centralized operations for Identity KYC, Service Provider Verification, and Investor Finance credentials."
        badge={
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-2.5 py-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Total Pending Tasks:</span>
            <span className="font-bold text-foreground ml-1">{isLoading ? "..." : totalPending}</span>
          </Badge>
        }
      />

      {error && <AdminErrorState message={error} />}

      {/* 3 Operational Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. KYC Queue Card */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-xs">
                {summary?.pendingKycCount ?? 0} Pending
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Universal Identity / KYC</CardTitle>
            <CardDescription className="text-xs">
              Review government identity documents and face authentication to unlock platform onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified Accounts:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.verifiedKycCount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rejected Submissions:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.rejectedKycCount ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between" size="sm">
              <Link href="/dashboard/admin/verifications/kyc">
                Open KYC Queue <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 2. Service Provider Queue Card */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-xs">
                {summary?.pendingSpCount ?? 0} Pending
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Service Providers</CardTitle>
            <CardDescription className="text-xs">
              Evaluate provider skills, service listings, credentials, and trust scores for marketplace readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified Providers:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.verifiedSpCount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remediation / Rejected:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.rejectedSpCount ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between" size="sm">
              <Link href="/dashboard/admin/verifications/service-providers">
                Open Provider Queue <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 3. Investor Finance Queue Card */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-xs">
                {summary?.pendingInvestorFinanceCount ?? 0} Pending
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Investor Finance</CardTitle>
            <CardDescription className="text-xs">
              Verify proof of funds, declared capital capacities, and accreditation documents for deal access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Finance Verified:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary?.verifiedInvestorFinanceCount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Needs Update / Rejected:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {summary?.rejectedInvestorFinanceCount ?? 0}
                </span>
              </div>
            </div>

            <Button asChild className="w-full justify-between" size="sm">
              <Link href="/dashboard/admin/verifications/investors">
                Open Investor Queue <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unified User Context & Direct Navigation */}
      <Card className="border-border/60 bg-gradient-to-r from-card to-muted/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-syne">
                <Users className="w-4 h-4 text-primary" />
                Unified User Account Inspection
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Need to check a multi-role user participating across multiple verification tracks? Inspect their full profile, assigned roles, and suspension controls in one place.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs bg-background">
              <Link href="/dashboard/admin/users">
                Go to User Directory <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
