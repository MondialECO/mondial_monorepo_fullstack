"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoCreationModal } from "@/components/creator/brand-kit/LogoCreationModal";

export default function AILogoToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId") || undefined;

  const handleConfirm = () => {
    router.push("/dashboard/creator/phase-2/complete");
  };

  const handleBack = () => {
    router.push("/dashboard/creator/phase-2/branding");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen p-4 sm:p-6 md:p-8">
      <LogoCreationModal
        ideaId={ideaId}
        onConfirm={handleConfirm}
        onBack={handleBack}
      />
    </div>
  );
}
