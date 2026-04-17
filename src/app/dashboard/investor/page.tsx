"use client";

import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Percent
} from "lucide-react";
import { useInvestorStats } from "@/hooks/queries/investor";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";

export default function InvestorDashboard() {
  const { data, isLoading: loading, isError } = useInvestorStats();

  if (loading) {
    return <LoadingState message="Loading your portfolio..." />;
  }

  if (isError || !data) {
    return <ErrorState title="Portfolio Error" message="Failed to load investor dashboard data." />;
  }

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Welcome Back 👋
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          View your investment portfolio
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invested */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Total Invested</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">${data.totalInvested.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-[#10B981]/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-[#10B981]" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Portfolio Value</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">${data.portfolioValue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Number of Investments */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-[#9333EA]/10 rounded-lg">
                  <Briefcase className="h-5 w-5 text-[#9333EA]" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Investments</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">{data.numberOfInvestments.toString().padStart(2, '0')}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-muted-foreground text-xs font-medium">Active: {data.activeInvestments}</div>
          </div>
        </div>

        {/* Average ROI */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                  <Percent className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Average ROI</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">{data.averageROI.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Content */}
      {data.investments.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No investments yet"
          message="Start exploring investment opportunities to build your portfolio."
        />
      ) : (
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6">Your Investments</h2>
          <div className="space-y-4">
            {data.investments.map((investment) => (
              <div
                key={investment.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-all duration-200 flex justify-between items-center"
              >
                <div>
                  <div className="text-foreground font-semibold">{investment.ideaName}</div>
                  <div className="text-muted-foreground text-sm">by {investment.creatorName}</div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-semibold">${investment.investedAmount.toLocaleString()}</div>
                  <div className="text-muted-foreground text-sm">{investment.equityOwned}% equity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
