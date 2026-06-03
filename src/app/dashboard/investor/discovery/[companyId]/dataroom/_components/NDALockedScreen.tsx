"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NDAAcceptModal from "@/components/investor/NDAAcceptModal";

interface NDALockedScreenProps {
  companyId: string;
  companyName: string;
}

const UNLOCKS = [
  "Full data-room document index (pitch deck, financial model, cap table, legal)",
  "Session analytics — every view and download logged for audit",
  "Live diligence-progress tracking",
];

export default function NDALockedScreen({ companyId, companyName }: NDALockedScreenProps) {
  const [ndaOpen, setNdaOpen] = useState(false);

  return (
    <>
      <Card className="border-dashed border-border bg-card rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            The Data Room is NDA-Protected
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Sign the demo NDA for {companyName} to unlock all sensitive deal materials.
          </p>

          <ul className="mt-6 w-full max-w-md space-y-2 text-left">
            {UNLOCKS.map((u) => (
              <li
                key={u}
                className="flex items-start gap-2 text-xs text-foreground"
              >
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span>{u}</span>
              </li>
            ))}
          </ul>

          <Button className="mt-6" onClick={() => setNdaOpen(true)}>
            Sign NDA &amp; Get Access
          </Button>
        </CardContent>
      </Card>

      <NDAAcceptModal
        companyId={companyId}
        companyName={companyName}
        open={ndaOpen}
        onOpenChange={setNdaOpen}
      />
    </>
  );
}
