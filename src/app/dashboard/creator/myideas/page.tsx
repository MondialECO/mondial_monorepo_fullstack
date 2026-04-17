"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import IdeaCard from "@/components/founder/idea-card"
import Link from "next/link";
import { useMyIdeas } from "@/hooks/queries/creator";
import { format } from "date-fns";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";

export default function MyIdeasPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const { data: ideas, isLoading, isError } = useMyIdeas();

  const mappedIdeas = ideas?.map((apiIdea, index) => {
    let cardStatus: "approved" | "pending" | "rejected" = "pending";
    const apiStatus = apiIdea.status ? apiIdea.status.toUpperCase() : "DRAFT";
    if (apiStatus === "APPROVED") cardStatus = "approved";
    if (apiStatus === "REJECTED") cardStatus = "rejected";
    if (apiStatus === "DRAFT") cardStatus = "pending";

    const statusBadges = [];
    if (apiIdea.stageLabel) {
      statusBadges.push({ label: `Stage: ${apiIdea.stageLabel}`, color: "amber" });
    }
    statusBadges.push({
      label: apiIdea.isPublished ? "Published" : "Draft",
      color: apiIdea.isPublished ? "teal" : "default"
    });

    let createdDate = "Just now";
    const dateStr = apiIdea.creatdate || apiIdea.createdAt;
    if (dateStr && dateStr !== "0001-01-01T00:00:00Z") {
      try {
        createdDate = format(new Date(dateStr), 'MMM dd, yyyy');
      } catch (e) {
        createdDate = "Just now";
      }
    }

    let marketSizeText = apiIdea.marketSize || "";
    if (typeof document !== 'undefined') {
      const temp = document.createElement("div");
      temp.innerHTML = marketSizeText;
      marketSizeText = temp.textContent || temp.innerText || "";
    } else {
      marketSizeText = marketSizeText.replace(/<[^>]*>?/gm, '');
    }

    return {
      id: apiIdea.id || index,
      title: apiIdea.name || "Untitled Idea",
      status: cardStatus,
      statusBadges: statusBadges,
      views: apiIdea.views || 0,
      fundRaised: typeof apiIdea.totalRaised === 'number' ? `$${apiIdea.totalRaised.toLocaleString()}` : null,
      fundGoal: typeof apiIdea.fundingRequired === 'number' ? `$${apiIdea.fundingRequired.toLocaleString()}` : null,
      investors: apiIdea.investors ? apiIdea.investors.length : 0,
      equity: typeof apiIdea.equity === 'number' ? `${apiIdea.equity}%` : '0%',
      createdDate: createdDate,
      marketSize: marketSizeText,
      offeredEquity: typeof apiIdea.equityOffered === 'number' ? `${apiIdea.equityOffered}%` : '0%',
      pauseInfo: cardStatus === "approved",
    };
  }) ?? [];

  const filteredIdeas = mappedIdeas.filter(idea => {
    if (activeTab === "overview") return true;
    if (activeTab === "pause") return idea.pauseInfo === true;
    return idea.status === activeTab;
  });

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="max-w-[1136px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold font-['inter_tight'] leading-tight sm:leading-8 text-foreground mb-6 sm:mb-8">
            My ideas
          </h1>

          {/* Tabs + Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex w-full md:w-auto overflow-x-auto scrollbar-hide p-1">
              <div className="py-1 rounded-full outline outline-2 outline-offset-[-2px] outline-border inline-flex items-center gap-1 p-1 min-w-max">
                {[
                  { id: "overview", label: "Overview", count: mappedIdeas.length },
                  { id: "approved", label: "Approved", count: mappedIdeas.filter(i => i.status === "approved").length },
                  { id: "pending", label: "Pending", count: mappedIdeas.filter(i => i.status === "pending").length },
                  { id: "pause", label: "Pause", count: mappedIdeas.filter(i => i.pauseInfo).length },
                  { id: "rejected", label: "Rejected", count: mappedIdeas.filter(i => i.status === "rejected").length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-full text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                      ? "bg-foreground text-background font-semibold"
                      : "bg-muted text-muted-foreground font-medium outline outline-1 outline-offset-[-0.5px] outline-border/10 hover:bg-muted/80"
                      }`}
                  >
                    {tab.label} ({tab.count.toString().padStart(2, '0')})
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <Button
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] flex items-center justify-center gap-[5px]"
              asChild
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
        </div>

        {/* Ideas List */}
        {isError ? (
          <ErrorState title="Error loading ideas" message="We had trouble loading your ideas. Please try again later." />
        ) : isLoading ? (
          <LoadingState message="Loading your ideas..." />
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 mx-auto max-w-2xl mt-8">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-xl text-slate-400">💡</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No ideas found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              You haven't created any ideas yet, or none match the selected filter.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              asChild
            >
              <Link href="/create-project">
                Start a New Idea
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea as any} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
