"use client"

import { useState, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Check, Clock, X } from "lucide-react"

interface StatusProps {
  icon: ReactNode
  label: string
  classes: string
}

interface IdeaCardProps {
  idea: {
    id: number | string
    title: string
    status: "approved" | "pending" | "rejected"
    statusBadges: Array<{ label: string; color?: string; icon?: boolean }>
    views: number
    fundRaised: string | null
    fundGoal: string | null
    investors: number
    equity: string
    createdDate: string
    marketSize: string
    offeredEquity: string
    pauseInfo: boolean
  }
}

const STATUS_MAP: Record<string, StatusProps> = {
  approved: {
    icon: <Check size={16} className="text-green-600" />,
    label: "Approved",
    classes:
      "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  pending: {
    icon: <Clock size={16} className="text-amber-600" />,
    label: "Pending",
    classes:
      "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  rejected: {
    icon: <X size={16} className="text-red-600" />,
    label: "Rejected",
    classes:
      "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
}

const BADGE_COLOR_MAP: Record<string, string> = {
  amber:
    "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
  teal:
    "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800",
  default:
    "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600",
}

import { pauseIdeaApi } from "../../../service/creator/dashboard"

export default function IdeaCard({ idea }: IdeaCardProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const status = STATUS_MAP[idea.status]

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex text-xs sm:text-sm text-slate-600 dark:text-slate-400">
      <span className="min-w-[130px] font-medium">{label}</span>
      <span>{value}</span>
    </div>
  )

  const handleTogglePause = async () => {
    if (idea.status !== "approved") return; // Keep pause info visible only for approved if logic implies so. If not, ignore this. But we can assume API works for it.

    try {
      setIsPausing(true);
      await pauseIdeaApi(idea.id.toString());
      setIsPaused(!isPaused);
    } catch (error) {
      console.error("Failed to pause idea:", error);
    } finally {
      setIsPausing(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold leading-snug">
          {idea.title}
        </h3>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <button
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium border min-w-max ${status.classes}`}
          >
            {status.icon}
            {status.label}
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted min-w-max">
            <Eye size={14} />
            View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        {/* Left */}
        <div className="space-y-3">
          <div className="flex items-start gap-1 text-xs sm:text-sm text-muted-foreground">
            <span className="min-w-[100px] sm:min-w-[130px] font-medium">Status:</span>
            <div className="flex flex-wrap gap-1">
              {idea.statusBadges.map((badge, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={`text-[10px] sm:text-xs py-0.5 px-2 ${BADGE_COLOR_MAP[badge.color || "default"]}`}
                >
                  {badge.icon && "✓"} {badge.label}
                </Badge>
              ))}
            </div>
          </div>

          <InfoRow label="Created:" value={idea.createdDate} />
          <InfoRow label="Market Size:" value={idea.marketSize} />
          <InfoRow label="Offered Equity:" value={idea.offeredEquity} />
        </div>

        {/* Right */}
        <div className="space-y-3">
          <InfoRow label="Views:" value={idea.views} />

          {idea.fundRaised && (
            <InfoRow
              label="Fund Raised:"
              value={<span><span className="text-foreground font-semibold">{idea.fundRaised}</span> raised of {idea.fundGoal}</span>}
            />
          )}

          <InfoRow label="Equity:" value={idea.equity} />

          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <span className="min-w-[100px] sm:min-w-[130px] font-medium">Investors:</span>
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(idea.investors, 5) }).map((_, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="bg-muted text-[10px]">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {idea.investors > 5 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                  +{idea.investors - 5}
                </div>
              )}
              {idea.investors === 0 && <span className="text-muted-foreground opacity-50 italic">None yet</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Pause */}
      {idea.pauseInfo && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">
              Pause Idea
            </h4>
            <p className="text-xs text-muted-foreground">
              Already funded or building? Pause new intros, stay visible.
              <span className="font-semibold text-foreground"> Resume</span> anytime.
            </p>
          </div>

          <button
            onClick={handleTogglePause}
            disabled={isPausing}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isPaused ? "bg-blue-600" : "bg-gray-600"
              } ${isPausing ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isPausing ? "Processing..." : "Toggle pause state"}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-background transform transition-transform ${isPaused ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>
      )}
    </div>
  )
}
