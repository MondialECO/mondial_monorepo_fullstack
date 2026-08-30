'use client';

import Link from "next/link";
import { Download, MessageSquare, PencilRuler, Info, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvestorFinanceVerification } from "@/hooks/queries/investor-finance";

export default function ReadOnlyActionsRow({ companyId }: { companyId: string }) {
  const { data: financeVer } = useInvestorFinanceVerification();
  const isFinanceVerified = financeVer?.financeVerified || financeVer?.status === 'verified';

  return (
    <Card className="border-border rounded-2xl">
      <CardContent className="space-y-3 p-5">
        {!isFinanceVerified && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Finance Verification Required:</span> You must complete Phase 2 Finance Verification before issuing binding investment offers.{' '}
              <Link href="/dashboard/investor/phase-2" className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200">
                Verify Now
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/dashboard/investor/discovery/${companyId}/term-sheet/build`}>
              <PencilRuler className="h-4 w-4" aria-hidden />
              Build &amp; Send Term Sheet
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled aria-disabled>
            <Download className="h-4 w-4" aria-hidden />
            Download Term Sheet
          </Button>
          <Button variant="outline" size="sm" disabled aria-disabled>
            <MessageSquare className="h-4 w-4" aria-hidden />
            Message Founder
          </Button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" aria-hidden />
          Compose a multi-step term sheet and send it as an offer. Download &amp; in-app
          messaging arrive in a later release.
        </p>
      </CardContent>
    </Card>
  );
}
