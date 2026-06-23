import Link from "next/link";
import { Download, MessageSquare, PencilRuler, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReadOnlyActionsRow({ companyId }: { companyId: string }) {
  return (
    <Card className="border-border rounded-2xl">
      <CardContent className="space-y-3 p-5">
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
