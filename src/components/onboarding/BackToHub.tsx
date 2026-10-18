"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

/** Small back link used at the top of every /onboarding/* sub-page. */
export default function BackToHub() {
  const { t } = useTranslation();
  return (
    <Link
      href="/onboarding"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
    >
      <ChevronLeft className="w-4 h-4" />
      {t('onboarding.backToHub.label', 'Back to verification')}
    </Link>
  );
}
