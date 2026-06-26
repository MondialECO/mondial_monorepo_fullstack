"use client";

import { Lock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NDARequiredCardProps {
  onSign: () => void;
  className?: string;
}

const UNLOCKS = [
  "Full cap table & ownership structure",
  "Founder & team contact roster",
  "Complete data-room document index",
];

export default function NDARequiredCard({ onSign, className }: NDARequiredCardProps) {
  return (
    <Card className={cn("border-border bg-card rounded-2xl", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-base">NDA Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Sign the demo NDA to unlock sensitive deal materials.
        </p>
        <ul className="space-y-1.5">
          {UNLOCKS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onSign} className="w-full">
          Sign NDA &amp; Get Access
        </Button>
      </CardContent>
    </Card>
  );
}
