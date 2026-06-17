"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export default function InvestmentDashboard() {
  return (
    <div className="w-full max-w-[1136px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Investors
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track investor interest in the ideas you publish.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          No investor activity yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Investor interest will show up here once one of your ideas is promoted
          into a company and matched with investors. Publish an idea and continue
          as an entrepreneur to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/dashboard/creator/myideas">View my ideas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/create-project">Create a new idea</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
