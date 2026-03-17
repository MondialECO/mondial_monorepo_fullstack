"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import {
  CheckCircle2,
  TrendingUp,
  Users,
  Lightbulb,
  DollarSign,
  Loader2
} from "lucide-react"
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/service/creator/dashboard";

type Idea = {
  id: string;
  name: string;
  status: string;
  stageLabel: string | null;
  isPublished: boolean;
  createdAt: string;
  fundingRequired: number;
  equityOffered: number;
  totalRaised: number;
  fundingProgress: number;
  investors: any[];
}

type DashboardStats = {
  totalIdeas: number;
  totalClicksLast14Days: number;
  totalFundRaised: number;
  totalRequired: number;
  totalEquity: number;
  activeInvestors: number;
  ideas: Idea[];
}

type Investor = {
  name: string
  ideaName: string
  invested: string
  avatarUrl?: string
  equity: string
}

const topInvestors: Investor[] = [
  { name: "Sarah Ahmed", ideaName: "Cripto data momitoring", invested: "$45,000", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", equity: "10%" },
  { name: "Rahim Khan", ideaName: "food delivery app", invested: "$32,500", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", equity: "15%" },
  { name: "Nadia Chowdhury", ideaName: "AI chatbot", invested: "$28,000", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80", equity: "20%" },
  { name: "Alex Chen", ideaName: "Fintech Dashboard", invested: "$25,000", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", equity: "25%" },
  { name: "Maria Garcia", ideaName: "Eco Marketplace", invested: "$22,000", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80", equity: "30%" },
]

export default function CreatorDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats();
        setData(stats);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-12 text-red-500">
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium font-['Inter'] leading-7 text-foreground">
            Hello Back, Jona 👋
          </h1>
          <p className="text-sm font-normal text-muted-foreground leading-5">
            Explore your project ideas here
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] flex items-center justify-center gap-[5px]"
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
      <div className="w-full p-3 bg-muted rounded-2xl shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border flex flex-col sm:flex-row items-center gap-3">
        {/* Project Ideas */}
        <div className="flex-1 self-stretch bg-card rounded-xl outline outline-1 outline-offset-[-1px] outline-border/10 flex flex-col justify-start items-start overflow-hidden">
          <div className="self-stretch flex-1 p-3 flex flex-col justify-start items-start gap-4">
            <div className="inline-flex justify-start items-center gap-2">
              <div className="p-1.5 bg-fuchsia-600/10 rounded-lg">
                <Lightbulb className="h-4 w-4 text-fuchsia-600" />
              </div>
              <div className="text-muted-foreground text-base font-normal leading-6 text-nowrap">Project Ideas</div>
            </div>
            <div className="text-foreground text-3xl font-medium leading-8">{data.totalIdeas.toString().padStart(2, '0')}</div>
          </div>
          <div className="self-stretch px-3 py-2.5 inline-flex justify-between items-center border-t border-border/10">
            <div className="text-muted-foreground text-sm font-semibold leading-5">+{data.totalClicksLast14Days} views today</div>
            <div className="flex items-center gap-1 text-lime-600">
              <TrendingUp className="h-4 w-4" />
              <div className="text-xs font-normal leading-5">4.1%</div>
            </div>
          </div>
        </div>

        {/* Funds Raised */}
        <div className="flex-1 self-stretch bg-card rounded-xl outline outline-1 outline-offset-[-1px] outline-border/10 flex flex-col justify-start items-start overflow-hidden">
          <div className="self-stretch flex-1 p-3 flex flex-col justify-start items-start gap-4">
            <div className="inline-flex justify-start items-center gap-2">
              <div className="p-1.5 bg-emerald-600/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-muted-foreground text-base font-normal leading-6 text-nowrap">Funds Raised</div>
            </div>
            <div className="text-foreground text-3xl font-medium leading-8">${data.totalFundRaised.toLocaleString()}</div>
          </div>
          <div className="self-stretch px-3 py-2.5 flex items-center border-t border-border/10">
            <div className="text-muted-foreground text-sm font-normal leading-5">Total Required ${data.totalRequired.toLocaleString()}</div>
          </div>
        </div>

        {/* Total Equity */}
        <div className="flex-1 self-stretch bg-card rounded-xl outline outline-1 outline-offset-[-1px] outline-border/10 flex flex-col justify-start items-start overflow-hidden">
          <div className="self-stretch flex-1 p-3 flex flex-col justify-start items-start gap-4">
            <div className="inline-flex justify-start items-center gap-2">
              <div className="p-1.5 bg-violet-600/10 rounded-lg">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div className="text-muted-foreground text-base font-normal leading-6 text-nowrap">Total Equity</div>
            </div>
            <div className="text-foreground text-3xl font-medium leading-8">{data.totalEquity}%</div>
          </div>
          <div className="self-stretch px-3 py-2.5 flex items-center border-t border-border/10">
            <div className="text-muted-foreground text-sm font-normal leading-5">Total Investors: {data.activeInvestors.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Funding Overview */}
        <div className="flex-1 w-full p-5 bg-muted rounded-2xl shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border flex flex-col justify-center items-start gap-5">
          <div className="self-stretch inline-flex justify-center items-center gap-5">
            <div className="flex-1 text-foreground text-xl font-normal font-['Inter'] leading-6">Funding Overview</div>
            <Button asChild variant="outline" size="sm" className="px-3 py-1.5 rounded-lg outline outline-1 outline-offset-[-1px] text-sm font-medium hover:bg-muted transition-colors">
              <Link href="/dashboard/creator/myideas">
                See All
              </Link>
            </Button>
          </div>

          <div className="self-stretch flex flex-col gap-4">
            {data.ideas.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/30">
                No project ideas found.
              </div>
            ) : (
              data.ideas.map((project) => (
                <div key={project.id} className="self-stretch p-4 bg-card rounded-xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-offset-[-1px] outline-border/10 flex flex-col gap-6">
                  {/* Status Badges */}
                  <div className="self-stretch inline-flex justify-start items-center gap-1.5 flex-wrap">
                    <div className="pl-2 pr-3 py-1 bg-muted rounded-full outline outline-1 outline-offset-[-1px] outline-border/20 flex justify-center items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <div className="text-foreground text-xs font-normal leading-5">{project.status === 'APPROVED' ? 'Approved' : 'Pending'}</div>
                    </div>
                    {project.stageLabel && (
                      <div className="px-3 py-1 bg-amber-500/10 rounded-full outline outline-1 outline-offset-[-1px] outline-amber-500/20 flex justify-center items-center">
                        <div className="text-amber-700 text-xs font-medium leading-5">Type: {project.stageLabel}</div>
                      </div>
                    )}
                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full outline outline-1 outline-offset-[-1px] outline-emerald-500/20 flex justify-center items-center">
                      <div className="text-emerald-700 text-xs font-medium leading-5">Online</div>
                    </div>
                  </div>

                  {/* Info Header */}
                  <div className="self-stretch inline-flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-muted-foreground text-base font-semibold  leading-6 truncate">{project.name}</div>
                      <div className="text-slate-400 text-xs font-normal leading-5">
                        {project.createdAt !== '0001-01-01T00:00:00Z'
                          ? format(new Date(project.createdAt), 'dd MMMM, yyyy')
                          : 'Just now'}
                      </div>
                    </div>
                    <div className="flex -space-x-1.5 shrink-0">
                      {project.investors && project.investors.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-slate-200 shadow-sm" />
                      ))}
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="self-stretch flex flex-col gap-1.5">
                    <div className="text-foreground text-xs font-normal leading-5">{project.fundingProgress}% funded</div>
                    <div className="self-stretch h-1 bg-gray-300 rounded-full overflow-hidden relative border border-border/5">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 "
                        style={{ width: `${project.fundingProgress}%` }}
                      />
                    </div>
                    <div className="self-stretch inline-flex justify-between items-center gap-1.5">
                      <div className="text-muted-foreground text-xs font-normal leading-5">${project.totalRaised.toLocaleString()} raised of ${project.fundingRequired.toLocaleString()}</div>
                      <div className="text-foreground text-xs font-normal leading-5 text-nowrap">{project.equityOffered}% equity offered</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Investors */}
        <div className="self-stretch p-5 bg-muted rounded-2xl shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border inline-flex flex-col justify-start items-center gap-4 overflow-hidden flex-1">
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="justify-start text-foreground text-xl font-normal font-['Inter'] leading-6">Top Investors</div>
            <Button asChild variant="outline" size="sm" className="px-3 py-1.5 rounded-lg outline outline-1 outline-offset-[-1px] text-sm font-medium hover:bg-muted transition-colors">
              <Link href="/dashboard/creator/investors">See All</Link>
            </Button>
          </div>
          <div className="self-stretch flex-1 rounded-2xl shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] flex flex-col justify-start items-start gap-4 overflow-hidden">
            {topInvestors.map((investor) => (
              <div
                key={investor.ideaName}
                className="w-full p-3 bg-muted rounded-xl outline outline-1 outline-offset-[-1px] outline-border/10 flex items-center justify-between hover:bg-muted/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={investor.avatarUrl} />
                    <AvatarFallback className="bg-slate-100 text-xs">
                      {investor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-foreground text-sm font-medium truncate group-hover:text-blue-600 transition-colors">{investor.name}</div>
                    <div className="text-muted-foreground text-xs truncate">{investor.ideaName}</div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="bg-slate-100 text-xs font-semibold text-sm">
                    {investor.invested}
                  </div>
                  <div className="text-muted-foreground text-xs truncate">{investor.equity} equity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}