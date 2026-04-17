"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  CheckCircle2,
  TrendingUp,
  Users,
  Lightbulb,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/queries/creator";
import type { Investor } from "@/types/creator/dashboard";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";

const topInvestors: Investor[] = [
  { name: "Sarah Ahmed", ideaName: "Cripto data momitoring", invested: "$45,000", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", equity: "10%" },
  { name: "Rahim Khan", ideaName: "food delivery app", invested: "$32,500", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", equity: "15%" },
  { name: "Nadia Chowdhury", ideaName: "AI chatbot", invested: "$28,000", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80", equity: "20%" },
  { name: "Alex Chen", ideaName: "Fintech Dashboard", invested: "$25,000", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", equity: "25%" },
  { name: "Maria Garcia", ideaName: "Eco Marketplace", invested: "$22,000", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80", equity: "30%" },
];

export default function CreatorDashboard() {
  const { data, isLoading: loading, isError } = useDashboardStats();

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (isError || !data) {
    return <ErrorState title="Dashboard Error" message="Failed to load dashboard data." />;
  }

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">
            Hello Back, Jona 👋
          </h1>
          <p className="text-sm font-normal text-muted-foreground">
            Explore your project ideas here
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-lg px-5 py-2.5 shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Link href="/create-project">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3.33334V12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Create idea
          </Link>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project Ideas */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-[#9333EA]/10 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-[#9333EA]" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Project Ideas</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">{data.totalIdeas.toString().padStart(2, "0")}</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-muted-foreground text-xs font-medium">+{data.totalClicksLast14Days} views today</div>
            <div className="flex items-center gap-1 text-[#10B981]">
              <TrendingUp className="h-3 w-3" />
              <div className="text-xs font-semibold">4.1%</div>
            </div>
          </div>
        </div>

        {/* Funds Raised */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Funds Raised</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">${data.totalFundRaised.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-muted-foreground text-xs font-medium">Total Required ${data.totalRequired.toLocaleString()}</div>
          </div>
        </div>

        {/* Total Equity */}
        <div className="bg-card rounded-[16px] border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[160px] md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-muted-foreground text-sm font-medium">Total Equity</div>
              </div>
              <div className="text-foreground text-[28px] font-bold">{data.totalEquity}%</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-muted-foreground text-xs font-medium">Total Investors: {data.activeInvestors.toString().padStart(2, "0")}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Funding Overview */}
        <div className="flex-1 w-full bg-card rounded-[16px] border border-border shadow-sm p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Funding Overview</h2>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 font-semibold transition-colors">
              <Link href="/dashboard/creator/myideas">See All</Link>
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            {data.ideas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/30">
                No project ideas found.
              </div>
            ) : (
              data.ideas.map((project) => (
                <div key={project.id} className="p-5 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-6 hover:border-primary/20 transition-all duration-200">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.status === "APPROVED" ? (
                      <div className="px-3 py-1 bg-[#10B981]/10 text-[#34D399] rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-[#F59E0B]/10 text-[#FBBF24] rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#FBBF24]">
                          <path d="M8 4V8L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Pending
                      </div>
                    )}
                    {project.stageLabel && (
                      <div className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs font-semibold">
                        {project.stageLabel}
                      </div>
                    )}
                    <div className="px-3 py-1 bg-[#10B981]/10 text-[#34D399] rounded-full text-xs font-semibold flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                      Online
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-base font-bold truncate">{project.name}</div>
                      <div className="text-muted-foreground text-xs font-normal mt-0.5">
                        {project.createdAt !== "0001-01-01T00:00:00Z"
                          ? format(new Date(project.createdAt), "dd MMMM, yyyy")
                          : "Just now"}
                      </div>
                    </div>
                    <div className="flex -space-x-2 shrink-0">
                      {project.investors && project.investors.length > 0 ? (
                        project.investors.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-card bg-muted shadow-sm flex items-center justify-center overflow-hidden">
                            <span className="text-[10px] text-muted-foreground font-bold">In</span>
                          </div>
                        ))
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-card bg-muted shadow-sm flex items-center justify-center">
                          <Users className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="text-foreground text-xs font-bold">{project.fundingProgress}% funded</div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${project.fundingProgress}%` }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-muted-foreground text-xs font-medium">${project.totalRaised.toLocaleString()} raised of ${project.fundingRequired.toLocaleString()}</div>
                      <div className="text-foreground text-xs font-bold">{project.equityOffered}% equity offered</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Investors */}
        <div className="w-full lg:w-[350px] bg-card rounded-[16px] border border-border shadow-sm p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Top Investors</h2>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 font-semibold transition-colors">
              <Link href="/dashboard/creator/investors">See All</Link>
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            {topInvestors.map((investor) => (
              <div
                key={investor.ideaName}
                className="w-full p-4 bg-transparent rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={investor.avatarUrl} />
                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                      {investor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-foreground text-sm font-bold truncate group-hover:text-primary transition-colors">{investor.name}</div>
                    <div className="text-muted-foreground text-xs truncate mt-0.5">{investor.ideaName}</div>
                  </div>
                </div>
                <div className="pl-2 shrink-0 text-right">
                  <div className="text-foreground font-bold text-sm">
                    {investor.invested}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">{investor.equity} equity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}