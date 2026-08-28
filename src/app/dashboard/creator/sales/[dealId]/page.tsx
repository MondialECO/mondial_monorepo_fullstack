"use client";

import React from "react";
import { useParams } from "next/navigation";
import { FullBuyoutDealWorkspace } from "@/components/marketplace/FullBuyoutDealWorkspace";

export default function CreatorSaleDetailPage() {
  const params = useParams();
  const dealId = params?.dealId as string;

  return (
    <FullBuyoutDealWorkspace
      dealId={dealId}
      isCreator={true}
      backUrl="/dashboard/creator/sales"
      backLabel="Back to My Sales"
    />
  );
}

