"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Phase2Footer from "@/components/layout/Phase2Footer";

export default function Phase2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBrandStudio = pathname?.includes("/brand-studio");

  if (isBrandStudio) {
    return (
      <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Content (provided by page and sub-routes) */}
      <div className="flex-1">
        {children}
      </div>

      {/* Phase 2 Footer */}
      <Phase2Footer />
    </div>
  );
}
