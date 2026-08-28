'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import marketplaceProjectsApi, { PartnershipSummary } from '@/lib/api-marketplace-projects';
import {
  Sparkles,
  Award,
  Building2,
  Users,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MyPartnershipsPage() {
  const [partnerships, setPartnerships] = useState<PartnershipSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartnerships = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceProjectsApi.getMyPartnerships();
      setPartnerships(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load partnerships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-foreground font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Active Ventures
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-heading">
            My Partnerships &amp; Equity
          </h1>
          <p className="text-muted-foreground text-sm">
            Overview of your co-founded ventures, company ownership stakes, and partner collaborations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPartnerships}
          disabled={loading}
          className="gap-2 text-xs border-border bg-background hover:bg-muted self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && partnerships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-muted-foreground">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs font-medium">Loading partnerships...</p>
        </div>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 border-destructive/30 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartnerships}
            className="text-xs"
          >
            Try Again
          </Button>
        </Card>
      ) : partnerships.length === 0 ? (
        <Card className="p-12 border-dashed border-border bg-card rounded-3xl text-center space-y-4">
          <Award className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-lg font-bold text-foreground font-heading">No Active Partnerships Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            When you finalize co-founder terms and activate a venture via Path A, your equity holdings and venture workspaces will appear here.
          </p>
          <Button asChild size="sm" className="gap-2 text-xs font-semibold">
            <Link href="/dashboard/creator">
              Go to Creator Dashboard
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {partnerships.map((p) => (
            <Link
              key={p.dealId}
              href={`/dashboard/creator/partnerships/${p.dealId}`}
              className="block"
            >
              <Card className="group p-6 border-border hover:border-primary/50 rounded-2xl transition duration-200 shadow-sm relative overflow-hidden bg-card hover:bg-muted/20 cursor-pointer">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[11px] font-bold">
                      {p.outcomeBadge}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">
                      {p.dealStage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition transform group-hover:translate-x-1" />
                </div>

                <div className="pt-4 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition font-heading">
                      {p.projectName}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {p.companyName || 'Operating Entity'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-background border border-border rounded-xl space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        Your Equity
                      </span>
                      <p className="text-lg font-black text-primary font-mono">
                        {p.creatorEquityPercent}%
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {p.creatorShares.toLocaleString()} shares
                      </span>
                    </div>

                    <div className="p-3 bg-background border border-border rounded-xl space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        Partner
                      </span>
                      <p className="text-sm font-bold text-foreground truncate">
                        {p.entrepreneurName}
                      </p>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {p.entrepreneurRole}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                    <span>Role: <strong className="text-foreground">{p.creatorRole}</strong></span>
                    <span className="text-primary font-semibold text-xs flex items-center gap-1">
                      Open Workspace <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
